// ============================================================
// About Section Editor
// ============================================================

router.register('about', async () => {
    const container = document.getElementById('aboutEditor');
    container.innerHTML = '<p style="color:var(--muted)">Loading...</p>';

    try {
        const [cards, stats] = await Promise.all([API.getAboutCards(), API.getStats()]);
        renderAboutEditor(container, cards, stats);
    } catch (err) {
        container.innerHTML = `<p style="color:var(--accent1)">Error: ${err.message}</p>`;
    }
});

function renderAboutEditor(container, cards, stats) {
    let html = '<div class="admin-card"><div class="admin-card-header"><h3>About Cards</h3></div><div class="data-grid" id="aboutCardsList">';
    for (const card of cards) {
        html += `
            <div class="data-item">
                <i class="${esc(card.icon)}" style="font-size:1.2rem;color:var(--accent2);width:30px;text-align:center"></i>
                <div class="data-item-content">
                    <div class="data-item-title">${esc(card.title)}</div>
                    <div class="data-item-subtitle">Type: ${card.type}</div>
                </div>
                <div class="data-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editAboutCard(${card.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteAboutCard(${card.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }
    if (!cards.length) html += '<div class="empty-state"><i class="fas fa-inbox"></i><p>No about cards yet</p></div>';
    html += '</div></div>';

    html += '<div class="admin-card"><div class="admin-card-header"><h3>Statistics Row</h3><button class="btn btn-primary btn-sm" id="addStatBtn"><i class="fas fa-plus"></i> Add Stat</button></div><div class="data-grid" id="statsList">';
    for (const stat of stats) {
        html += `
            <div class="data-item">
                <div class="data-item-content">
                    <div class="data-item-title">${esc(stat.target)}${esc(stat.suffix)}</div>
                    <div class="data-item-subtitle">${esc(stat.label)}</div>
                </div>
                <div class="data-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editStat(${stat.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteStat(${stat.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }
    if (!stats.length) html += '<div class="empty-state"><i class="fas fa-chart-bar"></i><p>No statistics yet</p></div>';
    html += '</div></div>';

    container.innerHTML = html;

    document.getElementById('addStatBtn').addEventListener('click', () => addStat());
}

document.getElementById('addAboutCard').addEventListener('click', () => addAboutCard());

async function addAboutCard() {
    const body = `
        <div class="form-group"><label>Title</label><input type="text" class="form-input" id="modalTitle"></div>
        <div class="form-group"><label>Icon (Font Awesome class)</label><input type="text" class="form-input" id="modalIcon" value="fas fa-info-circle"></div>
        <div class="form-group"><label>Type</label><select class="form-input" id="modalType"><option value="text">Text Paragraph</option><option value="info_list">Info List</option></select></div>
        <div class="form-group"><label>Content (text or JSON for info_list)</label><textarea class="form-input" id="modalContent" rows="5"></textarea></div>
    `;
    const ok = await showEditModal('Add About Card', body);
    if (!ok) return;
    try {
        await API.createAboutCard({
            title: document.getElementById('modalTitle').value,
            icon: document.getElementById('modalIcon').value,
            type: document.getElementById('modalType').value,
            content: document.getElementById('modalContent').value,
            sort_order: 99,
        });
        showToast('Card created!', 'success');
        router.navigate('about');
    } catch (err) { showToast(err.message, 'error'); }
}

window.editAboutCard = async function(id) {
    const card = await API.request(`/api/about-cards/${id}`);
    const contentVal = typeof card.content === 'string' ? card.content : JSON.stringify(card.content, null, 2);
    const body = `
        <div class="form-group"><label>Title</label><input type="text" class="form-input" id="modalTitle" value="${esc(card.title)}"></div>
        <div class="form-group"><label>Icon</label><input type="text" class="form-input" id="modalIcon" value="${esc(card.icon)}"></div>
        <div class="form-group"><label>Type</label><select class="form-input" id="modalType"><option value="text" ${card.type==='text'?'selected':''}>Text</option><option value="info_list" ${card.type==='info_list'?'selected':''}>Info List</option></select></div>
        <div class="form-group"><label>Content</label><textarea class="form-input" id="modalContent" rows="6">${esc(contentVal)}</textarea></div>
    `;
    const ok = await showEditModal('Edit About Card', body);
    if (!ok) return;
    try {
        await API.updateAboutCard(id, {
            title: document.getElementById('modalTitle').value,
            icon: document.getElementById('modalIcon').value,
            type: document.getElementById('modalType').value,
            content: document.getElementById('modalContent').value,
        });
        showToast('Card updated!', 'success');
        router.navigate('about');
    } catch (err) { showToast(err.message, 'error'); }
};

window.deleteAboutCard = async function(id) {
    if (await showConfirm('Delete Card', 'Are you sure you want to delete this about card?')) {
        try { await API.deleteAboutCard(id); showToast('Deleted', 'success'); router.navigate('about'); }
        catch (err) { showToast(err.message, 'error'); }
    }
};

async function addStat() {
    const body = `
        <div class="form-row"><div class="form-group"><label>Target Value</label><input type="text" class="form-input" id="modalTarget" placeholder="e.g. 10"></div>
        <div class="form-group"><label>Suffix</label><input type="text" class="form-input" id="modalSuffix" placeholder="e.g. +"></div></div>
        <div class="form-group"><label>Label</label><input type="text" class="form-input" id="modalLabel"></div>
    `;
    const ok = await showEditModal('Add Stat', body);
    if (!ok) return;
    try {
        await API.createStat({
            target: document.getElementById('modalTarget').value,
            suffix: document.getElementById('modalSuffix').value,
            label: document.getElementById('modalLabel').value,
            sort_order: 99,
        });
        showToast('Stat created!', 'success');
        router.navigate('about');
    } catch (err) { showToast(err.message, 'error'); }
}

window.editStat = async function(id) {
    const stat = await API.request(`/api/stats/${id}`);
    const body = `
        <div class="form-row"><div class="form-group"><label>Target</label><input type="text" class="form-input" id="modalTarget" value="${esc(stat.target)}"></div>
        <div class="form-group"><label>Suffix</label><input type="text" class="form-input" id="modalSuffix" value="${esc(stat.suffix)}"></div></div>
        <div class="form-group"><label>Label</label><input type="text" class="form-input" id="modalLabel" value="${esc(stat.label)}"></div>
    `;
    const ok = await showEditModal('Edit Stat', body);
    if (!ok) return;
    try {
        await API.updateStat(id, {
            target: document.getElementById('modalTarget').value,
            suffix: document.getElementById('modalSuffix').value,
            label: document.getElementById('modalLabel').value,
        });
        showToast('Stat updated!', 'success');
        router.navigate('about');
    } catch (err) { showToast(err.message, 'error'); }
};

window.deleteStat = async function(id) {
    if (await showConfirm('Delete Stat', 'Delete this stat card?')) {
        try { await API.deleteStat(id); showToast('Deleted', 'success'); router.navigate('about'); }
        catch (err) { showToast(err.message, 'error'); }
    }
};
