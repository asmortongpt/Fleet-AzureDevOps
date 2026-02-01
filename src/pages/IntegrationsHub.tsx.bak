/**
 * IntegrationsHub - Business Systems Integration Hub
 * Route: /integrations
 *
 * Unified hub for enterprise system integrations:
 * - PeopleSoft (HR/Payroll/Finance)
 * - Fuel Master (Advanced Fuel Management)
 * - Azure Key Vault (Secrets Management)
 * - Microsoft Graph (Office 365)
 * - Google Workspace
 * - Third-party APIs
 */

import { Plug, Users, Fuel, Key, ShieldCheck, Activity as Activity } from 'lucide-react'

import { HubPage, HubTabItem } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, QuickStat } from '@/components/ui/stat-card'
import { useDrilldown, DrilldownLevel } from '@/contexts/DrilldownContext'

/**
 * PeopleSoft Integration Tab
 * HR, Payroll, and Financial system integration
 */
function PeopleSoftContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-3 space-y-2 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-sm font-bold text-white">PeopleSoft Integration</h2>
            <p className="text-slate-400">Enterprise HR, Payroll, and Finance System Integration</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <StatCard
                    title="Connection Status"
                    value="Connected"
                    variant="success"
                    icon={<Users className="w-4 h-4" />}
                    onClick={() => push({
                        type: 'peoplesoft-status',
                        data: { title: 'PeopleSoft Connection Status' },
                        id: 'peoplesoft-connection'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Active Employees"
                    value="342"
                    variant="primary"
                    onClick={() => push({
                        type: 'active-employees',
                        data: { title: 'Employee Directory from PeopleSoft' },
                        id: 'employee-directory'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Sync Status"
                    value="97.2%"
                    variant="success"
                    trend="neutral"
                    trendValue="Last: 5 min ago"
                    onClick={() => push({
                        type: 'sync-status',
                        data: { title: 'Data Synchronization Status' },
                        id: 'sync-status'
                    })}
                />
                <StatCard
                    title="Pending Updates"
                    value="8"
                    variant="warning"
                    onClick={() => push({
                        type: 'pending-updates',
                        data: { title: 'Pending PeopleSoft Updates' },
                        id: 'pending-updates'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'employee-sync', data: { title: 'Employee Data Sync' }, id: 'employee-sync' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Employee Sync</h3>
                    <QuickStat label="Active Records" value="342" />
                    <QuickStat label="Updated Today" value="18" trend="up" />
                    <QuickStat label="Last Full Sync" value="2 hrs ago" />
                    <QuickStat label="Error Rate" value="0.3%" trend="down" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'payroll-integration', data: { title: 'Payroll Integration' }, id: 'payroll-integration' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Payroll Integration</h3>
                    <QuickStat label="Current Period" value="2026-01" />
                    <QuickStat label="Hours Synced" value="6,842" trend="up" />
                    <QuickStat label="Mileage Claims" value="234" />
                    <QuickStat label="Status" value="Synced" trend="up" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'finance-integration', data: { title: 'Finance Module Integration' }, id: 'finance-integration' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Finance Integration</h3>
                    <QuickStat label="GL Accounts" value="127" />
                    <QuickStat label="Cost Centers" value="18" />
                    <QuickStat label="AP Invoices" value="456" trend="up" />
                    <QuickStat label="Last Posting" value="Today 14:32" trend="up" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'api-performance', data: { title: 'API Performance Metrics' }, id: 'api-performance' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">API Performance</h3>
                    <ProgressRing progress={94} color="green" label="94%" sublabel="uptime" />
                    <div className="mt-2 text-sm text-slate-300">
                        <div className="flex justify-between">
                            <span>Avg Response Time:</span>
                            <span className="font-semibold text-emerald-400">240ms</span>
                        </div>
                        <div className="flex justify-between">
                            <span>API Calls Today:</span>
                            <span className="font-semibold">12,483</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'integration-logs', data: { title: 'Integration Activity Logs' }, id: 'integration-logs' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Recent Activity</h3>
                    <QuickStat label="Successful Syncs" value="2,341 today" trend="up" />
                    <QuickStat label="Failed Requests" value="7 today" trend="down" />
                    <QuickStat label="Data Volume" value="24.3 MB" />
                </div>
            </div>
        </div>
    )
}

/**
 * Fuel Master Integration Tab
 * Advanced fuel management system integration
 */
function FuelMasterContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-3 space-y-2 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-sm font-bold text-white">Fuel Master Integration</h2>
            <p className="text-slate-400">Enterprise Fuel Management & Card Program Integration</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <StatCard
                    title="Connection Status"
                    value="Active"
                    variant="success"
                    icon={<Fuel className="w-4 h-4" />}
                    onClick={() => push({
                        type: 'fuelmaster-status',
                        data: { title: 'Fuel Master Connection Status' },
                        id: 'fuelmaster-connection'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Active Fuel Cards"
                    value="287"
                    variant="primary"
                    onClick={() => push({
                        type: 'active-cards',
                        data: { title: 'Active Fuel Card Inventory' },
                        id: 'fuel-cards'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Monthly Spend"
                    value="$124.2K"
                    variant="warning"
                    trend="up"
                    trendValue="+8.2%"
                    onClick={() => push({
                        type: 'monthly-spend',
                        data: { title: 'Monthly Fuel Expenditure' },
                        id: 'monthly-spend'
                    })}
                />
                <StatCard
                    title="Transactions Today"
                    value="142"
                    variant="default"
                    onClick={() => push({
                        type: 'daily-transactions',
                        data: { title: 'Daily Fuel Transactions' },
                        id: 'daily-trans'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'transaction-sync', data: { title: 'Transaction Synchronization' }, id: 'transaction-sync' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Transaction Sync</h3>
                    <ProgressRing progress={98} color="green" label="98%" sublabel="sync rate" />
                    <div className="mt-2 text-sm text-slate-300">
                        <div className="flex justify-between">
                            <span>Last Sync:</span>
                            <span className="font-semibold text-emerald-400">3 min ago</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Pending:</span>
                            <span className="font-semibold">4 transactions</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'fuel-pricing', data: { title: 'Fuel Pricing Data' }, id: 'fuel-pricing' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Fuel Pricing</h3>
                    <QuickStat label="Avg Diesel" value="$3.42/gal" trend="up" />
                    <QuickStat label="Avg Unleaded" value="$2.98/gal" trend="down" />
                    <QuickStat label="Monthly Savings" value="$8,240" trend="up" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'fraud-detection', data: { title: 'Fraud Detection & Alerts' }, id: 'fraud-detection' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Fraud Detection</h3>
                    <QuickStat label="Alerts This Month" value="3" trend="down" />
                    <QuickStat label="Flagged Trans." value="12" />
                    <QuickStat label="Resolution Rate" value="100%" trend="up" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'card-management', data: { title: 'Fuel Card Management' }, id: 'card-management' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Card Management</h3>
                    <QuickStat label="Active Cards" value="287" trend="up" />
                    <QuickStat label="Suspended" value="8" />
                    <QuickStat label="Lost/Stolen" value="2" trend="down" />
                    <QuickStat label="Pending Activation" value="5" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'merchant-network', data: { title: 'Merchant Network Status' }, id: 'merchant-network' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Merchant Network</h3>
                    <QuickStat label="Partner Stations" value="2,847" />
                    <QuickStat label="Avg Discount" value="$0.08/gal" trend="up" />
                    <QuickStat label="Preferred Vendors" value="42" />
                </div>
            </div>
        </div>
    )
}

/**
 * Azure Key Vault Integration Tab
 * Secrets and credential management
 */
function KeyVaultContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-3 space-y-2 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-sm font-bold text-white">Azure Key Vault</h2>
            <p className="text-slate-400">Enterprise Secrets & Credential Management</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <StatCard
                    title="Vault Status"
                    value="Healthy"
                    variant="success"
                    icon={<Key className="w-4 h-4" />}
                    onClick={() => push({
                        type: 'keyvault-health',
                        data: { title: 'Key Vault Health Status' },
                        id: 'vault-health'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Active Secrets"
                    value="47"
                    variant="primary"
                    icon={<ShieldCheck className="w-4 h-4" />}
                    onClick={() => push({
                        type: 'active-secrets',
                        data: { title: 'Active Secret Inventory' },
                        id: 'active-secrets'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Expiring Soon"
                    value="3"
                    variant="warning"
                    onClick={() => push({
                        type: 'expiring-secrets',
                        data: { title: 'Secrets Expiring Within 30 Days' },
                        id: 'expiring-secrets'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Access Requests"
                    value="124"
                    variant="default"
                    onClick={() => push({
                        type: 'access-requests',
                        data: { title: 'Secret Access Requests Today' },
                        id: 'access-requests'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'secret-inventory', data: { title: 'Secret Inventory' }, id: 'secret-inventory' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Secret Types</h3>
                    <QuickStat label="Database Credentials" value="12" />
                    <QuickStat label="API Keys" value="18" />
                    <QuickStat label="Certificates" value="8" />
                    <QuickStat label="Connection Strings" value="9" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'access-control', data: { title: 'Access Control Policies' }, id: 'access-policies' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Access Control</h3>
                    <QuickStat label="Service Principals" value="8" />
                    <QuickStat label="User Access" value="24" />
                    <QuickStat label="Role Assignments" value="42" />
                    <QuickStat label="Policies" value="15" trend="up" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'rotation-status', data: { title: 'Secret Rotation Status' }, id: 'rotation-status' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Rotation Status</h3>
                    <ProgressRing progress={89} color="blue" label="89%" sublabel="auto-rotated" />
                    <div className="mt-2 text-sm text-slate-300">
                        <div className="flex justify-between">
                            <span>Next Rotation:</span>
                            <span className="font-semibold text-blue-400">14 days</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'audit-logs', data: { title: 'Key Vault Audit Logs' }, id: 'audit-logs' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Audit & Compliance</h3>
                    <QuickStat label="Access Events Today" value="342" />
                    <QuickStat label="Failed Attempts" value="0" trend="down" />
                    <QuickStat label="Secret Updates" value="8" />
                    <QuickStat label="Compliance Score" value="98%" trend="up" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'security-monitoring', data: { title: 'Security Monitoring' }, id: 'security-monitoring' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Security Monitoring</h3>
                    <QuickStat label="Threat Alerts" value="0" trend="down" />
                    <QuickStat label="Anomaly Detection" value="Active" trend="up" />
                    <QuickStat label="Last Security Scan" value="1 hr ago" />
                </div>
            </div>
        </div>
    )
}

/**
 * API Management Tab
 * Overview of all external API integrations
 */
function APIManagementContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-3 space-y-2 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-sm font-bold text-white">API Management & Monitoring</h2>
            <p className="text-slate-400">Centralized API Integration Dashboard</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <StatCard
                    title="Active Integrations"
                    value="12"
                    variant="primary"
                    icon={<Plug className="w-4 h-4" />}
                    onClick={() => push({
                        type: 'active-integrations',
                        data: { title: 'Active API Integrations' },
                        id: 'active-integrations'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="API Calls Today"
                    value="24.8K"
                    variant="success"
                    icon={<Activity className="w-4 h-4" />}
                    onClick={() => push({
                        type: 'api-calls',
                        data: { title: 'Daily API Call Volume' },
                        id: 'api-calls'
                    } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Avg Response Time"
                    value="185ms"
                    variant="success"
                    trend="down"
                    trendValue="-15ms"
                    onClick={() => push({
                        type: 'response-time',
                        data: { title: 'API Response Time Analysis' },
                        id: 'response-time'
                    })}
                />
                <StatCard
                    title="Error Rate"
                    value="0.3%"
                    variant="success"
                    trend="down"
                    trendValue="-0.2%"
                    onClick={() => push({
                        type: 'error-rate',
                        data: { title: 'API Error Rate Monitoring' },
                        id: 'error-rate'
                    })}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'microsoft-365', data: { title: 'Microsoft 365 Integration' }, id: 'microsoft-365' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Microsoft 365</h3>
                    <QuickStat label="Teams Messages" value="1,842" trend="up" />
                    <QuickStat label="Email Sent" value="342" />
                    <QuickStat label="Calendar Syncs" value="124" trend="up" />
                    <QuickStat label="Status" value="Connected" trend="up" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'google-workspace', data: { title: 'Google Workspace Integration' }, id: 'google-workspace' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Google Workspace</h3>
                    <QuickStat label="Calendar Events" value="89" />
                    <QuickStat label="Drive Files" value="1,234" trend="up" />
                    <QuickStat label="Gmail API Calls" value="2,456" />
                    <QuickStat label="Status" value="Active" trend="up" />
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'third-party', data: { title: 'Third-Party APIs' }, id: 'third-party-apis' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Third-Party APIs</h3>
                    <QuickStat label="ArcGIS" value="Active" trend="up" />
                    <QuickStat label="Smartcar" value="Connected" trend="up" />
                    <QuickStat label="Weather API" value="Running" />
                    <QuickStat label="Traffic Data" value="Synced" trend="up" />
                </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                onClick={() => push({ type: 'integration-health', data: { title: 'Integration Health Dashboard' }, id: 'integration-health' } as Omit<DrilldownLevel, "timestamp">)}>
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">System Health Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <QuickStat label="Overall Uptime" value="99.7%" trend="up" />
                    <QuickStat label="Failed Requests" value="42 today" trend="down" />
                    <QuickStat label="Rate Limits" value="Within limits" />
                    <QuickStat label="Webhooks Active" value="18" trend="up" />
                </div>
            </div>
        </div>
    )
}

export default function IntegrationsHub() {
    return (
        <HubPage
            title="Business Integrations"
            description="Enterprise system integrations and API management"
            icon={<Plug className="w-4 h-4" />}
        >
            <HubTabItem value="peoplesoft" label="PeopleSoft" icon={<Users className="w-3 h-3" />}>
                <PeopleSoftContent />
            </HubTabItem>

            <HubTabItem value="fuelmaster" label="Fuel Master" icon={<Fuel className="w-3 h-3" />}>
                <FuelMasterContent />
            </HubTabItem>

            <HubTabItem value="keyvault" label="Key Vault" icon={<Key className="w-3 h-3" />}>
                <KeyVaultContent />
            </HubTabItem>

            <HubTabItem value="api-management" label="API Management" icon={<Activity className="w-3 h-3" />}>
                <APIManagementContent />
            </HubTabItem>
        </HubPage>
    )
}
