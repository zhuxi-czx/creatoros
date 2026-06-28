import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { getCategoryPage, type CategoryPage } from '../../services/category'
import EventCard from '../../components/EventCard'
import './index.scss'

export default function CategoryPageView() {
  const { id } = Taro.getCurrentInstance().router?.params || {}
  const [data, setData] = useState<CategoryPage | null>(null)
  const [error, setError] = useState(false)

  const load = () => {
    if (!id) return
    setError(false)
    getCategoryPage(id).then(setData).catch(() => setError(true))
  }
  useEffect(() => { load() }, [id])

  useShareAppMessage(() => ({
    title: data?.name ? `${data.name} · 敞开酒馆` : '敞开酒馆',
    path: `/pages/category/index?id=${id || ''}`,
    imageUrl: '/assets/offenbar-logo.png',
  }))
  useShareTimeline(() => ({
    title: data?.name ? `${data.name} · 敞开酒馆` : '敞开酒馆',
    query: `id=${id || ''}`,
    imageUrl: '/assets/offenbar-logo.png',
  }))

  const toEvent = (eid: string) => Taro.navigateTo({ url: `/pages/event-detail/index?id=${eid}` })

  if (error) return <View className='cat-page'><View className='empty'><Text className='empty-text'>加载失败</Text><View onClick={load} style={{ marginTop: '20rpx', padding: '12rpx 36rpx', background: '#C9A96E', borderRadius: '30rpx' }}><Text style={{ color: '#fff', fontSize: '26rpx' }}>点击重试</Text></View></View></View>
  if (!data) return <View className='cat-page'><Text className='loading'>加载中...</Text></View>

  return (
    <View className='cat-page'>
      <View className='cat-header'>
        <View className='cat-info'>
          <Text className='cat-name'>{data.name}</Text>
          {data.intro ? <Text className='cat-intro'>{data.intro}</Text> : null}
          <Text className='cat-count'>共 {data.events.length} 场活动</Text>
        </View>
      </View>
      <View className='cat-list'>
        {data.events.length === 0
          ? <View className='empty'><Text className='empty-text'>暂无活动</Text></View>
          : data.events.map((ev) => <EventCard key={ev.id} event={ev} onClick={() => toEvent(ev.id)} />)}
      </View>
    </View>
  )
}
