import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getSession, getMyNote, saveMyNote, getNoteVersions, getTeamNotes, getWebSources } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ArrowLeft, Search, ExternalLink, Users, RefreshCw, FileText, ChevronRight, Lock, Eye, History } from 'lucide-react'
import RichEditor from '../components/ui/RichEditor'
import PageHero from '../components/ui/PageHero'

const AUTOSAVE_DELAY = 2000 // ms

function wordCount(html) {
  if (!html) return 0
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text ? text.split(/\s+/).filter(Boolean).length : 0
}

const SIDE_STYLE = {
  proposition: { background: '#dbeafe', color: '#1e40af', border: '1.5px solid #93c5fd' },
  opposition:  { background: '#fde8e8', color: '#991b1b', border: '1.5px solid #fca5a5' },
  neutral:     { background: '#f3f4f6', color: '#374151', border: '1.5px solid #d1d5db' },
}

export default function SessionNotes() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [session, setSession] = useState(null)
  const [noteContent, setNoteContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved | autosaved
  const [teamNotes, setTeamNotes] = useState([])
  const [sources, setSources] = useState([])
  const [sourcesLoading, setSourcesLoading] = useState(false)
  const [sourcesError, setSourcesError] = useState('')
  const [sourcesLoaded, setSourcesLoaded] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [versions, setVersions] = useState([])
  const [previewVersion, setPreviewVersion] = useState(null)

  const autosaveTimer = useRef(null)
  const latestContent = useRef('')
  const latestPrivate = useRef(false)

  useEffect(() => {
    getSession(id).then(r => setSession(r.data)).catch(() => {})
    getMyNote(id).then(r => {
      setNoteContent(r.data.content || '')
      latestContent.current = r.data.content || ''
      setIsPrivate(r.data.is_private || false)
      latestPrivate.current = r.data.is_private || false
    }).catch(() => {})
    getTeamNotes(id).then(r => setTeamNotes(r.data)).catch(() => {})
  }, [id])

  // Autosave: fires 2s after last keystroke
  const scheduleAutosave = useCallback((content, priv) => {
    clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        await saveMyNote(id, content, priv)
        setSaveStatus('autosaved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('idle')
        toast.error('Autosave failed — please save manually.')
      }
    }, AUTOSAVE_DELAY)
  }, [id, toast])

  const handleEditorChange = useCallback((html) => {
    setNoteContent(html)
    latestContent.current = html
    scheduleAutosave(html, latestPrivate.current)
  }, [scheduleAutosave])

  const handlePrivacyToggle = async () => {
    const next = !isPrivate
    setIsPrivate(next)
    latestPrivate.current = next
    // Save immediately when toggling privacy
    clearTimeout(autosaveTimer.current)
    await saveMyNote(id, latestContent.current, next)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const handleManualSave = useCallback(async () => {
    clearTimeout(autosaveTimer.current)
    setSaveStatus('saving')
    try {
      await saveMyNote(id, latestContent.current, latestPrivate.current)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch {
      setSaveStatus('idle')
      toast.error('Failed to save notes.')
    }
  }, [id, toast])

  // Ctrl/Cmd+S to save
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleManualSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleManualSave])

  const handleOpenHistory = async () => {
    const res = await getNoteVersions(id)
    setVersions(res.data)
    setShowHistory(true)
    setPreviewVersion(null)
  }

  const handleRestoreVersion = (v) => {
    setNoteContent(v.content)
    latestContent.current = v.content
    setShowHistory(false)
    setPreviewVersion(null)
    scheduleAutosave(v.content, latestPrivate.current)
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

  const saveLabel = {
    idle: 'Save',
    saving: 'Saving…',
    saved: '✓ Saved',
    autosaved: null,
  }[saveStatus]

  const otherNotes = teamNotes.filter(n => n.user_name !== user?.name)

  return (
    <div className="page-container">
      <PageHero title="My Notes" subtitle={session?.title ?? 'Argument notes'} color="#1040C0">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <circle cx="40" cy="44" r="60" fill="white" opacity="0.07"/>
          <circle cx="160" cy="44" r="50" fill="white" opacity="0.06"/>
          <polygon points="260,4 296,72 224,72" fill="#F0C020" opacity="0.25"/>
          <circle cx="340" cy="44" r="55" fill="white" opacity="0.07"/>
        </svg>
      </PageHero>

      <div className="notes-page-top">
        <Link to={`/sessions/${id}`} className="btn btn-ghost" style={{ gap: 6 }}>
          <ArrowLeft size={15} /> Back to Session
        </Link>
        {session && <span className="text-muted" style={{ fontSize: 13, fontWeight: 600 }}>{session.title}</span>}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {saveStatus === 'autosaved' && (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Autosaved</span>
              )}
              <span className="notes-wordcount">{wordCount(noteContent)} words</span>
            </div>
          </div>

          {session?.topic_text && (
            <div className="notes-topic-banner">
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Topic</span>
              <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: 14 }}>{session.topic_text}</p>
            </div>
          )}

          {/* Version history panel */}
          {showHistory && (
            <div style={{ margin: '0 16px 12px', border: '2px solid #1040C0', borderRadius: 4, background: '#f0f4ff' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={14} style={{ color: '#1040C0' }} />
                <span style={{ fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1040C0' }}>
                  Version History ({versions.length})
                </span>
                <button onClick={() => { setShowHistory(false); setPreviewVersion(null) }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#555' }}>Close</button>
              </div>
              {versions.length === 0 ? (
                <p style={{ padding: '12px 14px', fontSize: 13, color: '#555', margin: 0 }}>No saved versions yet. Versions are created each time your content is saved.</p>
              ) : (
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {versions.map(v => (
                    <div key={v.id}
                      style={{ padding: '8px 14px', borderBottom: '1px solid #e0e7ff', display: 'flex', alignItems: 'center', gap: 10, background: previewVersion?.id === v.id ? '#e0e7ff' : 'transparent', cursor: 'pointer' }}
                      onClick={() => setPreviewVersion(v)}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1e3a8a' }}>
                          {new Date(v.saved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                          {wordCount(v.content)} words
                        </div>
                      </div>
                      <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={e => { e.stopPropagation(); handleRestoreVersion(v) }}>
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {previewVersion && (
                <div style={{ padding: '10px 14px', borderTop: '2px solid #c7d2fe', background: 'var(--bg-card)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1040C0', marginBottom: 6, textTransform: 'uppercase' }}>Preview</div>
                  <div className="re-content-readonly" dangerouslySetInnerHTML={{ __html: previewVersion.content }}
                    style={{ fontSize: 13, maxHeight: 160, overflowY: 'auto' }} />
                </div>
              )}
            </div>
          )}

          <div style={{ padding: '12px 16px' }}>
            <RichEditor value={noteContent} onChange={handleEditorChange}
              placeholder="Write your arguments, rebuttals, evidence, and key points here…" />
          </div>

          <div className="notes-editor-footer">
            {/* Privacy toggle */}
            <button
              onClick={handlePrivacyToggle}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: isPrivate ? '#1e293b' : 'var(--off-white)', border: `2px solid ${isPrivate ? '#334155' : '#cbd5e1'}`, borderRadius: 4, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: isPrivate ? 'white' : 'var(--text-muted)' }}>
              {isPrivate ? <Lock size={13} /> : <Eye size={13} />}
              {isPrivate ? 'Private' : 'Visible to team'}
            </button>

            <button className="btn btn-primary" onClick={handleManualSave} disabled={saveStatus === 'saving'}
              title="Save (Ctrl+S / ⌘S)">
              {saveLabel || 'Save'}
            </button>

            {/* History */}
            <button className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={handleOpenHistory}>
              <History size={13} /> History
            </button>

            <Link to={`/sessions/${id}/ai`} className="btn btn-ghost" style={{ marginLeft: 'auto' }}>
              Open AI Assistant →
            </Link>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="notes-sidebar-panel">
          {/* Research sources */}
          <div className="sources-panel">
            <div className="sources-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search size={15} color="white" />
                <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'white' }}>Research Sources</span>
              </div>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}
                onClick={fetchSources} disabled={sourcesLoading || !session?.topic_text}>
                {sourcesLoading
                  ? <><RefreshCw size={12} className="spin" /> Searching…</>
                  : sourcesLoaded ? <><RefreshCw size={12} /> Refresh</> : <><Search size={12} /> Find Sources</>}
              </button>
            </div>
            <div className="sources-panel-body">
              {!session?.topic_text && <p className="text-muted" style={{ fontSize: 13 }}>No topic set for this session yet.</p>}
              {session?.topic_text && !sourcesLoaded && !sourcesLoading && (
                <p className="text-muted" style={{ fontSize: 13 }}>Click <strong>Find Sources</strong> to search for real articles related to this topic.</p>
              )}
              {sourcesError && <div className="alert alert-error" style={{ fontSize: 13 }}>{sourcesError}</div>}
              {sources.length > 0 && (
                <div className="sources-list">
                  {sources.map((s, i) => (
                    <div key={i} className="source-card">
                      <a href={s.url} target="_blank" rel="noreferrer" className="source-title">
                        {s.title}{s.url && <ExternalLink size={11} style={{ marginLeft: 4, flexShrink: 0 }} />}
                      </a>
                      {s.snippet && <p className="source-snippet">{s.snippet}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Team notes */}
          {otherNotes.length > 0 && (
            <div className="sources-panel">
              <div className="sources-panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={15} color="white" />
                  <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'white' }}>Team Notes</span>
                </div>
              </div>
              <div className="sources-panel-body">
                <div className="team-notes-list">
                  {otherNotes.map((n, i) => (
                    <button key={i} className="team-note-member-card"
                      onClick={() => navigate(`/sessions/${id}/notes/${n.user_id}`)}>
                      <div className="avatar sm">{n.user_name[0]}</div>
                      <div className="team-note-member-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                          <span className="team-note-member-name">{n.user_name}</span>
                          {n.role && (
                            <span style={{ fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #f0c020', borderRadius: 3, padding: '1px 5px' }}>
                              {n.role}
                            </span>
                          )}
                          {n.side && (
                            <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 3, padding: '1px 5px', ...SIDE_STYLE[n.side] }}>
                              {n.side}
                            </span>
                          )}
                        </div>
                        <span className="team-note-member-sub">
                          {n.content ? `Updated ${new Date(n.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'No notes yet'}
                        </span>
                      </div>
                      <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
