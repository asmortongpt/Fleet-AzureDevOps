/**
 * ARCHONY Fleet Logo
 * Official logo design with distinctive swoosh and professional branding
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
  // Full logo with official design
  if (variant === 'full') {
    return (
      <motion.svg
        viewBox="0 0 600 80"
        className={cn("w-full h-full", className)}
        style={{ maxWidth: '600px' }}
        preserveAspectRatio="xMidYMid meet"
        initial={showAnimation ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Left arrow/swoosh element */}
        <path
          d="M 20 40 L 45 20 L 42 32 L 58 18"
          fill="none"
          stroke="#1D1D1D"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Main ARCHONY text */}
        <text
          x="90"
          y="55"
          fontFamily="'Arial', 'Helvetica', sans-serif"
          fontSize="48"
          fontWeight="900"
          fill="#1D1D1D"
          letterSpacing="2"
        >
          ARCHONY
        </text>

        {/* Decorative dot */}
        <circle cx="500" cy="48" r="3" fill="#1D1D1D" />

        {/* Main swoosh under text */}
        <path
          d="M 60 62 Q 250 70 520 52"
          fill="none"
          stroke="#1D1D1D"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Tagline */}
        <text
          x="300"
          y="78"
          fontFamily="'Arial', 'Helvetica', sans-serif"
          fontSize="9"
          fontWeight="400"
          fill="#666"
          textAnchor="middle"
          letterSpacing="1.5"
        >
          INTELLIGENT PERFORMANCE
        </text>
      </motion.svg>
    )
  }

  // Compact version
  if (variant === 'compact') {
    return (
      <motion.svg
        viewBox="0 0 450 100"
        className={cn("w-full h-auto", className)}
        style={{ maxWidth: '450px' }}
        initial={showAnimation ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* ARCHONY text - compact */}
        <text
          x="75"
          y="55"
          fontFamily="'Arial', 'Helvetica', sans-serif"
          fontSize="40"
          fontWeight="900"
          fill="#1D1D1D"
          letterSpacing="2"
        >
          ARCHONY
        </text>

        {/* Small swoosh */}
        <path
          d="M 50 65 Q 200 75 400 50"
          fill="none"
          stroke="#1D1D1D"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Tagline - smaller */}
        <text
          x="225"
          y="90"
          fontFamily="'Arial', 'Helvetica', sans-serif"
          fontSize="10"
          fontWeight="400"
          fill="#666"
          textAnchor="middle"
          letterSpacing="1.5"
        >
          INTELLIGENT PERFORMANCE
        </text>
      </motion.svg>
    )
  }

  // Icon only - simple "A"
  if (variant === 'icon') {
    return (
      <motion.div
        className={cn("w-10 h-10 flex items-center justify-center font-black text-lg text-white bg-black rounded", className)}
        initial={showAnimation ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        A
      </motion.div>
    )
  }

  // Text only variant
  return (
    <motion.div
      className={cn("flex flex-col gap-1", className)}
      initial={showAnimation ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <span className="text-2xl font-black tracking-tight text-[#1D1D1D]">
        ARCHONY
      </span>
      <span className="text-xs font-light tracking-wider text-[#666]">
        INTELLIGENT PERFORMANCE
      </span>
    </motion.div>
  )
}
