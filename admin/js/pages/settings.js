// ============================================================
// Settings — Global config, profile shape (6 options), nav logo
// ============================================================

const SHAPES = [
    { id: 'hexagon', label: 'Hexagon', clip: 'polygon(50% 0%,95% 25%,95% 75%,50% 100%,5% 75%,5% 25%)' },
    { id: 'circle',  label: 'Circle',  clip: 'circle(50%)' },
    { id: 'square',  label: 'Square',  clip: 'none',  radius: '0' },
    { id: 'rounded', label: 'Rounded', clip: 'none',  radius: '20px' },
    { id: 'diamond', label: 'Diamond', clip: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)' },
    { id: 'shield',  label: 'Shield',  clip: 'polygon(50% 0%,100% 20%,100% 80%,50% 100%,0% 80%,0% 20%)' },
];

router.register('settings', async () => {
    const container = document.getElementById('settingsEditor');
    renderPageLoading(container);

    try {
        const settings = await API.getSettings();
        const currentShape = settings.profileShape || 'hexagon';

        container.innerHTML = `
            <div class="help-banner">
                <i class="fas fa-info-circle"></i>
                <div>
                    <strong>Site Settings</strong> — Control the navigation logo, footer text, and the shape of your profile picture.
                    After saving, click <strong>Publish</strong> to push changes live.
                </div>
            </div>

            <div class="admin-card">
                <div class="admin-card-header">
                    <h3><i class="fas fa-sliders-h"></i> General</h3>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Navigation Logo Text</label>
                        <input type="text" class="form-input" id="settNavLogo" value="${esc(settings.navLogo || 'CE')}" maxlength="8" placeholder="CE">
                        <div class="field-hint"><i class="fas fa-info-circle"></i>Short initials or abbreviation (max 8 characters) shown in the top-left of the nav bar.</div>
                    </div>
                    <div class="form-group">
                        <label>Footer Text</label>
                        <input type="text" class="form-input" id="settFooter" value="${esc(settings.footerText || '')}" maxlength="120" placeholder="© 2025 Your Name. All rights reserved.">
                        <div class="field-hint"><i class="fas fa-info-circle"></i>Appears at the very bottom of the page.</div>
                    </div>
                </div>
            </div>

            <div class="admin-card">
                <div class="admin-card-header">
                    <h3><i class="fas fa-user-circle"></i> Profile Picture Shape</h3>
                </div>
                <div class="card-description">
                    Choose how your profile photo is cropped on the hero section. Click a shape to preview it.
                </div>
                <div class="shape-options" id="shapeOptions">
                    ${SHAPES.map(s => `
                        <div class="shape-option ${currentShape === s.id ? 'active' : ''}" data-shape="${s.id}" onclick="selectShape('${s.id}')">
                            <div class="shape-preview" style="clip-path:${s.clip};${s.radius ? 'border-radius:'+s.radius+';clip-path:none;' : ''}background:var(--grad)"></div>
                            <div style="font-size:0.7rem;margin-top:6px;color:var(--muted);text-align:center">${s.label}</div>
                        </div>`).join('')}
                </div>
                <input type="hidden" id="settProfileShape" value="${esc(currentShape)}">
            </div>

            <div class="admin-card">
                <div class="admin-card-header">
                    <h3><i class="fas fa-image"></i> Profile Picture</h3>
                </div>
                <div class="card-description">
                    Upload a new profile photo here. It will be stored in your R2 Media Library under the <strong>profile</strong> folder
                    and used as the hero avatar. Use a square image for best results (recommended: at least 400×400 px).
                </div>
                <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
                    <div id="profilePreviewBox" style="width:110px;height:110px;border-radius:var(--radius);overflow:hidden;background:var(--surface2);flex-shrink:0;border:1px solid var(--border);display:flex;align-items:center;justify-content:center">
                        <img id="profilePreview" style="width:100%;height:100%;object-fit:cover;display:none" onerror="this.style.display='none';document.getElementById('profilePreviewPlaceholder').style.display='flex'">
                        <div id="profilePreviewPlaceholder" style="display:flex;flex-direction:column;align-items:center;gap:4px;color:var(--muted)">
                            <i class="fas fa-user" style="font-size:2rem"></i>
                            <span style="font-size:0.7rem">No photo</span>
                        </div>
                    </div>
                    <div>
                        <input type="file" id="profileFile" accept="image/*" style="display:none">
                        <button class="btn btn-secondary" onclick="document.getElementById('profileFile').click()">
                            <i class="fas fa-folder-open"></i> Choose Photo
                        </button>
                        <button class="btn btn-primary" id="uploadProfileBtn" style="display:none;margin-top:8px">
                            <i class="fas fa-upload"></i> Upload to R2
                        </button>
                        <div class="field-hint" style="margin-top:8px"><i class="fas fa-info-circle"></i>JPG, PNG or WebP. Max 10 MB. Square crops best.</div>
                    </div>
                </div>
            </div>

            <button class="btn btn-primary" id="saveSettings"><i class="fas fa-save"></i> Save Settings</button>
        `;

        // Load current profile preview
        try {
            const profileMedia = await API.getMedia('profile');
            if (profileMedia.length > 0) {
                const img = document.getElementById('profilePreview');
                img.src = profileMedia[0].url;
                img.style.display = 'block';
                document.getElementById('profilePreviewPlaceholder').style.display = 'none';
            }
        } catch {}

        // Profile upload handler
        let pendingProfileFile = null;
        document.getElementById('profileFile').addEventListener('change', (e) => {
            if (!e.target.files[0]) return;
            pendingProfileFile = e.target.files[0];
            const url = URL.createObjectURL(pendingProfileFile);
            const img = document.getElementById('profilePreview');
            img.src = url;
            img.style.display = 'block';
            document.getElementById('profilePreviewPlaceholder').style.display = 'none';
            document.getElementById('uploadProfileBtn').style.display = 'inline-flex';
        });

        document.getElementById('uploadProfileBtn').addEventListener('click', async () => {
            if (!pendingProfileFile) return;
            const btn = document.getElementById('uploadProfileBtn');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Uploading…';
            try {
                await API.uploadMedia(pendingProfileFile, 'profile', 'Profile Picture');
                showToast('Profile picture uploaded! Hit Publish to go live.', 'success');
                btn.style.display = 'none';
            } catch (err) { showToast(err.message, 'error'); }
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-upload"></i> Upload to R2';
        });

        // Save settings
        document.getElementById('saveSettings').addEventListener('click', async () => {
            const btn = document.getElementById('saveSettings');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Saving…';
            try {
                await API.updateSettings({
                    navLogo:      document.getElementById('settNavLogo').value,
                    footerText:   document.getElementById('settFooter').value,
                    profileShape: document.getElementById('settProfileShape').value,
                });
                showToast('Settings saved! Hit Publish to apply.', 'success');
            } catch (err) { showToast(err.message, 'error'); }
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Save Settings';
        });

    } catch (err) {
        renderPageError(container, err);
    }
});

window.selectShape = function(shape) {
    document.querySelectorAll('.shape-option').forEach(el => el.classList.remove('active'));
    const el = document.querySelector(`.shape-option[data-shape="${shape}"]`);
    if (el) el.classList.add('active');
    document.getElementById('settProfileShape').value = shape;
};
