import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { resolveImageUrl } from '../../services/api'
import { getCreator } from '../../services/creator'
import type { CreatorDetail } from '../../services/creator'
import './index.scss'

const fmtDate = (s?: string | null) => (s ? new Date(s).toISOString().slice(0, 10) : '')

export default function CreatorDetailPage() {
  const { id } = Taro.getCurrentInstance().router?.params || {}
  const [data, setData] = useState<CreatorDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) load(id) }, [id])

  const load = async (cid: string) => {
    try {
      const d = await getCreator(cid)
      setData(d)
      if (d?.nickname) Taro.setNavigationBarTitle({ title: d.nickname })
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const openContent = (cid: string) => Taro.navigateTo({ url: `/pages/content-detail/index?id=${cid}` })

  if (loading) {
    return <View className='cd-page'><View className='cd-loading'>加载中...</View></View>
  }
  if (!data) {
    return <View className='cd-page'><View className='cd-loading'>未找到</View></View>
  }

  return (
    <View className='cd-page'>
      {/* Hero */}
      <View className='cd-hero'>
        <Image className='cd-hero-img' src={resolveImageUrl(data.coverUrl || data.avatarUrl || '')} mode='aspectFill' />
        <View className='cd-hero-scrim' />
        <View className='cd-hero-meta'>
          <Text className='cd-name'>{data.nickname || '未命名'}</Text>
          {!!data.title && <Text className='cd-title'>{data.title}</Text>}
        </View>
      </View>

      <View className='cd-body'>
        {/* 简介 */}
        {!!data.intro && (
          <View className='cd-card'>
            <Text className='cd-card-title'>简介</Text>
            <Text className='cd-intro'>{data.intro}</Text>
            {data.tags && data.tags.length > 0 && (
              <View className='cd-tags'>
                {data.tags.map((t, i) => (
                  <View key={i} className='cd-tag'><Text className='cd-tag-text'>{t}</Text></View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* TA 的内容 */}
        <View className='cd-section'>
          <View className='cd-sec-head'>
            <Text className='cd-sec-title'>TA 的内容</Text>
            <Text className='cd-sec-count'>共 {data.contents.length} 篇</Text>
          </View>
          <View className='cd-content-list'>
            {data.contents.map((c) => (
              <View key={c.id} className='cd-content-item' onClick={() => openContent(c.id)}>
                <Text className='cd-content-title'>{c.title}</Text>
                <Text className='cd-content-date'>{fmtDate(c.publishedAt)}</Text>
              </View>
            ))}
            {data.contents.length === 0 && <Text className='cd-empty'>暂无内容</Text>}
          </View>
        </View>
      </View>
    </View>
  )
}
