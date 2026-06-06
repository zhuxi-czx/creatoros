import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, Swiper, SwiperItem, Button } from '@tarojs/components'
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { lucideUri } from '../../utils/lucide'
import { getEventDetail, signup, cancelSignup, getEventSignups, checkout, getOrder } from '../../services/event'
import type { Event, Participant } from '../../services/event'
import { useAuthStore } from '../../stores/useAuthStore'
import { wxLogin } from '../../services/auth'
import { resolveImageUrl } from '../../services/api'
import { formatDate } from '../../utils'
import './index.scss'

function getStatusInfo(status: string) {
  if (status === 'PUBLISHED') return { label: '报名中', color: '#4CAF50' }
  if (status === 'FULL') return { label: '已满员', color: '#FF9800' }
  if (status === 'ONGOING') return { label: '进行中', color: '#FF9800' }
  return { label: '已结束', color: '#999' }
}

export default function EventDetail() {
  const { id } = Taro.getCurrentInstance().router?.params || {}
  const { token, login } = useAuthStore()
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    if (id) loadEvent()
  }, [id])

  // 微信转发到对话框（小程序卡片：标题 + 封面图 + 落地路径）
  useShareAppMessage(() => ({
    title: event?.title || 'CreatorOS · 一起来玩',
    path: `/pages/event-detail/index?id=${id}`,
    imageUrl: event?.coverUrl ? resolveImageUrl(event.coverUrl) : undefined,
  }))

  // 分享到朋友圈
  useShareTimeline(() => ({
    title: event?.title || 'CreatorOS · 一起来玩',
    query: `id=${id}`,
  }))

  const loadEvent = async () => {
    try {
      setLoading(true)
      const userId = Taro.getStorageSync('user')?.id
      const [ev, signups] = await Promise.allSettled([
        getEventDetail(id!, userId),
        getEventSignups(id!)
      ])
      if (ev.status === 'fulfilled') setEvent(ev.value)
      if (signups.status === 'fulfilled') setParticipants(signups.value)
    } catch (err) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!event || !id) return
    try {
      setSigning(true)
      // 未登录：先静默微信登录（引导登录），成功后继续报名
      if (!token) {
        try {
          const res = await wxLogin()
          login(res.accessToken, res.user)
        } catch (e) {
          Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
          return
        }
      }
      if (event.isSignedUp) {
        await cancelSignup(id)
        setEvent({
          ...event,
          isSignedUp: false,
          _count: { signups: (event._count?.signups ?? 1) - 1 }
        })
        Taro.showToast({ title: '已取消报名', icon: 'success' })
      } else if ((event.price ?? 0) > 0) {
        // 付费活动：下单 → 拉起微信支付 → 轮询确认报名
        const { orderId, payParams } = await checkout(id)
        await Taro.requestPayment({
          timeStamp: payParams.timeStamp,
          nonceStr: payParams.nonceStr,
          package: payParams.package,
          signType: payParams.signType as any,
          paySign: payParams.paySign,
        })
        const paid = await pollOrderPaid(orderId)
        if (paid) {
          setEvent({
            ...event,
            isSignedUp: true,
            _count: { signups: (event._count?.signups ?? 0) + 1 }
          })
          Taro.showToast({ title: '报名成功', icon: 'success' })
        } else {
          Taro.showToast({ title: '支付确认中，请稍后刷新', icon: 'none' })
        }
      } else {
        await signup(id)
        setEvent({
          ...event,
          isSignedUp: true,
          _count: { signups: (event._count?.signups ?? 0) + 1 }
        })
        Taro.showToast({ title: '报名成功', icon: 'success' })
      }
    } catch (err: any) {
      // 用户取消支付不弹错误
      if (err?.errMsg && err.errMsg.indexOf('cancel') !== -1) {
        Taro.showToast({ title: '已取消支付', icon: 'none' })
      } else {
        Taro.showToast({ title: '操作失败', icon: 'none' })
      }
    } finally {
      setSigning(false)
    }
  }

  // 支付后轮询订单状态（回调可能略有延迟），最多约 6 秒
  const pollOrderPaid = async (orderId: string): Promise<boolean> => {
    for (let i = 0; i < 6; i++) {
      try {
        const order = await getOrder(orderId)
        if (order.paid) return true
      } catch (e) {
        // 忽略单次失败，继续轮询
      }
      await new Promise((r) => setTimeout(r, 1000))
    }
    return false
  }

  if (loading) {
    return (
      <View className='detail-page loading-state'>
        <View className='loading-spinner' />
        <Text className='loading-text'>加载中...</Text>
      </View>
    )
  }

  if (!event) {
    return (
      <View className='detail-page loading-state'>
        <Text className='loading-text'>活动不存在</Text>
      </View>
    )
  }

  const status = getStatusInfo(event.status)
  const signupCount = event._count?.signups ?? event.currentParticipants ?? 0

  // 详情多图：优先 imageUrls，回退 coverUrl
  const detailImages = (
    event.imageUrls && event.imageUrls.length > 0
      ? event.imageUrls
      : event.coverUrl
      ? [event.coverUrl]
      : []
  ).map(resolveImageUrl)

  const previewImages = (urls: string[], current: string) => {
    Taro.previewImage({ current, urls })
  }

  return (
    <View className='detail-page'>
      <ScrollView scrollY className='scroll-view'>
        {/* Cover：多图轮播 + 点击全屏预览 */}
        <View className='cover-section'>
          {detailImages.length > 0 ? (
            <Swiper
              className='cover-swiper'
              autoplay={event.autoplay !== false && detailImages.length > 1}
              interval={event.interval || 3000}
              circular
              indicatorDots={detailImages.length > 1}
              indicatorActiveColor='#fff'
              indicatorColor='rgba(255,255,255,0.4)'
            >
              {detailImages.map((img, i) => (
                <SwiperItem key={i}>
                  <Image
                    className='cover-image'
                    src={img}
                    mode='aspectFill'
                    lazyLoad
                    onClick={() => previewImages(detailImages, img)}
                  />
                </SwiperItem>
              ))}
            </Swiper>
          ) : (
            <View
              className='cover-gradient'
              style={{ background: event.coverColor || 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}
            />
          )}
          <View className='cover-overlay'>
            <View className='status-badge' style={{ background: status.color }}>
              <Text className='status-text'>{status.label}</Text>
            </View>
            <Text className='cover-title'>{event.title}</Text>
          </View>
          {/* 分享浮钮：点按拉起微信转发 */}
          <Button className='cover-share-btn' openType='share'>
            <View
              className='cover-share-icon'
              style={{ backgroundImage: `url("${lucideUri('share-2', '#ffffff')}")` }}
            />
          </Button>
        </View>

        {/* Info Card */}
        <View className='info-card'>
          <View className='info-row'>
            <View className='info-icon-svg' style={{ backgroundImage: `url("${lucideUri('calendar', '#C9A96E')}")` }} />
            <View className='info-content'>
              <Text className='info-label'>时间</Text>
              <Text className='info-value'>
                {formatDate(event.date || event.startTime)}
              </Text>
            </View>
          </View>
          <View className='info-row'>
            <View className='info-icon-svg' style={{ backgroundImage: `url("${lucideUri('map-pin', '#C9A96E')}")` }} />
            <View className='info-content'>
              <Text className='info-label'>地点</Text>
              <Text className='info-value'>
                {event.venue?.name || event.location || '待定'}
              </Text>
            </View>
          </View>
          {event.hostName && (
            <View className='info-row'>
              <View className='info-icon-svg' style={{ backgroundImage: `url("${lucideUri('user', '#C9A96E')}")` }} />
              <View className='info-content'>
                <Text className='info-label'>主办方</Text>
                <Text className='info-value'>{event.hostName}</Text>
              </View>
            </View>
          )}
          <View className='info-row'>
            <View className='info-icon-svg' style={{ backgroundImage: `url("${lucideUri('users', '#C9A96E')}")` }} />
            <View className='info-content'>
              <Text className='info-label'>已报名</Text>
              <Text className='info-value'>
                {signupCount} / {event.maxCapacity || event.maxParticipants || '不限'}
              </Text>
            </View>
          </View>
          {event.price !== undefined && event.price !== null && (
            <View className='info-row'>
              <View className='info-icon-svg' style={{ backgroundImage: `url("${lucideUri('ticket', '#C9A96E')}")` }} />
              <View className='info-content'>
                <Text className='info-label'>费用</Text>
                <Text className='info-value'>
                  {event.price === 0 ? '免费' : `¥${(event.price! / 100).toFixed(0)}`}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Description */}
        {event.description && (
          <View className='desc-card'>
            <Text className='card-title'>活动介绍</Text>
            <Text className='desc-text'>{event.description}</Text>
          </View>
        )}

        {/* Participants */}
        {participants.length > 0 && (
          <View className='participants-card'>
            <Text className='card-title'>参与者 ({participants.length})</Text>
            <ScrollView scrollX className='participants-scroll' enableFlex>
              {participants.map((p) => (
                <View key={p.id} className='participant-item'>
                  <View className='participant-avatar'>
                    {p.avatarUrl ? (
                      <Image className='participant-avatar-img' src={p.avatarUrl} mode='aspectFill' />
                    ) : (
                      <Text className='participant-letter'>
                        {(p.nickname || '?')[0]}
                      </Text>
                    )}
                  </View>
                  <Text className='participant-name'>{p.nickname || '用户'}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View className='bottom-action'>
        <View
          className={`action-btn ${event.isSignedUp ? 'signed' : ''} ${signing ? 'loading' : ''}`}
          onClick={handleSignup}
        >
          <Text className='action-btn-text'>
            {signing
              ? '处理中...'
              : event.isSignedUp
              ? '取消报名'
              : (event.price ?? 0) > 0
              ? `立即报名 · ¥${(event.price! / 100).toFixed(0)}`
              : '立即报名 · 免费'}
          </Text>
        </View>
      </View>
    </View>
  )
}
