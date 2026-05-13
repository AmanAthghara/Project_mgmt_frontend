import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'

// ── Auth pages
import {
  RegisterPage,
  VerifyOtpPage,
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from './pages/auth'

// ── App pages
import DashboardPage    from './pages/Dashboard'
import ExplorePage      from './pages/projects/ExplorePage'
import MyProjectsPage   from './pages/projects/MyProjectsPage'
import ProjectDetailPage from './pages/projects/ProjectDetailPage'
import MyTasksPage      from './pages/tasks/MyTasksPage'
import RequestsPage     from './pages/RequestsPage'
import SettingsPage     from './pages/SettingsPage'

// ── Route guards ──────────────────────────────────────────────

// Redirect to /login if not authenticated
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  useEffect(() => {
    console.log(
      `%c[ROUTER] PrivateRoute — auth:${isAuthenticated} loading:${loading} path:${location.pathname}`,
      'color:#4f8ef7'
    )
  }, [isAuthenticated, loading, location.pathname])

  if (loading) {
    // Show a minimal full-screen loader while token is being verified
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)',
      }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid transparent',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('%c[ROUTER] Not authenticated — redirecting to /login', 'color:#fbbf24')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

// Redirect to /dashboard if already authenticated (for login/register pages)
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return null

  if (isAuthenticated) {
    console.log('%c[ROUTER] Already authenticated — redirecting to /dashboard', 'color:#34d399')
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// ── Route logger ──────────────────────────────────────────────
const RouteLogger = () => {
  const location = useLocation()
  useEffect(() => {
    console.log(
      `%c[ROUTER] Navigated to: ${location.pathname}${location.search}`,
      'color:#a78bfa;font-weight:500'
    )
  }, [location])
  return null
}

// ── App inner (has access to AuthContext) ─────────────────────
const AppRoutes = () => (
  <>
    <RouteLogger />
    <Routes>

      {/* ── Public auth routes ─────────────────────────────── */}
      <Route path="/register" element={
        <PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>
      } />
      <Route path="/verify-otp" element={
        <PublicOnlyRoute><VerifyOtpPage /></PublicOnlyRoute>
      } />
      <Route path="/login" element={
        <PublicOnlyRoute><LoginPage /></PublicOnlyRoute>
      } />
      <Route path="/forgot-password" element={
        <PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>
      } />
      {/* Reset password link comes from email — allow even if logged in */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* ── Protected app routes ───────────────────────────── */}
      <Route path="/dashboard" element={
        <PrivateRoute><DashboardPage /></PrivateRoute>
      } />
      <Route path="/projects" element={
        <PrivateRoute><ExplorePage /></PrivateRoute>
      } />
      <Route path="/projects/mine" element={
        <PrivateRoute><MyProjectsPage /></PrivateRoute>
      } />
      <Route path="/projects/:projectId" element={
        <PrivateRoute><ProjectDetailPage /></PrivateRoute>
      } />
      <Route path="/tasks/me" element={
        <PrivateRoute><MyTasksPage /></PrivateRoute>
      } />
      <Route path="/requests" element={
        <PrivateRoute><RequestsPage /></PrivateRoute>
      } />
      <Route path="/settings" element={
        <PrivateRoute><SettingsPage /></PrivateRoute>
      } />

      {/* ── Fallbacks ──────────────────────────────────────── */}
      {/* Root → dashboard if logged in, else login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      {/* 404 catch-all */}
      <Route path="*" element={<NotFound />} />

    </Routes>
  </>
)

// ── 404 page ──────────────────────────────────────────────────
const NotFound = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg)', gap: '16px',
  }}>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: '72px', color: 'var(--border-light)' }}>404</div>
    <h1 style={{ fontSize: '20px', fontWeight: 500 }}>Page not found</h1>
    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
      The page you're looking for doesn't exist.
    </p>
    <a href="/dashboard" style={{
      marginTop: '8px', padding: '9px 20px',
      background: 'var(--accent)', color: '#fff',
      borderRadius: 'var(--radius)', fontSize: '14px', textDecoration: 'none',
    }}>
      Go to Dashboard
    </a>
  </div>
)

// ── Root App (wraps everything in AuthProvider) ───────────────
const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
)

export default App
