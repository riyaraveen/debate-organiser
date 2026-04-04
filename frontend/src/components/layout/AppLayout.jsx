import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { getAnnouncements } from '../../api'
import { X, Megaphone } from 'lucide-react'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/sessions': 'Sessions',
  '/sessions/new': 'New Session',
  '/calendar': 'Calendar',
  '/topics': 'Topics',
  '/members': 'Members',
  '/learn': 'Learn to Debate',
  '/profile': 'My Profile',
  '/formats': 'Debate Formats',
  '/settings': 'Club Settings',
  '/practice': 'AI Practice Mode',
  '/tournaments': 'Tournaments',
  '/schools': 'Schools',
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const [announcements, setAnnouncements] = useState([])
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissed_announcements') || '[]') } catch { return [] }
  })

  useEffect(() => {
    getAnnouncements().then(r => setAnnouncements(r.data)).catch(() => {})
  }, [])

  const dismiss = (id) => {
    const next = [...dismissed, id]
    setDismissed(next)
    localStorage.setItem('dismissed_announcements', JSON.stringify(next))
  }

  const visible = announcements.filter(a => !dismissed.includes(a.id))
  // Match exact first, then check for dynamic segments like /sessions/:id
  const title =
    PAGE_TITLES[pathname] ??
    (pathname.match(/^\/sessions\/[^/]+\/notes$/) ? 'Session Notes'
    : pathname.match(/^\/sessions\/[^/]+\/ai$/) ? 'AI Debate Assistant'
    : pathname.match(/^\/sessions\/[^/]+\/chat$/) ? 'Team Chat'
    : pathname.startsWith('/sessions/') ? 'Session Detail'
    : 'Debate Organiser')

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Header title={title} />
        {visible.map(a => (
          <div key={a.id} style={{
            background: '#F0C020', borderBottom: '2px solid #121212',
            padding: '10px 20px', display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <Megaphone size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ fontSize: 13 }}>{a.title}</strong>
              {a.content && <p style={{ margin: '2px 0 0', fontSize: 12 }}>{a.content}</p>}
            </div>
            <button onClick={() => dismiss(a.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
              <X size={15} />
            </button>
          </div>
        ))}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
