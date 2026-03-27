import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSession, getMyNote, saveMyNote, getTeamNotes, getWebSources } from '../api'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Search, ExternalLink, Users, RefreshCw, FileText } from 'lucide-react'
import RichEditor from '../components/ui/RichEditor'
import PageHero from '../components/ui/PageHero'

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
      <PageHero title="My Notes" subtitle={session?.title ?? 'Argument notes'} color="#1040C0">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <circle cx="40" cy="44" r="60" fill="white" opacity="0.07"/>
          <circle cx="160" cy="44" r="50" fill="white" opacity="0.06"/>
          <polygon points="260,4 296,72 224,72" fill="#F0C020" opacity="0.25"/>
          <circle cx="340" cy="44" r="55" fill="white" opacity="0.07"/>
          <circle cx="340" cy="44" r="30" fill="white" opacity="0.06"/>
          <rect x="370" y="6" width="60" height="70" fill="white" opacity="0.04" transform="rotate(12 400 41)"/>
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

      <div className="notes-page-layout">
        {/* ── Notes editor ── */}
        <div className="notes-editor-panel">
          <div className="notes-editor-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color="white" />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'white' }}>
                My Argument Notes
              </h3>
            </div>
            <span className="notes-wordcount">{wordCount(noteContent)} words</span>
          </div>

          {session?.topic_text && (
            <div className="notes-topic-banner">
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Topic</span>
              <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: 14 }}>{session.topic_text}</p>
            </div>
          )}

          <div style={{ padding: '12px 16px' }}>
            <RichEditor
              value={noteContent}
              onChange={handleEditorChange}
              placeholder="Write your arguments, rebuttals, evidence, and key points here…"
            />
          </div>

          <div className="notes-editor-footer">
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
                <Search size={15} color="white" />
                <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'white' }}>
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
            <div className="sources-panel-body">
            {!session?.topic_text && (
              <p className="text-muted" style={{ fontSize: 13 }}>No topic set for this session yet.</p>
            )}
            {session?.topic_text && !sourcesLoaded && !sourcesLoading && (
              <p className="text-muted" style={{ fontSize: 13 }}>
                Click <strong>Find Sources</strong> to search for real articles related to this topic.
              </p>
            )}
            {sourcesError && (
              <div className="alert alert-error" style={{ fontSize: 13 }}>{sourcesError}</div>
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
          </div>

          {/* Team notes */}
          {teamNotes.filter((n) => n.content && n.user_name !== user?.name).length > 0 && (
            <div className="sources-panel">
              <button
                className="sources-panel-header"
                style={{ cursor: 'pointer', width: '100%', border: 'none' }}
                onClick={() => setShowTeam(!showTeam)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={15} color="white" />
                  <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'white' }}>
                    Team Notes ({teamNotes.filter((n) => n.content && n.user_name !== user?.name).length})
                  </span>
                </div>
                <span style={{ color: 'white' }}>{showTeam ? '▲' : '▼'}</span>
              </button>

              {showTeam && (
                <div className="sources-panel-body"><div className="sources-list">
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
                </div></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
