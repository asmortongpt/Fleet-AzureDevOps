/**
 * Archon-Y Fleet Professional Logo
 * Enterprise-grade branding with sophisticated design
 */

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ArchonYLogoProps {
  variant?: 'full' | 'compact' | 'icon' | 'text'
  className?: string
  showAnimation?: boolean
}

export function ArchonYLogo({
  variant = 'full',
  className,
  showAnimation = false
}: ArchonYLogoProps) {
  // Professional color palette
  const colors = {
    primary: '#2F3359',      // Navy blue
    accent1: '#FF6B35',      // CTA Orange
    accent2: '#41B2E3',      // Blue Skies
    gold: '#F0A000',         // Golden Hour
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
        {/* Professional Icon */}
        <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
          <svg
            viewBox="0 0 40 40"
            className="w-full h-full"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(47, 51, 89, 0.2))'
            }}
          >
            <defs>
              <linearGradient id="archonyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.accent1} />
                <stop offset="100%" stopColor={colors.accent2} />
              </linearGradient>
            </defs>

            {/* Outer hexagon shape */}
            <g fill="none" stroke="url(#archonyGradient)" strokeWidth="1.5">
              <circle cx="20" cy="20" r="18" />
            </g>

            {/* Inner geometric design - stylized "A" */}
            <g fill="url(#archonyGradient)">
              {/* Top triangle */}
              <polygon points="20,10 25,18 15,18" />
              {/* Bottom horizontal line */}
              <rect x="12" y="22" width="16" height="1.5" rx="0.75" />
              {/* Side supports */}
              <rect x="13" y="19" width="1.5" height="5" rx="0.75" />
              <rect x="25.5" y="19" width="1.5" height="5" rx="0.75" />
            </g>
          </svg>
        </div>

        {/* Text Branding */}
        <div className="flex flex-col gap-0.5 leading-none">
          <div className="flex items-baseline gap-1">
            <span
              className="text-base font-black tracking-tight"
              style={{ color: colors.primary }}
            >
              ARCHON-Y
            </span>
            <span
              className="text-xs font-bold tracking-widest opacity-70"
              style={{ color: colors.primary }}
            >
              FLEET
            </span>
          </div>
          <span
            className="text-xs font-semibold tracking-wide opacity-60"
            style={{ color: colors.accent2 }}
          >
            INTELLIGENCE
          </span>
        </div>
      </motion.div>
    )
  }

  // Compact icon only
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
          style={{
            filter: 'drop-shadow(0 2px 6px rgba(47, 51, 89, 0.15))'
          }}
        >
          <defs>
            <linearGradient id="compactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.accent1} />
              <stop offset="100%" stopColor={colors.accent2} />
            </linearGradient>
          </defs>

          <circle cx="20" cy="20" r="18" fill="none" stroke="url(#compactGradient)" strokeWidth="1.5" />

          <g fill="url(#compactGradient)">
            <polygon points="20,10 25,18 15,18" />
            <rect x="12" y="22" width="16" height="1.5" rx="0.75" />
            <rect x="13" y="19" width="1.5" height="5" rx="0.75" />
            <rect x="25.5" y="19" width="1.5" height="5" rx="0.75" />
          </g>
        </svg>
      </motion.div>
    )
  }

  // Icon only
  if (variant === 'icon') {
    return (
      <div className={cn("relative w-8 h-8 flex items-center justify-center", className)}>
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full"
          style={{
            filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))'
          }}
        >
          <defs>
            <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.accent1} />
              <stop offset="100%" stopColor={colors.accent2} />
            </linearGradient>
          </defs>

          <g fill="url(#iconGradient)">
            <polygon points="20,8 26,18 14,18" />
            <rect x="10" y="23" width="20" height="2" rx="1" />
            <rect x="11" y="19" width="2" height="6" rx="1" />
            <rect x="27" y="19" width="2" height="6" rx="1" />
          </g>
        </svg>
      </div>
    )
  }

  // Text only
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline gap-2">
        <span
          className="text-2xl font-black tracking-tight"
          style={{ color: colors.primary }}
        >
          ARCHON-Y
        </span>
        <span
          className="text-sm font-bold tracking-widest opacity-70"
          style={{ color: colors.primary }}
        >
          FLEET
        </span>
      </div>
      <span
        className="text-sm font-semibold tracking-wide opacity-60"
        style={{ color: colors.accent2 }}
      >
        INTELLIGENT FLEET MANAGEMENT
      </span>
    </div>
  )
}
