import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../api'
import { User, Mail, GraduationCap, Shield } from 'lucide-react'

export default function Profile() {
  const { user, loginSuccess } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', grade: user?.grade || '' })
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setError('')
    try {
      const res = await updateProfile(form)
      // Refresh auth context with updated user — reuse token from localStorage
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
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <h2>{user?.name}</h2>
            <span className={`badge ${user?.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>
              {user?.role}
            </span>
          </div>
        </div>

        {saved && <div className="alert" style={{ background: '#CCFFD8', color: '#1A6030', border: '2px solid #121212' }}>Profile saved.</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="profile-fields">
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
            <span className="profile-field-label"><Shield size={14} /> Proficiency</span>
            <span className="profile-field-value">{user?.proficiency || 'beginner'}</span>
          </div>
        </div>

        <div className="profile-actions">
          {editing ? (
            <>
              <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit Profile</button>
          )}
        </div>
      </div>
    </div>
  )
}
