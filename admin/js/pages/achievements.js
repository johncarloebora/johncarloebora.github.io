// ============================================================
// Achievements Editor
// ============================================================

router.register('achievements', loadAchievementsPage);

async function loadAchievementsPage() {
    const container = document.getElementById('achievementsEditor');
    renderPageLoading(container);
    try {
        const items = await API.getAchievements();
        renderAchievementsList(items, container);
    } catch (err) { renderPageError(container, err); }
}

function renderAchievementsList(items, container) {
    if (!items.length) {
        container.innerHTML = `
            <div class="help-banner"><i class="fas fa-info-circle"></i><div>
                <strong>Achievements</strong> — Highlight milestones, awards, and personal wins. Shown on your portfolio Achievements section.
            </div></div>
            <div class="empty-state"><i class="fas fa-trophy"></i><p>No achievements yet — click <strong>Add Achievement</strong>.</p></div>`;
        bindAchievementsAddBtn();
        return;
    }
    let html = `
        <div class="help-banner"><i class="fas fa-info-circle"></i><div>
            <strong>Achievements</strong> — These appear in the Achievements section of your portfolio.
        </div></div>
        <div class="data-grid">`;
    for (const a of items) {
        html += `
            <div class="data-card">
                <div class="data-card-header">
                    <div style="display:flex;align-items:center;gap:10px">
                        <div style="width:38px;height:38px;background:var(--surface2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:var(--accent2);flex-shrink:0">
                            <i class="${esc(a.icon || 'fas fa-trophy')}"></i>
                        </div>
                        <div>
                            <div class="data-card-title">${esc(a.title || 'Untitled')}</div>
                            ${a.date ? `<div class="data-card-subtitle">${esc(a.date)}</div>` : ''}
                        </div>
                    </div>
                </div>
                ${a.description ? `<p style="font-size:0.82rem;color:var(--text-secondary);margin:8px 0 4px;line-height:1.4">${esc(a.description)}</p>` : ''}
                <div class="data-card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editAchievement(${a.id})"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteAchievement(${a.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
    bindAchievementsAddBtn();
}

function bindAchievementsAddBtn() {
    const btn = document.getElementById('addAchievement');
    if (btn && !btn.dataset.bound) {
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => openAchievementModal(null));
    }
}

const ACHIEVEMENT_ICONS = [
    'fas fa-trophy','fas fa-award','fas fa-medal','fas fa-star','fas fa-crown',
    'fas fa-bolt','fas fa-fire','fas fa-rocket','fas fa-heart','fas fa-gem',
    'fas fa-flag','fas fa-bullseye','fas fa-check-circle','fas fa-thumbs-up','fas fa-handshake',
];

async function openAchievementModal(item) {
    const isEdit = !!item;
    const currentIcon = item?.icon || 'fas fa-trophy';
    const body = `
        <div class="form-group">
            <label>Title</label>
            <input type="text" class="form-input" id="aTitle" value="${esc(item?.title || '')}" placeholder="Best Portfolio Award 2024">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Date <span style="color:var(--muted);font-weight:400">(optional)</span></label>
                <input type="text" class="form-input" id="aDate" value="${esc(item?.date || '')}" placeholder="March 2024">
            </div>
            <div class="form-group">
                <label>Icon</label>
                <div style="display:flex;align-items:center;gap:8px">
                    <input type="text" class="form-input" id="aIcon" value="${esc(currentIcon)}" style="flex:1;font-family:monospace">
                    <div id="aIconPreview" style="width:36px;height:36px;background:var(--surface2);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:var(--accent2)">
                        <i class="${esc(currentIcon)}"></i>
                    </div>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
                    ${ACHIEVEMENT_ICONS.map(ic => `<button type="button" onclick="pickAchIcon('${ic}')" title="${ic}" style="width:32px;height:32px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-secondary)" onmouseover="this.style.borderColor='var(--accent2)'" onmouseout="this.style.borderColor='var(--border)'"><i class="${ic}" style="font-size:0.85rem;pointer-events:none"></i></button>`).join('')}
                </div>
            </div>
        </div>
        <div class="form-group">
            <label>Description <span style="color:var(--muted);font-weight:400">(optional)</span></label>
            <textarea class="form-input" id="aDesc" rows="2" placeholder="Brief description of this achievement…">${esc(item?.description || '')}</textarea>
        </div>`;
    const ok = await showEditModal(isEdit ? 'Edit Achievement' : 'Add Achievement', body);
    if (!ok) return;

    const title = document.getElementById('aTitle').value.trim();
    if (!title) return showToast('Title is required', 'error');

    const data = {
        title,
        icon:        document.getElementById('aIcon').value || 'fas fa-trophy',
        date:        document.getElementById('aDate').value,
        description: document.getElementById('aDesc').value,
        sort_order:  item?.sort_order || 0,
    };

    try {
        if (isEdit) await API.updateAchievement(item.id, data);
        else await API.createAchievement(data);
        showToast(isEdit ? 'Updated!' : 'Created!', 'success');
        loadAchievementsPage();
    } catch (err) { showToast(err.message, 'error'); }
}

window.pickAchIcon = function(ic) {
    const inp = document.getElementById('aIcon');
    const prev = document.getElementById('aIconPreview');
    if (inp) inp.value = ic;
    if (prev) prev.innerHTML = `<i class="${esc(ic)}" style="font-size:1.1rem;color:var(--accent2)"></i>`;
};

window.editAchievement = async function(id) {
    const item = await API.request(`/api/achievements/${id}`);
    await openAchievementModal(item);
};

window.deleteAchievement = async function(id) {
    const ok = await showConfirm('Delete Achievement', 'This will permanently delete this achievement.', 'warning');
    if (!ok) return;
    try {
        await API.deleteAchievement(id);
        showToast('Deleted.', 'success');
        loadAchievementsPage();
    } catch (err) { showToast(err.message, 'error'); }
};
