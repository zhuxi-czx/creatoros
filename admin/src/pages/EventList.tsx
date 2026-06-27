import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Table, Button, Tag, Space, Typography, Statistic, Row, Col,
  message, Select, Grid, Popconfirm, Input
} from 'antd'
import {
  PlusOutlined, EditOutlined, CopyOutlined,
  CalendarOutlined, UserOutlined, FireOutlined, CheckCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getEvents, getStats, updateEventStatus, copyEvent, deleteEvent, type Event } from '../services/event'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

// 活动是否已结束：到了活动当天的次日 0 点
function isEnded(date?: string): boolean {
  if (!date) return false
  return dayjs().isAfter(dayjs(date).add(1, 'day').startOf('day'))
}

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: 'default', label: '草稿' },
  PUBLISHED: { color: 'green', label: '报名中' },
  FULL: { color: 'red', label: '报名已满' },
  ONGOING: { color: 'blue', label: '进行中' },
  ENDED: { color: 'default', label: '已结束' },
  CANCELLED: { color: 'orange', label: '已下架' },
}

export default function EventList() {
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
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

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id)
      message.success('活动已删除')
      loadData()
    } catch (err: any) {
      message.error(err?.message || '删除失败')
    }
  }

  const handleCopyEvent = async (id: string) => {
    try {
      await copyEvent(id)
      message.success('活动已复制')
      loadData()
    } catch (err) {
      message.error('复制活动失败')
    }
  }

  const filteredEvents = events
    .filter(e => statusFilter === 'all' || e.status === statusFilter)
    .filter(e => !searchKeyword.trim() || (e.title || '').toLowerCase().includes(searchKeyword.trim().toLowerCase()))

  const columns: ColumnsType<Event> = [
    {
      title: '活动名称',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      ellipsis: true,
      render: (title: string) => <Text strong>{title}</Text>
    },
    {
      title: '活动类型',
      key: 'eventType',
      width: 110,
      render: (_: any, r: Event) => r.isPlanfExclusive
        ? <Tag color="gold">PlanF</Tag>
        : r.isGuestShare
        ? <Tag color="purple">大咖分享</Tag>
        : <Tag>普通活动</Tag>
    },
    ...(!isMobile ? [{
      title: '时间',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    } as any] : []),
    {
      title: '报名',
      key: 'signups',
      width: 70,
      render: (_: any, record: Event) => (
        <Text>{record._count?.signups || 0}/{record.maxCapacity}</Text>
      )
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_: any, record: Event) => {
        const s = STATUS_MAP[record.status] || { color: 'default', label: record.status }
        return (
          <Space size={4}>
            <Tag color={s.color}>{s.label}</Tag>
            {record.featured && <Tag color="purple">精选</Tag>}
          </Space>
        )
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: isMobile ? 120 : 160,
      fixed: 'right' as const,
      render: (_: any, record: Event) => (
        <Space size={0} wrap>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => navigate(`/events/${record.id}/edit`)}
          >编辑</Button>
          <Button type="link" size="small" icon={<CopyOutlined />}
            onClick={() => handleCopyEvent(record.id)}
          >复制</Button>
          <Button type="link" size="small"
            onClick={() => navigate(`/events/${record.id}/signups`)}
          >报名</Button>
          {['DRAFT', 'CANCELLED'].includes(record.status) && (
            <Popconfirm title="确定上架该活动？上架后用户端展示" onConfirm={() => handleStatusChange(record.id, 'PUBLISHED')}>
              <Button type="link" size="small">{record.status === 'CANCELLED' ? '重新上架' : '发布'}</Button>
            </Popconfirm>
          )}
          {['PUBLISHED', 'FULL', 'ONGOING', 'ENDED'].includes(record.status) && (
            <Popconfirm title="确定下架该活动？下架后用户端将不再展示" onConfirm={() => handleStatusChange(record.id, 'CANCELLED')}>
              <Button type="link" size="small" danger>下架</Button>
            </Popconfirm>
          )}
          {record.status === 'CANCELLED' && (
            <Popconfirm title="删除后不可恢复，确定删除该活动？" okText="确定删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
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
            <Input
              placeholder="搜索活动名称"
              allowClear
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              style={{ width: isMobile ? 130 : 200 }}
              size={isMobile ? 'small' : 'middle'}
            />
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
          scroll={{ x: 600 }}
        />
      </Card>
    </div>
  )
}
