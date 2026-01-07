/**
 * ProcurementHub - Premium Procurement Management Hub
 * Route: /procurement
 */

import {
    Package as ProcurementIcon,
    Storefront,
    Cube,
    ShoppingCart,
    FileText,
    Scan,
    GasPump,
    CurrencyDollar,
    Warning,
    CheckCircle,
    XCircle,
    Sparkle,
    ChartBar,
    Package,
    Wrench,
    BatteryFull,
    Engine
} from '@phosphor-icons/react'

import { HubPage, HubTab, HubTabItem } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, QuickStat } from '@/components/ui/stat-card'
import { useDrilldown, DrilldownLevel } from '@/contexts/DrilldownContext'

function VendorsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-8 space-y-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Vendor Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Active Vendors" value="34" variant="primary" icon={<Storefront className="w-6 h-6" />} onClick={() => push({ type: 'active-vendors', data: { title: 'Active Vendors' }, id: 'active-vendors' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Pending Orders" value="8" variant="warning" onClick={() => push({ type: 'vendors', data: { title: 'Pending Orders' }, id: 'pending-orders' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="This Month" value="$45.2K" variant="success" icon={<CurrencyDollar className="w-6 h-6" />} onClick={() => push({ type: 'vendors', data: { title: 'Monthly Spend' }, id: 'monthly-spend' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Overdue Invoices" value="$2.1K" variant="danger" onClick={() => push({ type: 'vendors', data: { title: 'Overdue Invoices' }, id: 'overdue-invoices' } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => push({ type: 'vendors', data: { title: 'Budget' }, id: 'budget' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-4">Budget Used</h3>
                    <ProgressRing progress={72} color="blue" label="$72K" sublabel="of $100K monthly" />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => push({ type: 'vendors', data: { title: 'Vendor Metrics' }, id: 'vendor-metrics' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-4">Metrics</h3>
                    <QuickStat label="Avg Lead Time" value="3.2 days" trend="down" />
                    <QuickStat label="On-Time Delivery" value="94%" trend="up" />
                    <QuickStat label="Quality Rating" value="4.6/5" />
                </div>
            </div>
        </div>
    )
}

function PartsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-8 space-y-8">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Parts Inventory Management</h2>
                    <p className="text-base text-slate-700 dark:text-slate-300">Real-time inventory tracking, stock analytics, and automated reordering</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 transition-all text-sm font-medium">
                        Add Part
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm font-medium">
                        Generate Report
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
                <StatCard
                    title="Total SKUs"
                    value="1,245"
                    variant="primary"
                    icon={<Cube className="w-6 h-6" />}
                    onClick={() => push({ type: 'total-skus', data: { title: 'All Parts Catalog' }, id: 'total-skus' } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="In Stock"
                    value="1,180"
                    variant="success"
                    icon={<CheckCircle className="w-6 h-6" />}
                    trend="up"
                    trendValue="94.8%"
                    onClick={() => push({ type: 'parts-inventory', data: { title: 'In Stock Items' }, id: 'in-stock' } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Low Stock"
                    value="42"
                    variant="warning"
                    icon={<Warning className="w-6 h-6" />}
                    onClick={() => push({ type: 'low-stock', data: { title: 'Low Stock Items' }, id: 'low-stock' } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Out of Stock"
                    value="23"
                    variant="danger"
                    icon={<XCircle className="w-6 h-6" />}
                    onClick={() => push({ type: 'out-of-stock', data: { title: 'Out of Stock' }, id: 'out-of-stock' } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Inventory Value"
                    value="$342.8K"
                    variant="default"
                    icon={<CurrencyDollar className="w-6 h-6" />}
                    onClick={() => push({ type: 'inventory-value', data: { title: 'Total Inventory Value' }, id: 'inventory-value' } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            {/* Stock Status and Turnover */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => push({ type: 'stock-health', data: { title: 'Stock Health Analysis' }, id: 'stock-health' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Stock Health Overview</h3>
                        <ChartBar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="space-y-5">
                        {/* Healthy Stock */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Healthy Stock</span>
                                </div>
                                <span className="text-sm font-bold text-emerald-600">1,065 SKUs</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                <div className="bg-emerald-600 h-3 rounded-full" style={{ width: '85.5%' }}></div>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Above reorder point • 85.5% of inventory</div>
                        </div>

                        {/* Adequate Stock */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Adequate Stock</span>
                                </div>
                                <span className="text-sm font-bold text-blue-600">115 SKUs</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                <div className="bg-blue-600 h-3 rounded-full" style={{ width: '9.2%' }}></div>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Near reorder point • 9.2% of inventory</div>
                        </div>

                        {/* Low Stock */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Low Stock</span>
                                </div>
                                <span className="text-sm font-bold text-amber-600">42 SKUs</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                <div className="bg-amber-600 h-3 rounded-full" style={{ width: '3.4%' }}></div>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Below reorder point • 3.4% of inventory</div>
                        </div>

                        {/* Out of Stock */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Out of Stock</span>
                                </div>
                                <span className="text-sm font-bold text-red-600">23 SKUs</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                <div className="bg-red-600 h-3 rounded-full" style={{ width: '1.9%' }}></div>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Zero quantity • 1.9% of inventory</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => push({ type: 'turnover-metrics', data: { title: 'Inventory Turnover Metrics' }, id: 'turnover-metrics' } as Omit<DrilldownLevel, "timestamp">)}>
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Inventory Turnover Analysis</h3>
                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-medium flex items-center gap-1">
                            <Sparkle className="w-3 h-3" />
                            AI Insights
                        </span>
                    </div>
                    <div className="flex items-center justify-center mb-6">
                        <ProgressRing progress={84} color="green" label="8.4x" sublabel="annual turnover" />
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Fast-Moving Parts</span>
                                <span className="text-xs px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full">Optimal</span>
                            </div>
                            <div className="text-2xl font-bold text-emerald-600 mb-1">342 SKUs</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Turnover &gt; 12x/year • 27.5% of catalog</div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Slow-Moving Parts</span>
                                <span className="text-xs px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full">Monitor</span>
                            </div>
                            <div className="text-2xl font-bold text-amber-600 mb-1">156 SKUs</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Turnover &lt; 2x/year • 12.5% of catalog</div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Avg Days to Turnover</span>
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">43 days</span>
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Industry avg: 52 days • 17% better</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Parts by Category</h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300">Inventory distribution across major part categories</p>
                    </div>
                    <select className="px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
                        <option>All Categories</option>
                        <option>Engine Parts</option>
                        <option>Electrical</option>
                        <option>Brakes & Suspension</option>
                        <option>Fluids & Filters</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Engine Parts */}
                    <div className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 cursor-pointer transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <Engine className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="text-xs px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full">98% in stock</span>
                        </div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Engine Parts</h4>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">324</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-4">SKUs • $89.4K value</div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '26%' }}></div>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">26% of total inventory</div>
                    </div>

                    {/* Electrical */}
                    <div className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 cursor-pointer transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                <BatteryFull className="w-6 h-6 text-amber-600" />
                            </div>
                            <span className="text-xs px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full">96% in stock</span>
                        </div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Electrical</h4>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">268</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-4">SKUs • $72.1K value</div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div className="bg-amber-600 h-2 rounded-full" style={{ width: '21.5%' }}></div>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">21.5% of total inventory</div>
                    </div>

                    {/* Brakes & Suspension */}
                    <div className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 cursor-pointer transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <Wrench className="w-6 h-6 text-purple-600" />
                            </div>
                            <span className="text-xs px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full">92% in stock</span>
                        </div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Brakes & Suspension</h4>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">412</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-4">SKUs • $124.6K value</div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '33.1%' }}></div>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">33.1% of total inventory</div>
                    </div>

                    {/* Fluids & Filters */}
                    <div className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 cursor-pointer transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                <Package className="w-6 h-6 text-emerald-600" />
                            </div>
                            <span className="text-xs px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full">94% in stock</span>
                        </div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Fluids & Filters</h4>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">241</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-4">SKUs • $56.7K value</div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '19.4%' }}></div>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">19.4% of total inventory</div>
                    </div>
                </div>
            </div>

            {/* Critical Stock Alerts */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Critical Stock Alerts</h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300">Immediate attention required • Auto-reorder enabled</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full">23 urgent alerts</span>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border-l-4 border-red-600">
                        <div className="flex items-center gap-4">
                            <XCircle className="w-5 h-5 text-red-600" weight="fill" />
                            <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Oil Filter - 10W-30</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">SKU: FLT-10W30-001 • High demand part</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-sm font-bold text-red-600">0 units</div>
                                <div className="text-xs text-red-600">Out of stock</div>
                            </div>
                            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium">
                                Order Now
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border-l-4 border-amber-600">
                        <div className="flex items-center gap-4">
                            <Warning className="w-5 h-5 text-amber-600" weight="fill" />
                            <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Brake Pads - Heavy Duty</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">SKU: BRK-HD-7890 • Critical safety part</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-sm font-bold text-amber-600">3 units</div>
                                <div className="text-xs text-amber-600">Below min: 12</div>
                            </div>
                            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium">
                                Reorder
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border-l-4 border-red-600">
                        <div className="flex items-center gap-4">
                            <XCircle className="w-5 h-5 text-red-600" weight="fill" />
                            <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Spark Plugs - NGK Premium</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">SKU: SPK-NGK-4421 • Fast-moving item</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-sm font-bold text-red-600">0 units</div>
                                <div className="text-xs text-red-600">Out of stock</div>
                            </div>
                            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium">
                                Order Now
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border-l-4 border-amber-600">
                        <div className="flex items-center gap-4">
                            <Warning className="w-5 h-5 text-amber-600" weight="fill" />
                            <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Alternator Belt - Serpentine</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">SKU: BLT-SERP-9012 • Common replacement</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-sm font-bold text-amber-600">5 units</div>
                                <div className="text-xs text-amber-600">Below min: 15</div>
                            </div>
                            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium">
                                Reorder
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border-l-4 border-red-600">
                        <div className="flex items-center gap-4">
                            <XCircle className="w-5 h-5 text-red-600" weight="fill" />
                            <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Transmission Fluid - Dexron VI</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">SKU: FLD-DEX6-3344 • High usage</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-sm font-bold text-red-600">0 units</div>
                                <div className="text-xs text-red-600">Out of stock</div>
                            </div>
                            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium">
                                Order Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function OrdersContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-8 space-y-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Purchase Orders</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Open POs" value="12" variant="primary" icon={<ShoppingCart className="w-6 h-6" />} onClick={() => push({ type: 'open-pos', data: { title: 'Open POs' }, id: 'open-pos' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="In Transit" value="8" variant="warning" onClick={() => push({ type: 'in-transit-pos', data: { title: 'In Transit' }, id: 'in-transit' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Received" value="156" variant="success" onClick={() => push({ type: 'purchase-orders', data: { title: 'Received' }, id: 'received' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Total Value" value="$124K" variant="default" onClick={() => push({ type: 'purchase-orders', data: { title: 'Total Value' }, id: 'total-value' } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

function InvoicesContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-8 space-y-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Invoices & Billing</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Pending" value="18" variant="warning" icon={<FileText className="w-6 h-6" />} onClick={() => push({ type: 'vendors', data: { title: 'Pending Invoices' }, id: 'pending-invoices' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Approved" value="12" variant="success" onClick={() => push({ type: 'vendors', data: { title: 'Approved Invoices' }, id: 'approved-invoices' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Paid This Month" value="$89K" variant="success" onClick={() => push({ type: 'vendors', data: { title: 'Paid This Month' }, id: 'paid-this-month' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Overdue" value="$4.2K" variant="danger" onClick={() => push({ type: 'vendors', data: { title: 'Overdue Invoices' }, id: 'overdue-invoices' } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

function ReceiptsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-8 space-y-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Receipt Processing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Scanned Today" value="24" variant="primary" icon={<Scan className="w-6 h-6" />} onClick={() => push({ type: 'vendors', data: { title: 'Scanned Today' }, id: 'scanned-today' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Pending Review" value="8" variant="warning" onClick={() => push({ type: 'vendors', data: { title: 'Pending Review' }, id: 'pending-review' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Processed" value="456" variant="success" onClick={() => push({ type: 'vendors', data: { title: 'Processed Receipts' }, id: 'processed-receipts' } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

function FuelContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-8 space-y-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Fuel Purchasing</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Cards Active" value="156" variant="primary" icon={<GasPump className="w-6 h-6" />} onClick={() => push({ type: 'fuel-cards', data: { title: 'Fuel Cards' }, id: 'fuel-cards' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Gallons Today" value="2,450" variant="default" onClick={() => push({ type: 'fuel-purchasing', data: { title: 'Gallons Today' }, id: 'gallons-today' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Cost Today" value="$7,840" variant="warning" onClick={() => push({ type: 'fuel-purchasing', data: { title: 'Cost Today' }, id: 'cost-today' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Avg Price/Gal" value="$3.20" variant="default" onClick={() => push({ type: 'fuel-purchasing', data: { title: 'Fuel Prices' }, id: 'fuel-prices' } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

export function ProcurementHub() {
    const tabs: HubTab[] = [
        { id: 'vendors', label: 'Vendors', icon: <Storefront className="w-4 h-4" />, content: <VendorsContent /> },
        { id: 'parts', label: 'Parts', icon: <Cube className="w-4 h-4" />, content: <PartsContent /> },
        { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" />, content: <OrdersContent /> },
        { id: 'invoices', label: 'Invoices', icon: <FileText className="w-4 h-4" />, content: <InvoicesContent /> },
        { id: 'receipts', label: 'Receipts', icon: <Scan className="w-4 h-4" />, content: <ReceiptsContent /> },
        { id: 'fuel', label: 'Fuel', icon: <GasPump className="w-4 h-4" />, content: <FuelContent /> },
    ]

    return (
        <HubPage
            title="Procurement Hub"
            icon={<ProcurementIcon className="w-6 h-6" />}
            description="Vendors, parts, orders, and fuel purchasing"
            tabs={tabs}
            defaultTab="vendors"
        />
    )
}

export default ProcurementHub