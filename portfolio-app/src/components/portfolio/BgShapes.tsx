'use client';

export default function BgShapes() {
  return (
    <div id="bgShapes" aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div className="bg-bubble" style={{
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(255,107,107,0.15) 0%, transparent 70%)',
        top: '-10%', left: '-10%',
        ['--dur' as string]: '25s', ['--delay' as string]: '0s',
      }} />
      <div className="bg-bubble" style={{
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(78,205,196,0.12) 0%, transparent 70%)',
        bottom: '-10%', right: '-5%',
        ['--dur' as string]: '20s', ['--delay' as string]: '-8s',
      }} />
      <div className="bg-bubble" style={{
        width: '350px', height: '350px',
        background: 'radial-gradient(circle, rgba(255,107,107,0.08) 0%, transparent 70%)',
        top: '40%', right: '10%',
        ['--dur' as string]: '18s', ['--delay' as string]: '-4s',
      }} />
    </div>
  );
}
