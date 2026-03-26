import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSessions, getUsers, getTopics } from '../api'
import { useAuth } from '../context/AuthContext'
import { Calendar, Clock, MapPin, Plus, Trophy, Users, BookOpen, Zap, Star, ArrowRight } from 'lucide-react'

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
        <span className={`badge ${STATUS_COLORS[session.status] ?? 'badge-gray'}`}>{session.status}</span>
        <span className={`badge ${session.mode === 'online' ? 'badge-purple' : 'badge-orange'}`}>{session.mode}</span>
      </div>
      <h3 className="session-card-title">{session.title}</h3>
      {session.topic_text && <p className="session-card-topic">"{session.topic_text}"</p>}
      <div className="session-card-meta">
        <span><Calendar size={14} /> {date}</span>
        {time && <span><Clock size={14} /> {time}</span>}
        {session.location && <span><MapPin size={14} /> {session.location}</span>}
      </div>
      {session.winner_team && (
        <div className="session-winner"><Trophy size={14} /> Winner: {session.winner_team}</div>
      )}
    </Link>
  )
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="stat-card" style={accent ? { borderLeftColor: accent, borderLeftWidth: '4px' } : {}}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-sub">{sub}</span>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [memberCount, setMemberCount] = useState(null)
  const [topicCount, setTopicCount] = useState(null)
  const [spotlightTopic, setSpotlightTopic] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getSessions(),
      getUsers().catch(() => ({ data: [] })),
      getTopics({ is_go: true }).catch(() => ({ data: [] })),
    ]).then(([sessRes, usersRes, topicsRes]) => {
      setSessions(sessRes.data)
      setMemberCount(usersRes.data.length)
      const goTopics = topicsRes.data
      setTopicCount(goTopics.length)
      if (goTopics.length > 0) {
        setSpotlightTopic(goTopics[Math.floor(Math.random() * goTopics.length)])
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const upcoming = sessions.filter((s) => s.status === 'scheduled')
  const past = sessions.filter((s) => s.status === 'completed')
  const nextSession = upcoming[0] ?? null

  const quickActions = [
    { label: 'New Session', to: '/sessions/new', icon: Plus, color: '#3B44F6' },
    { label: 'Add Topic', to: '/topics', icon: BookOpen, color: '#E63946' },
    { label: 'AI Practice', to: '/practice', icon: Zap, color: '#F4A261' },
    { label: 'View Members', to: '/members', icon: Users, color: '#2A9D8F' },
  ]

  return (
    <div className="dashboard">
      {/* Welcome banner */}
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

      {/* Stats bar */}
      {!loading && (
        <div className="stats-bar">
          <StatCard label="Upcoming" value={upcoming.length} sub="sessions scheduled" accent="#3B44F6" />
          <StatCard label="Completed" value={past.length} sub="sessions run" accent="#2A9D8F" />
          <StatCard label="Members" value={memberCount ?? '—'} sub="in the club" accent="#F4A261" />
          <StatCard label="Topics" value={topicCount ?? '—'} sub="ready to use" accent="#E63946" />
        </div>
      )}

      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <div className="dashboard-grid">
          {/* Left column */}
          <div className="dashboard-main">

            {/* Next session spotlight */}
            {nextSession && (
              <section style={{ marginBottom: '28px' }}>
                <h3 className="section-title">Next Session</h3>
                <Link to={`/sessions/${nextSession.id}`} className="dashboard-spotlight-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <span className={`badge ${STATUS_COLORS[nextSession.status] ?? 'badge-gray'}`}>{nextSession.status}</span>
                        <span className={`badge ${nextSession.mode === 'online' ? 'badge-purple' : 'badge-orange'}`}>{nextSession.mode}</span>
                      </div>
                      <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '6px' }}>{nextSession.title}</h2>
                      {nextSession.topic_text && (
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '10px' }}>
                          "{nextSession.topic_text}"
                        </p>
                      )}
                      <div className="session-card-meta">
                        {nextSession.scheduled_at && (
                          <>
                            <span><Calendar size={14} /> {new Date(nextSession.scheduled_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                            <span><Clock size={14} /> {new Date(nextSession.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                          </>
                        )}
                        {nextSession.location && <span><MapPin size={14} /> {nextSession.location}</span>}
                      </div>
                    </div>
                    <ArrowRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                </Link>
              </section>
            )}

            {/* All upcoming sessions */}
            <section style={{ marginBottom: '28px' }}>
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

            {/* Past sessions */}
            {past.length > 0 && (
              <section>
                <h3 className="section-title">Recent Sessions</h3>
                <div className="sessions-grid">
                  {past.slice(0, 4).map((s) => <SessionCard key={s.id} session={s} />)}
                </div>
                {past.length > 4 && (
                  <Link to="/sessions" style={{ display: 'block', marginTop: '12px', fontSize: '13px', fontWeight: 700, textDecoration: 'underline' }}>
                    View all {past.length} past sessions →
                  </Link>
                )}
              </section>
            )}
          </div>

          {/* Right column */}
          <div className="dashboard-sidebar">

            {/* Quick actions (admin only) */}
            {user?.role === 'admin' && (
              <section style={{ marginBottom: '24px' }}>
                <h3 className="section-title">Quick Actions</h3>
                <div className="quick-actions-grid">
                  {quickActions.map(({ label, to, icon: Icon, color }) => (
                    <Link key={label} to={to} className="quick-action-btn" style={{ '--qa-color': color }}>
                      <Icon size={18} />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Topic spotlight */}
            {spotlightTopic && (
              <section style={{ marginBottom: '24px' }}>
                <h3 className="section-title"><Star size={14} style={{ display: 'inline', marginRight: '6px' }} />Topic Spotlight</h3>
                <div className="dashboard-topic-spotlight">
                  <p className="spotlight-topic-text">"{spotlightTopic.text}"</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {spotlightTopic.category && <span className="badge badge-gray">{spotlightTopic.category}</span>}
                    {spotlightTopic.proficiency && <span className="badge badge-blue">{spotlightTopic.proficiency}</span>}
                  </div>
                  <Link to="/topics" style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginTop: '10px' }}>
                    Browse all topics →
                  </Link>
                </div>
              </section>
            )}

            {/* Getting started checklist (shown when club is new) */}
            {sessions.length === 0 && (
              <section>
                <h3 className="section-title">Getting Started</h3>
                <div className="dashboard-checklist">
                  {[
                    { label: 'Add your club members', to: '/members', done: (memberCount ?? 0) > 1 },
                    { label: 'Review debate formats', to: '/formats', done: false },
                    { label: 'Build your topic bank', to: '/topics', done: (topicCount ?? 0) > 0 },
                    { label: 'Schedule your first session', to: '/sessions/new', done: false },
                    { label: 'Try AI Practice mode', to: '/practice', done: false },
                  ].map(({ label, to, done }) => (
                    <Link key={label} to={to} className={`checklist-item ${done ? 'done' : ''}`}>
                      <span className="checklist-dot">{done ? '✓' : ''}</span>
                      <span>{label}</span>
                      <ArrowRight size={13} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
