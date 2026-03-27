import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSessions, getEvents, createEvent, deleteEvent } from '../api'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import PageHero from '../components/ui/PageHero'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { Plus, Trash2 } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { 'en-US': enUS },
})

const EVENT_TYPES = [
  { value: 'exam',    label: 'Exam',           color: '#D02020' },
  { value: 'holiday', label: 'School Holiday', color: '#22c55e' },
  { value: 'other',   label: 'Other',          color: '#9333ea' },
]

export default function CalendarPage() {
  const navigate = useNavigate()
  const [date, setDate] = useState(new Date())
  const [view, setView] = useState('month')
  const [sessionEvents, setSessionEvents] = useState([])
  const [customEvents, setCustomEvents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'exam', date: '', endDate: '' })
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getSessions().then((res) => {
      setSessionEvents(
        res.data
          .filter((s) => s.scheduled_at)
          .map((s) => ({
            id: s.id,
            title: s.title,
            start: new Date(s.scheduled_at),
            end: new Date(new Date(s.scheduled_at).getTime() + 90 * 60000),
            eventType: 'session',
            resource: s,
          }))
      )
    })

    getEvents().then((res) => {
      setCustomEvents(
        res.data.map((e) => ({
          id: e.id,
          title: e.title,
          start: new Date(e.start_at),
          end: new Date(e.end_at),
          eventType: e.event_type,
          createdBy: e.created_by,
        }))
      )
    })
  }, [])

  const events = [...sessionEvents, ...customEvents]

  const eventStyleGetter = (event) => {
    if (event.eventType === 'session') {
      return { style: { backgroundColor: '#1040C0', borderRadius: '4px', border: 'none', color: '#fff' } }
    }
    const typeColor = EVENT_TYPES.find(t => t.value === event.eventType)?.color ?? '#9333ea'
    return { style: { backgroundColor: typeColor, borderRadius: '4px', border: 'none', color: '#fff' } }
  }

  const handleAddEvent = async (e) => {
    e.preventDefault()
    setError('')
    const start = new Date(form.date)
    const end = form.endDate ? new Date(form.endDate) : new Date(start.getTime() + 60 * 60000)
    try {
      const res = await createEvent({
        title: form.title,
        event_type: form.type,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
      })
      const saved = res.data
      setCustomEvents(prev => [...prev, {
        id: saved.id,
        title: saved.title,
        start: new Date(saved.start_at),
        end: new Date(saved.end_at),
        eventType: saved.event_type,
        createdBy: saved.created_by,
      }])
      setForm({ title: '', type: 'exam', date: '', endDate: '' })
      setShowForm(false)
    } catch {
      setError('Failed to save event. Please try again.')
    }
  }

  const handleDeleteEvent = async (event) => {
    try {
      await deleteEvent(event.id)
      setCustomEvents(prev => prev.filter(e => e.id !== event.id))
      setSelectedEvent(null)
    } catch {
      setError('Failed to delete event.')
    }
  }

  const handleSelectEvent = (event) => {
    if (event.eventType === 'session') {
      navigate(`/sessions/${event.id}`)
    } else {
      setSelectedEvent(event)
    }
  }

  return (
    <div className="page-container">
      <PageHero title="Calendar" subtitle="Session schedule" color="#1040C0">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <circle cx="50" cy="44" r="55" fill="white" opacity="0.06"/>
          <circle cx="200" cy="44" r="60" fill="white" opacity="0.06"/>
          <circle cx="200" cy="44" r="38" fill="white" opacity="0.07"/>
          <circle cx="200" cy="44" r="18" fill="#F0C020" opacity="0.22"/>
          <circle cx="350" cy="44" r="55" fill="white" opacity="0.06"/>
          <rect x="360" y="4" width="76" height="76" fill="white" opacity="0.04" transform="rotate(10 398 42)"/>
        </svg>
      </PageHero>

      <div className="page-top-bar">
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="calendar-legend-item" style={{ '--dot': '#1040C0' }}>Session</span>
          {EVENT_TYPES.map(t => (
            <span key={t.value} className="calendar-legend-item" style={{ '--dot': t.color }}>{t.label}</span>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setSelectedEvent(null) }}>
          <Plus size={15} /> Add Event
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form className="add-topic-form form-stack" style={{ flexDirection: 'column', alignItems: 'stretch' }} onSubmit={handleAddEvent}>
          <h4 style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 13 }}>Add Event</h4>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input className="input" placeholder="Event title *" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ flex: 2 }} required />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ flex: 1 }}>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <label style={{ flex: 1 }}>Start
              <input type="datetime-local" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </label>
            <label style={{ flex: 1 }}>End (optional)
              <input type="datetime-local" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary">Add Event</button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Event detail popup for custom events */}
      {selectedEvent && (
        <div className="calendar-event-popup">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <span className={`badge`} style={{
                background: EVENT_TYPES.find(t => t.value === selectedEvent.eventType)?.color ?? '#9333ea',
                color: 'white', marginBottom: 6, display: 'inline-block',
              }}>
                {EVENT_TYPES.find(t => t.value === selectedEvent.eventType)?.label ?? selectedEvent.eventType}
              </span>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{selectedEvent.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {selectedEvent.start.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                {' → '}
                {selectedEvent.end.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button className="btn btn-ghost" style={{ padding: '4px 8px', color: 'var(--red)' }}
                onClick={() => handleDeleteEvent(selectedEvent)}>
                <Trash2 size={14}/> Delete
              </button>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }}
                onClick={() => setSelectedEvent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="calendar-box">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '70vh' }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          views={['month', 'week', 'agenda']}
          date={date}
          view={view}
          onNavigate={setDate}
          onView={setView}
        />
      </div>
    </div>
  )
}
