import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Table, Tag, Space, Typography, Avatar, Button, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getEventDetail, getEventSignups, type Event } from '../services/event'

const { Title, Text } = Typography

interface SignupRecord {
  id: string
  status: string
  createdAt: string
  user: {
    id: string
    nickname?: string
    avatarUrl?: string
    city?: string
    phone?: string
    mbti?: string
  }
}

export default function EventSignups() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [signups, setSignups] = useState<SignupRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) loadData(id)
  }, [id])

  const loadData = async (eventId: string) => {
    try {
      setLoading(true)
      const [eventRes, signupsRes] = await Promise.all([
        getEventDetail(eventId),
        getEventSignups(eventId),
      ])
      setEvent(eventRes)
      setSignups(signupsRes.data || [])
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const confirmedCount = signups.filter(s => s.status === 'CONFIRMED').length
  const cancelledCount = signups.filter(s => s.status === 'CANCELLED').length

  const columns: ColumnsType<SignupRecord> = [
    {
      title: '用户',
      key: 'user',
      render: (_, r) => (
        <Space>
          <Avatar
            src={r.user.avatarUrl}
            size="small"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {r.user.nickname?.charAt(0) || '?'}
          </Avatar>
          <Text strong>{r.user.nickname || '未设置'}</Text>
        </Space>
      ),
    },
    {
      title: '城市',
      key: 'city',
      width: 100,
      render: (_, r) => r.user.city || '-',
    },
    {
      title: 'MBTI',
      key: 'mbti',
      width: 80,
      render: (_, r) => r.user.mbti ? <Tag color="purple">{r.user.mbti}</Tag> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'CONFIRMED' ? 'green' : 'default'}>
          {status === 'CONFIRMED' ? '已确认' : '已取消'}
        </Tag>
      ),
    },
    {
      title: '报名时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (t: string) => dayjs(t).format('MM-DD HH:mm'),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/events')} />
        <Title level={4} style={{ margin: 0 }}>报名详情</Title>
      </Space>

      {event && (
        <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }} styles={{ body: { padding: 16 } }}>
          <Space direction="vertical" size={4}>
            <Text strong style={{ fontSize: 16 }}>{event.title}</Text>
            <Text type="secondary">{event.venue?.name} · {dayjs(event.date).format('YYYY-MM-DD HH:mm')}</Text>
            <Space size={16} style={{ marginTop: 4 }}>
              <Text>已确认 <Text strong style={{ color: '#22C55E' }}>{confirmedCount}</Text></Text>
              <Text>已取消 <Text strong style={{ color: '#999' }}>{cancelledCount}</Text></Text>
              <Text>上限 <Text strong>{event.maxCapacity}</Text></Text>
            </Space>
          </Space>
        </Card>
      )}

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={signups}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      </Card>
    </div>
  )
}
