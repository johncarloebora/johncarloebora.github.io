// ============================================================
// Social Posts Admin Page — Full Media Upload, Library, Sync Config
// ============================================================

router.register('social', loadSocialPage);

/* ── State ──────────────────────────────────────────────── */
let _ss = {
    posts: [], total: 0, page: 1, limit: 20,
    search: '', tag: '', dateFrom: '', dateTo: '',
    composePendingMedia: [],  /* { file?, url, type, uploaded, id? } */
    composingPost: null,       /* null = new, obj = editing */
    uploadInProgress: false,
};

/* ── Page Entry ─────────────────────────────────────────── */
async function loadSocialPage() {
    _ss = { ..._ss, posts: [], total: 0, page: 1, search: '', tag: '', dateFrom: '', dateTo: '', composePendingMedia: [], composingPost: null };

    // Reset filter UI
    ['socialSearch','socialTagFilter','socialDateFrom','socialDateTo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // Load tag dropdown options
    try {
        const data = await API.get('/api/blog/tags');
        const sel = document.getElementById('socialTagFilter');
        if (sel) {
            sel.innerHTML = '<option value="">All tags</option>';
            (data.tags || []).forEach(t => {
                sel.innerHTML += `<option value="${esc(t.tag)}">#${esc(t.tag)} (${t.count})</option>`;
            });
        }
    } catch {}

    await refreshSocialPosts();
    bindSocialControls();
}

function bindSocialControls() {
    const bind = (id, event, fn) => {
        const el = document.getElementById(id);
        if (el && !el.dataset.bound) { el.dataset.bound = '1'; el.addEventListener(event, fn); }
    };
    bind('addSocialPost', 'click', () => openSocialComposer(null));
    bind('socialSearch', 'input', debounce(e => { _ss.search = e.target.value.trim(); _ss.page = 1; refreshSocialPosts(); }, 350));
    bind('socialTagFilter', 'change', e => { _ss.tag = e.target.value; _ss.page = 1; refreshSocialPosts(); });
    bind('socialDateFrom', 'change', e => { _ss.dateFrom = e.target.value; _ss.page = 1; refreshSocialPosts(); });
    bind('socialDateTo', 'change', e => { _ss.dateTo = e.target.value; _ss.page = 1; refreshSocialPosts(); });
    bind('syncConfigBtn', 'click', openSyncConfigModal);
    bind('blogMediaLibBtn', 'click', openMediaLibrary);
}

/* ── Posts List ─────────────────────────────────────────── */
async function refreshSocialPosts() {
    const list = document.getElementById('socialPostsList');
    if (!list) return;
    renderPageLoading(list);
    try {
        const params = new URLSearchParams({ page: _ss.page, limit: _ss.limit });
        if (_ss.search)   params.set('search', _ss.search);
        if (_ss.tag)      params.set('tag', _ss.tag);
        if (_ss.dateFrom) params.set('from', _ss.dateFrom);
        if (_ss.dateTo)   params.set('to', _ss.dateTo);
        const data = await API.get('/api/admin/blog/posts?' + params);
        _ss.posts = data.posts || [];
        _ss.total = data.total || 0;
        renderSocialList(list);
    } catch (err) {
        renderPageError(list, err, refreshSocialPosts);
    }
}

function renderSocialList(container) {
    const { posts, total, page, limit } = _ss;
    let html = `
        <div class="help-banner">
            <i class="fas fa-info-circle"></i>
            <div>
                <strong>Social Posts</strong> — Appear on your
                <a href="../blog/" target="_blank" style="color:var(--accent2)">public blog</a>.
                Tagged posts sync to portfolio sections automatically.
                Use <strong>Media Upload</strong> for R2-hosted images and videos.
            </div>
        </div>`;

    if (!posts.length) {
        html += `<div class="empty-state"><i class="fas fa-comments"></i><p>No posts found.</p></div>`;
        container.innerHTML = html;
        return;
    }

    html += '<div class="data-grid">';
    for (const post of posts) {
        const tags   = Array.isArray(post.tags) ? post.tags : [];
        const media  = Array.isArray(post.media) ? post.media : [];
        const prev   = (post.content || '').slice(0, 200) + ((post.content||'').length > 200 ? '…' : '');
        const badges = [
            post.pinned   ? '<span class="status-badge visible">📌 Pinned</span>'   : '',
            post.featured ? '<span class="status-badge visible">⭐ Featured</span>' : '',
            post.reply_to ? '<span class="status-badge hidden">↩ Reply</span>'      : '',
        ].filter(Boolean).join('');

        html += `<div class="data-card" id="social-card-${post.id}">
            <div class="data-card-header">
                <div style="flex:1;min-width:0">
                    <div class="data-card-subtitle">${esc(post.author)} · ${esc(relativeTimeSocial(post.created_at))}${post.location ? ' · 📍 ' + esc(post.location) : ''}</div>
                    <div style="font-size:.88rem;line-height:1.55;margin-top:4px;white-space:pre-wrap;word-break:break-word">${esc(prev)}</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;margin-left:12px">${badges}</div>
            </div>
            ${tags.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin:8px 0 4px">${tags.map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}</div>` : ''}
            ${media.length ? `<div class="data-card-subtitle" style="margin-top:4px"><i class="fas fa-paperclip"></i> ${media.length} media · <a href="../blog/" target="_blank" style="color:var(--accent2);font-size:.8rem">View on Blog</a></div>` : ''}
            ${post.reply_count > 0 ? `<div class="data-card-subtitle" style="margin-top:4px"><i class="fas fa-comment"></i> ${post.reply_count} repl${post.reply_count===1?'y':'ies'}</div>` : ''}
            <div class="data-card-actions">
                <button class="btn btn-secondary btn-sm" onclick="openSocialComposer(${post.id})"><i class="fas fa-pen"></i> Edit</button>
                <button class="btn btn-secondary btn-sm" onclick="toggleSocialPin(${post.id},${post.pinned?0:1})"><i class="fas fa-thumbtack"></i> ${post.pinned?'Unpin':'Pin'}</button>
                <button class="btn btn-secondary btn-sm" onclick="toggleSocialFeature(${post.id},${post.featured?0:1})"><i class="fas fa-star"></i> ${post.featured?'Unfeature':'Feature'}</button>
                <a href="../blog/#/post/${post.id}" target="_blank" class="btn btn-secondary btn-sm"><i class="fas fa-external-link-alt"></i></a>
                <button class="btn btn-danger btn-sm" onclick="deleteSocialPost(${post.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }
    html += '</div>';

    /* Pagination */
    const totalPages = Math.ceil(total / limit);
    if (totalPages > 1) {
        html += `<div class="pagination-row">
            <span>${total} posts total</span>
            <div style="display:flex;gap:8px;align-items:center">
                ${page > 1 ? `<button class="btn btn-secondary btn-sm" onclick="socialPageNav(${page-1})">← Prev</button>` : ''}
                <span>Page ${page} / ${totalPages}</span>
                ${page < totalPages ? `<button class="btn btn-secondary btn-sm" onclick="socialPageNav(${page+1})">Next →</button>` : ''}
            </div>
        </div>`;
    }
    container.innerHTML = html;
}

window.socialPageNav = p => { _ss.page = p; refreshSocialPosts(); };
window.toggleSocialPin = async (id, val) => {
    try { await API.put('/api/blog/posts/' + id + '/pin', { pinned: !!val }); showToast(val ? 'Pinned' : 'Unpinned', 'success'); refreshSocialPosts(); }
    catch (e) { showToast(e.message, 'error'); }
};
window.toggleSocialFeature = async (id, val) => {
    try { await API.put('/api/blog/posts/' + id + '/feature', { featured: !!val }); showToast(val ? 'Featured' : 'Unfeatured', 'success'); refreshSocialPosts(); }
    catch (e) { showToast(e.message, 'error'); }
};
window.deleteSocialPost = async id => {
    if (!confirm('Delete this post and all replies? Cannot be undone.')) return;
    try { await API.delete('/api/blog/posts/' + id); showToast('Post deleted', 'success'); refreshSocialPosts(); }
    catch (e) { showToast(e.message, 'error'); }
};

/* ── Composer Modal ─────────────────────────────────────── */
async function openSocialComposer(postId) {
    _ss.composePendingMedia = [];
    _ss.composingPost = null;

    let editPost = null;
    if (postId) {
        try { editPost = await API.request('/api/blog/posts/' + postId + '/thread').then(d => d.post); }
        catch {}
    }
    _ss.composingPost = editPost;

    const modal = document.getElementById('socialComposerModal');
    if (!modal) { buildComposerModal(); }

    const m = document.getElementById('socialComposerModal');
    if (!m) return;

    // Populate fields
    const ta  = document.getElementById('scContent');
    const loc = document.getElementById('scLocation');
    const ttl = document.getElementById('scTitle');
    if (ta)  ta.value  = editPost ? (editPost.content  || '') : '';
    if (loc) loc.value = editPost ? (editPost.location || '') : '';
    if (ttl) ttl.textContent = editPost ? 'Edit Post' : 'New Post';

    // Pre-populate media from existing post
    if (editPost && Array.isArray(editPost.media)) {
        _ss.composePendingMedia = editPost.media.map(m => ({ url: m.url, type: m.type || 'image', uploaded: true }));
    }

    renderComposerMediaGrid();
    updateComposerChar();
    updateComposerTagPreview();

    m.style.display = '';
    document.body.style.overflow = 'hidden';
    setTimeout(() => ta?.focus(), 50);
}

function buildComposerModal() {
    const overlay = document.createElement('div');
    overlay.id        = 'socialComposerModal';
    overlay.className = 'admin-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.75);display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto';
    overlay.innerHTML = `
    <div class="admin-modal" style="background:var(--surface1);border:1px solid var(--border);border-radius:12px;width:100%;max-width:580px;box-shadow:0 8px 40px rgba(0,0,0,.5);display:flex;flex-direction:column;max-height:calc(100vh - 48px)">
      <div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--border);flex-shrink:0">
        <span id="scTitle" style="font-weight:600;font-size:1rem;flex:1">New Post</span>
        <button onclick="closeSocialComposer()" style="background:none;border:none;color:var(--muted);font-size:1rem;cursor:pointer;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:.15s" onmouseenter="this.style.background='var(--surface2)'" onmouseleave="this.style.background='none'"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:16px;overflow-y:auto;flex:1">
        <textarea id="scContent" class="form-input" placeholder="What's on your mind? Use #hashtags to tag your post…" style="min-height:120px;resize:vertical;width:100%;line-height:1.6" maxlength="2000"></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:3px;margin-bottom:10px">
          <span id="scTagPreview" style="display:none;font-size:.78rem;color:var(--accent2)"></span>
          <span style="margin-left:auto;font-size:.75rem;color:var(--muted)"><span id="scCharCount">0</span>/2000</span>
        </div>
        <div class="form-row" style="gap:8px;margin-bottom:12px">
          <input type="text" class="form-input" id="scLocation" placeholder="📍 Location (optional)" style="flex:1">
        </div>

        <!-- Media grid preview -->
        <div id="scMediaGrid" style="display:grid;gap:6px;margin-bottom:10px"></div>

        <!-- Upload progress -->
        <div id="scUploadRow" style="display:none;align-items:center;gap:10px;padding:10px 12px;background:var(--surface2);border-radius:8px;margin-bottom:10px">
          <div style="flex:1;height:4px;background:var(--border);border-radius:4px;overflow:hidden"><div id="scUploadBar" style="height:100%;background:var(--accent2);border-radius:4px;width:0%;transition:width .3s ease"></div></div>
          <span id="scUploadLabel" style="font-size:.78rem;color:var(--muted);white-space:nowrap">Uploading…</span>
        </div>

        <!-- Toolbar -->
        <div style="display:flex;align-items:center;gap:6px;padding-top:12px;border-top:1px solid var(--border)">
          <label class="btn btn-secondary btn-sm" title="Upload images (max 4)" style="cursor:pointer">
            <i class="fas fa-image"></i> Image
            <input type="file" id="scImageInput" accept="image/jpeg,image/png,image/webp,image/avif" multiple style="display:none">
          </label>
          <label class="btn btn-secondary btn-sm" title="Upload video (max 20MB)" style="cursor:pointer">
            <i class="fas fa-video"></i> Video
            <input type="file" id="scVideoInput" accept="video/mp4,video/webm,video/quicktime" style="display:none">
          </label>
          <label class="btn btn-secondary btn-sm" title="Upload GIF" style="cursor:pointer">
            <i class="fas fa-film"></i> GIF
            <input type="file" id="scGifInput" accept="image/gif" style="display:none">
          </label>
          <button class="btn btn-secondary btn-sm" onclick="openMediaLibraryPicker()" title="Pick from Media Library"><i class="fas fa-folder-open"></i> Library</button>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--border);flex-shrink:0">
        <button class="btn btn-secondary" onclick="closeSocialComposer()">Cancel</button>
        <button class="btn btn-primary" id="scSubmit" onclick="submitSocialComposer()"><i class="fas fa-paper-plane"></i> Publish</button>
      </div>
    </div>`;

    overlay.addEventListener('click', e => { if (e.target === overlay) closeSocialComposer(); });
    document.body.appendChild(overlay);

    // Bind file inputs
    overlay.querySelector('#scContent').addEventListener('input', () => { updateComposerChar(); updateComposerTagPreview(); });
    overlay.querySelector('#scImageInput').addEventListener('change', function() { handleComposerFiles(this.files, 'image'); this.value=''; });
    overlay.querySelector('#scVideoInput').addEventListener('change', function() { handleComposerFiles(this.files, 'video'); this.value=''; });
    overlay.querySelector('#scGifInput').addEventListener('change',   function() { handleComposerFiles(this.files, 'gif');   this.value=''; });
}

window.closeSocialComposer = function() {
    const m = document.getElementById('socialComposerModal');
    if (m) m.style.display = 'none';
    document.body.style.overflow = '';
    _ss.composePendingMedia = [];
    _ss.composingPost = null;
};

function updateComposerChar() {
    const ta = document.getElementById('scContent');
    const el = document.getElementById('scCharCount');
    if (ta && el) el.textContent = (ta.value||'').length;
}

function updateComposerTagPreview() {
    const ta  = document.getElementById('scContent');
    const el  = document.getElementById('scTagPreview');
    if (!ta || !el) return;
    const tags = [...new Set((ta.value.match(/#(\w+)/g)||[]).map(h=>h.slice(1)))];
    if (tags.length) {
        el.style.display = '';
        el.innerHTML = '<i class="fas fa-tags"></i> ' + tags.map(t=>`<span class="tag">#${esc(t)}</span>`).join(' ');
    } else {
        el.style.display = 'none';
    }
}

function renderComposerMediaGrid() {
    const grid = document.getElementById('scMediaGrid');
    if (!grid) return;
    const media = _ss.composePendingMedia;
    if (!media.length) { grid.innerHTML = ''; grid.style.gridTemplateColumns=''; return; }
    grid.style.gridTemplateColumns = media.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(100px, 1fr))';
    grid.innerHTML = media.map((m, i) => {
        const isVid = m.type === 'video' || /\.(mp4|webm|mov)$/i.test(m.url||'');
        const thumb = isVid
            ? `<video src="${esc(m.url)}" muted playsinline style="width:100%;height:100%;object-fit:cover"></video>`
            : `<img src="${esc(m.url)}" style="width:100%;height:100%;object-fit:cover" alt="" loading="lazy">`;
        const statusBadge = !m.uploaded && m.file
            ? `<div style="position:absolute;bottom:4px;left:4px;background:rgba(0,0,0,.7);color:#fff;padding:2px 6px;border-radius:8px;font-size:.65rem"><span class="spinner-sm"></span> Uploading…</div>`
            : '';
        return `<div style="position:relative;aspect-ratio:1;border-radius:6px;overflow:hidden;background:var(--surface2)">
            ${thumb}
            ${statusBadge}
            <button onclick="removeComposerMedia(${i})" style="position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.7);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.7rem"><i class="fas fa-times"></i></button>
        </div>`;
    }).join('');
}

window.removeComposerMedia = function(idx) {
    _ss.composePendingMedia.splice(idx, 1);
    renderComposerMediaGrid();
};

/* ── File Upload with Compression ──────────────────────── */
function compressImageAdmin(file) {
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

function handleComposerFiles(files, type) {
    let arr = Array.from(files);
    if (!arr.length) return;
    const maxNew = type === 'image' ? Math.max(0, 4 - _ss.composePendingMedia.filter(m=>m.type!=='video').length) : 1;
    arr = arr.slice(0, maxNew);
    if (!arr.length) { showToast('Media limit reached', 'info'); return; }

    arr.forEach(file => {
        const localUrl = URL.createObjectURL(file);
        _ss.composePendingMedia.push({ file, url: localUrl, type, uploaded: false });
    });
    renderComposerMediaGrid();
    uploadPendingComposerMedia();
}

function uploadPendingComposerMedia() {
    const toUpload = _ss.composePendingMedia.filter(m => !m.uploaded && m.file);
    if (!toUpload.length) return;

    const bar   = document.getElementById('scUploadBar');
    const row   = document.getElementById('scUploadRow');
    const label = document.getElementById('scUploadLabel');
    if (row) row.style.display = 'flex';
    _ss.uploadInProgress = true;

    let idx = 0;
    const next = () => {
        if (idx >= toUpload.length) {
            if (row) row.style.display = 'none';
            if (bar) bar.style.width = '0%';
            _ss.uploadInProgress = false;
            return;
        }
        const item = toUpload[idx];
        if (label) label.textContent = `Uploading ${idx+1} of ${toUpload.length}…`;

        compressImageAdmin(item.file).then(compressed => {
            const fd = new FormData();
            fd.append('file', compressed);
            const xhr = new XMLHttpRequest();
            xhr.open('POST', ADMIN_CONFIG.API_BASE + '/api/blog/media/upload');
            const token = localStorage.getItem('admin_jwt') || sessionStorage.getItem('admin_jwt') || '';
            if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            xhr.upload.addEventListener('progress', e => {
                if (e.lengthComputable && bar) bar.style.width = Math.round(e.loaded/e.total*100) + '%';
            });
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const result = JSON.parse(xhr.responseText);
                    const found = _ss.composePendingMedia.find(m => m.file === item.file);
                    if (found) { URL.revokeObjectURL(found.url); found.url = result.url; found.uploaded = true; delete found.file; found.mediaId = result.id; }
                    renderComposerMediaGrid();
                } else {
                    showToast('Upload failed', 'error');
                }
                idx++; next();
            };
            xhr.onerror = () => { showToast('Upload network error', 'error'); idx++; next(); };
            xhr.send(fd);
        });
    };
    next();
}

window.submitSocialComposer = async function() {
    const ta  = document.getElementById('scContent');
    const loc = document.getElementById('scLocation');
    const btn = document.getElementById('scSubmit');
    const content  = (ta?.value || '').trim();
    const location = (loc?.value || '').trim();
    if (!content) { showToast('Content is required', 'error'); return; }
    if (_ss.uploadInProgress) { showToast('Wait for uploads to finish', 'info'); return; }

    const still = _ss.composePendingMedia.some(m => !m.uploaded && m.file);
    if (still) { showToast('Wait for uploads to finish', 'info'); return; }

    const media = _ss.composePendingMedia.map(m => ({ url: m.url, type: m.type }));
    const tags  = [...new Set((content.match(/#(\w+)/g)||[]).map(h=>h.slice(1)))];
    const data  = { content, location, media, tags };

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting…'; }

    try {
        if (_ss.composingPost) {
            await API.put('/api/blog/posts/' + _ss.composingPost.id, data);
            showToast('Post updated', 'success');
        } else {
            await API.post('/api/blog/posts', data);
            showToast('Post published', 'success');
        }
        closeSocialComposer();
        _ss.page = 1;
        await refreshSocialPosts();
    } catch (err) {
        showToast(err.message || 'Failed', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish'; }
    }
};

/* ── Media Library Modal ────────────────────────────────── */
async function openMediaLibrary() {
    await renderMediaLibraryModal(false);
}

async function openMediaLibraryPicker() {
    await renderMediaLibraryModal(true);
}

async function renderMediaLibraryModal(pickerMode) {
    let modal = document.getElementById('blogMediaLibModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'blogMediaLibModal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:1001;background:rgba(0,0,0,.8);display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto';
        modal.innerHTML = `
        <div style="background:var(--surface1);border:1px solid var(--border);border-radius:12px;width:100%;max-width:860px;max-height:calc(100vh - 48px);display:flex;flex-direction:column">
          <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--border);flex-shrink:0">
            <span style="font-weight:600;font-size:1rem;flex:1"><i class="fas fa-photo-video"></i> Blog Media Library</span>
            <select id="bmTypeFilter" class="form-input" style="width:130px">
              <option value="">All types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="gif">GIFs</option>
            </select>
            <input type="text" class="form-input" id="bmSearch" placeholder="Search…" style="width:180px">
            <button onclick="document.getElementById('blogMediaLibModal').style.display='none'" style="background:none;border:none;color:var(--muted);font-size:1rem;cursor:pointer;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center" onmouseenter="this.style.background='var(--surface2)'" onmouseleave="this.style.background='none'"><i class="fas fa-times"></i></button>
          </div>
          <div style="padding:12px 16px;border-bottom:1px solid var(--border);flex-shrink:0">
            <label class="btn btn-primary btn-sm" style="cursor:pointer;display:inline-flex">
              <i class="fas fa-upload"></i> Upload to Library
              <input type="file" id="bmUploadInput" accept="image/*,video/mp4,video/webm,video/quicktime" multiple style="display:none">
            </label>
            <span id="bmUploadStatus" style="margin-left:10px;font-size:.8rem;color:var(--muted)"></span>
          </div>
          <div id="bmGrid" style="flex:1;overflow-y:auto;padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px">
            <div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Loading…</p></div>
          </div>
          <div id="bmPagination" style="padding:12px 16px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;font-size:.85rem;color:var(--muted)"></div>
        </div>`;
        modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
        document.body.appendChild(modal);

        // File upload handler
        modal.querySelector('#bmUploadInput').addEventListener('change', async function() {
            const files = Array.from(this.files);
            if (!files.length) return;
            const status = document.getElementById('bmUploadStatus');
            if (status) status.textContent = `Uploading ${files.length} file(s)…`;
            this.value = '';
            for (const file of files) {
                try {
                    const compressed = await compressImageAdmin(file);
                    const fd = new FormData();
                    fd.append('file', compressed);
                    const resp = await API.upload('/api/blog/media/upload', fd);
                    if (status) status.textContent = `Uploaded: ${compressed.name}`;
                } catch (e) {
                    showToast('Upload failed: ' + e.message, 'error');
                }
            }
            if (status) setTimeout(() => { status.textContent = ''; }, 2000);
            loadBlogMediaLibrary(1, '', '');
        });

        // Filter bindings
        const typeF  = modal.querySelector('#bmTypeFilter');
        const searchF = modal.querySelector('#bmSearch');
        let debT = null;
        typeF.addEventListener('change',  () => loadBlogMediaLibrary(1, typeF.value, searchF.value));
        searchF.addEventListener('input', () => { clearTimeout(debT); debT = setTimeout(() => loadBlogMediaLibrary(1, typeF.value, searchF.value), 300); });
    }

    modal.dataset.pickerMode = pickerMode ? '1' : '0';
    modal.style.display = '';
    loadBlogMediaLibrary(1, '', '');
}

async function loadBlogMediaLibrary(page, type, search) {
    const grid = document.getElementById('bmGrid');
    const pag  = document.getElementById('bmPagination');
    if (!grid) return;
    grid.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Loading…</p></div>';
    try {
        const params = new URLSearchParams({ page: page||1, limit: 30 });
        if (type)   params.set('type', type);
        if (search) params.set('search', search);
        const data = await API.get('/api/blog/media?' + params);
        const media = data.media || [];
        const total = data.total || 0;
        const modal = document.getElementById('blogMediaLibModal');
        const isPickerMode = modal?.dataset.pickerMode === '1';

        if (!media.length) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-photo-video"></i><p>No media yet. Upload files above.</p></div>';
        } else {
            grid.innerHTML = media.map(m => {
                const isVid = m.type === 'video';
                const thumb = isVid
                    ? `<video src="${esc(m.url)}" muted preload="metadata" style="width:100%;height:100%;object-fit:cover"></video><div style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,.7);color:#fff;border-radius:8px;padding:2px 6px;font-size:.65rem"><i class="fas fa-play"></i></div>`
                    : `<img src="${esc(m.url)}" alt="${esc(m.filename)}" loading="lazy" style="width:100%;height:100%;object-fit:cover">`;

                const actions = isPickerMode
                    ? `<button class="btn btn-primary btn-sm" style="width:100%;margin-top:4px" onclick="pickLibraryMedia('${esc(m.url)}','${esc(m.type)}')"><i class="fas fa-check"></i> Use</button>`
                    : `<button class="btn btn-danger btn-sm" style="width:100%;margin-top:4px" onclick="deleteLibraryMedia(${m.id})"><i class="fas fa-trash"></i></button>`;

                return `<div style="display:flex;flex-direction:column">
                    <div style="position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;background:var(--surface2);border:1px solid var(--border)">${thumb}</div>
                    <div style="font-size:.7rem;color:var(--muted);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(m.filename)}">${esc(m.filename)}</div>
                    ${actions}
                </div>`;
            }).join('');
        }

        if (pag) {
            const totalPages = Math.ceil(total / 30);
            pag.innerHTML = totalPages > 1
                ? `<span>${total} files</span><div style="display:flex;gap:8px;align-items:center">${page>1?`<button class="btn btn-secondary btn-sm" onclick="loadBlogMediaLibrary(${page-1},'${type}','${search}')">← Prev</button>`:''}<span>Page ${page}/${totalPages}</span>${page<totalPages?`<button class="btn btn-secondary btn-sm" onclick="loadBlogMediaLibrary(${page+1},'${type}','${search}')">Next →</button>`:''}</div>`
                : `<span>${total} file${total===1?'':'s'}</span>`;
        }
    } catch (err) {
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>${esc(err.message)}</p></div>`;
    }
}

window.pickLibraryMedia = function(url, type) {
    _ss.composePendingMedia.push({ url, type: type||'image', uploaded: true });
    renderComposerMediaGrid();
    const modal = document.getElementById('blogMediaLibModal');
    if (modal) modal.style.display = 'none';
    showToast('Media added to post', 'success');
};

window.deleteLibraryMedia = async function(id) {
    if (!confirm('Delete this media file? Cannot be undone.')) return;
    try {
        await API.delete('/api/blog/media/' + id);
        showToast('Deleted', 'success');
        const typeF  = document.getElementById('bmTypeFilter');
        const searchF = document.getElementById('bmSearch');
        loadBlogMediaLibrary(1, typeF?.value||'', searchF?.value||'');
    } catch (e) { showToast(e.message, 'error'); }
};

/* ── Sync Config Modal ──────────────────────────────────── */
async function openSyncConfigModal() {
    let modal = document.getElementById('syncConfigModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'syncConfigModal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:1001;background:rgba(0,0,0,.75);display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto';
        modal.innerHTML = `
        <div style="background:var(--surface1);border:1px solid var(--border);border-radius:12px;width:100%;max-width:520px">
          <div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--border)">
            <span style="font-weight:600;font-size:1rem;flex:1"><i class="fas fa-sync-alt"></i> Blog → Portfolio Sync Config</span>
            <button onclick="document.getElementById('syncConfigModal').style.display='none'" style="background:none;border:none;color:var(--muted);font-size:1rem;cursor:pointer"><i class="fas fa-times"></i></button>
          </div>
          <div style="padding:16px">
            <p style="font-size:.85rem;color:var(--muted);margin-bottom:14px">Map post tags to portfolio sections. Posts with matching tags are injected into the portfolio via <code>/api/portfolio/sync</code>.</p>
            <div id="syncMappingRows"></div>
            <button class="btn btn-secondary btn-sm" onclick="addSyncRow()" style="margin-top:10px"><i class="fas fa-plus"></i> Add Mapping</button>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--border)">
            <button class="btn btn-secondary" onclick="document.getElementById('syncConfigModal').style.display='none'">Cancel</button>
            <button class="btn btn-primary" onclick="saveSyncConfig()"><i class="fas fa-save"></i> Save</button>
          </div>
        </div>`;
        modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
        document.body.appendChild(modal);
    }
    modal.style.display = '';
    // Load existing config
    try {
        const data = await API.get('/api/admin/blog/sync-config');
        const rows = document.getElementById('syncMappingRows');
        if (!rows) return;
        rows.innerHTML = '';
        (data.config || []).forEach(c => addSyncRow(c.tag, c.section, c.enabled));
        if (!data.config?.length) {
            addSyncRow('project', 'projects', true);
            addSyncRow('achievement', 'achievements', true);
            addSyncRow('gallery', 'gallery', true);
            addSyncRow('media', 'media', true);
        }
    } catch {}
}

window.addSyncRow = function(tag, section, enabled) {
    const rows = document.getElementById('syncMappingRows');
    if (!rows) return;
    const row = document.createElement('div');
    row.className = 'form-row';
    row.style.cssText = 'gap:8px;margin-bottom:8px;align-items:center';
    row.innerHTML = `
        <input type="text" class="form-input sync-tag" placeholder="tag" value="${esc(tag||'')}" style="flex:1">
        <span style="color:var(--muted);font-size:.85rem">→</span>
        <input type="text" class="form-input sync-section" placeholder="section id" value="${esc(section||'')}" style="flex:1">
        <label style="display:flex;align-items:center;gap:5px;font-size:.82rem;white-space:nowrap">
          <input type="checkbox" class="sync-enabled" ${enabled!==false?'checked':''}>Enabled
        </label>
        <button onclick="this.closest('.form-row').remove()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.9rem" title="Remove"><i class="fas fa-trash"></i></button>`;
    rows.appendChild(row);
};

window.saveSyncConfig = async function() {
    const rows = document.querySelectorAll('#syncMappingRows .form-row');
    const mappings = Array.from(rows).map(r => ({
        tag:     r.querySelector('.sync-tag')?.value.trim()     || '',
        section: r.querySelector('.sync-section')?.value.trim() || '',
        enabled: r.querySelector('.sync-enabled')?.checked      ?? true,
    })).filter(m => m.tag && m.section);

    try {
        await API.put('/api/admin/blog/sync-config', { mappings });
        showToast('Sync config saved', 'success');
        document.getElementById('syncConfigModal').style.display = 'none';
    } catch (e) { showToast(e.message, 'error'); }
};

/* ── Expose openSocialComposer globally ─────────────────── */
window.openSocialComposer = openSocialComposer;
window.openMediaLibrary    = openMediaLibrary;
window.loadBlogMediaLibrary = loadBlogMediaLibrary;

/* ── Helpers ────────────────────────────────────────────── */
function relativeTimeSocial(iso) {
    if (!iso) return '';
    const d = (Date.now() - new Date(iso).getTime()) / 1000;
    if (d < 60)    return 'just now';
    if (d < 3600)  return Math.floor(d/60) + 'm ago';
    if (d < 86400) return Math.floor(d/3600) + 'h ago';
    return new Date(iso).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
}

function debounce(fn, ms) {
    let t;
    return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
}
