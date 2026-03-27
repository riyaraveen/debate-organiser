import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSession, getCounterargument, evaluateArgument, getResearchSuggestions, detectFallacies } from '../api'
import { ArrowLeft, Sparkles, Target, BarChart2, BookOpen, AlertTriangle } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

const TABS = [
  { key: 'counter',  label: 'Counterarguments', icon: Target,        accentColor: 'var(--red)',   desc: 'Enter your own argument — see the strongest counterarguments an opponent could make, so you can prepare your defence.' },
  { key: 'eval',     label: 'Evaluate',          icon: BarChart2,     accentColor: 'var(--blue)',  desc: 'Get your argument scored 1–10 by an AI debate judge with specific strengths, weaknesses, and improvement tips.' },
  { key: 'research', label: 'Research Tips',     icon: BookOpen,      accentColor: '#22c55e',      desc: 'Enter a topic to get structured research guidance: key argument frameworks, evidence types, and what to avoid.' },
  { key: 'fallacy',  label: 'Fallacies',         icon: AlertTriangle, accentColor: 'var(--yellow)', desc: 'Paste any argument to identify logical fallacies with name, explanation, and the exact offending quote.' },
]

export default function SessionAI() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [tab, setTab] = useState('counter')
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getSession(id).then((r) => setSession(r.data)).catch(() => {})
  }, [id])

  const switchTab = (t) => { setTab(t); setResult(null); setError(''); setInput('') }

  const activeTab = TABS.find(t => t.key === tab)

  const handleRun = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      if (tab === 'counter') {
        const res = await getCounterargument({ argument: input, topic: session?.topic_text })
        setResult({ type: 'counter', data: res.data })
      } else if (tab === 'eval') {
        const res = await evaluateArgument({ argument: input, topic: session?.topic_text })
        setResult({ type: 'eval', data: res.data })
      } else if (tab === 'research') {
        const res = await getResearchSuggestions({ topic: input })
        setResult({ type: 'research', data: res.data })
      } else if (tab === 'fallacy') {
        const res = await detectFallacies({ argument: input })
        setResult({ type: 'fallacy', data: res.data })
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'AI request failed')
    } finally {
      setLoading(false)
    }
  }

  const placeholder = {
    counter:  'Enter YOUR argument — the AI will show you what opponents could say against it, so you can prepare…',
    eval:     "Paste your argument to get a score and detailed feedback from a judge's perspective…",
    research: 'Enter the debate topic to get AI-curated argument frameworks, evidence types, and research angles…',
    fallacy:  "Paste an argument (yours or an opponent's) to detect logical fallacies…",
  }[tab]

  const btnLabel = {
    counter:  '✦ Show Counterarguments',
    eval:     '✦ Evaluate Argument',
    research: '✦ Get Research Tips',
    fallacy:  '✦ Detect Fallacies',
  }[tab]

  return (
    <div className="page-container">
      <PageHero title="AI Assistant" subtitle={session?.title ?? 'Debate preparation'} color="#D02020">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <circle cx="40" cy="44" r="55" fill="white" opacity="0.06"/>
          <polygon points="120,8 148,68 92,68" fill="#F0C020" opacity="0.28"/>
          <circle cx="200" cy="44" r="50" fill="white" opacity="0.06"/>
          <circle cx="200" cy="44" r="26" fill="white" opacity="0.07"/>
          <rect x="270" y="12" width="48" height="48" fill="#F0C020" opacity="0.18" transform="rotate(15 294 36)"/>
          <circle cx="355" cy="44" r="52" fill="white" opacity="0.07"/>
          <polygon points="380,6 400,50 360,50" fill="white" opacity="0.08"/>
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

      <div className="ai-page-layout">
        {/* ── Main AI panel ── */}
        <div className="ai-page-panel">
          <div className="ai-panel-header">
            <Sparkles size={16} />
            <span>AI Debate Assistant</span>
            <span className="ai-badge">Powered by Claude</span>
          </div>

          {session?.topic_text && (
            <div className="ai-topic-banner">
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>Session Topic</span>
              <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: 14 }}>{session.topic_text}</p>
            </div>
          )}

          {/* ── Tab bar ── */}
          <div className="ai-tab-bar">
            {TABS.map(({ key, label, icon: Icon, accentColor }) => (
              <button
                key={key}
                className={`ai-tab-btn ${tab === key ? 'active' : ''}`}
                style={tab === key ? { '--tab-accent': accentColor } : {}}
                onClick={() => switchTab(key)}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab description ── */}
          <div className="ai-tab-desc" style={{ borderLeftColor: activeTab.accentColor }}>
            {activeTab.desc}
          </div>

          <textarea
            className="ai-input-area"
            rows={5}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
          />

          {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}

          <button
            className="btn btn-primary"
            style={{ marginTop: 10, background: activeTab.accentColor, borderColor: activeTab.accentColor === 'var(--yellow)' ? 'var(--black)' : activeTab.accentColor, color: activeTab.accentColor === 'var(--yellow)' ? 'var(--black)' : 'white' }}
            onClick={handleRun}
            disabled={loading || !input.trim()}
          >
            {loading ? 'Thinking…' : btnLabel}
          </button>

          {/* ── Results ── */}
          {result?.type === 'counter' && (
            <div className="ai-result">
              <div className="ai-result-section">
                <span className="ai-result-label" style={{ color: 'var(--red)' }}>What opponents could say against your argument</span>
                <p>{result.data.counterargument}</p>
              </div>
              <div className="ai-result-section">
                <span className="ai-result-label">How to pre-empt or rebut this</span>
                <ul className="ai-tips-list">
                  {result.data.rebuttal_tips?.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
              </div>
            </div>
          )}

          {result?.type === 'eval' && (
            <div className="ai-result">
              <div className="ai-score-row">
                <div className="ai-score-badge" style={{
                  background: result.data.score >= 7 ? 'var(--blue)' : result.data.score >= 5 ? 'var(--yellow)' : 'var(--red)',
                  color: result.data.score >= 5 && result.data.score < 7 ? 'var(--black)' : 'white'
                }}>
                  {result.data.score}/10
                </div>
                <p style={{ fontSize: 13, flex: 1 }}>{result.data.summary}</p>
              </div>
              {[
                { key: 'strengths',   label: 'Strengths',   color: '#4ADE80' },
                { key: 'weaknesses',  label: 'Weaknesses',  color: 'var(--red)' },
                { key: 'suggestions', label: 'Suggestions', color: undefined },
              ].map(({ key, label, color }) => result.data[key]?.length > 0 && (
                <div key={key} className="ai-result-section">
                  <span className="ai-result-label" style={color ? { color } : undefined}>{label}</span>
                  <ul className="ai-tips-list">{result.data[key].map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              ))}
            </div>
          )}

          {result?.type === 'research' && (
            <div className="ai-result">
              {[
                { label: 'Key Arguments',  key: 'key_arguments'  },
                { label: 'Evidence Types', key: 'evidence_types'  },
                { label: 'Search Queries', key: 'search_queries'  },
                { label: 'Watch Out For', key: 'pitfalls'         },
              ].map(({ label, key }) => result.data[key]?.length > 0 && (
                <div key={key} className="ai-result-section">
                  <span className="ai-result-label">{label}</span>
                  <ul className="ai-tips-list">{result.data[key].map((item, i) => <li key={i}>{item}</li>)}</ul>
                </div>
              ))}
            </div>
          )}

          {result?.type === 'fallacy' && (
            <div className="ai-result">
              <div className="ai-result-section">
                <span className="ai-result-label">Overall</span>
                <p>{result.data.overall}</p>
              </div>
              {result.data.fallacies?.length > 0 ? (
                <div className="ai-result-section">
                  <span className="ai-result-label" style={{ color: 'var(--red)' }}>Fallacies Found</span>
                  {result.data.fallacies.map((f, i) => (
                    <div key={i} style={{ marginTop: 8, paddingLeft: 12, borderLeft: '3px solid var(--red)' }}>
                      <div style={{ fontWeight: 800, fontSize: 12, textTransform: 'uppercase', color: 'var(--yellow)', marginBottom: 3 }}>{f.name}</div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: '0 0 4px' }}>{f.explanation}</p>
                      {f.quote && <p style={{ fontSize: 12, fontStyle: 'italic', color: 'rgba(255,255,255,0.5)', margin: 0 }}>"{f.quote}"</p>}
                    </div>
                  ))}
                </div>
              ) : result.data.fallacies?.length === 0 && (
                <div className="ai-result-section">
                  <span style={{ color: '#4ADE80', fontSize: 13, fontWeight: 700 }}>✓ No fallacies detected</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar tips ── */}
        <div className="ai-page-tips">
          <h4 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, color: 'var(--text-muted)' }}>
            How to use each tool
          </h4>
          {TABS.map(({ key, label, icon: Icon, accentColor, desc }) => (
            <div
              key={key}
              className={`ai-tip-card ${tab === key ? 'active' : ''}`}
              style={{ '--tip-accent': accentColor }}
              onClick={() => switchTab(key)}
            >
              <div className="ai-tip-card-header">
                <span className="ai-tip-icon" style={{ background: accentColor, color: accentColor === 'var(--yellow)' ? 'var(--black)' : 'white' }}>
                  <Icon size={12} />
                </span>
                <strong>{label}</strong>
              </div>
              <p>{desc}</p>
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <Link to={`/sessions/${id}/notes`} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
              ← Back to Notes
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
