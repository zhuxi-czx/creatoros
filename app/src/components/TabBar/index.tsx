import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

type TabKey = 'home' | 'discover' | 'profile'

interface TabBarProps {
  active: TabKey
}

const tabs: { key: TabKey; label: string; path: string; icon: string }[] = [
  { key: 'home', label: '首页', path: '/pages/index/index', icon: '⌂' },
  { key: 'discover', label: '发现', path: '/pages/discover/index', icon: '◎' },
  { key: 'profile', label: '我的', path: '/pages/profile/index', icon: '♟' },
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
              <Text className={`tabbar-icon ${isActive ? 'active' : ''}`}>{tab.icon}</Text>
              <Text className={`tabbar-label ${isActive ? 'active' : ''}`}>{tab.label}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
