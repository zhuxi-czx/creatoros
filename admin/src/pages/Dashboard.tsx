import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, Table, Tag, Typography, Row, Col, message, Grid, Empty } from 'antd'
import {
  CalendarOutlined, UserOutlined, FireOutlined, CheckCircleOutlined,
  MoneyCollectOutlined, PayCircleOutlined, RiseOutlined, CrownOutlined,
  WarningOutlined, AlertOutlined,
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

const yuan = (fen = 0) => `¥${Math.round((fen || 0) / 100).toLocaleString()}`
const GUTTER: [number, number] = [16, 16]

// 统一 KPI 卡（icon 圆底 + 深色数字 + 副标题占位，等高）
function Kpi({ icon, iconBg, title, value, sub, subColor, color }: { icon: React.ReactNode; iconBg: string; title: string; value: React.ReactNode; sub?: string; subColor?: string; color: string }) {
  return (
    <Card bordered={false} style={{ borderRadius: 12, height: '100%' }} styles={{ body: { padding: 20 } }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 14 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#1A1A1A', lineHeight: 1.2, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: subColor || '#bbb', marginTop: 4, minHeight: 16 }}>{sub || ''}</div>
    </Card>
  )
}

// 标准卡片外壳（同排等高）
function Panel({ title, extra, minH, children }: { title: string; extra?: React.ReactNode; minH?: number; children: React.ReactNode }) {
  return (
    <Card
      bordered={false}
      style={{ borderRadius: 12, height: '100%' }}
      styles={{ body: { padding: 16, minHeight: minH } }}
      title={<Title level={5} style={{ margin: 0 }}>{title}</Title>}
      extra={extra}
    >
      {children}
    </Card>
  )
}

function TrendBars({ data, color, money }: { data: { date: string; value: number }[]; color: string; money?: boolean }) {
  const max = Math.max(1, ...data.map(d => d.value))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120, paddingTop: 16 }}>
      {data.map(d => (
        <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
          {d.value > 0 && <div style={{ fontSize: 9, color: '#999', whiteSpace: 'nowrap' }}>{money ? yuan(d.value) : d.value}</div>}
          <div title={`${d.date}: ${money ? yuan(d.value) : d.value}`} style={{ width: '70%', height: `${(d.value / max) * 80}px`, minHeight: d.value > 0 ? 3 : 0, background: color, borderRadius: '3px 3px 0 0', transition: 'height .3s' }} />
          <div style={{ fontSize: 9, color: '#bbb' }}>{d.date.slice(5)}</div>
        </div>
      ))}
    </div>
  )
}

