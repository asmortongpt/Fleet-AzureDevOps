/**
 * useBreakpoint Hook - Responsive Design Utilities
 *
 * Detects current breakpoint and provides responsive utilities.
 * Uses Tailwind's default breakpoints:
 * - mobile: < 768px
 * - tablet: 768px - 1023px
 * - desktop: >= 1024px
 *
 * @example
 * const breakpoint = useBreakpoint()
 * const isMobile = breakpoint === 'mobile'
 * const isTablet = breakpoint === 'tablet'
 * const isDesktop = breakpoint === 'desktop'
 */

import { useState, useEffect } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export const useBreakpoint = (): Breakpoint => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    // Initialize with current window size (avoid hydration mismatch)
    if (typeof window === 'undefined') return 'desktop'
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setBreakpoint('mobile')
      } else if (width < 1024) {
        setBreakpoint('tablet')
      } else {
        setBreakpoint('desktop')
      }
    }

    // Set initial value
    handleResize()

    // Add event listener with debounce for performance
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 150)
    }

    window.addEventListener('resize', debouncedResize)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', debouncedResize)
    }
  }, [])

  return breakpoint
}

/**
 * Extended hook with additional responsive utilities
 */
export const useResponsive = () => {
  const breakpoint = useBreakpoint()

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isMobileOrTablet: breakpoint === 'mobile' || breakpoint === 'tablet',
    isTabletOrDesktop: breakpoint === 'tablet' || breakpoint === 'desktop',
  }
}
