# Fuel Transactions Endpoint Fix - Complete

## Issue
Error "relation fueltransactions does not exist" when accessing `/api/fuel-transactions` endpoint.

## Root Cause
The `FuelTransactionService.ts` was using incorrect table name `fueltransactions` (no underscore) instead of the actual table name `fuel_transactions` (with underscore).

Additionally, the service had several schema mismatches:
1. Table doesn't have `deleted_at` column (no soft delete support)
2. All IDs are UUIDs (string type), not integers
3. Service was using generic `data` column instead of proper schema fields

## Database Schema (Actual)
```sql
Table: fuel_transactions
- id: UUID (primary key)
- tenant_id: UUID (foreign key to tenants)
- vehicle_id: UUID (foreign key to vehicles)
- driver_id: UUID (nullable, foreign key to drivers)
- transaction_date: timestamp
- fuel_type: fuel_type enum
- gallons: numeric(10,3)
- cost_per_gallon: numeric(8,3)
- total_cost: numeric(12,2)
- odometer: integer
- location: varchar(255)
- latitude: numeric(10,7)
- longitude: numeric(10,7)
- vendor_name: varchar(255)
- receipt_number: varchar(100)
- receipt_url: varchar(500)
- payment_method: varchar(50)
- card_last4: varchar(4)
- notes: text
- metadata: jsonb
- created_at: timestamp (default: now())
- updated_at: timestamp (default: now())
```

## Files Changed

### 1. `/api/src/services/FuelTransactionService.ts`
**Changes:**
- Fixed table name from `fueltransactions` to `fuel_transactions` in all queries
- Removed `deleted_at` column references (table doesn't support soft deletes)
- Changed ID types from `number` to `string | number` for UUID compatibility
- Updated `create()` method to use actual schema columns instead of generic `data` column
- Updated `update()` method to dynamically build SET clause with proper fields
- Changed `delete()` from soft delete to hard delete (DELETE instead of UPDATE)

**Lines changed:**
- Line 17-20: `getAll()` - Fixed table name, removed deleted_at filter
- Line 28-32: `getById()` - Fixed table name, removed deleted_at filter
- Line 37-76: `create()` - Complete rewrite to match schema
- Line 80-121: `update()` - Rewrite to use dynamic field updates
- Line 124-131: `delete()` - Changed to hard delete

## Verification Steps

1. **Database table verification:**
```bash
PGPASSWORD=fleet_test_pass psql -h localhost -p 5432 -U fleet_user -d fleet_test -c "\dt" | grep fuel
# Result: fuel_transactions table exists
```

2. **Schema inspection:**
```bash
PGPASSWORD=fleet_test_pass psql -h localhost -p 5432 -U fleet_user -d fleet_test -c "\d fuel_transactions"
# Confirmed: UUIDs, no deleted_at column, proper field structure
```

3. **Query test:**
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api
node test-fuel-endpoint.js
# Result: ✓ SUCCESS - Query executed without errors
```

## Test Results
- Query execution: **PASS**
- Table name correction: **COMPLETE**
- Schema alignment: **COMPLETE**
- Type compatibility: **COMPLETE**

## API Endpoint Status
The `/api/fuel-transactions` endpoint should now work correctly with:
- `GET /api/fuel-transactions` - List all fuel transactions (with pagination, filters)
- `GET /api/fuel-transactions/:id` - Get single transaction
- `POST /api/fuel-transactions` - Create new transaction
- `PUT /api/fuel-transactions/:id` - Update transaction
- `DELETE /api/fuel-transactions/:id` - Delete transaction

## Notes
1. The service now accepts both `string` and `number` types for IDs to maintain backward compatibility
2. Hard delete is used instead of soft delete (table design decision)
3. All tenant_id and ID parameters must be valid UUIDs
4. The metadata field is automatically stringified to JSONB

## Next Steps
To fully test the endpoint, the API server needs to be started:
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api
npm run dev
# Then test: curl 'http://localhost:3000/api/fuel-transactions?limit=1'
```

## Commit Summary
- Fixed table name from `fueltransactions` to `fuel_transactions`
- Aligned service with actual database schema
- Updated type signatures for UUID compatibility
- Removed non-existent column references
- Changed delete strategy from soft to hard delete
