import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useClub } from '../../context/ClubContext'

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  const { activeClub } = useClub()

  if (loading) return <div className="loading-screen">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly) {
    // Club owner/admin check: club role takes priority over global user.role
    const clubRole = activeClub?.role
    const isAdmin = clubRole === 'owner' || clubRole === 'admin' || user.role === 'admin'
    if (!isAdmin) return <Navigate to="/" replace />
  }

  return children
}
