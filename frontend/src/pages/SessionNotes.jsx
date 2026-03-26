import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSession, getMyNote, saveMyNote, getTeamNotes, getWebSources } from '../api'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Search, ExternalLink, Users, RefreshCw, FileText } from 'lucide-react'
import RichEditor from '../components/ui/RichEditor'

function wordCount(html) {
  if (!html) return 0
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text ? text.split(' ').length : 0
}

export default function SessionNotes() {
  const { id } = useParams()
  const { user } = useAuth()
  const [session, setSession] = useState(null)
  const [noteContent, setNoteContent] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [teamNotes, setTeamNotes] = useState([])
  const [showTeam, setShowTeam] = useState(false)
  const [sources, setSources] = useState([])
  const [sourcesLoading, setSourcesLoading] = useState(false)
  const [sourcesError, setSourcesError] = useState('')
  const [sourcesLoaded, setSourcesLoaded] = useState(false)

  useEffect(() => {
    getSession(id).then((r) => setSession(r.data)).catch(() => {})
    getMyNote(id).then((r) => setNoteContent(r.data.content || '')).catch(() => {})
    getTeamNotes(id).then((r) => setTeamNotes(r.data)).catch(() => {})
  }, [id])

  const handleSave = async () => {
    setNoteSaving(true)
    try {
      await saveMyNote(id, noteContent)
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2500)
    } catch { /* silent */ } finally {
      setNoteSaving(false)
    }
  }

  const fetchSources = async () => {
    if (!session?.topic_text) return
    setSourcesLoading(true)
    setSourcesError('')
    try {
      const res = await getWebSources(session.topic_text)
      setSources(res.data.sources || [])
      setSourcesLoaded(true)
    } catch {
      setSourcesError('Could not fetch sources. Try again.')
    } finally {
      setSourcesLoading(false)
    }
  }

  const handleEditorChange = useCallback((html) => setNoteContent(html), [])

  return (
    <div className="page-container">
      <div className="page-top-bar">
        <Link to={`/sessions/${id}`} className="btn btn-ghost" style={{ gap: 6 }}>
          <ArrowLeft size={15} /> Back to Session
        </Link>
        {session && (
          <span className="text-muted" style={{ fontSize: 13, fontWeight: 600 }}>
            {session.title}
          </span>
        )}
      </div>

      <div className="notes-page-layout">
        {/* ── Notes editor ── */}
        <div className="notes-editor-panel">
          <div className="notes-editor-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                My Argument Notes
              </h3>
            </div>
            <span className="text-muted" style={{ fontSize: 12 }}>{wordCount(noteContent)} words</span>
          </div>

          {session?.topic_text && (
            <div className="notes-topic-banner">
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6 }}>Topic</span>
              <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: 14 }}>{session.topic_text}</p>
            </div>
          )}

          <RichEditor
            value={noteContent}
            onChange={handleEditorChange}
            placeholder="Write your arguments, rebuttals, evidence, and key points here…"
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={noteSaving}>
              {noteSaving ? 'Saving…' : 'Save Notes'}
            </button>
            {noteSaved && <span style={{ fontSize: 12, fontWeight: 700, color: '#1A6030' }}>✓ Saved</span>}
            <Link to={`/sessions/${id}/ai`} className="btn btn-ghost" style={{ marginLeft: 'auto' }}>
              Open AI Assistant →
            </Link>
          </div>
        </div>

        {/* ── Right panel: Research sources + team notes ── */}
        <div className="notes-sidebar-panel">
          {/* Research sources */}
          <div className="sources-panel">
            <div className="sources-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search size={15} />
                <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Research Sources
                </span>
              </div>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 12, padding: '4px 10px' }}
                onClick={fetchSources}
                disabled={sourcesLoading || !session?.topic_text}
              >
                {sourcesLoading
                  ? <><RefreshCw size={12} className="spin" /> Searching…</>
                  : sourcesLoaded
                    ? <><RefreshCw size={12} /> Refresh</>
                    : <><Search size={12} /> Find Sources</>
                }
              </button>
            </div>

            {!session?.topic_text && (
              <p className="text-muted" style={{ fontSize: 13, padding: '12px 0' }}>No topic set for this session yet.</p>
            )}
            {session?.topic_text && !sourcesLoaded && !sourcesLoading && (
              <p className="text-muted" style={{ fontSize: 13, padding: '12px 0' }}>
                Click <strong>Find Sources</strong> to search for real articles related to this topic.
              </p>
            )}
            {sourcesError && (
              <div className="alert alert-error" style={{ fontSize: 13, marginTop: 8 }}>{sourcesError}</div>
            )}
            {sources.length > 0 && (
              <div className="sources-list">
                {sources.map((s, i) => (
                  <div key={i} className="source-card">
                    <a href={s.url} target="_blank" rel="noreferrer" className="source-title">
                      {s.title}
                      {s.url && <ExternalLink size={11} style={{ marginLeft: 4, flexShrink: 0 }} />}
                    </a>
                    {s.snippet && <p className="source-snippet">{s.snippet}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team notes */}
          {teamNotes.filter((n) => n.content && n.user_name !== user?.name).length > 0 && (
            <div className="sources-panel" style={{ marginTop: 16 }}>
              <button
                className="sources-panel-header"
                style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: 0 }}
                onClick={() => setShowTeam(!showTeam)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={15} />
                  <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Team Notes ({teamNotes.filter((n) => n.content && n.user_name !== user?.name).length})
                  </span>
                </div>
                <span>{showTeam ? '▲' : '▼'}</span>
              </button>

              {showTeam && (
                <div className="sources-list" style={{ marginTop: 12 }}>
                  {teamNotes.filter((n) => n.content && n.user_name !== user?.name).map((n, i) => (
                    <div key={i} className="source-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span className="avatar sm">{n.user_name[0]}</span>
                        <strong style={{ fontSize: 13 }}>{n.user_name}</strong>
                        <span className="text-muted" style={{ fontSize: 11 }}>
                          {new Date(n.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      {/* Render HTML from rich editor, or plain text fallback */}
                      {n.content.startsWith('<') ? (
                        <div
                          className="re-content-readonly"
                          dangerouslySetInnerHTML={{ __html: n.content }}
                        />
                      ) : (
                        <p style={{ fontSize: 13, margin: 0, whiteSpace: 'pre-wrap' }}>{n.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
