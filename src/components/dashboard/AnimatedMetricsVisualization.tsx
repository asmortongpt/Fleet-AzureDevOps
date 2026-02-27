/**
 * Animated Metrics Visualization
 * Ultra-premium real-time data visualization with animated charts, particles, and advanced interactions
 */

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

import { formatNumber } from '@/utils/format-helpers'

interface MetricData {
  id: string
  label: string
  currentValue: number
  targetValue: number
  trend: number
  icon: React.ReactNode
  color: string
  accentColor: string
}

export function AnimatedMetricsVisualization({ metrics }: { metrics: MetricData[] }) {
  const [animationComplete, setAnimationComplete] = useState(false)

  // Particle effect background
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: Math.random() * 8 + 12,
    delay: Math.random() * 2
  }))

  return (
    <div className="relative w-full">
      {/* Ambient particle background */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-20">
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: 'rgba(255,255,255,0.3)',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.sin(particle.id) * 30, 0],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Premium metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {metrics.map((metric, index) => (
          <PremiumMetricCard key={metric.id} metric={metric} index={index} />
        ))}
      </div>
    </div>
  )
}

function PremiumMetricCard({ metric, index }: { metric: MetricData; index: number }) {
  const percentage = (metric.currentValue / metric.targetValue) * 100
  const [displayValue, setDisplayValue] = useState(0)

  // Animated counter
  useEffect(() => {
    let animationFrameId: number
    let currentFrame = 0
    const totalFrames = 60

    const animate = () => {
      currentFrame++
      const progress = currentFrame / totalFrames
      setDisplayValue(Math.floor(metric.currentValue * progress))

      if (currentFrame < totalFrames) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [metric.currentValue])

  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer bg-[var(--surface-2)]"
      style={{
        border: `1px solid ${metric.color}20`,
      }}
      whileHover={{
        y: -4,
      }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: 'easeOut' }}
    >

      <div className="relative p-6 space-y-4">
        {/* Header with icon */}
        <div className="flex items-start justify-between">
          <div>
            <motion.p
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: metric.color }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.15 }}
            >
              {metric.label}
            </motion.p>
          </div>
          <motion.div
            className="p-3 rounded-xl"
            style={{
              backgroundColor: `${metric.color}20`,
              border: `1px solid ${metric.color}40`
            }}
            whileHover={{ scale: 1.15, rotate: 10 }}
          >
            {metric.icon}
          </motion.div>
        </div>

        {/* Animated counter display */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 + index * 0.15 }}
        >
          <div className="flex items-baseline justify-between">
            <motion.span
              className="text-4xl font-black tracking-tight"
              style={{
                background: `linear-gradient(135deg, ${metric.color}, ${metric.accentColor})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {formatNumber(displayValue)}
            </motion.span>
            <motion.span
              className="text-sm font-bold flex items-center gap-1 px-3 py-1 rounded-full"
              style={{
                backgroundColor: `${metric.trend > 0 ? '#10B981' : '#a0a0a0'}20`,
                color: metric.trend > 0 ? '#10B981' : '#a0a0a0',
                border: `1px solid ${metric.trend > 0 ? '#10B981' : '#a0a0a0'}40`
              }}
              animate={{
                scale: [1, 1.08, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {metric.trend > 0 ? '↑' : '↓'} {Math.abs(metric.trend)}%
            </motion.span>
          </div>
        </motion.div>

        {/* Advanced circular progress indicator */}
        <div className="space-y-3">
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
            {/* Animated progress bar */}
            <motion.div
              className="h-full rounded-full relative"
              style={{
                backgroundColor: metric.color,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, delay: 0.5 + index * 0.15, ease: 'easeOut' }}
            />
          </div>

          {/* Percentage text */}
          <div className="flex justify-between items-center text-xs">
            <span style={{ color: metric.color, fontWeight: 600 }}>
              {Math.round(percentage)}% Complete
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>
              {formatNumber(metric.targetValue)} target
            </span>
          </div>
        </div>

        {/* Mini sparkle effects */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              backgroundColor: metric.accentColor,
              left: `${20 + i * 30}%`,
              top: '50%'
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

export default AnimatedMetricsVisualization
