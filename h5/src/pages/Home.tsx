import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { getEvents, getFeaturedEvents, Event } from '../services/event'

const VENUE = {
  name: '创造者空间 · 北京',
  address: '北京市朝阳区三里屯街道工体北路8号',
}

const FEATURED_GRADIENTS = [
  'linear-gradient(135deg, #F97316, #EF4444)',
  'linear-gradient(135deg, #06B6D4, #3B82F6)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #10B981, #06B6D4)',
]

export default function Home() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [featured, setFeatured] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([getEvents(1, 10), getFeaturedEvents()])
      .then(([eventsResult, featuredResult]) => {
        if (eventsResult.status === 'fulfilled') {
          const data = eventsResult.value
          setEvents(Array.isArray(data) ? data : (data as { data: Event[] }).data ?? [])
        } else {
          setEvents(MOCK_EVENTS)
        }
        if (featuredResult.status === 'fulfilled') {
          setFeatured(Array.isArray(featuredResult.value) ? featuredResult.value : [])
        } else {
          setFeatured(MOCK_FEATURED)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const statusLabel = (status: Event['status']) => {
    if (status === 'open') return { label: '报名中', cls: 'badge-open' }
    if (status === 'full') return { label: '报名已满', cls: 'badge-full' }
    return { label: '已结束', cls: 'badge-ended' }
  }

  return (
    <div className="page-container page-with-tabs">
      {/* Header */}
      <header style={{
        padding: '16px 20px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid #F5F5F7',
      }}>
        <h1 className="gradient-text" style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
          CreatorOS
        </h1>
        <button style={{ padding: 6, borderRadius: 20 }} aria-label="通知">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </header>

      <div style={{ padding: '0 0 8px' }}>
        {/* 线下社区 section */}
        <section style={{ padding: '20px 20px 0' }}>
          <SectionTitle>线下社区</SectionTitle>
          <div style={{
            marginTop: 12,
            borderRadius: 16,
            overflow: 'hidden',
            background: '#F5F5F7',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}>
            <div style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: 32 }}>🏢</span>
            </div>
            <div style={{ padding: '12px 14px', flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#1A1A1A' }}>{VENUE.name}</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4, lineHeight: 1.4 }}>{VENUE.address}</div>
            </div>
            <div style={{ paddingRight: 14 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </section>

        {/* 社区精选 section */}
        <section style={{ padding: '24px 0 0' }}>
          <div style={{ padding: '0 20px' }}>
            <SectionTitle>社区精选</SectionTitle>
          </div>
          <div className="scroll-x" style={{ padding: '12px 20px 4px', display: 'flex', gap: 12 }}>
            {(featured.length > 0 ? featured : MOCK_FEATURED).map((ev, i) => (
              <div
                key={ev.id}
                onClick={() => navigate(`/event/${ev.id}`)}
                style={{
                  flexShrink: 0,
                  width: 160,
                  height: 100,
                  borderRadius: 14,
                  background: FEATURED_GRADIENTS[i % FEATURED_GRADIENTS.length],
                  padding: '14px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
                  {ev.title}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
                  {dayjs(ev.startTime).format('MM/DD')}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 即将开始 section */}
        <section style={{ padding: '24px 20px 0' }}>
          <SectionTitle>即将开始</SectionTitle>
          {loading ? (
            <div className="spinner" />
          ) : (events.length === 0 ? (
            <div className="empty-state">
              <span>暂无活动</span>
            </div>
          ) : (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {events.map((ev, i) => {
                const { label, cls } = statusLabel(ev.status)
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
                      <span className={`badge ${cls}`} style={{ flexShrink: 0, marginTop: 2 }}>
                        {label}
                      </span>
                    </div>
                    {ev.description && (
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 8, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {ev.description}
                      </p>
                    )}
                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <InfoRow icon="📍" text={ev.location} />
                      <InfoRow icon="📅" text={dayjs(ev.startTime).format('MM月DD日 HH:mm')} />
                      {ev.hostName && <InfoRow icon="👤" text={ev.hostName} />}
                      {ev.currentParticipants !== undefined && (
                        <InfoRow icon="👥" text={`${ev.currentParticipants}${ev.maxParticipants ? `/${ev.maxParticipants}` : ''} 人参与`} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </section>
      </div>

      <TabBar active="home" />
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', letterSpacing: -0.3 }}>
      {children}
    </h2>
  )
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ lineHeight: 1 }}>{text}</span>
    </div>
  )
}

const EVENT_GRADIENTS = [
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #7C3AED, #DB2777)',
  'linear-gradient(135deg, #6D28D9, #BE185D)',
  'linear-gradient(135deg, #5B21B6, #9D174D)',
]

const MOCK_EVENTS: Event[] = [
  {
    id: 'mock-1',
    title: '创作者见面会 Vol.3',
    description: '聚集北京最有趣的创作者，分享各自的创作经历与心得，认识志同道合的伙伴。',
    location: '北京市朝阳区三里屯',
    startTime: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    status: 'open',
    hostName: 'Alex',
    currentParticipants: 18,
    maxParticipants: 30,
  },
  {
    id: 'mock-2',
    title: 'AI 产品人交流沙龙',
    description: '探讨 AI 时代下产品经理的机遇与挑战，碰撞新思路。',
    location: '北京市海淀区中关村',
    startTime: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    status: 'full',
    hostName: 'CreatorOS',
    currentParticipants: 40,
    maxParticipants: 40,
  },
]

const MOCK_FEATURED: Event[] = [
  { id: 'f-1', title: '设计师闪聚', description: '', location: '北京', startTime: '2025-03-15T18:00:00Z', status: 'ended' },
  { id: 'f-2', title: 'Indie Hacker 夜聊', description: '', location: '上海', startTime: '2025-03-20T19:00:00Z', status: 'ended' },
  { id: 'f-3', title: '播客创作者聚会', description: '', location: '深圳', startTime: '2025-04-01T18:00:00Z', status: 'ended' },
]

export function TabBar({ active }: { active: 'home' | 'profile' }) {
  const navigate = useNavigate()
  return (
    <nav className="tab-bar">
      <button className={`tab-bar-item ${active === 'home' ? 'active' : ''}`} onClick={() => navigate('/')}>
        <svg viewBox="0 0 24 24" fill={active === 'home' ? '#8B5CF6' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>首页</span>
      </button>
      <button className={`tab-bar-item ${active === 'profile' ? 'active' : ''}`} onClick={() => navigate('/profile')}>
        <svg viewBox="0 0 24 24" fill={active === 'profile' ? '#8B5CF6' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>我的</span>
      </button>
    </nav>
  )
}
