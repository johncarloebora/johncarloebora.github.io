/* ============================================================
   Blog Admin Panel — Standalone Script
   Separate system from Portfolio Admin.
   Auth: sessionStorage.admin_token (same as portfolio admin login).
   ============================================================ */
'use strict';

/* ── Config ──────────────────────────────────────────────── */
const BA_API = 'https://carlo-portfolio-api.johncarloebora.workers.dev';

/* ── Auth ────────────────────────────────────────────────── */
function getToken() {
  return sessionStorage.getItem('admin_token') || '';
}

(function checkAuth() {
  if (!getToken()) {
    window.location.href = '../index.html';
  }
})();

/* ── API ─────────────────────────────────────────────────── */
const API = {
  async request(path, opts = {}) {
    const token = getToken();
    if (!token) { window.location.href = '../index.html'; throw new Error('Not authenticated'); }

    const headers = { ...opts.headers };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';

    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 15000);

    let res;
    try {
      res = await fetch(BA_API + path, { ...opts, headers, signal: ctrl.signal });
    } catch (e) {
      clearTimeout(tid);
      if (e.name === 'AbortError') throw new Error('Request timed out');
      throw new Error('Network error');
    } finally {
      clearTimeout(tid);
    }

    if (res.status === 401) {
      sessionStorage.removeItem('admin_token');
      window.location.href = '../index.html';
      throw new Error('Session expired');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
    return data;
  },
  get(p)    { return this.request(p); },
  post(p,b) { return this.request(p, { method:'POST', body: JSON.stringify(b) }); },
  put(p,b)  { return this.request(p, { method:'PUT',  body: JSON.stringify(b) }); },
  del(p)    { return this.request(p, { method:'DELETE' }); },
};

/* ── Utilities ───────────────────────────────────────────── */
function esc(s) {
  const d = document.createElement('div');
  d.textContent = String(s || '');
  return d.innerHTML;
}

function relTime(ts) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return Math.floor(diff/60)   + 'm ago';
  if (diff < 86400)  return Math.floor(diff/3600)  + 'h ago';
  if (diff < 604800) return Math.floor(diff/86400) + 'd ago';
  return new Date(ts).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
}

function toast(msg, type = 'info') {
  const el  = document.createElement('div');
  el.className = 'ba-toast ' + type;
  const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
  el.innerHTML = '<i class="fas ' + icon + '"></i><span>' + esc(msg) + '</span>';
  const c = document.getElementById('baToastContainer');
  if (c) {
    c.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 3500);
  }
}

