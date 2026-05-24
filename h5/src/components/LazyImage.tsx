import { useState, useEffect, useRef } from 'react'

interface LazyImageProps {
  src: string
  thumbSrc?: string
  alt: string
  style?: React.CSSProperties
}

const fixSrc = (url: string) => {
  if (typeof window === 'undefined' || !url) return url
  const host = `${window.location.protocol}//${window.location.hostname}:4000`
  return url
    .replace('https://121.196.149.0:4443', host)
    .replace('http://121.196.149.0:4000', host)
    .replace('http://116.62.188.30:4000', host)
}

// Derive thumb URL from main URL if not provided
const guessThumbUrl = (src: string) => {
  if (!src) return ''
  const dot = src.lastIndexOf('.')
  if (dot === -1) return ''
  return src.substring(0, dot) + '_thumb' + src.substring(dot)
}

export default function LazyImage({ src, thumbSrc, alt, style }: LazyImageProps) {
  const imgSrc = fixSrc(src)
  const thumbUrl = fixSrc(thumbSrc || guessThumbUrl(src))
  const [loaded, setLoaded] = useState(false)
  const [thumbLoaded, setThumbLoaded] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCount = useRef(0)

  useEffect(() => {
    setLoaded(false)
    setThumbLoaded(false)
    retryCount.current = 0
  }, [src])

  useEffect(() => {
    return () => { if (retryTimer.current) clearTimeout(retryTimer.current) }
  }, [])

  const handleError = () => {
    if (retryCount.current < 3) {
      retryCount.current++
      retryTimer.current = setTimeout(() => {
        setRetryKey(k => k + 1)
      }, 1500 * retryCount.current)
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
      {/* Blurry thumbnail - loads instantly (~1-2KB) */}
      {thumbUrl && !loaded && (
        <img
          src={thumbUrl}
          alt=""
          onLoad={() => setThumbLoaded(true)}
          onError={() => {}}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(10px)',
            transform: 'scale(1.1)',
            opacity: thumbLoaded ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}

      {/* Loading spinner - only if no thumb loaded */}
      {!loaded && !thumbLoaded && (
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
          <style>{`@keyframes lazyimg-spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Full resolution image */}
      <img
        key={retryKey}
        src={imgSrc}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      />
    </div>
  )
}
