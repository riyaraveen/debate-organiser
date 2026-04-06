import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api'
import { BookOpen, Copy, Check } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await forgotPassword(email)
      setToken(res.data.reset_token ?? null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const resetUrl = token ? `${window.location.origin}/reset-password?token=${token}` : null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resetUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy — please copy the link manually.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <BookOpen size={32} />
          <h1>DebateOrg</h1>
        </div>
        <h2>Reset password</h2>

        {token ? (
          <div>
            <div className="alert" style={{ background: '#d4edda', border: '2px solid #121212', marginBottom: 12 }}>
              Reset link generated. Share it with the user or open it yourself.
            </div>
            <div style={{ background: 'var(--off-white)', color: 'var(--text)', border: '2px solid #121212', borderRadius: 4, padding: '10px 12px', wordBreak: 'break-all', fontSize: 13, marginBottom: 12 }}>
              {resetUrl}
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 8 }}>{error}</div>}
            <button className="btn btn-ghost" style={{ width: '100%', gap: 6 }} onClick={handleCopy}>
              {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy link</>}
            </button>
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit} className="auth-form">
              <label>Email
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} required autoComplete="email" />
              </label>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Generating…' : 'Generate reset link'}
              </button>
            </form>
          </>
        )}

        <p className="auth-link"><Link to="/login">Back to sign in</Link></p>
      </div>
    </div>
  )
}
