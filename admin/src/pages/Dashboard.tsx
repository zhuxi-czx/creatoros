import { useState, useEffect } from 'react'
import { Card, Table, Tag, Typography, Statistic, Row, Col, message, Grid } from 'antd'
import {
  CalendarOutlined, UserOutlined, FireOutlined, CheckCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getStats } from '../services/event'

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

export default function Dashboard() {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getStats()
      setStats(res || {})
    } catch (err) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const topColumns: ColumnsType<any> = [
    {
      title: '活动名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string) => <Text strong>{title}</Text>,
    },
    {
      title: '报名/容量',
      key: 'signups',
      width: 100,
      render: (_: any, record: any) => (
        <Text>{record._count?.signups || 0}/{record.maxCapacity}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const s = STATUS_MAP[status] || { color: 'default', label: status }
        return <Tag color={s.color}>{s.label}</Tag>
      },
    },
  ]

  const recentColumns: ColumnsType<any> = [
    {
      title: '活动名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string) => <Text strong>{title}</Text>,
    },
    ...(!isMobile ? [{
      title: '时间',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (date: string) => dayjs(date).format('MM-DD HH:mm'),
    } as any] : []),
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const s = STATUS_MAP[status] || { color: 'default', label: status }
        return <Tag color={s.color}>{s.label}</Tag>
      },
    },
    {
      title: '报名',
      key: 'signups',
      width: 60,
      render: (_: any, record: any) => <Text>{record._count?.signups || 0}</Text>,
    },
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

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: isMobile ? 8 : 24 } }}
            title={<Title level={5} style={{ margin: 0 }}>热门活动</Title>}
          >
            <Table
              columns={topColumns}
              dataSource={stats.topEvents || []}
              rowKey="id"
              loading={loading}
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: isMobile ? 8 : 24 } }}
            title={<Title level={5} style={{ margin: 0 }}>最近活动</Title>}
          >
            <Table
              columns={recentColumns}
              dataSource={stats.recentEvents || []}
              rowKey="id"
              loading={loading}
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
