import { useState, useRef, useEffect } from 'react'
import { getFormats } from '../api'
import api from '../api/client'
import { Sparkles, Send, RotateCcw } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

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
    <div className="page-container">
      <PageHero title="AI Practice" subtitle="Debate against Claude AI" color="#D02020">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          {/* Left debater — blue rectangle figure */}
          <rect x="30" y="18" width="18" height="18" rx="9" fill="white" opacity="0.55"/>
          <rect x="34" y="38" width="10" height="22" fill="white" opacity="0.45"/>
          <rect x="22" y="42" width="10" height="14" fill="white" opacity="0.35"/>
          <rect x="44" y="42" width="10" height="14" fill="white" opacity="0.35"/>
          {/* Speech bubble left */}
          <rect x="55" y="14" width="50" height="28" rx="3" fill="#F0C020" opacity="0.55"/>
          <polygon points="55,30 48,36 58,34" fill="#F0C020" opacity="0.55"/>
          <rect x="61" y="21" width="20" height="3" rx="1" fill="var(--black)" opacity="0.3"/>
          <rect x="61" y="28" width="32" height="3" rx="1" fill="var(--black)" opacity="0.3"/>
          {/* VS text area */}
          <circle cx="200" cy="44" r="22" fill="white" opacity="0.12"/>
          <circle cx="200" cy="44" r="14" fill="white" opacity="0.10"/>
          {/* Right debater — red rectangle figure */}
          <rect x="352" y="18" width="18" height="18" rx="9" fill="white" opacity="0.55"/>
          <rect x="356" y="38" width="10" height="22" fill="white" opacity="0.45"/>
          <rect x="344" y="42" width="10" height="14" fill="white" opacity="0.35"/>
          <rect x="366" y="42" width="10" height="14" fill="white" opacity="0.35"/>
          {/* Speech bubble right */}
          <rect x="295" y="14" width="50" height="28" rx="3" fill="#F0C020" opacity="0.55"/>
          <polygon points="345,30 352,36 342,34" fill="#F0C020" opacity="0.55"/>
          <rect x="301" y="21" width="32" height="3" rx="1" fill="var(--black)" opacity="0.3"/>
          <rect x="301" y="28" width="20" height="3" rx="1" fill="var(--black)" opacity="0.3"/>
          {/* Decorative circles */}
          <circle cx="200" cy="44" r="50" fill="white" opacity="0.04"/>
          <circle cx="200" cy="44" r="70" fill="white" opacity="0.03"/>
        </svg>
      </PageHero>

      <div className="practice-body">
        {!started ? (
          <div className="practice-setup-layout">
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

            {/* How it works panel */}
            <div className="practice-how-it-works">
              <div className="practice-how-header">
                <span>How it works</span>
              </div>
              <div className="practice-step">
                <span className="practice-step-num" style={{ background: 'var(--red)' }}>1</span>
                <div>
                  <strong>Choose your motion</strong>
                  <p>Enter any debate topic — from politics to ethics to current events.</p>
                </div>
              </div>
              <div className="practice-step">
                <span className="practice-step-num" style={{ background: 'var(--blue)' }}>2</span>
                <div>
                  <strong>Pick your side</strong>
                  <p>Argue proposition or opposition. Claude takes the opposite position.</p>
                </div>
              </div>
              <div className="practice-step">
                <span className="practice-step-num" style={{ background: 'var(--yellow)', color: 'var(--black)' }}>3</span>
                <div>
                  <strong>Debate & get coached</strong>
                  <p>Make arguments, receive rebuttals, and get real-time coaching tips after each exchange.</p>
                </div>
              </div>
              <div className="practice-tip-box">
                <strong>Pro tip</strong>
                <p>Try arguing the side you disagree with — it's the fastest way to strengthen your real position.</p>
              </div>
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
    </div>
  )
}
