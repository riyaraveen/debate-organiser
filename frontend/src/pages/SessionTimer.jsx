import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSession, getFormat } from '../api'
import { ArrowLeft, Play, Square, SkipForward, SkipBack, RotateCcw, Clock, Timer } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

function PrepTimer({ playBeep }) {
  const [prepMinutes, setPrepMinutes] = useState(15)
  const [side, setSide] = useState('Proposition')
  const [prepRunning, setPrepRunning] = useState(false)
  const [prepRemaining, setPrepRemaining] = useState(15 * 60 * 1000)
  const [prepDone, setPrepDone] = useState(false)
  const prepIntervalRef = useRef(null)
  const prepStartRef = useRef(null)
  const prepPauseRef = useRef(0)
  const prepWarned30Ref = useRef(false)

  const totalMs = prepMinutes * 60 * 1000

  const startPrep = () => {
    if (prepRunning) return
    prepStartRef.current = Date.now() - prepPauseRef.current
    prepWarned30Ref.current = false
    prepIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - prepStartRef.current
      const remaining = totalMs - elapsed
      if (remaining <= 0) {
        clearInterval(prepIntervalRef.current)
        setPrepRemaining(0)
        setPrepRunning(false)
        setPrepDone(true)
        playBeep(440, 400, 3)
      } else {
        setPrepRemaining(remaining)
        if (remaining <= 30000 && remaining > 29800 && !prepWarned30Ref.current) {
          prepWarned30Ref.current = true
          playBeep(660, 200, 2)
        }
      }
    }, 100)
    setPrepRunning(true)
    setPrepDone(false)
  }

  const stopPrep = () => {
    clearInterval(prepIntervalRef.current)
    prepPauseRef.current = totalMs - prepRemaining
    setPrepRunning(false)
  }

  const resetPrep = () => {
    clearInterval(prepIntervalRef.current)
    setPrepRunning(false)
    setPrepRemaining(totalMs)
    prepPauseRef.current = 0
    setPrepDone(false)
  }

  // Reset remaining when duration changes (only when stopped)
  useEffect(() => {
    if (!prepRunning) {
      setPrepRemaining(prepMinutes * 60 * 1000)
      setPrepDone(false)
      prepPauseRef.current = 0
    }
  }, [prepMinutes]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearInterval(prepIntervalRef.current), [])

  const pct = Math.max(0, (prepRemaining / totalMs) * 100)
  const overtime = prepRemaining <= 0

  return (
    <div style={{ border: '3px solid #121212', padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Clock size={16} />
        <strong style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prep Time</strong>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Duration (min)</span>
          <input type="number" min={1} max={60} value={prepMinutes} disabled={prepRunning}
            onChange={e => setPrepMinutes(Math.max(1, +e.target.value))}
            style={{ width: 70, border: '2px solid #121212', padding: '5px 8px', font: 'inherit', fontSize: 14, fontWeight: 700 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Team</span>
          <select value={side} onChange={e => setSide(e.target.value)} disabled={prepRunning}
            style={{ border: '2px solid #121212', padding: '5px 10px', font: 'inherit', fontSize: 13, fontWeight: 700 }}>
            <option>Proposition</option>
            <option>Opposition</option>
            <option>Both Teams</option>
          </select>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 4 }}>
          {side} · Remaining
        </div>
        <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: 2, fontVariantNumeric: 'tabular-nums', color: prepDone ? 'var(--red)' : '#121212' }}>
          {prepDone ? '00:00' : formatTime(prepRemaining)}
        </div>
        <div style={{ height: 8, background: '#e5e5e5', border: '2px solid #121212', margin: '10px 0' }}>
          <div style={{ height: '100%', background: pct < 20 ? 'var(--red)' : '#1A8040', width: `${pct}%`, transition: 'width 0.1s linear' }} />
        </div>
        {prepDone && <div style={{ color: 'var(--red)', fontWeight: 700, marginBottom: 8 }}>⏰ Prep time over!</div>}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {!prepRunning
          ? <button className="btn btn-primary" onClick={startPrep}><Play size={15} /> Start</button>
          : <button className="btn btn-ghost" onClick={stopPrep}><Square size={15} /> Pause</button>
        }
        <button className="btn btn-ghost" onClick={resetPrep}>Reset</button>
      </div>
    </div>
  )
}

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

