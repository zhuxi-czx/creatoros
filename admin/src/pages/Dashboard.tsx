import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, Table, Tag, Typography, Statistic, Row, Col, message, Grid, Empty } from 'antd'
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

// 纯 CSS 柱状图（不引图表库）
function TrendBars({ data, color, money }: { data: { date: string; value: number }[]; color: string; money?: boolean }) {
  const max = Math.max(1, ...data.map(d => d.value))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 130, paddingTop: 18 }}>
      {data.map(d => (
        <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
          {d.value > 0 && <div style={{ fontSize: 9, color: '#999', whiteSpace: 'nowrap' }}>{money ? yuan(d.value) : d.value}</div>}
          <div title={`${d.date}: ${money ? yuan(d.value) : d.value}`} style={{ width: '100%', height: `${(d.value / max) * 80}px`, minHeight: d.value > 0 ? 3 : 0, background: color, borderRadius: '3px 3px 0 0', transition: 'height .3s' }} />
          <div style={{ fontSize: 9, color: '#bbb' }}>{d.date.slice(5)}</div>
        </div>
      ))}
    </div>
  )
}

// 横向占比条
function RatioBar({ items }: { items: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...items.map(i => i.value))
  return (
    <div>
      {items.map(i => (
        <div key={i.label} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
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
    { title: '报名/容量', key: 'signups', width: 100, render: (_: any, r: any) => <Text>{r._count?.signups ?? r.signups ?? 0}/{r.maxCapacity}</Text> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (s: string) => { const m = STATUS_MAP[s] || { color: 'default', label: s }; return <Tag color={m.color}>{m.label}</Tag> } },
  ]

  const cardStyle = { borderRadius: 12 }
  const bodyPad = { body: { padding: isMobile ? 12 : 20 } }

  return (
    <div>
      {/* 经营核心 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        {[
          { title: '累计营收', value: yuan(rev.total), icon: <MoneyCollectOutlined />, color: '#10b981' },
          { title: '本月营收', value: yuan(rev.month), icon: <PayCircleOutlined />, color: '#6366f1' },
          { title: '今日营收', value: yuan(rev.today), icon: <RiseOutlined />, color: '#f59e0b' },
          { title: '有效会员', value: mem.active || 0, suffix: mem.penetration ? `· 渗透 ${mem.penetration}%` : '', icon: <CrownOutlined />, color: '#C9A96E' },
        ].map((s, i) => (
          <Col xs={12} md={6} key={i}>
            <Card bordered={false} style={cardStyle} styles={bodyPad}>
              <Statistic title={s.title} value={s.value} prefix={<span style={{ color: s.color }}>{s.icon}</span>} valueStyle={{ color: s.color, fontSize: isMobile ? 18 : 26 }} />
              {s.suffix && <Text type="secondary" style={{ fontSize: 12 }}>{s.suffix}</Text>}
            </Card>
          </Col>
        ))}
      </Row>

      {/* 规模 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        {[
          { title: '总用户', value: stats.totalUsers || 0, suffix: stats.newUsersToday ? `今日 +${stats.newUsersToday}` : '', icon: <UserOutlined />, color: '#8b5cf6' },
          { title: '总报名', value: stats.totalSignups || 0, icon: <CheckCircleOutlined />, color: '#10b981' },
          { title: '进行中活动', value: stats.activeEvents || 0, icon: <FireOutlined />, color: '#f59e0b' },
          { title: '待处理退款', value: alerts.refundPending || 0, icon: <WarningOutlined />, color: alerts.refundPending > 0 ? '#ff4d4f' : '#999' },
        ].map((s, i) => (
          <Col xs={12} md={6} key={i}>
            <Card bordered={false} style={cardStyle} styles={bodyPad}>
              <Statistic title={s.title} value={s.value} prefix={<span style={{ color: s.color }}>{s.icon}</span>} valueStyle={{ color: s.color, fontSize: isMobile ? 18 : 26 }} />
              {s.suffix && <Text type="secondary" style={{ fontSize: 12 }}>{s.suffix}</Text>}
            </Card>
          </Col>
        ))}
      </Row>

      {/* 收入构成 / 订单 / 价格策略 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={cardStyle} title={<Title level={5} style={{ margin: 0 }}>收入构成</Title>}>
            <RatioBar items={[
              { label: '活动报名', value: Math.round((rev.event || 0) / 100), color: '#6366f1' },
              { label: '会员开通', value: Math.round((rev.member || 0) / 100), color: '#C9A96E' },
            ]} />
            <Text type="secondary" style={{ fontSize: 12 }}>累计退款 {yuan(rev.refund)}（单位：元）</Text>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={cardStyle} title={<Title level={5} style={{ margin: 0 }}>订单概览</Title>}>
            <Row gutter={8}>
              <Col span={8}><Statistic title="已支付" value={rev.orders?.paid || 0} valueStyle={{ color: '#10b981', fontSize: 22 }} /></Col>
              <Col span={8}><Statistic title="待支付" value={rev.orders?.pending || 0} valueStyle={{ color: '#f59e0b', fontSize: 22 }} /></Col>
              <Col span={8}><Statistic title="已退款" value={rev.orders?.refunded || 0} valueStyle={{ color: '#ff4d4f', fontSize: 22 }} /></Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={cardStyle} title={<Title level={5} style={{ margin: 0 }}>价格策略分布（报名数）</Title>}>
            <RatioBar items={[
              { label: '🔥 早鸟价', value: ps.earlyBird || 0, color: '#E8743B' },
              { label: '原价', value: ps.original || 0, color: '#6366f1' },
              { label: '会员价 8折', value: ps.member || 0, color: '#C9A96E' },
              { label: '免费', value: ps.free || 0, color: '#10b981' },
            ]} />
          </Card>
        </Col>
      </Row>

      {/* 趋势（近 14 天） */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={cardStyle} title={<Title level={5} style={{ margin: 0 }}>报名趋势 · 14天</Title>}>
            <TrendBars data={trend.signups} color="#10b981" />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={cardStyle} title={<Title level={5} style={{ margin: 0 }}>营收趋势 · 14天</Title>}>
            <TrendBars data={trend.revenue} color="#6366f1" money />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={cardStyle} title={<Title level={5} style={{ margin: 0 }}>新增用户 · 14天</Title>}>
            <TrendBars data={trend.users} color="#8b5cf6" />
          </Card>
        </Col>
      </Row>

      {/* 用户状态分布 / 会员到期提醒 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={cardStyle} title={<Title level={5} style={{ margin: 0 }}>用户状态分布</Title>}>
            {stats.statusDist?.length
              ? <RatioBar items={stats.statusDist.map((d: any, i: number) => ({ label: d.status, value: d.count, color: ['#8b5cf6', '#6366f1', '#10b981', '#f59e0b', '#C9A96E', '#ec4899', '#06b6d4'][i % 7] }))} />
              : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无状态数据" />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={cardStyle} styles={{ body: { padding: isMobile ? 8 : 16 } }} title={<Title level={5} style={{ margin: 0 }}>会员到期提醒 · 近 7 天</Title>}>
            <Table
              rowKey={(r: any) => r.uid || r.nickname} size="small" pagination={false} loading={loading}
              dataSource={mem.expiringSoon || []}
              locale={{ emptyText: '近 7 天无到期会员' }}
              columns={[
                { title: '用户', key: 'u', render: (_: any, r: any) => <Text strong>{r.nickname || r.uid || '—'}</Text> },
                { title: '到期日', dataIndex: 'expireAt', key: 'e', width: 120, render: (t: string) => <Tag color="gold">{dayjs(t).format('MM-DD')} 到期</Tag> },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* 临近活动 / 运维预警 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={cardStyle} styles={{ body: { padding: isMobile ? 8 : 16 } }} title={<Title level={5} style={{ margin: 0 }}>临近开始活动 · 24h</Title>}>
            <Table
              rowKey="id" size="small" pagination={false} loading={loading}
              dataSource={alerts.upcomingEvents || []}
              locale={{ emptyText: '24 小时内无活动开始' }}
              columns={[
                { title: '活动', dataIndex: 'title', key: 't', ellipsis: true, render: (t: string) => <Text strong>{t}</Text> },
                { title: '开始', dataIndex: 'date', key: 'd', width: 110, render: (t: string) => dayjs(t).format('MM-DD HH:mm') },
                { title: '报名', key: 's', width: 80, render: (_: any, r: any) => <Text>{r.signups}/{r.maxCapacity}</Text> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={cardStyle} title={<Title level={5} style={{ margin: 0 }}>运维预警</Title>}>
            <Row gutter={12} align="middle">
              <Col span={12}>
                <Statistic title="今日异常 / 告警" value={alerts.todayErrors || 0} prefix={<AlertOutlined style={{ color: alerts.todayErrors > 0 ? '#ff4d4f' : '#52c41a' }} />} valueStyle={{ color: alerts.todayErrors > 0 ? '#ff4d4f' : '#52c41a', fontSize: 24 }} />
              </Col>
              <Col span={12}>
                <Statistic title="待处理退款" value={alerts.refundPending || 0} valueStyle={{ color: alerts.refundPending > 0 ? '#ff4d4f' : '#999', fontSize: 24 }} />
              </Col>
            </Row>
            <Link to="/logs"><Text type="secondary" style={{ fontSize: 12 }}>查看系统监控 →</Text></Link>
          </Card>
        </Col>
      </Row>

      {/* 热门 / 最近活动 */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={cardStyle} styles={{ body: { padding: isMobile ? 8 : 16 } }} title={<Title level={5} style={{ margin: 0 }}>热门活动</Title>}>
            <Table columns={eventCol} dataSource={stats.topEvents || []} rowKey="id" loading={loading} size="small" pagination={false} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={cardStyle} styles={{ body: { padding: isMobile ? 8 : 16 } }} title={<Title level={5} style={{ margin: 0 }}>最近活动</Title>}>
            <Table columns={eventCol} dataSource={stats.recentEvents || []} rowKey="id" loading={loading} size="small" pagination={false} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
