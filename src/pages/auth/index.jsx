import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/useAuth'
import { authApi } from '../../api'
import { Button, Input, Select } from '../../components/ui'
import { getErrorMessage } from '../../utils'

/* ── Shared auth card wrapper ─────────────────────────────── */
const AuthCard = ({ children }) => (
  <div style={{
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  }}>
    {/* Subtle background grid */}
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none',
      backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px),
                        linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
      backgroundSize: '40px 40px',
      opacity: 0.3,
    }} />

    <div className="animate-fade" style={{
      width: '100%',
      maxWidth: '420px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '36px 32px',
      boxShadow: 'var(--shadow-lg)',
      position: 'relative',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '26px',
          color: 'var(--accent)',
        }}>ProjectFlow</div>
      </div>
      {children}
    </div>
  </div>
)

const Heading = ({ title, subtitle }) => (
  <div style={{ marginBottom: '24px', textAlign: 'center' }}>
    <h2 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '4px' }}>{title}</h2>
    {subtitle && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{subtitle}</p>}
  </div>
)

/* ══════════════════════════════════════════════════════════════
   REGISTER — Step 1 (details + send OTP)
══════════════════════════════════════════════════════════════ */
export const RegisterPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    password: '', age: '', gender: '', phone_number: '',
  })
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.first_name.trim()) e.first_name = 'Required'
    if (!form.last_name.trim())  e.last_name  = 'Required'
    if (!form.email.trim())      e.email      = 'Required'
    if (form.password.length < 8) e.password  = 'Min 8 characters'
    if (!form.age || form.age < 13) e.age     = 'Must be 13+'
    setErrors(e)
    console.log('%c[REGISTER] validation errors:', 'color:#fbbf24', e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    console.log('%c[REGISTER] submitting step 1', 'color:#a78bfa', { email: form.email })
    setLoading(true)
    try {
      await authApi.register({ ...form, age: Number(form.age) })
      toast.success('OTP sent to your email!')
      // Pass email to verify page via state
      navigate('/verify-otp', { state: { email: form.email } })
    } catch (err) {
      toast.error(getErrorMessage(err))
      console.error('%c[REGISTER] error', 'color:#f87171', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard>
      <Heading title="Create account" subtitle="We'll send a verification code to your email" />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input label="First name" value={form.first_name} onChange={set('first_name')}
            placeholder="Ravi" error={errors.first_name} />
          <Input label="Last name"  value={form.last_name}  onChange={set('last_name')}
            placeholder="Kumar"  error={errors.last_name} />
        </div>
        <Input label="Email" type="email" value={form.email} onChange={set('email')}
          placeholder="ravi@example.com" error={errors.email} />
        <Input label="Password" type="password" value={form.password} onChange={set('password')}
          placeholder="Min 8 chars, 1 uppercase, 1 number" error={errors.password} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input label="Age" type="number" value={form.age} onChange={set('age')}
            placeholder="25" min="13" max="120" error={errors.age} />
          <Select label="Gender" value={form.gender} onChange={set('gender')}>
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </Select>
        </div>
        <Input label="Phone (optional)" type="tel" value={form.phone_number}
          onChange={set('phone_number')} placeholder="+91 98765 43210" />
        <Button type="submit" loading={loading} size="lg" style={{ marginTop: '6px', width: '100%' }}>
          Send Verification Code
        </Button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: 'var(--text-muted)' }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthCard>
  )
}

