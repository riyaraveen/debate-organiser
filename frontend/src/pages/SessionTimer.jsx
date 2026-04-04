import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSession, getFormat } from '../api'
import { ArrowLeft, Play, Square, SkipForward, Timer } from 'lucide-react'

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m${s > 0 ? ` ${s}s` : ''}` : `${s}s`
}

export default function SessionTimer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [format, setFormat] = useState(null)
  const [loading, setLoading] = useState(true)

  const [currentIdx, setCurrentIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)        // ms for current slot
  const [log, setLog] = useState([])               // { role, description, allotted, actual }

  const intervalRef = useRef(null)
  const startTimeRef = useRef(null)
  const elapsedAtPauseRef = useRef(0)
  const warned30Ref = useRef(false)

  const playBeep = (frequency = 520, duration = 300, count = 1) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      for (let i = 0; i < count; i++) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = frequency
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.4)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.4 + duration / 1000)
        osc.start(ctx.currentTime + i * 0.4)
        osc.stop(ctx.currentTime + i * 0.4 + duration / 1000)
      }
    } catch {}
  }

  useEffect(() => {
    getSession(id)
      .then(r => {
        setSession(r.data)
        return getFormat(r.data.format_id)
      })
      .then(r => setFormat(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    return () => clearInterval(intervalRef.current)
  }, [])

  const speakingOrder = format?.speaking_order ?? []
  const current = speakingOrder[currentIdx]
  const allottedMs = (current?.duration_seconds ?? 0) * 1000
  const overtime = elapsed > allottedMs && allottedMs > 0

  const start = () => {
    if (running) return
    startTimeRef.current = Date.now() - elapsedAtPauseRef.current
    warned30Ref.current = false
    intervalRef.current = setInterval(() => {
      const now = Date.now() - startTimeRef.current
      setElapsed(now)
      // 30-second warning: 2 short beeps
      if (allottedMs > 0) {
        const remaining = allottedMs - now
        if (remaining <= 30000 && remaining > 29800 && !warned30Ref.current) {
          warned30Ref.current = true
          playBeep(660, 200, 2)
        }
        // Time's up: 3 beeps
        if (remaining <= 0 && remaining > -200 && warned30Ref.current) {
          playBeep(440, 400, 3)
          warned30Ref.current = false // prevent repeat
        }
      }
    }, 100)
    setRunning(true)
  }

  const stop = () => {
    clearInterval(intervalRef.current)
    elapsedAtPauseRef.current = elapsed
    setRunning(false)
  }

  const next = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    // Log completed slot
    setLog(l => [...l, {
      role: current.role,
      description: current.description,
      allotted: current.duration_seconds,
      actual: Math.round(elapsed / 1000),
    }])
    // Advance
    elapsedAtPauseRef.current = 0
    setElapsed(0)
    setCurrentIdx(i => i + 1)
  }

  const reset = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setElapsed(0)
    elapsedAtPauseRef.current = 0
  }

  const done = speakingOrder.length > 0 && currentIdx >= speakingOrder.length

  if (loading) return <div className="loading">Loading…</div>
  if (!session || !format) return <div className="empty-state">Session not found.</div>

  return (
    <div className="page-container" style={{ maxWidth: 700, margin: '0 auto' }}>
      <button className="back-btn" onClick={() => navigate(`/sessions/${id}`)}><ArrowLeft size={15} /> Back</button>

      <h2 style={{ marginBottom: 4 }}><Timer size={18} /> Debate Timer</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>{session.title} · {format.name}</p>

      {/* Speaking order overview */}
      <div style={{ border: '3px solid #121212', marginBottom: 24 }}>
        <div style={{ background: '#121212', color: '#fff', padding: '8px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
          Speaking Order
        </div>
        {speakingOrder.map((slot, i) => {
          const isLogged = i < currentIdx
          const isCurrent = i === currentIdx
          return (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 16px', borderBottom: i < speakingOrder.length - 1 ? '1px solid #e5e5e5' : 'none',
              background: isCurrent ? '#fffbe6' : 'transparent',
              opacity: isLogged ? 0.5 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 22, height: 22, border: '2px solid #121212', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 11, fontWeight: 700,
                  background: isCurrent ? '#F0C020' : isLogged ? '#d4edda' : '#fff' }}>
                  {isLogged ? '✓' : i + 1}
                </span>
                <div>
                  <strong style={{ fontSize: 14 }}>{slot.role}</strong>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{slot.description}</span>
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{formatDuration(slot.duration_seconds)}</span>
            </div>
          )
        })}
      </div>

      {/* Active timer */}
      {!done && current && (
        <div style={{ border: '3px solid #121212', padding: 24, marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Now Speaking
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{current.role}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            {current.description} · Allotted: {formatDuration(current.duration_seconds)}
          </div>

          <div style={{
            fontSize: 64, fontWeight: 900, letterSpacing: 2, fontVariantNumeric: 'tabular-nums',
            color: overtime ? 'var(--red)' : '#121212', marginBottom: 8,
          }}>
            {formatTime(elapsed)}
          </div>
          {allottedMs > 0 && (
            <div style={{ height: 8, background: '#e5e5e5', border: '2px solid #121212', marginBottom: 20, position: 'relative' }}>
              <div style={{
                height: '100%', background: overtime ? 'var(--red)' : '#1A8040',
                width: `${Math.min((elapsed / allottedMs) * 100, 100)}%`,
                transition: 'width 0.1s linear',
              }} />
            </div>
          )}
          {overtime && <div style={{ color: 'var(--red)', fontWeight: 700, marginBottom: 12 }}>⚠ Over time!</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {!running ? (
              <button className="btn btn-primary" onClick={start}><Play size={16} /> Start</button>
            ) : (
              <button className="btn btn-ghost" onClick={stop}><Square size={16} /> Stop</button>
            )}
            <button className="btn btn-ghost" onClick={reset}>Reset</button>
            <button className="btn btn-yellow" onClick={next}>
              <SkipForward size={16} /> {currentIdx < speakingOrder.length - 1 ? 'Next Speaker' : 'Finish'}
            </button>
          </div>
        </div>
      )}

      {done && (
        <div style={{ border: '3px solid #1A8040', padding: 20, marginBottom: 24, background: '#d4edda', textAlign: 'center' }}>
          <strong style={{ fontSize: 18 }}>Debate complete!</strong>
        </div>
      )}

      {/* Time log */}
      {log.length > 0 && (
        <div style={{ border: '3px solid #121212' }}>
          <div style={{ background: '#121212', color: '#fff', padding: '8px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            Time Log
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '8px 16px', textAlign: 'left', borderBottom: '2px solid #e5e5e5' }}>Speaker</th>
                <th style={{ padding: '8px 16px', textAlign: 'right', borderBottom: '2px solid #e5e5e5' }}>Allotted</th>
                <th style={{ padding: '8px 16px', textAlign: 'right', borderBottom: '2px solid #e5e5e5' }}>Actual</th>
                <th style={{ padding: '8px 16px', textAlign: 'right', borderBottom: '2px solid #e5e5e5' }}>Diff</th>
              </tr>
            </thead>
            <tbody>
              {log.map((entry, i) => {
                const diff = entry.actual - entry.allotted
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e5e5' }}>
                    <td style={{ padding: '8px 16px' }}>
                      <strong>{entry.role}</strong>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{entry.description}</span>
                    </td>
                    <td style={{ padding: '8px 16px', textAlign: 'right' }}>{formatDuration(entry.allotted)}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right' }}>{formatDuration(entry.actual)}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', color: diff > 0 ? 'var(--red)' : '#1A8040', fontWeight: 700 }}>
                      {diff > 0 ? '+' : ''}{formatDuration(Math.abs(diff))}{diff > 0 ? ' over' : ' under'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
