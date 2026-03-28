// ============================================================
// Version History — view and restore published snapshots
// ============================================================

router.register('versions', loadVersionsPage);

async function loadVersionsPage() {
    const container = document.getElementById('versionsEditor');
    renderPageLoading(container);
    try {
        const versions = await API.getVersions();
        renderVersionsList(versions, container);
    } catch (err) { renderPageError(container, err); }
}

function renderVersionsList(versions, container) {
    let html = `
        <div class="help-banner"><i class="fas fa-info-circle"></i><div>
            <strong>Version History</strong> — Every time you hit Publish, a snapshot of your live site is saved here (last 10 versions).
            You can restore any previous version — this immediately replaces your live site config.
        </div></div>
        <div class="admin-card">
            <div class="admin-card-header"><h3><i class="fas fa-history"></i> Published Snapshots</h3></div>`;

    if (!versions.length) {
        html += '<p style="color:var(--muted);font-size:0.85rem;padding:8px 0">No versions yet. Hit <strong>Publish</strong> to create the first snapshot.</p>';
    } else {
        html += '<div style="display:flex;flex-direction:column;gap:8px;padding:4px 0">';
        for (let i = 0; i < versions.length; i++) {
            const v = versions[i];
            const isCurrent = i === 0;
            const date = v.published_at ? new Date(v.published_at).toLocaleString() : '—';
            html += `
                <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid ${isCurrent ? 'var(--accent2)' : 'var(--border)'}">
                    <i class="fas fa-${isCurrent ? 'check-circle' : 'history'}" style="color:${isCurrent ? 'var(--accent2)' : 'var(--muted)'}"></i>
                    <div style="flex:1">
                        <div style="font-size:0.88rem;font-weight:600">${isCurrent ? '★ Current' : `Version ${versions.length - i}`}</div>
                        <div style="font-size:0.78rem;color:var(--muted)">${date}</div>
                    </div>
                    ${!isCurrent ? `<button class="btn btn-secondary btn-sm" onclick="restoreVersion(${v.id}, '${esc(date)}')"><i class="fas fa-undo"></i> Restore</button>` : '<span style="font-size:0.75rem;color:var(--accent2);font-weight:500">Live Now</span>'}
                </div>`;
        }
        html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
}

window.restoreVersion = async function(id, label) {
    const ok = await showConfirm(
        'Restore Version',
        `This will replace your live site with the snapshot from "${label}". Your current live site will be overwritten. Continue?`,
        'warning'
    );
    if (!ok) return;
    try {
        await API.restoreVersion(id);
        showToast('Version restored! Your live site is now using the selected snapshot.', 'success');
        loadVersionsPage();
    } catch (err) { showToast(err.message, 'error'); }
};
