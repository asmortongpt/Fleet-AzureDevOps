import {
  GasPump,
  Wrench,
  CurrencyDollar
} from "@phosphor-icons/react"

import { ChartCard } from "@/components/ChartCard"
import { MetricCard } from "@/components/MetricCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


interface CostAnalysisData {
  name: string
  fuel: number
  maintenance: number
  insurance: number
}

interface FinancialTabProps {
  totalFuelCost: number
  totalMaintenanceCost: number
  costPerVehicle: number
  costAnalysis: CostAnalysisData[]
  fuelChange?: number
  maintenanceChange?: number
}

export function FinancialTab({
  totalFuelCost,
  totalMaintenanceCost,
  costPerVehicle,
  costAnalysis,
  fuelChange,
  maintenanceChange
}: FinancialTabProps) {
  const totalOperating = totalFuelCost + totalMaintenanceCost
  const fuelTrend = fuelChange !== undefined ? (fuelChange < 0 ? "down" : "up") : "neutral"
  const maintenanceTrend = maintenanceChange !== undefined ? (maintenanceChange < 0 ? "down" : "up") : "neutral"

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <MetricCard
          title="Total Fuel Cost"
          value={`$${totalFuelCost.toLocaleString()}`}
          trend={fuelTrend}
          change={fuelChange !== undefined ? Number(Math.abs(fuelChange).toFixed(1)) : undefined}
          subtitle={fuelChange !== undefined ? "vs last period" : "current period"}
          icon={<GasPump className="w-3 h-3" />}
          status="warning"
        />
        <MetricCard
          title="Maintenance Cost"
          value={`$${totalMaintenanceCost.toLocaleString()}`}
          trend={maintenanceTrend}
          change={maintenanceChange !== undefined ? Number(Math.abs(maintenanceChange).toFixed(1)) : undefined}
          subtitle={maintenanceChange !== undefined ? "vs last period" : "current period"}
          icon={<Wrench className="w-3 h-3" />}
          status="success"
        />
        <MetricCard
          title="Cost per Vehicle"
          value={`$${costPerVehicle.toLocaleString()}`}
          subtitle="average total cost"
          icon={<CurrencyDollar className="w-3 h-3" />}
          status="info"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <ChartCard
          title="Cost Analysis Breakdown"
          subtitle="Monthly operating costs by category"
          type="bar"
          data={costAnalysis}
          dataKey="fuel"
          color="oklch(0.45 0.15 250)"
        />
        <Card>
          <CardHeader>
            <CardTitle>Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Fuel</span>
                  <span className="text-sm font-semibold">${totalFuelCost.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${totalOperating > 0 ? (totalFuelCost / totalOperating) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Maintenance</span>
                  <span className="text-sm font-semibold">${totalMaintenanceCost.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{
                      width: `${totalOperating > 0 ? (totalMaintenanceCost / totalOperating) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Operating Cost</span>
                  <span className="font-semibold text-sm">
                    ${(totalFuelCost + totalMaintenanceCost).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
