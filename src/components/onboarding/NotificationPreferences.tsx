/**
 * NotificationPreferences — Step 3 of Onboarding Wizard
 *
 * Alert tier toggles, digest timing, and quiet-hours configuration.
 */

export interface NotificationPrefs {
  alertTiers: {
    critical: boolean
    warning: boolean
    info: boolean
  }
  digestTiming: 'realtime' | 'hourly' | 'daily'
  quietHours: {
    enabled: boolean
    start: string // e.g. "22:00"
    end: string   // e.g. "07:00"
  }
}

interface NotificationPreferencesProps {
  preferences: NotificationPrefs
  onChange: (prefs: NotificationPrefs) => void
}

/* ------------------------------------------------------------------ */
/*  Toggle switch — pure CSS, no external deps                        */
/* ------------------------------------------------------------------ */
function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
        checked ? 'bg-[#00CCFE]' : 'bg-[#1a1a1a]',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Radio dot                                                         */
/* ------------------------------------------------------------------ */
function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={[
        'inline-flex h-4 w-4 rounded-full border-2 items-center justify-center flex-shrink-0',
        selected ? 'border-[#00CCFE]' : 'border-[rgba(255,255,255,0.2)]',
      ].join(' ')}
    >
      {selected && <span className="h-2 w-2 rounded-full bg-[#00CCFE]" />}
    </span>
  )
}

export function NotificationPreferences({ preferences, onChange }: NotificationPreferencesProps) {
  const update = (patch: Partial<NotificationPrefs>) =>
    onChange({ ...preferences, ...patch })

  const updateAlertTier = (tier: keyof NotificationPrefs['alertTiers'], value: boolean) =>
    update({ alertTiers: { ...preferences.alertTiers, [tier]: value } })

  const updateQuietHours = (patch: Partial<NotificationPrefs['quietHours']>) =>
    update({ quietHours: { ...preferences.quietHours, ...patch } })

  return (
    <div>
      <h2
        className="text-2xl font-bold text-white mb-2"
        style={{ fontFamily: '"Cinzel", Georgia, serif', fontSize: '24px' }}
      >
        Notification preferences
      </h2>
      <p
        className="text-[rgba(255,255,255,0.65)] mb-6"
        style={{ fontFamily: '"Montserrat", sans-serif' }}
      >
        Control when and how you receive alerts
      </p>

      <div className="space-y-5 max-h-[360px] overflow-y-auto pr-1">
        {/* ---------- Alert Tiers ---------- */}
        <div>
          <h3
            className="text-white font-semibold mb-3"
            style={{ fontFamily: '"Montserrat", sans-serif', fontSize: '16px', fontWeight: 600 }}
          >
            Alert Tiers
          </h3>
          <div className="space-y-2">
            {/* Critical — always on */}
            <div className="flex items-center justify-between bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
              <div>
                <span className="text-white text-sm font-medium" style={{ fontFamily: '"Montserrat", sans-serif' }}>
                  Critical
                </span>
                <span className="block text-[rgba(255,255,255,0.40)] text-xs mt-0.5" style={{ fontFamily: '"Montserrat", sans-serif' }}>
                  Always enabled for safety
                </span>
              </div>
              <Toggle checked disabled onChange={() => {}} />
            </div>

            {/* Warning */}
            <div className="flex items-center justify-between bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
              <span className="text-white text-sm font-medium" style={{ fontFamily: '"Montserrat", sans-serif' }}>
                Warning
              </span>
              <Toggle
                checked={preferences.alertTiers.warning}
                onChange={(v) => updateAlertTier('warning', v)}
              />
            </div>

            {/* Info */}
            <div className="flex items-center justify-between bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
              <span className="text-white text-sm font-medium" style={{ fontFamily: '"Montserrat", sans-serif' }}>
                Info
              </span>
              <Toggle
                checked={preferences.alertTiers.info}
                onChange={(v) => updateAlertTier('info', v)}
              />
            </div>
          </div>
        </div>

        {/* ---------- Digest Timing ---------- */}
        <div>
          <h3
            className="text-white font-semibold mb-3"
            style={{ fontFamily: '"Montserrat", sans-serif', fontSize: '16px', fontWeight: 600 }}
          >
            Digest Timing
          </h3>
          <div className="space-y-2">
            {(
              [
                { value: 'realtime', label: 'Real-time' },
                { value: 'hourly', label: 'Hourly digest' },
                { value: 'daily', label: 'Daily digest' },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-lg p-3 cursor-pointer hover:border-[rgba(255,255,255,0.15)] transition-colors"
              >
                <RadioDot selected={preferences.digestTiming === opt.value} />
                <input
                  type="radio"
                  name="digest"
                  value={opt.value}
                  checked={preferences.digestTiming === opt.value}
                  onChange={() => update({ digestTiming: opt.value })}
                  className="sr-only"
                />
                <span className="text-white text-sm font-medium" style={{ fontFamily: '"Montserrat", sans-serif' }}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* ---------- Quiet Hours ---------- */}
        <div>
          <h3
            className="text-white font-semibold mb-3"
            style={{ fontFamily: '"Montserrat", sans-serif', fontSize: '16px', fontWeight: 600 }}
          >
            Quiet Hours
          </h3>
          <div className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium" style={{ fontFamily: '"Montserrat", sans-serif' }}>
                Enable quiet hours
              </span>
              <Toggle
                checked={preferences.quietHours.enabled}
                onChange={(v) => updateQuietHours({ enabled: v })}
              />
            </div>
            {preferences.quietHours.enabled && (
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={preferences.quietHours.start}
                  onChange={(e) => updateQuietHours({ start: e.target.value })}
                  className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#00CCFE]"
                />
                <span className="text-[rgba(255,255,255,0.40)] text-sm">to</span>
                <input
                  type="time"
                  value={preferences.quietHours.end}
                  onChange={(e) => updateQuietHours({ end: e.target.value })}
                  className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#00CCFE]"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationPreferences
