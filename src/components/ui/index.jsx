import { useState } from 'react'
import { getInitials, getAvatarColor } from '../../utils'

/* ══════════════════════════════════════════════════════════════
   BUTTON
══════════════════════════════════════════════════════════════ */
const btnBase = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: '6px', border: 'none', borderRadius: 'var(--radius)',
  fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease',
  whiteSpace: 'nowrap',
}

const VARIANTS = {
  primary:  { background: 'var(--accent)',      color: '#fff',                  },
  danger:   { background: 'var(--danger-dim)',   color: 'var(--danger)',   border: '1px solid rgba(248,113,113,0.25)' },
  ghost:    { background: 'transparent',         color: 'var(--text-secondary)', border: '1px solid var(--border)' },
  success:  { background: 'var(--success-dim)',  color: 'var(--success)', border: '1px solid rgba(52,211,153,0.25)' },
}

const SIZES = {
  sm: { padding: '5px 12px', fontSize: '13px', height: '30px' },
  md: { padding: '8px 18px', fontSize: '14px', height: '38px' },
  lg: { padding: '11px 24px', fontSize: '15px', height: '46px' },
}

export const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, style = {}, ...props
}) => {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      style={{
        ...btnBase,
        ...VARIANTS[variant],
        ...SIZES[size],
        opacity: disabled || loading ? 0.55 : 1,
        filter: hovered && !disabled && !loading ? 'brightness(1.12)' : 'none',
        ...style,
      }}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {loading
        ? <><Spinner size={14} color="currentColor" />{children}</>
        : children
      }
    </button>
  )
}

/* ══════════════════════════════════════════════════════════════
   INPUT / TEXTAREA / SELECT
══════════════════════════════════════════════════════════════ */
const fieldBase = {
  width: '100%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'border-color 0.15s',
}

export const Input = ({ label, error, hint, style = {}, ...props }) => {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</label>}
      <input
        style={{
          ...fieldBase,
          padding: '9px 13px',
          fontSize: '14px',
          height: '40px',
          borderColor: error ? 'var(--danger)' : focused ? 'var(--accent)' : 'var(--border)',
          boxShadow: focused && !error ? '0 0 0 3px var(--accent-dim)' : 'none',
          ...style,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  )
}

export const Textarea = ({ label, error, rows = 3, style = {}, ...props }) => {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</label>}
      <textarea
        rows={rows}
        style={{
          ...fieldBase,
          padding: '9px 13px',
          fontSize: '14px',
          resize: 'vertical',
          borderColor: error ? 'var(--danger)' : focused ? 'var(--accent)' : 'var(--border)',
          boxShadow: focused && !error ? '0 0 0 3px var(--accent-dim)' : 'none',
          ...style,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

export const Select = ({ label, error, children, style = {}, ...props }) => {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</label>}
      <select
        style={{
          ...fieldBase,
          padding: '9px 13px',
          fontSize: '14px',
          height: '40px',
          cursor: 'pointer',
          borderColor: error ? 'var(--danger)' : focused ? 'var(--accent)' : 'var(--border)',
          boxShadow: focused ? '0 0 0 3px var(--accent-dim)' : 'none',
          ...style,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   BADGE
══════════════════════════════════════════════════════════════ */
export const Badge = ({ label, color, bg, style = {} }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 9px', borderRadius: '99px',
    fontSize: '11.5px', fontWeight: 500,
    color, background: bg,
    ...style,
  }}>
    {label}
  </span>
)

/* ══════════════════════════════════════════════════════════════
   SPINNER
══════════════════════════════════════════════════════════════ */
export const Spinner = ({ size = 20, color = 'var(--accent)' }) => (
  <span style={{
    width: size, height: size, border: `2px solid transparent`,
    borderTopColor: color,
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  }} />
)

export const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '60vh', flexDirection: 'column', gap: '16px',
  }}>
    <Spinner size={36} />
    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading…</span>
  </div>
)

/* ══════════════════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════════════════ */
export const Modal = ({ isOpen, onClose, title, children, width = 480 }) => {
  if (!isOpen) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="animate-fade"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          width: '100%', maxWidth: width,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px',
          borderBottom: '1px solid var(--border)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 400 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              fontSize: '20px', cursor: 'pointer', lineHeight: 1,
              padding: '2px 6px', borderRadius: '4px',
            }}
          >×</button>
        </div>
        {/* Body */}
        <div style={{ padding: '22px' }}>{children}</div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   AVATAR
══════════════════════════════════════════════════════════════ */
export const Avatar = ({ firstName, lastName, size = 36, style = {} }) => {
  const initials = getInitials(firstName, lastName)
  const bg = getAvatarColor(`${firstName}${lastName}`)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg + '33',
      border: `1.5px solid ${bg}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 600, color: bg,
      flexShrink: 0,
      ...style,
    }}>
      {initials}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   CARD
══════════════════════════════════════════════════════════════ */
export const Card = ({ children, style = {}, ...props }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    ...style,
  }} {...props}>
    {children}
  </div>
)

/* ══════════════════════════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════════════════════════ */
export const EmptyState = ({ icon = '📭', title, description, action }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '60px 24px', textAlign: 'center',
    gap: '12px',
  }}>
    <div style={{ fontSize: '40px', marginBottom: '4px' }}>{icon}</div>
    <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>{title}</h3>
    {description && <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '320px' }}>{description}</p>}
    {action && <div style={{ marginTop: '8px' }}>{action}</div>}
  </div>
)

/* ══════════════════════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════════════════════ */
export const StatCard = ({ label, value, color = 'var(--text-primary)', icon }) => (
  <Card style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px' }}>
    {icon && (
      <div style={{
        width: 42, height: 42, borderRadius: 'var(--radius)',
        background: 'var(--bg-elevated)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px',
      }}>
        {icon}
      </div>
    )}
    <div>
      <div style={{ fontSize: '24px', fontWeight: 600, color, lineHeight: 1.2 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
    </div>
  </Card>
)

/* ══════════════════════════════════════════════════════════════
   CONFIRM DIALOG
══════════════════════════════════════════════════════════════ */
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, loading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} width={400}>
    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '22px' }}>{message}</p>
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
      <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm} loading={loading}>Confirm</Button>
    </div>
  </Modal>
)
