import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Button, Space, Typography, Switch, Modal, Form, Input,
  InputNumber, Upload, message, Popconfirm, Image, Grid, Tag
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
  ArrowUpOutlined, ArrowDownOutlined
} from '@ant-design/icons'
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
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [autoplay, setAutoplay] = useState(true)
  const [interval, setInterval_] = useState(3)
  const [form] = Form.useForm()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getBanners()
      const list = Array.isArray(data) ? data : []
      setBanners(list)
      if (list.length > 0) {
        setAutoplay(list[0].autoplay !== false)
        setInterval_(list[0].interval ? list[0].interval / 1000 : 3)
      }
    } catch {
      message.error('加载Banner列表失败')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (record?: Banner) => {
    if (record) {
      setEditing(record)
      setImageUrls(record.imageUrls || [])
      // autoplay/interval managed globally, not per-banner modal
      form.setFieldsValue({
        title: record.title,
        subtitle: record.subtitle,
        sortOrder: record.sortOrder,
        enabled: record.enabled,
      })
    } else {
      setEditing(null)
      setImageUrls([])
      setAutoplay(true)
      form.resetFields()
      form.setFieldsValue({ sortOrder: 0, enabled: true })
    }
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (imageUrls.length === 0) {
        message.error('请至少上传一张Banner图片')
        return
      }
      setSubmitting(true)
      const data: BannerFormData = {
        title: values.title,
        subtitle: values.subtitle,
        imageUrls,
        sortOrder: values.sortOrder,
        enabled: values.enabled,
      }
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
    // Validate format
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      message.error('仅支持 JPG、PNG、GIF、WebP 格式')
      return false
    }
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      message.error('图片大小不能超过 5MB')
      return false
    }
    try {
      setUploading(true)
      const res = await uploadImage(file, 'banner')
      setImageUrls(prev => [...prev, res.url])
      message.success('上传成功')
    } catch {
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
    return false
  }

  const moveImage = useCallback((index: number, direction: 'up' | 'down') => {
    setImageUrls(prev => {
      const arr = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= arr.length) return prev
      ;[arr[index], arr[targetIndex]] = [arr[targetIndex], arr[index]]
      return arr
    })
  }, [])

  const removeImage = useCallback((index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index))
  }, [])

  const columns: ColumnsType<Banner> = [
    {
      title: '图片',
      dataIndex: 'imageUrls',
      key: 'imageUrls',
      width: 100,
      render: (urls: string[]) => {
        const count = urls?.length || 0
        const first = urls?.[0]
        return (
          <Space size={4} align="center">
            {first && (
              <Image
                src={first}
                width={48}
                height={30}
                style={{ objectFit: 'cover', borderRadius: 4 }}
                preview={false}
              />
            )}
            <Tag color="blue">{count}张</Tag>
          </Space>
        )
      }
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
          scroll={isMobile ? { x: 600 } : undefined}
        />
      </Card>

      {/* Global Carousel Settings */}
      <Card bordered={false} style={{ borderRadius: 12, marginTop: 16 }}
          styles={{ body: { padding: isMobile ? 12 : 24 } }}
          title={<Title level={5} style={{ margin: 0 }}>轮播设置</Title>}
        >
          <Space size={24} wrap>
            <Space>
              <span>开启轮播</span>
              <Switch checked={autoplay} onChange={async (val) => {
                setAutoplay(val)
                try {
                  await Promise.all(banners.map(b => updateBanner(b.id, { autoplay: val })))
                  message.success('轮播设置已更新')
                } catch { message.error('更新失败') }
              }} />
            </Space>
            {autoplay && (
              <Space>
                <span>轮播时长(秒)</span>
                <InputNumber value={interval} min={1} max={30} step={0.5} style={{ width: 100 }}
                  onChange={async (val) => {
                    const v = val || 3
                    setInterval_(v)
                    try {
                      await Promise.all(banners.map(b => updateBanner(b.id, { interval: Math.round(v * 1000) })))
                      message.success('轮播时长已更新')
                    } catch { message.error('更新失败') }
                  }}
                />
              </Space>
            )}
          </Space>
          <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
            设置后所有 Banner 图片将按此配置在首页自动轮播
          </div>
        </Card>

      <Modal
        title={editing ? '编辑 Banner' : '新增 Banner'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Banner图片" required>
            <Upload
              showUploadList={false}
              beforeUpload={handleUpload as any}
              accept="image/*"
              multiple
            >
              <Button icon={<UploadOutlined />} loading={uploading}>上传图片</Button>
            </Upload>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              支持 JPG/PNG 格式，单张不超过 5MB，建议宽高比 16:9，系统会自动裁剪压缩
            </div>
            {imageUrls.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {imageUrls.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: 8,
                      background: '#fafafa',
                      borderRadius: 8,
                      border: '1px solid #f0f0f0',
                    }}
                  >
                    <Image
                      src={url}
                      width={80}
                      height={50}
                      style={{ objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                      preview={{ mask: '预览' }}
                    />
                    <span style={{ flex: 1, fontSize: 12, color: '#999' }}>
                      第{index + 1}张
                    </span>
                    <Space size={2}>
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => moveImage(index, 'up')}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={index === imageUrls.length - 1}
                        onClick={() => moveImage(index, 'down')}
                      />
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeImage(index)}
                      />
                    </Space>
                  </div>
                ))}
              </div>
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
