import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSessions, getUsers, getTopics } from '../api'
import { useAuth } from '../context/AuthContext'
import { Calendar, Clock, MapPin, Plus, Trophy, Users, BookOpen, Zap, Star, ArrowRight } from 'lucide-react'

/* ── Bauhaus SVG Illustrations ─────────────────────────────────────────── */

/* Welcome banner: pure Bauhaus constructivist composition — circles, rects, triangles */
function WelcomeBannerIllustration() {
  return (
    <svg width="220" height="90" viewBox="0 0 220 90" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', right: '60px', top: 0, opacity: 0.28, pointerEvents: 'none' }}>
      {/* Large white circle, bottom-right anchor */}
      <circle cx="190" cy="78" r="58" fill="#FFFFFF"/>
      {/* Yellow square overlapping circle */}
      <rect x="108" y="8" width="48" height="48" fill="#F0C020"/>
      {/* Red triangle cutting across */}
      <polygon points="60,0 108,0 108,56" fill="#D02020"/>
      {/* Small black square accent */}
      <rect x="156" y="8" width="20" height="20" fill="#121212"/>
      {/* Bold yellow horizontal bar at base */}
      <rect x="0" y="76" width="220" height="8" fill="#F0C020"/>
      {/* Thin white vertical stripe */}
      <rect x="60" y="0" width="6" height="76" fill="#FFFFFF"/>
    </svg>
  )
}

/* Debate scene: two FACELESS geometric characters — blue left, red right */
function EmptyDebateIllustration() {
  return (
    <svg width="300" height="190" viewBox="0 0 300 190" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ margin: '0 auto 16px', display: 'block' }}>

      {/* ── Floor ── */}
      <rect x="0" y="168" width="300" height="10" fill="#121212"/>

      {/* ── LEFT PODIUM (yellow) ── */}
      <rect x="14" y="110" width="68" height="58" fill="#F0C020" stroke="#121212" strokeWidth="3"/>
      {/* podium detail lines */}
      <rect x="20" y="118" width="56" height="5" fill="#121212"/>
      <rect x="20" y="128" width="44" height="3" fill="#121212" opacity="0.25"/>
      <rect x="20" y="136" width="34" height="3" fill="#121212" opacity="0.25"/>

      {/* ── BLUE CHARACTER (left) ── */}
      {/* Head — plain blue circle, NO face */}
      <circle cx="48" cy="60" r="18" fill="#1040C0" stroke="#121212" strokeWidth="3"/>
      {/* Body — blue rectangle */}
      <rect x="26" y="76" width="44" height="36" fill="#1040C0" stroke="#121212" strokeWidth="3"/>
      {/* Left arm — horizontal blue rect */}
      <rect x="6" y="82" width="22" height="10" fill="#1040C0" stroke="#121212" strokeWidth="3"/>
      {/* Right arm — angled toward podium */}
      <rect x="68" y="88" width="22" height="10" fill="#1040C0" stroke="#121212" strokeWidth="3"/>

      {/* ── BLUE SPEECH BUBBLE (left) — rectangular, strict geometry ── */}
      <rect x="82" y="6" width="80" height="52" fill="#1040C0" stroke="#121212" strokeWidth="3"/>
      {/* Triangle tail pointing bottom-left toward blue char */}
      <polygon points="82,46 98,58 82,58" fill="#1040C0" stroke="#121212" strokeWidth="3" strokeLinejoin="miter"/>
      {/* White lines inside bubble */}
      <line x1="94" y1="22" x2="150" y2="22" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="square"/>
      <line x1="94" y1="34" x2="144" y2="34" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="square"/>
      <line x1="94" y1="46" x2="132" y2="46" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="square" opacity="0.6"/>

      {/* ── VS BADGE ── */}
      <rect x="130" y="126" width="40" height="28" fill="#121212" stroke="#121212" strokeWidth="2"/>
      <text x="150" y="145" textAnchor="middle" fill="#F0C020" fontSize="13" fontWeight="900" fontFamily="monospace" letterSpacing="1">VS</text>

      {/* ── RIGHT PODIUM (yellow) ── */}
      <rect x="218" y="110" width="68" height="58" fill="#F0C020" stroke="#121212" strokeWidth="3"/>
      <rect x="224" y="118" width="56" height="5" fill="#121212"/>
      <rect x="224" y="128" width="44" height="3" fill="#121212" opacity="0.25"/>
      <rect x="224" y="136" width="34" height="3" fill="#121212" opacity="0.25"/>

      {/* ── RED CHARACTER (right) ── */}
      {/* Head — plain red circle, NO face */}
      <circle cx="252" cy="60" r="18" fill="#D02020" stroke="#121212" strokeWidth="3"/>
      {/* Body — red rectangle */}
      <rect x="230" y="76" width="44" height="36" fill="#D02020" stroke="#121212" strokeWidth="3"/>
      {/* Left arm */}
      <rect x="210" y="88" width="22" height="10" fill="#D02020" stroke="#121212" strokeWidth="3"/>
      {/* Right arm */}
      <rect x="272" y="82" width="22" height="10" fill="#D02020" stroke="#121212" strokeWidth="3"/>

      {/* ── RED SPEECH BUBBLE (right) — rectangular ── */}
      <rect x="138" y="6" width="80" height="52" fill="#D02020" stroke="#121212" strokeWidth="3"/>
      {/* Triangle tail pointing bottom-right toward red char */}
      <polygon points="218,46 202,58 218,58" fill="#D02020" stroke="#121212" strokeWidth="3" strokeLinejoin="miter"/>
      {/* White lines inside bubble */}
      <line x1="150" y1="22" x2="206" y2="22" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="square"/>
      <line x1="150" y1="34" x2="200" y2="34" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="square"/>
      <line x1="150" y1="46" x2="188" y2="46" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="square" opacity="0.6"/>
    </svg>
  )
}

