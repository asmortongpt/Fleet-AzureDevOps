/**
 * AnimatedCounter Component
 * Smooth animated number counter for KPI values
 */

import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

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

  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(latest)
    })

    return unsubscribe
  }, [spring])

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
