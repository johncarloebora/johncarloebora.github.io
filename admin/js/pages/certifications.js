// ============================================================
// Certifications Editor
// ============================================================

router.register('certifications', loadCertificationsPage);

async function loadCertificationsPage() {
    const container = document.getElementById('certificationsEditor');
    renderPageLoading(container);
    try {
        const items = await API.getCertifications();
        renderCertificationsList(items, container);
    } catch (err) { renderPageError(container, err); }
}

function renderCertificationsList(items, container) {
    if (!items.length) {
        container.innerHTML = `
            <div class="help-banner"><i class="fas fa-info-circle"></i><div>
                <strong>Certifications</strong> — Showcase your credentials, licenses, and courses. Published when you hit Publish.
            </div></div>
            <div class="empty-state"><i class="fas fa-certificate"></i><p>No certifications yet — click <strong>Add Certification</strong>.</p></div>`;
        bindCertsAddBtn();
        return;
    }
    let html = `
        <div class="help-banner"><i class="fas fa-info-circle"></i><div>
            <strong>Certifications</strong> — These appear in the Certifications section of your portfolio.
        </div></div>
        <div class="data-grid">`;
    for (const c of items) {
        html += `
            <div class="data-card">
                <div class="data-card-header">
                    <div>
                        <div class="data-card-title">${esc(c.title || 'Untitled')}</div>
                        <div class="data-card-subtitle">${esc(c.issuer || '')}${c.date ? ` · ${esc(c.date)}` : ''}</div>
                    </div>
                    <i class="fas fa-certificate" style="color:var(--accent2);font-size:1.4rem"></i>
                </div>
                ${c.description ? `<p style="font-size:0.82rem;color:var(--text-secondary);margin:6px 0;line-height:1.4">${esc(c.description)}</p>` : ''}
                ${c.credential_url ? `<a href="${esc(c.credential_url)}" target="_blank" rel="noopener" style="font-size:0.78rem;color:var(--accent2)"><i class="fas fa-external-link-alt"></i> View Credential</a>` : ''}
                <div class="data-card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editCertification(${c.id})"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCertification(${c.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
    bindCertsAddBtn();
}

function bindCertsAddBtn() {
    const btn = document.getElementById('addCertification');
    if (btn && !btn.dataset.bound) {
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => openCertModal(null));
    }
}

async function openCertModal(item) {
    const isEdit = !!item;
    const body = `
        <div class="form-row">
            <div class="form-group">
                <label>Title</label>
                <input type="text" class="form-input" id="cTitle" value="${esc(item?.title || '')}" placeholder="AWS Solutions Architect">
            </div>
            <div class="form-group">
                <label>Issuer</label>
                <input type="text" class="form-input" id="cIssuer" value="${esc(item?.issuer || '')}" placeholder="Amazon Web Services">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Date</label>
                <input type="text" class="form-input" id="cDate" value="${esc(item?.date || '')}" placeholder="Jan 2024">
            </div>
            <div class="form-group">
                <label>Credential URL <span style="color:var(--muted);font-weight:400">(optional)</span></label>
                <input type="text" class="form-input" id="cUrl" value="${esc(item?.credential_url || '')}" placeholder="https://credly.com/…">
            </div>
        </div>
        <div class="form-group">
            <label>Badge Image URL <span style="color:var(--muted);font-weight:400">(optional)</span></label>
            <input type="text" class="form-input" id="cBadge" value="${esc(item?.badge_image || '')}" placeholder="https://…">
        </div>
        <div class="form-group">
            <label>Description <span style="color:var(--muted);font-weight:400">(optional)</span></label>
            <textarea class="form-input" id="cDesc" rows="2" placeholder="Brief description…">${esc(item?.description || '')}</textarea>
        </div>`;
    const ok = await showEditModal(isEdit ? 'Edit Certification' : 'Add Certification', body);
    if (!ok) return;

    const title = document.getElementById('cTitle').value.trim();
    if (!title) return showToast('Title is required', 'error');

    const data = {
        title,
        issuer:         document.getElementById('cIssuer').value,
        date:           document.getElementById('cDate').value,
        credential_url: document.getElementById('cUrl').value,
        badge_image:    document.getElementById('cBadge').value,
        description:    document.getElementById('cDesc').value,
        sort_order:     item?.sort_order || 0,
    };

    try {
        if (isEdit) await API.updateCertification(item.id, data);
        else await API.createCertification(data);
        showToast(isEdit ? 'Updated!' : 'Created!', 'success');
        loadCertificationsPage();
    } catch (err) { showToast(err.message, 'error'); }
}

window.editCertification = async function(id) {
    const item = await API.request(`/api/certifications/${id}`);
    await openCertModal(item);
};

window.deleteCertification = async function(id) {
    const ok = await showConfirm('Delete Certification', 'This will permanently delete this certification.', 'warning');
    if (!ok) return;
    try {
        await API.deleteCertification(id);
        showToast('Deleted.', 'success');
        loadCertificationsPage();
    } catch (err) { showToast(err.message, 'error'); }
};
