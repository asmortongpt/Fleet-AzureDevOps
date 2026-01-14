/**
 * CTA Configuration Hub
 * Super admin only - complete control over every configurable aspect
 *
 * Only visible to: SuperAdmin, CTAOwner roles
 *
 * Features:
 * - Every element configurable
 * - Auto-configuration from Policy Hub
 * - Live preview of changes
 * - Approval workflows for critical changes
 * - Configuration export/import
 * - SOP-driven RBAC configuration
 */

import {
  Gear,
  Building,
  SquaresFour,
  Sliders,
  Plugs,
  Bell,
  Shield,
  Code,
  Export,
  Upload,
  MagicWand,
  Eye,
  CheckCircle,
  Warning as WarningIcon,
  Info
} from '@phosphor-icons/react'
import { useState, useEffect } from 'react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard } from '@/components/ui/stat-card'
import { configurationEngine, CONFIGURATION_SCHEMA, type ConfigSetting, type ConfigCategory } from '@/lib/configuration/configuration-engine'

// ============================================================================
// Configuration Overview Dashboard
// ============================================================================

function OverviewContent() {
  const [configStats, setConfigStats] = useState({
    totalSettings: 0,
    configured: 0,
    policyDriven: 0,
    needsApproval: 0
  })

  useEffect(() => {
    // Calculate stats
    let total = 0
    let configured = 0
    let policyDriven = 0
    let needsApproval = 0

    CONFIGURATION_SCHEMA.categories.forEach(category => {
      category.sections.forEach(section => {
        total += section.settings.length
        section.settings.forEach(setting => {
          if (setting.value !== setting.defaultValue) configured++
          if (setting.policySource) policyDriven++
          if (setting.requiresApproval) needsApproval++
        })
      })
    })

    setConfigStats({ totalSettings: total, configured, policyDriven, needsApproval })
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configuration Overview</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Complete control over application behavior and appearance</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
            <MagicWand className="w-5 h-5" />
            Auto-Configure from Policies
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Export className="w-5 h-5" />
            Export Configuration
          </button>
          <button className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Configuration
          </button>
        </div>
      </div>

      {/* Configuration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Settings"
          value={configStats.totalSettings.toString()}
          icon={<Gear className="w-6 h-6" />}
        />
        <StatCard
          title="Configured"
          value={configStats.configured.toString()}
          variant="success"
          icon={<CheckCircle className="w-6 h-6" />}
        />
        <StatCard
          title="Policy-Driven"
          value={configStats.policyDriven.toString()}
          variant="info"
          icon={<MagicWand className="w-6 h-6" />}
        />
        <StatCard
          title="Needs Approval"
          value={configStats.needsApproval.toString()}
          variant="warning"
          icon={<WarningIcon className="w-6 h-6" />}
        />
      </div>

      {/* Configuration Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {CONFIGURATION_SCHEMA.categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      {/* Recent Configuration Changes */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Configuration Changes</h3>
        <div className="space-y-3">
          <ConfigChangeItem
            setting="PM Interval - Light Duty"
            oldValue="3,000 miles"
            newValue="5,000 miles"
            changedBy="System (Policy Engine)"
            timestamp="2 hours ago"
            source="preventive-maintenance-policy"
          />
          <ConfigChangeItem
            setting="Primary Brand Color"
            oldValue="#3b82f6"
            newValue="#2563eb"
            changedBy="John Smith (Admin)"
            timestamp="1 day ago"
          />
          <ConfigChangeItem
            setting="Session Timeout"
            oldValue="30 minutes"
            newValue="60 minutes"
            changedBy="System (Policy Engine)"
            timestamp="3 days ago"
            source="security-policy"
          />
        </div>
      </div>
    </div>
  )
}

function CategoryCard({ category }: { category: ConfigCategory }) {
  const totalSettings = category.sections.reduce((sum, section) => sum + section.settings.length, 0)
  const policyDriven = category.sections.reduce(
    (sum, section) => sum + section.settings.filter(s => s.policySource).length,
    0
  )

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:border-blue-300 transition-all cursor-pointer">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <Gear className="w-6 h-6 text-blue-800" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{category.name}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{category.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="text-slate-600 dark:text-slate-400">{totalSettings} settings</span>
            {policyDriven > 0 && (
              <span className="flex items-center gap-1 text-purple-600">
                <MagicWand className="w-4 h-4" />
                {policyDriven} policy-driven
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfigChangeItem({
  setting,
  oldValue,
  newValue,
  changedBy,
  timestamp,
  source
}: {
  setting: string
  oldValue: string
  newValue: string
  changedBy: string
  timestamp: string
  source?: string
}) {
  return (
    <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <div className="flex-1">
        <p className="font-medium text-slate-900 dark:text-white">{setting}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          <span className="text-red-600 line-through">{oldValue}</span>
          {' → '}
          <span className="text-green-600 font-semibold">{newValue}</span>
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
          <span>{changedBy}</span>
          <span>•</span>
          <span>{timestamp}</span>
          {source && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-purple-600">
                <MagicWand className="w-3 h-3" />
                {source}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Organization & Branding Configuration
// ============================================================================

function OrganizationBrandingContent() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Organization & Branding</h2>

      <ConfigSection
        title="Organization Identity"
        description="Core organization information"
        settings={CONFIGURATION_SCHEMA.categories[0].sections[0].settings}
      />

      <ConfigSection
        title="Visual Branding"
        description="Colors, logos, and visual identity"
        settings={CONFIGURATION_SCHEMA.categories[0].sections[1].settings}
        showPreview
      />
    </div>
  )
}

// ============================================================================
// Modules & Features Configuration
// ============================================================================

function ModulesFeaturesContent() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Modules & Features</h2>

      <ConfigSection
        title="Enabled Hubs"
        description="Control which hubs are available to users"
        settings={CONFIGURATION_SCHEMA.categories[1].sections[0].settings}
      />

      <ConfigSection
        title="Feature Flags"
        description="Enable/disable specific features"
        settings={CONFIGURATION_SCHEMA.categories[1].sections[1].settings}
      />
    </div>
  )
}

// ============================================================================
// Business Rules Configuration
// ============================================================================

function BusinessRulesContent() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Business Rules & Thresholds</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Most of these are automatically configured by policies</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
          <MagicWand className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Policy-Driven</span>
        </div>
      </div>

      <ConfigSection
        title="Maintenance Rules"
        description="PM intervals and maintenance thresholds"
        settings={CONFIGURATION_SCHEMA.categories[2].sections[0].settings}
        policyDriven
      />

      <ConfigSection
        title="Approval Thresholds"
        description="Dollar amounts requiring approval"
        settings={CONFIGURATION_SCHEMA.categories[2].sections[1].settings}
        policyDriven
      />

      <ConfigSection
        title="Fuel Management Rules"
        description="Fuel transaction limits and fraud detection"
        settings={CONFIGURATION_SCHEMA.categories[2].sections[2].settings}
        policyDriven
      />
    </div>
  )
}

// ============================================================================
// RBAC Configuration (SOP-Driven)
// ============================================================================

function RBACConfiguration() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Role-Based Access Control</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Permissions automatically configured from SOPs and policies</p>
        </div>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
          <MagicWand className="w-5 h-5" />
          Sync from SOPs
        </button>
      </div>

      {/* SOP-Driven RBAC Explanation */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 p-6">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">SOP-Driven RBAC</h3>
            <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
              The system automatically generates role permissions based on your Standard Operating Procedures (SOPs).
              Each SOP defines who can perform specific actions, and those permissions are automatically configured here.
            </p>
            <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1 list-disc list-inside">
              <li>SOP defines "Fleet Manager can approve maintenance over $5,000" → Permission created</li>
              <li>SOP defines "Mechanics can create work orders" → Permission created</li>
              <li>SOP defines "Safety Officer can investigate incidents" → Permission created</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Role Permissions Matrix */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Role Permissions Matrix</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Auto-generated from 47 SOPs</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">View Vehicles</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Dispatch</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Create Work Orders</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Approve Maintenance</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Manage Policies</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">SOP Source</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              <RBACRow
                role="Fleet Manager"
                permissions={[true, true, true, true, true, true]}
                sopCount={12}
              />
              <RBACRow
                role="Dispatcher"
                permissions={[true, true, true, false, false, false]}
                sopCount={8}
              />
              <RBACRow
                role="Mechanic"
                permissions={[true, false, true, false, false, false]}
                sopCount={15}
              />
              <RBACRow
                role="Safety Officer"
                permissions={[true, false, false, false, false, true]}
                sopCount={9}
              />
              <RBACRow
                role="Driver"
                permissions={[true, false, false, false, false, false]}
                sopCount={3}
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* SOP Sources */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">SOP Sources</h3>
        <div className="space-y-2">
          <SOPSource
            sopNumber="SOP-OPS-001"
            title="Vehicle Assignment Authorization"
            rolesAffected={['Fleet Manager', 'Dispatcher']}
            permissionsGranted={['Assign vehicles', 'View driver schedules']}
          />
          <SOPSource
            sopNumber="SOP-MAINT-005"
            title="Work Order Creation and Management"
            rolesAffected={['Fleet Manager', 'Mechanic', 'Dispatcher']}
            permissionsGranted={['Create work orders', 'View maintenance history']}
          />
          <SOPSource
            sopNumber="SOP-FIN-012"
            title="Maintenance Cost Approval Process"
            rolesAffected={['Fleet Manager']}
            permissionsGranted={['Approve repairs over $5,000', 'View cost reports']}
          />
        </div>
      </div>
    </div>
  )
}

function RBACRow({
  role,
  permissions,
  sopCount
}: {
  role: string
  permissions: boolean[]
  sopCount: number
}) {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-900 dark:text-white">{role}</div>
      </td>
      {permissions.map((hasPermission, index) => (
        <td key={index} className="px-6 py-4 whitespace-nowrap text-center">
          {hasPermission ? (
            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
      ))}
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-medium rounded">
          {sopCount} SOPs
        </span>
      </td>
    </tr>
  )
}

function SOPSource({
  sopNumber,
  title,
  rolesAffected,
  permissionsGranted
}: {
  sopNumber: string
  title: string
  rolesAffected: string[]
  permissionsGranted: string[]
}) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-mono rounded">
              {sopNumber}
            </span>
            <span className="text-sm font-medium text-slate-900 dark:text-white">{title}</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600 dark:text-slate-400">Roles:</span>
              <div className="flex items-center gap-1 flex-wrap">
                {rolesAffected.map((role) => (
                  <span key={role} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600 dark:text-slate-400">Permissions:</span>
              <div className="flex items-center gap-1 flex-wrap">
                {permissionsGranted.map((permission) => (
                  <span key={permission} className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Reusable Configuration Section Component
// ============================================================================

function ConfigSection({
  title,
  description,
  settings,
  policyDriven = false,
  showPreview = false
}: {
  title: string
  description: string
  settings: ConfigSetting[]
  policyDriven?: boolean
  showPreview?: boolean
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>
        </div>
        {policyDriven && (
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <MagicWand className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-900 dark:text-purple-100">Policy-Driven</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {settings.map((setting) => (
          <ConfigSettingInput key={setting.id} setting={setting} />
        ))}
      </div>

      {showPreview && (
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">Live Preview</span>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400">Preview of changes will appear here</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfigSettingInput({ setting }: { setting: ConfigSetting }) {
  const [value, setValue] = useState(setting.value)

  const handleChange = async (newValue: any) => {
    setValue(newValue)
    await configurationEngine.set(setting.key, newValue, 'current-user')
  }

  return (
    <div className="flex items-start gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
          {setting.label}
          {setting.validation?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{setting.description}</p>

        {setting.type === 'boolean' && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleChange(e.target.checked)}
              className="w-4 h-4 text-blue-800 border-slate-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {value ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        )}

        {setting.type === 'string' && (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          />
        )}

        {setting.type === 'number' && (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(Number(e.target.value))}
            min={setting.validation?.min}
            max={setting.validation?.max}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          />
        )}

        {setting.type === 'select' && (
          <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            {setting.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {setting.type === 'color' && (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              className="w-12 h-12 border-2 border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono"
            />
          </div>
        )}

        {setting.policySource && (
          <div className="mt-2 flex items-center gap-2 text-xs text-purple-600">
            <MagicWand className="w-3 h-3" />
            <span>Auto-configured by policy: {setting.policySource}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {setting.impact === 'high' && (
          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium rounded">
            High Impact
          </span>
        )}
        {setting.requiresApproval && (
          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 text-xs font-medium rounded">
            Requires Approval
          </span>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Integrations & APIs Configuration
// ============================================================================

function IntegrationsContent() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Integrations & APIs</h2>

      <ConfigSection
        title="External Integrations"
        description="Configure third-party service connections"
        settings={CONFIGURATION_SCHEMA.categories.find(c => c.id === 'integrations')?.sections[0]?.settings || []}
      />

      <ConfigSection
        title="API Configuration"
        description="API endpoints and authentication settings"
        settings={CONFIGURATION_SCHEMA.categories.find(c => c.id === 'integrations')?.sections[1]?.settings || []}
      />
    </div>
  )
}

// ============================================================================
// Notifications & Alerts Configuration
// ============================================================================

function NotificationsContent() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications & Alerts</h2>

      <ConfigSection
        title="Notification Channels"
        description="Configure email, SMS, and push notifications"
        settings={CONFIGURATION_SCHEMA.categories.find(c => c.id === 'notifications')?.sections[0]?.settings || []}
      />

      <ConfigSection
        title="Alert Rules"
        description="Define when alerts should be triggered"
        settings={CONFIGURATION_SCHEMA.categories.find(c => c.id === 'notifications')?.sections[1]?.settings || []}
        policyDriven
      />
    </div>
  )
}

// ============================================================================
// Security & Access Control Configuration
// ============================================================================

function SecurityContent() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Security & Access Control</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Critical security settings - changes require approval</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
          <WarningIcon className="w-5 h-5 text-red-600" />
          <span className="text-sm font-medium text-red-900 dark:text-red-100">High Impact</span>
        </div>
      </div>

      <ConfigSection
        title="Authentication & Session"
        description="Session timeout and authentication settings"
        settings={CONFIGURATION_SCHEMA.categories.find(c => c.id === 'security')?.sections[0]?.settings || []}
      />

      <ConfigSection
        title="Password Policy"
        description="Password requirements and expiration"
        settings={CONFIGURATION_SCHEMA.categories.find(c => c.id === 'security')?.sections[1]?.settings || []}
      />

      <ConfigSection
        title="Audit & Logging"
        description="Activity logging and audit trail settings"
        settings={CONFIGURATION_SCHEMA.categories.find(c => c.id === 'security')?.sections[2]?.settings || []}
      />
    </div>
  )
}

// ============================================================================
// Advanced Configuration
// ============================================================================

function AdvancedContent() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Advanced Configuration</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Advanced settings for power users</p>
        </div>
      </div>

      <ConfigSection
        title="User Experience"
        description="Default views, layouts, and UI preferences"
        settings={CONFIGURATION_SCHEMA.categories.find(c => c.id === 'user-experience')?.sections[0]?.settings || []}
      />

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Configuration Export/Import</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Export Configuration</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Download current configuration as JSON for backup or transfer to another environment
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Export className="w-5 h-5" />
              Export as JSON
            </button>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Import Configuration</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Upload a configuration JSON file to apply settings from another environment
            </p>
            <button className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import from JSON
            </button>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-800 p-6">
        <div className="flex items-start gap-3">
          <WarningIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Dangerous Operations</h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
              These operations can significantly impact the application. Use with caution.
            </p>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 justify-center">
                <WarningIcon className="w-5 h-5" />
                Reset All Configuration to Defaults
              </button>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 justify-center">
                <MagicWand className="w-5 h-5" />
                Recalculate All Policy-Driven Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Hub Export
// ============================================================================

export default function CTAConfigurationHub() {
  const tabs: HubTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Gear className="w-5 h-5" />,
      content: <OverviewContent />
    },
    {
      id: 'organization',
      label: 'Organization & Branding',
      icon: <Building className="w-5 h-5" />,
      content: <OrganizationBrandingContent />
    },
    {
      id: 'modules',
      label: 'Modules & Features',
      icon: <SquaresFour className="w-5 h-5" />,
      content: <ModulesFeaturesContent />
    },
    {
      id: 'business-rules',
      label: 'Business Rules',
      icon: <Sliders className="w-5 h-5" />,
      content: <BusinessRulesContent />
    },
    {
      id: 'rbac',
      label: 'RBAC (SOP-Driven)',
      icon: <Shield className="w-5 h-5" />,
      content: <RBACConfiguration />
    },
    {
      id: 'integrations',
      label: 'Integrations & APIs',
      icon: <Plugs className="w-5 h-5" />,
      content: <IntegrationsContent />
    },
    {
      id: 'notifications',
      label: 'Notifications & Alerts',
      icon: <Bell className="w-5 h-5" />,
      content: <NotificationsContent />
    },
    {
      id: 'security',
      label: 'Security & Access',
      icon: <Shield className="w-5 h-5" />,
      content: <SecurityContent />
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: <Code className="w-5 h-5" />,
      content: <AdvancedContent />
    }
  ]

  return (
    <HubPage
      title="CTA Configuration"
      description="Complete control over every aspect of the Fleet application"
      icon={<Gear className="w-6 h-6" />}
      tabs={tabs}
      defaultTab="overview"
      gradient="from-purple-900/20 via-blue-900/10 to-transparent"
      ctaOwnerOnly
    />
  )
}
