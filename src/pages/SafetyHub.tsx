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
          icon={Warning}
          trend={metrics.incidentRate <= 5 ? 'up' : 'down'}
          description={`${metrics.daysIncidentFree} days incident-free`}
          loading={isLoading}
        />
      </div>

      {/* Critical Alerts Banner */}
      {criticalActiveAlerts.length > 0 && (
        <Alert variant="destructive">
          <Warning className="h-4 w-4" />
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
        data={incidentTrendData}
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
              <Warning className="h-5 w-5 text-red-500" />
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
          icon={Warning}
          trend={metrics.totalViolations > 20 ? 'down' : 'neutral'}
          description="All drivers (30d)"
          loading={isLoading}
        />
        <StatCard
          title="High Risk Drivers"
          value={topRiskDrivers.length.toString()}
          icon={TrendDown}
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
        dataKeys={['violations', 'incidents']}
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
                            driver.safetyScore >= 75
                              ? 'secondary'
                              : driver.safetyScore >= 60
                                ? 'warning'
                                : 'destructive'
                          }
                        >
                          Score: {driver.safetyScore}
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
          icon={Warning}
          trend="down"
          description="Requires action"
          loading={isLoading}
        />
        <StatCard
          title="Needs Attention"
          value={vehiclesNeedingAttention.length.toString()}
          icon={TrendDown}
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
                            <Warning className="h-4 w-4 text-red-500" />
                            <span className="text-sm">
                              {vehicle.activeRecalls} Active Recall{vehicle.activeRecalls > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        {vehicle.defectReports > 0 && (
                          <div className="flex items-center gap-2">
                            <Warning className="h-4 w-4 text-amber-500" />
                            <span className="text-sm">
                              {vehicle.defectReports} Defect Report{vehicle.defectReports > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        {vehicle.safetyEquipmentStatus !== 'compliant' && (
                          <div className="flex items-center gap-2">
                            <Warning className="h-4 w-4 text-orange-500" />
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
          icon={TrendUp}
          trend="up"
          description="Training programs"
          loading={isLoading}
        />
        <StatCard
          title="In Progress"
          value={inProgressTraining.toString()}
          icon={ClipboardText}
          description="Active training"
          loading={isLoading}
        />
        <StatCard
          title="Overdue"
          value={overdueTraining.length.toString()}
          icon={Warning}
          trend={overdueTraining.length > 0 ? 'down' : 'neutral'}
          description="Requires action"
          loading={isLoading}
        />
      </div>

      {/* Training Completion by Category */}
      <ResponsiveBarChart
        title="Training Completion by Category"
        description="Completion rates across all safety training programs"
        data={trainingCategoryData}
        height={300}
        loading={isLoading}
        dataKeys={['completion']}
      />

      {/* Overdue Training Alerts */}
      {overdueTraining.length > 0 && (
        <Alert variant="destructive">
          <Warning className="h-4 w-4" />
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
 * Main SafetyHub Component
 */
export default function SafetyHub() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <ChartBar className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <SafetyOverview />
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
      id: 'training',
      label: 'Training',
      icon: <GraduationCap className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <TrainingTab />
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
