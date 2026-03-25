import { useState, useEffect } from 'react'
import { getSettings, updateSettings } from '../api'
import { Settings, BookOpen } from 'lucide-react'

export default function ClubSettings() {
  const [form, setForm] = useState({ club_name: '', school_name: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getSettings()
      .then((res) => setForm({
        club_name: res.data.club_name || '',
        school_name: res.data.school_name || '',
        description: res.data.description || '',
      }))
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateSettings(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">Loading…</div>

  return (
    <div className="settings-page">
      <div className="settings-card">
        <div className="settings-header">
          <BookOpen size={24} />
          <h2>Club Settings</h2>
        </div>

        {saved && <div className="alert" style={{ background: '#CCFFD8', color: '#1A6030', border: '2px solid #121212' }}>Settings saved.</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSave} className="form-stack">
          <label>
            Club Name *
            <input className="input" value={form.club_name}
              onChange={(e) => setForm({ ...form, club_name: e.target.value })}
              placeholder="e.g. Westminster Debate Society" required />
          </label>
          <label>
            School / Institution
            <input className="input" value={form.school_name}
              onChange={(e) => setForm({ ...form, school_name: e.target.value })}
              placeholder="e.g. Westminster School" />
          </label>
          <label>
            Description
            <textarea rows={3} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="A short description of your debate club…"
              style={{ resize: 'vertical', border: '2px solid #121212', padding: '8px 12px', font: 'inherit', width: '100%', outline: 'none' }} />
          </label>
          <div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
