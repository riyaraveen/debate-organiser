import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markAllRead, markRead } from '../../api'

export default function Header({ title }) {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    getNotifications().then((res) => setNotifications(res.data)).catch(() => {})
    const interval = setInterval(() => {
      getNotifications().then((res) => setNotifications(res.data)).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = notifications.filter((n) => !n.is_read).length

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      await markRead(n.id)
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x))
    }
    if (n.link) navigate(n.link)
    setOpen(false)
  }

  const handleMarkAll = async () => {
    await markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  return (
    <header className="app-header">
      <div className="header-actions" ref={dropdownRef}>
        <button className="bell-btn" onClick={() => setOpen(!open)}>
          <Bell size={20} />
          {unread > 0 && <span className="bell-dot" aria-label={`${unread} unread notifications`}/>}
        </button>

        {open && (
          <div className="notifications-dropdown">
            <div className="notifications-header">
              <span>Notifications</span>
              {unread > 0 && (
                <button className="mark-all-btn" onClick={handleMarkAll}>Mark all read</button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="notifications-empty">No notifications</p>
            ) : (
              <ul className="notifications-list">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    {n.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
