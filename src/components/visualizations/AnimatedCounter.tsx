/**
 * AnimatedCounter Component
 * Smooth animated number counter for KPI values
 */

import { useEffect, useRef, useState } from 'react'
// motion removed - React 19 incompatible

interface AnimatedCounterProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedCounter({
  value,
  duration = 1,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const previousValue = useRef(0)

  useEffect(() => {
    const start = previousValue.current
    const end = value
    const startTime = performance.now()
    const durationMs = duration * 1000

    let animationFrame: number

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / durationMs, 1)

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + (end - start) * eased

      setDisplayValue(current)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        previousValue.current = end
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  const formatted = displayValue.toFixed(decimals)

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

/**
 * AnimatedPercentage Component
 * Specialized counter for percentage values
 */
export function AnimatedPercentage({
  value,
  decimals = 1,
  className = '',
}: {
  value: number
  decimals?: number
  className?: string
}) {
  return <AnimatedCounter value={value} decimals={decimals} suffix="%" className={className} />
}

/**
 * AnimatedCurrency Component
 * Specialized counter for currency values
 */
export function AnimatedCurrency({
  value,
  decimals = 0,
  className = '',
  currency = '$',
}: {
  value: number
  decimals?: number
  className?: string
  currency?: string
}) {
  return <AnimatedCounter value={value} decimals={decimals} prefix={currency} className={className} />
}
