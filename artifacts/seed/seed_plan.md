# Fleet Seed Data Plan & Specification

## Objective
To provide a deterministic, realistic, and comprehensive dataset for "Browser-First" validation of the Fleet application. This dataset will serve as the source of truth for all automated workflows, ensuring that every role, state, and edge case is testable without reliance on mocks.

## Compliance
- **Realism**: Data must look and behave like real production data (e.g., valid VINs, realistic addresses, coherent timestamps).
- **Scale**: Sufficient volume to test pagination, filtering, and performance (e.g., 50+ vehicles, 20+ drivers).
- **Security**: No real PII. All PII must be synthetically generated but structurally valid.
- **Determinism**: The `npm run seed:real` command must produce the EXACT same database state every time to ensure test reproducibility.

## Seed Entities

### 1. Organizations (Tenancy)
- **Primary Fleet**: "Morton Tech Alliance Fleet" (Main test subject)
- **Secondary Fleet**: "Global Logistics Inc" (For tenancy isolation tests)

### 2. Users (RBAC Coverage)
- **Super Admin**: `admin@example.com`
- **Fleet Manager**: `manager@example.com`
- **Driver**: `driver.active@example.com`, `driver.inactive@example.com`
- **Maintenance Tech**: `tech@example.com`
- **HR Manager**: `hr@example.com`
- **Auditor**: `auditor@example.com`

### 3. Vehicles
- **Mix of Types**: Sedans, Trucks (Light/Heavy), Vans, EVs.
- **Statuses**: Active, Maintenance, Out of Service, Archived.
- **Data Points**:
  - Valid VINs (generated)
  - Year/Make/Model
  - License Plates
  - Mileage/Odometer (varied)
  - Fuel Levels / Battery State of Charge

### 4. Drivers
- Linked to specific vehicles (Assignments).
- Varied license statuses (Valid, Expired, Suspended).
- Varied compliance statuses.

### 5. Operational Data
- **Fuel Transactions**: Recent history for dashboard charts.
- **Maintenance Schedules**: Overdue, Upcoming, Completed.
- **Incidents/Damage Reports**: PENDING_INSURANCE, RESOLVED.
- **Work Orders**: In-progress repairs.

## Technical Implementation

### Script: `scripts/seed-real-data.ts`
- **Dependencies**: `faker` (for realism), `pg` (direct DB access for speed).
- **Reset Strategy**: `TRUNCATE ... CASCADE` before seeding.
- **Idempotency**: Should run safely on a clean DB.

### Script: `scripts/reset-db.ts`
- Fast reset for "Between Tests" cleanup.

## Artifacts
- `artifacts/seed/seed_data_spec.json`: The JSON schema/definitions for the golden dataset.
- `artifacts/seed/test_accounts.json`: Credentials for the E2E runner.

## Execution
Run via: `npm run seed:real`
