import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUser, getSessions, getAvailability, addAvailability, removeAvailability, updateProfile, getUserStats } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Mail, Phone, School, GraduationCap, Trophy, Calendar, Edit2, Check, X, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

const AVATAR_PALETTE = ['#1040C0', '#D02020', '#7030D0', '#0891b2', '#1A8040', '#D06010']
function avatarColor(name) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xFFFF
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function CalendarMonth({ year, month, markedDates, onToggle, editable }) {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay.getDay() + 6) % 7
  const monthLabel = firstDay.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const today = new Date()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="avail-month">
      <div className="avail-month-label">{monthLabel}</div>
      <div className="avail-grid-header">
        {DAYS.map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="avail-grid">
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isMarked = markedDates.includes(dateStr)
          const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
          return (
            <button
              key={dateStr}
              disabled={!editable || isPast}
              onClick={() => onToggle(dateStr, isMarked)}
              className={`avail-day ${isMarked ? 'avail-day-on' : ''} ${isPast ? 'avail-day-past' : ''}`}
              title={!editable ? '' : isPast ? '' : isMarked ? 'Mark unavailable' : 'Mark available'}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function MemberProfile() {
  const { id } = useParams()
  const { user: me } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [member, setMember] = useState(null)
  const [sessions, setSessions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('sessions')

  const [editingBio, setEditingBio] = useState(false)
  const [bioForm, setBioForm] = useState({ bio: '', phone: '', grade: '', school: '', proficiency: '' })

  const [availability, setAvailability] = useState([])
  const [monthOffset, setMonthOffset] = useState(0)

  useEffect(() => {
    Promise.all([getUser(id), getSessions()])
      .then(([uRes, sRes]) => {
        setMember(uRes.data)
        setSessions(sRes.data)
        const u = uRes.data
        setBioForm({ bio: u.bio || '', phone: u.phone || '', grade: u.grade || '', school: u.school || '', proficiency: u.proficiency || '' })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    getUserStats(id).then(r => setStats(r.data)).catch(() => {})
    getAvailability(id).then(r => setAvailability(r.data.map(a => a.date ?? a))).catch(() => {})
  }, [id])

  const handleSaveBio = async () => {
    try {
      const res = await updateProfile(bioForm)
      setMember(m => ({ ...m, ...res.data }))
      setEditingBio(false)
      toast.success('Profile updated.')
    } catch {
      toast.error('Failed to update profile.')
    }
  }

  const handleToggleAvailability = async (dateStr, isOn) => {
    try {
      if (isOn) {
        await removeAvailability(dateStr)
        setAvailability(prev => prev.filter(d => d !== dateStr))
      } else {
        await addAvailability(dateStr)
        setAvailability(prev => [...prev, dateStr])
      }
    } catch {
      toast.error('Failed to update availability.')
    }
  }

  if (loading) return <div className="loading">Loading…</div>
  if (!member) return <div className="empty-state">Member not found.</div>

  const isMe = me?.id === member.id
  const isAdmin = me?.role === 'admin'
  const color = avatarColor(member.name)

  const participated = sessions.filter(s => s.participants?.some(p => p.user_id === member.id))
  const upcoming = participated
    .filter(s => s.scheduled_at && new Date(s.scheduled_at) > new Date() && s.status !== 'completed' && s.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
  const history = participated
    .filter(s => s.status === 'completed' || new Date(s.scheduled_at) <= new Date())
    .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))

  const wins = participated.filter(s => {
    const p = s.participants.find(p => p.user_id === member.id)
    return s.winner_team && p?.side && s.winner_team.toLowerCase() === p.side.toLowerCase()
  }).length
  const losses = participated.filter(s => {
    const p = s.participants.find(p => p.user_id === member.id)
    return s.winner_team && p?.side && s.winner_team.toLowerCase() !== p.side.toLowerCase() && s.winner_team !== 'Draw'
  }).length
  const draws = participated.filter(s => s.winner_team === 'Draw').length

  const now = new Date()
  const calYear  = new Date(now.getFullYear(), now.getMonth() + monthOffset).getFullYear()
  const calMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset).getMonth()

  const TABS = [
    ['sessions', Calendar, 'Sessions'],
    ['stats', Trophy, 'Stats'],
    ...(isMe || isAdmin ? [['availability', Calendar, 'Availability']] : []),
    ...(isMe ? [['edit', Edit2, 'Edit Profile']] : []),
  ]

  return (
    <div className="page-container">
      <PageHero title={member.name} subtitle={`${member.role} · ${member.proficiency || 'beginner'}`} color={color}>
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <circle cx="60" cy="44" r="36" fill="white" opacity="0.12"/>
          <circle cx="60" cy="30" r="14" fill="white" opacity="0.30"/>
          <rect x="38" y="50" width="44" height="26" rx="4" fill="white" opacity="0.22"/>
          <rect x="120" y="28" width="80" height="5" rx="2" fill="white" opacity="0.20"/>
          <rect x="120" y="40" width="55" height="5" rx="2" fill="white" opacity="0.14"/>
          <circle cx="320" cy="44" r="44" fill="white" opacity="0.07"/>
          <polygon points="360,12 390,60 330,60" fill="white" opacity="0.15"/>
        </svg>
      </PageHero>

      <div className="profile-layout">

        {/* ── Sidebar ── */}
        <aside className="profile-sidebar">
          <div className="profile-sidebar-identity">
            <div className="profile-avatar-lg" style={{ background: color }}>
              {member.name[0].toUpperCase()}
            </div>
            <h2 className="profile-sidebar-name">
              {member.name}
              {isMe && <span style={{ fontSize: 10, background: 'var(--yellow)', padding: '2px 7px', fontWeight: 800, marginLeft: 8, verticalAlign: 'middle' }}>YOU</span>}
            </h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <span className={`badge ${member.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>{member.role}</span>
              <span className="badge badge-gray">{member.proficiency || 'beginner'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={12}/> {member.email}
              </div>
              {member.phone && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={12}/> {member.phone}
                </div>
              )}
              {member.school && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <School size={12}/> {member.school}
                </div>
              )}
              {member.grade && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GraduationCap size={12}/> {member.grade}
                </div>
              )}
            </div>
          </div>

          {/* W/L/D quick stats */}
          <div className="profile-sidebar-stats">
            <div className="profile-stat-row">
              <span className="profile-stat-num" style={{ color: 'var(--blue)' }}>{participated.length}</span>
              <span className="profile-stat-label">Sessions</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-num" style={{ color: '#1A8040' }}>{wins}</span>
              <span className="profile-stat-label">Wins</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-num" style={{ color: 'var(--red)' }}>{losses}</span>
              <span className="profile-stat-label">Losses</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-num" style={{ color: '#888' }}>{draws}</span>
              <span className="profile-stat-label">Draws</span>
            </div>
            {stats?.avg_score != null && (
              <div className="profile-stat-row">
                <span className="profile-stat-num">{stats.avg_score}</span>
                <span className="profile-stat-label">Avg Score</span>
              </div>
            )}
            {upcoming.length > 0 && (
              <div className="profile-stat-row">
                <span className="profile-stat-num" style={{ color: 'var(--blue)' }}>{upcoming.length}</span>
                <span className="profile-stat-label">Upcoming</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {member.bio && (
            <div>
              <div className="profile-sidebar-section-label" style={{ marginBottom: 8 }}>Bio</div>
              <p style={{ fontSize: 13, margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>{member.bio}</p>
            </div>
          )}
        </aside>

        {/* ── Main panel ── */}
        <div className="profile-main">
          <div className="profile-tabs">
            {TABS.map(([id, Icon, label]) => (
              <button key={id} className={`profile-tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
                <Icon size={14}/> {label}
              </button>
            ))}
          </div>

          {/* Sessions tab */}
          {tab === 'sessions' && (
            <div className="profile-section">
              {upcoming.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>Upcoming</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
                    {upcoming.map(s => {
                      const p = s.participants.find(x => x.user_id === member.id)
                      const today = new Date()
                      const sd = new Date(s.scheduled_at)
                      const diff = Math.round((new Date(sd.getFullYear(), sd.getMonth(), sd.getDate()) - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000)
                      return (
                        <Link key={s.id} to={`/sessions/${s.id}`} className="member-session-row">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <strong style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</strong>
                            {p?.role_name && <span className="badge badge-gray" style={{ fontSize: 10, flexShrink: 0 }}>{p.role_name}</span>}
                          </div>
                          <span style={{ color: diff === 0 ? 'var(--red)' : 'var(--blue)', fontWeight: 700, fontSize: 12, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11}/> {diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff}d`}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </>
              )}

              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>History</div>
              {history.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No session history yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {history.map(s => {
                    const p = s.participants.find(x => x.user_id === member.id)
                    const won = s.winner_team && p?.side && s.winner_team.toLowerCase() === p.side.toLowerCase()
                    const lost = s.winner_team && p?.side && s.winner_team.toLowerCase() !== p.side.toLowerCase() && s.winner_team !== 'Draw'
                    return (
                      <Link key={s.id} to={`/sessions/${s.id}`} className="member-session-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <strong style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</strong>
                          {p?.role_name && <span className="badge badge-gray" style={{ fontSize: 10, flexShrink: 0 }}>{p.role_name}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                          {s.scheduled_at && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(s.scheduled_at).toLocaleDateString('en-GB')}</span>}
                          {s.status === 'completed' && (
                            <span className={`badge ${won ? 'badge-green' : lost ? 'badge-red' : 'badge-gray'}`}>
                              {won ? 'Win' : lost ? 'Loss' : s.winner_team === 'Draw' ? 'Draw' : '—'}
                            </span>
                          )}
                          {s.status !== 'completed' && <span className="badge badge-blue">{s.status}</span>}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Stats tab */}
          {tab === 'stats' && (
            <div className="profile-section">
              <div className="profile-stats-grid">
                <div className="profile-stats-block">
                  <span className="profile-stats-num" style={{ color: 'var(--blue)' }}>{participated.length}</span>
                  <span className="profile-stats-label">Sessions</span>
                </div>
                <div className="profile-stats-block">
                  <span className="profile-stats-num" style={{ color: '#1A8040' }}>{wins}</span>
                  <span className="profile-stats-label">Wins</span>
                </div>
                <div className="profile-stats-block">
                  <span className="profile-stats-num" style={{ color: 'var(--red)' }}>{losses}</span>
                  <span className="profile-stats-label">Losses</span>
                </div>
                <div className="profile-stats-block">
                  <span className="profile-stats-num" style={{ color: '#888' }}>{draws}</span>
                  <span className="profile-stats-label">Draws</span>
                </div>
              </div>

              {stats && (
                <>
                  {stats.avg_score != null && (
                    <div className="profile-stats-grid" style={{ marginTop: 12 }}>
                      <div className="profile-stats-block">
                        <span className="profile-stats-num">{stats.sessions_attended}</span>
                        <span className="profile-stats-label">Attended</span>
                      </div>
                      <div className="profile-stats-block">
                        <span className="profile-stats-num">{stats.total_sessions}</span>
                        <span className="profile-stats-label">Assigned</span>
                      </div>
                      <div className="profile-stats-block">
                        <span className="profile-stats-num">{stats.avg_score}</span>
                        <span className="profile-stats-label">Avg Score</span>
                      </div>
                    </div>
                  )}

                  {stats.roles_played?.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <div className="profile-field-label" style={{ marginBottom: 8 }}>Roles Played</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {stats.roles_played.map(r => <span key={r} className="badge badge-gray">{r}</span>)}
                      </div>
                    </div>
                  )}
                  {stats.sides_played?.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div className="profile-field-label" style={{ marginBottom: 8 }}>Sides Debated</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {stats.sides_played.map(s => (
                          <span key={s} className={`badge ${s === 'proposition' ? 'badge-blue' : s === 'opposition' ? 'badge-red' : 'badge-gray'}`}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Availability tab (self or admin) */}
          {tab === 'availability' && (
            <div className="profile-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>
                    {isMe ? 'Mark Your Availability' : `${member.name.split(' ')[0]}'s Availability`}
                  </h3>
                  {isMe && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Click dates when you're free to debate.</p>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => setMonthOffset(o => Math.max(0, o - 1))} disabled={monthOffset === 0}>
                    <ChevronLeft size={15}/>
                  </button>
                  <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => setMonthOffset(o => o + 1)}>
                    <ChevronRight size={15}/>
                  </button>
                </div>
              </div>
              <CalendarMonth
                year={calYear}
                month={calMonth}
                markedDates={availability}
                onToggle={handleToggleAvailability}
                editable={isMe}
              />
              <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 14, height: 14, background: 'var(--yellow)', border: '2px solid #121212', display: 'inline-block' }}/>
                  Available
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 14, height: 14, background: 'white', border: '2px solid #ccc', display: 'inline-block' }}/>
                  Not marked
                </span>
              </div>
            </div>
          )}

          {/* Edit tab (self only) */}
          {tab === 'edit' && isMe && (
            <div className="profile-section">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                <div className="profile-field">
                  <span className="profile-field-label">Bio</span>
                  <textarea rows={3} className="input" value={bioForm.bio} onChange={e => setBioForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell the club about yourself…" style={{ resize: 'vertical' }}/>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="profile-field">
                    <span className="profile-field-label"><Phone size={12}/> Phone</span>
                    <input className="input" value={bioForm.phone} onChange={e => setBioForm(f => ({ ...f, phone: e.target.value }))}/>
                  </div>
                  <div className="profile-field">
                    <span className="profile-field-label"><GraduationCap size={12}/> Grade</span>
                    <input className="input" value={bioForm.grade} onChange={e => setBioForm(f => ({ ...f, grade: e.target.value }))}/>
                  </div>
                  <div className="profile-field">
                    <span className="profile-field-label"><School size={12}/> School</span>
                    <input className="input" value={bioForm.school} onChange={e => setBioForm(f => ({ ...f, school: e.target.value }))}/>
                  </div>
                  <div className="profile-field">
                    <span className="profile-field-label">Proficiency</span>
                    <select className="input" value={bioForm.proficiency} onChange={e => setBioForm(f => ({ ...f, proficiency: e.target.value }))}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ paddingTop: 16, borderTop: '1px solid #E8E8E8', display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleSaveBio}><Check size={13}/> Save Changes</button>
                <button className="btn btn-ghost" onClick={() => setTab('sessions')}><X size={13}/> Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
