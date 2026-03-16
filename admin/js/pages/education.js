// ============================================================
// Education Editor
// ============================================================

router.register('education', loadEducationPage);

async function loadEducationPage() {
    const container = document.getElementById('educationEditor');
    container.innerHTML = '<p style="color:var(--muted)">Loading...</p>';

    try {
        const items = await API.getEducation();
        let html = '<div class="data-grid">';
        for (const edu of items) {
            const entries = typeof edu.entries === 'string' ? JSON.parse(edu.entries) : (edu.entries || []);
            html += `<div class="data-item" style="flex-direction:column;align-items:stretch">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div class="data-item-title"><i class="${esc(edu.card_icon)}" style="margin-right:8px;color:var(--accent2)"></i>${esc(edu.card_title)}</div>
                    <div class="data-item-actions">
                        <button class="btn btn-secondary btn-sm" onclick="editEducation(${edu.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="deleteEducation(${edu.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div style="margin-top:8px;font-size:0.85rem;color:var(--muted)">
                    ${entries.map(e => `<div style="margin-bottom:6px"><strong>${esc(e.title)}</strong>${e.date ? ` <span style="color:var(--accent2)">(${esc(e.date)})</span>` : ''}<br>${(e.lines || []).map(l => esc(l)).join('<br>')}</div>`).join('')}
                </div>
            </div>`;
        }
        if (!items.length) html += '<div class="empty-state"><i class="fas fa-graduation-cap"></i><p>No education entries</p></div>';
        html += '</div>';
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p style="color:var(--accent1)">Error: ${err.message}</p>`;
    }
}

document.getElementById('addEducation').addEventListener('click', () => openEduModal());

async function openEduModal(edu = null) {
    const entries = edu ? (typeof edu.entries === 'string' ? JSON.parse(edu.entries) : (edu.entries || [])) : [];
    const body = `
        <div class="form-group"><label>Card Title</label><input type="text" class="form-input" id="modalTitle" value="${esc(edu?.card_title || '')}"></div>
        <div class="form-group"><label>Card Icon</label><input type="text" class="form-input" id="modalIcon" value="${esc(edu?.card_icon || 'fas fa-graduation-cap')}"></div>
        <div class="form-group">
            <label>Entries (JSON format)</label>
            <textarea class="form-input" id="modalEntries" rows="10" placeholder='[{"title":"School","date":"2019-2024","lines":["Degree","Detail"]}]'>${esc(JSON.stringify(entries, null, 2))}</textarea>
            <small style="color:var(--muted)">Each entry: {"title", "date" (optional), "lines": ["line1", "line2"]}</small>
        </div>
    `;
    const ok = await showEditModal(edu ? 'Edit Education Card' : 'Add Education Card', body);
    if (!ok) return;

    try {
        const data = {
            card_title: document.getElementById('modalTitle').value,
            card_icon: document.getElementById('modalIcon').value,
            entries: document.getElementById('modalEntries').value,
            sort_order: edu?.sort_order ?? 99,
        };
        if (edu) {
            await API.updateEducation(edu.id, data);
            showToast('Updated!', 'success');
        } else {
            await API.createEducation(data);
            showToast('Created!', 'success');
        }
        loadEducationPage();
    } catch (err) { showToast(err.message, 'error'); }
}

window.editEducation = async function(id) {
    const edu = await API.request(`/api/education/${id}`);
    openEduModal(edu);
};

window.deleteEducation = async function(id) {
    if (await showConfirm('Delete Education', 'Delete this education card?')) {
        try { await API.deleteEducation(id); showToast('Deleted', 'success'); loadEducationPage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};