/* ══════════════════════════════════════════════════════════════
   VERIFY OTP — Step 2
══════════════════════════════════════════════════════════════ */
export const VerifyOtpPage = () => {
  const navigate = useNavigate()
  const { saveSession } = useAuth()
  const [searchParams] = useSearchParams()
  const emailFromQuery = searchParams.get('email') || ''

  // Also accept email from navigation state (from register page)
  const [email, setEmail] = useState(emailFromQuery)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) { toast.error('OTP must be 6 digits'); return }

    console.log('%c[VERIFY OTP] submitting', 'color:#a78bfa', { email })
    setLoading(true)
    try {
      const { data } = await authApi.verifyOtp({ email, otp })
      saveSession(data.data)
      toast.success('Account created! Welcome 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(getErrorMessage(err))
      console.error('%c[VERIFY OTP] error', 'color:#f87171', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard>
      <Heading title="Verify your email" subtitle={`Enter the 6-digit code sent to ${email || 'your email'}`} />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {!emailFromQuery && (
          <Input label="Email" type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="Your registered email" />
        )}
        <Input
          label="6-digit OTP"
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="481920"
          maxLength={6}
          style={{ fontSize: '22px', letterSpacing: '8px', textAlign: 'center' }}
        />
        <Button type="submit" loading={loading} size="lg" style={{ width: '100%', marginTop: '4px' }}>
          Verify & Create Account
        </Button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
        Didn't receive it? <Link to="/register">Register again</Link>
      </p>
    </AuthCard>
  )
}

/* ══════════════════════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════════════════════ */
export const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('%c[LOGIN] submitting', 'color:#a78bfa', { email: form.email })
    setLoading(true)
    try {
      await login(form)
      navigate('/dashboard')
    } catch (err) {
      toast.error(getErrorMessage(err))
      console.error('%c[LOGIN] error', 'color:#f87171', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard>
      <Heading title="Welcome back" subtitle="Sign in to your account" />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Input label="Email" type="email" value={form.email}
          onChange={set('email')} placeholder="ravi@example.com" required />
        <Input label="Password" type="password" value={form.password}
          onChange={set('password')} placeholder="••••••••" required />
        <div style={{ textAlign: 'right', marginTop: '-6px' }}>
          <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} size="lg" style={{ width: '100%' }}>
          Sign In
        </Button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: 'var(--text-muted)' }}>
        No account? <Link to="/register">Create one</Link>
      </p>
    </AuthCard>
  )
}

/* ══════════════════════════════════════════════════════════════
   FORGOT PASSWORD
══════════════════════════════════════════════════════════════ */
export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('%c[FORGOT PWD] sending reset email to:', 'color:#a78bfa', email)
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
      toast.success('Reset link sent!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard>
      <Heading title="Reset password" subtitle="Enter your email to receive a reset link" />
      {sent ? (
        <div style={{
          textAlign: 'center', padding: '20px',
          color: 'var(--success)', background: 'var(--success-dim)',
          borderRadius: 'var(--radius)', fontSize: '14px',
        }}>
          ✓ Check your inbox for a reset link.<br />
          <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '12px', display: 'inline-block' }}>
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input label="Email" type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="ravi@example.com" required />
          <Button type="submit" loading={loading} size="lg" style={{ width: '100%' }}>
            Send Reset Link
          </Button>
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
            <Link to="/login">Back to login</Link>
          </p>
        </form>
      )}
    </AuthCard>
  )
}

/* ══════════════════════════════════════════════════════════════
   RESET PASSWORD (from email link)
══════════════════════════════════════════════════════════════ */
export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [form, setForm] = useState({ new_password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.new_password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (!token) { toast.error('Invalid or missing reset token'); return }

    console.log('%c[RESET PWD] submitting reset', 'color:#a78bfa')
    setLoading(true)
    try {
      await authApi.resetPassword({ token, new_password: form.new_password })
      toast.success('Password reset! Please log in.')
      navigate('/login')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard>
      <Heading title="New password" subtitle="Choose a strong password" />
      {!token ? (
        <p style={{ color: 'var(--danger)', textAlign: 'center' }}>
          Invalid link. <Link to="/forgot-password">Request a new one.</Link>
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input label="New password" type="password" value={form.new_password}
            onChange={set('new_password')} placeholder="Min 8 chars, 1 uppercase, 1 number" required />
          <Input label="Confirm password" type="password" value={form.confirm}
            onChange={set('confirm')} placeholder="Repeat password" required />
          <Button type="submit" loading={loading} size="lg" style={{ width: '100%' }}>
            Reset Password
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
