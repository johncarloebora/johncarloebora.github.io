// ============================================================
// Projects Editor
// ============================================================

router.register('projects', loadProjectsPage);

async function loadProjectsPage() {
    const container = document.getElementById('projectsEditor');
    container.innerHTML = '<p style="color:var(--muted)">Loading...</p>';

    try {
        const items = await API.getProjects();
        let html = '<div class="data-grid">';
        for (const proj of items) {
            const tags = typeof proj.tags === 'string' ? JSON.parse(proj.tags) : (proj.tags || []);
            html += `<div class="data-item" style="gap:16px">
                <div style="width:80px;height:60px;border-radius:8px;overflow:hidden;background:var(--surface2);flex-shrink:0">
                    ${proj.thumbnail_path ? `<img src="${esc(proj.thumbnail_path)}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted)"><i class="fas fa-image"></i></div>'}
                </div>
                <div class="data-item-content">
                    <div class="data-item-title">${esc(proj.title)}</div>
                    <div class="data-item-subtitle">${esc(proj.description || '')}</div>
                    <div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap">
                        ${tags.map(t => `<span style="font-size:0.7rem;padding:2px 6px;background:var(--surface);border:1px solid var(--border);border-radius:4px">${esc(t)}</span>`).join('')}
                    </div>
                </div>
                <div class="data-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editProject(${proj.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProject(${proj.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        }
        if (!items.length) html += '<div class="empty-state"><i class="fas fa-folder-open"></i><p>No projects yet</p></div>';
        html += '</div>';
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p style="color:var(--accent1)">Error: ${err.message}</p>`;
    }
}

document.getElementById('addProject').addEventListener('click', () => openProjectModal());

async function openProjectModal(proj = null) {
    const tags = proj ? (typeof proj.tags === 'string' ? JSON.parse(proj.tags) : (proj.tags || [])) : [];
    const body = `
        <div class="form-group"><label>Title</label><input type="text" class="form-input" id="modalTitle" value="${esc(proj?.title || '')}"></div>
        <div class="form-group"><label>Description</label><textarea class="form-input" id="modalDesc" rows="3">${esc(proj?.description || '')}</textarea></div>
        <div class="form-group"><label>Thumbnail Path (R2 path, e.g. layout/image.jpg)</label><input type="text" class="form-input" id="modalThumb" value="${esc(proj?.thumbnail_path || '')}"></div>
        <div class="form-row">
            <div class="form-group"><label>Gallery Type</label>
                <select class="form-input" id="modalGalleryType">
                    <option value="" ${!proj?.gallery_type ? 'selected' : ''}>None</option>
                    <option value="image" ${proj?.gallery_type === 'image' ? 'selected' : ''}>Image Gallery</option>
                    <option value="video" ${proj?.gallery_type === 'video' ? 'selected' : ''}>Video Gallery</option>
                </select>
            </div>
            <div class="form-group"><label>Gallery Folder</label><input type="text" class="form-input" id="modalGalleryFolder" value="${esc(proj?.gallery_folder || '')}" placeholder="e.g. layout"></div>
        </div>
        <div class="form-group"><label>Tags (comma-separated)</label><input type="text" class="form-input" id="modalTags" value="${esc(tags.join(', '))}"></div>
    `;
    const ok = await showEditModal(proj ? 'Edit Project' : 'Add Project', body);
    if (!ok) return;

    const newTags = document.getElementById('modalTags').value.split(',').map(s => s.trim()).filter(Boolean);
    const data = {
        title: document.getElementById('modalTitle').value,
        description: document.getElementById('modalDesc').value,
        thumbnail_path: document.getElementById('modalThumb').value || null,
        gallery_type: document.getElementById('modalGalleryType').value || null,
        gallery_folder: document.getElementById('modalGalleryFolder').value || null,
        tags: JSON.stringify(newTags),
        sort_order: proj?.sort_order ?? 99,
    };

    try {
        if (proj) {
            await API.updateProject(proj.id, data);
            showToast('Updated!', 'success');
        } else {
            await API.createProject(data);
            showToast('Created!', 'success');
        }
        loadProjectsPage();
    } catch (err) { showToast(err.message, 'error'); }
}

window.editProject = async function(id) {
    const proj = await API.request(`/api/projects/${id}`);
    openProjectModal(proj);
};

window.deleteProject = async function(id) {
    if (await showConfirm('Delete Project', 'Delete this project card?')) {
        try { await API.deleteProject(id); showToast('Deleted', 'success'); loadProjectsPage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};
