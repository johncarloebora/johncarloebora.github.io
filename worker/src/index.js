import { AutoRouter, cors, json, error, withParams } from 'itty-router';
import bcrypt from 'bcryptjs';

// ============================================================
// JWT Utilities (Web Crypto API — no external deps)
// ============================================================

function base64UrlEncode(buf) {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function getSigningKey(secret) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function signJwt(payload, secret, expiresInSec = 86400) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: now, exp: now + expiresInSec };

  const enc = new TextEncoder();
  const headerB64 = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(enc.encode(JSON.stringify(claims)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await getSigningKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));
  return `${signingInput}.${base64UrlEncode(sig)}`;
}

async function verifyJwt(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts;
  const enc = new TextEncoder();
  const key = await getSigningKey(secret);
  const signingInput = `${headerB64}.${payloadB64}`;
  const sig = base64UrlDecode(sigB64);

  const valid = await crypto.subtle.verify('HMAC', key, sig, enc.encode(signingInput));
  if (!valid) return null;

  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

// ============================================================
// Auth Middleware
// ============================================================

async function authMiddleware(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(401, 'Unauthorized');
  }
  const token = authHeader.slice(7);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return error(401, 'Invalid or expired token');
  // Viewer (read-only share token) can only make GET requests
  if (payload.role === 'viewer' && request.method !== 'GET') {
    return error(403, 'Read-only token — write access denied');
  }
  request.user = payload;
}

// ============================================================
// Rate Limiting Helper
// ============================================================

async function checkRateLimit(db, ip, maxAttempts = 5, windowMinutes = 15) {
  const cutoff = new Date(Date.now() - windowMinutes * 60000).toISOString();
  // Clean old attempts
  await db.prepare('DELETE FROM login_attempts WHERE attempted_at < ?').bind(cutoff).run();
  // Count recent
  const { results } = await db.prepare(
    'SELECT COUNT(*) as cnt FROM login_attempts WHERE ip_address = ? AND attempted_at >= ?'
  ).bind(ip, cutoff).all();
  return (results[0]?.cnt || 0) >= maxAttempts;
}

async function recordLoginAttempt(db, ip) {
  await db.prepare('INSERT INTO login_attempts (ip_address) VALUES (?)').bind(ip).run();
}

// ============================================================
// CORS Setup
// ============================================================

// Security headers applied to every response
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
};

function getCorsHeaders(env, requestOrigin) {
  const allowed = env?.ALLOWED_ORIGIN || '*';
  let allowOrigin;
  if (allowed === '*') {
    allowOrigin = '*';
  } else {
    const origins = allowed.split(',').map(s => s.trim());
    allowOrigin = origins.includes(requestOrigin) ? requestOrigin : origins[0];
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    ...(allowOrigin !== '*' && { 'Vary': 'Origin' }),
  };
}

function corsify(response, env, request) {
  const origin = request?.headers.get('Origin') || '';
  const corsHeaders = getCorsHeaders(env, origin);
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries({ ...corsHeaders, ...SECURITY_HEADERS })) {
    newHeaders.set(k, v);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
}

// ============================================================
// Router
// ============================================================

const router = AutoRouter({
  before: [withParams],
  catch: (err) => error(500, err.message || 'Internal Server Error'),
});

// Preflight
router.options('*', (request, env) => {
  const origin = request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: getCorsHeaders(env, origin) });
});

// ────────────────────────────────────────────────────────────
// AUTH ROUTES
// ────────────────────────────────────────────────────────────

