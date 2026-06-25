import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getColumnPage, type ColumnPage } from '../../services/column'
import EventCard from '../../components/EventCard'
import './index.scss'

const COLOR: Record<string, string> = { FEATURED: '#5E9E87', PLANF: '#B49C76', GUEST: '#D08C72' }

export default function ColumnPageView() {
  const { type } = Taro.getCurrentInstance().router?.params || {}
  const [data, setData] = useState<ColumnPage | null>(null)

  useEffect(() => {
    if (type) getColumnPage(type).then(setData).catch(() => {})
  }, [type])

  const toEvent = (eid: string) => Taro.navigateTo({ url: `/pages/event-detail/index?id=${eid}` })
  const toMembership = () => Taro.navigateTo({ url: '/pages/membership/index' })
  const bg = COLOR[type || ''] || '#5E9E87'

  if (!data) return <View className='col-page'><Text className='loading'>加载中...</Text></View>

  return (
    <View className='col-page'>
      <View className='col-header' style={{ background: bg }}>
        <Text className='col-title'>{data.config?.title}</Text>
        {data.config?.intro ? <Text className='col-intro'>{data.config.intro}</Text> : null}
        {type === 'PLANF'
          ? <View className='col-cta' onClick={toMembership}><Text className='col-cta-text'>查看会员权益 ›</Text></View>
          : null}
      </View>
      <View className='col-list'>
        {data.events.length === 0
          ? <View className='empty'><Text className='empty-text'>暂无活动</Text></View>
          : data.events.map((ev) => <EventCard key={ev.id} event={ev} onClick={() => toEvent(ev.id)} />)}
      </View>
    </View>
  )
}
