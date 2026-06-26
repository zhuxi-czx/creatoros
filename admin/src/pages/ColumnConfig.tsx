import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Space, message, Image, Upload, Row, Col, Select } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { getColumns, updateColumn, moveColumn, type ColumnConfigItem } from '../services/column'
import { uploadImage } from '../services/event'
import { resolveImageUrl } from '../services/api'
import { IconSelect } from '../utils/lucideIcons'

const TYPE_LABEL: Record<string, string> = {
  FEATURED: '敞开精选',
  PLANF: 'PlanF 专享',
  GUEST: '大咖分享',
}

export default function ColumnConfig() {
  const [items, setItems] = useState<ColumnConfigItem[]>([])
  const load = async () => {
    try { setItems((await getColumns()) || []) } catch { message.error('加载失败') }
  }
  useEffect(() => { load() }, [])

  return (
    <Card bordered={false} style={{ borderRadius: 12 }} title="专栏配置（发现页 3 个专栏卡）">
      <Row gutter={16}>
        {items.map((it, idx) => (
          <Col xs={24} md={8} key={it.id}>
            <ColumnCard
              item={it}
              index={idx}
              total={items.length}
              onMove={async (dir) => { try { await moveColumn(it.type, dir); load() } catch { message.error('调整失败') } }}
              onSaved={load}
            />
          </Col>
        ))}
      </Row>
    </Card>
  )
}

function ColumnCard({ item, index, total, onMove, onSaved }: { item: ColumnConfigItem; index: number; total: number; onMove: (dir: 'up' | 'down') => void; onSaved: () => void }) {
  const [form] = Form.useForm()
  const [bg, setBg] = useState(item.bgUrl || '')
  useEffect(() => {
    form.setFieldsValue({ title: item.title, intro: item.intro, icon: item.icon })
    setBg(item.bgUrl || '')
  }, [item])

  const handleBg = async (file: File) => {
    try { const r = await uploadImage(file, 'column'); setBg(r.url); message.success('已上传') } catch { message.error('上传失败') }
    return false
  }
  const save = async () => {
    const v = await form.validateFields()
    try { await updateColumn(item.type, { ...v, bgUrl: bg }); message.success('已保存'); onSaved() } catch { message.error('保存失败') }
  }

  return (
    <Card type="inner" title={TYPE_LABEL[item.type] || item.type} style={{ marginBottom: 16 }}
      extra={
        <Space>
          <Button size="small" disabled={index === 0} onClick={() => onMove('up')}>← 左移</Button>
          <Button size="small" disabled={index === total - 1} onClick={() => onMove('down')}>右移 →</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item label="标题" name="title"><Input /></Form.Item>
        <Form.Item label="简介" name="intro"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item label="图标" name="icon"><IconSelect /></Form.Item>
        <Form.Item label="背景图（专栏卡）">
          <Space direction="vertical">
            {bg && <Image src={resolveImageUrl(bg)} width={160} style={{ borderRadius: 8 }} />}
            <Upload beforeUpload={handleBg} showUploadList={false} accept="image/*"><Button icon={<UploadOutlined />}>{bg ? '更换' : '上传'}</Button></Upload>
          </Space>
        </Form.Item>
        <Button type="primary" onClick={save} block>保存</Button>
      </Form>
    </Card>
  )
}
