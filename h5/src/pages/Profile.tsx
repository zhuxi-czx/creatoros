import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { getProfile, getMySignups, UserProfile, SignupRecord } from '../services/user'
import TabBar from '../components/TabBar'

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
        if (profileResult.status === 'fulfilled') {
          setProfile(profileResult.value)
          localStorage.setItem('h5_profile', JSON.stringify(profileResult.value))
        }
        if (signupsResult.status === 'fulfilled') {
          setSignups(Array.isArray(signupsResult.value) ? signupsResult.value : [])
        }
      })
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  const displayName = profile?.nickname || profile?.name
  const displayAvatar = profile?.avatarUrl || profile?.avatar

  const genderIcon = profile?.gender === '男'
    ? '\u2642\uFE0F'
    : profile?.gender === '女'
      ? '\u2640\uFE0F'
      : null

  const tags = [
    genderIcon ? `${genderIcon} ${profile?.gender}` : profile?.gender,
    profile?.mbti,
    profile?.zodiac,
    profile?.generation,
  ].filter(Boolean) as string[]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#F7F7F7',
      position: 'relative',
    }}>
      {/* Background landscape layer */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 260,
        background: 'linear-gradient(135deg, #D4B896 0%, #A8C4B8 50%, #8B9EAF 100%)',
        filter: 'saturate(0.6)',
        zIndex: 0,
      }} />
      {/* Gradient overlay: transparent to #F7F7F7 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 260,
        background: 'linear-gradient(to bottom, transparent 40%, #F7F7F7 100%)',
        zIndex: 1,
      }} />

      {/* Nav Bar */}
      <div style={{
        height: 44,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        background: 'transparent',
        position: 'relative',
        zIndex: 2,
      }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A' }}>我的</span>
      </div>

      {/* Profile Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 16px 24px',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Avatar */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: '3px solid #fff',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: displayAvatar ? '#eee' : 'linear-gradient(135deg, #C9A96E, #E8D5B0)',
          fontSize: 28,
          color: '#fff',
          fontWeight: 700,
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          flexShrink: 0,
        }}>
          {displayAvatar ? (
            <img src={displayAvatar} alt={displayName ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            isLoggedIn ? (displayName?.[0] ?? '?') : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )
          )}
        </div>

        {/* Name */}
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginTop: 12, textAlign: 'center' }}>
          {displayName ?? (isLoggedIn ? '加载中...' : '未登录')}
        </div>

        {/* City */}
        {profile?.city && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span style={{ fontSize: 13, color: '#999' }}>{profile.city}</span>
          </div>
        )}

        {/* Tags */}
        {isLoggedIn && profile && tags.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
            {tags.map((tag, i) => (
              <span key={i} style={{
                padding: '4px 10px',
                borderRadius: 12,
                background: '#F0F0F0',
                fontSize: 11,
                fontWeight: 500,
                color: '#666',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div style={{
        flex: 1,
        background: '#F7F7F7',
        padding: '0 16px 120px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Not logged in state */}
        {!isLoggedIn && !loading && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: '40px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}>
            <p style={{ fontSize: 14, color: '#999', margin: 0 }}>登录后查看完整个人资料</p>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '12px 32px',
                borderRadius: 24,
                background: '#C9A96E',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              去登录
            </button>
          </div>
        )}

        {/* Bio Card */}
        {isLoggedIn && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>个人简介</span>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#C9A96E' }}>编辑</span>
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, margin: 0 }}>
              {profile?.bio || '暂无简介'}
            </p>
          </div>
        )}

        {/* My Signups Card */}
        {isLoggedIn && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>我参与的</span>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                <div style={{
                  width: 24,
                  height: 24,
                  border: '2px solid #F0F0F0',
                  borderTopColor: '#C9A96E',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
              </div>
            ) : signups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <span style={{ fontSize: 14, color: '#999' }}>还没有参与过活动</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {signups.map((s, index) => {
                  const eventDate = s.event.date || s.event.startTime
                  const venueName = s.event.venue?.name ?? ''
                  const venueCity = s.event.venue?.city ?? ''
                  const dateStr = eventDate ? dayjs(eventDate).format('MM月DD日') : ''
                  const locationText = [dateStr, venueCity, venueName].filter(Boolean).join(' \u00B7 ')
                  return (
                    <div key={s.id}>
                      <div
                        onClick={() => navigate(`/event/${s.eventId}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 0',
                          cursor: 'pointer',
                        }}
                      >
                        {/* Date box */}
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          background: '#FDF6EC',
                          flexShrink: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {eventDate && (
                            <>
                              <span style={{ fontSize: 11, fontWeight: 500, color: '#C9A96E', lineHeight: 1.2 }}>
                                {dayjs(eventDate).format('M')}月
                              </span>
                              <span style={{ fontSize: 16, fontWeight: 700, color: '#C9A96E', lineHeight: 1.2 }}>
                                {dayjs(eventDate).format('D')}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Event info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#1A1A1A',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {s.event.title}
                          </div>
                          <div style={{
                            fontSize: 11,
                            color: '#999',
                            marginTop: 3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {locationText}
                          </div>
                        </div>

                        {/* Chevron right */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>

                      {/* Divider */}
                      {index < signups.length - 1 && (
                        <div style={{ height: 0.5, background: '#F0F0F0' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <TabBar active="profile" />
    </div>
  )
}
