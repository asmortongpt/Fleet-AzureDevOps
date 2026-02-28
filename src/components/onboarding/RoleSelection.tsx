/**
 * RoleSelection — Step 1 of Onboarding Wizard
 *
 * Lets the user pick their primary role so we can pre-configure
 * dashboard widgets and notification defaults.
 */
import { Map, Radio, Wrench, ShieldCheck, BarChart3, Settings } from 'lucide-react'

interface RoleSelectionProps {
  selectedRole: string | null
  onSelect: (role: string) => void
}

const roles = [
  {
    id: 'fleet_manager',
    label: 'Fleet Manager',
    description: 'Vehicle tracking, route optimization',
    icon: Map,
  },
  {
    id: 'dispatcher',
    label: 'Dispatcher',
    description: 'Assignment, scheduling, communication',
    icon: Radio,
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    description: 'Work orders, inspections, parts',
    icon: Wrench,
  },
  {
    id: 'safety_officer',
    label: 'Safety Officer',
    description: 'Compliance, incidents, training',
    icon: ShieldCheck,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Reports, costs, performance',
    icon: BarChart3,
  },
  {
    id: 'administrator',
    label: 'Administrator',
    description: 'Users, integrations, configuration',
    icon: Settings,
  },
] as const

export function RoleSelection({ selectedRole, onSelect }: RoleSelectionProps) {
  return (
    <div>
      <h2
        className="text-2xl font-bold text-white mb-2"
        style={{ fontFamily: '"Cinzel", Georgia, serif', fontSize: '24px' }}
      >
        What's your role?
      </h2>
      <p
        className="text-[rgba(255,255,255,0.65)] mb-6"
        style={{ fontFamily: '"Montserrat", sans-serif' }}
      >
        We'll customize your dashboard based on your workflow
      </p>

      <div className="grid grid-cols-2 gap-3">
        {roles.map((role) => {
          const Icon = role.icon
          const isSelected = selectedRole === role.id
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelect(role.id)}
              className={[
                'flex flex-col items-start rounded-xl p-4 cursor-pointer transition-all text-left',
                'bg-[#111111] border',
                isSelected
                  ? 'border-[#00CCFE] bg-[#1a1a1a] ring-1 ring-[#00CCFE]/30'
                  : 'border-[rgba(255,255,255,0.06)] hover:border-[#00CCFE] hover:bg-[#1a1a1a]',
              ].join(' ')}
            >
              <Icon className="text-[#00CCFE] mb-2" size={24} />
              <span
                className="text-white font-semibold text-sm"
                style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 600 }}
              >
                {role.label}
              </span>
              <span
                className="text-[rgba(255,255,255,0.40)] mt-0.5"
                style={{ fontFamily: '"Montserrat", sans-serif', fontSize: '13px' }}
              >
                {role.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default RoleSelection
