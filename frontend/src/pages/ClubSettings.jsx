import { useState, useEffect } from 'react'
import { getSettings, updateSettings, getAnnouncements, createAnnouncement, deleteAnnouncement, getInvites, createInvite, deactivateInvite } from '../api'
import { Settings, Megaphone, Link2, Trash2, Plus, Copy, Check } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

export default function ClubSettings() {
  const [form, setForm] = useState({ club_name: '', school_name: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [announcements, setAnnouncements] = useState([])
  const [annForm, setAnnForm] = useState({ title: '', content: '' })
  const [showAnnForm, setShowAnnForm] = useState(false)

  const [invites, setInvites] = useState([])
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    getSettings()
      .then((res) => setForm({
        club_name: res.data.club_name || '',
        school_name: res.data.school_name || '',
        description: res.data.description || '',
      }))
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false))
    getAnnouncements().then(r => setAnnouncements(r.data)).catch(() => {})
    getInvites().then(r => setInvites(r.data)).catch(() => {})
  }, [])

  const handlePostAnnouncement = async (e) => {
    e.preventDefault()
    try {
      const res = await createAnnouncement(annForm)
      setAnnouncements(a => [res.data, ...a])
      setAnnForm({ title: '', content: '' })
      setShowAnnForm(false)
    } catch {}
  }

  const handleDeleteAnnouncement = async (id) => {
    await deleteAnnouncement(id)
    setAnnouncements(a => a.filter(x => x.id !== id))
  }

  const handleCreateInvite = async () => {
    const res = await createInvite()
    setInvites(i => [res.data, ...i])
  }

  const handleDeactivateInvite = async (id) => {
    await deactivateInvite(id)
    setInvites(i => i.map(x => x.id === id ? { ...x, is_active: false } : x))
  }

  const copyInviteLink = (code) => {
    const url = `${window.location.origin}/register?code=${code}`
    navigator.clipboard.writeText(url)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

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

        {/* Announcements */}
        <div className="settings-card" style={{ marginBottom: 24 }}>
          <div className="settings-header">
            <Megaphone size={20} />
            <h2>Announcements</h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Active announcements appear as a banner for all members at the top of the app.
          </p>
          {announcements.length === 0 && !showAnnForm && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No active announcements.</p>
          )}
          {announcements.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 14px', border: '2px solid #e5e5e5', marginBottom: 8, gap: 10 }}>
              <div>
                <strong style={{ fontSize: 13 }}>{a.title}</strong>
                {a.content && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{a.content}</p>}
              </div>
              <button className="btn btn-ghost" style={{ fontSize: 11, color: 'var(--red)', flexShrink: 0 }} onClick={() => handleDeleteAnnouncement(a.id)}>
                <Trash2 size={12} /> Remove
              </button>
            </div>
          ))}
          {showAnnForm && (
            <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              <input className="input" placeholder="Announcement title *" value={annForm.title}
                onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} required />
              <textarea rows={2} placeholder="Optional details…" value={annForm.content}
                onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))}
                style={{ border: '2px solid #121212', padding: '8px 12px', font: 'inherit', resize: 'vertical', outline: 'none' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ fontSize: 12 }}>Post</button>
                <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowAnnForm(false)}>Cancel</button>
              </div>
            </form>
          )}
          {!showAnnForm && (
            <button className="btn btn-ghost" style={{ fontSize: 12, marginTop: 4 }} onClick={() => setShowAnnForm(true)}>
              <Plus size={13} /> New Announcement
            </button>
          )}
        </div>

        {/* Invite Links */}
        <div className="settings-card" style={{ marginBottom: 24 }}>
          <div className="settings-header">
            <Link2 size={20} />
            <h2>Invite Links</h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Generate invite links so new members can self-register. Share the link — anyone with it can create an account.
          </p>
          {invites.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No invite links yet.</p>}
          {invites.map(inv => (
            <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', border: '2px solid #e5e5e5', marginBottom: 8, opacity: inv.is_active ? 1 : 0.5 }}>
              <code style={{ flex: 1, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em' }}>{inv.code}</code>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Used {inv.used_count}×</span>
              <span className={`badge ${inv.is_active ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 10 }}>{inv.is_active ? 'Active' : 'Inactive'}</span>
              {inv.is_active && (
                <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={() => copyInviteLink(inv.code)}>
                  {copied === inv.code ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Link</>}
                </button>
              )}
              {inv.is_active && (
                <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={() => handleDeactivateInvite(inv.id)}>
                  <Trash2 size={12} /> Revoke
                </button>
              )}
            </div>
          ))}
          <button className="btn btn-ghost" style={{ fontSize: 12, marginTop: 4 }} onClick={handleCreateInvite}>
            <Plus size={13} /> Generate New Link
          </button>
        </div>

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
