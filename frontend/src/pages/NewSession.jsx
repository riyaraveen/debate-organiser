import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFormats, getTopics, getRandomTopic, generateTopic, getUsers, createSession, getAvailability, getTemplates } from '../api'

const STEPS = ['Format', 'Topic', 'Participants', 'Details', 'Review']

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function computeAutoAssignments(participantIds, formatRoles) {
  const expanded = []
  for (const role of formatRoles) {
    const count = role.min_count ?? 1
    for (let i = 0; i < count; i++) expanded.push(role)
  }
  const shuffledRoles = shuffleArray(expanded)
  const shuffledIds = shuffleArray(participantIds)
  const result = {}
  shuffledIds.forEach((uid, i) => {
    const role = shuffledRoles[i]
    result[uid] = role
      ? { role_name: role.name, side: role.side ?? 'neutral' }
      : { role_name: 'Observer', side: 'neutral' }
  })
  return result
}

export default function NewSession() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [formats, setFormats] = useState([])
  const [topics, setTopics] = useState([])
  const [users, setUsers] = useState([])
  const [templates, setTemplates] = useState([])
  const [availabilityMap, setAvailabilityMap] = useState({})
  const [assignments, setAssignments] = useState({}) // userId -> { role_name, side }
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    format_id: null,
    topic_id: null,
    topic_text: '',
    mode: 'offline',
    title: '',
    scheduled_at: '',
    location: '',
    maps_url: '',
    participant_ids: [],
    auto_assign_roles: true,
  })

  useEffect(() => {
    getFormats().then((r) => setFormats(r.data))
    getTemplates().then((r) => setTemplates(r.data)).catch(() => {})
    getTopics({ is_go: true }).then((r) => setTopics(r.data))
    getUsers().then((r) => {
      setUsers(r.data)
      // Load availability for all members
      Promise.all(r.data.map(u => getAvailability(u.id).then(res => [u.id, res.data]))).then(entries => {
        setAvailabilityMap(Object.fromEntries(entries))
      })
    })
  }, [])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleRandomTopic = async () => {
    try {
      const res = await getRandomTopic()
      set('topic_id', res.data.id)
      set('topic_text', res.data.text)
    } catch {
      setError('No suitable topics found. Please add topics first.')
    }
  }

  const handleSuggestTopic = async () => {
    try {
      const res = await generateTopic()
      set('topic_id', null)
      set('topic_text', res.data.text)
    } catch {
      setError('Could not generate a topic suggestion.')
    }
  }

  const selectedFormat = formats.find((f) => f.id === form.format_id)
  const formatRoles = selectedFormat?.roles ?? []
  const uniqueRoles = [...new Map(formatRoles.map(r => [r.name, r])).values()]

  const reshuffle = () => {
    setAssignments(computeAutoAssignments(form.participant_ids, formatRoles))
  }

  const toggleParticipant = (id) => {
    const newIds = form.participant_ids.includes(id)
      ? form.participant_ids.filter((x) => x !== id)
      : [...form.participant_ids, id]
    set('participant_ids', newIds)
    if (form.auto_assign_roles) {
      setAssignments(computeAutoAssignments(newIds, formatRoles))
    } else {
      setAssignments(prev => {
        const next = { ...prev }
        if (!newIds.includes(id)) delete next[id]
        else next[id] = { role_name: null, side: null }
        return next
      })
    }
  }

  const setAssignment = (userId, field, value) => {
    setAssignments(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value || null },
    }))
  }

  const switchMode = (auto) => {
    set('auto_assign_roles', auto)
    if (auto) setAssignments(computeAutoAssignments(form.participant_ids, formatRoles))
  }

  const handleSubmit = async () => {
    setError('')
    try {
      const payload = {
        format_id: form.format_id,
        topic_id: form.topic_id,
        topic_text: form.topic_text,
        mode: form.mode,
        title: form.title,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        location: form.location,
        maps_url: form.maps_url || null,
        participant_ids: form.participant_ids,
        auto_assign_roles: false,
        manual_assignments: form.participant_ids.map(uid => ({
          user_id: uid,
          role_name: assignments[uid]?.role_name ?? null,
          side: assignments[uid]?.side ?? null,
        })),
      }
      const res = await createSession(payload)
      navigate(`/sessions/${res.data.id}`)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((e) => e.msg).join(', '))
      } else {
        setError(detail || 'Failed to create session')
      }
    }
  }

  const detailsStepIndex = STEPS.indexOf('Details')
  const reviewStepIndex = STEPS.indexOf('Review')

  const canNext = () => {
    if (step === 0) return !!form.format_id
    if (step === 1) return !!form.topic_text
    if (step === 2) return form.participant_ids.length > 0
    if (step === detailsStepIndex) return !!form.title
    return true
  }

  return (
    <div className="wizard-page">
      {/* Step indicator */}
      <div className="wizard-steps">
        {STEPS.map((s, i) => (
          <div key={s} className={`wizard-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
            <span className="wizard-step-num">{i + 1}</span>
            <span className="wizard-step-label">{s}</span>
          </div>
        ))}
      </div>

      <div className="wizard-body">
        {error && <div className="alert alert-error">{error}</div>}

        {/* Step 0: Format */}
        {step === 0 && (
          <div>
            <h3>Choose a debate format</h3>
            <p className="step-subtitle">Select the style of debate for this session.</p>
            {templates.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>Load from template</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {templates.map(t => (
                    <button key={t.id} className="btn btn-ghost" style={{ fontSize: 13 }}
                      onClick={() => {
                        set('format_id', t.format_id)
                        set('mode', t.mode)
                        if (t.location) set('location', t.location)
                        set('auto_assign_roles', t.auto_assign_roles)
                      }}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="format-cards">
              {formats.map((f) => (
                <button
                  key={f.id}
                  className={`format-card ${form.format_id === f.id ? 'selected' : ''}`}
                  onClick={() => set('format_id', f.id)}
                >
                  <strong>{f.name}</strong>
                  <p>{f.description.slice(0, 100)}…</p>
                  <small>{f.min_participants} participants</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Topic */}
        {step === 1 && (
          <div>
            <h3>Choose a topic</h3>
            <p className="step-subtitle">Type a custom motion, pick from the bank, or hit Random.</p>
            <div className="topic-input-row">
              <input
                className="input"
                placeholder="Type a custom topic or select below…"
                value={form.topic_text}
                onChange={(e) => { set('topic_text', e.target.value); set('topic_id', null) }}
              />
              <button className="btn btn-ghost" onClick={handleRandomTopic}>Random</button>
              <button className="btn btn-ghost" onClick={handleSuggestTopic}>✦ Suggest</button>
            </div>
            <div className="topics-list">
              {topics.slice(0, 20).map((t) => (
                <button
                  key={t.id}
                  className={`topic-chip ${form.topic_id === t.id ? 'selected' : ''}`}
                  onClick={() => { set('topic_id', t.id); set('topic_text', t.text) }}
                >
                  {t.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Participants */}
        {step === 2 && (
          <div>
            <h3>Select participants</h3>
            <p className="step-subtitle">Choose who's debating, then assign their roles.</p>
            {selectedFormat && (
              <p className="text-muted" style={{ marginBottom: 10 }}>
                {selectedFormat.name} needs {selectedFormat.min_participants}–{selectedFormat.max_participants} participants.
              </p>
            )}

            <div className="member-select-list">
              {users.map((u) => {
                const sessionDate = form.scheduled_at ? form.scheduled_at.slice(0, 10) : null
                const isAvailable = sessionDate && availabilityMap[u.id]?.includes(sessionDate)
                const hasMarked = availabilityMap[u.id]?.length > 0
                return (
                  <label key={u.id} className={`member-select-item ${form.participant_ids.includes(u.id) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={form.participant_ids.includes(u.id)} onChange={() => toggleParticipant(u.id)} />
                    <span className="avatar sm">{u.name[0]}</span>
                    <span>{u.name}</span>
                    <span className="text-muted">{u.grade || u.proficiency}</span>
                    {sessionDate && (
                      <span className={`badge ${isAvailable ? 'badge-green' : hasMarked ? 'badge-red' : 'badge-gray'}`}
                        style={{ fontSize: 11, marginLeft: 'auto' }}>
                        {isAvailable ? '✓ Available' : hasMarked ? '✗ Busy' : 'No data'}
                      </span>
                    )}
                  </label>
                )
              })}
            </div>

            {/* Role assignment mode toggle */}
            <div style={{ margin: '20px 0 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role assignment</span>
              <div style={{ display: 'flex', border: '2px solid #121212', overflow: 'hidden' }}>
                <button onClick={() => switchMode(true)} style={{
                  padding: '7px 18px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                  border: 'none', cursor: 'pointer',
                  background: form.auto_assign_roles ? '#121212' : '#fff',
                  color: form.auto_assign_roles ? '#fff' : '#121212',
                }}>
                  ⚡ Auto-assign
                </button>
                <button onClick={() => switchMode(false)} style={{
                  padding: '7px 18px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                  border: 'none', borderLeft: '2px solid #121212', cursor: 'pointer',
                  background: !form.auto_assign_roles ? '#121212' : '#fff',
                  color: !form.auto_assign_roles ? '#fff' : '#121212',
                }}>
                  ✎ Manual
                </button>
              </div>
              {form.auto_assign_roles && form.participant_ids.length > 0 && (
                <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={reshuffle}>🔀 Re-shuffle</button>
              )}
            </div>

            {/* Inline role table */}
            {form.participant_ids.length > 0 && (
              <div style={{ border: '2px solid #121212' }}>
                <div style={{ background: '#121212', color: '#fff', padding: '6px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {form.auto_assign_roles ? 'Auto-assigned roles — edit if needed' : 'Assign roles manually'}
                </div>
                {form.participant_ids.map(uid => {
                  const u = users.find(x => x.id === uid)
                  const a = assignments[uid] ?? {}
                  return (
                    <div key={uid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderBottom: '1px solid #e5e5e5', alignItems: 'center' }}>
                      <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>
                        <span className="avatar sm">{u?.name[0]}</span>
                        {u?.name}
                      </div>
                      <select value={a.role_name ?? ''} onChange={e => {
                        const role = uniqueRoles.find(r => r.name === e.target.value)
                        setAssignment(uid, 'role_name', e.target.value)
                        if (role?.side) setAssignment(uid, 'side', role.side)
                      }} style={{ margin: '6px', fontSize: 13, padding: '5px 8px', border: '1.5px solid #ccc' }}>
                        <option value="">— No role —</option>
                        {uniqueRoles.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                        <option value="Observer">Observer</option>
                      </select>
                      <select value={a.side ?? ''} onChange={e => setAssignment(uid, 'side', e.target.value)}
                        style={{ margin: '6px', fontSize: 13, padding: '5px 8px', border: '1.5px solid #ccc' }}>
                        <option value="">— No side —</option>
                        <option value="proposition">Proposition</option>
                        <option value="opposition">Opposition</option>
                        <option value="government">Government</option>
                        <option value="neutral">Neutral</option>
                      </select>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Details step */}
        {step === detailsStepIndex && (
          <div className="form-stack">
            <h3>Session details</h3>
            <label>Session Title *
              <input className="input" value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Weekly Debate — Term 2 Week 4" />
            </label>
            <label>Mode
              <select value={form.mode} onChange={(e) => set('mode', e.target.value)}>
                <option value="offline">Offline (In person)</option>
                <option value="online">Online (Virtual)</option>
              </select>
            </label>
            <label>Date & Time
              <input type="datetime-local" value={form.scheduled_at}
                onChange={(e) => set('scheduled_at', e.target.value)} />
            </label>
            <label>{form.mode === 'online' ? 'Meeting Link' : 'Location / Venue'}
              <input className="input" value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder={form.mode === 'online' ? 'https://meet.google.com/...' : 'e.g. Room 12, Main Building'} />
            </label>
            {form.mode !== 'online' && (
              <label>Google Maps URL <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                <input className="input" value={form.maps_url}
                  onChange={(e) => set('maps_url', e.target.value)}
                  placeholder="Paste a Google Maps link — e.g. https://maps.google.com/..." />
              </label>
            )}
          </div>
        )}

        {/* Review step */}
        {step === reviewStepIndex && (
          <div className="review-panel">
            <h3>Review & Create</h3>
            <dl className="review-list">
              <dt>Format</dt><dd>{selectedFormat?.name}</dd>
              <dt>Topic</dt><dd>{form.topic_text}</dd>
              <dt>Mode</dt><dd>{form.mode}</dd>
              <dt>Title</dt><dd>{form.title}</dd>
              <dt>Date</dt><dd>{form.scheduled_at || 'TBC'}</dd>
              <dt>Location</dt><dd>{form.location || 'TBC'}{form.mode !== 'online' && form.maps_url ? ' (Maps link added)' : ''}</dd>
              <dt>Role assignment</dt><dd>{form.auto_assign_roles ? 'Auto-assigned' : 'Manual'}</dd>
              <dt>Participants</dt>
              <dd>
                {form.participant_ids.map((id) => {
                  const name = users.find((u) => u.id === id)?.name ?? `#${id}`
                  const role = assignments[id]?.role_name
                  return role ? `${name} (${role})` : name
                }).join(', ')}
              </dd>
            </dl>
          </div>
        )}
      </div>

      <div className="wizard-nav">
        {step > 0 && (
          <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>
        )}
        {step < STEPS.length - 1 ? (
          <button className="btn btn-primary" onClick={() => setStep(step + 1)} disabled={!canNext()}>
            Next
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleSubmit}>Create Session</button>
        )}
      </div>
    </div>
  )
}
