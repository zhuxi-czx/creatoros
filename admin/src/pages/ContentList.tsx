import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Table, Tag, Space, Typography, Button, message, Popconfirm, Image as AntImage,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { resolveImageUrl } from '../services/api'
import { getContents, deleteContent, type ContentItem } from '../services/content'

const { Title, Text } = Typography

export default function ContentList() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      setItems((await getContents()) || [])
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
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
          {r.coverUrl && <AntImage src={resolveImageUrl(r.coverUrl)} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 6 }} preview={false} />}
          <Text strong>{r.title}</Text>
        </Space>
      ),
    },
    {
      title: '对谈对象', key: 'creator', width: 180,
      render: (_, r) => <Text>{r.creator.nickname || '—'}{r.creator.title ? ` · ${r.creator.title}` : ''}</Text>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: string) => <Tag color={s === 'PUBLISHED' ? 'green' : 'default'}>{s === 'PUBLISHED' ? '已发布' : '草稿'}</Tag>,
    },
    {
      title: '发布时间', dataIndex: 'publishedAt', key: 'publishedAt', width: 150,
      render: (t?: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '—',
    },
    {
      title: '操作', key: 'action', width: 130,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/contents/${r.id}/edit`)}>编辑</Button>
          <Popconfirm title="确认删除该内容？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      bordered={false}
      style={{ borderRadius: 12 }}
      title={<Title level={5} style={{ margin: 0 }}>敞开对谈 · 内容管理</Title>}
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/contents/create')}>新建内容</Button>}
    >
      <Table columns={columns} dataSource={items} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
    </Card>
  )
}
