import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, Swiper, SwiperItem } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getBanners } from '../../services/banner'
import { getVenues } from '../../services/venue'
import { getFeaturedEvents } from '../../services/event'
import type { Banner } from '../../services/banner'
import type { Venue } from '../../services/venue'
import type { Event } from '../../services/event'
import './index.scss'

const FEATURE_ICONS = [
  { label: '主题分享', icon: '💬' },
  { label: '活动策划', icon: '📅' },
  { label: 'PlanF', icon: '🚀' },
  { label: 'Creator', icon: '⭐' },
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
                  src={banner.imageUrl}
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
          <View key={i} className='feature-item'>
            <View className='feature-icon-wrap'>
              <Text className='feature-icon'>{item.icon}</Text>
            </View>
            <Text className='feature-label'>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Venue Cards */}
      {(venues.length > 0 || loading) && (
        <View className='venue-section'>
          <ScrollView scrollX className='venue-scroll' enableFlex>
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
                  onClick={() => handleVenueTap(venue.id)}
                >
                  <View className='venue-card-header'>
                    <Text className='venue-card-name'>{venue.name}</Text>
                    <Text className='venue-card-arrow'>{'>'}</Text>
                  </View>
                  <View className='venue-card-cover'>
                    {venue.coverUrl ? (
                      <Image
                        className='venue-cover-img'
                        src={venue.coverUrl}
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
          </ScrollView>
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
                onClick={() => handleEventTap(ev.id)}
              >
                <View className='event-thumb-cover'>
                  <View
                    className='event-thumb-placeholder'
                    style={{ background: ev.coverColor || EVENT_COLORS[i % EVENT_COLORS.length] }}
                  >
                    <Text className='event-thumb-text'>{ev.title}</Text>
                  </View>
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
