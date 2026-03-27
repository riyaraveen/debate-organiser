import { useState, useEffect } from 'react'
import { getFormats, toggleFormat, createFormat } from '../api'
import { Plus, ToggleLeft, ToggleRight, Users, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

const SIDE_COLORS = {
  proposition:  { bg: '#1040C0', color: 'white',        label: 'Prop'  },
  government:   { bg: '#1040C0', color: 'white',        label: 'Gov'   },
  affirmative:  { bg: '#1040C0', color: 'white',        label: 'Aff'   },
  opposition:   { bg: '#D02020', color: 'white',        label: 'Opp'   },
  negative:     { bg: '#D02020', color: 'white',        label: 'Neg'   },
  neutral:      { bg: '#121212', color: 'white',        label: 'Neut'  },
}

function sideStyle(side) {
  return SIDE_COLORS[side] ?? { bg: '#555', color: 'white', label: side }
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s === 0 ? `${m} min` : `${m}m ${s}s`
}

function parseJSON(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch { return [] }
}

function FormatCard({ fmt, onToggle }) {
  const [expanded, setExpanded] = useState(false)
  const roles = parseJSON(fmt.roles)
  const speakingOrder = parseJSON(fmt.speaking_order)

  const debaters  = roles.filter(r => r.side !== 'neutral')
  const support   = roles.filter(r => r.side === 'neutral')

  return (
    <div className={`format-card ${fmt.is_active ? '' : 'format-card-inactive'}`}>
      {/* ── Header ── */}
      <div className="format-card-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
          <div className="format-card-icon">
            {fmt.name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 className="format-card-name">{fmt.name}</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 5 }}>
              <span className="format-meta-chip">
                <Users size={11} /> {fmt.min_participants}–{fmt.max_participants} participants
              </span>
              <span className={`badge ${fmt.is_builtin ? 'badge-gray' : 'badge-blue'}`} style={{ fontSize: 10 }}>
                {fmt.is_builtin ? 'Built-in' : 'Custom'}
              </span>
              <span className={`badge ${fmt.is_active ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>
                {fmt.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        <button
          className={`btn ${fmt.is_active ? 'btn-ghost' : 'btn-primary'}`}
          style={{ fontSize: 11, padding: '5px 12px', flexShrink: 0 }}
          onClick={() => onToggle(fmt.id)}
        >
          {fmt.is_active ? <><ToggleRight size={13} /> Disable</> : <><ToggleLeft size={13} /> Enable</>}
        </button>
      </div>

      {/* ── Description ── */}
      {fmt.description && (
        <p className="format-card-desc">{fmt.description}</p>
      )}

      {/* ── Debating roles ── */}
      {debaters.length > 0 && (
        <div className="format-roles-section">
          <div className="format-section-label">Debating Roles</div>
          <div className="format-roles-list">
            {debaters.map((r, i) => {
              const { bg, color } = sideStyle(r.side)
              return (
                <div key={i} className="format-role-chip" style={{ borderLeftColor: bg }}>
                  <span className="format-role-badge" style={{ background: bg, color }}>{r.side.slice(0,4).toUpperCase()}</span>
                  <div>
                    <div className="format-role-name">{r.name}</div>
                    {r.description && <div className="format-role-desc">{r.description}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Support roles (neutral) ── */}
      {support.length > 0 && (
        <div className="format-roles-section">
          <div className="format-section-label">Support Roles</div>
          <div className="format-support-list">
            {support.map((r, i) => (
              <div key={i} className="format-support-chip">
                <span className="format-support-dot" />
                <div>
                  <span className="format-role-name">{r.name}</span>
                  {r.description && <span className="format-role-desc" style={{ marginLeft: 6 }}>— {r.description}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Speaking order (expandable) ── */}
      {speakingOrder.length > 0 && (
        <div className="format-speaking-section">
          <button className="format-expand-btn" onClick={() => setExpanded(e => !e)}>
            <Clock size={12} />
            Speaking Order ({speakingOrder.length} speeches)
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {expanded && (
            <div className="format-speaking-list">
              {speakingOrder.map((s, i) => {
                const matchedRole = roles.find(r => r.name === s.role)
                const { bg } = sideStyle(matchedRole?.side ?? 'neutral')
                return (
                  <div key={i} className="format-speech-row">
                    <span className="format-speech-num" style={{ background: bg }}>{i + 1}</span>
                    <div className="format-speech-info">
                      <span className="format-speech-role">{s.role}</span>
                      {s.description && <span className="format-speech-desc">{s.description}</span>}
                    </div>
                    <span className="format-speech-time">{fmtTime(s.duration_seconds)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Formats() {
  const [formats, setFormats] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', min_participants: 2, max_participants: 8 })
  const [error, setError] = useState('')

  useEffect(() => {
    getFormats().then((res) => setFormats(res.data)).finally(() => setLoading(false))
  }, [])

  const handleToggle = async (id) => {
    try {
      const res = await toggleFormat(id)
      setFormats((prev) => prev.map((f) => f.id === id ? res.data : f))
    } catch {
      setError('Failed to toggle format')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await createFormat({ ...form, roles: [], speaking_order: [] })
      setFormats((prev) => [...prev, res.data])
      setForm({ name: '', description: '', min_participants: 2, max_participants: 8 })
      setShowForm(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create format')
    }
  }

  if (loading) return <div className="loading">Loading…</div>

  return (
    <div className="page-container">
      <PageHero title="Debate Formats" subtitle={`${formats.length} formats available`} color="#1040C0">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          {/* Podium/lectern shapes */}
          <rect x="20" y="30" width="30" height="44" fill="white" opacity="0.18"/>
          <rect x="14" y="26" width="42" height="8" fill="white" opacity="0.24"/>
          {/* Left figure at podium */}
          <circle cx="35" cy="16" r="9" fill="white" opacity="0.30"/>
          {/* Right podium */}
          <rect x="350" y="30" width="30" height="44" fill="white" opacity="0.18"/>
          <rect x="344" y="26" width="42" height="8" fill="white" opacity="0.24"/>
          <circle cx="365" cy="16" r="9" fill="white" opacity="0.30"/>
          {/* Center decorative shapes */}
          <circle cx="200" cy="44" r="48" fill="white" opacity="0.06"/>
          <circle cx="200" cy="44" r="28" fill="white" opacity="0.06"/>
          <polygon points="200,18 212,42 200,50 188,42" fill="#F0C020" opacity="0.35"/>
          {/* Scattered shapes */}
          <rect x="100" y="18" width="32" height="32" fill="#F0C020" opacity="0.18" transform="rotate(14 116 34)"/>
          <rect x="268" y="18" width="32" height="32" fill="white" opacity="0.10" transform="rotate(-10 284 34)"/>
          <circle cx="140" cy="66" r="18" fill="white" opacity="0.07"/>
          <circle cx="260" cy="66" r="18" fill="white" opacity="0.07"/>
        </svg>
      </PageHero>

      <div className="page-top-bar">
        <span className="text-muted" style={{ fontSize: 13 }}>{formats.filter(f => f.is_active).length} active · {formats.filter(f => !f.is_active).length} inactive</span>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={15} /> Add Custom Format
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="add-topic-form form-stack" style={{ flexDirection: 'column' }}>
          <h4 style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 13 }}>New Format</h4>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input className="input" placeholder="Format name *" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ flex: 2, minWidth: 180 }} required />
            <input type="number" className="input" placeholder="Min participants" value={form.min_participants}
              onChange={(e) => setForm({ ...form, min_participants: +e.target.value })} style={{ flex: 1, minWidth: 100 }} min={2} />
            <input type="number" className="input" placeholder="Max participants" value={form.max_participants}
              onChange={(e) => setForm({ ...form, max_participants: +e.target.value })} style={{ flex: 1, minWidth: 100 }} min={2} />
          </div>
          <textarea rows={2} placeholder="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ border: '2px solid #121212', padding: '8px 12px', font: 'inherit', width: '100%', resize: 'vertical', outline: 'none' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary">Create Format</button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="formats-grid">
        {formats.map((f) => (
          <FormatCard key={f.id} fmt={f} onToggle={handleToggle} />
        ))}
      </div>
    </div>
  )
}
