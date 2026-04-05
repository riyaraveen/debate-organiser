import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trash2, Plus, X, RefreshCw, Trophy } from 'lucide-react'
import { getTournament, updateTournament, deleteTournament, updateBracket, updateTournamentSchools, getSchools } from '../api'
import api from '../api/client'
import { useClub } from '../context/ClubContext'
import PageHero from '../components/ui/PageHero'

const STATUS_COLOR = { draft: '#b45309', active: '#1040C0', completed: '#1a7a3c' }
const STATUS_BG    = { draft: '#fef3c7', active: '#dbeafe', completed: '#dcfce7' }

// ── Bracket helpers ───────────────────────────────────────────────────────────

function advanceSingleElim(bracket, roundIdx, matchIdx, winnerId) {
  const b = JSON.parse(JSON.stringify(bracket))
  b.rounds[roundIdx].matches[matchIdx].winner = winnerId
  const nextRound = roundIdx + 1
  if (nextRound < b.rounds.length) {
    const nextMatch = Math.floor(matchIdx / 2)
    const slot = matchIdx % 2 === 0 ? 'team_a' : 'team_b'
    b.rounds[nextRound].matches[nextMatch][slot] = winnerId
  }
  return b
}

function recordRoundRobin(bracket, matchIdx, winnerId) {
  const b = JSON.parse(JSON.stringify(bracket))
  b.matches[matchIdx].winner = winnerId
  return b
}

// ── Sub-components ────────────────────────────────────────────────────────────

function schoolName(id, schools) {
  if (!id) return 'BYE'
  return schools.find(s => s.id === id)?.name ?? `School #${id}`
}

function MatchCard({ match, schools, sessions, canEdit, onPickWinner }) {
  const [linkingSession, setLinkingSession] = useState(false)
  const [pendingWinner, setPendingWinner] = useState(null)
  const linked = match.session_id ? sessions.find(s => s.id === match.session_id) : null
  const isBye = !match.team_a || !match.team_b

  const handleClick = (teamId) => {
    if (!canEdit || match.winner || isBye) return
    if (sessions.length > 0) {
      setPendingWinner(teamId)
      setLinkingSession(true)
    } else {
      onPickWinner(teamId, null)
    }
  }

  const confirmWinner = (sessionId) => {
    onPickWinner(pendingWinner, sessionId)
    setLinkingSession(false)
    setPendingWinner(null)
  }

  return (
    <div className={`bracket-match-card ${match.winner ? 'bracket-match-done' : ''}`}>
      <div
        className={`bracket-team ${match.winner === match.team_a ? 'bracket-winner' : ''} ${canEdit && !match.winner && !isBye ? 'bracket-team-clickable' : ''}`}
        onClick={() => handleClick(match.team_a)}
      >
        {schoolName(match.team_a, schools)}
        {match.winner === match.team_a && <span className="bracket-check"> ✓</span>}
      </div>
      <div className="bracket-vs-divider">vs</div>
      <div
        className={`bracket-team ${match.winner === match.team_b ? 'bracket-winner' : ''} ${canEdit && !match.winner && !isBye ? 'bracket-team-clickable' : ''}`}
        onClick={() => handleClick(match.team_b)}
      >
        {match.team_b ? schoolName(match.team_b, schools) : <span className="text-muted">BYE</span>}
        {match.winner === match.team_b && <span className="bracket-check"> ✓</span>}
      </div>
      {linked && (
        <div style={{ fontSize: 11, color: '#555', marginTop: 4, borderTop: '1px solid #eee', paddingTop: 4 }}>
          Session: {linked.topic_text || 'Untitled'}
        </div>
      )}
      {linkingSession && (
        <div style={{ marginTop: 8, borderTop: '2px solid #121212', paddingTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Link a session (optional)</div>
          <select style={{ width: '100%', marginBottom: 6 }} defaultValue="" onChange={e => confirmWinner(e.target.value ? Number(e.target.value) : null)}>
            <option value="">No session</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.topic_text || `Session #${s.id}`}</option>)}
          </select>
          <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={() => setLinkingSession(false)}>Cancel</button>
        </div>
      )}
    </div>
  )
}

