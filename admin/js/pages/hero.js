// ============================================================
// Hero Section Editor — with live preview hints & char counters
// ============================================================

router.register('hero', async () => {
    const container = document.getElementById('heroEditor');
    container.innerHTML = '<p style="color:var(--muted)">Loading...</p>';

    try {
        const settings = await API.getSettings();
        container.innerHTML = `
            <div class="help-banner">
                <i class="fas fa-info-circle"></i>
                <div>
                    <strong>Hero Section</strong> — This is the very first thing visitors see.
                    Your name, a short tagline, and your call-to-action buttons live here.
                    Click <strong>Save Hero</strong> then <strong>Publish</strong> (top-right) to push changes live.
                </div>
            </div>

            <div class="admin-card">
                <div class="admin-card-header">
                    <h3><i class="fas fa-user-circle"></i> Identity</h3>
                </div>

                <div class="form-group">
                    <label>Eyebrow Text
                        <span style="font-size:0.72rem;color:var(--muted);font-weight:400;margin-left:6px">— small line above your name (e.g. "Hello, I'm")</span>
                    </label>
                    <input type="text" class="form-input" id="heroEyebrow"
                           value="${esc(settings.heroEyebrow || '')}"
                           placeholder="Hello, I'm"
                           maxlength="40"
                           oninput="updateCounter('eyebrowCounter', this.value, 40)">
                    <span class="char-counter" id="eyebrowCounter">${(settings.heroEyebrow || '').length}/40</span>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Your Name
                            <span style="font-size:0.72rem;color:var(--muted);font-weight:400;margin-left:6px">— displayed large on the hero</span>
                        </label>
                        <input type="text" class="form-input" id="heroName"
                               value="${esc(settings.heroName || '')}"
                               placeholder="Carlo"
                               maxlength="60"
                               oninput="updateCounter('nameCounter', this.value, 60)">
                        <span class="char-counter" id="nameCounter">${(settings.heroName || '').length}/60</span>
                    </div>
                    <div class="form-group">
                        <label>Glitch Text
                            <span style="font-size:0.72rem;color:var(--muted);font-weight:400;margin-left:6px">— text used in the glitch effect (usually same as name)</span>
                        </label>
                        <input type="text" class="form-input" id="heroGlitchText"
                               value="${esc(settings.heroGlitchText || '')}"
                               placeholder="Carlo"
                               maxlength="60">
                        <div class="field-hint"><i class="fas fa-info-circle"></i>Set this to the same value as Your Name for the glitch animation to work correctly.</div>
                    </div>
                </div>

                <div class="form-group">
                    <label>Short Description
                        <span style="font-size:0.72rem;color:var(--muted);font-weight:400;margin-left:6px">— one-liner below the typewriter</span>
                    </label>
                    <input type="text" class="form-input" id="heroDesc"
                           value="${esc(settings.heroDesc || '')}"
                           placeholder="Multidisciplinary Creative — Design, Data & Automation"
                           maxlength="120"
                           oninput="updateCounter('descCounter', this.value, 120)">
                    <span class="char-counter" id="descCounter">${(settings.heroDesc || '').length}/120</span>
                    <div class="field-hint"><i class="fas fa-info-circle"></i>Keep this under 100 characters for the best look on all screen sizes.</div>
                </div>
            </div>

            <div class="admin-card">
                <div class="admin-card-header">
                    <h3><i class="fas fa-keyboard"></i> Typewriter Phrases</h3>
                    <button class="btn btn-secondary btn-sm" onclick="addTypewriterPhrase()"><i class="fas fa-plus"></i> Add Phrase</button>
                </div>
                <div class="card-description">
                    These phrases loop one by one in a typing animation under your name. Add your job titles, skills, or fun labels.
                </div>
                <div id="typewriterList" style="display:flex;flex-direction:column;gap:8px">
                    ${(settings.typewriterPhrases || []).map((p, i) => `
                        <div class="bullet-item" id="tw_${i}">
                            <input type="text" class="form-input tw-phrase-input" value="${esc(p)}" placeholder="e.g. Computer Engineer" maxlength="60">
                            <button class="btn btn-danger btn-icon btn-sm" onclick="removeTypewriterPhrase(this)" title="Remove"><i class="fas fa-times"></i></button>
                        </div>
                    `).join('')}
                </div>
                ${!(settings.typewriterPhrases || []).length ? `<p style="color:var(--muted);font-size:0.85rem">No phrases yet — click <strong>Add Phrase</strong> above.</p>` : ''}
            </div>

            <div class="admin-card">
                <div class="admin-card-header">
                    <h3><i class="fas fa-mouse-pointer"></i> Call-to-Action Buttons</h3>
                </div>
                <div class="card-description">
                    Two buttons appear in the hero. Primary is the main action (e.g. "View My Work"), secondary is optional (e.g. "About Me").
                    Links can be section anchors like <code>#projects</code> or full URLs.
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Primary Button Text</label>
                        <input type="text" class="form-input" id="heroCtaPrimary"
                               value="${esc(settings.ctaPrimaryText || '')}"
                               placeholder="View My Work" maxlength="30">
                    </div>
                    <div class="form-group">
                        <label>Primary Button Link</label>
                        <input type="text" class="form-input" id="heroCtaLink"
                               value="${esc(settings.ctaPrimaryLink || '')}"
                               placeholder="#projects">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Secondary Button Text</label>
                        <input type="text" class="form-input" id="heroCtaSecondary"
                               value="${esc(settings.ctaSecondaryText || '')}"
                               placeholder="About Me" maxlength="30">
                    </div>
                    <div class="form-group">
                        <label>Secondary Button Link</label>
                        <input type="text" class="form-input" id="heroCtaSecLink"
                               value="${esc(settings.ctaSecondaryLink || '')}"
                               placeholder="#about">
                    </div>
                </div>
            </div>

            <button class="btn btn-primary" id="saveHero"><i class="fas fa-save"></i> Save Hero</button>
        `;

        document.getElementById('saveHero').addEventListener('click', async () => {
            const phrases = Array.from(document.querySelectorAll('.tw-phrase-input'))
                .map(i => i.value.trim()).filter(Boolean);
            const btn = document.getElementById('saveHero');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Saving…';
            try {
                await API.updateSettings({
                    heroEyebrow:       document.getElementById('heroEyebrow').value,
                    heroName:          document.getElementById('heroName').value,
                    heroGlitchText:    document.getElementById('heroGlitchText').value,
                    heroDesc:          document.getElementById('heroDesc').value,
                    typewriterPhrases: JSON.stringify(phrases),
                    ctaPrimaryText:    document.getElementById('heroCtaPrimary').value,
                    ctaPrimaryLink:    document.getElementById('heroCtaLink').value,
                    ctaSecondaryText:  document.getElementById('heroCtaSecondary').value,
                    ctaSecondaryLink:  document.getElementById('heroCtaSecLink').value,
                });
                showToast('Hero settings saved! Hit Publish to go live.', 'success');
            } catch (err) {
                showToast('Save failed: ' + err.message, 'error');
            }
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Save Hero';
        });
    } catch (err) {
        container.innerHTML = `<p style="color:var(--accent1)">Error: ${err.message}</p>`;
    }
});

window.updateCounter = function(id, value, max) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value.length + '/' + max;
    el.classList.toggle('near-limit', value.length >= max * 0.85 && value.length < max);
    el.classList.toggle('over-limit', value.length >= max);
};

window.addTypewriterPhrase = function() {
    const list = document.getElementById('typewriterList');
    const idx = list.children.length;
    const div = document.createElement('div');
    div.className = 'bullet-item';
    div.id = 'tw_' + idx;
    div.innerHTML = `<input type="text" class="form-input tw-phrase-input" placeholder="e.g. Web Developer" maxlength="60">
        <button class="btn btn-danger btn-icon btn-sm" onclick="removeTypewriterPhrase(this)" title="Remove"><i class="fas fa-times"></i></button>`;
    list.appendChild(div);
    div.querySelector('input').focus();
};

window.removeTypewriterPhrase = function(btn) {
    btn.closest('.bullet-item').remove();
};

function esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
