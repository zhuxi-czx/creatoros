import { useState, useEffect, useRef } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  style?: React.CSSProperties
}

// H5 端将 HTTPS 自签名图片地址转回 HTTP 直连
const fixSrc = (url: string) =>
  url.replace('https://121.196.149.0:4443/', 'http://121.196.149.0:4000/')

export default function LazyImage({ src, alt, style }: LazyImageProps) {
  const imgSrc = fixSrc(src)
  const [loaded, setLoaded] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCount = useRef(0)

  useEffect(() => {
    setLoaded(false)
    retryCount.current = 0
  }, [src])

  useEffect(() => {
    return () => { if (retryTimer.current) clearTimeout(retryTimer.current) }
  }, [])

  const handleError = () => {
    if (retryCount.current < 5) {
      retryCount.current++
      retryTimer.current = setTimeout(() => {
        setRetryKey(k => k + 1)
      }, 2000 * retryCount.current)
    }
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#F0EBE3',
      overflow: 'hidden',
      ...style,
    }}>
      {!loaded && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}>
          <div style={{
            width: 16,
            height: 16,
            border: '2px solid #E0D8CC',
            borderTop: '2px solid #C9A96E',
            borderRadius: '50%',
            animation: 'lazyimg-spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: 11, color: '#B8A88A' }}>loading</span>
          <style>{`@keyframes lazyimg-spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}
      <img
        key={retryKey}
        src={imgSrc}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
    </div>
  )
}
