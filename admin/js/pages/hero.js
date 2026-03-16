// ============================================================
// Hero Section Editor
// ============================================================

router.register('hero', async () => {
    const container = document.getElementById('heroEditor');
    container.innerHTML = '<p style="color:var(--muted)">Loading...</p>';

    try {
        const settings = await API.getSettings();
        container.innerHTML = `
            <div class="admin-card">
                <div class="admin-card-header"><h3>Hero Content</h3></div>
                <div class="form-group">
                    <label>Eyebrow Text</label>
                    <input type="text" class="form-input" id="heroEyebrow" value="${esc(settings.heroEyebrow || '')}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Hero Name</label>
                        <input type="text" class="form-input" id="heroName" value="${esc(settings.heroName || '')}">
                    </div>
                    <div class="form-group">
                        <label>Glitch Text</label>
                        <input type="text" class="form-input" id="heroGlitchText" value="${esc(settings.heroGlitchText || '')}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <input type="text" class="form-input" id="heroDesc" value="${esc(settings.heroDesc || '')}">
                </div>
                <div class="form-group">
                    <label>Typewriter Phrases (one per line)</label>
                    <textarea class="form-input" id="heroTypewriter" rows="5">${(settings.typewriterPhrases || []).join('\n')}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Primary CTA Text</label>
                        <input type="text" class="form-input" id="heroCtaPrimary" value="${esc(settings.ctaPrimaryText || '')}">
                    </div>
                    <div class="form-group">
                        <label>Primary CTA Link</label>
                        <input type="text" class="form-input" id="heroCtaLink" value="${esc(settings.ctaPrimaryLink || '')}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Secondary CTA Text</label>
                        <input type="text" class="form-input" id="heroCtaSecondary" value="${esc(settings.ctaSecondaryText || '')}">
                    </div>
                    <div class="form-group">
                        <label>Secondary CTA Link</label>
                        <input type="text" class="form-input" id="heroCtaSecLink" value="${esc(settings.ctaSecondaryLink || '')}">
                    </div>
                </div>
                <button class="btn btn-primary" id="saveHero"><i class="fas fa-save"></i> Save Hero</button>
            </div>
        `;

        document.getElementById('saveHero').addEventListener('click', async () => {
            const phrases = document.getElementById('heroTypewriter').value.split('\n').map(s => s.trim()).filter(Boolean);
            try {
                await API.updateSettings({
                    heroEyebrow: document.getElementById('heroEyebrow').value,
                    heroName: document.getElementById('heroName').value,
                    heroGlitchText: document.getElementById('heroGlitchText').value,
                    heroDesc: document.getElementById('heroDesc').value,
                    typewriterPhrases: JSON.stringify(phrases),
                    ctaPrimaryText: document.getElementById('heroCtaPrimary').value,
                    ctaPrimaryLink: document.getElementById('heroCtaLink').value,
                    ctaSecondaryText: document.getElementById('heroCtaSecondary').value,
                    ctaSecondaryLink: document.getElementById('heroCtaSecLink').value,
                });
                showToast('Hero settings saved!', 'success');
            } catch (err) {
                showToast('Save failed: ' + err.message, 'error');
            }
        });
    } catch (err) {
        container.innerHTML = `<p style="color:var(--accent1)">Error: ${err.message}</p>`;
    }
});

function esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
