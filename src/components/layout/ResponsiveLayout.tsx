/**
 * Responsive Layout Components
 * Provides container, grid, flex, stack, and breakpoint detection utilities
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

/* ============================================================
   BREAKPOINT TYPES & CONTEXT
   ============================================================ */

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

interface BreakpointContextValue {
  breakpoint: Breakpoint
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLargeDesktop: boolean
}

const BreakpointContext = createContext<BreakpointContextValue>({
  breakpoint: 'md',
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isLargeDesktop: false,
})

/* ============================================================
   BREAKPOINT PROVIDER
   ============================================================ */

export function BreakpointProvider({ children }: { children: ReactNode }) {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('md')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth

      if (width < 480) {
        setBreakpoint('xs')
      } else if (width < 768) {
        setBreakpoint('sm')
      } else if (width < 1024) {
        setBreakpoint('md')
      } else if (width < 1440) {
        setBreakpoint('lg')
      } else if (width < 1920) {
        setBreakpoint('xl')
      } else if (width < 2560) {
        setBreakpoint('2xl')
      } else {
        setBreakpoint('3xl')
      }
    }

    // Initial update
    updateBreakpoint()

    // Listen for resize events
    window.addEventListener('resize', updateBreakpoint)

    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  const value: BreakpointContextValue = {
    breakpoint,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl',
    isLargeDesktop: breakpoint === '2xl' || breakpoint === '3xl',
  }

  return <BreakpointContext.Provider value={value}>{children}</BreakpointContext.Provider>
}

/* ============================================================
   BREAKPOINT HOOK
   ============================================================ */

export function useBreakpoint() {
  return useContext(BreakpointContext)
}

/* ============================================================
   RESPONSIVE CONTAINER
   ============================================================ */

interface ResponsiveContainerProps {
  children: ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  className?: string
  padding?: boolean
}

export function ResponsiveContainer({
  children,
  maxWidth = 'xl',
  className = '',
  padding = true,
}: ResponsiveContainerProps) {
  const maxWidthClasses: Record<string, string> = {
    xs: 'max-w-[20rem]',
    sm: 'max-w-[30rem]',
    md: 'max-w-[48rem]',
    lg: 'max-w-[64rem]',
    xl: 'max-w-[80rem]',
    '2xl': 'max-w-[90rem]',
    '3xl': 'max-w-[120rem]',
    full: 'max-w-full',
  }

  const paddingClass = padding ? 'px-2 md:px-3 lg:px-3' : ''

  return (
    <div className={`w-full mx-auto ${maxWidthClasses[maxWidth]} ${paddingClass} ${className}`}>
      {children}
    </div>
  )
}

/* ============================================================
   RESPONSIVE GRID
   ============================================================ */

interface ResponsiveGridProps {
  children: ReactNode
  cols?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
  className?: string
}

