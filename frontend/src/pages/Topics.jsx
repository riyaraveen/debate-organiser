import { useState, useEffect } from 'react'
import { getTopics, createTopic, updateTopic, deleteTopic, generateTopic } from '../api'
import { useAuth } from '../context/AuthContext'
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react'

export default function Topics() {
  const { user } = useAuth()
  const [topics, setTopics] = useState([])
  const [filters, setFilters] = useState({ is_go: '', proficiency: '', search: '' })
  const [showAdd, setShowAdd] = useState(false)
  const [newTopic, setNewTopic] = useState({ text: '', category: '', is_go: true, proficiency: '' })
  const [loading, setLoading] = useState(true)

  const fetchTopics = () => {
    const params = {}
    if (filters.is_go !== '') params.is_go = filters.is_go === 'true'
    if (filters.proficiency) params.proficiency = filters.proficiency
    if (filters.search) params.search = filters.search
    getTopics(params).then((r) => setTopics(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchTopics() }, [filters])

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      const res = await createTopic({ ...newTopic, proficiency: newTopic.proficiency || null })
      setTopics([res.data, ...topics])
      setShowAdd(false)
      setNewTopic({ text: '', category: '', is_go: true, proficiency: '' })
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add topic')
    }
  }

  const handleToggleGo = async (topic) => {
    const res = await updateTopic(topic.id, { is_go: !topic.is_go })
    setTopics(topics.map((t) => t.id === topic.id ? res.data : t))
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this topic?')) return
    await deleteTopic(id)
    setTopics(topics.filter((t) => t.id !== id))
  }

  const handleGenerate = async () => {
    try {
      const res = await generateTopic()
      const { text, category, proficiency } = res.data
      setNewTopic({ text, category: category || '', is_go: true, proficiency: proficiency || '' })
      setShowAdd(true)
    } catch {
      alert('Failed to generate topic')
    }
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="page-container">
      <div className="page-top-bar">
        <div className="filters-row">
          <input className="input search-input" placeholder="Search topics…"
            value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <select value={filters.is_go} onChange={(e) => setFilters({ ...filters, is_go: e.target.value })}>
            <option value="">All topics</option>
            <option value="true">Go topics only</option>
            <option value="false">No-go topics</option>
          </select>
          <select value={filters.proficiency} onChange={(e) => setFilters({ ...filters, proficiency: e.target.value })}>
            <option value="">Any level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={handleGenerate} title="Generate a topic with AI">
              ✦ Generate
            </button>
            <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
              <Plus size={15} /> Add Topic
            </button>
          </div>
        )}
      </div>

      {showAdd && isAdmin && (
        <form className="add-topic-form" onSubmit={handleAdd}>
          <input className="input" placeholder="Topic text…" required
            value={newTopic.text} onChange={(e) => setNewTopic({ ...newTopic, text: e.target.value })} />
          <input className="input" placeholder="Category (optional)"
            value={newTopic.category} onChange={(e) => setNewTopic({ ...newTopic, category: e.target.value })} />
          <select value={newTopic.proficiency} onChange={(e) => setNewTopic({ ...newTopic, proficiency: e.target.value })}>
            <option value="">Any level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <label className="checkbox-label">
            <input type="checkbox" checked={newTopic.is_go}
              onChange={(e) => setNewTopic({ ...newTopic, is_go: e.target.checked })} />
            Go topic (safe for use)
          </label>
          <button type="submit" className="btn btn-primary">Save</button>
          <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
        </form>
      )}

      {loading ? <div className="loading">Loading…</div> : (
        <div className="topics-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Category</th>
                <th>Level</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => (
                <tr key={t.id}>
                  <td>{t.text}</td>
                  <td>{t.category || '—'}</td>
                  <td>{t.proficiency || '—'}</td>
                  <td>
                    {t.is_go
                      ? <span className="badge badge-green"><CheckCircle size={12} /> Go</span>
                      : <span className="badge badge-red"><XCircle size={12} /> No-Go</span>}
                  </td>
                  {isAdmin && (
                    <td className="action-cell">
                      <button className="icon-btn" title="Toggle go/no-go" onClick={() => handleToggleGo(t)}>
                        {t.is_go ? <XCircle size={15} /> : <CheckCircle size={15} />}
                      </button>
                      <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(t.id)}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {topics.length === 0 && <p className="empty-state">No topics found. Add some above!</p>}
        </div>
      )}
    </div>
  )
}
