# AssetComboManager Component - Usage Examples

## Installation Prerequisites

### 1. Ensure Toast Library is Installed

```bash
npm install sonner
```

### 2. Add Toaster to Root Layout

In your `src/App.tsx` or main layout component:

```typescript
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <>
      <YourApp />
      <Toaster />
    </>
  )
}
```

---

## Usage Examples

### Example 1: Embedded in Vehicle Detail Page

Show attachments for a specific tractor or equipment:

```typescript
import React from 'react'
import { useParams } from 'react-router-dom'
import { AssetComboManager } from '@/components/AssetComboManager.enhanced'

function VehicleDetailPage() {
  const { vehicleId } = useParams()
  const [vehicle, setVehicle] = useState(null)

  useEffect(() => {
    // Fetch vehicle data
    fetchVehicle(vehicleId)
  }, [vehicleId])

  const handleRelationshipChanged = () => {
    // Refresh vehicle data when relationships change
    fetchVehicle(vehicleId)
  }

  if (!vehicle) return <div>Loading...</div>

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h1>

      {/* Vehicle Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <VehicleInfoCard vehicle={vehicle} />
        <VehicleSpecsCard vehicle={vehicle} />
      </div>

      {/* Asset Combo Manager - Show if tractor or equipment */}
      {['ROAD_TRACTOR', 'FARM_TRACTOR', 'EXCAVATOR', 'LOADER'].includes(vehicle.asset_type) && (
        <div className="mt-8">
          <AssetComboManager
            parentAssetId={vehicle.id}
            parentAssetType={vehicle.asset_type}
            onRelationshipChanged={handleRelationshipChanged}
          />
        </div>
      )}

      {/* Other sections */}
      <MaintenanceHistory vehicleId={vehicle.id} />
      <WorkOrders vehicleId={vehicle.id} />
    </div>
  )
}
```

### Example 2: Standalone Fleet Management Page

Manage all asset relationships in one place:

```typescript
import React, { useState } from 'react'
import { AssetComboManager } from '@/components/AssetComboManager.enhanced'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function FleetCombinationsPage() {
  const [tractors, setTractors] = useState([])
  const [selectedTractor, setSelectedTractor] = useState(null)

  useEffect(() => {
    // Fetch all tractors
    fetchTractors()
  }, [])

  const fetchTractors = async () => {
    const response = await apiClient.vehicles.list({
      asset_category: 'TRACTOR',
      operational_status: 'AVAILABLE,IN_USE'
    })
    setTractors(response.data)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Fleet Asset Combinations</h1>

      {/* Tractor Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Tractor</label>
        <Select
          value={selectedTractor?.id}
          onValueChange={(id) => {
            const tractor = tractors.find(t => t.id === id)
            setSelectedTractor(tractor)
          }}
        >
          <SelectTrigger className="w-96">
            <SelectValue placeholder="Choose a tractor..." />
          </SelectTrigger>
          <SelectContent>
            {tractors.map(tractor => (
              <SelectItem key={tractor.id} value={tractor.id}>
                {tractor.year} {tractor.make} {tractor.model} - {tractor.vin}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Asset Combo Manager */}
      {selectedTractor && (
        <AssetComboManager
          parentAssetId={selectedTractor.id}
          parentAssetType={selectedTractor.asset_type}
          onRelationshipChanged={() => {
            // Update any fleet-level statistics
            updateFleetStats()
          }}
        />
      )}

      {!selectedTractor && (
        <div className="text-center text-gray-500 py-12">
          Select a tractor above to manage its trailer attachments
        </div>
      )}
    </div>
  )
}
```

### Example 3: Dispatch Dashboard Integration

Quick attach/detach during dispatch operations:

```typescript
import React, { useState } from 'react'
import { AssetComboManager } from '@/components/AssetComboManager.enhanced'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function DispatchDashboard() {
  const [selectedTractor, setSelectedTractor] = useState(null)
  const [showComboManager, setShowComboManager] = useState(false)

  const handleTractorClick = (tractor) => {
    setSelectedTractor(tractor)
    setShowComboManager(true)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dispatch Dashboard</h1>

      {/* Tractor Grid */}
      <div className="grid grid-cols-4 gap-4">
        {tractors.map(tractor => (
          <TractorCard
            key={tractor.id}
            tractor={tractor}
            onClick={() => handleTractorClick(tractor)}
          />
        ))}
      </div>

      {/* Combo Manager Dialog */}
      <Dialog open={showComboManager} onOpenChange={setShowComboManager}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Attachments - {selectedTractor?.make} {selectedTractor?.model}
            </DialogTitle>
          </DialogHeader>
          {selectedTractor && (
            <AssetComboManager
              parentAssetId={selectedTractor.id}
              parentAssetType={selectedTractor.asset_type}
              onRelationshipChanged={() => {
                // Refresh dispatch board
                refreshDispatchBoard()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

### Example 4: Mobile-Optimized Quick Detach

For drivers/operators to quickly detach trailers:

```typescript
import React from 'react'
import { AssetComboManager } from '@/components/AssetComboManager.enhanced'
import { useAuth } from '@/hooks/useAuth'

