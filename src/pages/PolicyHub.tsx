/**
 * PolicyHub - Comprehensive Policy and Governance Management Hub
 * Route: /policy-hub
 *
 * Features:
 * - AI-powered policy creation and management
 * - Standard Operating Procedures (SOPs) library
 * - Employee/driver onboarding workflows
 * - Training module assignments and tracking
 * - Compliance checklists and audit trails
 * - Workflow automation and approval routing
 * - Policy acknowledgment and signature tracking
 */

import {
    BookOpen as PolicyIcon,
    ChartBar,
    FileText,
    UserPlus,
    GraduationCap,
    CheckCircle,
    FlowArrow,
    Robot,
    ShieldCheck,
    Warning,
    Lightbulb
, Receipt } from '@phosphor-icons/react'

import { PolicyEngineWorkbench } from '@/components/modules/admin/PolicyEngineWorkbench'
import { PolicyOnboarding } from '@/components/modules/admin/PolicyOnboarding'
import { Button } from '@/components/ui/button'
import { HubPage, HubTab, HubTabItem } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, QuickStat } from '@/components/ui/stat-card'
import { useDrilldown, DrilldownLevel } from '@/contexts/DrilldownContext'
import { usePolicies } from '@/contexts/PolicyContext'

/**
 * Dashboard Content - Overview of policy management system
 */
