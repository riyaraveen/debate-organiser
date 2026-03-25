import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { Plus, Trophy, Calendar, School } from 'lucide-react'

function BracketView({ bracket, schools }) {
  if (!bracket) return <p className="text-muted">No bracket generated yet.</p>
  const data = typeof bracket === 'string' ? JSON.parse(bracket) : bracket
  const schoolName = (id) => id ? (schools.find((s) => s.id === id)?.name ?? `School #${id}`) : 'BYE'

  if (data.format === 'round_robin') {
    return (
      <div className="bracket-rr">
        <h5 className="bracket-subtitle">Round Robin Matches</h5>
        {data.matches?.map((m, i) => (
          <div key={i} className="bracket-match">
            <span>{schoolName(m.team_a)}</span>
            <span className="bracket-vs">vs</span>
            <span>{schoolName(m.team_b)}</span>
            {m.winner && <span className="badge badge-green">{schoolName(m.winner)}</span>}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bracket-se">
      {data.rounds?.map((round) => (
        <div key={round.round} className="bracket-round">
          <div className="bracket-round-label">Round {round.round}</div>
          {round.matches?.map((m, i) => (
            <div key={i} className="bracket-match">
              <span className={m.winner === m.team_a ? 'bracket-winner' : ''}>{schoolName(m.team_a)}</span>
              <span className="bracket-vs">vs</span>
              <span className={m.winner === m.team_b ? 'bracket-winner' : ''}>{schoolName(m.team_b)}</span>
              {m.winner && <span className="badge badge-green">✓</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([])
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', format: 'single_elimination', school_ids: [], scheduled_at: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/api/tournaments/').then(r => setTournaments(r.data)),
      api.get('/api/schools/').then(r => setSchools(r.data)),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const toggleSchool = (id) => {
    setForm(f => ({
      ...f,
      school_ids: f.school_ids.includes(id) ? f.school_ids.filter(x => x !== id) : [...f.school_ids, id]
    }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...form }
      if (payload.scheduled_at) payload.scheduled_at = new Date(payload.scheduled_at).toISOString()
      const res = await api.post('/api/tournaments/', payload)
      setTournaments(prev => [res.data, ...prev])
      setShowCreate(false)
      setForm({ name: '', description: '', format: 'single_elimination', school_ids: [], scheduled_at: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create tournament')
    }
  }

  if (loading) return <div className="loading">Loading…</div>

  return (
    <div className="page-container">
      <div className="page-top-bar">
        <span className="text-muted" style={{ fontSize: 13 }}>{tournaments.length} tournaments · {schools.length} schools</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/schools" className="btn btn-ghost"><School size={14} /> Manage Schools</Link>
          <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}><Plus size={15} /> New Tournament</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showCreate && (
        <form className="add-topic-form form-stack" style={{ flexDirection: 'column' }} onSubmit={handleCreate}>
          <h4 style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 13 }}>New Tournament</h4>
          <input className="input" placeholder="Tournament name *" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <textarea placeholder="Description (optional)" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ border: '2px solid #121212', padding: '8px 12px', font: 'inherit', width: '100%', resize: 'vertical', outline: 'none' }} rows={2} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <label style={{ flex: 1 }}>Format
              <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                <option value="single_elimination">Single Elimination</option>
                <option value="round_robin">Round Robin</option>
              </select>
            </label>
            <label style={{ flex: 1 }}>Date
              <input type="datetime-local" value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </label>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Select Schools</div>
            {schools.length === 0 ? <p className="text-muted" style={{ fontSize: 13 }}>No schools added yet. <Link to="/schools" style={{ color: 'var(--blue)', fontWeight: 700 }}>Add schools first.</Link></p> : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {schools.map(s => (
                  <button key={s.id} type="button"
                    className={`topic-chip ${form.school_ids.includes(s.id) ? 'selected' : ''}`}
                    onClick={() => toggleSchool(s.id)}>{s.name}</button>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary">Create Tournament</button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </form>
      )}

      {tournaments.length === 0 ? (
        <div className="empty-state-card">
          <span className="empty-icon">🏆</span>
          <p>No tournaments yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="sessions-list">
          {tournaments.map(t => {
            const schoolIds = t.school_ids ? JSON.parse(t.school_ids) : []
            return (
              <div key={t.id} className="session-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{t.name}</div>
                    {t.description && <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{t.description}</div>}
                  </div>
                  <span className={`badge ${t.status === 'active' ? 'badge-blue' : t.status === 'completed' ? 'badge-green' : 'badge-gray'}`}>{t.status}</span>
                  <span className="badge badge-gray">{t.format?.replace('_', ' ')}</span>
                  {t.scheduled_at && <span style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{new Date(t.scheduled_at).toLocaleDateString()}</span>}
                  <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
                    {expanded === t.id ? 'Hide Bracket' : 'View Bracket'}
                  </button>
                </div>
                {schoolIds.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {schoolIds.map(id => {
                      const s = schools.find(s => s.id === id)
                      return s ? <span key={id} className="badge badge-purple">{s.name}</span> : null
                    })}
                  </div>
                )}
                {expanded === t.id && (
                  <div style={{ width: '100%', borderTop: '2px solid #121212', paddingTop: 12 }}>
                    <BracketView bracket={t.bracket} schools={schools} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
