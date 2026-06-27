import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, Swiper, SwiperItem, Button, RichText } from '@tarojs/components'
import { enrichHtml } from '../../utils/richText'
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { lucideUri } from '../../utils/lucide'
import { getEventDisplay } from '../../utils/eventStatus'
import { getEventDetail, signup, cancelSignup, getEventSignups, checkout, getOrder, SUBSCRIBE_TMPL_ID, subscribeReminder } from '../../services/event'
import type { Event, Participant } from '../../services/event'
import { useAuthStore } from '../../stores/useAuthStore'
import PhoneLoginSheet from '../../components/PhoneLoginSheet'
import { resolveImageUrl } from '../../services/api'
import { formatEventDateTime } from '../../utils'
import './index.scss'

export default function EventDetail() {
  const { id } = Taro.getCurrentInstance().router?.params || {}
  const { token } = useAuthStore()
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showRefundDone, setShowRefundDone] = useState(false)
  const [cancelling, setCancelling] = useState(false)
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
    imageUrl: event?.coverUrl ? resolveImageUrl(event.coverUrl) : undefined,
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
    if (!event || !id || signing) return
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

  // 报名成功后请求「活动开始提醒」订阅授权（模板未配置则跳过）
  const requestEventReminder = async (eventId: string) => {
    if (!SUBSCRIBE_TMPL_ID) return
    try {
      const res: any = await Taro.requestSubscribeMessage({ tmplIds: [SUBSCRIBE_TMPL_ID] } as any)
      if (res[SUBSCRIBE_TMPL_ID] === 'accept') await subscribeReminder(eventId)
    } catch (e) {
      // 用户拒绝授权或接口异常，忽略
    }
  }

  // 实际报名（已确保登录、可报名）
  const doSignup = async () => {
    if (!event || !id) return
    try {
      setSigning(true)
      if ((event.price ?? 0) > 0) {
        // 付费活动：下单。会员免费名额时后端直接确认报名（free），否则拉起微信支付
        const res = await checkout(id)
        if (res.free) {
          await loadEvent(true)
          Taro.showToast({ title: '报名成功', icon: 'success' })
          await requestEventReminder(id)
        } else if (res.payParams && res.orderId) {
          await Taro.requestPayment({
            timeStamp: res.payParams.timeStamp,
            nonceStr: res.payParams.nonceStr,
            package: res.payParams.package,
            signType: res.payParams.signType as any,
            paySign: res.payParams.paySign,
          })
          const paid = await pollOrderPaid(res.orderId)
          if (paid) {
            await loadEvent(true)
            Taro.showToast({ title: '报名成功', icon: 'success' })
          await requestEventReminder(id)
          } else {
            Taro.showToast({ title: '支付确认中，请稍后刷新', icon: 'none' })
          }
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

  // 点「取消报名」→ 打开确认弹窗（付费活动会提示原路退款）
  const handleCancel = () => {
    setShowInfo(false)
    setShowCancelConfirm(true)
  }

  // 确认取消 → 调用接口；付费则展示退款提示弹窗
  const doCancel = async () => {
    if (!id || !event || cancelling) return
    try {
      setCancelling(true)
      const res = await cancelSignup(id)
      setShowCancelConfirm(false)
      await loadEvent(true) // 重新同步报名状态/人数/参与者列表
      if (res?.refunded) {
        setShowRefundDone(true)
      } else {
        Taro.showToast({ title: '已取消报名', icon: 'success' })
      }
    } catch (err: any) {
      // 后端返回的具体原因（如退款处理中），用 modal 完整展示
      setShowCancelConfirm(false)
      Taro.showModal({
        title: '无法取消',
        content: err?.message || '操作失败，请稍后重试',
        showCancel: false,
        confirmText: '我知道了',
      })
    } finally {
      setCancelling(false)
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
  // PlanF 专属活动 + 非会员 + 未报名 + 仍可报名：拦截下单，按钮引导开通会员
  const planfBlocked = !!event.isPlanfExclusive && !event.pricing?.isMember && !event.isSignedUp && !signupClosed
  // 费用区 PlanF 引导文案：专享 / 大咖(本月免费或已用转8折) / 普通付费8折
  const memberPriceYuan = Math.round((event.price ?? 0) * 0.8 / 100)
  const planfHint = event.isPlanfExclusive
    ? '开通会员免费参加'
    : event.isGuestShare
    ? (event.pricing?.isMember
        ? (event.pricing.freeAvailable ? 'PlanF 会员本次免费' : `PlanF 会员 ¥${memberPriceYuan}（8折）`)
        : 'PlanF 会员每月 1 次免费')
    : `PlanF 会员 ¥${memberPriceYuan}（8折）`

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
                {formatEventDateTime(event.date || event.startTime)}
              </Text>
            </View>
          </View>
          <View className='info-row' onClick={() => event.venue?.id && Taro.navigateTo({ url: `/pages/venue/index?id=${event.venue.id}` })}>
            <View className='info-icon-svg' style={{ backgroundImage: `url("${lucideUri('map-pin', '#C9A96E')}")` }} />
            <View className='info-content'>
              <Text className='info-label'>地点</Text>
              <Text className='info-value' selectable userSelect>
                {event.venue?.name || event.location || '待定'}{event.venue?.id ? ' ›' : ''}
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
                <View className='price-line'>
                  <Text className='info-value'>
                    {event.isPlanfExclusive ? 'PlanF 专属' : event.price === 0 ? '免费' : `¥${(event.price! / 100).toFixed(0)}`}
                  </Text>
                  {(event.isPlanfExclusive || event.price! > 0) && (
                    <Text className='planf-link' onClick={() => Taro.navigateTo({ url: '/pages/membership/index' })}>
                      {planfHint} ›
                    </Text>
                  )}
                </View>
                {event.priceNote && <Text className='price-note'>{event.priceNote}</Text>}
              </View>
            </View>
          )}
        </View>

        {/* Description */}
        {event.description && (
          <View className='desc-card'>
            <Text className='card-title'>活动介绍</Text>
            <View className='desc-rich'>
              <RichText nodes={enrichHtml(event.description)} />
            </View>
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
        {/* PlanF 引导气泡：常驻按钮上方；仅非会员 + 付费/专享 + 未报名 + 未结束时显示 */}
        {!event.isSignedUp && !signupClosed && event.pricing && !event.pricing.isMember && ((event.price ?? 0) > 0 || event.isPlanfExclusive) && (
          <View className='member-bubble' onClick={() => Taro.navigateTo({ url: '/pages/membership/index' })}>
            <View className='mb-left'>
              <View className='mb-crown' style={{ backgroundImage: `url("${lucideUri('crown', '#A9824A')}")` }} />
              <Text className='member-bubble-text'>开通 PlanF 会员，{event.isPlanfExclusive ? '专享活动免费畅享' : '日常活动享 8 折'}</Text>
            </View>
            <View className='mb-right'>
              <Text className='mb-view'>查看</Text>
              <View className='mb-arrow' style={{ backgroundImage: `url("${lucideUri('chevron-right', '#A9824A')}")` }} />
            </View>
          </View>
        )}
        <View
          className={`action-btn ${event.isSignedUp ? 'signed' : ''} ${!event.isSignedUp && signupClosed ? 'disabled' : ''} ${signing ? 'loading' : ''}`}
          onClick={planfBlocked ? () => Taro.navigateTo({ url: '/pages/membership/index' }) : handleSignup}
        >
          <Text className='action-btn-text'>
            {signing
              ? '处理中...'
              : event.isSignedUp
              ? '已报名'
              : signupClosed
              ? (status.state === 'ENDED' ? '活动已结束' : '报名已结束')
              : planfBlocked
              ? '立即报名 · 升级 PlanF 会员'
              : event.isPlanfExclusive
              ? '立即报名 · PlanF 免费专享'
              : (event.pricing?.freeType === 'GUEST_FREE' && event.pricing?.freeAvailable)
              ? '立即报名 · PlanF 会员本次免费'
              : (event.price ?? 0) > 0
              ? `立即报名 · ${event.pricing ? (event.pricing.finalPrice === 0 ? '免费' : `¥${(event.pricing.finalPrice / 100).toFixed(0)}`) : `¥${(event.price! / 100).toFixed(0)}`}`
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
                <Text className='sm-value'>{formatEventDateTime(event.date || event.startTime)}</Text>
              </View>
              <View className='sm-row'>
                <Text className='sm-label'>地点</Text>
                <Text className='sm-value' selectable userSelect>{event.venue?.name || event.location || '待定'}</Text>
              </View>
            </View>
            <View className='sm-ok' onClick={() => setShowInfo(false)}>
              <Text className='sm-ok-text'>知道了</Text>
            </View>
            <Text className='sm-cancel' onClick={handleCancel}>取消报名</Text>
          </View>
        </View>
      )}

      {/* 取消报名确认弹窗（付费活动提示原路退款） */}
      {showCancelConfirm && (
        <View className='signup-modal-mask' onClick={() => !cancelling && setShowCancelConfirm(false)}>
          <View className='signup-modal' onClick={(e) => e.stopPropagation()}>
            <View className='sm-check sm-check--warn'>
              <View
                className='sm-check-icon'
                style={{ backgroundImage: `url("${lucideUri('rotate-ccw', '#D98A28')}")` }}
              />
            </View>
            <Text className='sm-title'>确认取消报名？</Text>
            <Text className='sm-sub sm-sub--wrap'>
              {(event.price ?? 0) > 0
                ? '取消后名额将释放，已支付款项将原路退回'
                : '取消后名额将释放给其他人'}
            </Text>
            {(event.price ?? 0) > 0 && (
              <View className='sm-info sm-info--refund'>
                <View className='sm-row sm-row--between'>
                  <Text className='sm-label'>退款金额</Text>
                  <Text className='sm-amount'>¥{((event.price ?? 0) / 100).toFixed(2)}</Text>
                </View>
                <Text className='sm-note'>退款将原路退回到你的微信支付账户，预计几分钟内到账</Text>
              </View>
            )}
            <View
              className={`sm-ok sm-ok--danger ${cancelling ? 'loading' : ''}`}
              onClick={doCancel}
            >
              <Text className='sm-ok-text'>{cancelling ? '处理中...' : '确认取消'}</Text>
            </View>
            <Text className='sm-cancel' onClick={() => !cancelling && setShowCancelConfirm(false)}>再想想</Text>
          </View>
        </View>
      )}

      {/* 退款提示弹窗 */}
      {showRefundDone && (
        <View className='signup-modal-mask' onClick={() => setShowRefundDone(false)}>
          <View className='signup-modal' onClick={(e) => e.stopPropagation()}>
            <View className='sm-check'>
              <View
                className='sm-check-icon'
                style={{ backgroundImage: `url("${lucideUri('check', '#ffffff')}")` }}
              />
            </View>
            <Text className='sm-title'>已取消报名</Text>
            <Text className='sm-sub sm-sub--wrap'>名额已释放，退款处理中</Text>
            <View className='sm-info sm-info--refund'>
              <View className='sm-row sm-row--between'>
                <Text className='sm-label'>退款金额</Text>
                <Text className='sm-amount'>¥{((event.price ?? 0) / 100).toFixed(2)}</Text>
              </View>
              <Text className='sm-note'>已原路退回到你的微信支付账户，预计几分钟内到账</Text>
            </View>
            <View className='sm-ok' onClick={() => setShowRefundDone(false)}>
              <Text className='sm-ok-text'>知道了</Text>
            </View>
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
