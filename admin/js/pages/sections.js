// ============================================================
// Section Manager — Add/Remove/Reorder sections + nav config
// ============================================================

router.register('sections', loadSectionsPage);

async function loadSectionsPage() {
    const container = document.getElementById('sectionsEditor');
    renderPageLoading(container);

    try {
        const sections = await API.getSections();

        let html = `
            <div class="help-banner" style="margin-bottom:20px">
                <i class="fas fa-layer-group"></i>
                <div>
                    <strong>Manage your portfolio sections.</strong>
                    Reorder them with the arrow buttons — the order here matches your live portfolio's navigation bar. Toggle the <i class="fas fa-eye"></i> eye icon to show or hide any section. Built-in sections can be hidden but not deleted. Only custom sections can be deleted.
                </div>
            </div>

            <div class="admin-card">
                <div class="admin-card-header"><h3><i class="fas fa-list"></i> Section Order &amp; Visibility</h3></div>
                <div id="sectionsList">
        `;

        for (let i = 0; i < sections.length; i++) {
            const s = sections[i];
            const isCustom = s.type === 'custom';
            html += `
                <div class="section-list-item" data-id="${esc(s.id)}">
                    <div style="display:flex;flex-direction:column;gap:2px">
                        <button class="btn btn-icon btn-sm btn-secondary" aria-label="Move up" onclick="moveSectionUp('${esc(s.id)}')" ${i === 0 ? 'disabled' : ''} title="Move up"><i class="fas fa-chevron-up" aria-hidden="true"></i></button>
                        <button class="btn btn-icon btn-sm btn-secondary" aria-label="Move down" onclick="moveSectionDown('${esc(s.id)}')" ${i === sections.length - 1 ? 'disabled' : ''} title="Move down"><i class="fas fa-chevron-down" aria-hidden="true"></i></button>
                    </div>
                    <div class="section-icon"><i class="${esc(s.nav_icon || 'fas fa-circle')}"></i></div>
                    <div class="section-info">
                        <strong>${esc(s.title)}</strong>
                        <div class="section-id">#${esc(s.id)} · <span style="color:${isCustom ? 'var(--accent2)' : 'var(--muted)'}">${isCustom ? 'custom' : s.type}</span></div>
                    </div>
                    <span class="status-badge ${s.visible ? 'visible' : 'hidden'}" style="margin-right:4px">
                        <i class="fas fa-${s.visible ? 'eye' : 'eye-slash'}"></i> ${s.visible ? 'Visible' : 'Hidden'}
                    </span>
                    <button class="btn btn-secondary btn-sm" aria-label="${s.visible ? 'Hide section' : 'Show section'}" onclick="toggleSectionVisibility('${esc(s.id)}', ${s.visible ? 0 : 1})" title="${s.visible ? 'Hide section' : 'Show section'}">
                        <i class="fas fa-${s.visible ? 'eye-slash' : 'eye'}" aria-hidden="true"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" aria-label="Edit section" onclick="editSection('${esc(s.id)}')" title="Edit section"><i class="fas fa-edit" aria-hidden="true"></i></button>
                    ${isCustom ? `<button class="btn btn-danger btn-sm" aria-label="Delete section" onclick="deleteSection('${esc(s.id)}')" title="Delete section"><i class="fas fa-trash" aria-hidden="true"></i></button>` : ''}
                </div>
            `;
        }

        html += '</div></div>';
        container.innerHTML = html;
    } catch (err) {
        renderPageError(container, err);
    }
}

