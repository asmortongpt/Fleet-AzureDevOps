/**
 * Pull to Refresh Component
 * Implements pull-to-refresh gesture for mobile
 */

import { RefreshCw } from 'lucide-react'
import React, { ReactNode, useRef, useState } from 'react'

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
  resistance?: number
  disabled?: boolean
  className?: string
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  resistance = 0.5,
  disabled = false,
  className = '',
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  const handleRefresh = async () => {
    if (disabled || isRefreshing) return

    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
      setPullDistance(0)
      setIsPulling(false)
    }
  }

  // Enhanced pull-to-refresh with visual feedback
  React.useEffect(() => {
    const element = containerRef.current
    if (!element || disabled) return

    let startY = 0
    let currentY = 0
    let pulling = false

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0) {
        startY = e.touches[0]?.pageY ?? 0
        pulling = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!pulling || isRefreshing || element.scrollTop !== 0) return

      currentY = e.touches[0]?.pageY ?? 0
      const distance = (currentY - startY) * resistance

      if (distance > 0) {
        e.preventDefault()
        setPullDistance(Math.min(distance, threshold * 1.5))
        setIsPulling(distance > threshold)
      }
    }

    const handleTouchEnd = async () => {
      if (!pulling) return

      const distance = (currentY - startY) * resistance

      if (distance > threshold && !isRefreshing) {
        await handleRefresh()
      } else {
        setPullDistance(0)
        setIsPulling(false)
      }

      pulling = false
      startY = 0
      currentY = 0
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [disabled, isRefreshing, threshold, resistance])

  const pullProgress = Math.min(pullDistance / threshold, 1)
  const spinnerRotation = pullProgress * 360

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 ease-out"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 ? 1 : 0,
          pointerEvents: 'none',
        }}
      >
        <div
          className={`
            flex items-center justify-center
            w-10 h-10 rounded-full
            bg-blue-600 text-white
            shadow-lg
            transition-transform duration-200
            ${isPulling || isRefreshing ? 'scale-110' : 'scale-100'}
          `}
        >
          <RefreshCw
            className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: `rotate(${spinnerRotation}deg)`,
            }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        {isRefreshing ? 'Refreshing content...' : isPulling ? 'Release to refresh' : ''}
      </div>
    </div>
  )
}

/* ============================================================
   SIMPLE REFRESH BUTTON (Fallback for non-touch devices)
   ============================================================ */

interface RefreshButtonProps {
  onRefresh: () => Promise<void>
  className?: string
}

export function RefreshButton({ onRefresh, className = '' }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleClick = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isRefreshing}
      className={`
        flex items-center gap-2 px-4 py-2
        bg-blue-600 hover:bg-blue-700
        text-white rounded-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
        ${className}
      `}
      aria-label="Refresh content"
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
      <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
    </button>
  )
}