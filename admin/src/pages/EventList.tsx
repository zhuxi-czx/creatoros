import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Table, Button, Tag, Space, Typography, Statistic, Row, Col,
  message, Select, Grid
} from 'antd'
import {
  PlusOutlined, EditOutlined,
  CalendarOutlined, UserOutlined, FireOutlined, CheckCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getEvents, getStats, updateEventStatus, type Event } from '../services/event'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

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
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stats, setStats] = useState<any>({})

  useEffect(() => { loadData() }, [])

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
      ellipsis: true,
      render: (title: string) => <Text strong>{title}</Text>
    },
    ...(!isMobile ? [{
      title: '时间',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (date: string) => dayjs(date).format('MM-DD HH:mm')
    } as any] : []),
    {
      title: '报名',
      key: 'signups',
      width: isMobile ? 60 : 90,
      render: (_: any, record: Event) => (
        <Text>{record._count?.signups || 0}/{record.maxCapacity}</Text>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 70 : 90,
      render: (status: string) => {
        const s = STATUS_MAP[status] || { color: 'default', label: status }
        return <Tag color={s.color}>{s.label}</Tag>
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: isMobile ? 80 : 140,
      render: (_: any, record: Event) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => navigate(`/events/${record.id}/edit`)}
          >
            {!isMobile && '编辑'}
          </Button>
          {record.status === 'DRAFT' && (
            <Button type="link" size="small"
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
      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 12 : 24 }}>
        {[
          { title: '活动总数', value: stats.totalEvents || 0, icon: <CalendarOutlined />, color: '#6366f1' },
          { title: '进行中', value: stats.activeEvents || 0, icon: <FireOutlined />, color: '#f59e0b' },
          { title: '总报名', value: stats.totalSignups || 0, icon: <CheckCircleOutlined />, color: '#10b981' },
          { title: '总用户', value: stats.totalUsers || 0, icon: <UserOutlined />, color: '#8b5cf6' },
        ].map((s, i) => (
          <Col xs={12} md={6} key={i}>
            <Card bordered={false} style={{ borderRadius: 12 }} styles={{ body: { padding: isMobile ? 12 : 20 } }}>
              <Statistic
                title={s.title}
                value={s.value}
                prefix={<span style={{ color: s.color }}>{s.icon}</span>}
                valueStyle={{ color: s.color, fontSize: isMobile ? 20 : 28 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: isMobile ? 8 : 24 } }}
        title={<Title level={5} style={{ margin: 0 }}>活动列表</Title>}
        extra={
          <Space size={8} wrap>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: isMobile ? 90 : 120 }}
              size={isMobile ? 'small' : 'middle'}
              options={[
                { value: 'all', label: '全部' },
                { value: 'DRAFT', label: '草稿' },
                { value: 'PUBLISHED', label: '报名中' },
                { value: 'FULL', label: '已满' },
                { value: 'ENDED', label: '已结束' },
              ]}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size={isMobile ? 'small' : 'middle'}
              onClick={() => navigate('/events/create')}
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}
            >
              {isMobile ? '新建' : '新建活动'}
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredEvents}
          rowKey="id"
          loading={loading}
          size={isMobile ? 'small' : 'middle'}
          pagination={{ pageSize: 10, showSizeChanger: false, size: 'small' }}
          scroll={isMobile ? { x: 400 } : undefined}
        />
      </Card>
    </div>
  )
}
