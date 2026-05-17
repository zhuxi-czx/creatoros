import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Space, Typography, Statistic, Row, Col,
  Avatar, Input, message
} from 'antd'
import { UserOutlined, TeamOutlined, CalendarOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getUsers, type User } from '../services/user'

const { Title, Text } = Typography
const { Search } = Input

export default function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await getUsers()
      setUsers(data)
    } catch (err) {
      message.error('加载用户失败')
    } finally {
      setLoading(false)
    }
  }

  const totalUsers = users.length
  const activeUsers = users.filter(u => u.signupCount && u.signupCount > 0).length
  const totalSignups = users.reduce((sum, u) => sum + (u.signupCount || 0), 0)

  const filteredUsers = users.filter(u => {
    if (!searchText) return true
    return u.name?.includes(searchText) || u.tags?.some(t => t.includes(searchText))
  })

  const columns: ColumnsType<User> = [
    {
      title: '用户',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              flexShrink: 0
            }}
          >
            {record.name?.charAt(0) || '?'}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong>{record.name || '未设置昵称'}</Text>
            {record.bio && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.bio.length > 30 ? record.bio.slice(0, 30) + '...' : record.bio}
              </Text>
            )}
          </Space>
        </Space>
      )
    },
    {
      title: '身份标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space size={4} wrap>
          {tags?.map((tag, i) => (
            <Tag key={i} color="purple" style={{ margin: 0 }}>{tag}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: '报名次数',
      dataIndex: 'signupCount',
      key: 'signupCount',
      width: 100,
      render: (count: number) => count || 0
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD') : '-'
    }
  ]

  return (
    <div>
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="注册用户"
              value={totalUsers}
              prefix={<UserOutlined style={{ color: '#6366f1' }} />}
              valueStyle={{ color: '#6366f1' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="活跃用户"
              value={activeUsers}
              prefix={<TeamOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="总报名次数"
              value={totalSignups}
              prefix={<CalendarOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        title={<Title level={5} style={{ margin: 0 }}>用户列表</Title>}
        extra={
          <Search
            placeholder="搜索用户名称或标签"
            allowClear
            style={{ width: 240 }}
            onSearch={setSearchText}
            onChange={e => !e.target.value && setSearchText('')}
            prefix={<SearchOutlined />}
          />
        }
      >
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </Card>
    </div>
  )
}
