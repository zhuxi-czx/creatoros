import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Space, Typography, Modal, Form, Input,
  Upload, message, Popconfirm, Image, Grid
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { getVenues, createVenue, updateVenue, deleteVenue, type Venue, type VenueFormData } from '../services/venue'
import { uploadImage } from '../services/event'

const { Title, Text } = Typography
const { TextArea } = Input
const { useBreakpoint } = Grid

export default function VenueList() {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Venue | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [coverUrl, setCoverUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getVenues()
      setVenues(Array.isArray(data) ? data : [])
    } catch {
      message.error('加载场馆列表失败')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (record?: Venue) => {
    if (record) {
      setEditing(record)
      setCoverUrl(record.coverUrl || '')
      form.setFieldsValue({
        name: record.name,
        address: record.address,
        city: record.city,
        description: record.description,
      })
    } else {
      setEditing(null)
      setCoverUrl('')
      form.resetFields()
    }
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const data: VenueFormData = { ...values, coverUrl: coverUrl || undefined }
      if (editing) {
        await updateVenue(editing.id, data)
        message.success('更新成功')
      } else {
        await createVenue(data)
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
      await deleteVenue(id)
      message.success('删除成功')
      loadData()
    } catch {
      message.error('删除失败')
    }
  }

  const handleUpload = async (file: File) => {
    try {
      setUploading(true)
      const res = await uploadImage(file)
      setCoverUrl(res.url)
      message.success('上传成功')
    } catch {
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
    return false
  }

  const columns: ColumnsType<Venue> = [
    {
      title: '封面',
      dataIndex: 'coverUrl',
      key: 'coverUrl',
      width: 80,
      render: (url: string) => url ? (
        <Image
          src={url}
          width={60}
          height={36}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          preview={false}
        />
      ) : <Text type="secondary">-</Text>
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string) => <Text strong>{name}</Text>
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: isMobile ? 60 : 100,
    },
    ...(!isMobile ? [{
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    } as any] : []),
    {
      title: '活动数',
      key: 'eventCount',
      width: 70,
      render: (_: any, record: Venue) => record._count?.events ?? 0
    },
    {
      title: '操作',
      key: 'actions',
      width: isMobile ? 100 : 140,
      render: (_: any, record: Venue) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openModal(record)}>
            {!isMobile && '编辑'}
          </Button>
          <Popconfirm title="确定删除此场馆?" onConfirm={() => handleDelete(record.id)}>
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
        title={<Title level={5} style={{ margin: 0 }}>场馆管理</Title>}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size={isMobile ? 'small' : 'middle'}
            onClick={() => openModal()}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}
          >
            新增场馆
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={venues}
          rowKey="id"
          loading={loading}
          size={isMobile ? 'small' : 'middle'}
          pagination={{ pageSize: 10, showSizeChanger: false, size: 'small' }}
          scroll={isMobile ? { x: 500 } : undefined}
        />
      </Card>

      <Modal
        title={editing ? '编辑场馆' : '新增场馆'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="场馆封面">
            <Upload
              showUploadList={false}
              beforeUpload={handleUpload as any}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} loading={uploading}>上传图片</Button>
            </Upload>
            {coverUrl && (
              <Image
                src={coverUrl}
                width={200}
                height={120}
                style={{ objectFit: 'cover', borderRadius: 8, marginTop: 8 }}
              />
            )}
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入场馆名称' }]}>
            <Input placeholder="请输入场馆名称" />
          </Form.Item>
          <Form.Item name="city" label="城市" rules={[{ required: true, message: '请输入城市' }]}>
            <Input placeholder="请输入城市" />
          </Form.Item>
          <Form.Item name="address" label="地址" rules={[{ required: true, message: '请输入地址' }]}>
            <Input placeholder="请输入详细地址" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入场馆描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
