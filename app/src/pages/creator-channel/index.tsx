import { useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { resolveImageUrl } from '../../services/api'
import { getCreators, getContents } from '../../services/creator'
import type { CreatorCard, ContentListItem } from '../../services/creator'
import './index.scss'

export default function CreatorChannel() {
  const [creators, setCreators] = useState<CreatorCard[]>([])
  const [contents, setContents] = useState<ContentListItem[]>([])
  const [loading, setLoading] = useState(true)

  useDidShow(() => { load() })

  const load = async () => {
    try {
      const [cs, ct] = await Promise.allSettled([getCreators(), getContents()])
      if (cs.status === 'fulfilled') setCreators(Array.isArray(cs.value) ? cs.value : [])
      if (ct.status === 'fulfilled') setContents(Array.isArray(ct.value) ? ct.value : [])
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const openCreator = (id: string) => Taro.navigateTo({ url: `/pages/creator-detail/index?id=${id}` })
  const openContent = (id: string) => Taro.navigateTo({ url: `/pages/content-detail/index?id=${id}` })

  return (
    <View className='channel-page'>
      {/* Creator 主理人 */}
      <View className='section'>
        <Text className='section-title'>Creator</Text>
        {creators.length > 0 ? (
          <ScrollView scrollX className='creator-scroll' enableFlex>
            {creators.map((c) => (
              <View key={c.id} className='creator-card' onClick={() => openCreator(c.id)}>
                <View className='cc-poster'>
                  <Image className='cc-img' src={resolveImageUrl(c.coverUrl || c.avatarUrl || '')} mode='aspectFill' />
                  <View className='cc-scrim' />
                  <View className='cc-tag'><Text className='cc-tag-text'>Creator</Text></View>
                  <View className='cc-meta'>
                    <Text className='cc-name'>{c.nickname || '未命名'}</Text>
                    {!!c.title && <Text className='cc-title'>{c.title}</Text>}
                  </View>
                </View>
                <View className='cc-body'>
                  {!!c.tagline && <Text className='cc-tagline'>{c.tagline}</Text>}
                  <Text className='cc-count'>{c.contentCount || 0} 篇内容</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : !loading ? (
          <Text className='empty'>暂无 Creator</Text>
        ) : null}
      </View>

      {/* 敞开对谈 */}
      <View className='section'>
        <Text className='section-title'>敞开对谈</Text>
        <View className='content-list'>
          {contents.map((c) => (
            <View key={c.id} className='content-card' onClick={() => openContent(c.id)}>
              <Text className='content-title'>{c.title}</Text>
              <Text className='content-author'>
                {c.creator?.nickname || ''}{c.creator?.title ? ` · ${c.creator.title}` : ''}
              </Text>
            </View>
          ))}
          {contents.length === 0 && !loading && <Text className='empty'>暂无内容</Text>}
        </View>
      </View>
    </View>
  )
}
