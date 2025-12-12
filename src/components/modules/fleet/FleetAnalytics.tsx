import { useState } from "react"

import {
  OverviewTab,
  FinancialTab,
  UtilizationTab,
  KPIsTab
} from "./FleetAnalytics/components"
import { useChartData } from "./FleetAnalytics/hooks/useChartData"
import { useFleetAnalyticsData } from "./FleetAnalytics/hooks/useFleetAnalyticsData"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useFleetData } from "@/hooks/use-fleet-data"


interface FleetAnalyticsProps {
  data: ReturnType<typeof useFleetData>
}

export function FleetAnalytics() {
  const data = useFleetData()
  const vehicles = data?.vehicles || []
  const fuelTransactions = data?.fuelTransactions || []
  const workOrders = data?.workOrders || []

  const [selectedPeriod, setSelectedPeriod] = useState<string>("month")
  const [activeTab, setActiveTab] = useState<string>("overview")

  const { metrics, kpis } = useFleetAnalyticsData(vehicles, fuelTransactions, workOrders)
  const { monthlyFleetData, costAnalysis, utilizationByType } = useChartData(vehicles)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Fleet Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive analytics and performance insights</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="kpis">Key Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <OverviewTab
            totalFleet={metrics.totalFleet}
            utilization={metrics.utilization}
            avgMileage={metrics.avgMileage}
            downtime={metrics.downtime}
            monthlyFleetData={monthlyFleetData}
          />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6 mt-6">
          <FinancialTab
            totalFuelCost={metrics.totalFuelCost}
            totalMaintenanceCost={metrics.totalMaintenanceCost}
            costPerVehicle={kpis.costPerVehicle}
            costAnalysis={costAnalysis}
          />
        </TabsContent>

        <TabsContent value="utilization" className="space-y-6 mt-6">
          <UtilizationTab utilizationByType={utilizationByType} />
        </TabsContent>

        <TabsContent value="kpis" className="space-y-6 mt-6">
          <KPIsTab
            costPerMile={kpis.costPerMile}
            fuelEfficiency={kpis.fuelEfficiency}
            downtimeRate={kpis.downtimeRate}
            utilization={metrics.utilization}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