export function ResponsiveGrid({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
  className = '',
}: ResponsiveGridProps) {
  const colClasses = [
    cols.xs && `grid-cols-${cols.xs}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ]
    .filter(Boolean)
    .join(' ')

  return <div className={`grid ${colClasses} gap-${gap} ${className}`}>{children}</div>
}

/* ============================================================
   RESPONSIVE FLEX
   ============================================================ */

interface ResponsiveFlexProps {
  children: ReactNode
  direction?: {
    xs?: 'row' | 'col'
    sm?: 'row' | 'col'
    md?: 'row' | 'col'
    lg?: 'row' | 'col'
  }
  gap?: number
  wrap?: boolean
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  className?: string
}

export function ResponsiveFlex({
  children,
  direction = { xs: 'col', md: 'row' },
  gap = 4,
  wrap = false,
  align = 'start',
  justify = 'start',
  className = '',
}: ResponsiveFlexProps) {
  const directionClasses = [
    direction.xs && `flex-${direction.xs}`,
    direction.sm && `sm:flex-${direction.sm}`,
    direction.md && `md:flex-${direction.md}`,
    direction.lg && `lg:flex-${direction.lg}`,
  ]
    .filter(Boolean)
    .join(' ')

  const wrapClass = wrap ? 'flex-wrap' : 'flex-nowrap'
  const alignClass = `items-${align}`
  const justifyClass = `justify-${justify}`

  return (
    <div
      className={`flex ${directionClasses} ${wrapClass} ${alignClass} ${justifyClass} gap-${gap} ${className}`}
    >
      {children}
    </div>
  )
}

/* ============================================================
   STACK COMPONENT (Vertical/Horizontal with responsive spacing)
   ============================================================ */

interface StackProps {
  children: ReactNode
  direction?: 'vertical' | 'horizontal'
  spacing?: number
  align?: 'start' | 'center' | 'end' | 'stretch'
  className?: string
}

export function Stack({
  children,
  direction = 'vertical',
  spacing = 4,
  align = 'start',
  className = '',
}: StackProps) {
  const directionClass = direction === 'vertical' ? 'flex-col' : 'flex-row'
  const alignClass = `items-${align}`

  return <div className={`flex ${directionClass} ${alignClass} gap-${spacing} ${className}`}>{children}</div>
}

/* ============================================================
   BREAKPOINT COMPONENT (Conditional rendering)
   ============================================================ */

interface BreakpointComponentProps {
  children: ReactNode
  show?: Breakpoint[]
  hide?: Breakpoint[]
}

export function Breakpoint({ children, show, hide }: BreakpointComponentProps) {
  const { breakpoint } = useBreakpoint()

  if (show && !show.includes(breakpoint)) {
    return null
  }

  if (hide && hide.includes(breakpoint)) {
    return null
  }

  return <>{children}</>
}

/* ============================================================
   RESPONSIVE SPACER
   ============================================================ */

interface SpacerProps {
  size?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
  }
  direction?: 'horizontal' | 'vertical'
}

export function Spacer({ size = { xs: 4, md: 6, lg: 8 }, direction = 'vertical' }: SpacerProps) {
  const sizeClasses = [
    size.xs && direction === 'vertical' ? `h-${size.xs}` : `w-${size.xs}`,
    size.sm && (direction === 'vertical' ? `sm:h-${size.sm}` : `sm:w-${size.sm}`),
    size.md && (direction === 'vertical' ? `md:h-${size.md}` : `md:w-${size.md}`),
    size.lg && (direction === 'vertical' ? `lg:h-${size.lg}` : `lg:w-${size.lg}`),
  ]
    .filter(Boolean)
    .join(' ')

  return <div className={sizeClasses} aria-hidden="true" />
}

/* ============================================================
   RESPONSIVE COLUMNS (2-column layout)
   ============================================================ */

interface ResponsiveColumnsProps {
  left: ReactNode
  right: ReactNode
  leftWidth?: string
  rightWidth?: string
  gap?: number
  reverseOnMobile?: boolean
  className?: string
}

export function ResponsiveColumns({
  left,
  right,
  leftWidth = '1/2',
  rightWidth = '1/2',
  gap = 6,
  reverseOnMobile = false,
  className = '',
}: ResponsiveColumnsProps) {
  const reverseClass = reverseOnMobile ? 'flex-col-reverse md:flex-row' : 'flex-col md:flex-row'

  return (
    <div className={`flex ${reverseClass} gap-${gap} ${className}`}>
      <div className={`w-full md:w-${leftWidth}`}>{left}</div>
      <div className={`w-full md:w-${rightWidth}`}>{right}</div>
    </div>
  )
}

/* ============================================================
   RESPONSIVE SIDEBAR LAYOUT
   ============================================================ */

interface ResponsiveSidebarLayoutProps {
  sidebar: ReactNode
  main: ReactNode
  sidebarPosition?: 'left' | 'right'
  sidebarWidth?: string
  collapsible?: boolean
  className?: string
}

export function ResponsiveSidebarLayout({
  sidebar,
  main,
  sidebarPosition = 'left',
  sidebarWidth = '64',
  collapsible = true,
  className = '',
}: ResponsiveSidebarLayoutProps) {
  const { isMobile } = useBreakpoint()
  const [isOpen, setIsOpen] = useState(!isMobile)

  useEffect(() => {
    setIsOpen(!isMobile)
  }, [isMobile])

  const sidebarContent = (
    <aside
      className={`
        ${isMobile ? 'fixed inset-y-0 z-50 bg-background shadow-sm transition-transform' : `w-${sidebarWidth}`}
        ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
        ${sidebarPosition === 'right' ? 'right-0' : 'left-0'}
      `}
    >
      {sidebar}
    </aside>
  )

  const mainContent = (
    <main className="flex-1 overflow-auto">
      {isMobile && collapsible && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 mb-2 touch-target"
          aria-label="Toggle sidebar"
        >
          <span className="text-sm">☰</span>
        </button>
      )}
      {main}
    </main>
  )

  return (
    <div className={`flex h-screen ${className}`}>
      {sidebarPosition === 'left' ? (
        <>
          {sidebarContent}
          {mainContent}
        </>
      ) : (
        <>
          {mainContent}
          {sidebarContent}
        </>
      )}

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

/* ============================================================
   RESPONSIVE CARD
   ============================================================ */

interface ResponsiveCardProps {
  children: ReactNode
  padding?: {
    xs?: number
    md?: number
    lg?: number
  }
  shadow?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function ResponsiveCard({
  children,
  padding = { xs: 4, md: 6, lg: 8 },
  shadow = 'md',
  className = '',
}: ResponsiveCardProps) {
  const paddingClasses = [
    padding.xs && `p-${padding.xs}`,
    padding.md && `md:p-${padding.md}`,
    padding.lg && `lg:p-${padding.lg}`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={`bg-card text-card-foreground rounded-lg border border-border/50 shadow-${shadow} ${paddingClasses} ${className}`}
    >
      {children}
    </div>
  )
}

/* ============================================================
   RESPONSIVE IMAGE
   ============================================================ */

interface ResponsiveImageProps {
  src: string
  alt: string
  aspectRatio?: '1/1' | '16/9' | '4/3' | '3/2'
  objectFit?: 'cover' | 'contain' | 'fill'
  className?: string
}

export function ResponsiveImage({
  src,
  alt,
  aspectRatio = '16/9',
  objectFit = 'cover',
  className = '',
}: ResponsiveImageProps) {
  const aspectRatioMap: Record<string, string> = {
    '1/1': 'aspect-square',
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '3/2': 'aspect-[3/2]',
  }

  return (
    <div className={`${aspectRatioMap[aspectRatio]} overflow-hidden ${className}`}>
      <img src={src} alt={alt} className={`w-full h-full object-${objectFit}`} />
    </div>
  )
}
