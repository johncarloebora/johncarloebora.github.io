/* eslint-disable no-unused-vars */
// ============================================================
// Admin Shared Utilities
// Loaded before all page modules — functions here are global.
// The eslint-disable above is intentional: these functions ARE used,
// just in other script files (cross-file globals that ESLint can't trace).
// ============================================================

/**
 * Escape a string for safe HTML insertion.
 * Prevents XSS when building HTML via template literals.
 */
function esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Update a character-counter element.
 * Called from inline oninput handlers on form fields.
 * @param {string} id      - ID of the counter <span>
 * @param {string} value   - Current field value
 * @param {number} max     - Maximum allowed length
 */
window.updateCounter = function(id, value, max) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value.length + '/' + max;
    el.classList.toggle('near-limit', value.length >= max * 0.85 && value.length < max);
    el.classList.toggle('over-limit', value.length >= max);
};

/**
 * Returns a debounced version of `fn` that delays invocation until
 * `wait` milliseconds after the last call.
 * @param {Function} fn
 * @param {number}   wait - delay in ms
 */
function debounce(fn, wait = 300) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
    };
}

/**
 * Wrap an async action with button loading state.
 * Disables the button, shows a spinner + label, then restores on completion.
 *
 * @param {HTMLButtonElement} btn
 * @param {Function}          action  - async function to run
 * @param {string}            [loadingLabel] - text shown while running
 */
