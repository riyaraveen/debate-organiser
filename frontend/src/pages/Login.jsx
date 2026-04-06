import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { login } from '../api'
import { useAuth } from '../context/AuthContext'
import { BookOpen, Eye, EyeOff } from 'lucide-react'

const REMEMBER_KEY = 'debate_remember_email'

export default function Login() {
  const [form, setForm] = useState({ email: localStorage.getItem(REMEMBER_KEY) || '', password: '' })
  const [remember, setRemember] = useState(!!localStorage.getItem(REMEMBER_KEY))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { loginSuccess } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const sessionExpired = new URLSearchParams(location.search).get('reason') === 'expired'
  const from = location.state?.from?.pathname || '/club-select'

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(form.email, form.password)
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, form.email)
      } else {
        localStorage.removeItem(REMEMBER_KEY)
      }
      loginSuccess(res.data.access_token, res.data.user, res.data.clubs || [])
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <BookOpen size={32} />
          <h1>DebateOrg</h1>
        </div>
        <h2>Sign in to your club</h2>
        {sessionExpired && (
          <div className="alert" style={{ background: '#FFF3CD', border: '2px solid #121212', marginBottom: 12 }}>
            Your session expired. Please sign in again.
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email
            <input type="email" value={form.email} onChange={handleChange('email')} required autoComplete="email" />
          </label>
          <label>Password
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={form.password}
                onChange={handleChange('password')}
                style={{ paddingRight: '2.5rem', width: '100%' }} required autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: -4 }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 'auto', marginTop: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Remember my email</span>
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
        <p className="auth-link">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
      </div>
    </div>
  )
}
