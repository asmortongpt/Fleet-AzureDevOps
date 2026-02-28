/**
 * OnboardingWizard — First-Run Setup for Fleet Command
 *
 * Full-screen overlay with a 4-step flow:
 *   1. RoleSelection
 *   2. DashboardPreferences
 *   3. NotificationPreferences
 *   4. OnboardingComplete
 *
 * Persists completion to localStorage so the wizard only appears once.
 * Matches the ArchonY brand glass-morphism styling from the Login page.
 */
import { useState, useCallback, useMemo } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { RoleSelection } from '@/components/onboarding/RoleSelection'
import { DashboardPreferences } from '@/components/onboarding/DashboardPreferences'
import {
  NotificationPreferences,
  type NotificationPrefs,
} from '@/components/onboarding/NotificationPreferences'
import { OnboardingComplete } from '@/components/onboarding/OnboardingComplete'

interface OnboardingWizardProps {
  onComplete: () => void
}

const STEP_COUNT = 4

/* ------------------------------------------------------------------ */
/*  Default widget sets keyed by role                                  */
/* ------------------------------------------------------------------ */
function getDefaultWidgets(role: string | null): string[] {
  const base = ['fleet_health_score', 'active_alerts', 'cost_trend', 'recent_activity']
  switch (role) {
    case 'fleet_manager':
      return [...base, 'live_map_preview']
    case 'maintenance':
      return [...base, 'maintenance_queue']
    case 'safety_officer':
      return [...base, 'compliance_status']
    default:
      return base
  }
}

const defaultNotificationPrefs: NotificationPrefs = {
  alertTiers: { critical: true, warning: true, info: false },
  digestTiming: 'realtime',
  quietHours: { enabled: false, start: '22:00', end: '07:00' },
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [widgets, setWidgets] = useState<string[]>(() => getDefaultWidgets(null))
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(defaultNotificationPrefs)

  /* When the role changes, reset widgets to sensible defaults */
  const handleRoleSelect = useCallback((role: string) => {
    setSelectedRole(role)
    setWidgets(getDefaultWidgets(role))
  }, [])

  const handleWidgetToggle = useCallback((id: string) => {
    setWidgets((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    )
  }, [])

  /* Final completion — persist to localStorage */
  const handleComplete = useCallback(() => {
    localStorage.setItem('fleet_onboarding_completed', 'true')
    localStorage.setItem(
      'fleet_onboarding_preferences',
      JSON.stringify({ role: selectedRole, widgets, notifications: notificationPrefs })
    )
    onComplete()
  }, [selectedRole, widgets, notificationPrefs, onComplete])

  const handleSkip = useCallback(() => {
    localStorage.setItem('fleet_onboarding_completed', 'true')
    onComplete()
  }, [onComplete])

  /* Disable "Next" on step 0 until a role is picked */
  const canAdvance = useMemo(() => {
    if (step === 0) return selectedRole !== null
    return true
  }, [step, selectedRole])

  const stepLabels = ['Role', 'Dashboard', 'Notifications', 'Complete']

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0a0a0a]">
      {/* Background effects (same as Login) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(0,204,254,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(31,48,118,0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,204,254,0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-[560px] rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col"
        style={{ background: 'rgba(17,17,17,0.85)', backdropFilter: 'blur(20px)' }}
      >
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-3 pt-8 pb-2">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'h-2.5 w-2.5 rounded-full transition-colors duration-300',
                  i === step ? 'bg-[#00CCFE]' : 'bg-[#1a1a1a]',
                ].join(' ')}
              />
              <span
                className={[
                  'text-[10px] transition-colors duration-300',
                  i === step
                    ? 'text-[rgba(255,255,255,0.65)]'
                    : 'text-[rgba(255,255,255,0.25)]',
                ].join(' ')}
                style={{ fontFamily: '"Montserrat", sans-serif' }}
              >
                {stepLabels[i]}
              </span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="px-10 py-6 flex-1 min-h-0">
          {step === 0 && (
            <RoleSelection selectedRole={selectedRole} onSelect={handleRoleSelect} />
          )}
          {step === 1 && (
            <DashboardPreferences
              selectedRole={selectedRole}
              widgets={widgets}
              onToggle={handleWidgetToggle}
            />
          )}
          {step === 2 && (
            <NotificationPreferences
              preferences={notificationPrefs}
              onChange={setNotificationPrefs}
            />
          )}
          {step === 3 && <OnboardingComplete onComplete={handleComplete} />}
        </div>

        {/* Navigation footer (hidden on final step — it has its own CTA) */}
        {step < STEP_COUNT - 1 && (
          <div className="px-10 pb-8 flex items-center justify-between">
            {/* Back / Skip */}
            <div>
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-1.5 border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.65)] hover:text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  style={{ fontFamily: '"Montserrat", sans-serif' }}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-sm text-[rgba(255,255,255,0.40)] hover:text-[rgba(255,255,255,0.65)] transition-colors"
                  style={{ fontFamily: '"Montserrat", sans-serif' }}
                >
                  Skip Setup
                </button>
              )}
            </div>

            {/* Next */}
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}
              className={[
                'flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold transition-colors',
                canAdvance
                  ? 'bg-[#242424] hover:bg-[#242424] text-white'
                  : 'bg-[#242424]/40 text-white/30 cursor-not-allowed',
              ].join(' ')}
              style={{ fontFamily: '"Montserrat", sans-serif' }}
            >
              Next
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Skip link on final step */}
        {step === STEP_COUNT - 1 && (
          <div className="px-10 pb-8 text-center">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-[rgba(255,255,255,0.40)] hover:text-[rgba(255,255,255,0.65)] transition-colors"
              style={{ fontFamily: '"Montserrat", sans-serif' }}
            >
              Skip Setup
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default OnboardingWizard
