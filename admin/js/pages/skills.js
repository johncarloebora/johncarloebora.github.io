// ============================================================
// Skills Editor — 3-level tree: Cards > Categories > Skills
// ============================================================

router.register('skills', loadSkillsPage);

async function loadSkillsPage() {
    const container = document.getElementById('skillsEditor');
    container.innerHTML = '<p style="color:var(--muted)">Loading...</p>';

    try {
        const cards = await API.getSkillCards();
        let html = '';

        for (const card of cards) {
            const categories = await API.getSkillCategories(card.id);
            html += `<div class="admin-card">
                <div class="admin-card-header">
                    <h3><i class="${esc(card.icon)}" style="margin-right:8px;color:var(--accent2)"></i>${esc(card.title)}</h3>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-secondary btn-sm" onclick="addSkillCategory(${card.id})"><i class="fas fa-plus"></i> Category</button>
                        <button class="btn btn-secondary btn-sm" onclick="editSkillCard(${card.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="deleteSkillCard(${card.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;

            for (const cat of categories) {
                const skills = await API.getSkills(cat.id);
                html += `<div style="margin-bottom:16px;padding-left:16px;border-left:2px solid var(--border)">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                        <h4 style="font-size:0.9rem;color:var(--muted)"><i class="${esc(cat.icon)}" style="margin-right:6px"></i>${esc(cat.title)}</h4>
                        <div style="display:flex;gap:4px">
                            <button class="btn btn-secondary btn-sm" onclick="addSkill(${cat.id})"><i class="fas fa-plus"></i></button>
                            <button class="btn btn-secondary btn-sm" onclick="editSkillCategory(${cat.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-danger btn-sm" onclick="deleteSkillCategory(${cat.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="data-grid">`;

                for (const skill of skills) {
                    html += `<div class="data-item">
                        <i class="${esc(skill.icon)} skill-icon" style="color:var(--accent2);width:24px;text-align:center"></i>
                        <div class="data-item-content">
                            <div class="data-item-title">${esc(skill.name)}</div>
                            <div class="data-item-subtitle">${esc(skill.description || '')}</div>
                            <div style="margin-top:4px;height:4px;background:var(--surface2);border-radius:2px;overflow:hidden">
                                <div style="width:${skill.proficiency}%;height:100%;background:var(--grad);border-radius:2px"></div>
                            </div>
                        </div>
                        <div class="data-item-actions">
                            <span style="font-size:0.8rem;color:var(--accent2);min-width:30px;text-align:right">${skill.proficiency}%</span>
                            <button class="btn btn-secondary btn-sm" onclick="editSkill(${skill.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-danger btn-sm" onclick="deleteSkill(${skill.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`;
                }
                if (!skills.length) html += '<p style="color:var(--muted);font-size:0.85rem;padding:8px">No skills in this category</p>';

                html += '</div></div>';
            }
            if (!categories.length) html += '<p style="color:var(--muted);font-size:0.85rem;padding:8px">No categories — click "Category" to add one</p>';
            html += '</div>';
        }

        if (!cards.length) html += '<div class="empty-state"><i class="fas fa-code"></i><p>No skill cards yet</p></div>';
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p style="color:var(--accent1)">Error: ${err.message}</p>`;
    }
}

document.getElementById('addSkillCard').addEventListener('click', async () => {
    const body = `
        <div class="form-group"><label>Title</label><input type="text" class="form-input" id="modalTitle"></div>
        <div class="form-group"><label>Icon</label><input type="text" class="form-input" id="modalIcon" value="fas fa-code"></div>
    `;
    if (await showEditModal('Add Skill Card', body)) {
        try {
            await API.createSkillCard({ title: document.getElementById('modalTitle').value, icon: document.getElementById('modalIcon').value, sort_order: 99 });
            showToast('Skill card created!', 'success');
            loadSkillsPage();
        } catch (err) { showToast(err.message, 'error'); }
    }
});

window.editSkillCard = async function(id) {
    const card = await API.request(`/api/skill-cards/${id}`);
    const body = `
        <div class="form-group"><label>Title</label><input type="text" class="form-input" id="modalTitle" value="${esc(card.title)}"></div>
        <div class="form-group"><label>Icon</label><input type="text" class="form-input" id="modalIcon" value="${esc(card.icon)}"></div>
    `;
    if (await showEditModal('Edit Skill Card', body)) {
        try {
            await API.updateSkillCard(id, { title: document.getElementById('modalTitle').value, icon: document.getElementById('modalIcon').value });
            showToast('Updated!', 'success'); loadSkillsPage();
        } catch (err) { showToast(err.message, 'error'); }
    }
};

window.deleteSkillCard = async function(id) {
    if (await showConfirm('Delete Skill Card', 'This will also delete all categories and skills within it.')) {
        try { await API.deleteSkillCard(id); showToast('Deleted', 'success'); loadSkillsPage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};

window.addSkillCategory = async function(cardId) {
    const body = `
        <div class="form-group"><label>Category Title</label><input type="text" class="form-input" id="modalTitle"></div>
        <div class="form-group"><label>Icon</label><input type="text" class="form-input" id="modalIcon" value="fas fa-folder"></div>
    `;
    if (await showEditModal('Add Category', body)) {
        try {
            await API.createSkillCategory({ skill_card_id: cardId, title: document.getElementById('modalTitle').value, icon: document.getElementById('modalIcon').value, sort_order: 99 });
            showToast('Category created!', 'success'); loadSkillsPage();
        } catch (err) { showToast(err.message, 'error'); }
    }
};

window.editSkillCategory = async function(id) {
    const cat = await API.request(`/api/skill-categories/${id}`);
    const body = `
        <div class="form-group"><label>Title</label><input type="text" class="form-input" id="modalTitle" value="${esc(cat.title)}"></div>
        <div class="form-group"><label>Icon</label><input type="text" class="form-input" id="modalIcon" value="${esc(cat.icon)}"></div>
    `;
    if (await showEditModal('Edit Category', body)) {
        try {
            await API.updateSkillCategory(id, { title: document.getElementById('modalTitle').value, icon: document.getElementById('modalIcon').value });
            showToast('Updated!', 'success'); loadSkillsPage();
        } catch (err) { showToast(err.message, 'error'); }
    }
};

window.deleteSkillCategory = async function(id) {
    if (await showConfirm('Delete Category', 'This will also delete all skills in this category.')) {
        try { await API.deleteSkillCategory(id); showToast('Deleted', 'success'); loadSkillsPage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};

window.addSkill = async function(categoryId) {
    const body = `
        <div class="form-group"><label>Skill Name</label><input type="text" class="form-input" id="modalName"></div>
        <div class="form-group"><label>Description</label><input type="text" class="form-input" id="modalDesc"></div>
        <div class="form-group"><label>Icon</label><input type="text" class="form-input" id="modalIcon" value="fas fa-star"></div>
        <div class="form-group"><label>Proficiency</label>
            <div class="proficiency-slider">
                <input type="range" min="0" max="100" value="50" id="modalProf" oninput="document.getElementById('modalProfVal').textContent=this.value+'%'">
                <span class="proficiency-value" id="modalProfVal">50%</span>
            </div>
        </div>
    `;
    if (await showEditModal('Add Skill', body)) {
        try {
            await API.createSkill({
                category_id: categoryId,
                name: document.getElementById('modalName').value,
                description: document.getElementById('modalDesc').value,
                icon: document.getElementById('modalIcon').value,
                proficiency: parseInt(document.getElementById('modalProf').value),
                sort_order: 99,
            });
            showToast('Skill added!', 'success'); loadSkillsPage();
        } catch (err) { showToast(err.message, 'error'); }
    }
};

window.editSkill = async function(id) {
    const skill = await API.request(`/api/skills/${id}`);
    const body = `
        <div class="form-group"><label>Skill Name</label><input type="text" class="form-input" id="modalName" value="${esc(skill.name)}"></div>
        <div class="form-group"><label>Description</label><input type="text" class="form-input" id="modalDesc" value="${esc(skill.description || '')}"></div>
        <div class="form-group"><label>Icon</label><input type="text" class="form-input" id="modalIcon" value="${esc(skill.icon)}"></div>
        <div class="form-group"><label>Proficiency</label>
            <div class="proficiency-slider">
                <input type="range" min="0" max="100" value="${skill.proficiency}" id="modalProf" oninput="document.getElementById('modalProfVal').textContent=this.value+'%'">
                <span class="proficiency-value" id="modalProfVal">${skill.proficiency}%</span>
            </div>
        </div>
    `;
    if (await showEditModal('Edit Skill', body)) {
        try {
            await API.updateSkill(id, {
                name: document.getElementById('modalName').value,
                description: document.getElementById('modalDesc').value,
                icon: document.getElementById('modalIcon').value,
                proficiency: parseInt(document.getElementById('modalProf').value),
            });
            showToast('Updated!', 'success'); loadSkillsPage();
        } catch (err) { showToast(err.message, 'error'); }
    }
};

window.deleteSkill = async function(id) {
    if (await showConfirm('Delete Skill', 'Delete this skill?')) {
        try { await API.deleteSkill(id); showToast('Deleted', 'success'); loadSkillsPage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};
