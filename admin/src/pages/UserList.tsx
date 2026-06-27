import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Space, Typography, Statistic, Row, Col,
  Avatar, message, Grid, Modal, Input, Popconfirm, Button
} from 'antd'
import { UserOutlined, TeamOutlined, CalendarOutlined, EyeOutlined, CrownOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getUsers, grantMembership, revokeMembership, type User } from '../services/user'
import { maskPhone, PHONE_VIEW_PASSWORD } from '../utils/phone'

/** 是否有效 PlanF 会员 */
function isActiveMember(u: User): boolean {
  return !!u.membership && u.membership.status === 'ACTIVE' && dayjs(u.membership.expireAt).isAfter(dayjs())
}

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function UserList() {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  // 手机号默认脱敏；输入查看密码后整页解锁完整号（停留本页期间有效）
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [pwdOpen, setPwdOpen] = useState(false)
  const [pwdInput, setPwdInput] = useState('')

  const verifyPwd = () => {
    if (pwdInput === PHONE_VIEW_PASSWORD) {
      setPhoneRevealed(true)
      setPwdOpen(false)
      setPwdInput('')
      message.success('已解锁完整手机号')
    } else {
      message.error('查看密码错误')
    }
  }

  const [granting, setGranting] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)

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

  const handleGrant = async (u: User) => {
    setGranting(u.id)
    try {
      await grantMembership(u.id)
      message.success(`已为「${u.nickname || u.uid || '该用户'}」开通 PlanF 会员`)
      await loadUsers()
    } catch (err: any) {
      message.error(err?.message || '开通失败')
    } finally {
      setGranting(null)
    }
  }

  const handleRevoke = async (u: User) => {
    setRevoking(u.id)
    try {
      await revokeMembership(u.id)
      message.success(`已取消「${u.nickname || u.uid || '该用户'}」的 PlanF 会员`)
      await loadUsers()
    } catch (err: any) {
      message.error(err?.message || '取消失败')
    } finally {
      setRevoking(null)
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
      width: 160,
      render: (phone: string) => {
        if (!phone) return <Text type="secondary">-</Text>
        if (phoneRevealed) {
          return <Text style={{ fontFamily: 'monospace' }} copyable>{phone}</Text>
        }
        return (
          <Space size={4}>
            <Text style={{ fontFamily: 'monospace' }}>{maskPhone(phone)}</Text>
            <Typography.Link style={{ fontSize: 12 }} onClick={() => setPwdOpen(true)}>
              <EyeOutlined /> 查看
            </Typography.Link>
          </Space>
        )
      }
    },
    ...(!isMobile ? [{
      title: '标签',
      key: 'tags',
      width: 220,
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
    } as any] : []),
    {
      title: 'PlanF 会员',
      key: 'membership',
      width: isMobile ? 110 : 150,
      render: (_: any, r: User) => isActiveMember(r)
        ? <Tag color="gold">{dayjs(r.membership!.expireAt).format('YYYY-MM-DD')} 到期</Tag>
        : <Text type="secondary">非会员</Text>
    },
    {
      title: '操作',
      key: 'action',
      width: isMobile ? 150 : 190,
      render: (_: any, r: User) => (
        <Space size={0}>
          <Popconfirm
            title="设为 PlanF 会员"
            description={isActiveMember(r) ? '该用户已是会员，确认续费一年？' : '确认为该用户开通 PlanF 会员（一年期）？'}
            okText="确认开通"
            cancelText="取消"
            onConfirm={() => handleGrant(r)}
          >
            <Button size="small" type="link" icon={<CrownOutlined />} loading={granting === r.id}>
              {isActiveMember(r) ? '续费' : '设为会员'}
            </Button>
          </Popconfirm>
          {isActiveMember(r) && (
            <Popconfirm
              title="取消 PlanF 会员"
              description="确认取消该用户的 PlanF 会员资格？（保留记录，可再次开通）"
              okText="确认取消"
              cancelText="返回"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleRevoke(r)}
            >
              <Button size="small" type="link" danger loading={revoking === r.id}>取消会员</Button>
            </Popconfirm>
          )}
        </Space>
      )
    },
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

      <Modal
        title="查看完整手机号"
        open={pwdOpen}
        onOk={verifyPwd}
        onCancel={() => { setPwdOpen(false); setPwdInput('') }}
        okText="确认"
        cancelText="取消"
        destroyOnClose
        width={360}
        centered
      >
        <p style={{ color: '#888', marginBottom: 8 }}>请输入查看密码以显示完整手机号</p>
        <Input.Password
          value={pwdInput}
          onChange={e => setPwdInput(e.target.value)}
          onPressEnter={verifyPwd}
          placeholder="查看密码"
          autoFocus
        />
      </Modal>
    </div>
  )
}
