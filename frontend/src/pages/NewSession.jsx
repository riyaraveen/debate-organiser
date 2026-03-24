import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFormats, getTopics, getRandomTopic, getUsers, createSession } from '../api'

const STEPS = ['Format', 'Topic', 'Participants', 'Details', 'Review']

export default function NewSession() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [formats, setFormats] = useState([])
  const [topics, setTopics] = useState([])
  const [users, setUsers] = useState([])
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
  })

  useEffect(() => {
    getFormats().then((r) => setFormats(r.data))
    getTopics({ is_go: true }).then((r) => setTopics(r.data))
    getUsers().then((r) => setUsers(r.data))
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

  const toggleParticipant = (id) => {
    set('participant_ids', form.participant_ids.includes(id)
      ? form.participant_ids.filter((x) => x !== id)
      : [...form.participant_ids, id])
  }

  const selectedFormat = formats.find((f) => f.id === form.format_id)

  const handleSubmit = async () => {
    setError('')
    try {
      const payload = { ...form }
      if (payload.scheduled_at) payload.scheduled_at = new Date(payload.scheduled_at).toISOString()
      const res = await createSession(payload)
      navigate(`/sessions/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create session')
    }
  }

  const canNext = () => {
    if (step === 0) return !!form.format_id
    if (step === 1) return !!form.topic_text
    if (step === 2) return form.participant_ids.length > 0
    if (step === 3) return !!form.title
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
            <div className="format-cards">
              {formats.map((f) => (
                <button
                  key={f.id}
                  className={`format-card ${form.format_id === f.id ? 'selected' : ''}`}
                  onClick={() => set('format_id', f.id)}
                >
                  <strong>{f.name}</strong>
                  <p>{f.description.slice(0, 100)}…</p>
                  <small>{f.min_participants}–{f.max_participants} participants</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Topic */}
        {step === 1 && (
          <div>
            <h3>Choose a topic</h3>
            <div className="topic-input-row">
              <input
                className="input"
                placeholder="Type a custom topic or select below…"
                value={form.topic_text}
                onChange={(e) => { set('topic_text', e.target.value); set('topic_id', null) }}
              />
              <button className="btn btn-ghost" onClick={handleRandomTopic}>Random</button>
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
            {selectedFormat && (
              <p className="text-muted">
                {selectedFormat.name} needs {selectedFormat.min_participants}–{selectedFormat.max_participants} participants.
              </p>
            )}
            <div className="member-select-list">
              {users.map((u) => (
                <label key={u.id} className={`member-select-item ${form.participant_ids.includes(u.id) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.participant_ids.includes(u.id)}
                    onChange={() => toggleParticipant(u.id)}
                  />
                  <span className="avatar sm">{u.name[0]}</span>
                  <span>{u.name}</span>
                  <span className="text-muted">{u.grade || u.proficiency}</span>
                </label>
              ))}
            </div>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.auto_assign_roles}
                onChange={(e) => set('auto_assign_roles', e.target.checked)} />
              Auto-assign roles based on format
            </label>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
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

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="review-panel">
            <h3>Review & Create</h3>
            <dl className="review-list">
              <dt>Format</dt><dd>{selectedFormat?.name}</dd>
              <dt>Topic</dt><dd>{form.topic_text}</dd>
              <dt>Mode</dt><dd>{form.mode}</dd>
              <dt>Title</dt><dd>{form.title}</dd>
              <dt>Date</dt><dd>{form.scheduled_at || 'TBC'}</dd>
              <dt>Location</dt><dd>{form.location || 'TBC'}</dd>
              <dt>Participants</dt>
              <dd>{form.participant_ids.map((id) => users.find((u) => u.id === id)?.name).join(', ')}</dd>
              <dt>Auto-assign roles</dt><dd>{form.auto_assign_roles ? 'Yes' : 'No'}</dd>
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
