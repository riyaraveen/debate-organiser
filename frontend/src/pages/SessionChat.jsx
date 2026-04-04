import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSession, getChatHistory } from '../api'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Send, Users, MessageCircle } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

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
  const [status, setStatus] = useState('connecting') // connecting | open | closed | error | forbidden | removed
  const [error, setError] = useState('')
  const wsRef = useRef(null)
  const bottomRef = useRef(null)

  const loadHistory = () => {
    setStatus('connecting')
    setError('')
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
  }

  // Load session info + message history
  useEffect(() => {
    getSession(id).then((r) => setSession(r.data)).catch(() => {})
    loadHistory()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

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
      } else if (data.type === 'removed') {
        setStatus('removed')
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
      else if (e.code === 4003) { setStatus(s => s === 'removed' ? 'removed' : 'forbidden') }
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

  // Group participants by side
  const participants = session?.participants ?? []
  const proposition = participants.filter(p => p.side === 'proposition')
  const opposition  = participants.filter(p => p.side === 'opposition')
  const observers   = participants.filter(p => !p.side || p.side === 'general')

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column' }}>
      <PageHero title="Team Chat" subtitle={session?.title ?? 'Session chat'} color="#F0C020">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <circle cx="45" cy="44" r="55" fill="var(--black)" opacity="0.08"/>
          <rect x="100" y="16" width="44" height="44" fill="var(--black)" opacity="0.10" transform="rotate(8 122 38)"/>
          <circle cx="210" cy="44" r="52" fill="var(--black)" opacity="0.07"/>
          <circle cx="210" cy="44" r="28" fill="var(--black)" opacity="0.06"/>
          <polygon points="300,6 336,74 264,74" fill="var(--black)" opacity="0.08"/>
          <circle cx="370" cy="44" r="50" fill="var(--black)" opacity="0.07"/>
        </svg>
      </PageHero>

      <div className="notes-page-top">
        <Link to={`/sessions/${id}`} className="btn btn-ghost" style={{ gap: 6 }}>
          <ArrowLeft size={15} /> Back to Session
        </Link>
        {session && (
          <span className="text-muted" style={{ fontSize: 13, fontWeight: 600 }}>{session.title}</span>
        )}
      </div>

      <div className="chat-page-layout">
        {/* ── Chat panel ── */}
        <div className="chat-panel" style={{ display: 'flex', flexDirection: 'column' }}>
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

          {/* Removed from session */}
          {status === 'removed' && (
            <div className="alert alert-error" style={{ margin: '12px 0' }}>
              You have been removed from this session and can no longer send messages. Your previous messages are still visible to your team.
            </div>
          )}

          {/* Forbidden / error states */}
          {(status === 'forbidden' || status === 'error') && (
            <div className="alert alert-error" style={{ margin: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span>{status === 'forbidden' ? 'You are not a participant in this session. If you were just added, click Refresh.' : (error || 'Could not connect to chat.')}</span>
              <button className="btn btn-ghost" style={{ flexShrink: 0, fontSize: 12 }} onClick={loadHistory}>Refresh</button>
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
              <div className="chat-empty">
                <MessageCircle size={32} style={{ opacity: 0.25, marginBottom: 8 }} />
                No messages yet. Say something to your team!
              </div>
            )}
            {messages.map((m, i) => {
              if (m.isSystem || m.type === 'system') {
                return <div key={i} className="chat-system-msg">{m.content}</div>
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

          {/* Input — hidden once removed or session closed */}
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

        {/* ── Participants sidebar ── */}
        <aside className="chat-participants-sidebar">
          <div className="chat-participants-header">
            <Users size={14} color="white" />
            <span>Participants</span>
            <span className="chat-participants-count">{participants.length}</span>
          </div>

          {participants.length === 0 ? (
            <div className="chat-participants-body">
              <p className="text-muted" style={{ fontSize: 13 }}>No participants assigned yet.</p>
            </div>
          ) : (
            <div className="chat-participants-body">
              {proposition.length > 0 && (
                <div className="chat-side-group">
                  <div className="chat-side-label" style={{ '--side-color': 'var(--blue)' }}>
                    Proposition
                  </div>
                  {proposition.map((p) => (
                    <div key={p.id} className="chat-participant-row">
                      <span className="avatar sm" style={{ background: 'var(--blue)', flexShrink: 0 }}>
                        {p.user?.name?.[0] ?? '?'}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.user?.name ?? `User #${p.user_id}`}
                        </div>
                        {p.role_name && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{p.role_name}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {opposition.length > 0 && (
                <div className="chat-side-group">
                  <div className="chat-side-label" style={{ '--side-color': 'var(--red)' }}>
                    Opposition
                  </div>
                  {opposition.map((p) => (
                    <div key={p.id} className="chat-participant-row">
                      <span className="avatar sm" style={{ background: 'var(--red)', flexShrink: 0 }}>
                        {p.user?.name?.[0] ?? '?'}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.user?.name ?? `User #${p.user_id}`}
                        </div>
                        {p.role_name && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{p.role_name}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {observers.length > 0 && (
                <div className="chat-side-group">
                  <div className="chat-side-label" style={{ '--side-color': 'var(--black)' }}>
                    Observers / General
                  </div>
                  {observers.map((p) => (
                    <div key={p.id} className="chat-participant-row">
                      <span className="avatar sm" style={{ flexShrink: 0 }}>
                        {p.user?.name?.[0] ?? '?'}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.user?.name ?? `User #${p.user_id}`}
                        </div>
                        {p.role_name && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{p.role_name}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="chat-your-side">
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Your side</span>
            <span className="badge" style={{ background: sideColor, color: side === 'proposition' || side === 'opposition' ? 'white' : 'white', border: 'none', fontSize: 11, fontWeight: 800 }}>
              {sideLabel}
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}