function RatioBar({ items }: { items: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...items.map(i => i.value))
  return (
    <div>
      {items.map(i => (
        <div key={i.label} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
            <Text>{i.label}</Text><Text strong>{i.value}</Text>
          </div>
          <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(i.value / max) * 100}%`, height: 8, background: i.color, borderRadius: 4, transition: 'width .3s' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setStats((await getStats()) || {})
    } catch {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const rev = stats.revenue || { orders: {} }
  const mem = stats.members || {}
  const trend = stats.trend || { signups: [], revenue: [], users: [] }
  const ps = stats.priceStrategy || {}
  const alerts = stats.alerts || {}

  const eventCol: ColumnsType<any> = [
    { title: '活动名称', dataIndex: 'title', key: 'title', ellipsis: true, render: (t: string) => <Text strong>{t}</Text> },
    { title: '报名/容量', key: 'signups', width: 96, render: (_: any, r: any) => <Text>{r._count?.signups ?? r.signups ?? 0}/{r.maxCapacity}</Text> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 86, render: (s: string) => { const m = STATUS_MAP[s] || { color: 'default', label: s }; return <Tag color={m.color}>{m.label}</Tag> } },
  ]

  // 环比文案（绿涨红跌）
  const delta = (cur: number, prev: number, label: string): { sub: string; subColor: string } => {
    if (!prev) return { sub: cur > 0 ? `${label} 新增` : '', subColor: '#10b981' }
    const pct = Math.round(((cur - prev) / prev) * 100)
    return { sub: `${label} ${pct >= 0 ? '+' : ''}${pct}%`, subColor: pct >= 0 ? '#10b981' : '#ef4444' }
  }

  // 8 个核心指标
  const kpis = [
    { icon: <MoneyCollectOutlined />, iconBg: '#E6F7F0', title: '累计营收', value: yuan(rev.total), color: '#10b981', sub: rev.month ? `本月 ${yuan(rev.month)}` : '', subColor: '#bbb' },
    { icon: <PayCircleOutlined />, iconBg: '#ECEDFB', title: '本月营收', value: yuan(rev.month), color: '#6366f1', ...delta(rev.month || 0, rev.lastMonth || 0, '较上月') },
    { icon: <RiseOutlined />, iconBg: '#FEF3E2', title: '今日营收', value: yuan(rev.today), color: '#f59e0b', ...delta(rev.today || 0, rev.yesterday || 0, '较昨日') },
    { icon: <CrownOutlined />, iconBg: '#F7F1E6', title: '有效会员', value: mem.active || 0, color: '#C9A96E', sub: mem.penetration ? `渗透率 ${mem.penetration}%` : '', subColor: '#C9A96E' },
    { icon: <UserOutlined />, iconBg: '#F0EDFB', title: '总用户', value: stats.totalUsers || 0, color: '#8b5cf6', sub: stats.newUsersToday ? `今日 +${stats.newUsersToday}` : '', subColor: '#10b981' },
    { icon: <CheckCircleOutlined />, iconBg: '#E6F7F0', title: '总报名', value: stats.totalSignups || 0, color: '#10b981', sub: '', subColor: '#bbb' },
    { icon: <FireOutlined />, iconBg: '#FEF3E2', title: '进行中活动', value: stats.activeEvents || 0, color: '#f59e0b', sub: '', subColor: '#bbb' },
    { icon: <WarningOutlined />, iconBg: '#FDECEC', title: '待处理退款', value: alerts.refundPending || 0, color: alerts.refundPending > 0 ? '#ef4444' : '#999', sub: alerts.refundPending > 0 ? '需尽快处理' : '', subColor: '#ef4444' },
  ]

  return (
    <div>
      {/* 核心指标（2×4 等高） */}
      <Row gutter={GUTTER} style={{ marginBottom: 16 }}>
        {kpis.map((k, i) => (
          <Col xs={12} md={6} key={i} style={{ marginBottom: i < 4 ? 0 : 0 }}>
            <Kpi {...k} />
          </Col>
        ))}
      </Row>

      {/* 经营分析（3 列等高） */}
      <Row gutter={GUTTER} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Panel title="收入构成" minH={150}>
            <RatioBar items={[
              { label: '活动报名（元）', value: Math.round((rev.event || 0) / 100), color: '#6366f1' },
              { label: '会员开通（元）', value: Math.round((rev.member || 0) / 100), color: '#C9A96E' },
            ]} />
            <Text type="secondary" style={{ fontSize: 12 }}>累计退款 {yuan(rev.refund)}</Text>
          </Panel>
        </Col>
        <Col xs={24} md={8}>
          <Panel title="订单概览" minH={150}>
            <Row gutter={8} style={{ textAlign: 'center', marginTop: 8 }}>
              {[
                { label: '已支付', value: rev.orders?.paid || 0, color: '#10b981' },
                { label: '待支付', value: rev.orders?.pending || 0, color: '#f59e0b' },
                { label: '已退款', value: rev.orders?.refunded || 0, color: '#ff4d4f' },
              ].map(o => (
                <Col span={8} key={o.label}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: o.color }}>{o.value}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{o.label}</Text>
                </Col>
              ))}
            </Row>
          </Panel>
        </Col>
        <Col xs={24} md={8}>
          <Panel title="价格策略分布（报名数）" minH={150}>
            <RatioBar items={[
              { label: '🔥 早鸟价', value: ps.earlyBird || 0, color: '#E8743B' },
              { label: '原价', value: ps.original || 0, color: '#6366f1' },
              { label: '会员价 8 折', value: ps.member || 0, color: '#C9A96E' },
              { label: '免费', value: ps.free || 0, color: '#10b981' },
            ]} />
          </Panel>
        </Col>
      </Row>

      {/* 趋势（3 列等高） */}
      <Row gutter={GUTTER} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}><Panel title="报名趋势 · 14 天"><TrendBars data={trend.signups} color="#10b981" /></Panel></Col>
        <Col xs={24} md={8}><Panel title="营收趋势 · 14 天"><TrendBars data={trend.revenue} color="#6366f1" money /></Panel></Col>
        <Col xs={24} md={8}><Panel title="新增用户 · 14 天"><TrendBars data={trend.users} color="#8b5cf6" /></Panel></Col>
      </Row>

      {/* 洞察 + 预警（2×2 等高） */}
      <Row gutter={GUTTER} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Panel title="用户状态分布" minH={180}>
            {stats.statusDist?.length
              ? <RatioBar items={stats.statusDist.map((d: any, i: number) => ({ label: d.status, value: d.count, color: ['#8b5cf6', '#6366f1', '#10b981', '#f59e0b', '#C9A96E', '#ec4899', '#06b6d4'][i % 7] }))} />
              : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无状态数据" />}
          </Panel>
        </Col>
        <Col xs={24} lg={12}>
          <Panel title="会员到期提醒 · 近 7 天" minH={180}>
            <Table
              rowKey={(r: any) => r.uid || r.nickname} size="small" pagination={false} loading={loading}
              dataSource={mem.expiringSoon || []}
              locale={{ emptyText: '近 7 天无到期会员' }}
              columns={[
                { title: '用户', key: 'u', render: (_: any, r: any) => <Text strong>{r.nickname || r.uid || '—'}</Text> },
                { title: '到期日', dataIndex: 'expireAt', key: 'e', width: 130, render: (t: string) => <Tag color="gold">{dayjs(t).format('MM-DD')} 到期</Tag> },
              ]}
            />
          </Panel>
        </Col>
      </Row>

      <Row gutter={GUTTER} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Panel title="临近开始活动 · 24h" minH={160}>
            <Table
              rowKey="id" size="small" pagination={false} loading={loading}
              dataSource={alerts.upcomingEvents || []}
              locale={{ emptyText: '24 小时内无活动开始' }}
              columns={[
                { title: '活动', dataIndex: 'title', key: 't', ellipsis: true, render: (t: string) => <Text strong>{t}</Text> },
                { title: '开始', dataIndex: 'date', key: 'd', width: 108, render: (t: string) => dayjs(t).format('MM-DD HH:mm') },
                { title: '报名', key: 's', width: 76, render: (_: any, r: any) => <Text>{r.signups}/{r.maxCapacity}</Text> },
              ]}
            />
          </Panel>
        </Col>
        <Col xs={24} lg={12}>
          <Panel title="运维预警" minH={160} extra={<Link to="/logs"><Text type="secondary" style={{ fontSize: 12 }}>系统监控 →</Text></Link>}>
            <Row gutter={12} style={{ textAlign: 'center', marginTop: 8 }}>
              <Col span={12}>
                <div style={{ fontSize: 28, fontWeight: 700, color: alerts.todayErrors > 0 ? '#ff4d4f' : '#52c41a' }}>
                  <AlertOutlined style={{ fontSize: 20, marginRight: 6 }} />{alerts.todayErrors || 0}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>今日异常 / 告警</Text>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 28, fontWeight: 700, color: alerts.refundPending > 0 ? '#ff4d4f' : '#999' }}>{alerts.refundPending || 0}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>待处理退款</Text>
              </Col>
            </Row>
          </Panel>
        </Col>
      </Row>

      {/* 活动表（2 列等高） */}
      <Row gutter={GUTTER}>
        <Col xs={24} lg={12}>
          <Panel title="热门活动">
            <Table columns={eventCol} dataSource={stats.topEvents || []} rowKey="id" loading={loading} size="small" pagination={false} />
          </Panel>
        </Col>
        <Col xs={24} lg={12}>
          <Panel title="最近活动">
            <Table columns={eventCol} dataSource={stats.recentEvents || []} rowKey="id" loading={loading} size="small" pagination={false} />
          </Panel>
        </Col>
      </Row>
    </div>
  )
}
