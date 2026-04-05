import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateProfile, getUserStats, getAvailability, addAvailability, removeAvailability, getSessions } from '../api'
import { useToast } from '../context/ToastContext'
import { User, Mail, GraduationCap, Shield, Phone, School, Calendar, TrendingUp, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced']
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function CalendarMonth({ year, month, availableDates, onToggle, loading }) {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Monday-first offset
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
          if (!day) return <span key={`e${i}`}/>
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isAvailable = availableDates.includes(dateStr)
          const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
          return (
            <button
              key={dateStr}
              disabled={isPast || loading}
              onClick={() => onToggle(dateStr, isAvailable)}
              className={`avail-day ${isAvailable ? 'avail-day-on' : ''} ${isPast ? 'avail-day-past' : ''}`}
              title={isPast ? '' : isAvailable ? 'Mark unavailable' : 'Mark available'}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, loginSuccess } = useAuth()
  const toast = useToast()

  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState({
    name: user?.name || '',
    grade: user?.grade || '',
    phone: user?.phone || '',
    school: user?.school || '',
    proficiency: user?.proficiency || 'beginner',
  })
  const [saving, setSaving] = useState(false)

  const [stats, setStats] = useState(null)
  const [availability, setAvailability] = useState([])
  const [availLoading, setAvailLoading] = useState(false)
  const [upcomingSessions, setUpcomingSessions] = useState([])

  const [monthOffset, setMonthOffset] = useState(0) // 0 = current month, 1 = next, etc.

  useEffect(() => {
    if (!user) return
    getUserStats(user.id).then(r => setStats(r.data)).catch(() => {})
    getAvailability(user.id).then(r => setAvailability(r.data.map(a => a.date ?? a))).catch(() => {})
    getSessions().then(r => {
      const upcoming = r.data
        .filter(s => (s.status === 'scheduled' || s.status === 'draft') && s.participants?.some(p => p.user_id === user.id))
        .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
        .slice(0, 5)
      setUpcomingSessions(upcoming)
    }).catch(() => {})
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateProfile(form)
      const token = localStorage.getItem('token')
      loginSuccess(token, res.data)
      toast.success('Profile saved.')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAvailability = async (dateStr, isCurrentlyOn) => {
    setAvailLoading(true)
    try {
      if (isCurrentlyOn) {
        await removeAvailability(dateStr)
        setAvailability(prev => prev.filter(d => d !== dateStr))
      } else {
        await addAvailability(dateStr)
        setAvailability(prev => [...prev, dateStr])
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update availability')
    } finally {
      setAvailLoading(false)
    }
  }

  const now = new Date()
  const calYear  = new Date(now.getFullYear(), now.getMonth() + monthOffset).getFullYear()
  const calMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset).getMonth()

  const wins   = stats ? (stats.sessions_won  ?? 0) : 0
  const losses = stats ? (stats.sessions_lost ?? 0) : 0

  return (
    <div className="page-container">
      <PageHero title="My Profile" subtitle={user?.name} color="#1040C0">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <circle cx="60" cy="44" r="36" fill="white" opacity="0.12"/>
          <circle cx="60" cy="30" r="14" fill="white" opacity="0.30"/>
          <rect x="38" y="50" width="44" height="26" rx="4" fill="white" opacity="0.22"/>
          <rect x="120" y="28" width="80" height="5" rx="2" fill="white" opacity="0.20"/>
          <rect x="120" y="40" width="55" height="5" rx="2" fill="white" opacity="0.14"/>
          <rect x="228" y="26" width="34" height="16" rx="2" fill="#F0C020" opacity="0.50"/>
          <circle cx="320" cy="44" r="44" fill="white" opacity="0.07"/>
          <polygon points="360,12 390,60 330,60" fill="#F0C020" opacity="0.20"/>
        </svg>
      </PageHero>

      <div className="profile-layout">

        {/* ── Left sidebar ── */}
        <aside className="profile-sidebar">
          <div className="profile-sidebar-identity">
            <div className="profile-avatar-lg">{user?.name?.[0]?.toUpperCase()}</div>
            <h2 className="profile-sidebar-name">{user?.name}</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <span className={`badge ${user?.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>{user?.role}</span>
              <span className="badge badge-gray">{user?.proficiency || 'beginner'}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={12}/> {user?.email}
            </div>
          </div>

          {/* Quick stats */}
          {stats && (
            <div className="profile-sidebar-stats">
              <div className="profile-stat-row">
                <span className="profile-stat-num">{stats.sessions_attended ?? 0}</span>
                <span className="profile-stat-label">Sessions</span>
              </div>
              <div className="profile-stat-row">
                <span className="profile-stat-num" style={{ color: 'var(--blue)' }}>{availability.filter(d => d >= now.toISOString().slice(0, 10)).length}</span>
                <span className="profile-stat-label">Available</span>
              </div>
              {stats.avg_score != null && (
                <div className="profile-stat-row">
                  <span className="profile-stat-num">{stats.avg_score}</span>
                  <span className="profile-stat-label">Avg score</span>
                </div>
              )}
            </div>
          )}

          {/* Upcoming sessions */}
          {upcomingSessions.length > 0 && (
            <div className="profile-sidebar-upcoming">
              <div className="profile-sidebar-section-label"><Calendar size={12}/> Upcoming</div>
              {upcomingSessions.map(s => {
                const me = s.participants?.find(p => p.user_id === user?.id)
                const days = s.scheduled_at
                  ? Math.ceil((new Date(s.scheduled_at) - Date.now()) / 86400000)
                  : null
                return (
                  <Link key={s.id} to={`/sessions/${s.id}`} className="profile-upcoming-item">
                    <span className="profile-upcoming-title">{s.title}</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                      {me?.role_name && <span className="badge badge-gray" style={{ fontSize: 10 }}>{me.role_name}</span>}
                      {days != null && <span style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 700 }}><Clock size={10}/> {days === 0 ? 'Today' : `${days}d`}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </aside>

        {/* ── Main panel ── */}
        <div className="profile-main">
          <div className="profile-tabs">
            {[['profile', User, 'Profile'], ['availability', Calendar, 'Availability'], ['stats', TrendingUp, 'My Stats']].map(([id, Icon, label]) => (
              <button key={id} className={`profile-tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
                <Icon size={14}/> {label}
              </button>
            ))}
          </div>

          {/* ── Profile tab ── */}
          {tab === 'profile' && (
            <div className="profile-section">
              <div className="profile-fields-stack">
                <div className="profile-field">
                  <span className="profile-field-label"><User size={13}/> Full Name</span>
                  <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label"><Mail size={13}/> Email</span>
                  <input className="input" value={user?.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}/>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Email cannot be changed</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label"><GraduationCap size={13}/> Grade / Year</span>
                  <input className="input" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} placeholder="e.g. Year 10"/>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label"><Phone size={13}/> Phone Number</span>
                  <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +44 7700 900000"/>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label"><School size={13}/> School / Institution</span>
                  <input className="input" value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} placeholder="e.g. Westminster School"/>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label"><Shield size={13}/> Proficiency Level</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {PROFICIENCY_LEVELS.map(level => (
                      <button key={level} onClick={() => setForm({ ...form, proficiency: level })}
                        className={`btn ${form.proficiency === level ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, justifyContent: 'center', textTransform: 'capitalize', fontSize: 13 }}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ paddingTop: 20, borderTop: '1px solid #E8E8E8' }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ── Availability tab ── */}
          {tab === 'availability' && (
            <div className="profile-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Mark Your Availability</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                    Click dates when you're available to debate. Admins use this when scheduling sessions.
                  </p>
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
                availableDates={availability}
                onToggle={handleToggleAvailability}
                loading={availLoading}
              />
              <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 14, height: 14, background: 'var(--yellow)', border: '2px solid #121212', display: 'inline-block' }}/>
                  Available
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 14, height: 14, background: 'white', border: '2px solid #ccc', display: 'inline-block' }}/>
                  Unavailable / not marked
                </span>
              </div>
            </div>
          )}

          {/* ── Stats tab ── */}
          {tab === 'stats' && (
            <div className="profile-section">
              {stats ? (
                <>
                  <div className="profile-stats-grid">
                    <div className="profile-stats-block">
                      <span className="profile-stats-num">{stats.sessions_attended ?? 0}</span>
                      <span className="profile-stats-label">Sessions Attended</span>
                    </div>
                    <div className="profile-stats-block">
                      <span className="profile-stats-num">{stats.total_sessions ?? 0}</span>
                      <span className="profile-stats-label">Sessions Assigned</span>
                    </div>
                    {stats.avg_score != null && (
                      <div className="profile-stats-block">
                        <span className="profile-stats-num">{stats.avg_score}</span>
                        <span className="profile-stats-label">Avg Speaker Score</span>
                      </div>
                    )}
                  </div>

                  {stats.roles_played?.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <div className="profile-field-label" style={{ marginBottom: 10 }}>Roles Played</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {stats.roles_played.map(r => <span key={r} className="badge badge-gray">{r}</span>)}
                      </div>
                    </div>
                  )}

                  {stats.sides_played?.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <div className="profile-field-label" style={{ marginBottom: 10 }}>Sides Debated</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {stats.sides_played.map(s => (
                          <span key={s} className={`badge ${s === 'proposition' ? 'badge-blue' : s === 'opposition' ? 'badge-red' : 'badge-gray'}`}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.total_sessions === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 16 }}>
                      No session history yet — join a session to start building your record.
                    </p>
                  )}
                </>
              ) : (
                <div className="loading">Loading stats…</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
