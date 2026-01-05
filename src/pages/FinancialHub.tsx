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
    Bank
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, QuickStat } from '@/components/ui/stat-card'
import { useDrilldown, DrilldownLevel } from '@/contexts/DrilldownContext'

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
 * Budget allocation, forecasting, and departmental spending
 */
function BudgetTrackingContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-8 space-y-8 bg-gradient-to-b from-slate-900/50 via-transparent to-transparent">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Budget Tracking & Forecasting</h2>
                    <p className="text-slate-400">Real-time budget monitoring, variance analysis, and predictive forecasting</p>
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
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Cost-Benefit Analysis</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    onClick={() => push({
                        type: 'roi-analysis',
                        data: { title: 'ROI Analysis by Project' },
                        id: 'roi-analysis'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Payback Period"
                    value="2.1 yrs"
                    variant="default"
                    onClick={() => push({
                        type: 'payback-analysis',
                        data: { title: 'Payback Period Analysis' },
                        id: 'payback-period'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="NPV Total"
                    value="$1.24M"
                    variant="success"
                    onClick={() => push({
                        type: 'npv-analysis',
                        data: { title: 'Net Present Value Analysis' },
                        id: 'npv-analysis'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'ev-transition', data: { title: 'EV Transition ROI' }, id: 'ev-roi' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">EV Fleet Transition</h3>
                    <QuickStat label="Investment" value="$2.4M" />
                    <QuickStat label="Annual Savings" value="$420K" trend="up" />
                    <QuickStat label="ROI" value="22.3%" trend="up" />
                    <QuickStat label="Payback" value="5.7 years" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'telematics', data: { title: 'Telematics Implementation ROI' }, id: 'telematics-roi' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Telematics System</h3>
                    <QuickStat label="Investment" value="$180K" />
                    <QuickStat label="Annual Savings" value="$94K" trend="up" />
                    <QuickStat label="ROI" value="52.2%" trend="up" />
                    <QuickStat label="Payback" value="1.9 years" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'preventive-maintenance', data: { title: 'Preventive Maintenance Program ROI' }, id: 'pm-roi' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Preventive Maintenance</h3>
                    <QuickStat label="Investment" value="$320K" />
                    <QuickStat label="Annual Savings" value="$156K" trend="up" />
                    <QuickStat label="ROI" value="48.8%" trend="up" />
                    <QuickStat label="Payback" value="2.1 years" />
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
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Invoice Processing & Approval</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    trend={{ value: "-0.4 days", direction: "down" }}
                    onClick={() => push({
                        type: 'processing-time',
                        data: { title: 'Invoice Processing Metrics' },
                        id: 'processing-metrics'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'approval-workflow', data: { title: 'Approval Workflow Status' }, id: 'workflow-status' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Approval Workflow</h3>
                    <QuickStat label="Manager Review" value="24 invoices" />
                    <QuickStat label="Finance Review" value="12 invoices" />
                    <QuickStat label="Final Approval" value="6 invoices" />
                    <QuickStat label="Ready to Pay" value="18 invoices" trend="up" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'invoice-automation', data: { title: 'Automation Metrics' }, id: 'automation-metrics' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Automation Rate</h3>
                    <ProgressRing progress={78} color="blue" label="78%" sublabel="automated processing" />
                    <div className="mt-4 text-sm text-slate-300">
                        <div className="flex justify-between">
                            <span>OCR Accuracy:</span>
                            <span className="font-semibold text-emerald-400">96.4%</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Auto-Matched:</span>
                            <span className="font-semibold text-emerald-400">234/300</span>
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
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Payment Tracking & Reconciliation</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    onClick={() => push({
                        type: 'failed-payments',
                        data: { title: 'Failed Payment Transactions' },
                        id: 'failed-payments'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'payment-methods', data: { title: 'Payment Method Breakdown' }, id: 'payment-methods' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Payment Methods</h3>
                    <QuickStat label="ACH" value="$189.2K (61%)" trend="up" />
                    <QuickStat label="Check" value="$78.4K (25%)" trend="down" />
                    <QuickStat label="Wire Transfer" value="$44.8K (14%)" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'vendor-payments', data: { title: 'Top Vendor Payments' }, id: 'top-vendors' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Top Vendors</h3>
                    <QuickStat label="Fuel Master LLC" value="$124.2K" />
                    <QuickStat label="Parts Depot" value="$67.8K" />
                    <QuickStat label="Service Pro" value="$45.3K" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'reconciliation', data: { title: 'Payment Reconciliation Status' }, id: 'reconciliation' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Reconciliation</h3>
                    <ProgressRing progress={96} color="green" label="96%" sublabel="reconciled" />
                    <div className="mt-4 text-sm text-slate-300">
                        <div className="flex justify-between">
                            <span>Unreconciled:</span>
                            <span className="font-semibold text-amber-400">$12.8K</span>
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
