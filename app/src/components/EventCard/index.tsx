import { View, Text, Image } from '@tarojs/components'
import type { Event } from '../../services/event'
import { resolveImageUrl } from '../../services/api'
import { formatDate } from '../../utils'
import { getEventDisplay } from '../../utils/eventStatus'
import './index.scss'

const AVATAR_COLORS = ['#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#10B981', '#3B82F6']
const COVER_COLORS = [
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #06B6D4, #3B82F6)',
  'linear-gradient(135deg, #F97316, #EF4444)',
  'linear-gradient(135deg, #10B981, #06B6D4)',
]

interface EventCardProps {
  event: Event
  onClick?: () => void
}

function hashId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

export default function EventCard({ event, onClick }: EventCardProps) {
  const signupCount = event._count?.signups ?? event.currentParticipants ?? 0
  const status = getEventDisplay(event.date || event.startTime, signupCount, event.maxCapacity || event.maxParticipants)
  const colorIndex = hashId(event.id)
  const signupAvatars = event.signups?.slice(0, 3) ?? []
  const dateStr = event.date || event.startTime
  const formattedDate = dateStr ? formatDate(dateStr, 'short') : ''
  // Compute formatted time (HH:mm)
  const formattedTime = dateStr ? formatDate(dateStr, 'time') : ''
  const displayDate = formattedDate && formattedTime ? `${formattedDate} ${formattedTime}` : formattedDate

  return (
    <View className='event-card' onClick={onClick} hoverClass='card-hover' hoverStayTime={80}>
      {/* Title */}
      <Text className='card-title'>{event.title}</Text>

      {/* Info row */}
      <View className='card-info-row'>
        {dateStr && (
          <View className='info-item'>
            <Text className='info-icon-text'>🕐</Text>
            <Text className='info-label'>{displayDate}</Text>
          </View>
        )}
        <View className='info-item'>
          <View className='status-dot' style={{ background: status.color }} />
          <Text className='info-label' style={{ color: status.color }}>{status.label}</Text>
        </View>
        {(event.venue?.name || event.location) && (
          <View className='info-item'>
            <Text className='info-icon-text'>📍</Text>
            <Text className='info-label'>{event.venue?.name || event.location}</Text>
          </View>
        )}
      </View>

      {/* Cover */}
      <View className='card-cover'>
        {event.coverUrl ? (
          <Image className='cover-image' src={resolveImageUrl(event.coverUrl)} mode='aspectFill' lazyLoad />
        ) : (
          <View
            className='cover-placeholder'
            style={{ background: COVER_COLORS[colorIndex % COVER_COLORS.length] }}
          >
            <Text className='cover-text'>{event.title.slice(0, 2)}</Text>
          </View>
        )}
      </View>

      {/* Bottom row */}
      <View className='card-bottom'>
        {/* Left: avatar stack + count */}
        <View className='bottom-left'>
          <View
            className='avatar-stack'
            style={{
              width: signupAvatars.length > 0
                ? `${signupAvatars.length * 40 + 16}rpx`
                : signupCount > 0
                  ? `${Math.min(3, signupCount) * 40 + 16}rpx`
                  : '0',
            }}
          >
            {signupAvatars.length > 0 ? (
              signupAvatars.map((s, i) => (
                <View
                  key={s.user.id}
                  className='avatar-circle'
                  style={{
                    left: `${i * 40}rpx`,
                    zIndex: 3 - i,
                    background: s.user.avatarUrl ? undefined : AVATAR_COLORS[i % AVATAR_COLORS.length],
                  }}
                >
                  {s.user.avatarUrl ? (
                    <Image className='avatar-img' src={resolveImageUrl(s.user.avatarUrl)} mode='aspectFill' />
                  ) : null}
                </View>
              ))
            ) : signupCount > 0 ? (
              [0, 1, 2].slice(0, Math.min(3, signupCount)).map((i) => (
                <View
                  key={i}
                  className='avatar-circle'
                  style={{
                    left: `${i * 40}rpx`,
                    zIndex: 3 - i,
                    background: AVATAR_COLORS[(colorIndex + i) % AVATAR_COLORS.length],
                  }}
                />
              ))
            ) : null}
          </View>
          {signupCount > 0 && (
            <Text className='signup-count'>{signupCount}人已报名</Text>
          )}
        </View>

        {/* Right: signup button */}
        <View className='signup-btn'>
          <Text className='signup-btn-text'>立即报名</Text>
        </View>
      </View>
    </View>
  )
}
