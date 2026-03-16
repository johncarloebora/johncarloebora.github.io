// ============================================================
// Socials Editor
// ============================================================

router.register('socials', loadSocialsPage);

async function loadSocialsPage() {
    const container = document.getElementById('socialsEditor');
    container.innerHTML = '<p style="color:var(--muted)">Loading...</p>';

    try {
        const items = await API.getSocials();
        let html = '<div class="data-grid">';
        for (const s of items) {
            html += `<div class="data-item">
                <i class="${esc(s.icon)}" style="font-size:1.3rem;color:var(--accent2);width:30px;text-align:center"></i>
                <div class="data-item-content">
                    <div class="data-item-title">${esc(s.label)}</div>
                    <div class="data-item-subtitle">${esc(s.url)}</div>
                </div>
                <div class="data-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editSocial(${s.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteSocial(${s.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        }
        if (!items.length) html += '<div class="empty-state"><i class="fas fa-share-alt"></i><p>No social links yet</p></div>';
        html += '</div>';
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p style="color:var(--accent1)">Error: ${err.message}</p>`;
    }
}

document.getElementById('addSocial').addEventListener('click', () => openSocialModal());

async function openSocialModal(social = null) {
    const body = `
        <div class="form-group"><label>Platform</label><input type="text" class="form-input" id="modalPlatform" value="${esc(social?.platform || '')}" placeholder="e.g. Facebook"></div>
        <div class="form-group"><label>Label</label><input type="text" class="form-input" id="modalLabel" value="${esc(social?.label || '')}" placeholder="Display text"></div>
        <div class="form-group"><label>URL</label><input type="url" class="form-input" id="modalUrl" value="${esc(social?.url || '')}" placeholder="https://..."></div>
        <div class="form-group"><label>Icon (Font Awesome class)</label><input type="text" class="form-input" id="modalIcon" value="${esc(social?.icon || 'fab fa-link')}" placeholder="e.g. fab fa-facebook"></div>
    `;
    const ok = await showEditModal(social ? 'Edit Social Link' : 'Add Social Link', body);
    if (!ok) return;

    const data = {
        platform: document.getElementById('modalPlatform').value,
        label: document.getElementById('modalLabel').value,
        url: document.getElementById('modalUrl').value,
        icon: document.getElementById('modalIcon').value,
        sort_order: social?.sort_order ?? 99,
    };

    try {
        if (social) {
            await API.updateSocial(social.id, data);
            showToast('Updated!', 'success');
        } else {
            await API.createSocial(data);
            showToast('Created!', 'success');
        }
        loadSocialsPage();
    } catch (err) { showToast(err.message, 'error'); }
}

window.editSocial = async function(id) {
    const s = await API.request(`/api/socials/${id}`);
    openSocialModal(s);
};

window.deleteSocial = async function(id) {
    if (await showConfirm('Delete Social', 'Delete this social link?')) {
        try { await API.deleteSocial(id); showToast('Deleted', 'success'); loadSocialsPage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};
