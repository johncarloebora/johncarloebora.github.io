// ============================================================
// Analytics — page views dashboard
// ============================================================

router.register('analytics', loadAnalyticsPage);

async function loadAnalyticsPage() {
    const container = document.getElementById('analyticsEditor');
    renderPageLoading(container);
    try {
        const data = await API.getAnalytics(30);
        renderAnalytics(data, container);
    } catch (err) { renderPageError(container, err); }
}

function renderAnalytics(data, container) {
    const { total, daily, topPaths, days } = data;

    // Build bar chart using flex bars
    const maxViews = daily.length ? Math.max(...daily.map(d => d.views), 1) : 1;
    const chartBars = daily.slice().reverse().map(d => {
        const pct = Math.round((d.views / maxViews) * 100);
        return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;min-width:0" title="${d.day}: ${d.views} views">
            <span style="font-size:0.65rem;color:var(--muted)">${d.views}</span>
            <div style="width:100%;background:var(--surface3);border-radius:3px 3px 0 0;overflow:hidden">
                <div style="height:${Math.max(4, pct)}px;background:var(--grad);border-radius:3px 3px 0 0;transition:height 0.3s"></div>
            </div>
            <span style="font-size:0.6rem;color:var(--muted);transform:rotate(-45deg);transform-origin:top left;white-space:nowrap;width:20px">${d.day?.slice(5) || ''}</span>
        </div>`;
    }).join('');

    container.innerHTML = `
        <div class="help-banner"><i class="fas fa-info-circle"></i><div>
            <strong>Analytics</strong> — Page views tracked when visitors load your portfolio. Data shown for the last ${days} days.
            <br><span style="font-size:0.8rem;color:var(--muted)">Note: page view tracking requires the portfolio to call <code>/api/page-view</code> on load.</span>
        </div></div>

        <div class="stats-grid" style="margin-bottom:20px">
            <div class="stat-card">
                <div class="stat-value">${total.toLocaleString()}</div>
                <div class="stat-label">Total Views (${days}d)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${daily.length ? Math.round(total / daily.length) : 0}</div>
                <div class="stat-label">Avg / Day</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${daily.length ? Math.max(...daily.map(d=>d.views)) : 0}</div>
                <div class="stat-label">Peak Day</div>
            </div>
        </div>

        <div class="admin-card" style="margin-bottom:20px">
            <div class="admin-card-header"><h3><i class="fas fa-chart-bar"></i> Daily Views (last ${days} days)</h3></div>
            ${daily.length ? `
            <div style="display:flex;align-items:flex-end;gap:2px;height:120px;padding:8px 0 24px;overflow:hidden">
                ${chartBars}
            </div>` : '<p style="color:var(--muted);font-size:0.85rem;padding:16px 0">No view data yet.</p>'}
        </div>

        <div class="admin-card">
            <div class="admin-card-header"><h3><i class="fas fa-list"></i> Top Pages</h3></div>
            ${topPaths.length ? `
            <div style="display:flex;flex-direction:column;gap:6px;padding:4px 0">
                ${topPaths.map(p => `
                <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
                    <code style="font-size:0.8rem;flex:1;color:var(--text-secondary)">${esc(p.path)}</code>
                    <span style="font-size:0.82rem;font-weight:600;color:var(--accent2)">${p.views.toLocaleString()}</span>
                </div>`).join('')}
            </div>` : '<p style="color:var(--muted);font-size:0.85rem;padding:8px 0">No data yet.</p>'}
        </div>

        <div style="margin-top:16px">
            <select class="form-input" id="analyticsDays" style="width:auto;font-size:0.82rem" onchange="reloadAnalytics(this.value)">
                <option value="7" ${days===7?'selected':''}>Last 7 days</option>
                <option value="30" ${days===30?'selected':''}>Last 30 days</option>
                <option value="60" ${days===60?'selected':''}>Last 60 days</option>
                <option value="90" ${days===90?'selected':''}>Last 90 days</option>
            </select>
        </div>`;
}

window.reloadAnalytics = async function(days) {
    const container = document.getElementById('analyticsEditor');
    renderPageLoading(container);
    try {
        const data = await API.getAnalytics(parseInt(days));
        renderAnalytics(data, container);
    } catch (err) { renderPageError(container, err); }
};
