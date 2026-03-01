/**
 * GlowCard — Premium card with animated rotating gradient border glow
 *
 * Used for hero/feature panels that deserve visual prominence.
 * Renders a subtle rotating conic-gradient border with configurable accent color.
 *
 * Technique: an oversized (200%) conic-gradient div rotates behind a 1px gap,
 * clipped by the parent's overflow-hidden. The inner card masks the center,
 * leaving only the animated border visible.
 */
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface GlowCardProps {
  children: ReactNode
  className?: string
  accent?: string
  /** Disable the animated border glow */
  static?: boolean
}

export function GlowCard({ children, className, accent = '#10b981', static: isStatic }: GlowCardProps) {
  return (
    <div className={cn('relative rounded-xl overflow-hidden p-[1px]', className)}>
      {/* Rotating conic-gradient — oversized so rotation always covers the border */}
      <div
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          !isStatic && 'animate-[glowSpin_4s_linear_infinite]',
        )}
        style={{
          width: '200%',
          height: '200%',
          background: `conic-gradient(from 0deg, transparent, ${accent}50, transparent, ${accent}30, transparent)`,
        }}
      />
      {/* Inner card body — h-full + flex to propagate sizing */}
      <div className="relative rounded-[11px] overflow-hidden h-full flex flex-col" style={{ background: '#111' }}>
        {/* Accent glow wash */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{
            background: `radial-gradient(ellipse at top left, ${accent}, transparent 60%)`,
          }}
        />
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
