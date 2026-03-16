// ============================================================
// Experience Editor
// ============================================================

router.register('experience', loadExperiencePage);

async function loadExperiencePage() {
    const container = document.getElementById('experienceEditor');
    container.innerHTML = '<p style="color:var(--muted)">Loading...</p>';

    try {
        const items = await API.getExperiences();
        let html = '<div class="data-grid">';
        for (const exp of items) {
            const bullets = typeof exp.bullets === 'string' ? JSON.parse(exp.bullets) : (exp.bullets || []);
            html += `<div class="data-item" style="flex-direction:column;align-items:stretch">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div>
                        <div class="data-item-title">${esc(exp.title)} ${exp.badge ? `<span style="color:var(--accent2);font-size:0.75rem;padding:2px 6px;border:1px solid var(--accent2);border-radius:4px">${esc(exp.badge)}</span>` : ''}</div>
                        <div class="data-item-subtitle">${esc(exp.company)}</div>
                        <div class="data-item-subtitle"><i class="fas fa-calendar-alt"></i> ${esc(exp.date_range)}</div>
                    </div>
                    <div class="data-item-actions">
                        <button class="btn btn-secondary btn-sm" onclick="editExperience(${exp.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="deleteExperience(${exp.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <ul style="margin-top:8px;padding-left:20px;font-size:0.85rem;color:var(--muted)">
                    ${bullets.slice(0, 2).map(b => `<li>${esc(b)}</li>`).join('')}
                    ${bullets.length > 2 ? `<li style="color:var(--accent2)">+${bullets.length - 2} more...</li>` : ''}
                </ul>
            </div>`;
        }
        if (!items.length) html += '<div class="empty-state"><i class="fas fa-briefcase"></i><p>No experience entries</p></div>';
        html += '</div>';
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p style="color:var(--accent1)">Error: ${err.message}</p>`;
    }
}

document.getElementById('addExperience').addEventListener('click', () => openExpModal());

async function openExpModal(exp = null) {
    const bullets = exp ? (typeof exp.bullets === 'string' ? JSON.parse(exp.bullets) : (exp.bullets || [])) : [''];
    const body = `
        <div class="form-group"><label>Date Range</label><input type="text" class="form-input" id="modalDate" value="${esc(exp?.date_range || '')}" placeholder="e.g. June 2025 – March 2026"></div>
        <div class="form-group"><label>Job Title</label><input type="text" class="form-input" id="modalTitle" value="${esc(exp?.title || '')}"></div>
        <div class="form-row">
            <div class="form-group"><label>Company</label><input type="text" class="form-input" id="modalCompany" value="${esc(exp?.company || '')}"></div>
            <div class="form-group"><label>Badge (optional)</label><input type="text" class="form-input" id="modalBadge" value="${esc(exp?.badge || '')}" placeholder="e.g. Current"></div>
        </div>
        <div class="form-group">
            <label>Bullet Points</label>
            <div class="bullet-list" id="bulletList">
                ${bullets.map((b, i) => `<div class="bullet-item"><textarea class="form-input bullet-input" rows="2">${esc(b)}</textarea><button class="btn btn-danger btn-icon btn-sm" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button></div>`).join('')}
            </div>
            <button class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="document.getElementById('bulletList').insertAdjacentHTML('beforeend','<div class=\\'bullet-item\\'><textarea class=\\'form-input bullet-input\\' rows=\\'2\\'></textarea><button class=\\'btn btn-danger btn-icon btn-sm\\' onclick=\\'this.parentElement.remove()\\'><i class=\\'fas fa-times\\'></i></button></div>')"><i class="fas fa-plus"></i> Add Bullet</button>
        </div>
    `;
    const ok = await showEditModal(exp ? 'Edit Experience' : 'Add Experience', body);
    if (!ok) return;

    const bulletInputs = document.querySelectorAll('#bulletList .bullet-input');
    const newBullets = Array.from(bulletInputs).map(t => t.value.trim()).filter(Boolean);

    const data = {
        date_range: document.getElementById('modalDate').value,
        title: document.getElementById('modalTitle').value,
        company: document.getElementById('modalCompany').value,
        badge: document.getElementById('modalBadge').value || null,
        bullets: JSON.stringify(newBullets),
        sort_order: exp?.sort_order ?? 99,
    };

    try {
        if (exp) {
            await API.updateExperience(exp.id, data);
            showToast('Updated!', 'success');
        } else {
            await API.createExperience(data);
            showToast('Created!', 'success');
        }
        loadExperiencePage();
    } catch (err) { showToast(err.message, 'error'); }
}

window.editExperience = async function(id) {
    const exp = await API.request(`/api/experiences/${id}`);
    openExpModal(exp);
};

window.deleteExperience = async function(id) {
    if (await showConfirm('Delete Experience', 'Delete this experience entry?')) {
        try { await API.deleteExperience(id); showToast('Deleted', 'success'); loadExperiencePage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};
