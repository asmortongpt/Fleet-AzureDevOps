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
}

export function FinancialTab({
  totalFuelCost,
  totalMaintenanceCost,
  costPerVehicle,
  costAnalysis
}: FinancialTabProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Fuel Cost"
          value={`$${totalFuelCost.toLocaleString()}`}
          trend="up"
          change={8.5}
          subtitle="vs last period"
          icon={<GasPump className="w-5 h-5" />}
          status="warning"
        />
        <MetricCard
          title="Maintenance Cost"
          value={`$${totalMaintenanceCost.toLocaleString()}`}
          trend="down"
          change={2.3}
          subtitle="vs last period"
          icon={<Wrench className="w-5 h-5" />}
          status="success"
        />
        <MetricCard
          title="Cost per Vehicle"
          value={`$${costPerVehicle.toLocaleString()}`}
          subtitle="average total cost"
          icon={<CurrencyDollar className="w-5 h-5" />}
          status="info"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Fuel</span>
                  <span className="text-sm font-semibold">${totalFuelCost.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${(totalFuelCost / (totalFuelCost + totalMaintenanceCost)) * 100}%`
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
                      width: `${(totalMaintenanceCost / (totalFuelCost + totalMaintenanceCost)) * 100}%`
                    }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Operating Cost</span>
                  <span className="font-semibold text-lg">
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
