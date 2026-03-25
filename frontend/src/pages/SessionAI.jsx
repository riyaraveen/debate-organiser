import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSession, getCounterargument, evaluateArgument, getResearchSuggestions, detectFallacies } from '../api'
import { ArrowLeft, Sparkles } from 'lucide-react'

const TABS = [
  { key: 'counter', label: 'Counterarguments' },
  { key: 'eval',    label: 'Evaluate'          },
  { key: 'research',label: 'Research Tips'     },
  { key: 'fallacy', label: 'Fallacies'         },
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
      <div className="page-top-bar">
        <Link to={`/sessions/${id}`} className="btn btn-ghost" style={{ gap: 6 }}>
          <ArrowLeft size={15} /> Back to Session
        </Link>
        {session && (
          <span className="text-muted" style={{ fontSize: 13, fontWeight: 600 }}>{session.title}</span>
        )}
      </div>

      <div className="ai-page-layout">
        <div className="ai-page-panel">
          <div className="ai-panel-header" style={{ marginBottom: 20 }}>
            <Sparkles size={16} />
            <span>AI Debate Assistant</span>
            <span className="ai-badge">Powered by Claude</span>
          </div>

          {session?.topic_text && (
            <div className="notes-topic-banner" style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6 }}>Session Topic</span>
              <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: 14 }}>{session.topic_text}</p>
            </div>
          )}

          <div className="ai-tabs" style={{ marginBottom: 16 }}>
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                className={`ai-tab ${tab === key ? 'active' : ''}`}
                onClick={() => switchTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab description */}
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>
            {tab === 'counter'  && 'Enter your own argument — see the strongest counterarguments an opponent could make, so you can prepare your defence.'}
            {tab === 'eval'     && 'Get your argument scored 1–10 by an AI debate judge with specific strengths, weaknesses, and improvement tips.'}
            {tab === 'research' && 'Enter a topic to get structured research guidance: key argument frameworks, evidence types, and what to avoid.'}
            {tab === 'fallacy'  && 'Paste any argument to identify logical fallacies with name, explanation, and the exact offending quote.'}
          </p>

          <textarea
            className="notes-textarea"
            rows={5}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
          />

          {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}

          <button
            className="btn btn-primary"
            style={{ marginTop: 10 }}
            onClick={handleRun}
            disabled={loading || !input.trim()}
          >
            {loading ? 'Thinking…' : btnLabel}
          </button>

          {/* ── Results ── */}
          {result?.type === 'counter' && (
            <div className="ai-result" style={{ marginTop: 20 }}>
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
            <div className="ai-result" style={{ marginTop: 20 }}>
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
                { key: 'strengths',   label: 'Strengths',   color: '#1A6030' },
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
            <div className="ai-result" style={{ marginTop: 20 }}>
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
            <div className="ai-result" style={{ marginTop: 20 }}>
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

        {/* Sidebar tips */}
        <div className="ai-page-tips">
          <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            How to use each tool
          </h4>
          <div className="ai-tip-card">
            <strong>Counterarguments</strong>
            <p>Enter an argument you plan to make. The AI reveals what opponents could say — letting you strengthen your position before the debate.</p>
          </div>
          <div className="ai-tip-card">
            <strong>Evaluate</strong>
            <p>Get a 1–10 score on your argument's logic, evidence, and persuasiveness — with specific improvement tips.</p>
          </div>
          <div className="ai-tip-card">
            <strong>Research Tips</strong>
            <p>Enter your topic to get argument frameworks, evidence types, and pitfalls to avoid when researching.</p>
          </div>
          <div className="ai-tip-card">
            <strong>Fallacies</strong>
            <p>Paste an argument to catch logical fallacies before you or your opponent uses them in the debate.</p>
          </div>
          <div style={{ marginTop: 16 }}>
            <Link to={`/sessions/${id}/notes`} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
              ← Back to Notes
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