router.post('/api/auth/login', async (request, env) => {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimited = await checkRateLimit(env.DB, ip);
  if (rateLimited) return error(429, 'Too many login attempts. Try again in 15 minutes.');

  const body = await request.json();
  const username = (body?.username || '').trim().slice(0, 128);
  const password = body?.password || '';
  if (!username || !password) return error(400, 'Username and password required');
  if (password.length > 1024) return error(400, 'Password too long');

  const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
  if (!user) {
    await recordLoginAttempt(env.DB, ip);
    return error(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    await recordLoginAttempt(env.DB, ip);
    return error(401, 'Invalid credentials');
  }

  const token = await signJwt({ sub: user.id, username: user.username }, env.JWT_SECRET);
  return json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

router.get('/api/auth/me', authMiddleware, async (request, env) => {
  const user = await env.DB.prepare('SELECT id, username, email FROM users WHERE id = ?').bind(request.user.sub).first();
  if (!user) return error(404, 'User not found');
  return json(user);
});

// Generate a read-only share token (viewer role — GET-only, no writes)
router.post('/api/auth/share-token', authMiddleware, async (request, env) => {
  const token = await signJwt({ sub: 'viewer', role: 'viewer' }, env.JWT_SECRET, 60 * 60 * 24 * 30); // 30 days
  return json({ token, expiresIn: '30 days' });
});

router.post('/api/auth/change-password', authMiddleware, async (request, env) => {
  const body = await request.json();
  const currentPassword = body?.currentPassword || '';
  const newPassword     = body?.newPassword || '';
  if (!currentPassword || !newPassword) return error(400, 'Current and new password required');
  if (newPassword.length < 8)    return error(400, 'Password must be at least 8 characters');
  if (newPassword.length > 1024) return error(400, 'Password too long');

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(request.user.sub).first();
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return error(401, 'Current password is incorrect');

  const hash = await bcrypt.hash(newPassword, 10);
  await env.DB.prepare('UPDATE users SET password = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(hash, user.id).run();
  return json({ success: true, message: 'Password updated' });
});

router.post('/api/auth/forgot-password', async (request, env) => {
  const { email } = await request.json();
  if (!email) return error(400, 'Email required');

  // Only the registered admin email is accepted — silently ignore anything else
  // This prevents email enumeration and brute-force token generation
  const ADMIN_EMAIL = env.ADMIN_EMAIL || 'johncarloebora@outlook.com';
  const normalized = (email || '').trim().toLowerCase();
  if (normalized !== ADMIN_EMAIL.toLowerCase()) {
    // Return identical response so attackers can't tell if email was valid
    return json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(normalized).first();
  if (!user) return json({ success: true, message: 'If that email exists, a reset link has been sent.' });

  // Generate token
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = base64UrlEncode(tokenBytes);
  const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  await env.DB.prepare(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).bind(user.id, token, expiresAt).run();

  // Send email via EmailJS (5-second timeout)
  const resetUrl = `${env.ADMIN_ORIGIN}/admin/#reset?token=${token}`;
  const emailController = new AbortController();
  const emailTimeout = setTimeout(() => emailController.abort(), 5000);
  try {
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: emailController.signal,
      body: JSON.stringify({
        service_id: env.EMAILJS_SERVICE_ID,
        // Support both naming conventions — wrangler.toml may use either key
        template_id: env.EMAILJS_RESET_TEMPLATE_ID || env.EMAILJS_TEMPLATE_ID,
        user_id: env.EMAILJS_PUBLIC_KEY,
        accessToken: env.EMAILJS_PRIVATE_KEY,
        template_params: {
          to_email: user.email,
          from_name: 'Carlo Portfolio',
          link: resetUrl,
        },
      }),
    });
  } catch (e) {
    // Log the reason but don't expose email delivery status to the caller
    const reason = e.name === 'AbortError' ? 'timeout after 5 s' : e.message;
    console.error('[forgot-password] email send failed:', reason);
  } finally {
    clearTimeout(emailTimeout);
  }

  return json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

router.post('/api/auth/reset-password', async (request, env) => {
  const { token, newPassword } = await request.json();
  if (!token || !newPassword) return error(400, 'Token and new password required');
  if (newPassword.length < 8) return error(400, 'Password must be at least 8 characters');

  const row = await env.DB.prepare(
    'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > datetime(\'now\')'
  ).bind(token).first();
  if (!row) return error(400, 'Invalid or expired reset token');

  const hash = await bcrypt.hash(newPassword, 10);
  await env.DB.prepare('UPDATE users SET password = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(hash, row.user_id).run();
  await env.DB.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').bind(row.id).run();
  return json({ success: true, message: 'Password reset successful' });
});

// ============================================================
// Input Validation Helpers
// ============================================================

/**
 * Returns the trimmed string if it is within the allowed length,
 * or throws a 400 error response via the itty-router `error` helper.
 */
function requireString(value, fieldName, maxLen = 10000) {
  if (typeof value !== 'string') return error(400, `${fieldName} must be a string`);
  const trimmed = value.trim();
  if (!trimmed) return error(400, `${fieldName} is required`);
  if (trimmed.length > maxLen) return error(400, `${fieldName} must be ${maxLen} characters or fewer`);
  return trimmed;
}

/** Whitelist of valid setting keys to prevent arbitrary key injection */
const ALLOWED_SETTING_KEYS = new Set([
  'hero_name', 'hero_eyebrow', 'hero_subtitle', 'hero_desc',
  'hero_cta_primary', 'hero_cta_primary_href',
  'hero_cta_secondary', 'hero_cta_secondary_href',
  'hero_phrases',
  'profile_shape', 'profile_photo_url',
  'theme', 'footer_text', 'footer_links',
  'recaptcha_site_key', 'recaptcha_enabled',
  'emailjs_service_id', 'emailjs_template_id', 'emailjs_public_key',
  'contact_email', 'contact_enabled',
  'site_title', 'site_description',
]);

// ────────────────────────────────────────────────────────────
// SITE SETTINGS
// ────────────────────────────────────────────────────────────

router.get('/api/settings', authMiddleware, async (request, env) => {
  const { results } = await env.DB.prepare('SELECT * FROM site_settings ORDER BY key').all();
  const settings = {};
  for (const row of results) {
    try { settings[row.key] = JSON.parse(row.value); } catch { settings[row.key] = row.value; }
  }
  return json(settings);
});

router.put('/api/settings/:key', authMiddleware, async (request, env) => {
  const { key } = request.params;
  if (!key || key.length > 64) return error(400, 'Invalid setting key');
  const body = await request.json();
  const { value } = body;
  if (value === undefined) return error(400, 'value is required');
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  if (serialized.length > 65535) return error(400, 'Setting value too large');
  await env.DB.prepare(
    'INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
  ).bind(key, serialized).run();
  return json({ success: true });
});

router.put('/api/settings', authMiddleware, async (request, env) => {
  const settings = await request.json();
  if (typeof settings !== 'object' || Array.isArray(settings)) {
    return error(400, 'settings must be a JSON object');
  }
  const stmt = env.DB.prepare(
    'INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
  );
  const batch = [];
  for (const [key, value] of Object.entries(settings)) {
    if (!key || key.length > 64) continue; // skip invalid keys silently
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (serialized.length > 65535) return error(400, `Value for key "${key}" is too large`);
    batch.push(stmt.bind(key, serialized));
  }
  if (batch.length) await env.DB.batch(batch);
  return json({ success: true });
});

// ────────────────────────────────────────────────────────────
// AUDIT LOG HELPERS
// ────────────────────────────────────────────────────────────

async function writeAuditLog(env, action, resource, resourceId, summary) {
  try {
    await env.DB.prepare(
      'INSERT INTO audit_log (action, resource, resource_id, summary) VALUES (?, ?, ?, ?)'
    ).bind(action, resource, String(resourceId || ''), summary || '').run();
  } catch (e) {
    // Non-fatal — audit log failures must not break primary operations
    console.error('[audit]', e.message);
  }
}

router.get('/api/admin/audit-log', authMiddleware, async (request, env) => {
  const limit = Math.min(parseInt(request.query?.limit || '50'), 200);
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM audit_log ORDER BY id DESC LIMIT ?'
    ).bind(limit).all();
    return json(results);
  } catch (e) {
    // Table may not exist yet — return empty array gracefully
    return json([]);
  }
});

// ────────────────────────────────────────────────────────────
// GENERIC CRUD HELPERS
// ────────────────────────────────────────────────────────────

function crudRoutes(router, path, table, options = {}) {
  const { orderBy = 'sort_order', parentKey, allowedFields, onWrite } = options;

  // LIST
  router.get(`/api/${path}`, authMiddleware, async (request, env) => {
    let query = `SELECT * FROM ${table}`;
    const params = [];
    if (parentKey && request.query[parentKey]) {
      query += ` WHERE ${parentKey} = ?`;
      params.push(request.query[parentKey]);
    }
    query += ` ORDER BY ${orderBy}`;
    try {
      const { results } = params.length
        ? await env.DB.prepare(query).bind(...params).all()
        : await env.DB.prepare(query).all();
      return json(results);
    } catch (e) {
      if (e.message && e.message.includes('no such table')) return json([]);
      throw e;
    }
  });

  // GET ONE
  router.get(`/api/${path}/:id`, authMiddleware, async (request, env) => {
    try {
      const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(request.params.id).first();
      if (!row) return error(404, 'Not found');
      return json(row);
    } catch (e) {
      if (e.message && e.message.includes('no such table')) return error(503, 'Table not ready — run migrations first');
      throw e;
    }
  });

  // CREATE
  router.post(`/api/${path}`, authMiddleware, async (request, env) => {
    const body = await request.json();
    const fields = allowedFields || Object.keys(body);
    const cols = fields.filter(f => body[f] !== undefined);
    if (!cols.length) return error(400, 'No fields provided');

    const placeholders = cols.map(() => '?').join(', ');
    const values = cols.map(c => {
      const v = body[c];
      return typeof v === 'object' ? JSON.stringify(v) : v;
    });

    try {
      const result = await env.DB.prepare(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`
      ).bind(...values).run();

      const inserted = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(result.meta.last_row_id).first();
      if (onWrite) await onWrite(env, 'create', inserted.id, inserted);
      return json(inserted, { status: 201 });
    } catch (e) {
      if (e.message && e.message.includes('no such table')) return error(503, 'Table not ready — run migrations first');
      throw e;
    }
  });

  // UPDATE
  router.put(`/api/${path}/:id`, authMiddleware, async (request, env) => {
    const body = await request.json();
    const fields = allowedFields || Object.keys(body);
    const cols = fields.filter(f => body[f] !== undefined);
    if (!cols.length) return error(400, 'No fields provided');

    const sets = cols.map(c => `${c} = ?`).join(', ');
    const values = cols.map(c => {
      const v = body[c];
      return typeof v === 'object' ? JSON.stringify(v) : v;
    });
    values.push(request.params.id);

    try {
      await env.DB.prepare(`UPDATE ${table} SET ${sets} WHERE id = ?`).bind(...values).run();
      const updated = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(request.params.id).first();
      if (onWrite) await onWrite(env, 'update', updated.id, updated);
      return json(updated);
    } catch (e) {
      if (e.message && e.message.includes('no such table')) return error(503, 'Table not ready — run migrations first');
      throw e;
    }
  });

  // DELETE
  router.delete(`/api/${path}/:id`, authMiddleware, async (request, env) => {
    try {
      if (onWrite) await onWrite(env, 'delete', request.params.id, null);
      await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(request.params.id).run();
      return json({ success: true });
    } catch (e) {
      if (e.message && e.message.includes('no such table')) return error(503, 'Table not ready — run migrations first');
      throw e;
    }
  });

  // REORDER
  router.put(`/api/${path}/reorder`, authMiddleware, async (request, env) => {
    const { items } = await request.json(); // [{ id, sort_order }]
    if (!Array.isArray(items)) return error(400, 'items array required');
    try {
      const stmt = env.DB.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`);
      const batch = items.map(item => stmt.bind(item.sort_order, item.id));
      if (batch.length) await env.DB.batch(batch);
      return json({ success: true });
    } catch (e) {
      if (e.message && e.message.includes('no such table')) return error(503, 'Table not ready — run migrations first');
      throw e;
    }
  });
}

// Register CRUD routes for all content tables
crudRoutes(router, 'sections', 'sections', {
  allowedFields: ['id', 'title', 'subtitle', 'nav_icon', 'nav_label', 'sort_order', 'visible', 'type', 'config', 'animate', 'animation_preset', 'layout_variant'],
});
crudRoutes(router, 'about-cards', 'about_cards', {
  allowedFields: ['title', 'icon', 'content', 'type', 'expanded', 'sort_order'],
});
crudRoutes(router, 'stats', 'stats', {
  allowedFields: ['target', 'suffix', 'label', 'sort_order'],
});
crudRoutes(router, 'skill-cards', 'skill_cards', {
  allowedFields: ['title', 'icon', 'sort_order', 'expanded'],
});
crudRoutes(router, 'skill-categories', 'skill_categories', {
  allowedFields: ['skill_card_id', 'title', 'icon', 'sort_order'],
  parentKey: 'skill_card_id',
});
crudRoutes(router, 'skills', 'skills', {
  allowedFields: ['category_id', 'name', 'description', 'icon', 'proficiency', 'sort_order'],
  parentKey: 'category_id',
});
crudRoutes(router, 'experiences', 'experiences', {
  allowedFields: ['date_range', 'title', 'badge', 'company', 'description', 'bullets', 'sort_order', 'expanded'],
});
crudRoutes(router, 'education', 'education', {
  allowedFields: ['card_title', 'card_icon', 'entries', 'sort_order'],
});
crudRoutes(router, 'blog', 'blog_posts', {
  allowedFields: ['title', 'slug', 'excerpt', 'content', 'cover_image', 'tags', 'published', 'sort_order'],
  orderBy: 'sort_order',
  onWrite: async (env, action, id, data) => {
    const summary = data ? (data.title || 'Untitled') : `id:${id}`;
    await writeAuditLog(env, action, 'blog', String(id), summary);
  },
});
crudRoutes(router, 'testimonials', 'testimonials', {
  allowedFields: ['name', 'role', 'company', 'avatar', 'quote', 'rating', 'sort_order'],
  orderBy: 'sort_order',
});
crudRoutes(router, 'certifications', 'certifications', {
  allowedFields: ['title', 'issuer', 'date', 'credential_url', 'badge_image', 'description', 'sort_order'],
  orderBy: 'sort_order',
});
crudRoutes(router, 'achievements', 'achievements', {
  allowedFields: ['title', 'description', 'icon', 'date', 'sort_order'],
  orderBy: 'sort_order',
});

crudRoutes(router, 'projects', 'projects', {
  allowedFields: ['title', 'description', 'thumbnail_path', 'gallery_type', 'gallery_folder',
                  'webpage_url', 'category', 'tags', 'skills', 'sort_order',
                  'status', 'featured', 'visibility', 'wp_device', 'wp_allow_interaction',
                  'custom_width', 'custom_height', 'zoom_level', 'preview_mode', 'load_strategy', 'wp_timeout',
                  'priority', 'layout_type'],
  onWrite: async (env, action, id, data) => {
    const summary = data ? (data.title || 'Untitled') : `id:${id}`;
    await writeAuditLog(env, action, 'project', String(id), summary);
  },
});
crudRoutes(router, 'socials', 'socials', {
  allowedFields: ['platform', 'url', 'icon', 'label', 'sort_order'],
});

// ────────────────────────────────────────────────────────────
// MEDIA ENDPOINTS
// ────────────────────────────────────────────────────────────

// Rescan R2 bucket — lists every real object in R2 and upserts into D1
// Fixes cases where D1 has wrong/fake filenames not matching actual R2 keys
router.post('/api/media/rescan', authMiddleware, async (request, env) => {
  const r2Base = env.R2_PUBLIC_URL;
  const VALID_FOLDERS = ['layout', 'profile', 'thumbnail', 'videos'];
  let added = 0, skipped = 0;

  for (const folder of VALID_FOLDERS) {
    let cursor;
    do {
      const listed = await env.MEDIA.list({ prefix: folder + '/', cursor, limit: 1000 });
      for (const obj of listed.objects) {
        // key is like "layout/filename.jpg"
        const parts = obj.key.split('/');
        if (parts.length < 2) continue;
        const filename = parts.slice(1).join('/'); // support filenames with slashes (unlikely but safe)
        if (!filename) continue; // skip bare folder keys

        // Detect mime type from extension
        const ext = filename.split('.').pop().toLowerCase();
        const mimeMap = {
          jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', webp:'image/webp',
          gif:'image/gif', bmp:'image/bmp', svg:'image/svg+xml', avif:'image/avif',
          tiff:'image/tiff', tif:'image/tiff', heic:'image/heic', heif:'image/heif',
          mp4:'video/mp4', webm:'video/webm', mov:'video/quicktime',
          avi:'video/x-msvideo', mkv:'video/x-matroska', ogv:'video/ogg',
        };
        const mimeType = mimeMap[ext] || 'application/octet-stream';

        // Upsert: insert if not exists, leave alt_text alone if already set
        await env.DB.prepare(
          `INSERT INTO media (folder, filename, alt_text, mime_type, size_bytes)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(folder, filename) DO UPDATE SET
             mime_type = excluded.mime_type,
             size_bytes = excluded.size_bytes`
        ).bind(folder, filename, filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), mimeType, obj.size || null).run();
        added++;
      }
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);
  }

  // Remove D1 records that no longer exist in R2
  const { results: allRecords } = await env.DB.prepare('SELECT id, folder, filename FROM media').all();
  for (const rec of allRecords) {
    const r2Key = `${rec.folder}/${rec.filename}`;
    const head = await env.MEDIA.head(r2Key);
    if (!head) {
      await env.DB.prepare('DELETE FROM media WHERE id = ?').bind(rec.id).run();
      skipped++;
    }
  }

  return json({ success: true, synced: added, removed: skipped });
});

router.get('/api/media', authMiddleware, async (request, env) => {
  let query = 'SELECT * FROM media';
  const params = [];
  if (request.query.folder) {
    query += ' WHERE folder = ?';
    params.push(request.query.folder);
  }
  query += ' ORDER BY folder, filename';
  const { results } = params.length
    ? await env.DB.prepare(query).bind(...params).all()
    : await env.DB.prepare(query).all();

  // Add full URL to each result
  const r2Base = env.R2_PUBLIC_URL;
  const enriched = results.map(r => ({
    ...r,
    url: `${r2Base}/${r.folder}/${encodeURIComponent(r.filename)}`,
  }));
  return json(enriched);
});

router.post('/api/media/upload', authMiddleware, async (request, env) => {
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return error(400, 'Multipart form data required');
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const folder = formData.get('folder') || 'layout';
  const altText = formData.get('alt_text') || '';

  if (!file || !file.name) return error(400, 'File is required');

  // Validate folder
  const allowedFolders = ['layout', 'videos', 'profile', 'thumbnail'];
  if (!allowedFolders.includes(folder)) return error(400, 'Invalid folder');

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) return error(400, 'File too large (max 10MB)');

  // Validate MIME type
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
    'image/bmp', 'image/svg+xml', 'image/tiff',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    'video/x-matroska', 'video/ogg',
  ];
  if (!allowedMimes.includes(file.type)) return error(400, `File type ${file.type} not allowed`);

  const filename = file.name;
  const r2Key = `${folder}/${filename}`;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await env.MEDIA.put(r2Key, arrayBuffer, {
    httpMetadata: { contentType: file.type },
  });

  // Upsert in media table
  await env.DB.prepare(
    'INSERT INTO media (folder, filename, alt_text, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?) ON CONFLICT(folder, filename) DO UPDATE SET alt_text = excluded.alt_text, mime_type = excluded.mime_type, size_bytes = excluded.size_bytes, uploaded_at = datetime(\'now\')'
  ).bind(folder, filename, altText, file.type, file.size).run();

  const media = await env.DB.prepare('SELECT * FROM media WHERE folder = ? AND filename = ?').bind(folder, filename).first();
  return json({
    ...media,
    url: `${env.R2_PUBLIC_URL}/${folder}/${encodeURIComponent(filename)}`,
  }, { status: 201 });
});

router.put('/api/media/:id', authMiddleware, async (request, env) => {
  const { alt_text } = await request.json();
  await env.DB.prepare('UPDATE media SET alt_text = ? WHERE id = ?').bind(alt_text, request.params.id).run();
  const updated = await env.DB.prepare('SELECT * FROM media WHERE id = ?').bind(request.params.id).first();
  return json(updated);
});

router.delete('/api/media/:id', authMiddleware, async (request, env) => {
  const media = await env.DB.prepare('SELECT * FROM media WHERE id = ?').bind(request.params.id).first();
  if (!media) return error(404, 'Media not found');

  // Delete from R2
  await env.MEDIA.delete(`${media.folder}/${media.filename}`);
  // Delete from DB
  await env.DB.prepare('DELETE FROM media WHERE id = ?').bind(request.params.id).run();
  return json({ success: true });
});

// ────────────────────────────────────────────────────────────
// DB MIGRATION ENDPOINT (safe, idempotent — adds new columns)
// ────────────────────────────────────────────────────────────

router.post('/api/admin/migrate', authMiddleware, async (request, env) => {
  const migrations = [
    // Add webpage_url to projects
    'ALTER TABLE projects ADD COLUMN webpage_url TEXT',
    // Add category to projects
    "ALTER TABLE projects ADD COLUMN category TEXT DEFAULT 'standard'",
    // Add skills JSON array to projects
    "ALTER TABLE projects ADD COLUMN skills TEXT DEFAULT '[]'",
    // Add status: draft | published | archived
    "ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'published'",
    // Add featured flag (0/1)
    "ALTER TABLE projects ADD COLUMN featured INTEGER DEFAULT 0",
    // Add visibility flag (0/1) — 0 = hidden from published site
    "ALTER TABLE projects ADD COLUMN visibility INTEGER DEFAULT 1",
    // Add subtitle to sections
    "ALTER TABLE sections ADD COLUMN subtitle TEXT",
    // Seed minigame section (hidden by default)
    "INSERT OR IGNORE INTO sections (id, title, nav_icon, nav_label, sort_order, visible, type) VALUES ('minigame', 'Quick Challenges', 'fas fa-gamepad', 'Fun Zone', 8, 0, 'builtin')",
    // Per-project iframe device default (mobile/tablet/desktop/full)
    "ALTER TABLE projects ADD COLUMN wp_device TEXT DEFAULT 'full'",
    // Per-project iframe interaction flag (1=allow scripts+forms, 0=read-only sandbox)
    "ALTER TABLE projects ADD COLUMN wp_allow_interaction INTEGER DEFAULT 1",
    // Section animation toggle (1=animated, 0=no animations)
    "ALTER TABLE sections ADD COLUMN animate INTEGER DEFAULT 1",
    // Audit log table for admin activity tracking
    "CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, resource TEXT NOT NULL, resource_id TEXT, summary TEXT, performed_at TEXT DEFAULT (datetime('now')))",
    // Blog posts table
    "CREATE TABLE IF NOT EXISTS blog_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, slug TEXT, excerpt TEXT, content TEXT, cover_image TEXT, tags TEXT DEFAULT '[]', published INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))",
    // Testimonials table
    "CREATE TABLE IF NOT EXISTS testimonials (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, role TEXT, company TEXT, avatar TEXT, quote TEXT, rating INTEGER DEFAULT 5, sort_order INTEGER DEFAULT 0)",
    // Certifications table
    "CREATE TABLE IF NOT EXISTS certifications (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, issuer TEXT, date TEXT, credential_url TEXT, badge_image TEXT, description TEXT, sort_order INTEGER DEFAULT 0)",
    // Achievements table
    "CREATE TABLE IF NOT EXISTS achievements (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, icon TEXT DEFAULT 'fas fa-trophy', date TEXT, sort_order INTEGER DEFAULT 0)",
    // Game settings table
    "CREATE TABLE IF NOT EXISTS game_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, game_id TEXT UNIQUE, enabled INTEGER DEFAULT 1, default_difficulty TEXT DEFAULT 'normal', config TEXT DEFAULT '{}')",
    // Site version snapshots (last 10 published configs)
    "CREATE TABLE IF NOT EXISTS site_versions (id INTEGER PRIMARY KEY AUTOINCREMENT, snapshot TEXT, label TEXT, published_at TEXT DEFAULT (datetime('now')))",
    // Page views analytics
    "CREATE TABLE IF NOT EXISTS page_views (id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT DEFAULT '/', viewed_at TEXT DEFAULT (datetime('now')))",
    // Seed default game settings
    "INSERT OR IGNORE INTO game_settings (game_id, enabled, default_difficulty) VALUES ('reaction', 1, 'normal')",
    "INSERT OR IGNORE INTO game_settings (game_id, enabled, default_difficulty) VALUES ('typing', 1, 'normal')",
    "INSERT OR IGNORE INTO game_settings (game_id, enabled, default_difficulty) VALUES ('click', 1, 'normal')",
    "INSERT OR IGNORE INTO game_settings (game_id, enabled, default_difficulty) VALUES ('memory', 1, 'normal')",
    "INSERT OR IGNORE INTO game_settings (game_id, enabled, default_difficulty) VALUES ('aim', 1, 'normal')",
    "INSERT OR IGNORE INTO game_settings (game_id, enabled, default_difficulty) VALUES ('logic', 1, 'normal')",
    "INSERT OR IGNORE INTO game_settings (game_id, enabled, default_difficulty) VALUES ('quiz', 1, 'normal')",
    // Webpage project additional fields
    "ALTER TABLE projects ADD COLUMN custom_width INTEGER DEFAULT 0",
    "ALTER TABLE projects ADD COLUMN custom_height INTEGER DEFAULT 0",
    "ALTER TABLE projects ADD COLUMN zoom_level REAL DEFAULT 1.0",
    "ALTER TABLE projects ADD COLUMN preview_mode TEXT DEFAULT 'live'",
    "ALTER TABLE projects ADD COLUMN load_strategy TEXT DEFAULT 'eager'",
    "ALTER TABLE projects ADD COLUMN wp_timeout INTEGER DEFAULT 30",
    // Section animation preset and layout variant
    "ALTER TABLE sections ADD COLUMN animation_preset TEXT DEFAULT 'fade'",
    "ALTER TABLE sections ADD COLUMN layout_variant TEXT DEFAULT 'standard'",
    // Seed missing built-in sections (hidden by default; admin enables when ready)
    "INSERT OR IGNORE INTO sections (id, title, nav_icon, nav_label, sort_order, visible, type) VALUES ('resume',          'Resume',          'fas fa-file-alt',   'Resume',       9,  0, 'builtin')",
    "INSERT OR IGNORE INTO sections (id, title, nav_icon, nav_label, sort_order, visible, type) VALUES ('testimonials',    'Testimonials',    'fas fa-star',       'Reviews',      10, 0, 'builtin')",
    "INSERT OR IGNORE INTO sections (id, title, nav_icon, nav_label, sort_order, visible, type) VALUES ('certifications',  'Certifications',  'fas fa-certificate','Certs',        11, 0, 'builtin')",
    "INSERT OR IGNORE INTO sections (id, title, nav_icon, nav_label, sort_order, visible, type) VALUES ('achievements',    'Achievements',    'fas fa-trophy',     'Achievements', 12, 0, 'builtin')",
    "INSERT OR IGNORE INTO sections (id, title, nav_icon, nav_label, sort_order, visible, type) VALUES ('blog',            'Blog',            'fas fa-blog',       'Blog',         13, 0, 'builtin')",
    // Ensure minigame is always positioned last regardless of other section additions
    "UPDATE sections SET sort_order = 99 WHERE id = 'minigame'",
    // Social blog platform — separate from portfolio blog_posts
    "CREATE TABLE IF NOT EXISTS social_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT NOT NULL DEFAULT 'Carlo', content TEXT NOT NULL DEFAULT '', media TEXT NOT NULL DEFAULT '[]', hashtags TEXT NOT NULL DEFAULT '[]', tags TEXT NOT NULL DEFAULT '[]', location TEXT NOT NULL DEFAULT '', reply_to INTEGER DEFAULT NULL REFERENCES social_posts(id), reactions TEXT NOT NULL DEFAULT '{\"like\":0,\"love\":0,\"fire\":0,\"clap\":0}', reply_count INTEGER NOT NULL DEFAULT 0, pinned INTEGER NOT NULL DEFAULT 0, featured INTEGER NOT NULL DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))",
    "CREATE INDEX IF NOT EXISTS idx_social_posts_reply_to ON social_posts(reply_to)",
    "CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts(created_at DESC)",
    // Project priority (0=normal, 1=high, 2=urgent) and layout type
    "ALTER TABLE projects ADD COLUMN priority INTEGER DEFAULT 0",
    "ALTER TABLE projects ADD COLUMN layout_type TEXT DEFAULT 'card'",
    // Blog media metadata table
    "CREATE TABLE IF NOT EXISTS blog_media (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL, r2_key TEXT NOT NULL, url TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'image', size_bytes INTEGER DEFAULT 0, width INTEGER DEFAULT 0, height INTEGER DEFAULT 0, mime_type TEXT, post_id INTEGER, created_at TEXT DEFAULT (datetime('now')))",
    "CREATE INDEX IF NOT EXISTS idx_blog_media_type ON blog_media(type)",
    "CREATE INDEX IF NOT EXISTS idx_blog_media_post ON blog_media(post_id)",
    // Blog-to-portfolio sync config (admin-configurable tag→section mapping)
    "CREATE TABLE IF NOT EXISTS blog_sync_config (id INTEGER PRIMARY KEY AUTOINCREMENT, tag TEXT NOT NULL UNIQUE, section TEXT NOT NULL, enabled INTEGER DEFAULT 1)",
    "INSERT OR IGNORE INTO blog_sync_config (tag, section) VALUES ('project', 'projects')",
    "INSERT OR IGNORE INTO blog_sync_config (tag, section) VALUES ('achievement', 'achievements')",
    "INSERT OR IGNORE INTO blog_sync_config (tag, section) VALUES ('gallery', 'gallery')",
    "INSERT OR IGNORE INTO blog_sync_config (tag, section) VALUES ('media', 'media')",
    // Author avatar/bio support on social_posts
    "ALTER TABLE social_posts ADD COLUMN author_avatar TEXT DEFAULT ''",
    "ALTER TABLE social_posts ADD COLUMN author_bio TEXT DEFAULT ''",
  ];
  const results = [];
  for (const sql of migrations) {
    try {
      await env.DB.prepare(sql).run();
      results.push({ sql, status: 'applied' });
    } catch (e) {
      /* "duplicate column" error means it already exists — safe to ignore */
      results.push({ sql, status: 'already_exists', detail: e.message });
    }
  }
  return json({ ok: true, results });
});

// ────────────────────────────────────────────────────────────
// PUBLIC GALLERY ENDPOINT (replaces GitHub Contents API)
// ────────────────────────────────────────────────────────────

router.get('/api/gallery/:folder', async (request, env) => {
  const folder = request.params.folder;
  /* Allow any alphanumeric folder name (letters, digits, hyphens, underscores) */
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(folder)) return error(400, 'Invalid folder name');

  const { results } = await env.DB.prepare(
    'SELECT filename, alt_text, mime_type FROM media WHERE folder = ? ORDER BY filename'
  ).bind(folder).all();

  const r2Base = env.R2_PUBLIC_URL;
  const files = results.map(r => ({
    name: r.filename,
    alt: r.alt_text || r.filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
    url: `${r2Base}/${folder}/${encodeURIComponent(r.filename)}`,
    type: r.mime_type,
  }));

  return json(files);
});

