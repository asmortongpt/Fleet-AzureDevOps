import { Layout, List } from "@phosphor-icons/react"
import { useMemo, useState, useCallback } from "react"

import { FleetFiltersPanel, FleetMetricsBar, FleetTable } from "./FleetDashboard/components"
import { useFleetFilters } from "./FleetDashboard/hooks/useFleetFilters"
import { useFleetMetrics } from "./FleetDashboard/hooks/useFleetMetrics"

import { ProfessionalFleetMap } from "@/components/Maps/ProfessionalFleetMap"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { useFleetDataBatched } from "@/hooks/use-fleet-data-batched"
import { useVehicleTelemetry } from "@/hooks/useVehicleTelemetry"
import { Vehicle } from "@/lib/types"
import { useInspect } from "@/services/inspect/InspectContext"

type LayoutMode = "split-50-50" | "split-70-30" | "map-only" | "table-only"

export function FleetDashboard() {
  const data = useFleetDataBatched()
  const initialVehicles = data?.vehicles || []
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("split-50-50")

  const { push: drilldownPush } = useDrilldown()
  const { openInspect } = useInspect()

  const { vehicles: realtimeVehicles } = useVehicleTelemetry({
    enabled: true,
    initialVehicles
  })

  const vehicles = useMemo(() => {
    if (realtimeVehicles?.length > 0) {
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

  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredVehicles,
    hasActiveFilters,
    clearAllFilters
  } = useFleetFilters(vehicles)

  const metrics = useFleetMetrics(filteredVehicles)

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
        target: vehicle
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

  const renderLayout = () => {
    const mapSection = (
      <div className="h-full">
        <ProfessionalFleetMap 
          vehicles={filteredVehicles} 
          onVehicleClick={handleVehicleClick} 
          mapStyle="default"
        />
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

      <FleetMetricsBar
        totalVehicles={metrics.totalVehicles}
        activeVehicles={metrics.activeVehicles}
        inService={metrics.inService}
        lowFuelVehicles={metrics.lowFuelVehicles}
        criticalAlerts={metrics.criticalAlerts}
        onMetricClick={handleMetricClick}
      />

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

      {renderLayout()}
    </div>
  )
}

export default FleetDashboard