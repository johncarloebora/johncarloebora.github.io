'use client';

import { useState, useEffect } from 'react';
import type { Section, SiteSettings } from '@/types/config';

interface Props {
  sections: Section[];
  settings: SiteSettings;
  preview?: boolean;
}

export default function NavBar({ sections, settings, preview = false }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    if (preview) return;
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initial = saved ?? settings.theme_default ?? 'dark';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, [settings.theme_default, preview]);

  useEffect(() => {
    if (preview) return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [preview]);

  // Active section tracking
  useEffect(() => {
    if (preview) return;
    const ids = sections.map((s) => s.type);
    const observers: IntersectionObserver[] = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.4 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sections, preview]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 'var(--nav-h)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 2rem',
    background: scrolled ? 'rgba(10,10,10,0.95)' : 'transparent',
    backdropFilter: scrolled ? 'blur(20px)' : 'none',
    borderBottom: scrolled ? '1px solid var(--border)' : 'none',
    transition: 'all 0.3s ease',
  };

  return (
    <nav style={navStyle} aria-label="Main navigation">
      {/* Logo */}
      <a
        href="#hero"
        onClick={(e) => { if (!preview) { e.preventDefault(); scrollTo('hero'); } }}
        style={{
          fontWeight: 800,
          fontSize: '1.25rem',
          background: 'var(--grad)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textDecoration: 'none',
        }}
      >
        {settings.nav_logo || 'CE'}
      </a>

      {/* Desktop nav */}
      <div style={{ display: 'flex', gap: '0.25rem', marginLeft: 'auto', alignItems: 'center' }}>
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.type}`}
            onClick={(e) => { if (!preview) { e.preventDefault(); scrollTo(s.type); } }}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
              color: activeSection === s.type ? 'var(--accent2)' : 'var(--muted)',
              background: activeSection === s.type ? 'rgba(78,205,196,0.1)' : 'transparent',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <i className={`fa-solid fa-${s.nav_icon}`} style={{ fontSize: '0.75rem' }} />
            <span className="hidden sm:inline">{s.nav_label}</span>
          </a>
        ))}

        {/* Theme toggle */}
        <button
          onClick={preview ? undefined : toggleTheme}
          aria-label="Toggle theme"
          style={{
            marginLeft: '0.5rem',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '0.875rem',
          }}
        >
          <i className={`fa-solid fa-${theme === 'dark' ? 'sun' : 'moon'}`} />
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        className="sm:hidden"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
        style={{
          marginLeft: '0.5rem',
          padding: '0.5rem',
          border: 'none',
          background: 'transparent',
          color: 'var(--text)',
          cursor: 'pointer',
          fontSize: '1.25rem',
        }}
      >
        <i className={`fa-solid fa-${menuOpen ? 'xmark' : 'bars'}`} />
      </button>

      {/* Mobile drawer */}
      {menuOpen && (
        <div style={{
          position: 'absolute',
          top: 'var(--nav-h)',
          left: 0,
          right: 0,
          background: 'rgba(10,10,10,0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}>
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.type}`}
              onClick={(e) => { e.preventDefault(); scrollTo(s.type); }}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: activeSection === s.type ? 'var(--accent2)' : 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.95rem',
              }}
            >
              <i className={`fa-solid fa-${s.nav_icon}`} />
              {s.nav_label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
