import { useMemo, useState } from "react"

import {
  OverviewTab,
  FinancialTab,
  UtilizationTab,
  KPIsTab
} from "./FleetAnalytics/components"
import { useChartData } from "./FleetAnalytics/hooks/useChartData"
import { useFleetAnalyticsData } from "./FleetAnalytics/hooks/useFleetAnalyticsData"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useFleetData } from "@/hooks/use-fleet-data"

const computeDelta = (series: Array<Record<string, any>>, key: string) => {
  if (!Array.isArray(series) || series.length < 2) return undefined
  const last = Number(series[series.length - 1]?.[key])
  const prev = Number(series[series.length - 2]?.[key])
  if (!Number.isFinite(last) || !Number.isFinite(prev) || prev === 0) return undefined
  return ((last - prev) / Math.abs(prev)) * 100
}

export function FleetAnalytics() {
  const [activeTab, setActiveTab] = useState<string>("overview")
  const data = useFleetData()

  const vehicles = data?.vehicles || []
  const fuelTransactions = data?.fuelTransactions || []
  const workOrders = data?.workOrders || []

  const { metrics, kpis } = useFleetAnalyticsData(vehicles, fuelTransactions, workOrders)
  const { monthlyFleetData, costAnalysis, utilizationByType } = useChartData(
    vehicles,
    fuelTransactions,
    workOrders
  )

  const utilizationChange = useMemo(
    () => computeDelta(monthlyFleetData, "utilization"),
    [monthlyFleetData]
  )
  const fuelChange = useMemo(
    () => computeDelta(costAnalysis, "fuel"),
    [costAnalysis]
  )
  const maintenanceChange = useMemo(
    () => computeDelta(costAnalysis, "maintenance"),
    [costAnalysis]
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Fleet Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive analytics and performance insights</p>
        </div>
        <div className="text-xs text-muted-foreground">Last 6 months</div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="kpis">Key Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-2 mt-3">
          <OverviewTab
            totalFleet={metrics.totalFleet}
            utilization={metrics.utilization}
            avgMileage={metrics.avgMileage}
            downtime={metrics.downtime}
            utilizationChange={utilizationChange}
            monthlyFleetData={monthlyFleetData}
          />
        </TabsContent>

        <TabsContent value="financial" className="space-y-2 mt-3">
          <FinancialTab
            totalFuelCost={metrics.totalFuelCost}
            totalMaintenanceCost={metrics.totalMaintenanceCost}
            costPerVehicle={kpis.costPerVehicle}
            costAnalysis={costAnalysis}
            fuelChange={fuelChange}
            maintenanceChange={maintenanceChange}
          />
        </TabsContent>

        <TabsContent value="utilization" className="space-y-2 mt-3">
          <UtilizationTab utilizationByType={utilizationByType} />
        </TabsContent>

        <TabsContent value="kpis" className="space-y-2 mt-3">
          <KPIsTab
            costPerMile={kpis.costPerMile}
            fuelEfficiency={kpis.fuelEfficiency}
            downtimeRate={kpis.downtimeRate}
            utilization={metrics.utilization}
            utilizationChange={utilizationChange}
            fuelCostChange={fuelChange}
            maintenanceCostChange={maintenanceChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
