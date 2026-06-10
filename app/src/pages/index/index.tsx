import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, Swiper, SwiperItem } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getBanners } from '../../services/banner'
import { getVenues } from '../../services/venue'
import { getFeaturedEvents } from '../../services/event'
import type { Banner } from '../../services/banner'
import type { Venue } from '../../services/venue'
import type { Event } from '../../services/event'
import { resolveImageUrl } from '../../services/api'
import './index.scss'

// 设计稿功能区用 lucide 线性图标（28px、金色 #C9A96E、无圆形背景）
// 小程序无 lucide 字体，用同款 SVG 路径以 data-URI 背景图渲染
const LUCIDE_PATHS: Record<string, string> = {
  'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  'calendar-check': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
  'rocket': '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  'wand-sparkles': '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
}

function lucideUri(name: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${LUCIDE_PATHS[name]}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const FEATURE_ICONS = [
  { label: '主题分享', icon: 'message-circle' },
  { label: '活动策划', icon: 'calendar-check' },
  { label: 'PlanF', icon: 'rocket' },
  { label: 'Creator', icon: 'wand-sparkles' },
]

const VENUE_COLORS = [
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #06B6D4, #3B82F6)',
  'linear-gradient(135deg, #F97316, #EF4444)',
  'linear-gradient(135deg, #10B981, #06B6D4)',
]

const EVENT_COLORS = [
  'linear-gradient(135deg, #F97316, #EF4444)',
  'linear-gradient(135deg, #06B6D4, #3B82F6)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #10B981, #06B6D4)',
]

export default function Index() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [featured, setFeatured] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [b, v, f] = await Promise.allSettled([getBanners(), getVenues(), getFeaturedEvents()])
      if (b.status === 'fulfilled') setBanners(b.value)
      if (v.status === 'fulfilled') setVenues(v.value)
      if (f.status === 'fulfilled') setFeatured(f.value)
    } catch (err) {
      console.error('Failed to load data', err)
    } finally {
      setLoading(false)
    }
  }

  const handleVenueTap = (id: string) => {
    Taro.navigateTo({ url: `/pages/venue/index?id=${id}` })
  }

  const handleEventTap = (id: string) => {
    Taro.navigateTo({ url: `/pages/event-detail/index?id=${id}` })
  }

  const handleMore = () => {
    Taro.switchTab({ url: '/pages/discover/index' })
  }

  return (
    <View className='index-page'>

      {/* Banner Carousel */}
      <View className='banner-section'>
        {banners.length > 0 ? (
          <Swiper
            className='banner-swiper'
            autoplay
            circular
            indicatorDots
            indicatorColor='rgba(255,255,255,0.4)'
            indicatorActiveColor='#ffffff'
            interval={4000}
            duration={500}
          >
            {banners.map((banner) => (
              <SwiperItem key={banner.id} className='banner-item'>
                <Image
                  className='banner-image'
                  src={resolveImageUrl(banner.imageUrls?.[0])}
                  mode='aspectFill'
                  lazyLoad
                />
                <View className='banner-overlay'>
                  <Text className='banner-title'>{banner.title}</Text>
                  {banner.subtitle && (
                    <Text className='banner-subtitle'>{banner.subtitle}</Text>
                  )}
                </View>
              </SwiperItem>
            ))}
          </Swiper>
        ) : loading ? (
          <View className='banner-skeleton'>
            <View className='skeleton-shimmer' />
          </View>
        ) : null}
      </View>

      {/* Feature Icons Row */}
      <View className='feature-card'>
        {FEATURE_ICONS.map((item, i) => (
          <View
            key={i}
            className='feature-item'
            hoverClass='card-hover'
            hoverStayTime={80}
            onClick={() => Taro.showToast({ title: '即将上线，敬请期待', icon: 'none' })}
          >
            <View
              className='feature-icon'
              style={{ backgroundImage: `url("${lucideUri(item.icon, '#C9A96E')}")` }}
            />
            <Text className='feature-label'>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Venue Cards */}
      {(venues.length > 0 || loading) && (
        <View className='venue-section'>
          <View className='venue-grid'>
            {loading && venues.length === 0 ? (
              <>
                <View className='venue-card-skeleton' />
                <View className='venue-card-skeleton' />
              </>
            ) : (
              venues.map((venue, i) => (
                <View
                  key={venue.id}
                  className='venue-card'
                  hoverClass='card-hover'
                  hoverStayTime={80}
                  onClick={() => handleVenueTap(venue.id)}
                >
                  <View className='venue-card-header'>
                    <Text className='venue-card-name'>{venue.name}</Text>
                    <View
                      className='venue-card-arrow'
                      style={{ backgroundImage: `url("${lucideUri('chevron-right', '#C9A96E')}")` }}
                    />
                  </View>
                  <View className='venue-card-cover'>
                    {venue.coverUrl ? (
                      <Image
                        className='venue-cover-img'
                        src={resolveImageUrl(venue.coverUrl)}
                        mode='aspectFill'
                        lazyLoad
                      />
                    ) : (
                      <View
                        className='venue-cover-placeholder'
                        style={{ background: VENUE_COLORS[i % VENUE_COLORS.length] }}
                      >
                        <Text className='venue-cover-icon'>🏠</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* Featured Events */}
      <View className='events-section'>
        <View className='section-header'>
          <Text className='section-title'>精彩活动</Text>
          <Text className='section-more' onClick={handleMore}>查看更多</Text>
        </View>
        {featured.length > 0 ? (
          <ScrollView scrollX className='events-scroll' enableFlex>
            {featured.map((ev, i) => (
              <View
                key={ev.id}
                className='event-thumb'
                hoverClass='card-hover'
                hoverStayTime={80}
                onClick={() => handleEventTap(ev.id)}
              >
                <View className='event-thumb-cover'>
                  {ev.coverUrl ? (
                    <Image
                      className='event-thumb-img'
                      src={resolveImageUrl(ev.coverUrl)}
                      mode='aspectFill'
                      lazyLoad
                    />
                  ) : (
                    <View
                      className='event-thumb-placeholder'
                      style={{ background: EVENT_COLORS[i % EVENT_COLORS.length] }}
                    >
                      <Text className='event-thumb-text'>{ev.title}</Text>
                    </View>
                  )}
                </View>
                <Text className='event-thumb-title'>{ev.title}</Text>
              </View>
            ))}
          </ScrollView>
        ) : loading ? (
          <View className='events-skeleton'>
            <View className='event-thumb-skeleton' />
            <View className='event-thumb-skeleton' />
            <View className='event-thumb-skeleton' />
          </View>
        ) : (
          <View className='empty-tip'>
            <Text className='empty-text'>暂无精彩活动</Text>
          </View>
        )}
      </View>

    </View>
  )
}