// ────────────────────────────────────────────────────────────
// PUBLISH ENDPOINT
// ────────────────────────────────────────────────────────────

// Public config endpoint — serves site-config.json with proper CORS
router.get('/api/config', async (request, env) => {
  const obj = await env.MEDIA.get('site-config.json');
  if (!obj) return error(404, 'Config not published yet');
  const text = await obj.text();
  return new Response(text, {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
  });
});

router.post('/api/publish', authMiddleware, async (request, env) => {
  try {
    // Gather all data from D1
    const [
      settingsRes,
      sectionsRes,
      aboutCardsRes,
      statsRes,
      skillCardsRes,
      skillCategoriesRes,
      skillsRes,
      experiencesRes,
      educationRes,
      projectsRes,
      socialsRes,
      mediaRes,
      blogRes,
      testimonialsRes,
      certificationsRes,
      achievementsRes,
      gameSettingsRes,
    ] = await Promise.all([
      env.DB.prepare('SELECT * FROM site_settings').all(),
      env.DB.prepare('SELECT * FROM sections ORDER BY sort_order').all(),
      env.DB.prepare('SELECT * FROM about_cards ORDER BY sort_order').all(),
      env.DB.prepare('SELECT * FROM stats ORDER BY sort_order').all(),
      env.DB.prepare('SELECT * FROM skill_cards ORDER BY sort_order').all(),
      env.DB.prepare('SELECT * FROM skill_categories ORDER BY sort_order').all(),
      env.DB.prepare('SELECT * FROM skills ORDER BY sort_order').all(),
      env.DB.prepare('SELECT * FROM experiences ORDER BY sort_order').all(),
      env.DB.prepare('SELECT * FROM education ORDER BY sort_order').all(),
      env.DB.prepare('SELECT * FROM projects ORDER BY sort_order').all(),
      env.DB.prepare('SELECT * FROM socials ORDER BY sort_order').all(),
      env.DB.prepare('SELECT * FROM media ORDER BY folder, filename').all(),
      env.DB.prepare('SELECT * FROM blog_posts WHERE published = 1 ORDER BY sort_order').all().catch(() => ({ results: [] })),
      env.DB.prepare('SELECT * FROM testimonials ORDER BY sort_order').all().catch(() => ({ results: [] })),
      env.DB.prepare('SELECT * FROM certifications ORDER BY sort_order').all().catch(() => ({ results: [] })),
      env.DB.prepare('SELECT * FROM achievements ORDER BY sort_order').all().catch(() => ({ results: [] })),
      env.DB.prepare('SELECT * FROM game_settings ORDER BY game_id').all().catch(() => ({ results: [] })),
    ]);

    // Parse settings
    const settings = {};
    for (const row of settingsRes.results) {
      try { settings[row.key] = JSON.parse(row.value); } catch { settings[row.key] = row.value; }
    }

    // Build skill tree
    const r2Base = env.R2_PUBLIC_URL;
    const skillTree = skillCardsRes.results.map(card => ({
      ...card,
      categories: skillCategoriesRes.results
        .filter(cat => cat.skill_card_id === card.id)
        .map(cat => ({
          ...cat,
          skills: skillsRes.results.filter(s => s.category_id === cat.id),
        })),
    }));

    // Parse JSON fields
    const experiences = experiencesRes.results.map(e => ({
      ...e,
      bullets: safeParseJson(e.bullets, []),
    }));

    const education = educationRes.results.map(e => ({
      ...e,
      entries: safeParseJson(e.entries, []),
    }));

    const projects = projectsRes.results
      .filter(p => p.visibility !== 0 && p.status !== 'draft')
      .map(p => ({
        ...p,
        tags:          safeParseJson(p.tags, []),
        skills:        safeParseJson(p.skills, []),
        featured:      p.featured ? 1 : 0,
        visibility:    p.visibility !== 0 ? 1 : 0,
        thumbnail_url: p.thumbnail_path
          ? `${r2Base}/${p.thumbnail_path.split('/').map(encodeURIComponent).join('/')}`
          : null,
      }));

    // Build media index
    const mediaByFolder = {};
    for (const m of mediaRes.results) {
      if (!mediaByFolder[m.folder]) mediaByFolder[m.folder] = [];
      mediaByFolder[m.folder].push({
        filename: m.filename,
        alt: m.alt_text || m.filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        url: `${r2Base}/${m.folder}/${encodeURIComponent(m.filename)}`,
        type: m.mime_type,
      });
    }

    // Build game settings map
    const gameSettingsMap = {};
    for (const g of gameSettingsRes.results) {
      gameSettingsMap[g.game_id] = {
        enabled: g.enabled !== 0,
        default_difficulty: g.default_difficulty || 'normal',
        config: safeParseJson(g.config, {}),
      };
    }

    // Assemble config
    const publishedAt = new Date().toISOString();
    const siteConfig = {
      publishedAt,
      r2Base,
      settings,
      sections: sectionsRes.results.map(s => ({
        ...s,
        config: safeParseJson(s.config, null),
      })),
      about: {
        cards: aboutCardsRes.results.map(c => ({
          ...c,
          content: safeParseJson(c.content, c.content),
        })),
        stats: statsRes.results,
      },
      skills: skillTree,
      experiences,
      education,
      projects,
      socials: socialsRes.results,
      media: mediaByFolder,
      blog: blogRes.results.map(p => ({ ...p, tags: safeParseJson(p.tags, []) })),
      testimonials: testimonialsRes.results,
      certifications: certificationsRes.results,
      achievements: achievementsRes.results,
      gameSettings: gameSettingsMap,
    };

    const configJson = JSON.stringify(siteConfig, null, 2);

    // Write to R2
    await env.MEDIA.put('site-config.json', configJson, {
      httpMetadata: {
        contentType: 'application/json',
        cacheControl: 'no-cache, no-store, must-revalidate',
      },
    });

    // Save version snapshot (keep last 10)
    try {
      await env.DB.prepare(
        'INSERT INTO site_versions (snapshot, label, published_at) VALUES (?, ?, ?)'
      ).bind(configJson, `Published ${publishedAt}`, publishedAt).run();
      // Prune old versions — keep 10 most recent
      await env.DB.prepare(
        'DELETE FROM site_versions WHERE id NOT IN (SELECT id FROM site_versions ORDER BY id DESC LIMIT 10)'
      ).run();
    } catch (e) { console.error('[versions]', e.message); }

    await writeAuditLog(env, 'publish', 'site', 'config', publishedAt);

    return json({ success: true, publishedAt });
  } catch (err) {
    console.error('Publish error:', err);
    return error(500, 'Failed to publish: ' + err.message);
  }
});

