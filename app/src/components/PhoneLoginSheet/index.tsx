import { View, Text, Button } from '@tarojs/components'
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
          <View className='ls-logo'><Text className='ls-logo-text'>C</Text></View>
          <Text className='ls-app'>CreatorOS</Text>
        </View>

        <Text className='ls-title'>登录后报名活动</Text>
        <Text className='ls-sub'>使用微信手机号快捷登录，用于活动报名与到场联系</Text>

        <Button className='ls-phone-btn' openType='getPhoneNumber' onGetPhoneNumber={handleGetPhone}>
          <View className='ls-phone-icon' style={{ backgroundImage: `url("${lucideUri('smartphone', '#ffffff')}")` }} />
          <Text className='ls-phone-text'>微信手机号快捷登录</Text>
        </Button>

        <Text className='ls-agree'>登录即代表同意《用户协议》和《隐私政策》</Text>
      </View>
    </View>
  )
}
