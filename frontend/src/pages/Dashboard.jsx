import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSessions, getUsers, getTopics, getTournaments } from '../api'
import { useAuth } from '../context/AuthContext'
import { Calendar, Clock, MapPin, Plus, Users, BookOpen, Zap, Star, ArrowRight, Trophy, TrendingUp } from 'lucide-react'

/* Bauhaus constructivist spotlight / lightbulb motif for the topic card */
function TopicSpotlightIllustration() {
  return (
    <svg width="110" height="52" viewBox="0 0 220 104" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}>
      <circle cx="28" cy="52" r="26" fill="#F0C020" stroke="#121212" strokeWidth="3"/>
      <circle cx="28" cy="52" r="14" fill="none" stroke="#121212" strokeWidth="2.5"/>
      <rect x="76" y="28" width="48" height="48" fill="#1040C0" stroke="#121212" strokeWidth="3"/>
      <polygon points="176,16 208,88 144,88" fill="#D02020" stroke="#121212" strokeWidth="3" strokeLinejoin="round"/>
    </svg>
  )
}

/* ── Static data ─────────────────────────────────────────────────────────── */

const DEBATE_TIPS = [
  'Steelman your opponent\'s argument before rebutting — judges notice intellectual honesty.',
  'The rule of three: three strong arguments always beat five shallow ones.',
  'Signpost relentlessly: "First… Second… Third…" — clarity wins rounds.',
  'Slow down on your most important words. Volume isn\'t emphasis.',
  'Open with a statistic, a story, or a provocative question — never a definition.',
  'In cross-examination, ask closed questions. Open ones give opponents free air.',
  'Evidence without analysis is worthless. Always explain WHY it matters.',
  'The best rebuttals acknowledge what\'s true before dismantling the rest.',
  'Eye contact with the judge signals confidence far more than a loud voice.',
  'Running short or long both cost speaker points. Time every practice speech.',
  'Never apologise mid-speech. Replace hesitation with forward motion.',
  'Dropped arguments are conceded arguments. Flow your opponent\'s case carefully.',
  'Concrete examples trump abstract principles every single time.',
  'The strongest rebuttal attacks the premise, not just the conclusion.',
  'If you\'re not directly engaging the opposition, you\'re not debating.',
  'Write your conclusion first — it keeps your whole speech focused.',
  'Short sentences punch. Longer sentences build cadence. Mix both deliberately.',
  'Ask "So what?" before every argument. If you can\'t answer, cut it.',
  'In BP formats, win your role before you try to win the debate.',
  'Judges vote on the balance of the round. Win the debate, not just five minutes.',
]

function getTipOfDay() {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const dayOfYear = Math.floor((Date.now() - start) / 86400000)
  return DEBATE_TIPS[dayOfYear % DEBATE_TIPS.length]
}

function getSpotlightTopic(topics) {
  if (!topics.length) return null
  const start = new Date(new Date().getFullYear(), 0, 0)
  const dayOfYear = Math.floor((Date.now() - start) / 86400000)
  return topics[dayOfYear % topics.length]
}

function isToday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

function getCountdown(dateStr) {
  const diff = new Date(dateStr) - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const label = days > 0 ? `${days}D` : `${hours}H`
  return { days, hours, minutes, label }
}

const ADMIN_QUICK_ACTIONS = [
  { label: 'Add Topic',   sub: 'Grow your topic bank',  to: '/topics',       icon: BookOpen, color: '#D02020', textColor: '#FFFFFF' },
  { label: 'AI Practice', sub: 'Practice solo with AI', to: '/practice',     icon: Zap,      color: '#1040C0', textColor: '#FFFFFF' },
  { label: 'Members',     sub: 'Manage club roster',    to: '/members',      icon: Users,    color: '#121212', textColor: '#FFFFFF' },
  { label: 'Tournaments', sub: 'Run competitions',      to: '/tournaments',  icon: Trophy,   color: '#9A6C00', textColor: '#FFFFFF' },
]

const MEMBER_QUICK_ACTIONS = [
  { label: 'AI Practice',    sub: 'Practice solo with AI',    to: '/practice', icon: Zap,      color: '#1040C0', textColor: '#FFFFFF' },
  { label: 'Browse Topics',  sub: 'Explore the topic bank',   to: '/topics',   icon: BookOpen, color: '#D02020', textColor: '#FFFFFF' },
  { label: 'Learn',          sub: 'Debate skills & resources', to: '/learn',   icon: Star,     color: '#121212', textColor: '#FFFFFF' },
]

const STATUS_COLORS = {
  scheduled: 'badge-blue',
  draft:     'badge-gray',
  completed: 'badge-green',
  cancelled: 'badge-red',
}

