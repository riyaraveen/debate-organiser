import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

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
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
