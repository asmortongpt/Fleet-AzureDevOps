/**
 * Touch Gesture Hooks
 * Provides swipe, pinch, long-press, and other touch interactions
 */

import React, { useEffect, useRef, RefObject } from 'react'

/* ============================================================
   TYPES
   ============================================================ */

export interface SwipeGestureConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number // Minimum distance in pixels
  restraint?: number // Maximum perpendicular distance
  allowedTime?: number // Maximum time for swipe in ms
  haptic?: boolean // Enable haptic feedback
}

export interface PinchGestureConfig {
  onPinchStart?: (scale: number) => void
  onPinchMove?: (scale: number) => void
  onPinchEnd?: (scale: number) => void
  minScale?: number
  maxScale?: number
  haptic?: boolean
}

export interface LongPressConfig {
  onLongPress?: (event: TouchEvent) => void
  delay?: number // Time to hold in ms
  haptic?: boolean
}

export interface PullToRefreshConfig {
  onRefresh?: () => Promise<void>
  threshold?: number // Distance to pull in pixels
  resistance?: number // Pull resistance (0-1)
  haptic?: boolean
}

/* ============================================================
   HAPTIC FEEDBACK UTILITY
   ============================================================ */

const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30, 10, 30],
    }
    navigator.vibrate(patterns[style])
  }
}

/* ============================================================
   SWIPE GESTURE HOOK
   ============================================================ */

export function useSwipeGesture<T extends HTMLElement>(
  ref: RefObject<T>,
  config: SwipeGestureConfig
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    restraint = 100,
    allowedTime = 300,
    haptic = true,
  } = config

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let startX = 0
    let startY = 0
    let startTime = 0

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) {
        startX = touch.pageX
        startY = touch.pageY
        startTime = Date.now()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      if (!touch) return
      const distX = touch.pageX - startX
      const distY = touch.pageY - startY
      const elapsedTime = Date.now() - startTime

      if (elapsedTime <= allowedTime) {
        // Horizontal swipe
        if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
          if (distX > 0 && onSwipeRight) {
            if (haptic) triggerHaptic('light')
            onSwipeRight()
          } else if (distX < 0 && onSwipeLeft) {
            if (haptic) triggerHaptic('light')
            onSwipeLeft()
          }
        }
        // Vertical swipe
        else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) {
          if (distY > 0 && onSwipeDown) {
            if (haptic) triggerHaptic('light')
            onSwipeDown()
          } else if (distY < 0 && onSwipeUp) {
            if (haptic) triggerHaptic('light')
            onSwipeUp()
          }
        }
      }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [
    ref,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold,
    restraint,
    allowedTime,
    haptic,
  ])
}

/* ============================================================
   PINCH GESTURE HOOK
   ============================================================ */

export function usePinchGesture<T extends HTMLElement>(
  ref: RefObject<T>,
  config: PinchGestureConfig
) {
  const { onPinchStart, onPinchMove, onPinchEnd, minScale = 0.5, maxScale = 3, haptic = true } = config

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let initialDistance = 0
    let currentScale = 1

    const getDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch1.pageX - touch2.pageX
      const dy = touch1.pageY - touch2.pageY
      return Math.sqrt(dx * dx + dy * dy)
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        if (touch1 && touch2) {
          e.preventDefault()
          initialDistance = getDistance(touch1, touch2)
          if (haptic) triggerHaptic('light')
          if (onPinchStart) onPinchStart(currentScale)
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        if (touch1 && touch2) {
          e.preventDefault()
          const currentDistance = getDistance(touch1, touch2)
          const scale = currentDistance / initialDistance
          currentScale = Math.min(Math.max(scale, minScale), maxScale)
          if (onPinchMove) onPinchMove(currentScale)
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        if (haptic) triggerHaptic('medium')
        if (onPinchEnd) onPinchEnd(currentScale)
      }
    }

    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchmove', handleTouchMove)
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [ref, onPinchStart, onPinchMove, onPinchEnd, minScale, maxScale, haptic])
}

/* ============================================================
   LONG PRESS HOOK
   ============================================================ */

export function useLongPress<T extends HTMLElement>(ref: RefObject<T>, config: LongPressConfig) {
  const { onLongPress, delay = 500, haptic = true } = config
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      timerRef.current = setTimeout(() => {
        if (haptic) triggerHaptic('heavy')
        if (onLongPress) onLongPress(e)
      }, delay)
    }

    const handleTouchEnd = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const handleTouchMove = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchmove', handleTouchMove)
    }
  }, [ref, onLongPress, delay, haptic])
}

/* ============================================================
   PULL TO REFRESH HOOK
   ============================================================ */

export function usePullToRefresh<T extends HTMLElement>(
  ref: RefObject<T>,
  config: PullToRefreshConfig
) {
  const { onRefresh, threshold = 80, resistance = 0.5, haptic = true } = config
  const startYRef = useRef(0)
  const currentYRef = useRef(0)
  const isRefreshingRef = useRef(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at top of scrollable container
      if (element.scrollTop === 0) {
        const touch = e.touches[0]
        if (touch) {
          startYRef.current = touch.pageY
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshingRef.current || element.scrollTop !== 0) return

      const touch = e.touches[0]
      if (touch) {
        currentYRef.current = touch.pageY
        const pullDistance = (currentYRef.current - startYRef.current) * resistance

        if (pullDistance > 0) {
          e.preventDefault()
          // Visual feedback can be added here (stretch element)
          if (pullDistance > threshold && haptic) {
            triggerHaptic('light')
          }
        }
      }
    }

    const handleTouchEnd = async () => {
      const pullDistance = (currentYRef.current - startYRef.current) * resistance

      if (pullDistance > threshold && !isRefreshingRef.current && onRefresh) {
        isRefreshingRef.current = true
        if (haptic) triggerHaptic('medium')

        try {
          await onRefresh()
        } finally {
          isRefreshingRef.current = false
        }
      }

      startYRef.current = 0
      currentYRef.current = 0
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [ref, onRefresh, threshold, resistance, haptic])
}

/* ============================================================
   COMBINED GESTURE HOOK (All gestures in one)
   ============================================================ */

export interface CombinedGestureConfig
  extends SwipeGestureConfig,
    PinchGestureConfig,
    LongPressConfig,
    PullToRefreshConfig {
  enableSwipe?: boolean
  enablePinch?: boolean
  enableLongPress?: boolean
  enablePullToRefresh?: boolean
}

export function useGestures<T extends HTMLElement>(ref: RefObject<T>, config: CombinedGestureConfig) {
  const {
    enableSwipe = true,
    enablePinch = false,
    enableLongPress = false,
    enablePullToRefresh = false,
    ...restConfig
  } = config

  if (enableSwipe) {
    useSwipeGesture(ref, restConfig)
  }

  if (enablePinch) {
    usePinchGesture(ref, restConfig)
  }

  if (enableLongPress) {
    useLongPress(ref, restConfig)
  }

  if (enablePullToRefresh) {
    usePullToRefresh(ref, restConfig)
  }
}

/* ============================================================
   SCROLL DIRECTION HOOK
   ============================================================ */

export type ScrollDirection = 'up' | 'down' | 'none'

export function useScrollDirection(threshold = 10) {
  const [scrollDirection, setScrollDirection] = React.useState<ScrollDirection>('none')
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (Math.abs(currentScrollY - lastScrollY.current) < threshold) {
        return
      }

      if (currentScrollY > lastScrollY.current) {
        setScrollDirection('down')
      } else {
        setScrollDirection('up')
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return scrollDirection
}

/* ============================================================
   EXPORT ALL
   ============================================================ */

export { triggerHaptic }