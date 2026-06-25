import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import './index.scss'

// 与 H5 完全一致的线性 SVG 图标（描边色随选中态切换：#fff / #999）
const ICON_PATHS: Record<string, string> = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  discover: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  profile: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
}

function iconUri(name: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const tabs = [
  { name: 'discover', pagePath: 'pages/discover/index', label: '发现' },
  { name: 'profile', pagePath: 'pages/profile/index', label: '我的' },
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
              <View
                className='tabbar-icon'
                style={{ backgroundImage: `url("${iconUri(tab.name, isActive ? '#ffffff' : '#999999')}")` }}
              />
              <Text className={`tabbar-label ${isActive ? 'active' : ''}`}>{tab.label}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
