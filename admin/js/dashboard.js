// ============================================================
// Admin Dashboard — Main Controller
// ============================================================

// ── Toast ──
function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast ' + type + ' show';
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove('show'), 4000);
}

// ── Confirm Dialog ──
function showConfirm(title, message, iconClass = 'fas fa-question-circle warning') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmIcon').innerHTML = `<i class="${iconClass}"></i>`;
        modal.classList.add('open');

        const ok = document.getElementById('confirmOk');
        const cancel = document.getElementById('confirmCancel');

        function cleanup() {
            modal.classList.remove('open');
            ok.removeEventListener('click', onOk);
            cancel.removeEventListener('click', onCancel);
        }
        function onOk() { cleanup(); resolve(true); }
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
        document.getElementById('editModalBody').innerHTML = bodyHtml;
        modal.classList.add('open');

        const save = document.getElementById('editModalSave');
        const cancel = document.getElementById('editModalCancel');
        const close = document.getElementById('editModalClose');

        function cleanup() {
            modal.classList.remove('open');
            save.removeEventListener('click', onSave);
            cancel.removeEventListener('click', onCancel);
            close.removeEventListener('click', onCancel);
        }
        function onSave() { cleanup(); resolve(true); }
        function onCancel() { cleanup(); resolve(false); }

        save.addEventListener('click', onSave);
        cancel.addEventListener('click', onCancel);
        close.addEventListener('click', onCancel);
    });
}

// ── Theme Toggle ──
document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
});

// ── Logout ──
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('admin_token');
    window.location.href = 'index.html';
});

// ── Publish ──
document.getElementById('publishBtn').addEventListener('click', async () => {
    const confirmed = await showConfirm(
        'Publish Changes',
        'This will update your live portfolio. Continue?',
        'fas fa-rocket warning'
    );
    if (!confirmed) return;

    const btn = document.getElementById('publishBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Publishing...';

    try {
        const result = await API.publish();
        showToast('Published successfully!', 'success');
        document.getElementById('publishStatus').textContent = `Last published: ${new Date(result.publishedAt).toLocaleString()}`;
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
        const [sections, media] = await Promise.all([
            API.getSections(),
            API.getMedia(),
        ]);
        container.innerHTML = `
            <div class="stat-overview-card">
                <div class="stat-value">${sections.length}</div>
                <div class="stat-name">Sections</div>
            </div>
            <div class="stat-overview-card">
                <div class="stat-value">${media.length}</div>
                <div class="stat-name">Media Files</div>
            </div>
            <div class="stat-overview-card">
                <div class="stat-value">${sections.filter(s => s.visible).length}</div>
                <div class="stat-name">Visible Sections</div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<p style="color:var(--muted)">Could not load overview. ${err.message}</p>`;
    }
});

// ── Initialize ──
router.init();