function DriverMobileView() {
  const { user } = useAuth()
  const [assignedTractor, setAssignedTractor] = useState(null)

  useEffect(() => {
    // Fetch the driver's currently assigned tractor
    fetchDriverAssignment(user.id)
  }, [user])

  return (
    <div className="mobile-container p-4">
      <h1 className="text-2xl font-bold mb-4">My Tractor</h1>

      {assignedTractor ? (
        <>
          {/* Tractor Info Card */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-lg font-semibold">{assignedTractor.make} {assignedTractor.model}</h2>
            <p className="text-sm text-gray-600">VIN: {assignedTractor.vin}</p>
          </div>

          {/* Simplified Combo Manager for Mobile */}
          <AssetComboManager
            parentAssetId={assignedTractor.id}
            parentAssetType={assignedTractor.asset_type}
            onRelationshipChanged={() => {
              // Notify dispatch of change
              notifyDispatch({
                driverId: user.id,
                tractorId: assignedTractor.id,
                action: 'attachment_changed'
              })
            }}
          />
        </>
      ) : (
        <div className="text-center text-gray-500 py-12">
          No tractor currently assigned
        </div>
      )}
    </div>
  )
}
```

### Example 5: With API Client Integration

Using the enhanced API client:

```typescript
import React, { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { AssetComboManager } from '@/components/AssetComboManager.enhanced'
import { toast } from 'sonner'

function EnhancedVehicleDetail({ vehicleId }) {
  const [vehicle, setVehicle] = useState(null)
  const [activeCombos, setActiveCombos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVehicleData()
  }, [vehicleId])

  const loadVehicleData = async () => {
    setLoading(true)
    try {
      // Fetch vehicle details
      const vehicleData = await apiClient.vehicles.get(vehicleId)
      setVehicle(vehicleData)

      // Fetch active combinations for this vehicle
      const combosData = await apiClient.assetRelationships.listActive()
      const filteredCombos = combosData.combinations.filter(
        c => c.parent_asset_id === vehicleId
      )
      setActiveCombos(filteredCombos)
    } catch (error) {
      toast.error('Failed to load vehicle data')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDetachAll = async () => {
    try {
      // Detach all current attachments
      await Promise.all(
        activeCombos.map(combo =>
          apiClient.assetRelationships.deactivate(combo.relationship_id)
        )
      )
      toast.success(`Detached ${activeCombos.length} assets`)
      loadVehicleData()
    } catch (error) {
      toast.error('Failed to detach all assets')
    }
  }

  if (loading) return <div>Loading...</div>
  if (!vehicle) return <div>Vehicle not found</div>

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        {activeCombos.length > 0 && (
          <button
            onClick={handleQuickDetachAll}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Detach All ({activeCombos.length})
          </button>
        )}
      </div>

      <AssetComboManager
        parentAssetId={vehicle.id}
        parentAssetType={vehicle.asset_type}
        onRelationshipChanged={loadVehicleData}
      />
    </div>
  )
}
```

---

## Advanced Usage

### Custom Asset Type Compatibility

You can extend the compatibility map in the component:

```typescript
// In AssetComboManager.enhanced.tsx
const COMPATIBILITY_MAP: Record<string, string[]> = {
  // Your custom compatibility rules
  'ROAD_TRACTOR': ['FLATBED', 'ENCLOSED', 'DUMP', 'LOWBOY', 'REFRIGERATED'],
  'FARM_TRACTOR': ['FLATBED', 'DUMP', 'MANURE_SPREADER'],
  'EXCAVATOR': ['BACKHOE', 'GRAPPLE', 'AUGER'],
  'LOADER': ['BUCKET', 'PALLET_FORK', 'BALE_SPEAR'],
  'CRANE': ['HOOK', 'MAGNET', 'GRAPPLE'],

  // Specialty equipment
  'BUCKET_TRUCK': ['TOOL_TRAILER'],
  'SERVICE_TRUCK': ['TOOLBOX_TRAILER', 'GENERATOR'],

  // Default: allow all if not specified
  'DEFAULT': []
}
```

### Real-time Updates with WebSocket

```typescript
import { useEffect } from 'react'
import { AssetComboManager } from '@/components/AssetComboManager.enhanced'

function RealTimeAssetView({ vehicleId, vehicleType }) {
  useEffect(() => {
    // Connect to WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:3000/asset-updates')

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data)
      if (update.assetId === vehicleId && update.type === 'relationship_changed') {
        // Component will auto-refresh via onRelationshipChanged
        toast.info('Asset relationship updated', {
          description: update.message
        })
      }
    }

    return () => ws.close()
  }, [vehicleId])

  return (
    <AssetComboManager
      parentAssetId={vehicleId}
      parentAssetType={vehicleType}
      onRelationshipChanged={() => {
        // Broadcast to other users via WebSocket
        broadcastUpdate({
          assetId: vehicleId,
          type: 'relationship_changed'
        })
      }}
    />
  )
}
```

### Batch Operations

```typescript
import { AssetComboManager } from '@/components/AssetComboManager.enhanced'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

