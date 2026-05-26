import { useEffect, useRef, useState, useCallback } from 'react'
import LazyImage from './LazyImage'
import ImageViewer from './ImageViewer'

interface ImageCarouselProps {
  images: string[]
  autoplay?: boolean
  interval?: number
  height?: number | string
  borderRadius?: number
}

export default function ImageCarousel({ images, autoplay = false, interval = 3000, height = 200, borderRadius = 0 }: ImageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)

  const scrollToIndex = useCallback((index: number) => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth
      scrollRef.current.scrollTo({ left: width * index, behavior: 'smooth' })
    }
  }, [])

  const startAutoplay = useCallback(() => {
    if (!autoplay || images.length <= 1) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const next = (prev + 1) % images.length
        scrollToIndex(next)
        return next
      })
    }, interval)
  }, [autoplay, images.length, interval, scrollToIndex])

  useEffect(() => {
    startAutoplay()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [startAutoplay])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, offsetWidth } = scrollRef.current
    const index = Math.round(scrollLeft / offsetWidth)
    if (index !== currentIndex) {
      setCurrentIndex(index)
    }
    // Reset autoplay timer on manual scroll
    if (timerRef.current) clearInterval(timerRef.current)
    startAutoplay()
  }

  if (images.length === 0) return null

  if (images.length === 1) {
    return (
      <>
        <div style={{ width: '100%', height, borderRadius, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setViewerOpen(true)}>
          <LazyImage src={images[0]} alt="" />
        </div>
        {viewerOpen && <ImageViewer images={images} initialIndex={0} onClose={() => setViewerOpen(false)} />}
      </>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius, overflow: 'hidden' }}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          height: '100%',
        }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        {images.map((url, i) => (
          <div
            key={i}
            onClick={() => setViewerOpen(true)}
            style={{
              flexShrink: 0,
              width: '100%',
              height: '100%',
              scrollSnapAlign: 'start',
              cursor: 'pointer',
            }}
          >
            <LazyImage src={url} alt={`slide ${i + 1}`} />
          </div>
        ))}
      </div>
      {/* Dot indicators */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 5,
      }}>
        {images.map((_, i) => (
          <div
            key={i}
            style={{
              width: currentIndex === i ? 16 : 6,
              height: 6,
              borderRadius: 3,
              background: currentIndex === i ? '#fff' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
      {viewerOpen && <ImageViewer images={images} initialIndex={currentIndex} onClose={() => setViewerOpen(false)} />}
    </div>
  )
}