/* Topic spotlight: geometric diamond/idea mark — circles + rects only */
function TopicLightbulbIllustration() {
  return (
    <svg width="52" height="60" viewBox="0 0 52 60" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}>
      {/* Bulb body — circle */}
      <circle cx="26" cy="22" r="18" fill="#F0C020" stroke="#121212" strokeWidth="3"/>
      {/* Inner circle accent */}
      <circle cx="26" cy="22" r="10" fill="#F0C020" stroke="#121212" strokeWidth="2"/>
      {/* Vertical line inside */}
      <line x1="26" y1="14" x2="26" y2="30" stroke="#121212" strokeWidth="2.5" strokeLinecap="square"/>
      {/* Horizontal line inside */}
      <line x1="18" y1="22" x2="34" y2="22" stroke="#121212" strokeWidth="2.5" strokeLinecap="square"/>
      {/* Neck rect */}
      <rect x="18" y="39" width="16" height="6" fill="#FFFFFF" stroke="#121212" strokeWidth="2.5"/>
      {/* Base rect */}
      <rect x="14" y="45" width="24" height="6" fill="#FFFFFF" stroke="#121212" strokeWidth="2.5"/>
      {/* Diagonal rays — top-left */}
      <line x1="4" y1="6" x2="12" y2="14" stroke="#121212" strokeWidth="2.5" strokeLinecap="square"/>
      {/* Top ray */}
      <line x1="26" y1="0" x2="26" y2="6" stroke="#121212" strokeWidth="2.5" strokeLinecap="square"/>
      {/* Top-right ray */}
      <line x1="48" y1="6" x2="40" y2="14" stroke="#121212" strokeWidth="2.5" strokeLinecap="square"/>
      {/* Left ray */}
      <line x1="0" y1="22" x2="8" y2="22" stroke="#121212" strokeWidth="2.5" strokeLinecap="square"/>
      {/* Right ray */}
      <line x1="52" y1="22" x2="44" y2="22" stroke="#121212" strokeWidth="2.5" strokeLinecap="square"/>
    </svg>
  )
}

/* Getting started trophy: pure rectangles and polygons, no curves */
function GettingStartedIllustration() {
  return (
    <svg width="40" height="36" viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}>
      {/* Cup body — trapezoid */}
      <polygon points="6,4 34,4 30,28 10,28" fill="#F0C020" stroke="#121212" strokeWidth="2.5" strokeLinejoin="miter"/>
      {/* Left handle — rect */}
      <rect x="0" y="8" width="7" height="14" fill="#F0C020" stroke="#121212" strokeWidth="2.5"/>
      {/* Right handle — rect */}
      <rect x="33" y="8" width="7" height="14" fill="#F0C020" stroke="#121212" strokeWidth="2.5"/>
      {/* Stem */}
      <rect x="16" y="28" width="8" height="4" fill="#F0C020" stroke="#121212" strokeWidth="2.5"/>
      {/* Base */}
      <rect x="10" y="32" width="20" height="4" fill="#F0C020" stroke="#121212" strokeWidth="2.5"/>
      {/* Star in cup */}
      <polygon points="20,9 21.5,14 26,14 22.5,17 24,22 20,19 16,22 17.5,17 14,14 18.5,14"
        fill="#FFFFFF" stroke="#121212" strokeWidth="1.5" strokeLinejoin="miter"/>
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
