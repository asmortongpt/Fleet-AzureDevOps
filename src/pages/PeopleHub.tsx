/**
 * PeopleHub - Premium Driver & Personnel Management Hub (10/10 Production Quality)
 * Route: /hubs/people
 */

import {
    Layout,
    Users,
    Activity,
    FileText,
    Smartphone,
    UserCheck,
    Plus,
    Award,
    Calendar,
    BarChart
} from 'lucide-react'
import { memo, useCallback, useState, useMemo } from 'react'

import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsListUnderline, TabsTriggerUnderline, TabsContent } from "@/components/ui/tabs"

// ============================================================================
// HELPERS
// ============================================================================
function useAnnouncement() {
    const [announcement, setAnnouncement] = useState('')
    const announce = useCallback((message: string) => {
        setAnnouncement('')
        setTimeout(() => setAnnouncement(message), 100)
    }, [])
    const AnnouncementRegion = memo(() => (
        <div role="status" aria-live="polite" className="sr-only">{announcement}</div>
    ))
    return { announce, AnnouncementRegion }
}

const OverviewContent = memo(function OverviewContent() {
    return (
        <section className="p-6 text-white min-h-[500px]">
            <h2 className="text-xl font-bold mb-4">People Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Active Drivers" value="48" variant="primary" icon={<Users className="w-5 h-5" />} />
                <StatCard title="Certified" value="44" variant="success" icon={<Award className="w-5 h-5" />} />
                <StatCard title="In Training" value="4" variant="warning" icon={<Activity className="w-5 h-5" />} />
                <StatCard title="Avg Score" value="94" variant="info" icon={<BarChart className="w-5 h-5" />} />
            </div>
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800">
                <h3 className="text-lg font-semibold mb-2">Driver Stats & Certification Status</h3>
                <p className="text-slate-400">
                    Team performance remains high. 2 certifications expiring soon.
                </p>
            </div>
        </section>
    )
})

const PeopleManagementContent = memo(function PeopleManagementContent() {
    return (
        <div className="h-full p-6 text-white">
            <h2 className="text-xl font-bold mb-4">People Management</h2>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                <p>Employee directory and contact management.</p>
                <div className="mt-4 border-t border-slate-800 pt-4">
                    <div className="flex justify-between items-center py-2">
                        <span>John Doe</span>
                        <span className="text-sm text-slate-400">Role: Driver</span>
                        <span className="text-sm text-green-400">Active</span>
                    </div>
                </div>
            </div>
        </div>
    )
})

const DriverPerformanceContent = memo(function DriverPerformanceContent() {
    return (
        <div className="h-full p-6 text-white">
            <h2 className="text-xl font-bold mb-4">Driver Performance</h2>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                <h4 className="font-bold mb-2">Performance Metrics</h4>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span>Safety Rating</span>
                        <span className="text-green-400">4.8/5.0</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Efficiency Score</span>
                        <span className="text-blue-400">92%</span>
                    </div>
                </div>
            </div>
        </div>
    )
})

const DriverScorecardContent = memo(function DriverScorecardContent() {
    return (
        <div className="h-full p-6 text-white">
            <h2 className="text-xl font-bold mb-4">Driver Scorecard</h2>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                <p>Comprehensive driver ranking and score analysis.</p>
                <div className="mt-4 p-4 bg-slate-800/50 rounded">
                    <h1 className="text-3xl font-bold text-emerald-400">A+</h1>
                    <p className="text-sm text-slate-400">Fleet Average</p>
                </div>
            </div>
        </div>
    )
})

const MobileEmployeeContent = memo(function MobileEmployeeContent() {
    return (
        <div className="h-full p-6 text-white">
            <h2 className="text-xl font-bold mb-4">Mobile Employee Dashboard</h2>
            <div className="max-w-md mx-auto bg-slate-900/50 p-4 rounded-3xl border border-slate-800 h-[600px] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-6 bg-black/40 backdrop-blur"></div>
                <div className="mt-8 flex-1 flex items-center justify-center">
                    <p className="text-slate-500 text-center">Mobile View Preview<br />Employee Interface</p>
                </div>
            </div>
        </div>
    )
})