function DashboardContent() {
    const { push } = useDrilldown()
    const { policies } = usePolicies()

    // Calculate statistics
    const activePolicies = policies.filter(p => p.status === 'active').length
    const draftPolicies = policies.filter(p => p.status === 'draft').length
    const totalViolations = policies.reduce((sum, p) => sum + (p.violationCount || 0), 0)
    const complianceRate = policies.length > 0
        ? Math.round((activePolicies / policies.length) * 100)
        : 0

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Policy Management Dashboard</h2>
                    <p className="text-slate-400 mt-1">Centralized governance and compliance management</p>
                </div>
                <Button
                    onClick={() => push({ type: 'ai-policy-generator', data: { title: 'AI Policy Generator' } } as Omit<DrilldownLevel, "timestamp">)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                    <Robot className="w-4 h-4 mr-2" />
                    AI Policy Generator
                </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Active Policies"
                    value={activePolicies.toString()}
                    variant="success"
                    icon={<ShieldCheck className="w-6 h-6" />}
                    onClick={() => push({ type: 'policies', data: { filter: 'active' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Compliance Rate"
                    value={`${complianceRate}%`}
                    variant={complianceRate >= 90 ? "success" : "warning"}
                    onClick={() => push({ type: 'compliance-tracking', data: { title: 'Compliance Rate' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Draft Policies"
                    value={draftPolicies.toString()}
                    variant="default"
                    onClick={() => push({ type: 'policies', data: { filter: 'draft' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Violations"
                    value={totalViolations.toString()}
                    variant={totalViolations > 0 ? "warning" : "success"}
                    icon={<Warning className="w-6 h-6" />}
                    onClick={() => push({ type: 'violations', data: { title: 'Policy Violations' } } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 cursor-pointer hover:border-emerald-600 hover:shadow-lg transition-all duration-200"
                     onClick={() => push({ type: 'policies', data: { title: 'Policy Status' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-6">Policy Status</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={complianceRate} color="green" label={`${complianceRate}%`} sublabel="Compliance" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 cursor-pointer hover:border-blue-600 hover:shadow-lg transition-all duration-200"
                     onClick={() => push({ type: 'sop-library', data: { title: 'SOP Metrics' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-6">SOP Library</h3>
                    <div className="space-y-1">
                        <QuickStat label="Total SOPs" value="24" />
                        <QuickStat label="Recently Updated" value="5" trend="up" />
                        <QuickStat label="Pending Review" value="2" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 cursor-pointer hover:border-purple-600 hover:shadow-lg transition-all duration-200"
                     onClick={() => push({ type: 'training', data: { title: 'Training Status' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-6">Training Status</h3>
                    <div className="space-y-1">
                        <QuickStat label="Completed" value="156" trend="up" />
                        <QuickStat label="In Progress" value="23" />
                        <QuickStat label="Overdue" value="4" />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                        onClick={() => push({ type: 'create-policy', data: { title: 'Create Policy' } } as Omit<DrilldownLevel, "timestamp">)}
                    >
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">Create Policy</span>
                    </button>
                    <button
                        className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                        onClick={() => push({ type: 'gap-analysis', data: { title: 'Gap Analysis' } } as Omit<DrilldownLevel, "timestamp">)}
                    >
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">Run Gap Analysis</span>
                    </button>
                    <button
                        className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                        onClick={() => push({ type: 'training-assignment', data: { title: 'Assign Training' } } as Omit<DrilldownLevel, "timestamp">)}
                    >
                        <GraduationCap className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">Assign Training</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

/**
 * Policies Content - Policy management workbench
 */
function PoliciesContent() {
    return (
        <div className="h-full">
            <PolicyEngineWorkbench />
        </div>
    )
}

/**
 * SOPs Content - Standard Operating Procedures management
 */
function SOPsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Standard Operating Procedures</h2>
                    <p className="text-slate-400 mt-1">Centralized repository of organizational procedures and best practices</p>
                </div>
                <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => push({ type: 'create-sop', data: { title: 'Create SOP' } } as Omit<DrilldownLevel, "timestamp">)}
                >
                    <FileText className="w-4 h-4 mr-2" />
                    Create SOP
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total SOPs"
                    value="24"
                    variant="primary"
                    icon={<FileText className="w-6 h-6" />}
                    onClick={() => push({ type: 'sop-list', data: { title: 'All SOPs' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Recently Updated"
                    value="5"
                    variant="success"
                    onClick={() => push({ type: 'recent-sops', data: { title: 'Recent Updates' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Pending Review"
                    value="2"
                    variant="warning"
                    onClick={() => push({ type: 'pending-review', data: { title: 'Pending Review' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Compliance Rate"
                    value="97%"
                    variant="success"
                    icon={<CheckCircle className="w-6 h-6" />}
                    onClick={() => push({ type: 'sop-compliance', data: { title: 'SOP Compliance' } } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">SOP Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { name: 'Safety Procedures', count: 8, icon: <ShieldCheck className="w-5 h-5" />, color: 'text-green-600' },
                        { name: 'Maintenance', count: 6, icon: <FlowArrow className="w-5 h-5" />, color: 'text-blue-600' },
                        { name: 'Dispatch', count: 4, icon: <ChartBar className="w-5 h-5" />, color: 'text-purple-600' },
                        { name: 'Compliance', count: 3, icon: <CheckCircle className="w-5 h-5" />, color: 'text-orange-600' },
                        { name: 'Emergency Response', count: 2, icon: <Warning className="w-5 h-5" />, color: 'text-red-600' },
                        { name: 'Administrative', count: 1, icon: <FileText className="w-5 h-5" />, color: 'text-slate-600' },
                    ].map((category) => (
                        <button
                            key={category.name}
                            className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                            onClick={() => push({ type: 'sop-category', data: { category: category.name } } as Omit<DrilldownLevel, "timestamp">)}
                        >
                            <div className="flex items-center gap-3">
                                <span className={category.color}>{category.icon}</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">{category.name}</span>
                            </div>
                            <span className="text-sm text-slate-500">{category.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl border border-blue-500/20 p-6">
                <div className="flex items-start gap-4">
                    <Robot className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">AI SOP Generation</h3>
                        <p className="text-slate-300 mb-4">
                            Use AI to automatically generate SOPs based on your organization's processes, best practices,
                            and regulatory requirements. Our intelligent system can identify gaps and recommend improvements.
                        </p>
                        <Button
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            onClick={() => push({ type: 'ai-sop-generator', data: { title: 'AI SOP Generator' } } as Omit<DrilldownLevel, "timestamp">)}
                        >
                            <Robot className="w-4 h-4 mr-2" />
                            Generate SOPs with AI
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Onboarding Content - Employee/driver onboarding workflows
 */
function OnboardingContent() {
    return (
        <div className="h-full">
            <PolicyOnboarding />
        </div>
    )
}

/**
 * Training Content - Training module assignment and tracking
 */
function TrainingContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Training Management</h2>
                    <p className="text-slate-400 mt-1">Assign, track, and manage training modules and certifications</p>
                </div>
                <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => push({ type: 'assign-training', data: { title: 'Assign Training' } } as Omit<DrilldownLevel, "timestamp">)}
                >
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Assign Training
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Completed"
                    value="156"
                    variant="success"
                    icon={<CheckCircle className="w-6 h-6" />}
                    onClick={() => push({ type: 'completed-training', data: { title: 'Completed Training' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="In Progress"
                    value="23"
                    variant="primary"
                    onClick={() => push({ type: 'in-progress-training', data: { title: 'In Progress' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Overdue"
                    value="4"
                    variant="warning"
                    icon={<Warning className="w-6 h-6" />}
                    onClick={() => push({ type: 'overdue-training', data: { title: 'Overdue Training' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Completion Rate"
                    value="87%"
                    variant="success"
                    onClick={() => push({ type: 'training-completion-rate', data: { title: 'Completion Rate' } } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Training Categories</h3>
                    <div className="space-y-3">
                        {[
                            { name: 'Safety Training', completed: 45, total: 50, progress: 90 },
                            { name: 'Compliance Training', completed: 38, total: 40, progress: 95 },
                            { name: 'Equipment Operation', completed: 28, total: 35, progress: 80 },
                            { name: 'Emergency Procedures', completed: 30, total: 30, progress: 100 },
                            { name: 'Regulatory Requirements', completed: 15, total: 28, progress: 54 },
                        ].map((category) => (
                            <div key={category.name} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{category.name}</span>
                                    <span className="text-slate-500">{category.completed}/{category.total}</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            category.progress >= 90 ? 'bg-green-500' :
                                            category.progress >= 70 ? 'bg-blue-500' :
                                            'bg-orange-500'
                                        }`}
                                        style={{ width: `${category.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Upcoming Training</h3>
                    <div className="space-y-3">
                        {[
                            { title: 'DOT Compliance Update', date: '2024-01-15', attendees: 12 },
                            { title: 'New Safety Procedures', date: '2024-01-18', attendees: 8 },
                            { title: 'EV Maintenance Training', date: '2024-01-22', attendees: 5 },
                            { title: 'Emergency Response Drill', date: '2024-01-25', attendees: 15 },
                        ].map((training) => (
                            <div
                                key={training.title}
                                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
                                onClick={() => push({ type: 'training-detail', data: { training } } as Omit<DrilldownLevel, "timestamp">)}
                            >
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">{training.title}</p>
                                    <p className="text-sm text-slate-500">{training.date}</p>
                                </div>
                                <span className="text-sm text-slate-500">{training.attendees} attendees</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Compliance Content - Compliance checklist management
 */
function ComplianceContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Compliance Management</h2>
                    <p className="text-slate-400 mt-1">Track regulatory requirements and ensure organizational compliance</p>
                </div>
                <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => push({ type: 'create-checklist', data: { title: 'Create Checklist' } } as Omit<DrilldownLevel, "timestamp">)}
                >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Checklist
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Overall Compliance"
                    value="94%"
                    variant="success"
                    icon={<CheckCircle className="w-6 h-6" />}
                    onClick={() => push({ type: 'overall-compliance', data: { title: 'Overall Compliance' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Active Checklists"
                    value="18"
                    variant="primary"
                    onClick={() => push({ type: 'active-checklists', data: { title: 'Active Checklists' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Items Overdue"
                    value="3"
                    variant="warning"
                    icon={<Warning className="w-6 h-6" />}
                    onClick={() => push({ type: 'overdue-items', data: { title: 'Overdue Items' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Upcoming Audits"
                    value="2"
                    variant="default"
                    onClick={() => push({ type: 'upcoming-audits', data: { title: 'Upcoming Audits' } } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 cursor-pointer hover:border-emerald-600 hover:shadow-lg transition-all duration-200"
                     onClick={() => push({ type: 'dot-compliance', data: { title: 'DOT Compliance' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-6">DOT Compliance</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={98} color="green" label="98%" sublabel="Compliant" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 cursor-pointer hover:border-blue-600 hover:shadow-lg transition-all duration-200"
                     onClick={() => push({ type: 'osha-compliance', data: { title: 'OSHA Compliance' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-6">OSHA Compliance</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={92} color="green" label="92%" sublabel="Safety Score" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 cursor-pointer hover:border-purple-600 hover:shadow-lg transition-all duration-200"
                     onClick={() => push({ type: 'environmental-compliance', data: { title: 'Environmental' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-6">Environmental</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={88} color="green" label="88%" sublabel="EPA Standards" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Compliance Activities</h3>
                <div className="space-y-3">
                    {[
                        { activity: 'DOT Inspection Completed', date: '2024-01-05', status: 'passed' },
                        { activity: 'OSHA 300 Log Updated', date: '2024-01-04', status: 'completed' },
                        { activity: 'Driver Qualification Files Reviewed', date: '2024-01-03', status: 'passed' },
                        { activity: 'Vehicle Maintenance Records Audit', date: '2024-01-02', status: 'action-required' },
                    ].map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
                            onClick={() => push({ type: 'compliance-activity', data: { activity: item } } as Omit<DrilldownLevel, "timestamp">)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                    item.status === 'passed' ? 'bg-green-500' :
                                    item.status === 'completed' ? 'bg-blue-500' :
                                    'bg-orange-500'
                                }`} />
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">{item.activity}</p>
                                    <p className="text-sm text-slate-500">{item.date}</p>
                                </div>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                item.status === 'passed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                item.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                                'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                            }`}>
                                {item.status.replace('-', ' ')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/**
 * Workflows Content - Approval workflows and automation
 */
function WorkflowsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Workflow Automation</h2>
                    <p className="text-slate-400 mt-1">Design, automate, and monitor approval workflows and business processes</p>
                </div>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => push({ type: 'create-workflow', data: { title: 'Create Workflow' } } as Omit<DrilldownLevel, "timestamp">)}
                >
                    <FlowArrow className="w-4 h-4 mr-2" />
                    Create Workflow
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Active Workflows"
                    value="12"
                    variant="primary"
                    icon={<FlowArrow className="w-6 h-6" />}
                    onClick={() => push({ type: 'active-workflows', data: { title: 'Active Workflows' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Pending Approvals"
                    value="8"
                    variant="warning"
                    onClick={() => push({ type: 'pending-approvals', data: { title: 'Pending Approvals' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Completed This Month"
                    value="156"
                    variant="success"
                    icon={<CheckCircle className="w-6 h-6" />}
                    onClick={() => push({ type: 'completed-workflows', data: { title: 'Completed' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Avg. Completion Time"
                    value="2.3 days"
                    variant="default"
                    onClick={() => push({ type: 'workflow-metrics', data: { title: 'Metrics' } } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Workflow Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { name: 'Purchase Order Approval', steps: 4, users: 8, icon: <Receipt className="w-5 h-5" />, color: 'text-blue-600' },
                        { name: 'Policy Review & Approval', steps: 5, users: 12, icon: <ShieldCheck className="w-5 h-5" />, color: 'text-green-600' },
                        { name: 'Incident Investigation', steps: 6, users: 5, icon: <Warning className="w-5 h-5" />, color: 'text-red-600' },
                        { name: 'Training Certification', steps: 3, users: 20, icon: <GraduationCap className="w-5 h-5" />, color: 'text-purple-600' },
                        { name: 'Maintenance Approval', steps: 4, users: 6, icon: <FlowArrow className="w-5 h-5" />, color: 'text-orange-600' },
                        { name: 'Document Review', steps: 3, users: 10, icon: <FileText className="w-5 h-5" />, color: 'text-indigo-600' },
                    ].map((workflow) => (
                        <button
                            key={workflow.name}
                            className="flex flex-col gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                            onClick={() => push({ type: 'workflow-template', data: { workflow } } as Omit<DrilldownLevel, "timestamp">)}
                        >
                            <div className="flex items-center gap-3">
                                <span className={workflow.color}>{workflow.icon}</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">{workflow.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span>{workflow.steps} steps</span>
                                <span>•</span>
                                <span>{workflow.users} users</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-xl border border-indigo-500/20 p-6">
                <div className="flex items-start gap-4">
                    <Robot className="w-8 h-8 text-indigo-600 flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">AI Workflow Optimization</h3>
                        <p className="text-slate-300 mb-4">
                            Leverage AI to identify bottlenecks, optimize approval routing, and predict workflow completion times.
                            Get intelligent suggestions for process improvements based on historical data.
                        </p>
                        <Button
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            onClick={() => push({ type: 'ai-workflow-optimizer', data: { title: 'AI Workflow Optimizer' } } as Omit<DrilldownLevel, "timestamp">)}
                        >
                            <Robot className="w-4 h-4 mr-2" />
                            Optimize with AI
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Import missing Button component
 */

/**
 * Policy Hub Main Component
 */
export function PolicyHub() {
    const tabs: HubTab[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <ChartBar className="w-4 h-4" />, content: <DashboardContent /> },
        { id: 'policies', label: 'Policies', icon: <ShieldCheck className="w-4 h-4" />, content: <PoliciesContent /> },
        { id: 'sops', label: 'SOPs', icon: <FileText className="w-4 h-4" />, content: <SOPsContent /> },
        { id: 'onboarding', label: 'Onboarding', icon: <UserPlus className="w-4 h-4" />, content: <OnboardingContent /> },
        { id: 'training', label: 'Training', icon: <GraduationCap className="w-4 h-4" />, content: <TrainingContent /> },
        { id: 'compliance', label: 'Compliance', icon: <CheckCircle className="w-4 h-4" />, content: <ComplianceContent /> },
        { id: 'workflows', label: 'Workflows', icon: <FlowArrow className="w-4 h-4" />, content: <WorkflowsContent /> },
    ]

    return (
        <HubPage
            title="Policy Management Hub"
            icon={<PolicyIcon className="w-6 h-6" />}
            description="Centralized governance, compliance, and process management"
            tabs={tabs}
            defaultTab="dashboard"
        />
    )
}

export default PolicyHub
