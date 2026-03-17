// ============================================================
// Education Editor — structured entry builder (no raw JSON)
// ============================================================

router.register('education', loadEducationPage);

async function loadEducationPage() {
    const container = document.getElementById('educationEditor');
    container.innerHTML = '<p style="color:var(--muted)">Loading...</p>';

    try {
        const items = await API.getEducation();
        let html = `
            <div class="help-banner">
                <i class="fas fa-info-circle"></i>
                <div>
                    <strong>Education</strong> — Add cards for your degrees, certifications, or training.
                    Each card can contain multiple entries (e.g. a university card might have your bachelor's degree and academic awards).
                    Click <strong>Add Card</strong> to create a new education group.
                </div>
            </div>
            <div class="data-grid">`;

        for (const edu of items) {
            const entries = typeof edu.entries === 'string' ? JSON.parse(edu.entries || '[]') : (edu.entries || []);
            html += `
                <div class="data-item" style="flex-direction:column;align-items:stretch;gap:8px">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
                        <div class="data-item-title" style="display:flex;align-items:center;gap:8px">
                            <i class="${esc(edu.card_icon)}" style="color:var(--accent2);font-size:1.1rem"></i>
                            ${esc(edu.card_title)}
                        </div>
                        <div class="data-item-actions">
                            <button class="btn btn-secondary btn-sm" onclick="editEducation(${edu.id})"><i class="fas fa-edit"></i> Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteEducation(${edu.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    ${entries.length ? `
                    <div style="display:flex;flex-direction:column;gap:4px;padding-left:8px;border-left:2px solid var(--border)">
                        ${entries.map(e => `
                            <div style="font-size:0.82rem;color:var(--text-secondary)">
                                <span style="font-weight:600">${esc(e.title || '')}</span>
                                ${e.date ? `<span style="color:var(--accent2);margin-left:6px">(${esc(e.date)})</span>` : ''}
                                ${(e.lines || []).length ? `<div style="color:var(--muted);font-size:0.78rem">${e.lines.slice(0,2).map(l => esc(l)).join(' · ')}</div>` : ''}
                            </div>`).join('')}
                    </div>` : '<p style="font-size:0.8rem;color:var(--muted);opacity:0.6">No entries yet.</p>'}
                </div>`;
        }
        if (!items.length) html += '<div class="empty-state"><i class="fas fa-graduation-cap"></i><p>No education cards yet — click <strong>Add Card</strong>.</p></div>';
        html += '</div>';
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p style="color:var(--accent1)">Error: ${err.message}</p>`;
    }
}

document.getElementById('addEducation').addEventListener('click', () => openEduModal());

async function openEduModal(edu = null) {
    const existingEntries = edu ? (typeof edu.entries === 'string' ? JSON.parse(edu.entries || '[]') : (edu.entries || [])) : [];

    const body = `
        <div class="card-description">
            A card groups related education (e.g. all degrees from one university).
            Under the card, add one or more <strong>Entries</strong> — each entry is a specific degree, award, or course.
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Card Title</label>
                <input type="text" class="form-input" id="modalTitle" value="${esc(edu?.card_title || '')}" placeholder="e.g. Tertiary Education" maxlength="60">
            </div>
            <div class="form-group">
                <label>Card Icon <span style="font-size:0.72rem;color:var(--muted)">(Font Awesome class)</span></label>
                <div style="display:flex;gap:8px;align-items:center">
                    <input type="text" class="form-input" id="modalIcon" value="${esc(edu?.card_icon || 'fas fa-graduation-cap')}"
                           oninput="document.getElementById('eduIconPreview').className=this.value" style="flex:1">
                    <i id="eduIconPreview" class="${esc(edu?.card_icon || 'fas fa-graduation-cap')}" style="font-size:1.4rem;color:var(--accent2);width:28px;text-align:center"></i>
                </div>
            </div>
        </div>

        <div style="margin-top:8px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                <label style="font-weight:600;font-size:0.88rem">Entries</label>
                <button type="button" class="btn btn-secondary btn-sm" onclick="addEduEntry()"><i class="fas fa-plus"></i> Add Entry</button>
            </div>
            <div id="eduEntriesList" style="display:flex;flex-direction:column;gap:12px">
                ${existingEntries.length
                    ? existingEntries.map((e, i) => buildEduEntryCard(e, i)).join('')
                    : buildEduEntryCard({}, 0)}
            </div>
        </div>
    `;

    const ok = await showEditModal(edu ? 'Edit Education Card' : 'Add Education Card', body);
    if (!ok) return;

    const entries = collectEduEntries();
    const data = {
        card_title: document.getElementById('modalTitle').value,
        card_icon:  document.getElementById('modalIcon').value,
        entries:    JSON.stringify(entries),
        sort_order: edu?.sort_order ?? 99,
    };

    try {
        if (edu) {
            await API.updateEducation(edu.id, data);
            showToast('Updated!', 'success');
        } else {
            await API.createEducation(data);
            showToast('Education card created!', 'success');
        }
        loadEducationPage();
    } catch (err) { showToast(err.message, 'error'); }
}

function buildEduEntryCard(entry, idx) {
    const lines = entry.lines || [''];
    return `
        <div class="entry-card" id="eduEntry_${idx}">
            <div class="entry-card-header">
                <span>Entry ${idx + 1}</span>
                <button type="button" class="btn btn-danger btn-icon btn-sm" onclick="this.closest('.entry-card').remove()" title="Remove entry"><i class="fas fa-times"></i></button>
            </div>
            <div class="form-row" style="margin-bottom:10px">
                <div class="form-group" style="margin-bottom:0">
                    <label style="font-size:0.78rem">Degree / Award / Course Title</label>
                    <input type="text" class="form-input edu-entry-title" value="${esc(entry.title || '')}" placeholder="e.g. Bachelor of Science in Computer Engineering" maxlength="100">
                </div>
                <div class="form-group" style="margin-bottom:0">
                    <label style="font-size:0.78rem">Date / Year <span style="color:var(--muted)">(optional)</span></label>
                    <input type="text" class="form-input edu-entry-date" value="${esc(entry.date || '')}" placeholder="e.g. 2019 – 2023" maxlength="30">
                </div>
            </div>
            <label style="font-size:0.78rem;font-weight:600;display:block;margin-bottom:6px">Detail Lines <span style="color:var(--muted);font-weight:400">(school name, GWA, honours, etc.)</span></label>
            <div class="entry-card-lines" id="eduLines_${idx}">
                ${lines.map((l, li) => `
                    <div class="entry-line-row">
                        <input type="text" class="form-input edu-line-input" value="${esc(l)}" placeholder="e.g. GWA: 1.21 — Academic Distinction">
                        <button type="button" class="btn btn-danger btn-icon btn-sm" onclick="this.closest('.entry-line-row').remove()" title="Remove"><i class="fas fa-times"></i></button>
                    </div>`).join('')}
            </div>
            <button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px;font-size:0.78rem" onclick="addEduLine(this.previousElementSibling)">
                <i class="fas fa-plus"></i> Add Line
            </button>
        </div>`;
}

window.addEduEntry = function() {
    const list = document.getElementById('eduEntriesList');
    const idx = list.children.length;
    const div = document.createElement('div');
    div.innerHTML = buildEduEntryCard({}, idx);
    list.appendChild(div.firstElementChild);
};

window.addEduLine = function(linesDiv) {
    const row = document.createElement('div');
    row.className = 'entry-line-row';
    row.innerHTML = `<input type="text" class="form-input edu-line-input" placeholder="e.g. Graduated with Distinction">
        <button type="button" class="btn btn-danger btn-icon btn-sm" onclick="this.closest('.entry-line-row').remove()" title="Remove"><i class="fas fa-times"></i></button>`;
    linesDiv.appendChild(row);
    row.querySelector('input').focus();
};

function collectEduEntries() {
    const entryCards = document.querySelectorAll('.entry-card');
    return Array.from(entryCards).map(card => ({
        title: card.querySelector('.edu-entry-title')?.value?.trim() || '',
        date:  card.querySelector('.edu-entry-date')?.value?.trim() || '',
        lines: Array.from(card.querySelectorAll('.edu-line-input'))
                    .map(i => i.value.trim()).filter(Boolean),
    })).filter(e => e.title);
}

window.editEducation = async function(id) {
    const edu = await API.request(`/api/education/${id}`);
    openEduModal(edu);
};

window.deleteEducation = async function(id) {
    if (await showConfirm('Delete Education', 'Delete this education card permanently?', 'warning')) {
        try { await API.deleteEducation(id); showToast('Deleted', 'success'); loadEducationPage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};
