import { useState, useRef, useEffect, useCallback } from 'react'

interface ImageViewerProps {
  images: string[]
  initialIndex: number
  onClose: () => void
}

const fixSrc = (url: string) => {
  if (typeof window === 'undefined' || !url) return url
  const host = `${window.location.protocol}//${window.location.hostname}:4000`
  if (url.startsWith('/uploads/')) return `${host}${url}`
  return url
}

export default function ImageViewer({ images, initialIndex, onClose }: ImageViewerProps) {
  const [current, setCurrent] = useState(initialIndex)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Scroll to initial image
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = window.innerWidth * initialIndex
    }
    // Fade in
    requestAnimationFrame(() => setReady(true))
    // Prevent body scroll
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [initialIndex])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const idx = Math.round(scrollRef.current.scrollLeft / window.innerWidth)
    setCurrent(idx)
  }, [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: ready ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0)',
        transition: 'background 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Close hint */}
      <div style={{
        padding: '48px 16px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
          {current + 1} / {images.length}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>
          ×
        </span>
      </div>

      {/* Image scroll */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onClick={e => e.stopPropagation()}
        style={{
          flex: 1,
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style>{`.img-viewer-scroll::-webkit-scrollbar { display: none; }`}</style>
        {images.map((url, i) => (
          <div
            key={i}
            style={{
              flexShrink: 0,
              width: '100vw',
              height: '100%',
              scrollSnapAlign: 'start',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 8px',
            }}
          >
            <img
              src={fixSrc(url)}
              alt=""
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 4,
                opacity: ready ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
          </div>
        ))}
      </div>

      {/* Dots */}
      {images.length > 1 && (
        <div style={{
          padding: '12px 0 40px',
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
        }}>
          {images.map((_, i) => (
            <div key={i} style={{
              width: current === i ? 16 : 6,
              height: 6,
              borderRadius: 3,
              background: current === i ? '#fff' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}
