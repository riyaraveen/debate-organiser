import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSessions } from '../api'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { 'en-US': enUS },
})

export default function CalendarPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])

  useEffect(() => {
    getSessions().then((res) => {
      const mapped = res.data
        .filter((s) => s.scheduled_at)
        .map((s) => ({
          id: s.id,
          title: s.title,
          start: new Date(s.scheduled_at),
          end: new Date(new Date(s.scheduled_at).getTime() + 90 * 60000),
          resource: s,
        }))
      setEvents(mapped)
    })
  }, [])

  const eventStyleGetter = (event) => {
    const colors = {
      scheduled: '#3b82f6',
      completed: '#22c55e',
      draft: '#94a3b8',
      cancelled: '#ef4444',
    }
    const bg = colors[event.resource?.status] ?? '#3b82f6'
    return { style: { backgroundColor: bg, borderRadius: '4px', border: 'none', color: '#fff' } }
  }

  return (
    <div className="calendar-page">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '70vh' }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => navigate(`/sessions/${event.id}`)}
        views={['month', 'week', 'agenda']}
        defaultView="month"
      />
    </div>
  )
}
