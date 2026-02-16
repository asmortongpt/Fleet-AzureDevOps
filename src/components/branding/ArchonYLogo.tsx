/**
 * Archon-Y Fleet Logo Component
 * Professional branded logo for sidebar and header
 */

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ArchonYLogoProps {
  variant?: 'full' | 'compact' | 'icon'
  className?: string
  showAnimation?: boolean
}

export function ArchonYLogo({
  variant = 'full',
  className,
  showAnimation = false
}: ArchonYLogoProps) {
  // Brand colors
  const colors = {
    orange: '#FF6B35',
    blue: '#41B2E3',
    navy: '#2F3359',
    gold: '#F0A000'
  }

  // Full logo with text
  if (variant === 'full') {
    return (
      <motion.div
        className={cn("flex items-center gap-3", className)}
        initial={showAnimation ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* SVG Logo Icon */}
        <svg
          viewBox="0 0 40 40"
          className="w-10 h-10 flex-shrink-0"
          style={{ filter: 'drop-shadow(0 4px 8px rgba(255, 107, 53, 0.25))' }}
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.orange} />
              <stop offset="100%" stopColor={colors.blue} />
            </linearGradient>
            <linearGradient id="innerGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.gold} />
              <stop offset="100%" stopColor={colors.orange} />
            </linearGradient>
          </defs>

          {/* Outer circle */}
          <circle cx="20" cy="20" r="18" fill="none" stroke="url(#logoGradient)" strokeWidth="2" />

          {/* Inner design - stylized "A" */}
          <g fill="url(#innerGradient)">
            <rect x="16" y="10" width="2" height="16" rx="1" transform="rotate(-25 17 18)" />
            <rect x="22" y="10" width="2" height="16" rx="1" transform="rotate(25 23 18)" />
            <rect x="14" y="18" width="12" height="2" rx="1" />
          </g>

          {/* Accent dots */}
          <circle cx="12" cy="12" r="1.5" fill={colors.blue} opacity="0.6" />
          <circle cx="28" cy="28" r="1.5" fill={colors.orange} opacity="0.6" />
        </svg>

        {/* Text */}
        <div className="flex flex-col gap-0">
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-sm font-black tracking-tight"
              style={{
                background: `linear-gradient(135deg, ${colors.orange}, ${colors.blue})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              ARCHON-Y
            </span>
            <span className="text-xs font-bold tracking-widest opacity-70" style={{ color: colors.navy }}>
              FLEET
            </span>
          </div>
          <span className="text-xs font-semibold tracking-wide opacity-60" style={{ color: colors.blue }}>
            INTELLIGENT
          </span>
        </div>
      </motion.div>
    )
  }

  // Compact icon version
  if (variant === 'compact') {
    return (
      <motion.div
        className={cn("relative w-10 h-10 flex items-center justify-center", className)}
        initial={showAnimation ? { scale: 0.8, opacity: 0 } : { scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(65, 178, 227, 0.3))' }}
        >
          <defs>
            <linearGradient id="compactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.orange} />
              <stop offset="100%" stopColor={colors.blue} />
            </linearGradient>
          </defs>

          <circle cx="20" cy="20" r="18" fill="none" stroke="url(#compactGradient)" strokeWidth="2.5" />
          <g fill="url(#compactGradient)">
            <rect x="16" y="10" width="2.5" height="18" rx="1" transform="rotate(-25 17.25 19)" />
            <rect x="21.5" y="10" width="2.5" height="18" rx="1" transform="rotate(25 22.75 19)" />
            <rect x="14" y="19" width="12" height="2.5" rx="1" />
          </g>
        </svg>
      </motion.div>
    )
  }

  // Icon only
  return (
    <div className={cn("relative w-8 h-8 flex items-center justify-center", className)}>
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))' }}>
        <defs>
          <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.orange} />
            <stop offset="100%" stopColor={colors.blue} />
          </linearGradient>
        </defs>
        <g fill="url(#iconGradient)">
          <rect x="16" y="8" width="3" height="20" rx="1.5" transform="rotate(-22 17.5 18)" />
          <rect x="21" y="8" width="3" height="20" rx="1.5" transform="rotate(22 22.5 18)" />
          <rect x="12" y="19" width="16" height="3" rx="1.5" />
        </g>
      </svg>
    </div>
  )
}
