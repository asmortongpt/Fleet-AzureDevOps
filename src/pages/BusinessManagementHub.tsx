/**
 * BusinessManagementHub - Consolidated Business Management Dashboard
 *
 * Consolidates:
 * - FinancialHub (budget tracking, cost analysis)
 * - ProcurementHub (vendor management, purchasing)
 * - AnalyticsHub (business intelligence, metrics)
 * - ReportsHub (report generation, dashboards)
 *
 * Features:
 * - Financial oversight and cost analysis
 * - Procurement and vendor management
 * - Business analytics and insights
 * - Comprehensive reporting
 * - WCAG 2.1 AA accessibility
 * - Performance optimized
 */

import { useState, Suspense, lazy, memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  ShoppingCart,
  BarChart,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  CreditCard,
  Wallet,
  PieChart,
  LineChart,
  Download,
  Calendar,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Building,
  Receipt,
  Tag,
  Percent
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
import { getCsrfToken } from '@/hooks/use-api'
import toast from 'react-hot-toast'
import logger from '@/utils/logger';
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import useSWR from 'swr'

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

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' })
    .then((res) => res.json())
    .then((data) => data?.data ?? data)

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

/**
 * Financial Tab - Budget tracking and cost analysis
 */
const FinancialTabContent = memo(function FinancialTabContent() {
  const dateRange = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setMonth(end.getMonth() - 5)
    start.setDate(1)
    return { start, end }
  }, [])

  const dateParams = useMemo(() => {
    return `startDate=${encodeURIComponent(dateRange.start.toISOString())}&endDate=${encodeURIComponent(dateRange.end.toISOString())}`
  }, [dateRange])

  const { data: summary } = useSWR<any>(
    `/api/cost-analysis/summary?${dateParams}`,
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: trends } = useSWR<any[]>(
    "/api/cost-analysis/trends?months=6",
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: budgets } = useSWR<any[]>(
    "/api/cost-analysis/budget-status",
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: invoices } = useSWR<any>(
    "/api/invoices?limit=5",
    fetcher,
    { shouldRetryOnError: false }
  )

  const budgetTotal = useMemo(() => {
    if (!Array.isArray(budgets)) return 0
    return budgets.reduce((sum, b) => sum + Number(b.allocated || b.allocated_amount || 0), 0)
  }, [budgets])

  const spentTotal = Number(summary?.totalCost || summary?.total_cost || 0)

  const costTrendData = useMemo(() => {
    if (!Array.isArray(trends)) return []
    return trends.map((row: any) => ({
      name: row.month,
      month: row.month,
      actual: Number(row.amount || 0)
    }))
  }, [trends])

  const breakdownData = useMemo(() => {
    const breakdown = summary?.categoryBreakdown || summary?.category_breakdown
    if (!Array.isArray(breakdown)) return []
    return breakdown.map((row: any) => ({
      name: row.category || row.name || "Uncategorized",
      value: Number(row.amount || row.value || 0)
    }))
  }, [summary])

  const recentTransactions = useMemo(() => {
    const expenses = summary?.topExpenses || summary?.top_expenses
    if (Array.isArray(expenses) && expenses.length > 0) {
      return expenses.map((row: any) => ({
        description: row.description || "Expense",
        amount: Number(row.amount || 0),
        category: row.category || "General",
        date: row.date || row.transactionDate || row.transaction_date
      }))
    }
    const invoiceRows = Array.isArray(invoices?.data) ? invoices.data : Array.isArray(invoices) ? invoices : []
    return invoiceRows.map((row: any) => ({
      description: row.number ? `Invoice ${row.number}` : "Invoice",
      amount: Number(row.totalAmount || row.total_amount || 0),
      category: row.type || "Invoice",
      date: row.invoiceDate || row.invoice_date || row.createdAt || row.created_at
    }))
  }, [summary, invoices])

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Financial Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Budget"
          value={budgetTotal > 0 ? `$${budgetTotal.toLocaleString()}` : "—"}
          icon={Wallet}
          description="Current fiscal quarter"
        />
        <StatCard
          title="Actual Spend"
          value={spentTotal > 0 ? `$${spentTotal.toLocaleString()}` : "—"}
          icon={DollarSign}
          description="Last 6 months"
        />
        <StatCard
          title="Cost Per Mile"
          value="—"
          icon={TrendingDown}
          description="Insufficient data"
        />
        <StatCard
          title="Savings YTD"
          value="—"
          icon={Target}
          description="Insufficient data"
        />
      </motion.div>

      {/* Cost Trend */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Cost Trend
            </CardTitle>
            <CardDescription>Monthly actual costs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveBarChart
              title="Actual Costs"
              data={costTrendData}
              dataKeys={['actual']}
              colors={['#10b981']}
              height={300}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Cost Breakdown */}
      <motion.div variants={fadeInVariant} className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Cost Breakdown by Category
            </CardTitle>
            <CardDescription>Distribution of fleet expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsivePieChart
              title="Cost Breakdown by Category"
              data={breakdownData}
              height={300}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Latest fleet expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent transactions available.</div>
              ) : (
                recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.category} · {transaction.date ? new Date(transaction.date).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <p className="font-semibold">${transaction.amount.toFixed(2)}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

/**
 * Procurement Tab - Vendor management and purchasing
 */
const ProcurementTabContent = memo(function ProcurementTabContent() {
  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Procurement Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Vendors"
          value={24}
          icon={Building}
          change={3}
          trend="up"
          description="Approved suppliers"
        />
        <StatCard
          title="Open Purchase Orders"
          value={18}
          icon={ShoppingCart}
          change={5}
          trend="down"
          description="Pending delivery"
        />
        <StatCard
          title="Avg Vendor Rating"
          value="4.6/5"
          icon={Award}
          change={0.2}
          trend="up"
          description="Supplier quality"
        />
        <StatCard
          title="Cost Savings"
          value="$12,450"
          icon={Percent}
          change={18}
          trend="up"
          description="Through negotiation"
        />
      </motion.div>

      {/* Active Vendors */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Top Vendors
            </CardTitle>
            <CardDescription>Most frequently used suppliers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'ABC Auto Parts', category: 'Parts & Supplies', orders: 45, rating: 4.8 },
                { name: 'Quality Fuel Co.', category: 'Fuel Supply', orders: 38, rating: 4.7 },
                { name: 'Fleet Maintenance Pros', category: 'Service Provider', orders: 32, rating: 4.9 },
                { name: 'Tire World', category: 'Tires', orders: 28, rating: 4.5 },
              ].map((vendor) => (
                <div key={vendor.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.category} · {vendor.orders} orders
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{vendor.rating}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Purchase Orders */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Purchase Orders
            </CardTitle>
            <CardDescription>Latest procurement requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { po: 'PO-2026-001', vendor: 'ABC Auto Parts', items: 'Brake Pads (x12)', status: 'Delivered', amount: 1200 },
                { po: 'PO-2026-002', vendor: 'Quality Fuel Co.', items: 'Diesel Fuel (500 gal)', status: 'In Transit', amount: 1750 },
                { po: 'PO-2026-003', vendor: 'Tire World', items: 'Truck Tires (x8)', status: 'Pending', amount: 3200 },
              ].map((order) => (
                <div key={order.po} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{order.po}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.vendor} · {order.items}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      order.status === 'Delivered' ? 'default' :
                      order.status === 'In Transit' ? 'secondary' : 'outline'
                    }>
                      {order.status}
                    </Badge>
                    <p className="font-semibold">${order.amount.toFixed(2)}</p>
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
 * Analytics Tab - Business intelligence and metrics
 */
const AnalyticsTabContent = memo(function AnalyticsTabContent() {
  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Analytics Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Fleet Utilization"
          value="87%"
          icon={BarChart}
          change={5}
          trend="up"
          description="Vehicle usage"
        />
        <StatCard
          title="ROI"
          value="142%"
          icon={TrendingUp}
          change={8}
          trend="up"
          description="Return on investment"
        />
        <StatCard
          title="Efficiency Score"
          value="8.4/10"
          icon={Target}
          change={0.3}
          trend="up"
          description="Overall performance"
        />
        <StatCard
          title="Cost Reduction"
          value="18%"
          icon={TrendingDown}
          change={4}
          trend="up"
          description="vs last year"
        />
      </motion.div>

      {/* Performance Trends */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Key Performance Indicators
            </CardTitle>
            <CardDescription>Tracking critical business metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveLineChart
              title="Key Performance Indicators"
              data={[
                { name: 'Jan', month: 'Jan', utilization: 82, efficiency: 7.8, roi: 135 },
                { name: 'Feb', month: 'Feb', utilization: 85, efficiency: 8.0, roi: 138 },
                { name: 'Mar', month: 'Mar', utilization: 84, efficiency: 8.1, roi: 140 },
                { name: 'Apr', month: 'Apr', utilization: 86, efficiency: 8.2, roi: 141 },
                { name: 'May', month: 'May', utilization: 88, efficiency: 8.3, roi: 142 },
                { name: 'Jun', month: 'Jun', utilization: 87, efficiency: 8.4, roi: 142 },
              ]}
              dataKeys={['utilization', 'efficiency']}
              colors={['#3b82f6', '#10b981']}
              height={300}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Analytics Insights */}
      <motion.div variants={fadeInVariant} className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goal Progress
            </CardTitle>
            <CardDescription>Business objectives and targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { goal: 'Reduce Fuel Costs', current: 85, target: 100 },
                { goal: 'Increase Utilization', current: 87, target: 90 },
                { goal: 'Improve Safety Score', current: 95, target: 98 },
                { goal: 'Vendor Cost Savings', current: 78, target: 80 },
              ].map((item) => (
                <div key={item.goal} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{item.goal}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.current}% / {item.target}%
                    </p>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${(item.current / item.target) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Key Insights
            </CardTitle>
            <CardDescription>Data-driven recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { insight: 'Fuel costs trending down 12% this month', type: 'positive' },
                { insight: 'Vehicle 1234 maintenance overdue by 7 days', type: 'warning' },
                { insight: '3 drivers eligible for performance bonus', type: 'positive' },
                { insight: 'Fleet utilization below target in Region B', type: 'warning' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {item.type === 'positive' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  )}
                  <p className="text-sm">{item.insight}</p>
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
 * Reports Tab - Report generation and dashboards
 */
const ReportsTabContent = memo(function ReportsTabContent() {
  const { data: reportTemplates } = useSWR<any[]>(
    '/api/reports/templates',
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: scheduledReports } = useSWR<any[]>(
    '/api/reports/scheduled',
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: reportHistory } = useSWR<any[]>(
    '/api/reports/history',
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: customReports } = useSWR<any[]>(
    '/api/custom-reports',
    fetcher,
    { shouldRetryOnError: false }
  )

  const templates = Array.isArray(reportTemplates) ? reportTemplates : []
  const history = Array.isArray(reportHistory) ? reportHistory : []
  const schedules = Array.isArray(scheduledReports) ? scheduledReports : []
  const custom = Array.isArray(customReports) ? customReports : []

  const generatedThisMonth = useMemo(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    return history.filter((item) => {
      const date = item.generatedAt ? new Date(item.generatedAt) : null
      if (!date || Number.isNaN(date.getTime())) return false
      return date.getMonth() === month && date.getFullYear() === year
    }).length
  }, [history])

  // Handler for generating reports
  const handleGenerateReport = async (reportId: string, reportName: string) => {
    try {
      const csrfToken = await getCsrfToken()
      const response = await fetch('/api/reports/execute', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
        },
        body: JSON.stringify({
          reportId,
          filters: {}
        })
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload.error || 'Failed to generate report')
      }

      toast.success(`Report generated: ${reportName}`)
      logger.info('Report generated:', reportName)
    } catch (error) {
      logger.error('Generate report failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate report')
    }
  }

  // Handler for downloading reports
  const handleDownloadReport = (reportName: string, downloadUrl?: string) => {
    if (!downloadUrl) {
      toast.error('Download link not available for this report')
      return
    }
    window.open(downloadUrl, '_blank', 'noopener,noreferrer')
    toast.success(`Downloading report: ${reportName}`)
    logger.info('Download report:', reportName)
  }

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Report Categories */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Available Reports"
          value={templates.length}
          icon={FileText}
          description="Report templates"
        />
        <StatCard
          title="Generated This Month"
          value={generatedThisMonth}
          icon={Download}
          description="Report instances"
        />
        <StatCard
          title="Scheduled Reports"
          value={schedules.length}
          icon={Calendar}
          description="Auto-generated"
        />
        <StatCard
          title="Custom Dashboards"
          value={custom.length}
          icon={BarChart}
          description="User created"
        />
      </motion.div>

      {/* Report Library */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Library
            </CardTitle>
            <CardDescription>Available reports and templates</CardDescription>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-sm text-muted-foreground">No report templates available.</div>
            ) : (
              <div className="space-y-3">
                {templates.map((report: any) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-semibold">{report.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.category || report.domain || 'General'} · {report.isCore ? 'Core' : 'Custom'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateReport(report.id, report.title)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Generate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Reports */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recently Generated
            </CardTitle>
            <CardDescription>Latest report outputs</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground">No report history yet.</div>
            ) : (
              <div className="space-y-3">
                {history.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Generated by {item.generatedBy || 'System'} · {item.generatedAt ? new Date(item.generatedAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(item.title, item.downloadUrl)}
                      disabled={!item.downloadUrl}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BusinessManagementHub() {
  const [activeTab, setActiveTab] = useState('financial')
  const { user } = useAuth()

  return (
    <HubPage
      title="Business Management"
      description="Financial oversight, procurement, analytics, and comprehensive reporting"
      icon={<BarChart className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="financial" className="flex items-center gap-2" data-testid="hub-tab-financial" aria-label="Financial">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financial</span>
            </TabsTrigger>
            <TabsTrigger value="procurement" className="flex items-center gap-2" data-testid="hub-tab-procurement" aria-label="Procurement">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Procurement</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2" data-testid="hub-tab-analytics" aria-label="Analytics">
              <BarChart className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2" data-testid="hub-tab-reports" aria-label="Reports">
              <FileText className="h-4 w-4" />
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
              <TabsContent value="financial" className="mt-6">
                <ErrorBoundary>
                  <FinancialTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="procurement" className="mt-6">
                <ErrorBoundary>
                  <ProcurementTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <ErrorBoundary>
                  <AnalyticsTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="reports" className="mt-6">
                <ErrorBoundary>
                  <ReportsTabContent />
                </ErrorBoundary>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </HubPage>
  )
}