function safeParseJson(str, fallback) {
  if (typeof str !== 'string') return str ?? fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}


// ────────────────────────────────────────────────────────────
// GAME SETTINGS ENDPOINTS
// ────────────────────────────────────────────────────────────

router.get('/api/game-settings', authMiddleware, async (request, env) => {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM game_settings ORDER BY game_id').all();
    return json(results);
  } catch { return json([]); }
});

router.put('/api/game-settings/:gameId', authMiddleware, async (request, env) => {
  const { gameId } = request.params;
  if (!gameId || gameId.length > 64) return error(400, 'Invalid game ID');
  const body = await request.json();
  const enabled = body.enabled !== undefined ? (body.enabled ? 1 : 0) : 1;
  const defaultDifficulty = body.default_difficulty || 'normal';
  const config = typeof body.config === 'object' ? JSON.stringify(body.config) : (body.config || '{}');
  await env.DB.prepare(
    `INSERT INTO game_settings (game_id, enabled, default_difficulty, config) VALUES (?, ?, ?, ?)
     ON CONFLICT(game_id) DO UPDATE SET enabled=excluded.enabled, default_difficulty=excluded.default_difficulty, config=excluded.config`
  ).bind(gameId, enabled, defaultDifficulty, config).run();
  return json({ success: true });
});

