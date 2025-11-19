# Task 4.3: Key Code Snippets & Examples

## 1. MetricCard Component Usage

### Basic Metric Display
```tsx
<MetricCard
  label="Engine Hours"
  value={1250}
  unit="hrs"
  isPrimary={true}
  icon={<Timer className="h-4 w-4" />}
/>
```

### Primary vs Non-Primary Metrics
```tsx
{/* Primary Metric - Highlighted */}
<MetricCard
  label="PTO Hours"
  value={vehicle.pto_hours}
  unit="hrs"
  isPrimary={vehicle.primary_metric === 'PTO_HOURS'}
  icon={<Zap className="h-4 w-4" />}
/>

{/* Regular Metric */}
<MetricCard
  label="Aux Hours"
  value={vehicle.aux_hours}
  unit="hrs"
  isPrimary={false}
  icon={<Clock className="h-4 w-4" />}
/>
```

## 2. Asset Classification Section

```tsx
{/* Asset Classification */}
{(vehicle.asset_category || vehicle.asset_type || vehicle.power_type) && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Car className="h-5 w-5" />
        Asset Classification
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        {vehicle.asset_category && (
          <div>
            <p className="text-sm text-muted-foreground">Category</p>
            <p className="font-medium">
              {ASSET_CATEGORY_LABELS[vehicle.asset_category]}
            </p>
          </div>
        )}

        {vehicle.asset_type && (
          <div>
            <p className="text-sm text-muted-foreground">Type</p>
            <p className="font-medium">
              {ASSET_TYPE_LABELS[vehicle.asset_type]}
            </p>
          </div>
        )}

        {vehicle.power_type && (
          <div>
            <p className="text-sm text-muted-foreground">Power Type</p>
            <p className="font-medium">
              {POWER_TYPE_LABELS[vehicle.power_type]}
            </p>
          </div>
        )}

        {vehicle.operational_status && (
          <div>
            <p className="text-sm text-muted-foreground">Operational Status</p>
            <Badge variant={
              vehicle.operational_status === 'AVAILABLE' ? 'default' :
              vehicle.operational_status === 'IN_USE' ? 'secondary' :
              vehicle.operational_status === 'MAINTENANCE' ? 'destructive' :
              'outline'
            }>
              {OPERATIONAL_STATUS_LABELS[vehicle.operational_status]}
            </Badge>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)}
```

## 3. Multi-Metric Tracking Section

```tsx
{/* Multi-Metric Tracking */}
{(vehicle.primary_metric || vehicle.engine_hours ||
  vehicle.pto_hours || vehicle.aux_hours || vehicle.cycle_count) && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Activity className="h-5 w-5" />
        Usage Metrics
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

        {/* Odometer */}
        {(vehicle.odometer || vehicle.mileage) && (
          <MetricCard
            label="Odometer"
            value={vehicle.odometer || vehicle.mileage}
            unit="mi"
            isPrimary={vehicle.primary_metric === 'ODOMETER'}
            icon={<Gauge className="h-4 w-4" />}
          />
        )}

        {/* Engine Hours */}
        {vehicle.engine_hours !== undefined && vehicle.engine_hours > 0 && (
          <MetricCard
            label="Engine Hours"
            value={vehicle.engine_hours}
            unit="hrs"
            isPrimary={vehicle.primary_metric === 'ENGINE_HOURS'}
            icon={<Timer className="h-4 w-4" />}
          />
        )}

        {/* PTO Hours */}
        {vehicle.pto_hours !== undefined && vehicle.pto_hours > 0 && (
          <MetricCard
            label="PTO Hours"
            value={vehicle.pto_hours}
            unit="hrs"
            isPrimary={vehicle.primary_metric === 'PTO_HOURS'}
            icon={<Zap className="h-4 w-4" />}
          />
        )}

        {/* Auxiliary Hours */}
        {vehicle.aux_hours !== undefined && vehicle.aux_hours > 0 && (
          <MetricCard
            label="Aux Hours"
            value={vehicle.aux_hours}
            unit="hrs"
            isPrimary={vehicle.primary_metric === 'AUX_HOURS'}
            icon={<Clock className="h-4 w-4" />}
          />
        )}

        {/* Cycle Count */}
        {vehicle.cycle_count !== undefined && vehicle.cycle_count > 0 && (
          <MetricCard
            label="Cycles"
            value={vehicle.cycle_count}
            unit="cycles"
            isPrimary={vehicle.primary_metric === 'CYCLES'}
            icon={<RotateCw className="h-4 w-4" />}
          />
        )}
      </div>

      {vehicle.last_metric_update && (
        <p className="text-xs text-muted-foreground mt-4">
          Last updated: {new Date(vehicle.last_metric_update).toLocaleString()}
        </p>
      )}
    </CardContent>
  </Card>
)}
```

## 4. Equipment Specifications Section

