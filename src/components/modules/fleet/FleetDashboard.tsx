import { useMemo, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Layout, List } from "@phosphor-icons/react"
import { Vehicle } from "@/lib/types"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useVehicleTelemetry } from "@/hooks/useVehicleTelemetry"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { useInspect } from "@/services/inspect/InspectContext"
import { ProfessionalFleetMap } from "@/components/Maps/ProfessionalFleetMap"
import { useFleetFilters } from "./FleetDashboard/hooks/useFleetFilters"
import { useFleetMetrics } from "./FleetDashboard/hooks/useFleetMetrics"
import { FleetFiltersPanel, FleetMetricsBar, FleetTable } from "./FleetDashboard/components"

type LayoutMode = "split-50-50" | "split-70-30" | "map-only" | "table-only"

interface FleetDashboardProps {
  data: ReturnType<typeof useFleetData>
}

export function FleetDashboard() {
  const data = useFleetData()
  const initialVehicles = data.vehicles || []
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("split-50-50")

  // Drilldown & Inspect
  const { push: drilldownPush } = useDrilldown()
  const { openInspect } = useInspect()

  // Real-time telemetry
  const { vehicles: realtimeVehicles } = useVehicleTelemetry({
    enabled: true,
    initialVehicles
  })

  // Merge real-time data with initial vehicles
  const vehicles = useMemo(() => {
    if (realtimeVehicles.length > 0) {
      const merged = new Map<string, Vehicle>()
      initialVehicles.forEach((v) => merged.set(v.id, v))
      realtimeVehicles.forEach((v) => {
        const existing = merged.get(v.id)
        if (existing) {
          merged.set(v.id, { ...existing, ...v })
        }
      })
      return Array.from(merged.values())
    }
    return initialVehicles
  }, [initialVehicles, realtimeVehicles])

  // Filtering
  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredVehicles,
    hasActiveFilters,
    clearAllFilters
  } = useFleetFilters(vehicles)

  // Metrics
  const metrics = useFleetMetrics(filteredVehicles)

  // Handlers
  const handleVehicleClick = useCallback(
    (vehicle: Vehicle) => {
      drilldownPush({
        id: `vehicle-${vehicle.id}`,
        type: "vehicle",
        label: `${vehicle.number} - ${vehicle.make} ${vehicle.model}`,
        data: vehicle
      })

      openInspect({
        type: "vehicle",
        id: vehicle.id,
        data: vehicle
      })
    },
    [drilldownPush, openInspect]
  )

  const handleMetricClick = useCallback(
    (metricType: string, filter: any, label: string) => {
      drilldownPush({
        id: `metric-${metricType}`,
        type: "vehicle-list",
        label,
        data: { filter, vehicles: filteredVehicles }
      })
    },
    [drilldownPush, filteredVehicles]
  )

  // Layout rendering
  const renderLayout = () => {
    const mapSection = (
      <div className="h-full">
        <ProfessionalFleetMap vehicles={filteredVehicles} onVehicleClick={handleVehicleClick} />
      </div>
    )

    const tableSection = (
      <div className="h-full overflow-auto">
        <FleetTable vehicles={filteredVehicles} onVehicleClick={handleVehicleClick} />
        {filteredVehicles.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No vehicles match your filters</p>
          </div>
        )}
      </div>
    )

    switch (layoutMode) {
      case "map-only":
        return <div className="h-[calc(100vh-300px)]">{mapSection}</div>

      case "table-only":
        return <div className="h-[calc(100vh-300px)]">{tableSection}</div>

      case "split-70-30":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6 h-[calc(100vh-300px)]">
            {mapSection}
            {tableSection}
          </div>
        )

      case "split-50-50":
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-300px)]">
            {mapSection}
            {tableSection}
          </div>
        )
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Fleet Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage your fleet in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={layoutMode} onValueChange={(v) => setLayoutMode(v as LayoutMode)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="split-50-50">
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Split 50/50
                </div>
              </SelectItem>
              <SelectItem value="split-70-30">
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Split 70/30
                </div>
              </SelectItem>
              <SelectItem value="map-only">
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Map Only
                </div>
              </SelectItem>
              <SelectItem value="table-only">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  Table Only
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics */}
      <FleetMetricsBar
        totalVehicles={metrics.totalVehicles}
        activeVehicles={metrics.activeVehicles}
        inService={metrics.inService}
        lowFuelVehicles={metrics.lowFuelVehicles}
        criticalAlerts={metrics.criticalAlerts}
        onMetricClick={handleMetricClick}
      />

      {/* Filters */}
      <FleetFiltersPanel
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        hasActiveFilters={hasActiveFilters}
        onAdvancedFiltersClick={() => {
          /* FUTURE: Implement advanced filters dialog */
        }}
        onClearFilters={clearAllFilters}
      />

      {/* Layout */}
      {renderLayout()}
    </div>
  )
}

export default FleetDashboard
