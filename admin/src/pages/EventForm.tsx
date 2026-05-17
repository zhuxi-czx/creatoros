import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Card, Form, Input, Button, DatePicker, InputNumber,
  message, Space, Typography, Divider
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { createEvent, updateEvent, updateEventStatus, getEventDetail, type EventFormData } from '../services/event'

const { Title, Text } = Typography
const { TextArea } = Input

export default function EventForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [currentStatus, setCurrentStatus] = useState('DRAFT')

  useEffect(() => {
    if (isEdit && id) {
      loadEvent(id)
    }
  }, [id])

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
      })
      setCurrentStatus(event.status)
    } catch (err) {
      message.error('加载活动失败')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (values: Record<string, unknown>, publish = false) => {
    const data: EventFormData = {
      title: values.title as string,
      description: values.description as string,
      date: (values.date as dayjs.Dayjs)?.toISOString(),
      venueId: 'default',
      hostName: values.hostName as string,
      maxCapacity: values.maxCapacity as number,
      price: ((values.price as number) || 0) * 100,
      status: publish ? 'PUBLISHED' : 'DRAFT',
    }

    try {
      setLoading(true)
      if (isEdit && id) {
        await updateEvent(id, data)
        if (publish) await updateEventStatus(id, 'PUBLISHED')
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
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0' }}>
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
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => handleSubmit(values, false)}
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
          >
            <TextArea placeholder="请输入活动描述" rows={4} maxLength={500} showCount />
          </Form.Item>

          <Form.Item
            label="活动时间"
            name="date"
            rules={[{ required: true, message: '请选择活动时间' }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              placeholder="选择活动时间"
            />
          </Form.Item>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item
              label="发起人"
              name="hostName"
              style={{ flex: 1 }}
            >
              <Input placeholder="发起人名称" />
            </Form.Item>

            <Form.Item
              label="人数上限"
              name="maxCapacity"
              rules={[{ required: true, message: '请输入人数上限' }]}
              style={{ flex: 1 }}
            >
              <InputNumber placeholder="30" min={1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="费用 (元)"
              name="price"
              style={{ flex: 1 }}
            >
              <InputNumber placeholder="0" min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button onClick={() => navigate('/events')}>取消</Button>
              <Button
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
              >
                保存草稿
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={loading}
                onClick={() => {
                  form.validateFields().then(values => handleSubmit(values, true))
                }}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none'
                }}
              >
                发布活动
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
