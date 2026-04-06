import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { register } from '../api'
import { useAuth } from '../context/AuthContext'
import { useClub } from '../context/ClubContext'
import { BookOpen, Eye, EyeOff } from 'lucide-react'

function passwordStrength(pw) {
  if (!pw) return null
  let score = 0
  if (pw.length >= 8)           score++
  if (pw.length >= 12)          score++
  if (/[A-Z]/.test(pw))         score++
  if (/[0-9]/.test(pw))         score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  if (score <= 1) return { label: 'Weak',   color: '#D02020', width: '33%'  }
  if (score <= 3) return { label: 'Fair',   color: '#D08020', width: '66%'  }
  return              { label: 'Strong', color: '#1A8040', width: '100%' }
}

export default function Register() {
  const [searchParams] = useSearchParams()
  const codeFromUrl = searchParams.get('code') || ''
  const [mode, setMode] = useState(codeFromUrl ? 'join' : 'create')
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', grade: '',
    invite_code: codeFromUrl, club_name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { loginSuccess } = useAuth()
  const { setActiveClub } = useClub()
  const navigate = useNavigate()

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setError('')
  }

  const switchMode = (m) => {
    setMode(m)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        grade: form.grade || undefined,
        ...(mode === 'join' ? { invite_code: form.invite_code } : { club_name: form.club_name }),
      }
      const res = await register(payload)
      const clubs = res.data.clubs || []
      loginSuccess(res.data.access_token, res.data.user, clubs)
      if (clubs.length === 1) {
        setActiveClub(clubs[0])
        navigate('/')
      } else {
        navigate('/club-select')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const strength = passwordStrength(form.password)
  const confirmMismatch = form.confirm && form.password !== form.confirm

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <BookOpen size={32} />
          <h1>DebateOrg</h1>
        </div>
        <h2>Join the club</h2>

        {/* Mode toggle */}
        <div style={{ display: 'flex', border: '2px solid #121212', marginBottom: 20, overflow: 'hidden' }}>
          <button type="button" onClick={() => switchMode('create')}
            style={{ flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: mode === 'create' ? '#121212' : 'var(--bg-card)',
              color: mode === 'create' ? '#fff' : 'var(--text)' }}>
            Start a new club
          </button>
          <button type="button" onClick={() => switchMode('join')}
            style={{ flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: mode === 'join' ? '#121212' : 'var(--bg-card)',
              color: mode === 'join' ? '#fff' : 'var(--text)' }}>
            Join with invite
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Full Name
            <input value={form.name} onChange={set('name')} required autoComplete="name" />
          </label>
          <label>Email
            <input type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
          </label>
          <label>Password
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={form.password}
                onChange={set('password')} required minLength={6}
                style={{ paddingRight: '2.5rem', width: '100%' }} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {strength && (
              <div style={{ marginTop: 6 }}>
                <div style={{ height: 4, background: '#e5e5e5', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: strength.width, background: strength.color, transition: 'width 0.2s, background 0.2s' }} />
                </div>
                <span style={{ fontSize: 11, color: strength.color, fontWeight: 700, marginTop: 3, display: 'block' }}>{strength.label}</span>
              </div>
            )}
          </label>
          <label>Confirm Password
            <div style={{ position: 'relative' }}>
              <input type={showConfirm ? 'text' : 'password'} value={form.confirm}
                onChange={set('confirm')} required
                style={{ paddingRight: '2.5rem', width: '100%', borderColor: confirmMismatch ? 'var(--red)' : undefined }}
                autoComplete="new-password" />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmMismatch && (
              <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, marginTop: 3, display: 'block' }}>Passwords don't match</span>
            )}
          </label>
          <label>Grade / Year (optional)
            <input value={form.grade} onChange={set('grade')} placeholder="e.g. Grade 10, Year 12" />
          </label>

          {mode === 'create' ? (
            <label>Club Name
              <input value={form.club_name} onChange={set('club_name')} placeholder="e.g. Westminster Debate Society" required />
            </label>
          ) : (
            <label>
              Invite Code
              {codeFromUrl && <span style={{ fontSize: 11, color: '#1A8040', fontWeight: 600, marginLeft: 6 }}>✓ pre-filled from link</span>}
              <input value={form.invite_code} onChange={set('invite_code')}
                placeholder="e.g. AB3X9K2M" required
                style={codeFromUrl ? { background: '#d4edda' } : {}} />
            </label>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading || !!confirmMismatch}>
            {loading ? 'Creating account…' : mode === 'create' ? 'Create account & club' : 'Join club'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
