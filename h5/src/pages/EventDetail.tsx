import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { getEventDetail, getEventSignups, signup, cancelSignup, Event, Participant } from '../services/event'
import ImageCarousel from '../components/ImageCarousel'

const AVATAR_COLORS = ['#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#10B981', '#EF4444']

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const isLoggedIn = !!localStorage.getItem('h5_token')

  const getUserId = () => {
    try {
      const profile = localStorage.getItem('h5_profile')
      if (profile) return JSON.parse(profile).id
    } catch {}
    return undefined
  }

  const fetchAll = useCallback(async () => {
    if (!id) return
    const userId = getUserId()
    const [eventResult, signupsResult] = await Promise.allSettled([
      getEventDetail(id, userId),
      getEventSignups(id),
    ])
    if (eventResult.status === 'fulfilled') setEvent(eventResult.value)
    if (signupsResult.status === 'fulfilled') {
      setParticipants(Array.isArray(signupsResult.value) ? signupsResult.value : [])
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchAll().finally(() => setLoading(false))
  }, [id, fetchAll])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleSignup = async () => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    if (!id) return
    setActionLoading(true)
    try {
      if (event?.isSignedUp) {
        await cancelSignup(id)
        showToast('已取消报名')
      } else {
        await signup(id)
        showToast('报名成功！')
      }
      // Refetch event and participants
      await fetchAll()
    } catch {
      showToast('操作失败，请重试')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  )

  if (!event) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="empty-state">活动不存在</div>
    </div>
  )

  const isPublished = event.status === 'PUBLISHED'
  const isFull = event.status === 'FULL'
  const isEnded = ['ENDED', 'CANCELLED'].includes(event.status)
  const isSignedUp = event.isSignedUp ?? false
  const signupCount = event._count?.signups ?? participants.length

  // Determine event date to display
  const eventDate = event.date || event.startTime

  // Price: divide by 100 if likely stored in fen, show yuan
  const priceDisplay = event.price == null
    ? '免费'
    : event.price === 0
    ? '免费'
    : `¥${(event.price / 100).toFixed(0)}`

  return (
    <div className="page-container" style={{ paddingBottom: 90 }}>
      {/* Cover */}
      <div style={{ position: 'relative', height: 260, flexShrink: 0 }}>
        {event.imageUrls && event.imageUrls.length > 1 ? (
          <ImageCarousel
            images={event.imageUrls}
            autoplay={event.autoplay}
            interval={event.interval || 3000}
            height={260}
          />
        ) : event.coverUrl || (event.imageUrls && event.imageUrls.length === 1) ? (
          <img src={event.imageUrls?.[0] || event.coverUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }} />
        )}
        {/* Overlay nav buttons */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '48px 16px 0',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <IconButton onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </IconButton>
          <IconButton onClick={() => showToast('分享链接已复制')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </IconButton>
        </div>
        {/* Status badge */}
        <div style={{ position: 'absolute', bottom: 14, right: 14 }}>
          <span style={{
            padding: '4px 10px',
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            color: isPublished ? '#8B5CF6' : '#999',
          }}>
            {isPublished ? '报名中' : isFull ? '报名已满' : '已结束'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 16px 0' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A1A', lineHeight: 1.3, letterSpacing: -0.5 }}>
          {event.title}
        </h1>

        {event.description && (
          <p style={{ marginTop: 12, fontSize: 14, color: '#666', lineHeight: 1.7 }}>
            {event.description}
          </p>
        )}

        {/* Info rows */}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {eventDate && (
            <DetailRow icon={<CalendarIcon />} label="时间">
              {dayjs(eventDate).format('YYYY年MM月DD日 HH:mm')}
              {event.endTime && ` — ${dayjs(event.endTime).format('HH:mm')}`}
            </DetailRow>
          )}
          {event.venue && (
            <DetailRow icon={<MapPinIcon />} label="地点">
              {event.venue.name}
              {event.venue.address && (
                <span style={{ color: '#999', fontSize: 12, display: 'block', marginTop: 2 }}>
                  {event.venue.address}
                </span>
              )}
            </DetailRow>
          )}
          {event.hostName && (
            <DetailRow icon={<UserIcon />} label="主办方">{event.hostName}</DetailRow>
          )}
          <DetailRow icon={<TicketIcon />} label="费用">{priceDisplay}</DetailRow>
          {event.maxParticipants && (
            <DetailRow icon={<UsersIcon />} label="名额">
              {signupCount}/{event.maxParticipants} 人
            </DetailRow>
          )}
        </div>

        {/* Participants */}
        {signupCount > 0 && (
          <div style={{ marginTop: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', marginBottom: 12 }}>
              参与者 ({signupCount})
            </h3>
            <div style={{ display: 'flex' }}>
              {participants.slice(0, 8).map((p, i) => (
                <div key={p.id} style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '2px solid #fff',
                  marginLeft: i > 0 ? -10 : 0,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: p.avatarUrl ? undefined : AVATAR_COLORS[i % AVATAR_COLORS.length],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  color: '#fff',
                  fontWeight: 600,
                }}>
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt={p.nickname ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (p.nickname?.[0] ?? String.fromCharCode(65 + i))
                  )}
                </div>
              ))}
              {signupCount > 8 && (
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#F5F5F7',
                  border: '2px solid #fff',
                  marginLeft: -10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: '#999',
                  flexShrink: 0,
                }}>
                  +{signupCount - 8}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom button */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0))',
        background: '#fff',
        borderTop: '1px solid #F0F0F0',
        zIndex: 100,
      }}>
        {isEnded ? (
          <div style={{
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            background: '#F5F5F7',
            color: '#999',
            fontSize: 16,
            fontWeight: 600,
            textAlign: 'center',
          }}>活动已结束</div>
        ) : !isLoggedIn ? (
          <button
            onClick={() => navigate('/login')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            登录后报名
          </button>
        ) : isFull && !isSignedUp ? (
          <div style={{
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            background: '#F5F5F7',
            color: '#999',
            fontSize: 16,
            fontWeight: 600,
            textAlign: 'center',
          }}>报名已满</div>
        ) : (
          <button
            onClick={handleSignup}
            disabled={actionLoading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              background: isSignedUp ? '#F5F5F7' : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              color: isSignedUp ? '#666' : '#fff',
              fontSize: 16,
              fontWeight: 600,
              opacity: actionLoading ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {actionLoading ? '处理中...' : isSignedUp ? '取消报名' : '立即报名'}
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: 999,
          fontSize: 14,
          whiteSpace: 'nowrap',
          zIndex: 9999,
          backdropFilter: 'blur(8px)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function IconButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#333',
    }}>
      {children}
    </button>
  )
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: '#F5F5F7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: '#8B5CF6',
      }}>
        {icon}
      </div>
      <div style={{ paddingTop: 2 }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 500 }}>{children}</div>
      </div>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function TicketIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