function SingleEliminationBracket({ bracket, schools, sessions, canEdit, onUpdate }) {
  const handlePickWinner = (roundIdx, matchIdx, winnerId, sessionId) => {
    const updated = advanceSingleElim(bracket, roundIdx, matchIdx, winnerId)
    if (sessionId) updated.rounds[roundIdx].matches[matchIdx].session_id = sessionId
    onUpdate(updated)
  }

  return (
    <div className="bracket-se">
      {bracket.rounds?.map((round, ri) => (
        <div key={round.round} className="bracket-round">
          <div className="bracket-round-label">Round {round.round}</div>
          {round.matches?.map((m, mi) => (
            <MatchCard
              key={mi}
              match={m}
              schools={schools}
              sessions={sessions}
              canEdit={canEdit}
              onPickWinner={(wid, sid) => handlePickWinner(ri, mi, wid, sid)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function RoundRobinBracket({ bracket, schools, sessions, canEdit, onUpdate }) {
  const matches = bracket.matches || []

  const handlePickWinner = (matchIdx, winnerId, sessionId) => {
    const updated = recordRoundRobin(bracket, matchIdx, winnerId)
    if (sessionId) updated.matches[matchIdx].session_id = sessionId
    onUpdate(updated)
  }

  // Compute standings
  const stats = {}
  for (const m of matches) {
    if (!m.winner) continue
    const loser = m.winner === m.team_a ? m.team_b : m.team_a
    stats[m.winner] = stats[m.winner] || { w: 0, l: 0 }
    stats[m.winner].w++
    if (loser) {
      stats[loser] = stats[loser] || { w: 0, l: 0 }
      stats[loser].l++
    }
  }
  const schoolIds = [...new Set(matches.flatMap(m => [m.team_a, m.team_b]).filter(Boolean))]
  const rows = schoolIds
    .map(id => ({ id, name: schoolName(id, schools), ...(stats[id] || { w: 0, l: 0 }) }))
    .sort((a, b) => b.w - a.w || a.l - b.l)

  return (
    <div>
      <h4 style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.06em', marginBottom: 12 }}>Standings</h4>
      <table className="data-table" style={{ marginBottom: 24 }}>
        <thead><tr><th>#</th><th>School</th><th>W</th><th>L</th><th>Played</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id}>
              <td style={{ color: '#888', width: 32 }}>{i + 1}</td>
              <td style={{ fontWeight: 700 }}>{r.name}</td>
              <td><span className="badge badge-green">{r.w}</span></td>
              <td>{r.l > 0 ? <span className="badge badge-red">{r.l}</span> : <span className="text-muted">0</span>}</td>
              <td style={{ color: '#888' }}>{r.w + r.l}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.06em', marginBottom: 12 }}>Matches</h4>
      <div className="bracket-rr">
        {matches.map((m, mi) => (
          <MatchCard
            key={mi}
            match={m}
            schools={schools}
            sessions={sessions}
            canEdit={canEdit}
            onPickWinner={(wid, sid) => handlePickWinner(mi, wid, sid)}
          />
        ))}
      </div>
    </div>
  )
}

// ── SeedingEditor ─────────────────────────────────────────────────────────────

function SeedingEditor({ selectedIds, schools, onChange }) {
  const move = (idx, dir) => {
    const next = [...selectedIds]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    onChange(next)
  }

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
        Seed Order (drag to reorder)
      </div>
      {selectedIds.map((id, i) => {
        const s = schools.find(sc => sc.id === id)
        return (
          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, background: '#f5f5f5', border: '2px solid #121212', padding: '4px 10px', borderRadius: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 12, color: '#888', width: 20 }}>#{i + 1}</span>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{s?.name}</span>
            <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} style={{ padding: 2 }}>▲</button>
            <button type="button" className="icon-btn" onClick={() => move(i, 1)} disabled={i === selectedIds.length - 1} style={{ padding: 2 }}>▼</button>
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const STATUS_NEXT = { draft: 'active', active: 'completed', completed: 'draft' }
const STATUS_LABEL = { draft: 'Start Tournament', active: 'Mark Complete', completed: 'Reopen' }

export default function TournamentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { activeClub } = useClub()
  const isAdmin = activeClub?.role === 'admin' || activeClub?.role === 'owner'

  const [tournament, setTournament] = useState(null)
  const [bracket, setBracket] = useState(null)
  const [schools, setSchools] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // School management state
  const [selectedSchoolIds, setSelectedSchoolIds] = useState([])
  const [showSchoolEditor, setShowSchoolEditor] = useState(false)
  const [showSeeding, setShowSeeding] = useState(false)

  const load = useCallback(async () => {
    try {
      const [tRes, sRes, sessRes] = await Promise.all([
        getTournament(id),
        getSchools(),
        api.get('/api/sessions/'),
      ])
      setTournament(tRes.data)
      setBracket(tRes.data.bracket ? JSON.parse(tRes.data.bracket) : null)
      setSelectedSchoolIds(tRes.data.school_ids ? JSON.parse(tRes.data.school_ids) : [])
      setSchools(sRes.data)
      setSessions(sessRes.data)
    } catch {
      setError('Failed to load tournament')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const saveBracket = async (newBracket) => {
    setBracket(newBracket)
    setSaving(true)
    try {
      await updateBracket(id, newBracket)
    } catch {
      setError('Failed to save bracket')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async () => {
    const next = STATUS_NEXT[tournament.status]
    try {
      const res = await updateTournament(id, { status: next })
      setTournament(res.data)
    } catch {
      setError('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${tournament.name}"? This cannot be undone.`)) return
    await deleteTournament(id)
    navigate('/tournaments')
  }

  const handleUpdateSchools = async (regenerate) => {
    setSaving(true)
    try {
      const res = await updateTournamentSchools(id, { school_ids: selectedSchoolIds, regenerate_bracket: regenerate })
      setTournament(res.data)
      setBracket(res.data.bracket ? JSON.parse(res.data.bracket) : null)
      setShowSchoolEditor(false)
      setShowSeeding(false)
    } catch {
      setError('Failed to update schools')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">Loading…</div>
  if (!tournament) return <div className="page-container"><p className="text-muted">Tournament not found.</p></div>

  const tournamentSchools = selectedSchoolIds.map(sid => schools.find(s => s.id === sid)).filter(Boolean)
  const availableToAdd = schools.filter(s => !selectedSchoolIds.includes(s.id))

  const statusColor = STATUS_COLOR[tournament.status] || '#555'
  const statusBg    = STATUS_BG[tournament.status]    || '#f5f5f5'

  return (
    <div className="page-container">
      {/* Hero banner */}
      <PageHero
        title={tournament.name}
        subtitle={tournament.description || (tournament.format === 'round_robin' ? 'Round Robin' : 'Single Elimination') + ' · ' + selectedSchoolIds.length + ' schools'}
        color="#b45309"
      >
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <polygon points="300,4 340,72 260,72" fill="#F0C020" opacity="0.55"/>
          <polygon points="340,16 368,68 312,68" fill="#fff" opacity="0.15"/>
          <circle cx="80" cy="44" r="60" fill="#F0C020" opacity="0.12"/>
          <circle cx="370" cy="88" r="50" fill="#fff" opacity="0.08"/>
        </svg>
      </PageHero>

      {/* Action bar */}
      <div className="page-top-bar" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/tournaments" className="btn btn-ghost" style={{ padding: '5px 10px' }}>
            <ArrowLeft size={15} />
          </Link>
          <span style={{ fontSize: 13, fontWeight: 700, color: statusColor, background: statusBg, border: `1.5px solid ${statusColor}`, borderRadius: 4, padding: '2px 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {tournament.status}
          </span>
          {tournament.scheduled_at && (
            <span style={{ fontSize: 13, color: '#777' }}>
              {new Date(tournament.scheduled_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {saving && <span style={{ fontSize: 12, color: '#888' }}>Saving…</span>}
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ background: '#b45309', borderColor: '#b45309', display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleStatusChange}>
              <Trophy size={14} /> {STATUS_LABEL[tournament.status]}
            </button>
            <button className="btn btn-ghost" style={{ padding: '6px 10px', color: '#c00' }} onClick={handleDelete}>
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Schools section */}
      <div style={{ marginBottom: 28, background: '#fffbf0', border: '2px solid #f0c020', borderRadius: 6, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <h3 style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.06em', margin: 0, color: '#92400e' }}>🏫 Schools</h3>
          {isAdmin && (
            <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => setShowSchoolEditor(!showSchoolEditor)}>
              {showSchoolEditor ? 'Cancel' : 'Edit'}
            </button>
          )}
        </div>

        {!showSchoolEditor ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tournamentSchools.length === 0
              ? <span className="text-muted" style={{ fontSize: 13 }}>No schools added.</span>
              : tournamentSchools.map(s => <span key={s.id} className="badge badge-purple">{s.name}</span>)
            }
          </div>
        ) : (
          <div style={{ border: '2px solid #121212', padding: 16, borderRadius: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Selected</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {selectedSchoolIds.map(sid => {
                const s = schools.find(sc => sc.id === sid)
                return s ? (
                  <button key={sid} type="button" className="badge badge-purple"
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => setSelectedSchoolIds(prev => prev.filter(x => x !== sid))}>
                    {s.name} <X size={10} />
                  </button>
                ) : null
              })}
            </div>

            {availableToAdd.length > 0 && (
              <>
                <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Add</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {availableToAdd.map(s => (
                    <button key={s.id} type="button" className="topic-chip"
                      onClick={() => setSelectedSchoolIds(prev => [...prev, s.id])}>
                      <Plus size={10} /> {s.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => handleUpdateSchools(false)}>
                Save (keep bracket)
              </button>
              <button className="btn btn-primary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                onClick={() => { setShowSeeding(true); setShowSchoolEditor(false) }}>
                <RefreshCw size={13} /> Set seeding & regenerate
              </button>
            </div>
          </div>
        )}

        {showSeeding && (
          <div style={{ border: '2px solid #121212', padding: 16, borderRadius: 4, marginTop: 12 }}>
            <SeedingEditor
              selectedIds={selectedSchoolIds}
              schools={schools}
              onChange={setSelectedSchoolIds}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => handleUpdateSchools(true)}>
                Regenerate Bracket
              </button>
              <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowSeeding(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Bracket */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '3px solid #f0c020', paddingBottom: 10 }}>
          <Trophy size={16} style={{ color: '#b45309' }} />
          <h3 style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 13, letterSpacing: '0.06em', margin: 0, color: '#92400e' }}>Bracket</h3>
          {isAdmin && tournament.status !== 'completed' && (
            <span style={{ fontWeight: 400, fontSize: 11, color: '#888' }}>— click a school to record the winner</span>
          )}
        </div>

        {!bracket ? (
          <p className="text-muted">No bracket generated yet.</p>
        ) : bracket.format === 'round_robin' ? (
          <RoundRobinBracket
            bracket={bracket}
            schools={schools}
            sessions={sessions}
            canEdit={isAdmin && tournament.status !== 'completed'}
            onUpdate={saveBracket}
          />
        ) : (
          <SingleEliminationBracket
            bracket={bracket}
            schools={schools}
            sessions={sessions}
            canEdit={isAdmin && tournament.status !== 'completed'}
            onUpdate={saveBracket}
          />
        )}
      </div>
    </div>
  )
}
