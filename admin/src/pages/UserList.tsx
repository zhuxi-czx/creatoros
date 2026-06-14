import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Space, Typography, Statistic, Row, Col,
  Avatar, message, Grid
} from 'antd'
import { UserOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getUsers, type User } from '../services/user'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function UserList() {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const res = await getUsers()
      setUsers(res.data || [])
      setTotal(res.total || 0)
    } catch (err) {
      message.error('加载用户失败')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<User> = [
    {
      title: '用户',
      key: 'user',
      width: isMobile ? 160 : 220,
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.avatarUrl}
            size={isMobile ? 'small' : 'default'}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', flexShrink: 0 }}
          >
            {record.nickname?.charAt(0) || '?'}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: isMobile ? 13 : 14 }}>{record.nickname || '未设置'}</Text>
            {record.city && <Text type="secondary" style={{ fontSize: 11 }}>{record.city}</Text>}
          </Space>
        </Space>
      )
    },
    {
      title: 'UID',
      dataIndex: 'uid',
      key: 'uid',
      width: isMobile ? 110 : 130,
      render: (uid?: string) => (
        <Text style={{ fontFamily: 'monospace', fontSize: isMobile ? 12 : 13 }} copyable={!!uid}>
          {uid || '-'}
        </Text>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone: string) => phone || <Text type="secondary">-</Text>
    },
    ...(!isMobile ? [{
      title: '标签',
      key: 'tags',
      render: (_: any, record: User) => (
        <Space size={4} wrap>
          {record.mbti && <Tag color="purple">{record.mbti}</Tag>}
          {record.zodiac && <Tag>{record.zodiac}</Tag>}
          {record.generation && <Tag>{record.generation}</Tag>}
        </Space>
      )
    } as any] : []),
    {
      title: '活动',
      key: 'signups',
      width: 70,
      align: 'center' as const,
      render: (_: any, record: User) => record._count?.signups || 0
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? '正常' : '禁用'}
        </Tag>
      )
    },
    ...(!isMobile ? [{
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD')
    } as any] : [])
  ]

  return (
    <div>
      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 12 : 24 }}>
        {[
          { title: '总用户', value: total, icon: <UserOutlined />, color: '#6366f1' },
          { title: '活跃', value: users.filter(u => (u._count?.signups || 0) > 0).length, icon: <TeamOutlined />, color: '#10b981' },
          { title: '已完善', value: users.filter(u => u.nickname).length, icon: <CalendarOutlined />, color: '#8b5cf6' },
        ].map((s, i) => (
          <Col xs={8} key={i}>
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
        title={<Title level={5} style={{ margin: 0 }}>用户列表</Title>}
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          size={isMobile ? 'small' : 'middle'}
          pagination={{ pageSize: 10, showSizeChanger: false, size: 'small' }}
        />
      </Card>
    </div>
  )
}
