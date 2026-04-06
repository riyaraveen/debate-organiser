import { useState, useEffect, useRef } from 'react'
import { getFormats, toggleFormat, createFormat, updateFormat, deleteFormat } from '../api'
import { Plus, ToggleLeft, ToggleRight, Users, Clock, ChevronDown, ChevronUp, UserCheck, Scale, GripVertical, Trash2, Edit2, Check, X, BarChart2, Search } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import { useToast } from '../context/ToastContext'

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

// ── Speaking Order Editor ────────────────────────────────────────────────────

function SpeakingOrderEditor({ fmt, onSave, onCancel }) {
  const [speeches, setSpeeches] = useState(parseJSON(fmt.speaking_order).map((s, i) => ({ ...s, _id: i })))
  const [saveError, setSaveError] = useState('')
  const dragIdx = useRef(null)
  const allRoles = parseJSON(fmt.roles).map(r => r.name)

  const update = (idx, field, val) => setSpeeches(s => s.map((r, i) => i === idx ? { ...r, [field]: val } : r))
  const remove = (idx) => setSpeeches(s => s.filter((_, i) => i !== idx))
  const add = () => setSpeeches(s => [...s, { role: '', description: '', duration_seconds: 300, _id: Date.now() }])

  const onDragStart = (i) => { dragIdx.current = i }
  const onDragOver = (e, i) => {
    e.preventDefault()
    if (dragIdx.current === null || dragIdx.current === i) return
    setSpeeches(s => {
      const next = [...s]
      const [moved] = next.splice(dragIdx.current, 1)
      next.splice(i, 0, moved)
      dragIdx.current = i
      return next
    })
  }
  const onDrop = () => { dragIdx.current = null }

  const totalSec = speeches.reduce((a, s) => a + (Number(s.duration_seconds) || 0), 0)

  const handleSave = () => {
    const empty = speeches.find(s => !s.role)
    if (empty) { setSaveError('All speeches must have a role selected.'); return }
    const clamped = speeches.map(({ _id, ...s }) => ({ ...s, duration_seconds: Math.max(30, Number(s.duration_seconds) || 30) }))
    onSave(clamped)
  }

  return (
    <div style={{ border: '2px solid #121212', marginTop: 16, background: '#fafafa' }}>
      <div style={{ background: '#121212', color: '#fff', padding: '8px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', justifyContent: 'space-between' }}>
        <span>Edit Speaking Order — {speeches.length} speech{speeches.length !== 1 ? 'es' : ''} · {fmtTime(totalSec)} total</span>
        <span style={{ opacity: 0.6, fontWeight: 400 }}>Drag to reorder</span>
      </div>
      {saveError && (
        <div style={{ padding: '6px 12px', background: '#FFF0F0', borderBottom: '1px solid #fcc', fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>{saveError}</div>
      )}
      <div>
        {speeches.map((s, i) => (
          <div key={s._id} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={onDrop}
            style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 80px 32px', gap: 6, padding: '8px 10px', borderBottom: '1px solid #e5e5e5', alignItems: 'center', cursor: 'grab', background: 'var(--bg-card)' }}>
            <GripVertical size={14} style={{ opacity: 0.4 }} />
            <select value={s.role} onChange={e => { update(i, 'role', e.target.value); setSaveError('') }}
              style={{ border: s.role ? '1.5px solid #ccc' : '1.5px solid var(--red)', padding: '4px 6px', font: 'inherit', fontSize: 12 }}>
              <option value="">— Role —</option>
              {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
              <option value="POI">POI</option>
            </select>
            <input placeholder="Description (e.g. 1st Prop speech)" value={s.description || ''}
              onChange={e => update(i, 'description', e.target.value)}
              style={{ border: '1.5px solid #ccc', padding: '4px 6px', font: 'inherit', fontSize: 12 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="number" min={30} step={30} value={s.duration_seconds}
                onChange={e => update(i, 'duration_seconds', Math.max(30, +e.target.value || 30))}
                style={{ border: '1.5px solid #ccc', padding: '4px 6px', font: 'inherit', fontSize: 12, width: '100%' }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>sec</span>
            </div>
            <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 0 }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={add}><Plus size={13} /> Add Speech</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={handleSave}><Check size={13} /> Save</button>
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={onCancel}><X size={13} /> Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Roles Editor ─────────────────────────────────────────────────────────────

const SIDE_OPTIONS = ['proposition', 'opposition', 'government', 'affirmative', 'negative', 'neutral']

function RolesEditor({ fmt, onSave, onCancel }) {
  const [roles, setRoles] = useState(parseJSON(fmt.roles).map((r, i) => ({ ...r, _id: i })))
  const [saveError, setSaveError] = useState('')

  const update = (idx, field, val) => setRoles(r => r.map((x, i) => i === idx ? { ...x, [field]: val } : x))
  const remove = (idx) => setRoles(r => r.filter((_, i) => i !== idx))
  const add = () => setRoles(r => [...r, { name: '', side: 'proposition', description: '', decides: false, min_count: null, _id: Date.now() }])

  const handleSave = () => {
    const empty = roles.find(r => !r.name.trim())
    if (empty) { setSaveError('All roles must have a name.'); return }
    onSave(roles.map(({ _id, ...r }) => r))
  }

  return (
    <div style={{ border: '2px solid #121212', marginTop: 16, background: '#fafafa' }}>
      <div style={{ background: '#1040C0', color: '#fff', padding: '8px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', justifyContent: 'space-between' }}>
        <span>Edit Roles — {roles.length} role{roles.length !== 1 ? 's' : ''}</span>
      </div>
      {saveError && (
        <div style={{ padding: '6px 12px', background: '#FFF0F0', borderBottom: '1px solid #fcc', fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>{saveError}</div>
      )}
      <div>
        {roles.map((r, i) => (
          <div key={r._id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr 80px 90px 32px', gap: 6, padding: '8px 10px', borderBottom: '1px solid #e5e5e5', alignItems: 'center', background: 'var(--bg-card)' }}>
            <input placeholder="Role name *" value={r.name}
              onChange={e => { update(i, 'name', e.target.value); setSaveError('') }}
              style={{ border: r.name ? '1.5px solid #ccc' : '1.5px solid var(--red)', padding: '4px 6px', font: 'inherit', fontSize: 12 }} />
            <select value={r.side} onChange={e => update(i, 'side', e.target.value)}
              style={{ border: '1.5px solid #ccc', padding: '4px 6px', font: 'inherit', fontSize: 12 }}>
              {SIDE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              <option value="audience">audience</option>
            </select>
            <input placeholder="Description" value={r.description || ''}
              onChange={e => update(i, 'description', e.target.value)}
              style={{ border: '1.5px solid #ccc', padding: '4px 6px', font: 'inherit', fontSize: 12 }} />
            <input type="number" placeholder="Count" min={1} value={r.min_count || ''}
              onChange={e => update(i, 'min_count', e.target.value ? +e.target.value : null)}
              style={{ border: '1.5px solid #ccc', padding: '4px 6px', font: 'inherit', fontSize: 12 }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={!!r.decides} onChange={e => update(i, 'decides', e.target.checked)} />
              Decides
            </label>
            <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 0 }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {roles.length === 0 && (
          <p style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>No roles yet. Click "Add Role" to get started.</p>
        )}
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={add}><Plus size={13} /> Add Role</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={handleSave}><Check size={13} /> Save</button>
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={onCancel}><X size={13} /> Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Format Card ──────────────────────────────────────────────────────────────

function FormatCard({ fmt, onToggle, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [editingOrder, setEditingOrder] = useState(false)
  const [editingRoles, setEditingRoles] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const roles = parseJSON(fmt.roles)
  const speakingOrder = parseJSON(fmt.speaking_order)

  const debaters  = roles.filter(r => r.side !== 'neutral' && r.side !== 'audience')
  const support   = roles.filter(r => r.side === 'neutral' && !r.decides)
  const deciders  = roles.filter(r => r.decides)
  const audience  = roles.filter(r => r.side === 'audience')

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
                <Users size={11} /> {fmt.min_participants === fmt.max_participants ? `${fmt.min_participants} participants` : `${fmt.min_participants}–${fmt.max_participants} participants`}
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
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          <button
            className={`btn ${fmt.is_active ? 'btn-ghost' : 'btn-primary'}`}
            style={{ fontSize: 11, padding: '5px 12px' }}
            onClick={() => onToggle(fmt.id)}
          >
            {fmt.is_active ? <><ToggleRight size={13} /> Disable</> : <><ToggleLeft size={13} /> Enable</>}
          </button>
          {!fmt.is_builtin && (
            confirmDelete ? (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700 }}>Delete?</span>
                <button className="btn btn-primary" style={{ fontSize: 11, padding: '4px 10px', background: 'var(--red)', borderColor: 'var(--red)' }}
                  onClick={() => onDelete(fmt.id)}>
                  <Check size={12} /> Yes
                </button>
                <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}
                  onClick={() => setConfirmDelete(false)}>
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 8px', color: 'var(--red)' }}
                onClick={() => setConfirmDelete(true)} title="Delete format">
                <Trash2 size={13} />
              </button>
            )
          )}
        </div>
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
                  {r.min_count && (
                    <span className="format-count-badge">×{r.min_count}</span>
                  )}
                  {r.description && <span className="format-role-desc" style={{ marginLeft: 6 }}>— {r.description}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Final decision ── */}
      {deciders.length > 0 && (
        <div className="format-roles-section format-decision-section">
          <div className="format-section-label" style={{ color: '#1A6030' }}>
            <Scale size={11} style={{ display: 'inline', marginRight: 4 }} />
            Final Decision
          </div>
          {deciders.map((r, i) => (
            <div key={i} className="format-decision-card">
              <div className="format-decision-icon"><Scale size={15} color="white" /></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="format-role-name">{r.name}</span>
                  {r.min_count && (
                    <span className="format-decision-count">
                      <Users size={11} /> {r.min_count === 1 ? '1 person required' : `${r.min_count} people required`}
                    </span>
                  )}
                </div>
                {r.description && <div className="format-role-desc" style={{ marginTop: 2 }}>{r.description}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Audience ── */}
      {audience.length > 0 && (
        <div className="format-roles-section format-audience-section">
          <div className="format-section-label" style={{ color: '#7C3AED' }}>
            <UserCheck size={11} style={{ display: 'inline', marginRight: 4 }} />
            Audience Required
          </div>
          {audience.map((r, i) => (
            <div key={i} className="format-audience-card">
              <div className="format-audience-icon">
                <UserCheck size={16} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="format-role-name">{r.description}</div>
                {r.min_count && (
                  <div className="format-audience-count">
                    <Users size={11} />
                    Minimum <strong>{r.min_count} audience members</strong> required
                    {r.max_count && <> · max {r.max_count}</>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Roles editor (custom only) ── */}
      {!fmt.is_builtin && (
        <div style={{ padding: '8px 14px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => { setEditingRoles(e => !e); setEditingOrder(false) }}>
            <Edit2 size={11} /> {editingRoles ? 'Cancel Roles Edit' : 'Edit Roles'}
          </button>
        </div>
      )}
      {editingRoles && (
        <div style={{ padding: '0 14px 14px' }}>
          <RolesEditor fmt={fmt} onCancel={() => setEditingRoles(false)}
            onSave={async (newRoles) => {
              await onUpdate(fmt.id, { roles: newRoles })
              setEditingRoles(false)
            }} />
        </div>
      )}

      {/* ── Speaking order (expandable) ── */}
      <div className="format-speaking-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="format-expand-btn" onClick={() => setExpanded(e => !e)} style={{ flex: 1 }}>
            <Clock size={12} />
            Speaking Order ({speakingOrder.length} speech{speakingOrder.length !== 1 ? 'es' : ''})
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {!fmt.is_builtin && (
            <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}
              onClick={() => { setEditingOrder(e => !e); setExpanded(true); setEditingRoles(false) }}>
              <Edit2 size={11} /> {editingOrder ? 'Cancel Edit' : 'Edit Order'}
            </button>
          )}
        </div>
        {editingOrder && (
          <SpeakingOrderEditor fmt={fmt} onCancel={() => setEditingOrder(false)}
            onSave={async (newOrder) => {
              await onUpdate(fmt.id, { speaking_order: newOrder })
              setEditingOrder(false)
            }} />
        )}
        {expanded && !editingOrder && (
          <div className="format-speaking-list">
            {speakingOrder.length === 0
              ? <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>No speaking order defined yet.{!fmt.is_builtin && ' Click "Edit Order" to add speeches.'}</p>
              : speakingOrder.map((s, i) => {
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
              })
            }
          </div>
        )}
      </div>
    </div>
  )
}

// ── Compare View ─────────────────────────────────────────────────────────────

function CompareView({ formats }) {
  const [showInactive, setShowInactive] = useState(false)
  const visible = showInactive ? formats : formats.filter(f => f.is_active)
  const totalTime = (fmt) => parseJSON(fmt.speaking_order).reduce((a, s) => a + (s.duration_seconds || 0), 0)
  const sides = (fmt) => [...new Set(parseJSON(fmt.roles).filter(r => r.side && r.side !== 'neutral' && r.side !== 'audience').map(r => r.side))]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--text-muted)' }}>
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
          Show inactive formats
        </label>
      </div>
      {visible.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>No active formats to compare. Enable at least one format or check "Show inactive".</p>
      ) : (
        <div style={{ overflowX: 'auto', border: '3px solid #121212' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#121212', color: '#fff' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>Attribute</th>
                {visible.map(f => (
                  <th key={f.id} style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>
                    {f.name}
                    {!f.is_active && <span style={{ display: 'block', fontSize: 9, fontWeight: 400, opacity: 0.6 }}>INACTIVE</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Participants', fn: f => f.min_participants === f.max_participants ? `${f.min_participants}` : `${f.min_participants}–${f.max_participants}` },
                { label: 'Total Speaking Time', fn: f => fmtTime(totalTime(f)) || '—' },
                { label: 'Speeches', fn: f => parseJSON(f.speaking_order).length || '—' },
                { label: 'Sides', fn: f => sides(f).join(', ') || '—' },
                { label: 'Judges', fn: f => { const d = parseJSON(f.roles).filter(r => r.decides); return d.length ? `${d[0].name} ×${d[0].min_count ?? 1}` : 'None' } },
                { label: 'Audience Required', fn: f => parseJSON(f.roles).some(r => r.side === 'audience') ? '✓ Yes' : 'No' },
                { label: 'Status', fn: f => f.is_active ? 'Active' : 'Inactive' },
              ].map(({ label, fn }, ri) => (
                <tr key={label} style={{ background: ri % 2 === 0 ? 'var(--bg-card)' : 'var(--off-white)', borderBottom: '1px solid #e5e5e5' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</td>
                  {visible.map(f => (
                    <td key={f.id} style={{ padding: '10px 16px', textAlign: 'center' }}>{fn(f)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Main Formats Page ────────────────────────────────────────────────────────

export default function Formats() {
  const toast = useToast()
  const [formats, setFormats] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [compareMode, setCompareMode] = useState(() => sessionStorage.getItem('formats_view') === 'compare')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    name: '', description: '', min_participants: 2, max_participants: 8,
    decider_type: 'none', decider_count: 1,
    requires_audience: false, min_audience: 20,
  })
  const [formError, setFormError] = useState('')
  const [error, setError] = useState('')

  // Auto-clear transient error banner after 4 s
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 4000)
    return () => clearTimeout(t)
  }, [error])

  useEffect(() => {
    getFormats(true).then((res) => setFormats(res.data)).finally(() => setLoading(false))
  }, [])

  const switchView = (isCompare) => {
    setCompareMode(isCompare)
    sessionStorage.setItem('formats_view', isCompare ? 'compare' : 'cards')
  }

  const handleToggle = async (id) => {
    try {
      const res = await toggleFormat(id)
      setFormats((prev) => prev.map((f) => f.id === id ? res.data : f))
      toast.success(`Format ${res.data.is_active ? 'enabled' : 'disabled'}`)
    } catch {
      setError('Failed to toggle format')
    }
  }

  const handleUpdate = async (id, data) => {
    try {
      const res = await updateFormat(id, data)
      setFormats((prev) => prev.map((f) => f.id === id ? res.data : f))
      toast.success('Format saved')
    } catch {
      setError('Failed to save changes')
      throw new Error('update failed')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteFormat(id)
      setFormats((prev) => prev.filter((f) => f.id !== id))
      toast.success('Format deleted')
    } catch {
      setError('Failed to delete format')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')

    if (form.min_participants > form.max_participants) {
      setFormError('Min participants cannot exceed max participants.')
      return
    }
    if (!form.name.trim()) {
      setFormError('Format name is required.')
      return
    }

    const roles = []
    if (form.decider_type !== 'none') {
      const deciderNames = {
        judge:        { name: 'Judge',        description: 'Evaluates arguments and decides the winner.' },
        panel:        { name: 'Judge',        description: 'Panel member — majority vote decides the winner.' },
        chair:        { name: 'Chairperson',  description: 'Chairs the debate and casts the deciding vote.' },
        audience_vote:{ name: 'Audience',     description: 'The audience votes to decide the winner.' },
      }
      const d = deciderNames[form.decider_type]
      roles.push({ name: d.name, side: 'neutral', description: d.description, decides: true, min_count: form.decider_count })
    }
    if (form.requires_audience) {
      roles.push({ name: 'Audience', side: 'audience', description: 'Audience members attend the debate.', min_count: form.min_audience })
    }

    try {
      const res = await createFormat({ ...form, roles, speaking_order: [] })
      setFormats((prev) => [...prev, res.data])
      setForm({ name: '', description: '', min_participants: 2, max_participants: 8, decider_type: 'none', decider_count: 1, requires_audience: false, min_audience: 20 })
      setShowForm(false)
      toast.success('Format created')
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create format')
    }
  }

  const filtered = formats.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="loading">Loading…</div>

  return (
    <div className="page-container">
      <PageHero title="Debate Formats" subtitle={`${formats.length} formats available`} color="#1040C0">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <rect x="20" y="30" width="30" height="44" fill="white" opacity="0.18"/>
          <rect x="14" y="26" width="42" height="8" fill="white" opacity="0.24"/>
          <circle cx="35" cy="16" r="9" fill="white" opacity="0.30"/>
          <rect x="350" y="30" width="30" height="44" fill="white" opacity="0.18"/>
          <rect x="344" y="26" width="42" height="8" fill="white" opacity="0.24"/>
          <circle cx="365" cy="16" r="9" fill="white" opacity="0.30"/>
          <circle cx="200" cy="44" r="48" fill="white" opacity="0.06"/>
          <circle cx="200" cy="44" r="28" fill="white" opacity="0.06"/>
          <polygon points="200,18 212,42 200,50 188,42" fill="#F0C020" opacity="0.35"/>
          <rect x="100" y="18" width="32" height="32" fill="#F0C020" opacity="0.18" transform="rotate(14 116 34)"/>
          <rect x="268" y="18" width="32" height="32" fill="white" opacity="0.10" transform="rotate(-10 284 34)"/>
          <circle cx="140" cy="66" r="18" fill="white" opacity="0.07"/>
          <circle cx="260" cy="66" r="18" fill="white" opacity="0.07"/>
        </svg>
      </PageHero>

      <div className="page-top-bar">
        <span className="text-muted" style={{ fontSize: 13 }}>{formats.filter(f => f.is_active).length} active · {formats.filter(f => !f.is_active).length} inactive</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${compareMode ? 'btn-primary' : 'btn-ghost'}`} onClick={() => switchView(!compareMode)}>
            <BarChart2 size={15} /> {compareMode ? 'Back to Cards' : 'Compare Formats'}
          </button>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setFormError('') }}>
            <Plus size={15} /> Add Custom Format
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} style={{
          border: '3px solid #121212', padding: 28, marginBottom: 24,
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <div>
            <h4 style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 13, margin: '0 0 4px' }}>New Custom Format</h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              Define the basics here. Roles and speaking order can be added after the format is created.
            </p>
          </div>

          {formError && <div className="alert alert-error" style={{ margin: 0 }}>{formError}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Format Name <span style={{ color: 'var(--red)' }}>*</span>
            </span>
            <input className="input" placeholder="e.g. British Parliamentary, Lincoln-Douglas, WSDC…"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Min Participants</span>
              <input type="number" className="input" value={form.min_participants}
                onChange={(e) => setForm({ ...form, min_participants: +e.target.value })}
                min={2} style={{ width: '100%', boxSizing: 'border-box' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Smallest viable team size</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Max Participants</span>
              <input type="number" className="input" value={form.max_participants}
                onChange={(e) => setForm({ ...form, max_participants: +e.target.value })}
                min={form.min_participants} style={{ width: '100%', boxSizing: 'border-box' }} />
              <span style={{ fontSize: 11, color: form.max_participants < form.min_participants ? 'var(--red)' : 'var(--text-muted)' }}>
                {form.max_participants < form.min_participants ? 'Must be ≥ min participants' : 'Upper limit for session planning'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</span>
            <textarea rows={3} placeholder="Briefly describe the format — its rules, structure, or what makes it unique…"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ border: '2px solid #121212', padding: '8px 12px', font: 'inherit', width: '100%', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Who decides the winner */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', border: '2px solid #e5e5e5', padding: 16, boxSizing: 'border-box' }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Who Decides the Winner?</span>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>Select the role responsible for judging the outcome of the debate.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: form.decider_type !== 'none' ? '1fr auto' : '1fr', gap: 12, alignItems: 'end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Decision maker</span>
                <select value={form.decider_type} onChange={e => setForm({ ...form, decider_type: e.target.value })}
                  style={{ border: '2px solid #121212', padding: '8px 10px', font: 'inherit', fontSize: 13, outline: 'none', background: 'var(--bg)', color: 'var(--text)' }}>
                  <option value="none">No designated decider</option>
                  <option value="judge">Single Judge</option>
                  <option value="panel">Panel of Judges (majority vote)</option>
                  <option value="chair">Chairperson / Speaker</option>
                  <option value="audience_vote">Audience Vote</option>
                </select>
              </div>
              {form.decider_type !== 'none' && form.decider_type !== 'audience_vote' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Count</span>
                  <input type="number" className="input" value={form.decider_count} min={1} max={9}
                    onChange={e => setForm({ ...form, decider_count: +e.target.value })}
                    style={{ width: 80, boxSizing: 'border-box' }} />
                </div>
              )}
            </div>
          </div>

          {/* Audience requirement */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', border: '2px solid #e5e5e5', padding: 16, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requires Audience?</span>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>Some formats (e.g. Oxford Style) require a live audience to vote or provide feedback.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
                <input type="checkbox" checked={form.requires_audience}
                  onChange={e => setForm({ ...form, requires_audience: e.target.checked })} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{form.requires_audience ? 'Yes' : 'No'}</span>
              </label>
            </div>
            {form.requires_audience && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Minimum audience size</span>
                <input type="number" className="input" value={form.min_audience} min={1}
                  onChange={e => setForm({ ...form, min_audience: +e.target.value })}
                  style={{ width: 120, boxSizing: 'border-box' }} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary">Create Format</button>
            <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setFormError('') }}>Cancel</button>
          </div>
        </form>
      )}

      {!compareMode && (
        <div className="learn-search-wrap" style={{ marginBottom: 16 }}>
          <Search size={14} className="learn-search-icon" />
          <input
            className="learn-search"
            placeholder="Search formats…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="learn-search-clear" onClick={() => setSearch('')}><X size={13} /></button>
          )}
        </div>
      )}

      {compareMode
        ? <CompareView formats={formats} />
        : filtered.length === 0
          ? <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 20, textAlign: 'center' }}>
              {search ? `No formats match "${search}"` : 'No formats found.'}
            </p>
          : (
            <div className="formats-grid">
              {filtered.map((f) => (
                <FormatCard key={f.id} fmt={f} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}
            </div>
          )
      }
    </div>
  )
}
