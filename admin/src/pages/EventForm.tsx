import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Card, Form, Input, Button, DatePicker, InputNumber,
  message, Space, Typography, Divider, Select, Upload, Switch, Image
} from 'antd'
import {
  ArrowLeftOutlined, SaveOutlined, SendOutlined, UploadOutlined,
  ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { createEvent, updateEvent, updateEventStatus, getEventDetail, getVenues, uploadImage, type EventFormData } from '../services/event'
import { resolveImageUrl } from '../services/api'
import RichEditor from '../components/RichEditor'

const { Title } = Typography
const { TextArea } = Input

export default function EventForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [currentStatus, setCurrentStatus] = useState('DRAFT')
  const [venues, setVenues] = useState<any[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadVenues()
    if (isEdit && id) {
      loadEvent(id)
    } else {
      form.setFieldsValue({ autoplay: false, interval: 3, isFree: true })
    }
  }, [id])

  const loadVenues = async () => {
    try {
      const data = await getVenues()
      setVenues(Array.isArray(data) ? data : [])
    } catch { /* optional */ }
  }

  const loadEvent = async (eventId: string) => {
    try {
      setFetchLoading(true)
      const event = await getEventDetail(eventId)
      form.setFieldsValue({
        title: event.title,
        description: event.description,
        highlights: event.highlights,
        schedule: event.schedule,
        notes: event.notes,
        hostName: event.hostName,
        maxCapacity: event.maxCapacity,
        isFree: !event.price,
        price: event.price ? event.price / 100 : 0,
        date: event.date ? dayjs(event.date) : undefined,
        venueId: event.venueId,
        featured: event.featured,
        autoplay: (event.imageUrls?.length || 0) > 1 ? event.autoplay !== false : false,
        interval: event.interval ? event.interval / 1000 : 3,
      })
      if (event.imageUrls && event.imageUrls.length > 0) {
        setImageUrls(event.imageUrls)
      } else if (event.coverUrl) {
        setImageUrls([event.coverUrl])
      }
      setCurrentStatus(event.status)
    } catch {
      message.error('加载活动失败')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleUpload = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      message.error('仅支持 JPG、PNG、GIF、WebP 格式')
      return false
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('图片大小不能超过 5MB')
      return false
    }
    try {
      setUploading(true)
      const res = await uploadImage(file, 'event')
      setImageUrls(prev => {
        const next = [...prev, res.url]
        if (next.length > 1) form.setFieldValue('autoplay', true)
        return next
      })
      message.success('图片上传成功')
    } catch {
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
    return false
  }

  const moveImage = useCallback((index: number, direction: 'up' | 'down') => {
    setImageUrls(prev => {
      const arr = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= arr.length) return prev
      ;[arr[index], arr[targetIndex]] = [arr[targetIndex], arr[index]]
      return arr
    })
  }, [])

  const removeImage = useCallback((index: number) => {
    setImageUrls(prev => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length <= 1) form.setFieldValue('autoplay', false)
      return next
    })
  }, [form])

  const handleSubmit = async (values: Record<string, unknown>, publish = false) => {
    const data: EventFormData = {
      title: values.title as string,
      description: values.description as string,
      highlights: values.highlights as string || undefined,
      schedule: values.schedule as string || undefined,
      notes: values.notes as string || undefined,
      date: (values.date as dayjs.Dayjs)?.toISOString(),
      venueId: (values.venueId as string) || 'default',
      hostName: values.hostName as string,
      maxCapacity: values.maxCapacity as number,
      price: values.isFree ? 0 : ((values.price as number) || 0) * 100,
      coverUrl: imageUrls[0] || undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      autoplay: imageUrls.length > 1 ? (values.autoplay as boolean) : undefined,
      interval: imageUrls.length > 1 && values.autoplay
        ? Math.round(((values.interval as number) || 3) * 1000)
        : undefined,
      status: publish ? 'PUBLISHED' : undefined,
      featured: values.featured as boolean,
    }

    try {
      setLoading(true)
      if (isEdit && id) {
        await updateEvent(id, data)
        if (publish && currentStatus === 'DRAFT') await updateEventStatus(id, 'PUBLISHED')
        message.success('更新成功')
      } else {
        if (publish) data.status = 'PUBLISHED'
        await createEvent(data)
        message.success('创建成功')
      }
      navigate('/events')
    } catch {
      message.error(isEdit ? '更新失败' : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const [showPreview, setShowPreview] = useState(false)
  // 域名(HTTPS)下预览指向 H5 域名，避免 HTTPS 页面嵌 HTTP iframe 被拦；IP 下走 :4002
  const h5Base = window.location.hostname.endsWith('creatorbar.cn')
    ? 'https://creatorbar.cn'
    : `${window.location.protocol}//${window.location.hostname}:4002`

  return (
    <div style={{ display: 'flex', gap: 24, maxWidth: showPreview ? 1100 : 680, margin: '0 auto' }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <Space style={{ marginBottom: 24 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/events')} />
        <Title level={4} style={{ margin: 0 }}>{isEdit ? '编辑活动' : '新建活动'}</Title>
        {isEdit && (
          <span style={{
            padding: '2px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500,
            background: currentStatus === 'PUBLISHED' ? '#F0FDF4' : '#F5F5F5',
            color: currentStatus === 'PUBLISHED' ? '#22C55E' : '#999',
          }}>
            {currentStatus === 'DRAFT' ? '草稿' : currentStatus === 'PUBLISHED' ? '已发布' : currentStatus}
          </span>
        )}
      </Space>

      <Card bordered={false} style={{ borderRadius: 16 }} loading={fetchLoading}>
        <Form form={form} layout="vertical" onFinish={values => handleSubmit(values, false)}>
          {/* Multi-image upload */}
          <Form.Item label="活动图片">
            <Upload
              accept="image/*"
              showUploadList={false}
              multiple
              beforeUpload={file => { handleUpload(file); return false }}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                上传图片
              </Button>
            </Upload>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              支持 JPG/PNG 格式，单张不超过 5MB，建议宽高比 16:9，系统会自动裁剪压缩
            </div>
            {imageUrls.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {imageUrls.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: 8,
                      background: '#fafafa',
                      borderRadius: 8,
                      border: '1px solid #f0f0f0',
                    }}
                  >
                    <Image
                      src={resolveImageUrl(url)}
                      width={80}
                      height={50}
                      style={{ objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                      preview={{ mask: '预览' }}
                    />
                    <span style={{ flex: 1, fontSize: 12, color: index === 0 ? '#6366f1' : '#999' }}>
                      {index === 0 ? '封面(第1张)' : `第${index + 1}张`}
                    </span>
                    <Space size={2}>
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => moveImage(index, 'up')}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={index === imageUrls.length - 1}
                        onClick={() => moveImage(index, 'down')}
                      />
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeImage(index)}
                      />
                    </Space>
                  </div>
                ))}
              </div>
            )}
          </Form.Item>

          {/* Carousel settings */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>轮播设置</span>
              <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>上传2张及以上图片可开启轮播</span>
            </div>
            <Space size={24} align="center">
              <Space size={8} align="center">
                <span style={{ fontSize: 13 }}>开启轮播</span>
                <Form.Item name="autoplay" valuePropName="checked" initialValue={false} noStyle>
                  <Switch disabled={imageUrls.length <= 1} />
                </Form.Item>
              </Space>
              <Space size={8} align="center">
                <span style={{ fontSize: 13 }}>轮播时长(秒)</span>
                <Form.Item name="interval" initialValue={3} noStyle>
                  <InputNumber min={1} max={30} step={0.5} style={{ width: 80 }} disabled={imageUrls.length <= 1} />
                </Form.Item>
              </Space>
            </Space>
          </div>

          <Form.Item label="活动名称" name="title" rules={[{ required: true, message: '请输入活动名称' }]}>
            <Input placeholder="请输入活动名称" maxLength={50} showCount />
          </Form.Item>

          <Form.Item label="活动描述（图文正文）" name="description">
            <RichEditor placeholder="请输入活动详情图文内容" />
          </Form.Item>
          <Form.Item label="活动亮点" name="highlights">
            <TextArea placeholder="活动特色和亮点，每行一个（可选）" rows={3} maxLength={500} showCount />
          </Form.Item>
          <Form.Item label="活动流程" name="schedule">
            <TextArea placeholder="活动时间安排和流程（可选）" rows={3} maxLength={500} showCount />
          </Form.Item>
          <Form.Item label="注意事项" name="notes">
            <TextArea placeholder="参与者须知、费用说明等（可选）" rows={3} maxLength={500} showCount />
          </Form.Item>

          <Form.Item label="活动时间" name="date" rules={[{ required: true, message: '请选择活动时间' }]}>
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} placeholder="选择活动时间" />
          </Form.Item>

          <Form.Item label="活动场地" name="venueId">
            <Select
              placeholder="选择场地（不选则使用默认场地）"
              allowClear
              options={venues.map(v => ({ label: `${v.name} · ${v.city}`, value: v.id }))}
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="发起人" name="hostName" style={{ flex: 1, marginBottom: 16 }}>
              <Input placeholder="发起人名称" />
            </Form.Item>
            <Form.Item label="人数上限" name="maxCapacity" rules={[{ required: true, message: '请输入' }]} style={{ flex: 1, marginBottom: 16 }}>
              <InputNumber placeholder="30" min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="免费报名" name="isFree" valuePropName="checked" style={{ flex: 1, marginBottom: 16 }}>
              <Switch checkedChildren="免费" unCheckedChildren="付费" />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.isFree !== cur.isFree}>
              {({ getFieldValue }) =>
                getFieldValue('isFree') ? null : (
                  <Form.Item label="费用 (元)" name="price" style={{ flex: 1, marginBottom: 16 }}>
                    <InputNumber placeholder="0" min={0} style={{ width: '100%' }} />
                  </Form.Item>
                )
              }
            </Form.Item>
          </div>

          <Form.Item name="featured" valuePropName="checked" label="社区精选" style={{ marginBottom: 8 }}>
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>

          <Divider />

          {/* Preview toggle */}
          {isEdit && (
            <Form.Item>
              <Button
                type={showPreview ? 'default' : 'dashed'}
                onClick={() => setShowPreview(!showPreview)}
                style={{ width: '100%' }}
              >
                {showPreview ? '关闭预览' : '📱 手机预览'}
              </Button>
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button onClick={() => navigate('/events')}>取消</Button>
              <Button icon={<SaveOutlined />} loading={loading} htmlType="submit">
                保存草稿
              </Button>
              <Button
                type="primary" icon={<SendOutlined />} loading={loading}
                onClick={() => form.validateFields().then(values => handleSubmit(values, true))}
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}
              >
                {isEdit && currentStatus === 'PUBLISHED' ? '保存并发布' : '发布活动'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>

    {/* Phone Preview Panel */}
    {showPreview && isEdit && (
      <div style={{ width: 375, flexShrink: 0, position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
        <div style={{
          background: '#1A1A1A',
          borderRadius: 48,
          padding: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          position: 'relative',
        }}>
          {/* Dynamic Island（悬浮于内容顶部，模拟真机）*/}
          <div style={{
            position: 'absolute',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 88,
            height: 24,
            borderRadius: 14,
            background: '#000',
            zIndex: 2,
          }} />
          <iframe
            src={`${h5Base}/event/${id}`}
            style={{
              display: 'block',
              width: '100%',
              height: 760, // 现代 iPhone 屏幕比例（约 390×844）
              border: 'none',
              borderRadius: 36,
              background: '#fff',
            }}
            title="预览"
          />
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#999' }}>
          H5 实时预览（保存后刷新生效）
        </div>
      </div>
    )}
    </div>
  )
}
