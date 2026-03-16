// ============================================================
// Settings — Global config, profile shape, nav logo
// ============================================================

router.register('settings', async () => {
    const container = document.getElementById('settingsEditor');
    container.innerHTML = '<p style="color:var(--muted)">Loading...</p>';

    try {
        const settings = await API.getSettings();
        const currentShape = settings.profileShape || 'hexagon';

        container.innerHTML = `
            <div class="admin-card">
                <div class="admin-card-header"><h3>General</h3></div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Navigation Logo</label>
                        <input type="text" class="form-input" id="settNavLogo" value="${esc(settings.navLogo || 'CE')}">
                    </div>
                    <div class="form-group">
                        <label>Footer Text</label>
                        <input type="text" class="form-input" id="settFooter" value="${esc(settings.footerText || '')}">
                    </div>
                </div>
            </div>

            <div class="admin-card">
                <div class="admin-card-header"><h3>Profile Picture Shape</h3></div>
                <p style="color:var(--muted);font-size:0.85rem;margin-bottom:16px">Select the shape for the hero avatar frame</p>
                <div class="shape-options">
                    <div class="shape-option ${currentShape === 'hexagon' ? 'active' : ''}" data-shape="hexagon" onclick="selectShape('hexagon')">
                        <div class="shape-preview shape-hexagon"></div>
                    </div>
                    <div class="shape-option ${currentShape === 'circle' ? 'active' : ''}" data-shape="circle" onclick="selectShape('circle')">
                        <div class="shape-preview shape-circle"></div>
                    </div>
                    <div class="shape-option ${currentShape === 'square' ? 'active' : ''}" data-shape="square" onclick="selectShape('square')">
                        <div class="shape-preview shape-square"></div>
                    </div>
                    <div class="shape-option ${currentShape === 'rounded' ? 'active' : ''}" data-shape="rounded" onclick="selectShape('rounded')">
                        <div class="shape-preview shape-rounded"></div>
                    </div>
                </div>
                <input type="hidden" id="settProfileShape" value="${esc(currentShape)}">
            </div>

            <div class="admin-card">
                <div class="admin-card-header"><h3>Profile Picture</h3></div>
                <p style="color:var(--muted);font-size:0.85rem;margin-bottom:16px">Upload a new profile picture (goes to /profile/ folder in R2)</p>
                <div style="display:flex;gap:16px;align-items:center">
                    <div style="width:100px;height:100px;border-radius:var(--radius);overflow:hidden;background:var(--surface2);flex-shrink:0">
                        <img id="profilePreview" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">
                    </div>
                    <div>
                        <input type="file" id="profileFile" accept="image/*" style="display:none">
                        <button class="btn btn-secondary" onclick="document.getElementById('profileFile').click()"><i class="fas fa-upload"></i> Choose Image</button>
                        <button class="btn btn-primary" id="uploadProfileBtn" style="display:none"><i class="fas fa-save"></i> Upload</button>
                    </div>
                </div>
            </div>

            <button class="btn btn-primary" id="saveSettings"><i class="fas fa-save"></i> Save Settings</button>
        `;

        // Load current profile image
        try {
            const profileMedia = await API.getMedia('profile');
            if (profileMedia.length > 0) {
                document.getElementById('profilePreview').src = profileMedia[0].url;
            }
        } catch {}

        // Profile upload
        let pendingProfileFile = null;
        document.getElementById('profileFile').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                pendingProfileFile = e.target.files[0];
                document.getElementById('profilePreview').src = URL.createObjectURL(pendingProfileFile);
                document.getElementById('uploadProfileBtn').style.display = '';
            }
        });

        document.getElementById('uploadProfileBtn').addEventListener('click', async () => {
            if (!pendingProfileFile) return;
            const btn = document.getElementById('uploadProfileBtn');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span>';
            try {
                await API.uploadMedia(pendingProfileFile, 'profile', 'Profile Picture');
                showToast('Profile picture uploaded!', 'success');
                btn.style.display = 'none';
            } catch (err) { showToast(err.message, 'error'); }
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Upload';
        });

        // Save settings
        document.getElementById('saveSettings').addEventListener('click', async () => {
            try {
                await API.updateSettings({
                    navLogo: document.getElementById('settNavLogo').value,
                    footerText: document.getElementById('settFooter').value,
                    profileShape: document.getElementById('settProfileShape').value,
                });
                showToast('Settings saved!', 'success');
            } catch (err) { showToast(err.message, 'error'); }
        });
    } catch (err) {
        container.innerHTML = `<p style="color:var(--accent1)">Error: ${err.message}</p>`;
    }
});

window.selectShape = function(shape) {
    document.querySelectorAll('.shape-option').forEach(el => el.classList.remove('active'));
    document.querySelector(`.shape-option[data-shape="${shape}"]`).classList.add('active');
    document.getElementById('settProfileShape').value = shape;
};
