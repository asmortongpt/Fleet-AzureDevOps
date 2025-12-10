/**
 * Touch Components with Gestures
 * Swipeable cards, pull-to-refresh, infinite scroll, bottom sheets, and more
 */

import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import React, { useState, useRef, useEffect, ReactNode } from 'react'

/* ============================================================
   SWIPEABLE CARD
   ============================================================ */

interface SwipeableCardProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: ReactNode
  rightAction?: ReactNode
  threshold?: number
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 100,
}: SwipeableCardProps) {
  const x = useMotionValue(0)
  const [isDragging, setIsDragging] = useState(false)

  const leftOpacity = useTransform(x, [-threshold, 0], [1, 0])
  const rightOpacity = useTransform(x, [0, threshold], [0, 1])

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)

    if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft()
    } else if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight()
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Left action background */}
      {leftAction && (
        <motion.div
          className="absolute inset-0 bg-red-500 flex items-center justify-end px-6"
          style={{ opacity: leftOpacity }}
        >
          {leftAction}
        </motion.div>
      )}

      {/* Right action background */}
      {rightAction && (
        <motion.div
          className="absolute inset-0 bg-green-500 flex items-center justify-start px-6"
          style={{ opacity: rightOpacity }}
        >
          {rightAction}
        </motion.div>
      )}

      {/* Card content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={`bg-white dark:bg-gray-800 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {children}
      </motion.div>
    </div>
  )
}

/* ============================================================
   PULL TO REFRESH
   ============================================================ */

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
}

export function PullToRefresh({ children, onRefresh, threshold = 80 }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollTop = containerRef.current?.scrollTop || 0
    if (scrollTop > 0) return // Only work when scrolled to top

    const touch = e.touches[0]
    const startY = touch.clientY

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const currentY = touch.clientY
      const distance = Math.max(0, currentY - startY)

      // Apply resistance
      const resistance = distance > threshold ? 0.5 : 1
      setPullDistance(distance * resistance)
    }

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }
      setPullDistance(0)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }

    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)
  }

  const spinnerRotation = (pullDistance / threshold) * 360

  return (
    <div ref={containerRef} className="overflow-y-auto h-full">
      {/* Pull indicator */}
      <motion.div
        className="flex items-center justify-center"
        style={{ height: pullDistance }}
        animate={{ opacity: pullDistance > 0 ? 1 : 0 }}
      >
        <motion.div
          className="text-2xl"
          animate={{
            rotate: isRefreshing ? 360 : spinnerRotation,
          }}
          transition={
            isRefreshing
              ? {
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear',
                }
              : {}
          }
        >
