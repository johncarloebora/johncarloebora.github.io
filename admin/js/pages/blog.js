// ============================================================
// Blog Posts Editor
// ============================================================

router.register('blog', loadBlogPage);

async function loadBlogPage() {
    const container = document.getElementById('blogEditor');
    renderPageLoading(container);
    try {
        const posts = await API.getBlogPosts();
        renderBlogList(posts, container);
    } catch (err) { renderPageError(container, err); }
}

function renderBlogList(posts, container) {
    if (!posts.length) {
        container.innerHTML = `
            <div class="help-banner"><i class="fas fa-info-circle"></i><div>
                <strong>Blog</strong> — Write posts that appear in your portfolio's blog section. Published posts are included on your live site when you Publish.
            </div></div>
            <div class="empty-state"><i class="fas fa-newspaper"></i><p>No blog posts yet — click <strong>Add Post</strong>.</p></div>`;
        bindBlogAddBtn();
        return;
    }
    let html = `
        <div class="help-banner"><i class="fas fa-info-circle"></i><div>
            <strong>Blog</strong> — Only <strong>Published</strong> posts appear on your live portfolio. Use <strong>Draft</strong> to stage posts before going live.
        </div></div>
        <div class="data-grid">`;
    for (const p of posts) {
        const tags = typeof p.tags === 'string' ? JSON.parse(p.tags || '[]') : (p.tags || []);
        html += `
            <div class="data-card" id="blog-card-${p.id}">
                <div class="data-card-header">
                    <div>
                        <div class="data-card-title">${esc(p.title || 'Untitled')}</div>
                        <div class="data-card-subtitle">${esc(p.slug || '')}</div>
                    </div>
                    <span class="status-badge ${p.published ? 'visible' : 'hidden'}">${p.published ? 'Published' : 'Draft'}</span>
                </div>
                ${p.excerpt ? `<p style="font-size:0.82rem;color:var(--text-secondary);margin:8px 0 4px;line-height:1.5">${esc(p.excerpt)}</p>` : ''}
                ${tags.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
                <!-- Inline edit panel (hidden by default) -->
                <div id="blog-inline-${p.id}" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
                    <div class="form-row" style="gap:8px">
                        <input type="text" class="form-input" id="blog-ie-title-${p.id}" value="${esc(p.title||'')}" placeholder="Title" style="flex:2">
                        <input type="text" class="form-input" id="blog-ie-slug-${p.id}" value="${esc(p.slug||'')}" placeholder="slug" style="flex:1">
                    </div>
                    <label style="display:flex;align-items:center;gap:8px;margin:6px 0;cursor:pointer;font-size:0.82rem">
                        <input type="checkbox" id="blog-ie-pub-${p.id}" ${p.published ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--accent2)">
                        <span>Published</span>
                    </label>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-primary btn-sm" onclick="saveBlogInline(${p.id})"><i class="fas fa-save"></i> Save</button>
                        <button class="btn btn-secondary btn-sm" onclick="toggleBlogInline(${p.id})"><i class="fas fa-times"></i> Cancel</button>
                    </div>
                </div>
                <div class="data-card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="toggleBlogInline(${p.id})" title="Quick edit inline"><i class="fas fa-pen-square"></i> Quick Edit</button>
                    <button class="btn btn-secondary btn-sm" onclick="editBlogPost(${p.id})"><i class="fas fa-edit"></i> Full Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteBlogPost(${p.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
    bindBlogAddBtn();
}

function bindBlogAddBtn() {
    const btn = document.getElementById('addBlogPost');
    if (btn && !btn.dataset.bound) {
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => openBlogModal(null));
    }
}

async function openBlogModal(post) {
    const isEdit = !!post;
    const body = `
        <div class="form-row">
            <div class="form-group">
                <label>Title</label>
                <input type="text" class="form-input" id="blogTitle" value="${esc(post?.title || '')}" placeholder="Post title">
            </div>
            <div class="form-group">
                <label>Slug <span style="color:var(--muted);font-weight:400">(URL key)</span></label>
                <input type="text" class="form-input" id="blogSlug" value="${esc(post?.slug || '')}" placeholder="my-post-slug">
            </div>
        </div>
        <div class="form-group">
            <label>Excerpt <span style="color:var(--muted);font-weight:400">(short summary)</span></label>
            <textarea class="form-input" id="blogExcerpt" rows="2" placeholder="Brief description shown on the blog card…">${esc(post?.excerpt || '')}</textarea>
        </div>
        <div class="form-group">
            <label>Content <span style="color:var(--muted);font-weight:400">(HTML or markdown)</span></label>
            <textarea class="form-input" id="blogContent" rows="8" placeholder="Full post content…">${esc(post?.content || '')}</textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Cover Image URL <span style="color:var(--muted);font-weight:400">(optional)</span></label>
                <input type="text" class="form-input" id="blogCover" value="${esc(post?.cover_image || '')}" placeholder="https://… or R2 path">
            </div>
            <div class="form-group">
                <label>Tags <span style="color:var(--muted);font-weight:400">(comma-separated)</span></label>
                <input type="text" class="form-input" id="blogTags" value="${esc((typeof post?.tags === 'string' ? JSON.parse(post.tags || '[]') : (post?.tags || [])).join(', '))}" placeholder="tech, design, tips">
            </div>
        </div>
        <div class="form-group">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
                <input type="checkbox" id="blogPublished" ${post?.published ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--accent2)">
                <span>Published — show on live portfolio</span>
            </label>
        </div>`;
    const ok = await showEditModal(isEdit ? 'Edit Post' : 'New Blog Post', body);
    if (!ok) return;

    const titleVal = document.getElementById('blogTitle').value.trim();
    if (!titleVal) return showToast('Title is required', 'error');
    const slugVal = document.getElementById('blogSlug').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') || titleVal.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const tagsRaw = document.getElementById('blogTags').value.split(',').map(t => t.trim()).filter(Boolean);

    const data = {
        title: titleVal,
        slug: slugVal,
        excerpt: document.getElementById('blogExcerpt').value,
        content: document.getElementById('blogContent').value,
        cover_image: document.getElementById('blogCover').value,
        tags: JSON.stringify(tagsRaw),
        published: document.getElementById('blogPublished').checked ? 1 : 0,
        sort_order: post?.sort_order || 0,
    };

    try {
        if (isEdit) await API.updateBlogPost(post.id, data);
        else await API.createBlogPost(data);
        showToast(isEdit ? 'Post updated!' : 'Post created!', 'success');
        loadBlogPage();
    } catch (err) { showToast(err.message, 'error'); }
}

window.editBlogPost = async function(id) {
    const post = await API.request(`/api/blog/${id}`);
    await openBlogModal(post);
};

window.toggleBlogInline = function(id) {
    const panel = document.getElementById('blog-inline-' + id);
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? '' : 'none';
    if (panel.style.display !== 'none') {
        const titleInput = document.getElementById('blog-ie-title-' + id);
        if (titleInput) titleInput.focus();
    }
};

window.saveBlogInline = async function(id) {
    const title = document.getElementById('blog-ie-title-' + id)?.value?.trim();
    const slug  = document.getElementById('blog-ie-slug-' + id)?.value?.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-');
    const pub   = document.getElementById('blog-ie-pub-' + id)?.checked ? 1 : 0;
    if (!title) return showToast('Title is required', 'error');
    try {
        await API.updateBlogPost(id, { title, slug, published: pub });
        showToast('Post updated!', 'success');
        loadBlogPage();
    } catch (err) { showToast(err.message, 'error'); }
};

window.deleteBlogPost = async function(id) {
    const ok = await showConfirm('Delete Post', 'This will permanently delete this blog post.', 'warning');
    if (!ok) return;
    try {
        await API.deleteBlogPost(id);
        showToast('Post deleted.', 'success');
        loadBlogPage();
    } catch (err) { showToast(err.message, 'error'); }
};
