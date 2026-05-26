import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import api from '../services/api'
import { Event } from '../services/event'
import LazyImage from '../components/LazyImage'
import ImageCarousel from '../components/ImageCarousel'

interface VenueDetail {
  id: string
  name: string
  address?: string
  city?: string
  description?: string
  coverUrl?: string
  imageUrls?: string[]
  autoplay?: boolean
  interval?: number
}

interface VenueEventsResponse {
  data: Event[]
  total: number
  page: number
  limit: number
}

const ACCENT = '#C9A96E'

const AVATAR_COLORS = ['#C9A96E', '#8B7355', '#A0926B', '#7B6B4E', '#B8956A', '#D4B896']

const statusMap = (ev: Event) => {
  const eventDate = ev.date || ev.startTime
  if (eventDate && new Date(eventDate) < new Date()) return { label: '已结束', color: '#999' }
  if (ev.status === 'PUBLISHED') return { label: '报名中', color: '#4CAF50' }
  if (ev.status === 'FULL') return { label: '即将满员', color: '#FF9800' }
  if (ev.status === 'ENDED') return { label: '已结束', color: '#999' }
  return { label: ev.status, color: '#999' }
}

export default function Venue() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [venue, setVenue] = useState<VenueDetail | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (retry = 0) => {
    if (!id) return
    try {
      const [venueResult, eventsResult] = await Promise.allSettled([
        api.get(`/venues/${id}`) as unknown as Promise<VenueDetail>,
        api.get(`/venues/${id}/events`) as unknown as Promise<VenueEventsResponse>,
      ])
      if (venueResult.status === 'fulfilled') {
        setVenue(venueResult.value)
      } else if (retry < 2) {
        await new Promise(r => setTimeout(r, 1000))
        return fetchData(retry + 1)
      }
      if (eventsResult.status === 'fulfilled') {
        const data = eventsResult.value
        setEvents(Array.isArray(data) ? data : (data as VenueEventsResponse).data ?? [])
      }
    } catch {
      if (retry < 2) {
        await new Promise(r => setTimeout(r, 1000))
        return fetchData(retry + 1)
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ height: 220, background: '#F0EBE3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #E0D8CC', borderTop: `2px solid ${ACCENT}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: '50%', height: 22, background: '#F0EBE3', borderRadius: 6 }} />
        <div style={{ width: '70%', height: 14, background: '#F0EBE3', borderRadius: 4 }} />
        <div style={{ width: '90%', height: 60, background: '#F0EBE3', borderRadius: 8 }} />
      </div>
    </div>
  )

  if (!venue) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F7F7F7', fontFamily: "'Inter', -apple-system, sans-serif", gap: 16 }}>
      <span style={{ fontSize: 16, color: '#999' }}>场所不存在或加载失败</span>
      <button onClick={() => { setLoading(true); fetchData() }} style={{ padding: '8px 24px', borderRadius: 20, background: ACCENT, color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer' }}>
        重试
      </button>
    </div>
  )

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: '#F7F7F7',
    }}>
      {/* Cover */}
      <div style={{ position: 'relative', height: 220, flexShrink: 0 }}>
        {venue.coverUrl ? (
          <LazyImage src={venue.coverUrl} alt={venue.name} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${ACCENT}, #8B7355)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Venue Info */}
      <div style={{ padding: '20px 16px 0' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{venue.name}</h1>
        {(venue.city || venue.address) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, color: '#999', fontSize: 13 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span>{[venue.city, venue.address].filter(Boolean).join(' · ')}</span>
          </div>
        )}
        {venue.description && (
          <p style={{ marginTop: 12, fontSize: 13, color: '#666', lineHeight: 1.6 }}>{venue.description}</p>
        )}
      </div>

      {/* Venue Images Carousel */}
      {venue.imageUrls && venue.imageUrls.length > 0 && (
        <div style={{ padding: '20px 16px 0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A', margin: '0 0 12px' }}>场馆详情</h2>
          <ImageCarousel
            images={venue.imageUrls}
            autoplay={venue.autoplay}
            interval={venue.interval || 3000}
            height={200}
            borderRadius={8}
          />
        </div>
      )}

      {/* Events - same card style as Discover page */}
      <div style={{ padding: '20px 16px 32px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A', margin: '0 0 14px' }}>近期活动</h2>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', fontSize: 14, padding: '32px 0' }}>暂无近期活动</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {events.map((ev, idx) => {
              const { label, color } = statusMap(ev)
              const eventDate = ev.date || ev.startTime
              const signupCount = ev._count?.signups ?? 0
              const signups = (ev as any).signups as { user: { id: string; avatarUrl?: string } }[] | undefined
              return (
                <div
                  key={ev.id}
                  style={{
                    background: '#fff', borderRadius: 12, padding: 16,
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}
                >
                  {/* Title */}
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A' }}>{ev.title}</div>

                  {/* Info row */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    {eventDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span style={{ fontSize: 11, color: '#999' }}>{dayjs(eventDate).format('M月D日 HH:mm')}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: color }} />
                      <span style={{ fontSize: 11, fontWeight: 500, color }}>{label}</span>
                    </div>
                    {venue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        <span style={{ fontSize: 11, color: '#999' }}>{venue.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Cover image */}
                  {ev.coverUrl ? (
                    <LazyImage src={ev.coverUrl} alt={ev.title} style={{ width: '100%', height: 160, borderRadius: 8 }} />
                  ) : (
                    <div style={{
                      width: '100%', height: 160, borderRadius: 8,
                      background: `linear-gradient(135deg, ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}, ${AVATAR_COLORS[(idx + 2) % AVATAR_COLORS.length]})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{ev.title.slice(0, 2)}</span>
                    </div>
                  )}

                  {/* Bottom row: avatars + signup button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ position: 'relative', width: signups && signups.length > 0 ? (Math.min(signups.length, 3) - 1) * 20 + 28 : 0, height: 28 }}>
                        {signups?.slice(0, 3).map((s, i) => (
                          <div key={s.user.id} style={{
                            position: 'absolute', left: i * 20, top: 0,
                            width: 28, height: 28, borderRadius: '50%',
                            background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                            border: '2px solid #fff',
                            overflow: 'hidden',
                          }}>
                            {s.user.avatarUrl && <img src={s.user.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                          </div>
                        ))}
                      </div>
                      {signupCount > 0 && (
                        <span style={{ fontSize: 12, color: '#999' }}>{signupCount}人已报名</span>
                      )}
                    </div>
                    <div
                      onClick={() => navigate(`/event/${ev.id}`)}
                      style={{
                        padding: '8px 20px', borderRadius: 20,
                        background: ACCENT, color: '#fff',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      立即报名
                    </div>
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
