import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSessions, getUsers, getTopics } from '../api'
import { useAuth } from '../context/AuthContext'
import { Calendar, Clock, MapPin, Plus, Users, BookOpen, Zap, Star, ArrowRight } from 'lucide-react'

/* ── Illustrations ───────────────────────────────────────────────────────── */

/* Two faceless Bauhaus debaters facing each other — Oskar Schlemmer style.
   Blue figure (left) vs Red figure (right), yellow stage floor, black outlines.
   Speech bubbles match each figure's colour. */
function EmptyDebateIllustration() {
  return (
    <svg viewBox="0 0 560 260" preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg" className="dash-empty-bg">

      {/* ── Background ── */}
      <rect x="0" y="0" width="560" height="260" fill="#F5F5F5"/>

      {/* Yellow stage floor */}
      <rect x="0" y="206" width="560" height="54" fill="#F0C020"/>
      <rect x="0" y="203" width="560" height="5" fill="#121212"/>

      {/* ── Blue debater (left, facing right) ── */}
      {/* Head */}
      <circle cx="138" cy="78" r="34" fill="#1040C0" stroke="#121212" strokeWidth="3"/>
      {/* Torso */}
      <rect x="110" y="112" width="56" height="88" fill="#1040C0" stroke="#121212" strokeWidth="3"/>
      {/* Back arm (left) */}
      <rect x="68"  y="120" width="44" height="14" fill="#1040C0" stroke="#121212" strokeWidth="3"/>
      {/* Forward arm (right — extended toward center, slightly raised) */}
      <rect x="164" y="114" width="66" height="14" fill="#1040C0" stroke="#121212" strokeWidth="3"/>
      {/* Legs */}
      <rect x="112" y="198" width="24" height="18" fill="#1040C0" stroke="#121212" strokeWidth="3"/>
      <rect x="140" y="198" width="24" height="18" fill="#1040C0" stroke="#121212" strokeWidth="3"/>

      {/* Blue speech bubble (upper-left) */}
      <rect x="14"  y="8"  width="172" height="58" fill="#1040C0" stroke="#121212" strokeWidth="3"/>
      {/* Bubble tail pointing toward head */}
      <polygon points="90,64 115,64 100,90" fill="#1040C0"/>
      <line x1="90" y1="64" x2="100" y2="90" stroke="#121212" strokeWidth="3"/>
      <line x1="115" y1="64" x2="100" y2="90" stroke="#121212" strokeWidth="3"/>
      {/* Text lines inside bubble */}
      <rect x="26" y="22" width="148" height="6" fill="white" opacity="0.75"/>
      <rect x="26" y="36" width="108" height="6" fill="white" opacity="0.75"/>
      <rect x="26" y="50" width="128" height="6" fill="white" opacity="0.75"/>

      {/* ── Red debater (right, facing left — mirror of blue) ── */}
      {/* Head */}
      <circle cx="422" cy="78" r="34" fill="#D02020" stroke="#121212" strokeWidth="3"/>
      {/* Torso */}
      <rect x="394" y="112" width="56" height="88" fill="#D02020" stroke="#121212" strokeWidth="3"/>
      {/* Back arm (right) */}
      <rect x="448" y="120" width="44" height="14" fill="#D02020" stroke="#121212" strokeWidth="3"/>
      {/* Forward arm (left — extended toward center) */}
      <rect x="330" y="114" width="66" height="14" fill="#D02020" stroke="#121212" strokeWidth="3"/>
      {/* Legs */}
      <rect x="396" y="198" width="24" height="18" fill="#D02020" stroke="#121212" strokeWidth="3"/>
      <rect x="424" y="198" width="24" height="18" fill="#D02020" stroke="#121212" strokeWidth="3"/>

      {/* Red speech bubble (upper-right) */}
      <rect x="374" y="8" width="172" height="58" fill="#D02020" stroke="#121212" strokeWidth="3"/>
      {/* Bubble tail */}
      <polygon points="445,64 470,64 460,90" fill="#D02020"/>
      <line x1="445" y1="64" x2="460" y2="90" stroke="#121212" strokeWidth="3"/>
      <line x1="470" y1="64" x2="460" y2="90" stroke="#121212" strokeWidth="3"/>
      {/* Text lines inside bubble */}
      <rect x="386" y="22" width="148" height="6" fill="white" opacity="0.75"/>
      <rect x="386" y="36" width="108" height="6" fill="white" opacity="0.75"/>
      <rect x="386" y="50" width="128" height="6" fill="white" opacity="0.75"/>

      {/* ── Centre VS marker — rotated yellow square ── */}
      <rect x="261" y="131" width="38" height="38" fill="#F0C020" stroke="#121212" strokeWidth="3"
        transform="rotate(45 280 150)"/>

    </svg>
  )
}

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
  const past        = sessions.filter(s => s.status === 'completed')
  const nextSession = upcoming[0] ?? null
  const countdown   = nextSession?.scheduled_at ? getCountdown(nextSession.scheduled_at) : null
  const tipOfDay    = getTipOfDay()

  const clockTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const clockSecs = now.toLocaleTimeString('en-GB', { second: '2-digit' }).slice(-2)
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
          <DashStatCell label="Club Members"       value={memberCount ?? '—'} numColor="#9A6C00"      barColor="var(--yellow)" accent="#FFFBE8"/>
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
                  {clockTime}<span className="dash-clock-secs">:{clockSecs}</span>
                </span>
                <div className="dash-clock-meta">
                  <span className="dash-clock-day">{clockDay}</span>
                  <span className="dash-clock-date">{clockDate}</span>
                </div>
              </div>
            </div>

            <div className="dash-cell-header">
              <span>Upcoming Sessions</span>
              <span className="dash-cell-count">{upcoming.length}</span>
            </div>

            {upcoming.length === 0 ? (
              <div className="dash-empty">
                <EmptyDebateIllustration />
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
                {upcoming.map(s => <SessionCard key={s.id} session={s}/>)}
              </div>
            )}

            {past.length > 0 && (
              <>
                <div className="dash-cell-header" style={{ marginTop: '8px' }}>
                  <span>Recent Sessions</span>
                  <span className="dash-cell-count">{past.length}</span>
                </div>
                <div className="sessions-grid" style={{ padding: '20px 24px 0' }}>
                  {past.slice(0, 4).map(s => <SessionCard key={s.id} session={s}/>)}
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
