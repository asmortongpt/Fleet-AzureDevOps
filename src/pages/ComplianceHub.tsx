/**
 * ComplianceHub - Modern Compliance Management Dashboard
 * Real-time compliance tracking, inspections, reports, and violations monitoring with responsive visualizations
 */

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import {
  Shield as ComplianceIcon,
  CheckCircle,
  Warning,
  ClipboardText,
  Certificate,
  CalendarX,
  TrendUp,
  FileText,
  ListChecks,
  XCircle,
} from '@phosphor-icons/react'
import HubPage from '@/components/ui/hub-page'
import { useReactiveComplianceData } from '@/hooks/use-reactive-compliance-data'
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

/**
 * Overview Tab - Compliance metrics and status
 */
function ComplianceOverview() {
  const {
    metrics,
    statusDistribution,
    complianceByType,
    expiringItems,
    nonCompliantItems,
    isLoading,
    lastUpdate,
  } = useReactiveComplianceData()

  // Prepare chart data for status distribution
  const statusChartData = Object.entries(statusDistribution).map(([name, value]) => ({
    name: name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    value,
    fill:
      name === 'compliant'
        ? 'hsl(var(--success))'
        : name === 'expiring_soon'
          ? 'hsl(var(--warning))'
          : name === 'non_compliant'
            ? 'hsl(var(--destructive))'
            : 'hsl(var(--muted))',
  }))

  // Prepare chart data for compliance by type
  const complianceTypeChartData = Object.entries(complianceByType).map(([name, value]) => ({
    name: name.toUpperCase(),
    value,
  }))

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Compliance Overview</h2>
          <p className="text-muted-foreground">
            Monitor fleet compliance status and upcoming requirements
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Records"
          value={metrics?.totalRecords?.toString() || '0'}
          icon={ClipboardText}
          trend="neutral"
          description="All compliance items"
          loading={isLoading}
        />
        <StatCard
          title="Compliance Rate"
          value={`${metrics?.complianceRate || 0}%`}
          icon={CheckCircle}
          trend="up"
          change="+2%"
          description="Overall compliance"
          loading={isLoading}
        />
        <StatCard
          title="Expiring Soon"
          value={metrics?.expiringSoon?.toString() || '0'}
          icon={CalendarX}
          trend="down"
          change="-3"
          description="Within 30 days"
          loading={isLoading}
        />
        <StatCard
          title="Non-Compliant"
          value={metrics?.nonCompliant?.toString() || '0'}
          icon={Warning}
          trend="down"
          change="-5"
          description="Requires attention"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <ResponsivePieChart
          title="Status Distribution"
          description="Current compliance status across all records"
          data={statusChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Compliance by Type */}
        <ResponsiveBarChart
          title="Compliance by Type"
          description="Records grouped by compliance category"
          data={complianceTypeChartData}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* Alert Sections Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expiring Items */}
        {expiringItems.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarX className="h-5 w-5 text-amber-500" />
                <CardTitle>Expiring Items</CardTitle>
              </div>
              <CardDescription>Compliance items expiring within 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {expiringItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{item.type.toUpperCase()} Compliance</p>
                        <p className="text-sm text-muted-foreground">
                          Expires: {new Date(item.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="warning">
                        {Math.ceil(
                          (new Date(item.expiryDate).getTime() - new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{' '}
                        days
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Non-Compliant Items */}
        {nonCompliantItems.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Warning className="h-5 w-5 text-red-500" />
                <CardTitle>Non-Compliant Items</CardTitle>
              </div>
              <CardDescription>Items requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {nonCompliantItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{item.type.toUpperCase()} Compliance</p>
                        <p className="text-sm text-muted-foreground">
                          Violations: {item.violations || 0}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {item.status === 'expired' ? 'Expired' : 'Non-Compliant'}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

/**
 * Inspections Tab - Inspection tracking and pass rates
 */
function InspectionsContent() {
  const {
    metrics,
    inspectionTrendData,
    failedInspectionsList,
    isLoading,
    lastUpdate,
  } = useReactiveComplianceData()

  const passRate = metrics?.totalInspections > 0
    ? Math.round((metrics.passedInspections / metrics.totalInspections) * 100)
    : 0

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inspections</h2>
          <p className="text-muted-foreground">
            Track inspection history and maintain compliance standards
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Inspections"
          value={metrics?.totalInspections?.toString() || '0'}
          icon={ListChecks}
          trend="up"
          change="+12"
          description="All time"
          loading={isLoading}
        />
        <StatCard
          title="Passed"
          value={metrics?.passedInspections?.toString() || '0'}
          icon={CheckCircle}
          trend="up"
          description="Successful inspections"
          loading={isLoading}
        />
        <StatCard
          title="Failed"
          value={metrics?.failedInspections?.toString() || '0'}
          icon={XCircle}
          trend="down"
          change="-2"
          description="Need remediation"
          loading={isLoading}
        />
        <StatCard
          title="Pass Rate"
          value={`${passRate}%`}
          icon={TrendUp}
          trend="up"
          change="+3%"
          description="Success rate"
          loading={isLoading}
        />
      </div>

      {/* Inspection Trend Chart */}
      <ResponsiveLineChart
        title="Inspection Trend"
        description="Monthly inspection pass/fail rates over time"
        data={inspectionTrendData}
        height={350}
        showArea
        loading={isLoading}
      />

      {/* Failed Inspections List */}
      {failedInspectionsList.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <CardTitle>Recent Failed Inspections</CardTitle>
            </div>
            <CardDescription>Inspections requiring remediation</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {failedInspectionsList.map((inspection, idx) => (
                  <motion.div
                    key={inspection.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {inspection.inspectionType.toUpperCase()} Inspection
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vehicle ID: {inspection.vehicleId} • {inspection.defects} defects
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(inspection.inspectionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="destructive">Failed</Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Reports Tab - Compliance reporting and analytics
 */
function ReportsContent() {
  const { complianceRateByCategory, isLoading, lastUpdate } = useReactiveComplianceData()

  // Calculate averages for stat cards
  const avgComplianceRate = Math.round(
    complianceRateByCategory.reduce((sum, cat) => sum + cat.rate, 0) / complianceRateByCategory.length
  )

  const totalItems = complianceRateByCategory.reduce((sum, cat) => sum + cat.total, 0)
  const totalCompliant = complianceRateByCategory.reduce((sum, cat) => sum + cat.compliant, 0)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Compliance Reports</h2>
          <p className="text-muted-foreground">
            Detailed compliance analytics and performance by category
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Avg Compliance Rate"
          value={`${avgComplianceRate}%`}
          icon={TrendUp}
          trend="up"
          change="+1.5%"
          description="Across all categories"
          loading={isLoading}
        />
        <StatCard
          title="Total Items"
          value={totalItems.toString()}
          icon={FileText}
          trend="neutral"
          description="All compliance items"
          loading={isLoading}
        />
        <StatCard
          title="Compliant Items"
          value={totalCompliant.toString()}
          icon={CheckCircle}
          trend="up"
          description="Fully compliant"
          loading={isLoading}
        />
      </div>

      {/* Compliance Rate by Category Chart */}
      <ResponsiveBarChart
        title="Compliance Rate by Category"
        description="Compliance performance across different regulatory categories"
        data={complianceRateByCategory.map((cat) => ({
          name: cat.name,
          value: cat.rate,
          compliant: cat.compliant,
          total: cat.total,
        }))}
        height={400}
        loading={isLoading}
      />

      {/* Detailed Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>Breakdown of compliance by regulatory category</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {complianceRateByCategory.map((category, idx) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {category.compliant}/{category.total}
                      </span>
                    </div>
                    <Badge
                      variant={
                        category.rate >= 95
                          ? 'default'
                          : category.rate >= 85
                            ? 'secondary'
                            : 'warning'
                      }
                    >
                      {category.rate}%
                    </Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        category.rate >= 95
                          ? 'bg-green-500'
                          : category.rate >= 85
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                      }`}
                      style={{ width: `${category.rate}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Violations Tab - Violations tracking and resolution
 */
function ViolationsContent() {
  const { metrics, nonCompliantItems, isLoading, lastUpdate } = useReactiveComplianceData()

  const resolvedViolations = Math.round(metrics?.totalViolations * 0.75) // Mock 75% resolution rate
  const criticalViolations = nonCompliantItems.filter((item) => (item.violations || 0) > 3).length

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Violations</h2>
          <p className="text-muted-foreground">
            Track and manage compliance violations
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Violations"
          value={metrics?.totalViolations?.toString() || '0'}
          icon={Warning}
          trend="down"
          change="-8"
          description="All violations"
          loading={isLoading}
        />
        <StatCard
          title="Critical"
          value={criticalViolations.toString()}
          icon={XCircle}
          trend="down"
          change="-2"
          description="High priority"
          loading={isLoading}
        />
        <StatCard
          title="Resolved"
          value={resolvedViolations.toString()}
          icon={CheckCircle}
          trend="up"
          change="+15"
          description="Successfully resolved"
          loading={isLoading}
        />
      </div>

      {/* Violations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Warning className="h-5 w-5 text-amber-500" />
            <CardTitle>Active Violations</CardTitle>
          </div>
          <CardDescription>Violations requiring resolution</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : nonCompliantItems.length > 0 ? (
            <div className="space-y-3">
              {nonCompliantItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{item.type.toUpperCase()} Violation</p>
                        {(item.violations || 0) > 3 && (
                          <Badge variant="destructive" className="text-xs">
                            Critical
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Vehicle ID: {item.vehicleId || 'N/A'} • Driver ID: {item.driverId || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Violation Count: {item.violations || 0}
                      </p>
                      {item.lastInspection && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last Inspection: {new Date(item.lastInspection).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={item.status === 'expired' ? 'destructive' : 'warning'}
                    >
                      {item.status === 'expired' ? 'Expired' : 'Non-Compliant'}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No active violations</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Main ComplianceHub Component
 */
export default function ComplianceHub() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <ComplianceIcon className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <ComplianceOverview />
        </ErrorBoundary>
      ),
    },
    {
      id: 'inspections',
      label: 'Inspections',
      icon: <ListChecks className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading inspection data...</div>}>
            <InspectionsContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileText className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading report data...</div>}>
            <ReportsContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'violations',
      label: 'Violations',
      icon: <Warning className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading violation data...</div>}>
            <ViolationsContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Compliance Hub"
      description="Fleet compliance tracking, inspections, and reporting"
      icon={<ComplianceIcon className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}