function debounce(fn, delay) {
  let t;
  return function(...args) { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function compressImage(file) {
  const MAX = 1400, Q = 0.82;
  return new Promise(resolve => {
    if (file.type === 'image/gif' || file.type.startsWith('video/')) { resolve(file); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w <= MAX && h <= MAX) { resolve(file); return; }
        const r = Math.min(MAX/w, MAX/h);
        w = Math.round(w*r); h = Math.round(h*r);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => resolve(blob ? new File([blob], file.name, {type:file.type}) : file), file.type, Q);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* XHR upload with progress */
function xhrUpload(file, onProgress) {
  return new Promise((resolve, reject) => {
    compressImage(file).then(compressed => {
      const fd  = new FormData();
      fd.append('file', compressed);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', BA_API + '/api/blog/media/upload');
      xhr.setRequestHeader('Authorization', 'Bearer ' + getToken());
      if (onProgress) {
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
        });
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          try { reject(new Error(JSON.parse(xhr.responseText).error || 'Upload failed')); }
          catch { reject(new Error('Upload failed')); }
        }
      };
      xhr.onerror  = () => reject(new Error('Network error'));
      xhr.onabort  = () => reject(new Error('Upload cancelled'));
      xhrUpload._abort = () => xhr.abort();
      xhr.send(fd);
    });
  });
}

/* ============================================================
   VIEW ROUTER
   ============================================================ */
const views = ['posts', 'media', 'sync'];

function showView(name) {
  views.forEach(v => {
    const sec  = document.getElementById('view-' + v);
    const link = document.querySelector('[data-view="' + v + '"]');
    if (sec)  sec.classList.toggle('active', v === name);
    if (link) link.classList.toggle('active', v === name);
  });
  if (name === 'posts')  loadPosts();
  if (name === 'media')  loadMedia(1, '', '');
  if (name === 'sync')   loadSyncConfig();
  window.location.hash = name;
}

/* ============================================================
   SIDEBAR STATS
   ============================================================ */
async function loadStats() {
  try {
    const [postsData, mediaData] = await Promise.all([
      API.get('/api/admin/blog/posts?page=1&limit=1'),
      API.get('/api/blog/media?page=1&limit=1'),
    ]);
    const tp = document.getElementById('stTotalPosts');
    const tm = document.getElementById('stTotalMedia');
    if (tp) tp.textContent = postsData.total || 0;
    if (tm) tm.textContent = mediaData.total  || 0;
  } catch {}
}

/* ============================================================
   POSTS VIEW
   ============================================================ */
const _posts = { page: 1, limit: 20, total: 0, items: [], search: '', tag: '', from: '', to: '' };

async function loadPosts() {
  const container = document.getElementById('postsList');
  if (!container) return;
  container.innerHTML = '<div class="ba-loading"><i class="fas fa-spinner fa-spin"></i> Loading posts…</div>';

  try {
    const params = new URLSearchParams({ page: _posts.page, limit: _posts.limit });
    if (_posts.search) params.set('search', _posts.search);
    if (_posts.tag)    params.set('tag',    _posts.tag);
    if (_posts.from)   params.set('from',   _posts.from);
    if (_posts.to)     params.set('to',     _posts.to);

    const data = await API.get('/api/admin/blog/posts?' + params);
    _posts.items = data.posts || [];
    _posts.total = data.total || 0;

    renderPostsList(container);
    loadTagFilterOptions();
  } catch (err) {
    container.innerHTML = '<div class="ba-empty"><i class="fas fa-exclamation-triangle"></i><p>' + esc(err.message) + '</p></div>';
  }
}

async function loadTagFilterOptions() {
  try {
    const data = await API.get('/api/blog/tags');
    const sel  = document.getElementById('postTagFilter');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">All tags</option>'
      + (data.tags || []).map(t => '<option value="' + esc(t.tag) + '"' + (t.tag === current ? ' selected' : '') + '>#' + esc(t.tag) + ' (' + t.count + ')</option>').join('');
  } catch {}
}

function renderPostsList(container) {
  const { items, total, page, limit } = _posts;

  if (!items.length) {
    container.innerHTML = '<div class="ba-empty"><i class="fas fa-newspaper"></i><p>No posts found.</p><p>Create your first post with the button above.</p></div>';
    return;
  }

  let html = '<div class="ba-post-list">';
  for (const post of items) {
    const tags  = Array.isArray(post.tags)  ? post.tags  : [];
    const media = Array.isArray(post.media) ? post.media : [];
    const preview = (post.content || '').slice(0, 240) + ((post.content||'').length > 240 ? '…' : '');

    const badges = [
      post.pinned   ? '<span class="ba-post-badge ba-badge-pin"><i class="fas fa-thumbtack"></i> Pinned</span>'   : '',
      post.featured ? '<span class="ba-post-badge ba-badge-feat"><i class="fas fa-star"></i> Featured</span>' : '',
      post.reply_to ? '<span class="ba-post-badge ba-badge-reply"><i class="fas fa-reply"></i> Reply</span>'  : '',
    ].filter(Boolean).join('');

    html += '<div class="ba-post-card' + (post.pinned ? ' pinned' : '') + (post.featured ? ' featured' : '') + '" id="bpc-' + post.id + '">'
      + '<div class="ba-post-card-top">'
      +   '<div class="ba-post-card-body">'
      +     '<div class="ba-post-card-author">'
      +       esc(post.author) + ' · ' + relTime(post.created_at)
      +       (post.location ? ' · <i class="fas fa-map-marker-alt"></i> ' + esc(post.location) : '')
      +       (badges ? ' ' + badges : '')
      +     '</div>'
      +     '<div class="ba-post-text">' + esc(preview) + '</div>'
      +     (tags.length ? '<div class="ba-post-tags">' + tags.map(t => '<span class="tag">#' + esc(t) + '</span>').join('') + '</div>' : '')
      +     (media.length ? '<div class="ba-post-media-hint"><i class="fas fa-paperclip"></i> ' + media.length + ' media · <a href="../../blog/#/post/' + post.id + '" target="_blank">View on Blog →</a></div>' : '')
      +     (post.reply_count > 0 ? '<div class="ba-post-media-hint"><i class="fas fa-comment"></i> ' + post.reply_count + ' repl' + (post.reply_count===1?'y':'ies') + '</div>' : '')
      +   '</div>'
      + '</div>'
      + '<div class="ba-post-card-actions">'
      +   '<button class="btn btn-secondary btn-sm" onclick="editPost(' + post.id + ')"><i class="fas fa-pen"></i> Edit</button>'
      +   '<button class="btn btn-secondary btn-sm" onclick="togglePin(' + post.id + ',' + (post.pinned?0:1) + ')">'
      +     '<i class="fas fa-thumbtack"></i> ' + (post.pinned ? 'Unpin' : 'Pin') + '</button>'
      +   '<button class="btn btn-secondary btn-sm" onclick="toggleFeature(' + post.id + ',' + (post.featured?0:1) + ')">'
      +     '<i class="fas fa-star"></i> ' + (post.featured ? 'Unfeature' : 'Feature') + '</button>'
      +   '<a href="../../blog/#/post/' + post.id + '" target="_blank" class="btn btn-secondary btn-sm" title="View on Blog"><i class="fas fa-external-link-alt"></i></a>'
      +   '<button class="btn btn-danger btn-sm" onclick="deletePost(' + post.id + ')"><i class="fas fa-trash"></i> Delete</button>'
      + '</div>'
      + '</div>';
  }
  html += '</div>';

  /* Pagination */
  const totalPages = Math.ceil(total / limit);
  if (totalPages > 1) {
    html += '<div class="ba-pagination-row">'
      + '<span>' + total + ' posts total</span>'
      + '<div style="display:flex;gap:8px;align-items:center">'
      + (page > 1 ? '<button class="btn btn-secondary btn-sm" onclick="postsPageNav(' + (page-1) + ')">← Prev</button>' : '')
      + '<span>Page ' + page + ' / ' + totalPages + '</span>'
      + (page < totalPages ? '<button class="btn btn-secondary btn-sm" onclick="postsPageNav(' + (page+1) + ')">Next →</button>' : '')
      + '</div></div>';
  }

  container.innerHTML = html;
}

window.postsPageNav = p => { _posts.page = p; loadPosts(); };

window.togglePin = async (id, val) => {
  try {
    await API.put('/api/blog/posts/' + id + '/pin', { pinned: !!val });
    toast(val ? 'Post pinned' : 'Post unpinned', 'success');
    loadPosts();
  } catch (e) { toast(e.message, 'error'); }
};

window.toggleFeature = async (id, val) => {
  try {
    await API.put('/api/blog/posts/' + id + '/feature', { featured: !!val });
    toast(val ? 'Post featured' : 'Post unfeatured', 'success');
    loadPosts();
  } catch (e) { toast(e.message, 'error'); }
};

window.deletePost = async id => {
  if (!confirm('Delete this post and all its replies? This cannot be undone.')) return;
  try {
    await API.del('/api/blog/posts/' + id);
    toast('Post deleted', 'success');
    loadPosts();
    loadStats();
  } catch (e) { toast(e.message, 'error'); }
};

/* ============================================================
   POST EDITOR
   ============================================================ */
const _editor = {
  post:         null,      /* null = new */
  media:        [],        /* { file?, url, type, uploaded } */
  uploadAbort:  null,
  uploading:    false,
};

function openEditor(postId) {
  _editor.post        = null;
  _editor.media       = [];
  _editor.uploadAbort = null;
  _editor.uploading   = false;

  const modal = document.getElementById('editorModal');
  if (!modal) return;

  /* Reset fields */
  document.getElementById('edContent').value  = '';
  document.getElementById('edLocation').value = '';
  document.getElementById('editorTitle').textContent = 'New Post';
  document.getElementById('edSubmitBtn').innerHTML = '<i class="fas fa-paper-plane"></i> Publish';
  renderEditorMedia();
  updateEditorPreview();
  document.getElementById('edUploadRow').style.display = 'none';

  modal.style.display = '';
  document.body.style.overflow = 'hidden';

  if (postId) {
    document.getElementById('editorTitle').textContent = 'Loading…';
    API.get('/api/blog/posts/' + postId + '/thread')
      .then(data => {
        const p = data.post;
        _editor.post = p;
        document.getElementById('edContent').value  = p.content  || '';
        document.getElementById('edLocation').value = p.location || '';
        document.getElementById('editorTitle').textContent = 'Edit Post';
        document.getElementById('edSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Save';
        if (Array.isArray(p.media)) {
          _editor.media = p.media.map(m => ({ url: m.url, type: m.type || 'image', uploaded: true }));
        }
        renderEditorMedia();
        updateEditorPreview();
      })
      .catch(e => { toast(e.message, 'error'); closeEditor(); });
  } else {
    setTimeout(() => document.getElementById('edContent').focus(), 50);
  }
}

window.editPost = id => openEditor(id);

function closeEditor() {
  document.getElementById('editorModal').style.display = 'none';
  document.body.style.overflow = '';
  _editor.media       = [];
  _editor.post        = null;
  _editor.uploadAbort = null;
  _editor.uploading   = false;
}

function updateEditorPreview() {
  const content = (document.getElementById('edContent')?.value || '').trim();
  const previewText = document.getElementById('edPreviewText');
  const previewTags = document.getElementById('edPreviewTags');
  const previewMedia = document.getElementById('edPreviewMedia');

  if (previewText) {
    previewText.textContent = content || 'Your post will appear here…';
  }

  /* Tags */
  if (previewTags) {
    const tags = [...new Set((content.match(/#(\w+)/g) || []).map(h => h.slice(1)))];
    previewTags.innerHTML = tags.map(t => '<span class="tag">#' + esc(t) + '</span>').join(' ');
  }

  /* Tag preview in editor */
  const tagPrev = document.getElementById('edTagPreview');
  if (tagPrev) {
    const tags = [...new Set((content.match(/#(\w+)/g) || []).map(h => h.slice(1)))];
    if (tags.length) {
      tagPrev.style.display = 'flex';
      tagPrev.innerHTML = '<i class="fas fa-tags"></i> ' + tags.map(t => '<span class="tag">#' + esc(t) + '</span>').join(' ');
    } else {
      tagPrev.style.display = 'none';
    }
  }

  /* Char count */
  const charCount = document.getElementById('edCharCount');
  if (charCount) charCount.textContent = content.length;

  /* Media preview (first item only) */
  if (previewMedia && _editor.media.length) {
    const m = _editor.media[0];
    const isVid = m.type === 'video' || /\.(mp4|webm|mov)$/i.test(m.url || '');
    previewMedia.innerHTML = isVid
      ? '<video src="' + esc(m.url) + '" muted playsinline style="max-width:100%;border-radius:6px"></video>'
      : '<img src="' + esc(m.url) + '" alt="" style="max-width:100%;border-radius:6px">';
  } else if (previewMedia) {
    previewMedia.innerHTML = '';
  }
}

function renderEditorMedia() {
  const grid = document.getElementById('edMediaGrid');
  if (!grid) return;
  if (!_editor.media.length) { grid.innerHTML = ''; return; }
  grid.innerHTML = _editor.media.map((m, i) => {
    const isVid = m.type === 'video' || /\.(mp4|webm|mov)$/i.test(m.url || '');
    const thumb = isVid
      ? '<video src="' + esc(m.url) + '" muted playsinline style="width:100%;height:100%;object-fit:cover"></video>'
      : '<img src="' + esc(m.url) + '" alt="" style="width:100%;height:100%;object-fit:cover">';
    const badge = !m.uploaded && m.file
      ? '<div style="position:absolute;bottom:3px;left:3px;background:rgba(0,0,0,.7);color:#fff;padding:1px 5px;border-radius:6px;font-size:.6rem"><i class="fas fa-spinner fa-spin"></i></div>'
      : '';
    return '<div class="ba-ed-media-thumb">'
      + thumb + badge
      + '<button class="ba-ed-media-del" onclick="removeEdMedia(' + i + ')"><i class="fas fa-times"></i></button>'
      + '</div>';
  }).join('');
}

window.removeEdMedia = idx => {
  _editor.media.splice(idx, 1);
  renderEditorMedia();
  updateEditorPreview();
};

function handleEditorFiles(files, type) {
  let arr = Array.from(files);
  const maxNew = type === 'image' ? Math.max(0, 4 - _editor.media.filter(m => m.type !== 'video').length) : 1;
  arr = arr.slice(0, maxNew);
  if (!arr.length) { toast('Media limit reached', 'info'); return; }

  arr.forEach(file => {
    const url = URL.createObjectURL(file);
    _editor.media.push({ file, url, type, uploaded: false });
  });
  renderEditorMedia();
  uploadEditorMedia();
}

function uploadEditorMedia() {
  const queue = _editor.media.filter(m => !m.uploaded && m.file);
  if (!queue.length) return;

  const row   = document.getElementById('edUploadRow');
  const bar   = document.getElementById('edUploadBar');
  const label = document.getElementById('edUploadLabel');
  if (row) row.style.display = 'flex';
  _editor.uploading = true;

  let idx = 0;
  const next = () => {
    if (idx >= queue.length) {
      if (row) row.style.display = 'none';
      if (bar) bar.style.width  = '0%';
      _editor.uploading   = false;
      _editor.uploadAbort = null;
      return;
    }
    const item = queue[idx];
    if (label) label.textContent = 'Uploading ' + (idx+1) + ' of ' + queue.length + '…';

    xhrUpload(item.file, pct => { if (bar) bar.style.width = pct + '%'; })
      .then(result => {
        const found = _editor.media.find(m => m.file === item.file);
        if (found) { URL.revokeObjectURL(found.url); found.url = result.url; found.uploaded = true; delete found.file; }
        renderEditorMedia();
        updateEditorPreview();
        idx++; next();
      })
      .catch(err => {
        if (err.message !== 'Upload cancelled') toast('Upload failed: ' + err.message, 'error');
        if (row) row.style.display = 'none';
        _editor.uploading   = false;
        _editor.uploadAbort = null;
      });
  };
  next();
}

/* ── Submit Post ─────────────────────────────────────────── */
async function submitEditor() {
  const ta  = document.getElementById('edContent');
  const loc = document.getElementById('edLocation');
  const btn = document.getElementById('edSubmitBtn');

  const content  = (ta?.value || '').trim();
  const location = (loc?.value || '').trim();
  if (!content) { toast('Content is required', 'error'); return; }
  if (_editor.uploading || _editor.media.some(m => !m.uploaded && m.file)) {
    toast('Wait for uploads to finish', 'info'); return;
  }

  const media = _editor.media.map(m => ({ url: m.url, type: m.type }));
  const tags  = [...new Set((content.match(/#(\w+)/g) || []).map(h => h.slice(1)))];
  const body  = { content, location, media, tags };

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting…'; }

  try {
    if (_editor.post) {
      await API.put('/api/blog/posts/' + _editor.post.id, body);
      toast('Post updated!', 'success');
    } else {
      await API.post('/api/blog/posts', body);
      toast('Post published!', 'success');
    }
    closeEditor();
    _posts.page = 1;
    loadPosts();
    loadStats();
  } catch (err) {
    toast(err.message, 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = _editor.post ? '<i class="fas fa-save"></i> Save' : '<i class="fas fa-paper-plane"></i> Publish'; }
  }
}

/* ============================================================
   MEDIA VIEW
   ============================================================ */
const _media = { page: 1, limit: 30, total: 0, type: '', search: '' };

async function loadMedia(page, type, search) {
  _media.page   = page   || _media.page;
  _media.type   = type   !== undefined ? type   : _media.type;
  _media.search = search !== undefined ? search : _media.search;

  const grid = document.getElementById('mediaGrid');
  const pag  = document.getElementById('mediaPagination');
  if (!grid) return;
  grid.innerHTML = '<div class="ba-loading" style="grid-column:1/-1"><i class="fas fa-spinner fa-spin"></i> Loading…</div>';

  try {
    const params = new URLSearchParams({ page: _media.page, limit: _media.limit });
    if (_media.type)   params.set('type',   _media.type);
    if (_media.search) params.set('search', _media.search);

    const data  = await API.get('/api/blog/media?' + params);
    const items = data.media  || [];
    _media.total = data.total || 0;

    if (!items.length) {
      grid.innerHTML = '<div class="ba-empty" style="grid-column:1/-1"><i class="fas fa-photo-video"></i><p>No media yet.</p><p>Upload files using the button above.</p></div>';
    } else {
      grid.innerHTML = items.map(m => {
        const isVid = m.type === 'video';
        const thumb = isVid
          ? '<video src="' + esc(m.url) + '" muted preload="metadata" style="width:100%;height:100%;object-fit:cover"></video><div class="ba-media-video-badge"><i class="fas fa-play"></i></div>'
          : '<img src="' + esc(m.url) + '" alt="' + esc(m.filename) + '" loading="lazy" style="width:100%;height:100%;object-fit:cover">';
        return '<div class="ba-media-item">'
          + '<div class="ba-media-thumb" title="' + esc(m.filename) + '">' + thumb + '</div>'
          + '<div class="ba-media-filename">' + esc(m.filename) + '</div>'
          + '<button class="btn btn-danger btn-sm" style="width:100%;margin-top:4px;font-size:.75rem" onclick="deleteMedia(' + m.id + ')"><i class="fas fa-trash"></i> Delete</button>'
          + '</div>';
      }).join('');
    }

    if (pag) {
      const totalPages = Math.ceil(_media.total / _media.limit);
      pag.innerHTML = totalPages > 1
        ? '<span>' + _media.total + ' files</span><div style="display:flex;gap:8px;align-items:center">'
          + (_media.page > 1 ? '<button class="btn btn-secondary btn-sm" onclick="mediaPageNav(' + (_media.page-1) + ')">← Prev</button>' : '')
          + '<span>Page ' + _media.page + ' / ' + totalPages + '</span>'
          + (_media.page < totalPages ? '<button class="btn btn-secondary btn-sm" onclick="mediaPageNav(' + (_media.page+1) + ')">Next →</button>' : '')
          + '</div>'
        : '<span>' + _media.total + ' file' + (_media.total===1?'':'s') + '</span>';
    }
  } catch (err) {
    grid.innerHTML = '<div class="ba-empty" style="grid-column:1/-1"><i class="fas fa-exclamation-triangle"></i><p>' + esc(err.message) + '</p></div>';
  }
}

window.mediaPageNav = p => loadMedia(p);

window.deleteMedia = async id => {
  if (!confirm('Delete this media file? Cannot be undone.')) return;
  try {
    await API.del('/api/blog/media/' + id);
    toast('Media deleted', 'success');
    loadMedia(1);
    loadStats();
  } catch (e) { toast(e.message, 'error'); }
};

/* ── Bulk Upload ─────────────────────────────────────────── */
async function uploadMediaFiles(files) {
  const progress = document.getElementById('mediaUploadProgress');
  const fill     = document.getElementById('mediaUploadFill');
  const label    = document.getElementById('mediaUploadLabel');
  if (progress) progress.style.display = 'flex';

  const arr = Array.from(files);
  for (let i = 0; i < arr.length; i++) {
    if (label) label.textContent = 'Uploading ' + (i+1) + ' of ' + arr.length + '…';
    try {
      await xhrUpload(arr[i], pct => { if (fill) fill.style.width = pct + '%'; });
    } catch (e) {
      toast('Upload failed: ' + e.message, 'error');
    }
  }
  if (progress) progress.style.display = 'none';
  if (fill) fill.style.width = '0%';
  toast('Upload complete', 'success');
  loadMedia(1);
  loadStats();
}

/* ============================================================
   LIBRARY PICKER (for editor)
   ============================================================ */
const _lp = { page: 1, type: '', search: '' };

function openLibraryPicker() {
  const modal = document.getElementById('libPickerModal');
  if (!modal) return;
  modal.style.display = '';
  document.body.style.overflow = 'hidden';
  loadLibraryPicker(1, '', '');
}

function closeLibraryPicker() {
  const modal = document.getElementById('libPickerModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

async function loadLibraryPicker(page, type, search) {
  _lp.page   = page   !== undefined ? page   : _lp.page;
  _lp.type   = type   !== undefined ? type   : _lp.type;
  _lp.search = search !== undefined ? search : _lp.search;

  const grid = document.getElementById('lpGrid');
  const pag  = document.getElementById('lpPagination');
  if (!grid) return;
  grid.innerHTML = '<div class="ba-loading" style="grid-column:1/-1"><i class="fas fa-spinner fa-spin"></i> Loading…</div>';

  try {
    const params = new URLSearchParams({ page: _lp.page, limit: 30 });
    if (_lp.type)   params.set('type',   _lp.type);
    if (_lp.search) params.set('search', _lp.search);
    const data  = await API.get('/api/blog/media?' + params);
    const items = data.media || [];
    const total = data.total || 0;

    if (!items.length) {
      grid.innerHTML = '<div class="ba-empty" style="grid-column:1/-1"><i class="fas fa-photo-video"></i><p>No media in library.</p></div>';
    } else {
      grid.innerHTML = items.map(m => {
        const isVid = m.type === 'video';
        const thumb = isVid
          ? '<video src="' + esc(m.url) + '" muted preload="metadata" style="width:100%;height:100%;object-fit:cover"></video>'
          : '<img src="' + esc(m.url) + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover">';
        return '<div class="ba-media-item">'
          + '<div class="ba-media-thumb" onclick="pickMedia(\'' + esc(m.url) + '\',\'' + esc(m.type) + '\')">' + thumb + '</div>'
          + '<button class="btn btn-primary btn-sm" style="width:100%;margin-top:4px;font-size:.73rem" onclick="pickMedia(\'' + esc(m.url) + '\',\'' + esc(m.type) + '\')"><i class="fas fa-check"></i> Use</button>'
          + '</div>';
      }).join('');
    }

    if (pag) {
      const totalPages = Math.ceil(total / 30);
      pag.innerHTML = totalPages > 1
        ? '<span>' + total + ' files</span><div style="display:flex;gap:8px;align-items:center">'
          + (_lp.page > 1 ? '<button class="btn btn-secondary btn-sm" onclick="loadLibraryPicker(' + (_lp.page-1) + ')">← Prev</button>' : '')
          + '<span>' + _lp.page + ' / ' + totalPages + '</span>'
          + (_lp.page < totalPages ? '<button class="btn btn-secondary btn-sm" onclick="loadLibraryPicker(' + (_lp.page+1) + ')">Next →</button>' : '')
          + '</div>'
        : '<span>' + total + ' file' + (total===1?'':'s') + '</span>';
    }
  } catch (err) {
    grid.innerHTML = '<div class="ba-empty" style="grid-column:1/-1"><i class="fas fa-exclamation-triangle"></i><p>' + esc(err.message) + '</p></div>';
  }
}

window.pickMedia = (url, type) => {
  _editor.media.push({ url, type: type || 'image', uploaded: true });
  renderEditorMedia();
  updateEditorPreview();
  closeLibraryPicker();
  toast('Media added to post', 'success');
};

/* ============================================================
   SYNC CONFIG VIEW
   ============================================================ */
async function loadSyncConfig() {
  const rows = document.getElementById('syncRows');
  if (!rows) return;
  rows.innerHTML = '<div class="ba-loading"><i class="fas fa-spinner fa-spin"></i> Loading…</div>';

  try {
    const data = await API.get('/api/admin/blog/sync-config');
    rows.innerHTML = '';
    const config = data.config || [];
    if (config.length) {
      config.forEach(c => addSyncRow(c.tag, c.section, c.enabled));
    } else {
      /* Default mappings */
      [['project','projects',true],['achievement','achievements',true],['gallery','gallery',true],['media','media',true]]
        .forEach(([t,s,e]) => addSyncRow(t,s,e));
    }
  } catch (err) {
    rows.innerHTML = '<div class="ba-empty"><i class="fas fa-exclamation-triangle"></i><p>' + esc(err.message) + '</p></div>';
  }
}

function addSyncRow(tag, section, enabled) {
  const rows = document.getElementById('syncRows');
  if (!rows) return;
  const row = document.createElement('div');
  row.className = 'ba-sync-row';
  row.innerHTML = '<input type="text" class="ba-input sync-tag"     placeholder="tag name"   value="' + esc(tag||'') + '">'
    + '<span class="ba-sync-arrow">→</span>'
    + '<input type="text" class="ba-input sync-section" placeholder="section id"  value="' + esc(section||'') + '">'
    + '<label class="ba-sync-enabled-label"><input type="checkbox" class="sync-enabled" ' + (enabled!==false?'checked':'') + '> Enabled</label>'
    + '<button class="ba-sync-del" onclick="this.closest(\'.ba-sync-row\').remove()" title="Remove"><i class="fas fa-trash"></i></button>';
  rows.appendChild(row);
}

async function saveSyncConfig() {
  const rowEls  = document.querySelectorAll('#syncRows .ba-sync-row');
  const mappings = Array.from(rowEls).map(r => ({
    tag:     r.querySelector('.sync-tag')?.value.trim()     || '',
    section: r.querySelector('.sync-section')?.value.trim() || '',
    enabled: r.querySelector('.sync-enabled')?.checked      ?? true,
  })).filter(m => m.tag && m.section);

  const btn = document.getElementById('saveSyncBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…'; }

  try {
    await API.put('/api/admin/blog/sync-config', { mappings });
    toast('Sync config saved!', 'success');
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Config'; }
  }
}

/* ============================================================
   EVENT BINDINGS
   ============================================================ */
function bindUI() {
  /* Sidebar nav */
  document.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showView(link.dataset.view);
    });
  });

  /* Hamburger */
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('baSidebar').classList.toggle('open');
  });

  /* Logout */
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem('admin_token');
    window.location.href = '../index.html';
  });

  /* New post */
  document.getElementById('newPostBtn')?.addEventListener('click', () => openEditor(null));

  /* Post filters */
  const postSearch = document.getElementById('postSearch');
  const postTagF   = document.getElementById('postTagFilter');
  const postFrom   = document.getElementById('postDateFrom');
  const postTo     = document.getElementById('postDateTo');
  const clearF     = document.getElementById('clearFiltersBtn');

  if (postSearch) postSearch.addEventListener('input', debounce(e => { _posts.search = e.target.value.trim(); _posts.page = 1; loadPosts(); }, 350));
  if (postTagF)   postTagF.addEventListener('change',  e => { _posts.tag    = e.target.value; _posts.page = 1; loadPosts(); });
  if (postFrom)   postFrom.addEventListener('change',  e => { _posts.from   = e.target.value; _posts.page = 1; loadPosts(); });
  if (postTo)     postTo.addEventListener('change',    e => { _posts.to     = e.target.value; _posts.page = 1; loadPosts(); });
  if (clearF) clearF.addEventListener('click', () => {
    _posts.search = ''; _posts.tag = ''; _posts.from = ''; _posts.to = ''; _posts.page = 1;
    if (postSearch) postSearch.value = '';
    if (postTagF)   postTagF.value   = '';
    if (postFrom)   postFrom.value   = '';
    if (postTo)     postTo.value     = '';
    loadPosts();
  });

  /* Editor */
  document.getElementById('editorClose')?.addEventListener('click',  closeEditor);
  document.getElementById('edCancelBtn')?.addEventListener('click',  closeEditor);
  document.getElementById('edSubmitBtn')?.addEventListener('click',  submitEditor);
  document.getElementById('edContent')?.addEventListener('input',    updateEditorPreview);
  document.getElementById('edPickFromLibraryBtn')?.addEventListener('click', openLibraryPicker);

  /* Editor cancel upload */
  document.getElementById('edCancelUpload')?.addEventListener('click', () => {
    if (xhrUpload._abort) { xhrUpload._abort(); xhrUpload._abort = null; }
    document.getElementById('edUploadRow').style.display = 'none';
    _editor.media = _editor.media.filter(m => m.uploaded);
    _editor.uploading = false;
    renderEditorMedia();
  });

  /* Editor file inputs */
  ['edImageInput','edVideoInput','edGifInput'].forEach((id, i) => {
    const types = ['image','video','gif'];
    document.getElementById(id)?.addEventListener('change', function() {
      handleEditorFiles(this.files, types[i]);
      this.value = '';
    });
  });

  /* Drag and drop on editor textarea */
  const edContent = document.getElementById('edContent');
  if (edContent) {
    edContent.addEventListener('dragover', e => { e.preventDefault(); edContent.classList.add('drag-over'); });
    edContent.addEventListener('dragleave', () => edContent.classList.remove('drag-over'));
    edContent.addEventListener('drop', e => {
      e.preventDefault();
      edContent.classList.remove('drag-over');
      const files = Array.from(e.dataTransfer.files);
      const images = files.filter(f => f.type.startsWith('image/'));
      const videos = files.filter(f => f.type.startsWith('video/'));
      if (images.length) handleEditorFiles(images, images[0].type === 'image/gif' ? 'gif' : 'image');
      if (videos.length) handleEditorFiles(videos, 'video');
    });
  }

  /* Click outside modals */
  document.getElementById('editorModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('editorModal')) closeEditor();
  });

  /* Library picker */
  document.getElementById('libPickerClose')?.addEventListener('click', closeLibraryPicker);
  document.getElementById('libPickerModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('libPickerModal')) closeLibraryPicker();
  });

  const lpType   = document.getElementById('lpTypeFilter');
  const lpSearch = document.getElementById('lpSearch');
  if (lpType)   lpType.addEventListener('change',  () => loadLibraryPicker(1, lpType.value, lpSearch?.value || ''));
  if (lpSearch) lpSearch.addEventListener('input',  debounce(() => loadLibraryPicker(1, lpType?.value || '', lpSearch.value), 300));

  /* Media view */
  document.getElementById('mediaUploadInput')?.addEventListener('change', function() {
    if (this.files.length) uploadMediaFiles(this.files);
    this.value = '';
  });
  document.getElementById('mediaSearch')?.addEventListener('input', debounce(e => loadMedia(1, undefined, e.target.value), 350));
  document.getElementById('mediaTypeFilter')?.addEventListener('change', e => loadMedia(1, e.target.value));

  /* Sync view */
  document.getElementById('addSyncRowBtn')?.addEventListener('click',  () => addSyncRow('', '', true));
  document.getElementById('saveSyncBtn')?.addEventListener('click',    saveSyncConfig);

  /* Keyboard */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeEditor();
      closeLibraryPicker();
    }
  });
}

/* ============================================================
   INIT
   ============================================================ */
(function init() {
  bindUI();
  loadStats();

  /* Route from hash */
  const hash = (window.location.hash || '#posts').replace(/^#/, '');
  const view = views.includes(hash) ? hash : 'posts';
  showView(view);
})();