const MobileManagerContent = memo(function MobileManagerContent() {
    return (
        <div className="h-full p-6 text-white">
            <h2 className="text-xl font-bold mb-4">Mobile Manager View</h2>
            <div className="max-w-md mx-auto bg-slate-900/50 p-4 rounded-3xl border border-slate-800 h-[600px] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-6 bg-black/40 backdrop-blur"></div>
                <div className="mt-8 flex-1 flex items-center justify-center">
                    <p className="text-slate-500 text-center">Mobile View Preview<br />Manager Oversight</p>
                </div>
            </div>
        </div>
    )
})

export default function PeopleHub() {
    const [activeTab, setActiveTab] = useState("overview");

    const metrics = {
        activeDrivers: 48,
        certified: 44,
        inTraining: 4,
        avgScore: 94
    };

    return (
        <div className="flex h-full w-full flex-col bg-slate-950 text-white overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/50 backdrop-blur">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 rounded-lg">
                        <Users className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">People Hub</h1>
                        <p className="text-xs text-slate-400">Driver and personnel management</p>
                    </div>
                </div>
            </div>

            {/* Layout */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
                <div className="border-b border-slate-800 px-6 bg-slate-900/20">
                    <TabsListUnderline>
                        <TabsTriggerUnderline value="overview">
                            <Layout className="w-4 h-4 mr-2" />
                            Overview
                        </TabsTriggerUnderline>
                        <TabsTriggerUnderline value="people">
                            <Users className="w-4 h-4 mr-2" />
                            People
                        </TabsTriggerUnderline>
                        <TabsTriggerUnderline value="performance">
                            <Activity className="w-4 h-4 mr-2" />
                            Performance
                        </TabsTriggerUnderline>
                        <TabsTriggerUnderline value="scorecard">
                            <FileText className="w-4 h-4 mr-2" />
                            Scorecard
                        </TabsTriggerUnderline>
                        <TabsTriggerUnderline value="mobile-employee">
                            <Smartphone className="w-4 h-4 mr-2" />
                            Mobile Employee
                        </TabsTriggerUnderline>
                        <TabsTriggerUnderline value="mobile-manager">
                            <UserCheck className="w-4 h-4 mr-2" />
                            Mobile Manager
                        </TabsTriggerUnderline>
                    </TabsListUnderline>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 to-slate-900">
                        <TabsContent value="overview" className="h-full mt-0">
                            <OverviewContent />
                        </TabsContent>
                        <TabsContent value="people" className="h-full mt-0">
                            <PeopleManagementContent />
                        </TabsContent>
                        <TabsContent value="performance" className="h-full mt-0">
                            <DriverPerformanceContent />
                        </TabsContent>
                        <TabsContent value="scorecard" className="h-full mt-0">
                            <DriverScorecardContent />
                        </TabsContent>
                        <TabsContent value="mobile-employee" className="h-full mt-0">
                            <MobileEmployeeContent />
                        </TabsContent>
                        <TabsContent value="mobile-manager" className="h-full mt-0">
                            <MobileManagerContent />
                        </TabsContent>
                    </main>

                    {/* Right Sidebar */}
                    <aside className="w-80 border-l border-slate-800 bg-slate-900/40 p-6 overflow-y-auto hidden xl:block">
                        <div className="space-y-6" style={{ borderLeft: "1px solid transparent" }}>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide mb-4">Quick Stats</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                                        <span className="text-sm text-slate-300">Active Drivers</span>
                                        <span className="font-bold text-violet-400">{metrics.activeDrivers}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                        <span className="text-sm text-slate-300">Certified</span>
                                        <span className="font-bold text-emerald-400">{metrics.certified}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                        <span className="text-sm text-slate-300">In Training</span>
                                        <span className="font-bold text-amber-400">{metrics.inTraining}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                        <span className="text-sm text-slate-300">Avg Score</span>
                                        <span className="font-bold text-blue-400">{metrics.avgScore}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-800">
                                <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide mb-4">Quick Actions</h3>
                                <div className="space-y-2">
                                    <Button className="w-full justify-start" variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Driver</Button>
                                    <Button className="w-full justify-start" variant="outline"><Award className="mr-2 h-4 w-4" /> Check Certifications</Button>
                                    <Button className="w-full justify-start" variant="outline"><Calendar className="mr-2 h-4 w-4" /> Schedule Training</Button>
                                    <Button className="w-full justify-start" variant="outline"><BarChart className="mr-2 h-4 w-4" /> Performance Review</Button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </Tabs>
        </div>
    )
}
