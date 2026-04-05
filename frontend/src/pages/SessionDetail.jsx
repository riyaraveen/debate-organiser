import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getSession, updateSession, deleteSession, createSession, getFormat, getFormats, notifyCalendar, getUsers, addParticipant, removeParticipant, updateParticipant, getTemplates, createTemplate, updateAttendance, getSessionScores, createScore } from '../api'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { Calendar, MapPin, Users, Edit2, Trash2, Trophy, Link as LinkIcon, FileText, Sparkles, MessageCircle, ArrowLeft, UserMinus, UserPlus, RefreshCw, Check, X, Copy, Timer } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

const STATUS_COLORS = {
  scheduled: 'badge-blue',
  draft:     'badge-gray',
  completed: 'badge-green',
  cancelled: 'badge-red',
}

export default function SessionDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [format, setFormat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const toast = useToast()
  const [recordingResult, setRecordingResult] = useState(false)
  const [resultForm, setResultForm] = useState({ winner_team: '', result_notes: '' })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingParticipants, setEditingParticipants] = useState(false)
  const [allMembers, setAllMembers] = useState([])
  const [addForm, setAddForm] = useState({ user_id: '', role_name: '', side: '' })
  const [replacingId, setReplacingId] = useState(null)
  const [replaceUserId, setReplaceUserId] = useState('')
  const [scores, setScores] = useState([])
  const [scoreForm, setScoreForm] = useState({ subject_user_id: '', score: '', notes: '' })
  const [scoringLoading, setScoringLoading] = useState(false)
  const [allFormats, setAllFormats] = useState([])
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateNameInput, setTemplateNameInput] = useState('')
  const [participantLoading, setParticipantLoading] = useState(false)

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
          mode: res.data.mode,
          format_id: res.data.format_id,
          additional_notes: res.data.additional_notes || '',
          location_maps: res.data.location_maps !== false,
        })
        setResultForm({
          winner_team: res.data.winner_team || '',
          result_notes: res.data.result_notes || '',
        })
        return getFormat(res.data.format_id)
      })
      .then((res) => setFormat(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))

    getSessionScores(id).then(r => setScores(r.data)).catch(() => {})
    getFormats(true).then(r => setAllFormats(r.data)).catch(() => {})
  }, [id])

  const handleSave = async () => {
    try {
      const payload = { ...editForm }
      if (payload.scheduled_at) payload.scheduled_at = new Date(payload.scheduled_at).toISOString()
      const res = await updateSession(id, payload)
      setSession(res.data)
      setEditing(false)
      toast.success('Session updated.')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed')
    }
  }

  const handleRecordResult = async () => {
    try {
      const payload = { status: 'completed', ...resultForm }
      const res = await updateSession(id, payload)
      setSession(res.data)
      setRecordingResult(false)
      toast.success('Result recorded.')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to record result')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteSession(id)
      navigate('/sessions')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete session')
      setConfirmDelete(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateNameInput.trim()) return
    try {
      await createTemplate({ name: templateNameInput.trim(), format_id: session.format_id, mode: session.mode, location: session.location || '' })
      toast.success(`Template "${templateNameInput.trim()}" saved.`)
      setSavingTemplate(false)
      setTemplateNameInput('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save template')
    }
  }

  const handleDuplicate = async () => {
    try {
      const res = await createSession({
        title: `${session.title} (copy)`,
        format_id: session.format_id,
        mode: session.mode,
        topic_text: session.topic_text || '',
        participant_ids: session.participants.map(p => p.user_id),
        auto_assign_roles: true,
      })
      navigate(`/sessions/${res.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to duplicate session')
    }
  }

  const openParticipantEdit = async () => {
    if (!allMembers.length) {
      try {
        const res = await getUsers()
        setAllMembers(res.data)
      } catch {
        toast.error('Failed to load members')
        return
      }
    }
    setEditingParticipants(true)
  }

  const handleRemoveParticipant = async (participantId) => {
    setParticipantLoading(true)
    try {
      await removeParticipant(id, participantId)
      const res = await getSession(id)
      setSession(res.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to remove participant')
    } finally {
      setParticipantLoading(false)
    }
  }

  const handleAddParticipant = async () => {
    if (!addForm.user_id) return
    setParticipantLoading(true)
    try {
      await addParticipant(id, {
        user_id: parseInt(addForm.user_id),
        role_name: addForm.role_name || null,
        side: addForm.side || null,
      })
      setAddForm({ user_id: '', role_name: '', side: '' })
      const res = await getSession(id)
      setSession(res.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add participant')
    } finally {
      setParticipantLoading(false)
    }
  }

  const handleReplaceParticipant = async (participant) => {
    if (!replaceUserId) return
    setParticipantLoading(true)
    try {
      await updateParticipant(id, participant.id, {
        user_id: parseInt(replaceUserId),
        role_name: participant.role_name,
        side: participant.side,
      })
      setReplacingId(null)
      setReplaceUserId('')
      const res = await getSession(id)
      setSession(res.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to replace participant')
    } finally {
      setParticipantLoading(false)
    }
  }

  const handleUpdateParticipant = async (participant, field, value) => {
    setParticipantLoading(true)
    try {
      await updateParticipant(id, participant.id, {
        user_id: participant.user_id,
        role_name: field === 'role_name' ? (value || null) : participant.role_name,
        side:      field === 'side'      ? (value || null) : participant.side,
      })
      const res = await getSession(id)
      setSession(res.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update participant')
    } finally {
      setParticipantLoading(false)
    }
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

  const handleAttendance = async (participantId, attended) => {
    try {
      await updateAttendance(id, participantId, attended)
      setSession(s => ({
        ...s,
        participants: s.participants.map(p => p.id === participantId ? { ...p, attended } : p),
      }))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update attendance')
    }
  }

  const handleNotifyParticipants = async () => {
    try {
      await notifyCalendar(id)
      toast.success('Calendar notifications sent to all participants.')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send notifications')
    }
  }

  const handleCreateScore = async (e) => {
    e.preventDefault()
    if (!scoreForm.subject_user_id || scoreForm.score === '') return
    setScoringLoading(true)
    try {
      const res = await createScore(id, {
        subject_user_id: parseInt(scoreForm.subject_user_id),
        score: parseInt(scoreForm.score),
        notes: scoreForm.notes || null,
      })
      setScores(prev => {
        const idx = prev.findIndex(s => s.subject_user_id === res.data.subject_user_id && s.scorer_id === res.data.scorer_id)
        if (idx >= 0) { const next = [...prev]; next[idx] = res.data; return next }
        return [...prev, res.data]
      })
      setScoreForm({ subject_user_id: '', score: '', notes: '' })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save score')
    } finally {
      setScoringLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading…</div>
  if (!session) return <div className="empty-state">Session not found.</div>

  const isAdmin = user?.role === 'admin'
  const gcalUrl = buildIcsUrl()
  const myParticipant = session.participants?.find(p => p.user_id === user?.id)

  return (
    <div className="page-container">
      <PageHero title="Session" subtitle={session.title} color="#1040C0">
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
              <span className={`badge ${STATUS_COLORS[session.status] ?? 'badge-gray'}`}>{session.status}</span>
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
                  <button className="btn btn-ghost" onClick={handleDuplicate}><Copy size={15} /> Duplicate</button>
                  {savingTemplate ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        autoFocus
                        placeholder="Template name…"
                        value={templateNameInput}
                        onChange={e => setTemplateNameInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveTemplate(); if (e.key === 'Escape') { setSavingTemplate(false); setTemplateNameInput('') } }}
                        style={{ fontSize: 13, padding: '4px 8px', flex: 1 }}
                      />
                      <button className="btn btn-primary" style={{ padding: '4px 10px' }} onClick={handleSaveTemplate}><Check size={13}/></button>
                      <button className="btn btn-ghost" style={{ padding: '4px 10px' }} onClick={() => { setSavingTemplate(false); setTemplateNameInput('') }}><X size={13}/></button>
                    </div>
                  ) : (
                    <button className="btn btn-ghost" onClick={() => { setSavingTemplate(true); setTemplateNameInput(session.title) }}><FileText size={15}/> Save as Template</button>
                  )}
                  {confirmDelete ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
                      <span style={{ fontWeight: 700 }}>Delete session?</span>
                      <button className="btn btn-danger" style={{ padding: '4px 10px' }} onClick={handleDelete}>Yes, delete</button>
                      <button className="btn btn-ghost" style={{ padding: '4px 10px' }} onClick={() => setConfirmDelete(false)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /> Delete</button>
                  )}
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
            <Link to={`/sessions/${id}/timer`} className="session-nav-item">
              <span className="session-nav-icon" style={{ background: '#1A8040' }}><Timer size={15} color="white" /></span>
              Debate Timer
            </Link>
          </nav>

          {isAdmin && (session.status === 'scheduled' || session.status === 'completed') && !recordingResult && (
            <button className="btn btn-yellow" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setRecordingResult(true)}>
              <Trophy size={15}/> {session.winner_team ? 'Edit Result' : 'Record Result'}
            </button>
          )}

          {gcalUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href={gcalUrl} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                <Calendar size={14} /> Add to Calendar
              </a>
              {isAdmin && (
                <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={handleNotifyParticipants}>
                  <Calendar size={14}/> Notify Participants
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
          {editing ? (
            <select value={editForm.format_id} onChange={e => setEditForm({ ...editForm, format_id: parseInt(e.target.value) })}>
              {allFormats.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          ) : (
            <p>{format?.name ?? `Format #${session.format_id}`}</p>
          )}
        </div>

        <div className="detail-section">
          <h4>Mode</h4>
          {editing ? (
            <select value={editForm.mode} onChange={e => setEditForm({ ...editForm, mode: e.target.value })}>
              <option value="in-person">In-person</option>
              <option value="online">Online</option>
            </select>
          ) : (
            <span className={`badge ${session.mode === 'online' ? 'badge-purple' : 'badge-orange'}`}>{session.mode}</span>
          )}
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
            <span className={`badge ${STATUS_COLORS[session.status] ?? 'badge-gray'}`}>{session.status}</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                placeholder={editForm.mode === 'online' ? 'https://meet.google.com/...' : 'Venue name'} />
              {editForm.mode !== 'online' && editForm.location && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox"
                    checked={!!editForm.location_maps}
                    onChange={e => setEditForm({ ...editForm, location_maps: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  Show "View on Maps" link
                </label>
              )}
            </div>
          ) : session.location ? (
            session.mode === 'online'
              ? <a href={session.location} target="_blank" rel="noreferrer" className="meet-link"><LinkIcon size={14}/> Join Meeting</a>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p>{session.location}</p>
                  {session.location_maps !== false && (
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(session.location)}`} target="_blank" rel="noreferrer" className="meet-link" style={{ fontSize: 12 }}>
                      <MapPin size={13}/> View on Maps
                    </a>
                  )}
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
        {myParticipant && (
          <div className="my-role-callout">
            <span className="my-role-label">Your role</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {myParticipant.role_name
                ? <span className="badge badge-yellow">{myParticipant.role_name}</span>
                : <span className="badge badge-gray">No role assigned</span>}
              {myParticipant.side && myParticipant.side.toLowerCase() !== myParticipant.role_name?.toLowerCase() && (
                <span className={`badge ${myParticipant.side === 'proposition' ? 'badge-blue' : myParticipant.side === 'opposition' ? 'badge-red' : 'badge-gray'}`}>
                  {myParticipant.side}
                </span>
              )}
            </div>
          </div>
        )}
        {format && (() => {
          const count = session.participants?.length ?? 0
          const { min_participants, max_participants } = format
          if (count < min_participants) return (
            <div className="alert alert-error" style={{ marginBottom: 10, fontSize: 13 }}>
              ⚠ Too few participants — {count}/{min_participants} minimum required for {format.name}.
            </div>
          )
          if (count > max_participants) return (
            <div className="alert alert-error" style={{ marginBottom: 10, fontSize: 13 }}>
              ⚠ Too many participants — {count}/{max_participants} maximum for {format.name}.
            </div>
          )
          return null
        })()}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>
            <Users size={16} /> Participants
            {format && (
              <span className={`badge ${
                (session.participants?.length ?? 0) >= format.min_participants &&
                (session.participants?.length ?? 0) <= format.max_participants
                  ? 'badge-green' : 'badge-red'
              }`} style={{ marginLeft: 8, fontSize: 12 }}>
                {session.participants?.length ?? 0}/{format.max_participants}
              </span>
            )}
          </h3>
          {isAdmin && !editingParticipants && (
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={openParticipantEdit}>
              <Edit2 size={13} /> Edit
            </button>
          )}
          {isAdmin && editingParticipants && (
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setEditingParticipants(false)}>
              <Check size={13} /> Done
            </button>
          )}
        </div>

        {session.participants?.length === 0 && !editingParticipants ? (
          <p className="text-muted">No participants assigned yet.</p>
        ) : (
          <div style={{ position: 'relative', opacity: participantLoading ? 0.5 : 1, pointerEvents: participantLoading ? 'none' : 'auto', transition: 'opacity 0.15s' }}>
          <table className="participants-table">
            <thead>
              <tr>
                <th>Name</th><th>Role</th><th>Side</th>
                <th>Attended</th>
                {editingParticipants && <th></th>}
              </tr>
            </thead>
            <tbody>
              {session.participants.map((p) => (
                <tr key={p.id}>
                  <td>
                    {editingParticipants && replacingId === p.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <select value={replaceUserId} onChange={(e) => setReplaceUserId(e.target.value)}
                          style={{ fontSize: 13, padding: '4px 6px' }}>
                          <option value="">Pick member…</option>
                          {allMembers
                            .filter(m => !session.participants.some(x => x.user_id === m.id && x.id !== p.id))
                            .map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 12 }}
                          onClick={() => handleReplaceParticipant(p)}>
                          <Check size={12} />
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 12 }}
                          onClick={() => { setReplacingId(null); setReplaceUserId('') }}>
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      p.user?.name ?? `User #${p.user_id}`
                    )}
                  </td>
                  <td>
                    {editingParticipants ? (
                      <select
                        value={p.role_name ?? ''}
                        onChange={e => handleUpdateParticipant(p, 'role_name', e.target.value)}
                        disabled={participantLoading}
                        style={{ fontSize: 12, padding: '2px 4px', width: '100%' }}
                      >
                        <option value="">— none —</option>
                        {format?.roles?.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                      </select>
                    ) : (p.role_name ?? '—')}
                  </td>
                  <td>
                    {editingParticipants ? (
                      <select
                        value={p.side ?? ''}
                        onChange={e => handleUpdateParticipant(p, 'side', e.target.value)}
                        disabled={participantLoading}
                        style={{ fontSize: 12, padding: '2px 4px' }}
                      >
                        <option value="">— none —</option>
                        <option value="proposition">proposition</option>
                        <option value="opposition">opposition</option>
                        <option value="government">government</option>
                        <option value="neutral">neutral</option>
                      </select>
                    ) : (p.side ?? '—')}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isAdmin ? (
                      <input type="checkbox"
                        checked={p.attended === true}
                        onChange={e => handleAttendance(p.id, e.target.checked)}
                        style={{ cursor: 'pointer' }}
                        title={p.attended == null ? 'Not marked' : p.attended ? 'Attended' : 'Absent'}
                      />
                    ) : (
                      <span title={p.attended == null ? 'Not marked' : p.attended ? 'Attended' : 'Absent'}>
                        {p.attended === true ? '✓' : p.attended === false ? '✗' : '—'}
                      </span>
                    )}
                  </td>
                  {editingParticipants && (
                    <td style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost" title="Replace" style={{ padding: '4px 8px' }}
                        onClick={() => { setReplacingId(p.id); setReplaceUserId('') }}>
                        <RefreshCw size={13} />
                      </button>
                      <button className="btn btn-danger" title="Remove" style={{ padding: '4px 8px' }}
                        onClick={() => handleRemoveParticipant(p.id)}>
                        <UserMinus size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {editingParticipants && (
                <tr>
                  <td>
                    <select value={addForm.user_id} onChange={(e) => setAddForm({ ...addForm, user_id: e.target.value })}
                      style={{ fontSize: 13, padding: '4px 6px', width: '100%' }}>
                      <option value="">Add member…</option>
                      {allMembers
                        .filter(m => !session.participants.some(p => p.user_id === m.id))
                        .map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={addForm.role_name}
                      onChange={(e) => {
                        const role = format?.roles?.find(r => r.name === e.target.value)
                        setAddForm({ ...addForm, role_name: e.target.value, side: role?.side ?? addForm.side })
                      }}
                      style={{ fontSize: 13, padding: '4px 6px', width: '100%' }}>
                      <option value="">Role (optional)</option>
                      {format?.roles?.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={addForm.side} onChange={(e) => setAddForm({ ...addForm, side: e.target.value })}
                      style={{ fontSize: 13, padding: '4px 6px' }}>
                      <option value="">Side…</option>
                      <option value="proposition">proposition</option>
                      <option value="opposition">opposition</option>
                      <option value="government">government</option>
                      <option value="neutral">neutral</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-primary" style={{ padding: '4px 10px' }}
                      onClick={handleAddParticipant} disabled={!addForm.user_id}>
                      <UserPlus size={13} />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
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
                  {p.attended === true && <span className="badge badge-green" style={{ fontSize: 10 }}>attended</span>}
                  {p.attended === false && <span className="badge badge-red" style={{ fontSize: 10 }}>absent</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Speaker scores — visible to all; add form admin-only */}
          {(scores.length > 0 || isAdmin) && (
            <div style={{ marginTop: 20 }}>
              <span className="summary-block-label">Speaker Scores</span>
              {scores.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8, marginBottom: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #121212' }}>
                      <th style={{ textAlign: 'left', padding: '4px 8px' }}>Speaker</th>
                      <th style={{ textAlign: 'center', padding: '4px 8px' }}>Score</th>
                      <th style={{ textAlign: 'left', padding: '4px 8px' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #e5e5e5' }}>
                        <td style={{ padding: '4px 8px' }}>{s.subject_user_name ?? `User #${s.subject_user_id}`}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 700 }}>{s.score}</td>
                        <td style={{ padding: '4px 8px', color: 'var(--text-muted)', fontSize: 12 }}>{s.notes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted" style={{ fontSize: 13, margin: '8px 0' }}>No scores recorded yet.</p>
              )}
              {isAdmin && (
                <form onSubmit={handleCreateScore} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 8 }}>
                  <select value={scoreForm.subject_user_id}
                    onChange={e => setScoreForm(f => ({ ...f, subject_user_id: e.target.value }))}
                    style={{ fontSize: 13, padding: '4px 8px' }} required>
                    <option value="">Speaker…</option>
                    {session.participants?.map(p => (
                      <option key={p.id} value={p.user_id}>{p.user?.name ?? `User #${p.user_id}`}</option>
                    ))}
                  </select>
                  <input type="number" min={0} max={100} placeholder="Score (0–100)"
                    value={scoreForm.score}
                    onChange={e => setScoreForm(f => ({ ...f, score: e.target.value }))}
                    style={{ width: 120, fontSize: 13, padding: '4px 8px' }} required />
                  <input type="text" placeholder="Notes (optional)"
                    value={scoreForm.notes}
                    onChange={e => setScoreForm(f => ({ ...f, notes: e.target.value }))}
                    style={{ flex: 1, minWidth: 120, fontSize: 13, padding: '4px 8px' }} />
                  <button type="submit" className="btn btn-primary" style={{ fontSize: 12, padding: '4px 12px' }} disabled={scoringLoading}>
                    {scoringLoading ? '…' : 'Save'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
        </div>{/* end session-main */}
      </div>{/* end session-layout */}
      </div>{/* end session-detail */}
    </div>
  )
}
