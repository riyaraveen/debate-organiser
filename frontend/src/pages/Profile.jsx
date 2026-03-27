import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../api'
import { User, Mail, GraduationCap, Shield, Phone, School } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

export default function Profile() {
  const { user, loginSuccess } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', grade: user?.grade || '', phone: user?.phone || '', school: user?.school || '' })
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setError('')
    try {
      const res = await updateProfile(form)
      const token = localStorage.getItem('token')
      loginSuccess(token, res.data)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save')
    }
  }

  return (
    <div className="page-container">
      <PageHero title="My Profile" subtitle="Account details & settings" color="#1040C0">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          {/* Large avatar circle left */}
          <circle cx="60" cy="44" r="36" fill="white" opacity="0.12"/>
          <circle cx="60" cy="30" r="14" fill="white" opacity="0.30"/>
          <rect x="38" y="50" width="44" height="26" rx="4" fill="white" opacity="0.22"/>
          {/* Decorative lines (profile fields) */}
          <rect x="120" y="28" width="80" height="5" rx="2" fill="white" opacity="0.20"/>
          <rect x="120" y="40" width="55" height="5" rx="2" fill="white" opacity="0.14"/>
          <rect x="120" y="52" width="68" height="5" rx="2" fill="white" opacity="0.14"/>
          <rect x="120" y="64" width="42" height="5" rx="2" fill="white" opacity="0.10"/>
          {/* Badge shape */}
          <rect x="228" y="26" width="34" height="16" rx="2" fill="#F0C020" opacity="0.50"/>
          {/* Geometric accent shapes right */}
          <circle cx="320" cy="44" r="44" fill="white" opacity="0.07"/>
          <circle cx="320" cy="44" r="26" fill="white" opacity="0.07"/>
          <polygon points="360,12 390,60 330,60" fill="#F0C020" opacity="0.20"/>
          <circle cx="385" cy="20" r="28" fill="white" opacity="0.06"/>
        </svg>
      </PageHero>

      <div className="profile-body">
        <div className="profile-card">
          {saved && <div className="alert" style={{ background: '#CCFFD8', color: '#1A6030', border: '2px solid #121212', gridColumn: '1/-1' }}>Profile saved.</div>}
          {error && <div className="alert alert-error" style={{ gridColumn: '1/-1' }}>{error}</div>}

          {/* Left column: avatar + identity */}
          <div className="profile-identity">
            <div className="profile-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <h2 style={{ margin: '12px 0 6px', fontSize: 20, fontWeight: 900 }}>{user?.name}</h2>
            <span className={`badge ${user?.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>{user?.role}</span>
            <div style={{ marginTop: 'auto', paddingTop: 20 }}>
              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                  <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              ) : (
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setEditing(true)}>Edit Profile</button>
              )}
            </div>
          </div>

          {/* Right column: fields in 2×2 grid */}
          <div className="profile-fields-grid">
            <div className="profile-field">
              <span className="profile-field-label"><User size={14} /> Full Name</span>
              {editing
                ? <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                : <span className="profile-field-value">{user?.name}</span>}
            </div>

            <div className="profile-field">
              <span className="profile-field-label"><Mail size={14} /> Email</span>
              <span className="profile-field-value text-muted">{user?.email}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label"><GraduationCap size={14} /> Grade / Year</span>
              {editing
                ? <input className="input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="e.g. Year 10" />
                : <span className="profile-field-value">{user?.grade || <em className="text-muted">Not set</em>}</span>}
            </div>

            <div className="profile-field">
              <span className="profile-field-label"><Phone size={14} /> Phone Number</span>
              {editing
                ? <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +44 7700 900000" />
                : <span className="profile-field-value">{user?.phone || <em className="text-muted">Not set</em>}</span>}
            </div>

            <div className="profile-field">
              <span className="profile-field-label"><School size={14} /> School / Institution</span>
              {editing
                ? <input className="input" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} placeholder="e.g. Westminster School" />
                : <span className="profile-field-value">{user?.school || <em className="text-muted">Not set</em>}</span>}
            </div>

            <div className="profile-field">
              <span className="profile-field-label"><Shield size={14} /> Proficiency</span>
              <span className="profile-field-value">{user?.proficiency || 'beginner'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
