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

function getCorsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function corsify(response, env) {
  const headers = getCorsHeaders(env);
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(headers)) {
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
  return new Response(null, { status: 204, headers: getCorsHeaders(env) });
});

// ────────────────────────────────────────────────────────────
// AUTH ROUTES
// ────────────────────────────────────────────────────────────

router.post('/api/auth/login', async (request, env) => {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimited = await checkRateLimit(env.DB, ip);
  if (rateLimited) return error(429, 'Too many login attempts. Try again in 15 minutes.');

  const { username, password } = await request.json();
  if (!username || !password) return error(400, 'Username and password required');

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

router.post('/api/auth/change-password', authMiddleware, async (request, env) => {
  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) return error(400, 'Current and new password required');
  if (newPassword.length < 8) return error(400, 'Password must be at least 8 characters');

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

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  // Always return success to prevent email enumeration
  if (!user) return json({ success: true, message: 'If that email exists, a reset link has been sent.' });

  // Generate token
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = base64UrlEncode(tokenBytes);
  const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  await env.DB.prepare(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).bind(user.id, token, expiresAt).run();

  // Send email via EmailJS
  const resetUrl = `${env.ADMIN_ORIGIN}/admin/#reset?token=${token}`;
  try {
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: env.EMAILJS_SERVICE_ID,
        template_id: env.EMAILJS_TEMPLATE_ID,
        user_id: env.EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: user.email,
          from_name: 'Carlo Portfolio Admin',
          subject: 'Password Reset Request',
          message: `Click this link to reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour.`,
        },
      }),
    });
  } catch (e) {
    // Log but don't expose email sending errors
    console.error('Failed to send reset email:', e);
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
  const { value } = await request.json();
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  await env.DB.prepare(
    'INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
  ).bind(key, serialized).run();
  return json({ success: true });
});

router.put('/api/settings', authMiddleware, async (request, env) => {
  const settings = await request.json();
  const stmt = env.DB.prepare(
    'INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
  );
  const batch = [];
  for (const [key, value] of Object.entries(settings)) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    batch.push(stmt.bind(key, serialized));
  }
  if (batch.length) await env.DB.batch(batch);
  return json({ success: true });
});

// ────────────────────────────────────────────────────────────
// GENERIC CRUD HELPERS
// ────────────────────────────────────────────────────────────

function crudRoutes(router, path, table, options = {}) {
  const { orderBy = 'sort_order', parentKey, allowedFields } = options;

  // LIST
  router.get(`/api/${path}`, authMiddleware, async (request, env) => {
    let query = `SELECT * FROM ${table}`;
    const params = [];
    if (parentKey && request.query[parentKey]) {
      query += ` WHERE ${parentKey} = ?`;
      params.push(request.query[parentKey]);
    }
    query += ` ORDER BY ${orderBy}`;
    const { results } = params.length
      ? await env.DB.prepare(query).bind(...params).all()
      : await env.DB.prepare(query).all();
    return json(results);
  });

  // GET ONE
  router.get(`/api/${path}/:id`, authMiddleware, async (request, env) => {
    const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(request.params.id).first();
    if (!row) return error(404, 'Not found');
    return json(row);
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

    const result = await env.DB.prepare(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`
    ).bind(...values).run();

    const inserted = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(result.meta.last_row_id).first();
    return json(inserted, { status: 201 });
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

    await env.DB.prepare(`UPDATE ${table} SET ${sets} WHERE id = ?`).bind(...values).run();
    const updated = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(request.params.id).first();
    return json(updated);
  });

  // DELETE
  router.delete(`/api/${path}/:id`, authMiddleware, async (request, env) => {
    await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(request.params.id).run();
    return json({ success: true });
  });

  // REORDER
  router.put(`/api/${path}/reorder`, authMiddleware, async (request, env) => {
    const { items } = await request.json(); // [{ id, sort_order }]
    if (!Array.isArray(items)) return error(400, 'items array required');
    const stmt = env.DB.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`);
    const batch = items.map(item => stmt.bind(item.sort_order, item.id));
    if (batch.length) await env.DB.batch(batch);
    return json({ success: true });
  });
}

// Register CRUD routes for all content tables
crudRoutes(router, 'sections', 'sections', {
  allowedFields: ['id', 'title', 'nav_icon', 'nav_label', 'sort_order', 'visible', 'type', 'config'],
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
crudRoutes(router, 'projects', 'projects', {
  allowedFields: ['title', 'description', 'thumbnail_path', 'gallery_type', 'gallery_folder', 'tags', 'sort_order'],
});
crudRoutes(router, 'socials', 'socials', {
  allowedFields: ['platform', 'url', 'icon', 'label', 'sort_order'],
});

// ────────────────────────────────────────────────────────────
// MEDIA ENDPOINTS
// ────────────────────────────────────────────────────────────

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
// PUBLIC GALLERY ENDPOINT (replaces GitHub Contents API)
// ────────────────────────────────────────────────────────────

router.get('/api/gallery/:folder', async (request, env) => {
  const folder = request.params.folder;
  const allowedFolders = ['layout', 'videos', 'profile', 'thumbnail'];
  if (!allowedFolders.includes(folder)) return error(400, 'Invalid folder');

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

    const projects = projectsRes.results.map(p => ({
      ...p,
      tags: safeParseJson(p.tags, []),
      skills: safeParseJson(p.skills, []),
      thumbnail_url: p.thumbnail_path ? `${r2Base}/${p.thumbnail_path.split('/').map(encodeURIComponent).join('/')}` : null,
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

    // Assemble config
    const siteConfig = {
      publishedAt: new Date().toISOString(),
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
    };

    // Write to R2
    await env.MEDIA.put('site-config.json', JSON.stringify(siteConfig, null, 2), {
      httpMetadata: {
        contentType: 'application/json',
        cacheControl: 'no-cache, no-store, must-revalidate',
      },
    });

    return json({ success: true, publishedAt: siteConfig.publishedAt });
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
// 404 fallback
// ────────────────────────────────────────────────────────────

router.all('*', () => error(404, 'Not found'));

// ────────────────────────────────────────────────────────────
// Export
// ────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const response = await router.fetch(request, env, ctx);
    return corsify(response, env);
  },
};
