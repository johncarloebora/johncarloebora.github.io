// ============================================================
// Skills Editor — 3-level tree: Cards > Categories > Skills
// With visual icon picker and beginner-friendly UX
// ============================================================

router.register('skills', loadSkillsPage);

async function loadSkillsPage() {
    const container = document.getElementById('skillsEditor');
    renderPageLoading(container);

    try {
        const cards = await API.getSkillCards();
        let html = `
            <div class="help-banner">
                <i class="fas fa-info-circle"></i>
                <div>
                    <strong>Skills</strong> — Organized in 3 levels:
                    <strong>Skill Card</strong> (e.g. "Software Skills") →
                    <strong>Category</strong> (e.g. "Design & Multimedia") →
                    <strong>Individual Skill</strong> (e.g. "Photoshop" with a proficiency bar).
                    Click <strong>+ Add Skill Card</strong> at the top to start a new group.
                </div>
            </div>`;

        for (const card of cards) {
            const categories = await API.getSkillCategories(card.id);
            html += `
                <div class="admin-card" id="skillCard_${card.id}">
                    <div class="admin-card-header">
                        <h3>
                            <i class="${esc(card.icon)}" style="color:var(--accent2)"></i>
                            ${esc(card.title)}
                        </h3>
                        <div style="display:flex;gap:6px;flex-wrap:wrap">
                            <button class="btn btn-secondary btn-sm" onclick="addSkillCategory(${card.id})" title="Add a category inside this skill card">
                                <i class="fas fa-folder-plus"></i> Add Category
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="editSkillCard(${card.id})" title="Edit this card's title and icon">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteSkillCard(${card.id})" title="Delete entire card and all skills inside">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>`;

            if (!categories.length) {
                html += `<div class="field-hint" style="margin:4px 0 8px"><i class="fas fa-arrow-up"></i>No categories yet — click <strong>Add Category</strong> above to create your first one.</div>`;
            }

            for (const cat of categories) {
                const skills = await API.getSkills(cat.id);
                html += `
                    <div style="margin-bottom:16px;padding:12px 14px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border)">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                            <h4 style="font-size:0.88rem;font-weight:600;color:var(--text-secondary);display:flex;align-items:center;gap:6px">
                                <i class="${esc(cat.icon)}" style="color:var(--accent1);font-size:0.9rem"></i>
                                ${esc(cat.title)}
                            </h4>
                            <div style="display:flex;gap:4px">
                                <button class="btn btn-secondary btn-sm" onclick="addSkill(${cat.id})" title="Add a skill to this category">
                                    <i class="fas fa-plus"></i> Add Skill
                                </button>
                                <button class="btn btn-secondary btn-sm" onclick="editSkillCategory(${cat.id})" title="Edit category">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="deleteSkillCategory(${cat.id})" title="Delete category">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="data-grid">`;

                for (const skill of skills) {
                    const pct = skill.proficiency || 0;
                    const barColor = pct >= 80 ? 'var(--accent2)' : pct >= 50 ? 'var(--accent1)' : 'var(--muted)';
                    html += `
                        <div class="data-item">
                            <i class="${esc(skill.icon)}" style="color:var(--accent2);width:24px;text-align:center;font-size:1.1rem;flex-shrink:0"></i>
                            <div class="data-item-content">
                                <div class="data-item-title">${esc(skill.name)}</div>
                                ${skill.description ? `<div class="data-item-subtitle">${esc(skill.description)}</div>` : ''}
                                <div style="margin-top:6px;display:flex;align-items:center;gap:8px">
                                    <div style="flex:1;height:5px;background:var(--surface);border-radius:3px;overflow:hidden">
                                        <div style="width:${pct}%;height:100%;background:${barColor};border-radius:3px;transition:width 0.5s"></div>
                                    </div>
                                    <span style="font-size:0.75rem;font-weight:600;color:${barColor};min-width:32px;text-align:right">${pct}%</span>
                                </div>
                            </div>
                            <div class="data-item-actions">
                                <button class="btn btn-secondary btn-sm" onclick="editSkill(${skill.id})"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-danger btn-sm" onclick="deleteSkill(${skill.id})"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>`;
                }
                if (!skills.length) {
                    html += `<div style="text-align:center;padding:12px;color:var(--muted);font-size:0.82rem">No skills yet — click <strong>Add Skill</strong>.</div>`;
                }
                html += '</div></div>';
            }
            html += '</div>';
        }

        if (!cards.length) {
            html += '<div class="empty-state"><i class="fas fa-code"></i><p>No skill cards yet — click <strong>Add Skill Card</strong> to start.</p></div>';
        }
        container.innerHTML = html;
    } catch (err) {
        renderPageError(container, err);
    }
}

