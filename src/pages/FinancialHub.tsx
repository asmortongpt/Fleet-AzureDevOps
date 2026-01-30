/**
 * FinancialHub - Modern Financial Management Dashboard
 * Real-time financial tracking, budget monitoring, and expense analysis with responsive visualizations
 */

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import { DollarSign as FinancialIcon, Wallet, Receipt, BarChart, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, CreditCard, FileText as Invoice, Calendar, Plus } from 'lucide-react'
import HubPage from '@/components/ui/hub-page'
import { useReactiveFinancialData } from '@/hooks/use-reactive-financial-data'
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
 * Overview Tab - Financial summary and key metrics
 */
function FinancialOverview() {
  const {
    metrics,
    budgetByCategory,
    expenseByCategory,
    overdueInvoices,
    pendingApprovalExpenses,
    isLoading,
    lastUpdate,
  } = useReactiveFinancialData()

  // Prepare chart data for budget by category
  const budgetChartData = budgetByCategory.map((cat) => ({
    name: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
    allocated: cat.allocated,
    spent: cat.spent,
    remaining: cat.remaining,
  }))

  // Prepare chart data for expense distribution
  const expenseChartData = expenseByCategory
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map((cat) => ({
      name: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
      value: cat.value,
      fill: `hsl(var(--chart-${['primary', 'secondary', 'success', 'warning', 'danger', 'muted'][expenseByCategory.indexOf(cat) % 6]}))`,
    }))

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Overview</h2>
          <p className="text-muted-foreground">
            Real-time financial performance and budget monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="w-fit">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Transaction
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Budget"
          value={`$${(metrics?.totalBudget / 1000000 || 0).toFixed(2)}M`}
          icon={Wallet}
          trend="neutral"
          description="Annual allocation"
          loading={isLoading}
        />
        <StatCard
          title="Total Spent"
          value={`$${(metrics?.totalSpent / 1000000 || 0).toFixed(2)}M`}
          icon={Receipt}
          trend="up"
          change="+5.2%"
          description="Year to date"
          loading={isLoading}
        />
        <StatCard
          title="Budget Utilization"
          value={`${metrics?.budgetUtilization || 0}%`}
          icon={BarChart}
          trend={metrics?.budgetUtilization > 90 ? 'up' : 'neutral'}
          description="Of total budget"
          loading={isLoading}
        />
        <StatCard
          title="Remaining Budget"
          value={`$${(metrics?.totalRemaining / 1000000 || 0).toFixed(2)}M`}
          icon={TrendingDown}
          trend="down"
          description="Available funds"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget by Category */}
        <ResponsiveBarChart
          title="Budget by Category"
          description="Allocated vs spent by expense category"
          data={budgetChartData}
          height={300}
          loading={isLoading}
        />

        {/* Expense Distribution */}
        <ResponsivePieChart
          title="Expense Distribution"
          description="Current expense breakdown by category"
          data={expenseChartData}
          innerRadius={60}
          loading={isLoading}
        />
      </div>

      {/* Alert Sections Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue Invoices */}
        {overdueInvoices.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle>Overdue Invoices</CardTitle>
              </div>
              <CardDescription>Invoices requiring immediate payment</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {overdueInvoices.slice(0, 5).map((invoice, idx) => (
                    <motion.div
                      key={invoice.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{invoice.vendor}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        ${invoice.amount.toLocaleString()}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pending Approvals */}
        {pendingApprovalExpenses.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <CardTitle>Pending Approvals</CardTitle>
              </div>
              <CardDescription>Expenses awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingApprovalExpenses.slice(0, 5).map((expense, idx) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{expense.vendor}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.description || expense.category}
                        </p>
                      </div>
                      <Badge variant="warning">
                        ${expense.amount.toLocaleString()}
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
 * Budget Tab - Budget tracking and allocation
 */
function BudgetContent() {
  const {
    metrics,
    budgetByCategory,
    budgetByDepartment,
    budgetVariance,
    isLoading,
    lastUpdate,
  } = useReactiveFinancialData()

  // Prepare department budget chart data
  const departmentChartData = budgetByDepartment.map((dept) => ({
    name: dept.name,
    value: dept.value,
    fill: `hsl(var(--chart-${['primary', 'secondary', 'success', 'warning', 'danger', 'muted'][budgetByDepartment.indexOf(dept) % 6]}))`,
  }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Budget Tracking</h2>
          <p className="text-muted-foreground">
            Monitor budget allocation and spending across categories
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Annual Budget"
          value={`$${(metrics?.totalBudget / 1000000 || 0).toFixed(2)}M`}
          icon={Wallet}
          trend="neutral"
          description="Total allocated"
          loading={isLoading}
        />
        <StatCard
          title="YTD Spending"
          value={`$${(metrics?.totalSpent / 1000000 || 0).toFixed(2)}M`}
          icon={Receipt}
          trend="up"
          change="+5.2%"
          description="Year to date"
          loading={isLoading}
        />
        <StatCard
          title="Utilization Rate"
          value={`${metrics?.budgetUtilization || 0}%`}
          icon={BarChart}
          trend={metrics?.budgetUtilization > 90 ? 'up' : 'neutral'}
          description="Budget used"
          loading={isLoading}
        />
        <StatCard
          title="Available Funds"
          value={`$${(metrics?.totalRemaining / 1000000 || 0).toFixed(2)}M`}
          icon={TrendingDown}
          trend="down"
          description="Remaining budget"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget by Department */}
        <ResponsivePieChart
          title="Budget by Department"
          description="Budget allocation across departments"
          data={departmentChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Budget Variance */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Variance Analysis</CardTitle>
            <CardDescription>Over/under budget by category</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {budgetVariance.slice(0, 6).map((variance, idx) => (
                  <motion.div
                    key={variance.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{variance.category}</span>
                      <div className="flex items-center gap-2">
                        {variance.status === 'under' ? (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        )}
                        <Badge
                          variant={variance.status === 'under' ? 'default' : 'destructive'}
                        >
                          {variance.percentage}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          variance.status === 'under' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(Math.abs(variance.percentage), 100)}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Details by Category</CardTitle>
          <CardDescription>Detailed breakdown of allocated, spent, and remaining funds</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {budgetByCategory.map((category, idx) => (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-lg border"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-lg">
                      {category.category.charAt(0).toUpperCase() + category.category.slice(1)}
                    </h4>
                    <Badge
                      variant={
                        category.remaining > 0
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {Math.round((category.spent / category.allocated) * 100)}% Used
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Allocated</p>
                      <p className="font-bold">${category.allocated.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Spent</p>
                      <p className="font-bold text-blue-600">${category.spent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Remaining</p>
                      <p className={`font-bold ${category.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${category.remaining.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        category.remaining > 0 ? 'bg-blue-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min((category.spent / category.allocated) * 100, 100)}%`
                      }}
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
 * Expenses Tab - Expense tracking and analysis
 */
function ExpensesContent() {
  const {
    metrics,
    expenseTrendData,
    expenseByCategory,
    recentExpenses,
    isLoading,
    lastUpdate,
  } = useReactiveFinancialData()

  // Prepare expense category chart
  const categoryChartData = expenseByCategory
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map((cat) => ({
      name: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
      value: cat.value,
    }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expense Analysis</h2>
          <p className="text-muted-foreground">
            Track and analyze expenses across categories and time periods
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Expenses"
          value={`$${(metrics?.monthlyExpenses / 1000 || 0).toFixed(1)}K`}
          icon={Receipt}
          trend="up"
          change="+8.3%"
          description="Current month"
          loading={isLoading}
        />
        <StatCard
          title="Total Expenses"
          value={`$${(metrics?.totalExpenses / 1000000 || 0).toFixed(2)}M`}
          icon={BarChart}
          trend="neutral"
          description="Year to date"
          loading={isLoading}
        />
        <StatCard
          title="Pending Approvals"
          value={metrics?.pendingApprovals?.toString() || '0'}
          icon={Clock}
          trend="down"
          change="-3"
          description="Awaiting approval"
          loading={isLoading}
        />
        <StatCard
          title="Avg Daily Spend"
          value={`$${Math.round((metrics?.monthlyExpenses || 0) / 30).toLocaleString()}`}
          icon={TrendingUp}
          trend="neutral"
          description="Last 30 days"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expense Trend */}
        <ResponsiveLineChart
          title="Monthly Expense Trend"
          description="Expenses by category over the last 6 months"
          data={expenseTrendData}
          height={300}
          showArea
          loading={isLoading}
        />

        {/* Expense by Category */}
        <ResponsiveBarChart
          title="Expense by Category"
          description="Top expense categories"
          data={categoryChartData}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent High-Value Expenses</CardTitle>
          <CardDescription>Top 10 expenses from the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense, idx) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{expense.vendor}</p>
                      {!expense.approved && (
                        <Badge variant="warning" className="text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {expense.description || expense.category} • {expense.department}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${expense.amount.toLocaleString()}</p>
                    <Badge variant="outline" className="mt-1">
                      {expense.category}
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
 * Reports Tab - Financial reporting and analytics
 */
function ReportsContent() {
  const {
    metrics,
    invoices,
    isLoading,
    lastUpdate,
  } = useReactiveFinancialData()

  // Invoice status distribution
  const invoiceStatusData = [
    {
      name: 'Paid',
      value: metrics?.paidInvoices || 0,
      fill: 'hsl(var(--chart-success))',
    },
    {
      name: 'Pending',
      value: metrics?.pendingInvoices || 0,
      fill: 'hsl(var(--chart-warning))',
    },
    {
      name: 'Overdue',
      value: metrics?.overdueInvoices || 0,
      fill: 'hsl(var(--chart-danger))',
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
          <p className="text-muted-foreground">
            Comprehensive financial reporting and invoice management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Invoices"
          value={metrics?.totalInvoices?.toString() || '0'}
          icon={Invoice}
          trend="up"
          change="+12"
          description="This month"
          loading={isLoading}
        />
        <StatCard
          title="Paid Invoices"
          value={metrics?.paidInvoices?.toString() || '0'}
          icon={CheckCircle}
          trend="up"
          description="Successfully processed"
          loading={isLoading}
        />
        <StatCard
          title="Outstanding Amount"
          value={`$${(metrics?.outstandingAmount / 1000 || 0).toFixed(1)}K`}
          icon={CreditCard}
          trend="down"
          change="-$5.2K"
          description="Unpaid invoices"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invoice Status Distribution */}
        <ResponsivePieChart
          title="Invoice Status Distribution"
          description="Current status of all invoices"
          data={invoiceStatusData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Payment Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Processing Summary</CardTitle>
            <CardDescription>Invoice payment status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Payment Success Rate</span>
                  <span className="text-sm text-muted-foreground">
                    {metrics?.totalInvoices > 0
                      ? Math.round((metrics.paidInvoices / metrics.totalInvoices) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{
                      width: `${metrics?.totalInvoices > 0
                        ? Math.round((metrics.paidInvoices / metrics.totalInvoices) * 100)
                        : 0}%`
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Paid</span>
                  </div>
                  <span className="font-bold">{metrics?.paidInvoices || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <span className="font-medium">Pending</span>
                  </div>
                  <span className="font-bold">{metrics?.pendingInvoices || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Overdue</span>
                  </div>
                  <span className="font-bold">{metrics?.overdueInvoices || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Latest invoice activity</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 10).map((invoice, idx) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{invoice.vendor}</p>
                      <Badge
                        variant={
                          invoice.status === 'paid'
                            ? 'default'
                            : invoice.status === 'overdue'
                              ? 'destructive'
                              : 'warning'
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {invoice.invoiceNumber} • {invoice.category}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-bold text-lg">${invoice.amount.toLocaleString()}</p>
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
 * Main FinancialHub Component
 */
export default function FinancialHub() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <FinancialIcon className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <FinancialOverview />
        </ErrorBoundary>
      ),
    },
    {
      id: 'budget',
      label: 'Budget',
      icon: <Wallet className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading budget data...</div>}>
            <BudgetContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: <Receipt className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading expense data...</div>}>
            <ExpensesContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading report data...</div>}>
            <ReportsContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Financial Hub"
      description="Financial management, budget tracking, and expense analysis"
      icon={<FinancialIcon className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}
