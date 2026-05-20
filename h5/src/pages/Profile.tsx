import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { getProfile, getMySignups, UserProfile, SignupRecord } from '../services/user'
import { TabBar } from './Home'

const TAG_COLORS = ['#8B5CF6', '#EC4899', '#F97316', '#06B6D4']

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [signups, setSignups] = useState<SignupRecord[]>([])
  const [loading, setLoading] = useState(true)

  const isLoggedIn = !!localStorage.getItem('h5_token')

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }
    Promise.allSettled([getProfile(), getMySignups()])
      .then(([profileResult, signupsResult]) => {
        if (profileResult.status === 'fulfilled') setProfile(profileResult.value)
        if (signupsResult.status === 'fulfilled') {
          setSignups(Array.isArray(signupsResult.value) ? signupsResult.value : [])
        }
      })
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  const handleLogout = () => {
    localStorage.removeItem('h5_token')
    navigate('/')
  }

  // Normalize profile fields: API may return nickname or name
  const displayName = profile?.nickname || profile?.name
  const displayAvatar = profile?.avatarUrl || profile?.avatar

  return (
    <div className="page-container page-with-tabs">
      {/* Cover gradient */}
      <div style={{
        height: 180,
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 60%, #F97316 100%)',
        position: 'relative',
        flexShrink: 0,
      }} />

      {/* Avatar — overlapping cover */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isLoggedIn ? 'flex-start' : 'center',
        padding: isLoggedIn ? '0 20px' : '0',
        marginTop: -40,
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: displayAvatar ? undefined : 'linear-gradient(135deg, #7C3AED, #DB2777)',
          border: '3px solid #fff',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 30,
          color: '#fff',
          fontWeight: 700,
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        }}>
          {displayAvatar ? (
            <img src={displayAvatar} alt={displayName ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            isLoggedIn ? (displayName?.[0] ?? '?') : (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )
          )}
        </div>

        {/* Name */}
        <div style={{ marginTop: 10, textAlign: isLoggedIn ? 'left' : 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A' }}>
            {displayName ?? (isLoggedIn ? '加载中…' : '未登录')}
          </div>
          {profile?.city && (
            <div style={{ fontSize: 12, color: '#999', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3, justifyContent: isLoggedIn ? 'flex-start' : 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              {profile.city}
            </div>
          )}
        </div>
      </div>

      {/* Profile section */}
      <div style={{ padding: '0 20px' }}>
        {/* Tags */}
        {isLoggedIn && profile && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14, marginBottom: 16 }}>
            {[profile.gender, profile.mbti, profile.zodiac, profile.generation]
              .filter(Boolean)
              .map((tag, i) => (
                <span key={i} style={{
                  padding: '4px 12px',
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 500,
                  background: `${TAG_COLORS[i % TAG_COLORS.length]}18`,
                  color: TAG_COLORS[i % TAG_COLORS.length],
                }}>
                  {tag}
                </span>
              ))}
          </div>
        )}

        {/* Bio */}
        {profile?.bio && (
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 24, marginTop: isLoggedIn && !profile.gender ? 14 : 0 }}>
            {profile.bio}
          </p>
        )}

        {/* Not logged in state */}
        {!isLoggedIn && !loading && (
          <div style={{ textAlign: 'center', padding: '24px 0 40px' }}>
            <p style={{ fontSize: 15, color: '#666', marginBottom: 24 }}>登录后查看完整个人资料</p>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '12px 40px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              去登录
            </button>
          </div>
        )}

        {/* My signups */}
        {isLoggedIn && (
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', marginBottom: 14 }}>
              我参与的
            </h3>
            {loading ? (
              <div className="spinner" />
            ) : signups.length === 0 ? (
              <div className="empty-state">还没有参与过活动</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {signups.map((s) => {
                  const eventDate = s.event.date || s.event.startTime
                  const venueName = s.event.venue?.name ?? ''
                  const venueCity = s.event.venue?.city ?? ''
                  const locationText = [venueCity, venueName].filter(Boolean).join(' · ')
                  return (
                    <div
                      key={s.id}
                      onClick={() => navigate(`/event/${s.eventId}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        background: '#F5F5F7',
                        borderRadius: 14,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: 11,
                        fontWeight: 600,
                        textAlign: 'center',
                        lineHeight: 1.3,
                        padding: '4px',
                      }}>
                        {eventDate && (
                          <span>{dayjs(eventDate).format('MM/DD')}</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.event.title}
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {eventDate && dayjs(eventDate).format('MM月DD日')}
                          {locationText && ` · ${locationText}`}
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                marginTop: 32,
                width: '100%',
                padding: '13px',
                borderRadius: 14,
                background: '#F5F5F7',
                color: '#999',
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              退出登录
            </button>
          </div>
        )}
      </div>

      <TabBar active="profile" />
    </div>
  )
}