// ── Icon Picker Helper ──────────────────────────────────────
const COMMON_ICONS = [
    'fas fa-code','fas fa-laptop-code','fas fa-server','fas fa-database','fas fa-cloud','fas fa-shield-alt',
    'fas fa-mobile-alt','fas fa-globe','fas fa-bug','fas fa-terminal','fas fa-cogs','fas fa-microchip',
    'fas fa-brain','fas fa-robot','fas fa-chart-line','fas fa-chart-bar','fas fa-project-diagram',
    'fas fa-paint-brush','fas fa-palette','fas fa-photo-video','fas fa-film','fas fa-music',
    'fas fa-camera','fas fa-image','fas fa-pen-nib','fas fa-vector-square',
    'fas fa-file-code','fas fa-file-excel','fas fa-file-word','fas fa-file-powerpoint',
    'fab fa-python','fab fa-js-square','fab fa-react','fab fa-vuejs','fab fa-node-js',
    'fab fa-html5','fab fa-css3-alt','fab fa-git-alt','fab fa-github','fab fa-docker',
    'fab fa-microsoft','fab fa-apple','fab fa-linux','fab fa-android',
    'fab fa-adobe','fab fa-figma','fab fa-slack','fab fa-trello',
    'fas fa-star','fas fa-bolt','fas fa-fire','fas fa-gem','fas fa-rocket',
    'fas fa-graduation-cap','fas fa-book','fas fa-briefcase','fas fa-tools',
    'fas fa-wifi','fas fa-network-wired','fas fa-ethernet','fas fa-satellite',
    'fas fa-lock','fas fa-key','fas fa-user-shield','fas fa-fingerprint',
    'fas fa-folder','fas fa-folder-open','fas fa-layer-group','fas fa-sitemap',
];

function buildIconPickerField(fieldId, currentIcon, label) {
    return `
        <div class="form-group">
            <label>${label}</label>
            <div style="display:flex;gap:8px;align-items:center">
                <input type="text" class="form-input" id="${fieldId}" value="${esc(currentIcon)}"
                       style="flex:1" placeholder="fas fa-code"
                       oninput="document.getElementById('${fieldId}_preview').className=this.value">
                <i id="${fieldId}_preview" class="${esc(currentIcon)}" style="font-size:1.4rem;color:var(--accent2);width:28px;text-align:center;flex-shrink:0"></i>
            </div>
            <div class="field-hint" style="margin-bottom:8px"><i class="fas fa-info-circle"></i>Type a Font Awesome class or pick one below:</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(36px,1fr));gap:4px;max-height:160px;overflow-y:auto;padding:8px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border)">
                ${COMMON_ICONS.map(ic => `
                    <button type="button" title="${ic}"
                        style="aspect-ratio:1;background:none;border:1px solid transparent;border-radius:6px;cursor:pointer;color:var(--muted);font-size:1rem;transition:all 0.15s;padding:4px"
                        onmouseenter="this.style.borderColor='var(--accent2)';this.style.color='var(--accent2)'"
                        onmouseleave="this.style.borderColor='transparent';this.style.color='var(--muted)'"
                        onclick="document.getElementById('${fieldId}').value='${ic}';document.getElementById('${fieldId}_preview').className='${ic}'">
                        <i class="${ic}"></i>
                    </button>`).join('')}
            </div>
        </div>`;
}

