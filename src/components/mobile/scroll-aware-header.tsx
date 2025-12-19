/**
 * Scroll-Aware Header Component
 * Hides on scroll down, shows on scroll up
 */

import React, { ReactNode } from 'react'

import { useScrollDirection } from '@/hooks/use-touch-gestures'

interface ScrollAwareHeaderProps {
  children: ReactNode
  className?: string
  threshold?: number
  alwaysShow?: boolean
}

export function ScrollAwareHeader({
  children,
  className = '',
  threshold = 10,
  alwaysShow = false,
}: ScrollAwareHeaderProps) {
  const scrollDirection = useScrollDirection(threshold)

  const shouldShow = alwaysShow || scrollDirection === 'up' || scrollDirection === 'none'

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50
        bg-white dark:bg-neutral-900
        border-b border-neutral-200 dark:border-neutral-800
        shadow-sm
        transition-transform duration-300 ease-in-out
        ${shouldShow ? 'translate-y-0' : '-translate-y-full'}
        ${className}
      `}
      style={{
        // Safe area insets for notched devices
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {children}
    </header>
  )
}

/* ============================================================
   HEADER HEIGHT UTILITY
   ============================================================ */

export function useHeaderHeight() {
  const [height, setHeight] = React.useState(0)

  React.useEffect(() => {
    const updateHeight = () => {
      const header = document.querySelector('header')
      if (header) {
        setHeight(header.offsetHeight)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)

    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  return height
}

/* ============================================================
   MAIN CONTENT WRAPPER (with header offset)
   ============================================================ */

interface MainContentWithHeaderOffsetProps {
  children: ReactNode
  className?: string
  headerHeight?: number
}

export function MainContentWithHeaderOffset({
  children,
  className = '',
  headerHeight,
}: MainContentWithHeaderOffsetProps) {
  const calculatedHeight = useHeaderHeight()
  const offset = headerHeight ?? calculatedHeight

  return (
    <main
      className={className}
      style={{
        paddingTop: `${offset}px`,
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {children}
    </main>
  )
}
