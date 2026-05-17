import { useState, useEffect } from 'react'
import { View, Text, Input, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../stores/useAuthStore'
import { updateProfile } from '../../services/user'
import './index.scss'

const PRESET_TAGS = ['开发者', '设计师', '产品经理', '创业者', '投资人', '营销人', '内容创作者', '自由职业']

export default function ProfileEdit() {
  const { user, login, token } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(user?.tags || [])
  const [saving, setSaving] = useState(false)

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag])
    } else {
      Taro.showToast({ title: '最多选择5个标签', icon: 'none' })
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    try {
      setSaving(true)
      const updatedUser = await updateProfile({ name, bio, tags: selectedTags })
      if (token) {
        login(token, updatedUser)
      }
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    } catch (err) {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className="profile-edit-page">
      {/* Form */}
      <View className="form">
        <View className="form-group">
          <Text className="form-label">昵称</Text>
          <Input
            className="form-input"
            value={name}
            onInput={e => setName(e.detail.value)}
            placeholder="请输入昵称"
            maxlength={20}
          />
        </View>

        <View className="form-group">
          <Text className="form-label">个人简介</Text>
          <Textarea
            className="form-textarea"
            value={bio}
            onInput={e => setBio(e.detail.value)}
            placeholder="介绍一下自己（选填）"
            maxlength={200}
            autoHeight
          />
          <Text className="char-count">{bio.length}/200</Text>
        </View>

        <View className="form-group">
          <Text className="form-label">身份标签（最多5个）</Text>
          <View className="tags-grid">
            {PRESET_TAGS.map(tag => (
              <View
                key={tag}
                className={`tag-item ${selectedTags.includes(tag) ? 'selected' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                <Text>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Save Button */}
      <View className="bottom-action">
        <View
          className={`save-btn ${saving ? 'loading' : ''}`}
          onClick={handleSave}
        >
          <Text>{saving ? '保存中...' : '保存'}</Text>
        </View>
      </View>
    </View>
  )
}
