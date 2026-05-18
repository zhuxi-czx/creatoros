import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import api from '../services/api'
import { Event } from '../services/event'

interface VenueDetail {
  id: string
  name: string
  address?: string
  city?: string
  description?: string
  coverUrl?: string
}

interface VenueEventsResponse {
  data: Event[]
  total: number
  page: number
  limit: number
}

const EVENT_GRADIENTS = [
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #7C3AED, #DB2777)',
  'linear-gradient(135deg, #6D28D9, #BE185D)',
  'linear-gradient(135deg, #5B21B6, #9D174D)',
]

export default function Venue() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [venue, setVenue] = useState<VenueDetail | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.allSettled([
      api.get(`/venues/${id}`) as unknown as Promise<VenueDetail>,
      api.get(`/venues/${id}/events`) as unknown as Promise<VenueEventsResponse>,
    ])
      .then(([venueResult, eventsResult]) => {
        if (venueResult.status === 'fulfilled') setVenue(venueResult.value)
        if (eventsResult.status === 'fulfilled') {
          const data = eventsResult.value
          setEvents(Array.isArray(data) ? data : (data as VenueEventsResponse).data ?? [])
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const statusInfo = (status: string) => {
    if (status === 'PUBLISHED') return { label: '报名中', color: '#8B5CF6' }
    if (status === 'FULL') return { label: '报名已满', color: '#999' }
    return { label: '已结束', color: '#999' }
  }

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  )

  if (!venue) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="empty-state">场所不存在</div>
    </div>
  )

  return (
    <div className="page-container">
      {/* Cover */}
      <div style={{ position: 'relative', height: 240, flexShrink: 0 }}>
        {venue.coverUrl ? (
          <img src={venue.coverUrl} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        )}
        {/* Back button */}
        <div style={{ position: 'absolute', top: 48, left: 16 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#333',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Venue Info */}
      <div style={{ padding: '24px 16px 0' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', letterSpacing: -0.5 }}>
          {venue.name}
        </h1>

        {(venue.city || venue.address) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#666', fontSize: 14 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{[venue.city, venue.address].filter(Boolean).join(' · ')}</span>
          </div>
        )}

        {venue.description && (
          <p style={{ marginTop: 14, fontSize: 14, color: '#666', lineHeight: 1.7 }}>
            {venue.description}
          </p>
        )}
      </div>

      {/* Upcoming events */}
      <div style={{ padding: '28px 16px 32px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', letterSpacing: -0.3, marginBottom: 14 }}>
          近期活动
        </h2>
        {events.length === 0 ? (
          <div className="empty-state">暂无近期活动</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {events.map((ev, i) => {
              const { label } = statusInfo(ev.status)
              const eventDate = ev.date || ev.startTime
              return (
                <div
                  key={ev.id}
                  onClick={() => navigate(`/event/${ev.id}`)}
                  style={{
                    borderRadius: 16,
                    background: EVENT_GRADIENTS[i % EVENT_GRADIENTS.length],
                    padding: '18px 18px 16px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', flex: 1, lineHeight: 1.3, paddingRight: 8 }}>
                      {ev.title}
                    </div>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 9999,
                      fontSize: 11,
                      fontWeight: 600,
                      background: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      flexShrink: 0,
                      marginTop: 2,
                    }}>
                      {label}
                    </span>
                  </div>
                  {ev.description && (
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 8, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ev.description}
                    </p>
                  )}
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {eventDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>{dayjs(eventDate).format('MM月DD日 HH:mm')}</span>
                      </div>
                    )}
                    {ev.hostName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>{ev.hostName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
