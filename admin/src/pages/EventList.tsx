import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Table, Button, Tag, Space, Typography, Statistic, Row, Col,
  message, Select
} from 'antd'
import {
  PlusOutlined, EditOutlined,
  CalendarOutlined, UserOutlined, FireOutlined, CheckCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getEvents, getStats, updateEventStatus, type Event } from '../services/event'

const { Title, Text } = Typography

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: 'default', label: '草稿' },
  PUBLISHED: { color: 'green', label: '报名中' },
  FULL: { color: 'red', label: '报名已满' },
  ONGOING: { color: 'blue', label: '进行中' },
  ENDED: { color: 'default', label: '已结束' },
  CANCELLED: { color: 'orange', label: '已取消' },
}

export default function EventList() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [eventsRes, statsRes] = await Promise.all([getEvents(), getStats()])
      setEvents(eventsRes.data || [])
      setStats(statsRes || {})
    } catch (err) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateEventStatus(id, status)
      message.success('状态更新成功')
      loadData()
    } catch (err) {
      message.error('状态更新失败')
    }
  }

  const filteredEvents = statusFilter === 'all'
    ? events
    : events.filter(e => e.status === statusFilter)

  const columns: ColumnsType<Event> = [
    {
      title: '活动名称',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => <Text strong>{title}</Text>
    },
    {
      title: '时间',
      dataIndex: 'date',
      key: 'date',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '场所',
      key: 'venue',
      width: 160,
      render: (_, record) => record.venue?.name || '-'
    },
    {
      title: '报名/上限',
      key: 'signups',
      width: 100,
      render: (_, record) => (
        <Text>{record._count?.signups || 0} / {record.maxCapacity}</Text>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const s = STATUS_MAP[status] || { color: 'default', label: status }
        return <Tag color={s.color}>{s.label}</Tag>
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/events/${record.id}/edit`)}
          >
            编辑
          </Button>
          {record.status === 'DRAFT' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleStatusChange(record.id, 'PUBLISHED')}
            >
              发布
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="活动总数"
              value={stats.totalEvents || 0}
              prefix={<CalendarOutlined style={{ color: '#6366f1' }} />}
              valueStyle={{ color: '#6366f1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="进行中"
              value={stats.activeEvents || 0}
              prefix={<FireOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="总报名人次"
              value={stats.totalSignups || 0}
              prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="总用户数"
              value={stats.totalUsers || 0}
              prefix={<UserOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        title={<Title level={5} style={{ margin: 0 }}>活动列表</Title>}
        extra={
          <Space>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'DRAFT', label: '草稿' },
                { value: 'PUBLISHED', label: '报名中' },
                { value: 'FULL', label: '报名已满' },
                { value: 'ENDED', label: '已结束' },
              ]}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/events/create')}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none'
              }}
            >
              新建活动
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredEvents}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </Card>
    </div>
  )
}
