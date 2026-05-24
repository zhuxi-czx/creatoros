import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface NavBarProps {
  title: string
  showSearch?: boolean
}

const sysInfo = Taro.getSystemInfoSync()
const STATUS_BAR_HEIGHT = sysInfo.statusBarHeight || 20
// 小程序右上角胶囊按钮的位置，搜索框需要避开
const menuRect = Taro.getMenuButtonBoundingClientRect?.() || { width: 87, right: sysInfo.windowWidth - 10 }
const CAPSULE_WIDTH = sysInfo.windowWidth - menuRect.right + menuRect.width + 16

export default function NavBar({ title, showSearch }: NavBarProps) {
  return (
    <View className='navbar' style={{ paddingTop: `${STATUS_BAR_HEIGHT}px` }}>
      <View className='navbar-content' style={{ paddingRight: `${CAPSULE_WIDTH}px` }}>
        <Text className='navbar-title'>{title}</Text>
        {showSearch && (
          <View className='navbar-search'>
            <Text className='navbar-search-icon'>🔍</Text>
            <Text className='navbar-search-text'>搜索活动、主题、场地</Text>
          </View>
        )}
      </View>
    </View>
  )
}
