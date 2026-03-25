import { useState } from 'react'
import { getCounterargument, evaluateArgument } from '../../api'
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
      } else {
        const res = await evaluateArgument({ argument: input, topic })
        setResult({ type: 'eval', data: res.data })
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
        <button className={`ai-tab ${tab === 'counter' ? 'active' : ''}`} onClick={() => { setTab('counter'); setResult(null) }}>
          Counterargument
        </button>
        <button className={`ai-tab ${tab === 'eval' ? 'active' : ''}`} onClick={() => { setTab('eval'); setResult(null) }}>
          Evaluate Argument
        </button>
      </div>

      <textarea
        className="notes-textarea"
        rows={4}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={tab === 'counter'
          ? "Paste an opponent's argument to generate a counter…"
          : "Paste your argument to get a score and feedback…"}
      />

      {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}

      <button className="btn btn-primary" onClick={handleRun} disabled={loading || !input.trim()} style={{ marginTop: 8 }}>
        {loading ? 'Thinking…' : tab === 'counter' ? '✦ Generate Counterargument' : '✦ Evaluate'}
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
    </div>
  )
}
