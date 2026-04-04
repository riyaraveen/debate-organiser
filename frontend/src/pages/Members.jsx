import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUsers, updateUserRole } from '../api'
import { useAuth } from '../context/AuthContext'
import { School, X, Mail, GraduationCap, Phone, Shield, User } from 'lucide-react'
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

function MemberModal({ member, me, onClose, onRoleChange }) {
  const color = avatarColor(member.name)
  const fields = [
    { icon: Mail,          label: 'Email',              value: member.email },
    { icon: Shield,        label: 'Role',               value: member.role },
    { icon: GraduationCap, label: 'Grade / Year',       value: member.grade },
    { icon: Phone,         label: 'Phone',              value: member.phone },
    { icon: School,        label: 'School',             value: member.school },
    { icon: Shield,        label: 'Proficiency',        value: member.proficiency },
  ]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="member-modal" onClick={e => e.stopPropagation()}>
        {/* Header band */}
        <div className="member-modal-header" style={{ '--member-color': color,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: '12px 12px' }}>
          <div className="member-modal-avatar">{member.name[0].toUpperCase()}</div>
          <button className="member-modal-close" onClick={onClose}><X size={16}/></button>
        </div>

        {/* Body */}
        <div className="member-modal-body">
          <div className="member-modal-name">
            {member.name}
            {member.id === me?.id && <span className="member-card-you" style={{ position: 'static', marginLeft: 8 }}>YOU</span>}
          </div>
          <div className="member-modal-badges">
            <span className={`badge ${member.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>{member.role}</span>
            <span className={`badge ${PROFICIENCY_BADGE[member.proficiency] ?? 'badge-gray'}`}>{member.proficiency}</span>
          </div>

          <div className="member-modal-fields">
            {fields.map(({ icon: Icon, label, value }) => (
              <div key={label} className="member-modal-field">
                <span className="member-modal-field-label"><Icon size={13}/> {label}</span>
                <span className="member-modal-field-value">{value || <em className="text-muted">Not set</em>}</span>
              </div>
            ))}
          </div>

          <Link to={`/members/${member.id}`} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}>
            <User size={14} /> View Profile
          </Link>

          {me?.role === 'admin' && member.id !== me?.id && (
            <div className="member-modal-role-row">
              <span className="member-modal-field-label">Change Role</span>
              <select value={member.role}
                onChange={e => onRoleChange(member.id, e.target.value)}
                className="member-card-role-select" style={{ marginTop: 0 }}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Members() {
  const { user: me } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getUsers().then(r => setMembers(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    if (userId === me?.id) return
    const res = await updateUserRole(userId, newRole)
    setMembers(prev => prev.map(m => m.id === userId ? res.data : m))
    setSelected(prev => prev?.id === userId ? res.data : prev)
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

      {selected && (
        <MemberModal
          member={selected}
          me={me}
          onClose={() => setSelected(null)}
          onRoleChange={handleRoleChange}
        />
      )}

      {loading ? <div className="loading">Loading…</div> : (
        <div className="members-grid">
          {filtered.map(m => {
            const color = avatarColor(m.name)
            return (
              <div key={m.id} className="member-card" style={{ '--member-color': color, cursor: 'pointer' }}
                onClick={() => setSelected(m)}>
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
                      onClick={e => e.stopPropagation()}
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
            <div className="empty-illustration" style={{ gridColumn: '1/-1' }}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                {[18, 40, 62].map((x, i) => (
                  <g key={i}>
                    <circle cx={x} cy={28} r={10} stroke="#121212" strokeWidth="3" fill={i===1?"#F0C020":"none"}/>
                    <path d={`M${x-14} 60 Q${x} 44 ${x+14} 60`} stroke="#121212" strokeWidth="3" fill="none"/>
                  </g>
                ))}
              </svg>
              <h3>No members found</h3>
              <p>{search ? `No members match "${search}".` : 'No members have joined yet.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
