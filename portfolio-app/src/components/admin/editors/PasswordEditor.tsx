'use client';

import { useState } from 'react';
import { FieldGroup, TextInput, SaveBtn } from '../shared/FieldGroup';

export default function PasswordEditor() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const save = async () => {
    setError('');
    setMessage('');
    if (form.new_password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (form.new_password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.cookie.match(/csrf_token=([^;]+)/)?.[1] ?? '',
        },
        body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Password changed successfully.');
        setForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch {
      setError('Network error');
    }
    setSaving(false);
  };

  return (
    <div>
      <FieldGroup label="Current Password">
        <TextInput type="password" value={form.current_password} onChange={(v) => setForm({ ...form, current_password: v })} placeholder="••••••••" />
      </FieldGroup>
      <FieldGroup label="New Password">
        <TextInput type="password" value={form.new_password} onChange={(v) => setForm({ ...form, new_password: v })} placeholder="Min 8 characters" />
      </FieldGroup>
      <FieldGroup label="Confirm New Password">
        <TextInput type="password" value={form.confirm_password} onChange={(v) => setForm({ ...form, confirm_password: v })} />
      </FieldGroup>

      {error && <p style={{ color: 'var(--accent1)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
      {message && <p style={{ color: '#4ade80', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{message}</p>}

      <SaveBtn onClick={save} saving={saving} />
    </div>
  );
}