// ────────────────────────────────────────────────────────────
// VERSION HISTORY ENDPOINTS
// ────────────────────────────────────────────────────────────

router.get('/api/admin/versions', authMiddleware, async (request, env) => {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, label, published_at FROM site_versions ORDER BY id DESC LIMIT 10'
    ).all();
    return json(results);
  } catch { return json([]); }
});

router.post('/api/admin/versions/restore/:id', authMiddleware, async (request, env) => {
  try {
    const row = await env.DB.prepare('SELECT snapshot FROM site_versions WHERE id = ?').bind(request.params.id).first();
    if (!row) return error(404, 'Version not found');
    await env.MEDIA.put('site-config.json', row.snapshot, {
      httpMetadata: { contentType: 'application/json', cacheControl: 'no-cache, no-store, must-revalidate' },
    });
    await writeAuditLog(env, 'restore', 'version', request.params.id, `Restored version id:${request.params.id}`);
    return json({ success: true });
  } catch (err) { return error(500, err.message); }
});

// ────────────────────────────────────────────────────────────
// ANALYTICS ENDPOINTS
// ────────────────────────────────────────────────────────────

// Public — no auth (called from portfolio page)
router.post('/api/page-view', async (request, env) => {
  try {
    const body = await request.json().catch(() => ({}));
    const path = (body.path || '/').slice(0, 255);
    await env.DB.prepare('INSERT INTO page_views (path) VALUES (?)').bind(path).run();
  } catch { /* non-fatal */ }
  return json({ ok: true });
});

