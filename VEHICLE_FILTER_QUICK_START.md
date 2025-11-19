# Vehicle Filter API - Quick Start Guide

**Task 2.1**: Vehicle Routes API Extension
**Status**: ✅ Complete

---

## Overview

The Vehicle Routes API now supports filtering by asset types, operational status, and other criteria. This allows you to query specific subsets of your fleet (e.g., "show me all available excavators" or "list all trailers at location XYZ").

---

## Quick Reference

### Available Filters

| Filter | Type | Example Values | Description |
|--------|------|----------------|-------------|
| `asset_category` | String | `HEAVY_EQUIPMENT`, `TRACTOR`, `TRAILER` | High-level asset classification |
| `asset_type` | String | `EXCAVATOR`, `SEMI_TRACTOR`, `DRY_VAN_TRAILER` | Specific asset type |
| `power_type` | String | `SELF_POWERED`, `TOWED`, `STATIONARY` | How the asset moves |
| `operational_status` | String | `AVAILABLE`, `IN_USE`, `MAINTENANCE`, `RESERVED` | Current operational state |
| `primary_metric` | String | `ODOMETER`, `ENGINE_HOURS`, `PTO_HOURS` | Primary usage metric |
| `is_road_legal` | Boolean | `true`, `false` | Can be driven on public roads |
| `location_id` | UUID | `abc-123-def-456` | Facility/location UUID |
| `group_id` | String | `fleet-001` | Asset group identifier |
| `fleet_id` | String | `east-coast` | Fleet identifier |

### Pagination Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Integer | 1 | Page number |
| `limit` | Integer | 50 | Results per page (max 100) |

---

## Usage Examples

### Example 1: Get All Heavy Equipment

**Request:**
```bash
curl -X GET "http://localhost:3000/api/vehicles?asset_category=HEAVY_EQUIPMENT" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "vin": "1HTMMAAR7GH123456",
      "make": "Caterpillar",
      "model": "320",
      "year": 2023,
      "asset_category": "HEAVY_EQUIPMENT",
      "asset_type": "EXCAVATOR",
      "operational_status": "AVAILABLE",
      "engine_hours": 1234.5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 15,
    "pages": 1
  }
}
```

---

### Example 2: Get Available Trailers

**Request:**
```bash
curl -X GET "http://localhost:3000/api/vehicles?asset_category=TRAILER&operational_status=AVAILABLE" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Use Case:** Find trailers ready to be attached to tractors.

---

### Example 3: Get Equipment at Specific Location

**Request:**
```bash
curl -X GET "http://localhost:3000/api/vehicles?location_id=abc-123&asset_category=HEAVY_EQUIPMENT" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Use Case:** See what equipment is at a specific job site.

---

### Example 4: Get All Excavators

**Request:**
```bash
curl -X GET "http://localhost:3000/api/vehicles?asset_type=EXCAVATOR" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Use Case:** List all excavators regardless of status.

---

### Example 5: Get Off-Road Equipment

**Request:**
```bash
curl -X GET "http://localhost:3000/api/vehicles?is_road_legal=false" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Use Case:** Find equipment that cannot be driven on public roads.

---

### Example 6: Pagination

**Request Page 1:**
```bash
curl -X GET "http://localhost:3000/api/vehicles?asset_category=HEAVY_EQUIPMENT&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Request Page 2:**
```bash
curl -X GET "http://localhost:3000/api/vehicles?asset_category=HEAVY_EQUIPMENT&page=2&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## JavaScript/TypeScript Examples

### Using Fetch API

```typescript
// Get available heavy equipment
async function getAvailableHeavyEquipment() {
  const response = await fetch(
    '/api/vehicles?asset_category=HEAVY_EQUIPMENT&operational_status=AVAILABLE',
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  )

  const data = await response.json()
  return data.data  // Array of vehicles
}
```

### Using Axios

```typescript
import axios from 'axios'

// Get all excavators
async function getAllExcavators() {
  const response = await axios.get('/api/vehicles', {
    params: {
      asset_type: 'EXCAVATOR'
    },
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  return response.data
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react'

function useVehicles(filters = {}) {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const queryString = new URLSearchParams(filters).toString()
        const response = await fetch(`/api/vehicles?${queryString}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()
        setVehicles(data.data)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [filters])

  return { vehicles, loading, error }
}

