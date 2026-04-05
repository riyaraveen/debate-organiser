import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useClub } from './context/ClubContext'
import { ProtectedRoute } from './components/ui/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import ClubSelect from './pages/ClubSelect'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import SessionDetail from './pages/SessionDetail'
import NewSession from './pages/NewSession'
import CalendarPage from './pages/CalendarPage'
import Topics from './pages/Topics'
import Members from './pages/Members'
import Learn from './pages/Learn'
import Profile from './pages/Profile'
import ClubSettings from './pages/ClubSettings'
import Formats from './pages/Formats'
import Practice from './pages/Practice'
import Tournaments from './pages/Tournaments'
import Schools from './pages/Schools'
import SessionNotes from './pages/SessionNotes'
import SessionAI from './pages/SessionAI'
import SessionChat from './pages/SessionChat'
import TeamMemberNotes from './pages/TeamMemberNotes'
import MemberProfile from './pages/MemberProfile'
import SessionTimer from './pages/SessionTimer'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

function ClubRequiredRoute({ children }) {
  const { user, loading } = useAuth()
  const { activeClub } = useClub()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!activeClub) return <Navigate to="/club-select" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/club-select" element={<ClubSelect />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/"
        element={
          <ClubRequiredRoute>
            <AppLayout />
          </ClubRequiredRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="sessions/new" element={
          <ProtectedRoute adminOnly>
            <NewSession />
          </ProtectedRoute>
        } />
        <Route path="sessions/:id" element={<SessionDetail />} />
        <Route path="sessions/:id/notes" element={<SessionNotes />} />
        <Route path="sessions/:id/ai" element={<SessionAI />} />
        <Route path="sessions/:id/chat" element={<SessionChat />} />
        <Route path="sessions/:id/notes/:userId" element={<TeamMemberNotes />} />
        <Route path="sessions/:id/timer" element={<SessionTimer />} />
        <Route path="members/:id" element={<MemberProfile />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="topics" element={<Topics />} />
        <Route path="members" element={<Members />} />
        <Route path="learn" element={<Learn />} />
        <Route path="practice" element={<Practice />} />
        <Route path="tournaments" element={
          <ProtectedRoute adminOnly>
            <Tournaments />
          </ProtectedRoute>
        } />
        <Route path="schools" element={
          <ProtectedRoute adminOnly>
            <Schools />
          </ProtectedRoute>
        } />
        <Route path="profile" element={<Profile />} />
        <Route path="formats" element={
          <ProtectedRoute adminOnly>
            <Formats />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute adminOnly>
            <ClubSettings />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
