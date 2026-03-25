import { useState } from 'react'
import { getCounterargument, evaluateArgument, getResearchSuggestions, detectFallacies } from '../../api'
import { Sparkles } from 'lucide-react'

export default function AIPanel({ topic }) {
  const [tab, setTab] = useState('counter')
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRun = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      if (tab === 'counter') {
        const res = await getCounterargument({ argument: input, topic })
        setResult({ type: 'counter', data: res.data })
      } else if (tab === 'eval') {
        const res = await evaluateArgument({ argument: input, topic })
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

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <Sparkles size={16} />
        <span>AI Debate Assistant</span>
        <span className="ai-badge">Powered by Claude</span>
      </div>

      <div className="ai-tabs">
        <button className={`ai-tab ${tab === 'counter' ? 'active' : ''}`} onClick={() => { setTab('counter'); setResult(null) }}>Counterargument</button>
        <button className={`ai-tab ${tab === 'eval' ? 'active' : ''}`} onClick={() => { setTab('eval'); setResult(null) }}>Evaluate</button>
        <button className={`ai-tab ${tab === 'research' ? 'active' : ''}`} onClick={() => { setTab('research'); setResult(null) }}>Research</button>
        <button className={`ai-tab ${tab === 'fallacy' ? 'active' : ''}`} onClick={() => { setTab('fallacy'); setResult(null) }}>Fallacies</button>
      </div>

      <textarea
        className="notes-textarea"
        rows={4}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
        tab === 'counter' ? "Paste an opponent's argument to generate a counter…"
        : tab === 'research' ? "Enter the debate topic to get research guidance…"
        : tab === 'fallacy' ? "Paste an argument to detect logical fallacies…"
        : "Paste your argument to get a score and feedback…"
      }
      />

      {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}

      <button className="btn btn-primary" onClick={handleRun} disabled={loading || !input.trim()} style={{ marginTop: 8 }}>
        {loading ? 'Thinking…'
        : tab === 'counter' ? '✦ Generate Counterargument'
        : tab === 'research' ? '✦ Get Research Tips'
        : tab === 'fallacy' ? '✦ Detect Fallacies'
        : '✦ Evaluate'}
      </button>

      {result?.type === 'counter' && (
        <div className="ai-result">
          <div className="ai-result-section">
            <span className="ai-result-label">Counterargument</span>
            <p>{result.data.counterargument}</p>
          </div>
          <div className="ai-result-section">
            <span className="ai-result-label">Rebuttal Tips</span>
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
          {result.data.strengths?.length > 0 && (
            <div className="ai-result-section">
              <span className="ai-result-label" style={{ color: '#1A6030' }}>Strengths</span>
              <ul className="ai-tips-list">{result.data.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
          {result.data.weaknesses?.length > 0 && (
            <div className="ai-result-section">
              <span className="ai-result-label" style={{ color: 'var(--red)' }}>Weaknesses</span>
              <ul className="ai-tips-list">{result.data.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}
          {result.data.suggestions?.length > 0 && (
            <div className="ai-result-section">
              <span className="ai-result-label">Suggestions</span>
              <ul className="ai-tips-list">{result.data.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
        </div>
      )}
      {result?.type === 'research' && (
        <div className="ai-result">
          {[
            { label: 'Key Arguments', key: 'key_arguments' },
            { label: 'Evidence Types', key: 'evidence_types' },
            { label: 'Search Queries', key: 'search_queries' },
            { label: 'Watch Out For', key: 'pitfalls' },
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
          {result.data.fallacies?.length > 0 && (
            <div className="ai-result-section">
              <span className="ai-result-label" style={{ color: 'var(--red)' }}>Fallacies Found</span>
              {result.data.fallacies.map((f, i) => (
                <div key={i} style={{ marginTop: 8, paddingLeft: 12, borderLeft: '3px solid #D02020' }}>
                  <div style={{ fontWeight: 800, fontSize: 12, textTransform: 'uppercase', color: 'var(--yellow)', marginBottom: 3 }}>{f.name}</div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{f.explanation}</p>
                  {f.quote && <p style={{ fontSize: 12, fontStyle: 'italic', color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>"{f.quote}"</p>}
                </div>
              ))}
            </div>
          )}
          {result.data.fallacies?.length === 0 && (
            <div className="ai-result-section">
              <span style={{ color: '#4ADE80', fontSize: 13, fontWeight: 700 }}>✓ No fallacies detected</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
