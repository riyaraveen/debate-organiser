import { useState, useEffect } from 'react'
import { getFormats, toggleFormat, createFormat } from '../api'
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react'

export default function Formats() {
  const [formats, setFormats] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', min_participants: 2, max_participants: 8 })
  const [error, setError] = useState('')

  useEffect(() => {
    // Fetch all formats including inactive — admin-only endpoint returns all
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
      <div className="page-top-bar">
        <span className="text-muted" style={{ fontSize: 13 }}>{formats.length} formats</span>
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

      <table className="data-table">
        <thead>
          <tr>
            <th>Format Name</th>
            <th>Participants</th>
            <th>Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {formats.map((f) => (
            <tr key={f.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{f.name}</div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{f.description?.slice(0, 80)}{f.description?.length > 80 ? '…' : ''}</div>
              </td>
              <td>{f.min_participants}–{f.max_participants}</td>
              <td>
                <span className={`badge ${f.is_builtin ? 'badge-gray' : 'badge-blue'}`}>
                  {f.is_builtin ? 'Built-in' : 'Custom'}
                </span>
              </td>
              <td>
                <span className={`badge ${f.is_active ? 'badge-green' : 'badge-red'}`}>
                  {f.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <button className="btn btn-ghost" style={{ padding: '5px 12px' }} onClick={() => handleToggle(f.id)}>
                  {f.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  {f.is_active ? 'Disable' : 'Enable'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