```tsx
{/* Equipment Specifications (for HEAVY_EQUIPMENT) */}
{vehicle.asset_category === 'HEAVY_EQUIPMENT' &&
  (vehicle.capacity_tons || vehicle.lift_height_feet ||
   vehicle.max_reach_feet || vehicle.bucket_capacity_yards ||
   vehicle.operating_weight_lbs) && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        Equipment Specifications
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

        {vehicle.capacity_tons && (
          <div>
            <p className="text-sm text-muted-foreground">Capacity</p>
            <p className="font-medium text-lg">
              {vehicle.capacity_tons} <span className="text-sm">tons</span>
            </p>
          </div>
        )}

        {vehicle.lift_height_feet && (
          <div>
            <p className="text-sm text-muted-foreground">Lift Height</p>
            <p className="font-medium text-lg">
              {vehicle.lift_height_feet} <span className="text-sm">ft</span>
            </p>
          </div>
        )}

        {vehicle.max_reach_feet && (
          <div>
            <p className="text-sm text-muted-foreground">Max Reach</p>
            <p className="font-medium text-lg">
              {vehicle.max_reach_feet} <span className="text-sm">ft</span>
            </p>
          </div>
        )}

        {vehicle.bucket_capacity_yards && (
          <div>
            <p className="text-sm text-muted-foreground">Bucket Capacity</p>
            <p className="font-medium text-lg">
              {vehicle.bucket_capacity_yards} <span className="text-sm">yd³</span>
            </p>
          </div>
        )}

        {vehicle.operating_weight_lbs && (
          <div>
            <p className="text-sm text-muted-foreground">Operating Weight</p>
            <p className="font-medium text-lg">
              {vehicle.operating_weight_lbs.toLocaleString()} <span className="text-sm">lbs</span>
            </p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)}
```

## 5. Asset Relationships Section

```tsx
{/* Asset Relationships (Attached Assets) */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Link2 className="h-5 w-5" />
      Attached Assets
    </CardTitle>
  </CardHeader>
  <CardContent>
    <AssetRelationshipsList vehicleId={vehicle.id} />
  </CardContent>
</Card>
```

## 6. AssetRelationshipsList Component

```tsx
export function AssetRelationshipsList({ vehicleId }: AssetRelationshipsListProps) {
  const { data, error, isLoading } = useSWR<{ relationships: AssetRelationship[] }>(
    `/api/asset-relationships/active?parent_asset_id=${vehicleId}`,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false
    }
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading relationships...
        </span>
      </div>
    )
  }

  // Error state (API not implemented)
  if (error) {
    return (
      <Card className="p-4 bg-muted/50 border-dashed">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              Asset Relationships Feature
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This feature will display attached trailers, equipment, and other related assets.
              API endpoint not yet implemented.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  // Empty state
  if (relationships.length === 0) {
    return (
      <div className="text-center py-6">
        <Link2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No attached assets</p>
      </div>
    )
  }

  // Display relationships
  return (
    <div className="space-y-3">
      {relationships.map((relationship) => (
        <Card key={relationship.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">
                  {relationship.child_asset_name ||
                   `${relationship.child_make} ${relationship.child_model}`}
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {relationship.relationship_type}
                </Badge>
              </div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {relationship.child_vin && (
                  <div><span className="font-medium">VIN:</span> {relationship.child_vin}</div>
                )}
                {relationship.effective_from && (
                  <div>
                    <span className="font-medium">Attached:</span>{' '}
                    {new Date(relationship.effective_from).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm">View</Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
```

## 7. Updated Imports

```tsx
import React from 'react'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { DrilldownContent } from '@/components/DrilldownPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import useSWR from 'swr'
import {
  Car,
  Calendar,
  Gauge,
  Fuel,
  MapPin,
  Activity,
  Clock,
  Route,
  AlertTriangle,
  Zap,         // NEW - PTO Hours icon
  Timer,       // NEW - Engine Hours icon
  RotateCw,    // NEW - Cycles icon
  Settings,    // NEW - Equipment specs icon
  Link2,       // NEW - Relationships icon
} from 'lucide-react'
import { MetricCard } from './MetricCard'  // NEW
import { AssetRelationshipsList } from './AssetRelationshipsList'  // NEW
import {
  ExtendedVehicleData,
  ASSET_CATEGORY_LABELS,
  ASSET_TYPE_LABELS,
  POWER_TYPE_LABELS,
  OPERATIONAL_STATUS_LABELS,
  PrimaryMetric,
} from '@/types/asset.types'  // NEW
```

## 8. Type Definitions Used

