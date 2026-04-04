import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useClub } from '../context/ClubContext'
import { createClub } from '../api'
import { BookOpen, Plus, ChevronRight } from 'lucide-react'

export default function ClubSelect() {
  const { clubs, loginSuccess, user } = useAuth()
  const { setActiveClub } = useClub()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [clubName, setClubName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectClub = (club) => {
    setActiveClub(club)
    navigate('/')
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await createClub({ name: clubName })
      const newClub = res.data
      setActiveClub(newClub)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create club')
    } finally {
      setLoading(false)
    }
  }

  const roleLabel = (role) => {
    if (role === 'owner') return 'Owner'
    if (role === 'admin') return 'Admin'
    return 'Member'
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 420 }}>
        <div className="auth-logo">
          <BookOpen size={32} />
          <h1>DebateOrg</h1>
        </div>
        <h2 style={{ marginBottom: 4 }}>Select your club</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          {clubs.length === 0 ? 'You are not in any club yet.' : 'Choose which club to enter.'}
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        {clubs.map((club) => (
          <button
            key={club.id}
            onClick={() => selectClub(club)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '14px 16px', marginBottom: 10,
              border: '2px solid #121212', background: '#fff', cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{club.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{roleLabel(club.role)}</div>
            </div>
            <ChevronRight size={18} />
          </button>
        ))}

        {!showCreate ? (
          <button
            className="btn btn-ghost"
            style={{ width: '100%', marginTop: 4, fontSize: 13 }}
            onClick={() => setShowCreate(true)}
          >
            <Plus size={14} /> Create a new club
          </button>
        ) : (
          <form onSubmit={handleCreate} style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
              Club name
              <input
                className="input"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="e.g. Westminster Debate Society"
                required
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              />
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Creating…' : 'Create club'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