// ── Skill Card CRUD ─────────────────────────────────────────
document.getElementById('addSkillCard').addEventListener('click', async () => {
    const body = `
        <div class="card-description">A Skill Card is a top-level group (e.g. "Software Skills", "Languages", "Tools").</div>
        <div class="form-group">
            <label>Card Title</label>
            <input type="text" class="form-input" id="modalTitle" placeholder="e.g. Software Skills" maxlength="60">
        </div>
        ${buildIconPickerField('modalIcon', 'fas fa-code', 'Card Icon')}
    `;
    if (await showEditModal('Add Skill Card', body)) {
        try {
            await API.createSkillCard({
                title: document.getElementById('modalTitle').value,
                icon:  document.getElementById('modalIcon').value,
                sort_order: 99
            });
            showToast('Skill card created!', 'success');
            loadSkillsPage();
        } catch (err) { showToast(err.message, 'error'); }
    }
});

window.editSkillCard = async function(id) {
    const card = await API.request(`/api/skill-cards/${id}`);
    const body = `
        <div class="form-group">
            <label>Card Title</label>
            <input type="text" class="form-input" id="modalTitle" value="${esc(card.title)}" maxlength="60">
        </div>
        ${buildIconPickerField('modalIcon', card.icon, 'Card Icon')}
    `;
    if (await showEditModal('Edit Skill Card', body)) {
        try {
            await API.updateSkillCard(id, {
                title: document.getElementById('modalTitle').value,
                icon:  document.getElementById('modalIcon').value,
            });
            showToast('Updated!', 'success'); loadSkillsPage();
        } catch (err) { showToast(err.message, 'error'); }
    }
};

