import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { getEventDetail, signup, cancelSignup } from '../../services/event'
import type { Event } from '../../services/event'
import { useAuthStore } from '../../stores/useAuthStore'
import { formatDate } from '../../utils'
import './index.scss'

export default function EventDetail() {
  const router = useRouter()
  const { token } = useAuthStore()
  const eventId = Number(router.params.id)

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    if (eventId) loadEvent()
  }, [eventId])

  const loadEvent = async () => {
    try {
      setLoading(true)
      const data = await getEventDetail(eventId)
      setEvent(data)
    } catch (err) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!token) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (!event) return
    try {
      setSigning(true)
      if (event.hasSignedUp) {
        await cancelSignup(event.id)
        setEvent({ ...event, hasSignedUp: false, signupCount: event.signupCount - 1 })
        Taro.showToast({ title: '已取消报名', icon: 'success' })
      } else {
        await signup(event.id)
        setEvent({ ...event, hasSignedUp: true, signupCount: event.signupCount + 1 })
        Taro.showToast({ title: '报名成功', icon: 'success' })
      }
    } catch (err) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <View className="loading-page">
        <Text>加载中...</Text>
      </View>
    )
  }

  if (!event) {
    return (
      <View className="loading-page">
        <Text>活动不存在</Text>
      </View>
    )
  }

  return (
    <View className="event-detail-page">
      <ScrollView scrollY className="scroll-view">
        {/* Cover */}
        <View className="cover" style={{ background: event.coverColor || 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <Text className="cover-title">{event.title}</Text>
          <View className={`status-badge status-${event.status}`}>
            <Text>{event.status === 'upcoming' ? '即将开始' : event.status === 'ongoing' ? '进行中' : '已结束'}</Text>
          </View>
        </View>

        <View className="content">
          {/* Info Rows */}
          <View className="info-card">
            <View className="info-row">
              <Text className="info-icon">📅</Text>
              <View className="info-text">
                <Text className="info-label">时间</Text>
                <Text className="info-value">{formatDate(event.startTime)}</Text>
              </View>
            </View>
            <View className="info-row">
              <Text className="info-icon">📍</Text>
              <View className="info-text">
                <Text className="info-label">地点</Text>
                <Text className="info-value">{event.location}</Text>
              </View>
            </View>
            <View className="info-row">
              <Text className="info-icon">👤</Text>
              <View className="info-text">
                <Text className="info-label">主办方</Text>
                <Text className="info-value">{event.hostName}</Text>
              </View>
            </View>
            <View className="info-row">
              <Text className="info-icon">👥</Text>
              <View className="info-text">
                <Text className="info-label">已报名</Text>
                <Text className="info-value">{event.signupCount} / {event.capacity || '不限'}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View className="desc-card">
            <Text className="card-title">活动介绍</Text>
            <Text className="desc-text">{event.description}</Text>
          </View>

          {/* Participants */}
          {event.participants && event.participants.length > 0 && (
            <View className="participants-card">
              <Text className="card-title">参与者</Text>
              <ScrollView scrollX className="participants-scroll">
                {event.participants.map((p, i) => (
                  <View key={i} className="participant-item">
                    <View className="participant-avatar">
                      <Text>{p.name?.charAt(0) || '?'}</Text>
                    </View>
                    <Text className="participant-name">{p.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="bottom-action">
        <View
          className={`signup-btn ${event.hasSignedUp ? 'signed' : ''} ${signing ? 'loading' : ''}`}
          onClick={handleSignup}
        >
          <Text>{signing ? '处理中...' : event.hasSignedUp ? '取消报名' : '立即报名'}</Text>
        </View>
      </View>
    </View>
  )
}
