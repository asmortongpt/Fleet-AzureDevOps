/**
 * BottomDrawer - Activity timeline at the bottom of the content area
 *
 * Wraps the TimelineStrip component with PanelContext state.
 */
import { usePanel } from '@/contexts/PanelContext'
import { TimelineStrip, type TimelineEvent } from '@/components/ui/timeline-strip'

const activityEvents: TimelineEvent[] = [
  { id: 'ev-1', label: 'Vehicle VEH-1234 entered Geofence A', time: '2m ago', type: 'info' },
  { id: 'ev-2', label: 'Driver J. Smith completed route R-456', time: '5m ago', type: 'dispatch' },
  { id: 'ev-3', label: 'Maintenance alert: VEH-0891 oil change due', time: '8m ago', type: 'maintenance' },
  { id: 'ev-4', label: 'New work order WO-7823 created', time: '12m ago', type: 'info' },
  { id: 'ev-5', label: 'Speed violation detected: VEH-2341', time: '15m ago', type: 'alert' },
  { id: 'ev-6', label: 'Vehicle VEH-0456 started trip', time: '20m ago', type: 'dispatch' },
]

export function BottomDrawer() {
  const { state, toggleBottomDrawer } = usePanel()
  const { open } = state.bottomDrawer

  return (
    <TimelineStrip
      events={activityEvents}
      collapsed={!open}
      onToggle={toggleBottomDrawer}
    />
  )
}