router.get('/api/admin/analytics', authMiddleware, async (request, env) => {
  try {
    const days = Math.min(parseInt(request.query?.days || '30'), 90);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const [totalRes, dailyRes, pathRes] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as total FROM page_views WHERE viewed_at >= ?').bind(since).first(),
      env.DB.prepare(`SELECT substr(viewed_at,1,10) as day, COUNT(*) as views FROM page_views WHERE viewed_at >= ? GROUP BY day ORDER BY day DESC LIMIT 30`).bind(since).all(),
      env.DB.prepare(`SELECT path, COUNT(*) as views FROM page_views WHERE viewed_at >= ? GROUP BY path ORDER BY views DESC LIMIT 10`).bind(since).all(),
    ]);
    return json({
      total: totalRes?.total || 0,
      daily: dailyRes.results || [],
      topPaths: pathRes.results || [],
      days,
    });
  } catch { return json({ total: 0, daily: [], topPaths: [], days: 30 }); }
});

// ────────────────────────────────────────────────────────────
// SYNC STATUS ENDPOINT
// ────────────────────────────────────────────────────────────

router.get('/api/sync-status', authMiddleware, async (request, env) => {
  try {
    const obj = await env.MEDIA.head('site-config.json');
    // Get last DB change timestamp from audit log
    const lastAudit = await env.DB.prepare('SELECT performed_at FROM audit_log ORDER BY id DESC LIMIT 1').first().catch(() => null);
    return json({
      publishedAt: obj ? obj.uploaded : null,
      lastChangeAt: lastAudit?.performed_at || null,
    });
  } catch { return json({ publishedAt: null, lastChangeAt: null }); }
});

// ────────────────────────────────────────────────────────────
// BLOG / SOCIAL PLATFORM ROUTES
// ────────────────────────────────────────────────────────────

