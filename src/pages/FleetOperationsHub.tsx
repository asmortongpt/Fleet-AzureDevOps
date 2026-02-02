/**
 * FleetOperationsHub - Consolidated Fleet Management Dashboard
 *
 * Consolidates:
 * - FleetHub (vehicles, tracking, telemetry)
 * - DriversHub (driver management, performance)
 * - AssetsHub (asset tracking, lifecycle)
 * - OperationsHub (dispatch, routing, fuel)
 * - MaintenanceHub (work orders, schedules, preventive maintenance)
 *
 * Features:
 * - Unified navigation with tabs
 * - Real-time data updates
 * - WCAG 2.1 AA accessibility
 * - Responsive design
 * - Performance optimized
 * - Comprehensive error handling
 */

import { useState, Suspense, lazy, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Car,
  Users,
  Box,
  Radio as OperationsIcon,
  Wrench,
  MapPin,
  Gauge,
  Video,
  Plug,
  BarChart,
  AlertTriangle,
  TrendingUp,
  Fuel,
  ArrowUp,
  ArrowDown,
  XCircle,
  User as UserIcon,
  Shield,
  LineChart,
  Trophy,
  BadgeCheck,
  Clock,
  Award,
  CalendarX,
  Map,
  Circle,
  CheckSquare,
  Calendar,
  Truck,
  Package,
  Plus,
  Zap,
  Route as RouteIcon,
  CheckCircle,
  X,
  ArrowRight,
  ClipboardList,
  Wrench as Tool,
  Settings as SettingsIcon,
  FileText,
  DollarSign
} from 'lucide-react'
import HubPage from '@/components/ui/hub-page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useAuth } from '@/contexts'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { useReactiveFleetData } from '@/hooks/use-reactive-fleet-data'
import { useReactiveDriversData } from '@/hooks/use-reactive-drivers-data'
import { useReactiveOperationsData } from '@/hooks/use-reactive-operations-data'
import toast from 'react-hot-toast'
import logger from '@/utils/logger';
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'

// ============================================================================
// LAZY-LOADED COMPONENTS
// ============================================================================

const LiveTracking = lazy(() => import('@/components/fleet/LiveTracking'))
const LiveFleetDashboard = lazy(() => import('@/components/dashboard/LiveFleetDashboard').then(m => ({ default: m.LiveFleetDashboard })))
const VehicleTelemetry = lazy(() => import('@/components/modules/fleet/VehicleTelemetry').then(m => ({ default: m.VehicleTelemetry })))
const VirtualGarage = lazy(() => import('@/components/modules/fleet/VirtualGarage').then(m => ({ default: m.VirtualGarage })))
const VideoTelematics = lazy(() => import('@/components/modules/compliance/VideoTelematics').then(m => ({ default: m.VideoTelematics })))
const EVChargingManagement = lazy(() => import('@/components/modules/charging/EVChargingManagement').then(m => ({ default: m.EVChargingManagement })))
const FleetManagerDashboard = lazy(() => import('@/components/dashboards/roles/FleetManagerDashboard').then(m => ({ default: m.FleetManagerDashboard })))
const DriverDashboard = lazy(() => import('@/components/dashboards/roles/DriverDashboard').then(m => ({ default: m.DriverDashboard })))

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeInVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const staggerContainerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

/**
 * Fleet Tab - Vehicle tracking and telemetry
 */
