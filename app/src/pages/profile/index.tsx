import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../stores/useAuthStore'
import { wxLogin } from '../../services/auth'
import { getMySignups } from '../../services/user'
import type { Event } from '../../services/event'
import EventCard from '../../components/EventCard'
import './index.scss'

export default function Profile() {
  const { token, user, login, logout } = useAuthStore()
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)

  useEffect(() => {
    if (token) {
      loadMyEvents()
    }
  }, [token])

  const loadMyEvents = async () => {
    try {
      setLoading(true)
      const events = await getMySignups()
      setMyEvents(events)
    } catch (err) {
      console.error('Failed to load signups', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    try {
      setLoggingIn(true)
      const { token: newToken, user: newUser } = await wxLogin()
      login(newToken, newUser)
      Taro.showToast({ title: '登录成功', icon: 'success' })
    } catch (err) {
      Taro.showToast({ title: '登录失败', icon: 'none' })
    } finally {
      setLoggingIn(false)
    }
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          setMyEvents([])
        }
      }
    })
  }

  const handleEditProfile = () => {
    Taro.navigateTo({ url: '/pages/profile-edit/index' })
  }

  const handleEventTap = (eventId: number) => {
    Taro.navigateTo({ url: `/pages/event-detail/index?id=${eventId}` })
  }

  if (!token) {
    return (
      <View className="profile-page not-logged-in">
        <View className="login-prompt">
          <Text className="login-icon">👤</Text>
          <Text className="login-title">登录后享受更多功能</Text>
          <Text className="login-desc">报名活动、管理个人资料</Text>
          <View
            className={`login-btn ${loggingIn ? 'loading' : ''}`}
            onClick={handleLogin}
          >
            <Text>{loggingIn ? '登录中...' : '微信一键登录'}</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="profile-page">
      <ScrollView scrollY className="scroll-view">
        {/* Profile Header */}
        <View className="profile-header">
          <View className="avatar-container">
            <View className="avatar">
              <Text className="avatar-text">{user?.name?.charAt(0) || '?'}</Text>
            </View>
          </View>
          <Text className="user-name">{user?.name || '未设置昵称'}</Text>
          {user?.bio && <Text className="user-bio">{user.bio}</Text>}
          {user?.tags && user.tags.length > 0 && (
            <View className="tags-row">
              {user.tags.map((tag, i) => (
                <View key={i} className="tag">
                  <Text>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          <View className="edit-btn" onClick={handleEditProfile}>
            <Text>编辑资料</Text>
          </View>
        </View>

        {/* My Events */}
        <View className="section">
          <Text className="section-title">我的活动</Text>
          {loading && <Text className="loading-tip">加载中...</Text>}
          {!loading && myEvents.length === 0 && (
            <View className="empty-state">
              <Text className="empty-icon">📅</Text>
              <Text className="empty-text">还没有报名任何活动</Text>
            </View>
          )}
          {myEvents.map(event => (
            <View key={event.id} onClick={() => handleEventTap(event.id)}>
              <EventCard event={event} />
            </View>
          ))}
        </View>

        {/* Logout */}
        <View className="logout-section">
          <View className="logout-btn" onClick={handleLogout}>
            <Text>退出登录</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
