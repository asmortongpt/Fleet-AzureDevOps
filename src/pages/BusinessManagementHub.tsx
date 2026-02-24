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
  Tag,
  Activity,
  Wrench,
  Gauge,
} from 'lucide-react'
import { useState, memo, useMemo } from 'react'
import toast from 'react-hot-toast'
import useSWR from 'swr'

import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary'
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
import { useDrilldown } from '@/contexts/DrilldownContext'
import { getCsrfToken } from '@/hooks/use-api'
import { useFleetData } from '@/hooks/use-fleet-data'
import { apiFetcher } from '@/lib/api-fetcher'
import { formatEnum } from '@/utils/format-enum'
import { formatDate, formatCurrency, formatNumber } from '@/utils/format-helpers'
import logger from '@/utils/logger';
import { formatVehicleName } from '@/utils/vehicle-display';


const fetcher = apiFetcher

// ============================================================================
// LOADING SKELETON COMPONENT
// ============================================================================

function TabLoadingSkeleton() {
  return (
    <div className="space-y-1.5 p-2">
      <div className="grid grid-cols-4 gap-1.5">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-md" />)}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Skeleton className="h-40 rounded-md" />
        <Skeleton className="h-40 rounded-md" />
      </div>
    </div>
  )
}

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
      const dept = vehicle?.department || wo.department || 'Unassigned'
      const cost = Number(wo.total_cost || wo.cost || 0)
      deptMap.set(dept, (deptMap.get(dept) || 0) + cost)
    })
    return Array.from(deptMap.entries())
      .map(([department, cost]) => ({ department, cost }))
      .sort((a, b) => b.cost - a.cost)
  }, [fleetWorkOrders, vehicles])

  const totalDeptCost = useMemo(() => {
    return departmentCosts.reduce((sum, d) => sum + d.cost, 0)
  }, [departmentCosts])

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

  // All hooks must be called unconditionally before any early returns (React Rules of Hooks)
  const budgetByMonth = useMemo(() => {
    if (!Array.isArray(budgets)) return new Map<string, number>()
    const map = new Map<string, number>()
    budgets.forEach((b: any) => {
      const period = b.month || b.period || b.fiscal_quarter
      if (period) {
        map.set(period, Number(b.allocated || b.allocated_amount || 0))
      }
    })
    return map
  }, [budgets])

  const budgetTotal = useMemo(() => {
    if (!Array.isArray(budgets)) return 0
    return budgets.reduce((sum: number, b: any) => sum + Number(b.allocated || b.allocated_amount || 0), 0)
  }, [budgets])

  const costTrendData = useMemo(() => {
    if (!Array.isArray(trends)) return []
    const avgBudgetPerMonth = budgetTotal > 0 && trends.length > 0 ? budgetTotal / trends.length : 0
    return trends.map((row: any) => {
      const monthKey = row.month || row.period
      const matchedBudget = budgetByMonth.get(monthKey)
      return {
        name: monthKey,
        month: monthKey,
        actual: Number(row.amount || 0),
        budget: matchedBudget != null ? matchedBudget : (avgBudgetPerMonth > 0 ? Math.round(avgBudgetPerMonth) : undefined)
      }
    })
  }, [trends, budgetByMonth, budgetTotal])

  const breakdownData = useMemo(() => {
    const s = summary?.data || summary
    const breakdown = s?.categoryBreakdown || s?.category_breakdown
    if (Array.isArray(breakdown) && breakdown.length > 0) {
      return breakdown.map((row: any) => ({
        name: row.category || row.name || "Uncategorized",
        value: Number(row.amount || row.value || 0)
      })).filter((d: any) => d.value > 0)
    }
    // Fallback: derive from work orders by type
    const cats = new Map<string, number>()
    fleetWorkOrders.forEach((wo: any) => {
      const cat = formatEnum(wo.type || 'maintenance')
      cats.set(cat, (cats.get(cat) || 0) + Number(wo.total_cost || wo.cost || 0))
    })
    return Array.from(cats.entries()).map(([name, value]) => ({ name, value })).filter(d => d.value > 0)
  }, [summary, fleetWorkOrders])

  const recentTransactions = useMemo((): { description: string; amount: number; category: string; date: string }[] => {
    const expenses = summary?.topExpenses || summary?.top_expenses
    if (Array.isArray(expenses) && expenses.length > 0) {
      return expenses.map((row: any) => ({
        description: row.description || row.name || row.title || formatEnum(row.category || 'Expense'),
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

  const financialError = summaryError || costSummaryError || fleetMetricsError || trendsError || budgetsError || invoicesError

  // Loading state for Financial tab (after all hooks)
  const isLoading = !summary && !summaryError && !costSummary && !costSummaryError
  if (isLoading) {
    return <TabLoadingSkeleton />
  }

  const spentTotal = Number(summary?.totalCost || summary?.total_cost || 0)
  const totalMileage = Number(fleetMetrics?.totalMileage || fleetMetrics?.total_mileage || 0)

  const costPerMile = (() => {
    const reported = Number(costSummary?.cost_per_mile ?? costSummary?.costPerMile)
    if (Number.isFinite(reported) && reported > 0) return reported
    if (totalMileage > 0) return spentTotal / totalMileage
    return 0
  })()

  // P0-4: Fix savings calculation — show negative (overrun) values
  const budgetDelta = budgetTotal > 0 ? budgetTotal - spentTotal : 0
  const isOverBudget = budgetDelta < 0

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

  // Determine if we have budget data for a trend line
  const hasBudgetTrendData = costTrendData.some(d => d.budget != null && d.budget > 0)
  const trendDataKeys = hasBudgetTrendData ? ['actual', 'budget'] : ['actual']
  const trendColors = hasBudgetTrendData
    ? ['hsl(var(--chart-2))', '#10B981']
    : ['hsl(var(--chart-2))']

  return (
    <div className="flex flex-col gap-1.5 p-1.5">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5">
        {/* P0-2 & P0-3: Fix budget label and add period description */}
        <StatCard
          title="Total Budget"
          value={budgetTotal > 0 ? formatCurrency(budgetTotal) : '--'}
          icon={Wallet}
          description="Total allocated"
        />
        <StatCard
          title="Actual Spend"
          value={spentTotal > 0 ? formatCurrency(spentTotal) : '--'}
          icon={DollarSign}
          description="Last 6 months"
        />
        {/* P1-7: Fix Cost Per Mile icon to DollarSign */}
        <StatCard
          title="Cost Per Mile"
          value={costPerMile > 0 ? formatCurrency(costPerMile) : 'No data'}
          icon={DollarSign}
          description={costSummary?.target_cost_per_mile
            ? `Target ${formatCurrency(Number(costSummary.target_cost_per_mile))}`
            : "Computed from fleet totals"
          }
        />
        {/* P0-4: Show budget overruns with negative styling */}
        <StatCard
          title={isOverBudget ? "Budget Overrun" : "Savings YTD"}
          value={budgetTotal > 0 ? formatCurrency(Math.abs(budgetDelta)) : '$0'}
          icon={isOverBudget ? TrendingDown : Target}
          trend={isOverBudget ? 'down' : (budgetDelta > 0 ? 'up' : 'neutral')}
          description={isOverBudget ? "Over budget" : (budgetTotal > 0 ? "Under budget" : "No budget allocations")}
          className={isOverBudget ? "border-rose-500/20" : ""}
        />
      </div>

      {/* Main Content: Charts + Transactions */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Left Column: Cost Trend + Cost Breakdown */}
        <div className="flex flex-col gap-1.5 min-h-0">
          <Section
            title="Cost Trend"
            description={hasBudgetTrendData ? "Actual vs budget" : "Monthly actual costs"}
            icon={<BarChart className="h-4 w-4" />}
            className="flex-1 min-h-0"
          >
            {/* P0-5: Add budget comparison line to chart */}
            {costTrendData.length > 0 ? (
              <ResponsiveBarChart
                title="Actual Costs"
                data={costTrendData}
                dataKeys={trendDataKeys}
                colors={trendColors}
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
              <div style={{ minHeight: 160 }}>
                <ResponsivePieChart
                  title="Cost Breakdown by Category"
                  data={breakdownData}
                  height={160}
                />
              </div>
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
            {/* P1-11: Removed inner overflow-y-auto */}
            <div className="flex-1 min-h-0">
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
                <p className="text-xs text-white/60">Parts</p>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(workOrderCosts.totalPartsCost)}</p>
              </div>
              <div className="rounded-md border border-white/[0.08] bg-[#242424] p-2 text-center">
                <p className="text-xs text-white/60">Labor</p>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(workOrderCosts.totalLaborCost)}</p>
              </div>
              <div className="rounded-md border border-white/[0.08] bg-[#242424] p-2 text-center">
                <p className="text-xs text-white/60">Total</p>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(workOrderCosts.totalWoCost)}</p>
              </div>
            </div>
          </Section>

          {/* P1-8: Department cost bars with percentage */}
          <Section
            title="Cost by Department"
            description="Work order costs by department"
            icon={<Building className="h-4 w-4" />}
            className="flex-1 min-h-0"
          >
            {/* P1-11: Removed inner overflow-y-auto */}
            <div className="flex-1 min-h-0">
              {departmentCosts.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {departmentCosts.map((dept) => (
                    <div key={dept.department} className="flex items-center gap-2">
                      <span className="text-xs text-white/80 w-24 truncate" title={dept.department}>{dept.department}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-emerald-500/60"
                          style={{ width: `${totalDeptCost > 0 ? (dept.cost / totalDeptCost * 100) : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/60 w-16 text-right">{formatCurrency(dept.cost)}</span>
                      <span className="text-[10px] text-white/40 w-8 text-right">
                        {totalDeptCost > 0 ? `${Math.round(dept.cost / totalDeptCost * 100)}%` : '0%'}
                      </span>
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
  const [showAllVendors, setShowAllVendors] = useState(false)

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

  // Loading state (after all hooks)
  const isLoading = !vendorsResponse && !vendorsError && !purchaseOrdersResponse && !purchaseOrdersError
  if (isLoading) {
    return <TabLoadingSkeleton />
  }

  const vendors = Array.isArray(vendorsResponse) ? vendorsResponse : (vendorsResponse?.data || [])
  const purchaseOrders = Array.isArray(purchaseOrdersResponse)
    ? purchaseOrdersResponse
    : (purchaseOrdersResponse?.data || [])

  // Vendor costs from work orders
  const vendorWoCosts = (() => {
    const map = new Map<string, { totalCost: number; partsCost: number; laborCost: number; count: number }>()
    fleetWorkOrders.forEach((wo: any) => {
      const vendorId = wo.vendor_id || wo.vendorId
      if (!vendorId) return
      const existing = map.get(vendorId) || { totalCost: 0, partsCost: 0, laborCost: 0, count: 0 }
      existing.totalCost += Number(wo.total_cost || wo.actual_cost || wo.cost || 0)
      existing.partsCost += Number(wo.parts_cost || 0)
      existing.laborCost += Number(wo.labor_cost || 0)
      existing.count += 1
      map.set(vendorId, existing)
    })
    return map
  })()

  const activeVendors = vendors.filter((v: any) => v.isActive !== false)
  const openOrders = purchaseOrders.filter((po: any) => {
    const status = (po.status || '').toLowerCase()
    return status && !['delivered', 'closed', 'cancelled', 'complete'].includes(status)
  })

  // P1-9: Open PO Value KPI
  const openPoValue = openOrders.reduce((sum: number, po: any) =>
    sum + Number(po.totalAmount || po.total_amount || 0), 0
  )

  const avgVendorRating = vendors.length > 0
    ? (vendors.reduce((sum: number, v: any) => sum + Number(v.rating || 0), 0) / vendors.length).toFixed(1)
    : null

  const ordersByVendor = (() => {
    const map = new Map<string, number>()
    purchaseOrders.forEach((po: any) => {
      const id = po.vendorId || po.vendor_id
      if (!id) return
      map.set(id, (map.get(id) || 0) + 1)
    })
    return map
  })()

  // P1-9: Increase vendor list from 4 to 8
  const topVendors: { id: string; name: string; category: string; orders: number; rating: number; woCost: number }[] = (() => {
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
      .slice(0, 8)
  })()

  const displayedVendors = showAllVendors ? topVendors : topVendors.slice(0, 4)

  const recentPurchaseOrders: { id: string; number: string; vendor: string; status: string; amount: number }[] = (() => {
    return purchaseOrders.slice(0, 10).map((po: any) => ({
      id: po.id,
      number: po.number,
      vendor: po.vendorName || po.vendor_name || 'Vendor',
      status: po.status,
      amount: Number(po.totalAmount || po.total_amount || 0)
    }))
  })()

  // P1-9: Comprehensive PO status badge color mapping
  const statusVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'default'
      case 'in_transit': return 'secondary'
      case 'pending': return 'outline'
      case 'cancelled': return 'destructive'
      case 'approved': case 'ordered': return 'secondary'
      default: return 'outline'
    }
  }

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
    <div className="flex flex-col gap-1.5 p-1.5">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5">
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
        {/* P1-9: Add Open PO Value KPI */}
        <StatCard
          title="Open PO Value"
          value={formatCurrency(openPoValue)}
          icon={CreditCard}
          description="Non-delivered PO total"
        />
        {/* P1-9: Rename "WO Vendor Spend" to "Vendor Maintenance Spend" */}
        <StatCard
          title="Vendor Maintenance Spend"
          value={(() => {
            let total = 0
            vendorWoCosts.forEach((v) => { total += v.totalCost })
            return formatCurrency(total)
          })()}
          icon={Wrench}
          description="Work order vendor costs"
        />
      </div>

      {/* Main Content: Vendors + Purchase Orders */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Left: Top Vendors */}
        <Section
          title="Top Vendors"
          description="Most frequently used suppliers"
          icon={<Building className="h-4 w-4" />}
          className="min-h-0"
        >
          {/* P1-11: Removed inner overflow-y-auto */}
          <div className="flex-1 min-h-0">
            {displayedVendors.length > 0 ? (
              <div className="flex flex-col gap-1">
                {displayedVendors.map((vendor) => (
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
                      <Building className="h-4 w-4 text-white/40" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{vendor.name}</p>
                        <p className="text-xs text-white/60">
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
                      <Award className="h-4 w-4 text-white/40" />
                      <span className="text-sm font-medium text-foreground">{vendor.rating ? `${vendor.rating}/5` : '--'}</span>
                    </div>
                  </div>
                ))}
                {/* P1-9: View All Vendors button */}
                {topVendors.length > 4 && !showAllVendors && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => setShowAllVendors(true)}
                  >
                    View All Vendors ({topVendors.length})
                  </Button>
                )}
                {showAllVendors && topVendors.length > 4 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => setShowAllVendors(false)}
                  >
                    Show Less
                  </Button>
                )}
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
          {/* P1-11: Removed inner overflow-y-auto */}
          <div className="flex-1 min-h-0">
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
                      <p className="text-xs text-white/60">{order.vendor}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* P1-9: Use comprehensive status badge mapping */}
                      <Badge variant={statusVariant(order.status)}>
                        {formatEnum(order.status) || '--'}
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
 * Analytics Tab - Real business analytics (P0-6: Complete replacement)
 * Shows fleet utilization, cost metrics, performance trends, and action items
 */
const AnalyticsTabContent = memo(function AnalyticsTabContent() {
  const {
    vehicles,
    workOrders: fleetWorkOrders,
    fuelTransactions,
    maintenanceRequests,
    isLoading: fleetLoading,
    error: fleetError,
  } = useFleetData()

  // Fetch cost trend data for the analytics charts
  const { data: costTrends, error: costTrendsError } = useSWR<any[]>(
    '/api/cost-analysis/trends?months=6',
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: costSummary, error: costSummaryError } = useSWR<any>(
    '/api/dashboard/costs/summary?period=monthly',
    fetcher,
    { shouldRetryOnError: false }
  )

  // P0-1: Loading state for Analytics tab
  const isLoading = fleetLoading && vehicles.length === 0
  if (isLoading) {
    return <TabLoadingSkeleton />
  }

  if (fleetError) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        {fleetError instanceof Error ? fleetError.message : 'Failed to load analytics data.'}
      </div>
    )
  }

  // KPI computations
  const totalVehicles = vehicles.length
  const activeVehicles = vehicles.filter((v: any) => {
    const status = (v.status || '').toLowerCase()
    return status === 'active' || status === 'in_service' || status === 'available'
  }).length
  const fleetUtilization = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0

  // Total spend from work orders
  const totalSpend = fleetWorkOrders.reduce((sum: number, wo: any) =>
    sum + Number(wo.total_cost || wo.cost || 0), 0
  )
  const avgCostPerVehicle = totalVehicles > 0 ? totalSpend / totalVehicles : 0

  // Fuel efficiency: average MPG from fuel transactions
  const fuelEfficiency = (() => {
    const withMpg = fuelTransactions.filter((ft: any) => {
      const mpg = Number(ft.mpg || ft.fuel_efficiency || ft.miles_per_gallon || 0)
      return mpg > 0
    })
    if (withMpg.length === 0) {
      // Fallback: calculate from gallons and odometer
      const totalGallons = fuelTransactions.reduce((sum: number, ft: any) =>
        sum + Number(ft.gallons || ft.quantity || 0), 0
      )
      const totalMiles = fuelTransactions.reduce((sum: number, ft: any) =>
        sum + Number(ft.odometer || ft.mileage || 0), 0
      )
      if (totalGallons > 0 && totalMiles > 0) return totalMiles / totalGallons
      return 0
    }
    const totalMpg = withMpg.reduce((sum: number, ft: any) =>
      sum + Number(ft.mpg || ft.fuel_efficiency || ft.miles_per_gallon || 0), 0
    )
    return totalMpg / withMpg.length
  })()

  // Maintenance ratio: maintenance cost / total cost
  const maintenanceCost = fleetWorkOrders
    .filter((wo: any) => {
      const type = (wo.type || '').toLowerCase()
      return type.includes('maintenance') || type.includes('preventive') || type.includes('repair')
    })
    .reduce((sum: number, wo: any) => sum + Number(wo.total_cost || wo.cost || 0), 0)
  const maintenanceRatio = totalSpend > 0 ? Math.round((maintenanceCost / totalSpend) * 100) : 0

  // Cost trend chart data
  const costTrendData = (() => {
    if (!Array.isArray(costTrends)) return []
    return costTrends.map((row: any) => ({
      name: row.month || row.period,
      actual: Number(row.amount || 0)
    }))
  })()

  // Top cost drivers: top 5 vehicles by maintenance cost
  const topCostDrivers = (() => {
    const vehicleCostMap = new Map<string, { name: string; cost: number; woCount: number }>()
    fleetWorkOrders.forEach((wo: any) => {
      const vehicleId = wo.vehicle_id || wo.vehicleId
      if (!vehicleId) return
      const vehicle = vehicles.find((v: any) => v.id === vehicleId)
      const rawName = vehicle ? formatVehicleName(vehicle as any) : null
      const vehicleName = rawName && rawName !== 'Unknown Vehicle'
        ? rawName
        : `Vehicle ${String(vehicleId).slice(0, 8)}`
      const existing = vehicleCostMap.get(vehicleId) || { name: vehicleName, cost: 0, woCount: 0 }
      existing.cost += Number(wo.total_cost || wo.cost || 0)
      existing.woCount += 1
      vehicleCostMap.set(vehicleId, existing)
    })
    return Array.from(vehicleCostMap.values())
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
  })()

  // Action items: items needing attention
  const actionItems = (() => {
    const items: { label: string; detail: string; severity: 'high' | 'medium' | 'low' }[] = []

    // Overdue work orders
    const overdueWOs = fleetWorkOrders.filter((wo: any) => {
      const dueDate = wo.due_date || wo.dueDate
      if (!dueDate) return false
      const status = (wo.status || '').toLowerCase()
      return new Date(dueDate) < new Date() && !['completed', 'cancelled', 'closed'].includes(status)
    })
    if (overdueWOs.length > 0) {
      items.push({
        label: `${overdueWOs.length} overdue work order${overdueWOs.length > 1 ? 's' : ''}`,
        detail: 'Past due date and not completed',
        severity: 'high'
      })
    }

    // Out-of-service vehicles
    const outOfService = vehicles.filter((v: any) => {
      const status = (v.status || '').toLowerCase()
      return status === 'out_of_service' || status === 'down' || status === 'inactive'
    })
    if (outOfService.length > 0) {
      items.push({
        label: `${outOfService.length} vehicle${outOfService.length > 1 ? 's' : ''} out of service`,
        detail: 'Requiring attention or repair',
        severity: outOfService.length > 3 ? 'high' : 'medium'
      })
    }

    // High-cost vehicles
    const highCostThreshold = avgCostPerVehicle * 2
    const highCostVehicles = topCostDrivers.filter(v => v.cost > highCostThreshold)
    if (highCostVehicles.length > 0) {
      items.push({
        label: `${highCostVehicles.length} vehicle${highCostVehicles.length > 1 ? 's' : ''} above 2x avg cost`,
        detail: `Avg: ${formatCurrency(avgCostPerVehicle)}, threshold: ${formatCurrency(highCostThreshold)}`,
        severity: 'medium'
      })
    }

    // Low fleet utilization
    if (fleetUtilization < 70 && totalVehicles > 0) {
      items.push({
        label: `Fleet utilization at ${fleetUtilization}%`,
        detail: 'Below 70% target',
        severity: 'low'
      })
    }

    return items
  })()

  // Fleet performance over time (vehicles active per month from cost trends)
  const fleetPerformanceData = (() => {
    if (!Array.isArray(costTrends)) return []
    return costTrends.map((row: any) => ({
      name: row.month || row.period,
      cost: Number(row.amount || 0),
      costPerVehicle: totalVehicles > 0 ? Math.round(Number(row.amount || 0) / totalVehicles) : 0,
    }))
  })()

  return (
    <div className="flex flex-col gap-1.5 p-1.5">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5">
        <StatCard
          title="Fleet Utilization"
          value={`${fleetUtilization}%`}
          icon={Activity}
          description={`${activeVehicles} of ${totalVehicles} vehicles active`}
          trend={fleetUtilization >= 80 ? 'up' : fleetUtilization >= 60 ? 'neutral' : 'down'}
        />
        <StatCard
          title="Avg Cost Per Vehicle"
          value={avgCostPerVehicle > 0 ? formatCurrency(avgCostPerVehicle) : '--'}
          icon={DollarSign}
          description={`${totalVehicles} vehicles, ${fleetWorkOrders.length} work orders`}
        />
        <StatCard
          title="Fuel Efficiency"
          value={fuelEfficiency > 0 ? `${formatNumber(fuelEfficiency, 1)} MPG` : 'No data'}
          icon={Gauge}
          description={fuelTransactions.length > 0 ? `From ${fuelTransactions.length} transactions` : 'No fuel data available'}
        />
        <StatCard
          title="Maintenance Ratio"
          value={`${maintenanceRatio}%`}
          icon={Wrench}
          description="Maintenance as % of total spend"
          trend={maintenanceRatio > 60 ? 'down' : 'neutral'}
        />
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-2 gap-1.5">
        <Section
          title="Cost Trend"
          description="Monthly fleet costs over 6 months"
          icon={<BarChart className="h-4 w-4" />}
          className="min-h-0"
        >
          {costTrendData.length > 0 ? (
            <ResponsiveBarChart
              title="Fleet Costs"
              data={costTrendData}
              dataKeys={['actual']}
              colors={['hsl(var(--chart-2))']}
              height={140}
              compact
            />
          ) : (
            <div className="flex items-center justify-center h-32 text-white/40 text-sm">No cost trend data available</div>
          )}
        </Section>

        <Section
          title="Cost Per Vehicle"
          description="Monthly cost per vehicle trend"
          icon={<LineChart className="h-4 w-4" />}
          className="min-h-0"
        >
          {fleetPerformanceData.length > 0 ? (
            <ResponsiveLineChart
              title="Cost Per Vehicle"
              data={fleetPerformanceData}
              dataKeys={['costPerVehicle']}
              colors={['#10B981']}
              height={140}
              compact
            />
          ) : (
            <div className="flex items-center justify-center h-32 text-white/40 text-sm">No performance data available</div>
          )}
        </Section>
      </div>

      {/* Bottom Row: Action Items + Top Cost Drivers */}
      <div className="grid grid-cols-2 gap-1.5">
        <Section
          title="Action Items"
          description="Items requiring attention"
          icon={<AlertCircle className="h-4 w-4" />}
          className="min-h-0"
        >
          <div className="flex-1 min-h-0">
            {actionItems.length > 0 ? (
              <div className="flex flex-col gap-1">
                {actionItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 rounded-md border border-white/[0.08] bg-[#242424] p-2">
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                      item.severity === 'high' ? 'bg-rose-500' :
                      item.severity === 'medium' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-white/40">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-white/40 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>No action items -- fleet is in good shape</span>
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section
          title="Top Cost Drivers"
          description="Vehicles with highest maintenance costs"
          icon={<TrendingUp className="h-4 w-4" />}
          className="min-h-0"
        >
          <div className="flex-1 min-h-0">
            {topCostDrivers.length > 0 ? (
              <div className="flex flex-col gap-1">
                {topCostDrivers.map((vehicle, index) => {
                  const maxCost = topCostDrivers[0]?.cost || 1
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs text-white/60 w-6 text-right">{index + 1}.</span>
                      <span className="text-xs text-white/80 w-32 truncate" title={vehicle.name}>{vehicle.name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-emerald-500/60"
                          style={{ width: `${(vehicle.cost / maxCost * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/60 w-16 text-right">{formatCurrency(vehicle.cost)}</span>
                      <span className="text-[10px] text-white/40 w-12 text-right">{vehicle.woCount} WOs</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-white/40 text-sm">No cost data available</div>
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

  // P0-1: Loading state for Reports tab
  const isLoading = !reportTemplates && !reportTemplatesError && !reportHistory && !reportHistoryError
  if (isLoading) {
    return <TabLoadingSkeleton />
  }

  const templates = Array.isArray(reportTemplates) ? reportTemplates : []
  const history = Array.isArray(reportHistory) ? reportHistory : []
  const schedules = Array.isArray(scheduledReports) ? scheduledReports : []
  const custom = Array.isArray(customReports) ? customReports : []

  const generatedThisMonth = (() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    return history.filter((item) => {
      const date = item.generatedAt ? new Date(item.generatedAt) : null
      if (!date || Number.isNaN(date.getTime())) return false
      return date.getMonth() === month && date.getFullYear() === year
    }).length
  })()

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
    <div className="flex flex-col gap-1.5 p-1.5">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5">
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
      <div className="grid grid-cols-2 gap-1.5">
        {/* Left: Report Library */}
        <Section
          title="Report Library"
          description="Available reports and templates"
          icon={<FileText className="h-4 w-4" />}
          className="min-h-0"
        >
          {/* P1-11: Removed inner overflow-y-auto */}
          <div className="flex-1 min-h-0">
            {templates.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <div className="flex flex-col gap-1">
                {templates.map((report: any) => (
                  <div key={report.id} className="flex items-center justify-between rounded-md border border-white/[0.08] bg-[#242424] p-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-white/40" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{report.title}</p>
                        <p className="text-xs text-white/60">
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
          {/* P1-11: Removed inner overflow-y-auto */}
          <div className="flex-1 min-h-0">
            {history.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <div className="flex flex-col gap-1">
                {history.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border border-white/[0.08] bg-[#242424] p-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-white/60">
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

          <TabsContent value="financial" className="flex-1 min-h-0 overflow-y-auto">
            <QueryErrorBoundary>
              <FinancialTabContent />
            </QueryErrorBoundary>
          </TabsContent>

          <TabsContent value="procurement" className="flex-1 min-h-0 overflow-y-auto">
            <QueryErrorBoundary>
              <ProcurementTabContent />
            </QueryErrorBoundary>
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 min-h-0 overflow-y-auto">
            <QueryErrorBoundary>
              <AnalyticsTabContent />
            </QueryErrorBoundary>
          </TabsContent>

          <TabsContent value="reports" className="flex-1 min-h-0 overflow-y-auto">
            <QueryErrorBoundary>
              <ReportsTabContent />
            </QueryErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </HubPage>
  )
}
