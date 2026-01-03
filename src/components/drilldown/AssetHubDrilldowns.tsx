/**
 * AssetHubDrilldowns - Comprehensive asset drilldown components
 * Covers Assets, Equipment, and Inventory from AssetsHub
 */

import {
  Package,
  Wrench,
  DollarSign,
  Activity,
  Clock,
  AlertCircle,
  BarChart3,
} from 'lucide-react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { swrFetcher } from '@/lib/fetcher'

const fetcher = swrFetcher

// ============================================
// Asset Detail Panel
// ============================================
interface AssetDetailPanelProps {
  assetId: string
}

export function AssetDetailPanel({ assetId }: AssetDetailPanelProps) {
  const { push } = useDrilldown()
  const { data: asset, error, isLoading, mutate } = useSWR(
    `/api/assets/${assetId}`,
    fetcher
  )

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {asset && (
        <div className="space-y-6">
          {/* Asset Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{asset.name}</h3>
              <p className="text-sm text-muted-foreground">
                Asset #{asset.asset_number}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                  {asset.status}
                </Badge>
                <Badge variant="outline">{asset.category}</Badge>
              </div>
            </div>
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Current Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${asset.current_value?.toLocaleString() || '0'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Condition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{asset.condition_score || 0}%</div>
                <Progress value={asset.condition_score || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="value">Value</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Asset Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium">{asset.category || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">{asset.type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Manufacturer</p>
                      <p className="font-medium">{asset.manufacturer || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Model</p>
                      <p className="font-medium">{asset.model || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Serial Number</p>
                      <p className="font-medium">{asset.serial_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Acquisition Date</p>
                      <p className="font-medium">
                        {asset.acquisition_date
                          ? new Date(asset.acquisition_date).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Last Service: {asset.last_service_date || 'Never'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Next Service Due: {asset.next_service_date || 'Not scheduled'}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() =>
                      push({
                        id: `asset-maintenance-${assetId}`,
                        type: 'asset-maintenance',
                        label: 'Maintenance Records',
                        data: { assetId, assetName: asset.name },
                      })
                    }
                  >
                    View All Records
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Assignment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Currently Assigned To: {asset.assigned_to || 'Unassigned'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Department: {asset.department || 'N/A'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Location History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Current Location: {asset.current_location || 'Unknown'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="value" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Value & Depreciation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Purchase Price</p>
                      <p className="text-xl font-bold">
                        ${asset.purchase_price?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Value</p>
                      <p className="text-xl font-bold">
                        ${asset.current_value?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Depreciation</p>
                      <p className="text-xl font-bold text-destructive">
                        -${(asset.purchase_price - asset.current_value)?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Depreciation Rate</p>
                      <p className="text-xl font-bold">
                        {asset.depreciation_rate || 0}%/yr
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DrilldownContent>
  )
}

// ============================================
// Equipment Detail Panel
// ============================================
interface EquipmentDetailPanelProps {
  equipmentId: string
}

export function EquipmentDetailPanel({ equipmentId }: EquipmentDetailPanelProps) {
  const { push } = useDrilldown()
  const { data: equipment, error, isLoading, mutate } = useSWR(
    `/api/equipment/${equipmentId}`,
    fetcher
  )

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {equipment && (
        <div className="space-y-6">
          {/* Equipment Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{equipment.name}</h3>
              <p className="text-sm text-muted-foreground">
                {equipment.category} Equipment
              </p>
              <Badge variant={equipment.status === 'operational' ? 'default' : 'destructive'}>
                {equipment.status}
              </Badge>
            </div>
            <Wrench className="h-12 w-12 text-muted-foreground" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Operating Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {equipment.operating_hours?.toLocaleString() || '0'} hrs
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{equipment.utilization || 0}%</div>
                <Progress value={equipment.utilization || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="operators">Operators</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="service">Service</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Equipment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">{equipment.type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Manufacturer</p>
                      <p className="font-medium">{equipment.manufacturer || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Model</p>
                      <p className="font-medium">{equipment.model || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Serial</p>
                      <p className="font-medium">{equipment.serial_number || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="operators" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Operator History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Current Operator: {equipment.current_operator || 'None'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Total Operators: {equipment.total_operators || 0}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Hours This Month</p>
                      <p className="text-xl font-bold">
                        {equipment.hours_this_month || 0} hrs
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Daily Usage</p>
                      <p className="text-xl font-bold">
                        {equipment.avg_daily_usage || 0} hrs
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="service" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Service Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Last Service: {equipment.last_service || 'Never'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Next Service: {equipment.next_service || 'Not scheduled'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DrilldownContent>
  )
}

// ============================================
// Inventory Item Detail Panel
// ============================================
interface InventoryItemDetailPanelProps {
  itemId: string
}

export function InventoryItemDetailPanel({ itemId }: InventoryItemDetailPanelProps) {
  const { push } = useDrilldown()
  const { data: item, error, isLoading, mutate } = useSWR(
    `/api/inventory/${itemId}`,
    fetcher
  )

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {item && (
        <div className="space-y-6">
          {/* Item Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{item.name}</h3>
              <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
              <Badge
                variant={
                  item.quantity > item.reorder_point ? 'default' : 'destructive'
                }
              >
                {item.quantity > item.reorder_point ? 'In Stock' : 'Low Stock'}
              </Badge>
            </div>
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Quantity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.quantity || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Reorder at: {item.reorder_point || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Unit Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${item.unit_cost?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Value: ${((item.quantity || 0) * (item.unit_cost || 0)).toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="reorders">Reorders</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Item Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium">{item.category || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Supplier</p>
                      <p className="font-medium">{item.supplier || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lead Time</p>
                      <p className="font-medium">{item.lead_time_days || 0} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Min Order Qty</p>
                      <p className="font-medium">{item.min_order_qty || 1}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Usage History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Used This Month: {item.used_this_month || 0} units
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Avg Monthly Usage: {item.avg_monthly_usage || 0} units
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reorders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Reorder History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Last Ordered: {item.last_order_date || 'Never'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Total Orders: {item.total_orders || 0}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="locations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Stock Locations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Primary Location: {item.primary_location || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Total Locations: {item.total_locations || 1}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DrilldownContent>
  )
}

// ============================================
// Asset List View
// ============================================
interface AssetListViewProps {
  filter?: 'all' | 'active' | 'inactive' | 'maintenance' | 'surplus' | 'high-value' | 'low-value' | 'critical'
}

export function AssetListView({ filter = 'all' }: AssetListViewProps) {
  const { push } = useDrilldown()
  const { data: assets, error, isLoading } = useSWR(
    `/api/assets?filter=${filter}`,
    fetcher
  )

  const filterLabels = {
    all: 'All Assets',
    active: 'Active Assets',
    inactive: 'Inactive Assets',
    maintenance: 'In Maintenance',
    surplus: 'Surplus Assets',
    'high-value': 'High Value Assets',
    'low-value': 'Low Value Assets',
    critical: 'Critical Assets',
  }

  return (
    <DrilldownContent loading={isLoading} error={error}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold">{filterLabels[filter]}</h3>
          <Badge>{assets?.length || 0} assets</Badge>
        </div>

        <div className="space-y-2">
          {assets?.map((asset: any) => (
            <Card
              key={asset.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() =>
                push({
                  id: `asset-${asset.id}`,
                  type: 'asset-detail',
                  label: asset.name,
                  data: { assetId: asset.id },
                })
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {asset.category} • Asset #{asset.asset_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                      {asset.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      ${asset.current_value?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DrilldownContent>
  )
}

// ============================================
// Equipment List View
// ============================================
interface EquipmentListViewProps {
  category?: 'heavy' | 'light' | 'specialized' | 'tools'
}

export function EquipmentListView({ category }: EquipmentListViewProps) {
  const { push } = useDrilldown()
  const { data: equipment, error, isLoading } = useSWR(
    category ? `/api/equipment?category=${category}` : '/api/equipment',
    fetcher
  )

  const categoryLabels = {
    heavy: 'Heavy Equipment',
    light: 'Light Equipment',
    specialized: 'Specialized Equipment',
    tools: 'Tools & Small Equipment',
  }

  return (
    <DrilldownContent loading={isLoading} error={error}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold">
            {category ? categoryLabels[category] : 'All Equipment'}
          </h3>
          <Badge>{equipment?.length || 0} items</Badge>
        </div>

        <div className="space-y-2">
          {equipment?.map((item: any) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() =>
                push({
                  id: `equipment-${item.id}`,
                  type: 'equipment-detail',
                  label: item.name,
                  data: { equipmentId: item.id },
                })
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.manufacturer} {item.model}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={item.status === 'operational' ? 'default' : 'destructive'}>
                      {item.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.operating_hours} hrs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DrilldownContent>
  )
}

// ============================================
// Inventory List View
// ============================================
interface InventoryListViewProps {
  filter?: 'all' | 'low-stock' | 'out-of-stock' | 'high-value'
}

export function InventoryListView({ filter = 'all' }: InventoryListViewProps) {
  const { push } = useDrilldown()
  const { data: items, error, isLoading } = useSWR(
    `/api/inventory?filter=${filter}`,
    fetcher
  )

  const filterLabels = {
    all: 'All Inventory Items',
    'low-stock': 'Low Stock Items',
    'out-of-stock': 'Out of Stock',
    'high-value': 'High Value Items',
  }

  return (
    <DrilldownContent loading={isLoading} error={error}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold">{filterLabels[filter]}</h3>
          <Badge>{items?.length || 0} items</Badge>
        </div>

        <div className="space-y-2">
          {items?.map((item: any) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() =>
                push({
                  id: `inventory-${item.id}`,
                  type: 'inventory-item-detail',
                  label: item.name,
                  data: { itemId: item.id },
                })
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">Qty: {item.quantity}</p>
                    {item.quantity <= item.reorder_point && (
                      <Badge variant="destructive" className="mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Low Stock
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DrilldownContent>
  )
}
