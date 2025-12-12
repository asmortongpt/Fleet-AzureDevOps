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
  monthlyFleetData: MonthlyFleetData[]
}

export function OverviewTab({
  totalFleet,
  utilization,
  avgMileage,
  downtime,
  monthlyFleetData
}: OverviewTabProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Fleet Size"
          value={totalFleet}
          subtitle="vehicles"
          icon={<CarProfile className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Fleet Utilization"
          value={`${utilization}%`}
          trend="up"
          change={3.2}
          subtitle="vs last period"
          icon={<TrendUp className="w-5 h-5" />}
          status="success"
        />
        <MetricCard
          title="Avg Mileage"
          value={`${avgMileage.toLocaleString()}mi`}
          subtitle="per vehicle"
          icon={<ChartLine className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Vehicles in Service"
          value={downtime}
          subtitle="requiring attention"
          icon={<Wrench className="w-5 h-5" />}
          status={downtime > 5 ? "warning" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Fleet Status Over Time"
          subtitle="Monthly vehicle status breakdown"
          type="area"
          data={monthlyFleetData}
          dataKey="active"
          color="oklch(0.45 0.15 250)"
        />
        <ChartCard
          title="Fleet Utilization Rate"
          subtitle="Percentage of fleet in active use"
          type="line"
          data={monthlyFleetData}
          dataKey="utilization"
          color="oklch(0.75 0.12 210)"
        />
      </div>
    </>
  )
}