const FleetTabContent = memo(function FleetTabContent() {
  const { vehicles, metrics: stats, isLoading: loading, error, refetch } = useReactiveFleetData()
  const { user } = useAuth()

  // Default stats if undefined - use metrics structure from hook
  const safeStats = stats || {
    totalVehicles: 0,
    activeVehicles: 0,
    maintenanceVehicles: 0,
    idleVehicles: 0,
    averageFuelLevel: 0,
    totalMileage: 0
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error.message || 'Failed to load data. Please try again.'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Fleet Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Vehicles"
          value={safeStats.totalVehicles}
          icon={Car}
          change={12}
          trend="up"
          description="Active fleet count"
        />
        <StatCard
          title="Active Vehicles"
          value={safeStats.activeVehicles}
          icon={Gauge}
          change={8}
          trend="up"
          description="Currently in use"
        />
        <StatCard
          title="Maintenance Due"
          value={safeStats.maintenanceVehicles}
          icon={Wrench}
          change={2}
          trend="down"
          description="Needs attention"
        />
        <StatCard
          title="Avg Fuel Level"
          value={`${(safeStats.averageFuelLevel || 0).toFixed(1)}%`}
          icon={Fuel}
          change={5}
          trend="up"
          description="Fleet average"
        />
      </motion.div>

      {/* Live Fleet Dashboard */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Fleet Tracking
            </CardTitle>
            <CardDescription>Real-time vehicle locations and status</CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <Suspense fallback={<Skeleton className="h-96" />}>
                <LiveFleetDashboard />
              </Suspense>
            </ErrorBoundary>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vehicle Telemetry */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Vehicle Telemetry
            </CardTitle>
            <CardDescription>Performance metrics and diagnostics</CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <Suspense fallback={<Skeleton className="h-64" />}>
                <VehicleTelemetry />
              </Suspense>
            </ErrorBoundary>
          </CardContent>
        </Card>
      </motion.div>

      {/* Virtual Garage */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Virtual Garage
            </CardTitle>
            <CardDescription>3D vehicle models and inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <Suspense fallback={<Skeleton className="h-96" />}>
                <VirtualGarage />
              </Suspense>
            </ErrorBoundary>
          </CardContent>
        </Card>
      </motion.div>

      {/* EV Charging Management */}
      {(user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'SuperAdmin') && (
        <motion.div variants={fadeInVariant}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                EV Charging Management
              </CardTitle>
              <CardDescription>Electric vehicle charging stations and schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <ErrorBoundary>
                <Suspense fallback={<Skeleton className="h-64" />}>
                  <EVChargingManagement />
                </Suspense>
              </ErrorBoundary>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
})

/**
 * Drivers Tab - Driver management and performance
 */
const DriversTabContent = memo(function DriversTabContent() {
  const { drivers, metrics: stats, isLoading: loading, error, refresh: refetch } = useReactiveDriversData()

  // Default stats if undefined - use metrics structure from hook
  const safeStats = stats || {
    totalDrivers: 0,
    activeDrivers: 0,
    onLeave: 0,
    suspended: 0,
    avgSafetyScore: 0,
    avgPerformance: 0,
    activeAssignments: 0,
    totalViolations: 0
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error.message || 'Failed to load data. Please try again.'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Driver Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Drivers"
          value={safeStats.totalDrivers}
          icon={Users}
          change={5}
          trend="up"
          description="Active driver pool"
        />
        <StatCard
          title="On Duty"
          value={safeStats.activeDrivers}
          icon={UserIcon}
          change={3}
          trend="up"
          description="Currently working"
        />
        <StatCard
          title="Avg Performance"
          value={`${safeStats.avgPerformance}%`}
          icon={Shield}
          change={2}
          trend="up"
          description="Performance rating"
        />
        <StatCard
          title="Avg Safety Score"
          value={safeStats.avgSafetyScore}
          icon={Trophy}
          change={8}
          trend="up"
          description="Driver performance"
        />
      </motion.div>

      {/* Driver Performance Chart */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Driver Performance Trends
            </CardTitle>
            <CardDescription>Safety scores and compliance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveLineChart
              title="Driver Performance Trends"
              data={[]}
              dataKeys={['safety_score', 'performance_rating']}
              colors={['#10b981', '#3b82f6']}
              height={300}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Performers */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performers
            </CardTitle>
            <CardDescription>Drivers with highest safety scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {drivers.slice(0, 5).map((driver, index) => (
                <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{driver.name}</p>
                      <p className="text-sm text-muted-foreground">{driver.licenseNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={driver.status === 'active' ? 'default' : 'secondary'}>
                      {driver.status}
                    </Badge>
                    <div className="text-right">
                      <p className="font-semibold">{driver.safetyScore || 0}/100</p>
                      <p className="text-sm text-muted-foreground">Safety Score</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

/**
 * Operations Tab - Dispatch, routing, fuel management
 */
const OperationsTabContent = memo(function OperationsTabContent() {
  const { routes, tasks, fuelTransactions, metrics: stats, isLoading: loading, error, refresh: refetch } = useReactiveOperationsData()

  // Default stats if undefined - use metrics structure from hook
  const safeStats = stats || {
    activeJobs: 0,
    scheduled: 0,
    completed: 0,
    delayed: 0,
    cancelled: 0,
    totalRoutes: 0,
    completionRate: 0,
    avgRouteDistance: 0,
    totalDistance: 0,
    totalFuelCost: 0,
    avgFuelCostPerMile: 0,
    avgFuelCostPerRoute: 0,
    openTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    totalTasks: 0
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error.message || 'Failed to load data. Please try again.'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Operations Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Routes"
          value={safeStats.activeJobs}
          icon={RouteIcon}
          change={4}
          trend="up"
          description="In progress"
        />
        <StatCard
          title="Pending Tasks"
          value={safeStats.openTasks}
          icon={CheckSquare}
          change={3}
          trend="down"
          description="Need assignment"
        />
        <StatCard
          title="Total Fuel Cost"
          value={`$${(safeStats.totalFuelCost || 0).toFixed(2)}`}
          icon={Fuel}
          change={12}
          trend="down"
          description="Total fuel spend"
        />
        <StatCard
          title="Completion Rate"
          value={`${safeStats.completionRate.toFixed(1)}%`}
          icon={TrendingUp}
          change={7}
          trend="up"
          description="Route completion"
        />
      </motion.div>

      {/* Active Routes Map */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Active Routes
            </CardTitle>
            <CardDescription>Real-time route tracking and optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {routes.length > 0 ? (
                routes.slice(0, 5).map(route => (
                  <div key={route.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <RouteIcon className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-semibold">Route #{route.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {route.origin || 'Origin'} → {route.destination || 'Destination'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={route.status === 'in_transit' ? 'default' : 'secondary'}>
                      {route.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No active routes
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Fuel Transactions */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              Recent Fuel Transactions
            </CardTitle>
            <CardDescription>Latest fuel purchases and costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fuelTransactions.length > 0 ? (
                fuelTransactions.slice(0, 5).map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">Vehicle #{transaction.vehicleId}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.amount} gal @ ${(transaction.pricePerUnit || 0).toFixed(2)}/gal
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${transaction.cost.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{transaction.location || 'N/A'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No fuel transactions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

/**
 * Maintenance Tab - Work orders and schedules
 */
const MaintenanceTabContent = memo(function MaintenanceTabContent() {
  // Handler for creating new work order
  const handleCreateWorkOrder = () => {
    toast.success('Opening work order creation form')
    logger.info('Create work order clicked')
    // TODO: Add real API call to create work order
  }

  // Handler for viewing work order details
  const handleViewWorkOrder = (workOrderId: string) => {
    toast.success(`Opening work order: ${workOrderId}`)
    logger.info('View work order clicked:', workOrderId)
    // TODO: Navigate to work order details page or open modal
  }

  // Handler for scheduling maintenance
  const handleScheduleMaintenance = (vehicleId: string) => {
    toast.success(`Scheduling maintenance for vehicle: ${vehicleId}`)
    logger.info('Schedule maintenance clicked:', vehicleId)
    // TODO: Add real API call to schedule maintenance
  }

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Maintenance Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Work Orders"
          value={24}
          icon={ClipboardList}
          change={5}
          trend="down"
          description="Active maintenance tasks"
        />
        <StatCard
          title="Scheduled This Week"
          value={18}
          icon={Calendar}
          change={3}
          trend="up"
          description="Upcoming maintenance"
        />
        <StatCard
          title="Overdue Maintenance"
          value={7}
          icon={AlertTriangle}
          change={2}
          trend="down"
          description="Needs immediate attention"
        />
        <StatCard
          title="Parts Inventory"
          value="$48K"
          icon={Package}
          description="Current stock value"
        />
      </motion.div>

      {/* Work Orders List */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Active Work Orders
              </CardTitle>
              <CardDescription>Current maintenance tasks and their status</CardDescription>
            </div>
            <Button onClick={handleCreateWorkOrder}>
              <Plus className="h-4 w-4 mr-2" />
              New Work Order
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { id: 'WO-2026-001', vehicle: 'Vehicle 1234', type: 'Oil Change', priority: 'normal', status: 'In Progress', dueDate: '2026-01-30' },
                { id: 'WO-2026-002', vehicle: 'Vehicle 5678', type: 'Tire Replacement', priority: 'high', status: 'Pending', dueDate: '2026-01-29' },
                { id: 'WO-2026-003', vehicle: 'Vehicle 9012', type: 'Brake Inspection', priority: 'high', status: 'In Progress', dueDate: '2026-01-31' },
                { id: 'WO-2026-004', vehicle: 'Vehicle 3456', type: 'Battery Replacement', priority: 'normal', status: 'Scheduled', dueDate: '2026-02-02' },
                { id: 'WO-2026-005', vehicle: 'Vehicle 7890', type: 'Transmission Service', priority: 'low', status: 'Pending', dueDate: '2026-02-05' },
              ].map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Tool className={`h-5 w-5 ${
                      order.priority === 'high' ? 'text-red-500' :
                      order.priority === 'normal' ? 'text-blue-500' : 'text-gray-700'
                    }`} />
                    <div>
                      <p className="font-semibold">{order.id} - {order.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.vehicle} · Due: {order.dueDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      order.status === 'In Progress' ? 'default' :
                      order.status === 'Pending' ? 'secondary' : 'outline'
                    }>
                      {order.status}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => handleViewWorkOrder(order.id)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Maintenance Schedule */}
      <motion.div variants={fadeInVariant} className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Maintenance Schedule
            </CardTitle>
            <CardDescription>Scheduled preventive maintenance for the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { vehicle: 'Vehicle 1234', service: '30K Mile Service', date: '2026-02-05', mileage: '29,845' },
                { vehicle: 'Vehicle 5678', service: 'Annual Inspection', date: '2026-02-10', mileage: '42,120' },
                { vehicle: 'Vehicle 9012', service: 'Oil Change', date: '2026-02-15', mileage: '18,900' },
                { vehicle: 'Vehicle 3456', service: 'Tire Rotation', date: '2026-02-20', mileage: '25,300' },
              ].map((maintenance, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{maintenance.vehicle}</p>
                    <p className="text-sm text-muted-foreground">
                      {maintenance.service} · {maintenance.date}
                    </p>
                    <p className="text-xs text-muted-foreground">Current: {maintenance.mileage} mi</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Overdue Maintenance
            </CardTitle>
            <CardDescription>Vehicles requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { vehicle: 'Vehicle 2222', service: 'Oil Change', overdue: '7 days', priority: 'high' },
                { vehicle: 'Vehicle 3333', service: 'Brake Inspection', overdue: '14 days', priority: 'high' },
                { vehicle: 'Vehicle 4444', service: 'Tire Replacement', overdue: '3 days', priority: 'medium' },
              ].map((overdue, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{overdue.vehicle}</p>
                        <p className="text-sm">
                          {overdue.service} · Overdue by {overdue.overdue}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => handleScheduleMaintenance(overdue.vehicle)}>
                        Schedule Now
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Parts Inventory */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Parts Inventory
            </CardTitle>
            <CardDescription>Common maintenance parts and supplies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[
                { part: 'Motor Oil (5W-30)', quantity: 45, unit: 'qt', reorderPoint: 20, status: 'in-stock' },
                { part: 'Air Filters', quantity: 28, unit: 'ea', reorderPoint: 15, status: 'in-stock' },
                { part: 'Brake Pads (Front)', quantity: 8, unit: 'set', reorderPoint: 10, status: 'low-stock' },
                { part: 'Wiper Blades', quantity: 32, unit: 'ea', reorderPoint: 12, status: 'in-stock' },
                { part: 'Batteries (12V)', quantity: 6, unit: 'ea', reorderPoint: 8, status: 'low-stock' },
                { part: 'Coolant', quantity: 18, unit: 'gal', reorderPoint: 10, status: 'in-stock' },
              ].map((item) => (
                <div key={item.part} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">{item.part}</p>
                    <Badge variant={item.status === 'in-stock' ? 'default' : 'destructive'}>
                      {item.status === 'in-stock' ? 'In Stock' : 'Low Stock'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity} {item.unit} · Reorder: {item.reorderPoint}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

/**
 * Assets Tab - Asset tracking and lifecycle management
 */
const AssetsTabContent = memo(function AssetsTabContent() {
  // Handler for viewing asset details
  const handleViewAsset = (assetId: string) => {
    toast.success(`Opening asset details: ${assetId}`)
    logger.info('View asset clicked:', assetId)
    // TODO: Navigate to asset details page or open modal
  }

  // Handler for adding new asset
  const handleAddAsset = () => {
    toast.success('Opening add asset form')
    logger.info('Add asset clicked')
    // TODO: Add real API call to create new asset
  }

  // Handler for scheduling asset maintenance
  const handleScheduleAssetMaintenance = (assetId: string) => {
    toast.success(`Scheduling maintenance for asset: ${assetId}`)
    logger.info('Schedule asset maintenance clicked:', assetId)
    // TODO: Add real API call to schedule asset maintenance
  }

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Asset Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Assets"
          value={142}
          icon={Box}
          change={8}
          trend="up"
          description="Equipment & tools"
        />
        <StatCard
          title="Assets in Use"
          value={118}
          icon={Truck}
          change={5}
          trend="up"
          description="Currently deployed"
        />
        <StatCard
          title="Maintenance Due"
          value={12}
          icon={Wrench}
          change={2}
          trend="down"
          description="Needs servicing"
        />
        <StatCard
          title="Asset Value"
          value="$2.4M"
          icon={DollarSign}
          description="Total fleet value"
        />
      </motion.div>

      {/* Asset Categories */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                Asset Inventory
              </CardTitle>
              <CardDescription>Heavy machinery, equipment, and tools</CardDescription>
            </div>
            <Button onClick={handleAddAsset}>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { id: 'AST-001', name: 'Forklift - Cat 2C5000', category: 'Heavy Machinery', status: 'In Use', location: 'Warehouse A', condition: 'Good' },
                { id: 'AST-002', name: 'Hydraulic Lift - SkyJack', category: 'Heavy Machinery', status: 'In Use', location: 'Job Site 1', condition: 'Excellent' },
                { id: 'AST-003', name: 'Diesel Generator - 50kW', category: 'Power Equipment', status: 'Available', location: 'Equipment Yard', condition: 'Good' },
                { id: 'AST-004', name: 'Welder - Miller MIG 250', category: 'Tools', status: 'In Use', location: 'Workshop', condition: 'Fair' },
                { id: 'AST-005', name: 'Air Compressor - 60 gal', category: 'Tools', status: 'In Use', location: 'Maintenance Bay 2', condition: 'Good' },
                { id: 'AST-006', name: 'Pallet Jack - Manual', category: 'Material Handling', status: 'Available', location: 'Warehouse B', condition: 'Excellent' },
              ].map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Box className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">{asset.id} - {asset.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {asset.category} · {asset.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={asset.status === 'In Use' ? 'default' : 'secondary'}>
                      {asset.status}
                    </Badge>
                    <Badge variant={
                      asset.condition === 'Excellent' ? 'default' :
                      asset.condition === 'Good' ? 'secondary' : 'outline'
                    }>
                      {asset.condition}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => handleViewAsset(asset.id)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Asset Lifecycle & Utilization */}
      <motion.div variants={fadeInVariant} className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Asset Utilization
            </CardTitle>
            <CardDescription>Usage metrics for key assets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsivePieChart
              title="Asset Utilization"
              data={[
                { name: 'In Use', value: 118, fill: '#10b981' },
                { name: 'Available', value: 18, fill: '#3b82f6' },
                { name: 'Maintenance', value: 6, fill: '#f59e0b' },
              ]}
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Asset Maintenance Schedule
            </CardTitle>
            <CardDescription>Upcoming asset servicing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { asset: 'AST-001 - Forklift', service: 'Annual Inspection', dueDate: '2026-02-15', priority: 'high' },
                { asset: 'AST-002 - Hydraulic Lift', service: 'Hydraulic Fluid Change', dueDate: '2026-02-20', priority: 'medium' },
                { asset: 'AST-004 - Welder', service: 'Electrical Safety Check', dueDate: '2026-02-25', priority: 'high' },
                { asset: 'AST-005 - Air Compressor', service: 'Filter Replacement', dueDate: '2026-03-01', priority: 'low' },
              ].map((maintenance, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{maintenance.asset}</p>
                    <p className="text-sm text-muted-foreground">
                      {maintenance.service} · Due: {maintenance.dueDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      maintenance.priority === 'high' ? 'destructive' :
                      maintenance.priority === 'medium' ? 'secondary' : 'outline'
                    }>
                      {maintenance.priority}
                    </Badge>
                    <Button size="sm" onClick={() => handleScheduleAssetMaintenance(maintenance.asset)}>
                      Schedule
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Asset Categories Breakdown */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Asset Categories
            </CardTitle>
            <CardDescription>Breakdown by equipment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[
                { category: 'Heavy Machinery', count: 24, value: '$1.2M' },
                { category: 'Power Equipment', count: 18, value: '$450K' },
                { category: 'Tools & Equipment', count: 52, value: '$280K' },
                { category: 'Material Handling', count: 28, value: '$320K' },
                { category: 'Safety Equipment', count: 15, value: '$95K' },
                { category: 'Other', count: 5, value: '$55K' },
              ].map((cat) => (
                <div key={cat.category} className="p-4 border rounded-lg">
                  <p className="font-semibold">{cat.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-muted-foreground">{cat.count} assets</p>
                    <p className="text-sm font-semibold">{cat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FleetOperationsHub() {
  const [activeTab, setActiveTab] = useState('fleet')
  const { user } = useAuth()

  return (
    <HubPage
      title="Fleet Operations"
      description="Comprehensive fleet management, driver tracking, and operations control"
      icon={<Car className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="fleet" className="flex items-center gap-2" data-testid="hub-tab-fleet">
              <Car className="h-4 w-4" />
              <span className="hidden sm:inline">Fleet</span>
            </TabsTrigger>
            <TabsTrigger value="drivers" className="flex items-center gap-2" data-testid="hub-tab-drivers">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Drivers</span>
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex items-center gap-2" data-testid="hub-tab-operations">
              <OperationsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Operations</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2" data-testid="hub-tab-maintenance">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Maintenance</span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-2" data-testid="hub-tab-assets">
              <Box className="h-4 w-4" />
              <span className="hidden sm:inline">Assets</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="fleet" className="mt-6">
                <ErrorBoundary>
                  <FleetTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="drivers" className="mt-6">
                <ErrorBoundary>
                  <DriversTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="operations" className="mt-6">
                <ErrorBoundary>
                  <OperationsTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="maintenance" className="mt-6">
                <ErrorBoundary>
                  <MaintenanceTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="assets" className="mt-6">
                <ErrorBoundary>
                  <AssetsTabContent />
                </ErrorBoundary>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </HubPage>
  )
}
