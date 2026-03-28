// ============================================================
// Admin Dashboard — Main Controller
// ============================================================

// ── Toast ──
function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    t.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}" style="margin-right:8px"></i>${msg}`;
    t.className = 'toast ' + type + ' show';
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove('show'), 4500);
}

// ── Confirm Dialog ──
// type: 'warning' | 'success' | '' (neutral)
function showConfirm(title, message, type = '') {
    return new Promise((resolve) => {
        const modal   = document.getElementById('confirmModal');
        const iconEl  = document.getElementById('confirmIcon');
        document.getElementById('confirmTitle').textContent   = title;
        document.getElementById('confirmMessage').textContent = message;

        const iconMap = { warning: 'fas fa-exclamation-triangle', success: 'fas fa-check-circle', '': 'fas fa-question-circle' };
        iconEl.innerHTML = `<i class="${iconMap[type] || iconMap['']}"></i>`;
        iconEl.className = 'confirm-icon' + (type ? ' ' + type : '');

        // Style the OK button based on type
        const ok = document.getElementById('confirmOk');
        ok.className = type === 'warning' ? 'btn btn-danger' : 'btn btn-primary';

        modal.classList.add('open');
        // Move focus to the cancel button for safety on destructive actions
        const cancel = document.getElementById('confirmCancel');
        cancel.focus();

        function cleanup() {
            modal.classList.remove('open');
            ok.removeEventListener('click', onOk);
            cancel.removeEventListener('click', onCancel);
            document.removeEventListener('keydown', onKeydown);
        }
        function onOk()     { cleanup(); resolve(true);  }
        function onCancel() { cleanup(); resolve(false); }
        function onKeydown(e) { if (e.key === 'Escape') onCancel(); }

        ok.addEventListener('click', onOk);
        cancel.addEventListener('click', onCancel);
        document.addEventListener('keydown', onKeydown);
    });
}

// ── Edit Modal ──
function showEditModal(title, bodyHtml) {
    return new Promise((resolve) => {
        const modal = document.getElementById('editModal');
        document.getElementById('editModalTitle').textContent = title;
        document.getElementById('editModalBody').innerHTML   = bodyHtml;
        modal.classList.add('open');

        const save   = document.getElementById('editModalSave');
        const cancel = document.getElementById('editModalCancel');
        const close  = document.getElementById('editModalClose');

        // Focus first focusable element inside the modal body
        const firstInput = modal.querySelector('input, select, textarea, button');
        if (firstInput) firstInput.focus();

        function cleanup() {
            modal.classList.remove('open');
            save.removeEventListener('click', onSave);
            cancel.removeEventListener('click', onCancel);
            close.removeEventListener('click', onCancel);
            modal.removeEventListener('click', onBackdrop);
            document.removeEventListener('keydown', onKeydown);
        }
        function onSave()    { cleanup(); resolve(true);  }
        function onCancel()  { cleanup(); resolve(false); }
        function onBackdrop(e) { if (e.target === modal) onCancel(); }
        function onKeydown(e) { if (e.key === 'Escape') onCancel(); }

        save.addEventListener('click', onSave);
        cancel.addEventListener('click', onCancel);
        close.addEventListener('click', onCancel);
        modal.addEventListener('click', onBackdrop);
        document.addEventListener('keydown', onKeydown);
    });
}

// ── Theme Toggle ──
document.getElementById('themeToggle').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
});

// ── Logout ──
document.getElementById('logoutBtn').addEventListener('click', async () => {
    const ok = await showConfirm('Log Out', 'Are you sure you want to log out?');
    if (!ok) return;
    sessionStorage.removeItem('admin_token');
    window.location.href = 'index.html';
});

