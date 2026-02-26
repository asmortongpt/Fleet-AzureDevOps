/**
 * OnboardingComplete — Step 4 (final) of Onboarding Wizard
 *
 * Animated checkmark, keyboard-shortcut tips, and "Get Started" CTA.
 */

interface OnboardingCompleteProps {
  onComplete: () => void
}

const shortcuts = [
  { keys: '\u2318K', description: 'Search anything' },
  { keys: '1-5', description: 'Switch between hubs' },
  { keys: '?', description: 'View all shortcuts' },
] as const

export function OnboardingComplete({ onComplete }: OnboardingCompleteProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Animated checkmark */}
      <div className="mb-6">
        <svg
          className="checkmark-circle"
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="#00CCFE"
            strokeWidth="3"
            fill="none"
            className="animate-checkmark-circle"
          />
          <path
            d="M24 42 L35 53 L56 28"
            stroke="#00CCFE"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="animate-checkmark-tick"
          />
        </svg>
      </div>

      <h2
        className="text-white font-bold mb-2"
        style={{ fontFamily: '"Cinzel", Georgia, serif', fontSize: '28px' }}
      >
        You're all set!
      </h2>
      <p
        className="text-[rgba(255,255,255,0.65)] mb-8 max-w-xs"
        style={{ fontFamily: '"Montserrat", sans-serif' }}
      >
        Your dashboard has been customized based on your preferences.
      </p>

      {/* Keyboard shortcut tips */}
      <div className="w-full space-y-2 mb-8">
        {shortcuts.map((s) => (
          <div
            key={s.keys}
            className="flex items-center gap-3 bg-[#1A0648] rounded-lg px-4 py-2"
          >
            <kbd
              className="bg-[#0D0320] px-2 py-0.5 rounded text-[#00CCFE] font-mono text-sm inline-block min-w-[40px] text-center"
            >
              {s.keys}
            </kbd>
            <span
              className="text-[rgba(255,255,255,0.65)] text-sm"
              style={{ fontFamily: '"Montserrat", sans-serif' }}
            >
              {s.description}
            </span>
          </div>
        ))}
      </div>

      {/* Get Started CTA */}
      <button
        type="button"
        onClick={onComplete}
        className="bg-[#1F3076] hover:bg-[#2A1878] text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
        style={{ fontFamily: '"Montserrat", sans-serif' }}
      >
        Get Started
      </button>

      {/* CSS-only animations via <style> tag */}
      <style>{`
        .animate-checkmark-circle {
          stroke-dasharray: 226;
          stroke-dashoffset: 226;
          animation: checkmark-circle-draw 0.6s ease-out 0.2s forwards;
        }
        .animate-checkmark-tick {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: checkmark-tick-draw 0.4s ease-out 0.7s forwards;
        }
        .checkmark-circle {
          animation: checkmark-scale 0.4s ease-out 0.1s both;
        }
        @keyframes checkmark-circle-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes checkmark-tick-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes checkmark-scale {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default OnboardingComplete
