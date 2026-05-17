import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import EventCard from '../../components/EventCard'
import { getEvents, getFeatured } from '../../services/event'
import type { Event } from '../../services/event'
import './index.scss'

export default function Index() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [featured, upcoming] = await Promise.all([
        getFeatured(),
        getEvents({ status: 'upcoming', limit: 10 })
      ])
      setFeaturedEvents(featured)
      setUpcomingEvents(upcoming)
    } catch (err) {
      console.error('Failed to load data', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEventTap = (eventId: number) => {
    Taro.navigateTo({ url: `/pages/event-detail/index?id=${eventId}` })
  }

  const handleVenueTap = () => {
    Taro.navigateTo({ url: '/pages/venue/index' })
  }

  return (
    <View className="index-page">
      {/* Header */}
      <View className="header">
        <Text className="logo-text">CreatorOS</Text>
        <Text className="header-subtitle">创作者社区</Text>
      </View>

      {/* Venue Card */}
      <View className="section">
        <View className="section-header">
          <Text className="section-title">线下社区</Text>
        </View>
        <View className="venue-card" onClick={handleVenueTap}>
          <View className="venue-card-inner">
            <View className="venue-icon">🏢</View>
            <View className="venue-info">
              <Text className="venue-name">CreatorOS Hub</Text>
              <Text className="venue-address">上海市静安区</Text>
              <Text className="venue-desc">创作者聚集地，共享工作空间</Text>
            </View>
            <Text className="venue-arrow">›</Text>
          </View>
        </View>
      </View>

      {/* Featured Events */}
      <View className="section">
        <View className="section-header">
          <Text className="section-title">社区精选</Text>
        </View>
        <ScrollView scrollX className="featured-scroll">
          {featuredEvents.length === 0 && !loading && (
            <View className="empty-tip">
              <Text>暂无精选活动</Text>
            </View>
          )}
          {featuredEvents.map(event => (
            <View key={event.id} className="featured-item" onClick={() => handleEventTap(event.id)}>
              <EventCard event={event} featured />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Upcoming Events */}
      <View className="section">
        <View className="section-header">
          <Text className="section-title">即将开始</Text>
          <Text className="section-more">查看全部</Text>
        </View>
        {loading && (
          <View className="loading-tip">
            <Text>加载中...</Text>
          </View>
        )}
        {!loading && upcomingEvents.length === 0 && (
          <View className="empty-tip">
            <Text>暂无活动</Text>
          </View>
        )}
        {upcomingEvents.map(event => (
          <View key={event.id} onClick={() => handleEventTap(event.id)}>
            <EventCard event={event} />
          </View>
        ))}
      </View>
    </View>
  )
}
