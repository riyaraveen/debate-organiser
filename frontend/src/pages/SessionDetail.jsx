import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getSession, updateSession, deleteSession, getFormat } from '../api'
import { useAuth } from '../context/AuthContext'
import { Calendar, Clock, MapPin, Users, Edit2, Trash2, Trophy, Link as LinkIcon } from 'lucide-react'

export default function SessionDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [format, setFormat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})

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
    <div className="session-detail">
      <div className="session-detail-header">
        {editing ? (
          <input
            className="input-title"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          />
        ) : (
          <h2>{session.title}</h2>
        )}
        {isAdmin && (
          <div className="action-btns">
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
      </div>

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
              : <p>{session.location}</p>
          ) : (
            <p className="text-muted">Not set</p>
          )}
        </div>
      </div>

      {session.winner_team && (
        <div className="result-banner">
          <Trophy size={18} />
          <strong>Winner:</strong> {session.winner_team}
          {session.result_notes && <p>{session.result_notes}</p>}
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

      {gcalUrl && (
        <div className="gcal-section">
          <a href={gcalUrl} target="_blank" rel="noreferrer" className="btn btn-ghost">
            <Calendar size={15} /> Add to Google Calendar
          </a>
        </div>
      )}
    </div>
  )
}
