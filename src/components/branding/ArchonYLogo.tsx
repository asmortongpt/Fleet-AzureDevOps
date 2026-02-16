/**
 * Archon-Y Fleet Premium Logo
 * Enterprise-grade branding with sophisticated animations and premium effects
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

  // Animation variants for premium effects - glow effect on logo
  const glowPulseAnimation = {
    initial: { opacity: 0.5 },
    animate: { opacity: [0.5, 1, 0.5] },
    transition: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' } as any
  }

  const iconVariants = {
    idle: { scale: 1, filter: 'drop-shadow(0 0 8px rgba(65, 178, 227, 0.3))' },
    hover: { scale: 1.08, filter: 'drop-shadow(0 0 16px rgba(65, 178, 227, 0.6))' }
  }

  const orbits = [
    { delay: 0, duration: 8, r: 12 },
    { delay: 0.3, duration: 10, r: 15 },
    { delay: 0.6, duration: 12, r: 18 }
  ]

  // Full logo with text
  if (variant === 'full') {
    return (
      <motion.div
        className={cn("flex items-center gap-3", className)}
        initial={showAnimation ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Premium Icon with Glow and Orbits */}
        <motion.div
          className="relative w-12 h-12 flex items-center justify-center flex-shrink-0"
          whileHover="hover"
          initial="idle"
          variants={iconVariants}
        >
          {/* Glowing background orb */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${colors.accent2}40, transparent)`,
            }}
            initial={glowPulseAnimation.initial}
            animate={glowPulseAnimation.animate}
            transition={glowPulseAnimation.transition}
          />

          {/* Main SVG Icon */}
          <svg
            viewBox="0 0 40 40"
            className="w-full h-full relative z-10"
            style={{
              filter: 'drop-shadow(0 4px 12px rgba(65, 178, 227, 0.4))'
            }}
          >
            <defs>
              <linearGradient id="archonyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.accent1} />
                <stop offset="50%" stopColor={colors.accent2} />
                <stop offset="100%" stopColor={colors.gold} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Animated outer ring */}
            <motion.circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="url(#archonyGradient)"
              strokeWidth="1.5"
              initial={{ strokeDasharray: '113 113', strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: -113 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              opacity="0.8"
            />

            {/* Static outer ring for depth */}
            <circle cx="20" cy="20" r="18" fill="none" stroke="url(#archonyGradient)" strokeWidth="0.5" opacity="0.3" />

            {/* Inner geometric design - stylized "A" with filter */}
            <g fill="url(#archonyGradient)" filter="url(#glow)">
              {/* Top triangle */}
              <polygon points="20,10 25,18 15,18" />
              {/* Bottom horizontal line */}
              <rect x="12" y="22" width="16" height="1.5" rx="0.75" />
              {/* Side supports */}
              <rect x="13" y="19" width="1.5" height="5" rx="0.75" />
              <rect x="25.5" y="19" width="1.5" height="5" rx="0.75" />
            </g>
          </svg>
        </motion.div>

        {/* Premium Text Branding with Gradient */}
        <div className="flex flex-col gap-0.5 leading-none">
          <div className="flex items-baseline gap-1">
            <motion.span
              className="text-base font-black tracking-tight"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent2})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              whileHover={{ scale: 1.05 }}
            >
              ARCHON-Y
            </motion.span>
            <motion.span
              className="text-xs font-bold tracking-widest opacity-70"
              style={{ color: colors.accent1 }}
              whileHover={{ opacity: 1 }}
            >
              FLEET
            </motion.span>
          </div>
          <motion.span
            className="text-xs font-semibold tracking-wide"
            style={{
              background: `linear-gradient(90deg, ${colors.accent2}, ${colors.gold})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            animate={{ opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            INTELLIGENCE
          </motion.span>
        </div>
      </motion.div>
    )
  }

  // Compact icon only - premium version
  if (variant === 'compact') {
    return (
      <motion.div
        className={cn("relative w-12 h-12 flex items-center justify-center", className)}
        whileHover="hover"
        initial="idle"
        variants={iconVariants}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${colors.accent2}30, transparent)` }}
          initial={glowPulseAnimation.initial}
          animate={glowPulseAnimation.animate}
          transition={glowPulseAnimation.transition}
        />

        <svg
          viewBox="0 0 40 40"
          className="w-full h-full relative z-10"
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(65, 178, 227, 0.4))'
          }}
        >
          <defs>
            <linearGradient id="compactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.accent1} />
              <stop offset="50%" stopColor={colors.accent2} />
              <stop offset="100%" stopColor={colors.gold} />
            </linearGradient>
            <filter id="glowCompact">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Animated rotating ring */}
          <motion.circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="url(#compactGradient)"
            strokeWidth="1.5"
            initial={{ strokeDasharray: '113 113', strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -113 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            opacity="0.9"
          />

          {/* Static ring for depth */}
          <circle cx="20" cy="20" r="18" fill="none" stroke="url(#compactGradient)" strokeWidth="0.5" opacity="0.3" />

          <g fill="url(#compactGradient)" filter="url(#glowCompact)">
            <polygon points="20,10 25,18 15,18" />
            <rect x="12" y="22" width="16" height="1.5" rx="0.75" />
            <rect x="13" y="19" width="1.5" height="5" rx="0.75" />
            <rect x="25.5" y="19" width="1.5" height="5" rx="0.75" />
          </g>
        </svg>
      </motion.div>
    )
  }

  // Icon only - premium version
  if (variant === 'icon') {
    return (
      <motion.div
        className={cn("relative w-10 h-10 flex items-center justify-center", className)}
        whileHover="hover"
        initial="idle"
        variants={iconVariants}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${colors.accent2}20, transparent)` }}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />

        <svg
          viewBox="0 0 40 40"
          className="w-full h-full relative z-10"
          style={{
            filter: 'drop-shadow(0 2px 8px rgba(65, 178, 227, 0.3))'
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
      </motion.div>
    )
  }

  // Text only - premium version
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline gap-2">
        <motion.span
          className="text-2xl font-black tracking-tight"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent2})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          whileHover={{ scale: 1.05 }}
        >
          ARCHON-Y
        </motion.span>
        <motion.span
          className="text-sm font-bold tracking-widest"
          style={{ color: colors.accent1 }}
        >
          FLEET
        </motion.span>
      </div>
      <motion.span
        className="text-sm font-semibold tracking-wide"
        style={{
          background: `linear-gradient(90deg, ${colors.accent2}, ${colors.gold})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        INTELLIGENT FLEET MANAGEMENT
      </motion.span>
    </div>
  )
}
