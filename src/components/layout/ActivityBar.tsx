/**
 * ActivityBar - Bottom bar showing real-time event ticker
 *
 * 48px height, collapsible, shows latest fleet events.
 * ArchonY brand styling.
 */
import {
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronUp,
  ChevronDown,
  MapPin,
  Wrench,
  Fuel,
  Bell,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface ActivityEvent {
  id: string
  icon: ReactNode
  text: string
  timestamp: string
  severity: 'info' | 'warning' | 'success' | 'critical'
}

const severityColors: Record<string, string> = {
  info: 'text-[#00CCFE]',
  warning: 'text-[#FDC016]',
  success: 'text-emerald-400',
  critical: 'text-[#FF4300]',
}

const severityBgColors: Record<string, string> = {
  info: 'bg-[#00CCFE]/10',
  warning: 'bg-[#FDC016]/10',
  success: 'bg-emerald-400/10',
  critical: 'bg-[#FF4300]/10',
}

// Placeholder events — in production these come from a WebSocket or context
const placeholderEvents: ActivityEvent[] = [
  {
    id: '1',
    icon: <MapPin className="w-3 h-3" />,
    text: 'Vehicle FL-2847 arrived at Depot North',
    timestamp: '2m ago',
    severity: 'info',
  },
  {
    id: '2',
    icon: <AlertTriangle className="w-3 h-3" />,
    text: 'Driver J. Martinez exceeded hours limit',
    timestamp: '5m ago',
    severity: 'warning',
  },
  {
    id: '3',
    icon: <Wrench className="w-3 h-3" />,
    text: 'WO-4021 completed — Brake inspection passed',
    timestamp: '8m ago',
    severity: 'success',
  },
  {
    id: '4',
    icon: <Fuel className="w-3 h-3" />,
    text: 'Low fuel alert: Vehicle FL-1129 at 12%',
    timestamp: '12m ago',
    severity: 'critical',
  },
  {
    id: '5',
    icon: <Bell className="w-3 h-3" />,
    text: 'Policy update: Annual inspection deadline approaching for 3 vehicles',
    timestamp: '15m ago',
    severity: 'warning',
  },
  {
    id: '6',
    icon: <CheckCircle className="w-3 h-3" />,
    text: 'Route RT-0892 completed on schedule',
    timestamp: '18m ago',
    severity: 'success',
  },
  {
    id: '7',
    icon: <Info className="w-3 h-3" />,
    text: 'Telematics sync completed for 24 vehicles',
    timestamp: '22m ago',
    severity: 'info',
  },
]

interface ActivityBarProps {
  events?: ActivityEvent[]
}

export function ActivityBar({ events = placeholderEvents }: ActivityBarProps) {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <div className="shrink-0 border-t border-[rgba(255,255,255,0.06)] bg-[#0a0a0a]">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center justify-center w-full h-6 text-[rgba(255,255,255,0.40)] hover:text-white transition-colors"
          aria-label="Expand activity bar"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-[rgba(255,255,255,0.06)] bg-[#0a0a0a] h-12">
      <div className="flex items-center h-full px-3 gap-2">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(true)}
          className="flex items-center justify-center w-6 h-6 rounded text-[rgba(255,255,255,0.40)] hover:text-white hover:bg-[#111111] transition-colors shrink-0"
          aria-label="Collapse activity bar"
        >
          <ChevronDown className="w-3 h-3" />
        </button>

        {/* Gradient divider */}
        <div className="w-px h-5 bg-gradient-to-b from-transparent via-[rgba(255,255,255,0.08)] to-transparent shrink-0" />

        {/* Scrollable event ticker */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide">
          <div className="flex items-center gap-3 min-w-max">
            {events.map((event) => (
              <button
                key={event.id}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap',
                  'hover:bg-[#111111] cursor-pointer'
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center w-5 h-5 rounded',
                    severityBgColors[event.severity],
                    severityColors[event.severity]
                  )}
                >
                  {event.icon}
                </span>
                <span className="text-[11px] text-[rgba(255,255,255,0.65)]">
                  {event.text}
                </span>
                <span className="text-[10px] text-[rgba(255,255,255,0.30)] ml-1">
                  {event.timestamp}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
