import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/useAuth'
import { authApi } from '../api'
import { AppShell, TopHeader } from '../components/layout'
import { Card, Button, Input, Select, Avatar } from '../components/ui'
import { getErrorMessage } from '../utils'

const SettingsPage = () => {
  const { user, updateUser } = useAuth()

  // ── Profile form ─────────────────────────────────────────────
  const [profile, setProfile] = useState({
    first_name:   user?.first_name   || '',
    last_name:    user?.last_name    || '',
    age:          user?.age          || '',
    gender:       user?.gender       || '',
    phone_number: user?.phone_number || '',
  })
  const [savingProfile, setSavingProfile] = useState(false)

  const setP = (k) => (e) => setProfile(f => ({ ...f, [k]: e.target.value }))

  const handleProfileSave = async (e) => {
    e.preventDefault()
    console.log('%c[SETTINGS] saving profile', 'color:#a78bfa', profile)
    setSavingProfile(true)
    try {
      const { data } = await authApi.updateMe({ ...profile, age: Number(profile.age) || undefined })
      updateUser(data.data.user)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Change password form ──────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    current_password: '', new_password: '', confirm: '',
  })
  const [savingPw, setSavingPw] = useState(false)
  const [pwErrors, setPwErrors] = useState({})

  const setPw = (k) => (e) => setPwForm(f => ({ ...f, [k]: e.target.value }))

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!pwForm.current_password) errs.current_password = 'Required'
    if (pwForm.new_password.length < 8) errs.new_password = 'Min 8 characters'
    if (pwForm.new_password !== pwForm.confirm) errs.confirm = 'Passwords do not match'
    if (Object.keys(errs).length) { setPwErrors(errs); return }

    console.log('%c[SETTINGS] changing password', 'color:#a78bfa')
    setSavingPw(true)
    try {
      await authApi.changePassword({
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      })
      toast.success('Password changed!')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
      setPwErrors({})
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <AppShell>
      <TopHeader title="Settings" />

      <div style={{ padding: '28px', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Profile Card */}
        <Card style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <Avatar firstName={user?.first_name} lastName={user?.last_name} size={54} />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 500 }}>{user?.first_name} {user?.last_name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user?.email}</div>
            </div>
          </div>

          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input label="First name" value={profile.first_name} onChange={setP('first_name')} required />
              <Input label="Last name"  value={profile.last_name}  onChange={setP('last_name')}  required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input label="Age" type="number" value={profile.age}
                onChange={setP('age')} min="13" max="120" />
              <Select label="Gender" value={profile.gender} onChange={setP('gender')}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </Select>
            </div>
            <Input label="Phone number" value={profile.phone_number}
              onChange={setP('phone_number')} placeholder="+91 98765 43210" />

            {/* Read-only email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Email</label>
              <div style={{
                padding: '9px 13px', background: 'var(--bg-elevated)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                fontSize: '14px', color: 'var(--text-muted)',
              }}>
                {user?.email}
                <span style={{ marginLeft: '8px', fontSize: '11px' }}>(cannot be changed)</span>
              </div>
            </div>

            <Button type="submit" loading={savingProfile} style={{ alignSelf: 'flex-end' }}>
              Save Profile
            </Button>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card style={{ padding: '26px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '18px' }}>Change Password</h3>
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input label="Current password" type="password"
              value={pwForm.current_password} onChange={setPw('current_password')}
              error={pwErrors.current_password} required />
            <Input label="New password" type="password"
              value={pwForm.new_password} onChange={setPw('new_password')}
              error={pwErrors.new_password}
              hint="Min 8 chars, 1 uppercase, 1 number" required />
            <Input label="Confirm new password" type="password"
              value={pwForm.confirm} onChange={setPw('confirm')}
              error={pwErrors.confirm} required />
            <Button type="submit" loading={savingPw} style={{ alignSelf: 'flex-end' }}>
              Change Password
            </Button>
          </form>
        </Card>

        {/* Account info */}
        <Card style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: 'var(--text-secondary)' }}>
            Account Info
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'User ID',  value: `#${user?.id}` },
              { label: 'Member since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
              { label: 'Account status', value: user?.is_active ? '✅ Active' : '🔴 Inactive' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

export default SettingsPage
