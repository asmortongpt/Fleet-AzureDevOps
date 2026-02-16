/**
 * Archon-Y Fleet Luxury Logo
 * Ultra-premium enterprise branding with 3D effects, advanced animations, and sophisticated visual design
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
  // Brand color palette from CLAUDE.md specification
  const colors = {
    navy: '#2F3359',         // Navy (official spec)
    orange: '#FF6B35',       // CTA Orange
    blue: '#41B2E3',         // Blue Skies
    gold: '#F0A000',         // Golden Hour
    red: '#DD3903',          // Noon Red
  }

  // Advanced animation variants with 3D effects
  const glowPulseAnimation = {
    initial: { opacity: 0.5 },
    animate: { opacity: [0.5, 1, 0.5] },
    transition: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' } as any
  }

  const iconVariants = {
    idle: {
      scale: 1,
      filter: 'drop-shadow(0 0 12px rgba(65, 178, 227, 0.3))',
      rotateX: 0,
      rotateY: 0,
    },
    hover: {
      scale: 1.12,
      filter: 'drop-shadow(0 0 24px rgba(65, 178, 227, 0.8))',
      rotateX: 5,
      rotateY: 5,
    }
  }

  // Sophisticated multi-layer animation sequences
  const coreRotation = {
    animate: { rotate: 360 },
    transition: { duration: 12, repeat: Number.POSITIVE_INFINITY, ease: 'linear' } as any
  }

  const reverseRotation = {
    animate: { rotate: -360 },
    transition: { duration: 16, repeat: Number.POSITIVE_INFINITY, ease: 'linear' } as any
  }

  // Full logo with text - LUXURY VERSION
  if (variant === 'full') {
    return (
      <motion.div
        className={cn("flex items-center gap-4", className)}
        initial={showAnimation ? { opacity: 0, x: -30, scale: 0.95 } : { opacity: 1, x: 0, scale: 1 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Luxury Icon with 3D Perspective and Multi-Layer Animations */}
        <motion.div
          className="relative w-14 h-14 flex items-center justify-center flex-shrink-0"
          whileHover="hover"
          initial="idle"
          variants={iconVariants}
          style={{ perspective: 1000 }}
        >
          {/* Multi-layer glow effects */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${colors.blue}50, transparent)`,
            }}
            initial={glowPulseAnimation.initial}
            animate={glowPulseAnimation.animate}
            transition={glowPulseAnimation.transition}
          />
          <motion.div
            className="absolute inset-1 rounded-full"
            style={{
              background: `radial-gradient(circle, ${colors.red}20, transparent)`,
            }}
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          />

          {/* Luxury SVG Icon with Multi-Layer Design */}
          <svg
            viewBox="0 0 48 48"
            className="w-full h-full relative z-10"
            style={{
              filter: 'drop-shadow(0 8px 20px rgba(65, 178, 227, 0.5))',
            }}
          >
            <defs>
              {/* Premium multi-stop gradients */}
              <linearGradient id="luxuryGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.orange} />
                <stop offset="40%" stopColor={colors.blue} />
                <stop offset="70%" stopColor={colors.red} />
                <stop offset="100%" stopColor={colors.gold} />
              </linearGradient>
              <linearGradient id="luxuryGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={colors.blue} />
                <stop offset="100%" stopColor={colors.orange} />
              </linearGradient>
              <filter id="luxuryGlow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="innerShadow">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
              </filter>
            </defs>

            {/* Outer decorative circle - rotating */}
            <motion.circle
              cx="24"
              cy="24"
              r="21"
              fill="none"
              stroke={'rgba(255,255,255,0.3)'}
              strokeWidth="0.8"
              opacity="0.3"
              animate={reverseRotation.animate}
              transition={reverseRotation.transition}
            />

            {/* Main animated gradient ring */}
            <motion.circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="url(#luxuryGradient1)"
              strokeWidth="1.5"
              initial={{ strokeDasharray: '125.6 125.6', strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: -125.6 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              opacity="0.9"
            />

            {/* Inner accent ring - reverse rotation */}
            <motion.circle
              cx="24"
              cy="24"
              r="15"
              fill="none"
              stroke="url(#luxuryGradient2)"
              strokeWidth="1"
              animate={coreRotation.animate}
              transition={coreRotation.transition}
              opacity="0.6"
            />

            {/* Core geometric "A" symbol - sophisticated design */}
            <g fill="url(#luxuryGradient1)" filter="url(#luxuryGlow)">
              {/* Top apex triangle - larger */}
              <polygon points="24,10 30,22 18,22" />
              {/* Horizontal bar - premium weight */}
              <rect x="16" y="26" width="16" height="2" rx="1" />
              {/* Left support leg */}
              <path d="M 18 23 L 17 32 L 19 32 L 20 23 Z" />
              {/* Right support leg */}
              <path d="M 30 23 L 31 32 L 29 32 L 28 23 Z" />
            </g>

            {/* Accent corner flourishes - luxury details */}
            <motion.circle cx="10" cy="10" r="1.5" fill={colors.blue} opacity="0.6" animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }} />
            <motion.circle cx="38" cy="10" r="1.5" fill={colors.orange} opacity="0.6" animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }} />
            <motion.circle cx="10" cy="38" r="1.5" fill={colors.red} opacity="0.6" animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 1 }} />
            <motion.circle cx="38" cy="38" r="1.5" fill={colors.gold} opacity="0.6" animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 1.5 }} />
          </svg>
        </motion.div>

        {/* Luxury Text Branding with Advanced Effects */}
        <div className="flex flex-col gap-1 leading-none">
          <div className="flex items-baseline gap-2">
            <motion.span
              className="text-lg font-black tracking-tight"
              style={{
                background: `linear-gradient(135deg, ${colors.orange} 0%, ${colors.blue} 50%, ${colors.red} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              whileHover={{ scale: 1.08, textShadow: `0 0 8px ${colors.blue}` }}
              animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
            >
              ARCHON-Y
            </motion.span>
            <motion.span
              className="text-xs font-bold tracking-widest"
              style={{
                background: `linear-gradient(90deg, ${colors.orange}, ${colors.gold})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              whileHover={{ scale: 1.1 }}
            >
              FLEET
            </motion.span>
          </div>
          <motion.span
            className="text-xs font-bold tracking-widest"
            style={{
              background: `linear-gradient(90deg, ${colors.blue} 0%, ${colors.red} 50%, ${colors.gold} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
          >
            INTELLIGENT FLEET MANAGEMENT
          </motion.span>
        </div>
      </motion.div>
    )
  }

  // Compact icon only - luxury version with 3D effects
  if (variant === 'compact') {
    return (
      <motion.div
        className={cn("relative w-14 h-14 flex items-center justify-center", className)}
        whileHover="hover"
        initial="idle"
        variants={iconVariants}
        style={{ perspective: 1000 }}
      >
        {/* Premium multi-layer glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${colors.blue}40, transparent)` }}
          initial={glowPulseAnimation.initial}
          animate={glowPulseAnimation.animate}
          transition={glowPulseAnimation.transition}
        />
        <motion.div
          className="absolute inset-1 rounded-full"
          style={{ background: `radial-gradient(circle, ${colors.red}25, transparent)` }}
          animate={{ scale: [0.95, 1.1, 0.95] }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
        />

        <svg
          viewBox="0 0 48 48"
          className="w-full h-full relative z-10"
          style={{
            filter: 'drop-shadow(0 8px 20px rgba(65, 178, 227, 0.5))',
          }}
        >
          <defs>
            <linearGradient id="compactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.orange} />
              <stop offset="40%" stopColor={colors.blue} />
              <stop offset="70%" stopColor={colors.red} />
              <stop offset="100%" stopColor={colors.gold} />
            </linearGradient>
            <linearGradient id="compactReverse" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.blue} />
              <stop offset="100%" stopColor={colors.orange} />
            </linearGradient>
            <filter id="compactGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Outer decorative ring */}
          <motion.circle cx="24" cy="24" r="20" fill="none" stroke={'rgba(255,255,255,0.3)'} strokeWidth="0.7" opacity="0.3" animate={reverseRotation.animate} transition={reverseRotation.transition} />

          {/* Main animated gradient ring */}
          <motion.circle
            cx="24"
            cy="24"
            r="19"
            fill="none"
            stroke="url(#compactGradient)"
            strokeWidth="1.3"
            initial={{ strokeDasharray: '119.4 119.4', strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -119.4 }}
            transition={{ duration: 13, repeat: Infinity, ease: 'linear' }}
            opacity="0.95"
          />

          {/* Inner accent ring */}
          <motion.circle cx="24" cy="24" r="14" fill="none" stroke="url(#compactReverse)" strokeWidth="0.9" animate={coreRotation.animate} transition={coreRotation.transition} opacity="0.7" />

          {/* Core luxury symbol */}
          <g fill="url(#compactGradient)" filter="url(#compactGlow)">
            <polygon points="24,10 30,22 18,22" />
            <rect x="16" y="26" width="16" height="2" rx="1" />
            <path d="M 18 23 L 17 32 L 19 32 L 20 23 Z" />
            <path d="M 30 23 L 31 32 L 29 32 L 28 23 Z" />
          </g>

          {/* Corner flourishes */}
          <motion.circle cx="10" cy="10" r="1.2" fill={colors.blue} opacity="0.5" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }} />
          <motion.circle cx="38" cy="38" r="1.2" fill={colors.gold} opacity="0.5" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 1.5 }} />
        </svg>
      </motion.div>
    )
  }

  // Icon only - luxury version
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
          style={{ background: `radial-gradient(circle, ${colors.blue}30, transparent)` }}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />

        <svg
          viewBox="0 0 48 48"
          className="w-full h-full relative z-10"
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(65, 178, 227, 0.4))'
          }}
        >
          <defs>
            <linearGradient id="iconLuxury" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.orange} />
              <stop offset="50%" stopColor={colors.blue} />
              <stop offset="100%" stopColor={colors.red} />
            </linearGradient>
          </defs>

          <motion.circle cx="24" cy="24" r="16" fill="none" stroke={'rgba(255,255,255,0.25)'} strokeWidth="0.6" opacity="0.25" animate={reverseRotation.animate} transition={reverseRotation.transition} />
          <motion.circle
            cx="24"
            cy="24"
            r="15"
            fill="none"
            stroke="url(#iconLuxury)"
            strokeWidth="1"
            initial={{ strokeDasharray: '94.2 94.2', strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -94.2 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />

          <g fill="url(#iconLuxury)">
            <polygon points="24,10 29,20 19,20" />
            <rect x="17" y="24" width="14" height="1.5" rx="0.75" />
            <rect x="18" y="21" width="1.2" height="5" rx="0.6" />
            <rect x="29.8" y="21" width="1.2" height="5" rx="0.6" />
          </g>
        </svg>
      </motion.div>
    )
  }

  // Text only - luxury version
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline gap-2">
        <motion.span
          className="text-2xl font-black tracking-tight"
          style={{
            background: `linear-gradient(135deg, ${colors.orange} 0%, ${colors.blue} 50%, ${colors.red} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          whileHover={{ scale: 1.08 }}
          animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
          transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
        >
          ARCHON-Y
        </motion.span>
        <motion.span
          className="text-sm font-bold tracking-widest"
          style={{
            background: `linear-gradient(90deg, ${colors.orange}, ${colors.gold})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          FLEET
        </motion.span>
      </div>
      <motion.span
        className="text-sm font-bold tracking-widest"
        style={{
          background: `linear-gradient(90deg, ${colors.blue} 0%, ${colors.red} 50%, ${colors.gold} 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
      >
        INTELLIGENT FLEET MANAGEMENT
      </motion.span>
    </div>
  )
}
