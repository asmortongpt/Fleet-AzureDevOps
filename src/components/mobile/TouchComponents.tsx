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
          ↻
        </motion.div>
      </motion.div>

      {/* Content */}
      <div onTouchStart={handleTouchStart}>{children}</div>
    </div>
  )
}

/* ============================================================
   INFINITE SCROLL
   ============================================================ */

interface InfiniteScrollProps {
  children: ReactNode
  onLoadMore: () => Promise<void>
  hasMore: boolean
  threshold?: number
  loader?: ReactNode
}

export function InfiniteScroll({
  children,
  onLoadMore,
  hasMore,
  threshold = 200,
  loader,
}: InfiniteScrollProps) {
  const [isLoading, setIsLoading] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasMore || isLoading) return

    observerRef.current = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoading(true)
          try {
            await onLoadMore()
          } finally {
            setIsLoading(false)
          }
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    )

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => {
      observerRef.current?.disconnect()
    }
  }, [hasMore, isLoading, onLoadMore, threshold])

  return (
    <div>
      {children}
      {hasMore && (
        <div ref={sentinelRef} className="py-4 flex items-center justify-center">
          {loader || (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   TOUCHABLE HIGHLIGHT
   ============================================================ */

interface TouchableHighlightProps {
  children: ReactNode
  onPress?: () => void
  activeOpacity?: number
  className?: string
}

export function TouchableHighlight({
  children,
  onPress,
  activeOpacity = 0.7,
  className = '',
}: TouchableHighlightProps) {
  return (
    <motion.div
      whileTap={{ opacity: activeOpacity, scale: 0.98 }}
      onClick={onPress}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </motion.div>
  )
}

/* ============================================================
   BOTTOM SHEET
   ============================================================ */

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  snapPoints?: number[] // percentages of screen height
  defaultSnap?: number
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  snapPoints = [90, 50],
  defaultSnap = 0,
}: BottomSheetProps) {
  const [snapIndex, setSnapIndex] = useState(defaultSnap)
  const y = useMotionValue(0)

  const currentSnapPoint = snapPoints[snapIndex]

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y
    const offset = info.offset.y

    // If dragged down significantly, close
    if (offset > 100 || velocity > 500) {
      onClose()
      return
    }

    // Find nearest snap point
    const windowHeight = window.innerHeight
    const currentPercent = ((windowHeight - offset) / windowHeight) * 100

    let nearestIndex = 0
    let nearestDistance = Math.abs(currentPercent - snapPoints[0])

    snapPoints.forEach((point, index) => {
      const distance = Math.abs(currentPercent - point)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })

    setSnapIndex(nearestIndex)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: `${100 - currentSnapPoint}%` }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ y }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl overflow-hidden"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
            </div>

            {/* Content */}
            <div className="overflow-y-auto safe-bottom" style={{ maxHeight: '85vh' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ============================================================
   ACTION SHEET
   ============================================================ */

interface ActionSheetOption {
  label: string
  icon?: ReactNode
  onPress: () => void
  destructive?: boolean
}

interface ActionSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  options: ActionSheetOption[]
  cancelLabel?: string
}

export function ActionSheet({
  isOpen,
  onClose,
  title,
  options,
  cancelLabel = 'Cancel',
}: ActionSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Action Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl p-4 safe-bottom"
          >
            {title && (
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
              </div>
            )}

            <div className="space-y-2">
              {options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    option.onPress()
                    onClose()
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    touch-target transition-colors duration-200
                    ${
                      option.destructive
                        ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                        : 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                  whileTap={{ scale: 0.98 }}
                >
                  {option.icon && <div className="text-xl">{option.icon}</div>}
                  <span className="flex-1 text-left font-medium">{option.label}</span>
                </motion.button>
              ))}

              {/* Cancel button */}
              <motion.button
                onClick={onClose}
                className="w-full px-4 py-3 rounded-lg touch-target bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
                whileTap={{ scale: 0.98 }}
              >
                {cancelLabel}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ============================================================
   GESTURE HANDLER (Multi-touch)
   ============================================================ */

interface GestureHandlerProps {
  children: ReactNode
  onTap?: () => void
  onDoubleTap?: () => void
  onLongPress?: () => void
  onPinch?: (scale: number) => void
  className?: string
}

export function GestureHandler({
  children,
  onTap,
  onDoubleTap,
  onLongPress,
  onPinch,
  className = '',
}: GestureHandlerProps) {
  const [lastTap, setLastTap] = useState(0)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    // Long press detection
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress()
      }, 500)
    }

    // Pinch detection
    if (onPinch && e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const initialDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 2) {
          const touch1 = e.touches[0]
          const touch2 = e.touches[1]
          const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          )
          const scale = currentDistance / initialDistance
          onPinch(scale)
        }
      }

      const handleTouchEnd = () => {
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleTouchEnd)
      }

      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleTouchEnd)
    }
  }

  const handleTouchEnd = () => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    // Double tap detection
    const now = Date.now()
    const timeSinceLastTap = now - lastTap

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap
      if (onDoubleTap) {
        onDoubleTap()
      }
      setLastTap(0)
    } else {
      // Single tap
      if (onTap) {
        setTimeout(() => {
          if (Date.now() - now >= 300) {
            onTap()
          }
        }, 300)
      }
      setLastTap(now)
    }
  }

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'manipulation' }}
    >
      {children}
    </div>
  )
}
