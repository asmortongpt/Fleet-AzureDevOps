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

import {
  DollarSign,
  ShoppingCart,
  BarChart,
  FileText,
  TrendingUp,
  TrendingDown,
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
  Tag
} from 'lucide-react'
import { useState, memo, useMemo } from 'react'
import toast from 'react-hot-toast'
import useSWR from 'swr'

import { apiFetcher } from '@/lib/api-fetcher'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import HubPage from '@/components/ui/hub-page'
import { Section } from '@/components/ui/section'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import { useAuth } from '@/contexts'
import { getCsrfToken } from '@/hooks/use-api'
import { useFleetData } from '@/hooks/use-fleet-data'
import { useReactiveAnalyticsData } from '@/hooks/use-reactive-analytics-data'
import { formatEnum } from '@/utils/format-enum'
import { formatDate, formatDateTime, formatCurrency } from '@/utils/format-helpers'
import logger from '@/utils/logger';


const fetcher = apiFetcher

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

/**
 * Financial Tab - Budget tracking and cost analysis
 */
const FinancialTabContent = memo(function FinancialTabContent() {
  const { workOrders: fleetWorkOrders, vehicles, error: fleetDataError } = useFleetData()

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
      const vehicle = vehicles.find((v: any) => v.id === (wo.vehicleId || wo.vehicle_id))
      const dept = vehicle?.department || wo.department || '—'
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

  const { data: summary, error: summaryError } = useSWR<any>(
    `/api/cost-analysis/summary?${dateParams}`,
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: costSummary, error: costSummaryError } = useSWR<any>(
    '/api/dashboard/costs/summary?period=monthly',
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: fleetMetrics, error: fleetMetricsError } = useSWR<any>(
    '/api/fleet/metrics',
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: trends, error: trendsError } = useSWR<any[]>(
    "/api/cost-analysis/trends?months=6",
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: budgets, error: budgetsError } = useSWR<any[]>(
    "/api/cost-analysis/budget-status",
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: invoices, error: invoicesError } = useSWR<any>(
    "/api/invoices?limit=5",
    fetcher,
    { shouldRetryOnError: false }
  )

  const financialError = summaryError || costSummaryError || fleetMetricsError || trendsError || budgetsError || invoicesError

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

  if (financialError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive font-medium">Failed to load financial data</p>
        <p className="text-sm text-muted-foreground">{financialError instanceof Error ? financialError.message : 'Unable to load financial data. Please try again.'}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        <StatCard
          title="Monthly Budget"
          value={budgetTotal > 0 ? formatCurrency(budgetTotal) : '—'}
          icon={Wallet}
          description="Current fiscal quarter"
        />
        <StatCard
          title="Actual Spend"
          value={spentTotal > 0 ? formatCurrency(spentTotal) : '—'}
          icon={DollarSign}
          description="Last 6 months"
        />
        <StatCard
          title="Cost Per Mile"
          value={costPerMile > 0 ? formatCurrency(costPerMile) : 'No data'}
          icon={TrendingDown}
          description={costSummary?.target_cost_per_mile
            ? `Target ${formatCurrency(Number(costSummary.target_cost_per_mile))}`
            : "Computed from fleet totals"
          }
        />
        <StatCard
          title="Savings YTD"
          value={savingsYtd > 0 ? formatCurrency(savingsYtd) : '$0'}
          icon={Target}
          description={budgetTotal > 0 ? "Budget vs spend" : "No budget allocations"}
        />
      </div>

      {/* Main Content: Charts + Transactions */}
      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-1 gap-1.5 overflow-hidden">
        {/* Left Column: Cost Trend + Cost Breakdown */}
        <div className="flex flex-col gap-1.5 min-h-0">
          <Section
            title="Cost Trend"
            description="Monthly actual costs"
            icon={<BarChart className="h-4 w-4" />}
            className="flex-1 min-h-0"
          >
            {costTrendData.length > 0 ? (
              <ResponsiveBarChart
                title="Actual Costs"
                data={costTrendData}
                dataKeys={['actual']}
                colors={['hsl(var(--chart-2))']}
                height={140}
                compact
              />
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            )}
          </Section>
          <Section
            title="Cost Breakdown"
            description="Distribution of fleet expenses"
            icon={<PieChart className="h-4 w-4" />}
            className="flex-1 min-h-0"
          >
            {breakdownData.length > 0 ? (
              <ResponsivePieChart
                title="Cost Breakdown by Category"
                data={breakdownData}
                height={140}
                compact
              />
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            )}
          </Section>
        </div>

        {/* Right Column: Recent Transactions + WO Costs + Dept Costs */}
        <div className="flex flex-col gap-1.5 min-h-0">
          <Section
            title="Recent Transactions"
            description="Latest fleet expenses"
            icon={<Receipt className="h-4 w-4" />}
            className="flex-1 min-h-0"
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              {recentTransactions.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {recentTransactions.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between rounded-md border border-white/[0.08] bg-[#242424] p-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatEnum(transaction.category)} · {formatDate(transaction.date)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(transaction.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          <Section
            title="Work Order Costs"
            description="Parts and labor costs"
            icon={<Tag className="h-4 w-4" />}
            className="flex-none"
          >
            <div className="grid grid-cols-3 gap-1.5">
              <div className="rounded-md border border-white/[0.08] bg-[#242424] p-2 text-center">
                <p className="text-xs text-muted-foreground">Parts</p>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(workOrderCosts.totalPartsCost)}</p>
              </div>
              <div className="rounded-md border border-white/[0.08] bg-[#242424] p-2 text-center">
                <p className="text-xs text-muted-foreground">Labor</p>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(workOrderCosts.totalLaborCost)}</p>
              </div>
              <div className="rounded-md border border-white/[0.08] bg-[#242424] p-2 text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(workOrderCosts.totalWoCost)}</p>
              </div>
            </div>
          </Section>

          <Section
            title="Cost by Department"
            description="Work order costs by department"
            icon={<Building className="h-4 w-4" />}
            className="flex-1 min-h-0"
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              {departmentCosts.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {departmentCosts.map((dept) => (
                    <div key={dept.department} className="flex items-center justify-between rounded-md border border-white/[0.08] bg-[#242424] p-2">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{dept.department}</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(dept.cost)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
})

/**
 * Procurement Tab - Vendor management and purchasing
 */
const ProcurementTabContent = memo(function ProcurementTabContent() {
  const { push } = useDrilldown()
  const { workOrders: fleetWorkOrders, error: fleetDataError } = useFleetData()

  const { data: vendorsResponse, error: vendorsError } = useSWR<any>(
    '/api/vendors',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: purchaseOrdersResponse, error: purchaseOrdersError } = useSWR<any>(
    '/api/purchase-orders?limit=50',
    fetcher,
    { shouldRetryOnError: false }
  )

  const procurementError = vendorsError || purchaseOrdersError

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
    return purchaseOrders.slice(0, 10).map((po: any) => ({
      id: po.id,
      number: po.number,
      vendor: po.vendorName || po.vendor_name || 'Vendor',
      status: po.status,
      amount: Number(po.totalAmount || po.total_amount || 0)
    }))
  }, [purchaseOrders])

  if (procurementError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive font-medium">Failed to load procurement data</p>
        <p className="text-sm text-muted-foreground">{procurementError instanceof Error ? procurementError.message : 'Unable to load procurement data. Please try again.'}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
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
          description="Based on delivery performance"
        />
        <StatCard
          title="WO Vendor Spend"
          value={(() => {
            let total = 0
            vendorWoCosts.forEach((v) => { total += v.totalCost })
            return formatCurrency(total)
          })()}
          icon={CreditCard}
          description="Work order vendor costs"
        />
      </div>

      {/* Main Content: Vendors + Purchase Orders */}
      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-1 gap-1.5 overflow-hidden">
        {/* Left: Top Vendors */}
        <Section
          title="Top Vendors"
          description="Most frequently used suppliers"
          icon={<Building className="h-4 w-4" />}
          className="min-h-0"
        >
          <div className="flex-1 min-h-0 overflow-y-auto">
            {topVendors.length > 0 ? (
              <div className="flex flex-col gap-1">
                {topVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between rounded-md border border-white/[0.08] bg-[#242424] p-2 cursor-pointer"
                    onClick={() => push({
                      id: vendor.id,
                      type: 'vendor',
                      label: vendor.name,
                      data: { vendorId: vendor.id, category: vendor.category, orders: vendor.orders, rating: vendor.rating, woCost: vendor.woCost },
                    })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        push({
                          id: vendor.id,
                          type: 'vendor',
                          label: vendor.name,
                          data: { vendorId: vendor.id, category: vendor.category, orders: vendor.orders, rating: vendor.rating, woCost: vendor.woCost },
                        })
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for vendor ${vendor.name}`}
                  >
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatEnum(vendor.category)} · {vendor.orders} {vendor.orders === 1 ? 'order' : 'orders'}
                          {vendor.woCost > 0 && (
                            <span className="ml-1">· WO: {formatCurrency(vendor.woCost)}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-1"
                      title="Based on delivery performance"
                    >
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{vendor.rating ? `${vendor.rating}/5` : '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            )}
          </div>
        </Section>

        {/* Right: Purchase Orders */}
        <Section
          title="Recent Purchase Orders"
          description="Latest procurement requests"
          icon={<ShoppingCart className="h-4 w-4" />}
          className="min-h-0"
        >
          <div className="flex-1 min-h-0 overflow-y-auto">
            {recentPurchaseOrders.length > 0 ? (
              <div className="flex flex-col gap-1">
                {recentPurchaseOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-md border border-white/[0.08] bg-[#242424] p-2 cursor-pointer"
                    onClick={() => push({
                      id: order.id,
                      type: 'purchase-order',
                      label: order.number || `PO ${String(order.id).slice(0, 8)}`,
                      data: { purchaseOrderId: order.id, vendor: order.vendor, status: order.status, amount: order.amount },
                    })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        push({
                          id: order.id,
                          type: 'purchase-order',
                          label: order.number || `PO ${String(order.id).slice(0, 8)}`,
                          data: { purchaseOrderId: order.id, vendor: order.vendor, status: order.status, amount: order.amount },
                        })
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for purchase order ${order.number || order.id}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.number || String(order.id).slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{order.vendor}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        order.status === 'delivered' ? 'default' :
                        order.status === 'in_transit' ? 'secondary' : 'outline'
                      }>
                        {formatEnum(order.status) || '—'}
                      </Badge>
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(order.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
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
      <div className="grid gap-1.5 grid-cols-4 p-1.5">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        {error instanceof Error ? error.message : 'Failed to load analytics data.'}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
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

      {/* Main Content: Chart + Lists */}
      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-1.5 overflow-hidden">
        {/* Left: Report Generation Trend */}
        <Section
          title="Report Generation Trend"
          description="Reports executed over time"
          icon={<LineChart className="h-4 w-4" />}
          className="min-h-0"
        >
          {reportGenerationTrend.length > 0 ? (
            <ResponsiveLineChart
              title="Report Generation"
              data={reportGenerationTrend}
              dataKeys={['value']}
              colors={['hsl(var(--chart-1))']}
              height={140}
              compact
            />
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
          )}
        </Section>

        {/* Right: Upcoming + Recent Reports */}
        <div className="flex flex-col gap-1.5 min-h-0">
          <Section
            title="Upcoming Reports"
            description="Scheduled report executions"
            icon={<Target className="h-4 w-4" />}
            className="flex-1 min-h-0"
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              {upcomingReports.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {upcomingReports.map((report) => (
                    <div key={report.id} className="rounded-md border border-white/[0.08] bg-[#242424] p-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{report.name}</p>
                        <Badge variant="outline">{formatEnum(report.frequency)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Next run: {formatDateTime(report.nextRun)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
              )}
            </div>
          </Section>

          <Section
            title="Recent Reports"
            description="Most recent analytics runs"
            icon={<Clock className="h-4 w-4" />}
            className="flex-1 min-h-0"
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              {recentReports.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {recentReports.map((report) => (
                    <div key={report.id} className="flex items-start gap-2 rounded-md border border-white/[0.08] bg-[#242424] p-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{report.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatEnum(report.category)} · Last run {formatDateTime(report.lastRun)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
})

/**
 * Reports Tab - Report generation and dashboards
 */
const ReportsTabContent = memo(function ReportsTabContent() {
  const { data: reportTemplates, error: reportTemplatesError } = useSWR<any[]>(
    '/api/reports/templates',
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: scheduledReports, error: scheduledReportsError } = useSWR<any[]>(
    '/api/reports/scheduled',
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: reportHistory, error: reportHistoryError } = useSWR<any[]>(
    '/api/reports/history',
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: customReports, error: customReportsError } = useSWR<any[]>(
    '/api/custom-reports',
    fetcher,
    { shouldRetryOnError: false }
  )

  const reportsError = reportTemplatesError || scheduledReportsError || reportHistoryError || customReportsError

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

  if (reportsError) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Unable to load reports data. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
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

      {/* Main Content: Report Library + Recent Reports */}
      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-1 gap-1.5 overflow-hidden">
        {/* Left: Report Library */}
        <Section
          title="Report Library"
          description="Available reports and templates"
          icon={<FileText className="h-4 w-4" />}
          className="min-h-0"
        >
          <div className="flex-1 min-h-0 overflow-y-auto">
            {templates.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <div className="flex flex-col gap-1">
                {templates.map((report: any) => (
                  <div key={report.id} className="flex items-center justify-between rounded-md border border-white/[0.08] bg-[#242424] p-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{report.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatEnum(report.category || report.domain) || 'General'} · {report.isCore ? 'Core' : 'Custom'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateReport(report.id, report.title)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Generate
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Right: Recently Generated */}
        <Section
          title="Recently Generated"
          description="Latest report outputs"
          icon={<Clock className="h-4 w-4" />}
          className="min-h-0"
        >
          <div className="flex-1 min-h-0 overflow-y-auto">
            {history.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <div className="flex flex-col gap-1">
                {history.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border border-white/[0.08] bg-[#242424] p-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Generated by {item.generatedBy || 'System'} · {formatDate(item.generatedAt)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(item.title, item.downloadUrl)}
                      disabled={!item.downloadUrl}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
      <div className="flex flex-col h-full gap-1.5 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
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

          <TabsContent value="financial" className="flex-1 min-h-0 overflow-hidden">
            <QueryErrorBoundary>
              <FinancialTabContent />
            </QueryErrorBoundary>
          </TabsContent>

          <TabsContent value="procurement" className="flex-1 min-h-0 overflow-hidden">
            <QueryErrorBoundary>
              <ProcurementTabContent />
            </QueryErrorBoundary>
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 min-h-0 overflow-hidden">
            <QueryErrorBoundary>
              <AnalyticsTabContent />
            </QueryErrorBoundary>
          </TabsContent>

          <TabsContent value="reports" className="flex-1 min-h-0 overflow-hidden">
            <QueryErrorBoundary>
              <ReportsTabContent />
            </QueryErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </HubPage>
  )
}
