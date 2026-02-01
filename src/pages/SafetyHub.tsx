/**
 * SafetyHub - Modern Safety Management Dashboard
 * Real-time safety monitoring with comprehensive analytics
 */

import {
  ShieldCheck,
  Warning,
  ChartBar,
  Users,
  Car,
  GraduationCap,
  Bell,
  TrendUp,
  TrendDown,
  ClipboardText,
  Award,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'

import ErrorBoundary from '@/components/common/ErrorBoundary'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import HubPage from '@/components/ui/hub-page'
import { Skeleton } from '@/components/ui/skeleton'
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import { useReactiveSafetyData } from '@/hooks/use-reactive-safety-data'

import { AlertCircle, AlertTriangle, CheckCircle, TrendingDown, TrendingUp, Clipboard } from 'lucide-react';
import { BarChart } from 'recharts';
/**
 * Overview Tab - Main safety dashboard with real-time metrics
 */
function SafetyOverview() {
  const {
    metrics,
    alertsByType,
    driverSafetyRanges,
    incidentTrendData,
    criticalActiveAlerts,
    vehiclesNeedingAttention,
    isLoading,
    lastUpdate,
  } = useReactiveSafetyData()

  // Prepare alert distribution chart data
  const alertChartData = Object.entries(alertsByType).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill:
      name === 'critical'
        ? 'hsl(var(--destructive))'
        : name === 'warning'
          ? 'hsl(var(--warning))'
          : 'hsl(var(--primary))',
  }))

  // Prepare safety score distribution
  const safetyScoreChartData = [
    { name: 'Excellent (90+)', value: driverSafetyRanges.excellent, fill: 'hsl(142, 76%, 36%)' },
    { name: 'Good (75-89)', value: driverSafetyRanges.good, fill: 'hsl(var(--primary))' },
    { name: 'Fair (60-74)', value: driverSafetyRanges.fair, fill: 'hsl(var(--warning))' },
    { name: 'Poor (<60)', value: driverSafetyRanges.poor, fill: 'hsl(var(--destructive))' },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Safety Overview</h2>
          <p className="text-muted-foreground">
            Real-time safety monitoring and compliance tracking
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Safety Score"
          value={`${metrics.safetyScore}%`}
          icon={ShieldCheck}
          trend={metrics.safetyScore >= 85 ? 'up' : metrics.safetyScore >= 70 ? 'neutral' : 'down'}
          description="Fleet-wide average"
          loading={isLoading}
        />
        <StatCard
          title="Active Alerts"
          value={metrics.activeAlerts.toString()}
          icon={Bell}
          trend={metrics.activeAlerts > 10 ? 'down' : 'neutral'}
          description={`${metrics.criticalAlerts} critical`}
          loading={isLoading}
        />
        <StatCard
          title="Training Compliance"
          value={`${metrics.trainingCompliance}%`}
          icon={GraduationCap}
          trend={metrics.trainingCompliance >= 90 ? 'up' : 'down'}
          description="Completion rate"
          loading={isLoading}
        />
        <StatCard
          title="Incident Rate (30d)"
          value={metrics.incidentRate.toString()}
          icon={AlertTriangle}
          trend={metrics.incidentRate <= 5 ? 'up' : 'down'}
          description={`${metrics.daysIncidentFree} days incident-free`}
          loading={isLoading}
        />
      </div>

      {/* Critical Alerts Banner */}
      {criticalActiveAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Safety Alerts Require Attention</AlertTitle>
          <AlertDescription>
            {criticalActiveAlerts.length} critical safety alert{criticalActiveAlerts.length > 1 ? 's' : ''} active.
            Review immediately in the Driver Safety or Vehicle Safety tabs.
          </AlertDescription>
        </Alert>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alert Distribution */}
        <ResponsivePieChart
          title="Active Alerts by Type"
          description="Distribution of current safety alerts"
          data={alertChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Driver Safety Score Distribution */}
        <ResponsivePieChart
          title="Driver Safety Score Distribution"
          description="Fleet-wide driver safety performance"
          data={safetyScoreChartData}
          innerRadius={60}
          loading={isLoading}
        />
      </div>

      {/* Incident Trend */}
      <ResponsiveLineChart
        title="Incident Trend (Last 7 Days)"
        description="Daily incident tracking across all categories"
        data={incidentTrendData.map(d => ({ ...d, value: d.total }))}
        height={300}
        showArea
        loading={isLoading}
        dataKeys={['accidents', 'nearMisses', 'hazards']}
      />

      {/* Action Items Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vehicles Needing Attention */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-amber-500" />
              <CardTitle>Vehicles Needing Safety Attention</CardTitle>
            </div>
            <CardDescription>Safety equipment, recalls, or defects</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : vehiclesNeedingAttention.length > 0 ? (
              <div className="space-y-2">
                {vehiclesNeedingAttention.slice(0, 5).map((vehicle) => (
                  <motion.div
                    key={vehicle.vehicleId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{vehicle.vehicleName}</p>
                      <p className="text-sm text-muted-foreground">{vehicle.licensePlate}</p>
                      <div className="mt-1 flex gap-2">
                        {vehicle.activeRecalls > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {vehicle.activeRecalls} Recall{vehicle.activeRecalls > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {vehicle.defectReports > 0 && (
                          <Badge variant="warning" className="text-xs">
                            {vehicle.defectReports} Defect{vehicle.defectReports > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {vehicle.safetyEquipmentStatus !== 'compliant' && (
                          <Badge variant="secondary" className="text-xs">
                            Equipment Issue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                All vehicles are in compliance
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Critical Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle>Critical Active Alerts</CardTitle>
            </div>
            <CardDescription>High priority safety alerts requiring immediate action</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : criticalActiveAlerts.length > 0 ? (
              <div className="space-y-2">
                {criticalActiveAlerts.slice(0, 5).map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 hover:bg-destructive/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-destructive">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="destructive">Critical</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No critical alerts at this time
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Driver Safety Tab - Driver behavior and compliance
 */
function DriverSafetyTab() {
  const {
    driverSafety,
    topRiskDrivers,
    metrics,
    isLoading,
  } = useReactiveSafetyData()

  // Top drivers by violation count for chart
  const violationChartData = topRiskDrivers.slice(0, 10).map((driver) => ({
    name: driver.driverName.split(' ')[0],
    value: driver.violationCount,
    violations: driver.violationCount,
    incidents: driver.incidentCount,
  }))

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Driver Safety</h2>
        <p className="text-muted-foreground">
          Driver behavior analytics and violation tracking
        </p>
      </div>

      {/* Driver Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Drivers"
          value={driverSafety.length.toString()}
          icon={Users}
          description="Monitored drivers"
          loading={isLoading}
        />
        <StatCard
          title="Avg Safety Score"
          value={`${metrics.safetyScore}%`}
          icon={ShieldCheck}
          trend={metrics.safetyScore >= 85 ? 'up' : 'down'}
          description="Fleet average"
          loading={isLoading}
        />
        <StatCard
          title="Total Violations"
          value={metrics.totalViolations.toString()}
          icon={AlertTriangle}
          trend={metrics.totalViolations > 20 ? 'down' : 'neutral'}
          description="All drivers (30d)"
          loading={isLoading}
        />
        <StatCard
          title="High Risk Drivers"
          value={topRiskDrivers.length.toString()}
          icon={TrendingDown}
          trend="down"
          description="Requires intervention"
          loading={isLoading}
        />
      </div>

      {/* Driver Violations Chart */}
      <ResponsiveBarChart
        title="Top 10 Drivers by Violations & Incidents"
        description="Drivers requiring safety intervention"
        data={violationChartData}
        height={350}
        loading={isLoading}
      />

      {/* Risk Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>High Risk Drivers</CardTitle>
          <CardDescription>Drivers with safety concerns requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : topRiskDrivers.length > 0 ? (
            <div className="space-y-3">
              {topRiskDrivers.map((driver) => (
                <motion.div
                  key={driver.driverId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{driver.driverName}</p>
                        <Badge
                          variant={
                            driver.safetyScore.overall >= 75
                              ? 'secondary'
                              : driver.safetyScore.overall >= 60
                                ? 'warning'
                                : 'destructive'
                          }
                        >
                          Score: {driver.safetyScore.overall}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Violations</p>
                          <p className="font-medium">{driver.violationCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Incidents</p>
                          <p className="font-medium">{driver.incidentCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Training</p>
                          <Badge
                            variant={
                              driver.trainingStatus === 'current'
                                ? 'default'
                                : driver.trainingStatus === 'expiring'
                                  ? 'warning'
                                  : 'destructive'
                            }
                            className="text-xs"
                          >
                            {driver.trainingStatus.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Behavior Events</span>
                          <span>
                            {driver.harshBrakingEvents + driver.speedingEvents + driver.distractedDrivingEvents} total
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <div
                            className="h-2 bg-amber-500 rounded"
                            style={{
                              width: `${(driver.harshBrakingEvents / Math.max(driver.harshBrakingEvents + driver.speedingEvents + driver.distractedDrivingEvents, 1)) * 100}%`,
                            }}
                            title={`${driver.harshBrakingEvents} harsh braking events`}
                          />
                          <div
                            className="h-2 bg-red-500 rounded"
                            style={{
                              width: `${(driver.speedingEvents / Math.max(driver.harshBrakingEvents + driver.speedingEvents + driver.distractedDrivingEvents, 1)) * 100}%`,
                            }}
                            title={`${driver.speedingEvents} speeding events`}
                          />
                          <div
                            className="h-2 bg-orange-500 rounded"
                            style={{
                              width: `${(driver.distractedDrivingEvents / Math.max(driver.harshBrakingEvents + driver.speedingEvents + driver.distractedDrivingEvents, 1)) * 100}%`,
                            }}
                            title={`${driver.distractedDrivingEvents} distracted driving events`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No high-risk drivers identified
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Vehicle Safety Tab - Vehicle inspections and compliance
 */
function VehicleSafetyTab() {
  const {
    vehicleSafety,
    vehiclesNeedingAttention,
    vehicleSafetyCompliance,
    isLoading,
  } = useReactiveSafetyData()

  const complianceRate = vehicleSafety.length > 0
    ? Math.round((vehicleSafetyCompliance / vehicleSafety.length) * 100)
    : 0

  // Vehicle safety status distribution
  const safetyStatusData = vehicleSafety.reduce((acc, vehicle) => {
    acc[vehicle.safetyEquipmentStatus] = (acc[vehicle.safetyEquipmentStatus] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statusChartData = Object.entries(safetyStatusData).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value,
    fill:
      name === 'compliant'
        ? 'hsl(142, 76%, 36%)'
        : name === 'needs_attention'
          ? 'hsl(var(--warning))'
          : 'hsl(var(--destructive))',
  }))

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Vehicle Safety</h2>
        <p className="text-muted-foreground">
          Safety equipment, inspections, and compliance tracking
        </p>
      </div>

      {/* Vehicle Safety Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Vehicles"
          value={vehicleSafety.length.toString()}
          icon={Car}
          description="Monitored vehicles"
          loading={isLoading}
        />
        <StatCard
          title="Compliance Rate"
          value={`${complianceRate}%`}
          icon={ShieldCheck}
          trend={complianceRate >= 95 ? 'up' : complianceRate >= 85 ? 'neutral' : 'down'}
          description="Safety equipment"
          loading={isLoading}
        />
        <StatCard
          title="Active Recalls"
          value={vehicleSafety.reduce((sum, v) => sum + v.activeRecalls, 0).toString()}
          icon={AlertTriangle}
          trend="down"
          description="Requires action"
          loading={isLoading}
        />
        <StatCard
          title="Needs Attention"
          value={vehiclesNeedingAttention.length.toString()}
          icon={TrendingDown}
          trend={vehiclesNeedingAttention.length > 10 ? 'down' : 'neutral'}
          description="Safety issues"
          loading={isLoading}
        />
      </div>

      {/* Safety Equipment Status Chart */}
      <ResponsivePieChart
        title="Vehicle Safety Equipment Status"
        description="Fleet-wide safety equipment compliance"
        data={statusChartData}
        innerRadius={60}
        loading={isLoading}
      />

      {/* Vehicles Requiring Attention */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicles Requiring Safety Attention</CardTitle>
          <CardDescription>Safety equipment, recalls, defects, or overdue inspections</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : vehiclesNeedingAttention.length > 0 ? (
            <div className="space-y-3">
              {vehiclesNeedingAttention.map((vehicle) => (
                <motion.div
                  key={vehicle.vehicleId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{vehicle.vehicleName}</p>
                        <Badge variant="secondary">{vehicle.licensePlate}</Badge>
                      </div>
                      <div className="mt-2 space-y-2">
                        {vehicle.activeRecalls > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="text-sm">
                              {vehicle.activeRecalls} Active Recall{vehicle.activeRecalls > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        {vehicle.defectReports > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="text-sm">
                              {vehicle.defectReports} Defect Report{vehicle.defectReports > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        {vehicle.safetyEquipmentStatus !== 'compliant' && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">
                              Safety Equipment: {vehicle.safetyEquipmentStatus.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Last Inspection</p>
                            <p className="font-medium">
                              {new Date(vehicle.lastInspectionDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Next Inspection</p>
                            <p className="font-medium">
                              {new Date(vehicle.nextInspectionDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        vehicle.safetyEquipmentStatus === 'critical'
                          ? 'destructive'
                          : 'warning'
                      }
                    >
                      {vehicle.safetyEquipmentStatus.replace('_', ' ')}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              All vehicles are in compliance
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Training Tab - Safety training and certifications
 */
function TrainingTab() {
  const {
    trainingRecords,
    trainingCategoryData,
    overdueTraining,
    metrics,
    isLoading,
  } = useReactiveSafetyData()

  const completedTraining = trainingRecords.filter((t) => t.status === 'completed').length
  const scheduledTraining = trainingRecords.filter((t) => t.status === 'scheduled').length
  const inProgressTraining = trainingRecords.filter((t) => t.status === 'in_progress').length

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Safety Training</h2>
        <p className="text-muted-foreground">
          Training programs, completion rates, and certifications
        </p>
      </div>

      {/* Training Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Training Compliance"
          value={`${metrics.trainingCompliance}%`}
          icon={GraduationCap}
          trend={metrics.trainingCompliance >= 90 ? 'up' : 'down'}
          description="Overall completion"
          loading={isLoading}
        />
        <StatCard
          title="Completed"
          value={completedTraining.toString()}
          icon={TrendingUp}
          trend="up"
          description="Training programs"
          loading={isLoading}
        />
        <StatCard
          title="In Progress"
          value={inProgressTraining.toString()}
          icon={Clipboard}
          description="Active training"
          loading={isLoading}
        />
        <StatCard
          title="Overdue"
          value={overdueTraining.length.toString()}
          icon={AlertTriangle}
          trend={overdueTraining.length > 0 ? 'down' : 'neutral'}
          description="Requires action"
          loading={isLoading}
        />
      </div>

      {/* Training Completion by Category */}
      <ResponsiveBarChart
        title="Training Completion by Category"
        description="Completion rates across all safety training programs"
        data={trainingCategoryData.map(d => ({ ...d, value: d.completion }))}
        height={300}
        loading={isLoading}
      />

      {/* Overdue Training Alerts */}
      {overdueTraining.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Overdue Training Requires Immediate Attention</AlertTitle>
          <AlertDescription>
            {overdueTraining.length} training program{overdueTraining.length > 1 ? 's are' : ' is'} overdue.
            Review below and schedule immediately to maintain compliance.
          </AlertDescription>
        </Alert>
      )}

      {/* Training Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Training Activity</CardTitle>
          <CardDescription>Scheduled, in-progress, and overdue training programs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : trainingRecords.length > 0 ? (
            <div className="space-y-3">
              {trainingRecords
                .sort((a, b) => {
                  // Sort: overdue first, then by scheduled date
                  if (a.status === 'overdue' && b.status !== 'overdue') return -1
                  if (b.status === 'overdue' && a.status !== 'overdue') return 1
                  return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
                })
                .slice(0, 10)
                .map((training) => (
                  <motion.div
                    key={training.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border p-4 hover:bg-accent/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{training.programName}</p>
                          <Badge
                            variant={
                              training.status === 'completed'
                                ? 'default'
                                : training.status === 'overdue'
                                  ? 'destructive'
                                  : training.status === 'in_progress'
                                    ? 'secondary'
                                    : 'outline'
                            }
                          >
                            {training.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{training.driverName}</p>
                        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Category</p>
                            <p className="font-medium">
                              {training.category.split('_').map(word =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Scheduled</p>
                            <p className="font-medium">
                              {new Date(training.scheduledDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              {training.completionDate ? 'Completed' : training.expiryDate ? 'Expires' : 'Status'}
                            </p>
                            <p className="font-medium">
                              {training.completionDate
                                ? new Date(training.completionDate).toLocaleDateString()
                                : training.expiryDate
                                  ? new Date(training.expiryDate).toLocaleDateString()
                                  : '-'}
                            </p>
                          </div>
                        </div>
                        {training.certificationNumber && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Cert #: {training.certificationNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No training records found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Alerts Tab - Real-time safety alerts and notifications
 */
function AlertsTab() {
  const {
    alerts,
    criticalActiveAlerts,
    metrics,
    isLoading,
  } = useReactiveSafetyData()

  const activeAlerts = alerts.filter((a) => a.status === 'active')
  const acknowledgedAlerts = alerts.filter((a) => a.status === 'acknowledged')
  const resolvedAlerts = alerts.filter((a) => a.status === 'resolved')

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Safety Alerts</h2>
        <p className="text-muted-foreground">
          Real-time safety alerts and notifications
        </p>
      </div>

      {/* Alert Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Alerts"
          value={activeAlerts.length.toString()}
          icon={Bell}
          trend={activeAlerts.length > 5 ? 'down' : 'neutral'}
          description="Requires attention"
          loading={isLoading}
        />
        <StatCard
          title="Critical Alerts"
          value={metrics.criticalAlerts.toString()}
          icon={AlertTriangle}
          trend={metrics.criticalAlerts > 0 ? 'down' : 'up'}
          description="High priority"
          loading={isLoading}
        />
        <StatCard
          title="Acknowledged"
          value={acknowledgedAlerts.length.toString()}
          icon={CheckCircle}
          trend="neutral"
          description="Under review"
          loading={isLoading}
        />
        <StatCard
          title="Resolved (30d)"
          value={resolvedAlerts.length.toString()}
          icon={TrendingUp}
          trend="up"
          description="Recently resolved"
          loading={isLoading}
        />
      </div>

      {/* Critical Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle>Critical Active Alerts</CardTitle>
          </div>
          <CardDescription>High priority safety alerts requiring immediate action</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : criticalActiveAlerts.length > 0 ? (
            <div className="space-y-2">
              {criticalActiveAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 hover:bg-destructive/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-destructive">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No critical alerts at this time
            </p>
          )}
        </CardContent>
      </Card>

      {/* All Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>All Active Alerts</CardTitle>
          <CardDescription>Current safety alerts across the fleet</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : activeAlerts.length > 0 ? (
            <div className="space-y-2">
              {activeAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{alert.title}</p>
                        <Badge
                          variant={
                            alert.type === 'critical'
                              ? 'destructive'
                              : alert.type === 'warning'
                                ? 'warning'
                                : 'secondary'
                          }
                        >
                          {alert.type.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No active alerts at this time
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Incidents Tab - Incident reports and investigations
 */
function IncidentsTab() {
  const {
    incidents,
    openIncidents,
    criticalIncidents,
    metrics,
    isLoading,
  } = useReactiveSafetyComplianceData()

  const investigatingCount = incidents.filter((i: any) => i.status === 'investigating').length
  const resolvedCount = incidents.filter((i: any) => i.status === 'resolved').length

  // Incident severity distribution
  const severityData = incidents.reduce((acc: Record<string, number>, incident: any) => {
    acc[incident.severity] = (acc[incident.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const severityChartData = Object.entries(severityData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill:
      name === 'critical'
        ? 'hsl(var(--destructive))'
        : name === 'high'
          ? 'hsl(var(--warning))'
          : name === 'medium'
            ? 'hsl(var(--info))'
            : 'hsl(var(--success))',
  }))

  // Incident type distribution
  const typeData = incidents.reduce((acc: Record<string, number>, incident: any) => {
    acc[incident.type] = (acc[incident.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const typeChartData = Object.entries(typeData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    value,
  }))

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Incident Management</h2>
        <p className="text-muted-foreground">
          Track and investigate safety incidents
        </p>
      </div>

      {/* Incident Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Incidents"
          value={openIncidents.length.toString()}
          icon={AlertCircle}
          trend="neutral"
          description="Requires action"
          loading={isLoading}
        />
        <StatCard
          title="Under Investigation"
          value={investigatingCount.toString()}
          icon={Clipboard}
          trend="neutral"
          description="Active investigations"
          loading={isLoading}
        />
        <StatCard
          title="Critical Incidents"
          value={criticalIncidents.length.toString()}
          icon={AlertTriangle}
          trend={criticalIncidents.length > 0 ? 'down' : 'neutral'}
          description="High severity"
          loading={isLoading}
        />
        <StatCard
          title="Resolved (30d)"
          value={resolvedCount.toString()}
          icon={CheckCircle}
          trend="up"
          description="Recently resolved"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Incident Severity Distribution */}
        <ResponsivePieChart
          title="Incident Severity Distribution"
          description="Breakdown of incidents by severity level"
          data={severityChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Incidents by Type */}
        <ResponsiveBarChart
          title="Incidents by Type"
          description="Distribution of safety incidents by category"
          data={typeChartData}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* Open Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Open Incidents</CardTitle>
          <CardDescription>Currently active safety incidents requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : openIncidents.length > 0 ? (
            <div className="space-y-2">
              {openIncidents.map((incident: any) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-2 rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          incident.severity === 'critical'
                            ? 'bg-red-500'
                            : incident.severity === 'high'
                              ? 'bg-orange-500'
                              : incident.severity === 'medium'
                                ? 'bg-yellow-500'
                                : 'bg-blue-500'
                        }`}
                      />
                      <div>
                        <p className="font-semibold">Incident #{String(incident.id).slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {incident.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        incident.severity === 'critical' || incident.severity === 'high'
                          ? 'destructive'
                          : 'warning'
                      }
                    >
                      {incident.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{incident.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Vehicle: {incident.vehicleId}</span>
                    <span>Driver: {incident.driverId}</span>
                    <span>Reported: {new Date(incident.reportedDate).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No open incidents at this time
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Inspections Tab - Safety inspections and compliance checks
 */
function InspectionsTab() {
  const {
    inspections,
    metrics,
    isLoading,
  } = useReactiveSafetyComplianceData()

  // Inspection status distribution
  const statusData = inspections.reduce((acc: Record<string, number>, inspection: any) => {
    acc[inspection.status] = (acc[inspection.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statusChartData = Object.entries(statusData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill:
      name === 'completed'
        ? 'hsl(var(--success))'
        : name === 'failed'
          ? 'hsl(var(--destructive))'
          : name === 'scheduled'
            ? 'hsl(var(--warning))'
            : 'hsl(var(--primary))',
  }))

  // Get pending inspections
  const pendingInspections = inspections
    .filter((i: any) => i.status === 'pending' || i.status === 'scheduled')
    .slice(0, 10)

  // Calculate inspection type metrics
  const dotAnnual = inspections.filter((i: any) => i.type === 'dot_annual').length
  const dot90Day = inspections.filter((i: any) => i.type === 'dot_90day').length
  const oshaInspections = inspections.filter((i: any) => i.type === 'osha').length
  const dvirCount = inspections.filter((i: any) => i.type === 'dvir').length

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Safety Inspections</h2>
        <p className="text-muted-foreground">
          Inspection schedules, audits, and compliance checks
        </p>
      </div>

      {/* Inspection Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Inspections"
          value={metrics?.pendingInspections?.toString() || '0'}
          icon={Clipboard}
          trend="neutral"
          description="Scheduled/pending"
          loading={isLoading}
        />
        <StatCard
          title="DOT Annual"
          value={dotAnnual.toString()}
          icon={CheckCircle}
          trend="neutral"
          description="Annual inspections"
          loading={isLoading}
        />
        <StatCard
          title="DOT 90-Day"
          value={dot90Day.toString()}
          icon={CheckCircle}
          trend="neutral"
          description="Quarterly checks"
          loading={isLoading}
        />
        <StatCard
          title="OSHA Inspections"
          value={oshaInspections.toString()}
          icon={Cross}
          trend="up"
          description="Workplace safety"
          loading={isLoading}
        />
      </div>

      {/* Inspection Status Distribution */}
      <ResponsivePieChart
        title="Inspection Status Distribution"
        description="Current status of all safety inspections"
        data={statusChartData}
        innerRadius={60}
        loading={isLoading}
      />

      {/* Pending Inspections List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Inspections</CardTitle>
          <CardDescription>Scheduled and pending safety inspections</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : pendingInspections.length > 0 ? (
            <div className="space-y-2">
              {pendingInspections.map((inspection: any) => (
                <motion.div
                  key={inspection.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div>
                    <p className="font-semibold">
                      {inspection.type.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vehicle: {inspection.vehicleId} • Inspector: {inspection.inspector}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Scheduled: {new Date(inspection.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={inspection.status === 'pending' ? 'warning' : 'secondary'}>
                    {inspection.status.toUpperCase()}
                  </Badge>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No pending inspections at this time
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Certifications Tab - Driver certifications and training records
 */
function CertificationsTab() {
  const {
    certifications,
    metrics,
    expiringCertifications,
    expiredCertifications,
    isLoading,
  } = useReactiveSafetyComplianceData()

  // Certification status distribution
  const statusData = certifications.reduce((acc: Record<string, number>, cert: any) => {
    acc[cert.status] = (acc[cert.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statusChartData = Object.entries(statusData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    value,
    fill:
      name === 'current'
        ? 'hsl(var(--success))'
        : name === 'expiring_soon'
          ? 'hsl(var(--warning))'
          : 'hsl(var(--destructive))',
  }))

  // Calculate certification type metrics
  const cdlCount = certifications.filter((c: any) => c.type === 'cdl').length
  const medicalCards = certifications.filter((c: any) => c.type === 'medical_card').length
  const hazmatCerts = certifications.filter((c: any) => c.type === 'hazmat').length
  const safetyTraining = certifications.filter((c: any) => c.type === 'safety_training').length

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Certifications & Training</h2>
        <p className="text-muted-foreground">
          Driver certifications, training records, and compliance tracking
        </p>
      </div>

      {/* Certification Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="CDL Licenses"
          value={cdlCount.toString()}
          icon={Award}
          trend="neutral"
          description="Commercial drivers"
          loading={isLoading}
        />
        <StatCard
          title="Medical Cards"
          value={medicalCards.toString()}
          icon={Cross}
          trend="neutral"
          description="Medical certifications"
          loading={isLoading}
        />
        <StatCard
          title="Expiring Soon"
          value={metrics?.expiringCertifications?.toString() || '0'}
          icon={AlertTriangle}
          trend={metrics && metrics.expiringCertifications > 5 ? 'down' : 'neutral'}
          description="Within 30 days"
          loading={isLoading}
        />
        <StatCard
          title="Expired"
          value={metrics?.expiredCertifications?.toString() || '0'}
          icon={AlertCircle}
          trend={metrics && metrics.expiredCertifications > 0 ? 'down' : 'neutral'}
          description="Needs renewal"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Certification Status Distribution */}
        <ResponsivePieChart
          title="Certification Status"
          description="Current status of all certifications"
          data={statusChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Certification Types */}
        <Card>
          <CardHeader>
            <CardTitle>Certification Types</CardTitle>
            <CardDescription>Breakdown by certification category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CDL Licenses</span>
                <Badge variant="secondary">{cdlCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Medical Cards</span>
                <Badge variant="secondary">{medicalCards}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">HazMat Certifications</span>
                <Badge variant="secondary">{hazmatCerts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Safety Training</span>
                <Badge variant="secondary">{safetyTraining}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Certifications Alert */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>Expiring Certifications</CardTitle>
          </div>
          <CardDescription>Certifications expiring within the next 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : expiringCertifications.length > 0 ? (
            <div className="space-y-2">
              {expiringCertifications.map((cert: any) => {
                const daysUntilExpiry = Math.floor(
                  (new Date(cert.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )
                return (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                  >
                    <div>
                      <p className="font-medium">
                        {cert.type.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Driver: {cert.driverId} • Cert #: {cert.certificationNumber}
                      </p>
                    </div>
                    <Badge variant={daysUntilExpiry <= 14 ? 'destructive' : 'warning'}>
                      {daysUntilExpiry} days left
                    </Badge>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No certifications expiring soon
            </p>
          )}
        </CardContent>
      </Card>

      {/* Expired Certifications Alert */}
      {expiredCertifications.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle>Expired Certifications</CardTitle>
            </div>
            <CardDescription>Certifications that require immediate renewal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiredCertifications.map((cert: any) => (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-3"
                >
                  <div>
                    <p className="font-medium">
                      {cert.type.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Driver: {cert.driverId} • Expired: {new Date(cert.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="destructive">EXPIRED</Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Main SafetyHub Component
 */
export default function SafetyHub() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <SafetyOverview />
        </ErrorBoundary>
      ),
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <Bell className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <AlertsTab />
        </ErrorBoundary>
      ),
    },
    {
      id: 'incidents',
      label: 'Incidents',
      icon: <AlertTriangle className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <IncidentsTab />
        </ErrorBoundary>
      ),
    },
    {
      id: 'driver-safety',
      label: 'Driver Safety',
      icon: <Users className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <DriverSafetyTab />
        </ErrorBoundary>
      ),
    },
    {
      id: 'vehicle-safety',
      label: 'Vehicle Safety',
      icon: <Car className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <VehicleSafetyTab />
        </ErrorBoundary>
      ),
    },
    {
      id: 'inspections',
      label: 'Inspections',
      icon: <Clipboard className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <InspectionsTab />
        </ErrorBoundary>
      ),
    },
    {
      id: 'training',
      label: 'Training',
      icon: <GraduationCap className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <TrainingTab />
        </ErrorBoundary>
      ),
    },
    {
      id: 'certifications',
      label: 'Certifications',
      icon: <Award className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <CertificationsTab />
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Safety Hub"
      description="Comprehensive safety management and compliance monitoring"
      icon={<ShieldCheck className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}
