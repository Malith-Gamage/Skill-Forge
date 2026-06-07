'use client'

import { useEffect, useRef } from 'react'

export default function AnimatedBar({ pct, className }: { pct: number; className: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.width = '0%'
    const id = setTimeout(() => {
      el.style.transition = 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
      el.style.width = `${pct}%`
    }, 80)
    return () => clearTimeout(id)
  }, [pct])

  return <div ref={ref} className={className} style={{ width: 0 }} />
}