async function withButtonLock(btn, action, loadingLabel = 'Saving…') {
    if (!btn || btn.disabled) return; // prevent double-submit
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${esc(loadingLabel)}`;
    try {
        await action();
    } finally {
        btn.disabled = false;
        btn.innerHTML = original;
    }
}

/**
 * Render a standardised loading placeholder into a container.
 * @param {HTMLElement} container
 */
function renderPageLoading(container) {
    container.innerHTML = '<p style="color:var(--muted);padding:12px"><span class="spinner" aria-hidden="true"></span> Loading…</p>';
}

/**
 * Render a standardised error message into a container.
 * Preserves the container's previous content via a retry button when a
 * retryFn is provided.
 *
 * @param {HTMLElement} container
 * @param {Error|string} err
 * @param {Function}    [retryFn]
 */
function renderPageError(container, err, retryFn) {
    const msg = err?.message || String(err);
    const retryHtml = retryFn
        ? `<button class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="(${retryFn.toString()})()">
               <i class="fas fa-redo"></i> Retry
           </button>`
        : '';
    container.innerHTML = `
        <div style="color:var(--accent1);padding:12px;display:flex;flex-direction:column;align-items:flex-start;gap:4px">
            <span><i class="fas fa-exclamation-circle" style="margin-right:6px"></i>${esc(msg)}</span>
            ${retryHtml}
        </div>`;
}

// ============================================================
// Modal Focus Trap
// Traps Tab/Shift+Tab within a modal element.
// Returns a cleanup function that removes the listener.
// ============================================================
function trapFocus(modalEl) {
    const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

    function handler(e) {
        if (e.key !== 'Tab') return;
        const focusable = Array.from(modalEl.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
            if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
    }

    modalEl.addEventListener('keydown', handler);
    return function() { modalEl.removeEventListener('keydown', handler); };
}

// ============================================================
// Autosave — localStorage draft helpers
// ============================================================
const _autosaveTimers = {};

/**
 * Schedule an autosave of `getData()` result to localStorage under `key`.
 * Debounced 1 second. Call clearAutosave(key) when form is saved/closed.
 */
function scheduleAutosave(key, getData) {
    clearTimeout(_autosaveTimers[key]);
    _autosaveTimers[key] = setTimeout(function() {
        try {
            const data = getData();
            localStorage.setItem('autosave_' + key, JSON.stringify({ ts: Date.now(), data }));
        } catch {}
    }, 1000);
}

function getAutosaveDraft(key) {
    try {
        const raw = localStorage.getItem('autosave_' + key);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function clearAutosave(key) {
    clearTimeout(_autosaveTimers[key]);
    localStorage.removeItem('autosave_' + key);
}

// ============================================================
// Undo/Redo Stack
// ============================================================
const AdminUndoRedo = (function() {
    const MAX = 50;
    let _stack = [], _future = [], _enabled = false;

    function enable() {
        _stack = []; _future = []; _enabled = true;
        document.addEventListener('keydown', _keyHandler);
    }
    function disable() {
        _enabled = false;
        document.removeEventListener('keydown', _keyHandler);
        _stack = []; _future = [];
    }
    function push(snapshot) {
        if (!_enabled) return;
        _stack.push(snapshot);
        if (_stack.length > MAX) _stack.shift();
        _future = [];
    }
    function undo(applyFn) {
        if (_stack.length < 2) return;
        _future.push(_stack.pop());
        applyFn(_stack[_stack.length - 1]);
    }
    function redo(applyFn) {
        if (!_future.length) return;
        const s = _future.pop();
        _stack.push(s);
        applyFn(s);
    }

    function _keyHandler(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            const ev = new CustomEvent('admin-undo');
            document.dispatchEvent(ev);
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            const ev = new CustomEvent('admin-redo');
            document.dispatchEvent(ev);
        }
    }

    return { enable, disable, push, undo, redo };
})();

// ============================================================
// Performance cleanup registry
// Stores cleanup callbacks keyed by page name.
// router calls runPageCleanup(page) before navigating away.
// ============================================================
const _pageCleanup = {};

function registerPageCleanup(page, fn) {
    _pageCleanup[page] = fn;
}

function runPageCleanup(page) {
    if (_pageCleanup[page]) {
        try { _pageCleanup[page](); } catch {}
        delete _pageCleanup[page];
    }
}

// ============================================================
// Global Search
// Searches projects + sections in memory cache.
// ============================================================
let _gsCacheProjects = null;
let _gsCacheSections = null;

window.globalSearch = debounce(async function(q) {
    const res = document.getElementById('globalSearchResults');
    if (!res) return;
    q = q.trim().toLowerCase();
    if (!q) { res.style.display = 'none'; return; }

    // Populate cache if needed
    try {
        if (!_gsCacheProjects) _gsCacheProjects = await API.getProjects();
        if (!_gsCacheSections) _gsCacheSections = await API.getSections();
    } catch { return; }

    const matches = [];

    (_gsCacheProjects || []).forEach(function(p) {
        if ((p.title||'').toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q)) {
            matches.push({ label: p.title, sub: p.description ? p.description.substring(0,60) : '', icon: 'fas fa-folder-open', action: "router.navigate('projects')" });
        }
    });
    (_gsCacheSections || []).forEach(function(s) {
        if ((s.title||'').toLowerCase().includes(q) || (s.id||'').toLowerCase().includes(q)) {
            matches.push({ label: s.title, sub: '#' + s.id, icon: 'fas fa-layer-group', action: "router.navigate('sections')" });
        }
    });

    if (!matches.length) {
        res.innerHTML = '<div style="padding:10px 14px;color:var(--muted);font-size:0.82rem">No results for "' + esc(q) + '"</div>';
    } else {
        res.innerHTML = matches.slice(0, 8).map(function(m) {
            return '<div class="gs-result-item" onclick="' + esc(m.action) + ';closeGlobalSearch()" style="display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border)">' +
                '<i class="' + m.icon + '" style="color:var(--accent2);width:14px;flex-shrink:0"></i>' +
                '<div><div style="font-size:0.83rem;color:var(--text-primary)">' + esc(m.label) + '</div>' +
                (m.sub ? '<div style="font-size:0.72rem;color:var(--muted)">' + esc(m.sub) + '</div>' : '') +
                '</div></div>';
        }).join('');
    }
    res.style.display = 'block';
    if (window.announceAriaLive) announceAriaLive(matches.length + ' search result(s)');
}, 300);

window.showGlobalResults = function() {
    const inp = document.getElementById('globalSearchInput');
    if (inp && inp.value.trim()) globalSearch(inp.value);
};

window.closeGlobalSearch = function() {
    const res = document.getElementById('globalSearchResults');
    const inp = document.getElementById('globalSearchInput');
    if (res) res.style.display = 'none';
    if (inp) inp.value = '';
    _gsCacheProjects = null; // invalidate cache so next search is fresh
    _gsCacheSections = null;
};

// Close results when clicking outside
document.addEventListener('click', function(e) {
    const wrap = document.getElementById('globalSearchWrap');
    if (wrap && !wrap.contains(e.target)) {
        const res = document.getElementById('globalSearchResults');
        if (res) res.style.display = 'none';
    }
});

// ============================================================
// Schema-Driven Form Engine
// Generates form HTML from declarative field definitions.
//
// Field descriptor shape:
//   { id, type, label?, placeholder?, hint?, required?, default?,
//     compact?,                        // skip form-group wrapper + label
//     options?,                        // [{value, label}] — for 'select'
//     checkLabel?,                     // label text for checkbox/toggle
//     min?, max?, step?, unit?,        // for number/range
//     rows?,                           // for textarea
//     maxlength?,                      // for text/url/email
//     fields?,                         // nested schema — for 'group' | 'row'
//     itemSchema?, itemLabel?,         // for 'repeatable'
//     showIf?: { field, value, not? }, // conditional visibility
//     validate?: fn(val, allVals)→msg  // custom validator
//   }
//
// Types: text, textarea, number, select, checkbox, toggle,
//        url, email, color, range, group, repeatable, row
// ============================================================
const SchemaForm = (function() {

    function _field(f, vals, pfx) {
        const id  = pfx + f.id;
        const val = (vals && f.id in vals) ? vals[f.id] : (f.default !== undefined ? f.default : '');
        const condAttr = f.showIf
            ? ` data-sf-if="${esc(pfx + f.showIf.field)}" data-sf-ifv="${esc(String(f.showIf.value ?? ''))}" data-sf-ifn="${f.showIf.not ? 1 : 0}"`
            : '';

        // ── compact rendering: no form-group wrapper or label ──
        if (f.compact) {
            switch (f.type) {
                case 'select': {
                    const opts = (f.options||[]).map(o =>
                        `<option value="${esc(o.value)}"${String(val)===String(o.value)?' selected':''} >${esc(o.label)}</option>`
                    ).join('');
                    return `<select class="form-input" id="${esc(id)}" style="font-size:0.82rem;width:auto">${opts}</select>`;
                }
                case 'checkbox': case 'toggle': {
                    const ckd = (val===true||val===1||val==='1')?' checked':'';
                    return `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap;font-size:0.82rem;color:var(--text-secondary)"><input type="checkbox" id="${esc(id)}"${ckd} style="width:16px;height:16px;accent-color:var(--accent2)"><span>${esc(f.checkLabel||f.label||'')}</span></label>`;
                }
                default: {
                    return `<input type="${f.type||'text'}" class="form-input" id="${esc(id)}" value="${esc(val)}"${f.placeholder?` placeholder="${esc(f.placeholder)}"`:''} style="font-size:0.82rem">`;
                }
            }
        }

        // ── full rendering with form-group wrapper ──
        const wrapOpen  = `<div class="form-group sf-field"${condAttr}>`;
        const labelHtml = f.label ? `<label for="${esc(id)}">${esc(f.label)}${f.required?' <span style="color:var(--accent1)">*</span>':''}</label>` : '';
        const hintHtml  = f.hint  ? `<div class="field-hint"><i class="fas fa-info-circle"></i>${esc(f.hint)}</div>` : '';

        let inner = '';
        switch (f.type) {
            case 'text': case 'url': case 'email':
                inner = `<input type="${f.type}" class="form-input" id="${esc(id)}" value="${esc(val)}"${f.placeholder?` placeholder="${esc(f.placeholder)}"`:''} ${f.maxlength?`maxlength="${f.maxlength}"`:''}${f.required?' required':''}>`;
                break;
            case 'textarea':
                inner = `<textarea class="form-input" id="${esc(id)}" rows="${f.rows||3}"${f.placeholder?` placeholder="${esc(f.placeholder)}"`:''} ${f.required?' required':''}>${esc(val)}</textarea>`;
                break;
            case 'number':
                inner = `<input type="number" class="form-input" id="${esc(id)}" value="${esc(val)}"${f.min!=null?` min="${f.min}"`:''} ${f.max!=null?`max="${f.max}"`:''}${f.step!=null?` step="${f.step}"`:''}>`;
                break;
            case 'select': {
                const opts = (f.options||[]).map(o =>
                    `<option value="${esc(o.value)}"${String(val)===String(o.value)?' selected':''} >${esc(o.label)}</option>`
                ).join('');
                inner = `<select class="form-input" id="${esc(id)}">${opts}</select>`;
                break;
            }
            case 'checkbox': case 'toggle': {
                const ckd = (val===true||val===1||val==='1')?' checked':'';
                return `${wrapOpen}<label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="${esc(id)}"${ckd} style="width:16px;height:16px;accent-color:var(--accent2)"><span>${esc(f.checkLabel||f.label||'')}</span></label>${hintHtml}</div>`;
            }
            case 'color':
                inner = `<div style="display:flex;gap:8px;align-items:center"><input type="color" id="${esc(id)}_c" value="${esc(val||'#000000')}" style="width:44px;height:36px;border:1px solid var(--border);cursor:pointer;border-radius:6px;background:none;padding:2px" oninput="document.getElementById('${esc(id)}').value=this.value"><input type="text" class="form-input" id="${esc(id)}" value="${esc(val||'#000000')}" style="flex:1;font-family:monospace" oninput="document.getElementById('${esc(id)}_c').value=this.value"></div>`;
                break;
            case 'range': {
                const u = f.unit||'';
                inner = `<input type="range" id="${esc(id)}" min="${f.min||0}" max="${f.max||100}" step="${f.step||1}" value="${esc(val)}" style="width:100%" oninput="document.getElementById('${esc(id)}_rv').textContent=this.value+'${esc(u)}'"><div style="font-size:0.78rem;color:var(--muted)">Current: <span id="${esc(id)}_rv">${esc(val)}${esc(u)}</span></div>`;
                break;
            }
            case 'group': {
                const gHtml = (f.fields||[]).map(gf => _field(gf, (val&&typeof val==='object')?val:{}, id+'_')).join('');
                return `${wrapOpen}${f.label?`<div style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);margin-bottom:8px">${esc(f.label)}</div>`:''}<div class="form-row">${gHtml}</div>${hintHtml}</div>`;
            }
            case 'repeatable': {
                const items = Array.isArray(val) ? val : [];
                const schJson = esc(JSON.stringify(f.itemSchema||[]));
                const rows = items.map((item, i) => _rItem(f, item, id, i)).join('');
                return `${wrapOpen}${f.label?`<label>${esc(f.label)}</label>`:''}<div id="${esc(id)}_rl">${rows}</div><button type="button" class="btn btn-secondary btn-sm" style="margin-top:6px" onclick="SchemaForm._ai('${esc(id)}','${schJson}')"><i class="fas fa-plus"></i> Add ${esc(f.itemLabel||'Item')}</button>${hintHtml}</div>`;
            }
            default:
                inner = `<input type="text" class="form-input" id="${esc(id)}" value="${esc(val)}"${f.placeholder?` placeholder="${esc(f.placeholder)}"`:''}>`;
        }
        return `${wrapOpen}${labelHtml}${inner}${hintHtml}</div>`;
    }

    function _rItem(f, item, parentId, idx) {
        const schJson = esc(JSON.stringify(f.itemSchema||[]));
        const fHtml = (f.itemSchema||[]).map(sf => _field(sf, item||{}, parentId+'_'+idx+'_')).join('');
        return `<div class="sf-ri" data-sf-idx="${idx}" style="padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px"><div class="form-row">${fHtml}</div><button type="button" class="btn btn-danger btn-sm" style="margin-top:6px" onclick="SchemaForm._ri('${esc(parentId)}',${idx})"><i class="fas fa-trash"></i> Remove</button></div>`;
    }

    /**
     * Render a schema to an HTML string.
     * @param {Array}  schema  - array of field descriptors
     * @param {Object} values  - current values keyed by field id
     * @param {string} prefix  - id prefix (e.g. 'gs_logic_' → ids like 'gs_logic_diff')
     */
    function render(schema, values, prefix) {
        return (schema||[]).map(function(f) {
            if (f.type === 'row') {
                return '<div class="form-row">'+(f.fields||[]).map(rf => _field(rf, values||{}, prefix||'')).join('')+'</div>';
            }
            return _field(f, values||{}, prefix||'');
        }).join('');
    }

    /**
     * Read current DOM values for a schema back into an object.
     * @param {Array}  schema
     * @param {string} prefix  - must match the prefix used in render()
     * @returns {Object}
     */
    function read(schema, prefix) {
        const pfx = prefix||'', out = {};
        for (const f of (schema||[])) {
            if (f.type === 'row') { Object.assign(out, read(f.fields||[], pfx)); continue; }
            if (f.type === 'group') { out[f.id] = read(f.fields||[], pfx+f.id+'_'); continue; }
            const el = document.getElementById(pfx+f.id);
            if (!el) continue;
            if (f.type==='checkbox'||f.type==='toggle') out[f.id] = el.checked ? 1 : 0;
            else if (f.type==='number'||f.type==='range') out[f.id] = parseFloat(el.value)||0;
            else if (f.type==='repeatable') out[f.id] = _ri_read(f, pfx+f.id);
            else out[f.id] = el.value;
        }
        return out;
    }

    function _ri_read(f, parentId) {
        const list = document.getElementById(parentId+'_rl');
        if (!list) return [];
        return Array.from(list.querySelectorAll('.sf-ri')).map(function(el) {
            return read(f.itemSchema||[], parentId+'_'+el.dataset.sfIdx+'_');
        });
    }

    /**
     * Validate values against a schema.
     * @returns {{ valid: boolean, errors: Object<fieldId, string> }}
     */
    function validate(schema, values) {
        const errs = {};
        for (const f of (schema||[])) {
            if (f.type==='row') { Object.assign(errs, validate(f.fields||[], values).errors); continue; }
            const v = values ? values[f.id] : undefined;
            if (f.required && (v===''||v===null||v===undefined)) errs[f.id] = (f.label||f.id)+' is required';
            if (f.type==='url' && v && !/^https?:\/\//i.test(v)) errs[f.id] = (f.label||f.id)+' must be a valid URL';
            if (typeof f.validate === 'function') { const m = f.validate(v, values); if (m) errs[f.id] = m; }
        }
        return { valid: !Object.keys(errs).length, errors: errs };
    }

    /**
     * Bind conditional show/hide listeners inside a container element.
     * Fields with showIf are hidden/shown whenever their source field changes.
     * @param {HTMLElement} containerEl  - element containing the rendered schema
     * @returns {Function}  evalFn — call manually to re-evaluate conditions
     */
    function bindConditions(containerEl) {
        const root = containerEl || document.body;
        function check() {
            root.querySelectorAll('.sf-field[data-sf-if]').forEach(function(fieldEl) {
                const srcId   = fieldEl.dataset.sfIf;
                const expVal  = fieldEl.dataset.sfIfv;
                const invert  = fieldEl.dataset.sfIfn === '1';
                const srcEl   = document.getElementById(srcId);
                if (!srcEl) return;
                const cur = srcEl.type === 'checkbox' ? String(srcEl.checked) : srcEl.value;
                fieldEl.style.display = (invert ? cur !== expVal : cur === expVal) ? '' : 'none';
            });
        }
        root.addEventListener('change', check);
        root.addEventListener('input',  check);
        check();
        return check;
    }

    // ── Repeatable item helpers (called from inline onclick) ──
    function _ai(parentId, schJson) {
        const list = document.getElementById(parentId+'_rl');
        if (!list) return;
        let sc; try { sc = JSON.parse(schJson); } catch { return; }
        const idx = list.querySelectorAll('.sf-ri').length;
        list.insertAdjacentHTML('beforeend', _rItem({itemSchema:sc}, {}, parentId, idx));
    }
    function _ri(parentId, idx) {
        const el = document.querySelector('#'+CSS.escape(parentId+'_rl')+' .sf-ri[data-sf-idx="'+idx+'"]');
        if (el) el.remove();
    }

    return { render, read, validate, bindConditions, _ai, _ri };
})();
window.SchemaForm = SchemaForm;
