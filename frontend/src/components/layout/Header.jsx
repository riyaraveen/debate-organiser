import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markAllRead } from '../../api'
import { useNotificationSocket } from '../../hooks/useNotificationSocket'

export default function Header({ title }) {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen]     = useState(false)
  const [toast, setToast]   = useState(null)
  const dropdownRef   = useRef(null)
  const prevIdsRef    = useRef(new Set())
  const firstFetchRef = useRef(true)
  const navigate      = useNavigate()

  const fetchNotifications = useCallback(() => {
    getNotifications().then((res) => {
      const data = res.data
      if (!firstFetchRef.current) {
        const newUnread = data.filter(n => !prevIdsRef.current.has(n.id) && !n.is_read)
        if (newUnread.length > 0) setToast(newUnread[0])
      }
      firstFetchRef.current = false
      prevIdsRef.current = new Set(data.map(n => n.id))
      setNotifications(data)
    }).catch(() => {})
  }, [])

  // Initial load
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Real-time push via WebSocket — prepend new notification to state
  useNotificationSocket(useCallback((payload) => {
    const newNotif = {
      id: Date.now(), // temporary id until next fetch syncs
      message: payload.message,
      link: payload.link,
      is_read: false,
      notification_type: null,
    }
    setNotifications(prev => [newNotif, ...prev])
    setToast(newNotif)
    // Re-fetch to get server-assigned id and deduplicate
    setTimeout(fetchNotifications, 500)
  }, [fetchNotifications]))

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

  const isReminder = (n) => n?.notification_type === 'session_reminder'

  return (
    <header className="app-header">
      <div className="header-actions" ref={dropdownRef}>

        {toast && !open && (
          <div className={`header-toast ${isReminder(toast) ? 'header-toast-reminder' : ''}`}>
            <span className="header-toast-dot"/>
            <span className="header-toast-msg">{toast.message}</span>
          </div>
        )}

        <button className="bell-btn" onClick={handleBellClick}>
          <Bell size={20}/>
          {unread > 0 && (
            <span className="bell-badge" aria-label={`${unread} unread`}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
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
                  <li key={n.id}
                    className={`notification-item ${isReminder(n) ? 'notification-item-reminder' : ''}`}
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
