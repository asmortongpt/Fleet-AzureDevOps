/**
 * DashboardPreferences — Step 2 of Onboarding Wizard
 *
 * Toggleable widget list. Defaults change based on the role
 * selected in step 1.
 */

interface DashboardPreferencesProps {
  selectedRole: string | null
  widgets: string[]
  onToggle: (widget: string) => void
}

const allWidgets = [
  { id: 'fleet_health_score', label: 'Fleet Health Score', description: 'Overall health rating for your fleet' },
  { id: 'active_alerts', label: 'Active Alerts', description: 'Real-time alerts requiring attention' },
  { id: 'cost_trend', label: 'Cost Trend', description: 'Monthly cost breakdown and trend line' },
  { id: 'live_map_preview', label: 'Live Map Preview', description: 'Mini map showing vehicle positions' },
  { id: 'recent_activity', label: 'Recent Activity', description: 'Latest actions across the platform' },
  { id: 'driver_leaderboard', label: 'Driver Leaderboard', description: 'Top performing drivers this period' },
  { id: 'maintenance_queue', label: 'Maintenance Queue', description: 'Upcoming and overdue work orders' },
  { id: 'compliance_status', label: 'Compliance Status', description: 'Regulatory compliance overview' },
] as const

export function DashboardPreferences({ widgets, onToggle }: DashboardPreferencesProps) {
  return (
    <div>
      <h2
        className="text-2xl font-bold text-white mb-2"
        style={{ fontFamily: '"Cinzel", Georgia, serif', fontSize: '24px' }}
      >
        Customize your dashboard
      </h2>
      <p
        className="text-[rgba(255,255,255,0.65)] mb-6"
        style={{ fontFamily: '"Montserrat", sans-serif' }}
      >
        Choose which widgets appear on your overview
      </p>

      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {allWidgets.map((w) => {
          const checked = widgets.includes(w.id)
          return (
            <label
              key={w.id}
              className="flex items-center gap-3 bg-[#1A0648] border border-[rgba(0,204,254,0.08)] rounded-lg p-3 cursor-pointer hover:border-[rgba(0,204,254,0.25)] transition-colors"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(w.id)}
                className="h-4 w-4 rounded border-[rgba(0,204,254,0.3)] bg-[#0D0320] accent-[#00CCFE] flex-shrink-0"
              />
              <div className="min-w-0">
                <span
                  className="block text-white text-sm font-medium"
                  style={{ fontFamily: '"Montserrat", sans-serif' }}
                >
                  {w.label}
                </span>
                <span
                  className="block text-[rgba(255,255,255,0.40)] text-xs mt-0.5"
                  style={{ fontFamily: '"Montserrat", sans-serif' }}
                >
                  {w.description}
                </span>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default DashboardPreferences
