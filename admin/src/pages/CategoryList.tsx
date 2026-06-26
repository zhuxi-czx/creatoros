import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Modal, Form, Input, InputNumber, Switch,
  Space, message, Popconfirm, Image, Upload, Select,
} from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { IconSelect, IconImg } from '../utils/lucideIcons'
import type { ColumnsType } from 'antd/es/table'
import {
  getCategories, createCategory, updateCategory, deleteCategory, type Category,
} from '../services/category'
import { uploadImage } from '../services/event'
import { resolveImageUrl } from '../services/api'

export default function CategoryList() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [cover, setCover] = useState('')
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try { setItems((await getCategories()) || []) } catch { message.error('加载失败') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openModal = (c?: Category) => {
    setEditing(c || null)
    setCover(c?.coverUrl || '')
    form.setFieldsValue(
      c
        ? { name: c.name, intro: c.intro, icon: c.icon, order: c.order, memberFreeMonthly: c.memberFreeMonthly }
        : { order: 0, memberFreeMonthly: false },
    )
    setOpen(true)
  }

  const handleCover = async (file: File) => {
    try { const r = await uploadImage(file, 'category'); setCover(r.url); message.success('已上传') } catch { message.error('上传失败') }
    return false
  }

  const submit = async () => {
    const v = await form.validateFields()
    const data = { ...v, coverUrl: cover }
    try {
      if (editing) await updateCategory(editing.id, data)
      else await createCategory(data)
      message.success('已保存'); setOpen(false); load()
    } catch (e: any) { message.error(e?.message || '保存失败') }
  }

  const del = async (id: string) => {
    try { await deleteCategory(id); message.success('已删除'); load() } catch { message.error('删除失败') }
  }

  const columns: ColumnsType<Category> = [
    { title: '图标', dataIndex: 'icon', width: 70, align: 'center' as const, render: (i: string) => i ? <IconImg name={i} size={20} /> : '—' },
    { title: '名称', dataIndex: 'name' },
    { title: '活动数', width: 80, render: (_, r) => r._count?.events ?? 0 },
    { title: '群友聚会·会员每月免费', dataIndex: 'memberFreeMonthly', width: 170, render: (v) => (v ? '是' : '否') },
    { title: '排序', dataIndex: 'order', width: 70 },
    {
      title: '操作', width: 140,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openModal(r)}>编辑</Button>
          <Popconfirm title="删除该分类？关联活动将解除分类" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => del(r.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card bordered={false} style={{ borderRadius: 12 }} title="分类管理"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>新建分类</Button>}>
      <Table rowKey="id" columns={columns} dataSource={items} loading={loading} pagination={false} />
      <Modal open={open} title={editing ? '编辑分类' : '新建分类'} onCancel={() => setOpen(false)} onOk={submit} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}><Input maxLength={20} /></Form.Item>
          <Form.Item label="介绍（分类页展示）" name="intro"><Input.TextArea rows={3} maxLength={200} /></Form.Item>
          <Form.Item label="图标" name="icon"><IconSelect /></Form.Item>
          <Form.Item label="封面图（分类页 banner）">
            <Space direction="vertical">
              {cover && <Image src={resolveImageUrl(cover)} width={200} style={{ borderRadius: 8 }} />}
              <Upload beforeUpload={handleCover} showUploadList={false} accept="image/*"><Button icon={<UploadOutlined />}>{cover ? '更换' : '上传'}</Button></Upload>
            </Space>
          </Form.Item>
          <Form.Item label="排序（越小越前）" name="order"><InputNumber min={0} /></Form.Item>
          <Form.Item label="群友聚会（会员每月免费 1 场）" name="memberFreeMonthly" valuePropName="checked" extra="勾选后，该分类活动 PlanF 会员每月可免费报名 1 场"><Switch /></Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
