import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Space, Typography, Statistic, Row, Col,
  Avatar, message
} from 'antd'
import { UserOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getUsers, type User } from '../services/user'

const { Title, Text } = Typography

export default function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

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
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.avatarUrl}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              flexShrink: 0
            }}
          >
            {record.nickname?.charAt(0) || '?'}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong>{record.nickname || '未设置昵称'}</Text>
            {record.city && <Text type="secondary" style={{ fontSize: 12 }}>{record.city}</Text>}
          </Space>
        </Space>
      )
    },
    {
      title: '标签',
      key: 'tags',
      render: (_, record) => (
        <Space size={4} wrap>
          {record.mbti && <Tag color="purple">{record.mbti}</Tag>}
          {record.zodiac && <Tag>{record.zodiac}</Tag>}
          {record.generation && <Tag>{record.generation}</Tag>}
        </Space>
      )
    },
    {
      title: '参与活动',
      key: 'signups',
      width: 100,
      render: (_, record) => record._count?.signups || 0
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
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD')
    }
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="总用户数"
              value={total}
              prefix={<UserOutlined style={{ color: '#6366f1' }} />}
              valueStyle={{ color: '#6366f1' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="活跃用户"
              value={users.filter(u => (u._count?.signups || 0) > 0).length}
              prefix={<TeamOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="已完善资料"
              value={users.filter(u => u.nickname).length}
              prefix={<CalendarOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        title={<Title level={5} style={{ margin: 0 }}>用户列表</Title>}
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </Card>
    </div>
  )
}
