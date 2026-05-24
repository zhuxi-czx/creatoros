import { useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

type TabKey = 'home' | 'discover' | 'profile'

interface TabBarProps {
  active: TabKey
}

const tabs: { key: TabKey; label: string; path: string; icon: string; activeIcon: string }[] = [
  { key: 'home', label: '首页', path: '/pages/index/index', icon: '/assets/tab-home.png', activeIcon: '/assets/tab-home-active.png' },
  { key: 'discover', label: '发现', path: '/pages/discover/index', icon: '/assets/tab-discover.png', activeIcon: '/assets/tab-discover-active.png' },
  { key: 'profile', label: '我的', path: '/pages/profile/index', icon: '/assets/tab-profile.png', activeIcon: '/assets/tab-profile-active.png' },
]

export default function TabBar({ active }: TabBarProps) {
  useEffect(() => {
    Taro.hideTabBar({ animation: false }).catch(() => {})
  }, [])

  const handleTap = (tab: typeof tabs[0]) => {
    if (tab.key === active) return
    Taro.switchTab({ url: tab.path })
  }

  return (
    <View className='custom-tabbar'>
      <View className='tabbar-pill'>
        {tabs.map((tab) => {
          const isActive = active === tab.key
          return (
            <View
              key={tab.key}
              className={`tabbar-item ${isActive ? 'active' : ''}`}
              onClick={() => handleTap(tab)}
            >
              <Image className='tabbar-icon-img' src={isActive ? tab.activeIcon : tab.icon} mode='aspectFit' />
              <Text className={`tabbar-label ${isActive ? 'active' : ''}`}>{tab.label}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
