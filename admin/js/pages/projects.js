// ============================================================
// Projects Editor — full CMS with status, featured, skills, filter
// ============================================================

router.register('projects', loadProjectsPage);

/* ── State ── */
let _allProjects = [];
let _projectFilterStatus = 'all';
let _projectFilterCategory = 'all';
let _projectSearch = '';
const _projectPageSize = 25;
let _projectPage = 0;

async function loadProjectsPage() {
    const container = document.getElementById('projectsEditor');
    renderPageLoading(container);

    try {
        _allProjects = await API.getProjects();
        renderProjectsPage();
    } catch (err) {
        renderPageError(container, err);
    }
}

function renderProjectsPage() {
    const container = document.getElementById('projectsEditor');
    if (!container) return;

    const categories = [...new Set(_allProjects.map(p => p.category || 'standard').filter(Boolean))].sort();

    const filtered = _allProjects.filter(proj => {
        const matchStatus   = _projectFilterStatus === 'all' || proj.status === _projectFilterStatus
            || (_projectFilterStatus === 'featured' && proj.featured);
        const matchCategory = _projectFilterCategory === 'all' || (proj.category || 'standard') === _projectFilterCategory;
        const q             = _projectSearch.trim().toLowerCase();
        const matchSearch   = !q ||
            (proj.title || '').toLowerCase().includes(q) ||
            (proj.description || '').toLowerCase().includes(q) ||
            (typeof proj.tags === 'string' ? JSON.parse(proj.tags || '[]') : (proj.tags || [])).some(t => t.toLowerCase().includes(q));
        return matchStatus && matchCategory && matchSearch;
    });

    const statusCounts = {
        all: _allProjects.length,
        published: _allProjects.filter(p => (p.status || 'published') === 'published').length,
        draft:     _allProjects.filter(p => p.status === 'draft').length,
        archived:  _allProjects.filter(p => p.status === 'archived').length,
        featured:  _allProjects.filter(p => p.featured).length,
    };

    let html = `
        <div class="help-banner">
            <i class="fas fa-info-circle"></i>
            <div>
                <strong>Projects</strong> — Each card shows a thumbnail, title, description, tags, and skills.
                Cards can open an image gallery, video gallery, or live webpage preview.
                Use <strong>Status</strong> to draft before publishing. Use <strong>Featured</strong> to promote key projects.
            </div>
        </div>

        <!-- Filter bar -->
        <div class="admin-card" style="margin-bottom:16px">
            <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:12px 16px">
                <!-- Status pills -->
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                    ${[
                        ['all',       'All',       statusCounts.all],
                        ['published', 'Published', statusCounts.published],
                        ['draft',     'Draft',     statusCounts.draft],
                        ['archived',  'Archived',  statusCounts.archived],
                        ['featured',  'Featured ★', statusCounts.featured],
                    ].map(([val, label, cnt]) => `
                        <button class="btn btn-sm ${_projectFilterStatus === val ? 'btn-primary' : 'btn-secondary'}"
                            onclick="setProjectFilter('status','${val}')">${label}
                            <span style="background:var(--surface3);border-radius:10px;padding:1px 6px;font-size:0.72rem;margin-left:4px">${cnt}</span>
                        </button>`).join('')}
                </div>
                <!-- Category filter -->
                <select class="form-input" style="flex:0 0 160px;font-size:0.82rem" onchange="setProjectFilter('category', this.value)">
                    <option value="all">All Categories</option>
                    ${categories.map(c => `<option value="${esc(c)}" ${_projectFilterCategory === c ? 'selected' : ''}>${esc(c.charAt(0).toUpperCase() + c.slice(1))}</option>`).join('')}
                </select>
                <!-- Search -->
                <div style="flex:1;min-width:180px;position:relative">
                    <i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:0.8rem;pointer-events:none"></i>
                    <input type="text" class="form-input" placeholder="Search title, description, tags…"
                        style="padding-left:32px;font-size:0.82rem" value="${esc(_projectSearch)}"
                        oninput="setProjectFilter('search', this.value)">
                </div>
                ${(_projectFilterStatus !== 'all' || _projectFilterCategory !== 'all' || _projectSearch)
                    ? `<button class="btn btn-secondary btn-sm" onclick="clearProjectFilters()"><i class="fas fa-times"></i> Clear</button>` : ''}
            </div>
        </div>`;

    // Bulk action bar
    html += `
        <div id="bulkBar" style="display:none;padding:10px 14px;background:var(--surface2);border:1px solid var(--accent2);border-radius:var(--radius-sm);margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <span id="bulkCount" style="font-size:0.85rem;font-weight:600">0 selected</span>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
                <button class="btn btn-secondary btn-sm" onclick="bulkSetStatus('published')"><i class="fas fa-check"></i> Publish</button>
                <button class="btn btn-secondary btn-sm" onclick="bulkSetStatus('draft')"><i class="fas fa-pen"></i> Draft</button>
                <button class="btn btn-secondary btn-sm" onclick="bulkSetStatus('archived')"><i class="fas fa-archive"></i> Archive</button>
                <button class="btn btn-danger btn-sm" onclick="bulkDelete()"><i class="fas fa-trash"></i> Delete</button>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="clearBulkSelection()" style="margin-left:auto"><i class="fas fa-times"></i> Clear</button>
        </div>`;

    // Clamp page
    const totalPages = Math.ceil(filtered.length / _projectPageSize) || 1;
    _projectPage = Math.max(0, Math.min(_projectPage, totalPages - 1));
    const pageSlice = filtered.slice(_projectPage * _projectPageSize, (_projectPage + 1) * _projectPageSize);

    if (!filtered.length) {
        html += `<div class="empty-state"><i class="fas fa-search"></i><p>${_allProjects.length ? 'No projects match your filters.' : 'No projects yet — click <strong>Add Project</strong>.'}</p></div>`;
    } else {
        // Pagination controls
        if (totalPages > 1) {
            html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:0.83rem;color:var(--muted)">
                <button class="btn btn-secondary btn-sm" onclick="setProjectPage(${_projectPage - 1})" ${_projectPage === 0 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
                <span>Page ${_projectPage + 1} / ${totalPages} &nbsp;(${filtered.length} total)</span>
                <button class="btn btn-secondary btn-sm" onclick="setProjectPage(${_projectPage + 1})" ${_projectPage >= totalPages - 1 ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
            </div>`;
        }
        html += '<div class="data-grid">';
        for (const proj of pageSlice) {
            const tags    = typeof proj.tags === 'string' ? JSON.parse(proj.tags || '[]') : (proj.tags || []);
            const skills  = typeof proj.skills === 'string' ? JSON.parse(proj.skills || '[]') : (proj.skills || []);
            const status  = proj.status || 'published';
            const statusColor = status === 'published' ? 'visible' : status === 'draft' ? 'hidden' : 'unpublished';
            const featuredBadge = proj.featured
                ? `<span class="status-badge visible" style="font-size:0.68rem;background:var(--surface3)"><i class="fas fa-star"></i> Featured</span>` : '';
            const visibilityBadge = !proj.visibility
                ? `<span class="status-badge hidden" style="font-size:0.68rem"><i class="fas fa-eye-slash"></i> Hidden</span>` : '';
            html += `
                <div class="data-item" style="gap:14px" data-proj-id="${proj.id}">
                    <label style="display:flex;align-items:center;padding:0 4px;cursor:pointer">
                        <input type="checkbox" class="proj-checkbox" data-id="${proj.id}" style="width:16px;height:16px;accent-color:var(--accent2)" onchange="updateBulkBar()">
                    </label>
                    <div style="width:88px;height:64px;border-radius:8px;overflow:hidden;background:var(--surface3);flex-shrink:0;border:1px solid var(--border)">
                        ${proj.thumbnail_path
                            ? `<img src="${esc(proj.thumbnail_path)}" style="width:100%;height:100%;object-fit:cover" loading="lazy" onerror="this.style.display='none'">`
                            : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted)"><i class="fas fa-image" style="font-size:1.4rem"></i></div>`}
                    </div>
                    <div class="data-item-content">
                        <div class="data-item-title">${esc(proj.title)}</div>
                        <div class="data-item-subtitle" style="margin-top:2px">${esc((proj.description || '').substring(0, 80))}${(proj.description || '').length > 80 ? '…' : ''}</div>
                        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">
                            <span class="status-badge ${statusColor}" style="font-size:0.68rem">${esc(status)}</span>
                            ${featuredBadge}
                            ${visibilityBadge}
                            ${proj.category && proj.category !== 'standard' ? `<span class="status-badge" style="font-size:0.68rem;background:var(--surface3)"><i class="fas fa-tag"></i> ${esc(proj.category)}</span>` : ''}
                            ${proj.gallery_type ? `<span class="status-badge ${proj.gallery_type === 'video' ? 'unpublished' : proj.gallery_type === 'webpage' ? 'hidden' : 'visible'}" style="font-size:0.68rem">
                                <i class="fas fa-${proj.gallery_type === 'video' ? 'film' : proj.gallery_type === 'webpage' ? 'globe' : 'images'}"></i>
                                ${proj.gallery_type === 'video' ? 'Video' : proj.gallery_type === 'webpage' ? 'Webpage' : 'Gallery'}
                            </span>` : ''}
                            ${tags.map(t => `<span class="tag-chip" style="font-size:0.7rem;padding:2px 7px">${esc(t)}</span>`).join('')}
                        </div>
                        ${skills.length ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">${skills.map(s => `<span class="tag-chip" style="font-size:0.68rem;padding:1px 6px;background:var(--surface3);border-color:var(--accent2)">${esc(s)}</span>`).join('')}</div>` : ''}
                    </div>
                    <div class="data-item-actions">
                        <button class="btn btn-secondary btn-sm" onclick="editProject(${proj.id})"><i class="fas fa-edit" aria-hidden="true"></i> Edit</button>
                        <button class="btn btn-danger btn-sm" aria-label="Delete" onclick="deleteProject(${proj.id})"><i class="fas fa-trash" aria-hidden="true"></i></button>
                    </div>
                </div>`;
        }
        html += '</div>';
    }

    container.innerHTML = html;
}

window.setProjectPage = function(page) {
    _projectPage = page;
    renderProjectsPage();
};

window.setProjectFilter = function(type, val) {
    if (type === 'status')   _projectFilterStatus   = val;
    if (type === 'category') _projectFilterCategory = val;
    if (type === 'search')   _projectSearch         = val;
    _projectPage = 0; // reset to first page on filter change
    renderProjectsPage();
    // ARIA live announcement
    if (typeof announceAriaLive === 'function') {
        const filtered = _allProjects.filter(proj => {
            const matchStatus   = _projectFilterStatus === 'all' || proj.status === _projectFilterStatus
                || (_projectFilterStatus === 'featured' && proj.featured);
            const matchCategory = _projectFilterCategory === 'all' || (proj.category || 'standard') === _projectFilterCategory;
            const q             = _projectSearch.trim().toLowerCase();
            const matchSearch   = !q ||
                (proj.title || '').toLowerCase().includes(q) ||
                (proj.description || '').toLowerCase().includes(q);
            return matchStatus && matchCategory && matchSearch;
        });
        announceAriaLive(filtered.length + ' project(s) found');
    }
};

window.clearProjectFilters = function() {
    _projectFilterStatus   = 'all';
    _projectFilterCategory = 'all';
    _projectSearch         = '';
    renderProjectsPage();
};

document.getElementById('addProject').addEventListener('click', () => openProjectModal());

async function openProjectModal(proj = null) {
    const tags   = proj ? (typeof proj.tags === 'string'   ? JSON.parse(proj.tags   || '[]') : (proj.tags   || [])) : [];
    const skills = proj ? (typeof proj.skills === 'string' ? JSON.parse(proj.skills || '[]') : (proj.skills || [])) : [];

    /* Pre-load thumbnail media for picker */
    let thumbMedia = [];
    try { thumbMedia = await API.getMedia('thumbnail'); } catch {}

    const body = `
        <div class="form-row">
            <div class="form-group" style="flex:2">
                <label>Project Title</label>
                <input type="text" class="form-input" id="modalTitle" value="${esc(proj?.title || '')}" placeholder="e.g. Portfolio Website" maxlength="80">
            </div>
            <div class="form-group" style="flex:0 0 130px">
                <label>Sort Order</label>
                <input type="number" class="form-input" id="modalSortOrder" value="${proj?.sort_order ?? 99}" min="0" max="999">
                <div class="field-hint"><i class="fas fa-info-circle"></i>Lower = appears first</div>
            </div>
            <div class="form-group" style="flex:0 0 130px">
                <label>Priority</label>
                <select class="form-input" id="modalPriority">
                    <option value="0" ${(!proj?.priority || proj?.priority == 0) ? 'selected' : ''}>Normal</option>
                    <option value="1" ${proj?.priority == 1 ? 'selected' : ''}>High</option>
                    <option value="2" ${proj?.priority == 2 ? 'selected' : ''}>Urgent</option>
                </select>
                <div class="field-hint"><i class="fas fa-info-circle"></i>Affects sort tie-breaking</div>
            </div>
        </div>
        <div class="form-group">
            <label>Description <span style="font-size:0.72rem;color:var(--muted)">— shown below the card</span></label>
            <textarea class="form-input" id="modalDesc" rows="3" placeholder="Short summary…" maxlength="300">${esc(proj?.description || '')}</textarea>
            <span class="char-counter" id="projDescCounter">${(proj?.description || '').length}/300</span>
        </div>

        <div class="form-group">
            <label>Thumbnail Image</label>
            <div class="card-description" style="margin-bottom:8px">Pick from your <strong>Thumbnail</strong> folder in Media Library, or paste a direct URL.</div>
            <div style="display:flex;gap:8px;align-items:center">
                <div class="media-picker-preview" id="thumbPreviewBox">
                    ${proj?.thumbnail_path ? `<img src="${esc(proj.thumbnail_path)}" id="thumbPreviewImg">` : `<i class="fas fa-image" style="color:var(--muted)"></i>`}
                </div>
                <div style="flex:1">
                    <input type="text" class="form-input" id="modalThumb" value="${esc(proj?.thumbnail_path || '')}"
                           placeholder="thumbnail/filename.jpg"
                           oninput="updateThumbPreview(this.value)" style="margin-bottom:6px">
                    ${thumbMedia.length ? `
                    <select class="form-input" id="thumbPicker" onchange="pickThumb(this.value)" style="font-size:0.82rem">
                        <option value="">— Pick from Media Library —</option>
                        ${thumbMedia.map(m => `<option value="${esc(m.url)}">${esc(m.filename)}</option>`).join('')}
                    </select>` : `<div class="field-hint"><i class="fas fa-info-circle"></i>No thumbnails found. Upload in <strong>Media Library → Thumbnail</strong> first.</div>`}
                </div>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label>Category</label>
                <select class="form-input" id="modalCategory">
                    <option value="standard"          ${(!proj?.category || proj?.category === 'standard')        ? 'selected' : ''}>Standard</option>
                    <option value="featured"          ${proj?.category === 'featured'                              ? 'selected' : ''}>Featured</option>
                    <option value="experimental"      ${proj?.category === 'experimental'                          ? 'selected' : ''}>Experimental</option>
                    <option value="archived"          ${proj?.category === 'archived'                              ? 'selected' : ''}>Archived</option>
                    <option value="video composition" ${proj?.category === 'video composition'                     ? 'selected' : ''}>Video Composition</option>
                    <option value="webpage"           ${proj?.category === 'webpage'                               ? 'selected' : ''}>Webpage Projects</option>
                </select>
                <div class="field-hint"><i class="fas fa-info-circle"></i>Used for portfolio filtering.</div>
            </div>
            <div class="form-group">
                <label>Layout Type</label>
                <select class="form-input" id="modalLayoutType">
                    <option value="card"     ${(!proj?.layout_type || proj?.layout_type === 'card')     ? 'selected' : ''}>Card — standard grid card</option>
                    <option value="wide"     ${proj?.layout_type === 'wide'                              ? 'selected' : ''}>Wide — full-row featured card</option>
                    <option value="minimal"  ${proj?.layout_type === 'minimal'                           ? 'selected' : ''}>Minimal — compact text card</option>
                    <option value="showcase" ${proj?.layout_type === 'showcase'                          ? 'selected' : ''}>Showcase — large hero card</option>
                </select>
                <div class="field-hint"><i class="fas fa-info-circle"></i>Controls how this project renders in the portfolio grid.</div>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select class="form-input" id="modalStatus">
                    <option value="published" ${(!proj?.status || proj?.status === 'published') ? 'selected' : ''}>Published — visible on live site</option>
                    <option value="draft"     ${proj?.status === 'draft'                         ? 'selected' : ''}>Draft — hidden from live site</option>
                    <option value="archived"  ${proj?.status === 'archived'                      ? 'selected' : ''}>Archived — hidden from live site</option>
                </select>
                <div class="field-hint"><i class="fas fa-info-circle"></i>Draft and Archived projects are excluded from publish.</div>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label>Gallery / Preview Type</label>
                <select class="form-input" id="modalGalleryType" onchange="toggleWebpageField()">
                    <option value=""        ${!proj?.gallery_type                   ? 'selected' : ''}>No Gallery — card opens nothing</option>
                    <option value="image"   ${proj?.gallery_type === 'image'        ? 'selected' : ''}>Image Gallery — shows photos</option>
                    <option value="video"   ${proj?.gallery_type === 'video'        ? 'selected' : ''}>Video Gallery — shows videos</option>
                    <option value="webpage" ${proj?.gallery_type === 'webpage'      ? 'selected' : ''}>Webpage Preview — iframe / live site</option>
                </select>
            </div>
            <div class="form-group" style="flex:0 0 160px;align-self:flex-end">
                <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-top:28px">
                    <input type="checkbox" id="modalFeatured" ${proj?.featured ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--accent2)">
                    <span>★ Featured project</span>
                </label>
            </div>
            <div class="form-group" style="flex:0 0 160px;align-self:flex-end">
                <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-top:28px">
                    <input type="checkbox" id="modalVisibility" ${proj?.visibility !== 0 ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--accent2)">
                    <span>Visible in portfolio</span>
                </label>
            </div>
        </div>

        <div class="form-row" id="galleryFolderRow" style="${proj?.gallery_type === 'webpage' ? 'display:none' : ''}">
            <div class="form-group">
                <label>Gallery Folder</label>
                <input type="text" class="form-input" id="modalGalleryFolder" value="${esc(proj?.gallery_folder || '')}" placeholder="e.g. layout">
                <div class="field-hint"><i class="fas fa-info-circle"></i>Folder name in your R2 Media Library holding this project's files.</div>
            </div>
        </div>

        <div class="form-group" id="webpageUrlRow" style="${proj?.gallery_type === 'webpage' ? '' : 'display:none'}">
            <label>Webpage URL</label>
            <div style="display:flex;gap:8px">
                <input type="text" class="form-input" id="modalWebpageUrl" value="${esc(proj?.webpage_url || '')}" placeholder="https://yourwebsite.com" style="flex:1" oninput="validateWebpageUrl(this)">
                <button type="button" class="btn btn-secondary btn-sm" id="wpPreviewBtn" onclick="toggleWpPreview()" title="Preview URL in iframe" style="${proj?.webpage_url ? '' : 'display:none'}">
                    <i class="fas fa-eye"></i> Preview
                </button>
            </div>
            <div id="wpUrlError" style="font-size:0.78rem;color:var(--accent1);margin-top:4px;display:none"><i class="fas fa-exclamation-triangle"></i> Invalid URL — must start with https://</div>
            <div id="wpPreviewFrame" style="display:none;margin-top:8px;border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;height:180px">
                <iframe id="wpInlinePreview" src="about:blank" style="width:100%;height:100%;border:none" sandbox="allow-scripts allow-same-origin"></iframe>
            </div>
            <div class="field-hint"><i class="fas fa-info-circle"></i>Full URL of the live webpage to preview in an iframe. Must start with <code>https://</code>.</div>
        </div>

        <div class="form-row" id="wpSettingsRow" style="${proj?.gallery_type === 'webpage' ? '' : 'display:none'}">
            <div class="form-group">
                <label>Default Device View</label>
                <select class="form-input" id="modalWpDevice">
                    <option value="full"    ${(!proj?.wp_device || proj?.wp_device === 'full')    ? 'selected' : ''}>Full Width</option>
                    <option value="desktop" ${proj?.wp_device === 'desktop' ? 'selected' : ''}>Desktop (1280px)</option>
                    <option value="tablet"  ${proj?.wp_device === 'tablet'  ? 'selected' : ''}>Tablet (768px)</option>
                    <option value="mobile"  ${proj?.wp_device === 'mobile'  ? 'selected' : ''}>Mobile (390px)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Preview Mode</label>
                <select class="form-input" id="modalPreviewMode">
                    <option value="live"   ${(!proj?.preview_mode || proj?.preview_mode === 'live')   ? 'selected' : ''}>Live iframe</option>
                    <option value="static" ${proj?.preview_mode === 'static' ? 'selected' : ''}>Static screenshot</option>
                </select>
            </div>
            <div class="form-group">
                <label>Load Strategy</label>
                <select class="form-input" id="modalLoadStrategy">
                    <option value="eager" ${(!proj?.load_strategy || proj?.load_strategy === 'eager') ? 'selected' : ''}>Eager (load immediately)</option>
                    <option value="lazy"  ${proj?.load_strategy === 'lazy'  ? 'selected' : ''}>Lazy (load on open)</option>
                </select>
            </div>
        </div>

        <div class="form-row" id="wpAdvancedRow" style="${proj?.gallery_type === 'webpage' ? '' : 'display:none'}">
            <div class="form-group">
                <label>Custom Width <span style="color:var(--muted);font-weight:400">(px, 0=auto)</span></label>
                <input type="number" class="form-input" id="modalCustomWidth" value="${proj?.custom_width || 0}" min="0" max="3840">
            </div>
            <div class="form-group">
                <label>Custom Height <span style="color:var(--muted);font-weight:400">(px, 0=auto)</span></label>
                <input type="number" class="form-input" id="modalCustomHeight" value="${proj?.custom_height || 0}" min="0" max="2160">
            </div>
            <div class="form-group">
                <label>Zoom Level <span style="color:var(--muted);font-weight:400">(0.5–2.0)</span></label>
                <input type="number" class="form-input" id="modalZoomLevel" value="${proj?.zoom_level || 1.0}" min="0.5" max="2.0" step="0.1">
            </div>
            <div class="form-group">
                <label>Timeout <span style="color:var(--muted);font-weight:400">(seconds)</span></label>
                <input type="number" class="form-input" id="modalWpTimeout" value="${proj?.wp_timeout || 30}" min="5" max="120">
            </div>
        </div>

        <div id="wpInteractionRow" style="${proj?.gallery_type === 'webpage' ? '' : 'display:none'}">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
                <input type="checkbox" id="modalWpInteraction" ${proj?.wp_allow_interaction !== 0 ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--accent2)">
                <span>Allow iframe interaction (scripts, forms, popups)</span>
            </label>
            <div class="field-hint"><i class="fas fa-info-circle"></i>Enables scripts and forms. Uncheck for untrusted/external sites (read-only sandbox).</div>
        </div>

        <div class="form-group">
            <label>Tags <span style="font-size:0.72rem;color:var(--muted)">— tech stack, keywords (shown as pills on card)</span></label>
            <div class="tag-editor" id="tagEditor" onclick="document.getElementById('tagInput').focus()">
                ${tags.map(t => `<span class="tag-chip">${esc(t)}<button type="button" aria-label="Remove" onclick="removeTag(this,event)"><i class="fas fa-times" aria-hidden="true"></i></button></span>`).join('')}
                <input type="text" class="tag-input" id="tagInput" placeholder="Type a tag and press Enter…"
                       onkeydown="if(event.key==='Enter'||event.key===','){event.preventDefault();addTagFromInput('tagEditor','tagInput')}"
                       onblur="addTagFromInput('tagEditor','tagInput')">
            </div>
            <div class="field-hint"><i class="fas fa-info-circle"></i>Press <strong>Enter</strong> or <strong>,</strong> to add. Click × to remove.</div>
        </div>

        <div class="form-group">
            <label>Skills <span style="font-size:0.72rem;color:var(--muted)">— tools used (shown as skill chips below tags)</span></label>
            <div class="tag-editor" id="skillEditor" onclick="document.getElementById('skillInput').focus()">
                ${skills.map(s => `<span class="tag-chip" style="border-color:var(--accent2)">${esc(s)}<button type="button" aria-label="Remove" onclick="removeTag(this,event)"><i class="fas fa-times" aria-hidden="true"></i></button></span>`).join('')}
                <input type="text" class="tag-input" id="skillInput" placeholder="e.g. Photoshop, React, Python…"
                       onkeydown="if(event.key==='Enter'||event.key===','){event.preventDefault();addTagFromInput('skillEditor','skillInput')}"
                       onblur="addTagFromInput('skillEditor','skillInput')">
            </div>
            <div class="field-hint"><i class="fas fa-info-circle"></i>Press <strong>Enter</strong> or <strong>,</strong> to add. Click × to remove.</div>
        </div>

        <script>
            document.getElementById('modalDesc').addEventListener('input', function() {
                document.getElementById('projDescCounter').textContent = this.value.length + '/300';
            });
            // Autosave on any input change
            (function() {
                var _asKey = 'proj_' + (window._projModalId || 'new');
                function _getFormData() {
                    return {
                        title: document.getElementById('modalTitle')?.value,
                        desc:  document.getElementById('modalDesc')?.value,
                        thumb: document.getElementById('modalThumb')?.value,
                    };
                }
                document.getElementById('editModalBody').addEventListener('input', function() {
                    if (typeof scheduleAutosave === 'function') scheduleAutosave(_asKey, _getFormData);
                });
            })();
        </script>
    `;

    // Store modal id for autosave key
    window._projModalId = proj ? proj.id : 'new';

    // Check for unsaved draft
    const draftKey = 'proj_' + (proj ? proj.id : 'new');
    const draft = typeof getAutosaveDraft === 'function' ? getAutosaveDraft(draftKey) : null;

    const ok = await showEditModal(proj ? 'Edit Project' : 'Add Project', body);
    if (!ok) {
        if (typeof clearAutosave === 'function') clearAutosave(draftKey);
        return;
    }
    if (typeof clearAutosave === 'function') clearAutosave(draftKey);

    const tagChips   = document.querySelectorAll('#tagEditor .tag-chip');
    const skillChips = document.querySelectorAll('#skillEditor .tag-chip');
    const newTags    = Array.from(tagChips).map(c => c.childNodes[0].textContent.trim()).filter(Boolean);
    const newSkills  = Array.from(skillChips).map(c => c.childNodes[0].textContent.trim()).filter(Boolean);

    const galleryType = document.getElementById('modalGalleryType').value || null;

    // Domain validation for webpage URLs
    if (galleryType === 'webpage') {
        const url = document.getElementById('modalWebpageUrl')?.value?.trim() || '';
        if (url && !url.startsWith('https://')) {
            showToast('Webpage URL must start with https://', 'error');
            return;
        }
    }

    const data = {
        title:          document.getElementById('modalTitle').value,
        description:    document.getElementById('modalDesc').value,
        thumbnail_path: document.getElementById('modalThumb').value || null,
        gallery_type:   galleryType,
        gallery_folder: galleryType === 'webpage' ? null : (document.getElementById('modalGalleryFolder').value || null),
        webpage_url:          galleryType === 'webpage' ? (document.getElementById('modalWebpageUrl')?.value || null) : null,
        wp_device:            galleryType === 'webpage' ? (document.getElementById('modalWpDevice')?.value || 'full') : null,
        wp_allow_interaction: galleryType === 'webpage' ? (document.getElementById('modalWpInteraction')?.checked ? 1 : 0) : null,
        preview_mode:         galleryType === 'webpage' ? (document.getElementById('modalPreviewMode')?.value || 'live') : null,
        load_strategy:        galleryType === 'webpage' ? (document.getElementById('modalLoadStrategy')?.value || 'eager') : null,
        custom_width:         galleryType === 'webpage' ? (parseInt(document.getElementById('modalCustomWidth')?.value) || 0) : null,
        custom_height:        galleryType === 'webpage' ? (parseInt(document.getElementById('modalCustomHeight')?.value) || 0) : null,
        zoom_level:           galleryType === 'webpage' ? (parseFloat(document.getElementById('modalZoomLevel')?.value) || 1.0) : null,
        wp_timeout:           galleryType === 'webpage' ? (parseInt(document.getElementById('modalWpTimeout')?.value) || 30) : null,
        category:       document.getElementById('modalCategory').value || 'standard',
        layout_type:    document.getElementById('modalLayoutType').value || 'card',
        status:         document.getElementById('modalStatus').value || 'published',
        priority:       parseInt(document.getElementById('modalPriority').value) || 0,
        featured:       document.getElementById('modalFeatured').checked ? 1 : 0,
        visibility:     document.getElementById('modalVisibility').checked ? 1 : 0,
        tags:           JSON.stringify(newTags),
        skills:         JSON.stringify(newSkills),
        sort_order:     parseInt(document.getElementById('modalSortOrder').value) || (proj?.sort_order ?? 99),
    };

    try {
        if (proj) {
            await API.updateProject(proj.id, data);
            showToast('Project updated!', 'success');
        } else {
            await API.createProject(data);
            showToast('Project created!', 'success');
        }
        _allProjects = await API.getProjects();
        renderProjectsPage();
    } catch (err) { showToast(err.message, 'error'); }
}

window.toggleWebpageField = function() {
    const type      = document.getElementById('modalGalleryType')?.value;
    const isWebpage = type === 'webpage';
    const folderRow      = document.getElementById('galleryFolderRow');
    const webpageRow     = document.getElementById('webpageUrlRow');
    const wpSettings     = document.getElementById('wpSettingsRow');
    const wpAdvanced     = document.getElementById('wpAdvancedRow');
    const wpInteraction  = document.getElementById('wpInteractionRow');
    if (folderRow)     folderRow.style.display     = isWebpage ? 'none' : '';
    if (webpageRow)    webpageRow.style.display     = isWebpage ? '' : 'none';
    if (wpSettings)    wpSettings.style.display     = isWebpage ? '' : 'none';
    if (wpAdvanced)    wpAdvanced.style.display     = isWebpage ? '' : 'none';
    if (wpInteraction) wpInteraction.style.display  = isWebpage ? '' : 'none';
};

window.validateWebpageUrl = function(input) {
    const url = input.value.trim();
    const errEl = document.getElementById('wpUrlError');
    const previewBtn = document.getElementById('wpPreviewBtn');
    const isValid = !url || url.startsWith('https://');
    if (errEl) errEl.style.display = (url && !isValid) ? '' : 'none';
    if (previewBtn) previewBtn.style.display = (url && isValid) ? '' : 'none';
};

window.toggleWpPreview = function() {
    const frameWrap = document.getElementById('wpPreviewFrame');
    const iframe    = document.getElementById('wpInlinePreview');
    const url       = document.getElementById('modalWebpageUrl')?.value?.trim();
    if (!frameWrap || !iframe) return;
    if (frameWrap.style.display === 'none') {
        frameWrap.style.display = '';
        if (url && url.startsWith('https://')) iframe.src = url;
    } else {
        frameWrap.style.display = 'none';
        iframe.src = 'about:blank';
    }
};

window.pickThumb = function(url) {
    if (!url) return;
    document.getElementById('modalThumb').value = url;
    window.updateThumbPreview(url);
};

window.updateThumbPreview = function(url) {
    const box = document.getElementById('thumbPreviewBox');
    if (!box) return;
    if (url) {
        box.innerHTML = `<img src="${url}" id="thumbPreviewImg" style="width:100%;height:100%;object-fit:cover" onerror="this.style.opacity=0.3">`;
    } else {
        box.innerHTML = `<i class="fas fa-image" style="color:var(--muted)"></i>`;
    }
};

window.addTagFromInput = function(editorId, inputId) {
    const input  = document.getElementById(inputId);
    const editor = document.getElementById(editorId);
    if (!input || !editor) return;
    const val = input.value.replace(/,/g, '').trim();
    if (!val) return;
    const isSkill = editorId === 'skillEditor';
    const chip = document.createElement('span');
    chip.className = 'tag-chip' + (isSkill ? '' : '');
    if (isSkill) chip.style.borderColor = 'var(--accent2)';
    chip.innerHTML = `${esc(val)}<button type="button" aria-label="Remove" onclick="removeTag(this,event)"><i class="fas fa-times" aria-hidden="true"></i></button>`;
    editor.insertBefore(chip, input);
    input.value = '';
};

window.removeTag = function(btn, e) {
    if (e) e.stopPropagation();
    btn.closest('.tag-chip').remove();
};

window.editProject = async function(id) {
    const proj = await API.request(`/api/projects/${id}`);
    openProjectModal(proj);
};

window.deleteProject = async function(id) {
    if (await showConfirm('Delete Project', 'Delete this project card permanently?', 'warning')) {
        try {
            await API.deleteProject(id);
            showToast('Deleted', 'success');
            _allProjects = await API.getProjects();
            renderProjectsPage();
        } catch (err) { showToast(err.message, 'error'); }
    }
};

// ── Bulk Operations ──
window.updateBulkBar = function() {
    const checked = document.querySelectorAll('.proj-checkbox:checked');
    const bar     = document.getElementById('bulkBar');
    const count   = document.getElementById('bulkCount');
    if (!bar) return;
    if (checked.length > 0) {
        bar.style.display = 'flex';
        if (count) count.textContent = `${checked.length} selected`;
    } else {
        bar.style.display = 'none';
    }
};

window.clearBulkSelection = function() {
    document.querySelectorAll('.proj-checkbox').forEach(cb => cb.checked = false);
    window.updateBulkBar();
};

function getSelectedIds() {
    return Array.from(document.querySelectorAll('.proj-checkbox:checked')).map(cb => cb.dataset.id);
}

window.bulkSetStatus = async function(status) {
    const ids = getSelectedIds();
    if (!ids.length) return;
    const ok = await showConfirm('Bulk Update', `Set ${ids.length} project(s) to <strong>${status}</strong>?`, 'warning');
    if (!ok) return;
    try {
        await Promise.all(ids.map(id => API.updateProject(id, { status })));
        showToast(`${ids.length} project(s) set to ${status}`, 'success');
        _allProjects = await API.getProjects();
        renderProjectsPage();
    } catch (err) { showToast(err.message, 'error'); }
};

window.bulkDelete = async function() {
    const ids = getSelectedIds();
    if (!ids.length) return;
    const ok = await showConfirm('Bulk Delete', `Permanently delete <strong>${ids.length} project(s)</strong>? This cannot be undone.`, 'warning');
    if (!ok) return;
    try {
        await Promise.all(ids.map(id => API.deleteProject(id)));
        showToast(`${ids.length} project(s) deleted`, 'success');
        _allProjects = await API.getProjects();
        renderProjectsPage();
    } catch (err) { showToast(err.message, 'error'); }
};
