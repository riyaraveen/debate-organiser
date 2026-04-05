import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Trophy, Pencil, Check, X } from 'lucide-react'
import { getSchools, createSchool, updateSchool, deleteSchool, getSchoolStats } from '../api'
import PageHero from '../components/ui/PageHero'

export default function Schools() {
  const [schools, setSchools] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', city: '', contact_email: '', description: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getSchools().then(r => setSchools(r.data)),
      getSchoolStats().then(r => setStats(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await createSchool(form)
      setSchools(prev => [...prev, res.data])
      setForm({ name: '', city: '', contact_email: '', description: '' })
      setShowForm(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add school')
    }
  }

  const startEdit = (s) => {
    setEditingId(s.id)
    setEditForm({ name: s.name, city: s.city || '', contact_email: s.contact_email || '', description: s.description || '' })
  }

  const saveEdit = async (id) => {
    try {
      const res = await updateSchool(id, editForm)
      setSchools(prev => prev.map(s => s.id === id ? res.data : s))
      setEditingId(null)
    } catch {
      setError('Failed to save changes')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this school?')) return
    await deleteSchool(id)
    setSchools(prev => prev.filter(s => s.id !== id))
  }

  if (loading) return <div className="loading">Loading…</div>

  return (
    <div className="page-container">
      <PageHero title="Schools" subtitle="Registered institutions" color="#1040C0">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <rect x="220" y="10" width="24" height="24" fill="white" opacity="0.10"/>
          <rect x="252" y="10" width="24" height="24" fill="white" opacity="0.10"/>
          <rect x="284" y="10" width="24" height="24" fill="#F0C020" opacity="0.20"/>
          <rect x="220" y="42" width="24" height="24" fill="white" opacity="0.10"/>
          <rect x="252" y="42" width="24" height="24" fill="#F0C020" opacity="0.20"/>
          <rect x="284" y="42" width="24" height="24" fill="white" opacity="0.10"/>
          <circle cx="370" cy="44" r="50" fill="white" opacity="0.06"/>
        </svg>
      </PageHero>

      <div className="page-top-bar">
        <span className="text-muted" style={{ fontSize: 13 }}>{schools.length} schools registered</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/tournaments" className="btn btn-ghost"><Trophy size={14} /> Tournaments</Link>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={15} /> Add School</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form className="add-topic-form form-stack" style={{ flexDirection: 'column' }} onSubmit={handleCreate}>
          <h4 style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 13 }}>Add School</h4>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input className="input" placeholder="School name *" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} style={{ flex: 2 }} required />
            <input className="input" placeholder="City" value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })} style={{ flex: 1 }} />
            <input className="input" placeholder="Contact email" type="email" value={form.contact_email}
              onChange={e => setForm({ ...form, contact_email: e.target.value })} style={{ flex: 2 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary">Add School</button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {schools.length === 0 ? (
        <div className="empty-state-card">
          <span className="empty-icon">🏫</span>
          <p>No schools added yet. Add schools to enable inter-school events and tournaments.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>School</th><th>City</th><th>Contact</th><th>Record</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {schools.map(s => {
              const record = stats[s.id] || { wins: 0, losses: 0 }
              const isEditing = editingId === s.id
              return (
                <tr key={s.id}>
                  <td>
                    {isEditing ? (
                      <input className="input" value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        style={{ width: '100%' }} />
                    ) : (
                      <div style={{ fontWeight: 700 }}>{s.name}</div>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input className="input" value={editForm.city} placeholder="City"
                        onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                        style={{ width: '100%' }} />
                    ) : (
                      s.city || <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input className="input" value={editForm.contact_email} placeholder="Email" type="email"
                        onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })}
                        style={{ width: '100%' }} />
                    ) : (
                      s.contact_email || <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {record.wins + record.losses > 0 ? (
                      <span style={{ fontSize: 13, fontWeight: 700 }}>
                        <span style={{ color: '#1a7a3c' }}>{record.wins}W</span>
                        {' – '}
                        <span style={{ color: '#c00' }}>{record.losses}L</span>
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: 12 }}>No matches</span>
                    )}
                  </td>
                  <td>
                    <div className="action-cell">
                      {isEditing ? (
                        <>
                          <button className="icon-btn" onClick={() => saveEdit(s.id)}><Check size={15} /></button>
                          <button className="icon-btn" onClick={() => setEditingId(null)}><X size={15} /></button>
                        </>
                      ) : (
                        <>
                          <button className="icon-btn" onClick={() => startEdit(s)}><Pencil size={14} /></button>
                          <button className="icon-btn danger" onClick={() => handleDelete(s.id)}><Trash2 size={15} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
