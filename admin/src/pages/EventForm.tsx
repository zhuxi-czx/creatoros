import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Card, Form, Input, Button, DatePicker, InputNumber,
  Select, message, Space, Typography, Divider
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { createEvent, updateEvent, getEventDetail, type EventFormData } from '../services/event'

const { Title, Text } = Typography
const { TextArea } = Input
const { RangePicker } = DatePicker

const COVER_COLORS = [
  { label: '紫色渐变', value: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  { label: '粉紫渐变', value: 'linear-gradient(135deg, #ec4899, #8b5cf6)' },
  { label: '绿蓝渐变', value: 'linear-gradient(135deg, #10b981, #3b82f6)' },
  { label: '橙红渐变', value: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  { label: '蓝紫渐变', value: 'linear-gradient(135deg, #3b82f6, #6366f1)' }
]

export default function EventForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [previewColor, setPreviewColor] = useState(COVER_COLORS[0].value)

  useEffect(() => {
    if (isEdit && id) {
      loadEvent(Number(id))
    }
  }, [id])

  const loadEvent = async (eventId: number) => {
    try {
      setFetchLoading(true)
      const event = await getEventDetail(eventId)
      form.setFieldsValue({
        title: event.title,
        description: event.description,
        location: event.location,
        hostName: event.hostName,
        capacity: event.capacity,
        coverColor: event.coverColor || COVER_COLORS[0].value,
        tags: event.tags || [],
        timeRange: event.startTime && event.endTime
          ? [dayjs(event.startTime), dayjs(event.endTime)]
          : undefined
      })
      if (event.coverColor) setPreviewColor(event.coverColor)
    } catch (err) {
      message.error('加载活动失败')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    const [startTime, endTime] = (values.timeRange as [dayjs.Dayjs, dayjs.Dayjs]) || []

    const data: EventFormData = {
      title: values.title as string,
      description: values.description as string,
      location: values.location as string,
      hostName: values.hostName as string,
      capacity: values.capacity as number | undefined,
      coverColor: values.coverColor as string,
      tags: values.tags as string[] | undefined,
      startTime: startTime?.toISOString(),
      endTime: endTime?.toISOString()
    }

    try {
      setLoading(true)
      if (isEdit && id) {
        await updateEvent(Number(id), data)
        message.success('更新成功')
      } else {
        await createEvent(data)
        message.success('创建成功')
      }
      navigate('/events')
    } catch (err) {
      message.error(isEdit ? '更新失败' : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <Space style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/events')}
        />
        <Title level={4} style={{ margin: 0 }}>
          {isEdit ? '编辑活动' : '新建活动'}
        </Title>
      </Space>

      <Card bordered={false} style={{ borderRadius: 16 }} loading={fetchLoading}>
        {/* Preview */}
        <div
          style={{
            height: 120,
            borderRadius: 12,
            background: previewColor,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'flex-end',
            padding: 16
          }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>封面预览</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ coverColor: COVER_COLORS[0].value }}
        >
          <Form.Item
            label="活动名称"
            name="title"
            rules={[{ required: true, message: '请输入活动名称' }]}
          >
            <Input placeholder="请输入活动名称" maxLength={50} showCount />
          </Form.Item>

          <Form.Item
            label="活动描述"
            name="description"
            rules={[{ required: true, message: '请输入活动描述' }]}
          >
            <TextArea
              placeholder="请输入活动描述"
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="活动时间"
            name="timeRange"
            rules={[{ required: true, message: '请选择活动时间' }]}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>

          <Form.Item
            label="活动地点"
            name="location"
            rules={[{ required: true, message: '请输入活动地点' }]}
          >
            <Input placeholder="请输入活动地点" />
          </Form.Item>

          <Form.Item
            label="主办方"
            name="hostName"
            rules={[{ required: true, message: '请输入主办方名称' }]}
          >
            <Input placeholder="请输入主办方名称" />
          </Form.Item>

          <Form.Item
            label="人数上限"
            name="capacity"
          >
            <InputNumber
              placeholder="不填则不限制"
              min={1}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="封面颜色"
            name="coverColor"
          >
            <Select
              options={COVER_COLORS}
              onChange={(val) => setPreviewColor(val)}
            />
          </Form.Item>

          <Form.Item
            label="活动标签"
            name="tags"
          >
            <Select
              mode="tags"
              placeholder="输入标签后回车"
              style={{ width: '100%' }}
              maxCount={5}
            />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button onClick={() => navigate('/events')}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none'
                }}
              >
                {isEdit ? '保存修改' : '创建活动'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
