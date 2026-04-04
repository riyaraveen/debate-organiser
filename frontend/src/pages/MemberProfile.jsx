import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUser, getSessions, getAvailability, addAvailability, removeAvailability, updateProfile } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ArrowLeft, Mail, GraduationCap, Phone, School, Trophy, Calendar, Edit2, Check, X } from 'lucide-react'

const AVATAR_PALETTE = ['#1040C0', '#D02020', '#7030D0', '#0891b2', '#1A8040', '#D06010']
function avatarColor(name) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xFFFF
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function AvailabilityCalendar({ userId, isMe }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [marked, setMarked] = useState([])

  useEffect(() => {
    getAvailability(userId).then(r => setMarked(r.data)).catch(() => {})
  }, [userId])

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = new Date(year, month, 1).getDay()

  const toggle = async (dateStr) => {
    if (!isMe) return
    if (marked.includes(dateStr)) {
      await removeAvailability(dateStr)
      setMarked(m => m.filter(d => d !== dateStr))
    } else {
      await addAvailability(dateStr)
      setMarked(m => [...m, dateStr])
    }
  }

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  const monthName = new Date(year, month).toLocaleString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button className="btn btn-ghost" style={{ padding: '4px 10px' }} onClick={prevMonth}>‹</button>
        <strong style={{ minWidth: 140, textAlign: 'center' }}>{monthName}</strong>
        <button className="btn btn-ghost" style={{ padding: '4px 10px' }} onClick={nextMonth}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, fontSize: 12 }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isMarked = marked.includes(dateStr)
          const isPast = new Date(dateStr) < new Date(today.toDateString())
          return (
            <button key={day} onClick={() => toggle(dateStr)} disabled={!isMe || isPast}
              style={{
                padding: '6px 0', textAlign: 'center', border: '2px solid',
                borderColor: isMarked ? '#1A8040' : '#e5e5e5',
                background: isMarked ? '#d4edda' : isPast ? '#f5f5f5' : '#fff',
                color: isPast ? '#aaa' : '#121212',
                cursor: isMe && !isPast ? 'pointer' : 'default',
                fontWeight: isMarked ? 700 : 400,
              }}>
              {day}
            </button>
          )
        })}
      </div>
      {isMe && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Click a date to mark yourself as available.</p>}
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
  const [loading, setLoading] = useState(true)
  const [editingBio, setEditingBio] = useState(false)
  const [bioForm, setBioForm] = useState({ bio: '', phone: '', grade: '', school: '', proficiency: '' })

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

  if (loading) return <div className="loading">Loading…</div>
  if (!member) return <div className="empty-state">Member not found.</div>

  const participated = sessions.filter(s => s.participants?.some(p => p.user_id === member.id))
  const upcoming = participated.filter(s =>
    s.scheduled_at && new Date(s.scheduled_at) > new Date() &&
    s.status !== 'completed' && s.status !== 'cancelled'
  ).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))

  const wins = participated.filter(s => {
    const p = s.participants.find(p => p.user_id === member.id)
    return s.winner_team && p?.side && s.winner_team.toLowerCase() === p.side.toLowerCase()
  }).length
  const losses = participated.filter(s => {
    const p = s.participants.find(p => p.user_id === member.id)
    return s.winner_team && p?.side && s.winner_team.toLowerCase() !== p.side.toLowerCase() && s.winner_team !== 'Draw'
  }).length
  const draws = participated.filter(s => s.winner_team === 'Draw').length
  const completed = participated.filter(s => s.status === 'completed').length

  const color = avatarColor(member.name)
  const isMe = me?.id === member.id

  return (
    <div className="page-container">
      <button className="back-btn" onClick={() => navigate('/members')}><ArrowLeft size={15} /> Back</button>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Header card */}
        <div style={{ border: '3px solid #121212', marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ background: color, height: 80, position: 'relative',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
            backgroundSize: '12px 12px' }}>
            <div style={{ position: 'absolute', bottom: -28, left: 24, width: 56, height: 56,
              background: color, border: '3px solid #121212', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff' }}>
              {member.name[0].toUpperCase()}
            </div>
          </div>
          <div style={{ padding: '36px 24px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h2 style={{ margin: 0 }}>{member.name} {isMe && <span style={{ fontSize: 12, background: '#F0C020', padding: '2px 8px', fontWeight: 700 }}>YOU</span>}</h2>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <span className={`badge ${member.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>{member.role}</span>
                  <span className="badge badge-gray">{member.proficiency}</span>
                  {member.grade && <span className="badge badge-gray">{member.grade}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 16 }}>
              {[
                { icon: Mail, label: 'Email', value: member.email },
                { icon: Phone, label: 'Phone', value: member.phone },
                { icon: School, label: 'School', value: member.school },
                { icon: GraduationCap, label: 'Grade', value: member.grade },
              ].map(({ icon: Icon, label, value }) => value ? (
                <div key={label} style={{ fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon size={12} /> {label}
                  </span>
                  <strong>{value}</strong>
                </div>
              ) : null)}
              {member.bio && !editingBio && (
                <div style={{ fontSize: 13, gridColumn: '1/-1' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Bio</span>
                  <p>{member.bio}</p>
                </div>
              )}
            </div>

            {isMe && !editingBio && (
              <button className="btn btn-ghost" style={{ marginTop: 12, fontSize: 13 }} onClick={() => setEditingBio(true)}>
                <Edit2 size={13} /> Edit Profile
              </button>
            )}
            {isMe && editingBio && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 13 }}>Bio
                  <textarea rows={3} value={bioForm.bio} onChange={e => setBioForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell the club about yourself…" />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <label style={{ fontSize: 13 }}>Phone <input value={bioForm.phone} onChange={e => setBioForm(f => ({ ...f, phone: e.target.value }))} /></label>
                  <label style={{ fontSize: 13 }}>Grade <input value={bioForm.grade} onChange={e => setBioForm(f => ({ ...f, grade: e.target.value }))} /></label>
                  <label style={{ fontSize: 13 }}>School <input value={bioForm.school} onChange={e => setBioForm(f => ({ ...f, school: e.target.value }))} /></label>
                  <label style={{ fontSize: 13 }}>Proficiency
                    <select value={bioForm.proficiency} onChange={e => setBioForm(f => ({ ...f, proficiency: e.target.value }))}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={handleSaveBio}><Check size={13} /> Save</button>
                  <button className="btn btn-ghost" onClick={() => setEditingBio(false)}><X size={13} /> Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming sessions */}
        {upcoming.length > 0 && (
          <div style={{ border: '3px solid #121212', padding: 20, marginBottom: 24 }}>
            <h3 style={{ marginTop: 0 }}><Calendar size={16} /> Upcoming Sessions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcoming.map(s => {
                const p = s.participants.find(x => x.user_id === member.id)
                const daysUntil = Math.round((new Date(s.scheduled_at) - Date.now()) / 86400000)
                return (
                  <Link key={s.id} to={`/sessions/${s.id}`}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', border: '2px solid #e5e5e5', textDecoration: 'none', color: 'inherit' }}>
                    <div>
                      <strong style={{ fontSize: 14 }}>{s.title}</strong>
                      {p?.role_name && <span className="badge badge-gray" style={{ marginLeft: 8, fontSize: 11 }}>{p.role_name}</span>}
                    </div>
                    <span style={{ color: 'var(--blue)', fontWeight: 600, fontSize: 13 }}>
                      {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Sessions', value: participated.length, color: 'var(--blue)' },
            { label: 'Wins', value: wins, color: '#1A8040' },
            { label: 'Losses', value: losses, color: 'var(--red)' },
            { label: 'Draws', value: draws, color: '#888' },
          ].map(({ label, value, color: c }) => (
            <div key={label} style={{ border: '3px solid #121212', padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: c }}>{value}</div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Availability calendar */}
        <div style={{ border: '3px solid #121212', padding: 20, marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}><Calendar size={16} /> Availability</h3>
          <AvailabilityCalendar userId={member.id} isMe={isMe} />
        </div>

        {/* Session history */}
        <div style={{ border: '3px solid #121212', padding: 20 }}>
          <h3 style={{ marginTop: 0 }}><Trophy size={16} /> Session History</h3>
          {participated.length === 0 ? (
            <p className="text-muted">No sessions yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {participated.map(s => {
                const p = s.participants.find(x => x.user_id === member.id)
                const won = s.winner_team && p?.side && s.winner_team.toLowerCase() === p.side.toLowerCase()
                const lost = s.winner_team && p?.side && s.winner_team.toLowerCase() !== p.side.toLowerCase() && s.winner_team !== 'Draw'
                return (
                  <Link key={s.id} to={`/sessions/${s.id}`}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', border: '2px solid #e5e5e5', textDecoration: 'none', color: 'inherit' }}>
                    <div>
                      <strong style={{ fontSize: 14 }}>{s.title}</strong>
                      {p?.role_name && <span className="badge badge-gray" style={{ marginLeft: 8, fontSize: 11 }}>{p.role_name}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                      {s.scheduled_at && <span className="text-muted">{new Date(s.scheduled_at).toLocaleDateString('en-GB')}</span>}
                      {s.status === 'completed' && (
                        <span className={`badge ${won ? 'badge-green' : lost ? 'badge-red' : 'badge-gray'}`}>
                          {won ? 'Win' : lost ? 'Loss' : s.winner_team === 'Draw' ? 'Draw' : 'N/A'}
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
      </div>
    </div>
  )
}
