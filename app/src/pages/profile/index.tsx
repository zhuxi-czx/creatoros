import { useState, useEffect } from 'react'
import { View, Text, Image, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../stores/useAuthStore'
import { wxLogin } from '../../services/auth'
import { getMySignups, updateProfile } from '../../services/user'
import { uploadImage } from '../../services/api'
import type { SignupRecord } from '../../services/user'
import './index.scss'

export default function Profile() {
  const { token, user, login, logout, updateUser } = useAuthStore()
  const [signups, setSignups] = useState<SignupRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [tempAvatar, setTempAvatar] = useState('')
  const [nickname, setNickname] = useState('')

  useEffect(() => {
    if (token) {
      loadSignups()
    }
  }, [token])

  const loadSignups = async () => {
    try {
      setLoading(true)
      const data = await getMySignups()
      setSignups(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load signups', err)
    } finally {
      setLoading(false)
    }
  }

  const onChooseAvatar = (e: any) => {
    const url = e?.detail?.avatarUrl
    if (url) setTempAvatar(url)
  }

  const handleLogin = async () => {
    try {
      setLoggingIn(true)
      // 1. 微信登录拿账号
      const res = await wxLogin()
      login(res.accessToken, res.user)

      // 2. 若用户选了头像/填了昵称，上传并保存（可跳过）
      if (tempAvatar || nickname) {
        let avatarUrl = res.user.avatarUrl
        if (tempAvatar) {
          try {
            const up = await uploadImage(tempAvatar, 'avatar')
            avatarUrl = up.url
          } catch (e) {
            // 头像上传失败不阻断登录
          }
        }
        try {
          const updated = await updateProfile({
            ...(avatarUrl ? { avatarUrl } : {}),
            ...(nickname ? { nickname } : {}),
          })
          updateUser(updated)
        } catch (e) { /* 保存失败不阻断登录 */ }
      }

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
          setSignups([])
        }
      }
    })
  }

  const handleEditProfile = () => {
    Taro.navigateTo({ url: '/pages/profile-edit/index' })
  }

  const handleEventTap = (eventId: string) => {
    Taro.navigateTo({ url: `/pages/event-detail/index?id=${eventId}` })
  }

  const displayName = user?.nickname || '未设置昵称'
  const tags = [
    user?.gender === 1 ? '男' : user?.gender === 2 ? '女' : null,
    user?.mbti,
    user?.zodiac,
    user?.generation,
  ].filter(Boolean) as string[]

  return (
    <View className='profile-page'>

      {/* 风景背景图（对齐设计稿）+ 渐变压暗保证白色文字可读 */}
      <Image className='profile-bg' src='/assets/profile-bg.jpg' mode='aspectFill' />
      <View className='profile-bg-overlay' />

      {/* Profile Header */}
      <View className='profile-header'>
        {/* Avatar */}
        <View className='avatar-wrap'>
          {user?.avatarUrl ? (
            <Image className='avatar-img' src={user.avatarUrl} mode='aspectFill' />
          ) : (
            <Text className='avatar-letter'>
              {token ? (displayName[0] || '?') : '👤'}
            </Text>
          )}
        </View>

        {/* Name */}
        <Text className='user-name'>{token ? displayName : '未登录'}</Text>

        {/* City */}
        {user?.city && (
          <View className='city-row'>
            <Text className='city-icon'>📍</Text>
            <Text className='city-text'>{user.city}</Text>
          </View>
        )}

        {/* Tags */}
        {token && tags.length > 0 && (
          <View className='tags-row'>
            {tags.map((tag, i) => (
              <View key={i} className='tag-badge'>
                <Text className='tag-text'>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Content Area（整页原生滚动，不用固定高度 ScrollView）*/}
      <View className='profile-content'>
        {/* Not logged in */}
        {!token && (
          <View className='login-card'>
            <Text className='login-hint'>登录后报名活动，展示你的头像</Text>

            {/* 微信头像选择（可跳过）*/}
            <Button className='avatar-picker' openType='chooseAvatar' onChooseAvatar={onChooseAvatar}>
              {tempAvatar ? (
                <Image className='avatar-preview' src={tempAvatar} mode='aspectFill' />
              ) : (
                <View className='avatar-placeholder'>
                  <Text className='avatar-plus'>＋</Text>
                </View>
              )}
            </Button>
            <Text className='avatar-tip'>点击选择微信头像</Text>

            {/* 昵称（type=nickname 自动联想微信昵称）*/}
            <Input
              className='nickname-input'
              type='nickname'
              placeholder='点击填写昵称'
              value={nickname}
              onInput={(e) => setNickname(e.detail.value)}
            />

            <View
              className={`login-btn ${loggingIn ? 'loading' : ''}`}
              onClick={handleLogin}
            >
              <Text className='login-btn-text'>
                {loggingIn ? '登录中...' : '微信登录'}
              </Text>
            </View>
            <Text className='skip-hint'>不设置也可直接登录，稍后可在编辑资料补充</Text>
          </View>
        )}

        {/* Bio Card */}
        {token && (
          <View className='bio-card'>
            <View className='bio-header'>
              <Text className='bio-title'>个人简介</Text>
              <View className='edit-btn' onClick={handleEditProfile}>
                <Text className='edit-text'>编辑</Text>
              </View>
            </View>
            <Text className='bio-content'>{user?.bio || '暂无简介'}</Text>
          </View>
        )}

        {/* My Signups */}
        {token && (
          <View className='signups-card'>
            <Text className='signups-title'>我参与的</Text>

            {loading ? (
              <View className='loading-wrap'>
                <View className='loading-spinner' />
              </View>
            ) : signups.length === 0 ? (
              <View className='empty-wrap'>
                <Text className='empty-text'>还没有参与过活动</Text>
              </View>
            ) : (
              <View className='signup-list'>
                {signups.map((s, index) => {
                  const eventDate = s.event.date || s.event.startTime
                  const day = eventDate ? new Date(eventDate).getDate() : ''
                  const month = eventDate ? new Date(eventDate).getMonth() + 1 : ''
                  const venueName = s.event.venue?.name ?? ''
                  const venueCity = s.event.venue?.city ?? ''

                  return (
                    <View key={s.id}>
                      <View
                        className='signup-item'
                        onClick={() => handleEventTap(s.eventId)}
                      >
                        {/* Date box */}
                        <View className='date-box'>
                          {eventDate && (
                            <>
                              <Text className='date-month'>{month}月</Text>
                              <Text className='date-day'>{String(day)}</Text>
                            </>
                          )}
                        </View>

                        {/* Event info */}
                        <View className='signup-info'>
                          <Text className='signup-event-title'>{s.event.title}</Text>
                          <Text className='signup-meta'>
                            {[venueCity, venueName].filter(Boolean).join(' · ')}
                          </Text>
                        </View>

                        <Text className='signup-arrow'>{'>'}</Text>
                      </View>

                      {index < signups.length - 1 && <View className='divider' />}
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        )}

        {/* Logout */}
        {token && (
          <View className='logout-btn' onClick={handleLogout}>
            <Text className='logout-text'>退出登录</Text>
          </View>
        )}
      </View>

    </View>
  )
}
