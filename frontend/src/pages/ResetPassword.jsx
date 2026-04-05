import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { resetPassword } from '../api'
import { BookOpen } from 'lucide-react'

export default function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const token = new URLSearchParams(location.search).get('token') || ''
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
            <input type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          </label>
          <label>Confirm password
            <input type="password" value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading || !token}>
            {loading ? 'Saving…' : 'Set password'}
          </button>
        </form>
        <p className="auth-link"><Link to="/login">Back to sign in</Link></p>
      </div>
    </div>
  )
}
