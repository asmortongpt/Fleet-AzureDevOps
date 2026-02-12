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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useAuth } from '@/contexts'
import { getCsrfToken } from '@/hooks/use-api'
import { useReactiveAnalyticsData } from '@/hooks/use-reactive-analytics-data'
import { useFleetData } from '@/hooks/use-fleet-data'
import toast from 'react-hot-toast'
import logger from '@/utils/logger';
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import useSWR from 'swr'

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
  const { workOrders: fleetWorkOrders, vehicles } = useFleetData()

  // Work order cost aggregation
  const workOrderCosts = useMemo(() => {
    const totalPartsCost = fleetWorkOrders.reduce((sum: number, wo: any) => sum + Number(wo.parts_cost || 0), 0)
    const totalLaborCost = fleetWorkOrders.reduce((sum: number, wo: any) => sum + Number(wo.labor_cost || 0), 0)
    const totalWoCost = fleetWorkOrders.reduce((sum: number, wo: any) => sum + Number(wo.total_cost || wo.cost || 0), 0)
    return { totalPartsCost, totalLaborCost, totalWoCost }
  }, [fleetWorkOrders])

  // Department-level cost breakdowns from work orders
  const departmentCosts = useMemo(() => {
    const deptMap = new Map<string, number>()
    fleetWorkOrders.forEach((wo: any) => {
      // Match work order to vehicle to get department
      const vehicle = vehicles.find((v: any) => v.id === (wo.vehicleId || wo.vehicle_id))
      const dept = vehicle?.department || wo.department || 'Unassigned'
      const cost = Number(wo.total_cost || wo.cost || 0)
      deptMap.set(dept, (deptMap.get(dept) || 0) + cost)
    })
    return Array.from(deptMap.entries())
      .map(([department, cost]) => ({ department, cost }))
      .sort((a, b) => b.cost - a.cost)
  }, [fleetWorkOrders, vehicles])

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

  const { data: costSummary } = useSWR<any>(
    '/api/dashboard/costs/summary?period=monthly',
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: fleetMetrics } = useSWR<any>(
    '/api/fleet/metrics',
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
  const totalMileage = Number(fleetMetrics?.totalMileage || fleetMetrics?.total_mileage || 0)

  const costPerMile = useMemo(() => {
    const reported = Number(costSummary?.cost_per_mile ?? costSummary?.costPerMile)
    if (Number.isFinite(reported) && reported > 0) return reported
    if (totalMileage > 0) return spentTotal / totalMileage
    return 0
  }, [costSummary, totalMileage, spentTotal])

  const savingsYtd = useMemo(() => {
    if (budgetTotal <= 0) return 0
    const delta = budgetTotal - spentTotal
    return delta > 0 ? delta : 0
  }, [budgetTotal, spentTotal])

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

  const recentTransactions = useMemo((): { description: string; amount: number; category: string; date: string }[] => {
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
    <div className="space-y-6">
      {/* Financial Statistics */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
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
          value={costPerMile > 0 ? `$${costPerMile.toFixed(2)}` : "$0.00"}
          icon={TrendingDown}
          description={costSummary?.target_cost_per_mile
            ? `Target $${Number(costSummary.target_cost_per_mile).toFixed(2)}`
            : "Computed from fleet totals"
          }
        />
        <StatCard
          title="Savings YTD"
          value={savingsYtd > 0 ? `$${savingsYtd.toLocaleString()}` : "$0"}
          icon={Target}
          description={budgetTotal > 0 ? "Budget vs spend" : "No budget allocations"}
        />
      </div>

      {/* Cost Trend */}
      <div>
        <Section
          title="Cost Trend"
          description="Monthly actual costs"
          icon={<BarChart className="h-5 w-5" />}
        >
          <ResponsiveBarChart
            title="Actual Costs"
            data={costTrendData}
            dataKeys={['actual']}
            colors={['#10b981']}
            height={300}
          />
        </Section>
      </div>

      {/* Cost Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Section
          title="Cost Breakdown by Category"
          description="Distribution of fleet expenses"
          icon={<PieChart className="h-5 w-5" />}
        >
          <ResponsivePieChart
            title="Cost Breakdown by Category"
            data={breakdownData}
            height={300}
          />
        </Section>

        <Section
          title="Recent Transactions"
          description="Latest fleet expenses"
          icon={<Receipt className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent transactions available.</div>
            ) : (
              recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-3">
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
        </Section>
      </div>

      {/* Work Order Cost Breakdown */}
      <div>
        <Section
          title="Work Order Cost Breakdown"
          description="Parts and labor costs from maintenance work orders"
          icon={<Tag className="h-5 w-5" />}
        >
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <div className="rounded-xl border border-border/60 bg-background/60 p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Parts Cost</p>
              <p className="text-xl font-bold text-blue-500">
                {workOrderCosts.totalPartsCost > 0 ? `$${workOrderCosts.totalPartsCost.toLocaleString()}` : '$0'}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Labor Cost</p>
              <p className="text-xl font-bold text-orange-500">
                {workOrderCosts.totalLaborCost > 0 ? `$${workOrderCosts.totalLaborCost.toLocaleString()}` : '$0'}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Work Order Cost</p>
              <p className="text-xl font-bold">
                {workOrderCosts.totalWoCost > 0 ? `$${workOrderCosts.totalWoCost.toLocaleString()}` : '$0'}
              </p>
            </div>
          </div>
        </Section>
      </div>

      {/* Department-Level Cost Breakdown */}
      <div>
        <Section
          title="Cost by Department"
          description="Work order costs grouped by vehicle department"
          icon={<Building className="h-5 w-5" />}
        >
          <div className="space-y-2">
            {departmentCosts.length > 0 ? departmentCosts.map((dept) => (
              <div key={dept.department} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-3">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{dept.department}</span>
                </div>
                <span className="font-semibold">${dept.cost.toLocaleString()}</span>
              </div>
            )) : (
              <div className="text-sm text-muted-foreground">No department cost data available.</div>
            )}
          </div>
        </Section>
      </div>
    </div>
  )
})

/**
 * Procurement Tab - Vendor management and purchasing
 */
const ProcurementTabContent = memo(function ProcurementTabContent() {
  const { workOrders: fleetWorkOrders } = useFleetData()

  const { data: vendorsResponse } = useSWR<any>(
    '/api/vendors',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: purchaseOrdersResponse } = useSWR<any>(
    '/api/purchase-orders?limit=50',
    fetcher,
    { shouldRetryOnError: false }
  )

  const vendors = Array.isArray(vendorsResponse) ? vendorsResponse : (vendorsResponse?.data || [])
  const purchaseOrders = Array.isArray(purchaseOrdersResponse)
    ? purchaseOrdersResponse
    : (purchaseOrdersResponse?.data || [])

  // Vendor costs from work orders
  const vendorWoCosts = useMemo(() => {
    const map = new Map<string, { totalCost: number; partsCost: number; laborCost: number; count: number }>()
    fleetWorkOrders.forEach((wo: any) => {
      const vendorId = wo.vendor_id || wo.vendorId
      if (!vendorId) return
      const existing = map.get(vendorId) || { totalCost: 0, partsCost: 0, laborCost: 0, count: 0 }
      existing.totalCost += Number(wo.total_cost || wo.cost || 0)
      existing.partsCost += Number(wo.parts_cost || 0)
      existing.laborCost += Number(wo.labor_cost || 0)
      existing.count += 1
      map.set(vendorId, existing)
    })
    return map
  }, [fleetWorkOrders])

  const activeVendors = vendors.filter((v: any) => v.isActive !== false)
  const openOrders = purchaseOrders.filter((po: any) => {
    const status = (po.status || '').toLowerCase()
    return status && !['delivered', 'closed', 'cancelled', 'complete'].includes(status)
  })

  const avgVendorRating = vendors.length > 0
    ? (vendors.reduce((sum: number, v: any) => sum + Number(v.rating || 0), 0) / vendors.length).toFixed(1)
    : null

  const ordersByVendor = useMemo(() => {
    const map = new Map<string, number>()
    purchaseOrders.forEach((po: any) => {
      const id = po.vendorId || po.vendor_id
      if (!id) return
      map.set(id, (map.get(id) || 0) + 1)
    })
    return map
  }, [purchaseOrders])

  const topVendors = useMemo((): { id: string; name: string; category: string; orders: number; rating: number; woCost: number }[] => {
    return vendors
      .map((vendor: any) => {
        const woCostData = vendorWoCosts.get(vendor.id)
        return {
          id: vendor.id,
          name: vendor.name,
          category: vendor.type || vendor.category || 'Vendor',
          orders: (ordersByVendor.get(vendor.id) || 0) + (woCostData?.count || 0),
          rating: vendor.rating,
          woCost: woCostData?.totalCost || 0
        }
      })
      .sort((a: { orders: number }, b: { orders: number }) => b.orders - a.orders)
      .slice(0, 4)
  }, [vendors, ordersByVendor, vendorWoCosts])

  const recentPurchaseOrders = useMemo((): { id: string; number: string; vendor: string; status: string; amount: number }[] => {
    return purchaseOrders.slice(0, 5).map((po: any) => ({
      id: po.id,
      number: po.number,
      vendor: po.vendorName || po.vendor_name || 'Vendor',
      status: po.status,
      amount: Number(po.totalAmount || po.total_amount || 0)
    }))
  }, [purchaseOrders])

  return (
    <div className="space-y-6">
      {/* Procurement Statistics */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Vendors"
          value={activeVendors.length}
          icon={Building}
          description="Approved suppliers"
        />
        <StatCard
          title="Open Purchase Orders"
          value={openOrders.length}
          icon={ShoppingCart}
          description="Pending delivery"
        />
        <StatCard
          title="Avg Vendor Rating"
          value={avgVendorRating ? `${avgVendorRating}/5` : '—'}
          icon={Award}
          description="Supplier quality"
        />
        <StatCard
          title="WO Vendor Spend"
          value={(() => {
            let total = 0
            vendorWoCosts.forEach((v) => { total += v.totalCost })
            return total > 0 ? `$${total.toLocaleString()}` : '$0'
          })()}
          icon={CreditCard}
          description="Work order vendor costs"
        />
      </div>

      {/* Active Vendors */}
      <div>
        <Section
          title="Top Vendors"
          description="Most frequently used suppliers"
          icon={<Building className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {topVendors.length > 0 ? topVendors.map((vendor) => (
              <div key={vendor.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-semibold">{vendor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {vendor.category} · {vendor.orders} orders
                      {vendor.woCost > 0 && (
                        <span className="ml-2 text-orange-500">· WO spend: ${vendor.woCost.toLocaleString()}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">{vendor.rating ? `${vendor.rating}/5` : '—'}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                No vendor activity available
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Purchase Orders */}
      <div>
        <Section
          title="Recent Purchase Orders"
          description="Latest procurement requests"
          icon={<ShoppingCart className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {recentPurchaseOrders.length > 0 ? recentPurchaseOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                <div>
                  <p className="font-semibold">{order.number || order.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.vendor}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={
                    order.status === 'delivered' ? 'default' :
                    order.status === 'in_transit' ? 'secondary' : 'outline'
                  }>
                    {order.status || 'unknown'}
                  </Badge>
                  <p className="font-semibold">${order.amount.toFixed(2)}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                No purchase orders available
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  )
})

/**
 * Analytics Tab - Business intelligence and metrics
 */
const AnalyticsTabContent = memo(function AnalyticsTabContent() {
  const {
    metrics,
    reportGenerationTrend,
    recentReports,
    upcomingReports,
    isLoading,
    error,
  } = useReactiveAnalyticsData()

  if (isLoading) {
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
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load analytics data.'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analytics Statistics */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Reports"
          value={metrics.activeReports}
          icon={BarChart}
          description="Currently running"
        />
        <StatCard
          title="Scheduled Reports"
          value={metrics.scheduledReports}
          icon={TrendingUp}
          description="Automated cadence"
        />
        <StatCard
          title="Custom Reports"
          value={metrics.customReports}
          icon={Target}
          description="User-defined"
        />
        <StatCard
          title="Active Dashboards"
          value={metrics.activeDashboards}
          icon={LineChart}
          description="Live dashboards"
        />
      </div>

      {/* Performance Trends */}
      <div>
        <Section
          title="Report Generation Trend"
          description="Reports executed over time"
          icon={<LineChart className="h-5 w-5" />}
        >
          {reportGenerationTrend.length > 0 ? (
            <ResponsiveLineChart
              title="Report Generation"
              data={reportGenerationTrend}
              dataKeys={['value']}
              colors={['#3b82f6']}
              height={300}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No report activity available
            </div>
          )}
        </Section>
      </div>

      {/* Analytics Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Section
          title="Upcoming Reports"
          description="Scheduled report executions"
          icon={<Target className="h-5 w-5" />}
        >
          <div className="space-y-4">
            {upcomingReports.length > 0 ? upcomingReports.map((report) => (
              <div key={report.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{report.name}</p>
                  <Badge variant="outline">{report.frequency.replace('_', ' ')}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Next run: {report.nextRun ? new Date(report.nextRun).toLocaleString() : '—'}
                </p>
              </div>
            )) : (
              <div className="text-sm text-muted-foreground">No upcoming reports.</div>
            )}
          </div>
        </Section>

        <Section
          title="Recent Reports"
          description="Most recent analytics runs"
          icon={<AlertCircle className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {recentReports.length > 0 ? recentReports.map((report) => (
              <div key={report.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">{report.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {report.category} · Last run {report.lastRun ? new Date(report.lastRun).toLocaleString() : '—'}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-sm text-muted-foreground">No recent reports.</div>
            )}
          </div>
        </Section>
      </div>
    </div>
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
    <div className="space-y-6">
      {/* Report Categories */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
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
      </div>

      {/* Report Library */}
      <div>
        <Section
          title="Report Library"
          description="Available reports and templates"
          icon={<FileText className="h-5 w-5" />}
        >
          {templates.length === 0 ? (
            <div className="text-sm text-muted-foreground">No report templates available.</div>
          ) : (
            <div className="space-y-3">
              {templates.map((report: any) => (
                <div key={report.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-400" />
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
        </Section>
      </div>

      {/* Recent Reports */}
      <div>
        <Section
          title="Recently Generated"
          description="Latest report outputs"
          icon={<Clock className="h-5 w-5" />}
        >
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground">No report history yet.</div>
          ) : (
            <div className="space-y-3">
              {history.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
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
        </Section>
      </div>
    </div>
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
      className="cta-hub cta-business-hub"
      title="Business Management"
      description="Financial oversight, procurement, analytics, and comprehensive reporting"
      icon={<BarChart className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="cta-tabs grid w-full grid-cols-4 rounded-xl p-1">
            <TabsTrigger value="financial" className="flex items-center gap-2 cta-tab data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="hub-tab-financial" aria-label="Financial">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financial</span>
            </TabsTrigger>
            <TabsTrigger value="procurement" className="flex items-center gap-2 cta-tab data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="hub-tab-procurement" aria-label="Procurement">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Procurement</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 cta-tab data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="hub-tab-analytics" aria-label="Analytics">
              <BarChart className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 cta-tab data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="hub-tab-reports" aria-label="Reports">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

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
        </Tabs>
      </div>
    </HubPage>
  )
}
