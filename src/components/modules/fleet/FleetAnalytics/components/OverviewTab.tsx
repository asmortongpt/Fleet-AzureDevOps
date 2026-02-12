import {
  ChartLine,
  TrendUp,
  Wrench,
  CarProfile
} from "@phosphor-icons/react"

import { ChartCard } from "@/components/ChartCard"
import { MetricCard } from "@/components/MetricCard"

interface MonthlyFleetData {
  name: string
  active: number
  idle: number
  service: number
  utilization: number
}

interface OverviewTabProps {
  totalFleet: number
  utilization: number
  avgMileage: number
  downtime: number
  utilizationChange?: number
  monthlyFleetData: MonthlyFleetData[]
}

export function OverviewTab({
  totalFleet,
  utilization,
  avgMileage,
  downtime,
  utilizationChange,
  monthlyFleetData
}: OverviewTabProps) {
  const hasTrend = utilizationChange !== undefined
  const trendDirection = utilizationChange && utilizationChange < 0 ? "down" : "up"
  const utilizationLabel = hasTrend ? "vs last period" : "current utilization"

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricCard
          title="Total Fleet Size"
          value={totalFleet}
          subtitle="vehicles"
          icon={<CarProfile className="w-3 h-3" />}
          status="info"
        />
        <MetricCard
          title="Fleet Utilization"
          value={`${utilization}%`}
          trend={hasTrend ? trendDirection : "neutral"}
          change={hasTrend ? Number(Math.abs(utilizationChange).toFixed(1)) : undefined}
          subtitle={utilizationLabel}
          icon={<TrendUp className="w-3 h-3" />}
          status="success"
        />
        <MetricCard
          title="Avg Mileage"
          value={`${(avgMileage ?? 0).toLocaleString()}mi`}
          subtitle="per vehicle"
          icon={<ChartLine className="w-3 h-3" />}
          status="info"
        />
        <MetricCard
          title="Vehicles in Service"
          value={downtime}
          subtitle="requiring attention"
          icon={<Wrench className="w-3 h-3" />}
          status={downtime > 5 ? "warning" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <ChartCard
          title="Fleet Status Over Time"
          subtitle={monthlyFleetData.length > 1 ? "Monthly vehicle status breakdown" : "Current fleet status snapshot"}
          type="area"
          data={monthlyFleetData}
          dataKey="active"
          color="oklch(0.45 0.15 250)"
        />
        <ChartCard
          title="Fleet Utilization Rate"
          subtitle={monthlyFleetData.length > 1 ? "Percentage of fleet in active use" : "Current utilization rate"}
          type="line"
          data={monthlyFleetData}
          dataKey="utilization"
          color="oklch(0.75 0.12 210)"
        />
      </div>
    </>
  )
}