function safeParseReactions(raw) {
  try { return raw ? JSON.parse(raw) : { like: 0, love: 0, fire: 0, clap: 0 }; } catch { return { like: 0, love: 0, fire: 0, clap: 0 }; }
}
function safeParseArr(raw) {
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function hydrateSocialPost(row) {
  return {
    ...row,
    media:     safeParseArr(row.media),
    hashtags:  safeParseArr(row.hashtags),
    tags:      safeParseArr(row.tags),
    reactions: safeParseReactions(row.reactions),
  };
}
function sanitizeText(s, max = 2000) {
  return String(s || '').trim().slice(0, max);
}

/* Public: paginated feed with optional tag/search filter */
router.get('/api/blog/feed', async (request, env) => {
  const page   = Math.max(1, parseInt(request.query?.page   || '1'));
  const limit  = Math.min(50, Math.max(1, parseInt(request.query?.limit || '10')));
  const tag    = (request.query?.tag    || '').trim().slice(0, 64);
  const search = (request.query?.search || '').trim().slice(0, 200);
  const offset = (page - 1) * limit;

  let conditions = ['reply_to IS NULL'];
  let binds = [];

  if (tag) {
    const tagPattern = '%"' + tag.replace(/"/g, '') + '"%';
    conditions.push('(tags LIKE ? OR hashtags LIKE ?)');
    binds.push(tagPattern, tagPattern);
  }
  if (search) {
    const searchPattern = '%' + search.replace(/%/g, '\\%').replace(/_/g, '\\_') + '%';
    conditions.push('(content LIKE ? OR author LIKE ? OR tags LIKE ? OR hashtags LIKE ?)');
    binds.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  const where = 'WHERE ' + conditions.join(' AND ');
  const countSql = `SELECT COUNT(*) as cnt FROM social_posts ${where}`;
  const fetchSql = `SELECT * FROM social_posts ${where} ORDER BY pinned DESC, created_at DESC LIMIT ? OFFSET ?`;

  const [countRow, { results }] = await Promise.all([
    env.DB.prepare(countSql).bind(...binds).first(),
    env.DB.prepare(fetchSql).bind(...binds, limit, offset).all(),
  ]);

  return json({
    posts: results.map(hydrateSocialPost),
    total: countRow?.cnt || 0,
    page,
    limit,
  });
});

/* Public: all tags with counts */
router.get('/api/blog/tags', async (request, env) => {
  const { results } = await env.DB.prepare('SELECT tags, hashtags FROM social_posts WHERE reply_to IS NULL').all();
  const counts = {};
  results.forEach(row => {
    const combined = [...safeParseArr(row.tags), ...safeParseArr(row.hashtags)];
    combined.forEach(t => { if (t) counts[t] = (counts[t] || 0) + 1; });
  });
  const tags = Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
  return json({ tags });
});

/* Public: single post + replies (thread view) */
router.get('/api/blog/posts/:id/thread', async (request, env) => {
  const id = parseInt(request.params.id);
  if (!id) return error(400, 'Invalid id');
  const [post, { results: replies }] = await Promise.all([
    env.DB.prepare('SELECT * FROM social_posts WHERE id = ?').bind(id).first(),
    env.DB.prepare('SELECT * FROM social_posts WHERE reply_to = ? ORDER BY created_at ASC').bind(id).all(),
  ]);
  if (!post) return error(404, 'Post not found');
  return json({ post: hydrateSocialPost(post), replies: replies.map(hydrateSocialPost) });
});

/* Public: create post / reply (open for now; auth required for non-replies in admin) */
router.post('/api/blog/posts', async (request, env) => {
  const body = await request.json();
  const content  = sanitizeText(body?.content, 2000);
  if (!content) return error(400, 'Content is required');

  const replyTo  = body?.reply_to ? parseInt(body.reply_to) : null;
  const author   = sanitizeText(body?.author || 'Carlo', 100);
  const location = sanitizeText(body?.location || '', 200);

  /* Parse hashtags from content */
  const inlineHashtags = (content.match(/#(\w+)/g) || []).map(h => h.slice(1));
  const explicitTags   = Array.isArray(body?.tags) ? body.tags.map(t => sanitizeText(t, 50)).filter(Boolean) : [];
  const allTags = [...new Set([...inlineHashtags, ...explicitTags])];

  const reactionsDefault = JSON.stringify({ like: 0, love: 0, fire: 0, clap: 0 });

  const result = await env.DB.prepare(
    'INSERT INTO social_posts (author, content, media, hashtags, tags, location, reply_to, reactions) VALUES (?,?,?,?,?,?,?,?)'
  ).bind(
    author, content,
    JSON.stringify(Array.isArray(body?.media) ? body.media : []),
    JSON.stringify(inlineHashtags),
    JSON.stringify(allTags),
    location, replyTo, reactionsDefault
  ).run();

  const newId = result.meta?.last_row_id;

  /* Increment reply_count on parent */
  if (replyTo) {
    await env.DB.prepare('UPDATE social_posts SET reply_count = reply_count + 1 WHERE id = ?').bind(replyTo).run();
  }

  const newPost = await env.DB.prepare('SELECT * FROM social_posts WHERE id = ?').bind(newId).first();
  return json(hydrateSocialPost(newPost), { status: 201 });
});

/* Public: react to a post */
router.post('/api/blog/posts/:id/react', async (request, env) => {
  const id       = parseInt(request.params.id);
  const body     = await request.json();
  const reaction = (body?.reaction || '').toLowerCase();
  const remove   = !!body?.remove;
  const VALID    = ['like', 'love', 'fire', 'clap'];
  if (!VALID.includes(reaction)) return error(400, 'Invalid reaction');

  const post = await env.DB.prepare('SELECT reactions FROM social_posts WHERE id = ?').bind(id).first();
  if (!post) return error(404, 'Post not found');

  const reactions = safeParseReactions(post.reactions);
  if (remove) {
    reactions[reaction] = Math.max(0, (reactions[reaction] || 0) - 1);
  } else {
    reactions[reaction] = (reactions[reaction] || 0) + 1;
  }

  await env.DB.prepare('UPDATE social_posts SET reactions = ? WHERE id = ?').bind(JSON.stringify(reactions), id).run();
  return json({ reactions });
});

/* Admin: edit post */
router.put('/api/blog/posts/:id', authMiddleware, async (request, env) => {
  const id   = parseInt(request.params.id);
  const body = await request.json();
  const post = await env.DB.prepare('SELECT * FROM social_posts WHERE id = ?').bind(id).first();
  if (!post) return error(404, 'Post not found');

  const content  = body?.content !== undefined ? sanitizeText(body.content, 2000) : post.content;
  const location = body?.location !== undefined ? sanitizeText(body.location, 200) : post.location;
  const inlineHashtags = (content.match(/#(\w+)/g) || []).map(h => h.slice(1));
  const explicitTags   = Array.isArray(body?.tags) ? body.tags.map(t => sanitizeText(t, 50)).filter(Boolean) : safeParseArr(post.tags);
  const allTags = [...new Set([...inlineHashtags, ...explicitTags])];

  await env.DB.prepare(
    'UPDATE social_posts SET content=?, location=?, hashtags=?, tags=?, media=?, updated_at=datetime(\'now\') WHERE id=?'
  ).bind(
    content, location,
    JSON.stringify(inlineHashtags),
    JSON.stringify(allTags),
    body?.media !== undefined ? JSON.stringify(body.media) : post.media,
    id
  ).run();

  await writeAuditLog(env, 'update', 'social_post', String(id), content.slice(0, 80));
  const updated = await env.DB.prepare('SELECT * FROM social_posts WHERE id = ?').bind(id).first();
  return json(hydrateSocialPost(updated));
});

/* Admin: delete post */
router.delete('/api/blog/posts/:id', authMiddleware, async (request, env) => {
  const id = parseInt(request.params.id);
  const post = await env.DB.prepare('SELECT * FROM social_posts WHERE id = ?').bind(id).first();
  if (!post) return error(404, 'Post not found');
  /* Delete replies too */
  await env.DB.prepare('DELETE FROM social_posts WHERE reply_to = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM social_posts WHERE id = ?').bind(id).run();
  /* Decrement parent reply_count if this was a reply */
  if (post.reply_to) {
    await env.DB.prepare('UPDATE social_posts SET reply_count = MAX(0, reply_count - 1) WHERE id = ?').bind(post.reply_to).run();
  }
  await writeAuditLog(env, 'delete', 'social_post', String(id), (post.content || '').slice(0, 80));
  return json({ ok: true });
});

/* Admin: pin / unpin post */
router.put('/api/blog/posts/:id/pin', authMiddleware, async (request, env) => {
  const id   = parseInt(request.params.id);
  const body = await request.json();
  const pinned = body?.pinned ? 1 : 0;
  await env.DB.prepare('UPDATE social_posts SET pinned = ? WHERE id = ?').bind(pinned, id).run();
  return json({ ok: true, pinned });
});

/* Admin: feature / unfeature post */
router.put('/api/blog/posts/:id/feature', authMiddleware, async (request, env) => {
  const id   = parseInt(request.params.id);
  const body = await request.json();
  const featured = body?.featured ? 1 : 0;
  await env.DB.prepare('UPDATE social_posts SET featured = ? WHERE id = ?').bind(featured, id).run();
  return json({ ok: true, featured });
});

/* Admin: list all posts (including unpublished/replies) */
router.get('/api/admin/blog/posts', authMiddleware, async (request, env) => {
  const page   = Math.max(1, parseInt(request.query?.page  || '1'));
  const limit  = Math.min(100, Math.max(1, parseInt(request.query?.limit || '20')));
  const search = (request.query?.search || '').trim().slice(0, 200);
  const tag    = (request.query?.tag || '').trim().slice(0, 64);
  const from   = (request.query?.from || '').trim().slice(0, 20);
  const to     = (request.query?.to   || '').trim().slice(0, 20);
  const offset = (page - 1) * limit;

  let where = 'WHERE reply_to IS NULL';
  const binds = [];
  if (search) { where += ' AND content LIKE ?'; binds.push('%' + search + '%'); }
  if (tag)    { const p = '%"' + tag.replace(/"/g, '') + '"%'; where += ' AND (tags LIKE ? OR hashtags LIKE ?)'; binds.push(p, p); }
  if (from)   { where += ' AND created_at >= ?'; binds.push(from); }
  if (to)     { where += ' AND created_at <= ?'; binds.push(to + 'T23:59:59'); }

  const [countRow, { results }] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as cnt FROM social_posts ' + where).bind(...binds).first(),
    env.DB.prepare('SELECT * FROM social_posts ' + where + ' ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(...binds, limit, offset).all(),
  ]);
  return json({ posts: results.map(hydrateSocialPost), total: countRow?.cnt || 0, page, limit });
});

/* Portfolio sync: returns social posts whose tags match portfolio section mapping */
router.get('/api/portfolio/sync', async (request, env) => {
  /* Load configurable tag→section mapping from DB, fall back to defaults */
  let TAG_MAP = { project: 'projects', achievement: 'achievements', gallery: 'gallery', media: 'media' };
  try {
    const { results: configRows } = await env.DB.prepare('SELECT tag, section FROM blog_sync_config WHERE enabled = 1').all();
    if (configRows.length) {
      TAG_MAP = {};
      configRows.forEach(r => { TAG_MAP[r.tag] = r.section; });
    }
  } catch {}

  const { results } = await env.DB.prepare(
    'SELECT * FROM social_posts WHERE reply_to IS NULL ORDER BY created_at DESC LIMIT 200'
  ).all();

  const synced = {};
  Object.values(TAG_MAP).forEach(s => { if (!synced[s]) synced[s] = []; });

  results.forEach(row => {
    const post = hydrateSocialPost(row);
    const allTags = [...post.tags, ...post.hashtags];
    allTags.forEach(t => {
      const section = TAG_MAP[t.toLowerCase()];
      if (section) synced[section].push(post);
    });
  });

  /* Also include featured posts as highlights */
  const featured = results.filter(r => r.featured).map(hydrateSocialPost);
  return json({ synced, featured, tag_map: TAG_MAP });
});

/* ── Blog media upload ── */
router.post('/api/blog/media/upload', authMiddleware, async (request, env) => {
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('multipart/form-data')) return error(400, 'Multipart form data required');

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || !file.name) return error(400, 'File is required');

  const postId = formData.get('post_id') || null;

  /* Validate size (20MB max for video, 10MB for images) */
  const isVideo = file.type.startsWith('video/');
  const maxSize = isVideo ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize) return error(400, `File too large (max ${isVideo ? '20' : '10'}MB)`);

  /* Validate MIME */
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
    'video/mp4', 'video/webm', 'video/quicktime',
  ];
  if (!allowedMimes.includes(file.type)) return error(400, `Type ${file.type} not allowed`);

  /* Determine type and R2 path: blog/images/YYYY/MM/ or blog/videos/YYYY/MM/ */
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm   = String(now.getUTCMonth() + 1).padStart(2, '0');
  let mediaType = 'image';
  if (file.type.startsWith('video/')) mediaType = 'video';
  else if (file.type === 'image/gif') mediaType = 'gif';

  const typeFolder = mediaType === 'video' ? 'videos' : mediaType === 'gif' ? 'gifs' : 'images';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${Date.now()}_${safeName}`;
  const r2Key = `blog/${typeFolder}/${yyyy}/${mm}/${uniqueName}`;

  /* Upload to R2 */
  const arrayBuffer = await file.arrayBuffer();
  await env.MEDIA.put(r2Key, arrayBuffer, {
    httpMetadata: { contentType: file.type },
  });

  const url = `${env.R2_PUBLIC_URL}/${r2Key}`;

  /* Store metadata */
  const width  = parseInt(formData.get('width')  || '0');
  const height = parseInt(formData.get('height') || '0');
  await env.DB.prepare(
    'INSERT INTO blog_media (filename, r2_key, url, type, size_bytes, width, height, mime_type, post_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(safeName, r2Key, url, mediaType, file.size, width, height, file.type, postId).run();

  const media = await env.DB.prepare('SELECT * FROM blog_media WHERE r2_key = ?').bind(r2Key).first();
  return json(media, { status: 201 });
});

/* Blog media list */
router.get('/api/blog/media', authMiddleware, async (request, env) => {
  const page  = Math.max(1, parseInt(request.query?.page || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(request.query?.limit || '30')));
  const type  = (request.query?.type || '').trim();
  const search = (request.query?.search || '').trim().slice(0, 200);
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const binds = [];
  if (type && ['image', 'video', 'gif'].includes(type)) { where += ' AND type = ?'; binds.push(type); }
  if (search) { where += ' AND filename LIKE ?'; binds.push('%' + search + '%'); }

  const [countRow, { results }] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as cnt FROM blog_media ' + where).bind(...binds).first(),
    env.DB.prepare('SELECT * FROM blog_media ' + where + ' ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(...binds, limit, offset).all(),
  ]);
  return json({ media: results, total: countRow?.cnt || 0, page, limit });
});

/* Delete blog media */
router.delete('/api/blog/media/:id', authMiddleware, async (request, env) => {
  const id = parseInt(request.params.id);
  const media = await env.DB.prepare('SELECT * FROM blog_media WHERE id = ?').bind(id).first();
  if (!media) return error(404, 'Media not found');
  try { await env.MEDIA.delete(media.r2_key); } catch {}
  await env.DB.prepare('DELETE FROM blog_media WHERE id = ?').bind(id).run();
  return json({ ok: true });
});

/* Public: user profile posts */
router.get('/api/blog/user/:author', async (request, env) => {
  const author = decodeURIComponent(request.params.author);
  const page   = Math.max(1, parseInt(request.query?.page || '1'));
  const limit  = Math.min(50, Math.max(1, parseInt(request.query?.limit || '10')));
  const offset = (page - 1) * limit;

  const [countRow, { results }] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as cnt FROM social_posts WHERE reply_to IS NULL AND author = ?').bind(author).first(),
    env.DB.prepare('SELECT * FROM social_posts WHERE reply_to IS NULL AND author = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(author, limit, offset).all(),
  ]);

  /* Aggregate stats */
  const statsRow = await env.DB.prepare(
    'SELECT COUNT(*) as total_posts, SUM(reply_count) as total_replies FROM social_posts WHERE author = ? AND reply_to IS NULL'
  ).bind(author).first();

  /* Get author info from most recent post */
  const latest = results[0] ? hydrateSocialPost(results[0]) : null;
  return json({
    author: { name: author, avatar: latest?.author_avatar || '', bio: latest?.author_bio || '' },
    stats: { posts: statsRow?.total_posts || 0, replies: statsRow?.total_replies || 0 },
    posts: results.map(hydrateSocialPost),
    total: countRow?.cnt || 0, page, limit,
  });
});

/* Admin: sync config management */
router.get('/api/admin/blog/sync-config', authMiddleware, async (request, env) => {
  const { results } = await env.DB.prepare('SELECT * FROM blog_sync_config ORDER BY tag').all();
  return json({ config: results });
});

router.put('/api/admin/blog/sync-config', authMiddleware, async (request, env) => {
  const body = await request.json();
  const mappings = body?.mappings;
  if (!Array.isArray(mappings)) return error(400, 'mappings array required');

  /* Replace all mappings */
  await env.DB.prepare('DELETE FROM blog_sync_config').run();
  for (const m of mappings) {
    if (!m.tag || !m.section) continue;
    const tag     = sanitizeText(m.tag, 50);
    const section = sanitizeText(m.section, 50);
    const enabled = m.enabled !== false ? 1 : 0;
    await env.DB.prepare('INSERT INTO blog_sync_config (tag, section, enabled) VALUES (?, ?, ?)').bind(tag, section, enabled).run();
  }
  const { results } = await env.DB.prepare('SELECT * FROM blog_sync_config ORDER BY tag').all();
  return json({ ok: true, config: results });
});

// ────────────────────────────────────────────────────────────
// 404 fallback
// ────────────────────────────────────────────────────────────

router.all('*', () => error(404, 'Not found'));

// ────────────────────────────────────────────────────────────
// Export
// ────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const response = await router.fetch(request, env, ctx);
    return corsify(response, env, request);
  },
};
