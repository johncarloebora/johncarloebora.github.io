// ============================================================
// Social Posts Admin Page
// ============================================================

router.register('social', loadSocialPage);

var _socialState = { posts: [], total: 0, page: 1, limit: 20, search: '', tag: '', dateFrom: '', dateTo: '' };

async function loadSocialPage() {
    _socialState = { posts: [], total: 0, page: 1, limit: 20, search: '', tag: '', dateFrom: '', dateTo: '' };
    const searchIn = document.getElementById('socialSearch');
    const tagSel   = document.getElementById('socialTagFilter');
    if (searchIn) searchIn.value = '';
    if (tagSel)   tagSel.value   = '';

    /* Load tags for filter dropdown */
    try {
        const data = await API.get('/api/blog/tags');
        const sel  = document.getElementById('socialTagFilter');
        if (sel) {
            sel.innerHTML = '<option value="">All tags</option>';
            (data.tags || []).forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.tag;
                opt.textContent = '#' + t.tag + ' (' + t.count + ')';
                sel.appendChild(opt);
            });
        }
    } catch (e) {}

    await refreshSocialPosts();
    bindSocialControls();
}

function bindSocialControls() {
    const addBtn   = document.getElementById('addSocialPost');
    const searchIn = document.getElementById('socialSearch');
    const tagSel   = document.getElementById('socialTagFilter');
    const dateFrom = document.getElementById('socialDateFrom');
    const dateTo   = document.getElementById('socialDateTo');

    if (addBtn && !addBtn.dataset.bound) {
        addBtn.dataset.bound = '1';
        addBtn.addEventListener('click', () => openSocialEditor(null));
    }
    if (searchIn && !searchIn.dataset.bound) {
        searchIn.dataset.bound = '1';
        let debounce = null;
        searchIn.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                _socialState.search = searchIn.value.trim();
                _socialState.page   = 1;
                refreshSocialPosts();
            }, 350);
        });
    }
    if (tagSel && !tagSel.dataset.bound) {
        tagSel.dataset.bound = '1';
        tagSel.addEventListener('change', () => {
            _socialState.tag  = tagSel.value;
            _socialState.page = 1;
            refreshSocialPosts();
        });
    }
    if (dateFrom && !dateFrom.dataset.bound) {
        dateFrom.dataset.bound = '1';
        dateFrom.addEventListener('change', () => {
            _socialState.dateFrom = dateFrom.value;
            _socialState.page = 1;
            refreshSocialPosts();
        });
    }
    if (dateTo && !dateTo.dataset.bound) {
        dateTo.dataset.bound = '1';
        dateTo.addEventListener('change', () => {
            _socialState.dateTo = dateTo.value;
            _socialState.page = 1;
            refreshSocialPosts();
        });
    }
}

async function refreshSocialPosts() {
    const list = document.getElementById('socialPostsList');
    if (!list) return;
    renderPageLoading(list);

    try {
        const params = new URLSearchParams({
            page:  _socialState.page,
            limit: _socialState.limit,
        });
        if (_socialState.search)   params.set('search', _socialState.search);
        if (_socialState.tag)      params.set('tag',    _socialState.tag);
        if (_socialState.dateFrom) params.set('from',   _socialState.dateFrom);
        if (_socialState.dateTo)   params.set('to',     _socialState.dateTo);

        const data = await API.get('/api/admin/blog/posts?' + params.toString());
        _socialState.posts = data.posts || [];
        _socialState.total = data.total || 0;
        renderSocialList(list);
    } catch (err) {
        renderPageError(list, err, refreshSocialPosts);
    }
}

