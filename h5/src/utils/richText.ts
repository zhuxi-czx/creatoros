// 后台 Quill 富文本输出 HTML，靠 CSS class 实现间距/格式。
// H5 这里给常见标签注入内联 style（px 版，与小程序 rich-text 的 rpx 版对应，rpx/2≈px），
// 保证 H5 详情页（手机预览）排版与小程序一致。
const STYLE: Record<string, string> = {
  p: 'margin:0 0 12px;font-size:15px;line-height:1.9;color:#2d2d2d;letter-spacing:0.3px;text-align:justify;text-align-last:left',
  h1: 'margin:15px 0 8px;font-size:20px;font-weight:700;line-height:1.4;color:#1a1a1a',
  h2: 'margin:14px 0 7px;font-size:18px;font-weight:700;line-height:1.4;color:#1a1a1a',
  h3: 'margin:12px 0 6px;font-size:16px;font-weight:600;line-height:1.4;color:#1a1a1a',
  ul: 'margin:0 0 10px;padding-left:20px',
  ol: 'margin:0 0 10px;padding-left:20px',
  li: 'margin:0 0 4px;font-size:15px;line-height:1.9;color:#2d2d2d;letter-spacing:0.3px;text-align:justify;text-align-last:left',
  blockquote: 'margin:0 0 10px;padding:7px 12px;border-left:3px solid #C9A96E;background:#FBF7EF;color:#666',
  img: 'max-width:100%;height:auto;border-radius:6px;margin:4px 0;display:block',
}

export function enrichHtml(html?: string): string {
  if (!html) return ''
  const s = html.trim()
  // 纯文本（无标签，旧数据）：保留换行
  if (!/<[a-z!][\s\S]*?>/i.test(s)) {
    return `<div style="font-size:15px;line-height:1.9;color:#2d2d2d;letter-spacing:0.3px;text-align:justify;text-align-last:left">${s.replace(/\n/g, '<br>')}</div>`
  }
  // 不间断空格还原成普通空格：避免 justify 时英文单词被整体挤到下一行、上一行字距被拉大
  let out = s.replace(/&nbsp;/g, ' ')
  // Quill 空段落撑出一行高度，保留后台编辑时的空行
  out = out.replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, '<p style="margin:0;font-size:14px;line-height:1.8"> </p>')
  for (const tag of Object.keys(STYLE)) {
    const re = new RegExp(`<${tag}((?:\\s[^>]*)?)>`, 'gi')
    out = out.replace(re, (m, attrs) => {
      if (/\sstyle=/i.test(attrs)) return m // 已有内联 style 的不覆盖
      return `<${tag}${attrs} style="${STYLE[tag]}">`
    })
  }
  return out
}
