import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, Swiper, SwiperItem, Button } from '@tarojs/components'
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { lucideUri } from '../../utils/lucide'
import { getEventDisplay } from '../../utils/eventStatus'
import { getEventDetail, signup, cancelSignup, getEventSignups, checkout, getOrder } from '../../services/event'
import type { Event, Participant } from '../../services/event'
import { useAuthStore } from '../../stores/useAuthStore'
import PhoneLoginSheet from '../../components/PhoneLoginSheet'
import { resolveImageUrl } from '../../services/api'
import { formatDate } from '../../utils'
import './index.scss'

export default function EventDetail() {
  const { id } = Taro.getCurrentInstance().router?.params || {}
  const { token } = useAuthStore()
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

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

  const loadEvent = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const userId = Taro.getStorageSync('user')?.id
      const [ev, signups] = await Promise.allSettled([
        getEventDetail(id!, userId),
        getEventSignups(id!)
      ])
      if (ev.status === 'fulfilled') setEvent(ev.value)
      if (signups.status === 'fulfilled') setParticipants(signups.value)
    } catch (err) {
      if (!silent) Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!event || !id) return
    // 已报名 → 弹出报名详情弹窗（不再直接取消）
    if (event.isSignedUp) {
      setShowInfo(true)
      return
    }
    // 报名结束/已结束 → 不可报名
    const disp = getEventDisplay(event.date || event.startTime, event._count?.signups ?? 0, event.maxCapacity || event.maxParticipants)
    if (disp.state !== 'OPEN') {
      Taro.showToast({ title: disp.state === 'ENDED' ? '活动已结束' : '报名已结束', icon: 'none' })
      return
    }
    // 未登录 → 弹手机号快捷登录，登录成功后继续报名
    if (!token) {
      setShowLogin(true)
      return
    }
    doSignup()
  }

  // 实际报名（已确保登录、可报名）
  const doSignup = async () => {
    if (!event || !id) return
    try {
      setSigning(true)
      if ((event.price ?? 0) > 0) {
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
          await loadEvent(true) // 同步报名状态/人数/参与者
          Taro.showToast({ title: '报名成功', icon: 'success' })
        } else {
          Taro.showToast({ title: '支付确认中，请稍后刷新', icon: 'none' })
        }
      } else {
        await signup(id)
        await loadEvent(true) // 同步报名状态/人数/参与者
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

  // 弹窗内取消报名
  const handleCancel = async () => {
    if (!id || !event) return
    try {
      await cancelSignup(id)
      setShowInfo(false)
      await loadEvent(true) // 重新同步报名状态/人数/参与者列表
      Taro.showToast({ title: '已取消报名', icon: 'success' })
    } catch (err) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
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

  const signupCount = event._count?.signups ?? event.currentParticipants ?? 0
  const status = getEventDisplay(event.date || event.startTime, signupCount, event.maxCapacity || event.maxParticipants)
  const signupClosed = status.state !== 'OPEN' // 报名结束/已结束 → 不能报名

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
                      <Image className='participant-avatar-img' src={resolveImageUrl(p.avatarUrl)} mode='aspectFill' />
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
          className={`action-btn ${event.isSignedUp ? 'signed' : ''} ${!event.isSignedUp && signupClosed ? 'disabled' : ''} ${signing ? 'loading' : ''}`}
          onClick={handleSignup}
        >
          <Text className='action-btn-text'>
            {signing
              ? '处理中...'
              : event.isSignedUp
              ? '已报名'
              : signupClosed
              ? (status.state === 'ENDED' ? '活动已结束' : '报名已结束')
              : (event.price ?? 0) > 0
              ? `立即报名 · ¥${(event.price! / 100).toFixed(0)}`
              : '立即报名 · 免费'}
          </Text>
        </View>
      </View>

      {/* 报名详情弹窗 */}
      {showInfo && (
        <View className='signup-modal-mask' onClick={() => setShowInfo(false)}>
          <View className='signup-modal' onClick={(e) => e.stopPropagation()}>
            <View className='sm-check'>
              <View
                className='sm-check-icon'
                style={{ backgroundImage: `url("${lucideUri('check', '#ffffff')}")` }}
              />
            </View>
            <Text className='sm-title'>报名成功</Text>
            <Text className='sm-sub'>已加入活动，记得准时到场</Text>
            <View className='sm-info'>
              <View className='sm-row'>
                <Text className='sm-label'>时间</Text>
                <Text className='sm-value'>{formatDate(event.date || event.startTime)}</Text>
              </View>
              <View className='sm-row'>
                <Text className='sm-label'>地点</Text>
                <Text className='sm-value'>{event.venue?.name || event.location || '待定'}</Text>
              </View>
            </View>
            <View className='sm-ok' onClick={() => setShowInfo(false)}>
              <Text className='sm-ok-text'>知道了</Text>
            </View>
            <Text className='sm-cancel' onClick={handleCancel}>取消报名</Text>
          </View>
        </View>
      )}

      {/* 手机号快捷登录弹窗 */}
      <PhoneLoginSheet
        visible={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={doSignup}
      />
    </View>
  )
}
