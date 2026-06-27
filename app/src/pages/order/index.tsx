import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { getMyOrders, type MyOrder } from '../../services/order'
import './index.scss'

const STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待支付', color: '#FF9800' },
  PAID: { label: '已支付', color: '#4CAF50' },
  CLOSED: { label: '已关闭', color: '#999' },
  REFUNDING: { label: '退款中', color: '#FF9800' },
  REFUNDED: { label: '已退款', color: '#999' },
}

const fmt = (t?: string | null) => (t ? t.replace('T', ' ').slice(0, 16) : '')

export default function OrderCenter() {
  const [orders, setOrders] = useState<MyOrder[]>([])
  const [loading, setLoading] = useState(true)

  useDidShow(() => { load() })

  const load = async () => {
    try {
      setLoading(true)
      const data = await getMyOrders()
      setOrders(data || [])
    } catch (e) {
      // 忽略，展示空态
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='order-page'>
      {loading ? (
        <Text className='order-loading'>加载中...</Text>
      ) : orders.length === 0 ? (
        <View className='order-empty'>
          <Text className='order-empty-text'>暂无订单</Text>
        </View>
      ) : (
        <View className='order-list'>
          {orders.map((o) => {
            const st = STATUS[o.status] || { label: o.status, color: '#999' }
            return (
              <View
                key={o.id}
                className='order-card'
                onClick={() => o.eventId && Taro.navigateTo({ url: `/pages/event-detail/index?id=${o.eventId}` })}
              >
                <View className='order-top'>
                  <Text className='order-title'>{o.title}</Text>
                  <Text className='order-status' style={{ color: st.color }}>{st.label}</Text>
                </View>
                <View className='order-mid'>
                  <Text className='order-type'>{o.type === 'MEMBERSHIP' ? '会员开通' : '活动报名'}</Text>
                  <Text className='order-amount'>¥{(o.amount / 100).toFixed(2)}</Text>
                </View>
                <Text className='order-time'>
                  下单 {fmt(o.createdAt)}{o.paidAt ? ` · 支付 ${fmt(o.paidAt)}` : ''}
                </Text>
                <Text className='order-no' selectable userSelect>订单号 {o.outTradeNo}</Text>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}
