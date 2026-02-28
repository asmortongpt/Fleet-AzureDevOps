/**
 * BusinessManagementHub - Command Center Redesign
 *
 * Layout:
 * - Hero Banner (120px): 4 financial metrics, 42px font, sparklines
 * - Horizontal tabs: Financial, Procurement, Analytics, Reports
 * - Financial tab: 3-column (Cost Trend 40% | Cost Breakdown 30% | Recent Transactions 30%)
 * - All data hooks preserved from original implementation
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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import useSWR from 'swr'

import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HeroBanner, BannerMetric } from '@/components/ui/hero-banner'
import { HeroMetrics, type HeroMetric } from '@/components/ui/hero-metrics'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ResponsiveBarChart,
  ResponsiveLineChart,
} from '@/components/visualizations'
import { useAuth } from '@/contexts'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { getCsrfToken } from '@/hooks/use-api'
import { useFleetData } from '@/hooks/use-fleet-data'
import { apiFetcher } from '@/lib/api-fetcher'
import { formatEnum } from '@/utils/format-enum'
import { formatDate, formatCurrency, formatNumber } from '@/utils/format-helpers'
import logger from '@/utils/logger'
import { formatVehicleName } from '@/utils/vehicle-display'


const fetcher = apiFetcher

// ============================================================================
// INLINE STAT CARD (replaces StatCard from visualizations)
// ============================================================================

function InlineStat({
  label,
  value,
  detail,
  icon: Icon,
  trend,
}: {
  label: string
  value: string | number
  detail?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'neutral'
}) {
  const trendColor =
    trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-white/40'
  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'rgba(16,185,129,0.08)' }}
      >
        <Icon className="h-4 w-4 text-emerald-400/70" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.1em] text-white/30 font-semibold">{label}</p>
        <p className={`text-lg font-bold text-white tabular-nums leading-tight ${trend ? trendColor : ''}`}>
          {value}
        </p>
        {detail && <p className="text-[10px] text-white/25 truncate">{detail}</p>}
      </div>
    </div>
  )
}

// ============================================================================
// LOADING SKELETON COMPONENT
// ============================================================================

function TabLoadingSkeleton() {
  return (
    <div className="space-y-1.5 p-2">
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-md" />)}
      </div>
      <div className="grid grid-cols-2 gap-3">
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
 * Financial Tab - HeroBanner + 3-column layout (Cost Trend | Cost Breakdown bars | Recent Transactions)
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
      const period = b.category || b.month || b.period || b.fiscal_quarter
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
      })).filter((d: any) => d.value > 0).sort((a: any, b: any) => b.value - a.value)
    }
    // Fallback: derive from work orders by type
    const cats = new Map<string, number>()
    fleetWorkOrders.forEach((wo: any) => {
      const cat = formatEnum(wo.type || 'maintenance')
      cats.set(cat, (cats.get(cat) || 0) + Number(wo.total_cost || wo.cost || 0))
    })
    return Array.from(cats.entries()).map(([name, value]) => ({ name, value })).filter(d => d.value > 0).sort((a, b) => b.value - a.value)
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

  const budgetDelta = budgetTotal > 0 ? budgetTotal - spentTotal : 0
  const isOverBudget = budgetDelta < 0

  if (financialError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-rose-400 font-medium">Failed to load financial data</p>
        <p className="text-sm text-white/40">{financialError instanceof Error ? financialError.message : 'Unable to load financial data. Please try again.'}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  // Determine if we have budget data for a trend line
  const hasBudgetTrendData = costTrendData.some(d => d.budget != null && d.budget > 0)

  // Build sparkline data arrays for the hero banner
  const spendSparkData = costTrendData.map(d => ({ v: d.actual }))
  const budgetSparkData = costTrendData.filter(d => d.budget != null).map(d => ({ v: d.budget! }))

  const bannerMetrics: BannerMetric[] = [
    {
      label: 'Total Budget',
      value: budgetTotal > 0 ? formatCurrency(budgetTotal) : '--',
      icon: Wallet,
      sparkData: budgetSparkData.length > 1 ? budgetSparkData : undefined,
    },
    {
      label: 'Actual Spend',
      value: spentTotal > 0 ? formatCurrency(spentTotal) : '--',
      icon: DollarSign,
      trend: 'up',
      change: spentTotal > 0 && budgetTotal > 0 ? Math.round((spentTotal / budgetTotal) * 100 - 100) : undefined,
      sparkData: spendSparkData.length > 1 ? spendSparkData : undefined,
    },
    {
      label: 'Cost Per Mile',
      value: costPerMile > 0 ? formatCurrency(costPerMile) : '--',
      icon: DollarSign,
    },
    {
      label: isOverBudget ? 'Budget Overrun' : 'Savings YTD',
      value: budgetTotal > 0 ? formatCurrency(Math.abs(budgetDelta)) : '$0',
      icon: isOverBudget ? TrendingDown : Target,
      trend: isOverBudget ? 'down' : (budgetDelta > 0 ? 'up' : 'neutral'),
      change: budgetTotal > 0 ? Math.round((budgetDelta / budgetTotal) * 100) : undefined,
    },
  ]

  // Max value for horizontal breakdown bars
  const breakdownMax = breakdownData.length > 0 ? breakdownData[0].value : 1

  return (
    <div className="flex flex-col gap-4">
      {/* Hero Banner */}
      <HeroBanner metrics={bannerMetrics} />

      {/* 3-column layout: Cost Trend (40%) | Cost Breakdown (30%) | Recent Transactions (30%) */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '4fr 3fr 3fr' }}>
        {/* Column 1: Cost Trend AreaChart */}
        <div
          className="rounded-xl p-4 flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Cost Trend</h3>
              <p className="text-[11px] text-white/30 mt-0.5">
                {hasBudgetTrendData ? 'Actual vs budget' : 'Monthly actual costs'}
              </p>
            </div>
            <BarChart className="h-4 w-4 text-white/20" />
          </div>
          <div className="flex-1 min-h-0" style={{ minHeight: 220 }}>
            {costTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={costTrendData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    {hasBudgetTrendData && (
                      <linearGradient id="budgetFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6b7280" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#6b7280" stopOpacity={0.02} />
                      </linearGradient>
                    )}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#fff',
                    }}
                    formatter={(value: number) => [formatCurrency(value), undefined]}
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#costFill)"
                    name="Actual"
                  />
                  {hasBudgetTrendData && (
                    <Area
                      type="monotone"
                      dataKey="budget"
                      stroke="#6b7280"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fill="url(#budgetFill)"
                      name="Budget"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/25 text-sm">No cost trend data</div>
            )}
          </div>
        </div>

        {/* Column 2: Cost Breakdown - Horizontal bar chart */}
        <div
          className="rounded-xl p-4 flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Cost Breakdown</h3>
              <p className="text-[11px] text-white/30 mt-0.5">By category, sorted by amount</p>
            </div>
            <PieChart className="h-4 w-4 text-white/20" />
          </div>
          <div className="flex-1 min-h-0 flex flex-col gap-2.5 justify-center">
            {breakdownData.length > 0 ? (
              breakdownData.slice(0, 8).map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="text-[11px] text-white/50 w-24 truncate shrink-0" title={item.name}>
                    {item.name}
                  </span>
                  <div className="flex-1 h-4 rounded bg-white/[0.04] overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${Math.max((item.value / breakdownMax) * 100, 2)}%`,
                        background: 'linear-gradient(90deg, rgba(16,185,129,0.6) 0%, rgba(16,185,129,0.3) 100%)',
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-white/60 w-20 text-right tabular-nums shrink-0">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-white/25 text-sm">No breakdown data</div>
            )}
          </div>
        </div>

        {/* Column 3: Recent Transactions */}
        <div
          className="rounded-xl p-4 flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
              <p className="text-[11px] text-white/30 mt-0.5">Latest fleet expenses</p>
            </div>
            <Receipt className="h-4 w-4 text-white/20" />
          </div>
          <div className="flex-1 min-h-0 flex flex-col gap-1.5">
            {recentTransactions.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-white/25 text-sm">No recent transactions</div>
            ) : (
              recentTransactions.map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-[13px] font-medium text-white truncate">{transaction.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-white/30">{formatDate(transaction.date)}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(16,185,129,0.1)',
                          color: 'rgba(16,185,129,0.7)',
                        }}
                      >
                        {formatEnum(transaction.category)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[13px] font-semibold text-white tabular-nums shrink-0">
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Work Order Costs + Department Costs row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Work Order Costs */}
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-white/20" />
            <h3 className="text-sm font-semibold text-white">Work Order Costs</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Parts</p>
              <p className="text-lg font-bold text-white mt-1 tabular-nums">{formatCurrency(workOrderCosts.totalPartsCost)}</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Labor</p>
              <p className="text-lg font-bold text-white mt-1 tabular-nums">{formatCurrency(workOrderCosts.totalLaborCost)}</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Total</p>
              <p className="text-lg font-bold text-white mt-1 tabular-nums">{formatCurrency(workOrderCosts.totalWoCost)}</p>
            </div>
          </div>
        </div>

        {/* Department Costs */}
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Building className="h-4 w-4 text-white/20" />
            <h3 className="text-sm font-semibold text-white">Cost by Department</h3>
          </div>
          <div className="flex flex-col gap-2">
            {departmentCosts.length > 0 ? (
              departmentCosts.map((dept) => (
                <div key={dept.department} className="flex items-center gap-2">
                  <span className="text-[11px] text-white/50 w-24 truncate" title={dept.department}>{dept.department}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-emerald-500/60"
                      style={{ width: `${totalDeptCost > 0 ? (dept.cost / totalDeptCost * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-white/50 w-16 text-right tabular-nums">{formatCurrency(dept.cost)}</span>
                  <span className="text-[10px] text-white/25 w-8 text-right">
                    {totalDeptCost > 0 ? `${Math.round(dept.cost / totalDeptCost * 100)}%` : '0%'}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-20 text-white/25 text-sm">No department cost data</div>
            )}
          </div>
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

  const openPoValue = openOrders.reduce((sum: number, po: any) =>
    sum + Number(po.totalAmount || po.total_amount || 0), 0
  )

  const ordersByVendor = (() => {
    const map = new Map<string, number>()
    purchaseOrders.forEach((po: any) => {
      const id = po.vendorId || po.vendor_id
      if (!id) return
      map.set(id, (map.get(id) || 0) + 1)
    })
    return map
  })()

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
        <p className="text-rose-400 font-medium">Failed to load procurement data</p>
        <p className="text-sm text-white/40">{procurementError instanceof Error ? procurementError.message : 'Unable to load procurement data. Please try again.'}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* KPI Matrix */}
      <HeroMetrics
        className="rounded-lg border border-white/[0.08] bg-white/[0.03]"
        metrics={[
          { label: 'Active Vendors', value: String(activeVendors.length), icon: Building, accent: 'emerald' },
          { label: 'Open POs', value: String(openOrders.length), icon: ShoppingCart, accent: openOrders.length > 0 ? 'amber' : 'gray' },
          { label: 'Open PO Value', value: formatCurrency(openPoValue), icon: CreditCard, accent: 'gray' },
          { label: 'Vendor Spend', value: (() => { let t = 0; vendorWoCosts.forEach((v) => { t += v.totalCost }); return formatCurrency(t) })(), icon: Wrench, accent: 'gray' },
        ]}
      />

      {/* Main Content: Vendors + Purchase Orders */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left: Top Vendors */}
        <div
          className="rounded-xl p-4 flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Building className="h-4 w-4 text-white/20" />
            <div>
              <h3 className="text-sm font-semibold text-white">Top Vendors</h3>
              <p className="text-[11px] text-white/30 mt-0.5">Most frequently used suppliers</p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {displayedVendors.length > 0 ? (
              <div className="flex flex-col gap-1">
                {displayedVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition-colors hover:bg-white/[0.04]"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
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
                      <Building className="h-4 w-4 text-white/20" />
                      <div>
                        <p className="text-[13px] font-medium text-white">{vendor.name}</p>
                        <p className="text-[11px] text-white/40">
                          {formatEnum(vendor.category)} · {vendor.orders} {vendor.orders === 1 ? 'order' : 'orders'}
                          {vendor.woCost > 0 && (
                            <span className="ml-1">· WO: {formatCurrency(vendor.woCost)}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" title="Based on delivery performance">
                      <Award className="h-4 w-4 text-white/20" />
                      <span className="text-[13px] font-medium text-white">{vendor.rating ? `${vendor.rating}/5` : '--'}</span>
                    </div>
                  </div>
                ))}
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
              <div className="flex items-center justify-center h-32 text-white/25 text-sm">No records found</div>
            )}
          </div>
        </div>

        {/* Right: Purchase Orders */}
        <div
          className="rounded-xl p-4 flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="h-4 w-4 text-white/20" />
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Purchase Orders</h3>
              <p className="text-[11px] text-white/30 mt-0.5">Latest procurement requests</p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {recentPurchaseOrders.length > 0 ? (
              <div className="flex flex-col gap-1">
                {recentPurchaseOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition-colors hover:bg-white/[0.04]"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
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
                      <p className="text-[13px] font-medium text-white">{order.number || String(order.id).slice(0, 8)}</p>
                      <p className="text-[11px] text-white/40">{order.vendor}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(order.status)}>
                        {formatEnum(order.status) || '--'}
                      </Badge>
                      <p className="text-[13px] font-semibold text-white tabular-nums">{formatCurrency(order.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-white/25 text-sm">No records found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

/**
 * Analytics Tab - Fleet utilization, cost metrics, performance trends, action items
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

  // Loading state for Analytics tab
  const isLoading = fleetLoading && vehicles.length === 0
  if (isLoading) {
    return <TabLoadingSkeleton />
  }

  if (fleetError) {
    return (
      <div className="flex items-center justify-center h-32 text-white/40 text-sm">
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
    <div className="flex flex-col gap-3">
      {/* KPI Matrix */}
      <HeroMetrics
        className="rounded-lg border border-white/[0.08] bg-white/[0.03]"
        metrics={[
          { label: 'Fleet Utilization', value: `${fleetUtilization}%`, icon: Activity, trend: fleetUtilization >= 80 ? 'up' : fleetUtilization >= 60 ? 'neutral' : 'down', accent: fleetUtilization >= 80 ? 'emerald' : fleetUtilization >= 60 ? 'amber' : 'rose' },
          { label: 'Avg Cost / Vehicle', value: avgCostPerVehicle > 0 ? formatCurrency(avgCostPerVehicle) : '--', icon: DollarSign, accent: 'gray' },
          { label: 'Fuel Efficiency', value: fuelEfficiency > 0 ? `${formatNumber(fuelEfficiency, 1)} MPG` : '--', icon: Gauge, accent: 'gray' },
          { label: 'Maint. Ratio', value: `${maintenanceRatio}%`, icon: Wrench, trend: maintenanceRatio > 60 ? 'down' : 'neutral', accent: maintenanceRatio > 60 ? 'rose' : 'gray' },
        ]}
      />

      {/* Chart Row */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4 flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart className="h-4 w-4 text-white/20" />
            <div>
              <h3 className="text-sm font-semibold text-white">Cost Trend</h3>
              <p className="text-[11px] text-white/30 mt-0.5">Monthly fleet costs over 6 months</p>
            </div>
          </div>
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
            <div className="flex items-center justify-center h-32 text-white/25 text-sm">No cost trend data available</div>
          )}
        </div>

        <div
          className="rounded-xl p-4 flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <LineChart className="h-4 w-4 text-white/20" />
            <div>
              <h3 className="text-sm font-semibold text-white">Cost Per Vehicle</h3>
              <p className="text-[11px] text-white/30 mt-0.5">Monthly cost per vehicle trend</p>
            </div>
          </div>
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
            <div className="flex items-center justify-center h-32 text-white/25 text-sm">No performance data available</div>
          )}
        </div>
      </div>

      {/* Bottom Row: Action Items + Top Cost Drivers */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4 flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-white/20" />
            <div>
              <h3 className="text-sm font-semibold text-white">Action Items</h3>
              <p className="text-[11px] text-white/30 mt-0.5">Items requiring attention</p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {actionItems.length > 0 ? (
              <div className="flex flex-col gap-1">
                {actionItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 rounded-lg px-3 py-2.5"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      item.severity === 'high' ? 'bg-rose-500' :
                      item.severity === 'medium' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`} />
                    <div>
                      <p className="text-[13px] font-medium text-white">{item.label}</p>
                      <p className="text-[11px] text-white/30">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-white/25 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>No action items -- fleet is in good shape</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="rounded-xl p-4 flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-white/20" />
            <div>
              <h3 className="text-sm font-semibold text-white">Top Cost Drivers</h3>
              <p className="text-[11px] text-white/30 mt-0.5">Vehicles with highest maintenance costs</p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {topCostDrivers.length > 0 ? (
              <div className="flex flex-col gap-1">
                {topCostDrivers.map((vehicle, index) => {
                  const maxCost = topCostDrivers[0]?.cost || 1
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-[11px] text-white/40 w-6 text-right">{index + 1}.</span>
                      <span className="text-[11px] text-white/60 w-32 truncate" title={vehicle.name}>{vehicle.name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-emerald-500/60"
                          style={{ width: `${(vehicle.cost / maxCost * 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-white/50 w-16 text-right tabular-nums">{formatCurrency(vehicle.cost)}</span>
                      <span className="text-[10px] text-white/25 w-12 text-right">{vehicle.woCount} WOs</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-white/25 text-sm">No cost data available</div>
            )}
          </div>
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

  // Loading state for Reports tab
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
      <div className="flex items-center justify-center h-32 text-white/40 text-sm">
        Unable to load reports data. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* KPI Matrix */}
      <HeroMetrics
        className="rounded-lg border border-white/[0.08] bg-white/[0.03]"
        metrics={[
          { label: 'Available Reports', value: String(templates.length), icon: FileText, accent: 'emerald' },
          { label: 'Generated', value: String(generatedThisMonth), icon: Download, accent: 'gray' },
          { label: 'Scheduled', value: String(schedules.length), icon: Calendar, accent: 'gray' },
          { label: 'Custom Dashboards', value: String(custom.length), icon: BarChart, accent: 'gray' },
        ]}
      />

      {/* Main Content: Report Library + Recent Reports */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left: Report Library */}
        <div
          className="rounded-xl p-4 flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-white/20" />
            <div>
              <h3 className="text-sm font-semibold text-white">Report Library</h3>
              <p className="text-[11px] text-white/30 mt-0.5">Available reports and templates</p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {templates.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-white/25 text-sm">No records found</div>
            ) : (
              <div className="flex flex-col gap-1">
                {templates.map((report: any) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-white/20" />
                      <div>
                        <p className="text-[13px] font-medium text-white">{report.title}</p>
                        <p className="text-[11px] text-white/40">
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
        </div>

        {/* Right: Recently Generated */}
        <div
          className="rounded-xl p-4 flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-white/20" />
            <div>
              <h3 className="text-sm font-semibold text-white">Recently Generated</h3>
              <p className="text-[11px] text-white/30 mt-0.5">Latest report outputs</p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {history.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-white/25 text-sm">No records found</div>
            ) : (
              <div className="flex flex-col gap-1">
                {history.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div>
                      <p className="text-[13px] font-medium text-white">{item.title}</p>
                      <p className="text-[11px] text-white/40">
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
        </div>
      </div>
    </div>
  )
})

// ============================================================================
// TAB DEFINITIONS
// ============================================================================

const tabs = [
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'procurement', label: 'Procurement', icon: ShoppingCart },
  { id: 'analytics', label: 'Analytics', icon: BarChart },
  { id: 'reports', label: 'Reports', icon: FileText },
] as const

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BusinessManagementHub() {
  const [activeTab, setActiveTab] = useState('financial')
  const { user } = useAuth()

  return (
    <div className="flex flex-col h-full bg-[#111] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.1)' }}
          >
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white leading-tight">Business Management</h1>
            <p className="text-[11px] text-white/30">Financial oversight, procurement, analytics, and reporting</p>
          </div>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex items-center gap-1 px-6 pt-3 pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
              }`}
              data-testid={`hub-tab-${tab.id}`}
              aria-label={tab.label}
              role="tab"
              aria-selected={isActive}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
        <QueryErrorBoundary>
          {activeTab === 'financial' && <FinancialTabContent />}
          {activeTab === 'procurement' && <ProcurementTabContent />}
          {activeTab === 'analytics' && <AnalyticsTabContent />}
          {activeTab === 'reports' && <ReportsTabContent />}
        </QueryErrorBoundary>
      </div>
    </div>
  )
}
