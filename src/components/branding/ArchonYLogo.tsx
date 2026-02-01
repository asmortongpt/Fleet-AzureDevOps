/**
 * Official ArchonY Product Logo
 * Based on ADELE Brand Guidelines - January 26, 2026
 *
 * Design Philosophy:
 * - Technology-forward font with flowing curve element
 * - The curve represents "intelligent pivot" - where information guides direction
 * - Clean, professional, built to stand on its own
 *
 * From Greek "archon" (pronounced "ar-kan") meaning "presiding officer" or "ruler"
 * Tagline: "INTELLIGENT PERFORMANCE"
 */

import { FC } from 'react'

interface ArchonYLogoProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show tagline below logo */
  showTagline?: boolean
  /** Color variant - light for dark backgrounds, dark for light backgrounds */
  variant?: 'light' | 'dark'
  /** Additional CSS classes */
  className?: string
}

export const ArchonYLogo: FC<ArchonYLogoProps> = ({
  size = 'md',
  showTagline = true,
  variant = 'light',
  className = ''
}) => {
  const sizes = {
    sm: {
      wordmark: 'text-3xl',
      tagline: 'text-[8px]',
      curve: 'w-32 h-6',
      spacing: 'mt-1 mb-0.5'
    },
    md: {
      wordmark: 'text-5xl',
      tagline: 'text-[10px]',
      curve: 'w-48 h-10',
      spacing: 'mt-2 mb-1'
    },
    lg: {
      wordmark: 'text-7xl',
      tagline: 'text-xs',
      curve: 'w-64 h-12',
      spacing: 'mt-3 mb-1.5'
    }
  }

  const s = sizes[size]
  const color = variant === 'light' ? '#FFFFFF' : '#1A0B2E'

  return (
    <div className={`flex flex-col items-start ${className}`}>
      {/* ARCHON·Y Wordmark */}
      <div
        className={`${s.wordmark} font-bold tracking-[0.05em]`}
        style={{
          fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
          fontWeight: 700,
          color: color,
          letterSpacing: '0.05em'
        }}
      >
        ARCHON·Y
      </div>

      {/* Flowing Curve - Intelligent Pivot */}
      <svg
        className={`${s.curve} ${s.spacing}`}
        viewBox="0 0 200 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginLeft: '-4px' }}
      >
        <path
          d="M 5 20 Q 50 5, 100 20 T 195 20"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
      </svg>

      {/* Tagline */}
      {showTagline && (
        <div
          className={`${s.tagline} font-semibold uppercase tracking-[0.3em]`}
          style={{
            fontFamily: '"Inter", -apple-system, sans-serif',
            fontWeight: 600,
            color: color,
            letterSpacing: '0.3em',
            opacity: 0.95
          }}
        >
          INTELLIGENT PERFORMANCE
        </div>
      )}
    </div>
  )
}

export default ArchonYLogo
