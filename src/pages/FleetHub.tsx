/**
 * FleetHub - Modern Fleet Management Dashboard
 * Real-time fleet monitoring with responsive visualizations
 */

import { motion } from 'framer-motion'
import { Suspense, lazy } from 'react'
import {
  Car,
  MapPin,
  Gauge,
  VideoCamera,
  ChargingStation,
  Cube,
  ChartBar,
  Warning,
  TrendUp,
  GasPump,
  Wrench,
} from '@phosphor-icons/react'
import HubPage from '@/components/ui/hub-page'
import { useReactiveFleetData } from '@/hooks/use-reactive-fleet-data'
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useAuth } from '@/contexts/AuthContext'

// Lazy load heavy components
const LiveTracking = lazy(() => import('@/components/fleet/LiveTracking'))
const LiveFleetDashboard = lazy(() => import('@/components/dashboard/LiveFleetDashboard'))
const VehicleTelemetry = lazy(() => import('@/components/modules/fleet/VehicleTelemetry'))
const VirtualGarage = lazy(() => import('@/components/modules/fleet/VirtualGarage'))
const VideoTelematics = lazy(() => import('@/components/modules/compliance/VideoTelematics'))
const EVChargingManagement = lazy(() => import('@/components/modules/charging/EVChargingManagement'))
const FleetManagerDashboard = lazy(() => import('@/components/dashboards/roles/FleetManagerDashboard'))
const DriverDashboard = lazy(() => import('@/components/dashboards/roles/DriverDashboard'))

/**
 * Fleet Overview Tab - Main dashboard with real-time metrics
 */
function FleetOverview() {
  const {
    vehicles,
    metrics,
    statusDistribution,
    makeDistribution,
    avgMileageByStatus,
    lowFuelVehicles,
    highMileageVehicles,
    isLoading,
    lastUpdate,
  } = useReactiveFleetData()

  // Prepare chart data
  const statusChartData = Object.entries(statusDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill:
      name === 'active'
        ? 'hsl(var(--primary))'
        : name === 'maintenance'
          ? 'hsl(var(--warning))'
          : name === 'inactive'
            ? 'hsl(var(--muted))'
            : 'hsl(var(--destructive))',
  }))

  const makeChartData = Object.entries(makeDistribution)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8) // Top 8 makes

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fleet Overview</h2>
          <p className="text-muted-foreground">
            Real-time fleet status and performance metrics
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Vehicles"
          value={metrics?.totalVehicles?.toString() || '0'}
          icon={Car}
          trend="neutral"
          description="Entire fleet"
          loading={isLoading}
        />
        <StatCard
          title="Active Vehicles"
          value={metrics?.activeVehicles?.toString() || '0'}
          icon={TrendUp}
          trend="up"
          change="+12%"
          description="Currently in use"
          loading={isLoading}
        />
        <StatCard
          title="In Maintenance"
          value={metrics?.maintenanceVehicles?.toString() || '0'}
          icon={Wrench}
          trend={metrics && metrics.maintenanceVehicles > 5 ? 'down' : 'neutral'}
          description="Under service"
          loading={isLoading}
        />
        <StatCard
          title="Avg Fuel Level"
          value={`${metrics?.averageFuelLevel?.toFixed(0) || '0'}%`}
          icon={GasPump}
          trend={metrics && metrics.averageFuelLevel < 40 ? 'down' : 'up'}
          description="Fleet average"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vehicle Status Distribution */}
        <ResponsivePieChart
          title="Vehicle Status Distribution"
          description="Current status breakdown of all fleet vehicles"
          data={statusChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Vehicles by Make */}
        <ResponsiveBarChart
          title="Vehicles by Manufacturer"
          description="Top vehicle makes in your fleet"
          data={makeChartData}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* Average Mileage Trend */}
      <ResponsiveLineChart
        title="Average Mileage by Status"
        description="Vehicle mileage comparison across different status categories"
        data={avgMileageByStatus}
        height={300}
        showArea
        loading={isLoading}
      />

      {/* Alerts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Fuel Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Warning className="h-5 w-5 text-amber-500" />
              <CardTitle>Low Fuel Alerts</CardTitle>
            </div>
            <CardDescription>Vehicles with fuel level below 25%</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : lowFuelVehicles.length > 0 ? (
              <div className="space-y-2">
                {lowFuelVehicles.slice(0, 5).map((vehicle) => (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                  >
                    <div>
                      <p className="font-medium">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.license_plate}
                      </p>
                    </div>
                    <Badge
                      variant={vehicle.fuel_level! < 15 ? 'destructive' : 'warning'}
                    >
                      {vehicle.fuel_level}% Fuel
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                All vehicles have adequate fuel levels
              </p>
            )}
          </CardContent>
        </Card>

        {/* High Mileage Vehicles */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-cyan-500" />
              <CardTitle>High Mileage Vehicles</CardTitle>
            </div>
            <CardDescription>Vehicles with over 100,000 miles</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : highMileageVehicles.length > 0 ? (
              <div className="space-y-2">
                {highMileageVehicles.slice(0, 5).map((vehicle) => (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                  >
                    <div>
                      <p className="font-medium">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.license_plate}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {vehicle.mileage.toLocaleString()} mi
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No high mileage vehicles
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Main FleetHub Component
 */
export default function FleetHub() {
  const { user } = useAuth()

  // Role-based dashboard override for non-admin users
  if (user?.role === 'fleet_manager' && user?.department === 'fleet') {
    return (
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <div className="space-y-4 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading Fleet Manager Dashboard...</p>
            </div>
          </div>
        }
      >
        <FleetManagerDashboard />
      </Suspense>
    )
  }

  if (user?.role === 'driver') {
    return (
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <div className="space-y-4 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading Driver Dashboard...</p>
            </div>
          </div>
        }
      >
        <DriverDashboard />
      </Suspense>
    )
  }

  // Admin users see the full tabbed interface
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <ChartBar className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <FleetOverview />
        </ErrorBoundary>
      ),
    },
    {
      id: 'live-tracking',
      label: 'Live Tracking',
      icon: <MapPin className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex h-[600px] items-center justify-center">
                <div className="space-y-4 text-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Loading live tracking map...</p>
                </div>
              </div>
            }
          >
            <LiveTracking />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'advanced-map',
      label: 'Advanced Map',
      icon: <MapPin className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex h-[600px] items-center justify-center">
                <div className="space-y-4 text-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Loading advanced map...</p>
                </div>
              </div>
            }
          >
            <LiveFleetDashboard />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'telemetry',
      label: 'Telemetry',
      icon: <Gauge className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex h-[600px] items-center justify-center">
                <div className="space-y-4 text-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Loading telemetry data...</p>
                </div>
              </div>
            }
          >
            <VehicleTelemetry />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: '3d-garage',
      label: '3D Garage',
      icon: <Cube className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex h-[600px] items-center justify-center">
                <div className="space-y-4 text-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Loading 3D garage...</p>
                </div>
              </div>
            }
          >
            <VirtualGarage />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'video',
      label: 'Video',
      icon: <VideoCamera className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex h-[600px] items-center justify-center">
                <div className="space-y-4 text-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Loading video telematics...</p>
                </div>
              </div>
            }
          >
            <VideoTelematics />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'ev-charging',
      label: 'EV Charging',
      icon: <ChargingStation className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex h-[600px] items-center justify-center">
                <div className="space-y-4 text-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Loading EV charging management...</p>
                </div>
              </div>
            }
          >
            <EVChargingManagement />
          </Suspense>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Fleet Hub"
      description="Comprehensive fleet management and real-time vehicle monitoring"
      icon={<Car className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}
