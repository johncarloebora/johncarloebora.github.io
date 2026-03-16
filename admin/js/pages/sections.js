// ============================================================
// Section Manager — Add/Remove/Reorder sections + nav config
// ============================================================

router.register('sections', loadSectionsPage);

async function loadSectionsPage() {
    const container = document.getElementById('sectionsEditor');
    container.innerHTML = '<p style="color:var(--muted)">Loading...</p>';

    try {
        const sections = await API.getSections();
        let html = '<div class="admin-card"><div class="admin-card-header"><h3>Section Order & Visibility</h3></div>';
        html += '<p style="color:var(--muted);font-size:0.85rem;margin-bottom:16px">Use the arrow buttons to reorder. Toggle visibility with the eye icon. New sections auto-appear in the portfolio navbar.</p>';
        html += '<div id="sectionsList">';

        for (let i = 0; i < sections.length; i++) {
            const s = sections[i];
            html += `<div class="section-list-item" data-id="${esc(s.id)}">
                <div style="display:flex;flex-direction:column;gap:2px">
                    <button class="btn btn-icon btn-sm btn-secondary" onclick="moveSectionUp('${esc(s.id)}')" ${i === 0 ? 'disabled' : ''}><i class="fas fa-chevron-up"></i></button>
                    <button class="btn btn-icon btn-sm btn-secondary" onclick="moveSectionDown('${esc(s.id)}')" ${i === sections.length - 1 ? 'disabled' : ''}><i class="fas fa-chevron-down"></i></button>
                </div>
                <div class="section-icon"><i class="${esc(s.nav_icon)}"></i></div>
                <div class="section-info">
                    <strong>${esc(s.title)}</strong>
                    <div class="section-id">#${esc(s.id)} · ${s.type}</div>
                </div>
                <button class="visibility-toggle ${s.visible ? '' : 'hidden-section'}" onclick="toggleSectionVisibility('${esc(s.id)}', ${s.visible ? 0 : 1})">
                    <i class="fas fa-${s.visible ? 'eye' : 'eye-slash'}"></i>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="editSection('${esc(s.id)}')"><i class="fas fa-edit"></i></button>
                ${s.type === 'custom' ? `<button class="btn btn-danger btn-sm" onclick="deleteSection('${esc(s.id)}')"><i class="fas fa-trash"></i></button>` : ''}
            </div>`;
        }

        html += '</div></div>';
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p style="color:var(--accent1)">Error: ${err.message}</p>`;
    }
}

document.getElementById('addSection').addEventListener('click', async () => {
    const body = `
        <div class="form-group"><label>Section ID (slug, e.g. "portfolio")</label><input type="text" class="form-input" id="modalId" placeholder="lowercase-slug"></div>
        <div class="form-group"><label>Title</label><input type="text" class="form-input" id="modalTitle"></div>
        <div class="form-group"><label>Nav Icon</label><input type="text" class="form-input" id="modalIcon" value="fas fa-star"></div>
        <div class="form-group"><label>Nav Label</label><input type="text" class="form-input" id="modalLabel"></div>
        <div class="form-group"><label>Content (HTML)</label><textarea class="form-input" id="modalConfig" rows="6" placeholder="<p>Your custom section content...</p>"></textarea></div>
    `;
    const ok = await showEditModal('Add Custom Section', body);
    if (!ok) return;

    try {
        await API.createSection({
            id: document.getElementById('modalId').value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            title: document.getElementById('modalTitle').value,
            nav_icon: document.getElementById('modalIcon').value,
            nav_label: document.getElementById('modalLabel').value,
            type: 'custom',
            visible: 1,
            sort_order: 99,
            config: JSON.stringify({ html: document.getElementById('modalConfig').value }),
        });
        showToast('Section created!', 'success');
        loadSectionsPage();
    } catch (err) { showToast(err.message, 'error'); }
});

window.editSection = async function(id) {
    const s = await API.request(`/api/sections/${id}`);
    const config = typeof s.config === 'string' ? JSON.parse(s.config || '{}') : (s.config || {});
    const body = `
        <div class="form-group"><label>Title</label><input type="text" class="form-input" id="modalTitle" value="${esc(s.title)}"></div>
        <div class="form-group"><label>Nav Icon</label><input type="text" class="form-input" id="modalIcon" value="${esc(s.nav_icon)}"></div>
        <div class="form-group"><label>Nav Label</label><input type="text" class="form-input" id="modalLabel" value="${esc(s.nav_label)}"></div>
        ${s.type === 'custom' ? `<div class="form-group"><label>Content (HTML)</label><textarea class="form-input" id="modalConfig" rows="6">${esc(config.html || '')}</textarea></div>` : ''}
    `;
    const ok = await showEditModal('Edit Section', body);
    if (!ok) return;

    const data = {
        title: document.getElementById('modalTitle').value,
        nav_icon: document.getElementById('modalIcon').value,
        nav_label: document.getElementById('modalLabel').value,
    };
    if (s.type === 'custom') {
        data.config = JSON.stringify({ html: document.getElementById('modalConfig').value });
    }

    try {
        await API.updateSection(id, data);
        showToast('Updated!', 'success');
        loadSectionsPage();
    } catch (err) { showToast(err.message, 'error'); }
};

window.deleteSection = async function(id) {
    if (await showConfirm('Delete Section', 'This will permanently remove this custom section.')) {
        try { await API.deleteSection(id); showToast('Deleted', 'success'); loadSectionsPage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};

window.toggleSectionVisibility = async function(id, visible) {
    try {
        await API.updateSection(id, { visible });
        loadSectionsPage();
    } catch (err) { showToast(err.message, 'error'); }
};

window.moveSectionUp = async function(id) { await reorderSection(id, -1); };
window.moveSectionDown = async function(id) { await reorderSection(id, 1); };

async function reorderSection(id, direction) {
    try {
        const sections = await API.getSections();
        const idx = sections.findIndex(s => s.id === id);
        if (idx < 0) return;

        const swapIdx = idx + direction;
        if (swapIdx < 0 || swapIdx >= sections.length) return;

        const items = sections.map((s, i) => ({ id: s.id, sort_order: i }));
        // Swap
        const temp = items[idx].sort_order;
        items[idx].sort_order = items[swapIdx].sort_order;
        items[swapIdx].sort_order = temp;

        await API.reorderSections(items);
        loadSectionsPage();
    } catch (err) { showToast(err.message, 'error'); }
}
