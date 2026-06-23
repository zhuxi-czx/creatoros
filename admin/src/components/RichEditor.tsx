import { useMemo, useRef } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { uploadImage } from '../services/event'

// 正文图片需在小程序 RichText 中渲染，必须是可公网访问的绝对地址
const MEDIA_BASE = 'https://creatorbar.cn'

interface Props {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
}

// 富文本编辑器（图文）：输出 HTML，插图走现有上传接口并存绝对地址
export default function RichEditor({ value, onChange, placeholder }: Props) {
  const quillRef = useRef<any>(null)

  const imageHandler = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const res = await uploadImage(file, 'content')
        const url = res.url.startsWith('http') ? res.url : MEDIA_BASE + res.url
        const editor = quillRef.current?.getEditor()
        const range = editor?.getSelection(true)
        const index = range ? range.index : editor?.getLength() || 0
        editor?.insertEmbed(index, 'image', url)
        editor?.setSelection(index + 1, 0)
      } catch {
        // 上传失败静默
      }
    }
    input.click()
  }

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote'],
          ['image'],
          ['clean'],
        ],
        handlers: { image: imageHandler },
      },
    }),
    [],
  )

  return (
    <div className="rich-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder || '请输入图文内容…'}
      />
    </div>
  )
}
