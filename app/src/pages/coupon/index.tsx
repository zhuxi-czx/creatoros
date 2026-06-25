import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getCoupons, useCoupon, deleteCoupon, type Coupon } from '../../services/coupon'
import './index.scss'

export default function CouponPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [confirming, setConfirming] = useState<Coupon | null>(null)

  const load = () => getCoupons().then(setCoupons).catch(() => {})
  useEffect(() => { load() }, [])

  const doUse = async () => {
    if (!confirming) return
    try {
      await useCoupon(confirming.id)
      Taro.showToast({ title: '已使用', icon: 'success' })
      setConfirming(null); load()
    } catch (e: any) { Taro.showToast({ title: e?.message || '使用失败', icon: 'none' }) }
  }
  const doDelete = async (c: Coupon) => {
    try { await deleteCoupon(c.id); load() } catch { Taro.showToast({ title: '删除失败', icon: 'none' }) }
  }

  return (
    <View className='coupon-page'>
      {coupons.length === 0 ? <View className='empty'><Text className='empty-text'>暂无优惠券</Text></View> : null}
      {coupons.map((c) => {
        const usable = c.status === 'UNUSED'
        return (
          <View key={c.id} className={`coupon ${usable ? '' : 'disabled'}`}>
            <View className='coupon-amt'>
              <Text className='coupon-amt-num'>¥{Math.round(c.amount / 100)}</Text>
              <Text className='coupon-amt-label'>酒水券</Text>
            </View>
            <View className='coupon-info'>
              <Text className='coupon-title'>{c.title}</Text>
              <Text className='coupon-valid'>
                {usable ? `有效期至 ${c.expireAt.slice(0, 10)}` : c.status === 'USED' ? '已使用' : `已过期 · ${c.expireAt.slice(0, 10)}`}
              </Text>
              {usable
                ? <View className='coupon-btn' onClick={() => setConfirming(c)}><Text className='coupon-btn-text'>立即使用</Text></View>
                : <View className='coupon-btn ghost' onClick={() => doDelete(c)}><Text className='coupon-btn-text ghost'>删除</Text></View>}
            </View>
          </View>
        )
      })}

      {confirming && (
        <View className='dlg-mask' onClick={() => setConfirming(null)}>
          <View className='dlg' onClick={(e) => e.stopPropagation()}>
            <Text className='dlg-title'>确认使用优惠券？</Text>
            <Text className='dlg-desc'>使用后立即生效、不可撤销，请在向店员出示时当面操作。</Text>
            <View className='dlg-coupon'>
              <Text className='dlg-coupon-name'>{confirming.title}</Text>
              <Text className='dlg-coupon-amt'>¥{Math.round(confirming.amount / 100)}</Text>
            </View>
            <View className='dlg-btns'>
              <View className='dlg-cancel' onClick={() => setConfirming(null)}><Text>取消</Text></View>
              <View className='dlg-confirm' onClick={doUse}><Text className='dlg-confirm-text'>确认使用</Text></View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
