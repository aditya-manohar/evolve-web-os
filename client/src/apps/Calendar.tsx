// apps/Calendar.tsx
import { useState, useEffect } from 'react'
import Window from '../desktop/Window'

interface Event {
    id: string
    title: string
    date: string // YYYY-MM-DD
    time?: string // HH:MM
    endTime?: string // HH:MM
    description?: string
    color?: string
}

type ViewType = 'month' | 'week' | 'day'

export default function Calendar({ windowId, close, zIndex, minimize }: any) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [events, setEvents] = useState<Event[]>([])
    const [showEventModal, setShowEventModal] = useState(false)
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [view, setView] = useState<ViewType>('month')
    const [searchQuery, setSearchQuery] = useState('')

    // Load events from localStorage
    useEffect(() => {
        const savedEvents = localStorage.getItem('evolve-calendar')
        if (savedEvents) {
            try {
                setEvents(JSON.parse(savedEvents))
            } catch (e) {
                console.error('Failed to load events:', e)
            }
        }
    }, [])

    // Save events to localStorage
    useEffect(() => {
        localStorage.setItem('evolve-calendar', JSON.stringify(events))
    }, [events])

    // Helper functions
    const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    }

    const parseTime = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number)
        return hours * 60 + minutes
    }

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return new Date(year, month, 1).getDay()
    }

    const getWeekDays = (date: Date) => {
        const day = date.getDay()
        const diff = date.getDate() - day
        const weekStart = new Date(date)
        weekStart.setDate(diff)

        const weekDays = []
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart)
            day.setDate(weekStart.getDate() + i)
            weekDays.push(day)
        }
        return weekDays
    }

    const getEventsForDate = (dateStr: string) => {
        return events.filter(e => e.date === dateStr).sort((a, b) => {
            if (!a.time) return -1
            if (!b.time) return 1
            return parseTime(a.time) - parseTime(b.time)
        })
    }

    const getEventsForWeek = (weekDays: Date[]) => {
        const dateStrs = weekDays.map(d => formatDate(d))
        return events.filter(e => dateStrs.includes(e.date))
    }

    const addEvent = (event: Omit<Event, 'id'>) => {
        const newEvent: Event = {
            ...event,
            id: Date.now().toString()
        }
        setEvents([...events, newEvent])
        setShowEventModal(false)
    }

    const updateEvent = (event: Event) => {
        setEvents(events.map(e => e.id === event.id ? event : e))
        setShowEventModal(false)
        setEditingEvent(null)
    }

    const deleteEvent = (id: string) => {
        if (confirm('Delete this event?')) {
            setEvents(events.filter(e => e.id !== id))
        }
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    const nextWeek = () => {
        const newDate = new Date(currentDate)
        newDate.setDate(currentDate.getDate() + 7)
        setCurrentDate(newDate)
    }

    const prevWeek = () => {
        const newDate = new Date(currentDate)
        newDate.setDate(currentDate.getDate() - 7)
        setCurrentDate(newDate)
    }

    const nextDay = () => {
        const newDate = new Date(currentDate)
        newDate.setDate(currentDate.getDate() + 1)
        setCurrentDate(newDate)
    }

    const prevDay = () => {
        const newDate = new Date(currentDate)
        newDate.setDate(currentDate.getDate() - 1)
        setCurrentDate(newDate)
    }

    const goToToday = () => {
        setCurrentDate(new Date())
        setSelectedDate(new Date())
    }

    // Event Modal Component
    const EventModal = ({ onClose, event }: { onClose: () => void, event?: Event }) => {
        const [title, setTitle] = useState(event?.title || '')
        const [time, setTime] = useState(event?.time || '')
        const [endTime, setEndTime] = useState(event?.endTime || '')
        const [description, setDescription] = useState(event?.description || '')
        const [color, setColor] = useState(event?.color || '#0a4a8a')
        const [allDay, setAllDay] = useState(!event?.time)

        const handleSubmit = () => {
            if (!title.trim()) return

            const eventData = {
                title,
                date: formatDate(selectedDate),
                time: allDay ? undefined : time,
                endTime: allDay ? undefined : endTime,
                description,
                color
            }

            if (event) {
                updateEvent({ ...event, ...eventData })
            } else {
                addEvent(eventData)
            }
            onClose()
        }

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000
            }}>
                <div style={{
                    background: '#252525',
                    borderRadius: '8px',
                    padding: '24px',
                    width: '400px',
                    border: '1px solid #444'
                }}>
                    <h3 style={{ margin: '0 0 20px', color: '#e0e0e0' }}>
                        {event ? 'Edit Event' : 'New Event'}
                    </h3>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '12px' }}>
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                background: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: '#e0e0e0',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                            autoFocus
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '12px' }}>
                            Date
                        </label>
                        <input
                            type="date"
                            value={formatDate(selectedDate)}
                            onChange={(e) => {
                                const [year, month, day] = e.target.value.split('-').map(Number)
                                setSelectedDate(new Date(year, month - 1, day))
                            }}
                            style={{
                                width: '100%',
                                padding: '8px',
                                background: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: '#e0e0e0',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', fontSize: '12px' }}>
                            <input
                                type="checkbox"
                                checked={allDay}
                                onChange={(e) => setAllDay(e.target.checked)}
                            />
                            All day
                        </label>
                    </div>

                    {!allDay && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '12px' }}>
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: '4px',
                                        color: '#e0e0e0',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '12px' }}>
                                    End Time
                                </label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: '4px',
                                        color: '#e0e0e0',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '12px' }}>
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                background: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: '#e0e0e0',
                                fontSize: '14px',
                                outline: 'none',
                                minHeight: '80px',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '12px' }}>
                            Color
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['#0a4a8a', '#2e7d32', '#b85c00', '#9c27b0', '#c62828', '#00838f', '#4a4a4a'].map(c => (
                                <div
                                    key={c}
                                    onClick={() => setColor(c)}
                                    style={{
                                        width: '30px',
                                        height: '30px',
                                        background: c,
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        border: color === c ? '2px solid white' : 'none'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px 16px',
                                background: 'transparent',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                color: '#e0e0e0',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            style={{
                                padding: '8px 16px',
                                background: '#0a4a8a',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            {event ? 'Update' : 'Create'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Month View
    const MonthView = () => {
        const daysInMonth = getDaysInMonth(currentDate)
        const firstDay = getFirstDayOfMonth(currentDate)
        const days = []
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

        // Weekday headers
        for (let i = 0; i < 7; i++) {
            days.push(
                <div key={`header-${i}`} style={{
                    padding: '8px',
                    textAlign: 'center',
                    color: '#888',
                    fontSize: '12px',
                    fontWeight: 500,
                    borderBottom: '1px solid #333'
                }}>
                    {weekdays[i]}
                </div>
            )
        }

        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} style={{ padding: '4px' }} />)
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            const dateStr = formatDate(date)
            const dayEvents = getEventsForDate(dateStr)
            const isToday = formatDate(new Date()) === dateStr
            const isSelected = formatDate(selectedDate) === dateStr

            days.push(
                <div
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    onClick={() => setShowEventModal(true)}
                    style={{
                        padding: '4px',
                        background: isSelected ? '#2a2a2a' : 'transparent',
                        border: isToday ? '1px solid #0a4a8a' : '1px solid transparent',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        minHeight: '70px',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{
                        fontSize: '12px',
                        color: isToday ? '#0a4a8a' : '#e0e0e0',
                        fontWeight: isToday ? 'bold' : 'normal',
                        marginBottom: '2px'
                    }}>
                        {day}
                    </div>
                    {dayEvents.slice(0, 2).map(event => (
                        <div
                            key={event.id}
                            onClick={(e) => {
                                e.stopPropagation()
                                setEditingEvent(event)
                                setShowEventModal(true)
                            }}
                            style={{
                                background: event.color || '#0a4a8a',
                                borderRadius: '2px',
                                padding: '2px 4px',
                                margin: '1px 0',
                                fontSize: '9px',
                                color: 'white',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {event.time && `${event.time} `}{event.title}
                        </div>
                    ))}
                    {dayEvents.length > 2 && (
                        <div style={{ fontSize: '8px', color: '#888' }}>
                            +{dayEvents.length - 2} more
                        </div>
                    )}
                </div>
            )
        }

        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '2px',
                height: '100%',
                overflowY: 'auto'
            }}>
                {days}
            </div>
        )
    }

    // Week View
    const WeekView = () => {
        const weekDays = getWeekDays(currentDate)
        const hours = Array.from({ length: 24 }, (_, i) => i)
        const weekEvents = getEventsForWeek(weekDays)

        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: '60px repeat(7, 1fr)',
                height: '100%',
                overflowY: 'auto',
                background: '#1a1a1a'
            }}>
                {/* Time labels */}
                <div style={{ gridColumn: '1', background: '#252525', borderRight: '1px solid #333' }}>
                    {hours.map(hour => (
                        <div key={hour} style={{
                            height: '40px',
                            padding: '4px',
                            fontSize: '10px',
                            color: '#888',
                            textAlign: 'right',
                            borderBottom: '1px solid #333'
                        }}>
                            {`${hour.toString().padStart(2, '0')}:00`}
                        </div>
                    ))}
                </div>

                {/* Week days */}
                {weekDays.map((day, index) => {
                    const dateStr = formatDate(day)
                    const dayEvents = getEventsForDate(dateStr)
                    const isToday = formatDate(new Date()) === dateStr

                    return (
                        <div key={index} style={{
                            borderRight: index < 6 ? '1px solid #333' : 'none',
                            background: '#1a1a1a'
                        }}>
                            {/* Day header */}
                            <div style={{
                                padding: '8px',
                                textAlign: 'center',
                                borderBottom: '1px solid #333',
                                background: isToday ? '#2a4a6a' : '#252525'
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: 500 }}>
                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    color: isToday ? '#ff9f0a' : '#e0e0e0'
                                }}>
                                    {day.getDate()}
                                </div>
                            </div>

                            {/* Hour cells */}
                            <div style={{ position: 'relative' }}>
                                {hours.map(hour => (
                                    <div
                                        key={hour}
                                        onClick={() => {
                                            setSelectedDate(day)
                                            setShowEventModal(true)
                                        }}
                                        style={{
                                            height: '40px',
                                            borderBottom: '1px solid #333',
                                            cursor: 'pointer',
                                            position: 'relative'
                                        }}
                                    />
                                ))}

                                {/* Events */}
                                {dayEvents.map(event => {
                                    if (!event.time) return null

                                    const startHour = parseInt(event.time.split(':')[0])
                                    const startMinute = parseInt(event.time.split(':')[1])
                                    const top = startHour * 40 + (startMinute / 60) * 40

                                    let height = 35 // default 1 hour
                                    if (event.endTime) {
                                        const endHour = parseInt(event.endTime.split(':')[0])
                                        const endMinute = parseInt(event.endTime.split(':')[1])
                                        const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
                                        height = (duration / 60) * 40
                                    }

                                    return (
                                        <div
                                            key={event.id}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setEditingEvent(event)
                                                setShowEventModal(true)
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: `${top}px`,
                                                left: '2px',
                                                right: '2px',
                                                height: `${height - 2}px`,
                                                background: event.color || '#0a4a8a',
                                                borderRadius: '4px',
                                                padding: '2px 4px',
                                                fontSize: '10px',
                                                color: 'white',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                zIndex: 10
                                            }}
                                        >
                                            <div style={{ fontWeight: 500 }}>{event.title}</div>
                                            <div style={{ fontSize: '8px', opacity: 0.8 }}>
                                                {event.time}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    // Day View
    const DayView = () => {
        const hours = Array.from({ length: 24 }, (_, i) => i)
        const dateStr = formatDate(currentDate)
        const dayEvents = getEventsForDate(dateStr)

        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                height: '100%',
                overflowY: 'auto',
                background: '#1a1a1a'
            }}>
                {/* Time labels */}
                <div style={{ background: '#252525', borderRight: '1px solid #333' }}>
                    {hours.map(hour => (
                        <div key={hour} style={{
                            height: '60px',
                            padding: '8px',
                            fontSize: '11px',
                            color: '#888',
                            textAlign: 'right',
                            borderBottom: '1px solid #333'
                        }}>
                            {`${hour.toString().padStart(2, '0')}:00`}
                        </div>
                    ))}
                </div>

                {/* Day content */}
                <div style={{ position: 'relative', background: '#1a1a1a' }}>
                    {/* Hour cells */}
                    {hours.map(hour => (
                        <div
                            key={hour}
                            onClick={() => setShowEventModal(true)}
                            style={{
                                height: '60px',
                                borderBottom: '1px solid #333',
                                cursor: 'pointer'
                            }}
                        />
                    ))}

                    {/* Events */}
                    {dayEvents.map(event => {
                        if (!event.time) {
                            // All day event
                            return (
                                <div
                                    key={event.id}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingEvent(event)
                                        setShowEventModal(true)
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '0',
                                        left: '4px',
                                        right: '4px',
                                        padding: '8px',
                                        background: event.color || '#0a4a8a',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        marginTop: '2px',
                                        zIndex: 20
                                    }}
                                >
                                    <strong>📅 {event.title}</strong> (All day)
                                </div>
                            )
                        }

                        const startHour = parseInt(event.time.split(':')[0])
                        const startMinute = parseInt(event.time.split(':')[1])
                        const top = startHour * 60 + startMinute

                        let height = 55 // default 1 hour
                        if (event.endTime) {
                            const endHour = parseInt(event.endTime.split(':')[0])
                            const endMinute = parseInt(event.endTime.split(':')[1])
                            const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
                            height = duration
                        }

                        return (
                            <div
                                key={event.id}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingEvent(event)
                                    setShowEventModal(true)
                                }}
                                style={{
                                    position: 'absolute',
                                    top: `${top}px`,
                                    left: '4px',
                                    right: '4px',
                                    height: `${height - 2}px`,
                                    background: event.color || '#0a4a8a',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    color: 'white',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    zIndex: 10
                                }}
                            >
                                <div style={{ fontWeight: 500 }}>{event.title}</div>
                                <div style={{ fontSize: '9px', opacity: 0.8 }}>
                                    {event.time} {event.endTime && `- ${event.endTime}`}
                                </div>
                                {event.description && (
                                    <div style={{ fontSize: '9px', marginTop: '2px', opacity: 0.7 }}>
                                        {event.description.substring(0, 30)}
                                        {event.description.length > 30 && '...'}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const ToolbarButton = ({ onClick, children, active }: any) => (
        <button
            onClick={onClick}
            style={{
                background: active ? '#0a4a8a' : 'transparent',
                border: '1px solid #3a3a3a',
                borderRadius: '4px',
                color: active ? 'white' : '#e0e0e0',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: active ? 500 : 400
            }}
            onMouseEnter={(e) => {
                if (!active) {
                    e.currentTarget.style.background = '#3a3a3a'
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'transparent'
                }
            }}
        >
            {children}
        </button>
    )

    return (
        <Window
            windowId={windowId}
            title="Calendar"
            onClose={close}
            zIndex={zIndex}
            onMinimize={minimize}
            defaultSize={{ width: 1000, height: 700 }}
            minSize={{ width: 700, height: 500 }}
        >
            <div style={{
                height: '100%',
                background: '#1e1e1e',
                color: '#e0e0e0',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Toolbar */}
                <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #333',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    background: '#252525',
                    flexWrap: 'wrap'
                }}>
                    <ToolbarButton onClick={() => {
                        if (view === 'month') prevMonth()
                        else if (view === 'week') prevWeek()
                        else prevDay()
                    }}>←</ToolbarButton>

                    <ToolbarButton onClick={() => {
                        if (view === 'month') nextMonth()
                        else if (view === 'week') nextWeek()
                        else nextDay()
                    }}>→</ToolbarButton>

                    <ToolbarButton onClick={goToToday}>Today</ToolbarButton>

                    <div style={{ marginLeft: '16px', fontWeight: 500 }}>
                        {view === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        {view === 'week' && `Week of ${getWeekDays(currentDate)[0].toLocaleDateString()}`}
                        {view === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>

                    <div style={{ flex: 1 }} />

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            padding: '6px 12px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            color: '#e0e0e0',
                            fontSize: '13px',
                            width: '200px',
                            outline: 'none'
                        }}
                    />

                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        background: '#1a1a1a',
                        borderRadius: '4px',
                        padding: '2px'
                    }}>
                        {(['month', 'week', 'day'] as ViewType[]).map(v => (
                            <ToolbarButton
                                key={v}
                                onClick={() => setView(v)}
                                active={view === v}
                            >
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </ToolbarButton>
                        ))}
                    </div>
                </div>

                {/* Calendar View */}
                <div style={{ flex: 1, padding: '16px', overflow: 'hidden' }}>
                    {view === 'month' && <MonthView />}
                    {view === 'week' && <WeekView />}
                    {view === 'day' && <DayView />}
                </div>

                {/* Status Bar */}
                <div style={{
                    padding: '8px 16px',
                    borderTop: '1px solid #333',
                    background: '#252525',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#888'
                }}>
                    <span>{events.length} events</span>
                    <span>Double-click to add event</span>
                </div>
            </div>

            {/* Event Modal */}
            {showEventModal && (
                <EventModal
                    onClose={() => {
                        setShowEventModal(false)
                        setEditingEvent(null)
                    }}
                    event={editingEvent || undefined}
                />
            )}
        </Window>
    )
}