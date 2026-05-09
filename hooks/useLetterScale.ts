import { useRef, useState, useEffect } from 'react'

const LETTER_W = 816

/**
 * Measures a container's width via ResizeObserver and returns the CSS scale
 * needed to fit an 8.5in (816px) letter-sized template inside it.
 *
 * @param innerPadding - Horizontal pixels consumed by card padding/borders
 *   that sit between the measured container and the template (default 0).
 *   Pass 8 when the container has a p-1 card wrapper (4px × 2 sides).
 */
export function useLetterScale(innerPadding = 0) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w > 0) setScale(Math.min(1, (w - innerPadding) / LETTER_W))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [innerPadding])

  return { containerRef, scale }
}
