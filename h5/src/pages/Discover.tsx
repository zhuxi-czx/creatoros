import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { getEvents, Event } from '../services/event'
import TabBar from '../components/TabBar'
import LazyImage from '../components/LazyImage'

const TAGS = ['全部', '音乐', '品鉴', '沙龙', '脱口秀', '派对']

const AVATAR_COLORS = ['#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#10B981', '#3B82F6']

export default function Discover() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState('全部')

  useEffect(() => {
    getEvents(1, 20)
      .then((res) => {
        const data = Array.isArray(res) ? res : (res as { data: Event[] }).data || []
        setEvents(data)
      })
      .finally(() => setLoading(false))
  }, [])

  const getStatusInfo = (status: string) => {
    if (status === 'PUBLISHED') return { dot: '#4CAF50', label: '报名中' }
    if (status === 'FULL') return { dot: '#FF9800', label: '即将满员' }
    return { dot: '#999', label: '已结束' }
  }

  const formatDate = (ev: Event) => {
    const d = ev.date || ev.startTime
    if (!d) return ''
    return dayjs(d).format('M月D日 HH:mm')
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F7F7' }}>
      {/* Nav Bar */}
      <div style={{
        height: 48,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
      }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', flexShrink: 0 }}>发现</span>
        <div style={{
          flex: 1,
          height: 36,
          borderRadius: 18,
          background: '#F0F0F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span style={{ fontSize: 13, color: '#BBB' }}>搜索活动、主题、场地</span>
        </div>
      </div>

      {/* Tag Filter Row */}
      <div style={{
        height: 44,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        padding: '0 16px',
        gap: 10,
        flexShrink: 0,
        borderBottom: '1px solid #F0F0F0',
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}>
        {TAGS.map((tag) => {
          const isActive = selectedTag === tag
          return (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: isActive ? '#1A1A1A' : '#FFFFFF',
                border: isActive ? 'none' : '1px solid #E0E0E0',
                color: isActive ? '#fff' : '#666',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {/* Activity Card List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 16px 100px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: '#F7F7F7',
      }}>
        {loading ? (
          [0, 1, 2].map(i => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ width: '60%', height: 18, background: '#F0EBE3', borderRadius: 4 }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 80, height: 14, background: '#F0EBE3', borderRadius: 4 }} />
                <div style={{ width: 50, height: 14, background: '#F0EBE3', borderRadius: 4 }} />
                <div style={{ width: 60, height: 14, background: '#F0EBE3', borderRadius: 4 }} />
              </div>
              <div style={{ width: '100%', height: 160, background: '#F0EBE3', borderRadius: 8 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: 100, height: 14, background: '#F0EBE3', borderRadius: 4 }} />
                <div style={{ width: 80, height: 32, background: '#F0EBE3', borderRadius: 20 }} />
              </div>
            </div>
          ))
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999', fontSize: 14 }}>
            暂无活动
          </div>
        ) : (
          events.map((ev, idx) => {
            const status = getStatusInfo(ev.status)
            const signupCount = ev._count?.signups ?? ev.currentParticipants ?? 0
            const signups = (ev as any).signups as { user: { id: string; avatarUrl?: string } }[] | undefined
            const avatarList = signups?.slice(0, 3) ?? []

            return (
              <div
                key={ev.id}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {/* Title */}
                <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A' }}>
                  {ev.title}
                </div>

                {/* Info row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {/* Time */}
                  {(ev.date || ev.startTime) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span style={{ fontSize: 11, color: '#999' }}>{formatDate(ev)}</span>
                    </div>
                  )}
                  {/* Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: status.dot,
                      display: 'inline-block',
                    }} />
                    <span style={{ fontSize: 11, color: status.dot }}>{status.label}</span>
                  </div>
                  {/* Location */}
                  {(ev.venue?.name || ev.location) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span style={{ fontSize: 11, color: '#999' }}>{ev.venue?.name || ev.location}</span>
                    </div>
                  )}
                </div>

                {/* Cover image */}
                {ev.coverUrl ? (
                  <LazyImage
                    src={ev.coverUrl}
                    alt={ev.title}
                    style={{ width: '100%', height: 160, borderRadius: 8 }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: 160,
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}, ${AVATAR_COLORS[(idx + 2) % AVATAR_COLORS.length]})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                      {ev.title.slice(0, 2)}
                    </span>
                  </div>
                )}

                {/* Bottom row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  {/* Left: avatar stack + count */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      position: 'relative',
                      width: avatarList.length > 0
                        ? 20 * avatarList.length + 8
                        : signupCount > 0
                          ? 20 * Math.min(3, signupCount) + 8
                          : 0,
                      height: 28,
                    }}>
                      {avatarList.map((s, i) => (
                        <div
                          key={s.user.id}
                          style={{
                            position: 'absolute',
                            left: i * 20,
                            top: 0,
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: s.user.avatarUrl ? undefined : AVATAR_COLORS[i % AVATAR_COLORS.length],
                            backgroundImage: s.user.avatarUrl ? `url(${s.user.avatarUrl})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '2px solid #fff',
                            zIndex: avatarList.length - i,
                          }}
                        />
                      ))}
                      {avatarList.length === 0 && signupCount > 0 && (
                        // Placeholder avatars when no signup data
                        <>
                          {[0, 1, 2].slice(0, Math.min(3, signupCount)).map((i) => (
                            <div
                              key={i}
                              style={{
                                position: 'absolute',
                                left: i * 20,
                                top: 0,
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: AVATAR_COLORS[(idx + i) % AVATAR_COLORS.length],
                                border: '2px solid #fff',
                                zIndex: 3 - i,
                              }}
                            />
                          ))}
                        </>
                      )}
                    </div>
                    {signupCount > 0 && (
                      <span style={{ fontSize: 12, color: '#999' }}>{signupCount}人已报名</span>
                    )}
                  </div>

                  {/* Right: signup button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/event/${ev.id}`)
                    }}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 20,
                      background: '#C9A96E',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    立即报名
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* TabBar */}
      <TabBar active="discover" />
    </div>
  )
}
