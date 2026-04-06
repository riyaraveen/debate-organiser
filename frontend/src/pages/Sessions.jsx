import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSessions, getFormats } from '../api'
import { useAuth } from '../context/AuthContext'
import { Plus, Calendar, Clock, MapPin, Trophy, Timer, Search, Users } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

const STATUS_COLORS = {
  scheduled: 'badge-blue',
  draft:     'badge-gray',
  completed: 'badge-green',
  cancelled: 'badge-red',
}

// Compare calendar dates (not elapsed ms) to avoid time-of-day rounding errors
function countdown(scheduledAt) {
  if (!scheduledAt) return null
  const d = new Date(scheduledAt)
  const today = new Date()
  const sessionDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const todayDay   = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diff = Math.round((sessionDay - todayDay) / 86400000)
  if (diff === 0)  return 'Today'
  if (diff === 1)  return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1)    return `In ${diff} days`
  return `${Math.abs(diff)} days ago`
}

const STATUS_FILTERS = ['all', 'scheduled', 'completed', 'draft', 'cancelled']

export default function Sessions() {
  const { user }   = useAuth()
  const [sessions, setSessions] = useState([])
  const [formats,  setFormats]  = useState({})   // id → name
  const [filter,   setFilter]   = useState('all')
  const [mineOnly, setMineOnly] = useState(false)
  const [sort,     setSort]     = useState('newest')
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      getSessions(),
      getFormats().catch(() => ({ data: [] })),
    ]).then(([sessRes, fmtRes]) => {
      setSessions(sessRes.data)
      const map = {}
      fmtRes.data.forEach(f => { map[f.id] = f.name })
      setFormats(map)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = sessions
    .filter(s => filter === 'all' || s.status === filter)
    .filter(s => !mineOnly || s.participants?.some(p => p.user_id === user?.id))
    .filter(s => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return s.title.toLowerCase().includes(q) || s.topic_text?.toLowerCase().includes(q)
    })
    .slice()
    .sort((a, b) => {
      const da  = a.scheduled_at ? new Date(a.scheduled_at) : new Date(0)
      const db2 = b.scheduled_at ? new Date(b.scheduled_at) : new Date(0)
      return sort === 'newest' ? db2 - da : da - db2
    })

  return (
    <div className="page-container">
      <PageHero title="Sessions" subtitle="All debate sessions" color="#1040C0">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <circle cx="340" cy="-10" r="90" fill="white" opacity="0.08"/>
          <circle cx="380" cy="88" r="70" fill="#F0C020" opacity="0.18"/>
          <rect x="180" y="15" width="58" height="58" fill="white" opacity="0.07" transform="rotate(15 209 44)"/>
          <circle cx="220" cy="44" r="28" fill="white" opacity="0.07"/>
        </svg>
      </PageHero>

      <div className="page-top-bar" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="filter-tabs">
            {STATUS_FILTERS.map(f => (
              <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button
            className={`btn ${mineOnly ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 12, padding: '7px 14px' }}
            onClick={() => setMineOnly(v => !v)}
          >
            My Sessions
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}/>
            <input
              type="search"
              placeholder="Search sessions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 28, fontSize: 13, width: 220 }}
            />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ fontSize: 13, padding: '6px 10px', border: '2px solid #121212', background: 'var(--bg-card)', color: 'var(--text)', cursor: 'pointer' }}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          {user?.role === 'admin' && (
            <Link to="/sessions/new" className="btn btn-primary">
              <Plus size={16}/> New Session
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-illustration">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect x="12" y="8" width="56" height="64" rx="2" stroke="#121212" strokeWidth="3" fill="none"/>
            <rect x="22" y="24" width="36" height="4" rx="1" fill="#121212"/>
            <rect x="22" y="36" width="28" height="4" rx="1" fill="#121212"/>
            <rect x="22" y="48" width="32" height="4" rx="1" fill="#121212"/>
            <circle cx="22" cy="14" r="4" fill="#F0C020" stroke="#121212" strokeWidth="2"/>
            <circle cx="58" cy="14" r="4" fill="#1040C0" stroke="#121212" strokeWidth="2"/>
          </svg>
          <h3>No sessions found</h3>
          <p>{search ? `No results for "${search}".` : filter !== 'all' ? `No ${filter} sessions.` : 'Create your first debate session to get started.'}</p>
        </div>
      ) : (
        <div className="sessions-list">
          {filtered.map(s => {
            const date = s.scheduled_at
              ? new Date(s.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'TBC'
            const time = s.scheduled_at
              ? new Date(s.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              : ''
            const cd = countdown(s.scheduled_at)
            const isToday = cd === 'Today'
            return (
              <Link key={s.id} to={`/sessions/${s.id}`} className="session-row">
                <div className="session-row-left">
                  {isToday && <span className="badge badge-yellow">TODAY</span>}
                  <span className={`badge ${STATUS_COLORS[s.status] ?? 'badge-gray'}`}>{s.status}</span>
                  <span className={`badge ${s.mode === 'online' ? 'badge-purple' : 'badge-orange'}`}>{s.mode}</span>
                </div>
                <div className="session-row-body">
                  <h4>{s.title}</h4>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 2 }}>
                    {s.topic_text && <p className="text-muted" style={{ margin: 0 }}>"{s.topic_text}"</p>}
                    {formats[s.format_id] && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                        {formats[s.format_id]}
                      </span>
                    )}
                  </div>
                </div>
                <div className="session-row-meta">
                  <span><Calendar size={13}/> {date}</span>
                  {time && <span><Clock size={13}/> {time}</span>}
                  {s.location && <span><MapPin size={13}/> {s.location}</span>}
                  {s.winner_team && <span><Trophy size={13}/> {s.winner_team}</span>}
                  {s.participants?.length > 0 && (
                    <span><Users size={13}/> {s.participants.length}</span>
                  )}
                  {s.scheduled_at && s.status !== 'completed' && s.status !== 'cancelled' && cd && (
                    <span style={{ color: isToday ? 'var(--red)' : 'var(--blue)', fontWeight: 600 }}>
                      <Timer size={13}/> {cd}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
