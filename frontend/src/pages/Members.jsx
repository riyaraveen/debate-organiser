import { useState, useEffect } from 'react'
import { getUsers, updateUserRole } from '../api'
import { useAuth } from '../context/AuthContext'
import { Shield, User } from 'lucide-react'

export default function Members() {
  const { user: me } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUsers().then((r) => setMembers(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    if (userId === me?.id) return alert("You can't change your own role.")
    const res = await updateUserRole(userId, newRole)
    setMembers(members.map((m) => m.id === userId ? res.data : m))
  }

  return (
    <div className="page-container">
      <h3 className="section-title">All Members ({members.length})</h3>
      {loading ? <div className="loading">Loading…</div> : (
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Grade</th><th>Proficiency</th><th>Role</th></tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="member-name-cell">
                    <span className="avatar sm">{m.name[0]}</span>
                    {m.name}
                    {m.id === me?.id && <span className="badge badge-gray">you</span>}
                  </div>
                </td>
                <td>{m.email}</td>
                <td>{m.grade || '—'}</td>
                <td>{m.proficiency}</td>
                <td>
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    disabled={m.id === me?.id}
                    className="role-select"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
