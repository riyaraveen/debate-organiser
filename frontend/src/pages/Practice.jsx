import { useState, useRef, useEffect, useCallback } from 'react'
import { getFormats } from '../api'
import api from '../api/client'
import { Sparkles, Send, RotateCcw, Plus, ChevronDown, ChevronUp, Trophy, AlertCircle } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import { useToast } from '../context/ToastContext'

const SUGGESTED_TOPICS = [
  'This house would ban social media for under 16s',
  'This house believes AI will do more harm than good',
  'This house would make voting compulsory',
  'This house would legalise all drugs',
  'This house believes capitalism has failed',
  'This house would abolish the monarchy',
]

const DIFFICULTY_LEVELS = [
  { value: 'beginner',     label: 'Beginner',     desc: 'Simple arguments, encouraging tone' },
  { value: 'intermediate', label: 'Intermediate',  desc: 'Well-structured with evidence' },
  { value: 'expert',       label: 'Expert',        desc: 'Advanced rhetoric, no mercy' },
]

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function FeedbackCard({ feedback }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="practice-feedback-card">
      <button className="practice-feedback-toggle" onClick={() => setOpen(o => !o)}>
        <Sparkles size={12} />
        <span>Coach tip</span>
        {open ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
      </button>
      {open && <p className="practice-feedback-body">{feedback}</p>}
    </div>
  )
}

