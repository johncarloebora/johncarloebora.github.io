// ============================================================
// Admin Auth — Login, Forgot/Reset Password, Token Management
// ============================================================

const API_BASE = (window.ADMIN_CONFIG && window.ADMIN_CONFIG.API_BASE) || 'https://carlo-portfolio-api.johncarloebora.workers.dev';

// ── Toast ──
function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast ' + type + ' show';
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove('show'), 4000);
}

// ── Token helpers ──
function getToken() { return sessionStorage.getItem('admin_token'); }
function setToken(token) { sessionStorage.setItem('admin_token', token); }
function clearToken() { sessionStorage.removeItem('admin_token'); }

// ── On load: check route ──
(function init() {
    const hash = window.location.hash;

    // If already logged in, redirect to dashboard
    if (getToken() && !hash.startsWith('#reset')) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Show correct view based on hash
    if (hash.startsWith('#reset')) {
        document.getElementById('loginView').style.display = 'none';
        document.getElementById('resetView').style.display = '';
    } else if (hash === '#forgot') {
        document.getElementById('loginView').style.display = 'none';
        document.getElementById('forgotView').style.display = '';
    }
})();

// ── Login ──
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) return showToast('Please fill in all fields', 'error');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in...';

    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || 'Login failed', 'error');
            return;
        }

        setToken(data.token);
        showToast('Login successful!', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 500);
    } catch (err) {
        showToast('Network error. Check your connection.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Sign In</span><i class="fas fa-arrow-right"></i>';
    }
});

// ── Forgot Password ──
document.getElementById('forgotBtn').addEventListener('click', () => {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('forgotView').style.display = '';
    window.location.hash = '#forgot';
});

document.getElementById('backToLogin').addEventListener('click', () => {
    document.getElementById('forgotView').style.display = 'none';
    document.getElementById('loginView').style.display = '';
    window.location.hash = '';
});

document.getElementById('forgotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();
    if (!email) return showToast('Please enter your email', 'error');

    try {
        const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        await res.json();
        showToast('If that email exists, a reset link has been sent.', 'success');
    } catch {
        showToast('Network error', 'error');
    }
});

// ── Reset Password ──
document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (newPass.length < 8) return showToast('Password must be at least 8 characters', 'error');
    if (newPass !== confirm) return showToast('Passwords do not match', 'error');

    // Extract token from hash: #reset?token=xxx
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const token = params.get('token');
    if (!token) return showToast('Invalid reset link', 'error');

    try {
        const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword: newPass }),
        });
        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || 'Reset failed', 'error');
            return;
        }

        showToast('Password reset successful! Redirecting to login...', 'success');
        setTimeout(() => {
            window.location.hash = '';
            window.location.reload();
        }, 2000);
    } catch {
        showToast('Network error', 'error');
    }
});
