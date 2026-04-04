import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFormats, getTopics, getRandomTopic, generateTopic, getUsers, createSession, getAvailability, getTemplates } from '../api'

const BASE_STEPS = ['Format', 'Topic', 'Participants', 'Details', 'Review']
const MANUAL_STEPS = ['Format', 'Topic', 'Participants', 'Roles', 'Details', 'Review']

export default function NewSession() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [formats, setFormats] = useState([])
  const [topics, setTopics] = useState([])
  const [users, setUsers] = useState([])
  const [templates, setTemplates] = useState([])
  const [availabilityMap, setAvailabilityMap] = useState({}) // userId -> [date strings]
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    format_id: null,
    topic_id: null,
    topic_text: '',
    mode: 'offline',
    title: '',
    scheduled_at: '',
    location: '',
    participant_ids: [],
    auto_assign_roles: true,
    manual_assignments: {},
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

  const toggleParticipant = (id) => {
    const newIds = form.participant_ids.includes(id)
      ? form.participant_ids.filter((x) => x !== id)
      : [...form.participant_ids, id]
    // Remove manual assignment if participant removed
    if (!newIds.includes(id)) {
      setForm((f) => {
        const { [id]: _, ...rest } = f.manual_assignments
        return { ...f, participant_ids: newIds, manual_assignments: rest }
      })
    } else {
      set('participant_ids', newIds)
    }
  }

  const setAssignment = (userId, roleObj) => {
    setForm((f) => ({
      ...f,
      manual_assignments: { ...f.manual_assignments, [userId]: roleObj },
    }))
  }

  const selectedFormat = formats.find((f) => f.id === form.format_id)

  // Get unique roles from format
  const formatRoles = selectedFormat?.roles ?? []
  const uniqueRoles = []
  const seen = new Set()
  for (const r of formatRoles) {
    if (!seen.has(r.name)) {
      seen.add(r.name)
      uniqueRoles.push(r)
    }
  }

  const STEPS = form.auto_assign_roles ? BASE_STEPS : MANUAL_STEPS

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
        participant_ids: form.participant_ids,
        auto_assign_roles: form.auto_assign_roles,
      }
      if (!form.auto_assign_roles) {
        payload.manual_assignments = form.participant_ids.map((uid) => {
          const a = form.manual_assignments[uid]
          return { user_id: uid, role_name: a?.role_name ?? null, side: a?.side ?? null }
        })
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

  const rolesStepIndex = STEPS.indexOf('Roles')
  const detailsStepIndex = STEPS.indexOf('Details')
  const reviewStepIndex = STEPS.indexOf('Review')

  const canNext = () => {
    if (step === 0) return !!form.format_id
    if (step === 1) return !!form.topic_text
    if (step === 2) return form.participant_ids.length > 0
    if (!form.auto_assign_roles && step === rolesStepIndex) return true
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
            <p className="step-subtitle">Choose who's debating, then pick how roles are assigned.</p>
            {selectedFormat && (
              <p className="text-muted">
                {selectedFormat.name} needs {selectedFormat.min_participants} participants.
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

            <div className="role-assignment-toggle">
              <span className="role-assignment-label">Role assignment</span>
              <div className="role-toggle-btns">
                <button
                  className={`role-toggle-btn ${form.auto_assign_roles ? 'active' : ''}`}
                  onClick={() => set('auto_assign_roles', true)}
                >
                  Random
                </button>
                <button
                  className={`role-toggle-btn ${!form.auto_assign_roles ? 'active' : ''}`}
                  onClick={() => set('auto_assign_roles', false)}
                >
                  Manual
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 (manual only): Roles */}
        {!form.auto_assign_roles && step === rolesStepIndex && (
          <div>
            <h3>Assign roles</h3>
            <p className="step-subtitle">Choose a role for each participant. Leave blank to assign no role.</p>
            <div className="manual-roles-list">
              {form.participant_ids.map((uid) => {
                const u = users.find((x) => x.id === uid)
                const assignment = form.manual_assignments[uid]
                return (
                  <div key={uid} className="manual-role-row">
                    <div className="manual-role-user">
                      <span className="avatar sm">{u?.name[0]}</span>
                      <span>{u?.name}</span>
                    </div>
                    <select
                      className="manual-role-select"
                      value={assignment?.role_name ?? ''}
                      onChange={(e) => {
                        const roleName = e.target.value
                        const roleObj = uniqueRoles.find((r) => r.name === roleName)
                        setAssignment(uid, { role_name: roleName || null, side: roleObj?.side ?? null })
                      }}
                    >
                      <option value="">— No role —</option>
                      {uniqueRoles.map((r) => (
                        <option key={r.name} value={r.name}>{r.name} ({r.side})</option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
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
                placeholder={form.mode === 'online' ? 'https://meet.google.com/...' : 'Room 12, Main Building'} />
            </label>
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
              <dt>Location</dt><dd>{form.location || 'TBC'}</dd>
              <dt>Role assignment</dt><dd>{form.auto_assign_roles ? 'Random' : 'Manual'}</dd>
              <dt>Participants</dt>
              <dd>
                {form.participant_ids.map((id) => {
                  const name = users.find((u) => u.id === id)?.name ?? `#${id}`
                  if (!form.auto_assign_roles) {
                    const role = form.manual_assignments[id]?.role_name
                    return role ? `${name} (${role})` : name
                  }
                  return name
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
