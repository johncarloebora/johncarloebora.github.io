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
