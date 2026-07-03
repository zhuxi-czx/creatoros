import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Space, Typography, Statistic, Row, Col,
  Avatar, message, Grid, Modal, Input, Popconfirm, Button, Image, Select
} from 'antd'
import { UserOutlined, TeamOutlined, CalendarOutlined, EyeOutlined, CrownOutlined, ProfileOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getUsers, grantMembership, revokeMembership, getUserOrders, type User, type UserOrder } from '../services/user'
import { maskPhone, PHONE_VIEW_PASSWORD } from '../utils/phone'

/** 是否有效 PlanF 会员 */
function isActiveMember(u: User): boolean {
  return !!u.membership && u.membership.status === 'ACTIVE' && dayjs(u.membership.expireAt).isAfter(dayjs())
}

const { Title, Text } = Typography
const { useBreakpoint } = Grid
const USER_TABLE_SCROLL_X = 1700

// 订单状态 → 展示文案 / 颜色
const ORDER_STATUS: Record<string, { text: string; color: string }> = {
  PAID: { text: '已支付', color: 'green' },
  PENDING: { text: '待支付', color: 'orange' },
  CLOSED: { text: '已关闭', color: 'default' },
  REFUNDING: { text: '退款中', color: 'blue' },
  REFUNDED: { text: '已退款', color: 'red' },
}

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
  const [avatarPreview, setAvatarPreview] = useState('')
  const [keyword, setKeyword] = useState('')
  const [memberFilter, setMemberFilter] = useState<'all' | 'member' | 'nonmember'>('all')

  // 头像/图片相对路径补全域名（微信头像本就是完整 URL）
  const fullImg = (u?: string) => (!u ? '' : u.startsWith('http') ? u : `https://creatorbar.cn${u}`)

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

  // 用户支付订单查看
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [ordersUser, setOrdersUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  const openOrders = async (u: User) => {
    setOrdersUser(u)
    setOrdersOpen(true)
    setOrders([])
    setOrdersLoading(true)
    try {
      setOrders(await getUserOrders(u.id))
    } catch (err: any) {
      message.error(err?.message || '加载订单失败')
    } finally {
      setOrdersLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const res = await getUsers(1, 1000)
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

  // 高危操作（开通 / 续费 / 取消会员）需操作密码（复用查看手机号那套）
  const [actionModal, setActionModal] = useState<{ type: 'grant' | 'revoke'; user: User } | null>(null)
  const [actionPwd, setActionPwd] = useState('')
  // 操作后的有效期截止日：续费从原到期日顺延 365 天，新开通从今日起 365 天（与后端一致）
  const newExpireOf = (u: User) =>
    (isActiveMember(u) ? dayjs(u.membership!.expireAt) : dayjs()).add(365, 'day').format('YYYY-MM-DD')
  const confirmAction = () => {
    if (actionPwd !== PHONE_VIEW_PASSWORD) { message.error('操作密码错误'); return }
    const m = actionModal!
    setActionModal(null); setActionPwd('')
    if (m.type === 'grant') handleGrant(m.user); else handleRevoke(m.user)
  }

  // 前端搜索（用户/标签/状态字段）+ 会员筛选
  const kw = keyword.trim().toLowerCase()
  const filteredUsers = users.filter(u => {
    if (memberFilter === 'member' && !isActiveMember(u)) return false
    if (memberFilter === 'nonmember' && isActiveMember(u)) return false
    if (!kw) return true
    const hay = [u.nickname, u.uid, u.city, u.phone, u.mbti, u.zodiac, u.generation, ...(u.tags || []), ...(u.statuses || [])]
      .filter(Boolean).join(' ').toLowerCase()
    return hay.includes(kw)
  })

  const columns: ColumnsType<User> = [
    {
      title: '用户',
      key: 'user',
      width: 220,
      render: (_, record) => (
        <Space style={{ whiteSpace: 'nowrap' }}>
          <Avatar
            src={fullImg(record.avatarUrl)}
            size={isMobile ? 'small' : 'default'}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', flexShrink: 0, cursor: record.avatarUrl ? 'pointer' : 'default' }}
            onClick={() => record.avatarUrl && setAvatarPreview(fullImg(record.avatarUrl))}
          >
            {record.nickname?.charAt(0) || '?'}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: isMobile ? 13 : 14, whiteSpace: 'nowrap' }}>{record.nickname || '未设置'}</Text>
            {record.city && <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{record.city}</Text>}
          </Space>
        </Space>
      )
    },
    {
      title: 'UID',
      dataIndex: 'uid',
      key: 'uid',
      width: 130,
      render: (uid?: string) => (
        <Text style={{ fontFamily: 'monospace', fontSize: isMobile ? 12 : 13, whiteSpace: 'nowrap' }} copyable={!!uid}>
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
          <Space size={4} style={{ whiteSpace: 'nowrap' }}>
            <Text style={{ fontFamily: 'monospace' }}>{maskPhone(phone)}</Text>
            <Typography.Link style={{ fontSize: 12 }} onClick={() => setPwdOpen(true)}>
              <EyeOutlined /> 查看
            </Typography.Link>
          </Space>
        )
      }
    },
    {
      title: '标签',
      key: 'tags',
      width: 240,
      render: (_: any, record: User) => {
        const hasAny = record.tags?.length || record.mbti || record.zodiac || record.generation
        return hasAny ? (
          <Space size={4} style={{ whiteSpace: 'nowrap' }}>
            {record.tags?.map(t => <Tag key={t} color="gold">{t}</Tag>)}
            {record.mbti && <Tag color="purple">{record.mbti}</Tag>}
            {record.zodiac && <Tag>{record.zodiac}</Tag>}
            {record.generation && <Tag>{record.generation}</Tag>}
          </Space>
        ) : <Text type="secondary">-</Text>
      }
    },
    {
      title: '状态',
      key: 'statuses',
      width: 200,
      render: (_: any, record: User) => record.statuses?.length
        ? <Space size={4} style={{ whiteSpace: 'nowrap' }}>{record.statuses.map(s => <Tag key={s} color="cyan">{s}</Tag>)}</Space>
        : <Text type="secondary">-</Text>
    },
    {
      title: '活动',
      key: 'signups',
      width: 70,
      align: 'center' as const,
      render: (_: any, record: User) => <Text style={{ whiteSpace: 'nowrap' }}>{record._count?.signups || 0}</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
            {status === 'ACTIVE' ? '正常' : '禁用'}
          </Tag>
        </span>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time: string) => <Text style={{ whiteSpace: 'nowrap' }}>{dayjs(time).format('YYYY-MM-DD HH:mm')}</Text>
    },
    {
      title: 'PlanF 会员',
      key: 'membership',
      width: 190,
      render: (_: any, r: User) => isActiveMember(r)
        ? (
          <Space direction="vertical" size={2}>
            <Text style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>开通 {dayjs(r.membership!.startAt).format('YYYY-MM-DD')}</Text>
            <Tag color="gold" style={{ marginRight: 0 }}>{dayjs(r.membership!.expireAt).format('YYYY-MM-DD')} 到期</Tag>
          </Space>
        )
        : <Text type="secondary">非会员</Text>
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: any, r: User) => (
        <Space size={0} style={{ whiteSpace: 'nowrap' }}>
          <Button size="small" type="link" icon={<ProfileOutlined />} onClick={() => openOrders(r)}>
            查看订单
          </Button>
          <Button size="small" type="link" icon={<CrownOutlined />} loading={granting === r.id} onClick={() => setActionModal({ type: 'grant', user: r })}>
            {isActiveMember(r) ? '续费' : '设为会员'}
          </Button>
          {isActiveMember(r) && (
            <Button size="small" type="link" danger loading={revoking === r.id} onClick={() => setActionModal({ type: 'revoke', user: r })}>取消会员</Button>
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
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="搜索昵称 / UID / 标签 / 状态"
              style={{ width: isMobile ? 180 : 260 }}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            <Select
              value={memberFilter}
              onChange={setMemberFilter}
              style={{ width: 130 }}
              options={[
                { value: 'all', label: '全部用户' },
                { value: 'member', label: 'PlanF 会员' },
                { value: 'nonmember', label: '非会员' },
              ]}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          size={isMobile ? 'small' : 'middle'}
          scroll={{ x: USER_TABLE_SCROLL_X }}
          pagination={{
            defaultPageSize: 20,
            pageSizeOptions: [10, 15, 20, 30, 100],
            showSizeChanger: true,
            size: 'small',
            showTotal: (t, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${t} 条`,
          }}
        />
      </Card>

      {/* 头像大图预览 */}
      {avatarPreview && (
        <Image
          style={{ display: 'none' }}
          src={avatarPreview}
          preview={{ visible: true, src: avatarPreview, onVisibleChange: (v) => !v && setAvatarPreview('') }}
        />
      )}

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

      {/* 会员高危操作：开通/续费/取消，需操作密码 */}
      <Modal
        title={actionModal?.type === 'revoke' ? '取消 PlanF 会员' : (actionModal && isActiveMember(actionModal.user) ? '续费 PlanF 会员' : '开通 PlanF 会员')}
        open={!!actionModal}
        onOk={confirmAction}
        onCancel={() => { setActionModal(null); setActionPwd('') }}
        okText="验证并执行"
        cancelText="取消"
        okButtonProps={{ danger: actionModal?.type === 'revoke' }}
        destroyOnClose
        width={400}
        centered
      >
        {actionModal && (
          <>
            <p style={{ color: '#555', marginBottom: 8 }}>
              {actionModal.type === 'revoke'
                ? <>确认取消「<b>{actionModal.user.nickname || actionModal.user.uid || '该用户'}</b>」的 PlanF 会员资格？保留记录，可再次开通。</>
                : <>确认为「<b>{actionModal.user.nickname || actionModal.user.uid || '该用户'}</b>」{isActiveMember(actionModal.user) ? '续费一年' : '开通一年期 PlanF 会员'}？</>}
            </p>
            {actionModal.type === 'grant' && (
              <p style={{ color: '#C9A96E', marginBottom: 12 }}>
                {isActiveMember(actionModal.user) ? '续费后' : '开通后'}有效期至 <b>{newExpireOf(actionModal.user)}</b>
              </p>
            )}
            <p style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>⚠️ 高危操作，请输入操作密码</p>
            <Input.Password
              value={actionPwd}
              onChange={e => setActionPwd(e.target.value)}
              onPressEnter={confirmAction}
              placeholder="操作密码"
              autoFocus
            />
          </>
        )}
      </Modal>

      <Modal
        title={`支付订单 · ${ordersUser?.nickname || ordersUser?.uid || '该用户'}`}
        open={ordersOpen}
        onCancel={() => setOrdersOpen(false)}
        footer={null}
        width={isMobile ? '94%' : 720}
        centered
        destroyOnClose
      >
        <Table
          dataSource={orders}
          rowKey="id"
          loading={ordersLoading}
          size="small"
          pagination={false}
          scroll={{ y: 420 }}
          locale={{ emptyText: '暂无支付订单' }}
          columns={[
            {
              title: '商品', key: 'title',
              render: (_: any, o: UserOrder) => (
                <Space direction="vertical" size={0}>
                  <Text strong style={{ fontSize: 13 }}>{o.title}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {o.type === 'MEMBERSHIP' ? '会员' : '活动报名'}
                  </Text>
                </Space>
              ),
            },
            {
              title: '金额', dataIndex: 'amount', key: 'amount', width: 90, align: 'right' as const,
              render: (a: number) => <Text strong>¥{(a / 100).toFixed(2)}</Text>,
            },
            {
              title: '状态', dataIndex: 'status', key: 'status', width: 90, align: 'center' as const,
              render: (s: string) => {
                const m = ORDER_STATUS[s] || { text: s, color: 'default' }
                return <Tag color={m.color}>{m.text}</Tag>
              },
            },
            {
              title: '下单时间', dataIndex: 'createdAt', key: 'createdAt', width: 150,
              render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm'),
            },
            {
              title: '订单号', dataIndex: 'outTradeNo', key: 'outTradeNo', width: 160,
              render: (no: string) => (
                <Text style={{ fontFamily: 'monospace', fontSize: 11 }} copyable={{ text: no }}>
                  {no ? `${no.slice(0, 8)}…` : '-'}
                </Text>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  )
}