const SIDE_COLORS = {
  proposition:  { bg: '#1040C0', light: '#dce8ff', text: '#fff', label: 'Proposition' },
  government:   { bg: '#1040C0', light: '#dce8ff', text: '#fff', label: 'Government'  },
  affirmative:  { bg: '#1040C0', light: '#dce8ff', text: '#fff', label: 'Affirmative' },
  opposition:   { bg: '#C01820', light: '#ffe0e0', text: '#fff', label: 'Opposition'  },
  negative:     { bg: '#C01820', light: '#ffe0e0', text: '#fff', label: 'Negative'    },
  neutral:      { bg: '#333',    light: '#f0f0f0', text: '#fff', label: 'Neutral'     },
}

function getSlotColor(roleName, formatRoles) {
  const role = (formatRoles ?? []).find(r => r.name === roleName)
  return SIDE_COLORS[role?.side] ?? { bg: '#555', light: '#f5f5f5', text: '#fff', label: '' }
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
  const [countDown, setCountDown] = useState(false) // toggle elapsed vs countdown display

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

  const prevSpeaker = () => {
    if (currentIdx === 0) return
    clearInterval(intervalRef.current)
    setRunning(false)
    setElapsed(0)
    elapsedAtPauseRef.current = 0
    setLog(l => l.slice(0, -1))
    setCurrentIdx(i => i - 1)
  }

  const restartDebate = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setElapsed(0)
    elapsedAtPauseRef.current = 0
    setCurrentIdx(0)
    setLog([])
  }

  const done = speakingOrder.length > 0 && currentIdx >= speakingOrder.length

  if (loading) return <div className="loading">Loading…</div>
  if (!session || !format) return <div className="empty-state">Session not found.</div>

  const formatRoles = format.roles ?? []
  const currentColor = current ? getSlotColor(current.role, formatRoles) : null
  const completedCount = currentIdx
  const totalCount = speakingOrder.length

  return (
    <div className="page-container">

      <PageHero title="Debate Timer" subtitle={`${session.title} · ${format.name}`} color="#1A8040">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <circle cx="60" cy="44" r="40" fill="white" opacity="0.08"/>
          <circle cx="60" cy="44" r="22" fill="white" opacity="0.08"/>
          <line x1="60" y1="44" x2="60" y2="16" stroke="white" strokeWidth="4" opacity="0.5" strokeLinecap="round"/>
          <line x1="60" y1="44" x2="76" y2="44" stroke="white" strokeWidth="3" opacity="0.4" strokeLinecap="round"/>
          <circle cx="60" cy="44" r="4" fill="white" opacity="0.7"/>
          <circle cx="200" cy="44" r="38" fill="white" opacity="0.06"/>
          <circle cx="200" cy="44" r="22" fill="white" opacity="0.06"/>
          <line x1="200" y1="44" x2="200" y2="20" stroke="white" strokeWidth="3" opacity="0.4" strokeLinecap="round"/>
          <line x1="200" y1="44" x2="218" y2="52" stroke="white" strokeWidth="2" opacity="0.3" strokeLinecap="round"/>
          <circle cx="200" cy="44" r="3" fill="white" opacity="0.6"/>
          <rect x="310" y="20" width="60" height="48" rx="2" fill="white" opacity="0.07"/>
          <rect x="320" y="32" width="12" height="16" fill="white" opacity="0.15"/>
          <rect x="338" y="32" width="12" height="16" fill="white" opacity="0.15"/>
          <rect x="356" y="32" width="6" height="16" fill="#F0C020" opacity="0.5"/>
          <polygon points="130,70 142,46 154,70" fill="white" opacity="0.10"/>
          <polygon points="260,70 272,46 284,70" fill="#F0C020" opacity="0.18"/>
        </svg>
      </PageHero>

      {/* top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <button className="back-btn" onClick={() => navigate(`/sessions/${id}`)}>
          <ArrowLeft size={15} /> Back to Session
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
            {completedCount} of {totalCount} speeches done
          </span>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => setCountDown(c => !c)} title="Toggle elapsed / countdown">
            <Timer size={13}/> {countDown ? 'Countdown' : 'Elapsed'}
          </button>
          {(currentIdx > 0 || log.length > 0) && (
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={restartDebate} title="Restart from the beginning">
              <RotateCcw size={13}/> Restart
            </button>
          )}
        </div>
      </div>

      {/* progress strip */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {speakingOrder.map((slot, i) => {
          const sc = getSlotColor(slot.role, formatRoles)
          return (
            <div key={i} title={slot.role} style={{
              flex: 1, height: 6, border: '1.5px solid #121212',
              background: i < completedCount ? sc.bg : i === completedCount ? '#F0C020' : '#e5e5e5',
              transition: 'background 0.3s',
            }} />
          )
        })}
      </div>

      {/* two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT: Speaking order ── */}
        <div style={{ border: '3px solid #121212', position: 'sticky', top: 20 }}>
          <div style={{ background: '#121212', color: '#fff', padding: '10px 14px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Speaking Order
          </div>
          {speakingOrder.map((slot, i) => {
            const isLogged = i < currentIdx
            const isCurrent = i === currentIdx
            const sc = getSlotColor(slot.role, formatRoles)
            return (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 12px',
                borderBottom: i < speakingOrder.length - 1 ? '1px solid #e5e5e5' : 'none',
                borderLeft: `4px solid ${isLogged ? '#ccc' : sc.bg}`,
                background: isCurrent ? sc.light : 'transparent',
                opacity: isLogged ? 0.5 : 1,
                transition: 'background 0.3s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{
                    width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, flexShrink: 0,
                    background: isLogged ? '#d4edda' : isCurrent ? sc.bg : sc.light,
                    color: isCurrent && !isLogged ? sc.text : '#121212',
                    border: `2px solid ${isLogged ? '#aaa' : sc.bg}`,
                  }}>
                    {isLogged ? '✓' : i + 1}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slot.role}</div>
                    {slot.description && <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slot.description}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ background: sc.bg, color: sc.text, padding: '1px 6px', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {sc.label.slice(0, 4)}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, minWidth: 28, textAlign: 'right' }}>{formatDuration(slot.duration_seconds)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── RIGHT: Timer + controls ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Active timer */}
          {!done && current && (
            <div style={{ border: '3px solid #121212', overflow: 'hidden' }}>
              <div style={{ background: currentColor.bg, color: currentColor.text, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.8, marginBottom: 2 }}>Now Speaking</div>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{current.role}</div>
                  {current.description && <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{current.description}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 700, textTransform: 'uppercase' }}>Allotted</div>
                  <div style={{ fontSize: 28, fontWeight: 900 }}>{formatDuration(current.duration_seconds)}</div>
                </div>
              </div>

              <div style={{ padding: '32px 28px 28px', textAlign: 'center', background: currentColor.light }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: 4 }}>
                  {countDown && allottedMs > 0 ? 'Time Remaining' : 'Elapsed'}
                </div>
                <div style={{
                  fontSize: 96, fontWeight: 900, letterSpacing: 4, fontVariantNumeric: 'tabular-nums',
                  color: overtime ? '#C01820' : '#121212', lineHeight: 1, marginBottom: 4,
                  textShadow: overtime ? '0 0 30px rgba(192,24,32,0.15)' : 'none',
                }}>
                  {countDown && allottedMs > 0
                    ? formatTime(Math.max(0, allottedMs - elapsed))
                    : formatTime(elapsed)}
                </div>

                {allottedMs > 0 && (
                  <div style={{ margin: '20px 0 8px' }}>
                    <div style={{ height: 14, background: 'rgba(0,0,0,0.08)', border: '2px solid #121212' }}>
                      <div style={{
                        height: '100%',
                        background: overtime ? '#C01820' : elapsed / allottedMs > 0.75 ? '#E08020' : currentColor.bg,
                        width: `${Math.min((elapsed / allottedMs) * 100, 100)}%`,
                        transition: 'width 0.1s linear',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginTop: 4, fontWeight: 600 }}>
                      <span>0:00</span><span>{formatDuration(current.duration_seconds)}</span>
                    </div>
                  </div>
                )}

                {overtime && (
                  <div style={{ display: 'inline-block', background: '#C01820', color: '#fff', padding: '4px 16px', fontWeight: 800, fontSize: 13, marginBottom: 20, border: '2px solid #121212' }}>
                    ⚠ OVER TIME
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
                  {currentIdx > 0 && (
                    <button className="btn btn-ghost" onClick={prevSpeaker} style={{ fontSize: 14, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6 }} title="Go back to previous speaker">
                      <SkipBack size={15} /> Prev
                    </button>
                  )}
                  {!running ? (
                    <button style={{ background: currentColor.bg, color: currentColor.text, border: '3px solid #121212', padding: '12px 28px', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={start}>
                      <Play size={17} /> Start
                    </button>
                  ) : (
                    <button className="btn btn-ghost" onClick={stop} style={{ fontSize: 15, padding: '12px 22px' }}><Square size={17} /> Pause</button>
                  )}
                  <button className="btn btn-ghost" onClick={reset} style={{ fontSize: 15, padding: '12px 22px' }}>Reset</button>
                  <button style={{ background: '#F0C020', color: '#121212', border: '3px solid #121212', padding: '12px 22px', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={next}>
                    <SkipForward size={17} /> {currentIdx < speakingOrder.length - 1 ? 'Next Speaker' : 'Finish'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {done && (
            <div style={{ border: '3px solid #1A8040', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #1A8040, #22a85a)', padding: '40px 28px', textAlign: 'center', color: '#fff' }}>
                <div style={{ fontSize: 52, marginBottom: 10 }}>🏆</div>
                <div style={{ fontSize: 26, fontWeight: 900 }}>Debate Complete!</div>
                <p style={{ margin: '8px 0 0', opacity: 0.85, fontSize: 14 }}>All {totalCount} speeches done. See the time log below.</p>
              </div>
            </div>
          )}

          {/* Prep timer */}
          <PrepTimer playBeep={playBeep} />

          {/* Time log */}
          {log.length > 0 && (
            <div style={{ border: '3px solid #121212' }}>
              <div style={{ background: '#121212', color: '#fff', padding: '10px 14px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Time Log
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px 14px', textAlign: 'left', borderBottom: '2px solid #e5e5e5' }}>Speaker</th>
                    <th style={{ padding: '8px 14px', textAlign: 'right', borderBottom: '2px solid #e5e5e5' }}>Allotted</th>
                    <th style={{ padding: '8px 14px', textAlign: 'right', borderBottom: '2px solid #e5e5e5' }}>Actual</th>
                    <th style={{ padding: '8px 14px', textAlign: 'right', borderBottom: '2px solid #e5e5e5' }}>Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((entry, i) => {
                    const diff = entry.actual - entry.allotted
                    const lc = getSlotColor(entry.role, formatRoles)
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #e5e5e5', borderLeft: `4px solid ${lc.bg}` }}>
                        <td style={{ padding: '8px 14px' }}>
                          <strong>{entry.role}</strong>
                          {entry.description && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{entry.description}</span>}
                        </td>
                        <td style={{ padding: '8px 14px', textAlign: 'right' }}>{formatDuration(entry.allotted)}</td>
                        <td style={{ padding: '8px 14px', textAlign: 'right' }}>{formatDuration(entry.actual)}</td>
                        <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: diff > 0 ? '#C01820' : '#1A8040' }}>
                          {diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${formatDuration(Math.abs(diff))} ${diff > 0 ? 'over' : 'under'}`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