window.deleteSkillCard = async function(id) {
    if (await showConfirm('Delete Skill Card', 'This will permanently delete this card AND all categories and skills inside it.', 'warning')) {
        try { await API.deleteSkillCard(id); showToast('Deleted', 'success'); loadSkillsPage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};

// ── Category CRUD ───────────────────────────────────────────
window.addSkillCategory = async function(cardId) {
    const body = `
        <div class="card-description">A Category groups related skills within a Skill Card (e.g. "Design & Multimedia", "Backend").</div>
        <div class="form-group">
            <label>Category Title</label>
            <input type="text" class="form-input" id="modalTitle" placeholder="e.g. Design & Multimedia" maxlength="60">
        </div>
        ${buildIconPickerField('modalIcon', 'fas fa-folder', 'Category Icon')}
    `;
    if (await showEditModal('Add Category', body)) {
        try {
            await API.createSkillCategory({
                skill_card_id: cardId,
                title: document.getElementById('modalTitle').value,
                icon:  document.getElementById('modalIcon').value,
                sort_order: 99
            });
            showToast('Category created!', 'success'); loadSkillsPage();
        } catch (err) { showToast(err.message, 'error'); }
    }
};

window.editSkillCategory = async function(id) {
    const cat = await API.request(`/api/skill-categories/${id}`);
    const body = `
        <div class="form-group">
            <label>Category Title</label>
            <input type="text" class="form-input" id="modalTitle" value="${esc(cat.title)}" maxlength="60">
        </div>
        ${buildIconPickerField('modalIcon', cat.icon, 'Category Icon')}
    `;
    if (await showEditModal('Edit Category', body)) {
        try {
            await API.updateSkillCategory(id, {
                title: document.getElementById('modalTitle').value,
                icon:  document.getElementById('modalIcon').value,
            });
            showToast('Updated!', 'success'); loadSkillsPage();
        } catch (err) { showToast(err.message, 'error'); }
    }
};

window.deleteSkillCategory = async function(id) {
    if (await showConfirm('Delete Category', 'This will also delete all skills inside this category.', 'warning')) {
        try { await API.deleteSkillCategory(id); showToast('Deleted', 'success'); loadSkillsPage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};

// ── Skill CRUD ──────────────────────────────────────────────
window.addSkill = async function(categoryId) {
    const body = buildSkillForm(null);
    if (await showEditModal('Add Skill', body)) {
        try {
            await API.createSkill({
                category_id: categoryId,
                name:        document.getElementById('modalName').value,
                description: document.getElementById('modalDesc').value,
                icon:        document.getElementById('modalIcon').value,
                proficiency: parseInt(document.getElementById('modalProf').value),
                sort_order:  99,
            });
            showToast('Skill added!', 'success'); loadSkillsPage();
        } catch (err) { showToast(err.message, 'error'); }
    }
};

window.editSkill = async function(id) {
    const skill = await API.request(`/api/skills/${id}`);
    const body = buildSkillForm(skill);
    if (await showEditModal('Edit Skill', body)) {
        try {
            await API.updateSkill(id, {
                name:        document.getElementById('modalName').value,
                description: document.getElementById('modalDesc').value,
                icon:        document.getElementById('modalIcon').value,
                proficiency: parseInt(document.getElementById('modalProf').value),
            });
            showToast('Updated!', 'success'); loadSkillsPage();
        } catch (err) { showToast(err.message, 'error'); }
    }
};

function buildSkillForm(skill) {
    const prof = skill ? skill.proficiency : 50;
    const profLabel = prof >= 90 ? 'Expert' : prof >= 70 ? 'Advanced' : prof >= 50 ? 'Intermediate' : prof >= 30 ? 'Beginner' : 'Novice';
    return `
        <div class="form-group">
            <label>Skill Name</label>
            <input type="text" class="form-input" id="modalName" value="${esc(skill?.name || '')}" placeholder="e.g. Adobe Photoshop" maxlength="60">
        </div>
        <div class="form-group">
            <label>Short Description <span style="font-size:0.72rem;color:var(--muted)">(optional)</span></label>
            <input type="text" class="form-input" id="modalDesc" value="${esc(skill?.description || '')}" placeholder="e.g. Advanced photo editing and visual design" maxlength="100">
        </div>
        ${buildIconPickerField('modalIcon', skill?.icon || 'fas fa-star', 'Skill Icon')}
        <div class="form-group">
            <label>Proficiency Level</label>
            <div style="display:flex;align-items:center;gap:12px;margin-top:4px">
                <input type="range" min="0" max="100" value="${prof}" id="modalProf" style="flex:1"
                       oninput="
                           document.getElementById('modalProfVal').textContent=this.value+'%';
                           const lbl=['Novice','Beginner','Intermediate','Advanced','Expert'];
                           document.getElementById('modalProfLabel').textContent=this.value>=90?lbl[4]:this.value>=70?lbl[3]:this.value>=50?lbl[2]:this.value>=30?lbl[1]:lbl[0];
                           document.getElementById('modalProfBar').style.width=this.value+'%';
                       ">
                <span class="proficiency-value" id="modalProfVal">${prof}%</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
                <div style="flex:1;height:6px;background:var(--surface2);border-radius:3px;overflow:hidden">
                    <div id="modalProfBar" style="height:100%;background:var(--grad);border-radius:3px;width:${prof}%;transition:width 0.2s"></div>
                </div>
                <span id="modalProfLabel" style="font-size:0.78rem;font-weight:600;color:var(--accent2);min-width:80px">${profLabel}</span>
            </div>
            <div class="field-hint"><i class="fas fa-info-circle"></i>Drag the slider to set your confidence level in this skill.</div>
        </div>
    `;
}

window.deleteSkill = async function(id) {
    if (await showConfirm('Delete Skill', 'Delete this skill permanently?', 'warning')) {
        try { await API.deleteSkill(id); showToast('Deleted', 'success'); loadSkillsPage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};
