import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getUserNote, getSession } from '../api'
import { ArrowLeft, FileText } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

export default function TeamMemberNotes() {
  const { id, userId } = useParams()
  const [note, setNote] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getSession(id),
      getUserNote(id, userId),
    ]).then(([sRes, nRes]) => {
      setSession(sRes.data)
      setNote(nRes.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id, userId])

  return (
    <div className="page-container">
      <PageHero title="Team Notes" subtitle={session?.title ?? 'Session notes'} color="#1040C0">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <circle cx="40" cy="44" r="60" fill="white" opacity="0.07"/>
          <circle cx="160" cy="44" r="50" fill="white" opacity="0.06"/>
          <polygon points="260,4 296,72 224,72" fill="#F0C020" opacity="0.25"/>
          <circle cx="340" cy="44" r="55" fill="white" opacity="0.07"/>
        </svg>
      </PageHero>

      <Link to={`/sessions/${id}/notes`} className="back-btn">
        <ArrowLeft size={15}/> Back to Notes
      </Link>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <div className="notes-editor-panel" style={{ width: '100%' }}>
          <div className="notes-editor-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
                {note?.user_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>{note?.user_name}</div>
                {note?.updated_at && (
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                    Last updated {new Date(note.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              View only
            </span>
          </div>

          <div style={{ padding: '20px 24px' }}>
            {note?.content ? (
              note.content.startsWith('<') ? (
                <div className="re-content-readonly" dangerouslySetInnerHTML={{ __html: note.content }} />
              ) : (
                <p style={{ fontSize: 14, whiteSpace: 'pre-wrap', margin: 0 }}>{note.content}</p>
              )
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                {note?.user_name} hasn't written any notes yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
