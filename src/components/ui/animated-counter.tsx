/**
 * AnimatedCounter — Numbers that count up from 0 with ease-out easing
 *
 * Used in HeroMetrics and stat cards for premium feel.
 * Animates on mount and when value changes.
 */
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCounterProps {
  value: number
  /** Duration in ms (default 900) */
  duration?: number
  /** Custom number formatter */
  format?: (n: number) => string
  className?: string
  style?: React.CSSProperties
  /** Prefix like "$" or suffix like "%" */
  prefix?: string
  suffix?: string
  /** Number of decimal places (default 0) */
  decimals?: number
}

export function AnimatedCounter({
  value,
  duration = 900,
  format,
  className,
  style,
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0)
  const prevValue = useRef(0)
  const frameRef = useRef<number>(0)
  const startTimeRef = useRef(0)

  useEffect(() => {
    const start = prevValue.current
    const diff = value - start

    if (Math.abs(diff) < 0.01) {
      setDisplay(value)
      return
    }

    startTimeRef.current = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + diff * eased
      setDisplay(current)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        prevValue.current = value
        setDisplay(value)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [value, duration])

  const formatted = format
    ? format(display)
    : decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString()

  return (
    <span className={cn('tabular-nums', className)} style={style}>
      {prefix}{formatted}{suffix}
    </span>
  )
}
