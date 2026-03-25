import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSession, getChatHistory } from '../api'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Send, Users } from 'lucide-react'

const SIDE_LABELS = {
  proposition: 'Proposition',
  opposition:  'Opposition',
  general:     'General',
}

const SIDE_COLORS = {
  proposition: 'var(--blue)',
  opposition:  'var(--red)',
  general:     'var(--black)',
}

export default function SessionChat() {
  const { id } = useParams()
  const { user } = useAuth()
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [side, setSide] = useState(null)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('connecting') // connecting | open | closed | error | forbidden
  const [error, setError] = useState('')
  const wsRef = useRef(null)
  const bottomRef = useRef(null)

  // Load session info + message history
  useEffect(() => {
    getSession(id).then((r) => setSession(r.data)).catch(() => {})
    getChatHistory(id)
      .then((r) => {
        setSide(r.data.side)
        setMessages(r.data.messages || [])
        if (r.data.session_status === 'completed') setStatus('closed')
      })
      .catch((err) => {
        if (err.response?.status === 403) setStatus('forbidden')
        else setStatus('error')
        setError(err.response?.data?.detail || 'Could not load chat')
      })
  }, [id])

  // Open WebSocket once we know the side and session isn't completed
  useEffect(() => {
    if (status === 'closed' || status === 'forbidden' || status === 'error') return
    if (!side) return

    const token = localStorage.getItem('token')
    if (!token) { setStatus('error'); return }

    const wsUrl = `ws://localhost:8000/api/sessions/${id}/chat/ws?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => setStatus('open')

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'message') {
        setMessages((prev) => [...prev, data])
      } else if (data.type === 'system') {
        setMessages((prev) => [...prev, { ...data, isSystem: true }])
      } else if (data.type === 'error') {
        setError(data.detail)
      } else if (data.type === 'joined') {
        setSide(data.side)
        if (data.session_status === 'completed') setStatus('closed')
      }
    }

    ws.onerror = () => setStatus('error')
    ws.onclose = (e) => {
      if (e.code === 4001) { setStatus('error'); setError('Authentication failed.') }
      else if (e.code === 4003) { setStatus('forbidden'); setError('You are not a participant in this session.') }
      else if (status !== 'closed') setStatus('error')
    }

    return () => ws.close()
  }, [side, id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ content: input.trim() }))
    setInput('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const sideColor = side ? SIDE_COLORS[side] : 'var(--black)'
  const sideLabel = side ? SIDE_LABELS[side] : '…'

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Top bar */}
      <div className="page-top-bar" style={{ marginBottom: 16 }}>
        <Link to={`/sessions/${id}`} className="btn btn-ghost" style={{ gap: 6 }}>
          <ArrowLeft size={15} /> Back to Session
        </Link>
        {session && (
          <span className="text-muted" style={{ fontSize: 13, fontWeight: 600 }}>{session.title}</span>
        )}
      </div>

      {/* Room label */}
      <div className="chat-room-banner" style={{ borderColor: sideColor }}>
        <div className="chat-room-dot" style={{ background: sideColor }} />
        <div>
          <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {sideLabel} Team Chat
          </span>
          {side === 'general' && (
            <span className="text-muted" style={{ fontSize: 12, marginLeft: 10 }}>
              (you have no assigned side)
            </span>
          )}
        </div>
        <div className="chat-room-status" style={{ background: status === 'open' ? '#22c55e' : '#aaa' }} />
      </div>

      {/* Forbidden / error states */}
      {(status === 'forbidden' || status === 'error') && (
        <div className="alert alert-error" style={{ margin: '12px 0' }}>
          {error || 'Could not connect to chat.'}
        </div>
      )}

      {/* Completed state */}
      {status === 'closed' && (
        <div className="chat-ended-banner">
          <Users size={18} />
          <div>
            <strong>Session ended — chat cleared</strong>
            <p style={{ margin: '4px 0 0', fontWeight: 400, fontSize: 13 }}>
              Messages are deleted when a session is completed. A new chat will open once participants are re-assigned for the next session.
            </p>
          </div>
        </div>
      )}

      {/* Message list */}
      <div className="chat-messages">
        {messages.length === 0 && status === 'open' && (
          <div className="chat-empty">No messages yet. Say something to your team!</div>
        )}
        {messages.map((m, i) => {
          if (m.isSystem || m.type === 'system') {
            return (
              <div key={i} className="chat-system-msg">{m.content}</div>
            )
          }
          const isMe = m.user_id === user?.id
          return (
            <div key={m.id ?? i} className={`chat-bubble-row ${isMe ? 'me' : 'them'}`}>
              {!isMe && (
                <span className="avatar sm" style={{ background: sideColor }}>{m.user_name?.[0]}</span>
              )}
              <div className="chat-bubble-group">
                {!isMe && (
                  <span className="chat-bubble-author">{m.user_name}</span>
                )}
                <div className={`chat-bubble ${isMe ? 'chat-bubble-me' : 'chat-bubble-them'}`}
                  style={isMe ? { background: sideColor } : undefined}>
                  {m.content}
                </div>
                <span className="chat-time">
                  {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {status === 'open' && (
        <div className="chat-input-row">
          <textarea
            className="chat-input"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Message your team… (Enter to send)"
          />
          <button
            className="btn btn-primary chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
