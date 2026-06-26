import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import './index.scss'

// 入口页：兼容体验版二维码锁定的 pages/index/index 路径。
// 一加载就 reLaunch 到发现页，自身只作启动跳板，规避真机白屏。
export default function Index() {
  useLoad(() => {
    Taro.reLaunch({ url: '/pages/discover/index' })
  })

  return (
    <View className='launch-page'>
      <View className='launch-spinner' />
      <Text className='launch-text'>加载中…</Text>
    </View>
  )
}
