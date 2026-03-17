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

        const cancel = document.getElementById('confirmCancel');

        function cleanup() {
            modal.classList.remove('open');
            ok.removeEventListener('click', onOk);
            cancel.removeEventListener('click', onCancel);
        }
        function onOk()     { cleanup(); resolve(true);  }
        function onCancel() { cleanup(); resolve(false); }

        ok.addEventListener('click', onOk);
        cancel.addEventListener('click', onCancel);
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

        function cleanup() {
            modal.classList.remove('open');
            save.removeEventListener('click', onSave);
            cancel.removeEventListener('click', onCancel);
            close.removeEventListener('click', onCancel);
            modal.removeEventListener('click', onBackdrop);
        }
        function onSave()    { cleanup(); resolve(true);  }
        function onCancel()  { cleanup(); resolve(false); }
        function onBackdrop(e) { if (e.target === modal) onCancel(); }

        save.addEventListener('click', onSave);
        cancel.addEventListener('click', onCancel);
        close.addEventListener('click', onCancel);
        modal.addEventListener('click', onBackdrop);
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

// ── Sidebar toggle (mobile) ──
const sidebarToggle  = document.getElementById('sidebarToggle');
const sidebar        = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

sidebarToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('open');
});
sidebarOverlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
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

// ── Initialize ──
router.init();
