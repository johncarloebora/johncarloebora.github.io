// ============================================================
// Experience Editor — richer inline editor with bullet builder
// ============================================================

router.register('experience', loadExperiencePage);

async function loadExperiencePage() {
    const container = document.getElementById('experienceEditor');
    container.innerHTML = '<p style="color:var(--muted)">Loading...</p>';

    try {
        const items = await API.getExperiences();
        let html = `
            <div class="help-banner">
                <i class="fas fa-info-circle"></i>
                <div>
                    <strong>Experience Timeline</strong> — Each entry appears as an expandable card on the portfolio.
                    Fill in the job title, company, date range, and add bullet points describing your responsibilities.
                    Add a <strong>Badge</strong> like "Current" to highlight your latest role.
                </div>
            </div>
            <div class="data-grid">`;

        for (const exp of items) {
            const bullets = typeof exp.bullets === 'string' ? JSON.parse(exp.bullets || '[]') : (exp.bullets || []);
            html += `
                <div class="data-item" style="flex-direction:column;align-items:stretch;gap:8px">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
                        <div style="flex:1;min-width:0">
                            <div class="data-item-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                                ${esc(exp.title)}
                                ${exp.badge ? `<span class="status-badge published"><i class="fas fa-tag"></i>${esc(exp.badge)}</span>` : ''}
                            </div>
                            <div class="data-item-subtitle" style="display:flex;align-items:center;gap:10px;margin-top:3px;flex-wrap:wrap">
                                <span><i class="fas fa-building" style="color:var(--accent2);margin-right:4px"></i>${esc(exp.company)}</span>
                                <span><i class="fas fa-calendar-alt" style="color:var(--muted);margin-right:4px"></i>${esc(exp.date_range)}</span>
                            </div>
                        </div>
                        <div class="data-item-actions" style="flex-shrink:0">
                            <button class="btn btn-secondary btn-sm" onclick="editExperience(${exp.id})"><i class="fas fa-edit"></i> Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteExperience(${exp.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    ${bullets.length ? `
                    <ul style="padding-left:18px;margin:0">
                        ${bullets.slice(0,3).map(b => `<li style="font-size:0.8rem;color:var(--muted);line-height:1.6">${esc(b)}</li>`).join('')}
                        ${bullets.length > 3 ? `<li style="font-size:0.78rem;color:var(--accent2)">+${bullets.length - 3} more bullet(s)…</li>` : ''}
                    </ul>` : '<p style="font-size:0.8rem;color:var(--muted);opacity:0.6">No bullet points yet.</p>'}
                </div>`;
        }

        if (!items.length) html += '<div class="empty-state"><i class="fas fa-briefcase"></i><p>No experience entries yet — click <strong>Add Entry</strong>.</p></div>';
        html += '</div>';
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p style="color:var(--accent1)">Error: ${err.message}</p>`;
    }
}

document.getElementById('addExperience').addEventListener('click', () => openExpModal());

async function openExpModal(exp = null) {
    const bullets = exp ? (typeof exp.bullets === 'string' ? JSON.parse(exp.bullets || '[]') : (exp.bullets || [])) : [''];
    const body = `
        <div class="card-description">
            Fill in the details for this work experience. Bullet points will appear in the expandable timeline card on your portfolio.
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Job Title</label>
                <input type="text" class="form-input" id="modalTitle" value="${esc(exp?.title || '')}" placeholder="e.g. Software Engineer" maxlength="80">
            </div>
            <div class="form-group">
                <label>Badge <span style="font-size:0.72rem;color:var(--muted)">(optional highlight label)</span></label>
                <input type="text" class="form-input" id="modalBadge" value="${esc(exp?.badge || '')}" placeholder="e.g. Current" maxlength="20">
                <div class="field-hint"><i class="fas fa-info-circle"></i>Leave empty for past roles. Use "Current" for your active job.</div>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Company / Organisation</label>
                <input type="text" class="form-input" id="modalCompany" value="${esc(exp?.company || '')}" placeholder="e.g. Accenture Philippines" maxlength="80">
            </div>
            <div class="form-group">
                <label>Date Range</label>
                <input type="text" class="form-input" id="modalDate" value="${esc(exp?.date_range || '')}" placeholder="e.g. June 2025 – Present">
                <div class="field-hint"><i class="fas fa-info-circle"></i>Use "Present" for current roles.</div>
            </div>
        </div>
        <div class="form-group">
            <label>Bullet Points <span style="font-size:0.72rem;color:var(--muted)">— what you did / achieved</span></label>
            <div class="card-description" style="margin-bottom:8px">Write one responsibility or achievement per row. Start with an action verb (e.g. "Automated…", "Led…", "Designed…").</div>
            <div class="bullet-list" id="bulletList">
                ${bullets.map((b, i) => `
                    <div class="bullet-item">
                        <textarea class="form-input bullet-input" rows="2" placeholder="e.g. Automated compliance tracking using VBA, reducing errors by 40%">${esc(b)}</textarea>
                        <button class="btn btn-danger btn-icon btn-sm" onclick="this.parentElement.remove()" title="Remove bullet"><i class="fas fa-times"></i></button>
                    </div>`).join('')}
            </div>
            <button class="btn btn-secondary btn-sm bullet-add-btn" onclick="addBullet()"><i class="fas fa-plus"></i> Add Bullet Point</button>
        </div>
    `;
    const ok = await showEditModal(exp ? 'Edit Experience' : 'Add Experience', body);
    if (!ok) return;

    const newBullets = Array.from(document.querySelectorAll('#bulletList .bullet-input'))
        .map(t => t.value.trim()).filter(Boolean);

    const data = {
        date_range: document.getElementById('modalDate').value,
        title:      document.getElementById('modalTitle').value,
        company:    document.getElementById('modalCompany').value,
        badge:      document.getElementById('modalBadge').value || null,
        bullets:    JSON.stringify(newBullets),
        sort_order: exp?.sort_order ?? 99,
    };

    try {
        if (exp) {
            await API.updateExperience(exp.id, data);
            showToast('Updated!', 'success');
        } else {
            await API.createExperience(data);
            showToast('Experience entry created!', 'success');
        }
        loadExperiencePage();
    } catch (err) { showToast(err.message, 'error'); }
}

window.addBullet = function() {
    const list = document.getElementById('bulletList');
    if (!list) return;
    const div = document.createElement('div');
    div.className = 'bullet-item';
    div.innerHTML = `<textarea class="form-input bullet-input" rows="2" placeholder="e.g. Led a team of 3 to deliver project on time"></textarea>
        <button class="btn btn-danger btn-icon btn-sm" onclick="this.parentElement.remove()" title="Remove"><i class="fas fa-times"></i></button>`;
    list.appendChild(div);
    div.querySelector('textarea').focus();
};

window.editExperience = async function(id) {
    const exp = await API.request(`/api/experiences/${id}`);
    openExpModal(exp);
};

window.deleteExperience = async function(id) {
    if (await showConfirm('Delete Experience', 'Delete this experience entry permanently?', 'warning')) {
        try { await API.deleteExperience(id); showToast('Deleted', 'success'); loadExperiencePage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};