// ── Publish ──
document.getElementById('publishBtn').addEventListener('click', async () => {
    const confirmed = await showConfirm(
        'Publish to Live Site',
        'This will rebuild your portfolio and push all current content to the public site. Continue?',
        'warning'
    );
    if (!confirmed) return;

    const btn = document.getElementById('publishBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Publishing…';

    try {
        const result = await API.publish();
        showToast('Published successfully! Your site is now live.', 'success');
        const ts = result.publishedAt ? new Date(result.publishedAt).toLocaleString() : new Date().toLocaleString();
        document.getElementById('publishStatus').innerHTML =
            `<span class="status-badge published"><i class="fas fa-check-circle"></i> Published ${ts}</span>`;
    } catch (err) {
        showToast('Publish failed: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-rocket"></i> Publish';
    }
});

// ── Overview Page ──
router.register('overview', async () => {
    const container = document.getElementById('overviewStats');
    try {
        const [sections, media, experiences, projects] = await Promise.all([
            API.getSections(),
            API.getMedia(),
            API.getExperiences(),
            API.getProjects(),
        ]);

        const visibleCount = sections.filter(s => s.visible).length;

        container.innerHTML = `
            <div class="stat-overview-card">
                <div class="stat-icon"><i class="fas fa-layer-group"></i></div>
                <div class="stat-value">${sections.length}</div>
                <div class="stat-name">Sections</div>
            </div>
            <div class="stat-overview-card">
                <div class="stat-icon"><i class="fas fa-eye"></i></div>
                <div class="stat-value">${visibleCount}</div>
                <div class="stat-name">Visible</div>
            </div>
            <div class="stat-overview-card">
                <div class="stat-icon"><i class="fas fa-images"></i></div>
                <div class="stat-value">${media.length}</div>
                <div class="stat-name">Media Files</div>
            </div>
            <div class="stat-overview-card">
                <div class="stat-icon"><i class="fas fa-briefcase"></i></div>
                <div class="stat-value">${experiences.length}</div>
                <div class="stat-name">Experiences</div>
            </div>
            <div class="stat-overview-card">
                <div class="stat-icon"><i class="fas fa-folder-open"></i></div>
                <div class="stat-value">${projects.length}</div>
                <div class="stat-name">Projects</div>
            </div>
        `;

        // Quick actions card already in HTML
    } catch (err) {
        container.innerHTML = `<p style="color:var(--muted);font-size:0.9rem"><i class="fas fa-exclamation-circle" style="margin-right:6px;color:var(--accent1)"></i>Could not load overview: ${err.message}</p>`;
    }
});

// ── System Page ──
router.register('system', async () => {
    const btn = document.getElementById('runMigrateBtn');
    if (btn) {
        btn.addEventListener('click', async () => {
            const resultsDiv = document.getElementById('migrateResults');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Running…';
            try {
                const data = await API.request('/api/admin/migrate', { method: 'POST' });
                let html = '<div style="margin-top:12px;display:flex;flex-direction:column;gap:6px">';
                (data.results || []).forEach(r => {
                    const icon = r.status === 'applied' ? 'check-circle' : 'info-circle';
                    const color = r.status === 'applied' ? 'var(--accent2)' : 'var(--muted)';
                    html += `<div style="font-size:0.82rem;display:flex;gap:8px;align-items:flex-start">
                        <i class="fas fa-${icon}" style="color:${color};margin-top:2px;flex-shrink:0"></i>
                        <span style="color:var(--text-secondary)">${esc(r.sql.substring(0,80))}…<br>
                        <em style="color:${color}">${esc(r.status)}</em>${r.detail ? ' — ' + esc(r.detail) : ''}</span>
                    </div>`;
                });
                html += '</div>';
                resultsDiv.innerHTML = html;
                resultsDiv.style.display = '';
                showToast('Migrations complete!', 'success');
                loadAuditLog(); // Refresh audit log after migration
            } catch (err) {
                showToast('Migration failed: ' + err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-play"></i> Run Migrations';
            }
        });
    }

    // Load audit log
    async function loadAuditLog() {
        const logContainer = document.getElementById('auditLogList');
        if (!logContainer) return;
        try {
            const logs = await API.request('/api/admin/audit-log?limit=40');
            if (!logs || !logs.length) {
                logContainer.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;padding:8px 0">No activity recorded yet. Actions on projects and other content will appear here.</p>';
                return;
            }
            const ACTION_ICON  = { create: 'plus-circle', update: 'pen', delete: 'trash-alt' };
            const ACTION_COLOR = { create: 'var(--accent2)', update: 'var(--text-secondary)', delete: 'var(--accent1)' };
            logContainer.innerHTML = logs.map(entry => {
                const icon  = ACTION_ICON[entry.action]  || 'circle';
                const color = ACTION_COLOR[entry.action] || 'var(--muted)';
                const time  = entry.performed_at ? new Date(entry.performed_at).toLocaleString() : '';
                return `<div style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--border)">
                    <i class="fas fa-${icon}" style="color:${color};font-size:0.8rem;margin-top:3px;width:14px;flex-shrink:0"></i>
                    <div style="flex:1;min-width:0">
                        <span style="color:var(--text-primary);font-size:0.83rem">
                            <strong style="text-transform:capitalize">${esc(entry.action)}</strong>
                            <span style="color:var(--muted)"> ${esc(entry.resource)}</span>
                            ${entry.summary ? ' — ' + esc(entry.summary) : ''}
                        </span>
                        ${time ? `<div style="font-size:0.71rem;color:var(--muted);margin-top:1px">${time}</div>` : ''}
                    </div>
                </div>`;
            }).join('');
        } catch (e) {
            const logContainer = document.getElementById('auditLogList');
            if (logContainer) logContainer.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;padding:8px 0">Could not load activity log.</p>';
        }
    }
    loadAuditLog();
});

// ── Initialize ──
router.init();
