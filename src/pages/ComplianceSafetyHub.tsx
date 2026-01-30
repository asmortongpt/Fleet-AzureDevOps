/**
 * ComplianceSafetyHub - Consolidated Compliance & Safety Management Dashboard
 *
 * Consolidates:
 * - ComplianceHub (regulatory compliance, certifications)
 * - SafetyHub (safety metrics, incidents)
 * - SafetyComplianceHub (combined safety + compliance)
 * - PolicyHub (policy management, enforcement)
 *
 * Features:
 * - Unified compliance and safety monitoring
 * - Real-time compliance status tracking
 * - Incident management and reporting
 * - Policy enforcement tracking
 * - WCAG 2.1 AA accessibility
 * - Performance optimized
 */

import { useState, Suspense, lazy, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  AlertTriangle,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  BookOpen,
  ClipboardCheck,
  Users,
  Car,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckSquare,
  FileCheck,
  ScrollText,
  Gavel,
  BookMarked,
  BarChart
} from 'lucide-react'
import HubPage from '@/components/ui/hub-page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'

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
 * Compliance Tab - Regulatory compliance and certifications
 */
const ComplianceTabContent = memo(function ComplianceTabContent() {
  // Handler for scheduling renewals
  const handleScheduleRenewal = (itemName: string) => {
    toast.success(`Scheduling renewal for: ${itemName}`)
    // TODO: Open scheduling dialog or navigate to scheduling page
    console.log('Schedule renewal clicked:', itemName)
  }

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Compliance Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Compliance Rate"
          value="98.5%"
          icon={CheckCircle}
          change={2}
  trend="up"
          description="Overall compliance"
        />
        <StatCard
          title="Active Certifications"
          value={47}
          icon={Award}
          change={5}
  trend="up"
          description="Valid certificates"
        />
        <StatCard
          title="Expiring Soon"
          value={8}
          icon={Clock}
          change={3}
  trend="down"
          description="Within 30 days"
          variant="warning"
        />
        <StatCard
          title="Non-Compliant"
          value={3}
          icon={XCircle}
          change={1}
  trend="down"
          description="Needs attention"
          variant="destructive"
        />
      </motion.div>

      {/* Compliance Status by Category */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Compliance Status by Category
            </CardTitle>
            <CardDescription>Breakdown of compliance across different areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { category: 'Vehicle Inspections', status: 'compliant', rate: 100 },
                { category: 'Driver Licensing', status: 'compliant', rate: 98 },
                { category: 'Insurance Coverage', status: 'compliant', rate: 100 },
                { category: 'DOT Regulations', status: 'warning', rate: 92 },
                { category: 'Environmental', status: 'compliant', rate: 96 },
              ].map((item) => (
                <div key={item.category} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckSquare className={`h-5 w-5 ${
                      item.status === 'compliant' ? 'text-green-500' : 'text-yellow-500'
                    }`} />
                    <div>
                      <p className="font-semibold">{item.category}</p>
                      <p className="text-sm text-muted-foreground">{item.rate}% compliant</p>
                    </div>
                  </div>
                  <Badge variant={item.status === 'compliant' ? 'default' : 'secondary'}>
                    {item.status === 'compliant' ? 'Compliant' : 'Review Needed'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Renewals */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Renewals
            </CardTitle>
            <CardDescription>Certifications and licenses expiring soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { item: 'Vehicle 1234 - Annual Inspection', daysLeft: 15 },
                { item: 'Driver Smith - CDL Renewal', daysLeft: 22 },
                { item: 'Fleet Insurance - Policy Renewal', daysLeft: 28 },
                { item: 'DOT Safety Certification', daysLeft: 45 },
              ].map((renewal, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileCheck className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">{renewal.item}</p>
                      <p className="text-sm text-muted-foreground">Expires in {renewal.daysLeft} days</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleScheduleRenewal(renewal.item)}>
                    Schedule
                  </Button>
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
 * Safety Tab - Safety metrics and incident management
 */
const SafetyTabContent = memo(function SafetyTabContent() {
  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Safety Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Safety Score"
          value="95.2"
          icon={Shield}
          change={3}
  trend="up"
          description="Fleet average"
        />
        <StatCard
          title="Days Since Incident"
          value={127}
          icon={Award}
          change={127}
  trend="up"
          description="Accident-free streak"
        />
        <StatCard
          title="Open Incidents"
          value={5}
          icon={AlertTriangle}
          change={2}
  trend="down"
          description="Under investigation"
          variant="warning"
        />
        <StatCard
          title="Training Completion"
          value="92%"
          icon={BookOpen}
          change={8}
  trend="up"
          description="Safety training"
        />
      </motion.div>

      {/* Incident Trends */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Incident Trends
            </CardTitle>
            <CardDescription>Safety incidents over time (trending down is good)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveLineChart
              data={[
                { month: 'Jan', incidents: 8 },
                { month: 'Feb', incidents: 6 },
                { month: 'Mar', incidents: 5 },
                { month: 'Apr', incidents: 4 },
                { month: 'May', incidents: 3 },
                { month: 'Jun', incidents: 2 },
              ]}
              dataKeys={['incidents']}
              colors={['#ef4444']}
              height={300}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Incidents */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Incidents
            </CardTitle>
            <CardDescription>Latest safety incidents and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { id: 'INC-001', type: 'Minor Collision', vehicle: 'Vehicle 1234', status: 'Under Review', severity: 'low' },
                { id: 'INC-002', type: 'Near Miss', vehicle: 'Vehicle 5678', status: 'Resolved', severity: 'low' },
                { id: 'INC-003', type: 'Equipment Failure', vehicle: 'Vehicle 9012', status: 'Under Review', severity: 'medium' },
              ].map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-5 w-5 ${
                      incident.severity === 'low' ? 'text-yellow-500' :
                      incident.severity === 'medium' ? 'text-orange-500' : 'text-red-500'
                    }`} />
                    <div>
                      <p className="font-semibold">{incident.id} - {incident.type}</p>
                      <p className="text-sm text-muted-foreground">{incident.vehicle}</p>
                    </div>
                  </div>
                  <Badge variant={incident.status === 'Resolved' ? 'default' : 'secondary'}>
                    {incident.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Safety Training Progress */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Safety Training Progress
            </CardTitle>
            <CardDescription>Driver safety training completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { course: 'Defensive Driving', completed: 45, total: 50 },
                { course: 'Hazmat Handling', completed: 38, total: 40 },
                { course: 'Emergency Response', completed: 50, total: 50 },
                { course: 'Vehicle Inspection', completed: 42, total: 50 },
              ].map((training) => (
                <div key={training.course} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{training.course}</p>
                    <p className="text-sm text-muted-foreground">
                      {training.completed}/{training.total} ({Math.round((training.completed / training.total) * 100)}%)
                    </p>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${(training.completed / training.total) * 100}%` }}
                    />
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
 * Policies Tab - Policy management and enforcement
 */
const PoliciesTabContent = memo(function PoliciesTabContent() {
  // Handler for viewing policy categories
  const handleViewPolicy = (category: string) => {
    toast.success(`Opening policy details for: ${category}`)
    // TODO: Open policy details modal or navigate to policy page
    console.log('View policy clicked:', category)
  }

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Policy Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Policies"
          value={32}
          icon={FileText}
          change={4}
  trend="up"
          description="Currently enforced"
        />
        <StatCard
          title="Policy Adherence"
          value="96%"
          icon={CheckCircle}
          change={2}
  trend="up"
          description="Compliance rate"
        />
        <StatCard
          title="Under Review"
          value={5}
          icon={ScrollText}
          change={1}
  trend="down"
          description="Pending approval"
        />
        <StatCard
          title="Violations"
          value={12}
          icon={Gavel}
          change={3}
  trend="down"
          description="This month"
          variant="warning"
        />
      </motion.div>

      {/* Policy Categories */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookMarked className="h-5 w-5" />
              Policy Categories
            </CardTitle>
            <CardDescription>Fleet policies organized by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { category: 'Vehicle Usage', policies: 8, adherence: 98 },
                { category: 'Driver Conduct', policies: 12, adherence: 95 },
                { category: 'Safety Procedures', policies: 6, adherence: 100 },
                { category: 'Maintenance Standards', policies: 4, adherence: 92 },
                { category: 'Environmental', policies: 2, adherence: 100 },
              ].map((item) => (
                <div key={item.category} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">{item.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.policies} policies · {item.adherence}% adherence
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleViewPolicy(item.category)}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Policy Violations */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Recent Policy Violations
            </CardTitle>
            <CardDescription>Latest policy violations and corrective actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { id: 'VIO-001', policy: 'Speed Limit Policy', driver: 'Driver A', action: 'Warning Issued' },
                { id: 'VIO-002', policy: 'Idle Time Policy', driver: 'Driver B', action: 'Training Required' },
                { id: 'VIO-003', policy: 'Vehicle Inspection', driver: 'Driver C', action: 'Written Warning' },
              ].map((violation) => (
                <div key={violation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-semibold">{violation.id} - {violation.policy}</p>
                      <p className="text-sm text-muted-foreground">{violation.driver}</p>
                    </div>
                  </div>
                  <Badge variant="destructive">{violation.action}</Badge>
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
 * Reporting Tab - Compliance and safety reporting
 */
const ReportingTabContent = memo(function ReportingTabContent() {
  // Handler for viewing reports
  const handleViewReport = (reportName: string) => {
    toast.success(`Opening report: ${reportName}`)
    // TODO: Open report viewer modal or download report
    console.log('View report clicked:', reportName)
  }

  // Handler for generating reports
  const handleGenerateReport = (reportName: string) => {
    toast.success(`Generating report: ${reportName}`)
    // TODO: Trigger report generation API call
    console.log('Generate report clicked:', reportName)
  }

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compliance & Safety Reports
          </CardTitle>
          <CardDescription>Generate and view compliance and safety reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Monthly Safety Report', type: 'Safety', lastGenerated: '2026-01-01' },
              { name: 'Quarterly Compliance Audit', type: 'Compliance', lastGenerated: '2026-01-15' },
              { name: 'Incident Summary Report', type: 'Safety', lastGenerated: '2026-01-20' },
              { name: 'Policy Adherence Report', type: 'Policy', lastGenerated: '2026-01-25' },
            ].map((report) => (
              <div key={report.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-semibold">{report.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.type} · Last generated: {report.lastGenerated}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewReport(report.name)}>
                    View
                  </Button>
                  <Button variant="default" size="sm" onClick={() => handleGenerateReport(report.name)}>
                    Generate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ComplianceSafetyHub() {
  const [activeTab, setActiveTab] = useState('compliance')
  const { user } = useAuth()

  return (
    <HubPage
      title="Compliance & Safety"
      description="Comprehensive compliance monitoring, safety management, and policy enforcement"
      icon={Shield}
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="compliance" className="flex items-center gap-2" data-testid="hub-tab-compliance">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Compliance</span>
            </TabsTrigger>
            <TabsTrigger value="safety" className="flex items-center gap-2" data-testid="hub-tab-safety">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Safety</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-2" data-testid="hub-tab-policies">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Policies</span>
            </TabsTrigger>
            <TabsTrigger value="reporting" className="flex items-center gap-2" data-testid="hub-tab-reports">
              <BarChart className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
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
              <TabsContent value="compliance" className="mt-6">
                <ErrorBoundary>
                  <ComplianceTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="safety" className="mt-6">
                <ErrorBoundary>
                  <SafetyTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="policies" className="mt-6">
                <ErrorBoundary>
                  <PoliciesTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="reporting" className="mt-6">
                <ErrorBoundary>
                  <ReportingTabContent />
                </ErrorBoundary>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </HubPage>
  )
}