function renderSocialList(container) {
    const { posts, total, page, limit } = _socialState;

    let html = `
        <div class="help-banner">
            <i class="fas fa-info-circle"></i>
            <div><strong>Social Posts</strong> — These appear on your
            <a href="../blog/" target="_blank" style="color:var(--accent2)">public blog</a>.
            Posts tagged <code>project</code>, <code>achievement</code>, <code>gallery</code>, or <code>media</code>
            with attached media are automatically synced to matching portfolio sections.</div>
        </div>`;

    if (!posts.length) {
        html += '<div class="empty-state"><i class="fas fa-comments"></i><p>No posts found. Adjust filters or create a new post.</p></div>';
        container.innerHTML = html;
        return;
    }

    html += '<div class="data-grid">';
    for (const post of posts) {
        const tags    = Array.isArray(post.tags) ? post.tags : [];
        const media   = Array.isArray(post.media) ? post.media : [];
        const preview = (post.content || '').slice(0, 180) + (post.content.length > 180 ? '…' : '');
        const badges  = [
            post.pinned   ? '<span class="status-badge visible">📌 Pinned</span>'   : '',
            post.featured ? '<span class="status-badge visible">⭐ Featured</span>' : '',
            post.reply_to ? '<span class="status-badge hidden">↩ Reply</span>'      : '',
        ].filter(Boolean).join(' ');

        html += `
            <div class="data-card" id="social-card-${post.id}">
                <div class="data-card-header">
                    <div style="flex:1;min-width:0">
                        <div class="data-card-subtitle">
                            ${esc(post.author)} · ${esc(relativeTimeSocial(post.created_at))}
                            ${post.location ? ' · 📍 ' + esc(post.location) : ''}
                        </div>
                        <div style="font-size:0.88rem;line-height:1.55;margin-top:4px;white-space:pre-wrap;word-break:break-word">${esc(preview)}</div>
                    </div>
                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;margin-left:12px">${badges}</div>
                </div>
                ${tags.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin:8px 0 4px">${tags.map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}</div>` : ''}
                ${media.length ? `<div class="data-card-subtitle" style="margin-top:4px"><i class="fas fa-paperclip"></i> ${media.length} media file${media.length > 1 ? 's' : ''}</div>` : ''}
                ${post.reply_count > 0 ? `<div class="data-card-subtitle" style="margin-top:4px"><i class="fas fa-comment"></i> ${post.reply_count} repl${post.reply_count === 1 ? 'y' : 'ies'}</div>` : ''}

                <!-- Inline edit panel (hidden by default) -->
                <div id="social-inline-${post.id}" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
                    <textarea id="social-ie-content-${post.id}" class="form-input"
                        placeholder="Post content…" style="min-height:80px;width:100%;margin-bottom:8px;resize:vertical">${esc(post.content || '')}</textarea>
                    <div class="form-row" style="gap:8px;margin-bottom:8px">
                        <input type="text" class="form-input" id="social-ie-location-${post.id}"
                            value="${esc(post.location || '')}" placeholder="Location (optional)" style="flex:1">
                        <input type="text" class="form-input" id="social-ie-tags-${post.id}"
                            value="${esc(tags.join(', '))}" placeholder="tags (comma-separated)" style="flex:1">
                    </div>
                    <div style="margin-bottom:8px">
                        <label style="font-size:0.82rem;color:var(--muted);display:block;margin-bottom:4px">Media URLs (one per line, JSON format: [{"url":"...","type":"image"}])</label>
                        <textarea id="social-ie-media-${post.id}" class="form-input"
                            placeholder='[{"url":"https://...","type":"image","alt":""}]'
                            style="min-height:56px;width:100%;resize:vertical;font-size:0.78rem;font-family:monospace">${esc(JSON.stringify(media))}</textarea>
                    </div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                        <button class="btn btn-primary btn-sm" onclick="saveSocialInline(${post.id})"><i class="fas fa-save"></i> Save</button>
                        <button class="btn btn-secondary btn-sm" onclick="toggleSocialInline(${post.id})"><i class="fas fa-times"></i> Cancel</button>
                    </div>
                </div>

                <div class="data-card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="toggleSocialInline(${post.id})"><i class="fas fa-pen"></i> Edit</button>
                    <button class="btn btn-secondary btn-sm" onclick="toggleSocialPin(${post.id}, ${post.pinned ? 0 : 1})">
                        <i class="fas fa-thumbtack"></i> ${post.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="toggleSocialFeature(${post.id}, ${post.featured ? 0 : 1})">
                        <i class="fas fa-star"></i> ${post.featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteSocialPost(${post.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }
    html += '</div>';

    /* Pagination */
    const totalPages = Math.ceil(total / limit);
    if (totalPages > 1) {
        html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;font-size:0.85rem;color:var(--muted)">
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

window.socialPageNav = function(p) {
    _socialState.page = p;
    refreshSocialPosts();
    document.getElementById('socialPostsList')?.scrollIntoView({ behavior: 'smooth' });
};

window.toggleSocialInline = function(id) {
    const el = document.getElementById('social-inline-' + id);
    if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
};

window.saveSocialInline = async function(id) {
    const content   = (document.getElementById('social-ie-content-' + id)?.value || '').trim();
    const location  = (document.getElementById('social-ie-location-' + id)?.value || '').trim();
    const tagsRaw   = (document.getElementById('social-ie-tags-' + id)?.value || '').trim();
    const mediaRaw  = (document.getElementById('social-ie-media-' + id)?.value || '').trim();
    const tags      = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    if (!content) { showToast('Content is required', 'error'); return; }

    let media = [];
    if (mediaRaw) {
        try { media = JSON.parse(mediaRaw); }
        catch (e) { showToast('Invalid media JSON — check format', 'error'); return; }
    }

    try {
        await API.put('/api/blog/posts/' + id, { content, location, tags, media });
        showToast('Post updated', 'success');
        refreshSocialPosts();
    } catch (err) {
        showToast(err.message || 'Save failed', 'error');
    }
};

window.toggleSocialPin = async function(id, pinned) {
    try {
        await API.put('/api/blog/posts/' + id + '/pin', { pinned: !!pinned });
        showToast(pinned ? 'Post pinned' : 'Post unpinned', 'success');
        refreshSocialPosts();
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
};

window.toggleSocialFeature = async function(id, featured) {
    try {
        await API.put('/api/blog/posts/' + id + '/feature', { featured: !!featured });
        showToast(featured ? 'Post featured' : 'Post unfeatured', 'success');
        refreshSocialPosts();
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
};

window.deleteSocialPost = async function(id) {
    if (!confirm('Delete this post and all its replies? This cannot be undone.')) return;
    try {
        await API.delete('/api/blog/posts/' + id);
        showToast('Post deleted', 'success');
        refreshSocialPosts();
    } catch (err) { showToast(err.message || 'Delete failed', 'error'); }
};

/* ── New post composer ── */
function openSocialEditor(replyTo) {
    const editor = document.getElementById('socialPostEditor');
    if (!editor) return;
    editor.style.display = '';
    editor.innerHTML = `
        <div class="data-card" style="border-color:var(--accent2)">
            <div class="data-card-header">
                <div class="data-card-title">${replyTo ? 'New Reply' : 'New Post'}</div>
                <button class="btn btn-secondary btn-sm" onclick="closeNewSocialEditor()"><i class="fas fa-times"></i></button>
            </div>
            <div style="margin-bottom:10px">
                <textarea id="newSocialContent" class="form-input"
                    placeholder="What's on your mind? Use #hashtags inline to tag."
                    style="min-height:100px;resize:vertical;width:100%"></textarea>
            </div>
            <div class="form-row" style="gap:8px;margin-bottom:10px">
                <input type="text" class="form-input" id="newSocialLocation" placeholder="📍 Location (optional)" style="flex:1">
                <input type="text" class="form-input" id="newSocialTags" placeholder="Extra tags (comma-separated)" style="flex:1">
            </div>
            <div style="margin-bottom:12px">
                <label style="font-size:0.82rem;color:var(--muted);display:block;margin-bottom:4px">
                    Media — pick from Media Library or paste URL
                </label>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                    <input type="url" class="form-input" id="newSocialMediaUrl" placeholder="https://… image, video, or GIF URL" style="flex:1">
                    <select id="newSocialMediaType" class="form-input" style="width:120px">
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="gif">GIF</option>
                    </select>
                    <button class="btn btn-secondary btn-sm" onclick="addSocialMediaItem()"><i class="fas fa-plus"></i> Add</button>
                </div>
                <div id="newSocialMediaList" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"></div>
                <input type="hidden" id="newSocialMediaData" value="[]">
            </div>
            <div style="display:flex;gap:8px">
                <button class="btn btn-primary btn-sm" onclick="submitNewSocialPost(${replyTo || 'null'})">
                    <i class="fas fa-paper-plane"></i> Post
                </button>
                <button class="btn btn-secondary btn-sm" onclick="closeNewSocialEditor()">Cancel</button>
            </div>
        </div>`;
    editor.querySelector('#newSocialContent')?.focus();
}

window.addSocialMediaItem = function() {
    const urlIn  = document.getElementById('newSocialMediaUrl');
    const typeIn = document.getElementById('newSocialMediaType');
    const list   = document.getElementById('newSocialMediaList');
    const hidden = document.getElementById('newSocialMediaData');
    const url    = (urlIn?.value || '').trim();
    if (!url) { showToast('Enter a media URL first', 'error'); return; }

    let items = [];
    try { items = JSON.parse(hidden.value || '[]'); } catch(e) {}
    items.push({ url, type: typeIn?.value || 'image', alt: '' });
    hidden.value = JSON.stringify(items);

    /* Render chip */
    const chip = document.createElement('div');
    chip.style.cssText = 'display:flex;align-items:center;gap:6px;background:var(--surface-alt);padding:4px 10px;border-radius:20px;font-size:0.78rem;border:1px solid var(--border)';
    chip.innerHTML = `<i class="fas fa-${typeIn?.value === 'video' ? 'video' : 'image'}"></i> ${esc(url.split('/').pop().slice(0,30))}
        <button onclick="removeSocialMediaItem(this,'${esc(url)}')" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:0 2px"><i class="fas fa-times"></i></button>`;
    list?.appendChild(chip);
    if (urlIn) urlIn.value = '';
};

window.removeSocialMediaItem = function(btn, url) {
    const hidden = document.getElementById('newSocialMediaData');
    let items = [];
    try { items = JSON.parse(hidden?.value || '[]'); } catch(e) {}
    items = items.filter(m => m.url !== url);
    if (hidden) hidden.value = JSON.stringify(items);
    btn.closest('div')?.remove();
};

window.closeNewSocialEditor = function() {
    const editor = document.getElementById('socialPostEditor');
    if (editor) { editor.style.display = 'none'; editor.innerHTML = ''; }
};

window.submitNewSocialPost = async function(replyTo) {
    const content  = (document.getElementById('newSocialContent')?.value || '').trim();
    const location = (document.getElementById('newSocialLocation')?.value || '').trim();
    const tagsRaw  = (document.getElementById('newSocialTags')?.value || '').trim();
    const tags     = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    let media = [];
    try { media = JSON.parse(document.getElementById('newSocialMediaData')?.value || '[]'); } catch(e) {}

    if (!content) { showToast('Content is required', 'error'); return; }

    try {
        await API.post('/api/blog/posts', { content, location, tags, media, reply_to: replyTo });
        closeNewSocialEditor();
        showToast('Post created', 'success');
        _socialState.page = 1;
        await refreshSocialPosts();
        /* Refresh tag filter */
        try {
            const data = await API.get('/api/blog/tags');
            const sel  = document.getElementById('socialTagFilter');
            if (sel) {
                const current = sel.value;
                sel.innerHTML = '<option value="">All tags</option>';
                (data.tags || []).forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.tag;
                    opt.textContent = '#' + t.tag + ' (' + t.count + ')';
                    if (t.tag === current) opt.selected = true;
                    sel.appendChild(opt);
                });
            }
        } catch(e) {}
    } catch (err) {
        showToast(err.message || 'Could not create post', 'error');
    }
};

/* ── Helpers ── */
function relativeTimeSocial(iso) {
    if (!iso) return '';
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
