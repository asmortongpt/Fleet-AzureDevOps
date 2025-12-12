import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * FleetDashboardSkeleton - Loading state with FIXED DIMENSIONS for CLS prevention
 *
 * Purpose: Prevents Cumulative Layout Shift (CLS) by reserving exact space for content
 * Target: Core Web Vitals CLS < 0.1
 *
 * Key Features:
 * - Fixed heights on all containers (no dynamic sizing)
 * - Grid layouts with explicit dimensions
 * - Matches actual FleetDashboard component layout exactly
 */
export function FleetDashboardSkeleton() {
  return (
    <div className="space-y-6 w-full">
      {/* Header Section - Fixed Height */}
      <div className="h-24 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* KPI Metrics Row - Fixed Height: 120px */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[120px]">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-[120px]">
            <CardContent className="pt-6 h-full flex flex-col justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row - Fixed Height: 400px */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
        <Card className="h-[400px]">
          <CardHeader className="h-16">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="h-[calc(400px-4rem)]">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
        <Card className="h-[400px]">
          <CardHeader className="h-16">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="h-[calc(400px-4rem)]">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Table - Fixed Height: 600px */}
      <Card className="h-[600px]">
        <CardHeader className="h-16">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-48" />
          </div>
        </CardHeader>
        <CardContent className="h-[calc(600px-4rem)]">
          <div className="space-y-3">
            {/* Table Header - Fixed Height: 48px */}
            <div className="flex gap-4 h-12 items-center border-b">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-6 flex-1" />
              ))}
            </div>

            {/* Table Rows - Fixed Height: 64px each */}
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4 h-16 items-center border-b">
                {[...Array(6)].map((_, j) => (
                  <Skeleton key={j} className="h-8 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * FleetMetricsBarSkeleton - Loading state for metrics KPI bar
 * Fixed Height: 80px
 */
export function FleetMetricsBarSkeleton() {
  return (
    <div className="h-20 flex gap-4 items-center bg-card rounded-lg p-4 border">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  )
}

/**
 * FleetTableSkeleton - Loading state for vehicle data tables
 * Fixed Height: 600px (10 rows * 60px + header)
 */
export function FleetTableSkeleton() {
  return (
    <div className="h-[600px] w-full overflow-hidden">
      {/* Table Header - Fixed Height: 48px */}
      <div className="h-12 flex gap-4 items-center bg-muted/50 px-4 border-b">
        <Skeleton className="h-6 w-32" /> {/* VIN */}
        <Skeleton className="h-6 w-40" /> {/* Make/Model */}
        <Skeleton className="h-6 w-24" /> {/* Year */}
        <Skeleton className="h-6 w-24" /> {/* Status */}
        <Skeleton className="h-6 w-28" /> {/* Mileage */}
        <Skeleton className="h-6 w-20" /> {/* Actions */}
      </div>

      {/* Table Rows - 10 rows, each 56px */}
      <div className="space-y-1">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-14 flex gap-4 items-center px-4 border-b">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-6 w-20 rounded-full" /> {/* Status badge */}
            <Skeleton className="h-8 w-28" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * FleetMapSkeleton - Loading state for real-time map container
 * Fixed Height: 500px
 */
export function FleetMapSkeleton() {
  return (
    <div className="relative h-[500px] w-full">
      <Skeleton className="h-full w-full rounded-lg" />

      {/* Map Controls - Top Right */}
      <div className="absolute top-4 right-4 space-y-2">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>

      {/* Legend - Bottom Left */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-4 space-y-2">
        <Skeleton className="h-4 w-32 mb-3" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Vehicle Count Badge - Top Left */}
      <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2">
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
  )
}
