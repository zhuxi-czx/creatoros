import { useState } from 'react'
import { View, Text, Input, Textarea, Button, Image, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../stores/useAuthStore'
import { updateProfile } from '../../services/user'
import { uploadImage, resolveImageUrl } from '../../services/api'
import { lucideUri } from '../../utils/lucide'
import './index.scss'

const GENDERS = ['男', '女', '其他']
const MBTI_LIST = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP']
const ZODIAC_LIST = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座']

const chevron = lucideUri('chevron-right', '#CCCCCC')

export default function ProfileEdit() {
  const { user, login, token } = useAuthStore()
  const welcome = Taro.getCurrentInstance().router?.params?.welcome
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [city, setCity] = useState(user?.city || '')
  const [gender, setGender] = useState(user?.gender || '')
  const [mbti, setMbti] = useState(user?.mbti || '')
  const [zodiac, setZodiac] = useState(user?.zodiac || '')
  const [tags, setTags] = useState<string[]>(user?.tags || [])
  const [tempAvatar, setTempAvatar] = useState('')
  const [saving, setSaving] = useState(false)

  const onChooseAvatar = (e: any) => {
    const url = e?.detail?.avatarUrl
    if (url) setTempAvatar(url)
  }

  const onCityChange = (e: any) => {
    const v = e.detail.value // [省, 市, 区]
    setCity(Array.isArray(v) ? v.filter(Boolean).slice(0, 2).join(' ') : v)
  }
  const onMbtiChange = (e: any) => setMbti(MBTI_LIST[Number(e.detail.value)])
  const onZodiacChange = (e: any) => setZodiac(ZODIAC_LIST[Number(e.detail.value)])

  const addTag = () => {
    Taro.showModal({ title: '添加个性标签', editable: true, placeholderText: '如 精酿爱好者' } as any).then((res: any) => {
      const t = res.confirm && res.content ? res.content.trim() : ''
      if (t) setTags((prev) => (prev.includes(t) ? prev : [...prev, t]))
    })
  }
  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t))

  const handleSave = async () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    if (!tempAvatar && !user?.avatarUrl) {
      Taro.showToast({ title: '请选择头像', icon: 'none' })
      return
    }
    try {
      setSaving(true)
      let avatarUrl = user?.avatarUrl
      if (tempAvatar) {
        try { const up = await uploadImage(tempAvatar, 'avatar'); avatarUrl = up.url } catch (e) { /* 忽略上传失败 */ }
      }
      const payload: any = {
        nickname, bio, city, gender, mbti, zodiac, tags,
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
    <View className='pe-page'>
      {welcome ? (
        <View className='pe-welcome'>
          <Text className='pe-welcome-text'>👋 欢迎加入！完善头像和昵称，让大家更好地认识你</Text>
        </View>
      ) : null}
      {/* 头像区 */}
      <View className='pe-avatar-group'>
        <Button className='pe-avatar-btn' openType='chooseAvatar' onChooseAvatar={onChooseAvatar}>
          {(tempAvatar || user?.avatarUrl) ? (
            <Image className='pe-avatar-img' src={tempAvatar || resolveImageUrl(user?.avatarUrl)} mode='aspectFill' />
          ) : (
            <View className='pe-avatar-ph'><Text className='pe-avatar-ph-text'>＋</Text></View>
          )}
          <View className='pe-avatar-cam'>
            <View className='pe-avatar-cam-icon' style={{ backgroundImage: `url("${lucideUri('camera', '#ffffff')}")` }} />
          </View>
        </Button>
        <Text className='pe-avatar-tip'>点击更换头像</Text>
      </View>

      {/* 卡片一：基本资料 */}
      <View className='pe-card'>
        <View className='pe-row'>
          <Text className='pe-label'>昵称</Text>
          <Input className='pe-input' type='nickname' value={nickname} onInput={(e) => setNickname(e.detail.value)} placeholder='请输入昵称' maxlength={20} />
        </View>
        <View className='pe-divider' />
        <View className='pe-row pe-row--seg'>
          <Text className='pe-label'>性别</Text>
          <View className='pe-seg'>
            {GENDERS.map((g) => (
              <View key={g} className={`pe-chip ${gender === g ? 'pe-chip--on' : ''}`} onClick={() => setGender(g)}>
                <Text className={`pe-chip-text ${gender === g ? 'pe-chip-text--on' : ''}`}>{g}</Text>
              </View>
            ))}
          </View>
        </View>
        <View className='pe-divider' />
        <Picker mode='region' onChange={onCityChange}>
          <View className='pe-row pe-row--link'>
            <Text className='pe-label'>城市</Text>
            <View className='pe-linkval'>
              <Text className={`pe-val ${city ? '' : 'pe-val--ph'}`}>{city || '请选择城市'}</Text>
              <View className='pe-chevron' style={{ backgroundImage: `url("${chevron}")` }} />
            </View>
          </View>
        </Picker>
      </View>

      {/* 卡片二：个人简介 */}
      <View className='pe-card pe-card--pad'>
        <Text className='pe-label'>个人简介</Text>
        <View className='pe-bio-box'>
          <Textarea className='pe-textarea' value={bio} onInput={(e) => setBio(e.detail.value)} placeholder='介绍一下自己（选填）' maxlength={200} autoHeight />
        </View>
        <Text className='pe-count'>{bio.length}/200</Text>
      </View>

      {/* 卡片三：个性标签 */}
      <View className='pe-card'>
        <Picker mode='selector' range={MBTI_LIST} onChange={onMbtiChange}>
          <View className='pe-row pe-row--link'>
            <Text className='pe-label'>MBTI</Text>
            <View className='pe-linkval'>
              <Text className={`pe-val ${mbti ? '' : 'pe-val--ph'}`}>{mbti || '请选择'}</Text>
              <View className='pe-chevron' style={{ backgroundImage: `url("${chevron}")` }} />
            </View>
          </View>
        </Picker>
        <View className='pe-divider' />
        <Picker mode='selector' range={ZODIAC_LIST} onChange={onZodiacChange}>
          <View className='pe-row pe-row--link'>
            <Text className='pe-label'>星座</Text>
            <View className='pe-linkval'>
              <Text className={`pe-val ${zodiac ? '' : 'pe-val--ph'}`}>{zodiac || '请选择'}</Text>
              <View className='pe-chevron' style={{ backgroundImage: `url("${chevron}")` }} />
            </View>
          </View>
        </Picker>
        <View className='pe-divider' />
        <View className='pe-tagsarea'>
          <Text className='pe-label'>个性标签（可自定义）</Text>
          <View className='pe-chips'>
            {tags.map((t) => (
              <View key={t} className='pe-tag' onClick={() => removeTag(t)}>
                <Text className='pe-tag-text'>{t}</Text>
              </View>
            ))}
            <View className='pe-tag-add' onClick={addTag}>
              <View className='pe-tag-add-icon' style={{ backgroundImage: `url("${lucideUri('plus', '#C9A96E')}")` }} />
              <Text className='pe-tag-add-text'>添加</Text>
            </View>
          </View>
          {tags.length > 0 && <Text className='pe-tag-hint'>点击标签可删除</Text>}
        </View>
      </View>

      {/* 保存 */}
      <View className='pe-bottom'>
        <View className={`pe-save ${saving ? 'loading' : ''}`} onClick={handleSave}>
          <Text className='pe-save-text'>{saving ? '保存中...' : '保存'}</Text>
        </View>
      </View>
    </View>
  )
}
