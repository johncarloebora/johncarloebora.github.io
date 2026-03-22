'use client';

import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos     = useRef({ x: 0, y: 0 });
  const lerped  = useRef({ x: 0, y: 0 });
  const raf     = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
      }
    };

    const animate = () => {
      lerped.current.x += (pos.current.x - lerped.current.x) * 0.12;
      lerped.current.y += (pos.current.y - lerped.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${lerped.current.x - 18}px, ${lerped.current.y - 18}px)`;
      }
      raf.current = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', onMove);
    raf.current = requestAnimationFrame(animate);
    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  // Hide on touch devices
  if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return null;

  return (
    <>
      <div ref={dotRef} aria-hidden="true" style={{
        position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none',
        width: 8, height: 8, borderRadius: '50%',
        background: 'var(--accent1)', mixBlendMode: 'difference',
      }} />
      <div ref={ringRef} aria-hidden="true" style={{
        position: 'fixed', top: 0, left: 0, zIndex: 9998, pointerEvents: 'none',
        width: 36, height: 36, borderRadius: '50%',
        border: '2px solid rgba(78,205,196,0.6)',
        transition: 'width 0.2s, height 0.2s',
      }} />
    </>
  );
}
