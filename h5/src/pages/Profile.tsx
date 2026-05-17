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
        else setProfile(MOCK_PROFILE)
        if (signupsResult.status === 'fulfilled') setSignups(Array.isArray(signupsResult.value) ? signupsResult.value : [])
        else setSignups(MOCK_SIGNUPS)
      })
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  const handleLogout = () => {
    localStorage.removeItem('h5_token')
    navigate('/')
  }

  return (
    <div className="page-container page-with-tabs">
      {/* Cover */}
      <div style={{
        height: 200,
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 60%, #F97316 100%)',
        position: 'relative',
      }} />

      {/* Profile section */}
      <div style={{ padding: '0 20px' }}>
        {/* Avatar row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 14,
          marginTop: -36,
          marginBottom: 16,
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: isLoggedIn && profile?.avatar ? undefined : 'linear-gradient(135deg, #7C3AED, #DB2777)',
            border: '3px solid #fff',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            color: '#fff',
            fontWeight: 700,
          }}>
            {profile?.avatar ? (
              <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              isLoggedIn ? (profile?.name?.[0] ?? '?') : '?'
            )}
          </div>
          <div style={{ paddingBottom: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A' }}>
              {profile?.name ?? (isLoggedIn ? '加载中…' : '未登录')}
            </div>
            {profile?.city && (
              <div style={{ fontSize: 13, color: '#999', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                <span>📍</span> {profile.city}
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {isLoggedIn && profile && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              profile.gender,
              profile.mbti,
              profile.zodiac,
              profile.generation,
            ].filter(Boolean).map((tag, i) => (
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
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 24 }}>
            {profile.bio}
          </p>
        )}

        {/* Not logged in state */}
        {!isLoggedIn && !loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
            <p style={{ fontSize: 15, color: '#666', marginBottom: 24 }}>登录后查看完整个人资料</p>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '12px 32px',
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
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 14 }}>
              我参与的
            </h3>
            {loading ? (
              <div className="spinner" />
            ) : signups.length === 0 ? (
              <div className="empty-state">还没有参与过活动</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {signups.map((s) => (
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
                      overflow: 'hidden',
                    }}>
                      {s.event.coverUrl && (
                        <img src={s.event.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.event.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 3 }}>
                        {dayjs(s.event.startTime).format('MM月DD日')} · {s.event.location}
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                ))}
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

const MOCK_PROFILE: UserProfile = {
  id: 'mock-user',
  name: 'Alex 创作者',
  city: '北京',
  bio: '热爱创造，关注 AI、设计和产品。正在探索创作者经济的边界。',
  gender: '男',
  mbti: 'INTJ',
  zodiac: '天蝎座',
  generation: '90后',
}

const MOCK_SIGNUPS: SignupRecord[] = [
  {
    id: 's-1',
    eventId: 'mock-1',
    event: {
      id: 'mock-1',
      title: '创作者见面会 Vol.3',
      startTime: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
      location: '北京 · 三里屯',
      status: 'open',
    },
    createdAt: new Date().toISOString(),
  },
]
