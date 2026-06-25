import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Space, message, Image, Upload, Row, Col } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { getColumns, updateColumn, type ColumnConfigItem } from '../services/column'
import { uploadImage } from '../services/event'
import { resolveImageUrl } from '../services/api'

const TYPE_LABEL: Record<string, string> = {
  FEATURED: '社区精选',
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
        {items.map((it) => (
          <Col xs={24} md={8} key={it.id}>
            <ColumnCard item={it} onSaved={load} />
          </Col>
        ))}
      </Row>
    </Card>
  )
}

function ColumnCard({ item, onSaved }: { item: ColumnConfigItem; onSaved: () => void }) {
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
    <Card type="inner" title={TYPE_LABEL[item.type] || item.type} style={{ marginBottom: 16 }}>
      <Form form={form} layout="vertical">
        <Form.Item label="标题" name="title"><Input /></Form.Item>
        <Form.Item label="简介" name="intro"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item label="图标（lucide 名）" name="icon"><Input /></Form.Item>
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
