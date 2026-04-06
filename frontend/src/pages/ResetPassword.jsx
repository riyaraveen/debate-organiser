import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { resetPassword } from '../api'
import { BookOpen, Eye, EyeOff } from 'lucide-react'

export default function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const token = new URLSearchParams(location.search).get('token') || ''
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const confirmMismatch = form.confirm && form.password !== form.confirm

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setError('')
    setLoading(true)
    try {
      await resetPassword(token, form.password)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. The link may have expired.')
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
        <h2>Set new password</h2>
        {!token && (
          <div className="alert alert-error">Invalid or missing reset token.</div>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>New password
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={form.password}
                onChange={(e) => { setForm(f => ({ ...f, password: e.target.value })); setError('') }}
                required minLength={8}
                style={{ paddingRight: '2.5rem', width: '100%' }} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <label>Confirm password
            <div style={{ position: 'relative' }}>
              <input type={showConfirm ? 'text' : 'password'} value={form.confirm}
                onChange={(e) => { setForm(f => ({ ...f, confirm: e.target.value })); setError('') }}
                required
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
          <button type="submit" className="btn btn-primary" disabled={loading || !token || !!confirmMismatch}>
            {loading ? 'Saving…' : 'Set password'}
          </button>
        </form>
        <p className="auth-link"><Link to="/login">Back to sign in</Link></p>
      </div>
    </div>
  )
}
