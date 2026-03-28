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
            <label>Content <span style="color:var(--muted);font-weight:400">(WYSIWYG / Blocks / HTML)</span></label>
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:4px;padding:6px;background:var(--surface2);border:1px solid var(--border);border-bottom:none;border-radius:var(--radius-sm) var(--radius-sm) 0 0">
                <button type="button" class="btn btn-secondary btn-icon btn-sm" onclick="document.execCommand('bold')" title="Bold"><b>B</b></button>
                <button type="button" class="btn btn-secondary btn-icon btn-sm" onclick="document.execCommand('italic')" title="Italic"><i>I</i></button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.execCommand('formatBlock',false,'h2')" style="font-size:0.72rem">H2</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.execCommand('formatBlock',false,'p')" style="font-size:0.72rem">P</button>
                <button type="button" class="btn btn-secondary btn-icon btn-sm" onclick="document.execCommand('insertUnorderedList')"><i class="fas fa-list-ul"></i></button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="wysiwygInsertLink()" style="font-size:0.72rem"><i class="fas fa-link"></i></button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="toggleWysiwygSource()" id="wysiwygSourceBtn" style="font-size:0.72rem"><i class="fas fa-code"></i> HTML</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="toggleBlockBuilder()" id="blockBuilderBtn" style="font-size:0.72rem;margin-left:auto"><i class="fas fa-th-large"></i> Blocks</button>
            </div>
            <div id="wysiwygWrap">
                <div id="wysiwygEditor" contenteditable="true"
                    style="min-height:100px;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:0 0 var(--radius-sm) var(--radius-sm);color:var(--text-primary);font-size:0.88rem;line-height:1.6;outline:none"
                    oninput="syncWysiwygToHidden()"></div>
                <textarea class="form-input" id="modalConfig" rows="5" placeholder="<p>Your custom section content here...</p>" style="display:none;margin-top:4px;font-family:monospace;font-size:0.78rem"></textarea>
            </div>
            <!-- Block builder area -->
            <div id="blockBuilderWrap" style="display:none;border:1px solid var(--border);border-radius:0 0 var(--radius-sm) var(--radius-sm);padding:10px;background:var(--surface2)">
                <div id="blockBuilderArea"></div>
                <div style="display:flex;gap:6px;margin-top:8px">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="addBlock('text')"><i class="fas fa-align-left"></i> Text</button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="addBlock('image')"><i class="fas fa-image"></i> Image</button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="addBlock('grid')"><i class="fas fa-th-large"></i> Grid</button>
                </div>
            </div>
            <div class="field-hint"><i class="fas fa-info-circle"></i> Use toolbar for rich text, <strong>Blocks</strong> for structured layout, or click HTML for source editing.</div>
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
            config: JSON.stringify({ html: window.getWysiwygValue ? window.getWysiwygValue() : (document.getElementById('modalConfig')?.value || '') }),
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
            <label>Subtitle <span style="font-size:0.72rem;color:var(--muted)">— optional tagline shown below the section heading</span></label>
            <input type="text" class="form-input" id="modalSubtitle" value="${esc(s.subtitle || '')}" placeholder="e.g. A selection of my recent work">
        </div>
        <div class="form-group">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
                <input type="checkbox" id="modalAnimate" ${s.animate !== 0 ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--accent2)">
                <span>Enable scroll animations for this section</span>
            </label>
            <div class="field-hint"><i class="fas fa-info-circle"></i>When unchecked, cards and items in this section appear instantly without scroll-triggered animations.</div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Animation Preset</label>
                <select class="form-input" id="modalAnimationPreset">
                    <option value="fade"       ${(s.animation_preset || 'fade') === 'fade'        ? 'selected' : ''}>Fade In</option>
                    <option value="slide-up"   ${s.animation_preset === 'slide-up'                ? 'selected' : ''}>Slide Up</option>
                    <option value="slide-left" ${s.animation_preset === 'slide-left'              ? 'selected' : ''}>Slide from Left</option>
                    <option value="slide-right"${s.animation_preset === 'slide-right'             ? 'selected' : ''}>Slide from Right</option>
                    <option value="scale"      ${s.animation_preset === 'scale'                   ? 'selected' : ''}>Scale In</option>
                    <option value="none"       ${s.animation_preset === 'none'                    ? 'selected' : ''}>None (instant)</option>
                </select>
                <div class="field-hint"><i class="fas fa-info-circle"></i>Animation style applied to elements in this section on scroll reveal.</div>
            </div>
            <div class="form-group">
                <label>Layout Variant</label>
                <select class="form-input" id="modalLayoutVariant">
                    <option value="standard" ${(s.layout_variant || 'standard') === 'standard'   ? 'selected' : ''}>Standard</option>
                    <option value="centered" ${s.layout_variant === 'centered'                    ? 'selected' : ''}>Centered</option>
                    <option value="hero"     ${s.layout_variant === 'hero'                        ? 'selected' : ''}>Hero (full-width)</option>
                    <option value="split"    ${s.layout_variant === 'split'                       ? 'selected' : ''}>Split (50/50)</option>
                    <option value="grid"     ${s.layout_variant === 'grid'                        ? 'selected' : ''}>Grid</option>
                </select>
                <div class="field-hint"><i class="fas fa-info-circle"></i>Controls how content is arranged within the section container.</div>
            </div>
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
            <label>Content <span style="color:var(--muted);font-weight:400">(WYSIWYG or HTML)</span></label>
            <!-- WYSIWYG toolbar -->
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:4px;padding:6px;background:var(--surface2);border:1px solid var(--border);border-bottom:none;border-radius:var(--radius-sm) var(--radius-sm) 0 0">
                <button type="button" class="btn btn-secondary btn-icon btn-sm" onclick="document.execCommand('bold')" title="Bold"><b>B</b></button>
                <button type="button" class="btn btn-secondary btn-icon btn-sm" onclick="document.execCommand('italic')" title="Italic"><i>I</i></button>
                <button type="button" class="btn btn-secondary btn-icon btn-sm" onclick="document.execCommand('underline')" title="Underline"><u>U</u></button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.execCommand('formatBlock',false,'h2')" title="H2" style="font-size:0.72rem">H2</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.execCommand('formatBlock',false,'h3')" title="H3" style="font-size:0.72rem">H3</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.execCommand('formatBlock',false,'p')" title="Paragraph" style="font-size:0.72rem">P</button>
                <button type="button" class="btn btn-secondary btn-icon btn-sm" onclick="document.execCommand('insertUnorderedList')" title="Bullet list"><i class="fas fa-list-ul"></i></button>
                <button type="button" class="btn btn-secondary btn-icon btn-sm" onclick="document.execCommand('insertOrderedList')" title="Numbered list"><i class="fas fa-list-ol"></i></button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="wysiwygInsertLink()" title="Link" style="font-size:0.72rem"><i class="fas fa-link"></i></button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="toggleWysiwygSource()" id="wysiwygSourceBtn" title="Toggle HTML source" style="font-size:0.72rem"><i class="fas fa-code"></i> HTML</button>
            </div>
            <div id="wysiwygEditor" contenteditable="true"
                style="min-height:120px;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:0 0 var(--radius-sm) var(--radius-sm);color:var(--text-primary);font-size:0.88rem;line-height:1.6;outline:none"
                oninput="syncWysiwygToHidden()">${config.html || ''}</div>
            <textarea class="form-input" id="modalConfig" rows="5" style="display:none;margin-top:4px;font-family:monospace;font-size:0.78rem">${esc(config.html || '')}</textarea>
            <div class="field-hint"><i class="fas fa-info-circle"></i>Use the toolbar for rich text, or click <strong>HTML</strong> to edit raw HTML source.</div>
        </div>` : ''}
    `;
    const ok = await showEditModal('Edit Section', body);
    if (!ok) return;

    const data = {
        title:            document.getElementById('modalTitle').value,
        subtitle:         document.getElementById('modalSubtitle')?.value || null,
        nav_icon:          document.getElementById('modalIcon').value,
        nav_label:         document.getElementById('modalLabel').value,
        animate:           document.getElementById('modalAnimate')?.checked ? 1 : 0,
        animation_preset:  document.getElementById('modalAnimationPreset')?.value || 'fade',
        layout_variant:    document.getElementById('modalLayoutVariant')?.value || 'standard',
    };
    if (isCustom) {
        data.config = JSON.stringify({ html: window.getWysiwygValue ? window.getWysiwygValue() : (document.getElementById('modalConfig')?.value || '') });
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
    // Optimistic UI: update badge and button immediately
    const item = document.querySelector(`.section-list-item[data-id="${id}"]`);
    if (item) {
        const badge  = item.querySelector('.status-badge');
        const toggle = item.querySelector('button[aria-label*="section"]');
        if (badge) {
            badge.className = 'status-badge ' + (visible ? 'visible' : 'hidden');
            badge.innerHTML = `<i class="fas fa-${visible ? 'eye' : 'eye-slash'}"></i> ${visible ? 'Visible' : 'Hidden'}`;
        }
        if (toggle) {
            toggle.setAttribute('aria-label', visible ? 'Hide section' : 'Show section');
            toggle.title = visible ? 'Hide section' : 'Show section';
            toggle.innerHTML = `<i class="fas fa-${visible ? 'eye-slash' : 'eye'}" aria-hidden="true"></i>`;
            toggle.setAttribute('onclick', `toggleSectionVisibility('${id}', ${visible ? 0 : 1})`);
        }
    }
    try {
        await API.updateSection(id, { visible });
    } catch (err) {
        // Rollback on failure
        showToast(err.message, 'error');
        loadSectionsPage();
    }
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

// ── Content Block Builder ──
// A simple block editor that builds HTML from structured blocks (text, image, grid).
// Uses a separate mode toggled with the "Block Builder" button in the toolbar.

let _blocks = [];

window.initBlockBuilder = function(initialHtml) {
    _blocks = [];
    // Try to parse existing HTML into blocks (best-effort)
    const parser = new DOMParser();
    const doc = parser.parseFromString(initialHtml || '', 'text/html');
    doc.body.childNodes.forEach(function(node) {
        if (node.nodeType === 3 && node.textContent.trim()) {
            _blocks.push({ type: 'text', content: '<p>' + node.textContent + '</p>' });
        } else if (node.tagName) {
            const tag = node.tagName.toLowerCase();
            if (tag === 'img') {
                _blocks.push({ type: 'image', src: node.src || '', alt: node.alt || '', caption: '' });
            } else {
                _blocks.push({ type: 'text', content: node.outerHTML });
            }
        }
    });
    renderBlockBuilder();
};

window.renderBlockBuilder = function() {
    const area = document.getElementById('blockBuilderArea');
    if (!area) return;
    area.innerHTML = '';
    _blocks.forEach(function(block, i) {
        const div = document.createElement('div');
        div.className = 'block-item';
        div.style.cssText = 'background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px;margin-bottom:8px;position:relative';
        const label = block.type === 'image' ? 'Image' : block.type === 'grid' ? 'Grid' : 'Text';
        div.innerHTML =
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
            '<span style="font-size:0.72rem;font-weight:600;color:var(--accent2);text-transform:uppercase">' + label + '</span>' +
            '<div style="margin-left:auto;display:flex;gap:4px">' +
            (i > 0 ? '<button type="button" class="btn btn-secondary btn-icon btn-sm" onclick="moveBlock(' + i + ',-1)" title="Move up"><i class="fas fa-chevron-up"></i></button>' : '') +
            (i < _blocks.length - 1 ? '<button type="button" class="btn btn-secondary btn-icon btn-sm" onclick="moveBlock(' + i + ',1)" title="Move down"><i class="fas fa-chevron-down"></i></button>' : '') +
            '<button type="button" class="btn btn-danger btn-icon btn-sm" onclick="removeBlock(' + i + ')" title="Remove"><i class="fas fa-trash"></i></button>' +
            '</div></div>';
        if (block.type === 'text') {
            div.innerHTML += '<textarea class="form-input" rows="3" style="font-size:0.82rem" oninput="updateBlock(' + i + ',\'content\',this.value)">' + esc(block.content) + '</textarea>';
        } else if (block.type === 'image') {
            div.innerHTML +=
                '<input type="text" class="form-input" placeholder="Image URL or R2 path" value="' + esc(block.src) + '" style="margin-bottom:4px;font-size:0.82rem" oninput="updateBlock(' + i + ',\'src\',this.value)">' +
                '<input type="text" class="form-input" placeholder="Alt text / caption (optional)" value="' + esc(block.caption || block.alt || '') + '" style="font-size:0.82rem" oninput="updateBlock(' + i + ',\'caption\',this.value)">';
        } else if (block.type === 'grid') {
            div.innerHTML +=
                '<div style="font-size:0.78rem;color:var(--muted);margin-bottom:4px">Grid columns (comma-separated HTML snippets):</div>' +
                '<textarea class="form-input" rows="3" placeholder="<div>Column 1</div>,<div>Column 2</div>" style="font-size:0.78rem" oninput="updateBlock(' + i + ',\'cols\',this.value)">' + esc(block.cols || '') + '</textarea>';
        }
        area.appendChild(div);
    });
    syncBlocksToWysiwyg();
};

window.addBlock = function(type) {
    if (type === 'text') _blocks.push({ type: 'text', content: '<p>New text block</p>' });
    else if (type === 'image') _blocks.push({ type: 'image', src: '', alt: '', caption: '' });
    else if (type === 'grid') _blocks.push({ type: 'grid', cols: '' });
    renderBlockBuilder();
};

window.removeBlock = function(i) {
    _blocks.splice(i, 1);
    renderBlockBuilder();
};

window.moveBlock = function(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= _blocks.length) return;
    const tmp = _blocks[i]; _blocks[i] = _blocks[j]; _blocks[j] = tmp;
    renderBlockBuilder();
};

