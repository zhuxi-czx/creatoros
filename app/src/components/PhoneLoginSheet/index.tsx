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

  // 微信隐私授权：与后台《用户隐私保护指引》联动。用户勾选同意时，
  // 若小程序尚未取得隐私授权，主动拉起微信官方授权框（旧基础库无此 API 时静默跳过，
  // 由微信在调用手机号接口时自动串联兜底）。
  const ensurePrivacyAuthorized = () => {
    if (process.env.TARO_ENV !== 'weapp') return
    const t: any = Taro
    if (typeof t.getPrivacySetting !== 'function') return
    t.getPrivacySetting({
      success: (res: any) => {
        if (res?.needAuthorization && typeof t.requirePrivacyAuthorize === 'function') {
          t.requirePrivacyAuthorize({ fail: () => {} })
        }
      },
      fail: () => {},
    })
  }

  const toggleAgree = () => {
    const next = !agreed
    setAgreed(next)
    if (next) ensurePrivacyAuthorized()
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
            onClick={toggleAgree}
            style={agreed ? { backgroundImage: `url("${lucideUri('check', '#ffffff')}")` } : undefined}
          />
          <Text className='ls-agree-text' onClick={toggleAgree}>
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
