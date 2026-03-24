import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/sessions': 'Sessions',
  '/calendar': 'Calendar',
  '/topics': 'Topics',
  '/members': 'Members',
  '/learn': 'Learn to Debate',
  '/profile': 'My Profile',
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'Debate Organiser'

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
