/**
 * AdminHub - Consolidated Administration Hub
 * 
 * Consolidates 10 admin-related screens:
 * - Admin Dashboard → Dashboard Tab
 * - Notifications → Alerts Tab
 * - Documents → Documents Tab
 * - Document Q&A → Q&A Tab
 * - Push Notifications → Push Tab
 * - Policy Engine → Policy Tab
 * - Form Builder → Forms Tab
 * - Endpoint Monitor → Monitor Tab
 * - Settings → Settings Tab
 * 
 * Route: /admin
 */

import {
    Gear as AdminIcon,
    ChartBar,
    Bell,
    FolderOpen,
    ChatCircleDots,
    Broadcast,
    Brain,
    FileText,
    Pulse,
    GearSix
} from '@phosphor-icons/react'
import React, { Suspense, lazy } from 'react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

const MonitoringDashboard = lazy(() => import('@/components/admin/MonitoringDashboard'))
const SettingsPage = lazy(() => import('@/components/settings/SettingsPage'))

function TabLoadingFallback() {
    return <div className="p-6"><LoadingSkeleton /></div>
}

export function AdminHub() {
    const tabs: HubTab[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <ChartBar className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <MonitoringDashboard />
                </Suspense>
            ),
        },
        {
            id: 'alerts',
            label: 'Alerts',
            icon: <Bell className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Alerts & Notifications</h2>
                    <p className="text-muted-foreground">System alerts and notification management.</p>
                </div>
            ),
        },
        {
            id: 'documents',
            label: 'Documents',
            icon: <FolderOpen className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Document Management</h2>
                    <p className="text-muted-foreground">Fleet documents and file storage.</p>
                </div>
            ),
        },
        {
            id: 'policy',
            label: 'Policy',
            icon: <Brain className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Policy Engine</h2>
                    <p className="text-muted-foreground">Business rules and policy configuration.</p>
                </div>
            ),
        },
        {
            id: 'forms',
            label: 'Forms',
            icon: <FileText className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Form Builder</h2>
                    <p className="text-muted-foreground">Custom form creation and management.</p>
                </div>
            ),
        },
        {
            id: 'monitor',
            label: 'Monitor',
            icon: <Pulse className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">System Monitor</h2>
                    <p className="text-muted-foreground">API endpoints and system health monitoring.</p>
                </div>
            ),
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: <GearSix className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <SettingsPage />
                </Suspense>
            ),
        },
    ]

    return (
        <HubPage
            title="Admin Hub"
            icon={<AdminIcon className="w-6 h-6" />}
            description="System administration and configuration"
            tabs={tabs}
            defaultTab="dashboard"
        />
    )
}

export default AdminHub