document.getElementById('addSection').addEventListener('click', async () => {
    const body = `
        <div class="help-banner" style="margin-bottom:16px">
            <i class="fas fa-info-circle"></i>
            <div>Custom sections let you add free-form HTML content to your portfolio. Give it a unique ID slug, a display title, and choose a nav icon.</div>
        </div>
        <div class="form-group">
            <label>Section ID <span style="color:var(--muted);font-weight:400">(slug)</span></label>
            <input type="text" class="form-input" id="modalId" placeholder="e.g. testimonials">
            <div class="field-hint"><i class="fas fa-info-circle"></i> Lowercase letters and hyphens only. This becomes the anchor link in your navbar (e.g. #testimonials).</div>
        </div>
        <div class="form-group">
            <label>Title</label>
            <input type="text" class="form-input" id="modalTitle" placeholder="e.g. Testimonials">
        </div>
        <div class="form-group">
            <label>Nav Label <span style="color:var(--muted);font-weight:400">(short)</span></label>
            <input type="text" class="form-input" id="modalLabel" placeholder="e.g. Reviews">
            <div class="field-hint"><i class="fas fa-info-circle"></i> Short label shown in the navigation bar.</div>
        </div>
        <div class="form-group">
            <label>Nav Icon</label>
            <div style="display:flex;align-items:center;gap:10px">
                <input type="text" class="form-input" id="modalIcon" value="fas fa-star" oninput="updateSectionIconPreview(this.value)" style="flex:1">
                <div id="sectionIconPreview" style="width:36px;height:36px;background:var(--surface2);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:var(--accent2)"><i class="fas fa-star"></i></div>
            </div>
            <div class="field-hint"><i class="fas fa-info-circle"></i> Font Awesome class, e.g. <code style="background:var(--surface2);padding:1px 4px;border-radius:3px">fas fa-star</code></div>
            ${buildSectionIconGrid()}
        </div>
        <div class="form-group">
            <label>Content <span style="color:var(--muted);font-weight:400">(HTML)</span></label>
            <textarea class="form-input" id="modalConfig" rows="6" placeholder="<p>Your custom section content here...</p>"></textarea>
            <div class="field-hint"><i class="fas fa-info-circle"></i> You can use standard HTML here. This will be placed inside your section container.</div>
        </div>
    `;
    const ok = await showEditModal('Add Custom Section', body);
    if (!ok) return;

    const rawId = document.getElementById('modalId').value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!rawId) return showToast('Section ID is required.', 'error');

    try {
        await API.createSection({
            id: rawId,
            title: document.getElementById('modalTitle').value,
            nav_icon: document.getElementById('modalIcon').value,
            nav_label: document.getElementById('modalLabel').value,
            type: 'custom',
            visible: 1,
            sort_order: 99,
            config: JSON.stringify({ html: document.getElementById('modalConfig').value }),
        });
        showToast('Section created!', 'success');
        loadSectionsPage();
    } catch (err) { showToast(err.message, 'error'); }
});

window.editSection = async function(id) {
    const s = await API.request(`/api/sections/${id}`);
    const config = typeof s.config === 'string' ? JSON.parse(s.config || '{}') : (s.config || {});
    const isCustom = s.type === 'custom';

    const body = `
        <div class="form-group">
            <label>Title</label>
            <input type="text" class="form-input" id="modalTitle" value="${esc(s.title)}">
        </div>
        <div class="form-group">
            <label>Nav Label</label>
            <input type="text" class="form-input" id="modalLabel" value="${esc(s.nav_label)}">
            <div class="field-hint"><i class="fas fa-info-circle"></i> Short text shown in the navigation bar.</div>
        </div>
        <div class="form-group">
            <label>Nav Icon</label>
            <div style="display:flex;align-items:center;gap:10px">
                <input type="text" class="form-input" id="modalIcon" value="${esc(s.nav_icon || 'fas fa-circle')}" oninput="updateSectionIconPreview(this.value)" style="flex:1">
                <div id="sectionIconPreview" style="width:36px;height:36px;background:var(--surface2);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:var(--accent2)"><i class="${esc(s.nav_icon || 'fas fa-circle')}"></i></div>
            </div>
            <div class="field-hint"><i class="fas fa-info-circle"></i> Font Awesome class, e.g. <code style="background:var(--surface2);padding:1px 4px;border-radius:3px">fas fa-star</code></div>
            ${buildSectionIconGrid()}
        </div>
        ${isCustom ? `
        <div class="form-group">
            <label>Content <span style="color:var(--muted);font-weight:400">(HTML)</span></label>
            <textarea class="form-input" id="modalConfig" rows="6">${esc(config.html || '')}</textarea>
        </div>` : ''}
    `;
    const ok = await showEditModal('Edit Section', body);
    if (!ok) return;

    const data = {
        title:     document.getElementById('modalTitle').value,
        nav_icon:  document.getElementById('modalIcon').value,
        nav_label: document.getElementById('modalLabel').value,
    };
    if (isCustom) {
        data.config = JSON.stringify({ html: document.getElementById('modalConfig').value });
    }

    try {
        await API.updateSection(id, data);
        showToast('Updated!', 'success');
        loadSectionsPage();
    } catch (err) { showToast(err.message, 'error'); }
};

