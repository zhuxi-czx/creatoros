import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFeaturedEvents, Event } from '../services/event'
import { getBanners, Banner } from '../services/banner'
import { getVenues, Venue } from '../services/venue'
import TabBar from '../components/TabBar'

const ACCENT = '#C9A96E'

const VENUE_GRADIENTS = [
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #06B6D4, #3B82F6)',
  'linear-gradient(135deg, #F97316, #EF4444)',
  'linear-gradient(135deg, #10B981, #06B6D4)',
]

const EVENT_GRADIENTS = [
  'linear-gradient(135deg, #F97316, #EF4444)',
  'linear-gradient(135deg, #06B6D4, #3B82F6)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #10B981, #06B6D4)',
]

export default function Home() {
  const navigate = useNavigate()
  const [banners, setBanners] = useState<Banner[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [featured, setFeatured] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [currentBanner, setCurrentBanner] = useState(0)
  const bannerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    Promise.allSettled([getBanners(), getVenues(), getFeaturedEvents()])
      .then(([b, v, f]) => {
        if (b.status === 'fulfilled') setBanners(b.value)
        if (v.status === 'fulfilled') setVenues(v.value)
        if (f.status === 'fulfilled') setFeatured(f.value)
      })
      .finally(() => setLoading(false))
  }, [])

  // Auto-rotate banners
  const scrollToBanner = useCallback((index: number) => {
    if (bannerRef.current) {
      const width = bannerRef.current.offsetWidth
      bannerRef.current.scrollTo({ left: width * index, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    timerRef.current = setInterval(() => {
      setCurrentBanner(prev => {
        const next = (prev + 1) % banners.length
        scrollToBanner(next)
        return next
      })
    }, 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [banners.length, scrollToBanner])

  const handleBannerScroll = () => {
    if (!bannerRef.current) return
    const { scrollLeft, offsetWidth } = bannerRef.current
    const index = Math.round(scrollLeft / offsetWidth)
    setCurrentBanner(index)
    // Reset auto-rotate timer on manual scroll
    if (timerRef.current) clearInterval(timerRef.current)
    if (banners.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentBanner(prev => {
          const next = (prev + 1) % banners.length
          scrollToBanner(next)
          return next
        })
      }, 4000)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: '#F7F7F7',
    }}>
      {/* Nav Bar */}
      <div style={{
        height: 44,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A' }}>首页</span>
      </div>

      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: '#F7F7F7',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 100,
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <div style={{
              width: 28,
              height: 28,
              border: '3px solid #E0E0E0',
              borderTop: `3px solid ${ACCENT}`,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : (
          <>
            {/* Banner Carousel */}
            {banners.length > 0 && (
              <div style={{ position: 'relative' }}>
                <div
                  ref={bannerRef}
                  onScroll={handleBannerScroll}
                  style={{
                    display: 'flex',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                  {banners.map((banner) => (
                    <div
                      key={banner.id}
                      style={{
                        flexShrink: 0,
                        width: '100%',
                        height: 180,
                        scrollSnapAlign: 'start',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 90,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: 16,
                      }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                          {banner.title}
                        </div>
                        {banner.subtitle && (
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                            {banner.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Dot indicators */}
                {banners.length > 1 && (
                  <div style={{
                    position: 'absolute',
                    bottom: 10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 5,
                  }}>
                    {banners.map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: currentBanner === i ? 16 : 6,
                          height: 6,
                          borderRadius: 3,
                          background: currentBanner === i ? '#fff' : 'rgba(255,255,255,0.5)',
                          transition: 'all 0.3s ease',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Feature Icons Row */}
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 16,
              margin: '0',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
              }}>
                {[
                  {
                    label: '主题分享',
                    icon: (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    ),
                  },
                  {
                    label: '活动策划',
                    icon: (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <path d="M9 16l2 2 4-4" />
                      </svg>
                    ),
                  },
                  {
                    label: 'PlanF',
                    icon: (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                        <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                      </svg>
                    ),
                  },
                  {
                    label: 'Creator',
                    icon: (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
                      </svg>
                    ),
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    {item.icon}
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Venue Cards Section */}
            {venues.length > 0 && (
              <div style={{
                padding: '16px 0 0',
              }}>
                <div style={{
                  overflowX: 'auto',
                  display: 'flex',
                  gap: 12,
                  padding: '0 16px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}>
                  {venues.map((venue, i) => (
                    <div
                      key={venue.id}
                      onClick={() => navigate(`/venue/${venue.id}`)}
                      style={{
                        flexShrink: 0,
                        width: 'calc((100vw - 12px - 32px) / 2)',
                        height: 160,
                        background: '#fff',
                        borderRadius: 12,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div style={{
                        padding: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {venue.name}
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: 4 }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        {venue.coverUrl ? (
                          <img
                            src={venue.coverUrl}
                            alt={venue.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: VENUE_GRADIENTS[i % VENUE_GRADIENTS.length],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                              <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 精彩活动 Section */}
            <div style={{ marginTop: 20 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                marginBottom: 12,
              }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: '#1A1A1A' }}>精彩活动</span>
                <span
                  onClick={() => navigate('/discover')}
                  style={{ fontSize: 13, color: '#999', cursor: 'pointer' }}
                >查看更多</span>
              </div>
              {featured.length > 0 ? (
                <div style={{
                  overflowX: 'auto',
                  display: 'flex',
                  gap: 10,
                  padding: '0 16px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}>
                  {featured.map((ev, i) => (
                    <div
                      key={ev.id}
                      onClick={() => navigate(`/event/${ev.id}`)}
                      style={{
                        flexShrink: 0,
                        width: 140,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 140,
                        height: 180,
                        borderRadius: 8,
                        overflow: 'hidden',
                      }}>
                        {ev.coverUrl ? (
                          <img
                            src={ev.coverUrl}
                            alt={ev.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: EVENT_GRADIENTS[i % EVENT_GRADIENTS.length],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 12,
                          }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', textAlign: 'center', lineHeight: 1.4 }}>
                              {ev.title}
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#333',
                        marginTop: 8,
                        lineHeight: 1.4,
                        width: 140,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {ev.title}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: '#999',
                  fontSize: 14,
                }}>
                  暂无精彩活动
                </div>
              )}
            </div>

            {/* Bottom spacer */}
            <div style={{ height: 20 }} />
          </>
        )}
      </div>

      {/* TabBar */}
      <TabBar active="home" />
    </div>
  )
}
