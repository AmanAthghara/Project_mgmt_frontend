import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { Avatar } from '../ui'
import { getInitials } from '../../utils'

const NAV = [
  { to: '/dashboard',          icon: '⬡', label: 'Dashboard'     },
  { to: '/projects',           icon: '◫', label: 'Explore'       },
  { to: '/projects/mine',      icon: '◈', label: 'My Projects'   },
  { to: '/tasks/me',           icon: '◉', label: 'My Tasks'      },
  { to: '/requests',           icon: '◌', label: 'Requests'      },
  { to: '/settings',           icon: '◎', label: 'Settings'      },
]

export const Sidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    console.log('%c[SIDEBAR] logout clicked', 'color:#f87171')
    logout()
    navigate('/login')
  }

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      height: '100vh',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0, top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        padding: '22px 20px 18px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '20px',
          color: 'var(--accent)',
          letterSpacing: '-0.3px',
        }}>
          ProjectFlow
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Project Management
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: 'var(--radius)',
              marginBottom: '2px',
              fontSize: '13.5px',
              fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.12s',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.style.background.includes('var(--accent-dim)')) {
                e.currentTarget.style.background = ''
                e.currentTarget.style.color = ''
              }
            }}
          >
            <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{
        padding: '14px 12px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <Avatar firstName={user?.first_name} lastName={user?.last_name} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 500, truncate: true,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.first_name} {user?.last_name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '16px', padding: '4px', borderRadius: '6px',
            flexShrink: 0,
          }}
        >⏻</button>
      </div>
    </aside>
  )
}

/* ══════════════════════════════════════════════════════════════
   TOP HEADER
══════════════════════════════════════════════════════════════ */
export const TopHeader = ({ title, actions }) => (
  <header style={{
    height: 'var(--header-h)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  }}>
    <h1 style={{
      fontFamily: 'var(--font-display)',
      fontSize: '20px',
      fontWeight: 400,
      color: 'var(--text-primary)',
    }}>
      {title}
    </h1>
    {actions && <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>{actions}</div>}
  </header>
)

/* ══════════════════════════════════════════════════════════════
   APP SHELL (wraps authenticated pages)
══════════════════════════════════════════════════════════════ */
export const AppShell = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar />
    <main style={{
      marginLeft: 'var(--sidebar-w)',
      flex: 1,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {children}
    </main>
  </div>
)
