import { useState, useEffect } from 'react'
import { Card, Table, Tag, Typography, Space, Input, Select, Button, Modal, message, Grid, DatePicker } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { getOrders, refundOrder, type AdminOrder } from '../services/order'
import { maskPhone, PHONE_VIEW_PASSWORD } from '../utils/phone'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

const STATUS: Record<string, { text: string; color: string }> = {
  FREE: { text: '免费', color: 'default' },
  PAID: { text: '已支付', color: 'green' },
  PENDING: { text: '待支付', color: 'orange' },
  CLOSED: { text: '已关闭', color: 'default' },
  REFUNDING: { text: '退款中', color: 'blue' },
  REFUNDED: { text: '已退款', color: 'red' },
}
const STRATEGY_COLOR: Record<string, string> = {
  '早鸟价': 'orange',
  '原价': 'blue',
  'PlanF 会员·8折': 'gold',
  'PlanF 本次免费': 'gold',
  '会员开通': 'purple',
  '免费': 'default',
  '其他': 'default',
}
const yuan = (fen: number) => `¥${(fen / 100).toFixed(2)}`

export default function OrderList() {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [refundTarget, setRefundTarget] = useState<AdminOrder | null>(null)
  const [refundPwd, setRefundPwd] = useState('')
  const [refunding, setRefunding] = useState(false)

  useEffect(() => { load() }, [])
  const load = async () => {
    try { setLoading(true); setOrders((await getOrders()).data || []) }
    catch { message.error('加载订单失败') }
    finally { setLoading(false) }
  }

  const confirmRefund = async () => {
    if (refundPwd !== PHONE_VIEW_PASSWORD) { message.error('操作密码错误'); return }
    if (!refundTarget) return
    setRefunding(true)
    try {
      const r = await refundOrder(refundTarget.id)
      message.success(r.refunded ? '退款成功' : '退款处理中，请稍后刷新')
      setRefundTarget(null); setRefundPwd('')
      await load()
    } catch (e: any) {
      message.error(e?.message || '退款失败')
    } finally { setRefunding(false) }
  }

  const kw = keyword.trim().toLowerCase()
  const filtered = orders.filter(o => {
    if (typeFilter !== 'all' && o.type !== typeFilter) return false
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (dateRange && dateRange[0] && dateRange[1]) {
      const t = dayjs(o.createdAt)
      if (t.isBefore(dateRange[0]) || t.isAfter(dateRange[1])) return false
    }
    if (!kw) return true
    const hay = [o.outTradeNo, o.user?.nickname, o.user?.uid, o.title, o.user?.phone].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(kw)
  })

  const columns: ColumnsType<AdminOrder> = [
    { title: '订单号', dataIndex: 'outTradeNo', width: 130, render: (n: string) => n ? <Text style={{ fontFamily: 'monospace', fontSize: 12 }} copyable={{ text: n }}>{`${n.slice(0, 10)}…`}</Text> : <Text type="secondary">—</Text> },
    { title: '用户', key: 'user', width: 130, render: (_: any, r: AdminOrder) => <Space direction="vertical" size={0}><Text strong>{r.user?.nickname || '未设置'}</Text>{r.user?.phone && <Text type="secondary" style={{ fontSize: 11 }}>{maskPhone(r.user.phone)}</Text>}</Space> },
    { title: '用户ID', key: 'uid', width: 120, render: (_: any, r: AdminOrder) => <Text style={{ fontFamily: 'monospace', fontSize: 12 }} copyable={!!r.user?.uid}>{r.user?.uid || '-'}</Text> },
    { title: '支付类型', dataIndex: 'type', width: 100, render: (t: string) => <Tag color={t === 'MEMBERSHIP' ? 'gold' : 'blue'}>{t === 'MEMBERSHIP' ? 'PlanF 会员' : '活动报名'}</Tag> },
    { title: '活动 / 商品', dataIndex: 'title', width: 240, ellipsis: true, render: (t: string) => <Text>{t}</Text> },
    { title: '支付状态', dataIndex: 'status', width: 100, align: 'center' as const, render: (s: string) => { const m = STATUS[s] || { text: s, color: 'default' }; return <Tag color={m.color}>{m.text}</Tag> } },
    { title: '支付策略', dataIndex: 'strategy', width: 120, render: (s?: string) => s ? <Tag color={STRATEGY_COLOR[s] || 'default'}>{s}</Tag> : <Text type="secondary">—</Text> },
    { title: '金额', dataIndex: 'amount', width: 110, render: (a: number, r: AdminOrder) => r.status === 'FREE' || a === 0 ? <Text type="secondary">免费</Text> : <Text strong>{yuan(a)}</Text> },
    { title: '下单时间', dataIndex: 'createdAt', width: 150, render: (t: string) => <Text style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{dayjs(t).format('YYYY-MM-DD HH:mm')}</Text> },
    { title: '操作', key: 'action', width: 80, align: 'center' as const, render: (_: any, r: AdminOrder) => r.status === 'PAID' ? <Button size="small" type="link" danger onClick={() => setRefundTarget(r)}>退款</Button> : <Text type="secondary" style={{ fontSize: 12 }}>—</Text> },
  ]

  return (
    <div>
      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: isMobile ? 8 : 24 } }}
        title={<Title level={5} style={{ margin: 0 }}>订单管理</Title>}
        extra={
          <Space wrap>
            <Input.Search allowClear placeholder="订单号 / 用户 / 用户ID / 活动名" style={{ width: isMobile ? 170 : 260 }} value={keyword} onChange={e => setKeyword(e.target.value)} />
            <DatePicker.RangePicker
              value={dateRange as any}
              onChange={(v) => setDateRange(v as any)}
              allowClear
              format="YYYY-MM-DD"
              placeholder={['下单起', '下单止']}
              disabledDate={(d) => !!d && (d.isAfter(dayjs().endOf('day')) || d.isBefore(dayjs().subtract(1, 'year').startOf('day')))}
              presets={[
                { label: '今天', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
                { label: '昨天', value: [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')] },
                { label: '最近七天', value: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] },
                { label: '最近一个月', value: [dayjs().subtract(1, 'month').startOf('day'), dayjs().endOf('day')] },
              ]}
            />
            <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 120 }} options={[{ value: 'all', label: '全部类型' }, { value: 'EVENT', label: '活动报名' }, { value: 'MEMBERSHIP', label: 'PlanF 会员' }]} />
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }} options={[{ value: 'all', label: '全部状态' }, { value: 'FREE', label: '免费' }, { value: 'PAID', label: '已支付' }, { value: 'PENDING', label: '待支付' }, { value: 'CLOSED', label: '已关闭' }, { value: 'REFUNDING', label: '退款中' }, { value: 'REFUNDED', label: '已退款' }]} />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          size={isMobile ? 'small' : 'middle'}
          scroll={{ x: 1300 }}
          pagination={{ defaultPageSize: 20, pageSizeOptions: [10, 15, 20, 30, 100], showSizeChanger: true, size: 'small', showTotal: (t, r) => `第 ${r[0]}-${r[1]} 条 / 共 ${t} 条` }}
        />
      </Card>

      <Modal
        title="订单退款"
        open={!!refundTarget}
        onOk={confirmRefund}
        onCancel={() => { setRefundTarget(null); setRefundPwd('') }}
        okText="验证并退款"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: refunding }}
        destroyOnClose
        width={420}
        centered
      >
        {refundTarget && (
          <>
            <p style={{ color: '#555', marginBottom: 8 }}>
              确认对订单 <Text style={{ fontFamily: 'monospace' }}>{refundTarget.outTradeNo}</Text> 退款 <b>{yuan(refundTarget.amount)}</b>？
              <br />
              {refundTarget.type === 'MEMBERSHIP' ? '退款成功后将取消该用户的会员资格。' : '退款成功后将取消报名、释放名额。'}原路退回，不可撤销。
            </p>
            <p style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>⚠️ 高危操作，请输入操作密码</p>
            <Input.Password value={refundPwd} onChange={e => setRefundPwd(e.target.value)} onPressEnter={confirmRefund} placeholder="操作密码" autoFocus />
          </>
        )}
      </Modal>
    </div>
  )
}
