import { useEffect, useRef } from 'react'

const WS_BASE = 'ws://localhost:8000'
const MAX_BACKOFF = 30000

/**
 * Connects to the notification WebSocket and calls onNotification(payload)
 * whenever the server pushes a new notification. Reconnects automatically
 * with exponential backoff on disconnect.
 */
export function useNotificationSocket(onNotification) {
  const wsRef = useRef(null)
  const backoffRef = useRef(2000)
  const timerRef = useRef(null)
  const onNotificationRef = useRef(onNotification)
  onNotificationRef.current = onNotification

  useEffect(() => {
    let unmounted = false

    function connect() {
      const token = localStorage.getItem('token')
      if (!token || unmounted) return

      const ws = new WebSocket(`${WS_BASE}/api/notifications/ws?token=${encodeURIComponent(token)}`)
      wsRef.current = ws

      ws.onopen = () => { backoffRef.current = 2000 }

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'notification') onNotificationRef.current(data)
        } catch {}
      }

      ws.onclose = () => {
        if (unmounted) return
        timerRef.current = setTimeout(() => {
          backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF)
          connect()
        }, backoffRef.current)
      }
    }

    connect()

    return () => {
      unmounted = true
      clearTimeout(timerRef.current)
      wsRef.current?.close()
    }
  }, []) // token is read from localStorage each connect() call — no dep needed
}