function BatchAttachmentManager() {
  const handleBatchAttach = async (tractorId, trailerIds) => {
    try {
      const promises = trailerIds.map(trailerId =>
        apiClient.assetRelationships.create({
          parent_asset_id: tractorId,
          child_asset_id: trailerId,
          relationship_type: 'TOWS',
          effective_from: new Date().toISOString()
        })
      )

      await Promise.all(promises)
      toast.success(`Attached ${trailerIds.length} trailers successfully`)
    } catch (error) {
      toast.error('Failed to attach some trailers')
    }
  }

  return (
    <div>
      {/* Your batch UI */}
      <AssetComboManager
        parentAssetId={selectedTractorId}
        parentAssetType="ROAD_TRACTOR"
      />
    </div>
  )
}
```

---

## Testing

### Unit Test Example

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AssetComboManager } from '@/components/AssetComboManager.enhanced'
import { toast } from 'sonner'

jest.mock('sonner')

describe('AssetComboManager', () => {
  it('should attach a trailer successfully', async () => {
    const mockOnRelationshipChanged = jest.fn()

    render(
      <AssetComboManager
        parentAssetId="tractor-123"
        parentAssetType="ROAD_TRACTOR"
        onRelationshipChanged={mockOnRelationshipChanged}
      />
    )

    // Click "Attach Asset" button
    fireEvent.click(screen.getByText('Attach Asset'))

    // Select a trailer from dropdown
    fireEvent.click(screen.getByText('Select an asset...'))
    fireEvent.click(screen.getByText(/Trailer.*VIN/))

    // Click attach
    fireEvent.click(screen.getByText('Attach Asset'))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Asset attached successfully',
        expect.any(Object)
      )
      expect(mockOnRelationshipChanged).toHaveBeenCalled()
    })
  })

  it('should detach a trailer with confirmation', async () => {
    render(
      <AssetComboManager
        parentAssetId="tractor-123"
        parentAssetType="ROAD_TRACTOR"
      />
    )

    // Wait for attachments to load
    await waitFor(() => screen.getByText(/Currently Attached/))

    // Click detach button
    fireEvent.click(screen.getByText('Detach'))

    // Confirm in alert dialog
    fireEvent.click(screen.getByText('Detach Asset'))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Asset detached successfully',
        expect.any(Object)
      )
    })
  })
})
```

---

## Troubleshooting

### Toast notifications not appearing

**Problem**: Toasts don't show up when operations complete

**Solution**: Ensure `<Toaster />` is included in your root layout:

```typescript
// src/App.tsx
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Your routes */}
        </Routes>
      </Router>
      <Toaster /> {/* Add this */}
    </>
  )
}
```

### No assets showing in dropdown

**Problem**: "No compatible assets available" message

**Causes**:
1. All assets are already attached
2. No assets match the compatibility filter
3. Assets are not in AVAILABLE status

**Solutions**:
1. Check asset operational_status in database
2. Verify COMPATIBILITY_MAP includes your asset types
3. Check API response: `/api/vehicles?operational_status=AVAILABLE`

### 403 Forbidden errors

**Problem**: API calls return 403 errors

**Solution**: Ensure user has correct permissions:
- `vehicle:view:fleet` - To view relationships
- `vehicle:update:fleet` - To create/update relationships
- `vehicle:delete:fleet` - To delete relationships

### Component not re-rendering after attach/detach

**Problem**: List doesn't update after operations

**Solution**: Ensure `onRelationshipChanged` callback is provided and triggers data refresh:

```typescript
<AssetComboManager
  parentAssetId={vehicleId}
  parentAssetType={vehicleType}
  onRelationshipChanged={() => {
    // Re-fetch your parent component data
    refreshVehicleData()
  }}
/>
```

---

## Migration from Original Component

If you're using the original AssetComboManager:

### Old Props (Original)
```typescript
<AssetComboManager
  tenantId={tenantId}
  selectedAssetId={vehicleId}
  onRelationshipCreated={handleCreated}
/>
```

### New Props (Enhanced)
```typescript
<AssetComboManager
  parentAssetId={vehicleId}
  parentAssetType={vehicle.asset_type}
  onRelationshipChanged={handleChanged}
/>
```

### Migration Checklist
- [ ] Change `tenantId` → No longer needed (derived from auth)
- [ ] Change `selectedAssetId` → `parentAssetId`
- [ ] Add `parentAssetType` prop
- [ ] Change `onRelationshipCreated` → `onRelationshipChanged`
- [ ] Install `sonner` package
- [ ] Add `<Toaster />` to root layout
- [ ] Update imports to use `.enhanced` version

---

## Additional Resources

- API Documentation: `/api/docs` (Swagger UI)
- Database Schema: `api/src/migrations/032_multi_asset_vehicle_extensions.sql`
- Type Definitions: `api/src/types/asset.types.ts`
- Component Report: `TASK_4_4_ASSET_COMBO_MANAGER_REPORT.md`
