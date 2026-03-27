import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markAllRead } from '../../api'

export default function Header({ title }) {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen]           = useState(false)
  const [toast, setToast]         = useState(null)   // latest new notification to show in bar
  const dropdownRef   = useRef(null)
  const prevIdsRef    = useRef(new Set())
  const firstFetchRef = useRef(true)
  const navigate      = useNavigate()

  const fetchNotifications = () => {
    getNotifications().then((res) => {
      const data = res.data
      // Only show toast for notifications that arrive after the initial load
      if (!firstFetchRef.current) {
        const newUnread = data.filter(n => !prevIdsRef.current.has(n.id) && !n.is_read)
        if (newUnread.length > 0) setToast(newUnread[0])
      }
      firstFetchRef.current = false
      prevIdsRef.current = new Set(data.map(n => n.id))
      setNotifications(data)
    }).catch(() => {})
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = notifications.filter(n => !n.is_read).length

  const handleBellClick = async () => {
    const opening = !open
    setOpen(opening)
    if (opening) {
      setToast(null)
      if (unread > 0) {
        await markAllRead()
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      }
    }
  }

  const handleNotificationClick = (n) => {
    if (n.link) navigate(n.link)
    setOpen(false)
  }

  return (
    <header className="app-header">

      {/* Toast — shows on the left until the dropdown is opened */}
      {toast && !open && (
        <div className="header-toast">
          <span className="header-toast-dot"/>
          <span className="header-toast-msg">{toast.message}</span>
        </div>
      )}

      <div className="header-actions" ref={dropdownRef}>
        <button className="bell-btn" onClick={handleBellClick}>
          <Bell size={20}/>
          {unread > 0 && <span className="bell-dot" aria-label={`${unread} unread`}/>}
        </button>

        {open && (
          <div className="notifications-dropdown">
            <div className="notifications-header">
              <span>Notifications</span>
            </div>
            {notifications.length === 0 ? (
              <p className="notifications-empty">No notifications</p>
            ) : (
              <ul className="notifications-list">
                {notifications.map((n) => (
                  <li key={n.id} className="notification-item"
                    onClick={() => handleNotificationClick(n)}>
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
