import { View, Text, Image } from '@tarojs/components'
import type { Event } from '../../services/event'
import { resolveImageUrl } from '../../services/api'
import { formatDate } from '../../utils'
import { getEventDisplay } from '../../utils/eventStatus'
import './index.scss'

const AVATAR_COLORS = ['#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#10B981', '#3B82F6']

interface EventCardProps {
  event: Event
  onClick?: () => void
}

function hashId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return Math.abs(hash)
}

export default function EventCard({ event, onClick }: EventCardProps) {
  const signupCount = event._count?.signups ?? event.currentParticipants ?? 0
  const status = getEventDisplay(event.date || event.startTime, signupCount, event.maxCapacity || event.maxParticipants)
  const colorIndex = hashId(event.id)
  const avatars = event.signups?.slice(0, 5) ?? []
  const dateStr = event.date || event.startTime
  const d = dateStr ? formatDate(dateStr, 'short') : ''
  const t = dateStr ? formatDate(dateStr, 'time') : ''
  const displayDate = d && t ? `${d} ${t}` : d
  const isEmpty = signupCount === 0
  const endedNotJoined = status.state === 'ENDED' && !event.isSignedUp // 已结束且自己没参与
  const canSignup = isEmpty && status.state === 'OPEN' // 仅「报名中」且无人时才引导报名
  // 引导报名时的 3 个彩色占位圈：起始色与步长按活动 id 区分，使不同活动配色/排布不同
  const placeStep = 1 + (colorIndex % 2) // 1 或 2，保证 3 个颜色互不重复
  const placeholderColors = [0, 1, 2].map(
    (i) => AVATAR_COLORS[(colorIndex + i * placeStep) % AVATAR_COLORS.length],
  )
  const avatarCount = canSignup
    ? placeholderColors.length
    : avatars.length > 0
      ? avatars.length
      : endedNotJoined
        ? placeholderColors.length
        : Math.min(5, signupCount)

  return (
    <View className='event-card' onClick={onClick} hoverClass='card-hover' hoverStayTime={80}>
      {/* 左侧竖图 */}
      <View className='card-cover'>
        {event.coverUrl ? (
          <Image className='cover-image' src={resolveImageUrl(event.coverUrl)} mode='aspectFill' lazyLoad />
        ) : (
          <View className='cover-placeholder' style={{ background: AVATAR_COLORS[colorIndex % AVATAR_COLORS.length] }}>
            <Text className='cover-text'>{(event.title || '').slice(0, 2)}</Text>
          </View>
        )}
        {event.isGuestShare && (
          <View className='guest-badge'>
            <Text className='guest-badge-text'>★ 大咖{event.guestName ? ` · ${event.guestName}` : ''}</Text>
          </View>
        )}
      </View>

      {/* 右侧信息 */}
      <View className='card-info'>
        <View className='card-top'>
          <Text className='card-title'>{event.title}</Text>
          {dateStr && (
            <View className='info-item'>
              <Text className='info-icon-text'>🕐</Text>
              <Text className='info-label'>{displayDate}</Text>
            </View>
          )}
          {(event.venue?.name || event.location) && (
            <View className='info-item'>
              <Text className='info-icon-text'>📍</Text>
              <Text className='info-label'>{event.venue?.name || event.location}</Text>
            </View>
          )}
          <View className='info-item'>
            <View className='status-dot' style={{ background: status.color }} />
            <Text className='info-label' style={{ color: status.color }}>{status.label}</Text>
          </View>
        </View>
        <View className='card-bottom'>
          <View className='avatar-stack' style={{ width: avatarCount > 0 ? `${avatarCount * 32 + 32}rpx` : '0' }}>
            {canSignup
              ? placeholderColors.map((c, i) => (
                  <View key={i} className='avatar-circle' style={{ left: `${i * 32}rpx`, zIndex: i + 1, background: c }}>
                    {i === placeholderColors.length - 1 ? <Text className='avatar-q'>?</Text> : null}
                  </View>
                ))
              : avatars.length > 0
              ? avatars.map((s, i) => (
                  <View key={s.user?.id || i} className='avatar-circle' style={{ left: `${i * 32}rpx`, zIndex: i + 1, background: s.user?.avatarUrl ? undefined : AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                    {s.user?.avatarUrl ? <Image className='avatar-img' src={resolveImageUrl(s.user.avatarUrl)} mode='aspectFill' /> : null}
                  </View>
                ))
              : [0, 1, 2, 3, 4].slice(0, avatarCount).map((i) => (
                  <View key={i} className='avatar-circle' style={{ left: `${i * 32}rpx`, zIndex: i + 1, background: AVATAR_COLORS[(colorIndex + i) % AVATAR_COLORS.length] }} />
                ))}
          </View>
          {endedNotJoined
            ? <Text className='signup-count'>下次参与</Text>
            : signupCount > 0
            ? <Text className='signup-count'>{signupCount}人已报名</Text>
            : canSignup
            ? <Text className='signup-count signup-empty'>立即报名</Text>
            : <Text className='signup-count'>暂无人报名</Text>}
        </View>
      </View>
    </View>
  )
}
