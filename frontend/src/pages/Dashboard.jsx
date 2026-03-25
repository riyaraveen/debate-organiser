import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSessions } from '../api'
import { useAuth } from '../context/AuthContext'
import { Calendar, Clock, MapPin, Plus, Trophy } from 'lucide-react'

const STATUS_COLORS = {
  scheduled: 'badge-blue',
  draft: 'badge-gray',
  completed: 'badge-green',
  cancelled: 'badge-red',
}

function SessionCard({ session }) {
  const date = session.scheduled_at
    ? new Date(session.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'TBC'
  const time = session.scheduled_at
    ? new Date(session.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <Link to={`/sessions/${session.id}`} className="session-card">
      <div className="session-card-header">
        <span className={`badge ${STATUS_COLORS[session.status] ?? 'badge-gray'}`}>
          {session.status}
        </span>
        <span className={`badge ${session.mode === 'online' ? 'badge-purple' : 'badge-orange'}`}>
          {session.mode}
        </span>
      </div>
      <h3 className="session-card-title">{session.title}</h3>
      {session.topic_text && (
        <p className="session-card-topic">"{session.topic_text}"</p>
      )}
      <div className="session-card-meta">
        <span><Calendar size={14} /> {date}</span>
        {time && <span><Clock size={14} /> {time}</span>}
        {session.location && <span><MapPin size={14} /> {session.location}</span>}
      </div>
      {session.winner_team && (
        <div className="session-winner">
          <Trophy size={14} /> Winner: {session.winner_team}
        </div>
      )}
    </Link>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSessions()
      .then((res) => setSessions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const upcoming = sessions.filter((s) => s.status === 'scheduled')
  const past = sessions.filter((s) => s.status === 'completed')

  return (
    <div className="dashboard">
      <div className="dashboard-welcome">
        <div>
          <h2>Welcome back, {user?.name}!</h2>
          <p className="text-muted">Here's what's coming up in your debate club.</p>
        </div>
        {user?.role === 'admin' && (
          <Link to="/sessions/new" className="btn btn-primary">
            <Plus size={16} /> New Session
          </Link>
        )}
      </div>

      {!loading && (
        <div className="stats-bar">
          <div className="stat-card">
            <span className="stat-label">Upcoming</span>
            <span className="stat-value">{upcoming.length}</span>
            <span className="stat-sub">sessions scheduled</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{past.length}</span>
            <span className="stat-sub">sessions run</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total</span>
            <span className="stat-value">{sessions.length}</span>
            <span className="stat-sub">sessions total</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading sessions…</div>
      ) : (
        <>
          <section>
            <h3 className="section-title">Upcoming Sessions ({upcoming.length})</h3>
            {upcoming.length === 0 ? (
              <div className="empty-state-card">
                <span className="empty-icon">📅</span>
                <p>No upcoming sessions scheduled yet.</p>
                {user?.role === 'admin' && (
                  <Link to="/sessions/new" className="btn btn-primary">
                    <Plus size={15} /> Schedule your first session
                  </Link>
                )}
              </div>
            ) : (
              <div className="sessions-grid">
                {upcoming.map((s) => <SessionCard key={s.id} session={s} />)}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h3 className="section-title">Past Sessions</h3>
              <div className="sessions-grid">
                {past.slice(0, 4).map((s) => <SessionCard key={s.id} session={s} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
