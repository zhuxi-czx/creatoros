import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getEvents } from '../../services/event'
import type { Event } from '../../services/event'
import EventCard from '../../components/EventCard'
import './index.scss'

const TAGS = ['全部', '音乐', '品鉴', '沙龙', '脱口秀', '派对']

export default function Discover() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState('全部')

  useEffect(() => {
    loadEvents()
  }, [selectedTag])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const res = await getEvents(1, 20)
      const data = res?.data ?? []
      if (selectedTag === '全部') {
        setEvents(data)
      } else {
        setEvents(data.filter(ev => ev.tags?.includes(selectedTag)))
      }
    } catch (err) {
      console.error('Failed to load events', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEventTap = (eventId: string) => {
    Taro.navigateTo({ url: `/pages/event-detail/index?id=${eventId}` })
  }

  return (
    <View className='discover-page'>

      {/* Tag Filter Row */}
      <View className='tag-bar'>
        <ScrollView scrollX className='tag-scroll' enableFlex>
          {TAGS.map((tag) => {
            const isActive = selectedTag === tag
            return (
              <View
                key={tag}
                className={`tag-item ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag)}
              >
                <Text className={`tag-text ${isActive ? 'active' : ''}`}>{tag}</Text>
              </View>
            )
          })}
        </ScrollView>
      </View>

      {/* Activity Card List */}
      <View className='event-list'>
        {loading ? (
          <>
            <View className='card-skeleton'>
              <View className='skeleton-title' />
              <View className='skeleton-info' />
              <View className='skeleton-cover' />
              <View className='skeleton-bottom' />
            </View>
            <View className='card-skeleton'>
              <View className='skeleton-title' />
              <View className='skeleton-info' />
              <View className='skeleton-cover' />
              <View className='skeleton-bottom' />
            </View>
          </>
        ) : events.length === 0 ? (
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
    </View>
  )
}
