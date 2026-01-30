/**
 * SafetyComplianceHub - Modern Safety & Compliance Management Dashboard
 * Real-time safety incident tracking and compliance monitoring
 */

import { motion } from 'framer-motion'
import { Shield, AlertTriangle, CheckCircle, Cross, FileText, TrendingUp, AlertCircle, Clipboard, Award, BarChart } from 'lucide-react'
import HubPage from '@/components/ui/hub-page'
import { useReactiveSafetyComplianceData } from '@/hooks/use-reactive-safety-compliance-data'
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
 * Overview Tab - Safety stats, incident trends, compliance score, alerts
 */
function SafetyOverview() {
  const {
    metrics,
    criticalIncidents,
    incidentTrendData,
    incidentSeverityDistribution,
    violationTypeDistribution,
    isLoading,
    lastUpdate,
  } = useReactiveSafetyComplianceData()

  // Prepare severity chart data
  const severityChartData = Object.entries(incidentSeverityDistribution).map(([name, value]) => ({
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

  // Prepare violations chart data
  const violationsChartData = Object.entries(violationTypeDistribution).map(([name, value]) => ({
    name,
    value,
  }))

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Safety & Compliance Overview</h2>
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
          title="Total Incidents"
          value={metrics?.totalIncidents?.toString() || '0'}
          icon={AlertCircle}
          trend="neutral"
          description="All incidents"
          loading={isLoading}
        />
        <StatCard
          title="Open Cases"
          value={metrics?.openCases?.toString() || '0'}
          icon={Clipboard}
          trend={metrics && metrics.openCases > 5 ? 'down' : 'up'}
          description="Active investigations"
          loading={isLoading}
        />
        <StatCard
          title="Compliance Rate"
          value={`${metrics?.complianceRate || 0}%`}
          icon={CheckCircle}
          trend={metrics && metrics.complianceRate >= 95 ? 'up' : 'down'}
          description="Overall compliance"
          loading={isLoading}
        />
        <StatCard
          title="Training Completion"
          value={`${metrics?.trainingCompletion || 0}%`}
          icon={Award}
          trend={metrics && metrics.trainingCompletion >= 90 ? 'up' : 'down'}
          description="Safety training"
          loading={isLoading}
        />
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Days Incident Free"
          value={metrics?.daysSinceLastIncident?.toString() || '0'}
          icon={CheckCircle}
          trend="up"
          description="Since last incident"
          loading={isLoading}
        />
        <StatCard
          title="OSHA Compliance"
          value={`${metrics?.oshaCompliance || 100}%`}
          icon={Cross}
          trend="up"
          description="Workplace safety"
          loading={isLoading}
        />
        <StatCard
          title="Active Violations"
          value={metrics?.activeViolations?.toString() || '0'}
          icon={AlertTriangle}
          trend={metrics && metrics.activeViolations > 0 ? 'down' : 'neutral'}
          description="Pending violations"
          loading={isLoading}
        />
        <StatCard
          title="Total Fines"
          value={`$${metrics?.totalFines?.toLocaleString() || '0'}`}
          icon={FileText}
          trend="neutral"
          description="All violations"
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

        {/* Violations by Type */}
        <ResponsiveBarChart
          title="Violations by Type"
          description="Distribution of violations across compliance areas"
          data={violationsChartData}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* Incident Trend Line Chart */}
      <ResponsiveLineChart
        title="Incident Trend (Last 7 Days)"
        description="Daily incident count over the past week"
        data={incidentTrendData}
        height={300}
        showArea
        loading={isLoading}
      />

      {/* Critical Incidents Alert */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle>Critical Incidents</CardTitle>
          </div>
          <CardDescription>High-severity incidents requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : criticalIncidents.length > 0 ? (
            <div className="space-y-2">
              {criticalIncidents.slice(0, 5).map((incident) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                >
                  <div>
                    <p className="font-medium">Incident #{incident.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      Type: {incident.type.replace('_', ' ')} • Vehicle: {incident.vehicleId}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {incident.severity.toUpperCase()}
                  </Badge>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No critical incidents at this time
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Incidents Tab - Incident reports, investigations, root cause analysis
 */
function IncidentsContent() {
  const {
    incidents,
    openIncidents,
    incidentTypeDistribution,
    isLoading,
    lastUpdate,
  } = useReactiveSafetyComplianceData()

  // Prepare incident type chart data
  const typeChartData = Object.entries(incidentTypeDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  // Calculate status metrics
  const investigatingCount = incidents.filter((i) => i.status === 'investigating').length
  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length
  const closedCount = incidents.filter((i) => i.status === 'closed').length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Incident Management</h2>
          <p className="text-muted-foreground">
            Track and investigate safety incidents
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Key Metrics */}
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
          title="Resolved (30d)"
          value={resolvedCount.toString()}
          icon={CheckCircle}
          trend="up"
          description="Recently resolved"
          loading={isLoading}
        />
        <StatCard
          title="Closed (Total)"
          value={closedCount.toString()}
          icon={CheckCircle}
          trend="neutral"
          description="All time"
          loading={isLoading}
        />
      </div>

      {/* Incident Type Distribution Chart */}
      <ResponsiveBarChart
        title="Incidents by Type"
        description="Distribution of safety incidents by category"
        data={typeChartData}
        height={300}
        loading={isLoading}
      />

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
              {openIncidents.map((incident) => (
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
                        <p className="font-semibold">Incident #{incident.id.slice(0, 8)}</p>
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
 * Inspections Tab - Safety inspections, audit results, checklists
 */
function InspectionsContent() {
  const {
    inspections,
    metrics,
    inspectionStatusDistribution,
    isLoading,
    lastUpdate,
  } = useReactiveSafetyComplianceData()

  // Prepare status chart data
  const statusChartData = Object.entries(inspectionStatusDistribution).map(([name, value]) => ({
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
    .filter((i) => i.status === 'pending' || i.status === 'scheduled')
    .slice(0, 10)

  // Calculate inspection type metrics
  const dotAnnual = inspections.filter((i) => i.type === 'dot_annual').length
  const dot90Day = inspections.filter((i) => i.type === 'dot_90day').length
  const oshaInspections = inspections.filter((i) => i.type === 'osha').length
  const dvirCount = inspections.filter((i) => i.type === 'dvir').length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Safety Inspections</h2>
          <p className="text-muted-foreground">
            Inspection schedules, audits, and compliance checks
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Key Metrics */}
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
              {pendingInspections.map((inspection) => (
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
 * Certifications Tab - Required certifications, expiry tracking, training records
 */
function CertificationsContent() {
  const {
    certifications,
    metrics,
    expiringCertifications,
    expiredCertifications,
    certificationStatusDistribution,
    isLoading,
    lastUpdate,
  } = useReactiveSafetyComplianceData()

  // Prepare status chart data
  const statusChartData = Object.entries(certificationStatusDistribution).map(([name, value]) => ({
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
  const cdlCount = certifications.filter((c) => c.type === 'cdl').length
  const medicalCards = certifications.filter((c) => c.type === 'medical_card').length
  const hazmatCerts = certifications.filter((c) => c.type === 'hazmat').length
  const safetyTraining = certifications.filter((c) => c.type === 'safety_training').length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Certifications & Training</h2>
          <p className="text-muted-foreground">
            Driver certifications, training records, and compliance tracking
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Key Metrics */}
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
              {expiringCertifications.map((cert) => {
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
              {expiredCertifications.map((cert) => (
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
 * Main SafetyComplianceHub Component
 */
export default function SafetyComplianceHub() {
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
      id: 'incidents',
      label: 'Incidents',
      icon: <AlertTriangle className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <IncidentsContent />
        </ErrorBoundary>
      ),
    },
    {
      id: 'inspections',
      label: 'Inspections',
      icon: <Clipboard className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <InspectionsContent />
        </ErrorBoundary>
      ),
    },
    {
      id: 'certifications',
      label: 'Certifications',
      icon: <Award className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <CertificationsContent />
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Safety & Compliance"
      description="Comprehensive safety incident management and regulatory compliance monitoring"
      icon={<Shield className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}
