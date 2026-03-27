import { useState, useEffect } from 'react'
import { getSettings, updateSettings } from '../api'
import { Settings } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

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
    <div className="page-container">
      <PageHero title="Club Settings" subtitle="Manage your debate club" color="#F0C020">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          {/* Gear-like shape left — overlapping circles and squares */}
          <circle cx="55" cy="44" r="32" fill="var(--black)" opacity="0.10"/>
          <circle cx="55" cy="44" r="18" fill="var(--black)" opacity="0.10"/>
          <rect x="42" y="31" width="26" height="26" fill="var(--black)" opacity="0.08" transform="rotate(22 55 44)"/>
          <circle cx="55" cy="44" r="8" fill="var(--black)" opacity="0.15"/>
          {/* Shield / crest center */}
          <polygon points="200,8 230,22 230,52 200,68 170,52 170,22" fill="var(--black)" opacity="0.10"/>
          <polygon points="200,18 220,28 220,50 200,62 180,50 180,28" fill="var(--black)" opacity="0.08"/>
          {/* Star / diamond accent */}
          <polygon points="200,30 206,42 200,54 194,42" fill="var(--black)" opacity="0.12"/>
          {/* Building/institution shape right */}
          <rect x="310" y="24" width="60" height="50" fill="var(--black)" opacity="0.09"/>
          <rect x="320" y="14" width="40" height="14" fill="var(--black)" opacity="0.09"/>
          <rect x="322" y="38" width="10" height="14" fill="var(--black)" opacity="0.12"/>
          <rect x="338" y="38" width="10" height="14" fill="var(--black)" opacity="0.12"/>
          <rect x="354" y="38" width="10" height="14" fill="var(--black)" opacity="0.12"/>
          {/* Decorative dots */}
          <circle cx="130" cy="20" r="6" fill="var(--black)" opacity="0.12"/>
          <circle cx="155" cy="35" r="4" fill="var(--black)" opacity="0.10"/>
          <circle cx="265" cy="20" r="4" fill="var(--black)" opacity="0.10"/>
          <circle cx="285" cy="35" r="6" fill="var(--black)" opacity="0.12"/>
        </svg>
      </PageHero>

      <div className="settings-body">
        <div className="settings-card">
          <div className="settings-header">
            <Settings size={24} />
            <h2>Club Settings</h2>
          </div>

          {saved && <div className="alert" style={{ background: '#CCFFD8', color: '#1A6030', border: '2px solid #121212' }}>Settings saved.</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSave}>
            <div className="settings-fields-grid">
              <label className="settings-label">
                Club Name *
                <input className="input" value={form.club_name}
                  onChange={(e) => setForm({ ...form, club_name: e.target.value })}
                  placeholder="e.g. Westminster Debate Society" required />
              </label>
              <label className="settings-label">
                School / Institution
                <input className="input" value={form.school_name}
                  onChange={(e) => setForm({ ...form, school_name: e.target.value })}
                  placeholder="e.g. Westminster School" />
              </label>
              <label className="settings-label" style={{ gridColumn: '1 / -1' }}>
                Description
                <textarea rows={3} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="A short description of your debate club…"
                  style={{ resize: 'vertical', border: '2px solid #121212', padding: '8px 12px', font: 'inherit', width: '100%', outline: 'none' }} />
              </label>
            </div>
            <div style={{ marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
