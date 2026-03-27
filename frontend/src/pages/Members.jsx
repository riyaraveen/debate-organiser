import { useState, useEffect } from 'react'
import { getUsers, updateUserRole } from '../api'
import { useAuth } from '../context/AuthContext'
import { School } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

/* Deterministic colour per member based on name */
const AVATAR_PALETTE = ['#1040C0', '#D02020', '#7030D0', '#0891b2', '#1A8040', '#D06010']
function avatarColor(name) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xFFFF
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

const PROFICIENCY_BADGE = {
  beginner:     'badge-green',
  intermediate: 'badge-blue',
  advanced:     'badge-red',
}

export default function Members() {
  const { user: me } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getUsers().then(r => setMembers(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    if (userId === me?.id) return
    const res = await updateUserRole(userId, newRole)
    setMembers(prev => prev.map(m => m.id === userId ? res.data : m))
  }

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  const adminCount  = members.filter(m => m.role === 'admin').length
  const memberCount = members.length - adminCount

  return (
    <div className="page-container">
      <PageHero title="Members" subtitle={`${members.length} club members`} color="#D02020">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          {/* Row of Bauhaus figures — circle heads + rectangle torsos */}
          {[44, 100, 160, 220, 280, 336, 388].map((x, i) => (
            <g key={i}>
              <circle cx={x} cy={24} r={13} fill="white" opacity={0.18 + (i % 3) * 0.07}/>
              <rect x={x - 11} y={38} width={22} height={30} fill="white" opacity={0.12 + (i % 3) * 0.05}/>
            </g>
          ))}
          {/* Yellow circle accent */}
          <circle cx={370} cy={88} r={60} fill="#F0C020" opacity={0.22}/>
          {/* Blue triangle bottom-left */}
          <polygon points="0,88 72,88 0,28" fill="#1040C0" opacity={0.30}/>
        </svg>
      </PageHero>

      {/* Stats strip */}
      {!loading && (
        <div className="members-stats">
          <div className="members-stat">
            <span className="members-stat-num">{members.length}</span>
            <span className="members-stat-label">Total Members</span>
          </div>
          <div className="members-stat">
            <span className="members-stat-num" style={{ color: 'var(--red)' }}>{adminCount}</span>
            <span className="members-stat-label">Admins</span>
          </div>
          <div className="members-stat">
            <span className="members-stat-num" style={{ color: 'var(--blue)' }}>{memberCount}</span>
            <span className="members-stat-label">Members</span>
          </div>
          <div className="members-stat">
            <span className="members-stat-num" style={{ color: '#1A8040' }}>
              {members.filter(m => m.proficiency === 'advanced').length}
            </span>
            <span className="members-stat-label">Advanced</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="page-top-bar">
        <input className="input" placeholder="Search by name or email…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}/>
        <span className="text-muted" style={{ fontSize: 12 }}>
          {filtered.length} of {members.length} shown
        </span>
      </div>

      {loading ? <div className="loading">Loading…</div> : (
        <div className="members-grid">
          {filtered.map(m => {
            const color = avatarColor(m.name)
            return (
              <div key={m.id} className="member-card" style={{ '--member-color': color }}>
                {/* Coloured top band with avatar */}
                <div className="member-card-top">
                  <div className="member-card-avatar">{m.name[0].toUpperCase()}</div>
                  {m.id === me?.id && <span className="member-card-you">YOU</span>}
                </div>

                {/* Details */}
                <div className="member-card-body">
                  <div className="member-card-name">{m.name}</div>
                  <div className="member-card-email">{m.email}</div>

                  <div className="member-card-tags">
                    <span className={`badge ${PROFICIENCY_BADGE[m.proficiency] ?? 'badge-gray'}`}>
                      {m.proficiency}
                    </span>
                    <span className={`badge ${m.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>
                      {m.role}
                    </span>
                    {m.grade && <span className="badge badge-gray">{m.grade}</span>}
                  </div>

                  {m.school && (
                    <div className="member-card-school">
                      <School size={11}/> {m.school}
                    </div>
                  )}

                  {me?.role === 'admin' && m.id !== me?.id && (
                    <select value={m.role}
                      onChange={e => handleRoleChange(m.id, e.target.value)}
                      className="member-card-role-select">
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ padding: '40px 24px', color: 'var(--text-muted)', fontSize: 13, gridColumn: '1/-1' }}>
              No members match your search.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
