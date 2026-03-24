// ============================================================
// Contact Settings Editor — with help text and field guidance
// ============================================================

router.register('contact', async () => {
    const container = document.getElementById('contactEditor');
    renderPageLoading(container);

    try {
        const settings = await API.getSettings();
        container.innerHTML = `
            <div class="help-banner">
                <i class="fas fa-info-circle"></i>
                <div>
                    <strong>Contact Form Settings</strong> — Your portfolio contact form uses
                    <a href="https://www.emailjs.com" target="_blank">EmailJS</a> (free service) to send messages directly to your email.
                    You need an EmailJS account to set up the Service ID, Template ID, and Public Key.
                    reCAPTCHA prevents spam — get a site key from <a href="https://www.google.com/recaptcha" target="_blank">Google reCAPTCHA</a>.
                </div>
            </div>

            <div class="admin-card">
                <div class="admin-card-header">
                    <h3><i class="fas fa-paper-plane"></i> EmailJS Configuration</h3>
                </div>
                <div class="card-description">
                    Log in to <strong>emailjs.com</strong> → Dashboard → Email Services to find your Service ID.
                    Go to Email Templates to find your Template ID and Public Key (under Account → API Keys).
                </div>
                <div class="form-row-3">
                    <div class="form-group">
                        <label>Service ID</label>
                        <input type="text" class="form-input" id="contactServiceId"
                               value="${esc(settings.emailjsServiceId || '')}"
                               placeholder="service_xxxxxxx">
                        <div class="field-hint"><i class="fas fa-info-circle"></i>Found in EmailJS → Email Services.</div>
                    </div>
                    <div class="form-group">
                        <label>Template ID</label>
                        <input type="text" class="form-input" id="contactTemplateId"
                               value="${esc(settings.emailjsTemplateId || '')}"
                               placeholder="template_xxxxxxx">
                        <div class="field-hint"><i class="fas fa-info-circle"></i>Found in EmailJS → Email Templates.</div>
                    </div>
                    <div class="form-group">
                        <label>Public Key</label>
                        <input type="text" class="form-input" id="contactPublicKey"
                               value="${esc(settings.emailjsPublicKey || '')}"
                               placeholder="xxxxxxxxxxxxxxxx">
                        <div class="field-hint"><i class="fas fa-info-circle"></i>Found in EmailJS → Account → API Keys.</div>
                    </div>
                </div>
            </div>

            <div class="admin-card">
                <div class="admin-card-header">
                    <h3><i class="fas fa-shield-alt"></i> reCAPTCHA v3</h3>
                </div>
                <div class="card-description">
                    reCAPTCHA runs invisibly in the background and blocks spam bots.
                    Register your site at <a href="https://www.google.com/recaptcha/admin" target="_blank">google.com/recaptcha/admin</a>
                    and copy the <strong>Site Key</strong> (not the Secret Key — keep that private).
                </div>
                <div class="form-group">
                    <label>reCAPTCHA v3 Site Key</label>
                    <input type="text" class="form-input" id="contactRecaptcha"
                           value="${esc(settings.recaptchaSiteKey || '')}"
                           placeholder="6Lc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx">
                    <div class="field-hint warning"><i class="fas fa-exclamation-triangle"></i>Only paste the Site Key here — never the Secret Key.</div>
                </div>
            </div>

            <button class="btn btn-primary" id="saveContact"><i class="fas fa-save"></i> Save Contact Settings</button>
        `;

        document.getElementById('saveContact').addEventListener('click', function() {
            withButtonLock(this, async () => {
                await API.updateSettings({
                    emailjsServiceId:  document.getElementById('contactServiceId').value,
                    emailjsTemplateId: document.getElementById('contactTemplateId').value,
                    emailjsPublicKey:  document.getElementById('contactPublicKey').value,
                    recaptchaSiteKey:  document.getElementById('contactRecaptcha').value,
                });
                showToast('Contact settings saved! Hit Publish to apply.', 'success');
            }, 'Saving…').catch(err => showToast(err.message, 'error'));
        });
    } catch (err) {
        renderPageError(container, err);
    }
});
