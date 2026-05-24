import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getVenueDetail, getVenueEvents } from '../../services/venue'
import type { Venue } from '../../services/venue'
import type { Event } from '../../services/event'
import EventCard from '../../components/EventCard'
import './index.scss'

export default function VenuePage() {
  const { id } = Taro.getCurrentInstance().router?.params || {}
  const [venue, setVenue] = useState<Venue | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [v, e] = await Promise.allSettled([
        getVenueDetail(id!),
        getVenueEvents(id!)
      ])
      if (v.status === 'fulfilled') setVenue(v.value)
      if (e.status === 'fulfilled') {
        const data = Array.isArray(e.value) ? e.value : e.value?.data ?? []
        setEvents(data)
      }
    } catch (err) {
      console.error('Failed to load venue', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEventTap = (eventId: string) => {
    Taro.navigateTo({ url: `/pages/event-detail/index?id=${eventId}` })
  }

  if (loading && !venue) {
    return (
      <View className='venue-page loading-state'>
        <View className='loading-spinner' />
        <Text className='loading-text'>加载中...</Text>
      </View>
    )
  }

  return (
    <View className='venue-page'>
      <ScrollView scrollY className='scroll-view'>
        {/* Hero */}
        <View className='venue-hero'>
          {venue?.coverUrl ? (
            <Image className='hero-cover' src={venue.coverUrl} mode='aspectFill' lazyLoad />
          ) : (
            <View className='hero-gradient'>
              <Text className='hero-icon'>🏠</Text>
            </View>
          )}
          <View className='hero-overlay'>
            <Text className='venue-name'>{venue?.name || '场地'}</Text>
            {venue?.city && (
              <Text className='venue-city'>📍 {venue.city}</Text>
            )}
          </View>
        </View>

        {/* Info Card */}
        <View className='info-card'>
          {venue?.address && (
            <View className='info-row'>
              <Text className='info-icon'>📍</Text>
              <View className='info-content'>
                <Text className='info-label'>地址</Text>
                <Text className='info-value'>{venue.address}</Text>
              </View>
            </View>
          )}
          {venue?.description && (
            <View className='info-row'>
              <Text className='info-icon'>📝</Text>
              <View className='info-content'>
                <Text className='info-label'>简介</Text>
                <Text className='info-value'>{venue.description}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Events */}
        <View className='events-section'>
          <Text className='section-title'>场地活动</Text>
          {events.length === 0 ? (
            <View className='empty-state'>
              <Text className='empty-text'>暂无活动</Text>
            </View>
          ) : (
            events.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                onClick={() => handleEventTap(ev.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}
