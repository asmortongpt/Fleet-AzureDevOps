/**
 * CONFIGURATION HUB
 *
 * CTA Owner-only configuration management interface
 * Provides complete system configurability with Policy Hub integration
 */

import {
  Settings,
  Shield,
  Palette,
  Plug,
  Bell,
  Workflow,
  FileText,
  Eye,
  Database,
  Brain,
  BarChart3,
  History,
  Save,
  RotateCcw,
  Download,
  Search,
  Filter,
  ChevronRight,
  Lock
} from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { HubPage } from '../components/ui/hub-page'
import { Input } from '../components/ui/input'
import { StatCard } from '../components/ui/stat-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useToast } from '../hooks/useToast'

// ============================================================================
// TYPES
// ============================================================================

interface ConfigItem {
  id: string
  category: string
  key: string
  label: string
  description: string
  type: 'string' | 'number' | 'boolean' | 'enum' | 'color' | 'url' | 'email'
  value: any
  defaultValue: any
  requiresCTAOwner: boolean
  sensitive?: boolean
  validation?: {
    required?: boolean
    min?: number
    max?: number
    options?: Array<{ label: string; value: any; description?: string }>
  }
  lastModified?: string
  modifiedBy?: string
  version?: number
}

interface ConfigChange {
  id: string
  configKey: string
  oldValue: any
  newValue: any
  changedBy: string
  changedAt: string
  reason?: string
  source: 'manual' | 'policy_engine' | 'initial_setup' | 'api'
  rollbackable: boolean
}

interface ConfigStats {
  totalConfigs: number
  byCategory: Record<string, number>
  ctaOwnerOnly: number
  recentChanges: number
  changesBySource: Record<string, number>
}

// ============================================================================
// CATEGORY METADATA
// ============================================================================

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  system: Settings,
  branding: Palette,
  security: Shield,
  features: Plug,
  integrations: Plug,
  notifications: Bell,
  workflows: Workflow,
  policies: FileText,
  'ui-ux': Eye,
  'data-retention': Database,
  'ai-services': Brain,
  reporting: BarChart3
}

