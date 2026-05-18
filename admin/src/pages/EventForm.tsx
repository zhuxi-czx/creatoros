import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Card, Form, Input, Button, DatePicker, InputNumber,
  message, Space, Typography, Divider, Select, Upload, Switch
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined, SendOutlined, UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { createEvent, updateEvent, updateEventStatus, getEventDetail, getVenues, uploadImage, type EventFormData } from '../services/event'

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
  const [coverUrl, setCoverUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadVenues()
    if (isEdit && id) loadEvent(id)
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
        hostName: event.hostName,
        maxCapacity: event.maxCapacity,
        price: event.price ? event.price / 100 : 0,
        date: event.date ? dayjs(event.date) : undefined,
        venueId: event.venueId,
        featured: event.featured,
      })
      if (event.coverUrl) setCoverUrl(event.coverUrl)
      setCurrentStatus(event.status)
    } catch {
      message.error('加载活动失败')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleUpload = async (file: File) => {
    try {
      setUploading(true)
      const res = await uploadImage(file)
      setCoverUrl(res.url)
      message.success('封面上传成功')
    } catch {
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
    return false // prevent default upload
  }

  const handleSubmit = async (values: Record<string, unknown>, publish = false) => {
    const data: EventFormData = {
      title: values.title as string,
      description: values.description as string,
      date: (values.date as dayjs.Dayjs)?.toISOString(),
      venueId: (values.venueId as string) || 'default',
      hostName: values.hostName as string,
      maxCapacity: values.maxCapacity as number,
      price: ((values.price as number) || 0) * 100,
      coverUrl: coverUrl || undefined,
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

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
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
          {/* Cover upload */}
          <Form.Item label="封面图片">
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{
                width: 160, height: 100, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                background: coverUrl ? undefined : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              }}>
                {coverUrl && <img src={coverUrl} alt="封面" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={file => { handleUpload(file); return false }}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  {coverUrl ? '更换封面' : '上传封面'}
                </Button>
              </Upload>
            </div>
          </Form.Item>

          <Form.Item label="活动名称" name="title" rules={[{ required: true, message: '请输入活动名称' }]}>
            <Input placeholder="请输入活动名称" maxLength={50} showCount />
          </Form.Item>

          <Form.Item label="活动描述" name="description">
            <TextArea placeholder="请输入活动描述" rows={4} maxLength={500} showCount />
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

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item label="发起人" name="hostName" style={{ flex: 1 }}>
              <Input placeholder="发起人名称" />
            </Form.Item>
            <Form.Item label="人数上限" name="maxCapacity" rules={[{ required: true, message: '请输入' }]} style={{ flex: 1 }}>
              <InputNumber placeholder="30" min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="费用 (元)" name="price" style={{ flex: 1 }}>
              <InputNumber placeholder="0" min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item name="featured" valuePropName="checked" label="社区精选" style={{ marginBottom: 8 }}>
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button onClick={() => navigate('/events')}>取消</Button>
              <Button htmlType="submit" icon={<SaveOutlined />} loading={loading}>保存草稿</Button>
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
  )
}
