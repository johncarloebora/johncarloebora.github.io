'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type View = 'login' | 'forgot';

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('login');
  const [form, setForm] = useState({ username: '', password: '' });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
      } else {
        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSuccess('If that email is registered, a reset link has been sent.');
    } catch {
      setSuccess('If that email is registered, a reset link has been sent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '2.5rem 2rem',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontSize: '2rem', fontWeight: 800,
            background: 'var(--grad)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>CE Admin</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {view === 'login' ? 'Sign in to manage your portfolio' : 'Reset your password'}
          </p>
        </div>

        {view === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.375rem' }}>
                Username
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                style={inputStyle}
                placeholder="admin"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.375rem' }}>
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p style={{ color: 'var(--accent1)', fontSize: '0.85rem', textAlign: 'center' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.5rem' }} />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? <><i className="fa-solid fa-spinner animate-spin" /> Signing in…</> : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => setView('forgot')}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Forgot password?
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.375rem' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="your@email.com"
              />
            </div>

            {success && (
              <p style={{ color: '#4ade80', fontSize: '0.85rem', textAlign: 'center' }}>{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => { setView('login'); setSuccess(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'var(--surface2)',
  color: 'var(--text)',
  fontSize: '0.95rem',
  outline: 'none',
};
