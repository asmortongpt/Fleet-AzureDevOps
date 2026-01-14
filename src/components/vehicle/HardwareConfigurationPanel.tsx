/**
 * HardwareConfigurationPanel - Vehicle hardware provider configuration UI
 *
 * Allows fleet managers to configure which hardware providers (Smartcar, Samsara, OBD2, Teltonika)
 * each vehicle uses. Supports adding, removing, testing, and managing provider configurations.
 */

import React, { useState, useEffect } from 'react'
import {
  Cpu,
  Wifi,
  WifiOff,
  Settings,
  Trash2,
  Plus,
  TestTube2,
  ChevronDown,
  ChevronUp,
  Radio,
  Car,
  Smartphone,
  AlertCircle,
  Check,
  Loader2,
  ExternalLink
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface HardwareConfigurationPanelProps {
  vehicleId: number
  onProviderAdded?: (provider: string) => void
  onProviderRemoved?: (provider: string) => void
}

type ProviderType = 'smartcar' | 'samsara' | 'teltonika' | 'obd2'
type ConnectionStatus = 'online' | 'offline' | 'connected' | 'error'

interface HardwareProvider {
  id: string
  type: ProviderType
  status: ConnectionStatus
  capabilities: string[]
  configuration: Record<string, any>
  lastSyncTime?: string
  deviceModel?: string
  externalId?: string
}

interface ProviderConfig {
  // Smartcar
  smartcarConnected?: boolean

  // Samsara
  samsaraApiToken?: string
  samsaraExternalVehicleId?: string

  // Teltonika
  teltonikaImei?: string
  teltonikaDeviceModel?: 'FM1120' | 'FM3200' | 'FM4200' | 'FM5300'
  teltonikaEnableRfid?: boolean
  teltonikaEnableStarterDisable?: boolean

  // OBD2 Mobile
  obd2PairingInstructions?: boolean
}

// ============================================================================
// Provider Configuration
// ============================================================================

const PROVIDER_INFO = {
  smartcar: {
    name: 'Smartcar',
    icon: Car,
    color: 'text-blue-800',
    bgColor: 'bg-blue-500/10',
    description: 'Connect via Smartcar OAuth for OEM telematics'
  },
  samsara: {
    name: 'Samsara',
    icon: Cpu,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'Connect to Samsara fleet management platform'
  },
  teltonika: {
    name: 'Teltonika',
    icon: Radio,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    description: 'Connect Teltonika GPS tracking devices'
  },
  obd2: {
    name: 'OBD2 Mobile',
    icon: Smartphone,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    description: 'Pair via OBD2 mobile application'
  }
}

const TELTONIKA_MODELS = [
  { value: 'FM1120', label: 'FM1120 - Basic GPS Tracker' },
  { value: 'FM3200', label: 'FM3200 - Advanced GPS with CAN' },
  { value: 'FM4200', label: 'FM4200 - Professional Fleet Tracker' },
  { value: 'FM5300', label: 'FM5300 - Premium Fleet Management' }
]

// ============================================================================
// Provider Card Component
// ============================================================================

interface ProviderCardProps {
  provider: HardwareProvider
  onTest: () => void
  onRemove: () => void
  onConfigure: () => void
  isTestingConnection: boolean
}

const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onTest,
  onRemove,
  onConfigure,
  isTestingConnection
}) => {
  const [expanded, setExpanded] = useState(false)
  const info = PROVIDER_INFO[provider.type]
  const Icon = info.icon

  return (
    <Card className="transition-all duration-200 hover:shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-3 rounded-md', info.bgColor)}>
              <Icon className={cn('w-4 h-4', info.color)} />
            </div>
            <div>
              <CardTitle className="text-sm">{info.name}</CardTitle>
              {provider.deviceModel && (
                <CardDescription className="mt-1">
                  {provider.deviceModel}
                </CardDescription>
              )}
            </div>
          </div>
          <StatusBadge status={provider.status === 'error' ? 'offline' : provider.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Capabilities */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2">Capabilities</Label>
          <div className="flex flex-wrap gap-2">
            {provider.capabilities.map((capability) => (
              <Badge key={capability} variant="outline" className="text-xs">
                {capability}
              </Badge>
            ))}
          </div>
        </div>

        {/* Connection Details */}
        {provider.lastSyncTime && (
          <div className="text-sm text-muted-foreground">
            Last sync: {new Date(provider.lastSyncTime).toLocaleString()}
          </div>
        )}

        {/* External ID */}
        {provider.externalId && (
          <div className="text-sm">
            <span className="text-muted-foreground">External ID: </span>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {provider.externalId}
            </code>
          </div>
        )}

        {/* Expandable Configuration */}
        {expanded && (
          <div className="pt-2 border-t space-y-3">
            <div className="text-sm">
              <Label className="text-xs text-muted-foreground">Configuration</Label>
              <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                {JSON.stringify(provider.configuration, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onTest}
            disabled={isTestingConnection}
          >
            {isTestingConnection ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube2 className="w-4 h-4" />
                Test Connection
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onConfigure}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onRemove}
        >
          <Trash2 className="w-4 h-4" />
          Remove
        </Button>
      </CardFooter>
    </Card>
  )
}

// ============================================================================
// Add Provider Dialog Component
// ============================================================================

interface AddProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (type: ProviderType, config: ProviderConfig) => Promise<void>
  isAdding: boolean
}

const AddProviderDialog: React.FC<AddProviderDialogProps> = ({
  open,
  onOpenChange,
  onAdd,
  isAdding
}) => {
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | ''>('')
  const [config, setConfig] = useState<ProviderConfig>({})

  const handleAdd = async () => {
    if (!selectedProvider) return
    await onAdd(selectedProvider, config)
    // Reset form
    setSelectedProvider('')
    setConfig({})
  }

  const renderProviderForm = () => {
    switch (selectedProvider) {
      case 'smartcar':
        return (
          <div className="space-y-2">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-3 h-3 text-blue-800 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">OAuth Connection Required</p>
                  <p className="text-xs text-muted-foreground">
                    Click the button below to authorize this vehicle with Smartcar.
                    You'll be redirected to Smartcar's authorization page.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <ExternalLink className="w-4 h-4" />
                    Connect to Smartcar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'samsara':
        return (
          <div className="space-y-2">
            <div>
              <Label htmlFor="samsara-token">API Token</Label>
              <Input
                id="samsara-token"
                type="password"
                placeholder="Enter Samsara API token"
                value={config.samsaraApiToken || ''}
                onChange={(e) => setConfig({ ...config, samsaraApiToken: e.target.value })}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get your API token from Samsara Dashboard → Settings → API Tokens
              </p>
            </div>
            <div>
              <Label htmlFor="samsara-external-id">External Vehicle ID</Label>
              <Input
                id="samsara-external-id"
                placeholder="e.g., 281832"
                value={config.samsaraExternalVehicleId || ''}
                onChange={(e) => setConfig({ ...config, samsaraExternalVehicleId: e.target.value })}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The vehicle ID from your Samsara fleet
              </p>
            </div>
          </div>
        )

      case 'teltonika':
        return (
          <div className="space-y-2">
            <div>
              <Label htmlFor="teltonika-imei">IMEI Number</Label>
              <Input
                id="teltonika-imei"
                placeholder="e.g., 123456789012345"
                value={config.teltonikaImei || ''}
                onChange={(e) => setConfig({ ...config, teltonikaImei: e.target.value })}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                15-digit IMEI number found on the device
              </p>
            </div>
            <div>
              <Label htmlFor="teltonika-model">Device Model</Label>
              <Select
                value={config.teltonikaDeviceModel || ''}
                onValueChange={(value) => setConfig({ ...config, teltonikaDeviceModel: value as any })}
              >
                <SelectTrigger id="teltonika-model" className="mt-2">
                  <SelectValue placeholder="Select device model" />
                </SelectTrigger>
                <SelectContent>
                  {TELTONIKA_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="teltonika-rfid"
                  checked={config.teltonikaEnableRfid || false}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, teltonikaEnableRfid: checked as boolean })
                  }
                />
                <Label htmlFor="teltonika-rfid" className="cursor-pointer">
                  Enable RFID Reader
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="teltonika-starter"
                  checked={config.teltonikaEnableStarterDisable || false}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, teltonikaEnableStarterDisable: checked as boolean })
                  }
                />
                <Label htmlFor="teltonika-starter" className="cursor-pointer">
                  Enable Starter Disable
                </Label>
              </div>
            </div>
          </div>
        )

      case 'obd2':
        return (
          <div className="space-y-2">
            <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Smartphone className="w-3 h-3 text-orange-500 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Mobile App Pairing Required</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>1. Download the OBD2 Fleet app from your app store</p>
                    <p>2. Plug the OBD2 adapter into the vehicle's diagnostic port</p>
                    <p>3. Open the app and follow the pairing wizard</p>
                    <p>4. Enter this vehicle ID when prompted: <code className="bg-muted px-1 py-0.5 rounded">VEH-{Math.random().toString(36).substring(7).toUpperCase()}</code></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Hardware Provider</DialogTitle>
          <DialogDescription>
            Configure a new hardware provider for this vehicle
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {/* Provider Type Selection */}
          <div>
            <Label htmlFor="provider-type">Provider Type</Label>
            <Select
              value={selectedProvider}
              onValueChange={(value) => {
                setSelectedProvider(value as ProviderType)
                setConfig({}) // Reset config when provider changes
              }}
            >
              <SelectTrigger id="provider-type" className="mt-2">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <info.icon className={cn('w-4 h-4', info.color)} />
                      <span>{info.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProvider && (
              <p className="text-xs text-muted-foreground mt-2">
                {PROVIDER_INFO[selectedProvider].description}
              </p>
            )}
          </div>

          {/* Provider-Specific Form */}
          {selectedProvider && renderProviderForm()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedProvider || isAdding}>
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Provider
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export const HardwareConfigurationPanel: React.FC<HardwareConfigurationPanelProps> = ({
  vehicleId,
  onProviderAdded,
  onProviderRemoved
}) => {
  const [providers, setProviders] = useState<HardwareProvider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null)
  const [providerToRemove, setProviderToRemove] = useState<string | null>(null)

  // Fetch providers on mount
  useEffect(() => {
    fetchProviders()
  }, [vehicleId])

  const fetchProviders = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/hardware-config`)
      if (!response.ok) {
        throw new Error(`Failed to fetch providers: ${response.statusText}`)
      }
      const data = await response.json()
      setProviders(data.providers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers')
      console.error('Error fetching providers:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProvider = async (type: ProviderType, config: ProviderConfig) => {
    setIsAdding(true)
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/hardware-config/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, configuration: config })
      })

      if (!response.ok) {
        throw new Error(`Failed to add provider: ${response.statusText}`)
      }

      const data = await response.json()
      setProviders([...providers, data.provider])
      setIsAddDialogOpen(false)
      onProviderAdded?.(type)
    } catch (err) {
      console.error('Error adding provider:', err)
      alert(err instanceof Error ? err.message : 'Failed to add provider')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveProvider = async (providerId: string) => {
    try {
      const response = await fetch(
        `/api/vehicles/${vehicleId}/hardware-config/providers/${providerId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error(`Failed to remove provider: ${response.statusText}`)
      }

      const removedProvider = providers.find(p => p.id === providerId)
      setProviders(providers.filter(p => p.id !== providerId))
      setProviderToRemove(null)
      onProviderRemoved?.(removedProvider?.type || '')
    } catch (err) {
      console.error('Error removing provider:', err)
      alert(err instanceof Error ? err.message : 'Failed to remove provider')
    }
  }

  const handleTestConnection = async (providerId: string) => {
    setTestingConnectionId(providerId)
    try {
      const response = await fetch(
        `/api/vehicles/${vehicleId}/hardware-config/providers/${providerId}/test`,
        { method: 'POST' }
      )

      const data = await response.json()

      if (data.success) {
        alert('Connection test successful!')
        // Update provider status
        setProviders(providers.map(p =>
          p.id === providerId ? { ...p, status: 'online' } : p
        ))
      } else {
        alert(`Connection test failed: ${data.message}`)
        setProviders(providers.map(p =>
          p.id === providerId ? { ...p, status: 'error' } : p
        ))
      }
    } catch (err) {
      console.error('Error testing connection:', err)
      alert('Connection test failed')
    } finally {
      setTestingConnectionId(null)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex items-center gap-3 p-3">
          <AlertCircle className="w-3 h-3 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Error loading providers</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProviders} className="ml-auto">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Hardware Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage hardware providers for this vehicle
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Provider
        </Button>
      </div>

      {/* Providers List */}
      {providers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
              <Cpu className="w-4 h-4 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium mb-2">No providers configured</h3>
            <p className="text-sm text-muted-foreground text-center mb-2">
              Add a hardware provider to start collecting telemetry data from this vehicle
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Your First Provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onTest={() => handleTestConnection(provider.id)}
              onRemove={() => setProviderToRemove(provider.id)}
              onConfigure={() => {
                // TODO: Implement configuration dialog
                alert('Configuration dialog coming soon!')
              }}
              isTestingConnection={testingConnectionId === provider.id}
            />
          ))}
        </div>
      )}

      {/* Add Provider Dialog */}
      <AddProviderDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddProvider}
        isAdding={isAdding}
      />

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        open={!!providerToRemove}
        onOpenChange={(open) => !open && setProviderToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Hardware Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this provider? This will stop data collection
              from this hardware device. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => providerToRemove && handleRemoveProvider(providerToRemove)}
              className={cn('bg-destructive text-destructive-foreground hover:bg-destructive/90')}
            >
              Remove Provider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default HardwareConfigurationPanel
