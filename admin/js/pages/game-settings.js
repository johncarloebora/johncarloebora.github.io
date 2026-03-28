// ============================================================
// Game Settings — enable/disable games, set default difficulty
// ============================================================

router.register('game-settings', loadGameSettingsPage);

const GAME_DEFS = [
    { id: 'reaction', label: 'Reaction Time',  icon: 'fas fa-bolt',           desc: 'Click when the screen changes color.' },
    { id: 'typing',   label: 'Typing Speed',   icon: 'fas fa-keyboard',       desc: 'Type the given text as fast as possible.' },
    { id: 'click',    label: 'Click Speed',    icon: 'fas fa-mouse-pointer',  desc: 'Click as many times as possible in 10 s.' },
    { id: 'memory',   label: 'Memory Cards',   icon: 'fas fa-th-large',       desc: 'Match emoji pairs before the timer runs out.' },
    { id: 'aim',      label: 'Aim Trainer',    icon: 'fas fa-crosshairs',     desc: 'Hit targets as quickly as possible.' },
    { id: 'logic',    label: 'Logic Puzzle',   icon: 'fas fa-brain',          desc: 'Number sequence and pattern challenges.' },
    { id: 'quiz',     label: 'Tech Quiz',      icon: 'fas fa-question-circle', desc: 'Multiple-choice tech trivia questions.' },
];
const DIFFICULTIES = ['easy', 'normal', 'hard'];

// Schema definition for each game's settings row.
// Used by SchemaForm.render() / SchemaForm.read() to generate and collect
// the per-game difficulty select + enabled checkbox without hand-coding HTML.
const GAME_SCHEMA = [
    {
        id: 'diff', type: 'select', compact: true,
        options: DIFFICULTIES.map(d => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) })),
        default: 'normal',
    },
    {
        id: 'en', type: 'checkbox', compact: true,
        checkLabel: 'Enabled', default: 1,
    },
];

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
            // SchemaForm generates the difficulty select + enabled checkbox using the
            // shared GAME_SCHEMA definition. Prefix 'gs_<id>_' keeps IDs unique per game.
            const sfHtml = SchemaForm.render(
                GAME_SCHEMA,
                { diff: s.default_difficulty || 'normal', en: s.enabled !== 0 ? 1 : 0 },
                'gs_' + g.id + '_'
            );
            html += `
                <div class="section-list-item" style="align-items:center">
                    <div style="width:38px;height:38px;background:var(--surface2);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-size:1rem;color:var(--accent2);flex-shrink:0">
                        <i class="${g.icon}"></i>
                    </div>
                    <div class="section-info" style="flex:1">
                        <strong>${g.label}</strong>
                        <div class="section-id">${g.desc}</div>
                    </div>
                    ${sfHtml}
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
                // SchemaForm.read() collects difficulty + enabled for each game by prefix.
                const batch = GAME_DEFS.map(function(g) {
                    const vals = SchemaForm.read(GAME_SCHEMA, 'gs_' + g.id + '_');
                    return API.updateGameSetting(g.id, {
                        enabled:            vals.en  !== undefined ? vals.en  : 1,
                        default_difficulty: vals.diff || 'normal',
                    });
                });
                await Promise.all(batch);
                showToast('Game settings saved! Hit Publish to apply.', 'success');
            }, 'Saving…').catch(err => showToast(err.message, 'error'));
        });

    } catch (err) { renderPageError(container, err); }
}
