import { useState } from 'react'
import { View, Text, Input, Textarea, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../stores/useAuthStore'
import { updateProfile } from '../../services/user'
import { uploadImage, resolveImageUrl } from '../../services/api'
import './index.scss'

const GENDERS = ['男', '女', '其他']

export default function ProfileEdit() {
  const { user, login, token } = useAuthStore()
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [city, setCity] = useState(user?.city || '')
  const [gender, setGender] = useState(user?.gender || '')
  const [mbti, setMbti] = useState(user?.mbti || '')
  const [zodiac, setZodiac] = useState(user?.zodiac || '')
  const [tags, setTags] = useState((user?.tags || []).join('、'))
  const [tempAvatar, setTempAvatar] = useState('')
  const [saving, setSaving] = useState(false)

  const onChooseAvatar = (e: any) => {
    const url = e?.detail?.avatarUrl
    if (url) setTempAvatar(url)
  }

  const handleSave = async () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    try {
      setSaving(true)
      let avatarUrl = user?.avatarUrl
      if (tempAvatar) {
        try { const up = await uploadImage(tempAvatar, 'avatar'); avatarUrl = up.url } catch (e) { /* */ }
      }
      const payload: any = {
        nickname, bio, city, gender, mbti, zodiac,
        tags: tags.split(/[、,，\s]+/).map((t: string) => t.trim()).filter(Boolean),
        ...(avatarUrl ? { avatarUrl } : {}),
      }
      const updatedUser = await updateProfile(payload)
      if (token) login(token, updatedUser)
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
      <View className="avatar-group">
        <Button className="avatar-btn" openType="chooseAvatar" onChooseAvatar={onChooseAvatar}>
          {(tempAvatar || user?.avatarUrl) ? (
            <Image className="avatar-img" src={tempAvatar || resolveImageUrl(user?.avatarUrl)} mode="aspectFill" />
          ) : (
            <View className="avatar-ph"><Text className="avatar-ph-text">＋</Text></View>
          )}
        </Button>
        <Text className="avatar-tip">点击设置微信头像</Text>
      </View>

      <View className="form">
        <View className="form-group">
          <Text className="form-label">昵称</Text>
          <Input className="form-input" type="nickname" value={nickname} onInput={e => setNickname(e.detail.value)} placeholder="请输入昵称" maxlength={20} />
        </View>

        <View className="form-group">
          <Text className="form-label">性别</Text>
          <View style={{ display: 'flex', gap: '20rpx', marginTop: '12rpx' }}>
            {GENDERS.map((g) => (
              <View key={g} onClick={() => setGender(g)}
                style={{ padding: '12rpx 40rpx', borderRadius: '36rpx', background: gender === g ? '#C9A96E' : '#F2F2F2' }}>
                <Text style={{ fontSize: '26rpx', color: gender === g ? '#fff' : '#666' }}>{g}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="form-group">
          <Text className="form-label">城市</Text>
          <Input className="form-input" value={city} onInput={e => setCity(e.detail.value)} placeholder="请输入城市（选填）" maxlength={20} />
        </View>

        <View className="form-group">
          <Text className="form-label">MBTI</Text>
          <Input className="form-input" value={mbti} onInput={e => setMbti(e.detail.value)} placeholder="如 INFJ（选填）" maxlength={4} />
        </View>

        <View className="form-group">
          <Text className="form-label">星座</Text>
          <Input className="form-input" value={zodiac} onInput={e => setZodiac(e.detail.value)} placeholder="如 天蝎座（选填）" maxlength={6} />
        </View>

        <View className="form-group">
          <Text className="form-label">个人简介</Text>
          <Textarea className="form-textarea" value={bio} onInput={e => setBio(e.detail.value)} placeholder="介绍一下自己（选填）" maxlength={200} autoHeight />
          <Text className="char-count">{bio.length}/200</Text>
        </View>

        <View className="form-group">
          <Text className="form-label">个性标签</Text>
          <Input className="form-input" value={tags} onInput={e => setTags(e.detail.value)} placeholder="用、分隔，如：精酿爱好者、独立音乐" maxlength={60} />
        </View>
      </View>

      <View className="bottom-action">
        <View className={`save-btn ${saving ? 'loading' : ''}`} onClick={handleSave}>
          <Text>{saving ? '保存中...' : '保存'}</Text>
        </View>
      </View>
    </View>
  )
}
