import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { getEventDetail, signup, cancelSignup, Event } from '../services/event'

const AVATAR_COLORS = ['#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#10B981', '#EF4444']

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [signedUp, setSignedUp] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const isLoggedIn = !!localStorage.getItem('h5_token')

  useEffect(() => {
    if (!id) return
    getEventDetail(id)
      .then(setEvent)
      .catch(() => setEvent(MOCK_EVENT))
      .finally(() => setLoading(false))
  }, [id])

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
      if (signedUp) {
        await cancelSignup(id)
        setSignedUp(false)
        showToast('已取消报名')
      } else {
        await signup(id)
        setSignedUp(true)
        showToast('报名成功！')
      }
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

  const isFull = event.status === 'full'
  const isEnded = event.status === 'ended'

  return (
    <div className="page-container" style={{ paddingBottom: 90 }}>
      {/* Cover */}
      <div style={{ position: 'relative', height: 260 }}>
        {event.coverUrl ? (
          <img src={event.coverUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 64 }}>🎯</span>
          </div>
        )}
        {/* Overlay buttons */}
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
          <span className={`badge ${event.status === 'open' ? 'badge-open' : event.status === 'full' ? 'badge-full' : 'badge-ended'}`}
            style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>
            {event.status === 'open' ? '报名中' : event.status === 'full' ? '报名已满' : '已结束'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 20px 0' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', lineHeight: 1.3, letterSpacing: -0.5 }}>
          {event.title}
        </h1>

        {event.description && (
          <p style={{ marginTop: 12, fontSize: 14, color: '#666', lineHeight: 1.7 }}>
            {event.description}
          </p>
        )}

        {/* Info rows */}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DetailRow icon="📅" label="时间">
            {dayjs(event.startTime).format('YYYY年MM月DD日 HH:mm')}
            {event.endTime && ` — ${dayjs(event.endTime).format('HH:mm')}`}
          </DetailRow>
          <DetailRow icon="📍" label="地点">{event.location}</DetailRow>
          {event.hostName && <DetailRow icon="👤" label="主办方">{event.hostName}</DetailRow>}
          <DetailRow icon="💰" label="费用">
            {event.price ? `¥${event.price}` : '免费'}
          </DetailRow>
          {event.maxParticipants && (
            <DetailRow icon="👥" label="名额">
              {event.currentParticipants ?? 0}/{event.maxParticipants} 人
            </DetailRow>
          )}
        </div>

        {/* Participants */}
        {(event.currentParticipants ?? 0) > 0 && (
          <div style={{ marginTop: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', marginBottom: 12 }}>
              参与者 ({event.currentParticipants})
            </h3>
            <div style={{ display: 'flex', gap: -8 }}>
              {Array.from({ length: Math.min(event.currentParticipants ?? 0, 8) }).map((_, i) => (
                <div key={i} style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  border: '2px solid #fff',
                  marginLeft: i > 0 ? -10 : 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  color: '#fff',
                  fontWeight: 600,
                }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              {(event.currentParticipants ?? 0) > 8 && (
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
                }}>
                  +{(event.currentParticipants ?? 0) - 8}
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
        padding: '12px 20px',
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
            fontSize: 15,
            fontWeight: 600,
            textAlign: 'center',
          }}>活动已结束</div>
        ) : (
          <button
            onClick={handleSignup}
            disabled={actionLoading || (isFull && !signedUp)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              background: signedUp ? '#F5F5F7' : isFull ? '#F5F5F7' : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              color: signedUp ? '#666' : isFull ? '#999' : '#fff',
              fontSize: 16,
              fontWeight: 600,
              opacity: actionLoading ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {actionLoading ? '处理中...' : signedUp ? '取消报名' : isFull ? '名额已满' : '立即报名'}
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

function DetailRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
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
        fontSize: 18,
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

const MOCK_EVENT: Event = {
  id: 'mock-1',
  title: '创作者见面会 Vol.3',
  description: '聚集北京最有趣的创作者，分享各自的创作经历与心得，认识志同道合的伙伴。这是一个开放、轻松的交流氛围，不管你是设计师、程序员、产品人还是内容创作者，只要你热爱创作，这里就是你的地方。',
  location: '北京市朝阳区三里屯街道工体北路8号',
  startTime: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
  status: 'open',
  hostName: 'CreatorOS',
  price: 0,
  currentParticipants: 18,
  maxParticipants: 30,
}
