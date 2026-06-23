import { useState, useEffect } from 'react'
import { View, Text, Image, RichText } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { resolveImageUrl } from '../../services/api'
import { getContent } from '../../services/creator'
import type { ContentDetail } from '../../services/creator'
import './index.scss'

const fmtDate = (s?: string | null) => (s ? new Date(s).toISOString().slice(0, 10) : '')

export default function ContentDetailPage() {
  const { id } = Taro.getCurrentInstance().router?.params || {}
  const [data, setData] = useState<ContentDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) load(id) }, [id])

  const load = async (cid: string) => {
    try {
      setData(await getContent(cid))
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const openCreator = () => {
    if (data?.creator?.id) Taro.navigateTo({ url: `/pages/creator-detail/index?id=${data.creator.id}` })
  }

  if (loading) {
    return <View className='ct-page'><View className='ct-loading'>加载中...</View></View>
  }
  if (!data) {
    return <View className='ct-page'><View className='ct-loading'>未找到</View></View>
  }

  return (
    <View className='ct-page'>
      <View className='ct-header'>
        <Text className='ct-title'>{data.title}</Text>
        <View className='ct-author' onClick={openCreator}>
          {!!data.creator?.avatarUrl && (
            <Image className='ct-avatar' src={resolveImageUrl(data.creator.avatarUrl)} mode='aspectFill' />
          )}
          <View className='ct-author-meta'>
            <Text className='ct-author-name'>{data.creator?.nickname || ''}</Text>
            <Text className='ct-author-sub'>
              {[data.creator?.title, fmtDate(data.publishedAt)].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>
      </View>

      {!!data.coverUrl && (
        <Image className='ct-cover' src={resolveImageUrl(data.coverUrl)} mode='widthFix' />
      )}

      <View className='ct-body'>
        <RichText nodes={data.body || ''} />
      </View>

      <View className='ct-source'>
        <Text className='ct-source-text'>来源 · 敞开对谈</Text>
      </View>
    </View>
  )
}