window.updateBlock = function(i, key, val) {
    if (_blocks[i]) { _blocks[i][key] = val; syncBlocksToWysiwyg(); }
};

window.syncBlocksToWysiwyg = function() {
    const html = _blocks.map(function(b) {
        if (b.type === 'text') return b.content;
        if (b.type === 'image') {
            return '<figure style="margin:16px 0;text-align:center">' +
                '<img src="' + esc(b.src) + '" alt="' + esc(b.alt || b.caption || '') + '" style="max-width:100%;border-radius:8px">' +
                (b.caption ? '<figcaption style="font-size:0.78rem;color:var(--muted);margin-top:4px">' + esc(b.caption) + '</figcaption>' : '') +
                '</figure>';
        }
        if (b.type === 'grid') {
            const cols = (b.cols || '').split(',').map(function(c) { return '<div class="cb-grid-col">' + c.trim() + '</div>'; }).join('');
            return '<div class="cb-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin:16px 0">' + cols + '</div>';
        }
        return '';
    }).join('\n');
    // Sync to WYSIWYG editor
    const editor = document.getElementById('wysiwygEditor');
    const hidden = document.getElementById('modalConfig');
    if (editor && editor.style.display !== 'none') { editor.innerHTML = html; }
    if (hidden) hidden.value = html;
};

