# FuelMaster Emulator API Documentation

## Overview

The FuelMaster Emulator provides a realistic simulation of FuelMaster fueling infrastructure and transaction feeds for the City of Tallahassee Fleet Management System. This enables testing of fuel transaction imports, vehicle mapping, and billing integration without requiring live FuelMaster API access.

## Purpose

- Pull/push fueling transactions with realistic City of Tallahassee data
- Map FuelMaster vehicle IDs to AMS Equipment records
- Map fuel products to FuelType codes
- Model sites, tanks, hoses with product constraints
- Validate hose→product constraints
- Simulate common exceptions (unmapped vehicles/products, duplicates, sensor faults)

## Base URL

- **Base URL:** `http://localhost:3001/api/emulators/fuelmaster`
- **Version:** `/v1`
- **Example:** `http://localhost:3001/api/emulators/fuelmaster/v1/transactions`

---

## Authentication

### API Key Authentication

All requests require an API key header:

```
X-API-Key: <your-api-key>
```

**Example:**
```bash
curl -H "X-API-Key: test-key-123" \
  http://localhost:3001/api/emulators/fuelmaster/v1/sites
```

---

## Reference Data Endpoints

### 1. List Sites

#### `GET /v1/sites`

Returns all fuel sites in the City of Tallahassee system.

**Response:**
```json
[
  {
    "site_id": "MAIN_YARD",
    "name": "Main Fleet Maintenance Yard",
    "address": "2602 Jackson Bluff Road, Tallahassee, FL 32304",
    "is_active": true
  },
  {
    "site_id": "POLICE_HQ",
    "name": "Police Headquarters Fuel Station",
    "address": "234 E 7th Avenue, Tallahassee, FL 32303",
    "is_active": true
  }
]
```

---

### 2. Get Single Site

#### `GET /v1/sites/{site_id}`

Returns details for a specific site.

**Example:** `GET /v1/sites/MAIN_YARD`

---

### 3. List Tanks for a Site

#### `GET /v1/sites/{site_id}/tanks`

Returns all storage tanks at a specific site.

**Response:**
```json
[
  {
    "tank_id": 101,
    "site_id": "MAIN_YARD",
    "product_id": 12,
    "capacity_gallons": 15000,
    "current_gallons": 8234
  },
  {
    "tank_id": 102,
    "site_id": "MAIN_YARD",
    "product_id": 10,
    "capacity_gallons": 12000,
    "current_gallons": 5678
  }
]
```

---

### 4. List Hoses for a Site

#### `GET /v1/sites/{site_id}/hoses`

Returns all fuel hoses at a specific site.

**Response:**
```json
[
  {
    "site_id": "MAIN_YARD",
    "tank_id": 101,
    "hose_id": 1,
    "hose_code": "MY-D1",
    "product_id": 12,
    "meter_reading": 245678.4,
    "is_active": true
  }
]
```

---

### 5. List Products

#### `GET /v1/products`

Returns all fuel products available in the system.

**Response:**
```json
[
  {
    "product_id": 10,
    "code": "RUL87",
    "description": "Regular Unleaded 87 Octane (E10)",
    "group_code": "GASOLINE",
    "unit": "GALLON",
    "default_unit_cost": 2.89
  },
  {
    "product_id": 12,
    "code": "ULSD",
    "description": "Ultra Low Sulfur Diesel #2",
    "group_code": "DIESEL",
    "unit": "GALLON",
    "default_unit_cost": 3.45
  }
]
```

---

### 6. Get Single Product

#### `GET /v1/products/{product_id}`

Returns details for a specific product.

**Example:** `GET /v1/products/12`

---

## Vehicle Mapping Endpoints

### 7. Lookup Vehicle

#### `GET /v1/vehicles/{fuelmaster_vehicle_id}`

Returns vehicle mapping information.

**Example:** `GET /v1/vehicles/FM-12001`

**Response:**
```json
{
  "fuelmaster_vehicle_id": "FM-12001",
  "vehicle_tag": "PD-101",
  "status": "ACTIVE",
  "linked_equipment_key": "E-12001",
  "linked_ams_equipment_id": 12001,
  "last_odometer": 67890
}
```

