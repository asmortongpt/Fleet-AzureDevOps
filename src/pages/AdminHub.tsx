/**
 * AdminHub - Consolidated Administration Hub
 * 
 * Consolidates admin screens into one hub page:
 * - Admin Dashboard → Dashboard Tab
 * - Alerts → Alerts Tab
 * - Documents → Documents Tab
 * - Policy → Policy Tab
 * - Forms → Forms Tab
 * - Settings → Settings Tab
 * 
 * Route: /admin
 */

import {
    Gear as AdminIcon,
    ChartBar,
    Bell,
    FolderOpen,
    Brain,
    FileText,
    GearSix
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AdminHub() {
    const tabs: HubTab[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <ChartBar className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Admin Dashboard</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader><CardTitle>Users</CardTitle></CardHeader>
                            <CardContent><span className="text-2xl font-bold">156</span></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Active Sessions</CardTitle></CardHeader>
                            <CardContent><span className="text-2xl font-bold">42</span></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>API Calls Today</CardTitle></CardHeader>
                            <CardContent><span className="text-2xl font-bold">12.4K</span></CardContent>
                        </Card>
                    </div>
                </div>
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
            id: 'settings',
            label: 'Settings',
            icon: <GearSix className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">System Settings</h2>
                    <p className="text-muted-foreground">Application configuration and preferences.</p>
                </div>
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
