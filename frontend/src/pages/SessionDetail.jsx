import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getSession, updateSession, deleteSession, getFormat, notifyCalendar } from '../api'
import { useAuth } from '../context/AuthContext'
import { Calendar, MapPin, Users, Edit2, Trash2, Trophy, Link as LinkIcon, FileText, Sparkles, MessageCircle, ArrowLeft } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

export default function SessionDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [format, setFormat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [recordingResult, setRecordingResult] = useState(false)
  const [resultForm, setResultForm] = useState({ winner_team: '', result_notes: '' })

  useEffect(() => {
    getSession(id)
      .then((res) => {
        setSession(res.data)
        setEditForm({
          title: res.data.title,
          topic_text: res.data.topic_text || '',
          scheduled_at: res.data.scheduled_at ? res.data.scheduled_at.slice(0, 16) : '',
          location: res.data.location || '',
          status: res.data.status,
          additional_notes: res.data.additional_notes || '',
        })
        return getFormat(res.data.format_id)
      })
      .then((res) => setFormat(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))

  }, [id])

  const handleSave = async () => {
    try {
      const payload = { ...editForm }
      if (payload.scheduled_at) payload.scheduled_at = new Date(payload.scheduled_at).toISOString()
      const res = await updateSession(id, payload)
      setSession(res.data)
      setEditing(false)
    } catch (err) {
      alert(err.response?.data?.detail || 'Update failed')
    }
  }

  const handleRecordResult = async () => {
    try {
      const payload = { status: 'completed', ...resultForm }
      const res = await updateSession(id, payload)
      setSession(res.data)
      setRecordingResult(false)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record result')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this session? This cannot be undone.')) return
    await deleteSession(id)
    navigate('/sessions')
  }

  const buildIcsUrl = () => {
    if (!session?.scheduled_at) return null
    const dt = new Date(session.scheduled_at)
    const dtStr = dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const dtEnd = new Date(dt.getTime() + 90 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: session.title,
      details: session.topic_text || '',
      location: session.location || '',
      dates: `${dtStr}/${dtEnd}`,
    })
    return `https://calendar.google.com/calendar/render?${params}`
  }

  if (loading) return <div className="loading">Loading…</div>
  if (!session) return <div className="empty-state">Session not found.</div>

  const isAdmin = user?.role === 'admin'
  const gcalUrl = buildIcsUrl()

  return (
    <div className="page-container">
      <PageHero title="Session" subtitle="Session detail" color="#1040C0">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <circle cx="60" cy="44" r="65" fill="white" opacity="0.06"/>
          <rect x="140" y="10" width="55" height="55" fill="#F0C020" opacity="0.18" transform="rotate(10 167 37)"/>
          <circle cx="260" cy="44" r="50" fill="white" opacity="0.07"/>
          <circle cx="260" cy="44" r="28" fill="white" opacity="0.07"/>
          <polygon points="350,6 390,74 310,74" fill="white" opacity="0.07"/>
          <circle cx="390" cy="20" r="40" fill="#F0C020" opacity="0.12"/>
        </svg>
      </PageHero>
      <button className="back-btn" onClick={() => navigate('/sessions')}><ArrowLeft size={15}/> Back</button>
      <div className="session-detail">
      <div className="session-layout">

        {/* ── Sidebar ── */}
        <aside className="session-sidebar">
          <div className="session-sidebar-info">
            {editing ? (
              <input className="input-title" value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            ) : (
              <h2 className="session-sidebar-title">{session.title}</h2>
            )}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              <span className="badge badge-blue">{session.status}</span>
              <span className={`badge ${session.mode === 'online' ? 'badge-purple' : 'badge-orange'}`}>{session.mode}</span>
            </div>
          </div>

          {isAdmin && (
            <div className="action-btns" style={{ flexDirection: 'column' }}>
              {editing ? (
                <>
                  <button className="btn btn-primary" onClick={handleSave}>Save</button>
                  <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <button className="btn btn-ghost" onClick={() => setEditing(true)}><Edit2 size={15} /> Edit</button>
                  <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={15} /> Delete</button>
                </>
              )}
            </div>
          )}

          <nav className="session-nav">
            <Link to={`/sessions/${id}/notes`} className="session-nav-item">
              <span className="session-nav-icon" style={{ background: 'var(--blue)' }}><FileText size={15} color="white" /></span>
              My Notes
            </Link>
            <Link to={`/sessions/${id}/ai`} className="session-nav-item">
              <span className="session-nav-icon" style={{ background: 'var(--red)' }}><Sparkles size={15} color="white" /></span>
              AI Assistant
            </Link>
            <Link to={`/sessions/${id}/chat`} className="session-nav-item">
              <span className="session-nav-icon" style={{ background: 'var(--yellow)' }}><MessageCircle size={15} color="var(--black)" /></span>
              Team Chat
            </Link>
          </nav>

          {isAdmin && session.status !== 'completed' && !recordingResult && (
            <button className="btn btn-yellow" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setRecordingResult(true)}>
              <Trophy size={15} /> Record Result
            </button>
          )}

          {gcalUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href={gcalUrl} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                <Calendar size={14} /> Add to Calendar
              </a>
              {isAdmin && (
                <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={async () => {
                  await notifyCalendar(id)
                  alert('Calendar notifications sent to all participants.')
                }}>
                  <Calendar size={14} /> Notify Participants
                </button>
              )}
            </div>
          )}
        </aside>

        {/* ── Main Content ── */}
        <div className="session-main">

      <div className="detail-grid">
        <div className="detail-section">
          <h4>Topic</h4>
          {editing ? (
            <input value={editForm.topic_text} onChange={(e) => setEditForm({ ...editForm, topic_text: e.target.value })} />
          ) : (
            <p>{session.topic_text || <em className="text-muted">No topic set</em>}</p>
          )}
        </div>

        <div className="detail-section">
          <h4>Format</h4>
          <p>{format?.name ?? `Format #${session.format_id}`}</p>
        </div>

        <div className="detail-section">
          <h4>Mode</h4>
          <span className={`badge ${session.mode === 'online' ? 'badge-purple' : 'badge-orange'}`}>{session.mode}</span>
        </div>

        <div className="detail-section">
          <h4>Status</h4>
          {editing ? (
            <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              {['draft', 'scheduled', 'completed', 'cancelled'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          ) : (
            <span className={`badge badge-blue`}>{session.status}</span>
          )}
        </div>

        <div className="detail-section">
          <h4><Calendar size={14} /> Date & Time</h4>
          {editing ? (
            <input type="datetime-local" value={editForm.scheduled_at}
              onChange={(e) => setEditForm({ ...editForm, scheduled_at: e.target.value })} />
          ) : (
            <p>{session.scheduled_at
              ? new Date(session.scheduled_at).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })
              : 'TBC'}
            </p>
          )}
        </div>

        <div className="detail-section">
          <h4><MapPin size={14} /> {session.mode === 'online' ? 'Meeting Link' : 'Location'}</h4>
          {editing ? (
            <input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              placeholder={session.mode === 'online' ? 'https://meet.google.com/...' : 'Venue name'} />
          ) : session.location ? (
            session.mode === 'online'
              ? <a href={session.location} target="_blank" rel="noreferrer" className="meet-link"><LinkIcon size={14} /> Join Meeting</a>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p>{session.location}</p>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(session.location)}`} target="_blank" rel="noreferrer" className="meet-link" style={{ fontSize: 12 }}>
                    <MapPin size={13} /> View on Maps
                  </a>
                </div>
          ) : (
            <p className="text-muted">Not set</p>
          )}
        </div>
      </div>

      {session.winner_team && (
        <div className="result-banner">
          <Trophy size={18} />
          <div>
            <strong>Winner: {session.winner_team}</strong>
            {session.result_notes && <p style={{ marginTop: 4, fontWeight: 400 }}>{session.result_notes}</p>}
          </div>
        </div>
      )}

      {recordingResult && (
        <div className="result-form-panel">
          <h4>Record Debate Result</h4>
          <div className="result-form-fields">
            <label>
              Winning Side
              <select value={resultForm.winner_team} onChange={(e) => setResultForm({ ...resultForm, winner_team: e.target.value })}>
                <option value="">Select winner…</option>
                <option value="Proposition">Proposition</option>
                <option value="Opposition">Opposition</option>
                <option value="Draw">Draw</option>
              </select>
            </label>
            <label>
              Result Notes
              <textarea rows={2} value={resultForm.result_notes}
                onChange={(e) => setResultForm({ ...resultForm, result_notes: e.target.value })}
                placeholder="e.g. Proposition won by unanimous decision…"
                style={{ border: '2px solid #121212', padding: '8px 12px', font: 'inherit', width: '100%', outline: 'none', resize: 'vertical' }} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={handleRecordResult} disabled={!resultForm.winner_team}>
              Submit Result
            </button>
            <button className="btn btn-ghost" onClick={() => setRecordingResult(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="participants-section">
        <h3><Users size={16} /> Participants</h3>
        {session.participants?.length === 0 ? (
          <p className="text-muted">No participants assigned yet.</p>
        ) : (
          <table className="participants-table">
            <thead>
              <tr><th>Name</th><th>Role</th><th>Side</th></tr>
            </thead>
            <tbody>
              {session.participants.map((p) => (
                <tr key={p.id}>
                  <td>{p.user?.name ?? `User #${p.user_id}`}</td>
                  <td>{p.role_name ?? '—'}</td>
                  <td>{p.side ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Additional notes */}
      <div className="additional-notes-section">
        <h3 className="additional-notes-title">Additional Notes</h3>
        {editing ? (
          <textarea
            className="additional-notes-textarea"
            rows={4}
            value={editForm.additional_notes}
            onChange={(e) => setEditForm({ ...editForm, additional_notes: e.target.value })}
            placeholder="Add any extra info for participants — reminders, rules, links, context…"
          />
        ) : session.additional_notes ? (
          <p className="additional-notes-body">{session.additional_notes}</p>
        ) : (
          <p className="text-muted" style={{ fontSize: 13 }}>
            {isAdmin ? 'No additional notes yet — click Edit to add some.' : 'No additional notes from the organiser.'}
          </p>
        )}
      </div>

      {session.status === 'completed' && (
        <div className="summary-panel">
          <h3 className="summary-title"><Trophy size={16} /> Post-Debate Summary</h3>
          <div className="summary-grid">
            <div className="summary-block">
              <span className="summary-block-label">Result</span>
              <span className="summary-block-value" style={{ color: session.winner_team ? 'var(--black)' : 'var(--text-muted)' }}>
                {session.winner_team ? `${session.winner_team} wins` : 'No result recorded'}
              </span>
            </div>
            <div className="summary-block">
              <span className="summary-block-label">Format</span>
              <span className="summary-block-value">{format?.name ?? `Format #${session.format_id}`}</span>
            </div>
            <div className="summary-block">
              <span className="summary-block-label">Debaters</span>
              <span className="summary-block-value">{session.participants?.length ?? 0}</span>
            </div>
            <div className="summary-block">
              <span className="summary-block-label">Mode</span>
              <span className="summary-block-value" style={{ textTransform: 'capitalize' }}>{session.mode}</span>
            </div>
          </div>
          {session.result_notes && (
            <div className="summary-notes">
              <span className="summary-block-label">Judge's Notes</span>
              <p>{session.result_notes}</p>
            </div>
          )}
          <div className="summary-participants">
            <span className="summary-block-label">Participants</span>
            <div className="summary-participant-list">
              {session.participants?.map((p) => (
                <div key={p.id} className="summary-participant-chip">
                  <span className="avatar sm">{p.user?.name?.[0] ?? '?'}</span>
                  <span>{p.user?.name}</span>
                  {p.role_name && <span className="badge badge-gray">{p.role_name}</span>}
                  {p.side && <span className={`badge ${p.side === 'proposition' ? 'badge-blue' : 'badge-red'}`}>{p.side}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
        </div>{/* end session-main */}
      </div>{/* end session-layout */}
      </div>{/* end session-detail */}
    </div>
  )
}