// Usage
function HeavyEquipmentList() {
  const { vehicles, loading, error } = useVehicles({
    asset_category: 'HEAVY_EQUIPMENT',
    operational_status: 'AVAILABLE'
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {vehicles.map(vehicle => (
        <li key={vehicle.id}>
          {vehicle.make} {vehicle.model} - {vehicle.asset_type}
        </li>
      ))}
    </ul>
  )
}
```

---

## Python Examples

### Using Requests Library

```python
import requests

def get_available_trailers(token):
    """Get all available trailers"""
    response = requests.get(
        'http://localhost:3000/api/vehicles',
        params={
            'asset_category': 'TRAILER',
            'operational_status': 'AVAILABLE'
        },
        headers={
            'Authorization': f'Bearer {token}'
        }
    )

    return response.json()['data']

# Usage
trailers = get_available_trailers('your-jwt-token')
for trailer in trailers:
    print(f"{trailer['make']} {trailer['model']} - {trailer['vin']}")
```

---

## Common Use Cases

### 1. Dispatch Dashboard

**Requirement:** Show available assets by type for dispatchers.

```typescript
// Get available tractors
const tractors = await fetch('/api/vehicles?asset_category=TRACTOR&operational_status=AVAILABLE')

// Get available trailers
const trailers = await fetch('/api/vehicles?asset_category=TRAILER&operational_status=AVAILABLE')

// Get available heavy equipment
const equipment = await fetch('/api/vehicles?asset_category=HEAVY_EQUIPMENT&operational_status=AVAILABLE')
```

---

### 2. Maintenance Scheduler

**Requirement:** Find equipment in maintenance.

```typescript
const inMaintenance = await fetch('/api/vehicles?operational_status=MAINTENANCE')
```

---

### 3. Asset Location Tracker

**Requirement:** See all assets at a specific location.

```typescript
const locationId = 'abc-123-def-456'
const assetsAtLocation = await fetch(`/api/vehicles?location_id=${locationId}`)
```

---

### 4. Equipment Rental System

**Requirement:** Show available equipment by type for rental.

```typescript
// Customer wants excavators
const availableExcavators = await fetch(
  '/api/vehicles?asset_type=EXCAVATOR&operational_status=AVAILABLE'
)
```

---

### 5. Fleet Utilization Report

**Requirement:** Compare available vs. in-use assets.

```typescript
const available = await fetch('/api/vehicles?operational_status=AVAILABLE')
const inUse = await fetch('/api/vehicles?operational_status=IN_USE')

const utilizationRate = (inUse.length / (available.length + inUse.length)) * 100
```

---

## Filter Combinations

### Heavy Equipment Ready for Dispatch
```
?asset_category=HEAVY_EQUIPMENT&operational_status=AVAILABLE&is_road_legal=true
```

### All Trailers at Location
```
?asset_category=TRAILER&location_id=abc-123
```

### Semi Tractors in Use
```
?asset_type=SEMI_TRACTOR&operational_status=IN_USE
```

### Off-Road Equipment Available
```
?is_road_legal=false&operational_status=AVAILABLE
```

### Specific Fleet's Tractors
```
?asset_category=TRACTOR&fleet_id=east-coast
```

---

## Response Format

All vehicle list responses follow this structure:

```typescript
interface VehicleListResponse {
  data: Vehicle[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface Vehicle {
  id: string
  tenant_id: string
  vin: string
  make: string
  model: string
  year: number

  // Asset Classification
  asset_category?: string
  asset_type?: string
  power_type?: string

  // Operational
  operational_status?: string
  status: string  // Existing field: active, maintenance, sold, retired

  // Metrics
  primary_metric?: string
  odometer?: number
  engine_hours?: number
  pto_hours?: number

  // Location
  location_id?: string
  location?: string  // Existing field: text location

  // Equipment Specs (if applicable)
  capacity_tons?: number
  lift_height_feet?: number
  bucket_capacity_yards?: number

  // Standard Fields
  created_at: string
  updated_at: string
  // ... other fields
}
```

---

## Error Handling

### No Results
If no vehicles match the filters, you'll get an empty array:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 0,
    "pages": 0
  }
}
```

### Invalid Token
```json
{
  "error": "Unauthorized"
}
```
**Status Code:** 401

### Insufficient Permissions
```json
{
  "error": "Forbidden: Insufficient permissions"
}
```
**Status Code:** 403

### Server Error
```json
{
  "error": "Internal server error"
}
```
**Status Code:** 500

---

## Testing

### Quick Test Script

Save as `test.sh` and run:

```bash
#!/bin/bash
export JWT_TOKEN="your-token-here"

echo "Test 1: Get all heavy equipment"
curl -X GET "http://localhost:3000/api/vehicles?asset_category=HEAVY_EQUIPMENT" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

echo "\nTest 2: Get available trailers"
curl -X GET "http://localhost:3000/api/vehicles?asset_category=TRAILER&operational_status=AVAILABLE" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

echo "\nTest 3: Get excavators"
curl -X GET "http://localhost:3000/api/vehicles?asset_type=EXCAVATOR" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

**Or use the comprehensive test script:**

```bash
chmod +x test-vehicle-filters.sh
export JWT_TOKEN="your-token-here"
./test-vehicle-filters.sh all
```

---

## Valid Filter Values

### asset_category
- `PASSENGER_VEHICLE`
- `LIGHT_COMMERCIAL`
- `HEAVY_TRUCK`
- `TRACTOR`
- `TRAILER`
- `HEAVY_EQUIPMENT`
- `UTILITY_VEHICLE`
- `SPECIALTY_EQUIPMENT`
- `NON_POWERED`

### asset_type (subset shown)
**Tractors:**
- `SEMI_TRACTOR`
- `DAY_CAB_TRACTOR`
- `SLEEPER_CAB_TRACTOR`

**Trailers:**
- `DRY_VAN_TRAILER`
- `FLATBED_TRAILER`
- `REFRIGERATED_TRAILER`
- `LOWBOY_TRAILER`
- `TANK_TRAILER`

**Heavy Equipment:**
- `EXCAVATOR`
- `BULLDOZER`
- `BACKHOE`
- `MOTOR_GRADER`
- `WHEEL_LOADER`
- `SKID_STEER`
- `MOBILE_CRANE`
- `FORKLIFT`

**See migration file for complete list:** `/home/user/Fleet/api/src/migrations/032_multi_asset_vehicle_extensions.sql`

### power_type
- `SELF_POWERED`
- `TOWED`
- `STATIONARY`
- `PORTABLE`

### operational_status
- `AVAILABLE`
- `IN_USE`
- `MAINTENANCE`
- `RESERVED`

### primary_metric
- `ODOMETER`
- `ENGINE_HOURS`
- `PTO_HOURS`
- `AUX_HOURS`
- `CYCLES`
- `CALENDAR`

---

## Performance Tips

1. **Use Pagination**: Always paginate large result sets
   ```
   ?asset_category=HEAVY_EQUIPMENT&limit=25&page=1
   ```

2. **Be Specific**: More filters = faster queries
   ```
   ?asset_category=HEAVY_EQUIPMENT&operational_status=AVAILABLE&location_id=abc-123
   ```

3. **Cache Results**: If data doesn't change frequently, cache on frontend

4. **Use Indexes**: All filterable fields are indexed for fast queries

---

## Security Notes

- All queries are **parameterized** - SQL injection is not possible
- **Tenant isolation** - Users only see vehicles in their tenant
- **User scoping** - Drivers see only their vehicle, supervisors see team vehicles
- **Audit logging** - All queries are logged for compliance

---

## Related Documentation

- **Full Implementation Report**: `/home/user/Fleet/TASK_2_1_VERIFICATION_REPORT.md`
- **SQL Query Reference**: `/home/user/Fleet/VEHICLE_FILTER_SQL_REFERENCE.md`
- **Test Script**: `/home/user/Fleet/test-vehicle-filters.sh`
- **API Route Source**: `/home/user/Fleet/api/src/routes/vehicles.ts`
- **Database Migration**: `/home/user/Fleet/api/src/migrations/032_multi_asset_vehicle_extensions.sql`

---

## Support

For issues or questions:
1. Check the implementation report for detailed SQL examples
2. Run the test script to verify functionality
3. Review the SQL reference for query patterns
4. Check server logs for error details

---

**Last Updated:** 2025-11-19
**Version:** 1.0
**Status:** ✅ Production Ready
