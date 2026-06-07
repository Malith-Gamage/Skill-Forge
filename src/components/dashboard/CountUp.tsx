'use client'

import { useEffect, useRef, useState } from 'react'

export default function CountUp({ to, duration = 1100 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const startTime = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1)
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * to))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [to, duration])

  return <>{val.toLocaleString()}</>
}
