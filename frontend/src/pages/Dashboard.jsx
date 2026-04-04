import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSessions, getUsers, getTopics } from '../api'
import { useAuth } from '../context/AuthContext'
import { Calendar, Clock, MapPin, Plus, Users, BookOpen, Zap, Star, ArrowRight } from 'lucide-react'

/* Bauhaus constructivist spotlight / lightbulb motif for the topic card */
function TopicSpotlightIllustration() {
  return (
    <svg width="110" height="52" viewBox="0 0 220 104" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}>
      {/* Large yellow circle — the "idea" */}
      <circle cx="28" cy="52" r="26" fill="#F0C020" stroke="#121212" strokeWidth="3"/>
      {/* Inner concentric ring */}
      <circle cx="28" cy="52" r="14" fill="none" stroke="#121212" strokeWidth="2.5"/>
      {/* Blue square — bold primary form */}
      <rect x="76" y="28" width="48" height="48" fill="#1040C0" stroke="#121212" strokeWidth="3"/>
      {/* Red triangle */}
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

function getCountdown(dateStr) {
  const diff = new Date(dateStr) - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const label = days > 0 ? `${days}D` : `${hours}H`
  return { days, hours, minutes, label }
}

const QUICK_ACTIONS = [
  { label: 'Add Topic',   sub: 'Grow your topic bank',  to: '/topics',    icon: BookOpen, color: '#D02020', textColor: '#FFFFFF' },
  { label: 'AI Practice', sub: 'Practice solo with AI', to: '/practice',  icon: Zap,      color: '#1040C0', textColor: '#FFFFFF' },
  { label: 'Members',     sub: 'Manage club roster',    to: '/members',   icon: Users,    color: '#121212', textColor: '#FFFFFF' },
]

const STATUS_COLORS = {
  scheduled: 'badge-blue',
  draft:     'badge-gray',
  completed: 'badge-green',
  cancelled: 'badge-red',
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
  return (
    <Link to={`/sessions/${session.id}`} className="session-card">
      <div className="session-card-header">
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
  const [sessions,      setSessions]      = useState([])
  const [memberCount,   setMemberCount]   = useState(null)
  const [topicCount,    setTopicCount]    = useState(null)
  const [spotlightTopic, setSpotlightTopic] = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [now,           setNow]           = useState(new Date())
  const [use24h,        setUse24h]        = useState(true)

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

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

  const upcoming    = sessions.filter(s => s.status === 'scheduled' || s.status === 'draft')
  const myUpcoming  = upcoming.filter(s => s.participants?.some(p => p.user_id === user?.id))
  const past        = sessions.filter(s => s.status === 'completed')
  const nextSession = myUpcoming[0] ?? null
  const countdown   = nextSession?.scheduled_at ? getCountdown(nextSession.scheduled_at) : null
  const tipOfDay    = getTipOfDay()

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

      {/* ── Masthead — split black / blue ───────────────────────────────── */}
      <div className="dash-masthead">
        {/* Left panel: black with yellow brand */}
        <div className="dash-masthead-left">
          <div className="dash-masthead-accent"/>
          <div className="dash-masthead-brand-block">
            <span className="dash-masthead-brand">DEBATEORG</span>
            <span className="dash-masthead-welcome">Welcome back, {user?.name}</span>
          </div>
        </div>
        {/* Right panel: blue polka-dot + Bauhaus house composition */}
        <div className="dash-masthead-right">
          {/* Bauhaus composition — yellow circle, red triangle, white square */}
          <svg aria-hidden="true" viewBox="0 0 380 115"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {/* Large yellow circle — bottom-center, mostly below midline */}
            <circle cx="248" cy="152" r="102" fill="#F0C020" stroke="#121212" strokeWidth="3.5"/>
            {/* Red triangle — sharp upward point, left of centre */}
            <polygon points="148,6 230,106 66,106"
              fill="#D02020" stroke="#121212" strokeWidth="3.5" strokeLinejoin="round"/>
            {/* White square — black border, front and centre */}
            <rect x="173" y="34" width="88" height="88" fill="white" stroke="#121212" strokeWidth="3.5"/>
          </svg>
          {/* New Session button — admin only, overlaid top-left */}
          {user?.role === 'admin' && (
            <div className="dash-masthead-info">
              <Link to="/sessions/new" className="btn dash-masthead-btn">
                <Plus size={15}/> New Session
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats strip — numbered shape badges ─────────────────────────── */}
      {!loading && (
        <div className="dash-stats">
          <DashStatCell label="Upcoming Sessions"  value={upcoming.length}    numColor="var(--blue)"  barColor="var(--blue)"  />
          <DashStatCell label="Sessions Completed" value={past.length}        numColor="var(--red)"   barColor="var(--red)"   />
          <DashStatCell label="Club Members"       value={memberCount ?? '—'} numColor="#9A6C00"      barColor="var(--yellow)" />
          <DashStatCell label="Topics Available"   value={topicCount ?? '—'}  numColor="var(--black)" barColor="var(--black)" />
        </div>
      )}

      {/* ── Body grid ───────────────────────────────────────────────────── */}
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

            <div className="dash-cell-header">
              <span>Upcoming Sessions</span>
              <span className="dash-cell-count">{upcoming.length}</span>
            </div>

            {upcoming.length === 0 ? (
              <div className="dash-empty">
                <div className="dash-empty-content">
                  <p className="dash-empty-label">No upcoming sessions scheduled yet.</p>
                  {user?.role === 'admin' && (
                    <Link to="/sessions/new" className="btn btn-primary">
                      <Plus size={15}/> Schedule your first session
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
          </div>

          {/* Right — sidebar */}
          <div className="dash-sidebar">

            {/* Countdown */}
            {countdown && (
              <div className="dash-cell dash-countdown">
                <div className="dash-cell-header">Next Session</div>
                <div className="dash-countdown-number">{countdown.label}</div>
                <div className="dash-countdown-sub">
                  {countdown.days > 0
                    ? `${countdown.days} day${countdown.days !== 1 ? 's' : ''} away`
                    : `${countdown.hours}h ${countdown.minutes}m to go`}
                </div>
                <Link to={`/sessions/${nextSession.id}`} className="dash-countdown-link">
                  {nextSession.title} <ArrowRight size={13}/>
                </Link>
              </div>
            )}

            {/* Quick actions (admin only) */}
            {user?.role === 'admin' && (
              <div className="dash-cell">
                <div className="dash-cell-header">Quick Actions</div>
                <div className="dash-actions-list">
                  {QUICK_ACTIONS.map(({ label, sub, to, icon: Icon, color, textColor }) => (
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
            )}

            {/* Topic spotlight */}
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
