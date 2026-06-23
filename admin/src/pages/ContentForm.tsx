import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Card, Form, Input, Button, Select, Upload, Space, Typography,
  Divider, message, Image as AntImage, Segmented,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined, SendOutlined, UploadOutlined } from '@ant-design/icons'
import RichEditor from '../components/RichEditor'
import { resolveImageUrl } from '../services/api'
import { uploadImage } from '../services/event'
import {
  getContent, createContent, updateContent, getCreatorOptions, type CreatorOption,
} from '../services/content'

const { Title, Text } = Typography

export default function ContentForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [form] = Form.useForm()
  const [creators, setCreators] = useState<CreatorOption[]>([])
  const [cover, setCover] = useState('')
  const [body, setBody] = useState('')
  const [title, setTitle] = useState('')
  const [creatorId, setCreatorId] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => { init() }, [id])

  const init = async () => {
    try {
      const crs = await getCreatorOptions()
      setCreators(crs || [])
      if (isEdit && id) {
        const c = await getContent(id)
        form.setFieldsValue({ title: c.title, creatorId: c.creatorId })
        setTitle(c.title)
        setCreatorId(c.creatorId)
        setCover(c.coverUrl || '')
        setBody(c.body || '')
      }
    } catch {
      message.error('加载失败')
    }
  }

  const handleCover = async (file: File) => {
    try {
      const res = await uploadImage(file, 'content')
      setCover(res.url)
      message.success('封面已上传')
    } catch { message.error('上传失败') }
    return false
  }

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    try {
      const values = await form.validateFields()
      if (!cover) { message.error('请上传封面图'); return }
      if (!body || body === '<p><br></p>') { message.error('请输入正文'); return }
      setLoading(true)
      const payload = { title: values.title, creatorId: values.creatorId, coverUrl: cover, body, status }
      if (isEdit && id) await updateContent(id, payload)
      else await createContent(payload)
      message.success(status === 'PUBLISHED' ? '已发布' : '已保存草稿')
      navigate('/contents')
    } catch (e: any) {
      if (e?.errorFields) return
      message.error(e?.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const currentCreator = creators.find(c => c.id === creatorId)

  return (
    <div style={{ display: 'flex', gap: 24, maxWidth: showPreview ? 1100 : 760, margin: '0 auto' }}>
      <Card bordered={false} style={{ borderRadius: 12, flex: 1 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/contents')} />
          <Title level={4} style={{ margin: 0 }}>{isEdit ? '编辑内容' : '新建内容'}</Title>
        </Space>

        <Form form={form} layout="vertical">
          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="内容标题" maxLength={60} showCount onChange={e => setTitle(e.target.value)} />
          </Form.Item>

          <Form.Item label="对谈对象（Creator）" name="creatorId" rules={[{ required: true, message: '请选择对谈对象' }]}
            extra={creators.length === 0 ? '暂无 Creator，请先在「用户管理」把对谈嘉宾设为 Creator 并完善资料' : undefined}>
            <Select
              placeholder="选择一位 Creator"
              options={creators.map(c => ({ value: c.id, label: `${c.nickname || '未命名'}${c.title ? ' · ' + c.title : ''}` }))}
              showSearch optionFilterProp="label"
              onChange={(v) => setCreatorId(v)}
            />
          </Form.Item>

          <Form.Item label="封面图" required>
            <Space direction="vertical">
              {cover && <AntImage src={resolveImageUrl(cover)} width={200} style={{ borderRadius: 8 }} />}
              <Upload beforeUpload={handleCover} showUploadList={false} accept="image/*">
                <Button icon={<UploadOutlined />}>{cover ? '更换封面' : '上传封面'}</Button>
              </Upload>
            </Space>
          </Form.Item>

          <Form.Item label="正文（图文）" required>
            <RichEditor value={body} onChange={setBody} minHeight={480} />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Button type={showPreview ? 'default' : 'dashed'} onClick={() => setShowPreview(!showPreview)} style={{ width: '100%' }}>
              {showPreview ? '关闭预览' : '📱 手机预览'}
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button onClick={() => navigate('/contents')}>取消</Button>
              <Button icon={<SaveOutlined />} loading={loading} onClick={() => handleSubmit('DRAFT')}>保存草稿</Button>
              <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={() => handleSubmit('PUBLISHED')}
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}>
                发布
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 手机预览：直接渲染图文（无需保存） */}
      {showPreview && (
        <div style={{ width: 375, flexShrink: 0, position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
          <div style={{ background: '#1A1A1A', borderRadius: 48, padding: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ height: 760, overflowY: 'auto', borderRadius: 36, background: '#fff' }}>
              <div style={{ padding: '20px 20px 8px' }}>
                <div style={{ fontSize: 23, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.35 }}>{title || '内容标题'}</div>
                <div style={{ marginTop: 12, fontSize: 13, color: '#999' }}>
                  {currentCreator ? `${currentCreator.nickname || ''}${currentCreator.title ? ' · ' + currentCreator.title : ''}` : '对谈对象'}
                </div>
              </div>
              {cover && <img src={resolveImageUrl(cover)} style={{ width: '100%', display: 'block' }} />}
              <div
                style={{ padding: '14px 20px 40px', fontSize: 15, color: '#333', lineHeight: 1.8 }}
                className="content-preview-body"
                dangerouslySetInnerHTML={{ __html: body || '<p style="color:#bbb">正文预览…</p>' }}
              />
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#999' }}>实时预览（含未保存内容）</div>
        </div>
      )}
    </div>
  )
}
