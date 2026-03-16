// ============================================================
// Change Password
// ============================================================

router.register('password', () => {
    const container = document.getElementById('passwordEditor');
    container.innerHTML = `
        <div class="admin-card" style="max-width:500px">
            <div class="admin-card-header"><h3>Change Your Password</h3></div>
            <div class="form-group">
                <label>Current Password</label>
                <input type="password" class="form-input" id="pwCurrent" autocomplete="current-password">
            </div>
            <div class="form-group">
                <label>New Password</label>
                <input type="password" class="form-input" id="pwNew" minlength="8" autocomplete="new-password">
            </div>
            <div class="form-group">
                <label>Confirm New Password</label>
                <input type="password" class="form-input" id="pwConfirm" autocomplete="new-password">
            </div>
            <button class="btn btn-primary" id="savePassword"><i class="fas fa-save"></i> Update Password</button>
        </div>
    `;

    document.getElementById('savePassword').addEventListener('click', async () => {
        const current = document.getElementById('pwCurrent').value;
        const newPw = document.getElementById('pwNew').value;
        const confirm = document.getElementById('pwConfirm').value;

        if (!current || !newPw) return showToast('Please fill in all fields', 'error');
        if (newPw.length < 8) return showToast('Password must be at least 8 characters', 'error');
        if (newPw !== confirm) return showToast('Passwords do not match', 'error');

        try {
            await API.changePassword(current, newPw);
            showToast('Password updated successfully!', 'success');
            document.getElementById('pwCurrent').value = '';
            document.getElementById('pwNew').value = '';
            document.getElementById('pwConfirm').value = '';
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
});
