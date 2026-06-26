import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getMembership, purchaseMembership, type MembershipInfo } from '../../services/membership'
import { useAuthStore } from '../../stores/useAuthStore'
import './index.scss'

const BENEFITS = [
  { title: '每月大咖活动免费', sub: '每月一次大咖分享活动，免费参加' },
  { title: '每月群友聚会免费', sub: '每月一次线下群友聚会，免费参加' },
  { title: '全场酒水 8.8 折', sub: '到店消费酒水享 8.8 折' },
  { title: '日常活动 8 折', sub: '报名日常付费活动享 8 折优惠' },
]

export default function MembershipPage() {
  const { token } = useAuthStore()
  const [info, setInfo] = useState<MembershipInfo | null>(null)
  const [paying, setPaying] = useState(false)

  const load = () => getMembership().then(setInfo).catch(() => {})
  useEffect(() => { load() }, [])

  const handlePurchase = async () => {
    if (paying) return
    if (!token) { Taro.showToast({ title: '请先登录', icon: 'none' }); return }
    setPaying(true)
    try {
      const res = await purchaseMembership()
      if (res.payParams) {
        await Taro.requestPayment({ ...(res.payParams as any) })
      }
      Taro.showToast({ title: '开通成功', icon: 'success' })
      load()
    } catch (e: any) {
      if (!(e?.errMsg || '').includes('cancel')) Taro.showToast({ title: '支付未完成', icon: 'none' })
    } finally { setPaying(false) }
  }

  return (
    <View className='mem-page'>
      <View className='mem-hero'>
        <Text className='mem-crown'>♛</Text>
        <Text className='mem-title'>PlanF 会员</Text>
        <Text className='mem-slogan'>解锁专属活动 · 尊享会员价</Text>
        {info?.isMember
          ? <Text className='mem-valid'>有效期至 {info.expireAt?.slice(0, 10)}</Text>
          : <Text className='mem-price'>¥998 <Text className='mem-unit'>/ 年</Text></Text>}
      </View>

      <View className='mem-card'>
        <Text className='mem-card-title'>会员权益</Text>
        {BENEFITS.map((b, i) => (
          <View key={i} className='benefit-row'>
            <View className='benefit-dot'><Text className='benefit-check'>✓</Text></View>
            <View className='benefit-text'>
              <Text className='benefit-title'>{b.title}</Text>
              <Text className='benefit-sub'>{b.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      {!info?.isMember && (
        <View className='mem-bottom'>
          <View className='mem-btn' onClick={handlePurchase}>
            <Text className='mem-btn-text'>{paying ? '处理中...' : '立即开通 · ¥998/年'}</Text>
          </View>
        </View>
      )}
    </View>
  )
}
