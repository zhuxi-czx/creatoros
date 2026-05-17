import { View, Text } from '@tarojs/components'
import type { Event } from '../../services/event'
import { formatDate } from '../../utils'
import './index.scss'

const GRADIENT_COLORS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #3b82f6, #6366f1)'
]

interface EventCardProps {
  event: Event
  featured?: boolean
}

export default function EventCard({ event, featured = false }: EventCardProps) {
  const gradientIndex = event.id % GRADIENT_COLORS.length
  const gradient = event.coverColor || GRADIENT_COLORS[gradientIndex]

  const statusText = {
    upcoming: '即将开始',
    ongoing: '进行中',
    ended: '已结束'
  }[event.status] || ''

  return (
    <View className={`event-card ${featured ? 'featured' : ''}`}>
      <View className="card-gradient" style={{ background: gradient }}>
        <View className={`status-badge status-${event.status}`}>
          <Text>{statusText}</Text>
        </View>
        <Text className="event-title">{event.title}</Text>
        {event.description && (
          <Text className="event-desc">{event.description}</Text>
        )}
      </View>
      <View className="card-body">
        <View className="meta-row">
          <Text className="meta-icon">📅</Text>
          <Text className="meta-text">{formatDate(event.startTime)}</Text>
        </View>
        <View className="meta-row">
          <Text className="meta-icon">📍</Text>
          <Text className="meta-text">{event.location}</Text>
        </View>
        <View className="card-footer">
          <View className="host-info">
            <View className="host-avatar">
              <Text>{event.hostName?.charAt(0) || '?'}</Text>
            </View>
            <Text className="host-name">{event.hostName}</Text>
          </View>
          <View className="count-badge">
            <Text>👥 {event.signupCount}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
