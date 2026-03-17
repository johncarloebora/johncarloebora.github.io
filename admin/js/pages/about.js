// ============================================================
// About Section Editor — type-aware card editor (no raw JSON)
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
    let html = `
        <div class="help-banner">
            <i class="fas fa-info-circle"></i>
            <div>
                <strong>About Section</strong> — Add cards that describe you (text paragraphs or info lists like age, location, etc.)
                and stat counters that animate as visitors scroll (e.g. "5+ Years Experience").
                Click <strong>Add Card</strong> / <strong>Add Stat</strong> to create new ones.
            </div>
        </div>

        <div class="admin-card">
            <div class="admin-card-header">
                <h3><i class="fas fa-id-card"></i> About Cards</h3>
            </div>
            <div class="card-description">
                Each card appears as an expandable panel. Choose <strong>Text Paragraph</strong> for a bio/summary,
                or <strong>Info List</strong> for key facts (age, nationality, location, etc.).
            </div>
            <div class="data-grid" id="aboutCardsList">`;

    for (const card of cards) {
        html += `
            <div class="data-item">
                <i class="${esc(card.icon)}" style="font-size:1.2rem;color:var(--accent2);width:30px;text-align:center;flex-shrink:0"></i>
                <div class="data-item-content">
                    <div class="data-item-title">${esc(card.title)}</div>
                    <div class="data-item-subtitle">
                        <span class="status-badge ${card.type === 'info_list' ? 'visible' : 'published'}">
                            <i class="fas fa-${card.type === 'info_list' ? 'list' : 'align-left'}"></i>
                            ${card.type === 'info_list' ? 'Info List' : 'Text Paragraph'}
                        </span>
                    </div>
                </div>
                <div class="data-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editAboutCard(${card.id})" title="Edit card">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteAboutCard(${card.id})" title="Delete card">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
    }
    if (!cards.length) html += '<div class="empty-state"><i class="fas fa-inbox"></i><p>No about cards yet — click <strong>Add Card</strong> to start.</p></div>';
    html += `</div></div>

        <div class="admin-card">
            <div class="admin-card-header">
                <h3><i class="fas fa-chart-bar"></i> Statistics Row</h3>
                <button class="btn btn-primary btn-sm" id="addStatBtn"><i class="fas fa-plus"></i> Add Stat</button>
            </div>
            <div class="card-description">
                Stat counters animate to their target number when a visitor scrolls to the About section.
                Use a suffix like <strong>+</strong> or <strong>%</strong> to add context (e.g. "10+" or "99%").
            </div>
            <div class="data-grid" id="statsList">`;

    for (const stat of stats) {
        html += `
            <div class="data-item">
                <div style="font-size:1.5rem;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;min-width:56px;text-align:center;flex-shrink:0">${esc(stat.target)}${esc(stat.suffix)}</div>
                <div class="data-item-content">
                    <div class="data-item-title">${esc(stat.label)}</div>
                    <div class="data-item-subtitle">Counts from 0 to ${esc(stat.target)} on scroll</div>
                </div>
                <div class="data-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editStat(${stat.id})"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteStat(${stat.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }
    if (!stats.length) html += '<div class="empty-state"><i class="fas fa-chart-bar"></i><p>No stats yet — click <strong>Add Stat</strong>.</p></div>';
    html += '</div></div>';

    container.innerHTML = html;
    document.getElementById('addStatBtn').addEventListener('click', () => addStat());
}

document.getElementById('addAboutCard').addEventListener('click', () => addAboutCard());

async function addAboutCard() {
    const body = buildAboutCardForm(null);
    const ok = await showEditModal('Add About Card', body);
    if (!ok) return;
    try {
        const data = collectAboutCardData();
        await API.createAboutCard({ ...data, sort_order: 99 });
        showToast('Card created!', 'success');
        router.navigate('about');
    } catch (err) { showToast(err.message, 'error'); }
}

window.editAboutCard = async function(id) {
    const card = await API.request(`/api/about-cards/${id}`);
    const body = buildAboutCardForm(card);
    const ok = await showEditModal('Edit About Card', body);
    if (!ok) return;
    try {
        const data = collectAboutCardData();
        await API.updateAboutCard(id, data);
        showToast('Card updated!', 'success');
        router.navigate('about');
    } catch (err) { showToast(err.message, 'error'); }
};

function buildAboutCardForm(card) {
    const type = card ? card.type : 'text';
    // Parse content depending on type
    let textContent = '';
    let infoItems = [];
    if (card) {
        if (card.type === 'text') {
            textContent = typeof card.content === 'string' ? card.content : '';
        } else {
            // info_list: stored as [{icon, text}, ...] or array of strings
            const raw = typeof card.content === 'string' ? (() => { try { return JSON.parse(card.content); } catch { return []; } })() : (card.content || []);
            infoItems = Array.isArray(raw) ? raw : [];
        }
    }

    const infoItemsHtml = infoItems.length
        ? infoItems.map((item, i) => buildInfoItemRow(
            typeof item === 'object' ? (item.icon || 'fas fa-info-circle') : 'fas fa-info-circle',
            typeof item === 'object' ? (item.text || '') : String(item),
            i
          )).join('')
        : buildInfoItemRow('fas fa-map-marker-alt', '', 0);

    return `
        <div class="form-row">
            <div class="form-group">
                <label>Card Title</label>
                <input type="text" class="form-input" id="modalTitle" value="${esc(card?.title || '')}" placeholder="e.g. About Me" maxlength="60">
            </div>
            <div class="form-group">
                <label>Icon <span style="font-size:0.72rem;color:var(--muted)">(Font Awesome class)</span></label>
                <div style="display:flex;gap:8px;align-items:center">
                    <input type="text" class="form-input" id="modalIcon" value="${esc(card?.icon || 'fas fa-info-circle')}" style="flex:1" oninput="document.getElementById('iconPreview').className=this.value">
                    <i id="iconPreview" class="${esc(card?.icon || 'fas fa-info-circle')}" style="font-size:1.4rem;color:var(--accent2);width:28px;text-align:center"></i>
                </div>
                <div class="field-hint"><i class="fas fa-info-circle"></i>Browse icons at <a href="https://fontawesome.com/icons" target="_blank">fontawesome.com/icons</a> — copy the class name.</div>
            </div>
        </div>

        <div class="form-group">
            <label>Card Type</label>
            <select class="form-input" id="modalType" onchange="switchAboutCardType(this.value)">
                <option value="text"      ${type === 'text'      ? 'selected' : ''}>Text Paragraph — a block of descriptive text</option>
                <option value="info_list" ${type === 'info_list' ? 'selected' : ''}>Info List — icon + short fact rows (age, location, etc.)</option>
            </select>
        </div>

        <div id="aboutTypeText" style="${type === 'text' ? '' : 'display:none'}">
            <div class="form-group">
                <label>Paragraph Content</label>
                <textarea class="form-input" id="modalContent" rows="5" placeholder="Write a bio, summary, or any descriptive paragraph...">${esc(textContent)}</textarea>
                <div class="field-hint"><i class="fas fa-info-circle"></i>Plain text only — no HTML needed.</div>
            </div>
        </div>

        <div id="aboutTypeList" style="${type === 'info_list' ? '' : 'display:none'}">
            <div class="form-group">
                <label>Info Items</label>
                <div class="card-description" style="margin-bottom:10px">Each row shows an icon and a short fact. Click <strong>Add Row</strong> to add more.</div>
                <div id="infoItemsList" style="display:flex;flex-direction:column;gap:8px">
                    ${infoItemsHtml}
                </div>
                <button type="button" class="btn btn-secondary btn-sm" style="margin-top:10px" onclick="addInfoItemRow()"><i class="fas fa-plus"></i> Add Row</button>
            </div>
        </div>
    `;
}

function buildInfoItemRow(icon, text, idx) {
    return `<div class="entry-line-row info-item-row">
        <div style="display:flex;align-items:center;gap:6px;width:180px;flex-shrink:0">
            <i id="infoIcon_preview_${idx}" class="${esc(icon)}" style="color:var(--accent2);font-size:1rem;width:20px;text-align:center"></i>
            <input type="text" class="form-input info-icon-input" value="${esc(icon)}" placeholder="fas fa-star" style="font-size:0.78rem"
                   oninput="document.getElementById('infoIcon_preview_${idx}').className=this.value">
        </div>
        <input type="text" class="form-input info-text-input" value="${esc(text)}" placeholder="e.g. Caloocan City" style="flex:1">
        <button type="button" class="btn btn-danger btn-icon btn-sm" onclick="this.closest('.info-item-row').remove()" title="Remove"><i class="fas fa-times"></i></button>
    </div>`;
}

window.addInfoItemRow = function() {
    const list = document.getElementById('infoItemsList');
    const idx = list.children.length;
    const div = document.createElement('div');
    div.innerHTML = buildInfoItemRow('fas fa-info-circle', '', idx);
    list.appendChild(div.firstElementChild);
    div.firstElementChild?.querySelector('.info-text-input')?.focus();
};

window.switchAboutCardType = function(val) {
    document.getElementById('aboutTypeText').style.display = val === 'text' ? '' : 'none';
    document.getElementById('aboutTypeList').style.display = val === 'info_list' ? '' : 'none';
};

function collectAboutCardData() {
    const type = document.getElementById('modalType').value;
    let content;
    if (type === 'text') {
        content = document.getElementById('modalContent').value;
    } else {
        const rows = document.querySelectorAll('.info-item-row');
        content = JSON.stringify(Array.from(rows).map(row => ({
            icon: row.querySelector('.info-icon-input').value.trim(),
            text: row.querySelector('.info-text-input').value.trim(),
        })).filter(r => r.text));
    }
    return {
        title: document.getElementById('modalTitle').value,
        icon:  document.getElementById('modalIcon').value,
        type,
        content,
    };
}

window.deleteAboutCard = async function(id) {
    if (await showConfirm('Delete Card', 'Are you sure you want to delete this about card? This cannot be undone.', 'warning')) {
        try { await API.deleteAboutCard(id); showToast('Deleted', 'success'); router.navigate('about'); }
        catch (err) { showToast(err.message, 'error'); }
    }
};

async function addStat() {
    const body = `
        <div class="card-description">A stat counter animates from 0 to your target number as visitors scroll to this section.</div>
        <div class="form-row">
            <div class="form-group">
                <label>Target Number</label>
                <input type="number" class="form-input" id="modalTarget" placeholder="e.g. 10" min="0">
                <div class="field-hint"><i class="fas fa-info-circle"></i>The number the counter stops at.</div>
            </div>
            <div class="form-group">
                <label>Suffix <span style="font-size:0.72rem;color:var(--muted)">(optional)</span></label>
                <input type="text" class="form-input" id="modalSuffix" placeholder="e.g. +" maxlength="5">
                <div class="field-hint"><i class="fas fa-info-circle"></i>Appears right after the number (e.g. + → "10+").</div>
            </div>
        </div>
        <div class="form-group">
            <label>Label</label>
            <input type="text" class="form-input" id="modalLabel" placeholder="e.g. Years Experience" maxlength="40">
        </div>
    `;
    const ok = await showEditModal('Add Stat Counter', body);
    if (!ok) return;
    try {
        await API.createStat({
            target: document.getElementById('modalTarget').value,
            suffix: document.getElementById('modalSuffix').value,
            label:  document.getElementById('modalLabel').value,
            sort_order: 99,
        });
        showToast('Stat created!', 'success');
        router.navigate('about');
    } catch (err) { showToast(err.message, 'error'); }
}

window.editStat = async function(id) {
    const stat = await API.request(`/api/stats/${id}`);
    const body = `
        <div class="form-row">
            <div class="form-group">
                <label>Target Number</label>
                <input type="number" class="form-input" id="modalTarget" value="${esc(stat.target)}" min="0">
            </div>
            <div class="form-group">
                <label>Suffix</label>
                <input type="text" class="form-input" id="modalSuffix" value="${esc(stat.suffix)}" maxlength="5">
            </div>
        </div>
        <div class="form-group">
            <label>Label</label>
            <input type="text" class="form-input" id="modalLabel" value="${esc(stat.label)}" maxlength="40">
        </div>
    `;
    const ok = await showEditModal('Edit Stat Counter', body);
    if (!ok) return;
    try {
        await API.updateStat(id, {
            target: document.getElementById('modalTarget').value,
            suffix: document.getElementById('modalSuffix').value,
            label:  document.getElementById('modalLabel').value,
        });
        showToast('Stat updated!', 'success');
        router.navigate('about');
    } catch (err) { showToast(err.message, 'error'); }
};

window.deleteStat = async function(id) {
    if (await showConfirm('Delete Stat', 'Delete this stat counter?', 'warning')) {
        try { await API.deleteStat(id); showToast('Deleted', 'success'); router.navigate('about'); }
        catch (err) { showToast(err.message, 'error'); }
    }
};