```tsx
// From /home/user/Fleet/src/types/asset.types.ts

export type AssetCategory =
  | 'PASSENGER_VEHICLE'
  | 'HEAVY_EQUIPMENT'
  | 'TRAILER'
  | 'TRACTOR'
  | 'SPECIALTY'
  | 'NON_POWERED'

export type AssetType =
  | 'SEDAN' | 'SUV' | 'TRUCK' | 'VAN'
  | 'EXCAVATOR' | 'BULLDOZER' | 'LOADER' | 'BACKHOE'
  | 'FLATBED' | 'ENCLOSED' | 'DUMP'
  | 'FARM_TRACTOR' | 'ROAD_TRACTOR'
  // ... etc

export type PowerType =
  | 'SELF_POWERED'
  | 'TOWED'
  | 'CARRIED'
  | 'STATIONARY'
  | 'MANUAL'

export type OperationalStatus =
  | 'AVAILABLE'
  | 'IN_USE'
  | 'MAINTENANCE'
  | 'RESERVED'
  | 'OUT_OF_SERVICE'

export type PrimaryMetric =
  | 'ODOMETER'
  | 'ENGINE_HOURS'
  | 'PTO_HOURS'
  | 'AUX_HOURS'
  | 'CYCLES'
  | 'CALENDAR'
```

## 9. Label Constants

```tsx
// From /home/user/Fleet/src/types/asset.types.ts

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  PASSENGER_VEHICLE: 'Passenger Vehicle',
  HEAVY_EQUIPMENT: 'Heavy Equipment',
  TRAILER: 'Trailer',
  TRACTOR: 'Tractor',
  SPECIALTY: 'Specialty Equipment',
  NON_POWERED: 'Non-Powered Asset'
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  EXCAVATOR: 'Excavator',
  BULLDOZER: 'Bulldozer',
  FLATBED: 'Flatbed Trailer',
  // ... etc
}

export const POWER_TYPE_LABELS: Record<PowerType, string> = {
  SELF_POWERED: 'Self-Powered',
  TOWED: 'Towed',
  CARRIED: 'Carried',
  STATIONARY: 'Stationary',
  MANUAL: 'Manual'
}

export const OPERATIONAL_STATUS_LABELS: Record<OperationalStatus, string> = {
  AVAILABLE: 'Available',
  IN_USE: 'In Use',
  MAINTENANCE: 'Maintenance',
  RESERVED: 'Reserved',
  OUT_OF_SERVICE: 'Out of Service'
}
```

## 10. Responsive Grid Examples

### 2 Columns (Mobile Default)
```tsx
<div className="grid grid-cols-2 gap-4">
  {/* Items */}
</div>
```

### 2 → 3 Columns (Mobile → Tablet)
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
  {/* Items */}
</div>
```

### 2 → 3 → 4 Columns (Mobile → Tablet → Desktop)
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {/* Items */}
</div>
```

## 11. Complete File Paths

```
Created:
├── /home/user/Fleet/src/components/drilldown/MetricCard.tsx
└── /home/user/Fleet/src/components/drilldown/AssetRelationshipsList.tsx

Modified:
└── /home/user/Fleet/src/components/drilldown/VehicleDetailPanel.tsx

Used (Existing):
└── /home/user/Fleet/src/types/asset.types.ts
```

## 12. Badge Variant Examples

```tsx
{/* Success/Default */}
<Badge variant="default">Available</Badge>

{/* Secondary */}
<Badge variant="secondary">In Use</Badge>

{/* Destructive */}
<Badge variant="destructive">Maintenance</Badge>

{/* Outline */}
<Badge variant="outline">Reserved</Badge>
```

## 13. Conditional Rendering Pattern

```tsx
{/* Only render if data exists */}
{vehicle.asset_category && (
  <div>
    <p className="text-sm text-muted-foreground">Category</p>
    <p className="font-medium">{ASSET_CATEGORY_LABELS[vehicle.asset_category]}</p>
  </div>
)}

{/* Multiple conditions */}
{(vehicle.asset_category || vehicle.asset_type || vehicle.power_type) && (
  <Card>
    {/* Content */}
  </Card>
)}

{/* Conditional section with multiple field checks */}
{vehicle.asset_category === 'HEAVY_EQUIPMENT' &&
  (vehicle.capacity_tons || vehicle.lift_height_feet || ...) && (
  <Card>
    {/* Equipment specs */}
  </Card>
)}
```

## 14. Number Formatting Examples

```tsx
{/* Locale-aware formatting */}
{vehicle.capacity_tons} tons
{vehicle.operating_weight_lbs.toLocaleString()} lbs

{/* MetricCard formatting */}
value.toLocaleString()  // 1250 → "1,250"
```

## 15. Icon Usage Pattern

```tsx
{/* Section Header Icons (h-5 w-5) */}
<CardTitle className="flex items-center gap-2">
  <Car className="h-5 w-5" />
  Asset Classification
</CardTitle>

{/* Metric Icons (h-4 w-4) */}
<MetricCard
  icon={<Timer className="h-4 w-4" />}
  label="Engine Hours"
  // ...
/>
```
