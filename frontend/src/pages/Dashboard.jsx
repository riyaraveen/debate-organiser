import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSessions, getUsers, getTopics } from '../api'
import { useAuth } from '../context/AuthContext'
import { Calendar, Clock, MapPin, Plus, Trophy, Users, BookOpen, Zap, Star, ArrowRight } from 'lucide-react'

/* ── Bauhaus SVG Illustrations ─────────────────────────────────────────── */

function WelcomeBannerIllustration() {
  return (
    <svg width="180" height="90" viewBox="0 0 180 90" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', right: '80px', bottom: 0, opacity: 0.22, pointerEvents: 'none' }}>
      {/* Large speech bubble */}
      <rect x="4" y="4" width="90" height="58" rx="6" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="3"/>
      <polygon points="20,62 40,62 28,78" fill="#FFFFFF"/>
      {/* Lines inside bubble */}
      <line x1="16" y1="22" x2="80" y2="22" stroke="#121212" strokeWidth="3" strokeLinecap="round"/>
      <line x1="16" y1="34" x2="72" y2="34" stroke="#121212" strokeWidth="3" strokeLinecap="round"/>
      <line x1="16" y1="46" x2="60" y2="46" stroke="#121212" strokeWidth="3" strokeLinecap="round"/>
      {/* Small overlapping speech bubble */}
      <rect x="84" y="18" width="68" height="44" rx="6" fill="#F0C020" stroke="#F0C020" strokeWidth="3"/>
      <polygon points="126,62 144,62 136,76" fill="#F0C020"/>
      {/* Lines inside small bubble */}
      <line x1="96" y1="32" x2="140" y2="32" stroke="#121212" strokeWidth="3" strokeLinecap="round"/>
      <line x1="96" y1="44" x2="128" y2="44" stroke="#121212" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

function EmptyDebateIllustration() {
  return (
    <svg width="260" height="170" viewBox="0 0 260 170" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ margin: '0 auto 16px', display: 'block' }}>
      {/* Stage floor */}
      <rect x="10" y="148" width="240" height="12" fill="#121212"/>

      {/* Left podium */}
      <rect x="18" y="102" width="52" height="46" fill="#F0C020" stroke="#121212" strokeWidth="2.5"/>
      <rect x="24" y="108" width="40" height="4" fill="#121212"/>
      <rect x="24" y="116" width="40" height="2" fill="#121212" opacity="0.3"/>
      <rect x="24" y="122" width="30" height="2" fill="#121212" opacity="0.3"/>

      {/* Left figure */}
      {/* Body */}
      <rect x="28" y="66" width="32" height="38" rx="2" fill="#1040C0" stroke="#121212" strokeWidth="2.5"/>
      {/* Left arm raised */}
      <line x1="28" y1="74" x2="14" y2="58" stroke="#121212" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="13" cy="56" r="4" fill="#F0C020" stroke="#121212" strokeWidth="2"/>
      {/* Right arm */}
      <line x1="60" y1="78" x2="72" y2="86" stroke="#121212" strokeWidth="3" strokeLinecap="round"/>
      {/* Head */}
      <circle cx="44" cy="54" r="14" fill="#FFFFFF" stroke="#121212" strokeWidth="2.5"/>
      {/* Face */}
      <circle cx="40" cy="51" r="2" fill="#121212"/>
      <circle cx="48" cy="51" r="2" fill="#121212"/>
      <path d="M40 58 Q44 62 48 58" stroke="#121212" strokeWidth="2" strokeLinecap="round" fill="none"/>

      {/* Left speech bubble */}
      <rect x="68" y="12" width="60" height="40" rx="6" fill="#FFFFFF" stroke="#121212" strokeWidth="2.5"/>
      <polygon points="72,52 86,52 76,64" fill="#FFFFFF" stroke="#121212" strokeWidth="2" strokeLinejoin="round"/>
      <line x1="80" y1="26" x2="118" y2="26" stroke="#121212" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="80" y1="36" x2="112" y2="36" stroke="#121212" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="80" y1="44" x2="104" y2="44" stroke="#121212" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>

      {/* VS circle */}
      <circle cx="130" cy="120" r="18" fill="#121212" stroke="#121212" strokeWidth="2"/>
      <text x="130" y="125" textAnchor="middle" fill="#F0C020" fontSize="11" fontWeight="900" fontFamily="monospace">VS</text>

      {/* Right podium */}
      <rect x="190" y="102" width="52" height="46" fill="#D02020" stroke="#121212" strokeWidth="2.5"/>
      <rect x="196" y="108" width="40" height="4" fill="#121212"/>
      <rect x="196" y="116" width="40" height="2" fill="#121212" opacity="0.3"/>
      <rect x="196" y="122" width="30" height="2" fill="#121212" opacity="0.3"/>

      {/* Right figure */}
      {/* Body */}
      <rect x="200" y="66" width="32" height="38" rx="2" fill="#1040C0" stroke="#121212" strokeWidth="2.5"/>
      {/* Right arm raised */}
      <line x1="232" y1="74" x2="246" y2="58" stroke="#121212" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="247" cy="56" r="4" fill="#F0C020" stroke="#121212" strokeWidth="2"/>
      {/* Left arm */}
      <line x1="200" y1="78" x2="188" y2="86" stroke="#121212" strokeWidth="3" strokeLinecap="round"/>
      {/* Head */}
      <circle cx="216" cy="54" r="14" fill="#FFFFFF" stroke="#121212" strokeWidth="2.5"/>
      {/* Face */}
      <circle cx="212" cy="51" r="2" fill="#121212"/>
      <circle cx="220" cy="51" r="2" fill="#121212"/>
      <path d="M212 58 Q216 62 220 58" stroke="#121212" strokeWidth="2" strokeLinecap="round" fill="none"/>

      {/* Right speech bubble */}
      <rect x="132" y="12" width="60" height="40" rx="6" fill="#F0C020" stroke="#121212" strokeWidth="2.5"/>
      <polygon points="174,52 188,52 184,64" fill="#F0C020" stroke="#121212" strokeWidth="2" strokeLinejoin="round"/>
      <line x1="144" y1="26" x2="182" y2="26" stroke="#121212" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="144" y1="36" x2="176" y2="36" stroke="#121212" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="144" y1="44" x2="168" y2="44" stroke="#121212" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}

function TopicLightbulbIllustration() {
  return (
    <svg width="52" height="64" viewBox="0 0 52 64" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}>
      {/* Bulb */}
      <path d="M26 4 C14 4 6 12 6 22 C6 30 11 36 16 40 L16 50 L36 50 L36 40 C41 36 46 30 46 22 C46 12 38 4 26 4Z"
        fill="#F0C020" stroke="#121212" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* Base segments */}
      <rect x="16" y="50" width="20" height="5" fill="#FFFFFF" stroke="#121212" strokeWidth="2"/>
      <rect x="18" y="55" width="16" height="5" fill="#FFFFFF" stroke="#121212" strokeWidth="2"/>
      {/* Shine lines inside bulb */}
      <line x1="20" y1="16" x2="20" y2="28" stroke="#121212" strokeWidth="2" strokeLinecap="round" opacity="0.35"/>
      <line x1="26" y1="12" x2="26" y2="30" stroke="#121212" strokeWidth="2" strokeLinecap="round" opacity="0.35"/>
      <line x1="32" y1="16" x2="32" y2="28" stroke="#121212" strokeWidth="2" strokeLinecap="round" opacity="0.35"/>
      {/* Rays */}
      <line x1="4" y1="10" x2="10" y2="16" stroke="#121212" strokeWidth="2" strokeLinecap="round"/>
      <line x1="2" y1="22" x2="8" y2="22" stroke="#121212" strokeWidth="2" strokeLinecap="round"/>
      <line x1="48" y1="10" x2="42" y2="16" stroke="#121212" strokeWidth="2" strokeLinecap="round"/>
      <line x1="50" y1="22" x2="44" y2="22" stroke="#121212" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function GettingStartedIllustration() {
  return (
    <svg width="64" height="56" viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}>
      {/* Trophy cup */}
      <rect x="20" y="36" width="24" height="6" fill="#F0C020" stroke="#121212" strokeWidth="2.5"/>
      <rect x="14" y="42" width="36" height="6" fill="#F0C020" stroke="#121212" strokeWidth="2.5"/>
      {/* Cup body */}
      <path d="M14 8 L14 36 Q14 42 32 42 Q50 42 50 36 L50 8 Z"
        fill="#F0C020" stroke="#121212" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* Cup handles */}
      <path d="M14 14 Q4 14 4 22 Q4 30 14 30" stroke="#121212" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M50 14 Q60 14 60 22 Q60 30 50 30" stroke="#121212" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Star */}
      <polygon points="32,14 34,20 40,20 35,24 37,30 32,26 27,30 29,24 24,20 30,20"
        fill="#FFFFFF" stroke="#121212" strokeWidth="1.5"/>
    </svg>
  )
}

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
      <div className="dashboard-welcome" style={{ position: 'relative', overflow: 'hidden' }}>
        <WelcomeBannerIllustration />
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
                  <EmptyDebateIllustration />
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
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <TopicLightbulbIllustration />
                    <p className="spotlight-topic-text">"{spotlightTopic.text}"</p>
                  </div>
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
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <GettingStartedIllustration />
                  Getting Started
                </h3>
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
