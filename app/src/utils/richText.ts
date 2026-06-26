// 后台 Quill 富文本输出 HTML，靠 CSS class 实现间距/格式；
// 小程序 rich-text 忽略 class、块级标签默认无 margin，
// 这里给常见标签注入内联 style（rich-text 认内联 style）。
const STYLE: Record<string, string> = {
  p: 'margin:0 0 20rpx;font-size:28rpx;line-height:1.8;color:#444',
  h1: 'margin:30rpx 0 16rpx;font-size:40rpx;font-weight:700;line-height:1.4;color:#1a1a1a',
  h2: 'margin:28rpx 0 14rpx;font-size:36rpx;font-weight:700;line-height:1.4;color:#1a1a1a',
  h3: 'margin:24rpx 0 12rpx;font-size:32rpx;font-weight:600;line-height:1.4;color:#1a1a1a',
  ul: 'margin:0 0 20rpx;padding-left:40rpx',
  ol: 'margin:0 0 20rpx;padding-left:40rpx',
  li: 'margin:0 0 8rpx;font-size:28rpx;line-height:1.8;color:#444',
  blockquote: 'margin:0 0 20rpx;padding:14rpx 24rpx;border-left:6rpx solid #C9A96E;background:#FBF7EF;color:#666',
  img: 'max-width:100%;height:auto;border-radius:12rpx;margin:8rpx 0;display:block',
}

export function enrichHtml(html?: string): string {
  if (!html) return ''
  const s = html.trim()
  // 纯文本（无标签，旧数据）：保留换行
  if (!/<[a-z!][\s\S]*?>/i.test(s)) {
    return `<div style="font-size:28rpx;line-height:1.8;color:#444">${s.replace(/\n/g, '<br>')}</div>`
  }
  let out = s
  for (const tag of Object.keys(STYLE)) {
    const re = new RegExp(`<${tag}((?:\\s[^>]*)?)>`, 'gi')
    out = out.replace(re, (m, attrs) => {
      if (/\sstyle=/i.test(attrs)) return m // 已有内联 style 的不覆盖
      return `<${tag}${attrs} style="${STYLE[tag]}">`
    })
  }
  return out
}
