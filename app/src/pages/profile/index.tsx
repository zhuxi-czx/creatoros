import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useAuthStore } from '../../stores/useAuthStore'
import PhoneLoginSheet from '../../components/PhoneLoginSheet'
import StatusPicker from '../../components/StatusPicker'
import { resolveImageUrl } from '../../services/api'
import { getMySignups } from '../../services/user'
import type { SignupRecord } from '../../services/user'
import { getMembership, type MembershipInfo } from '../../services/membership'
import { getCoupons, type Coupon } from '../../services/coupon'
import { lucideUri } from '../../utils/lucide'
import './index.scss'

export default function Profile() {
  const { token, user } = useAuthStore()
  const [signups, setSignups] = useState<SignupRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [mem, setMem] = useState<MembershipInfo | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    if (token) {
      loadSignups()
    }
  }, [token])

  // 每次切回「我的」tab 都重新拉取，确保在详情页取消报名后列表同步
  useDidShow(() => {
    if (token) {
      loadSignups()
      // 已注册但未完善状态的用户，进入我的页引导补充（含忽略后不再弹）
      if (user && !user.statusPrompted) setShowStatus(true)
    }
  })

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
    try { setMem(await getMembership()) } catch { /* 未登录忽略 */ }
    try { setCoupons((await getCoupons()) || []) } catch { /* 未登录忽略 */ }
  }

  const handleEditProfile = () => {
    Taro.navigateTo({ url: '/pages/profile-edit/index' })
  }

  const handleEventTap = (eventId: string) => {
    Taro.navigateTo({ url: `/pages/event-detail/index?id=${eventId}` })
  }

  const displayName = user?.nickname || 'momo'
  const otherTags = [
    user?.mbti,
    user?.zodiac,
    user?.generation,
    ...(user?.tags || []),
  ].filter(Boolean) as string[]
  const usableCoupons = coupons.filter((c) => c.status === 'UNUSED')

  return (
    <View className='profile-page'>

      {/* 风景背景图（对齐设计稿）+ 渐变压暗保证白色文字可读 */}
      <Image className='profile-bg' src='/assets/profile-bg.jpg' mode='aspectFill' />
      <View className='profile-bg-overlay' />

      {/* Profile Header */}
      <View className='profile-header'>
        {/* Avatar（无头像用默认笑脸头像）*/}
        <View className='avatar-wrap'>
          <Image
            className='avatar-img'
            src={user?.avatarUrl ? resolveImageUrl(user.avatarUrl) : '/assets/default-avatar.png'}
            mode='aspectFill'
          />
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

        {/* Tags：性别单独着色（男蓝/女粉）+ 居中，其余标签常规 */}
        {token && (user?.gender || otherTags.length > 0) && (
          <View className='tags-row'>
            {user?.gender && (
              <View className='tag-badge gender-badge'>
                {(user.gender === '男' || user.gender === '女') ? (
                  <View className='gender-icon' style={{ backgroundImage: `url("${lucideUri(user.gender === '男' ? 'mars' : 'venus', user.gender === '男' ? '#6BB0F5' : '#F58FB4')}")` }} />
                ) : (
                  <Text className='gender-symbol'>{user.gender}</Text>
                )}
              </View>
            )}
            {otherTags.map((tag, i) => (
              <View key={i} className='tag-badge'>
                <Text className='tag-text'>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 个人简介（叠在头图上，居中）*/}
        {token && user?.bio && (
          <Text className='header-bio'>{user.bio}</Text>
        )}

        {/* 编辑资料按钮 */}
        {token && (
          <View className='header-edit' onClick={handleEditProfile}>
            <View className='header-edit-icon' style={{ backgroundImage: `url("${lucideUri('pencil', '#ffffff')}")` }} />
            <Text className='header-edit-text'>编辑资料</Text>
          </View>
        )}
      </View>

      {/* Content Area（整页原生滚动，不用固定高度 ScrollView）*/}
      <View className='profile-content'>
        {/* Not logged in */}
        {!token && (
          <View className='login-card'>
            <Text className='login-hint'>登录后报名活动、查看我的报名</Text>
            <View className='login-btn' onClick={() => setShowLogin(true)}>
              <Text className='login-btn-text'>手机号快捷登录</Text>
            </View>
            <Text className='skip-hint'>头像昵称可在登录后「编辑资料」完善</Text>
          </View>
        )}

        {/* PlanF 会员卡 */}
        {token && (
          <View className='mem-card' onClick={() => Taro.navigateTo({ url: '/pages/membership/index' })}>
            <View className='mem-left'>
              <View className='mem-title-row'>
                <View className='mem-crown' style={{ backgroundImage: `url("${lucideUri('crown', '#ffffff')}")` }} />
                <Text className='mem-title'>PlanF 会员</Text>
              </View>
              {mem?.isMember ? (
                <>
                  <Text className='mem-sub'>有效期至 {mem.expireAt?.slice(0, 10)}</Text>
                  <Text className='mem-sub'>本月大咖免费名额 · 剩 {mem.guestFreeLeft ?? 0} 次</Text>
                </>
              ) : (
                <Text className='mem-sub'>开通享专属活动 · 日常活动 8 折</Text>
              )}
            </View>
            <View className='mem-arrow' style={{ backgroundImage: `url("${lucideUri('chevron-right', '#ffffff')}")` }} />
          </View>
        )}

        {/* 优惠券 / 订单 同行入口 */}
        {token && (
          <View className='entry-row'>
            <View className='entry-card' onClick={() => Taro.navigateTo({ url: '/pages/coupon/index' })}>
              <View className='entry-icon' style={{ backgroundImage: `url("${lucideUri('ticket', '#C9A96E')}")` }} />
              <View className='entry-text'>
                <Text className='entry-title'>我的优惠券</Text>
                <Text className='entry-sub'>{usableCoupons.length > 0 ? `${usableCoupons.length} 张可用` : '暂无可用'}</Text>
              </View>
            </View>
            <View className='entry-card' onClick={() => Taro.navigateTo({ url: '/pages/order/index' })}>
              <View className='entry-icon' style={{ backgroundImage: `url("${lucideUri('receipt', '#C9A96E')}")` }} />
              <View className='entry-text'>
                <Text className='entry-title'>我的订单</Text>
                <Text className='entry-sub'>查看支付记录</Text>
              </View>
            </View>
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

      </View>

      {/* 手机号快捷登录弹窗 */}
      <PhoneLoginSheet
        visible={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={loadSignups}
        tabBar
      />
      <StatusPicker
        visible={showStatus}
        onDone={() => {
          setShowStatus(false)
          useAuthStore.getState().updateUser({ statusPrompted: true })
        }}
      />
    </View>
  )
}
