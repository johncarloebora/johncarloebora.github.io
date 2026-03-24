// ============================================================
// Admin Configuration — single source of truth for runtime constants.
// Loaded before api.js and auth.js on every admin page.
// Override ADMIN_API_BASE at the window level before loading this file
// if you need to point at a local dev worker.
// ============================================================

/* global window */
window.ADMIN_CONFIG = {
    API_BASE: window.ADMIN_API_BASE || 'https://carlo-portfolio-api.johncarloebora.workers.dev',
};
