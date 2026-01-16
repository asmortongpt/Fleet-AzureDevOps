/**
 * ProcurementHub - Modern Procurement Management Dashboard
 * Real-time procurement monitoring with responsive visualizations
 */

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import {
  Package,
  Storefront,
  ShoppingCart,
  FileText,
  ChartBar,
  Warning,
  TrendUp,
  CurrencyDollar,
  CalendarBlank,
  CheckCircle,
  Clock,
  Truck,
} from '@phosphor-icons/react'
import HubPage from '@/components/ui/hub-page'
import { useReactiveProcurementData } from '@/hooks/use-reactive-procurement-data'
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
 * Overview Tab - Main dashboard with key procurement metrics
 */
function ProcurementOverview() {
  const {
    metrics,
    poStatusDistribution,
    monthlySpendTrend,
    topVendorsBySpend,
    pendingApprovals,
    budgetAlerts,
    isLoading,
    lastUpdate,
  } = useReactiveProcurementData()

  // Prepare status chart data
  const statusChartData = Object.entries(poStatusDistribution).map(([name, value]) => ({
    name,
    value,
    fill:
      name === 'Approved'
        ? 'hsl(var(--primary))'
        : name === 'Pending Approval'
          ? 'hsl(var(--warning))'
          : name === 'In Transit'
            ? 'hsl(142, 76%, 36%)'
            : name === 'Received'
              ? 'hsl(var(--success))'
              : 'hsl(var(--muted))',
  }))

  // Prepare spend trend data
  const spendTrendData = monthlySpendTrend.map((item) => ({
    name: item.name,
    value: item.spend,
  }))

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Procurement Overview</h2>
          <p className="text-muted-foreground">
            Real-time procurement status and vendor performance
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Purchase Orders"
          value={metrics?.totalPOs?.toString() || '0'}
          icon={ShoppingCart}
          trend="neutral"
          description="All POs"
          loading={isLoading}
        />
        <StatCard
          title="Active Vendors"
          value={metrics?.activeVendors?.toString() || '0'}
          icon={Storefront}
          trend="up"
          change="+5%"
          description="Qualified suppliers"
          loading={isLoading}
        />
        <StatCard
          title="Pending Approvals"
          value={metrics?.pendingApprovals?.toString() || '0'}
          icon={Clock}
          trend={metrics && metrics.pendingApprovals > 10 ? 'down' : 'neutral'}
          description="Awaiting review"
          loading={isLoading}
        />
        <StatCard
          title="Total Spend (YTD)"
          value={`$${((metrics?.totalSpend || 0) / 1000).toFixed(1)}K`}
          icon={CurrencyDollar}
          trend="up"
          description="Year to date"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* PO Status Distribution */}
        <ResponsivePieChart
          title="Purchase Order Status"
          description="Current status breakdown of all purchase orders"
          data={statusChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Monthly Spend Trend */}
        <ResponsiveLineChart
          title="Monthly Spend Trend"
          description="Procurement spending over the last 6 months"
          data={spendTrendData}
          height={300}
          showArea
          loading={isLoading}
        />
      </div>

      {/* Budget Status Card */}
      <Card className={budgetAlerts ? 'border-amber-500' : ''}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CurrencyDollar className="h-5 w-5 text-emerald-500" />
            <CardTitle>Budget Status</CardTitle>
          </div>
          <CardDescription>Monthly budget tracking and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    ${((metrics?.budgetUsed || 0) / 1000).toFixed(1)}K
                  </p>
                  <p className="text-sm text-muted-foreground">
                    of ${((metrics?.budgetTotal || 0) / 1000).toFixed(0)}K monthly budget
                  </p>
                </div>
                <Badge variant={budgetAlerts ? 'warning' : 'success'}>
                  {((((metrics?.budgetUsed || 0) / (metrics?.budgetTotal || 1)) * 100) || 0).toFixed(0)}% Used
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((metrics?.budgetUsed || 0) / (metrics?.budgetTotal || 1)) * 100}%`,
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-3 rounded-full ${
                    budgetAlerts ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
              </div>
              {budgetAlerts && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <Warning className="h-4 w-4" />
                  <p>Budget usage exceeds 75% - Review spending carefully</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Warning className="h-5 w-5 text-amber-500" />
              <CardTitle>Pending Approvals</CardTitle>
            </div>
            <CardDescription>Purchase orders awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : pendingApprovals.length > 0 ? (
              <div className="space-y-2">
                {pendingApprovals.slice(0, 5).map((po) => (
                  <motion.div
                    key={po.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                  >
                    <div>
                      <p className="font-medium">{po.vendorName}</p>
                      <p className="text-sm text-muted-foreground">PO #{po.orderNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${(po.totalAmount / 1000).toFixed(1)}K</p>
                      <Badge variant={po.priority === 'urgent' ? 'destructive' : 'warning'}>
                        {po.priority}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No pending approvals</p>
            )}
          </CardContent>
        </Card>

        {/* Top Vendors by Spend */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendUp className="h-5 w-5 text-cyan-500" />
              <CardTitle>Top Vendors by Spend</CardTitle>
            </div>
            <CardDescription>Highest spending vendors this period</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : topVendorsBySpend.length > 0 ? (
              <div className="space-y-2">
                {topVendorsBySpend.map((vendor) => (
                  <motion.div
                    key={vendor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                  >
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Rating: {vendor.rating.toFixed(1)}/5.0
                      </p>
                    </div>
                    <Badge variant="secondary">
                      ${(vendor.totalSpend / 1000).toFixed(1)}K
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No vendor data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Purchase Orders Tab - PO tracking and management
 */
function PurchaseOrdersContent() {
  const {
    purchaseOrders,
    recentPurchaseOrders,
    poCategoryDistribution,
    overdueOrders,
    metrics,
    isLoading,
  } = useReactiveProcurementData()

  // Prepare category chart data
  const categoryChartData = Object.entries(poCategoryDistribution)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
        <p className="text-muted-foreground">Track and manage all purchase orders</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={purchaseOrders.length.toString()}
          icon={ShoppingCart}
          trend="neutral"
          description="All time"
          loading={isLoading}
        />
        <StatCard
          title="In Transit"
          value={
            purchaseOrders.filter((po) => po.status === 'in_transit').length.toString()
          }
          icon={Truck}
          trend="neutral"
          description="En route"
          loading={isLoading}
        />
        <StatCard
          title="Received"
          value={purchaseOrders.filter((po) => po.status === 'received').length.toString()}
          icon={CheckCircle}
          trend="up"
          description="Completed"
          loading={isLoading}
        />
        <StatCard
          title="Avg Order Value"
          value={`$${((metrics?.avgOrderValue || 0) / 1000).toFixed(1)}K`}
          icon={CurrencyDollar}
          trend="neutral"
          description="Per PO"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders by Category */}
        <ResponsiveBarChart
          title="Orders by Category"
          description="Purchase orders breakdown by category"
          data={categoryChartData}
          height={300}
          loading={isLoading}
        />

        {/* Overdue Orders Alert */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Warning className="h-5 w-5 text-red-500" />
              <CardTitle>Overdue Deliveries</CardTitle>
            </div>
            <CardDescription>Orders past expected delivery date</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : overdueOrders.length > 0 ? (
              <div className="space-y-2">
                {overdueOrders.slice(0, 5).map((po) => (
                  <motion.div
                    key={po.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-3"
                  >
                    <div>
                      <p className="font-medium">{po.vendorName}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <Badge variant="destructive">{po.priority}</Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No overdue orders</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Purchase Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Purchase Orders</CardTitle>
          <CardDescription>Latest purchase orders activity</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {recentPurchaseOrders.map((po) => (
                <motion.div
                  key={po.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        po.status === 'received'
                          ? 'bg-emerald-100 dark:bg-emerald-950'
                          : po.status === 'in_transit'
                            ? 'bg-blue-100 dark:bg-blue-950'
                            : po.status === 'pending_approval'
                              ? 'bg-amber-100 dark:bg-amber-950'
                              : 'bg-slate-100 dark:bg-slate-950'
                      }`}
                    >
                      {po.status === 'received' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : po.status === 'in_transit' ? (
                        <Truck className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{po.vendorName}</p>
                      <p className="text-sm text-muted-foreground">
                        PO #{po.orderNumber} • {po.items} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold">${(po.totalAmount / 1000).toFixed(1)}K</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        po.status === 'received'
                          ? 'success'
                          : po.status === 'pending_approval'
                            ? 'warning'
                            : 'secondary'
                      }
                    >
                      {po.status.replace('_', ' ')}
                    </Badge>
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
 * Vendors Tab - Vendor management and performance
 */
function VendorsContent() {
  const { vendors, vendorSpendData, expiringContracts, metrics, isLoading } =
    useReactiveProcurementData()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Vendor Management</h2>
        <p className="text-muted-foreground">Track vendor performance and relationships</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Vendors"
          value={vendors.length.toString()}
          icon={Storefront}
          trend="neutral"
          description="All vendors"
          loading={isLoading}
        />
        <StatCard
          title="Active Vendors"
          value={vendors.filter((v) => v.status === 'active').length.toString()}
          icon={CheckCircle}
          trend="up"
          description="Currently active"
          loading={isLoading}
        />
        <StatCard
          title="On-Time Delivery"
          value={`${(metrics?.onTimeDeliveryRate || 0).toFixed(0)}%`}
          icon={Truck}
          trend={metrics && metrics.onTimeDeliveryRate > 90 ? 'up' : 'down'}
          description="Fleet average"
          loading={isLoading}
        />
        <StatCard
          title="Expiring Contracts"
          value={expiringContracts.length.toString()}
          icon={CalendarBlank}
          trend={expiringContracts.length > 0 ? 'down' : 'neutral'}
          description="Within 30 days"
          loading={isLoading}
        />
      </div>

      {/* Vendor Spend Chart */}
      <ResponsiveBarChart
        title="Top Vendors by Spend"
        description="Highest spending vendors in the current period"
        data={vendorSpendData.map((v) => ({ name: v.name, value: v.spend }))}
        height={300}
        loading={isLoading}
      />

      {/* Alerts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expiring Contracts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarBlank className="h-5 w-5 text-amber-500" />
              <CardTitle>Expiring Contracts</CardTitle>
            </div>
            <CardDescription>Contracts expiring within 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : expiringContracts.length > 0 ? (
              <div className="space-y-2">
                {expiringContracts.map((contract) => (
                  <motion.div
                    key={contract.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3"
                  >
                    <div>
                      <p className="font-medium">{contract.vendorName}</p>
                      <p className="text-sm text-muted-foreground">
                        Expires: {new Date(contract.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="warning">{contract.type}</Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No contracts expiring soon
              </p>
            )}
          </CardContent>
        </Card>

        {/* Vendor Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendUp className="h-5 w-5 text-emerald-500" />
              <CardTitle>Top Performing Vendors</CardTitle>
            </div>
            <CardDescription>Highest rated vendors by performance</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {vendors
                  .filter((v) => v.status === 'active')
                  .sort((a, b) => b.rating - a.rating)
                  .slice(0, 5)
                  .map((vendor) => (
                    <motion.div
                      key={vendor.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          OTD: {vendor.onTimeDelivery.toFixed(0)}%
                        </p>
                      </div>
                      <Badge variant="success">{vendor.rating.toFixed(1)}/5.0</Badge>
                    </motion.div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Analytics Tab - Spend analysis and trends
 */
function AnalyticsContent() {
  const { monthlySpendTrend, poStatusDistribution, metrics, isLoading } =
    useReactiveProcurementData()

  // Prepare spend trend data
  const spendTrendData = monthlySpendTrend.map((item) => ({
    name: item.name,
    value: item.spend,
  }))

  // Prepare status distribution data
  const statusChartData = Object.entries(poStatusDistribution).map(([name, value]) => ({
    name,
    value,
    fill:
      name === 'Approved'
        ? 'hsl(var(--primary))'
        : name === 'Pending Approval'
          ? 'hsl(var(--warning))'
          : name === 'In Transit'
            ? 'hsl(142, 76%, 36%)'
            : 'hsl(var(--success))',
  }))

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics & Insights</h2>
        <p className="text-muted-foreground">Procurement trends and spend analysis</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Spend"
          value={`$${((metrics?.monthlySpend || 0) / 1000).toFixed(1)}K`}
          icon={CurrencyDollar}
          trend="up"
          change="+8%"
          description="This month"
          loading={isLoading}
        />
        <StatCard
          title="Avg Order Value"
          value={`$${((metrics?.avgOrderValue || 0) / 1000).toFixed(1)}K`}
          icon={ShoppingCart}
          trend="neutral"
          description="Per order"
          loading={isLoading}
        />
        <StatCard
          title="Budget Usage"
          value={`${((((metrics?.budgetUsed || 0) / (metrics?.budgetTotal || 1)) * 100) || 0).toFixed(0)}%`}
          icon={ChartBar}
          trend={
            ((metrics?.budgetUsed || 0) / (metrics?.budgetTotal || 1)) > 0.75 ? 'down' : 'up'
          }
          description="Of monthly budget"
          loading={isLoading}
        />
        <StatCard
          title="Total Orders"
          value={metrics?.totalPOs?.toString() || '0'}
          icon={Package}
          trend="up"
          description="All time"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spend Trend */}
        <ResponsiveLineChart
          title="6-Month Spend Trend"
          description="Monthly procurement spending analysis"
          data={spendTrendData}
          height={300}
          showArea
          loading={isLoading}
        />

        {/* Status Distribution */}
        <ResponsivePieChart
          title="Order Status Distribution"
          description="Current purchase order status breakdown"
          data={statusChartData}
          innerRadius={60}
          loading={isLoading}
        />
      </div>

      {/* ROI Analysis Card */}
      <Card>
        <CardHeader>
          <CardTitle>Procurement ROI Analysis</CardTitle>
          <CardDescription>Return on investment and cost savings metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Cost Savings</p>
                <p className="text-2xl font-bold text-emerald-600">$24.5K</p>
                <p className="text-xs text-muted-foreground">
                  12% reduction vs previous period
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Negotiated Discounts</p>
                <p className="text-2xl font-bold text-blue-600">$18.2K</p>
                <p className="text-xs text-muted-foreground">Across 23 vendors</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Process Efficiency</p>
                <p className="text-2xl font-bold text-purple-600">94%</p>
                <p className="text-xs text-muted-foreground">Orders processed on time</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Main ProcurementHub Component
 */
export default function ProcurementHub() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <ChartBar className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <ProcurementOverview />
        </ErrorBoundary>
      ),
    },
    {
      id: 'purchase-orders',
      label: 'Purchase Orders',
      icon: <ShoppingCart className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <PurchaseOrdersContent />
        </ErrorBoundary>
      ),
    },
    {
      id: 'vendors',
      label: 'Vendors',
      icon: <Storefront className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <VendorsContent />
        </ErrorBoundary>
      ),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <TrendUp className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <AnalyticsContent />
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Procurement Hub"
      description="Comprehensive procurement management and vendor tracking"
      icon={<Package className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}

export { ProcurementHub }
