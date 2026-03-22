'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { HeroConfig, SiteSettings, ProfileShape } from '@/types/config';

interface Props {
  config: HeroConfig;
  settings: SiteSettings;
  preview?: boolean;
}

const shapeClass: Record<ProfileShape, string> = {
  hexagon: 'shape-hexagon',
  circle:  'shape-circle',
  square:  'shape-square',
  rounded: 'shape-rounded',
  diamond: 'shape-diamond',
  shield:  'shape-shield',
};

function TypewriterText({ phrases }: { phrases: string[] }) {
  const [idx, setIdx]   = useState(0);
  const [text, setText]  = useState('');
  const [del, setDel]    = useState(false);

  useEffect(() => {
    if (!phrases.length) return;
    const current = phrases[idx % phrases.length];
    const speed   = del ? 50 : 100;

    const t = setTimeout(() => {
      if (!del) {
        setText(current.slice(0, text.length + 1));
        if (text.length + 1 === current.length) setTimeout(() => setDel(true), 1800);
      } else {
        setText(current.slice(0, text.length - 1));
        if (text.length === 1) { setDel(false); setIdx((i) => i + 1); }
      }
    }, speed);

    return () => clearTimeout(t);
  }, [text, del, idx, phrases]);

  return (
    <span style={{ color: 'var(--accent2)' }}>
      {text}
      <span style={{ animation: 'pulse 1s infinite', opacity: 0.8 }}>|</span>
    </span>
  );
}

export default function HeroSection({ config, settings, preview = false }: Props) {
  const shape = shapeClass[settings.profile_shape] || 'shape-hexagon';

  return (
    <section
      id="hero"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        paddingTop: 'var(--nav-h)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center',
        }}
          className="hero-grid"
        >
          {/* Text */}
          <div className="reveal" style={{ animationDelay: '0.1s' }}>
            {settings.hero_eyebrow && (
              <p style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--accent1)',
                marginBottom: '1rem',
              }}>
                {settings.hero_eyebrow}
              </p>
            )}

            <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '0.5rem' }}>
              <span>Hi, I&apos;m </span>
              <span className="gradient-text glitch">{config.name}</span>
            </h1>

            <p style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--muted)' }}>
              {config.glitch_text}
            </p>

            {config.subtitle?.length > 0 && !preview && (
              <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', minHeight: '1.75rem' }}>
                <TypewriterText phrases={config.subtitle} />
              </p>
            )}

            {config.description && (
              <p style={{ color: 'var(--muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '520px' }}>
                {config.description}
              </p>
            )}

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {config.cta_primary_text && (
                <a href={config.cta_primary_href || '#projects'} className="btn btn-primary">
                  <i className="fa-solid fa-rocket" />
                  {config.cta_primary_text}
                </a>
              )}
              {config.cta_secondary_text && (
                <a href={config.cta_secondary_href || '#contact'} className="btn btn-outline">
                  <i className="fa-solid fa-envelope" />
                  {config.cta_secondary_text}
                </a>
              )}
            </div>
          </div>

          {/* Profile image */}
          <div className="reveal" style={{ display: 'flex', justifyContent: 'center', animationDelay: '0.3s' }}>
            <div style={{ position: 'relative' }}>
              {/* Glow ring */}
              <div style={{
                position: 'absolute',
                inset: '-8px',
                borderRadius: '50%',
                background: 'var(--grad)',
                opacity: 0.3,
                filter: 'blur(20px)',
                animation: 'pulse 3s infinite',
              }} />
              <div style={{
                width: 'clamp(220px, 28vw, 340px)',
                height: 'clamp(220px, 28vw, 340px)',
                position: 'relative',
                overflow: 'hidden',
              }} className={shape}>
                {config.profile_image ? (
                  <Image
                    src={config.profile_image}
                    alt={`${config.name} profile photo`}
                    fill
                    sizes="(max-width: 768px) 220px, 340px"
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'var(--grad)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <i className="fa-solid fa-user" style={{ fontSize: '5rem', color: 'white', opacity: 0.7 }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      {!preview && (
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: 0.5,
        }}>
          <span style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll</span>
          <div style={{
            width: '1px',
            height: '40px',
            background: 'var(--grad)',
            animation: 'pulse 2s infinite',
          }} />
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .hero-grid > div:last-child {
            order: -1;
          }
        }
      `}</style>
    </section>
  );
}
