import { useState, useEffect } from 'react'
import { View, Text, Input, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../stores/useAuthStore'
import { updateProfile } from '../../services/user'
import './index.scss'

export default function ProfileEdit() {
  const { user, login, token } = useAuthStore()
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [city, setCity] = useState(user?.city || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    try {
      setSaving(true)
      const updatedUser = await updateProfile({ nickname, bio, city })
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
            value={nickname}
            onInput={e => setNickname(e.detail.value)}
            placeholder="请输入昵称"
            maxlength={20}
          />
        </View>

        <View className="form-group">
          <Text className="form-label">城市</Text>
          <Input
            className="form-input"
            value={city}
            onInput={e => setCity(e.detail.value)}
            placeholder="请输入城市（选填）"
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
