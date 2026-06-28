import { useState } from 'react'
import { View, Text, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../stores/useAuthStore'
import { phoneLogin } from '../../services/auth'
import { lucideUri } from '../../utils/lucide'
import './index.scss'

interface Props {
  visible: boolean
  onClose: () => void
  onSuccess?: () => void
  /** 在带底部 TabBar 的页面（如"我的"）使用时设为 true，避免被原生 TabBar 遮挡 */
  tabBar?: boolean
}

export default function PhoneLoginSheet({ visible, onClose, onSuccess, tabBar }: Props) {
  const { login } = useAuthStore()
  // 隐私合规：默认不勾选，用户须主动同意《用户协议》《隐私政策》后方可登录
  const [agreed, setAgreed] = useState(false)

  const openAgreement = (type: 'user' | 'privacy') => {
    Taro.navigateTo({ url: `/pages/agreement/index?type=${type}` })
  }

  const handleGetPhone = async (e: any) => {
    const code = e?.detail?.code
    // 用户拒绝授权
    if (!code) {
      if (e?.detail?.errMsg && e.detail.errMsg.indexOf('deny') === -1) {
        Taro.showToast({ title: '需授权手机号才能登录', icon: 'none' })
      }
      return
    }
    try {
      Taro.showLoading({ title: '登录中' })
      const res = await phoneLogin(code)
      login(res.accessToken, res.user)
      Taro.hideLoading()
      Taro.showToast({ title: '登录成功', icon: 'success' })
      onClose()
      onSuccess?.()
      // 首次登录（尚无昵称）引导完善头像与昵称
      if (!res.user?.nickname) {
        setTimeout(() => Taro.navigateTo({ url: '/pages/profile-edit/index?welcome=1' }), 700)
      }
    } catch (err) {
      Taro.hideLoading()
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
    }
  }

  if (!visible) return null

  return (
    <View className='login-sheet-mask' onClick={onClose}>
      <View className={`login-sheet ${tabBar ? 'with-tabbar' : ''}`} onClick={(e) => e.stopPropagation()}>
        <View className='ls-handle' />
        <View className='ls-close' onClick={onClose} style={{ backgroundImage: `url("${lucideUri('x', '#cccccc')}")` }} />

        <View className='ls-logo-row'>
          <Image className='ls-logo-img' src='/assets/offenbar-logo.png' mode='aspectFit' />
        </View>

        <Text className='ls-title'>登录后报名活动</Text>
        <Text className='ls-sub'>使用本机手机号快捷登录，用于活动报名与到场联系</Text>

        <Button
          className={`ls-phone-btn ${agreed ? '' : 'disabled'}`}
          openType={agreed ? 'getPhoneNumber' : undefined}
          onGetPhoneNumber={handleGetPhone}
          onClick={() => { if (!agreed) Taro.showToast({ title: '请先阅读并勾选下方协议', icon: 'none' }) }}
        >
          <View className='ls-phone-icon' style={{ backgroundImage: `url("${lucideUri('smartphone', '#ffffff')}")` }} />
          <Text className='ls-phone-text'>手机号快捷登录</Text>
        </Button>

        {/* 隐私合规：必须主动勾选，协议可点击阅读 */}
        <View className='ls-agree-row'>
          <View
            className={`ls-checkbox ${agreed ? 'checked' : ''}`}
            onClick={() => setAgreed(!agreed)}
            style={agreed ? { backgroundImage: `url("${lucideUri('check', '#ffffff')}")` } : undefined}
          />
          <Text className='ls-agree-text' onClick={() => setAgreed(!agreed)}>
            我已阅读并同意
            <Text className='ls-agree-link' onClick={(e) => { e.stopPropagation(); openAgreement('user') }}>《用户协议》</Text>
            和
            <Text className='ls-agree-link' onClick={(e) => { e.stopPropagation(); openAgreement('privacy') }}>《隐私政策》</Text>
          </Text>
        </View>
      </View>
    </View>
  )
}