**Error Response (404):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Vehicle not found"
  }
}
```

---

### 8. Create/Update Vehicle Mapping

#### `POST /v1/vehicles/map`

Maps a FuelMaster vehicle to an AMS equipment record.

**Request:**
```json
{
  "fuelmaster_vehicle_id": "FM-12001",
  "ams_equipment_id": 12001,
  "equipment_key": "E-12001"
}
```

**Response:**
```json
{
  "status": "SUCCESS"
}
```

---

## Fuel Transaction Endpoints

### 9. Pull Transactions

#### `GET /v1/transactions`

Retrieves fuel transactions with optional filtering and pagination.

**Query Parameters:**
- `start` - Start date (ISO 8601 format)
- `end` - End date (ISO 8601 format)
- `site_id` - Filter by site
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 100, max: 1000)

**Example:**
```bash
GET /v1/transactions?start=2026-01-01&end=2026-01-31&site_id=MAIN_YARD&page=1&pageSize=100
```

**Response:**
```json
{
  "items": [
    {
      "transaction_id": "TX-000001",
      "site_id": "MAIN_YARD",
      "tank_id": 101,
      "hose_id": 1,
      "product_id": 12,
      "fuelmaster_vehicle_id": "FM-12001",
      "driver_id": "EMP-5234",
      "odometer": 67910,
      "engine_hours": 553.2,
      "quantity": 18.4,
      "unit_cost": 3.45,
      "total_cost": 63.48,
      "transaction_time": "2026-01-03T14:22:09Z",
      "is_voided": false
    }
  ],
  "page": 1,
  "pageSize": 100,
  "totalItems": 487,
  "totalPages": 5
}
```

---

### 10. Push Transactions

#### `POST /v1/transactions/push`

Accepts bulk fuel transactions from external systems.

**Request:**
```json
{
  "transactions": [
    {
      "transaction_id": "TX-NEW-001",
      "site_id": "MAIN_YARD",
      "tank_id": 101,
      "hose_id": 1,
      "product_id": 12,
      "fuelmaster_vehicle_id": "FM-12001",
      "driver_id": "EMP-5234",
      "odometer": 67930,
      "engine_hours": 554.1,
      "quantity": 22.3,
      "unit_cost": 3.45,
      "total_cost": 76.94,
      "transaction_time": "2026-01-05T08:15:23Z",
      "is_voided": false
    }
  ]
}
```

**Response:**
```json
{
  "accepted": 1,
  "rejected": 0,
  "errors": []
}
```

**Response (with errors):**
```json
{
  "accepted": 4,
  "rejected": 1,
  "errors": [
    {
      "transaction_id": "TX-000009",
      "code": "UNMAPPED_VEHICLE",
      "message": "Vehicle not mapped to AMS equipment",
      "details": {
        "fuelmaster_vehicle_id": "FM-99999"
      }
    }
  ]
}
```

---

## Key Behavioral Rules

### Transaction Validation

1. **Vehicle Mapping Required**
   - Vehicle must exist in mapping table
   - Must have `linked_ams_equipment_id`

2. **Product Validation**
   - Product must exist in products table
   - Product must be active

3. **Hose-Product Matching**
   - Hose can only dispense its configured product
   - Mismatched products are rejected

4. **Quantity Validation**
   - Quantity must be positive
   - Zero or negative quantities are rejected

5. **Duplicate Prevention**
   - Transaction IDs must be unique
   - Duplicate IDs are rejected (unless scenario enabled)

6. **Voiding**
   - Transactions can be voided after posting
   - Voided transactions should produce reversal entries if already exported

---

## Test Scenario Control

### 11. Set Scenario

#### `POST /v1/emulator/control`

Enable/disable test scenarios to simulate specific conditions.

**Request:**
```json
{
  "scenario": "UNMAPPED_VEHICLE",
  "enabled": true
}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "scenario": "UNMAPPED_VEHICLE"
}
```

### Supported FuelMaster Scenarios

| Scenario | Description | Impact |
|----------|-------------|--------|
| `UNMAPPED_VEHICLE` | Force vehicle mapping failure | All transactions rejected |
| `UNMAPPED_PRODUCT` | Force product mapping failure | All transactions rejected |
| `DUPLICATE_TRANSACTION` | Allow duplicate transaction IDs | Bypasses uniqueness check |
| `VOID_TRANSACTION` | Randomly void transactions | Simulates post-posting voids |
| `SENSOR_FAULT` | Random sensor failures | 10% transaction rejection rate |
| `COST_SPIKE` | Simulate fuel price anomalies | Random cost increases |
| `ODOMETER_ROLLBACK` | Simulate meter errors | Negative odometer readings |
| `OUT_OF_SERVICE_HOSE` | Mark hoses inactive | Transactions rejected for hose |

### 12. Get All Scenarios

#### `GET /v1/emulator/control`

Returns all scenarios and their current state.

### 13. Get Single Scenario

#### `GET /v1/emulator/control/{scenario}`

Returns specific scenario configuration.

---

## City of Tallahassee Fuel Infrastructure

### Fuel Sites (5 Locations)

| Site ID | Name | Address |
|---------|------|---------|
| MAIN_YARD | Main Fleet Maintenance Yard | 2602 Jackson Bluff Road |
| POLICE_HQ | Police Headquarters Fuel Station | 234 E 7th Avenue |
| FIRE_STATION_1 | Fire Station #1 Fuel Depot | 116 N Duval Street |
| SOUTHSIDE_DEPOT | Southside Public Works Depot | 1940 Fleischmann Road |
| UTILITY_COMPLEX | Electric/Water Utility Complex | 2602 W Pensacola Street |

### Fuel Products

| Product ID | Code | Description | Price/Gal |
|------------|------|-------------|-----------|
| 10 | RUL87 | Regular Unleaded 87 (E10) | $2.89 |
| 11 | RUL89 | Mid-Grade Unleaded 89 | $3.12 |
| 12 | ULSD | Ultra Low Sulfur Diesel #2 | $3.45 |
| 13 | BIODIESEL_B20 | B20 Biodiesel Blend | $3.62 |
| 14 | DEF | Diesel Exhaust Fluid | $2.45 |
| 15 | E85 | E85 Ethanol Fuel | $2.34 |
| 16 | CNG | Compressed Natural Gas | $2.12/GGE |

### Storage Capacity

- **Total Storage:** 156,000 gallons across 16 tanks
- **Main Yard:** 37,000 gallons (4 tanks)
- **Utility Complex:** 36,000 gallons (3 tanks)
- **Other Sites:** 83,000 gallons (9 tanks)

### Fleet Vehicles by Department

| Department | Vehicle Count | Primary Fuel |
|------------|---------------|--------------|
| Fleet Services | 3 | Mixed |
| Police | 5 | RUL87 |
| Fire | 4 | ULSD |
| Public Works Streets | 4 | ULSD |
| Sanitation | 4 | ULSD |
| Parks & Recreation | 3 | RUL87 |
| Electric Utility | 4 | ULSD |
| Water Utility | 3 | ULSD |
| **Total** | **32** | - |

### Fueling Patterns

| Vehicle Type | Frequency | Avg Gallons | Annual Consumption |
|--------------|-----------|-------------|-------------------|
| Police Patrol | 2x/week | 12 | 6,240 gal/vehicle |
| Fire Apparatus | 1x/week | 45 | 2,340 gal/vehicle |
| Sanitation Truck | 1x/week | 35 | 1,820 gal/vehicle |
| Utility Truck | 1.5x/week | 28 | 2,184 gal/vehicle |
| Admin Vehicle | 1x/week | 15 | 780 gal/vehicle |

---

## Integration Examples

### Example 1: Get All Transactions for Last 7 Days

```bash
curl -H "X-API-Key: test-key-123" \
  "http://localhost:3001/api/emulators/fuelmaster/v1/transactions?start=$(date -d '7 days ago' -I)&end=$(date -I)"
