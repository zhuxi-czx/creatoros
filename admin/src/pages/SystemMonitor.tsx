import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Tag, Typography, Row, Col, Statistic, Select, Button, Space, message,
} from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getLogs, getLogSummary, getSystemHealth, type SystemLog, type DailySummary, type SystemHealth } from '../services/log'

const dot = (c: string) => <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: c, marginRight: 6, verticalAlign: 'middle' }} />
const pctColor = (p: number, warn: number, danger: number) => (p >= danger ? '#ff4d4f' : p >= warn ? '#fa8c16' : '#52c41a')
const fmtUptime = (s: number) => {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60)
  return d > 0 ? `${d} 天 ${h} 时` : h > 0 ? `${h} 时 ${m} 分` : `${m} 分`
}

const { Title, Text, Paragraph } = Typography

const SOURCE_LABEL: Record<string, string> = {
  http: '接口',
  cron: '定时任务',
  reminder: '活动提醒',
  payment: '支付',
  system: '服务器',
  wechat: '微信',
}

export default function SystemMonitor() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [level, setLevel] = useState<string | undefined>()
  const [summary, setSummary] = useState<DailySummary[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [logRes, sumRes] = await Promise.all([
        getLogs({ page, level }),
        getLogSummary(7),
      ])
      setLogs(logRes.data || [])
      setTotal(logRes.total || 0)
      setSummary(sumRes || [])
    } catch {
      message.error('加载监控数据失败')
    } finally {
      setLoading(false)
    }
  }, [page, level])

  useEffect(() => { load() }, [load])

  // 实时服务健康（每 30 秒刷新一次）
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const loadHealth = useCallback(async () => {
    try { setHealth(await getSystemHealth()) } catch { /* 接口不通时保留上次状态 */ }
  }, [])
  useEffect(() => {
    loadHealth()
    const t = setInterval(loadHealth, 30000)
    return () => clearInterval(t)
  }, [loadHealth])

  const today = summary[summary.length - 1] || { error: 0, warn: 0 }
  const week = summary.reduce((a, s) => ({ error: a.error + s.error, warn: a.warn + s.warn }), { error: 0, warn: 0 })

  const columns: ColumnsType<SystemLog> = [
    { title: '时间', dataIndex: 'createdAt', width: 160, render: (t: string) => dayjs(t).format('MM-DD HH:mm:ss') },
    { title: '级别', dataIndex: 'level', width: 80, render: (l: string) => <Tag color={l === 'ERROR' ? 'red' : 'orange'}>{l === 'ERROR' ? '错误' : '告警'}</Tag> },
    { title: '来源', dataIndex: 'source', width: 100, render: (s: string) => <Tag>{SOURCE_LABEL[s] || s}</Tag> },
    { title: '信息', dataIndex: 'message', ellipsis: true },
  ]

  const diskC = health ? pctColor(health.disk.usedPct, 85, 95) : '#999'
  const memC = health ? pctColor(health.memory.usedPct, 80, 90) : '#999'

  return (
    <div>
      {/* 实时服务健康 */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, marginBottom: 16 }}
        styles={{ body: { padding: 20 } }}
        title={<Title level={5} style={{ margin: 0 }}>服务健康</Title>}
        extra={<Space>{health && <Text type="secondary" style={{ fontSize: 12 }}>更新于 {dayjs(health.at).format('HH:mm:ss')}</Text>}<Button size="small" icon={<ReloadOutlined />} onClick={loadHealth} /></Space>}
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} md={5}>
            <Text type="secondary" style={{ fontSize: 12 }}>API 服务</Text>
            <div style={{ marginTop: 4, fontWeight: 600 }}>{dot(health ? '#52c41a' : '#999')}{health ? '在线' : '检测中'}</div>
          </Col>
          <Col xs={12} md={5}>
            <Text type="secondary" style={{ fontSize: 12 }}>数据库</Text>
            <div style={{ marginTop: 4, fontWeight: 600 }}>{dot(health?.db === 'ok' ? '#52c41a' : health?.db === 'error' ? '#ff4d4f' : '#999')}{health?.db === 'ok' ? '连接正常' : health?.db === 'error' ? '连接异常' : '检测中'}</div>
          </Col>
          <Col xs={12} md={5}>
            <Text type="secondary" style={{ fontSize: 12 }}>磁盘</Text>
            <div style={{ marginTop: 4, fontWeight: 600 }}>{dot(diskC)}{health ? `${health.disk.usedPct}%` : '--'} <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>{health ? `${health.disk.usedHuman}/${health.disk.sizeHuman}` : ''}</Text></div>
          </Col>
          <Col xs={12} md={5}>
            <Text type="secondary" style={{ fontSize: 12 }}>内存</Text>
            <div style={{ marginTop: 4, fontWeight: 600 }}>{dot(memC)}{health ? `${health.memory.usedPct}%` : '--'} <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>{health ? `${health.memory.usedMB}/${health.memory.totalMB}MB` : ''}</Text></div>
          </Col>
          <Col xs={12} md={4}>
            <Text type="secondary" style={{ fontSize: 12 }}>运行时长</Text>
            <div style={{ marginTop: 4, fontWeight: 600 }}>{health ? fmtUptime(health.uptimeSec) : '--'}</div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="今日错误" value={today.error} valueStyle={{ color: today.error > 0 ? '#ff4d4f' : undefined }} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="今日告警" value={today.warn} valueStyle={{ color: today.warn > 0 ? '#fa8c16' : undefined }} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="近 7 天错误" value={week.error} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="近 7 天告警" value={week.warn} /></Card></Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }} styles={{ body: { padding: 16 } }} title={<Title level={5} style={{ margin: 0 }}>近 7 天趋势</Title>}>
        <Row gutter={8}>
          {summary.map(d => (
            <Col flex="1" key={d.date} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: d.error > 0 ? '#ff4d4f' : d.warn > 0 ? '#fa8c16' : '#52c41a' }}>
                {d.error + d.warn}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d.date).format('MM-DD')}</Text>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        title={<Title level={5} style={{ margin: 0 }}>异常日志</Title>}
        extra={
          <Space>
            <Select allowClear placeholder="级别" style={{ width: 110 }} value={level} onChange={(v) => { setLevel(v); setPage(1) }}
              options={[{ value: 'ERROR', label: '错误' }, { value: 'WARN', label: '告警' }]} />
            <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={logs}
          loading={loading}
          size="small"
          expandable={{
            expandedRowRender: (r) => r.detail
              ? <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 12, margin: 0, maxHeight: 260, overflow: 'auto', color: '#888' }}>{r.detail}</Paragraph>
              : <Text type="secondary">无详情</Text>,
            rowExpandable: (r) => !!r.detail,
          }}
          pagination={{ current: page, total, pageSize: 30, showSizeChanger: false, onChange: setPage, size: 'small' }}
        />
      </Card>
    </div>
  )
}
