import { useState, useRef, useEffect } from 'react'
import { getFormats } from '../api'
import api from '../api/client'
import { Sparkles, Send, RotateCcw } from 'lucide-react'

export default function Practice() {
  const [formats, setFormats] = useState([])
  const [setup, setSetup] = useState({ topic: '', side: 'proposition', format_name: '' })
  const [started, setStarted] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    getFormats().then((r) => setFormats(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleStart = () => {
    if (!setup.topic.trim()) return
    setMessages([{
      role: 'assistant',
      content: `The motion is: "${setup.topic}". You are arguing for the ${setup.side}. I will oppose you. Make your opening argument.`,
      feedback: null,
    }])
    setStarted(true)
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input, feedback: null }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/api/ai/practice', {
        topic: setup.topic,
        side: setup.side,
        format_name: setup.format_name || null,
        messages: newMessages.map(({ role, content }) => ({ role, content })),
      })
      setMessages([...newMessages, {
        role: 'assistant',
        content: res.data.reply,
        feedback: res.data.feedback,
      }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Error — please try again.', feedback: null }])
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStarted(false)
    setMessages([])
    setInput('')
  }

  return (
    <div className="practice-page">
      {!started ? (
        <div className="practice-setup-card">
          <div className="practice-setup-header">
            <Sparkles size={22} />
            <h2>AI Debate Practice</h2>
          </div>
          <p className="practice-setup-desc">
            Practice debating against Claude AI. Choose a topic and side — Claude will argue the opposite position and give you coaching feedback.
          </p>

          <div className="form-stack">
            <label>
              Motion / Topic *
              <input className="input" value={setup.topic}
                onChange={(e) => setSetup({ ...setup, topic: e.target.value })}
                placeholder="e.g. This house would ban social media for under 16s" />
            </label>
            <label>
              Your Side
              <select value={setup.side} onChange={(e) => setSetup({ ...setup, side: e.target.value })}>
                <option value="proposition">Proposition (For)</option>
                <option value="opposition">Opposition (Against)</option>
              </select>
            </label>
            <label>
              Debate Format (optional)
              <select value={setup.format_name} onChange={(e) => setSetup({ ...setup, format_name: e.target.value })}>
                <option value="">Any format</option>
                {formats.map((f) => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </label>
            <button className="btn btn-primary" onClick={handleStart} disabled={!setup.topic.trim()}>
              <Sparkles size={15} /> Start Practice Debate
            </button>
          </div>
        </div>
      ) : (
        <div className="practice-arena">
          <div className="practice-arena-header">
            <div>
              <div className="practice-motion">"{setup.topic}"</div>
              <div className="practice-sides">
                <span className="badge badge-blue">You: {setup.side}</span>
                <span className="badge badge-red">Claude: {setup.side === 'proposition' ? 'opposition' : 'proposition'}</span>
              </div>
            </div>
            <button className="btn btn-ghost" onClick={handleReset}><RotateCcw size={14} /> Reset</button>
          </div>

          <div className="practice-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`practice-message ${msg.role}`}>
                <div className="practice-message-label">
                  {msg.role === 'user' ? 'You' : '✦ Claude (AI Opponent)'}
                </div>
                <div className="practice-message-content">{msg.content}</div>
                {msg.feedback && (
                  <div className="practice-feedback">
                    <span className="practice-feedback-label">Coach tip:</span> {msg.feedback}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="practice-message assistant">
                <div className="practice-message-label">✦ Claude (AI Opponent)</div>
                <div className="practice-message-content practice-thinking">Thinking…</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="practice-input-row">
            <textarea
              className="practice-input"
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Make your argument… (Enter to send, Shift+Enter for new line)"
              disabled={loading}
            />
            <button className="btn btn-primary practice-send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
