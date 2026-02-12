/**
 * CTA-Branded Header Component
 * Official Capital Technology Alliance branding with ArchonY logo
 *
 * Features:
 * - ArchonY logo with animated swoosh
 * - Official CTA color palette
 * - Responsive design
 * - Reusable across all pages
 */

import { FC } from 'react'

interface CTAHeaderProps {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
  className?: string
}

export const CTAHeader: FC<CTAHeaderProps> = ({
  size = 'md',
  showTagline = true,
  className = ''
}) => {
  const sizes = {
    sm: { logo: 'text-2xl', tagline: 'text-[8px]', swoosh: 'w-12 h-12', container: 'h-16' },
    md: { logo: 'text-4xl', tagline: 'text-[10px]', swoosh: 'w-20 h-20', container: 'h-24' },
    lg: { logo: 'text-5xl', tagline: 'text-xs', swoosh: 'w-28 h-28', container: 'h-32' }
  }

  const s = sizes[size]

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* ArchonY Logo with Swoosh */}
      <div className={`relative ${s.container} flex flex-col items-center justify-center mb-2`}>
        {/* Curved Swoosh Element - CTA Official Gradient */}
        <svg
          className={`absolute top-0 left-1/2 -translate-x-1/2 ${s.swoosh}`}
          viewBox="0 0 80 80"
          style={{ filter: 'drop-shadow(0 4px 8px rgba(253, 184, 19, 0.5))' }}
        >
          <defs>
            <linearGradient id="ctaGradientHeader" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#F0A000' }} />
              <stop offset="100%" style={{ stopColor: '#DD3903' }} />
            </linearGradient>
          </defs>
          <path
            d="M 10 50 Q 25 20, 40 40 T 70 30"
            stroke="url(#ctaGradientHeader)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            className="animate-[dashAnimation_2s_ease-in-out_infinite]"
            style={{
              strokeDasharray: '1000',
              strokeDashoffset: '0'
            }}
          />
        </svg>

        {/* ArchonY Typography */}
        <div className="relative z-10 mt-8">
          <div
            className={`${s.logo} font-bold tracking-wider mb-0.5`}
            style={{
              fontFamily: '"Inter", -apple-system, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#ffffff',
              textShadow: '0 2px 8px rgba(0, 212, 255, 0.6), 0 4px 12px rgba(253, 184, 19, 0.4)',
              background: 'linear-gradient(90deg, #ffffff 0%, #41B2E3 50%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            ARCHON·Y
          </div>
          {showTagline && (
            <div
              className={`${s.tagline} font-semibold uppercase tracking-[0.2em] text-center`}
              style={{
                color: '#41B2E3',
                textShadow: '0 0 10px rgba(0, 212, 255, 0.8)',
                fontWeight: 600
              }}
            >
              INTELLIGENT PERFORMANCE
            </div>
          )}
        </div>
      </div>

      {/* Official CTA Gradient Bar */}
      <div
        className="w-16 h-0.5 rounded-full"
        style={{
          background: 'linear-gradient(90deg, #F0A000 0%, #DD3903 100%)',
          boxShadow: '0 2px 8px rgba(253, 184, 19, 0.6)'
        }}
      />
    </div>
  )
}

export default CTAHeader
