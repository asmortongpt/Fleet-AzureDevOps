/**
 * FinancialHub - Comprehensive Financial Management Hub
 * Route: /financial
 *
 * Provides unified financial operations including:
 * - Cost Analysis & Tracking
 * - Billing & Revenue Reports
 * - Budget Management & Forecasting
 * - Cost-Benefit Analysis
 * - Invoice Processing & Approval
 * - Payment Tracking & Reconciliation
 */

import {
    CurrencyDollar,
    ChartBar,
    Receipt,
    Wallet,
    TrendUp,
    FileText,
    CreditCard,
    ChartLine,
    Calculator,
    Invoice,
    Coins,
    Bank,
    Users,
    Sparkle,
    CheckCircle,
    XCircle,
    Clock,
    ArrowRight
} from '@phosphor-icons/react'
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, QuickStat } from '@/components/ui/stat-card'
import { useDrilldown, DrilldownLevel } from '@/contexts/DrilldownContext'

// Chart color palette
const CHART_COLORS = {
    primary: '#3B82F6',
    secondary: '#06B6D4',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#A855F7',
    teal: '#14B8A6',
    slate: '#64748B',
}

// Budget vs Actual trend data
const budgetTrendData = [
    { month: 'Jan', budget: 310, actual: 285, variance: 25 },
    { month: 'Feb', budget: 310, actual: 302, variance: 8 },
    { month: 'Mar', budget: 310, actual: 289, variance: 21 },
    { month: 'Apr', budget: 310, actual: 276, variance: 34 },
    { month: 'May', budget: 310, actual: 318, variance: -8 },
    { month: 'Jun', budget: 310, actual: 284, variance: 26 },
    { month: 'Jul', budget: 310, actual: 295, variance: 15 },
    { month: 'Aug', budget: 310, actual: 308, variance: 2 },
]

// Department budget allocation (donut chart data)
const departmentBudgetData = [
    { name: 'Operations', value: 1500, percentage: 40, color: CHART_COLORS.primary },
    { name: 'Maintenance', value: 1000, percentage: 27, color: CHART_COLORS.success },
    { name: 'Fleet Services', value: 800, percentage: 21, color: CHART_COLORS.warning },
    { name: 'Administration', value: 420, percentage: 11, color: CHART_COLORS.purple },
]

// Monthly spending trend (area chart data)
const spendingTrendData = [
    { month: 'Jan', operations: 120, maintenance: 89, fleet: 72, admin: 40 },
    { month: 'Feb', operations: 125, maintenance: 92, fleet: 75, admin: 42 },
    { month: 'Mar', operations: 118, maintenance: 88, fleet: 70, admin: 38 },
    { month: 'Apr', operations: 115, maintenance: 85, fleet: 68, admin: 36 },
    { month: 'May', operations: 132, maintenance: 95, fleet: 78, admin: 44 },
    { month: 'Jun', operations: 122, maintenance: 90, fleet: 72, admin: 41 },
]

// Department spending comparison (bar chart data)
const departmentComparisonData = [
    { department: 'Operations', budgeted: 1500, spent: 1200, remaining: 300 },
    { department: 'Maintenance', budgeted: 1000, spent: 890, remaining: 110 },
    { department: 'Fleet Services', budgeted: 800, spent: 720, remaining: 80 },
    { department: 'Administration', budgeted: 420, spent: 240, remaining: 180 },
]

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 shadow-xl">
                <p className="text-sm font-medium text-white mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-xs">
                        <span className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-slate-300">{entry.name}:</span>
                        </span>
                        <span className="font-semibold text-white">
                            ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}K
                        </span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

/**
 * Cost Analysis Tab
 * Real-time cost tracking, variance analysis, and departmental breakdowns
 */
function CostAnalysisContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-8 space-y-8 bg-gradient-to-b from-slate-900/50 via-transparent to-transparent">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Cost Analysis & Control</h2>
                    <p className="text-slate-400">Real-time cost tracking and budget variance monitoring</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 rounded-lg border border-slate-700/50 transition-all text-sm font-medium">
                        Export Report
                    </button>
                    <button className="px-4 py-2 bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-blue-500/20">
                        Download CSV
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Total Monthly Costs"
                    value="$284.5K"
                    variant="primary"
                    icon={<CurrencyDollar className="w-6 h-6" />}
                    onClick={() => push({
                        type: 'total-costs',
                        data: { title: 'Monthly Cost Breakdown', period: 'current' },
                        id: 'total-monthly-costs'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Fuel Costs"
                    value="$124.2K"
                    variant="warning"
                    trend={{ value: "+8.2%", direction: "up" }}
                    onClick={() => push({
                        type: 'fuel-costs',
                        data: { title: 'Fuel Cost Analysis', category: 'fuel' },
                        id: 'fuel-costs-detail'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Maintenance Costs"
                    value="$89.3K"
                    variant="success"
                    trend={{ value: "-3.1%", direction: "down" }}
                    onClick={() => push({
                        type: 'maintenance-costs',
                        data: { title: 'Maintenance Cost Breakdown', category: 'maintenance' },
                        id: 'maintenance-costs'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Cost per Mile"
                    value="$0.82"
                    variant="default"
                    icon={<Calculator className="w-6 h-6" />}
                    onClick={() => push({
                        type: 'cost-per-mile',
                        data: { title: 'Cost per Mile Analysis' },
                        id: 'cpm-analysis'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            {/* Detailed Analysis Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 cursor-pointer hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                    onClick={() => push({ type: 'cost-variance', data: { title: 'Budget vs Actual Variance' }, id: 'variance-analysis' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Budget Variance Analysis</h3>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">On Track</span>
                    </div>
                    <div className="flex items-center justify-center mb-6">
                        <ProgressRing progress={92} color="green" label="92%" sublabel="of budget utilized" />
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                            <span className="text-slate-400">Monthly Budget</span>
                            <span className="font-semibold text-white">$310,000</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                            <span className="text-slate-400">Spent to Date</span>
                            <span className="font-semibold text-white">$284,500</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <span className="text-emerald-400">Remaining</span>
                            <span className="font-semibold text-emerald-400">$25,500</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 cursor-pointer hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                    onClick={() => push({ type: 'cost-categories', data: { title: 'Cost Category Breakdown' }, id: 'category-breakdown' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Cost Distribution by Category</h3>
                        <ChartLine className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300">Fuel</span>
                                <span className="font-semibold text-white">43.6% <span className="text-amber-400 text-xs">↑</span></span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-2.5">
                                <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-2.5 rounded-full" style={{ width: '43.6%' }}></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300">Maintenance</span>
                                <span className="font-semibold text-white">31.4% <span className="text-emerald-400 text-xs">↓</span></span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-2.5">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-2.5 rounded-full" style={{ width: '31.4%' }}></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300">Insurance</span>
                                <span className="font-semibold text-white">15.2%</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-2.5">
                                <div className="bg-gradient-to-r from-purple-500 to-purple-400 h-2.5 rounded-full" style={{ width: '15.2%' }}></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300">Other</span>
                                <span className="font-semibold text-white">9.8%</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-2.5">
                                <div className="bg-gradient-to-r from-slate-500 to-slate-400 h-2.5 rounded-full" style={{ width: '9.8%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Billing Reports Tab
 * Revenue tracking, billing cycles, and customer invoicing
 */
function BillingReportsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-8 space-y-8 bg-gradient-to-b from-slate-900/50 via-transparent to-transparent">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Billing & Revenue Reports</h2>
                    <p className="text-slate-400">Accounts receivable, invoice management, and revenue analytics</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 rounded-lg border border-slate-700/50 transition-all text-sm font-medium">
                        Generate Invoice
                    </button>
                    <button className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-emerald-500/20">
                        Billing Report
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Monthly Revenue"
                    value="$456.8K"
                    variant="success"
                    icon={<ChartBar className="w-6 h-6" />}
                    trend={{ value: "+12.3%", direction: "up" }}
                    onClick={() => push({
                        type: 'revenue',
                        data: { title: 'Revenue Breakdown', period: 'monthly' },
                        id: 'monthly-revenue'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Outstanding AR"
                    value="$124.5K"
                    variant="warning"
                    onClick={() => push({
                        type: 'accounts-receivable',
                        data: { title: 'Accounts Receivable Aging' },
                        id: 'ar-aging'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Paid Invoices"
                    value="342"
                    variant="success"
                    icon={<Receipt className="w-6 h-6" />}
                    onClick={() => push({
                        type: 'paid-invoices',
                        data: { title: 'Paid Invoices This Month' },
                        id: 'paid-invoices'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Overdue"
                    value="$18.2K"
                    variant="danger"
                    onClick={() => push({
                        type: 'overdue-invoices',
                        data: { title: 'Overdue Invoices' },
                        id: 'overdue-invoices'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            {/* Detailed Analysis Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 cursor-pointer hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                    onClick={() => push({ type: 'billing-cycle', data: { title: 'Billing Cycle Performance' }, id: 'billing-cycle' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Collection Performance</h3>
                        <Receipt className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex items-center justify-center mb-6">
                        <ProgressRing progress={87} color="blue" label="87%" sublabel="collected on time" />
                    </div>
                    <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <p className="text-xs text-blue-400 font-medium">Above industry average of 75%</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 cursor-pointer hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                    onClick={() => push({ type: 'revenue-trend', data: { title: 'Revenue Trends' }, id: 'revenue-trend' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Revenue Growth</h3>
                        <TrendUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-slate-400">This Quarter</span>
                                <span className="text-xs text-emerald-400 font-medium">↑ 12%</span>
                            </div>
                            <span className="text-2xl font-bold text-white">$1.32M</span>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <span className="text-sm text-slate-400 block mb-1">Last Quarter</span>
                            <span className="text-2xl font-bold text-slate-300">$1.18M</span>
                        </div>
                        <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <span className="text-sm text-emerald-400 block mb-1">YoY Growth</span>
                            <span className="text-2xl font-bold text-emerald-400">+15.8%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 cursor-pointer hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                    onClick={() => push({ type: 'top-customers', data: { title: 'Top Revenue Customers' }, id: 'top-customers' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Top Customers</h3>
                        <Users className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg border-l-2 border-amber-500">
                            <div>
                                <div className="text-sm font-medium text-white">Customer A</div>
                                <div className="text-xs text-slate-400">42 invoices</div>
                            </div>
                            <span className="text-lg font-bold text-amber-400">$89.2K</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg border-l-2 border-blue-500">
                            <div>
                                <div className="text-sm font-medium text-white">Customer B</div>
                                <div className="text-xs text-slate-400">28 invoices</div>
                            </div>
                            <span className="text-lg font-bold text-blue-400">$67.4K</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg border-l-2 border-purple-500">
                            <div>
                                <div className="text-sm font-medium text-white">Customer C</div>
                                <div className="text-xs text-slate-400">19 invoices</div>
                            </div>
                            <span className="text-lg font-bold text-purple-400">$54.1K</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Budget Tracking Tab
 * Budget allocation, forecasting, and departmental spending with comprehensive data visualizations
 */
function BudgetTrackingContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-8 space-y-8 bg-gradient-to-b from-slate-900/50 via-transparent to-transparent">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Budget Tracking & Forecasting</h2>
                    <p className="text-slate-400">Real-time budget monitoring, variance analysis, and predictive forecasting with interactive visualizations</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 rounded-lg border border-slate-700/50 transition-all text-sm font-medium">
                        Adjust Budget
                    </button>
                    <button className="px-4 py-2 bg-purple-600/90 hover:bg-purple-500 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-purple-500/20">
                        Forecast Report
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Annual Budget"
                    value="$3.72M"
                    variant="primary"
                    icon={<Wallet className="w-6 h-6" />}
                    onClick={() => push({
                        type: 'annual-budget',
                        data: { title: 'Annual Budget Overview', fiscal_year: 2026 },
                        id: 'annual-budget'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="YTD Spent"
                    value="$1.14M"
                    variant="success"
                    trend={{ value: "On track", direction: "neutral" }}
                    onClick={() => push({
                        type: 'ytd-spending',
                        data: { title: 'Year-to-Date Spending' },
                        id: 'ytd-spending'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Forecast Variance"
                    value="+2.4%"
                    variant="warning"
                    onClick={() => push({
                        type: 'forecast-variance',
                        data: { title: 'Forecast vs Actual Variance' },
                        id: 'forecast-variance'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Remaining Budget"
                    value="$2.58M"
                    variant="default"
                    icon={<Coins className="w-6 h-6" />}
                    onClick={() => push({
                        type: 'remaining-budget',
                        data: { title: 'Budget Remaining by Category' },
                        id: 'remaining-budget'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            {/* VISUALIZATION 1: Budget vs Actual Line Chart */}
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 hover:border-blue-500/30 transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Budget vs Actual Spending</h3>
                        <p className="text-sm text-slate-400">Monthly comparison showing budget adherence and variance</p>
                    </div>
                    <select className="px-3 py-2 bg-slate-900/50 text-slate-300 rounded-lg border border-slate-700/50 text-sm">
                        <option>Last 8 Months</option>
                        <option>Last 12 Months</option>
                        <option>YTD</option>
                    </select>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={budgetTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} label={{ value: 'Amount ($K)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: '12px' } }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px', color: '#cbd5e1' }} />
                        <Line type="monotone" dataKey="budget" stroke={CHART_COLORS.primary} strokeWidth={3} dot={{ fill: CHART_COLORS.primary, r: 4 }} activeDot={{ r: 6 }} name="Budget" />
                        <Line type="monotone" dataKey="actual" stroke={CHART_COLORS.success} strokeWidth={3} dot={{ fill: CHART_COLORS.success, r: 4 }} activeDot={{ r: 6 }} name="Actual" />
                    </LineChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700/50">
                    <div className="text-center">
                        <div className="text-sm text-slate-400 mb-1">Avg Budget</div>
                        <div className="text-xl font-bold text-white">$310K</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-slate-400 mb-1">Avg Actual</div>
                        <div className="text-xl font-bold text-emerald-400">$294.6K</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-slate-400 mb-1">Avg Variance</div>
                        <div className="text-xl font-bold text-emerald-400">+$15.4K</div>
                    </div>
                </div>
            </div>

            {/* VISUALIZATION 2 & 3: Donut Chart and Area Chart Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* VISUALIZATION 2: Department Budget Allocation Donut Chart */}
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 hover:border-purple-500/30 transition-all duration-300">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Budget Allocation by Department</h3>
                            <p className="text-sm text-slate-400">Annual budget distribution across departments</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={departmentBudgetData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                labelLine={{stroke: '#64748b', strokeWidth: 1}}
                            >
                                {departmentBudgetData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={({ active, payload }) => {
                                if (active && payload && payload[0]) {
                                    const data = payload[0].payload
                                    return (
                                        <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 shadow-xl">
                                            <p className="text-sm font-medium text-white mb-1">{data.name}</p>
                                            <p className="text-xs text-slate-300">Budget: ${data.value}K</p>
                                            <p className="text-xs text-slate-300">Percentage: {data.percentage}%</p>
                                        </div>
                                    )
                                }
                                return null
                            }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {departmentBudgetData.map((dept, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-slate-900/30 rounded-lg">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                                <div className="flex-1">
                                    <div className="text-xs text-white font-medium">{dept.name}</div>
                                    <div className="text-xs text-slate-400">${dept.value}K</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* VISUALIZATION 3: Spending Trends Area Chart */}
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 hover:border-cyan-500/30 transition-all duration-300">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Spending Trends by Category</h3>
                            <p className="text-sm text-slate-400">6-month spending pattern across departments</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={spendingTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorOperations" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorFleet" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS.warning} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={CHART_COLORS.warning} stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorAdmin" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS.purple} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={CHART_COLORS.purple} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                            <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            <Area type="monotone" dataKey="operations" stroke={CHART_COLORS.primary} fillOpacity={1} fill="url(#colorOperations)" name="Operations" />
                            <Area type="monotone" dataKey="maintenance" stroke={CHART_COLORS.success} fillOpacity={1} fill="url(#colorMaintenance)" name="Maintenance" />
                            <Area type="monotone" dataKey="fleet" stroke={CHART_COLORS.warning} fillOpacity={1} fill="url(#colorFleet)" name="Fleet" />
                            <Area type="monotone" dataKey="admin" stroke={CHART_COLORS.purple} fillOpacity={1} fill="url(#colorAdmin)" name="Admin" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* VISUALIZATION 4: Department Comparison Bar Chart */}
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 hover:border-emerald-500/30 transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Department Spending Comparison</h3>
                        <p className="text-sm text-slate-400">Budgeted vs spent vs remaining by department</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={departmentComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="department" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} label={{ value: 'Amount ($K)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: '12px' } }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                        <Bar dataKey="budgeted" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} name="Budgeted" />
                        <Bar dataKey="spent" fill={CHART_COLORS.warning} radius={[8, 8, 0, 0]} name="Spent" />
                        <Bar dataKey="remaining" fill={CHART_COLORS.success} radius={[8, 8, 0, 0]} name="Remaining" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Detailed Department Budget Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 cursor-pointer hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                    onClick={() => push({ type: 'budget-utilization', data: { title: 'Budget Utilization by Department' }, id: 'dept-budget' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Department Budget Utilization</h3>
                        <ChartBar className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-5">
                        {/* Operations */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-sm font-medium text-white">Operations</span>
                                    <div className="text-xs text-slate-400 mt-1">$1.2M of $1.5M • 80% utilized</div>
                                </div>
                                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">On Track</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-3">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full relative" style={{ width: '80%' }}>
                                    <div className="absolute right-0 top-0 h-full w-1 bg-blue-300 rounded-r-full"></div>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Remaining: $300K</span>
                                <span>6 months left</span>
                            </div>
                        </div>

                        {/* Maintenance */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-sm font-medium text-white">Maintenance</span>
                                    <div className="text-xs text-slate-400 mt-1">$890K of $1.0M • 89% utilized</div>
                                </div>
                                <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">Under Budget</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-3">
                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3 rounded-full relative" style={{ width: '89%' }}>
                                    <div className="absolute right-0 top-0 h-full w-1 bg-emerald-300 rounded-r-full"></div>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Remaining: $110K</span>
                                <span>6 months left</span>
                            </div>
                        </div>

                        {/* Fleet Services */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-sm font-medium text-white">Fleet Services</span>
                                    <div className="text-xs text-slate-400 mt-1">$720K of $800K • 90% utilized</div>
                                </div>
                                <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">Watch</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-3">
                                <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-3 rounded-full relative" style={{ width: '90%' }}>
                                    <div className="absolute right-0 top-0 h-full w-1 bg-amber-300 rounded-r-full"></div>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Remaining: $80K</span>
                                <span>6 months left</span>
                            </div>
                        </div>

                        {/* Administration */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-sm font-medium text-white">Administration</span>
                                    <div className="text-xs text-slate-400 mt-1">$240K of $420K • 57% utilized</div>
                                </div>
                                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">Ahead</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-3">
                                <div className="bg-gradient-to-r from-purple-500 to-purple-400 h-3 rounded-full relative" style={{ width: '57%' }}>
                                    <div className="absolute right-0 top-0 h-full w-1 bg-purple-300 rounded-r-full"></div>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Remaining: $180K</span>
                                <span>6 months left</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 cursor-pointer hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                    onClick={() => push({ type: 'budget-forecast', data: { title: 'Budget Forecast Analysis' }, id: 'budget-forecast' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Predictive Forecast Analysis</h3>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">94% Accurate</span>
                    </div>
                    <div className="flex items-center justify-center mb-6">
                        <ProgressRing progress={94} color="green" label="94%" sublabel="forecast accuracy" />
                    </div>
                    <div className="space-y-3">
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">Q2 2026 Projected Spend</span>
                                <TrendUp className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">$932,000</div>
                            <div className="text-xs text-slate-400">Based on rolling 90-day average</div>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">Budgeted Amount</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-300 mb-1">$910,000</div>
                            <div className="text-xs text-slate-400">Q2 allocation</div>
                        </div>
                        <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-amber-400">Projected Variance</span>
                                <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-300 rounded-full">+2.4%</span>
                            </div>
                            <div className="text-2xl font-bold text-amber-400 mb-1">+$22,000</div>
                            <div className="text-xs text-amber-400/70">Consider budget reallocation or cost controls</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Trend Card */}
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Monthly Spending Trend</h3>
                        <p className="text-sm text-slate-400">Actual vs Budget comparison across all departments</p>
                    </div>
                    <select className="px-3 py-2 bg-slate-900/50 text-slate-300 rounded-lg border border-slate-700/50 text-sm">
                        <option>Last 6 Months</option>
                        <option>Last 12 Months</option>
                        <option>YTD</option>
                    </select>
                </div>
                <div className="grid grid-cols-6 gap-4">
                    {[
                        { month: 'Jan', actual: 285, budget: 310, status: 'good' },
                        { month: 'Feb', actual: 302, budget: 310, status: 'warn' },
                        { month: 'Mar', actual: 289, budget: 310, status: 'good' },
                        { month: 'Apr', actual: 276, budget: 310, status: 'good' },
                        { month: 'May', actual: 318, budget: 310, status: 'over' },
                        { month: 'Jun', actual: 284, budget: 310, status: 'good' }
                    ].map((item, idx) => (
                        <div key={idx} className="space-y-2">
                            <div className="text-xs font-medium text-slate-400 text-center">{item.month}</div>
                            <div className="relative h-32 bg-slate-900/50 rounded-lg overflow-hidden">
                                <div className="absolute bottom-0 w-full bg-gradient-to-t from-slate-700/50 to-slate-600/50"
                                     style={{ height: `${(item.budget / 310) * 100}%` }}>
                                    <div className="absolute top-0 right-0 left-0 h-0.5 bg-slate-500"></div>
                                </div>
                                <div className={`absolute bottom-0 w-full ${
                                    item.status === 'good' ? 'bg-gradient-to-t from-emerald-500/70 to-emerald-400/70' :
                                    item.status === 'warn' ? 'bg-gradient-to-t from-amber-500/70 to-amber-400/70' :
                                    'bg-gradient-to-t from-red-500/70 to-red-400/70'
                                }`} style={{ height: `${(item.actual / 310) * 100}%` }}></div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs font-semibold text-white">${item.actual}K</div>
                                <div className="text-xs text-slate-500">of ${item.budget}K</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/**
 * Cost-Benefit Analysis Tab
 * ROI calculations, investment analysis, and decision support
 */
function CostBenefitAnalysisContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-8 space-y-8 bg-gradient-to-b from-slate-900/50 via-transparent to-transparent">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Cost-Benefit Analysis & ROI</h2>
                    <p className="text-slate-400">Investment evaluation, return on investment tracking, and capital project analysis</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 rounded-lg border border-slate-700/50 transition-all text-sm font-medium">
                        New Analysis
                    </button>
                    <button className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-emerald-500/20">
                        ROI Report
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Active Projects"
                    value="8"
                    variant="primary"
                    icon={<ChartLine className="w-6 h-6" />}
                    onClick={() => push({
                        type: 'active-projects',
                        data: { title: 'Active Investment Projects' },
                        id: 'active-projects'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Avg ROI"
                    value="18.6%"
                    variant="success"
                    icon={<TrendUp className="w-6 h-6" />}
                    trend={{ value: "+3.2%", direction: "up" }}
                    onClick={() => push({
                        type: 'roi-analysis',
                        data: { title: 'ROI Analysis by Project' },
                        id: 'roi-analysis'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Avg Payback Period"
                    value="2.1 yrs"
                    variant="default"
                    icon={<Clock className="w-6 h-6" />}
                    onClick={() => push({
                        type: 'payback-analysis',
                        data: { title: 'Payback Period Analysis' },
                        id: 'payback-period'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Total NPV"
                    value="$1.24M"
                    variant="success"
                    onClick={() => push({
                        type: 'npv-analysis',
                        data: { title: 'Net Present Value Analysis' },
                        id: 'npv-analysis'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            {/* Project ROI Analysis Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* EV Fleet Transition */}
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 cursor-pointer hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
                    onClick={() => push({ type: 'ev-transition', data: { title: 'EV Transition ROI Analysis' }, id: 'ev-roi' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">EV Fleet Transition</h3>
                            <p className="text-xs text-slate-400">Capital Project 2026-001</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">High ROI</span>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <span className="text-sm text-slate-400 block mb-1">Total Investment</span>
                            <span className="text-2xl font-bold text-white">$2.40M</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <span className="text-xs text-emerald-400 block mb-1">Annual Savings</span>
                                <span className="text-lg font-bold text-emerald-400">$420K</span>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <span className="text-xs text-blue-400 block mb-1">ROI</span>
                                <span className="text-lg font-bold text-blue-400">22.3%</span>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-slate-700/50">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Payback Period</span>
                                <span className="text-sm font-semibold text-white">5.7 years</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-sm text-slate-400">NPV @ 7%</span>
                                <span className="text-sm font-semibold text-emerald-400">+$890K</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Telematics System */}
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 cursor-pointer hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                    onClick={() => push({ type: 'telematics', data: { title: 'Telematics Implementation ROI' }, id: 'telematics-roi' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">Telematics System</h3>
                            <p className="text-xs text-slate-400">Capital Project 2026-005</p>
                        </div>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium flex items-center gap-1">
                            <Sparkle className="w-3 h-3" />
                            Excellent
                        </span>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <span className="text-sm text-slate-400 block mb-1">Total Investment</span>
                            <span className="text-2xl font-bold text-white">$180K</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <span className="text-xs text-emerald-400 block mb-1">Annual Savings</span>
                                <span className="text-lg font-bold text-emerald-400">$94K</span>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <span className="text-xs text-blue-400 block mb-1">ROI</span>
                                <span className="text-lg font-bold text-blue-400">52.2%</span>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-slate-700/50">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Payback Period</span>
                                <span className="text-sm font-semibold text-white">1.9 years</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-sm text-slate-400">NPV @ 7%</span>
                                <span className="text-sm font-semibold text-emerald-400">+$245K</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preventive Maintenance Program */}
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 cursor-pointer hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
                    onClick={() => push({ type: 'preventive-maintenance', data: { title: 'Preventive Maintenance Program ROI' }, id: 'pm-roi' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">Preventive Maintenance</h3>
                            <p className="text-xs text-slate-400">Operations Initiative</p>
                        </div>
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">Strong</span>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <span className="text-sm text-slate-400 block mb-1">Total Investment</span>
                            <span className="text-2xl font-bold text-white">$320K</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <span className="text-xs text-emerald-400 block mb-1">Annual Savings</span>
                                <span className="text-lg font-bold text-emerald-400">$156K</span>
                            </div>
                            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <span className="text-xs text-purple-400 block mb-1">ROI</span>
                                <span className="text-lg font-bold text-purple-400">48.8%</span>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-slate-700/50">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Payback Period</span>
                                <span className="text-sm font-semibold text-white">2.1 years</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-sm text-slate-400">NPV @ 7%</span>
                                <span className="text-sm font-semibold text-emerald-400">+$412K</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Investment Portfolio Summary</h3>
                        <ChartBar className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-300">Total Invested Capital</span>
                                <span className="text-lg font-bold text-white">$3.72M</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-2">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-300">Projected Annual Return</span>
                                <span className="text-lg font-bold text-emerald-400">$692K</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-2">
                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-700/50">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white mb-1">18.6%</div>
                                    <div className="text-xs text-slate-400">Avg ROI</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white mb-1">3.2</div>
                                    <div className="text-xs text-slate-400">Avg Payback (yrs)</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-emerald-400 mb-1">$1.55M</div>
                                    <div className="text-xs text-slate-400">Total NPV</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Recent Project Approvals</h3>
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">3 this month</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start justify-between p-4 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-lg border-l-2 border-emerald-500">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" weight="fill" />
                                    <span className="text-sm font-medium text-white">Fleet Modernization</span>
                                </div>
                                <div className="text-xs text-slate-400 mb-2">Approved Dec 15, 2025</div>
                                <div className="flex gap-3 text-xs">
                                    <span className="text-slate-400">Investment: <span className="text-white font-medium">$2.5M</span></span>
                                    <span className="text-slate-400">ROI: <span className="text-emerald-400 font-medium">21.4%</span></span>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-600" />
                        </div>

                        <div className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg border-l-2 border-blue-500">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="w-4 h-4 text-blue-400" weight="fill" />
                                    <span className="text-sm font-medium text-white">Charging Infrastructure</span>
                                </div>
                                <div className="text-xs text-slate-400 mb-2">Approved Dec 8, 2025</div>
                                <div className="flex gap-3 text-xs">
                                    <span className="text-slate-400">Investment: <span className="text-white font-medium">$850K</span></span>
                                    <span className="text-slate-400">ROI: <span className="text-emerald-400 font-medium">19.2%</span></span>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-600" />
                        </div>

                        <div className="flex items-start justify-between p-4 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg border-l-2 border-purple-500">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-purple-400" weight="fill" />
                                    <span className="text-sm font-medium text-white">Fuel System Upgrade</span>
                                </div>
                                <div className="text-xs text-slate-400 mb-2">Under Review</div>
                                <div className="flex gap-3 text-xs">
                                    <span className="text-slate-400">Investment: <span className="text-white font-medium">$450K</span></span>
                                    <span className="text-slate-400">Est. ROI: <span className="text-purple-400 font-medium">16.8%</span></span>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-600" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Invoice Processing Tab
 * AP automation, approval workflows, and vendor payments
 */
function InvoiceProcessingContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-8 space-y-8 bg-gradient-to-b from-slate-900/50 via-transparent to-transparent">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Invoice Processing & Approval</h2>
                    <p className="text-slate-400">Accounts payable automation, approval workflows, and vendor payment management</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 rounded-lg border border-slate-700/50 transition-all text-sm font-medium">
                        Upload Invoice
                    </button>
                    <button className="px-4 py-2 bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-blue-500/20">
                        Process Batch
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Pending Approval"
                    value="42"
                    variant="warning"
                    icon={<Invoice className="w-6 h-6" />}
                    onClick={() => push({
                        type: 'pending-invoices',
                        data: { title: 'Invoices Awaiting Approval' },
                        id: 'pending-approval'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Approved Today"
                    value="18"
                    variant="success"
                    icon={<CheckCircle className="w-6 h-6" />}
                    onClick={() => push({
                        type: 'approved-invoices',
                        data: { title: 'Recently Approved Invoices' },
                        id: 'approved-today'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Total Value"
                    value="$156.8K"
                    variant="primary"
                    icon={<FileText className="w-6 h-6" />}
                    onClick={() => push({
                        type: 'invoice-value',
                        data: { title: 'Invoice Value Analysis' },
                        id: 'invoice-value'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Avg Processing Time"
                    value="2.3 days"
                    variant="success"
                    icon={<Clock className="w-6 h-6" />}
                    trend={{ value: "-0.4 days", direction: "down" }}
                    onClick={() => push({
                        type: 'processing-time',
                        data: { title: 'Invoice Processing Metrics' },
                        id: 'processing-metrics'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            {/* Approval Workflow and Automation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 cursor-pointer hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                    onClick={() => push({ type: 'approval-workflow', data: { title: 'Approval Workflow Status' }, id: 'workflow-status' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Approval Workflow Pipeline</h3>
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">42 in queue</span>
                    </div>
                    <div className="space-y-5">
                        {/* Manager Review Stage */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                                    <span className="text-sm font-medium text-white">Manager Review</span>
                                </div>
                                <span className="text-sm font-bold text-amber-400">24</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-2">
                                <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full" style={{ width: '57%' }}></div>
                            </div>
                            <div className="text-xs text-slate-500">Avg. 1.2 days in stage</div>
                        </div>

                        {/* Finance Review Stage */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    <span className="text-sm font-medium text-white">Finance Review</span>
                                </div>
                                <span className="text-sm font-bold text-blue-400">12</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-2">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full" style={{ width: '29%' }}></div>
                            </div>
                            <div className="text-xs text-slate-500">Avg. 0.8 days in stage</div>
                        </div>

                        {/* Final Approval Stage */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                    <span className="text-sm font-medium text-white">Final Approval</span>
                                </div>
                                <span className="text-sm font-bold text-purple-400">6</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-2">
                                <div className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full" style={{ width: '14%' }}></div>
                            </div>
                            <div className="text-xs text-slate-500">Avg. 0.3 days in stage</div>
                        </div>

                        {/* Ready to Pay */}
                        <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20 mt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" weight="fill" />
                                    <span className="text-sm font-medium text-emerald-400">Ready to Pay</span>
                                </div>
                                <span className="text-lg font-bold text-emerald-400">18</span>
                            </div>
                            <div className="text-xs text-emerald-400/70 mt-1">Awaiting payment processing</div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 cursor-pointer hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                    onClick={() => push({ type: 'invoice-automation', data: { title: 'Automation Performance' }, id: 'automation-metrics' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">AI Automation Performance</h3>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium flex items-center gap-1">
                            <Sparkle className="w-3 h-3" />
                            AI-Powered
                        </span>
                    </div>
                    <div className="flex items-center justify-center mb-6">
                        <ProgressRing progress={78} color="blue" label="78%" sublabel="automated" />
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">OCR Accuracy</span>
                                <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">Excellent</span>
                            </div>
                            <div className="text-2xl font-bold text-emerald-400 mb-1">96.4%</div>
                            <div className="w-full bg-slate-900/50 rounded-full h-1.5 mt-2">
                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-1.5 rounded-full" style={{ width: '96.4%' }}></div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">Auto-Matched Invoices</span>
                                <span className="text-xs text-slate-500">This month</span>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">234 <span className="text-lg text-slate-400">/ 300</span></div>
                            <div className="w-full bg-slate-900/50 rounded-full h-1.5 mt-2">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-1.5 rounded-full" style={{ width: '78%' }}></div>
                            </div>
                        </div>
                        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-blue-400">Time Saved This Month</span>
                                <span className="text-lg font-bold text-blue-400">42.6 hrs</span>
                            </div>
                            <div className="text-xs text-blue-400/70 mt-1">$1,278 labor cost savings</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Invoice Activity */}
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Recent Invoice Activity</h3>
                        <p className="text-sm text-slate-400">Latest invoice processing updates and status changes</p>
                    </div>
                    <select className="px-3 py-2 bg-slate-900/50 text-slate-300 rounded-lg border border-slate-700/50 text-sm">
                        <option>All Invoices</option>
                        <option>Approved</option>
                        <option>Pending</option>
                        <option>Rejected</option>
                    </select>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-900/30 hover:bg-slate-900/50 rounded-lg border border-slate-700/30 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                            <CheckCircle className="w-5 h-5 text-emerald-400" weight="fill" />
                            <div>
                                <div className="text-sm font-medium text-white">INV-2026-0089</div>
                                <div className="text-xs text-slate-400">Parts Depot • Service parts</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-sm font-semibold text-white">$2,845.67</div>
                                <div className="text-xs text-slate-400">Approved 5 min ago</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-600" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-900/30 hover:bg-slate-900/50 rounded-lg border border-slate-700/30 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                            <Clock className="w-5 h-5 text-amber-400" weight="fill" />
                            <div>
                                <div className="text-sm font-medium text-white">INV-2026-0088</div>
                                <div className="text-xs text-slate-400">Fuel Master LLC • Diesel fuel</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-sm font-semibold text-white">$12,456.00</div>
                                <div className="text-xs text-amber-400">Pending manager review</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-600" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-900/30 hover:bg-slate-900/50 rounded-lg border border-slate-700/30 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                            <CheckCircle className="w-5 h-5 text-emerald-400" weight="fill" />
                            <div>
                                <div className="text-sm font-medium text-white">INV-2026-0087</div>
                                <div className="text-xs text-slate-400">Acme Transmission • Sublet repair</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-sm font-semibold text-white">$4,320.15</div>
                                <div className="text-xs text-slate-400">Approved 1 hour ago</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-600" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-900/30 hover:bg-slate-900/50 rounded-lg border border-slate-700/30 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                            <XCircle className="w-5 h-5 text-red-400" weight="fill" />
                            <div>
                                <div className="text-sm font-medium text-white">INV-2026-0086</div>
                                <div className="text-xs text-slate-400">Unknown Vendor • Missing PO</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-sm font-semibold text-white">$892.00</div>
                                <div className="text-xs text-red-400">Rejected - No PO match</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-600" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-900/30 hover:bg-slate-900/50 rounded-lg border border-slate-700/30 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                            <Clock className="w-5 h-5 text-blue-400" weight="fill" />
                            <div>
                                <div className="text-sm font-medium text-white">INV-2026-0085</div>
                                <div className="text-xs text-slate-400">Service Pro • Preventive maintenance</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-sm font-semibold text-white">$6,720.00</div>
                                <div className="text-xs text-blue-400">In finance review</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-600" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Payment Tracking Tab
 * Payment status, vendor payments, and reconciliation
 */
function PaymentTrackingContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-8 space-y-8 bg-gradient-to-b from-slate-900/50 via-transparent to-transparent">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Payment Tracking & Reconciliation</h2>
                    <p className="text-slate-400">Payment scheduling, vendor disbursements, and financial reconciliation</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 rounded-lg border border-slate-700/50 transition-all text-sm font-medium">
                        Schedule Payment
                    </button>
                    <button className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-emerald-500/20">
                        Reconcile
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Scheduled Payments"
                    value="$245.6K"
                    variant="primary"
                    icon={<CreditCard className="w-6 h-6" />}
                    onClick={() => push({
                        type: 'scheduled-payments',
                        data: { title: 'Upcoming Payment Schedule' },
                        id: 'payment-schedule'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Paid This Month"
                    value="$312.4K"
                    variant="success"
                    icon={<CheckCircle className="w-6 h-6" />}
                    onClick={() => push({
                        type: 'paid-this-month',
                        data: { title: 'Monthly Payment History' },
                        id: 'monthly-payments'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Pending Payments"
                    value="68"
                    variant="warning"
                    icon={<Bank className="w-6 h-6" />}
                    onClick={() => push({
                        type: 'pending-payments',
                        data: { title: 'Payments Awaiting Processing' },
                        id: 'pending-payments'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Failed Payments"
                    value="3"
                    variant="danger"
                    icon={<XCircle className="w-6 h-6" />}
                    onClick={() => push({
                        type: 'failed-payments',
                        data: { title: 'Failed Payment Transactions' },
                        id: 'failed-payments'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            {/* Payment Methods and Top Vendors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 cursor-pointer hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                    onClick={() => push({ type: 'payment-methods', data: { title: 'Payment Method Breakdown' }, id: 'payment-methods' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Payment Methods</h3>
                        <CreditCard className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-sm font-medium text-white">ACH Transfer</span>
                                    <div className="text-xs text-slate-400 mt-1">61% of payments</div>
                                </div>
                                <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">↑ 8%</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-2.5">
                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2.5 rounded-full" style={{ width: '61%' }}></div>
                            </div>
                            <div className="text-sm font-bold text-white">$189.2K</div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-sm font-medium text-white">Check</span>
                                    <div className="text-xs text-slate-400 mt-1">25% of payments</div>
                                </div>
                                <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">↓ 5%</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-2.5">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-2.5 rounded-full" style={{ width: '25%' }}></div>
                            </div>
                            <div className="text-sm font-bold text-white">$78.4K</div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-sm font-medium text-white">Wire Transfer</span>
                                    <div className="text-xs text-slate-400 mt-1">14% of payments</div>
                                </div>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-2.5">
                                <div className="bg-gradient-to-r from-purple-500 to-purple-400 h-2.5 rounded-full" style={{ width: '14%' }}></div>
                            </div>
                            <div className="text-sm font-bold text-white">$44.8K</div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 cursor-pointer hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                    onClick={() => push({ type: 'vendor-payments', data: { title: 'Top Vendor Payments' }, id: 'top-vendors' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Top Vendors This Month</h3>
                        <Users className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg border-l-2 border-amber-500">
                            <div>
                                <div className="text-sm font-medium text-white mb-1">Fuel Master LLC</div>
                                <div className="text-xs text-slate-400">18 payments • Fuel supply</div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-amber-400">$124.2K</div>
                                <div className="text-xs text-slate-500">40% of total</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg border-l-2 border-blue-500">
                            <div>
                                <div className="text-sm font-medium text-white mb-1">Parts Depot</div>
                                <div className="text-xs text-slate-400">24 payments • Parts & supplies</div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-blue-400">$67.8K</div>
                                <div className="text-xs text-slate-500">22% of total</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg border-l-2 border-purple-500">
                            <div>
                                <div className="text-sm font-medium text-white mb-1">Service Pro</div>
                                <div className="text-xs text-slate-400">12 payments • Sublet repairs</div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-purple-400">$45.3K</div>
                                <div className="text-xs text-slate-500">15% of total</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 cursor-pointer hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                    onClick={() => push({ type: 'reconciliation', data: { title: 'Payment Reconciliation Status' }, id: 'reconciliation' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Reconciliation Status</h3>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">On Track</span>
                    </div>
                    <div className="flex items-center justify-center mb-6">
                        <ProgressRing progress={96} color="green" label="96%" sublabel="reconciled" />
                    </div>
                    <div className="space-y-3">
                        <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-emerald-400">Reconciled</span>
                                <CheckCircle className="w-4 h-4 text-emerald-400" weight="fill" />
                            </div>
                            <div className="text-2xl font-bold text-emerald-400">$299.6K</div>
                        </div>
                        <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-amber-400">Pending Review</span>
                                <Clock className="w-4 h-4 text-amber-400" weight="fill" />
                            </div>
                            <div className="text-2xl font-bold text-amber-400">$12.8K</div>
                            <div className="text-xs text-amber-400/70 mt-1">4% unreconciled</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Schedule */}
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Upcoming Payment Schedule</h3>
                        <p className="text-sm text-slate-400">Next 7 days payment schedule by due date</p>
                    </div>
                    <select className="px-3 py-2 bg-slate-900/50 text-slate-300 rounded-lg border border-slate-700/50 text-sm">
                        <option>Next 7 Days</option>
                        <option>Next 14 Days</option>
                        <option>Next 30 Days</option>
                        <option>All Upcoming</option>
                    </select>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-500/10 to-transparent rounded-lg border-l-2 border-red-500">
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <div className="text-xs text-slate-400">JAN</div>
                                <div className="text-2xl font-bold text-white">06</div>
                                <div className="text-xs text-red-400">Tomorrow</div>
                            </div>
                            <div className="h-12 w-px bg-slate-700"></div>
                            <div>
                                <div className="text-sm font-medium text-white mb-1">3 payments due</div>
                                <div className="text-xs text-slate-400">Fuel Master LLC, Parts Depot, Service Pro</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-lg font-bold text-white">$42,567.89</div>
                                <div className="text-xs text-red-400">Due tomorrow</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-600" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg border-l-2 border-amber-500">
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <div className="text-xs text-slate-400">JAN</div>
                                <div className="text-2xl font-bold text-white">08</div>
                                <div className="text-xs text-amber-400">3 days</div>
                            </div>
                            <div className="h-12 w-px bg-slate-700"></div>
                            <div>
                                <div className="text-sm font-medium text-white mb-1">5 payments due</div>
                                <div className="text-xs text-slate-400">Multiple vendors</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-lg font-bold text-white">$68,234.12</div>
                                <div className="text-xs text-amber-400">Due in 3 days</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-600" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg border-l-2 border-blue-500">
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <div className="text-xs text-slate-400">JAN</div>
                                <div className="text-2xl font-bold text-white">10</div>
                                <div className="text-xs text-blue-400">5 days</div>
                            </div>
                            <div className="h-12 w-px bg-slate-700"></div>
                            <div>
                                <div className="text-sm font-medium text-white mb-1">7 payments due</div>
                                <div className="text-xs text-slate-400">Weekly vendor payments</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-lg font-bold text-white">$89,456.00</div>
                                <div className="text-xs text-blue-400">Due in 5 days</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-600" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-500/10 to-transparent rounded-lg border-l-2 border-slate-500">
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <div className="text-xs text-slate-400">JAN</div>
                                <div className="text-2xl font-bold text-white">12</div>
                                <div className="text-xs text-slate-400">7 days</div>
                            </div>
                            <div className="h-12 w-px bg-slate-700"></div>
                            <div>
                                <div className="text-sm font-medium text-white mb-1">4 payments due</div>
                                <div className="text-xs text-slate-400">Monthly recurring payments</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-lg font-bold text-white">$45,908.78</div>
                                <div className="text-xs text-slate-400">Due in 7 days</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-600" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function FinancialHub() {
    return (
        <HubPage
            title="Financial Management"
            description="Comprehensive financial operations, cost control, and budgeting"
            icon={<CurrencyDollar className="w-8 h-8" />}
        >
            <HubTab value="cost-analysis" label="Cost Analysis" icon={<Calculator className="w-5 h-5" />}>
                <CostAnalysisContent />
            </HubTab>

            <HubTab value="billing" label="Billing Reports" icon={<ChartBar className="w-5 h-5" />}>
                <BillingReportsContent />
            </HubTab>

            <HubTab value="budget" label="Budget Tracking" icon={<Wallet className="w-5 h-5" />}>
                <BudgetTrackingContent />
            </HubTab>

            <HubTab value="cost-benefit" label="Cost-Benefit" icon={<TrendUp className="w-5 h-5" />}>
                <CostBenefitAnalysisContent />
            </HubTab>

            <HubTab value="invoices" label="Invoice Processing" icon={<Invoice className="w-5 h-5" />}>
                <InvoiceProcessingContent />
            </HubTab>

            <HubTab value="payments" label="Payment Tracking" icon={<CreditCard className="w-5 h-5" />}>
                <PaymentTrackingContent />
            </HubTab>
        </HubPage>
    )
}
