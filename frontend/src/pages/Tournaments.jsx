import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, School, Calendar, ChevronRight } from 'lucide-react'
import { getTournaments, getSchools, createTournament } from '../api'
import PageHero from '../components/ui/PageHero'

export default function Tournaments() {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState([])
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', format: 'single_elimination', school_ids: [], scheduled_at: '' })
  // Seeding order for new tournament
  const [seedOrder, setSeedOrder] = useState([])
  const [showSeeding, setShowSeeding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getTournaments().then(r => setTournaments(r.data)),
      getSchools().then(r => setSchools(r.data)),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const toggleSchool = (id) => {
    setForm(f => {
      const next = f.school_ids.includes(id)
        ? f.school_ids.filter(x => x !== id)
        : [...f.school_ids, id]
      setSeedOrder(next)
      return { ...f, school_ids: next }
    })
  }

  const moveSeed = (idx, dir) => {
    const next = [...seedOrder]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setSeedOrder(next)
    setForm(f => ({ ...f, school_ids: next }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...form }
      if (payload.scheduled_at) payload.scheduled_at = new Date(payload.scheduled_at).toISOString()
      const res = await createTournament(payload)
      navigate(`/tournaments/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create tournament')
    }
  }

  if (loading) return <div className="loading">Loading…</div>

  return (
    <div className="page-container">
      <PageHero title="Tournaments" subtitle="Brackets & competitions" color="#121212">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <polygon points="300,4 340,72 260,72" fill="#F0C020" opacity="0.5"/>
          <polygon points="340,16 368,68 312,68" fill="#D02020" opacity="0.3"/>
          <circle cx="370" cy="88" r="55" fill="#1040C0" opacity="0.2"/>
        </svg>
      </PageHero>

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
            onChange={e => setForm({ ...form, name: e.target.value })} required />
          <textarea placeholder="Description (optional)" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            style={{ border: '2px solid #121212', padding: '8px 12px', font: 'inherit', width: '100%', resize: 'vertical', outline: 'none' }} rows={2} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%' }}>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Format
              <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })} style={{ width: '100%' }}>
                <option value="single_elimination">Single Elimination</option>
                <option value="round_robin">Round Robin</option>
              </select>
            </label>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Date
              <input type="datetime-local" value={form.scheduled_at}
                onChange={e => setForm({ ...form, scheduled_at: e.target.value })} style={{ width: '100%' }} />
            </label>
          </div>

          {/* School selection */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Select Schools</div>
            {schools.length === 0
              ? <p className="text-muted" style={{ fontSize: 13 }}>No schools added yet. <Link to="/schools" style={{ color: 'var(--blue)', fontWeight: 700 }}>Add schools first.</Link></p>
              : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {schools.map(s => (
                    <button key={s.id} type="button"
                      className={`topic-chip ${form.school_ids.includes(s.id) ? 'selected' : ''}`}
                      onClick={() => toggleSchool(s.id)}>{s.name}</button>
                  ))}
                </div>
            }
          </div>

          {/* Seeding toggle */}
          {seedOrder.length > 1 && (
            <div>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }}
                onClick={() => setShowSeeding(!showSeeding)}>
                {showSeeding ? 'Hide seeding' : 'Set seed order'}
              </button>
              {showSeeding && (
                <div style={{ marginTop: 10 }}>
                  {seedOrder.map((id, i) => {
                    const s = schools.find(sc => sc.id === id)
                    return (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, background: '#f5f5f5', border: '2px solid #121212', padding: '4px 10px', borderRadius: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 12, color: '#888', width: 20 }}>#{i + 1}</span>
                        <span style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{s?.name}</span>
                        <button type="button" className="icon-btn" onClick={() => moveSeed(i, -1)} disabled={i === 0} style={{ padding: 2 }}>▲</button>
                        <button type="button" className="icon-btn" onClick={() => moveSeed(i, 1)} disabled={i === seedOrder.length - 1} style={{ padding: 2 }}>▼</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary">Create & view bracket</button>
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
              <Link key={t.id} to={`/tournaments/${t.id}`} className="session-row"
                style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{t.name}</div>
                  {t.description && <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{t.description}</div>}
                  {schoolIds.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {schoolIds.slice(0, 5).map(id => {
                        const s = schools.find(sc => sc.id === id)
                        return s ? <span key={id} className="badge badge-purple">{s.name}</span> : null
                      })}
                      {schoolIds.length > 5 && <span className="badge badge-gray">+{schoolIds.length - 5}</span>}
                    </div>
                  )}
                </div>
                <span className={`badge ${t.status === 'active' ? 'badge-blue' : t.status === 'completed' ? 'badge-green' : 'badge-gray'}`}>{t.status}</span>
                <span className="badge badge-gray">{t.format?.replace('_', ' ')}</span>
                {t.scheduled_at && <span style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{new Date(t.scheduled_at).toLocaleDateString()}</span>}
                <ChevronRight size={16} style={{ color: '#888', flexShrink: 0 }} />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
