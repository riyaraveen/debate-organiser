import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useClub } from '../../context/ClubContext'
import {
  LayoutDashboard, CalendarDays, MessageSquare, BookOpen,
  Users, ListTodo, LogOut, GraduationCap, Settings, Layers, User, Swords, Trophy, School, Sun, Moon, RefreshCw
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/sessions', label: 'Sessions', icon: MessageSquare },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/topics', label: 'Topics', icon: ListTodo },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/learn', label: 'Learn', icon: GraduationCap },
  { to: '/practice', label: 'AI Practice', icon: Swords },
  { to: '/profile', label: 'My Profile', icon: User },
]

const adminItems = [
  { to: '/formats', label: 'Formats', icon: Layers },
  { to: '/schools', label: 'Schools', icon: School },
  { to: '/tournaments', label: 'Tournaments', icon: Trophy },
  { to: '/settings', label: 'Club Settings', icon: Settings },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { activeClub } = useClub()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BookOpen size={22} />
        <span>DebateOrg</span>
      </div>
      {activeClub && (
        <div style={{ padding: '6px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 2 }}>Active club</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeClub.name}
            </span>
            <button
              title="Switch club"
              onClick={() => navigate('/club-select')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7, padding: 0, flexShrink: 0 }}
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="nav-divider">Admin</div>
            {adminItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className="sidebar-user-role">{user?.role}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={() => setDark(d => !d)} title="Toggle dark mode" style={{ marginRight: 4 }}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="logout-btn" onClick={() => setShowLogoutConfirm(true)} title="Log out">
          <LogOut size={18} />
        </button>
      </div>

      {showLogoutConfirm && (
        <div className="logout-confirm-backdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="logout-confirm" onClick={e => e.stopPropagation()}>
            <div className="logout-confirm-title">Log out?</div>
            <div className="logout-confirm-msg">Are you sure you want to log out?</div>
            <div className="logout-confirm-actions">
              <button className="logout-confirm-cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="logout-confirm-ok" onClick={logout}>Log out</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
