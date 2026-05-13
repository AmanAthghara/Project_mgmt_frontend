import { formatDistanceToNow, format, isPast } from 'date-fns'

// ── Error message extractor ───────────────────────────────────
export const getErrorMessage = (err) => {
  if (!err) return 'Something went wrong'
  if (err.response?.data?.errors?.length) {
    return err.response.data.errors.map(e => e.message).join(', ')
  }
  return err.response?.data?.message || err.message || 'Something went wrong'
}

// ── Date helpers ──────────────────────────────────────────────
export const timeAgo = (date) => {
  if (!date) return '—'
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }) }
  catch { return '—' }
}

export const formatDate = (date) => {
  if (!date) return '—'
  try { return format(new Date(date), 'MMM d, yyyy') }
  catch { return '—' }
}

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'completed') return false
  return isPast(new Date(dueDate))
}

// ── Priority config ───────────────────────────────────────────
export const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  high:   { label: 'High',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  medium: { label: 'Medium', color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)'  },
  low:    { label: 'Low',    color: '#8b919e', bg: 'rgba(139,145,158,0.12)' },
}

// ── Status config ─────────────────────────────────────────────
export const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: '#8b919e', bg: 'rgba(139,145,158,0.12)' },
  in_progress: { label: 'In Progress', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  completed:   { label: 'Completed',   color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
}

// ── Request status config ─────────────────────────────────────
export const REQUEST_STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  accepted: { label: 'Accepted', color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  rejected: { label: 'Rejected', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

// ── Initials ──────────────────────────────────────────────────
export const getInitials = (firstName, lastName) => {
  return `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}`
}

// ── Avatar colour from name ───────────────────────────────────
const AVATAR_COLORS = [
  '#4f8ef7','#a78bfa','#34d399','#fbbf24','#f87171','#38bdf8','#fb923c',
]
export const getAvatarColor = (str = '') => {
  let hash = 0
  for (const ch of str) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