const CATEGORY_COLORS: Record<string, string> = {
  system: 'text-blue-600 bg-blue-50 border-blue-200',
  branding: 'text-purple-600 bg-purple-50 border-purple-200',
  security: 'text-red-600 bg-red-50 border-red-200',
  features: 'text-green-600 bg-green-50 border-green-200',
  integrations: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  notifications: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  workflows: 'text-orange-600 bg-orange-50 border-orange-200',
  policies: 'text-teal-600 bg-teal-50 border-teal-200',
  'ui-ux': 'text-pink-600 bg-pink-50 border-pink-200',
  'data-retention': 'text-gray-600 bg-gray-50 border-gray-200',
  'ai-services': 'text-cyan-600 bg-cyan-50 border-cyan-200',
  reporting: 'text-emerald-600 bg-emerald-50 border-emerald-200'
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConfigurationHub() {
  const navigate = useNavigate()
  const { addToast } = useToast()

  // State
  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [changes, setChanges] = useState<ConfigChange[]>([])
  const [stats, setStats] = useState<ConfigStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingConfig, setEditingConfig] = useState<ConfigItem | null>(null)
  const [editValue, setEditValue] = useState<any>(null)

  // Fetch configurations
  useEffect(() => {
    fetchConfigurations()
    fetchChangeHistory()
    fetchStats()
  }, [selectedCategory])

  const fetchConfigurations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }

      const response = await fetch(`/api/admin/config?${params}`, {
        headers: {
          'x-user-role': 'CTA_OWNER' // TODO: Get from auth context
        }
      })

      if (!response.ok) throw new Error('Failed to fetch configurations')

      const data = await response.json()
      setConfigs(data.data.configs)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load configurations',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchChangeHistory = async () => {
    try {
      const response = await fetch('/api/admin/config/history?limit=20', {
        headers: { 'x-user-role': 'CTA_OWNER' }
      })

      if (!response.ok) throw new Error('Failed to fetch change history')

      const data = await response.json()
      setChanges(data.data.changes)
    } catch (error) {
      console.error('Failed to load change history:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/config/stats', {
        headers: { 'x-user-role': 'CTA_OWNER' }
      })

      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      setStats(data.data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleUpdateConfig = async () => {
    if (!editingConfig) return

    try {
      const response = await fetch(`/api/admin/config/${editingConfig.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'CTA_OWNER',
          'x-user-id': 'current-user@example.com' // TODO: Get from auth context
        },
        body: JSON.stringify({
          value: editValue,
          reason: 'Manual update via Configuration Hub'
        })
      })

      if (!response.ok) throw new Error('Failed to update configuration')

      const data = await response.json()

      toast({
        title: 'Success',
        description: data.message
      })

      setEditingConfig(null)
      setEditValue(null)
      fetchConfigurations()
      fetchChangeHistory()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update configuration',
        variant: 'destructive'
      })
    }
  }

  const handleRollback = async (changeId: string) => {
    try {
      const response = await fetch(`/api/admin/config/${changeId}/rollback`, {
        method: 'POST',
        headers: {
          'x-user-role': 'CTA_OWNER',
          'x-user-id': 'current-user@example.com'
        }
      })

      if (!response.ok) throw new Error('Failed to rollback')

      const data = await response.json()

      toast({
        title: 'Success',
        description: data.message
      })

      fetchConfigurations()
      fetchChangeHistory()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to rollback configuration',
        variant: 'destructive'
      })
    }
  }

  const handleExportConfig = async () => {
    try {
      const response = await fetch('/api/admin/config/export', {
        headers: { 'x-user-role': 'CTA_OWNER' }
      })

      if (!response.ok) throw new Error('Failed to export')

      const data = await response.json()

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `configuration-export-${new Date().toISOString()}.json`
      a.click()

      toast({
        title: 'Success',
        description: 'Configuration exported successfully'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to export configuration',
        variant: 'destructive'
      })
    }
  }

  // Filter configurations by search
  const filteredConfigs = configs.filter(config =>
    config.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    config.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    config.key.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group by category
  const configsByCategory = filteredConfigs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = []
    }
    acc[config.category].push(config)
    return acc
  }, {} as Record<string, ConfigItem[]>)

  const categories = Object.keys(configsByCategory).sort()

  return (
    <HubPage
      title="Configuration Hub"
      description="Complete system configuration for CTA owners"
      icon={<Settings className="w-6 h-6" />}
    >
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Configurations"
          value={stats?.totalConfigs || 0}
          icon={<Settings className="w-6 h-6" />}
          trend="neutral"
        />
        <StatCard
          title="CTA Owner Only"
          value={stats?.ctaOwnerOnly || 0}
          icon={<Lock className="w-6 h-6" />}
          trend="neutral"
        />
        <StatCard
          title="Recent Changes"
          value={stats?.recentChanges || 0}
          icon={<History className="w-6 h-6" />}
          trend="neutral"
        />
        <StatCard
          title="Categories"
          value={stats ? Object.keys(stats.byCategory).length : 0}
          icon={<Filter className="w-6 h-6" />}
          trend="neutral"
        />
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search configurations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportConfig}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate('/admin/config/setup')}>
            <Settings className="h-4 w-4 mr-2" />
            Setup Wizard
          </Button>
        </div>
      </div>

      <Tabs defaultValue="configurations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="history">Change History</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
        </TabsList>

        {/* Configurations Tab */}
        <TabsContent value="configurations" className="space-y-6">
          {categories.map(category => {
            const Icon = CATEGORY_ICONS[category] || Settings
            const colorClass = CATEGORY_COLORS[category] || 'text-gray-600 bg-gray-50'

            return (
              <Card key={category}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="capitalize">{category.replace('-', ' ')}</CardTitle>
                        <CardDescription>
                          {configsByCategory[category].length} configuration{configsByCategory[category].length !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {configsByCategory[category].map(config => (
                      <ConfigItemRow
                        key={config.id}
                        config={config}
                        onEdit={(config) => {
                          setEditingConfig(config)
                          setEditValue(config.value)
                        }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {/* Change History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Changes</CardTitle>
              <CardDescription>Track all configuration modifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {changes.map(change => (
                  <ChangeHistoryRow
                    key={change.id}
                    change={change}
                    onRollback={handleRollback}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profiles Tab */}
        <TabsContent value="profiles">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Profiles</CardTitle>
              <CardDescription>Save and reuse configuration presets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Profile management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      {editingConfig && (
        <ConfigEditModal
          config={editingConfig}
          value={editValue}
          onChange={setEditValue}
          onSave={handleUpdateConfig}
          onCancel={() => {
            setEditingConfig(null)
            setEditValue(null)
          }}
        />
      )}
    </HubPage>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ConfigItemRowProps {
  config: ConfigItem
  onEdit: (config: ConfigItem) => void
}

function ConfigItemRow({ config, onEdit }: ConfigItemRowProps) {
  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return 'Not set'
    if (type === 'boolean') return value ? 'Enabled' : 'Disabled'
    if (type === 'color') return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border" style={{ backgroundColor: value }} />
        <span>{value}</span>
      </div>
    )
    if (config.sensitive) return '••••••••'
    return String(value)
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium">{config.label}</h4>
          {config.requiresCTAOwner && (
            <Badge variant="secondary" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              CTA Owner
            </Badge>
          )}
          {config.validation?.required && (
            <Badge variant="outline" className="text-xs">Required</Badge>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-2">{config.description}</p>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Value: {formatValue(config.value, config.type)}</span>
          {config.lastModified && (
            <span>Modified: {new Date(config.lastModified).toLocaleDateString()}</span>
          )}
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => onEdit(config)}>
        Edit
      </Button>
    </div>
  )
}

interface ChangeHistoryRowProps {
  change: ConfigChange
  onRollback: (changeId: string) => void
}

function ChangeHistoryRow({ change, onRollback }: ChangeHistoryRowProps) {
  const getSourceBadge = (source: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      manual: { label: 'Manual', variant: 'default' },
      policy_engine: { label: 'Policy', variant: 'secondary' },
      initial_setup: { label: 'Setup', variant: 'outline' },
      api: { label: 'API', variant: 'outline' }
    }
    const config = variants[source] || variants.manual
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium">{change.configKey}</h4>
          {getSourceBadge(change.source)}
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Changed by {change.changedBy} on {new Date(change.changedAt).toLocaleString()}
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Old: {String(change.oldValue)}</span>
          <ChevronRight className="h-3 w-3" />
          <span>New: {String(change.newValue)}</span>
        </div>
        {change.reason && (
          <p className="text-xs text-gray-500 mt-1 italic">Reason: {change.reason}</p>
        )}
      </div>
      {change.rollbackable && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRollback(change.id)}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Rollback
        </Button>
      )}
    </div>
  )
}

interface ConfigEditModalProps {
  config: ConfigItem
  value: any
  onChange: (value: any) => void
  onSave: () => void
  onCancel: () => void
}

function ConfigEditModal({ config, value, onChange, onSave, onCancel }: ConfigEditModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Edit Configuration</CardTitle>
          <CardDescription>{config.label}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">{config.description}</p>

            {config.type === 'boolean' && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  className="rounded"
                />
                <span>Enable {config.label}</span>
              </label>
            )}

            {config.type === 'string' && (
              <Input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={config.label}
              />
            )}

            {config.type === 'number' && (
              <Input
                type="number"
                value={value || 0}
                onChange={(e) => onChange(Number(e.target.value))}
                min={config.validation?.min}
                max={config.validation?.max}
              />
            )}

            {config.type === 'color' && (
              <Input
                type="color"
                value={value || '#000000'}
                onChange={(e) => onChange(e.target.value)}
              />
            )}

            {config.type === 'enum' && config.validation?.options && (
              <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full border rounded-md p-2"
              >
                {config.validation.options.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ConfigurationHub
