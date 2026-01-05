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
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Cost Analysis & Control</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'cost-variance', data: { title: 'Budget vs Actual Variance' }, id: 'variance-analysis' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Budget Variance</h3>
                    <ProgressRing progress={92} color="green" label="92%" sublabel="of budget utilized" />
                    <div className="mt-4 text-sm text-slate-300">
                        <div className="flex justify-between">
                            <span>Budget:</span>
                            <span className="font-semibold">$310K</span>
                        </div>
                        <div className="flex justify-between text-emerald-400">
                            <span>Remaining:</span>
                            <span className="font-semibold">$25.5K</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'cost-categories', data: { title: 'Cost Category Breakdown' }, id: 'category-breakdown' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Cost Categories</h3>
                    <QuickStat label="Fuel" value="43.6%" trend="up" />
                    <QuickStat label="Maintenance" value="31.4%" trend="down" />
                    <QuickStat label="Insurance" value="15.2%" />
                    <QuickStat label="Other" value="9.8%" />
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
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Billing & Revenue Reports</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'billing-cycle', data: { title: 'Billing Cycle Performance' }, id: 'billing-cycle' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Collection Rate</h3>
                    <ProgressRing progress={87} color="blue" label="87%" sublabel="collected on time" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'revenue-trend', data: { title: 'Revenue Trends' }, id: 'revenue-trend' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Revenue Trend</h3>
                    <QuickStat label="This Quarter" value="$1.32M" trend="up" />
                    <QuickStat label="Last Quarter" value="$1.18M" />
                    <QuickStat label="YoY Growth" value="+15.8%" trend="up" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'top-customers', data: { title: 'Top Revenue Customers' }, id: 'top-customers' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Top Customers</h3>
                    <QuickStat label="Customer A" value="$89.2K" />
                    <QuickStat label="Customer B" value="$67.4K" />
                    <QuickStat label="Customer C" value="$54.1K" />
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
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Budget Tracking & Forecasting</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'budget-utilization', data: { title: 'Budget Utilization by Department' }, id: 'dept-budget' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Department Budgets</h3>
                    <QuickStat label="Operations" value="$1.2M / $1.5M" trend="neutral" />
                    <QuickStat label="Maintenance" value="$890K / $1.0M" trend="down" />
                    <QuickStat label="Fleet Services" value="$720K / $800K" trend="up" />
                    <QuickStat label="Administration" value="$240K / $420K" trend="down" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'budget-forecast', data: { title: 'Budget Forecast Analysis' }, id: 'budget-forecast' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Forecast Accuracy</h3>
                    <ProgressRing progress={94} color="green" label="94%" sublabel="forecast accuracy" />
                    <div className="mt-4 text-sm text-slate-300">
                        <div className="flex justify-between">
                            <span>Q2 Projected:</span>
                            <span className="font-semibold">$932K</span>
                        </div>
                        <div className="flex justify-between text-amber-400">
                            <span>Variance:</span>
                            <span className="font-semibold">+$22K</span>
                        </div>
                    </div>
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
