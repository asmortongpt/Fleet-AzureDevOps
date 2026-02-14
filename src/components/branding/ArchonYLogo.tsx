/**
 * ArchonY Logo - Exact implementation from CTA Branding Guide (Pages 12-15)
 *
 * Brand: ArchonY - "INTELLIGENT PERFORMANCE"
 * Design: Technology-forward font with flowing swoosh/pivot symbol
 * Philosophy: "Simplicity rather than symbols, allowing meaning, performance, and presence to do the work"
 *
 * Color Palette:
 * - Primary: MIDNIGHT (theme background)
 * - Accent: Gradient bar (Golden Hour → Noon)
 */

interface ArchonYLogoProps {
  variant?: 'full' | 'compact' | 'icon'
  className?: string
  showTagline?: boolean
}

export function ArchonYLogo({
  variant = 'full',
  className = '',
  showTagline = false
}: ArchonYLogoProps) {

  // Full horizontal logo with tagline
  if (variant === 'full') {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex items-center gap-2">
          {/* ArchonY wordmark with flowing pivot symbol */}
          <svg
            viewBox="0 0 180 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-auto"
          >
            {/* "ArchonY" text in technology-forward font */}
            <text
              x="0"
              y="28"
              fontFamily="'Inter', 'SF Pro Display', system-ui, sans-serif"
              fontSize="28"
              fontWeight="700"
              letterSpacing="-0.02em"
              fill="currentColor"
              className="text-white"
            >
              ArchonY
            </text>

            {/* Flowing swoosh/pivot symbol integrated with the "Y" */}
            <path
              d="M 155 8 Q 165 8, 170 15 Q 175 22, 170 28 Q 165 34, 155 34 Q 150 34, 147 30"
              stroke="url(#archony-gradient)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              className="opacity-90"
            />

            {/* Gradient definition for the swoosh */}
            <defs>
              <linearGradient id="archony-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--chart-3))" />
                <stop offset="50%" stopColor="hsl(var(--chart-5))" />
                <stop offset="100%" stopColor="hsl(var(--chart-6))" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Gradient accent bar below logo */}
        <div
          className="h-[3px] w-full rounded-full mt-1"
          style={{ background: 'linear-gradient(90deg, hsl(var(--chart-3)) 0%, hsl(var(--chart-5)) 50%, hsl(var(--chart-6)) 100%)' }}
        />

        {/* Optional tagline */}
        {showTagline && (
          <div className="mt-1 text-[9px] font-semibold tracking-[0.2em] uppercase text-white/60">
            INTELLIGENT PERFORMANCE
          </div>
        )}
      </div>
    )
  }

  // Compact logo for sidebar
  if (variant === 'compact') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="text-lg font-bold tracking-tight text-white">
          ArchonY
        </div>
        <div
          className="w-full h-[2px] rounded-full mt-0.5"
          style={{ background: 'linear-gradient(90deg, hsl(var(--chart-3)) 0%, hsl(var(--chart-6)) 100%)' }}
        />
      </div>
    )
  }

  // Icon/square variant for app icons and small spaces
  if (variant === 'icon') {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div className="text-xs font-extrabold tracking-wide text-white">
          AY
        </div>
        <div
          className="w-5 h-[2px] rounded-full mt-0.5"
          style={{ background: 'linear-gradient(90deg, hsl(var(--chart-3)) 0%, hsl(var(--chart-6)) 100%)' }}
        />
      </div>
    )
  }

  return null
}
