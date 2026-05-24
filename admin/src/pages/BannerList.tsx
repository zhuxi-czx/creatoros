import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Space, Typography, Switch, Modal, Form, Input,
  InputNumber, Upload, message, Popconfirm, Image, Grid
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { getBanners, createBanner, updateBanner, deleteBanner, type Banner, type BannerFormData } from '../services/banner'
import { uploadImage } from '../services/event'

const { Title } = Typography
const { useBreakpoint } = Grid

export default function BannerList() {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getBanners()
      setBanners(Array.isArray(data) ? data : [])
    } catch {
      message.error('加载Banner列表失败')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (record?: Banner) => {
    if (record) {
      setEditing(record)
      setImageUrl(record.imageUrl)
      form.setFieldsValue({
        title: record.title,
        subtitle: record.subtitle,
        sortOrder: record.sortOrder,
        enabled: record.enabled,
      })
    } else {
      setEditing(null)
      setImageUrl('')
      form.resetFields()
      form.setFieldsValue({ sortOrder: 0, enabled: true })
    }
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (!imageUrl) {
        message.error('请上传Banner图片')
        return
      }
      setSubmitting(true)
      const data: BannerFormData = { ...values, imageUrl }
      if (editing) {
        await updateBanner(editing.id, data)
        message.success('更新成功')
      } else {
        await createBanner(data)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadData()
    } catch {
      message.error('操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteBanner(id)
      message.success('删除成功')
      loadData()
    } catch {
      message.error('删除失败')
    }
  }

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      await updateBanner(id, { enabled })
      message.success('状态更新成功')
      loadData()
    } catch {
      message.error('状态更新失败')
    }
  }

  const handleUpload = async (file: File) => {
    try {
      setUploading(true)
      const res = await uploadImage(file)
      setImageUrl(res.url)
      message.success('上传成功')
    } catch {
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
    return false
  }

  const columns: ColumnsType<Banner> = [
    {
      title: '图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (url: string) => (
        <Image
          src={url}
          width={60}
          height={36}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          preview={false}
        />
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    ...(!isMobile ? [{
      title: '副标题',
      dataIndex: 'subtitle',
      key: 'subtitle',
      ellipsis: true,
    } as any] : []),
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 70,
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 70,
      render: (enabled: boolean, record: Banner) => (
        <Switch
          checked={enabled}
          size="small"
          onChange={(val) => handleToggleEnabled(record.id, val)}
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: isMobile ? 100 : 140,
      render: (_: any, record: Banner) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openModal(record)}>
            {!isMobile && '编辑'}
          </Button>
          <Popconfirm title="确定删除此Banner?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {!isMobile && '删除'}
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: isMobile ? 8 : 24 } }}
        title={<Title level={5} style={{ margin: 0 }}>Banner管理</Title>}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size={isMobile ? 'small' : 'middle'}
            onClick={() => openModal()}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}
          >
            新增 Banner
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={banners}
          rowKey="id"
          loading={loading}
          size={isMobile ? 'small' : 'middle'}
          pagination={{ pageSize: 10, showSizeChanger: false, size: 'small' }}
          scroll={isMobile ? { x: 500 } : undefined}
        />
      </Card>

      <Modal
        title={editing ? '编辑 Banner' : '新增 Banner'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Banner图片" required>
            <Upload
              showUploadList={false}
              beforeUpload={handleUpload as any}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} loading={uploading}>上传图片</Button>
            </Upload>
            {imageUrl && (
              <Image
                src={imageUrl}
                width={200}
                height={120}
                style={{ objectFit: 'cover', borderRadius: 8, marginTop: 8 }}
              />
            )}
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入Banner标题" />
          </Form.Item>
          <Form.Item name="subtitle" label="副标题">
            <Input placeholder="请输入副标题（可选）" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
