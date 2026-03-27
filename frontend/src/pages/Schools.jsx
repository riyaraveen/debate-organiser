import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { Plus, Trash2, Trophy } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

export default function Schools() {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', city: '', contact_email: '', description: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/schools/').then(r => setSchools(r.data)).finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/api/schools/', form)
      setSchools(prev => [...prev, res.data])
      setForm({ name: '', city: '', contact_email: '', description: '' })
      setShowForm(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add school')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this school?')) return
    await api.delete(`/api/schools/${id}`)
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
              onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ flex: 2 }} required />
            <input className="input" placeholder="City" value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ flex: 1 }} />
            <input className="input" placeholder="Contact email" type="email" value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })} style={{ flex: 2 }} />
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
            <tr><th>School</th><th>City</th><th>Contact</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {schools.map(s => (
              <tr key={s.id}>
                <td><div style={{ fontWeight: 700 }}>{s.name}</div>{s.description && <div style={{ fontSize: 12, color: '#555' }}>{s.description}</div>}</td>
                <td>{s.city || <span className="text-muted">—</span>}</td>
                <td>{s.contact_email || <span className="text-muted">—</span>}</td>
                <td>
                  <div className="action-cell">
                    <button className="icon-btn danger" onClick={() => handleDelete(s.id)}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
