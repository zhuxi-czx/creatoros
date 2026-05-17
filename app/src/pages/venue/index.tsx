import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

const AMENITIES = [
  { icon: '💻', name: '共享工位' },
  { icon: '📡', name: '高速WiFi' },
  { icon: '☕', name: '咖啡茶水' },
  { icon: '🖨️', name: '打印设备' },
  { icon: '🎥', name: '会议室' },
  { icon: '🎮', name: '休闲区' }
]

export default function Venue() {
  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className="venue-page">
      <ScrollView scrollY className="scroll-view">
        {/* Hero */}
        <View className="venue-hero">
          <View className="hero-icon">🏢</View>
          <Text className="venue-name">CreatorOS Hub</Text>
          <Text className="venue-slogan">创作者的聚集地</Text>
        </View>

        {/* Info */}
        <View className="info-section">
          <View className="info-item">
            <Text className="info-icon">📍</Text>
            <View className="info-content">
              <Text className="info-label">地址</Text>
              <Text className="info-value">上海市静安区南京西路 1000 号</Text>
            </View>
          </View>
          <View className="info-item">
            <Text className="info-icon">🕐</Text>
            <View className="info-content">
              <Text className="info-label">开放时间</Text>
              <Text className="info-value">周一至周日 09:00 - 22:00</Text>
            </View>
          </View>
          <View className="info-item">
            <Text className="info-icon">📞</Text>
            <View className="info-content">
              <Text className="info-label">联系方式</Text>
              <Text className="info-value">021-12345678</Text>
            </View>
          </View>
        </View>

        {/* Amenities */}
        <View className="section">
          <Text className="section-title">设施服务</Text>
          <View className="amenities-grid">
            {AMENITIES.map((item, i) => (
              <View key={i} className="amenity-item">
                <Text className="amenity-icon">{item.icon}</Text>
                <Text className="amenity-name">{item.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Description */}
        <View className="section">
          <Text className="section-title">关于空间</Text>
          <Text className="desc-text">
            CreatorOS Hub 是专为创作者、创业者和自由职业者打造的共享工作空间。
            这里汇聚了来自不同领域的创作者，形成一个充满活力的社区。
            我们定期举办各类活动和工作坊，帮助创作者提升技能、拓展人脉。
            无论您是独立开发者、设计师、内容创作者还是创业团队，
            都能在这里找到志同道合的伙伴和灵感。
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}