```

### Example 2: Map New Vehicle

```bash
curl -X POST http://localhost:3001/api/emulators/fuelmaster/v1/vehicles/map \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key-123" \
  -d '{
    "fuelmaster_vehicle_id": "FM-NEW-001",
    "ams_equipment_id": 15001,
    "equipment_key": "E-15001"
  }'
```

### Example 3: Push Transaction Batch

```bash
curl -X POST http://localhost:3001/api/emulators/fuelmaster/v1/transactions/push \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key-123" \
  -d '{
    "transactions": [
      {
        "transaction_id": "TX-BATCH-001",
        "site_id": "MAIN_YARD",
        "tank_id": 101,
        "hose_id": 1,
        "product_id": 12,
        "fuelmaster_vehicle_id": "FM-12001",
        "driver_id": "EMP-5234",
        "odometer": 68000,
        "quantity": 20.5,
        "unit_cost": 3.45,
        "total_cost": 70.73,
        "transaction_time": "2026-01-05T10:30:00Z",
        "is_voided": false
      }
    ]
  }'
```

### Example 4: Enable Sensor Fault Scenario

```bash
curl -X POST http://localhost:3001/api/emulators/fuelmaster/v1/emulator/control \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key-123" \
  -d '{
    "scenario": "SENSOR_FAULT",
    "enabled": true
  }'