const T_STATUS_COLORS = {
  upcoming:  'badge-blue',
  active:    'badge-green',
  completed: 'badge-gray',
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function SessionCard({ session, me }) {
  const date = session.scheduled_at
    ? new Date(session.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'TBC'
  const time = session.scheduled_at
    ? new Date(session.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : ''
  const isParticipant = me && session.participants?.some(p => p.user_id === me.id)
  const today = isToday(session.scheduled_at)
  return (
    <Link to={`/sessions/${session.id}`} className={`session-card${today ? ' session-card-today' : ''}`}>
      <div className="session-card-header">
        {today && <span className="badge badge-yellow">TODAY</span>}
        <span className={`badge ${STATUS_COLORS[session.status] ?? 'badge-gray'}`}>{session.status}</span>
        <span className={`badge ${session.mode === 'online' ? 'badge-purple' : 'badge-orange'}`}>{session.mode}</span>
        <span className={`badge ${isParticipant ? 'badge-green' : 'badge-gray'}`}>
          {isParticipant ? 'Participating' : 'Not participating'}
        </span>
      </div>
      <h3 className="session-card-title">{session.title}</h3>
      {session.topic_text && <p className="session-card-topic">"{session.topic_text}"</p>}
      <div className="session-card-meta">
        <span><Calendar size={14}/> {date}</span>
        {time && <span><Clock size={14}/> {time}</span>}
        {session.location && <span><MapPin size={14}/> {session.location}</span>}
      </div>
    </Link>
  )
}

function DashStatCell({ label, value, numColor, barColor, accent }) {
  return (
    <div className="dash-stat-cell" style={accent ? { background: accent } : {}}>
      <div className="dash-stat-bar" style={{ background: barColor }}/>
      <div className="dash-stat-cell-text">
        <span className="dash-stat-num" style={{ color: numColor }}>{value}</span>
        <span className="dash-stat-label">{label}</span>
      </div>
    </div>
  )
}

/* ── Dashboard ───────────────────────────────────────────────────────────── */

export default function Dashboard() {
  const { user } = useAuth()
  const [sessions,    setSessions]    = useState([])
  const [memberCount, setMemberCount] = useState(null)
  const [topicCount,  setTopicCount]  = useState(null)
  const [goTopics,    setGoTopics]    = useState([])
  const [tournaments, setTournaments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [now,         setNow]         = useState(new Date())
  const [use24h,      setUse24h]      = useState(true)

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    Promise.all([
      getSessions(),
      getUsers().catch(() => ({ data: [] })),
      getTopics({ is_go: true }).catch(() => ({ data: [] })),
      getTournaments().catch(() => ({ data: [] })),
    ]).then(([sessRes, usersRes, topicsRes, tourRes]) => {
      setSessions(sessRes.data)
      setMemberCount(usersRes.data.length)
      const topics = topicsRes.data
      setGoTopics(topics)
      setTopicCount(topics.length)
      setTournaments(tourRes.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // ── Derived data ────────────────────────────────────────────────────────────
  const upcoming = sessions
    .filter(s => s.status === 'scheduled' || s.status === 'draft')
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))

  const past = sessions
    .filter(s => s.status === 'completed')
    .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))

  const myUpcoming = upcoming.filter(s => s.participants?.some(p => p.user_id === user?.id))

  // Next club session (any, not just mine) — already sorted by date
  const nextSession     = upcoming[0] ?? null
  const nextIsMySession = nextSession?.participants?.some(p => p.user_id === user?.id) ?? false
  const countdown       = nextSession?.scheduled_at ? getCountdown(nextSession.scheduled_at) : null

  // W/L record — completed sessions where I debated (had a side) and a result was recorded
  const myResultedSessions = past.filter(s => {
    const me = s.participants?.find(p => p.user_id === user?.id)
    return me?.side && s.winner_team
  })
  const wins   = myResultedSessions.filter(s => s.winner_team === s.participants?.find(p => p.user_id === user?.id)?.side).length
  const losses = myResultedSessions.length - wins

  // Stable spotlight topic — changes once per day
  const spotlightTopic = getSpotlightTopic(goTopics)
  const tipOfDay       = getTipOfDay()

  // Upcoming/active tournaments, capped at 3
  const upcomingTournaments = tournaments
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    .slice(0, 3)

  const isNewClub    = sessions.length === 0
  const quickActions = user?.role === 'admin' ? ADMIN_QUICK_ACTIONS : MEMBER_QUICK_ACTIONS

  // ── Clock ───────────────────────────────────────────────────────────────────
  const clockH    = use24h
    ? String(now.getHours()).padStart(2, '0')
    : String(now.getHours() % 12 || 12).padStart(2, '0')
  const clockM    = String(now.getMinutes()).padStart(2, '0')
  const clockSecs = String(now.getSeconds()).padStart(2, '0')
  const clockAmPm = use24h ? null : (now.getHours() >= 12 ? 'PM' : 'AM')
  const clockDay  = now.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase()
  const clockDate = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()

  return (
    <div className="dashboard">

      {/* ── Masthead ─────────────────────────────────────────────────────── */}
      <div className="dash-masthead">
        <div className="dash-masthead-left">
          <div className="dash-masthead-accent"/>
          <div className="dash-masthead-brand-block">
            <span className="dash-masthead-brand">DEBATEORG</span>
            <span className="dash-masthead-welcome">Welcome back, {user?.name}</span>
          </div>
        </div>
        <div className="dash-masthead-right">
          <svg aria-hidden="true" viewBox="0 0 380 115"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <circle cx="248" cy="152" r="102" fill="#F0C020" stroke="#121212" strokeWidth="3.5"/>
            <polygon points="148,6 230,106 66,106"
              fill="#D02020" stroke="#121212" strokeWidth="3.5" strokeLinejoin="round"/>
            <rect x="173" y="34" width="88" height="88" fill="white" stroke="#121212" strokeWidth="3.5"/>
          </svg>
          {user?.role === 'admin' && (
            <div className="dash-masthead-info">
              <Link to="/sessions/new" className="btn dash-masthead-btn">
                <Plus size={15}/> New Session
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      {!loading && (
        <div className="dash-stats">
          <DashStatCell label="My Upcoming"        value={myUpcoming.length}  numColor="var(--blue)"  barColor="var(--blue)"  />
          <DashStatCell label="Sessions Completed" value={past.length}        numColor="var(--red)"   barColor="var(--red)"   />
          <DashStatCell label="Club Members"       value={memberCount ?? '—'} numColor="#9A6C00"      barColor="var(--yellow)" />
          <DashStatCell label="Topics Available"   value={topicCount ?? '—'}  numColor="var(--black)" barColor="var(--black)" />
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <div className="dash-grid">

          {/* Left — main column */}
          <div className="dash-main">

            {/* Clock panel */}
            <div className="dash-clock-cell">
              <div className="dash-clock-inner">
                <span className="dash-clock-time">
                  {clockH}<span className="dash-clock-colon">:</span>{clockM}
                  <span className="dash-clock-secs"><span className="dash-clock-colon">:</span>{clockSecs}</span>
                  {clockAmPm && <span className="dash-clock-ampm">{clockAmPm}</span>}
                </span>
                <div className="dash-clock-right">
                  <div className="dash-clock-meta">
                    <span className="dash-clock-day">{clockDay}</span>
                    <span className="dash-clock-date">{clockDate}</span>
                  </div>
                  <button className="dash-clock-fmt-btn" onClick={() => setUse24h(v => !v)}>
                    {use24h ? '12H' : '24H'}
                  </button>
                </div>
              </div>
            </div>

            {isNewClub ? (
              /* Onboarding — no sessions yet */
              <div className="dash-onboard">
                <div className="dash-onboard-title">Your club is all set up!</div>
                <p className="dash-onboard-body">
                  {user?.role === 'admin'
                    ? 'Start by scheduling your first debate session. You can invite members, assign roles, and set a topic.'
                    : 'Your coach hasn\'t scheduled any sessions yet. Check back soon — you\'ll see upcoming sessions here.'}
                </p>
                <div className="dash-onboard-actions">
                  {user?.role === 'admin' && (
                    <Link to="/sessions/new" className="btn btn-primary"><Plus size={14}/> Schedule First Session</Link>
                  )}
                  <Link to="/learn" className="btn">Explore Learning Resources</Link>
                  <Link to="/practice" className="btn">Try AI Practice</Link>
                </div>
              </div>
            ) : (
              <>
                <div className="dash-cell-header">
                  <span>Upcoming Sessions</span>
                  <span className="dash-cell-count">{upcoming.length}</span>
                </div>

                {upcoming.length === 0 ? (
                  <div className="dash-empty">
                    <div className="dash-empty-content">
                      <p className="dash-empty-label">No upcoming sessions scheduled.</p>
                      {user?.role === 'admin' && (
                        <Link to="/sessions/new" className="btn btn-primary">
                          <Plus size={15}/> Schedule a session
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="sessions-grid" style={{ padding: '20px 24px 0' }}>
                    {upcoming.map(s => <SessionCard key={s.id} session={s} me={user}/>)}
                  </div>
                )}

                {past.length > 0 && (
                  <>
                    <div className="dash-cell-header" style={{ marginTop: '8px' }}>
                      <span>Recent Sessions</span>
                      <span className="dash-cell-count">{past.length}</span>
                    </div>
                    <div className="sessions-grid" style={{ padding: '20px 24px 0' }}>
                      {past.slice(0, 4).map(s => <SessionCard key={s.id} session={s} me={user}/>)}
                    </div>
                    {past.length > 4 && (
                      <Link to="/sessions" className="dash-more-link" style={{ margin: '12px 24px 24px', display: 'inline-block' }}>
                        View all {past.length} past sessions →
                      </Link>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Right — sidebar */}
          <div className="dash-sidebar">

            {/* Countdown to next club session */}
            {countdown && (
              <div className="dash-cell dash-countdown">
                <div className="dash-cell-header">Next Session</div>
                <div className="dash-countdown-number">{countdown.label}</div>
                <div className="dash-countdown-sub">
                  {countdown.days > 0
                    ? `${countdown.days} day${countdown.days !== 1 ? 's' : ''} away`
                    : `${countdown.hours}h ${countdown.minutes}m to go`}
                </div>
                {!nextIsMySession && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
                    You're not signed up for this one
                  </div>
                )}
                <Link to={`/sessions/${nextSession.id}`} className="dash-countdown-link">
                  {nextSession.title} <ArrowRight size={13}/>
                </Link>
              </div>
            )}

            {/* Upcoming tournaments */}
            {upcomingTournaments.length > 0 && (
              <div className="dash-cell">
                <div className="dash-cell-header">
                  <Trophy size={11} style={{ flexShrink: 0 }}/>
                  Tournaments
                </div>
                <div className="dash-tournament-list">
                  {upcomingTournaments.map(t => (
                    <Link key={t.id} to={`/tournaments`} className="dash-tournament-item">
                      <span className={`badge ${T_STATUS_COLORS[t.status] ?? 'badge-gray'}`}>{t.status}</span>
                      <span className="dash-tournament-name">{t.name}</span>
                      {t.scheduled_at && (
                        <span className="dash-tournament-date">
                          {new Date(t.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </Link>
                  ))}
                  <Link to="/tournaments" className="dash-more-link" style={{ padding: '8px 16px', display: 'block', borderTop: '1px solid #EAEAEA' }}>
                    All tournaments →
                  </Link>
                </div>
              </div>
            )}

            {/* Quick actions — admin or member version */}
            <div className="dash-cell">
              <div className="dash-cell-header">Quick Actions</div>
              <div className="dash-actions-list">
                {quickActions.map(({ label, sub, to, icon: Icon, color, textColor }) => (
                  <Link key={label} to={to} className="dash-action-item">
                    <div className="dash-action-icon" style={{ background: color, color: textColor }}>
                      <Icon size={16}/>
                    </div>
                    <div className="dash-action-text">
                      <span className="dash-action-name">{label}</span>
                      <span className="dash-action-sub">{sub}</span>
                    </div>
                    <ArrowRight size={13} className="dash-action-arrow"/>
                  </Link>
                ))}
              </div>
            </div>

            {/* Win/loss record — only shown when results are recorded */}
            {myResultedSessions.length > 0 && (
              <div className="dash-cell">
                <div className="dash-cell-header">
                  <TrendingUp size={11} style={{ flexShrink: 0 }}/>
                  My Record
                </div>
                <div className="dash-wl-row">
                  <div className="dash-wl-block dash-wl-win">
                    <span className="dash-wl-num">{wins}</span>
                    <span className="dash-wl-label">WINS</span>
                  </div>
                  <div className="dash-wl-divider"/>
                  <div className="dash-wl-block dash-wl-loss">
                    <span className="dash-wl-num">{losses}</span>
                    <span className="dash-wl-label">LOSSES</span>
                  </div>
                  {wins + losses > 0 && (
                    <>
                      <div className="dash-wl-divider"/>
                      <div className="dash-wl-block">
                        <span className="dash-wl-num">{Math.round(wins / (wins + losses) * 100)}%</span>
                        <span className="dash-wl-label">WIN RATE</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Topic spotlight — stable per day */}
            {spotlightTopic && (
              <div className="dash-cell">
                <div className="dash-cell-header">
                  <Star size={11} style={{ flexShrink: 0 }}/>
                  Topic Spotlight
                </div>
                <div className="dash-topic-card">
                  <TopicSpotlightIllustration />
                  <p className="dash-topic-text">"{spotlightTopic.text}"</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {spotlightTopic.category    && <span className="badge badge-gray">{spotlightTopic.category}</span>}
                    {spotlightTopic.proficiency && <span className="badge badge-blue">{spotlightTopic.proficiency}</span>}
                  </div>
                  <Link to="/topics" className="dash-more-link">Browse all topics →</Link>
                </div>
              </div>
            )}

            {/* Tip of the day */}
            <div className="dash-cell dash-tip-cell">
              <div className="dash-cell-header">Tip of the Day</div>
              <p className="dash-tip-text">{tipOfDay}</p>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
