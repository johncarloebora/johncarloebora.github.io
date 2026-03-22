'use client';

import { useState } from 'react';
import type { SiteSettings } from '@/types/config';

interface Props {
  settings: SiteSettings;
  preview?: boolean;
}

export default function ContactSection({ settings, preview = false }: Props) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (preview) return;
    setStatus('sending');
    try {
      // EmailJS integration
      const payload = {
        service_id: settings.emailjs_service_id,
        template_id: settings.emailjs_template_id,
        user_id: settings.emailjs_public_key,
        template_params: {
          from_name: form.name,
          from_email: form.email,
          message: form.message,
          to_email: settings.contact_email,
        },
      };

      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatus('success');
        setForm({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
    setTimeout(() => setStatus('idle'), 5000);
  };

  return (
    <section id="contact" className="section">
      <div className="container container-sm">
        <div className="section-header reveal">
          <span className="section-label">Contact</span>
          <h2 className="section-title">Get In Touch</h2>
          <p className="section-subtitle">Have a project in mind? Let&apos;s talk.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card reveal"
          style={{ maxWidth: '600px', margin: '0 auto' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--muted)' }}>
                Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface2)',
                  color: 'var(--text)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--muted)' }}>
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface2)',
                  color: 'var(--text)',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--muted)' }}>
                Message
              </label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell me about your project…"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface2)',
                  color: 'var(--text)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {status === 'sending' ? (
                <><i className="fa-solid fa-spinner animate-spin" /> Sending…</>
              ) : (
                <><i className="fa-solid fa-paper-plane" /> Send Message</>
              )}
            </button>

            {status === 'success' && (
              <p style={{ color: '#4ade80', textAlign: 'center', fontSize: '0.9rem' }}>
                <i className="fa-solid fa-check-circle" style={{ marginRight: '0.5rem' }} />
                Message sent! I&apos;ll get back to you soon.
              </p>
            )}
            {status === 'error' && (
              <p style={{ color: '#f87171', textAlign: 'center', fontSize: '0.9rem' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.5rem' }} />
                Something went wrong. Please try again.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
