import { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { getEvents } from '../../services/event'
import type { Event } from '../../services/event'
import { getCategories, type Category } from '../../services/category'
import { getColumns, type ColumnConfig } from '../../services/column'
import { resolveImageUrl } from '../../services/api'
import { lucideUri, pathToUri } from '../../utils/lucide'
import EventCard from '../../components/EventCard'
import './index.scss'

const COLUMN_FALLBACK_BG: Record<string, string> = {
  FEATURED: '#5E9E87',
  PLANF: '#B49C76',
  GUEST: '#D08C72',
}

export default function Discover() {
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [columns, setColumns] = useState<ColumnConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<Event[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef<any>(null)

  useEffect(() => { loadAll() }, [])
  const firstShow = useRef(true)
  useDidShow(() => {
    if (firstShow.current) { firstShow.current = false; return }
    loadEvents(true) // 返回时静默刷新，不触发 loading、不破坏滚动位置
  })

  const loadAll = async () => {
    loadEvents()
    try { setCategories((await getCategories()) || []) } catch { /* */ }
    try { setColumns((await getColumns()) || []) } catch { /* */ }
  }
  const loadEvents = async (silent = false) => {
    try { if (!silent) setLoading(true); const res = await getEvents(1, 20); setEvents(res?.data ?? []) }
    catch (e) { console.error(e) } finally { if (!silent) setLoading(false) }
  }

  const toCategory = (id: string) => Taro.navigateTo({ url: `/pages/category/index?id=${id}` })
  const toColumn = (type: string) => Taro.navigateTo({ url: `/pages/column/index?type=${type}` })
  const toEvent = (id: string) => Taro.navigateTo({ url: `/pages/event-detail/index?id=${id}` })

  const isSearchMode = keyword.trim().length > 0

  // 服务端搜索（全字段），输入防抖 300ms
  const onSearchInput = (val: string) => {
    setKeyword(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    const kw = val.trim()
    if (!kw) { setSearchResults([]); setSearching(false); return }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await getEvents(1, 20, kw)
        setSearchResults(res?.data ?? [])
      } catch (e) { console.error(e) } finally { setSearching(false) }
    }, 300)
  }

  return (
    <View className='discover-page'>
      {/* 顶部：标题 + 搜索 */}
      <View className='top-nav'>
        <View className='search-bar'>
          <View className='search-icon' style={{ backgroundImage: `url("${lucideUri('search', '#bbbbbb')}")` }} />
          <Input
            className='search-input'
            value={keyword}
            onInput={(e) => onSearchInput(e.detail.value)}
            placeholder='搜索活动、主题、场地'
            placeholderClass='search-ph-cls'
            confirmType='search'
          />
        </View>
      </View>

      {isSearchMode ? (
        /* 搜索结果页 */
        <View className='event-list'>
          {searching ? (
            <View className='empty-state'><Text className='empty-text'>搜索中…</Text></View>
          ) : searchResults.length === 0 ? (
            <View className='empty-state'><Text className='empty-text'>未搜索到相关活动</Text></View>
          ) : (
            searchResults.map((ev) => <EventCard key={ev.id} event={ev} onClick={() => toEvent(ev.id)} />)
          )}
        </View>
      ) : (
        <>
          {/* 分类标签 */}
          <View className='cat-bar'>
            <ScrollView scrollX className='cat-scroll'>
              {categories.map((c) => (
                <View key={c.id} className='cat-item' onClick={() => toCategory(c.id)}>
                  {(c.iconPath || c.icon) ? <View className='cat-icon' style={{ backgroundImage: `url("${c.iconPath ? pathToUri(c.iconPath, '#666666') : lucideUri(c.icon!, '#666666')}")` }} /> : null}
                  <Text className='cat-text'>{c.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* 专栏 */}
          <View className='section-title'><Text className='section-title-text'>专栏</Text></View>
          <ScrollView scrollX className='column-scroll' enableFlex>
            {columns.map((col) => (
              <View
                key={col.id}
                className='column-card'
                onClick={() => toColumn(col.type)}
                style={col.bgUrl
                  ? { backgroundImage: `url("${resolveImageUrl(col.bgUrl)}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: COLUMN_FALLBACK_BG[col.type] || '#888' }}
              >
                <View className='column-overlay' />
                <View className='column-info'>
                  <Text className='column-title'>{col.title}</Text>
                  {col.intro ? <Text className='column-intro'>{col.intro}</Text> : null}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* 活动 */}
          <View className='section-title'><Text className='section-title-text'>活动</Text></View>
          <View className='event-list'>
            {loading ? (
              <View className='empty-state'><Text className='empty-text'>加载中...</Text></View>
            ) : events.length === 0 ? (
              <View className='empty-state'><Text className='empty-text'>暂无活动</Text></View>
            ) : (
              events.map((ev) => <EventCard key={ev.id} event={ev} onClick={() => toEvent(ev.id)} />)
            )}
          </View>
        </>
      )}
    </View>
  )
}
