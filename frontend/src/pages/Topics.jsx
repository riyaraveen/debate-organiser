import { useState, useEffect } from 'react'
import { getTopics, createTopic, updateTopic, deleteTopic, generateTopic, getSessions } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Plus, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

export default function Topics() {
  const { user } = useAuth()
  const toast = useToast()
  const [topics, setTopics] = useState([])
  const [recentTopicIds, setRecentTopicIds] = useState([])
  const [filters, setFilters] = useState({ is_go: '', proficiency: '', search: '', category: '' })
  const [showAdd, setShowAdd] = useState(false)
  const [newTopic, setNewTopic] = useState({ text: '', category: '', is_go: true, proficiency: '' })
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchTopics = () => {
    const params = {}
    if (filters.is_go !== '') params.is_go = filters.is_go === 'true'
    if (filters.proficiency) params.proficiency = filters.proficiency
    if (filters.search) params.search = filters.search
    getTopics(params).then((r) => setTopics(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchTopics() }, [filters])

  useEffect(() => {
    getSessions().then(r => {
      const ids = r.data
        .filter(s => s.topic_id)
        .sort((a, b) => new Date(b.scheduled_at ?? 0) - new Date(a.scheduled_at ?? 0))
        .map(s => s.topic_id)
      setRecentTopicIds([...new Set(ids)].slice(0, 5))
    }).catch(() => {})
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      const res = await createTopic({ ...newTopic, proficiency: newTopic.proficiency || null })
      setTopics([res.data, ...topics])
      setShowAdd(false)
      setNewTopic({ text: '', category: '', is_go: true, proficiency: '' })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add topic')
    }
  }

  const handleToggleGo = async (topic) => {
    const res = await updateTopic(topic.id, { is_go: !topic.is_go })
    setTopics(topics.map((t) => t.id === topic.id ? res.data : t))
    toast.success(`Topic marked as ${res.data.is_go ? 'Go' : 'No-Go'}.`)
  }

  const handleDelete = async (id) => {
    await deleteTopic(id)
    setTopics(topics.filter((t) => t.id !== id))
    setPendingDeleteId(null)
    toast.success('Topic deleted.')
  }

  const handleGenerate = async () => {
    try {
      const res = await generateTopic()
      const { text, category, proficiency } = res.data
      setNewTopic({ text, category: category || '', is_go: true, proficiency: proficiency || '' })
      setShowAdd(true)
    } catch {
      toast.error('Failed to generate topic')
    }
  }

  const isAdmin = user?.role === 'admin'
  const categories = [...new Set(topics.map(t => t.category).filter(Boolean))].sort()
  const displayedTopics = filters.category
    ? topics.filter(t => t.category === filters.category)
    : topics
  const recentTopics = topics.filter(t => recentTopicIds.includes(t.id))
    .sort((a, b) => recentTopicIds.indexOf(a.id) - recentTopicIds.indexOf(b.id))

  return (
    <div className="page-container">
      <PageHero title="Topics" subtitle="Debate motion bank" color="#F0C020">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <rect x="260" y="-8" width="80" height="80" fill="#121212" opacity="0.08" transform="rotate(10 300 32)"/>
          <rect x="310" y="4" width="120" height="14" rx="3" fill="#121212" opacity="0.08"/>
          <rect x="310" y="26" width="90" height="14" rx="3" fill="#121212" opacity="0.08"/>
          <rect x="310" y="48" width="110" height="14" rx="3" fill="#121212" opacity="0.08"/>
          <circle cx="200" cy="80" r="60" fill="#D02020" opacity="0.12"/>
        </svg>
      </PageHero>
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
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
        <>
          {recentTopics.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Clock size={15} /> Recently Used
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {recentTopics.map(t => (
                  <span key={t.id} className={`badge ${t.is_go ? 'badge-green' : 'badge-gray'}`}
                    style={{ fontSize: 12, padding: '4px 10px' }}>
                    {t.text}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="topics-table-wrap">
            {displayedTopics.length === 0 ? (
              <div className="empty-illustration">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <rect x="10" y="20" width="60" height="8" rx="2" fill="#121212"/>
                  <rect x="10" y="36" width="45" height="8" rx="2" fill="#121212"/>
                  <rect x="10" y="52" width="52" height="8" rx="2" fill="#121212"/>
                  <circle cx="64" cy="64" r="14" fill="#F0C020" stroke="#121212" strokeWidth="3"/>
                  <line x1="60" y1="64" x2="68" y2="64" stroke="#121212" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="64" y1="60" x2="64" y2="68" stroke="#121212" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                <h3>No topics found</h3>
                <p>{isAdmin ? 'Add a topic above or adjust your filters.' : 'No topics match your current filters.'}</p>
              </div>
            ) : (
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
                  {displayedTopics.map((t) => (
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
                          {pendingDeleteId === t.id ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                              Sure?
                              <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => handleDelete(t.id)}>Yes</button>
                              <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => setPendingDeleteId(null)}>No</button>
                            </span>
                          ) : (
                            <button className="icon-btn danger" title="Delete" onClick={() => setPendingDeleteId(t.id)}>
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
