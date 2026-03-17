// ============================================================
// Change Password
// ============================================================

router.register('password', () => {
    const container = document.getElementById('passwordEditor');
    container.innerHTML = `
        <div class="help-banner" style="margin-bottom:20px">
            <i class="fas fa-shield-alt"></i>
            <div>
                <strong>Change your admin password.</strong>
                Use a strong password with at least 8 characters. After changing, you'll stay logged in — your next login will require the new password.
            </div>
        </div>

        <div class="admin-card" style="max-width:500px">
            <div class="admin-card-header"><h3><i class="fas fa-lock"></i> Change Password</h3></div>

            <div class="form-group">
                <label>Current Password</label>
                <div class="password-input-wrap" style="position:relative">
                    <input type="password" class="form-input" id="pwCurrent" autocomplete="current-password" placeholder="Enter your current password">
                    <button type="button" class="pw-toggle-btn" onclick="togglePwVisibility('pwCurrent', this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--muted);padding:4px">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>

            <div class="form-group">
                <label>New Password</label>
                <div style="position:relative">
                    <input type="password" class="form-input" id="pwNew" minlength="8" autocomplete="new-password" placeholder="Minimum 8 characters" oninput="updateStrength(this.value)">
                    <button type="button" class="pw-toggle-btn" onclick="togglePwVisibility('pwNew', this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--muted);padding:4px">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <div id="pwStrengthBar" style="margin-top:8px;display:none">
                    <div style="height:4px;background:var(--surface3);border-radius:2px;overflow:hidden">
                        <div id="pwStrengthFill" style="height:100%;width:0%;transition:width 0.3s,background 0.3s;border-radius:2px"></div>
                    </div>
                    <div id="pwStrengthLabel" style="font-size:0.75rem;margin-top:4px;color:var(--muted)"></div>
                </div>
                <div class="field-hint"><i class="fas fa-info-circle"></i> Use a mix of uppercase, lowercase, numbers, and symbols for a stronger password.</div>
            </div>

            <div class="form-group">
                <label>Confirm New Password</label>
                <div style="position:relative">
                    <input type="password" class="form-input" id="pwConfirm" autocomplete="new-password" placeholder="Re-enter your new password" oninput="checkPwMatch()">
                    <button type="button" class="pw-toggle-btn" onclick="togglePwVisibility('pwConfirm', this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--muted);padding:4px">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <div id="pwMatchHint" style="font-size:0.75rem;margin-top:6px;display:none"></div>
            </div>

            <button class="btn btn-primary" id="savePassword">
                <i class="fas fa-save"></i> Update Password
            </button>
        </div>
    `;

    document.getElementById('savePassword').addEventListener('click', async () => {
        const current = document.getElementById('pwCurrent').value;
        const newPw   = document.getElementById('pwNew').value;
        const confirm = document.getElementById('pwConfirm').value;

        if (!current || !newPw) return showToast('Please fill in all fields.', 'error');
        if (newPw.length < 8)   return showToast('New password must be at least 8 characters.', 'error');
        if (newPw !== confirm)  return showToast('Passwords do not match.', 'error');

        const btn = document.getElementById('savePassword');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Updating…';

        try {
            await API.changePassword(current, newPw);
            showToast('Password updated successfully!', 'success');
            document.getElementById('pwCurrent').value = '';
            document.getElementById('pwNew').value = '';
            document.getElementById('pwConfirm').value = '';
            // Reset UI state
            document.getElementById('pwStrengthBar').style.display = 'none';
            document.getElementById('pwMatchHint').style.display = 'none';
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Update Password';
        }
    });
});

window.togglePwVisibility = function(fieldId, btn) {
    const input = document.getElementById(fieldId);
    const icon  = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
};

window.updateStrength = function(value) {
    const bar   = document.getElementById('pwStrengthBar');
    const fill  = document.getElementById('pwStrengthFill');
    const label = document.getElementById('pwStrengthLabel');

    if (!value) { bar.style.display = 'none'; return; }
    bar.style.display = 'block';

    let score = 0;
    if (value.length >= 8)  score++;
    if (value.length >= 12) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    const levels = [
        { pct: 20,  color: '#ff4444', text: 'Very Weak'  },
        { pct: 40,  color: '#ff8800', text: 'Weak'       },
        { pct: 60,  color: '#ffcc00', text: 'Fair'       },
        { pct: 80,  color: '#88cc00', text: 'Strong'     },
        { pct: 100, color: '#00cc88', text: 'Very Strong' },
    ];
    const lvl = levels[Math.min(score - 1, 4)] || levels[0];
    fill.style.width = lvl.pct + '%';
    fill.style.background = lvl.color;
    label.textContent = lvl.text;
    label.style.color = lvl.color;

    // Also recheck match
    checkPwMatch();
};

window.checkPwMatch = function() {
    const newPw   = document.getElementById('pwNew').value;
    const confirm = document.getElementById('pwConfirm').value;
    const hint    = document.getElementById('pwMatchHint');

    if (!confirm) { hint.style.display = 'none'; return; }
    hint.style.display = 'block';

    if (newPw === confirm) {
        hint.innerHTML = '<i class="fas fa-check-circle" style="color:var(--success)"></i> <span style="color:var(--success)">Passwords match</span>';
    } else {
        hint.innerHTML = '<i class="fas fa-times-circle" style="color:var(--accent1)"></i> <span style="color:var(--accent1)">Passwords do not match</span>';
    }
};
