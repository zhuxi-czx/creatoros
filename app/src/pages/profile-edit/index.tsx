import { useState, useEffect } from 'react'
import { View, Text, Input, Textarea, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../stores/useAuthStore'
import { updateProfile, getProfile } from '../../services/user'
import { uploadImage, resolveImageUrl } from '../../services/api'
import './index.scss'

export default function ProfileEdit() {
  const { user, login, token } = useAuthStore()
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [city, setCity] = useState(user?.city || '')
  const [tempAvatar, setTempAvatar] = useState('')
  const [saving, setSaving] = useState(false)

  // Creator 资料
  const isCreator = !!user?.isCreator
  const [cTitle, setCTitle] = useState('')
  const [cTagline, setCTagline] = useState('')
  const [cIntro, setCIntro] = useState('')
  const [cTags, setCTags] = useState('')
  const [cCoverUrl, setCCoverUrl] = useState('') // 已保存封面（/uploads 路径）
  const [cCoverTemp, setCCoverTemp] = useState('') // 本地待上传

  useEffect(() => {
    if (!isCreator) return
    getProfile().then((u) => {
      const p = u.creatorProfile
      if (p) {
        setCTitle(p.title || '')
        setCTagline(p.tagline || '')
        setCIntro(p.intro || '')
        setCTags((p.tags || []).join('、'))
        setCCoverUrl(p.coverUrl || '')
      }
    }).catch(() => {})
  }, [isCreator])

  const onChooseAvatar = (e: any) => {
    const url = e?.detail?.avatarUrl
    if (url) setTempAvatar(url)
  }

  const chooseCover = async () => {
    try {
      const res = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] })
      const path = res.tempFilePaths?.[0]
      if (path) setCCoverTemp(path)
    } catch (e) { /* 用户取消 */ }
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
        try {
          const up = await uploadImage(tempAvatar, 'avatar')
          avatarUrl = up.url
        } catch (e) { /* 头像上传失败不阻断保存 */ }
      }

      const payload: any = {
        nickname, bio, city,
        ...(avatarUrl ? { avatarUrl } : {}),
      }

      if (isCreator) {
        let coverUrl = cCoverUrl
        if (cCoverTemp) {
          try {
            const up = await uploadImage(cCoverTemp, 'creator')
            coverUrl = up.url
          } catch (e) { /* 封面上传失败不阻断 */ }
        }
        payload.creatorTitle = cTitle
        payload.creatorTagline = cTagline
        payload.creatorIntro = cIntro
        payload.creatorCoverUrl = coverUrl
        payload.creatorTags = cTags
          .split(/[、,，\s]+/)
          .map((t) => t.trim())
          .filter(Boolean)
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
      {/* Avatar */}
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

      {/* Form */}
      <View className="form">
        <View className="form-group">
          <Text className="form-label">昵称</Text>
          <Input
            className="form-input"
            type="nickname"
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

      {/* Creator 资料 */}
      {isCreator && (
        <View className="form">
          <View className="creator-section-title">
            <Text className="creator-section-text">Creator 资料</Text>
            <Text className="creator-section-hint">展示在 Creator 卡片与个人主页</Text>
          </View>

          <View className="form-group">
            <Text className="form-label">封面大图</Text>
            <View className="cover-box" onClick={chooseCover}>
              {(cCoverTemp || cCoverUrl) ? (
                <Image className="cover-img" src={cCoverTemp || resolveImageUrl(cCoverUrl)} mode="aspectFill" />
              ) : (
                <View className="cover-ph"><Text className="cover-ph-text">＋ 上传封面</Text></View>
              )}
            </View>
          </View>

          <View className="form-group">
            <Text className="form-label">身份头衔</Text>
            <Input
              className="form-input"
              value={cTitle}
              onInput={e => setCTitle(e.detail.value)}
              placeholder="如：外贸SOHO创业者 · 前大厂KA总监"
              maxlength={40}
            />
          </View>

          <View className="form-group">
            <Text className="form-label">一句话亮点</Text>
            <Input
              className="form-input"
              value={cTagline}
              onInput={e => setCTagline(e.detail.value)}
              placeholder="如：裸辞1年，营收400万+"
              maxlength={40}
            />
          </View>

          <View className="form-group">
            <Text className="form-label">自我介绍</Text>
            <Textarea
              className="form-textarea"
              value={cIntro}
              onInput={e => setCIntro(e.detail.value)}
              placeholder="介绍你的经历与擅长"
              maxlength={500}
              autoHeight
            />
            <Text className="char-count">{cIntro.length}/500</Text>
          </View>

          <View className="form-group">
            <Text className="form-label">标签</Text>
            <Input
              className="form-input"
              value={cTags}
              onInput={e => setCTags(e.detail.value)}
              placeholder="用、分隔，如：外贸SOHO、大客户销售"
              maxlength={60}
            />
          </View>
        </View>
      )}

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