```

---

## Error Model

All error responses use consistent schema:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {
      /* Additional context */
    }
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | Missing or invalid API key | 401 |
| `NOT_FOUND` | Resource not found | 404 |
| `UNMAPPED_VEHICLE` | Vehicle not mapped to equipment | 400 |
| `UNMAPPED_PRODUCT` | Product not found | 400 |
| `INVALID_HOSE_PRODUCT` | Hose-product mismatch | 400 |
| `DUPLICATE_TRANSACTION` | Transaction ID already exists | 400 |
| `NEGATIVE_QUANTITY` | Quantity must be positive | 400 |
| `SENSOR_FAULT` | Fueling sensor malfunction | 500 |
| `RATE_LIMITED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |

---

## Data Transformation for AMS

When importing FuelMaster transactions into AMS:

### Mapping Logic

1. **Product → FuelType**
   - Map `product_id` to `FuelTypeId` via `FuelType.FMProductId`
   - Example: Product 12 (ULSD) → FuelType "Diesel #2"

2. **Vehicle → Equipment**
   - Map `fuelmaster_vehicle_id` to `EquipmentId` via:
     - `FuelSiteEquipment` table, OR
     - `AMFuelMasterVehicleConversion` table
   - Unmapped vehicles go to reconciliation queue

3. **Transaction → BillingCharge**
   - Create `BillingCharge` line item with:
     - `Quantity` (gallons)
     - `UnitCost` (cost per gallon)
     - `Amount` (total cost)
     - `TransactionDate`
     - `FuelTypeId`
     - `EquipmentId`
     - `AccountingChargeCodeId` (from fuel charge code set)

### Data Lineage

For every imported transaction, store:
- Source `transaction_id`
- Raw payload JSON
- Mapping resolution path
- Created `BillingChargeId`
- Import timestamp
- Reconciliation status

---

## Troubleshooting

### Common Issues

**Issue:** Transactions rejected - "Vehicle not mapped"
- **Cause:** FuelMaster vehicle ID not in mapping table
- **Solution:** Use `/v1/vehicles/map` endpoint to create mapping
- **Prevention:** Regular sync of fleet roster

**Issue:** Hose-product mismatch errors
- **Cause:** Transaction shows wrong product for hose
- **Solution:** Verify hose configuration or transaction data
- **Note:** This indicates data quality issue

**Issue:** Duplicate transaction errors
- **Cause:** Transaction ID already exists
- **Solution:** Check if transaction already imported
- **Prevention:** Track last import timestamp

**Issue:** Missing transactions
- **Cause:** Date range too narrow
- **Solution:** Expand date range in query
- **Note:** Transactions generated for last 30 days only

---

## Historical Data

The emulator generates 500+ realistic transactions spanning 30 days with:

- **Realistic patterns** by vehicle type
- **Accurate odometer** progression
- **Price fluctuations** within normal range
- **Varied transaction times** (6 AM - 10 PM)
- **Driver assignments** from employee pool
- **Site distribution** based on department

---

## Performance Considerations

- **Pagination:** Use `pageSize` parameter to limit results
- **Date Filtering:** Always filter by date range for large datasets
- **Caching:** Reference data (sites, products, hoses) cached in memory
- **Rate Limiting:** Scenario available to test rate limit handling

---

## Version History

- **v1.0.0** (2026-01-05) - Initial release
  - 5 City of Tallahassee fuel sites
  - 7 fuel products with realistic pricing
  - 16 storage tanks with inventory tracking
  - 21 fuel hoses with product constraints
  - 32 mapped fleet vehicles
  - 500+ historical transactions
  - 8 test scenarios

---

## Related Documentation

- [PeopleSoft Emulator Documentation](../peoplesoft/PEOPLESOFT_EMULATOR_DOCS.md)
- [AMS Integration Surface Documentation](../../docs/AMS_INTEGRATION_SURFACE.md)
- [City of Tallahassee Fleet Data](./tallahassee-fuel-seed-data.ts)

---

## Support and Feedback

For questions or issues:
1. Verify API key is included in headers
2. Check test scenario settings
3. Review vehicle mapping status
4. Inspect transaction validation errors
5. Contact Fleet System development team
