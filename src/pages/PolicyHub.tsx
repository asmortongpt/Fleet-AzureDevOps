/**
 * PolicyHub - Modern Policy and Procedures Management Dashboard
 * Real-time policy tracking, compliance monitoring, and procedure management with responsive visualizations
 */

<<<<<<< HEAD
import { motion } from 'framer-motion'
import { Suspense } from 'react'
import { BookOpen as PolicyIcon, FileText, Shield, Bell, AlertTriangle, CheckCircle, RotateCcw, Award, Plus, Users, TrendingUp, CalendarCheck } from 'lucide-react'
=======
import {
  BookOpen as PolicyIcon,
  FileText,
  Shield,
  Bell,
  Warning,
  CheckCircle,
  ClockCounterClockwise,
  Certificate,
  Plus,
  Users,
  TrendUp,
  CalendarCheck,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { Suspense } from 'react'

import ErrorBoundary from '@/components/common/ErrorBoundary'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
>>>>>>> fix/pipeline-eslint-build
import HubPage from '@/components/ui/hub-page'
import { Skeleton } from '@/components/ui/skeleton'
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import { useReactivePolicyData } from '@/hooks/use-reactive-policy-data'

/**
 * Overview Tab - Policy metrics and status overview
 */
function PolicyOverview() {
  const {
    metrics,
    statusDistribution,
    categoryDistribution,
    policiesNeedingReview,
    policiesWithViolations,
    isLoading,
    lastUpdate,
  } = useReactivePolicyData()

  // Prepare chart data for status distribution
  const statusChartData = Object.entries(statusDistribution).map(([name, value]) => ({
    name: name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    value,
    fill:
      name === 'active'
        ? 'hsl(var(--success))'
        : name === 'draft'
          ? 'hsl(var(--warning))'
          : name === 'under_review'
            ? 'hsl(var(--primary))'
            : 'hsl(var(--muted))',
  }))

  // Prepare chart data for category distribution
  const categoryChartData = Object.entries(categoryDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Policy Overview</h2>
          <p className="text-muted-foreground">
            Manage organizational policies and monitor compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="w-fit">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Policy
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Policies"
          value={metrics?.totalPolicies?.toString() || '0'}
          icon={FileText}
          trend="neutral"
          description="All policies"
          loading={isLoading}
        />
        <StatCard
          title="Active Policies"
          value={metrics?.activePolicies?.toString() || '0'}
          icon={CheckCircle}
          trend="up"
          change={+5}
          description="Currently enforced"
          loading={isLoading}
        />
        <StatCard
          title="Acknowledgement Rate"
          value={`${metrics?.acknowledgementRate || 0}%`}
          icon={Users}
          trend="up"
          change="+3%"
          description="Employee adoption"
          loading={isLoading}
        />
        <StatCard
          title="Violations"
          value={metrics?.totalViolations?.toString() || '0'}
          icon={AlertTriangle}
          trend="down"
          change={-2}
          description="Policy violations"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Policy Status Distribution */}
        <ResponsivePieChart
          title="Policy Status Distribution"
          description="Current status of all policies in the system"
          data={statusChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Policies by Category */}
        <ResponsiveBarChart
          title="Policies by Category"
          description="Distribution of policies across categories"
          data={categoryChartData}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* Alert Sections Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Policies Needing Review */}
        {policiesNeedingReview.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-amber-500" />
                <CardTitle>Policies Needing Review</CardTitle>
              </div>
              <CardDescription>Policies due for review within 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {policiesNeedingReview.map((policy, idx) => (
                    <motion.div
                      key={policy.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{policy.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Review Due: {new Date(policy.reviewDate!).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="warning">
                        {Math.ceil(
                          (new Date(policy.reviewDate!).getTime() - new Date().getTime()) /
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

        {/* Policies with Violations */}
        {policiesWithViolations.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle>Policies with Violations</CardTitle>
              </div>
              <CardDescription>Policies requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {policiesWithViolations.map((policy, idx) => (
                    <motion.div
                      key={policy.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{policy.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Category: {policy.category.toUpperCase()}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {policy.violationCount} {policy.violationCount === 1 ? 'violation' : 'violations'}
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
 * Policies Tab - Active policy management and listing
 */
function PoliciesContent() {
  const {
    policies,
    metrics,
    categoryDistribution,
    isLoading,
    lastUpdate,
  } = useReactivePolicyData()

  // Group policies by status
  const activePolicies = policies.filter((p) => p.status === 'active')
  const draftPolicies = policies.filter((p) => p.status === 'draft')
  const underReviewPolicies = policies.filter((p) => p.status === 'under_review')

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Policy Management</h2>
          <p className="text-muted-foreground">
            Browse and manage all organizational policies
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Policies"
          value={activePolicies.length.toString()}
          icon={CheckCircle}
          trend="up"
          description="Currently enforced"
          loading={isLoading}
        />
        <StatCard
          title="Draft Policies"
          value={draftPolicies.length.toString()}
          icon={FileText}
          trend="neutral"
          description="In development"
          loading={isLoading}
        />
        <StatCard
          title="Under Review"
          value={underReviewPolicies.length.toString()}
          icon={RotateCcw}
          trend="neutral"
          description="Pending approval"
          loading={isLoading}
        />
        <StatCard
          title="Total Procedures"
          value={metrics?.totalProcedures?.toString() || '0'}
          icon={FileText}
          trend="up"
          description="Associated procedures"
          loading={isLoading}
        />
      </div>

      {/* Category Distribution Chart */}
      <ResponsiveBarChart
        title="Policies by Category"
        description="Distribution of policies across all categories"
        data={Object.entries(categoryDistribution).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }))}
        height={350}
        loading={isLoading}
      />

      {/* Active Policies List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <CardTitle>Active Policies</CardTitle>
          </div>
          <CardDescription>Currently enforced organizational policies</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : activePolicies.length > 0 ? (
            <div className="space-y-3">
              {activePolicies.slice(0, 10).map((policy, idx) => (
                <motion.div
                  key={policy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{policy.title}</p>
                        <Badge variant="secondary" className="text-xs">
                          v{policy.version}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {policy.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Category: {policy.category.toUpperCase()}</span>
                        <span>•</span>
                        <span>Owner: {policy.owner}</span>
                        <span>•</span>
                        <span>Effective: {new Date(policy.effectiveDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      Active
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No active policies</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Compliance Tab - Policy compliance tracking
 */
function ComplianceContent() {
  const {
    metrics,
    complianceTrendData,
    adoptionByCategory,
    lowCompliancePolicies,
    isLoading,
    lastUpdate,
  } = useReactivePolicyData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Policy Compliance</h2>
          <p className="text-muted-foreground">
            Monitor policy adoption and compliance rates
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Avg Compliance Score"
          value={`${metrics?.avgComplianceScore || 0}%`}
          icon={TrendingUp}
          trend="up"
          change="+2%"
          description="Overall compliance"
          loading={isLoading}
        />
        <StatCard
          title="Acknowledgement Rate"
          value={`${metrics?.acknowledgementRate || 0}%`}
          icon={Award}
          trend="up"
          change="+3%"
          description="Employee adoption"
          loading={isLoading}
        />
        <StatCard
          title="Training Completion"
          value={`${metrics?.trainingCompletionRate || 0}%`}
          icon={Users}
          trend="up"
          change="+1%"
          description="Training complete"
          loading={isLoading}
        />
        <StatCard
          title="Total Violations"
          value={metrics?.totalViolations?.toString() || '0'}
          icon={AlertTriangle}
          trend="down"
          change={-5}
          description="Policy violations"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compliance Trend */}
        <ResponsiveLineChart
          title="Weekly Compliance Trend"
          description="Acknowledgement and training completion rates over time"
          data={complianceTrendData}
          height={300}
          showArea
          loading={isLoading}
        />

        {/* Adoption by Category */}
        <ResponsiveBarChart
          title="Policy Adoption by Category"
          description="Employee adoption rates across policy categories"
          data={adoptionByCategory}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* Low Compliance Policies */}
      {lowCompliancePolicies.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle>Low Compliance Policies</CardTitle>
            </div>
            <CardDescription>Policies with acknowledgement rates below 80%</CardDescription>
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
                {lowCompliancePolicies.map((item, idx) => (
                  <motion.div
                    key={item.policy?.id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.policy?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.acknowledged} of {item.total} employees acknowledged
                      </p>
                    </div>
                    <Badge variant={item.rate >= 60 ? 'warning' : 'destructive'}>
                      {item.rate}%
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Compliance Progress Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Metrics</CardTitle>
          <CardDescription>Current compliance status across all policies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Policy Acknowledgement</span>
                <span className="text-sm text-muted-foreground">
                  {metrics?.acknowledgementRate}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${metrics?.acknowledgementRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Training Completion</span>
                <span className="text-sm text-muted-foreground">
                  {metrics?.trainingCompletionRate}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${metrics?.trainingCompletionRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Compliance Score</span>
                <span className="text-sm text-muted-foreground">
                  {metrics?.avgComplianceScore}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-500"
                  style={{ width: `${metrics?.avgComplianceScore}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Updates Tab - Recent policy changes and activity
 */
function UpdatesContent() {
  const { recentUpdates, policies, isLoading, lastUpdate } = useReactivePolicyData()

  // Calculate update statistics
  const updatesByType = recentUpdates.reduce((acc, update) => {
    acc[update.type] = (acc[update.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Policy Updates</h2>
          <p className="text-muted-foreground">
            Track recent policy changes and activity
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Updates"
          value={recentUpdates.length.toString()}
          icon={Bell}
          trend="neutral"
          description="Recent activity"
          loading={isLoading}
        />
        <StatCard
          title="New Policies"
          value={(updatesByType.created || 0).toString()}
          icon={Plus}
          trend="up"
          description="Recently created"
          loading={isLoading}
        />
        <StatCard
          title="Revisions"
          value={(updatesByType.revised || 0).toString()}
          icon={FileText}
          trend="neutral"
          description="Policy updates"
          loading={isLoading}
        />
        <StatCard
          title="Reviews"
          value={(updatesByType.reviewed || 0).toString()}
          icon={Shield}
          trend="neutral"
          description="Completed reviews"
          loading={isLoading}
        />
      </div>

      {/* Recent Updates Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-blue-500" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
          <CardDescription>Latest policy changes and updates</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : recentUpdates.length > 0 ? (
            <div className="space-y-4">
              {recentUpdates.map((update, idx) => {
                const policy = policies.find((p) => p.id === update.policyId)
                return (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative pl-8 pb-4 border-l-2 border-muted last:border-transparent"
                  >
                    <div
                      className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 border-background ${
                        update.type === 'created'
                          ? 'bg-green-500'
                          : update.type === 'revised'
                            ? 'bg-blue-500'
                            : update.type === 'reviewed'
                              ? 'bg-purple-500'
                              : 'bg-gray-500'
                      }`}
                    />
                    <div className="rounded-lg border p-4 hover:bg-accent/50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{policy?.title || 'Unknown Policy'}</p>
                            <Badge
                              variant={
                                update.type === 'created'
                                  ? 'default'
                                  : update.type === 'revised'
                                    ? 'secondary'
                                    : 'outline'
                              }
                              className="text-xs"
                            >
                              {update.type.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {update.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>By: {update.updatedBy}</span>
                            <span>•</span>
                            <span>{new Date(update.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No recent updates</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Main PolicyHub Component
 */
export default function PolicyHub() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <PolicyIcon className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <PolicyOverview />
        </ErrorBoundary>
      ),
    },
    {
      id: 'policies',
      label: 'Policies',
      icon: <FileText className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading policies...</div>}>
            <PoliciesContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: <Shield className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading compliance data...</div>}>
            <ComplianceContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'updates',
      label: 'Updates',
      icon: <Bell className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading updates...</div>}>
            <UpdatesContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Policy Hub"
      description="Policy and procedures management, compliance tracking"
      icon={<PolicyIcon className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}
