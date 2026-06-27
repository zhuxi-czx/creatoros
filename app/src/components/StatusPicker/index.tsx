import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { setStatuses } from '../../services/user'
import './index.scss'

const STATUS_OPTIONS = [
  '自由职业者', '创业者', '学生', '上班族有副业', '上班族寻找副业中',
  '离职空档期', '博主', '艺术家', '科技从业者', '其他',
]

interface Props {
  visible: boolean
  /** 忽略或确认后回调（已弹过，无论是否选择都不再弹）*/
  onDone: () => void
}

export default function StatusPicker({ visible, onDone }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  if (!visible) return null

  const toggle = (s: string) => {
    setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  const submit = async (statuses: string[]) => {
    if (submitting) return
    setSubmitting(true)
    try {
      await setStatuses(statuses)
    } catch (e) {
      // 保存失败也不阻塞用户，下次进入仍会因 statusPrompted=false 再弹
    } finally {
      setSubmitting(false)
      onDone()
    }
  }

  return (
    <View className='status-mask'>
      <View className='status-card'>
        <Text className='status-title'>你目前的状态？</Text>
        <Text className='status-sub'>可多选 · 方便为你推荐合适的活动</Text>
        <View className='status-chips'>
          {STATUS_OPTIONS.map((s) => {
            const on = selected.includes(s)
            return (
              <View key={s} className={`status-chip ${on ? 'active' : ''}`} onClick={() => toggle(s)}>
                <Text className={`status-chip-text ${on ? 'active' : ''}`}>{s}</Text>
              </View>
            )
          })}
        </View>
        <View className='status-footer'>
          <Text className='status-ignore' onClick={() => submit([])}>忽略</Text>
          <View className='status-confirm' onClick={() => submit(selected)}>
            <Text className='status-confirm-text'>确认</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
