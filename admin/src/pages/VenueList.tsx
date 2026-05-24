import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Button, Space, Typography, Switch, Modal, Form, Input,
  InputNumber, Upload, message, Popconfirm, Image, Grid, Tag, Divider
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
  ArrowUpOutlined, ArrowDownOutlined
} from '@ant-design/icons'
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
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [autoplay, setAutoplay] = useState(true)
  const [interval, setInterval_] = useState(3)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingDetail, setUploadingDetail] = useState(false)
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
      setImageUrls(record.imageUrls || [])
      setAutoplay((record.imageUrls?.length || 0) > 1 ? (record.autoplay ?? true) : false)
      setInterval_(record.interval ? record.interval / 1000 : 3)
      form.setFieldsValue({
        name: record.name,
        address: record.address,
        city: record.city,
        description: record.description,
      })
    } else {
      setEditing(null)
      setCoverUrl('')
      setImageUrls([])
      setAutoplay(true)
      setInterval_(3)
      form.resetFields()
    }
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const data: VenueFormData = {
        ...values,
        coverUrl: coverUrl || undefined,
        imageUrls,
        autoplay,
        interval: Math.round(interval * 1000),
      }
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

  const handleUploadCover = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) { message.error('仅支持 JPG、PNG、GIF、WebP 格式'); return false }
    if (file.size > 5 * 1024 * 1024) { message.error('图片大小不能超过 5MB'); return false }
    try {
      setUploadingCover(true)
      const res = await uploadImage(file, 'venue')
      setCoverUrl(res.url)
      message.success('封面上传成功')
    } catch { message.error('上传失败') }
    finally { setUploadingCover(false) }
    return false
  }

  const handleUploadDetail = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) { message.error('仅支持 JPG、PNG、GIF、WebP 格式'); return false }
    if (file.size > 5 * 1024 * 1024) { message.error('图片大小不能超过 5MB'); return false }
    try {
      setUploadingDetail(true)
      const res = await uploadImage(file, 'event')
      setImageUrls(prev => [...prev, res.url])
      message.success('上传成功')
    } catch { message.error('上传失败') }
    finally { setUploadingDetail(false) }
    return false
  }

  const moveImage = useCallback((index: number, direction: 'up' | 'down') => {
    setImageUrls(prev => {
      const arr = [...prev]
      const t = direction === 'up' ? index - 1 : index + 1
      if (t < 0 || t >= arr.length) return prev
      ;[arr[index], arr[t]] = [arr[t], arr[index]]
      return arr
    })
  }, [])

  const removeImage = useCallback((index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index))
  }, [])

  const columns: ColumnsType<Venue> = [
    {
      title: '封面', dataIndex: 'coverUrl', key: 'coverUrl', width: 80,
      render: (url: string) => url ? (
        <Image src={url} width={60} height={45} style={{ objectFit: 'cover', borderRadius: 4 }} preview={false} />
      ) : <Text type="secondary">-</Text>
    },
    { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true, render: (n: string) => <Text strong>{n}</Text> },
    { title: '城市', dataIndex: 'city', key: 'city', width: isMobile ? 60 : 100 },
    ...(!isMobile ? [{ title: '地址', dataIndex: 'address', key: 'address', ellipsis: true } as any] : []),
    {
      title: '详情图', key: 'imageCount', width: 70,
      render: (_: any, r: Venue) => (r.imageUrls?.length || 0) > 0
        ? <Tag color="blue">{r.imageUrls!.length}张</Tag>
        : <Text type="secondary">-</Text>
    },
    { title: '活动数', key: 'eventCount', width: 70, render: (_: any, r: Venue) => r._count?.events ?? 0 },
    {
      title: '操作', key: 'actions', width: isMobile ? 100 : 140,
      render: (_: any, record: Venue) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openModal(record)}>{!isMobile && '编辑'}</Button>
          <Popconfirm title="确定删除此场馆?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>{!isMobile && '删除'}</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card
        bordered={false} style={{ borderRadius: 12 }}
        styles={{ body: { padding: isMobile ? 8 : 24 } }}
        title={<Title level={5} style={{ margin: 0 }}>场馆管理</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} size={isMobile ? 'small' : 'middle'} onClick={() => openModal()}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}>
            新增场馆
          </Button>
        }
      >
        <Table columns={columns} dataSource={venues} rowKey="id" loading={loading}
          size={isMobile ? 'small' : 'middle'}
          pagination={{ pageSize: 10, showSizeChanger: false, size: 'small' }}
          scroll={isMobile ? { x: 600 } : undefined}
        />
      </Card>

      <Modal
        title={editing ? '编辑场馆' : '新增场馆'}
        open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={handleSubmit} confirmLoading={submitting} destroyOnClose width={600}
      >
        <Form form={form} layout="vertical">
          {/* Cover Image (4:3) */}
          <Form.Item label="封面图">
            <Upload showUploadList={false} beforeUpload={handleUploadCover as any} accept="image/*">
              <Button icon={<UploadOutlined />} loading={uploadingCover}>上传封面</Button>
            </Upload>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              支持 JPG/PNG，不超过 5MB，建议宽高比 4:3，系统自动裁剪压缩
            </div>
            {coverUrl && (
              <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
                <Image src={coverUrl} width={160} height={120} style={{ objectFit: 'cover', borderRadius: 8 }} />
                <Button size="small" danger style={{ position: 'absolute', top: 4, right: 4 }}
                  icon={<DeleteOutlined />} onClick={() => setCoverUrl('')} />
              </div>
            )}
          </Form.Item>

          <Divider style={{ margin: '12px 0' }} />

          {/* Detail Images (16:9) */}
          <Form.Item label="详情图">
            <Upload showUploadList={false} beforeUpload={handleUploadDetail as any} accept="image/*" multiple>
              <Button icon={<UploadOutlined />} loading={uploadingDetail}>上传详情图</Button>
            </Upload>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              支持 JPG/PNG，不超过 5MB，建议宽高比 16:9，支持多张上传
            </div>
            {imageUrls.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {imageUrls.map((url, index) => (
                  <div key={`${url}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fafafa', padding: 8, borderRadius: 8 }}>
                    <Image src={url} width={80} height={45} style={{ objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} preview={false} />
                    <Text style={{ flex: 1, fontSize: 12 }} type="secondary">第{index + 1}张</Text>
                    <Button size="small" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => moveImage(index, 'up')} />
                    <Button size="small" icon={<ArrowDownOutlined />} disabled={index === imageUrls.length - 1} onClick={() => moveImage(index, 'down')} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeImage(index)} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>轮播设置</span>
                <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>上传2张及以上图片可开启轮播</span>
              </div>
              <Space size={24} align="center">
                <Space size={8} align="center">
                  <span style={{ fontSize: 13 }}>开启轮播</span>
                  <Switch checked={autoplay} onChange={val => {
                    setAutoplay(val)
                    if (imageUrls.length <= 1) setAutoplay(false)
                  }} disabled={imageUrls.length <= 1} size="small" />
                </Space>
                <Space size={8} align="center">
                  <span style={{ fontSize: 13 }}>轮播时长(秒)</span>
                  <InputNumber value={interval} onChange={v => setInterval_(v || 3)} min={1} max={30} step={0.5} size="small" style={{ width: 80 }} disabled={imageUrls.length <= 1} />
                </Space>
              </Space>
            </div>
          </Form.Item>

          <Divider style={{ margin: '12px 0' }} />

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