window.deleteSection = async function(id) {
    const ok = await showConfirm('Delete Section', 'This will permanently remove this custom section and cannot be undone.', 'warning');
    if (!ok) return;
    try {
        await API.deleteSection(id);
        showToast('Section deleted.', 'success');
        loadSectionsPage();
    } catch (err) { showToast(err.message, 'error'); }
};

window.toggleSectionVisibility = async function(id, visible) {
    try {
        await API.updateSection(id, { visible });
        loadSectionsPage();
    } catch (err) { showToast(err.message, 'error'); }
};

window.moveSectionUp   = async function(id) { await reorderSection(id, -1); };
window.moveSectionDown = async function(id) { await reorderSection(id,  1); };

async function reorderSection(id, direction) {
    try {
        const sections = await API.getSections();
        const idx = sections.findIndex(s => s.id === id);
        if (idx < 0) return;

        const swapIdx = idx + direction;
        if (swapIdx < 0 || swapIdx >= sections.length) return;

        const items = sections.map((s, i) => ({ id: s.id, sort_order: i }));
        const temp = items[idx].sort_order;
        items[idx].sort_order      = items[swapIdx].sort_order;
        items[swapIdx].sort_order  = temp;

        await API.reorderSections(items);
        loadSectionsPage();
    } catch (err) { showToast(err.message, 'error'); }
}

// ── Icon grid for section nav icon picker ──
function buildSectionIconGrid() {
    const icons = [
        'fas fa-home','fas fa-user','fas fa-code','fas fa-briefcase','fas fa-graduation-cap',
        'fas fa-folder-open','fas fa-envelope','fas fa-share-alt','fas fa-star','fas fa-heart',
        'fas fa-rocket','fas fa-bolt','fas fa-camera','fas fa-palette','fas fa-music',
        'fas fa-film','fas fa-book','fas fa-pen-nib','fas fa-tools','fas fa-chart-bar',
        'fas fa-globe','fas fa-map-marker-alt','fas fa-phone','fas fa-laptop','fas fa-mobile-alt',
        'fas fa-award','fas fa-trophy','fas fa-certificate','fas fa-handshake','fas fa-comments',
        'fas fa-lightbulb','fas fa-cog','fas fa-database','fas fa-server','fas fa-shield-alt',
        'fas fa-lock','fas fa-key','fas fa-users','fas fa-building','fas fa-newspaper',
    ];
    let grid = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">';
    icons.forEach(ic => {
        grid += `<button type="button" aria-label="${ic}" onclick="pickSectionIcon('${ic}')" title="${ic}" style="width:32px;height:32px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-secondary);transition:all 0.15s" onmouseover="this.style.borderColor='var(--accent2)';this.style.color='var(--accent2)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-secondary)'"><i class="${ic}" aria-hidden="true" style="font-size:0.85rem;pointer-events:none"></i></button>`;
    });
    grid += '</div>';
    return grid;
}

window.pickSectionIcon = function(iconClass) {
    const input = document.getElementById('modalIcon');
    if (input) {
        input.value = iconClass;
        window.updateSectionIconPreview(iconClass);
    }
};

window.updateSectionIconPreview = function(value) {
    const preview = document.getElementById('sectionIconPreview');
    if (preview) preview.innerHTML = `<i class="${esc(value)}" style="font-size:1.1rem;color:var(--accent2)"></i>`;
};
