import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { getColumnPage, type ColumnPage } from '../../services/column'
import EventCard from '../../components/EventCard'
import { resolveImageUrl } from '../../services/api'
import { lucideUri, pathToUri } from '../../utils/lucide'
import './index.scss'

const COLOR: Record<string, string> = { FEATURED: '#5E9E87', PLANF: '#B49C76', GUEST: '#D08C72' }

export default function ColumnPageView() {
  const { type } = Taro.getCurrentInstance().router?.params || {}
  const [data, setData] = useState<ColumnPage | null>(null)
  const [error, setError] = useState(false)

  const load = () => {
    if (!type) return
    setError(false)
    getColumnPage(type).then(setData).catch(() => setError(true))
  }
  useEffect(() => { load() }, [type])
  useDidShow(() => { Taro.hideShareMenu() }) // 专栏页不提供分享，隐藏右上角转发/朋友圈菜单

  const toEvent = (eid: string) => Taro.navigateTo({ url: `/pages/event-detail/index?id=${eid}` })
  const toMembership = () => Taro.navigateTo({ url: '/pages/membership/index' })
  const bg = COLOR[type || ''] || '#5E9E87'

  if (error) return <View className='col-page'><View className='empty'><Text className='empty-text'>加载失败</Text><View className='col-cta' onClick={load} style={{ background: '#fff', marginTop: '20rpx' }}><Text className='col-cta-text'>点击重试</Text></View></View></View>
  if (!data) return <View className='col-page'><Text className='loading'>加载中...</Text></View>

  return (
    <View className='col-page'>
      <View className='col-header' style={data.config?.bgUrl
        ? { backgroundImage: `url("${resolveImageUrl(data.config.bgUrl)}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: bg }}>
        {data.config?.bgUrl ? <View className='col-header-mask' /> : null}
        <View className='col-toprow'>
          <View className='col-iconbox'>
            {(data.config?.iconPath || data.config?.icon) ? <View className='col-icon' style={{ backgroundImage: `url("${data.config.iconPath ? pathToUri(data.config.iconPath, bg) : lucideUri(data.config.icon!, bg)}")` }} /> : null}
          </View>
          <Text className='col-title'>{data.config?.title}</Text>
        </View>
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
