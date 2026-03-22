'use client';

// Reusable form field group for admin editors

interface FieldGroupProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function FieldGroup({ label, hint, children }: FieldGroupProps) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', marginBottom: '0.375rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{hint}</p>}
    </div>
  );
}

interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}

export function TextInput({ value, onChange, placeholder, type = 'text', disabled }: TextInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '0.6rem 0.875rem',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        background: 'var(--surface2)',
        color: 'var(--text)',
        fontSize: '0.875rem',
        outline: 'none',
        opacity: disabled ? 0.5 : 1,
      }}
    />
  );
}

interface TextAreaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

export function TextArea({ value, onChange, placeholder, rows = 3 }: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%',
        padding: '0.6rem 0.875rem',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        background: 'var(--surface2)',
        color: 'var(--text)',
        fontSize: '0.875rem',
        outline: 'none',
        resize: 'vertical',
        fontFamily: 'inherit',
      }}
    />
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: '40px', height: '22px',
          borderRadius: '11px',
          background: checked ? 'var(--accent2)' : 'var(--border)',
          position: 'relative',
          transition: 'background 0.2s',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '21px' : '3px',
          width: '16px', height: '16px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
      <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{label}</span>
    </label>
  );
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

export function Select({ value, onChange, options }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '0.6rem 0.875rem',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        background: 'var(--surface2)',
        color: 'var(--text)',
        fontSize: '0.875rem',
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function Divider({ label }: { label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      {label && <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>}
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  );
}

export function SaveBtn({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="btn btn-primary"
      style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}
    >
      {saving ? <><i className="fa-solid fa-spinner animate-spin" /> Saving…</> : <><i className="fa-solid fa-floppy-disk" /> Save Changes</>}
    </button>
  );
}
