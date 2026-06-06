import { useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import './index.scss'

const tabs = [
  { pagePath: 'pages/index/index', label: '首页', icon: '/assets/tab-home.png', activeIcon: '/assets/tab-home-active.png' },
  { pagePath: 'pages/discover/index', label: '发现', icon: '/assets/tab-discover.png', activeIcon: '/assets/tab-discover-active.png' },
  { pagePath: 'pages/profile/index', label: '我的', icon: '/assets/tab-profile.png', activeIcon: '/assets/tab-profile-active.png' },
]

function currentIndex(): number {
  const path = (Taro.getCurrentInstance().router?.path || '').replace(/^\//, '').split('?')[0]
  const idx = tabs.findIndex((t) => t.pagePath === path)
  return idx >= 0 ? idx : 0
}

export default function CustomTabBar() {
  // 每个 tab 页各有一个 tabbar 实例，初始即按本页路由高亮
  const [selected, setSelected] = useState(currentIndex())

  useDidShow(() => setSelected(currentIndex()))

  const handleTap = (idx: number) => {
    if (idx === selected) return
    Taro.switchTab({ url: '/' + tabs[idx].pagePath })
  }

  return (
    <View className='custom-tabbar'>
      <View className='tabbar-pill'>
        {tabs.map((tab, i) => {
          const isActive = i === selected
          return (
            <View
              key={tab.pagePath}
              className={`tabbar-item ${isActive ? 'active' : ''}`}
              onClick={() => handleTap(i)}
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
