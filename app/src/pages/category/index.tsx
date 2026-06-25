import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getCategoryPage, type CategoryPage } from '../../services/category'
import { resolveImageUrl } from '../../services/api'
import EventCard from '../../components/EventCard'
import './index.scss'

export default function CategoryPageView() {
  const { id } = Taro.getCurrentInstance().router?.params || {}
  const [data, setData] = useState<CategoryPage | null>(null)

  useEffect(() => {
    if (id) getCategoryPage(id).then(setData).catch(() => {})
  }, [id])

  const toEvent = (eid: string) => Taro.navigateTo({ url: `/pages/event-detail/index?id=${eid}` })

  if (!data) return <View className='cat-page'><Text className='loading'>加载中...</Text></View>

  return (
    <View className='cat-page'>
      <View className='cat-header'>
        {data.coverUrl ? <Image className='cat-banner' src={resolveImageUrl(data.coverUrl)} mode='aspectFill' /> : null}
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
