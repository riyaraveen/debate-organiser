import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSessions } from '../api'
import { useAuth } from '../context/AuthContext'
import { Plus, Calendar, Clock, MapPin, Trophy } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

const STATUS_COLORS = {
  scheduled: 'badge-blue',
  draft: 'badge-gray',
  completed: 'badge-green',
  cancelled: 'badge-red',
}

export default function Sessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSessions()
      .then((res) => setSessions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? sessions : sessions.filter((s) => s.status === filter)

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
      <div className="page-top-bar">
        <div className="filter-tabs">
          {['all', 'scheduled', 'completed', 'draft'].map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {user?.role === 'admin' && (
          <Link to="/sessions/new" className="btn btn-primary">
            <Plus size={16} /> New Session
          </Link>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : filtered.length === 0 ? (
        <p className="empty-state">No sessions found.</p>
      ) : (
        <div className="sessions-list">
          {filtered.map((s) => {
            const date = s.scheduled_at
              ? new Date(s.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'TBC'
            const time = s.scheduled_at
              ? new Date(s.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              : ''
            return (
              <Link key={s.id} to={`/sessions/${s.id}`} className="session-row">
                <div className="session-row-left">
                  <span className={`badge ${STATUS_COLORS[s.status] ?? 'badge-gray'}`}>{s.status}</span>
                  <span className={`badge ${s.mode === 'online' ? 'badge-purple' : 'badge-orange'}`}>{s.mode}</span>
                </div>
                <div className="session-row-body">
                  <h4>{s.title}</h4>
                  {s.topic_text && <p className="text-muted">"{s.topic_text}"</p>}
                </div>
                <div className="session-row-meta">
                  <span><Calendar size={13} /> {date}</span>
                  {time && <span><Clock size={13} /> {time}</span>}
                  {s.location && <span><MapPin size={13} /> {s.location}</span>}
                  {s.winner_team && <span><Trophy size={13} /> {s.winner_team}</span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
