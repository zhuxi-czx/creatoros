import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Space, Typography, Button, Drawer, Form, Input,
  Select, Segmented, Upload, message, Popconfirm, Image as AntImage
} from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import RichEditor from '../components/RichEditor'
import { resolveImageUrl } from '../services/api'
import { uploadImage } from '../services/event'
import {
  getContents, getContent, createContent, updateContent, deleteContent,
  getCreatorOptions, type ContentItem, type CreatorOption,
} from '../services/content'

const { Title, Text } = Typography

export default function ContentList() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [creators, setCreators] = useState<CreatorOption[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [cover, setCover] = useState<string>('')
  const [body, setBody] = useState<string>('')
  const [form] = Form.useForm()

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const [list, crs] = await Promise.all([getContents(), getCreatorOptions()])
      setItems(list || [])
      setCreators(crs || [])
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    if (creators.length === 0) {
      message.warning('请先在「用户管理」里把成员设为 Creator')
      return
    }
    setEditingId(null)
    setCover('')
    setBody('')
    form.resetFields()
    form.setFieldsValue({ status: 'PUBLISHED' })
    setDrawerOpen(true)
  }

  const openEdit = async (id: string) => {
    try {
      const c = await getContent(id)
      setEditingId(id)
      setCover(c.coverUrl || '')
      setBody(c.body || '')
      form.setFieldsValue({ title: c.title, creatorId: c.creatorId, status: c.status })
      setDrawerOpen(true)
    } catch {
      message.error('加载内容失败')
    }
  }

  const handleCover = async (file: File) => {
    try {
      const res = await uploadImage(file, 'content')
      setCover(res.url)
      message.success('封面已上传')
    } catch {
      message.error('上传失败')
    }
    return false
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (!cover) { message.error('请上传封面图'); return }
      if (!body || body === '<p><br></p>') { message.error('请输入正文'); return }
      setSaving(true)
      const payload = {
        title: values.title, creatorId: values.creatorId, status: values.status,
        coverUrl: cover, body,
      }
      if (editingId) await updateContent(editingId, payload)
      else await createContent(payload)
      message.success('已保存')
      setDrawerOpen(false)
      await load()
    } catch (e: any) {
      if (e?.errorFields) return // 表单校验错误
      message.error(e?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try { await deleteContent(id); message.success('已删除'); await load() }
    catch (e: any) { message.error(e?.message || '删除失败') }
  }

  const columns: ColumnsType<ContentItem> = [
    {
      title: '内容', key: 'title',
      render: (_, r) => (
        <Space>
          {r.coverUrl && <AntImage src={resolveImageUrl(r.coverUrl)} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 6 }} />}
          <Text strong>{r.title}</Text>
        </Space>
      ),
    },
    {
      title: '对谈对象', key: 'creator', width: 160,
      render: (_, r) => <Text>{r.creator.nickname || '—'}{r.creator.title ? ` · ${r.creator.title}` : ''}</Text>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: string) => <Tag color={s === 'PUBLISHED' ? 'green' : 'default'}>{s === 'PUBLISHED' ? '已发布' : '草稿'}</Tag>,
    },
    {
      title: '发布时间', dataIndex: 'publishedAt', key: 'publishedAt', width: 140,
      render: (t?: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '—',
    },
    {
      title: '操作', key: 'action', width: 130,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r.id)}>编辑</Button>
          <Popconfirm title="确认删除该内容？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        title={<Title level={5} style={{ margin: 0 }}>敞开对谈 · 内容管理</Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建内容</Button>}
      >
        <Table columns={columns} dataSource={items} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Drawer
        title={editingId ? '编辑内容' : '新建内容'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={Math.min(720, window.innerWidth)}
        extra={<Button type="primary" loading={saving} onClick={handleSave}>保存</Button>}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="内容标题" maxLength={60} showCount />
          </Form.Item>

          <Form.Item label="对谈对象（Creator）" name="creatorId" rules={[{ required: true, message: '请选择对谈对象' }]}>
            <Select
              placeholder="选择一位 Creator"
              options={creators.map(c => ({ value: c.id, label: `${c.nickname || '未命名'}${c.title ? ' · ' + c.title : ''}` }))}
              showSearch optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item label="封面图" required>
            <Space direction="vertical">
              {cover && <AntImage src={resolveImageUrl(cover)} width={160} style={{ borderRadius: 8 }} />}
              <Upload beforeUpload={handleCover} showUploadList={false} accept="image/*">
                <Button icon={<UploadOutlined />}>{cover ? '更换封面' : '上传封面'}</Button>
              </Upload>
            </Space>
          </Form.Item>

          <Form.Item label="正文（图文）" required>
            <RichEditor value={body} onChange={setBody} />
          </Form.Item>

          <Form.Item label="状态" name="status" initialValue="PUBLISHED">
            <Segmented options={[{ label: '发布', value: 'PUBLISHED' }, { label: '草稿', value: 'DRAFT' }]} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
