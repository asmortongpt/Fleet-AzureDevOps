/**
 * FloatingKPIStrip - Dashboard metrics ticker
 *
 * Fetches live data from `/api/dashboard/stats` and renders via TickerBar.
 */
import { Truck, Activity, Wrench, AlertTriangle, Gauge, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { usePanel } from '@/contexts/PanelContext'
import { TickerBar, type TickerMetric } from '@/components/ui/ticker-bar'

function buildMetrics(
  stats: {
    total_vehicles?: number
    active_vehicles?: number
    maintenance_vehicles?: number
    total_drivers?: number
    total_staff?: number
    open_work_orders?: number
    open_incidents?: number
  },
  onChipClick: (moduleId: string) => void
): TickerMetric[] {
  const total = stats.total_vehicles ?? 0
  const active = stats.active_vehicles ?? 0
  const maint = stats.maintenance_vehicles ?? 0
  const personnel = stats.total_staff ?? stats.total_drivers ?? 0
  const workOrders = stats.open_work_orders ?? 0
  const capacityPct = total > 0 ? Math.round((active / total) * 100) : 0
  const capacityLabel = Number.isFinite(capacityPct) ? `${capacityPct}%` : '\u2014'

  return [
    {
      label: 'Vehicles',
      value: total,
      icon: Truck,
      onClick: () => onChipClick('fleet'),
    },
    {
      label: 'Online',
      value: active,
      icon: Activity,
      trend: 'up' as const,
      onClick: () => onChipClick('live-fleet-dashboard'),
    },
    {
      label: 'In Service',
      value: maint,
      icon: Wrench,
      onClick: () => onChipClick('garage'),
    },
    {
      label: 'Work Orders',
      value: workOrders,
      icon: AlertTriangle,
      onClick: () => onChipClick('garage'),
    },
    {
      label: 'Capacity',
      value: capacityLabel,
      icon: Gauge,
      trend: (capacityPct >= 70 ? 'up' : capacityPct >= 40 ? 'neutral' : 'down') as 'up' | 'down' | 'neutral',
      onClick: () => onChipClick('fleet-optimizer'),
    },
    {
      label: 'Personnel',
      value: personnel,
      icon: Users,
      onClick: () => onChipClick('driver-mgmt'),
    },
  ]
}

export function FloatingKPIStrip() {
  const { openPanel } = usePanel()

  const handleChipClick = useCallback(
    (moduleId: string) => {
      import('@/config/module-registry').then(({ getModule }) => {
        const mod = getModule(moduleId)
        if (!mod) return
        openPanel({
          id: `kpi-${moduleId}-${Date.now()}`,
          moduleId: mod.id,
          title: mod.label,
          width: mod.panelWidth,
          category: mod.category,
        })
      })
    },
    [openPanel]
  )

  const [metrics, setMetrics] = useState<TickerMetric[]>(() =>
    buildMetrics({}, handleChipClick)
  )

  useEffect(() => {
    let cancelled = false

    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats', { credentials: 'include' })
        if (!res.ok) return
        const json = await res.json()
        const data = json.data ?? json
        if (!cancelled) setMetrics(buildMetrics(data, handleChipClick))
      } catch {
        // Keep defaults on error.
      }
    }

    fetchStats()
    const interval = window.setInterval(fetchStats, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [handleChipClick])

  return <TickerBar metrics={metrics} />
}
