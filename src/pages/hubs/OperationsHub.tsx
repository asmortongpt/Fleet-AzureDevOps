import { Suspense, lazy } from 'react'
import { HubLayout, HubPanel } from '@/components/layout/HubLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { useFleetData } from '@/hooks/use-fleet-data'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

// Lazy load components for performance
const GPSTracking = lazy(() => import('@/components/modules/GPSTracking'))
const DispatchConsole = lazy(() => import('@/components/DispatchConsole'))

/**
 * OperationsHub - Real-time operations center
 *
 * Combines:
 * - Live GPS Map (70% width)
 * - Dispatch Console with PTT (30% sidebar)
 * - Active alerts panel
 *
 * Primary use: Dispatch operations, real-time tracking, emergency response
 */
export default function OperationsHub() {
  const fleetData = useFleetData()
  const vehicles = fleetData.vehicles || []
  const facilities = fleetData.facilities || []

  return (
    <HubLayout
      title="Operations Center"
      description="Real-time fleet tracking and dispatch console"
      className="p-0"
    >
      <div className="h-full flex flex-col lg:flex-row gap-0">
        {/* Main Map Area - 70% */}
        <div className="flex-1 lg:w-[70%] h-[50vh] lg:h-full border-r">
          <Suspense fallback={<MapSkeleton />}>
            <GPSTracking
              vehicles={vehicles}
              facilities={facilities}
              isLoading={fleetData.isLoading}
              error={fleetData.error}
            />
          </Suspense>
        </div>

        {/* Sidebar - 30% */}
        <div className="lg:w-[30%] h-[50vh] lg:h-full flex flex-col overflow-hidden">
          {/* Dispatch Console */}
          <div className="flex-1 overflow-auto border-b">
            <Suspense fallback={<DispatchSkeleton />}>
              <DispatchConsole />
            </Suspense>
          </div>

          {/* Active Alerts Panel */}
          <div className="h-48 overflow-auto p-4 bg-muted/30">
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">Active Alerts</h3>
            <div className="space-y-2">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Vehicle 101 - Low fuel warning
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertDescription className="text-xs">
                  3 vehicles en route
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </div>
    </HubLayout>
  )
}

// Loading skeletons
function MapSkeleton() {
  return (
    <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  )
}

function DispatchSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}
