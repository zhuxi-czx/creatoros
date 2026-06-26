import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Table, Tag, Space, Typography, Avatar, Button, Popconfirm, message, Modal, Select } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getEventDetail, getEventSignups, refundSignup, adminAddSignup, type Event } from '../services/event'
import { getUsers } from '../services/user'

const { Title, Text } = Typography

interface OrderInfo {
  id: string
  status: string // PENDING | PAID | CLOSED | REFUNDING | REFUNDED
  amount: number // 分
  refundedAt?: string | null
}

interface SignupRecord {
  id: string
  status: string
  createdAt: string
  order?: OrderInfo | null
  user: {
    id: string
    uid?: string
    nickname?: string
    avatarUrl?: string
    city?: string
    phone?: string
    mbti?: string
  }
}

const yuan = (fen: number) => `¥${(fen / 100).toFixed(2)}`

export default function EventSignups() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [signups, setSignups] = useState<SignupRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refundingId, setRefundingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([])
  const [selUser, setSelUser] = useState<string>()
  const [adding, setAdding] = useState(false)

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

  const handleRefund = async (signupId: string) => {
    try {
      setRefundingId(signupId)
      const res = await refundSignup(signupId)
      if (res.refunded) {
        message.success('退款成功，款项原路退回')
      } else {
        message.success('退款已受理，处理中（稍后刷新查看结果）')
      }
      if (id) await loadData(id)
    } catch (err: any) {
      message.error(err?.message || '退款失败')
    } finally {
      setRefundingId(null)
    }
  }

  const openAdd = async () => {
    setAddOpen(true)
    setSelUser(undefined)
    try {
      const res: any = await getUsers(1, 200)
      setUserOptions((res?.data || []).map((u: any) => ({
        value: u.id,
        label: `${u.nickname || '未设置'}（${u.uid || u.phone || u.id.slice(-4)}）`,
      })))
    } catch { message.error('加载用户失败') }
  }
  const handleAdd = async () => {
    if (!selUser || !id) return
    try {
      setAdding(true)
      await adminAddSignup(id, selUser)
      message.success('已添加报名')
      setAddOpen(false)
      await loadData(id)
    } catch (err: any) {
      message.error(err?.message || '添加失败')
    } finally { setAdding(false) }
  }

  const confirmedCount = signups.filter(s => s.status === 'CONFIRMED').length
  const cancelledCount = signups.filter(s => s.status === 'CANCELLED').length

  const columns: ColumnsType<SignupRecord> = [
    {
      title: 'UID',
      key: 'uid',
      width: 130,
      render: (_, r) => (
        <Text style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }} copyable={!!r.user.uid}>
          {r.user.uid || '-'}
        </Text>
      ),
    },
    {
      title: '用户',
      key: 'user',
      width: 220,
      render: (_, r) => (
        <Space>
          <Avatar
            src={r.user.avatarUrl}
            size="small"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {r.user.nickname?.charAt(0) || '?'}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong>{r.user.nickname || '未设置'}</Text>
            {r.user.phone && <Text type="secondary" style={{ fontSize: 11 }}>{r.user.phone}</Text>}
          </Space>
        </Space>
      ),
    },
    {
      title: '支付',
      key: 'pay',
      width: 130,
      render: (_, r) => {
        const o = r.order
        if (!o || o.status === 'PENDING' || o.status === 'CLOSED') {
          return <Tag>免费/未支付</Tag>
        }
        if (o.status === 'REFUNDED') return <Tag color="orange">已退款 {yuan(o.amount)}</Tag>
        if (o.status === 'REFUNDING') return <Tag color="gold">退款中 {yuan(o.amount)}</Tag>
        return <Tag color="green">已支付 {yuan(o.amount)}</Tag>
      },
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
      width: 130,
      render: (t: string) => dayjs(t).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, r) => {
        // 以订单 PAID 为准：报名即使已取消，只要钱未退仍可退款
        const canRefund = r.order?.status === 'PAID'
        if (!canRefund) return <Text type="secondary">-</Text>
        return (
          <Popconfirm
            title="确认退款？"
            description={`将向该用户退回 ${yuan(r.order!.amount)}，原路退回且不可撤销，报名将被取消。`}
            okText="确认退款"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleRefund(r.id)}
          >
            <Button danger size="small" loading={refundingId === r.id}>
              退款
            </Button>
          </Popconfirm>
        )
      },
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/events')} />
          <Title level={4} style={{ margin: 0 }}>报名详情</Title>
        </Space>
        <Button type="primary" onClick={openAdd}>+ 添加成员</Button>
      </div>

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
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      </Card>

      <Modal
        title="添加报名成员"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={handleAdd}
        confirmLoading={adding}
        okText="确认添加"
        okButtonProps={{ disabled: !selUser }}
      >
        <Select
          showSearch
          style={{ width: '100%' }}
          placeholder="搜索并选择用户（昵称 / 编号）"
          value={selUser}
          onChange={setSelUser}
          options={userOptions}
          optionFilterProp="label"
        />
      </Modal>
    </div>
  )
}
