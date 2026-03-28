// ============================================================
// Game Settings — enable/disable games, set default difficulty
// ============================================================

router.register('game-settings', loadGameSettingsPage);

const GAME_DEFS = [
    { id: 'reaction', label: 'Reaction Time',  icon: 'fas fa-bolt',       desc: 'Click when the screen changes color.' },
    { id: 'typing',   label: 'Typing Speed',   icon: 'fas fa-keyboard',   desc: 'Type the given text as fast as possible.' },
    { id: 'click',    label: 'Click Speed',    icon: 'fas fa-mouse-pointer', desc: 'Click as many times as possible in 10 s.' },
    { id: 'memory',   label: 'Memory Cards',   icon: 'fas fa-th-large',   desc: 'Match emoji pairs before the timer runs out.' },
    { id: 'aim',      label: 'Aim Trainer',    icon: 'fas fa-crosshairs', desc: 'Hit targets as quickly as possible.' },
    { id: 'logic',    label: 'Logic Puzzle',   icon: 'fas fa-brain',      desc: 'Number sequence and pattern challenges.' },
    { id: 'quiz',     label: 'Tech Quiz',      icon: 'fas fa-question-circle', desc: 'Multiple-choice tech trivia questions.' },
];
const DIFFICULTIES = ['easy', 'normal', 'hard'];

async function loadGameSettingsPage() {
    const container = document.getElementById('gameSettingsEditor');
    renderPageLoading(container);
    try {
        const settings = await API.getGameSettings();
        const map = {};
        for (const s of settings) map[s.game_id] = s;

        let html = `
            <div class="help-banner"><i class="fas fa-info-circle"></i><div>
                <strong>Game Settings</strong> — Control which mini-games are available in your portfolio's Fun Zone section, and set the default difficulty.
                Changes apply after Publish.
            </div></div>
            <div class="admin-card">
                <div class="admin-card-header"><h3><i class="fas fa-gamepad"></i> Mini-Game Controls</h3></div>`;

        for (const g of GAME_DEFS) {
            const s = map[g.id] || { enabled: 1, default_difficulty: 'normal' };
            html += `
                <div class="section-list-item" style="align-items:center">
                    <div style="width:38px;height:38px;background:var(--surface2);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-size:1rem;color:var(--accent2);flex-shrink:0">
                        <i class="${g.icon}"></i>
                    </div>
                    <div class="section-info" style="flex:1">
                        <strong>${g.label}</strong>
                        <div class="section-id">${g.desc}</div>
                    </div>
                    <select class="form-input" id="gsDiff_${g.id}" style="width:110px;font-size:0.82rem;padding:6px 10px">
                        ${DIFFICULTIES.map(d => `<option value="${d}" ${(s.default_difficulty || 'normal') === d ? 'selected' : ''}>${d.charAt(0).toUpperCase()+d.slice(1)}</option>`).join('')}
                    </select>
                    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;white-space:nowrap;font-size:0.82rem;color:var(--text-secondary)">
                        <input type="checkbox" id="gsEn_${g.id}" ${s.enabled !== 0 ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--accent2)">
                        Enabled
                    </label>
                </div>`;
        }

        html += `
                <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border)">
                    <button class="btn btn-primary" id="saveGameSettings"><i class="fas fa-save"></i> Save Game Settings</button>
                </div>
            </div>`;

        container.innerHTML = html;

        document.getElementById('saveGameSettings').addEventListener('click', function() {
            withButtonLock(this, async () => {
                const batch = GAME_DEFS.map(g => API.updateGameSetting(g.id, {
                    enabled: document.getElementById(`gsEn_${g.id}`)?.checked ? 1 : 0,
                    default_difficulty: document.getElementById(`gsDiff_${g.id}`)?.value || 'normal',
                }));
                await Promise.all(batch);
                showToast('Game settings saved! Hit Publish to apply.', 'success');
            }, 'Saving…').catch(err => showToast(err.message, 'error'));
        });

    } catch (err) { renderPageError(container, err); }
}
