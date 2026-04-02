// ============================================================
// Preset System — Schema-driven form configuration manager
// ============================================================
//
// A "preset" is a named configuration object with:
//   - schema: defines fields (type, label, default, validation, conditional)
//   - values: the current saved values for those fields
//
// Field types: text, number, textarea, select, checkbox, color, range
// Validation: required, min, max, pattern, message
// Conditional: { field: "key", value: "someValue" } — show only when another field matches
// ============================================================

router.register('presets', loadPresetsPage);

/* ── Field Schema Builder ──────────────────────────────────
 *
 * Schema JSON format example:
 * {
 *   "fields": [
 *     { "key":"title",    "type":"text",     "label":"Title",    "default":"",   "required":true  },
 *     { "key":"count",    "type":"number",   "label":"Count",    "default":5,    "min":1, "max":50 },
 *     { "key":"mode",     "type":"select",   "label":"Mode",     "default":"a",  "options":["a","b","c"] },
 *     { "key":"enabled",  "type":"checkbox", "label":"Enabled",  "default":true  },
 *     { "key":"color",    "type":"color",    "label":"Accent",   "default":"#4ecdc4" },
 *     { "key":"opacity",  "type":"range",    "label":"Opacity",  "default":100,  "min":0, "max":100 },
 *     { "key":"notes",    "type":"textarea", "label":"Notes",    "default":"",
 *       "conditional": { "field":"enabled", "value": true } }
 *   ]
 * }
 * ──────────────────────────────────────────────────────── */

let _presets = { list: [], editing: null };

async function loadPresetsPage() {
    const container = document.getElementById('presetsEditor');
    if (!container) return;
    renderPageLoading(container);

    try {
        const data = await API.get('/api/admin/presets');
        _presets.list = data.presets || [];
        renderPresetList(container);
    } catch (err) {
        renderPageError(container, err, loadPresetsPage);
    }
}

