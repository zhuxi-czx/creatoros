import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Table, Button, Tag, Space, Typography, Statistic, Row, Col,
  Popconfirm, message, Input, Select
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  CalendarOutlined, UserOutlined, FireOutlined, CheckCircleOutlined,
  SearchOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getEvents, deleteEvent, type Event } from '../services/event'

const { Title, Text } = Typography
const { Search } = Input

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'blue',
  ongoing: 'green',
  ended: 'default'
}

const STATUS_LABELS: Record<string, string> = {
  upcoming: '即将开始',
  ongoing: '进行中',
  ended: '已结束'
}

export default function EventList() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await getEvents()
      setEvents(data)
    } catch (err) {
      message.error('加载活动失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteEvent(id)
      message.success('删除成功')
      setEvents(events.filter(e => e.id !== id))
    } catch (err) {
      message.error('删除失败')
    }
  }

  // Stats
  const totalEvents = events.length
  const upcomingCount = events.filter(e => e.status === 'upcoming').length
  const totalSignups = events.reduce((sum, e) => sum + (e.signupCount || 0), 0)
  const ongoingCount = events.filter(e => e.status === 'ongoing').length

  // Filter
  const filteredEvents = events.filter(e => {
    const matchSearch = !searchText || e.title.includes(searchText) || e.location?.includes(searchText)
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    return matchSearch && matchStatus
  })

  const columns: ColumnsType<Event> = [
    {
      title: '活动名称',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.location}</Text>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
      )
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '报名人数',
      dataIndex: 'signupCount',
      key: 'signupCount',
      width: 100,
      render: (count: number, record) => (
        <Text>{count}{record.capacity ? ` / ${record.capacity}` : ''}</Text>
      )
    },
    {
      title: '主办方',
      dataIndex: 'hostName',
      key: 'hostName',
      width: 120
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/events/${record.id}/edit`)}
          />
          <Popconfirm
            title="确定删除这个活动吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              size="small"
              danger
            />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="活动总数"
              value={totalEvents}
              prefix={<CalendarOutlined style={{ color: '#6366f1' }} />}
              valueStyle={{ color: '#6366f1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="即将开始"
              value={upcomingCount}
              prefix={<FireOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="进行中"
              value={ongoingCount}
              prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="总报名人次"
              value={totalSignups}
              prefix={<UserOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        title={
          <Space>
            <Title level={5} style={{ margin: 0 }}>活动列表</Title>
          </Space>
        }
        extra={
          <Space>
            <Search
              placeholder="搜索活动名称、地点"
              allowClear
              style={{ width: 220 }}
              onSearch={setSearchText}
              onChange={e => !e.target.value && setSearchText('')}
              prefix={<SearchOutlined />}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'upcoming', label: '即将开始' },
                { value: 'ongoing', label: '进行中' },
                { value: 'ended', label: '已结束' }
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
