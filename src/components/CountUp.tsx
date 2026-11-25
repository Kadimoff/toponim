import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { useReducedMotion } from '../hooks/useReducedMotion'

export function CountUp({ to, className, style }: { to: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const reduce = useReducedMotion()
  const [v, setV] = useState(reduce ? to : 0)
  useEffect(() => {
    if (!inView || reduce) {
      if (reduce) setV(to)
      return
    }
    let raf = 0
    const start = performance.now()
    const dur = 900
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      setV(Math.round(to * (1 - Math.pow(1 - p, 4))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, reduce])
  return (
    <span ref={ref} className={`tabular ${className ?? ''}`} style={style}>
      {v}
    </span>
  )
}