function renderPresetList(container) {
    const list = _presets.list;
    let html = `
        <div class="help-banner">
            <i class="fas fa-magic"></i>
            <div>
                <strong>Preset System</strong> — Create named configuration objects with schema-defined fields.
                Each preset has a <strong>schema</strong> (field definitions) and <strong>values</strong> (saved config).
                Use presets for reusable configurations: game settings, UI themes, section layouts, etc.
            </div>
        </div>`;

    if (!list.length) {
        html += '<div class="empty-state"><i class="fas fa-magic"></i><p>No presets yet.</p><p>Create a preset to define reusable configuration schemas.</p></div>';
        container.innerHTML = html;
        return;
    }

    html += '<div class="data-grid">';
    for (const preset of list) {
        const fieldCount = (preset.schema?.fields || []).length;
        html += `<div class="data-card" id="preset-card-${preset.id}">
            <div class="data-card-header">
                <div style="flex:1;min-width:0">
                    <div class="data-card-title">${esc(preset.name)}</div>
                    ${preset.description ? `<div class="data-card-subtitle">${esc(preset.description)}</div>` : ''}
                    <div class="data-card-subtitle" style="margin-top:4px">
                        <i class="fas fa-th-list"></i> ${fieldCount} field${fieldCount !== 1 ? 's' : ''}
                        · Updated ${relativeTimePresets(preset.updated_at)}
                    </div>
                </div>
            </div>
            <div class="data-card-actions">
                <button class="btn btn-secondary btn-sm" onclick="openPresetEditor(${preset.id})"><i class="fas fa-pen"></i> Edit</button>
                <button class="btn btn-secondary btn-sm" onclick="viewPresetValues(${preset.id})"><i class="fas fa-eye"></i> Preview Form</button>
                <button class="btn btn-danger btn-sm" onclick="deletePreset(${preset.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
}

function relativeTimePresets(ts) {
    if (!ts) return 'unknown';
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
    return new Date(ts).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
}

/* ── Preset Editor Modal ─────────────────────────────────── */
function getOrCreatePresetModal() {
    let modal = document.getElementById('presetEditorModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id        = 'presetEditorModal';
        modal.className = 'admin-modal-overlay';
        modal.innerHTML = `
        <div class="admin-modal" style="max-width:820px">
          <div style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--border);flex-shrink:0">
            <span id="pmoTitle" style="font-weight:700;font-size:1rem;flex:1">Preset Editor</span>
            <button onclick="closePresetModal()" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:1rem"><i class="fas fa-times"></i></button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1;overflow:hidden;min-height:0">
            <!-- Left: schema builder -->
            <div style="padding:18px;overflow-y:auto;border-right:1px solid var(--border)">
              <div class="form-group">
                <label class="form-label">Preset Name <span style="color:var(--accent1)">*</span></label>
                <input type="text" id="pmoName" class="form-input" placeholder="My Config Preset" maxlength="100">
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <input type="text" id="pmoDesc" class="form-input" placeholder="What is this preset for?" maxlength="500">
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                <label class="form-label" style="margin:0">Schema Fields</label>
                <button class="btn btn-secondary btn-sm" onclick="addPresetField()"><i class="fas fa-plus"></i> Add Field</button>
              </div>
              <div id="pmoFields" style="display:flex;flex-direction:column;gap:8px"></div>
            </div>
            <!-- Right: live form preview -->
            <div style="padding:18px;overflow-y:auto;background:var(--surface2)">
              <div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:14px">
                <i class="fas fa-eye"></i> Live Form Preview
              </div>
              <div id="pmoPreview"></div>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid var(--border);flex-shrink:0">
            <button class="btn btn-secondary" onclick="closePresetModal()">Cancel</button>
            <button class="btn btn-primary" onclick="savePreset()"><i class="fas fa-save"></i> Save Preset</button>
          </div>
        </div>`;
        modal.addEventListener('click', e => { if (e.target === modal) closePresetModal(); });
        document.body.appendChild(modal);
    }
    return modal;
}

window.openPresetEditor = async function(id) {
    const modal = getOrCreatePresetModal();
    const titleEl = document.getElementById('pmoTitle');
    if (titleEl) titleEl.textContent = id ? 'Edit Preset' : 'New Preset';
    document.getElementById('pmoName').value = '';
    document.getElementById('pmoDesc').value = '';
    document.getElementById('pmoFields').innerHTML = '';

    if (id) {
        const existing = _presets.list.find(p => p.id === id);
        if (existing) {
            _presets.editing = existing;
            document.getElementById('pmoName').value = existing.name;
            document.getElementById('pmoDesc').value = existing.description || '';
            (existing.schema?.fields || []).forEach(f => addPresetField(f));
        }
    } else {
        _presets.editing = null;
    }

    refreshPresetPreview();
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

/* Open editor for new preset */
const addBtn = document.getElementById('addPresetBtn');
if (addBtn) addBtn.addEventListener('click', () => openPresetEditor(null));

window.closePresetModal = function() {
    const modal = document.getElementById('presetEditorModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
    _presets.editing = null;
};

/* ── Schema Field Row ─────────────────────────────────────── */
window.addPresetField = function(fieldDef) {
    const container = document.getElementById('pmoFields');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'preset-field-row';
    row.style.cssText = 'background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px;position:relative';

    const f = fieldDef || {};
    const types = ['text','number','textarea','select','checkbox','color','range'];

    row.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <label class="form-label" style="font-size:.72rem">Key *</label>
            <input type="text" class="form-input pf-key" placeholder="field_key" value="${esc(f.key||'')}" style="font-family:monospace;font-size:.82rem">
          </div>
          <div>
            <label class="form-label" style="font-size:.72rem">Type</label>
            <select class="form-input pf-type" onchange="updateFieldRow(this)">
              ${types.map(t => `<option value="${t}" ${f.type===t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <label class="form-label" style="font-size:.72rem">Label</label>
            <input type="text" class="form-input pf-label" placeholder="Field Label" value="${esc(f.label||'')}">
          </div>
          <div>
            <label class="form-label" style="font-size:.72rem">Default</label>
            <input type="text" class="form-input pf-default" placeholder="default value" value="${esc(String(f.default??''))}">
          </div>
        </div>
        <div class="pf-extra" style="margin-bottom:8px">
          ${buildFieldExtras(f)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <label class="form-label" style="font-size:.72rem">Validation (required|min:N|max:N|pattern:regex)</label>
            <input type="text" class="form-input pf-validation" placeholder="required|min:1|max:100" value="${esc(serializeValidation(f.validation))}">
          </div>
          <div>
            <label class="form-label" style="font-size:.72rem">Conditional (field=key,value=val)</label>
            <input type="text" class="form-input pf-conditional" placeholder="field=enabled,value=true" value="${esc(serializeConditional(f.conditional))}">
          </div>
        </div>
        <button onclick="this.closest('.preset-field-row').remove();refreshPresetPreview()"
          style="position:absolute;top:8px;right:8px;background:none;border:none;cursor:pointer;color:var(--muted);font-size:.85rem"
          title="Remove field"><i class="fas fa-trash"></i></button>`;

    row.querySelectorAll('input,select').forEach(el => el.addEventListener('input', refreshPresetPreview));
    container.appendChild(row);
    refreshPresetPreview();
};

window.updateFieldRow = function(sel) {
    const row = sel.closest('.preset-field-row');
    const f = { type: sel.value };
    const extraDiv = row.querySelector('.pf-extra');
    if (extraDiv) { extraDiv.innerHTML = buildFieldExtras(f); }
    refreshPresetPreview();
};

function buildFieldExtras(f) {
    const type = f.type || 'text';
    if (type === 'select') {
        const opts = Array.isArray(f.options) ? f.options.join(', ') : (f.options || '');
        return `<label class="form-label" style="font-size:.72rem">Options (comma-separated)</label>
          <input type="text" class="form-input pf-options" placeholder="option1, option2, option3" value="${esc(opts)}">`;
    }
    if (type === 'number' || type === 'range') {
        return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div><label class="form-label" style="font-size:.72rem">Min</label>
            <input type="number" class="form-input pf-min" value="${esc(String(f.min??''))}"></div>
          <div><label class="form-label" style="font-size:.72rem">Max</label>
            <input type="number" class="form-input pf-max" value="${esc(String(f.max??''))}"></div>
        </div>`;
    }
    return '';
}

function serializeValidation(v) {
    if (!v) return '';
    const parts = [];
    if (v.required) parts.push('required');
    if (v.min !== undefined) parts.push('min:' + v.min);
    if (v.max !== undefined) parts.push('max:' + v.max);
    if (v.pattern) parts.push('pattern:' + v.pattern);
    return parts.join('|');
}

function parseValidation(str) {
    if (!str) return null;
    const v = {};
    str.split('|').forEach(part => {
        const [k, val] = part.split(':');
        if (k === 'required') v.required = true;
        else if (k === 'min') v.min = Number(val);
        else if (k === 'max') v.max = Number(val);
        else if (k === 'pattern') v.pattern = val;
    });
    return Object.keys(v).length ? v : null;
}

function serializeConditional(c) {
    if (!c) return '';
    return `field=${c.field},value=${c.value}`;
}

function parseConditional(str) {
    if (!str) return null;
    const pairs = {};
    str.split(',').forEach(p => { const [k,v] = p.split('='); if (k && v !== undefined) pairs[k.trim()] = v.trim(); });
    return pairs.field ? { field: pairs.field, value: pairs.value === 'true' ? true : pairs.value === 'false' ? false : pairs.value } : null;
}

/* ── Extract Schema from UI ──────────────────────────────── */
function extractSchema() {
    const rows = document.querySelectorAll('#pmoFields .preset-field-row');
    const fields = Array.from(rows).map(row => {
        const type = row.querySelector('.pf-type')?.value || 'text';
        const field = {
            key:   (row.querySelector('.pf-key')?.value   || '').trim(),
            type,
            label: (row.querySelector('.pf-label')?.value || '').trim(),
            default: parseDefaultValue(row.querySelector('.pf-default')?.value ?? '', type),
        };
        if (!field.key) return null;

        /* Type-specific extras */
        const optEl  = row.querySelector('.pf-options');
        const minEl  = row.querySelector('.pf-min');
        const maxEl  = row.querySelector('.pf-max');
        if (optEl)  field.options = optEl.value.split(',').map(s => s.trim()).filter(Boolean);
        if (minEl && minEl.value !== '') field.min = Number(minEl.value);
        if (maxEl && maxEl.value !== '') field.max = Number(maxEl.value);

        const valStr  = row.querySelector('.pf-validation')?.value;
        const condStr = row.querySelector('.pf-conditional')?.value;
        const validation  = parseValidation(valStr);
        const conditional = parseConditional(condStr);
        if (validation)  field.validation  = validation;
        if (conditional) field.conditional = conditional;
        return field;
    }).filter(Boolean);
    return { fields };
}

function parseDefaultValue(str, type) {
    if (type === 'number' || type === 'range') return str === '' ? 0 : Number(str);
    if (type === 'checkbox') return str === 'true' || str === '1';
    return str;
}

/* ── Live Preview Renderer (form from schema) ────────────── */
function refreshPresetPreview() {
    const schema = extractSchema();
    const preview = document.getElementById('pmoPreview');
    if (!preview) return;
    if (!schema.fields.length) {
        preview.innerHTML = '<div style="color:var(--muted);font-size:.85rem;text-align:center;padding:20px">Add fields to see the form preview</div>';
        return;
    }
    preview.innerHTML = renderSchemaForm(schema, {});
}

/* Core function: render a form from schema + values */
function renderSchemaForm(schema, values) {
    const fields = schema.fields || [];
    if (!fields.length) return '<p style="color:var(--muted);font-size:.85rem">No fields defined.</p>';

    let html = '<div class="preset-form">';
    fields.forEach(f => {
        if (!f.key) return;
        const val = values[f.key] !== undefined ? values[f.key] : f.default;

        /* Conditional display */
        const cond = f.conditional;
        let condAttr = '';
        if (cond) {
            condAttr = `data-cond-field="${esc(cond.field)}" data-cond-value="${esc(String(cond.value))}"`;
        }

        html += `<div class="preset-form-field" ${condAttr} data-field-key="${esc(f.key)}" style="${cond ? 'display:none' : ''}">
          <label class="form-label">${esc(f.label || f.key)}${f.validation?.required ? ' <span style="color:var(--accent1)">*</span>' : ''}</label>
          ${renderFormInput(f, val)}
        </div>`;
    });
    html += '</div>';
    html += `<script>initPresetFormConditionals(document.querySelector('.preset-form'));${''}<\/script>`;
    return html;
}

function renderFormInput(f, val) {
    const eid = 'pfi-' + esc(f.key);
    switch (f.type) {
        case 'textarea':
            return `<textarea id="${eid}" class="form-input" name="${esc(f.key)}" rows="3">${esc(String(val ?? ''))}</textarea>`;
        case 'select': {
            const opts = (f.options || []).map(o => `<option value="${esc(o)}" ${String(val)===String(o)?'selected':''}>${esc(o)}</option>`).join('');
            return `<select id="${eid}" class="form-input" name="${esc(f.key)}">${opts}</select>`;
        }
        case 'checkbox':
            return `<label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" id="${eid}" name="${esc(f.key)}" ${val ? 'checked' : ''} style="width:16px;height:16px">
              <span style="font-size:.85rem;color:var(--text-secondary)">${f.label ? esc(f.label) : ''}</span>
            </label>`;
        case 'color':
            return `<input type="color" id="${eid}" name="${esc(f.key)}" value="${esc(String(val||'#4ecdc4'))}" style="width:60px;height:36px;border-radius:6px;border:1px solid var(--border);cursor:pointer">`;
        case 'range': {
            const min = f.min ?? 0, max = f.max ?? 100;
            return `<div style="display:flex;align-items:center;gap:10px">
              <input type="range" id="${eid}" name="${esc(f.key)}" min="${min}" max="${max}" value="${esc(String(val??min))}" style="flex:1" oninput="document.getElementById('${eid}-val').textContent=this.value">
              <span id="${eid}-val" style="font-size:.85rem;font-weight:600;min-width:32px;text-align:right">${esc(String(val??min))}</span>
            </div>`;
        }
        case 'number': {
            const min = f.min !== undefined ? `min="${f.min}"` : '';
            const max = f.max !== undefined ? `max="${f.max}"` : '';
            return `<input type="number" id="${eid}" class="form-input" name="${esc(f.key)}" value="${esc(String(val??''))}" ${min} ${max}>`;
        }
        default: /* text */
            return `<input type="text" id="${eid}" class="form-input" name="${esc(f.key)}" value="${esc(String(val??''))}" placeholder="${esc(f.placeholder||'')}">`;
    }
}

/* ── Save & Delete ───────────────────────────────────────── */
window.savePreset = async function() {
    const name = (document.getElementById('pmoName')?.value || '').trim();
    if (!name) { showToast('Preset name is required', 'error'); return; }
    const schema = extractSchema();
    const description = (document.getElementById('pmoDesc')?.value || '').trim();

    /* Collect current values from preview form */
    const values = {};
    document.querySelectorAll('#pmoPreview [name]').forEach(el => {
        if (el.type === 'checkbox') values[el.name] = el.checked;
        else values[el.name] = el.value;
    });

    const payload = { name, description, schema, values };
    const btn = document.querySelector('#presetEditorModal .btn-primary');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…'; }

    try {
        if (_presets.editing) {
            await API.put('/api/admin/presets/' + _presets.editing.id, payload);
            showToast('Preset updated', 'success');
        } else {
            await API.post('/api/admin/presets', payload);
            showToast('Preset created', 'success');
        }
        closePresetModal();
        loadPresetsPage();
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Preset'; }
    }
};

window.deletePreset = async function(id) {
    if (!confirm('Delete this preset? Cannot be undone.')) return;
    try {
        await API.delete('/api/admin/presets/' + id);
        showToast('Preset deleted', 'success');
        loadPresetsPage();
    } catch (e) { showToast(e.message, 'error'); }
};

/* ── View Preset as Form ─────────────────────────────────── */
window.viewPresetValues = function(id) {
    const preset = _presets.list.find(p => p.id === id);
    if (!preset) return;

    let modal = document.getElementById('presetFormViewModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id        = 'presetFormViewModal';
        modal.className = 'admin-modal-overlay';
        modal.innerHTML = `
        <div class="admin-modal" style="max-width:560px">
          <div style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--border)">
            <span id="pfvTitle" style="font-weight:700;font-size:1rem;flex:1">Preset</span>
            <button onclick="this.closest('.admin-modal-overlay').style.display='none';document.body.style.overflow=''"
              style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:1rem"><i class="fas fa-times"></i></button>
          </div>
          <div id="pfvBody" style="padding:18px;overflow-y:auto;max-height:70vh"></div>
          <div style="padding:12px 18px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">
            <button class="btn btn-secondary" onclick="this.closest('.admin-modal-overlay').style.display='none';document.body.style.overflow=''">Close</button>
            <button class="btn btn-primary" onclick="savePresetFormValues(${id})"><i class="fas fa-save"></i> Save Values</button>
          </div>
        </div>`;
        modal.addEventListener('click', e => { if (e.target === modal) { modal.style.display='none'; document.body.style.overflow=''; }});
        document.body.appendChild(modal);
    }

    document.getElementById('pfvTitle').textContent = preset.name;
    const body = document.getElementById('pfvBody');
    body.innerHTML = renderSchemaForm(preset.schema || { fields: [] }, preset.values || {});

    /* Apply conditional logic */
    initPresetFormConditionals(body.querySelector('.preset-form'));

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.savePresetFormValues = async function(id) {
    const preset = _presets.list.find(p => p.id === id);
    if (!preset) return;
    const values = {};
    document.querySelectorAll('#pfvBody [name]').forEach(el => {
        if (el.type === 'checkbox') values[el.name] = el.checked;
        else values[el.name] = el.value;
    });
    try {
        await API.put('/api/admin/presets/' + id, { ...preset, values });
        showToast('Values saved', 'success');
        loadPresetsPage();
        document.getElementById('presetFormViewModal').style.display = 'none';
        document.body.style.overflow = '';
    } catch (e) { showToast(e.message, 'error'); }
};

/* ── Conditional Field Logic ─────────────────────────────── */
window.initPresetFormConditionals = function(form) {
    if (!form) return;
    const condFields = form.querySelectorAll('[data-cond-field]');
    if (!condFields.length) return;

    function evaluate() {
        condFields.forEach(fieldEl => {
            const key   = fieldEl.dataset.condField;
            const value = fieldEl.dataset.condValue;
            const ctrl  = form.querySelector(`[name="${CSS.escape(key)}"]`);
            if (!ctrl) return;
            const current = ctrl.type === 'checkbox' ? String(ctrl.checked) : ctrl.value;
            fieldEl.style.display = current === value ? '' : 'none';
        });
    }

    evaluate();
    form.querySelectorAll('input,select,textarea').forEach(el => el.addEventListener('change', evaluate));
};
