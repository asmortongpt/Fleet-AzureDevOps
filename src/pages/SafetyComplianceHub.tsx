/**
 * Safety & Compliance Hub - Unified Safety and Compliance Management
 * Route: /safety-compliance
 *
 * Combines Safety Hub and Compliance Hub into a single comprehensive interface
 * for managing all safety incidents, compliance requirements, and regulatory obligations.
 */

import {
    Shield,
    Warning,
    CheckCircle,
    VideoCamera,
    FileText,
    FirstAid,
    Truck,
    Receipt,
    ChartBar,
    ShieldCheck,
    WarningCircle
} from '@phosphor-icons/react'

import { HubPage, HubTabItem } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, QuickStat, StatusDot } from '@/components/ui/stat-card'
import { useDrilldown, DrilldownLevel } from '@/contexts/DrilldownContext'

// ============================================================================
// TAB 1: OVERVIEW DASHBOARD
// ============================================================================

function OverviewContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Safety & Compliance Overview</h2>
                <StatusDot status="online" label="Monitoring Active" />
            </div>

            {/* Top-Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <StatCard
                    title="Overall Compliance"
                    value="94%"
                    variant="success"
                    icon={<CheckCircle className="w-6 h-6" />}
                    onClick={() => push({ type: 'compliance-score', data: { title: 'Compliance Score Details' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Safety Score"
                    value="92%"
                    variant="success"
                    icon={<ShieldCheck className="w-6 h-6" />}
                    onClick={() => push({ type: 'safety-score', data: { title: 'Safety Score Details' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Open Incidents"
                    value="3"
                    variant="danger"
                    icon={<WarningCircle className="w-6 h-6" />}
                    onClick={() => push({ type: 'open-incidents', data: { title: 'Open Incidents' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Days Incident Free"
                    value="47"
                    variant="success"
                    onClick={() => push({ type: 'incident-free', data: { title: 'Safety Record' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Active Violations"
                    value="2"
                    variant="warning"
                    icon={<Warning className="w-6 h-6" />}
                    onClick={() => push({ type: 'violations', data: { title: 'Active Violations' } } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            {/* Detailed Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Safety Score Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 cursor-pointer hover:border-emerald-600 hover:shadow-lg transition-all duration-200"
                     onClick={() => push({ type: 'safety-detail', data: { title: 'Safety Metrics' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-6">Safety Performance</h3>
                    <div className="flex items-center justify-center mb-4">
                        <ProgressRing progress={92} color="green" label="92%" sublabel="Fleet-wide" />
                    </div>
                    <div className="space-y-1 text-sm">
                        <QuickStat label="Near Misses" value="8" trend="down" />
                        <QuickStat label="Training Complete" value="96%" trend="up" />
                        <QuickStat label="Safety Violations" value="2" />
                    </div>
                </div>

                {/* Compliance Status Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 cursor-pointer hover:border-blue-600 hover:shadow-lg transition-all duration-200"
                     onClick={() => push({ type: 'compliance-detail', data: { title: 'Compliance Status' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-6">Compliance Status</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-700 dark:text-slate-300">DOT</span>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: '98%' }}></div>
                                </div>
                                <span className="text-sm font-semibold text-green-600">98%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-700 dark:text-slate-300">OSHA</span>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
                                </div>
                                <span className="text-sm font-semibold text-green-600">100%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-700 dark:text-slate-300">IFTA</span>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
                                </div>
                                <span className="text-sm font-semibold text-green-600">100%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-700 dark:text-slate-300">EPA</span>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-500" style={{ width: '85%' }}></div>
                                </div>
                                <span className="text-sm font-semibold text-yellow-600">85%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-6">Recent Activity</h3>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                            <WarningCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-red-900 dark:text-red-100">Incident Reported</p>
                                <p className="text-xs text-red-700 dark:text-red-300">Vehicle V-1043 - Minor collision</p>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">2 hours ago</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                            <Warning className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Inspection Due</p>
                                <p className="text-xs text-yellow-700 dark:text-yellow-300">4 vehicles require DOT inspection</p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">1 day ago</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-green-900 dark:text-green-100">Training Completed</p>
                                <p className="text-xs text-green-700 dark:text-green-300">12 drivers completed safety training</p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">3 days ago</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// TAB 2: INCIDENTS & SAFETY
// ============================================================================

function IncidentsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Incident Management</h2>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                    <Warning className="w-5 h-5" />
                    Report Incident
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Open Incidents" value="3" variant="danger" icon={<WarningCircle className="w-6 h-6" />} />
                <StatCard title="Under Investigation" value="5" variant="warning" />
                <StatCard title="Resolved (30d)" value="12" variant="success" />
                <StatCard title="Average Resolution Time" value="2.3 days" />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Open Incidents</h3>
                <div className="space-y-3">
                    {[
                        { id: 'INC-2025-001', type: 'Collision', severity: 'High', vehicle: 'V-1043', driver: 'John Smith', date: '2025-01-05' },
                        { id: 'INC-2025-002', type: 'Near Miss', severity: 'Medium', vehicle: 'V-2031', driver: 'Sarah Johnson', date: '2025-01-04' },
                        { id: 'INC-2025-003', type: 'Property Damage', severity: 'Low', vehicle: 'V-3012', driver: 'Mike Davis', date: '2025-01-03' }
                    ].map((incident) => (
                        <div key={incident.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                             onClick={() => push({ type: 'incident-detail', data: { title: incident.id, incident } } as Omit<DrilldownLevel, "timestamp">)}>
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-12 rounded-full ${incident.severity === 'High' ? 'bg-red-500' : incident.severity === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">{incident.id}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{incident.type} - {incident.vehicle}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{incident.driver}</p>
                                <p className="text-xs text-slate-500">{incident.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// TAB 3: DOT COMPLIANCE
// ============================================================================

function DOTComplianceContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">DOT Compliance</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Overall DOT Score" value="98%" variant="success" icon={<Truck className="w-6 h-6" />} />
                <StatCard title="CDL Drivers" value="45/45" variant="success" />
                <StatCard title="Inspections Current" value="143/150" variant="warning" />
                <StatCard title="Medical Cards Expiring" value="4" variant="warning" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Driver Qualification Files</h3>
                    <div className="space-y-2">
                        <QuickStat label="Complete Files" value="42/45" trend="up" />
                        <QuickStat label="Licenses Current" value="45/45" />
                        <QuickStat label="Medical Cards Current" value="41/45" />
                        <QuickStat label="MVR Reviews Current" value="45/45" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Vehicle Inspections</h3>
                    <div className="space-y-2">
                        <QuickStat label="Annual Inspections Current" value="143/150" trend="up" />
                        <QuickStat label="90-Day Inspections" value="148/150" />
                        <QuickStat label="DVIR Compliance" value="98%" />
                        <QuickStat label="Defects Resolved" value="24/24" />
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// TAB 4: OSHA & WORKPLACE SAFETY
// ============================================================================

function OSHAComplianceContent() {
    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">OSHA & Workplace Safety</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="OSHA Compliance" value="100%" variant="success" icon={<FirstAid className="w-6 h-6" />} />
                <StatCard title="Workplace Injuries (YTD)" value="0" variant="success" />
                <StatCard title="Safety Training Current" value="96%" variant="success" />
                <StatCard title="Inspections Passed" value="12/12" variant="success" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">OSHA 300 Log</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">Recordable Injuries (YTD)</span>
                            <span className="text-lg font-bold text-green-600">0</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">Days Away from Work</span>
                            <span className="text-lg font-bold text-green-600">0</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">Job Transfer/Restriction</span>
                            <span className="text-lg font-bold text-green-600">0</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Shop Safety</h3>
                    <div className="space-y-2">
                        <QuickStat label="Hazard Assessments Current" value="Yes" />
                        <QuickStat label="PPE Compliance" value="100%" />
                        <QuickStat label="Lockout/Tagout Training" value="48/48" />
                        <QuickStat label="Hazmat Training Current" value="48/48" />
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// TAB 5: ENVIRONMENTAL COMPLIANCE
// ============================================================================

function EnvironmentalComplianceContent() {
    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Environmental Compliance (EPA)</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="EPA Compliance" value="85%" variant="warning" icon={<Receipt className="w-6 h-6" />} />
                <StatCard title="Waste Manifests Current" value="24/24" variant="success" />
                <StatCard title="Spill Incidents (YTD)" value="0" variant="success" />
                <StatCard title="Stormwater Compliance" value="Compliant" variant="success" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Hazardous Waste Management</h3>
                    <div className="space-y-2">
                        <QuickStat label="Used Oil Disposal" value="Current" />
                        <QuickStat label="Antifreeze Recycling" value="Current" />
                        <QuickStat label="Battery Recycling" value="Current" />
                        <QuickStat label="Tire Disposal" value="Current" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Emissions & Fuel</h3>
                    <div className="space-y-2">
                        <QuickStat label="DEF System Compliance" value="100%" />
                        <QuickStat label="Emission System Repairs" value="3 pending" />
                        <QuickStat label="Idle Reduction Target" value="92%" trend="up" />
                        <QuickStat label="Alternative Fuel Vehicles" value="12" />
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// TAB 6: VIDEO TELEMATICS
// ============================================================================

function VideoTelematicsContent() {
    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Video Telematics & Driver Monitoring</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Cameras Active" value="148/150" variant="success" icon={<VideoCamera className="w-6 h-6" />} />
                <StatCard title="Events Flagged (7d)" value="23" variant="warning" />
                <StatCard title="Driver Coaching Sessions" value="8" />
                <StatCard title="Exoneration Cases" value="2" variant="success" />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Safety Events</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <div className="flex items-center gap-3">
                            <VideoCamera className="w-5 h-5 text-yellow-600" />
                            <div>
                                <p className="font-medium text-yellow-900 dark:text-yellow-100">Hard Braking</p>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">Vehicle V-2034 - Driver: Mike Davis</p>
                            </div>
                        </div>
                        <span className="text-sm text-yellow-600">2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <div className="flex items-center gap-3">
                            <VideoCamera className="w-5 h-5 text-yellow-600" />
                            <div>
                                <p className="font-medium text-yellow-900 dark:text-yellow-100">Following Too Close</p>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">Vehicle V-1092 - Driver: Tom Wilson</p>
                            </div>
                        </div>
                        <span className="text-sm text-yellow-600">5 hours ago</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// TAB 7: DOCUMENTS & RECORDS
// ============================================================================

function DocumentsContent() {
    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Compliance Documents & Records</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Documents" value="1,247" icon={<FileText className="w-6 h-6" />} />
                <StatCard title="Expiring Soon" value="8" variant="warning" />
                <StatCard title="Pending Review" value="3" variant="warning" />
                <StatCard title="Archive Eligible" value="124" />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Document Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Driver Qualification Files</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">45</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Vehicle Inspection Records</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">650</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">OSHA Forms & Logs</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">36</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Environmental Records</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">124</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// MAIN HUB EXPORT
// ============================================================================

export default function SafetyComplianceHub() {
    const tabs: HubTab[] = [
        {
            id: 'overview',
            label: 'Overview',
            icon: <ChartBar className="w-5 h-5" />,
            content: <OverviewContent />
        },
        {
            id: 'incidents',
            label: 'Incidents & Safety',
            icon: <Warning className="w-5 h-5" />,
            content: <IncidentsContent />
        },
        {
            id: 'dot',
            label: 'DOT Compliance',
            icon: <Truck className="w-5 h-5" />,
            content: <DOTComplianceContent />
        },
        {
            id: 'osha',
            label: 'OSHA Safety',
            icon: <FirstAid className="w-5 h-5" />,
            content: <OSHAComplianceContent />
        },
        {
            id: 'environmental',
            label: 'Environmental',
            icon: <Receipt className="w-5 h-5" />,
            content: <EnvironmentalComplianceContent />
        },
        {
            id: 'video',
            label: 'Video Telematics',
            icon: <VideoCamera className="w-5 h-5" />,
            content: <VideoTelematicsContent />
        },
        {
            id: 'documents',
            label: 'Documents',
            icon: <FileText className="w-5 h-5" />,
            content: <DocumentsContent />
        }
    ]

    return (
        <HubPage
            title="Safety & Compliance"
            description="Comprehensive safety incident management and regulatory compliance monitoring"
            icon={<Shield className="w-6 h-6" />}
            tabs={tabs}
            defaultTab="overview"
            gradient="from-red-900/20 via-orange-900/10 to-transparent"
        />
    )
}
