import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { register } from '../api'
import { useAuth } from '../context/AuthContext'
import { useClub } from '../context/ClubContext'
import { BookOpen, Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const [searchParams] = useSearchParams()
  const codeFromUrl = searchParams.get('code') || ''
  const [mode, setMode] = useState(codeFromUrl ? 'join' : 'create')
  const [form, setForm] = useState({
    name: '', email: '', password: '', grade: '',
    invite_code: codeFromUrl, club_name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { loginSuccess } = useAuth()
  const { setActiveClub } = useClub()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
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
      // Auto-select the only club
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

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

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
          <button
            type="button"
            onClick={() => setMode('create')}
            style={{
              flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: mode === 'create' ? '#121212' : '#fff',
              color: mode === 'create' ? '#fff' : '#121212',
            }}
          >
            Start a new club
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            style={{
              flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: mode === 'join' ? '#121212' : '#fff',
              color: mode === 'join' ? '#fff' : '#121212',
            }}
          >
            Join with invite
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Full Name
            <input value={form.name} onChange={set('name')} required />
          </label>
          <label>Email
            <input type="email" value={form.email} onChange={set('email')} required />
          </label>
          <label>Password
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={form.password}
                onChange={set('password')} required minLength={6}
                style={{ paddingRight: '2.5rem', width: '100%' }} />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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

          <button type="submit" className="btn btn-primary" disabled={loading}>
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