export default function Practice() {
  const toast = useToast()
  const [formats, setFormats] = useState([])
  const [setup, setSetup] = useState({ topic: '', side: 'proposition', format_name: '', difficulty: 'intermediate' })
  const [started, setStarted] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [summarising, setSummarising] = useState(false)
  const [summary, setSummary] = useState(null)
  const [lastFailedMessages, setLastFailedMessages] = useState(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    getFormats().then((r) => setFormats(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, summary])

  const handleStart = () => {
    if (!setup.topic.trim()) return
    setMessages([{
      role: 'assistant',
      content: `The motion is: "${setup.topic}". You are arguing for the ${setup.side}. I will oppose you. Make your opening argument.`,
      feedback: null,
    }])
    setStarted(true)
    setSummary(null)
    setLastFailedMessages(null)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  const handleTopicKey = (e) => {
    if (e.key === 'Enter' && setup.topic.trim()) handleStart()
  }

  const doSend = useCallback(async (msgs) => {
    setLoading(true)
    setLastFailedMessages(null)
    try {
      const res = await api.post('/api/ai/practice', {
        topic: setup.topic,
        side: setup.side,
        format_name: setup.format_name || null,
        difficulty: setup.difficulty,
        messages: msgs.map(({ role, content }) => ({ role, content })),
      })
      setMessages([...msgs, { role: 'assistant', content: res.data.reply, feedback: res.data.feedback }])
    } catch {
      toast.error('AI request failed. Use the retry button to try again.')
      setLastFailedMessages(msgs)
      // Remove the optimistic user message
      setMessages(msgs.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }, [setup, toast])

  const handleSend = () => {
    if (!input.trim() || loading) return
    const newMessages = [...messages, { role: 'user', content: input, feedback: null }]
    setMessages(newMessages)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    doSend(newMessages)
  }

  const handleRetry = () => {
    if (!lastFailedMessages) return
    doSend(lastFailedMessages)
  }

  const handleSummarise = async () => {
    setSummarising(true)
    try {
      const res = await api.post('/api/ai/practice', {
        topic: setup.topic,
        side: setup.side,
        format_name: setup.format_name || null,
        difficulty: setup.difficulty,
        summarise: true,
        messages: messages.map(({ role, content }) => ({ role, content })),
      })
      setSummary(res.data.reply)
    } catch {
      toast.error('Could not generate summary. Please try again.')
    } finally {
      setSummarising(false)
    }
  }

  // Restart: keep setup, clear messages
  const handleRestart = () => {
    setMessages([{
      role: 'assistant',
      content: `The motion is: "${setup.topic}". You are arguing for the ${setup.side}. I will oppose you. Make your opening argument.`,
      feedback: null,
    }])
    setInput('')
    setSummary(null)
    setLastFailedMessages(null)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  // New debate: reset everything
  const handleNewDebate = () => {
    setStarted(false)
    setMessages([])
    setInput('')
    setSummary(null)
    setLastFailedMessages(null)
  }

  const handleTextareaChange = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`
  }

  const userTurns = messages.filter(m => m.role === 'user').length

  return (
    <div className="page-container">
      <PageHero title="AI Practice" subtitle="Debate against Claude AI" color="#D02020">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <rect x="30" y="18" width="18" height="18" rx="9" fill="white" opacity="0.55"/>
          <rect x="34" y="38" width="10" height="22" fill="white" opacity="0.45"/>
          <rect x="22" y="42" width="10" height="14" fill="white" opacity="0.35"/>
          <rect x="44" y="42" width="10" height="14" fill="white" opacity="0.35"/>
          <rect x="55" y="14" width="50" height="28" rx="3" fill="#F0C020" opacity="0.55"/>
          <polygon points="55,30 48,36 58,34" fill="#F0C020" opacity="0.55"/>
          <rect x="61" y="21" width="20" height="3" rx="1" fill="var(--black)" opacity="0.3"/>
          <rect x="61" y="28" width="32" height="3" rx="1" fill="var(--black)" opacity="0.3"/>
          <circle cx="200" cy="44" r="22" fill="white" opacity="0.12"/>
          <circle cx="200" cy="44" r="14" fill="white" opacity="0.10"/>
          <rect x="352" y="18" width="18" height="18" rx="9" fill="white" opacity="0.55"/>
          <rect x="356" y="38" width="10" height="22" fill="white" opacity="0.45"/>
          <rect x="344" y="42" width="10" height="14" fill="white" opacity="0.35"/>
          <rect x="366" y="42" width="10" height="14" fill="white" opacity="0.35"/>
          <rect x="295" y="14" width="50" height="28" rx="3" fill="#F0C020" opacity="0.55"/>
          <polygon points="345,30 352,36 342,34" fill="#F0C020" opacity="0.55"/>
          <rect x="301" y="21" width="32" height="3" rx="1" fill="var(--black)" opacity="0.3"/>
          <rect x="301" y="28" width="20" height="3" rx="1" fill="var(--black)" opacity="0.3"/>
          <circle cx="200" cy="44" r="50" fill="white" opacity="0.04"/>
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
                Practice debating against Claude AI. Choose a topic and side — Claude will argue the opposite position and give you coaching feedback after each exchange.
              </p>

              <div className="form-stack">
                <label>
                  Motion / Topic *
                  <input className="input" value={setup.topic}
                    onChange={(e) => setSetup({ ...setup, topic: e.target.value })}
                    onKeyDown={handleTopicKey}
                    placeholder="e.g. This house would ban social media for under 16s" />
                </label>

                {/* Topic chips */}
                <div className="practice-topic-chips">
                  <span className="practice-chips-label">Suggestions:</span>
                  {SUGGESTED_TOPICS.map(t => (
                    <button key={t} className="practice-topic-chip"
                      onClick={() => setSetup(s => ({ ...s, topic: t }))}>
                      {t}
                    </button>
                  ))}
                </div>

                <label>
                  Your Side
                  <select value={setup.side} onChange={(e) => setSetup({ ...setup, side: e.target.value })}>
                    <option value="proposition">Proposition (For)</option>
                    <option value="opposition">Opposition (Against)</option>
                  </select>
                </label>

                <div>
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Difficulty</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {DIFFICULTY_LEVELS.map(({ value, label, desc }) => (
                      <button key={value}
                        className={`practice-difficulty-btn ${setup.difficulty === value ? 'active' : ''}`}
                        onClick={() => setSetup(s => ({ ...s, difficulty: value }))}
                        title={desc}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    {DIFFICULTY_LEVELS.find(d => d.value === setup.difficulty)?.desc}
                  </p>
                </div>

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
                  <p>Enter any debate topic — or pick one from the suggestions above.</p>
                </div>
              </div>
              <div className="practice-step">
                <span className="practice-step-num" style={{ background: 'var(--blue)' }}>2</span>
                <div>
                  <strong>Pick your side & difficulty</strong>
                  <p>Argue proposition or opposition. Set Expert mode when you're ready for a real challenge.</p>
                </div>
              </div>
              <div className="practice-step">
                <span className="practice-step-num" style={{ background: 'var(--yellow)', color: 'var(--black)' }}>3</span>
                <div>
                  <strong>Debate & get coached</strong>
                  <p>Make arguments, receive rebuttals, and get coaching tips. End with a full performance summary.</p>
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
                  <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{setup.difficulty}</span>
                  {userTurns > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>Round {userTurns}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {userTurns >= 2 && !summary && (
                  <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={handleSummarise} disabled={summarising || loading}>
                    <Trophy size={13}/> {summarising ? 'Summarising…' : 'End & Summarise'}
                  </button>
                )}
                <button className="btn btn-ghost" onClick={handleRestart} disabled={loading} title="Restart with same topic">
                  <RotateCcw size={14}/> Restart
                </button>
                <button className="btn btn-ghost" onClick={handleNewDebate} disabled={loading} title="New debate">
                  <Plus size={14}/> New
                </button>
              </div>
            </div>

            <div className="practice-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`practice-message ${msg.role}`}>
                  <div className="practice-message-label">
                    {msg.role === 'user' ? 'You' : '✦ Claude (AI Opponent)'}
                  </div>
                  <div className="practice-message-content">{msg.content}</div>
                  {msg.feedback && <FeedbackCard feedback={msg.feedback} />}
                </div>
              ))}

              {loading && (
                <div className="practice-message assistant">
                  <div className="practice-message-label">✦ Claude (AI Opponent)</div>
                  <div className="practice-message-content practice-thinking">Thinking…</div>
                </div>
              )}

              {lastFailedMessages && !loading && (
                <div className="practice-error-row">
                  <AlertCircle size={14}/>
                  <span>Message failed to send.</span>
                  <button className="btn btn-ghost" style={{ fontSize: 12, padding: '3px 10px' }} onClick={handleRetry}>
                    Retry
                  </button>
                </div>
              )}

              {summary && (
                <div className="practice-summary">
                  <div className="practice-summary-header">
                    <Trophy size={16}/> Performance Summary
                  </div>
                  <div className="practice-summary-body">{summary}</div>
                  <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={handleRestart}><RotateCcw size={13}/> Practice Again</button>
                    <button className="btn btn-ghost" onClick={handleNewDebate}><Plus size={13}/> New Debate</button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {!summary && (
              <div className="practice-input-row">
                <div style={{ flex: 1, position: 'relative' }}>
                  <textarea
                    ref={textareaRef}
                    className="practice-input"
                    rows={2}
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder="Make your argument… (Enter to send, Shift+Enter for new line)"
                    disabled={loading}
                    style={{ resize: 'none', overflow: 'hidden' }}
                  />
                  {input.length > 0 && (
                    <span className="practice-wordcount">{wordCount(input)} words</span>
                  )}
                </div>
                <button className="btn btn-primary practice-send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
                  <Send size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
