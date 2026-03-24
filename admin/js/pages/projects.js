// ============================================================
// Projects Editor — media picker for thumbnail, tag chip editor
// ============================================================

router.register('projects', loadProjectsPage);

async function loadProjectsPage() {
    const container = document.getElementById('projectsEditor');
    renderPageLoading(container);

    try {
        const items = await API.getProjects();
        let html = `
            <div class="help-banner">
                <i class="fas fa-info-circle"></i>
                <div>
                    <strong>Projects</strong> — Each card shows a thumbnail, title, description, tags, and optionally opens a
                    <strong>photo gallery</strong> or <strong>video gallery</strong> when clicked.
                    Upload images first in <a href="#media" onclick="router.navigate('media')">Media Library</a>,
                    then come back here to link them.
                </div>
            </div>
            <div class="data-grid">`;

        for (const proj of items) {
            const tags = typeof proj.tags === 'string' ? JSON.parse(proj.tags || '[]') : (proj.tags || []);
            html += `
                <div class="data-item" style="gap:14px">
                    <div style="width:88px;height:64px;border-radius:8px;overflow:hidden;background:var(--surface3);flex-shrink:0;border:1px solid var(--border)">
                        ${proj.thumbnail_path
                            ? `<img src="${esc(proj.thumbnail_path)}" style="width:100%;height:100%;object-fit:cover" loading="lazy" onerror="this.style.display='none'">`
                            : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted)"><i class="fas fa-image" style="font-size:1.4rem"></i></div>`}
                    </div>
                    <div class="data-item-content">
                        <div class="data-item-title">${esc(proj.title)}</div>
                        <div class="data-item-subtitle" style="margin-top:2px">${esc((proj.description || '').substring(0, 80))}${(proj.description || '').length > 80 ? '…' : ''}</div>
                        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">
                            ${tags.map(t => `<span class="tag-chip" style="font-size:0.7rem;padding:2px 7px">${esc(t)}</span>`).join('')}
                            ${proj.gallery_type ? `<span class="status-badge ${proj.gallery_type === 'video' ? 'unpublished' : 'visible'}" style="font-size:0.68rem">
                                <i class="fas fa-${proj.gallery_type === 'video' ? 'film' : 'images'}"></i> ${proj.gallery_type === 'video' ? 'Video Gallery' : 'Image Gallery'}
                            </span>` : ''}
                        </div>
                    </div>
                    <div class="data-item-actions">
                        <button class="btn btn-secondary btn-sm" onclick="editProject(${proj.id})"><i class="fas fa-edit" aria-hidden="true"></i> Edit</button>
                        <button class="btn btn-danger btn-sm" aria-label="Delete" onclick="deleteProject(${proj.id})"><i class="fas fa-trash" aria-hidden="true"></i></button>
                    </div>
                </div>`;
        }
        if (!items.length) html += '<div class="empty-state"><i class="fas fa-folder-open"></i><p>No projects yet — click <strong>Add Project</strong>.</p></div>';
        html += '</div>';
        container.innerHTML = html;
    } catch (err) {
        renderPageError(container, err);
    }
}

document.getElementById('addProject').addEventListener('click', () => openProjectModal());

async function openProjectModal(proj = null) {
    const tags = proj ? (typeof proj.tags === 'string' ? JSON.parse(proj.tags || '[]') : (proj.tags || [])) : [];

    // Pre-load thumbnail media for picker
    let thumbMedia = [];
    try { thumbMedia = await API.getMedia('thumbnail'); } catch {}

    const body = `
        <div class="form-group">
            <label>Project Title</label>
            <input type="text" class="form-input" id="modalTitle" value="${esc(proj?.title || '')}" placeholder="e.g. Portfolio Website" maxlength="80">
        </div>
        <div class="form-group">
            <label>Description <span style="font-size:0.72rem;color:var(--muted)">— shown below the project card</span></label>
            <textarea class="form-input" id="modalDesc" rows="3" placeholder="Short summary of what this project is and what you did..." maxlength="300">${esc(proj?.description || '')}</textarea>
            <span class="char-counter" id="projDescCounter">${(proj?.description || '').length}/300</span>
        </div>

        <div class="form-group">
            <label>Thumbnail Image</label>
            <div class="card-description" style="margin-bottom:8px">
                Pick an image from your <strong>Thumbnail</strong> folder in the Media Library, or paste a direct URL.
            </div>
            <div style="display:flex;gap:8px;align-items:center">
                <div class="media-picker-preview" id="thumbPreviewBox">
                    ${proj?.thumbnail_path ? `<img src="${esc(proj.thumbnail_path)}" id="thumbPreviewImg">` : `<i class="fas fa-image" style="color:var(--muted)"></i>`}
                </div>
                <div style="flex:1">
                    <input type="text" class="form-input" id="modalThumb" value="${esc(proj?.thumbnail_path || '')}"
                           placeholder="thumbnail/filename.jpg"
                           oninput="updateThumbPreview(this.value)" style="margin-bottom:6px">
                    ${thumbMedia.length ? `
                    <select class="form-input" id="thumbPicker" onchange="pickThumb(this.value)" style="font-size:0.82rem">
                        <option value="">— Pick from Media Library —</option>
                        ${thumbMedia.map(m => `<option value="${esc(m.url)}">${esc(m.filename)}</option>`).join('')}
                    </select>` : `<div class="field-hint"><i class="fas fa-info-circle"></i>No thumbnails found. Upload images in <strong>Media Library → Thumbnail</strong> first.</div>`}
                </div>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label>Gallery Type</label>
                <select class="form-input" id="modalGalleryType">
                    <option value=""     ${!proj?.gallery_type                   ? 'selected' : ''}>No Gallery — card opens nothing</option>
                    <option value="image"${proj?.gallery_type === 'image'        ? 'selected' : ''}>Image Gallery — shows photos</option>
                    <option value="video"${proj?.gallery_type === 'video'        ? 'selected' : ''}>Video Gallery — shows videos</option>
                </select>
                <div class="field-hint"><i class="fas fa-info-circle"></i>When a visitor clicks the project, it opens this gallery type.</div>
            </div>
            <div class="form-group">
                <label>Gallery Folder</label>
                <input type="text" class="form-input" id="modalGalleryFolder" value="${esc(proj?.gallery_folder || '')}" placeholder="e.g. layout">
                <div class="field-hint"><i class="fas fa-info-circle"></i>The folder name in your R2 Media Library that holds this project's gallery files.</div>
            </div>
        </div>

        <div class="form-group">
            <label>Tags <span style="font-size:0.72rem;color:var(--muted)">— tech stack, keywords</span></label>
            <div class="tag-editor" id="tagEditor" onclick="document.getElementById('tagInput').focus()">
                ${tags.map(t => `<span class="tag-chip">${esc(t)}<button type="button" aria-label="Remove" onclick="removeTag(this,event)"><i class="fas fa-times" aria-hidden="true"></i></button></span>`).join('')}
                <input type="text" class="tag-input" id="tagInput" placeholder="Type a tag and press Enter…"
                       onkeydown="if(event.key==='Enter'||event.key===','){event.preventDefault();addTagFromInput()}"
                       onblur="addTagFromInput()">
            </div>
            <div class="field-hint"><i class="fas fa-info-circle"></i>Press <strong>Enter</strong> or <strong>,</strong> to add a tag. Click the × to remove one.</div>
        </div>
    `;

    const ok = await showEditModal(proj ? 'Edit Project' : 'Add Project', body);
    if (!ok) return;

    const tagChips = document.querySelectorAll('#tagEditor .tag-chip');
    const newTags = Array.from(tagChips).map(c => c.textContent.trim().replace(/×$/, '').trim()).filter(Boolean);

    const data = {
        title:          document.getElementById('modalTitle').value,
        description:    document.getElementById('modalDesc').value,
        thumbnail_path: document.getElementById('modalThumb').value || null,
        gallery_type:   document.getElementById('modalGalleryType').value || null,
        gallery_folder: document.getElementById('modalGalleryFolder').value || null,
        tags:           JSON.stringify(newTags),
        sort_order:     proj?.sort_order ?? 99,
    };

    try {
        if (proj) {
            await API.updateProject(proj.id, data);
            showToast('Project updated!', 'success');
        } else {
            await API.createProject(data);
            showToast('Project created!', 'success');
        }
        loadProjectsPage();
    } catch (err) { showToast(err.message, 'error'); }
}

window.pickThumb = function(url) {
    if (!url) return;
    document.getElementById('modalThumb').value = url;
    window.updateThumbPreview(url);
};

window.updateThumbPreview = function(url) {
    const box = document.getElementById('thumbPreviewBox');
    if (!box) return;
    if (url) {
        box.innerHTML = `<img src="${url}" id="thumbPreviewImg" style="width:100%;height:100%;object-fit:cover" onerror="this.style.opacity=0.3">`;
    } else {
        box.innerHTML = `<i class="fas fa-image" style="color:var(--muted)"></i>`;
    }
};

window.addTagFromInput = function() {
    const input = document.getElementById('tagInput');
    if (!input) return;
    const val = input.value.replace(/,/g,'').trim();
    if (!val) return;
    const editor = document.getElementById('tagEditor');
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `${val}<button type="button" aria-label="Remove" onclick="removeTag(this,event)"><i class="fas fa-times" aria-hidden="true"></i></button>`;
    editor.insertBefore(chip, input);
    input.value = '';
};

window.removeTag = function(btn, e) {
    if (e) e.stopPropagation();
    btn.closest('.tag-chip').remove();
};

window.editProject = async function(id) {
    const proj = await API.request(`/api/projects/${id}`);
    openProjectModal(proj);
};

window.deleteProject = async function(id) {
    if (await showConfirm('Delete Project', 'Delete this project card permanently?', 'warning')) {
        try { await API.deleteProject(id); showToast('Deleted', 'success'); loadProjectsPage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};
