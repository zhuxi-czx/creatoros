import { useState, useEffect } from 'react'
import { Select } from 'antd'
import api from '../services/api'

// 图标 SVG 走后端接口（lucide-static 全量），避免前端内置上千 path。
const ICON_BASE = `${api.defaults.baseURL || '/api'}/icon`

export function IconImg({ name, size = 18, color = '#555' }: { name?: string; size?: number; color?: string }) {
  if (!name) return null
  return (
    <img
      src={`${ICON_BASE}/${encodeURIComponent(name)}?color=${encodeURIComponent(color)}`}
      width={size}
      height={size}
      alt={name}
      style={{ verticalAlign: 'middle' }}
    />
  )
}

// 全量图标名缓存（进程内只拉一次）
let cachedNames: string[] | null = null

export function IconSelect({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  const [names, setNames] = useState<string[]>(cachedNames || [])
  useEffect(() => {
    if (cachedNames) return
    api
      .get('/icons')
      .then((r: any) => {
        cachedNames = Array.isArray(r) ? r : []
        setNames(cachedNames)
      })
      .catch(() => {})
  }, [])

  return (
    <Select
      showSearch
      allowClear
      value={value}
      onChange={onChange}
      placeholder="搜索图标名（如 coffee、mic、music、book-open…）"
      optionFilterProp="value"
      virtual
      options={names.map((n) => ({
        value: n,
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <IconImg name={n} size={16} /> {n}
          </span>
        ),
      }))}
    />
  )
}
