// ============================================================
// Contact Settings Editor
// ============================================================

router.register('contact', async () => {
    const container = document.getElementById('contactEditor');
    container.innerHTML = '<p style="color:var(--muted)">Loading...</p>';

    try {
        const settings = await API.getSettings();
        container.innerHTML = `
            <div class="admin-card">
                <div class="admin-card-header"><h3>EmailJS Configuration</h3></div>
                <div class="form-row-3">
                    <div class="form-group">
                        <label>Service ID</label>
                        <input type="text" class="form-input" id="contactServiceId" value="${esc(settings.emailjsServiceId || '')}">
                    </div>
                    <div class="form-group">
                        <label>Template ID</label>
                        <input type="text" class="form-input" id="contactTemplateId" value="${esc(settings.emailjsTemplateId || '')}">
                    </div>
                    <div class="form-group">
                        <label>Public Key</label>
                        <input type="text" class="form-input" id="contactPublicKey" value="${esc(settings.emailjsPublicKey || '')}">
                    </div>
                </div>
            </div>
            <div class="admin-card">
                <div class="admin-card-header"><h3>reCAPTCHA</h3></div>
                <div class="form-group">
                    <label>Site Key</label>
                    <input type="text" class="form-input" id="contactRecaptcha" value="${esc(settings.recaptchaSiteKey || '')}">
                </div>
            </div>
            <button class="btn btn-primary" id="saveContact"><i class="fas fa-save"></i> Save Contact Settings</button>
        `;

        document.getElementById('saveContact').addEventListener('click', async () => {
            try {
                await API.updateSettings({
                    emailjsServiceId: document.getElementById('contactServiceId').value,
                    emailjsTemplateId: document.getElementById('contactTemplateId').value,
                    emailjsPublicKey: document.getElementById('contactPublicKey').value,
                    recaptchaSiteKey: document.getElementById('contactRecaptcha').value,
                });
                showToast('Contact settings saved!', 'success');
            } catch (err) { showToast(err.message, 'error'); }
        });
    } catch (err) {
        container.innerHTML = `<p style="color:var(--accent1)">Error: ${err.message}</p>`;
    }
});
