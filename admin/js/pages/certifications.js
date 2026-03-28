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
            <div class="data-card" id="cert-card-${c.id}">
                <div class="data-card-header">
                    <div>
                        <div class="data-card-title">${esc(c.title || 'Untitled')}</div>
                        <div class="data-card-subtitle">${esc(c.issuer || '')}${c.date ? ` · ${esc(c.date)}` : ''}</div>
                    </div>
                    <i class="fas fa-certificate" style="color:var(--accent2);font-size:1.4rem"></i>
                </div>
                ${c.description ? `<p style="font-size:0.82rem;color:var(--text-secondary);margin:6px 0;line-height:1.4">${esc(c.description)}</p>` : ''}
                ${c.credential_url ? `<a href="${esc(c.credential_url)}" target="_blank" rel="noopener" style="font-size:0.78rem;color:var(--accent2)"><i class="fas fa-external-link-alt"></i> View Credential</a>` : ''}
                <!-- Inline edit panel -->
                <div id="cert-inline-${c.id}" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
                    <div class="form-row" style="gap:8px">
                        <input type="text" class="form-input" id="cert-ie-title-${c.id}" value="${esc(c.title||'')}" placeholder="Title" style="flex:2">
                        <input type="text" class="form-input" id="cert-ie-issuer-${c.id}" value="${esc(c.issuer||'')}" placeholder="Issuer" style="flex:1">
                        <input type="text" class="form-input" id="cert-ie-date-${c.id}" value="${esc(c.date||'')}" placeholder="YYYY-MM" style="flex:0 0 100px">
                    </div>
                    <div style="display:flex;gap:6px;margin-top:6px">
                        <button class="btn btn-primary btn-sm" onclick="saveCertInline(${c.id})"><i class="fas fa-save"></i> Save</button>
                        <button class="btn btn-secondary btn-sm" onclick="toggleCertInline(${c.id})"><i class="fas fa-times"></i> Cancel</button>
                    </div>
                </div>
                <div class="data-card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="toggleCertInline(${c.id})" title="Quick edit"><i class="fas fa-pen-square"></i> Quick Edit</button>
                    <button class="btn btn-secondary btn-sm" onclick="editCertification(${c.id})"><i class="fas fa-edit"></i> Full Edit</button>
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

window.toggleCertInline = function(id) {
    const panel = document.getElementById('cert-inline-' + id);
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? '' : 'none';
    if (panel.style.display !== 'none') {
        const input = document.getElementById('cert-ie-title-' + id);
        if (input) input.focus();
    }
};

window.saveCertInline = async function(id) {
    const title  = document.getElementById('cert-ie-title-' + id)?.value?.trim();
    const issuer = document.getElementById('cert-ie-issuer-' + id)?.value?.trim();
    const date   = document.getElementById('cert-ie-date-' + id)?.value?.trim();
    if (!title) return showToast('Title is required', 'error');
    try {
        await API.updateCertification(id, { title, issuer, date });
        showToast('Certification updated!', 'success');
        loadCertificationsPage();
    } catch (err) { showToast(err.message, 'error'); }
};

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
