/**
 * Touch Components with Gestures
 * Swipeable cards, pull-to-refresh, infinite scroll, bottom sheets, and more
 */

// motion removed - React 19 incompatible
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
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return
    startXRef.current = touch.clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const touch = e.touches[0]
    if (!touch) return
    const diff = touch.clientX - startXRef.current
    setOffsetX(diff * 0.2) // Apply resistance
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (offsetX < -threshold && onSwipeLeft) {
      onSwipeLeft()
    } else if (offsetX > threshold && onSwipeRight) {
      onSwipeRight()
    }
    setOffsetX(0)
  }

  const leftOpacity = Math.min(Math.max(-offsetX / threshold, 0), 1)
  const rightOpacity = Math.min(Math.max(offsetX / threshold, 0), 1)

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Left action background */}
      {leftAction && (
        <div
          className="absolute inset-0 bg-red-500 flex items-center justify-end px-3"
          style={{ opacity: leftOpacity }}
        >
          {leftAction}
        </div>
      )}

      {/* Right action background */}
      {rightAction && (
        <div
          className="absolute inset-0 bg-green-500 flex items-center justify-start px-3"
          style={{ opacity: rightOpacity }}
        >
          {rightAction}
        </div>
      )}

      {/* Card content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${offsetX}px)` }}
        className={`bg-white dark:bg-gray-800 transition-transform ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {children}
      </div>
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
    if (!touch) return
    const startY = touch.clientY

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
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
      <div
        className="flex items-center justify-center"
        style={{ height: pullDistance, opacity: pullDistance > 0 ? 1 : 0 }}
      >
        <div
          className="text-sm"
          style={{
            transform: `rotate(${isRefreshing ? 360 : spinnerRotation}deg)`,
            transition: isRefreshing ? 'transform 1s linear infinite' : undefined,
          }}
        >
          ↻
        </div>
      </div>

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
        <div ref={sentinelRef} className="py-2 flex items-center justify-center">
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
    <div
      onClick={onPress}
      className={`cursor-pointer active:opacity-70 active:scale-[0.98] transition-all ${className}`}
    >
      {children}
    </div>
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

  const currentSnapPoint = snapPoints[snapIndex] ?? 90

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
      />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-sm overflow-hidden transition-transform duration-300"
        style={{ transform: `translateY(${100 - currentSnapPoint}%)` }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Content */}
        <div className="overflow-y-auto safe-bottom" style={{ maxHeight: '85vh' }}>
          {children}
        </div>
      </div>
    </>
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
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
      />

      {/* Action Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-sm p-2 safe-bottom transition-transform duration-300"
      >
        {title && (
          <div className="text-center mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          </div>
        )}

        <div className="space-y-2">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                option.onPress()
                onClose()
              }}
              className={`
                w-full flex items-center gap-3 px-2 py-3 rounded-lg
                touch-target transition-colors duration-200 active:scale-[0.98]
                ${
                  option.destructive
                    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                    : 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {option.icon && <div className="text-base">{option.icon}</div>}
              <span className="flex-1 text-left font-medium">{option.label}</span>
            </button>
          ))}

          {/* Cancel button */}
          <button
            onClick={onClose}
            className="w-full px-2 py-3 rounded-lg touch-target bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </>
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
      if (!touch1 || !touch2) return
      const initialDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 2) {
          const touch1 = e.touches[0]
          const touch2 = e.touches[1]
          if (!touch1 || !touch2) return
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
    >
      {children}
    </div>
  )
}
