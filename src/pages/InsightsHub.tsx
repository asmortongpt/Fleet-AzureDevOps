
import { useState, useEffect } from 'react'
import {
    Layout,
    BarChart,
    TrendingUp,
    FileText,
    Brain,
    Download,
    Play,
    LineChart,
    Activity,
    Database,
    Plus,
    Calendar,
    Clipboard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { cn } from "@/lib/utils"

export default function InsightsHub() {
    const [activeTab, setActiveTab] = useState("overview");

    const metrics = {
        reports: 12,
        insights: 45,
        savings: "$12.5k",
        predictions: 8
    };

    // Custom Tab Navigation (replaces Radix UI for stability)
    const NavTab = ({ id, label }: { id: string, label: string }) => {
        return (
            <button
                onClick={() => setActiveTab(id)}
                className={cn(
                    "group inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-all mr-2 mb-2",
                    activeTab === id
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/10 hover:text-white"
                )}
            >
                {label}
            </button>
        )
    }

    return (
        <div className="flex h-full w-full flex-col bg-slate-950 text-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/50 backdrop-blur">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <BarChart className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Insights Hub</h1>
                        <p className="text-xs text-slate-400">Data analytics and reporting</p>
                    </div>
                </div>
            </div>

            {/* Navigation Bar - Vertical Level to ensure visibility */}
            <div className="border-b border-slate-800 px-6 bg-slate-900/20 py-4 flex flex-col gap-2">
                <NavTab id="overview" label="Overview" />
                <NavTab id="executive" label="Executive Dashboard" />
                <NavTab id="fleet-analytics" label="Fleet Analytics" />
                <NavTab id="workbench" label="Data Workbench" />
                <NavTab id="cost" label="Cost Analysis Center" />
                <NavTab id="reports" label="Custom Report Builder" />
                <NavTab id="predictive" label="Predictive Maintenance" />
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 to-slate-900 p-6">
                    {activeTab === 'overview' && (
                        <section className="min-h-[500px]">
                            <h2 className="text-xl font-bold mb-4">Insights Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <StatCard title="Reports Today" value="12" variant="primary" icon={<FileText className="w-5 h-5" />} />
                                <StatCard title="Insights Generated" value="45" variant="success" icon={<Brain className="w-5 h-5" />} />
                                <StatCard title="Cost Savings" value="$12.5k" variant="warning" icon={<TrendingUp className="w-5 h-5" />} />
                                <StatCard title="AI Predictions" value="8" variant="info" icon={<Activity className="w-5 h-5" />} />
                            </div>
                            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800">
                                <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
                                <p className="text-slate-400">Fleet efficiency up 12% following recent route optimizations.</p>
                            </div>
                        </section>
                    )}
                    {activeTab === 'executive' && (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                            <h2 className="text-xl font-bold mb-4">Executive Dashboard</h2>
                            <p>High-level KPI visualization.</p>
                        </div>
                    )}
                    {activeTab === 'fleet-analytics' && (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                            <h2 className="text-xl font-bold mb-4">Fleet Analytics</h2>
                            <p>Detailed vehicle performance metrics.</p>
                        </div>
                    )}
                    {activeTab === 'workbench' && (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                            <h2 className="text-xl font-bold mb-4">Data Workbench</h2>
                            <p>Custom metric analysis and data exploration.</p>
                        </div>
                    )}
                    {activeTab === 'cost' && (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                            <h2 className="text-xl font-bold mb-4">Cost Analysis Center</h2>
                            <p>TCO breakdown and expense tracking.</p>
                        </div>
                    )}
                    {activeTab === 'reports' && (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                            <h2 className="text-xl font-bold mb-4">Custom Report Builder</h2>
                            <p>Drag-and-drop report generation.</p>
                        </div>
                    )}
                    {activeTab === 'predictive' && (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                            <h2 className="text-xl font-bold mb-4">Predictive Maintenance</h2>
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                                <h4 className="font-bold mb-2">AI Forecasting</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Predicted Failures (7 Days)</span>
                                        <span className="text-amber-400">2 Vehicles</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Right Sidebar - Explicitly Visible */}
                <aside className="w-80 border-l border-slate-800 bg-slate-900/40 p-6 overflow-y-auto hidden xl:block" style={{ borderLeft: "1px solid transparent" }}>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide mb-4">Quick Stats</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <span className="text-sm text-slate-300">Reports Today</span>
                                    <span className="font-bold text-blue-400">{metrics.reports}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <span className="text-sm text-slate-300">Insights Generated</span>
                                    <span className="font-bold text-green-400">{metrics.insights}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <span className="text-sm text-slate-300">Cost Savings</span>
                                    <span className="font-bold text-amber-400">{metrics.savings}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                    <span className="text-sm text-slate-300">AI Predictions</span>
                                    <span className="font-bold text-indigo-400">{metrics.predictions}</span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-slate-800">
                            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                <Button className="w-full justify-start" variant="outline"><Download className="mr-2 h-4 w-4" /> Export Data</Button>
                                <Button className="w-full justify-start" variant="outline"><FileText className="mr-2 h-4 w-4" /> Generate Report</Button>
                                <Button className="w-full justify-start" variant="outline"><Play className="mr-2 h-4 w-4" /> Run Analysis</Button>
                                <Button className="w-full justify-start" variant="outline"><LineChart className="mr-2 h-4 w-4" /> View Trends</Button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}