window.toggleBlockBuilder = function() {
    const area    = document.getElementById('blockBuilderWrap');
    const wysiwyg = document.getElementById('wysiwygWrap');
    const btn     = document.getElementById('blockBuilderBtn');
    if (!area) return;
    if (area.style.display === 'none') {
        // Switch to block builder
        const editor = document.getElementById('wysiwygEditor');
        const hidden = document.getElementById('modalConfig');
        const html   = (editor && editor.style.display !== 'none') ? editor.innerHTML : (hidden ? hidden.value : '');
        initBlockBuilder(html);
        area.style.display = '';
        if (wysiwyg) wysiwyg.style.display = 'none';
        if (btn) btn.innerHTML = '<i class="fas fa-code"></i> WYSIWYG';
    } else {
        // Switch back to WYSIWYG
        area.style.display = 'none';
        if (wysiwyg) wysiwyg.style.display = '';
        if (btn) btn.innerHTML = '<i class="fas fa-th-large"></i> Blocks';
    }
};

// ── WYSIWYG helpers ──
window.syncWysiwygToHidden = function() {
    const editor = document.getElementById('wysiwygEditor');
    const hidden = document.getElementById('modalConfig');
    if (editor && hidden) hidden.value = editor.innerHTML;
};

window.toggleWysiwygSource = function() {
    const editor = document.getElementById('wysiwygEditor');
    const hidden = document.getElementById('modalConfig');
    const btn    = document.getElementById('wysiwygSourceBtn');
    if (!editor || !hidden) return;
    if (editor.style.display === 'none') {
        // Switch to WYSIWYG
        editor.innerHTML = hidden.value;
        editor.style.display = '';
        hidden.style.display = 'none';
        if (btn) btn.innerHTML = '<i class="fas fa-code"></i> HTML';
    } else {
        // Switch to source
        hidden.value = editor.innerHTML;
        editor.style.display = 'none';
        hidden.style.display = '';
        if (btn) btn.innerHTML = '<i class="fas fa-eye"></i> Preview';
    }
};

window.wysiwygInsertLink = function() {
    const url   = prompt('Enter URL:');
    const label = prompt('Link text:', 'click here');
    if (url) document.execCommand('insertHTML', false, `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label || url)}</a>`);
};

window.getWysiwygValue = function() {
    const editor = document.getElementById('wysiwygEditor');
    const hidden = document.getElementById('modalConfig');
    if (editor && editor.style.display !== 'none') return editor.innerHTML;
    return hidden ? hidden.value : '';
};

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
