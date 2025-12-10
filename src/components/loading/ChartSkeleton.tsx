import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Chart Skeleton Components - Fixed dimensions for CLS prevention
 * All chart containers have explicit heights to prevent layout shift
 */

/**
 * LineChartSkeleton - For time-series data (fuel consumption, mileage trends)
 * Fixed Height: 400px
 */
export function LineChartSkeleton({ height = 400 }: { height?: number }) {
  return (
    <Card className={`h-[${height}px]`}>
      <CardHeader className="h-16 flex flex-row items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-32" />
      </CardHeader>
      <CardContent className={`h-[calc(${height}px-4rem)]`}>
        <div className="h-full flex flex-col">
          {/* Y-Axis Labels */}
          <div className="flex-1 flex items-between flex-col justify-between py-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-12" />
            ))}
          </div>

          {/* Chart Area with Grid Lines */}
          <div className="relative h-full w-full">
            <Skeleton className="h-full w-full rounded" />
            {/* Simulated line path */}
            <div className="absolute inset-4 flex items-center">
              <Skeleton className="h-1 w-full" />
            </div>
          </div>

          {/* X-Axis Labels */}
          <div className="flex justify-between mt-4">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-16" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * BarChartSkeleton - For comparisons (vehicle counts, department costs)
 * Fixed Height: 400px
 */
export function BarChartSkeleton({ height = 400 }: { height?: number }) {
  return (
    <Card className={`h-[${height}px]`}>
      <CardHeader className="h-16">
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className={`h-[calc(${height}px-4rem)]`}>
        <div className="h-full flex items-end justify-around gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton
                className="w-full"
                style={{ height: `${Math.random() * 70 + 30}%` }}
              />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * PieChartSkeleton - For distributions (vehicle types, status breakdown)
 * Fixed Height: 400px
 */
export function PieChartSkeleton({ height = 400 }: { height?: number }) {
  return (
    <Card className={`h-[${height}px]`}>
      <CardHeader className="h-16">
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className={`h-[calc(${height}px-4rem)]`}>
        <div className="flex items-center justify-between h-full">
          {/* Pie Chart Circle */}
          <div className="flex-1 flex items-center justify-center">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-12 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * DonutChartSkeleton - For status distribution with center metric
 * Fixed Height: 320px
 */
export function DonutChartSkeleton() {
  return (
    <Card className="h-[320px]">
      <CardHeader className="h-16">
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="h-[calc(320px-4rem)]">
        <div className="flex items-center justify-between h-full">
          {/* Donut Chart */}
          <div className="flex-1 flex items-center justify-center relative">
            <Skeleton className="h-40 w-40 rounded-full" />
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-8 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * AreaChartSkeleton - For cumulative data (total costs over time)
 * Fixed Height: 400px
 */
export function AreaChartSkeleton() {
  return (
    <Card className="h-[400px]">
      <CardHeader className="h-16">
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="h-[calc(400px-4rem)]">
        <div className="relative h-full w-full">
          <Skeleton className="h-full w-full rounded" />
          {/* Simulated area fill */}
          <div className="absolute inset-4 flex items-end">
            <Skeleton className="h-3/4 w-full opacity-50" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * GaugeChartSkeleton - For single metrics (fuel efficiency, utilization)
 * Fixed Height: 280px
 */
export function GaugeChartSkeleton() {
  return (
    <Card className="h-[280px]">
      <CardHeader className="h-16">
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="h-[calc(280px-4rem)] flex flex-col items-center justify-center">
        {/* Gauge Arc */}
        <Skeleton className="h-32 w-48 rounded-t-full" />
        {/* Value Display */}
        <div className="mt-4 space-y-2 text-center">
          <Skeleton className="h-10 w-24 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * HeatmapSkeleton - For utilization matrices, time-based patterns
 * Fixed Height: 400px
 */
export function HeatmapSkeleton() {
  return (
    <Card className="h-[400px]">
      <CardHeader className="h-16">
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="h-[calc(400px-4rem)]">
        <div className="h-full space-y-2">
          {/* Day Labels */}
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16" />
            <div className="flex-1 grid grid-cols-24 gap-1">
              {[...Array(24)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>

          {/* Week Grid */}
          {[...Array(7)].map((_, day) => (
            <div key={day} className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <div className="flex-1 grid grid-cols-24 gap-1">
                {[...Array(24)].map((_, hour) => (
                  <Skeleton
                    key={hour}
                    className="h-8 w-full"
                    style={{ opacity: Math.random() * 0.7 + 0.3 }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * SparklineChartSkeleton - For inline mini charts in cards/tables
 * Fixed Height: 40px
 */
export function SparklineChartSkeleton({ width = 120 }: { width?: number }) {
  return (
    <div className="relative" style={{ height: '40px', width: `${width}px` }}>
      <Skeleton className="h-full w-full" />
      <div className="absolute inset-0 flex items-center">
        <Skeleton className="h-1 w-full" />
      </div>
    </div>
  )
}

/**
 * StatCardWithChartSkeleton - KPI card with inline chart
 * Fixed Height: 160px
 */
export function StatCardWithChartSkeleton() {
  return (
    <Card className="h-[160px]">
      <CardContent className="pt-6 h-full flex flex-col justify-between">
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <SparklineChartSkeleton width={200} />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * DashboardChartsGridSkeleton - Complete charts section
 * Fixed Height: 850px (2 rows of charts)
 */
export function DashboardChartsGridSkeleton() {
  return (
    <div className="space-y-6 h-[850px]">
      {/* Row 1: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
        <LineChartSkeleton />
        <BarChartSkeleton />
      </div>

      {/* Row 2: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        <PieChartSkeleton />
        <DonutChartSkeleton />
        <div className="space-y-4">
          <StatCardWithChartSkeleton />
          <StatCardWithChartSkeleton />
        </div>
      </div>
    </div>
  )
}
