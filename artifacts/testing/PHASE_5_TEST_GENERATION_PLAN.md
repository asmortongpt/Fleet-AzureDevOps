# PHASE 5: Browser-First Test Suite Generation Plan

**Status**: Planning Complete - Ready for Implementation
**Date**: 2026-01-08
**Coverage Target**: 25% (47 P0 features, ~141 test scenarios)

---

## Executive Summary

Based on the Feature Registry (187 features, 562 scenarios), this document provides a comprehensive test generation plan for achieving 25% coverage of P0 critical features using Playwright browser-first testing with real data from the seed system.

### Current State
- **Existing Tests**: 34 E2E tests
- **Current Coverage**: 1.6% (3/187 features)
- **Coverage Gap**: 98.4% (184 features untested)

### Phase 5 Target
- **New Tests to Generate**: 107 test scenarios
- **Target Coverage**: 25% (47/187 features)
- **Focus**: P0 critical features (CRUD operations, core workflows)

---

## Test Architecture

### Page Object Model (POM) Structure

```
e2e/
├── fixtures/
│   ├── test-data.ts          # Seed data fixtures
│   └── auth-fixture.ts        # Authentication helpers
├── page-objects/
│   ├── base.page.ts           # Base page with common methods
│   ├── fleet/
│   │   ├── vehicle-list.page.ts
│   │   ├── vehicle-form.page.ts
│   │   └── vehicle-detail.page.ts
│   ├── drivers/
│   │   ├── driver-list.page.ts
│   │   └── driver-form.page.ts
│   ├── maintenance/
│   │   ├── work-order-list.page.ts
│   │   └── work-order-form.page.ts
│   └── admin/
│       ├── user-list.page.ts
│       └── user-form.page.ts
├── specs/
│   ├── tier1-core-crud/        # 38 scenarios (Week 1-2)
│   │   ├── vehicle.spec.ts
│   │   ├── driver.spec.ts
│   │   ├── work-order.spec.ts
│   │   └── user-management.spec.ts
│   ├── tier2-workflows/        # 19 scenarios (Week 3-4)
│   │   ├── maintenance-lifecycle.spec.ts
│   │   ├── incident-workflow.spec.ts
│   │   └── document-processing.spec.ts
│   └── tier3-integrations/     # 18 scenarios (Week 5-6)
│       ├── gps-tracking.spec.ts
│       └── telematics.spec.ts
└── utils/
    ├── database-helper.ts      # DB reset utilities
    ├── api-helper.ts           # API test data creation
    └── assertions.ts           # Custom assertions
```

### Test Data Strategy

**Using Seed System (Phase 1)**:
```typescript
// Before each test suite
test.beforeEach(async ({ page }) => {
  // Reset database to baseline snapshot
  await exec('npm run db:reset:fast'); // < 10s pg_restore

  // Seed deterministic test data
  await exec('npm run seed'); // Creates 3 tenants, 150 vehicles, etc.

  // Authenticate as test user
  await loginAs(page, 'fleet-manager@tenant1.test', 'FleetTest2026!');
});
```

**Deterministic Test Data**:
- Seed: `fleet-test-2026` (reproducible UUIDs, names, dates)
- 3 tenants with isolated data
- Predictable IDs for assertions

---

## Tier 1: Core CRUD Operations (38 Scenarios)

### Priority: P0 (Critical)
### Timeline: Week 1-2
### Target Coverage: 5% → 10%

#### F001-F004: Vehicle Management (12 scenarios)

**Test File**: `e2e/specs/tier1-core-crud/vehicle.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { VehicleListPage } from '../page-objects/fleet/vehicle-list.page';
import { VehicleFormPage } from '../page-objects/fleet/vehicle-form.page';
import { loginAs, seedDatabase, resetDatabase } from '../fixtures/test-data';

test.describe('Vehicle Management - CRUD Operations', () => {

  test.beforeEach(async ({ page }) => {
    await resetDatabase();
    await seedDatabase();
    await loginAs(page, 'FLEET_MANAGER');
  });

  test('F001-T001: Create vehicle with all required fields (Happy Path)', async ({ page }) => {
    const vehicleList = new VehicleListPage(page);
    const vehicleForm = new VehicleFormPage(page);

    // Navigate to vehicle list
    await vehicleList.goto();
    await expect(vehicleList.pageTitle).toHaveText('Fleet Management');

    // Click "Add Vehicle" button
    await vehicleList.clickAddVehicle();

    // Fill form with valid data
    await vehicleForm.fillVIN('1FAHP3F29CL123456'); // Valid Ford VIN
    await vehicleForm.fillMake('Ford');
    await vehicleForm.fillModel('F-150');
    await vehicleForm.fillYear('2023');
    await vehicleForm.fillLicensePlate('ABC1234');
    await vehicleForm.selectState('CA');

    // Upload vehicle photo
    await vehicleForm.uploadPhoto('./fixtures/test-vehicle.jpg');

    // Submit form
    await vehicleForm.submit();

    // Assertions
    await expect(page.locator('.success-toast')).toContainText('Vehicle created successfully');
    await expect(vehicleList.vehicleTable).toContainText('1FAHP3F29CL123456');

    // Verify in database
    const vehicleInDb = await vehicleList.getVehicleByVIN('1FAHP3F29CL123456');
    expect(vehicleInDb).toBeDefined();
    expect(vehicleInDb.make).toBe('Ford');

    // Verify audit log
    const auditLog = await vehicleList.getLatestAuditLog();
    expect(auditLog.action).toBe('VEHICLE_CREATED');
    expect(auditLog.user_role).toBe('FLEET_MANAGER');
  });

  test('F001-T002: Attempt to create vehicle with duplicate VIN (Edge Case)', async ({ page }) => {
    const vehicleForm = new VehicleFormPage(page);

    await vehicleForm.goto();

    // Use VIN from seeded data (known to exist)
    await vehicleForm.fillVIN('1FMCU0G61HUA12345'); // From seed data
    await vehicleForm.fillMake('Ford');
    await vehicleForm.submit();

    // Assertions
    await expect(page.locator('.error-message')).toContainText('VIN already exists');
    await expect(vehicleForm.vinInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('F001-T003: Create vehicle with invalid VIN format (Validation)', async ({ page }) => {
    const vehicleForm = new VehicleFormPage(page);

    await vehicleForm.goto();
    await vehicleForm.fillVIN('INVALID'); // Too short
    await vehicleForm.submit();

    await expect(page.locator('.error-message')).toContainText('VIN must be exactly 17 characters');
  });

  test('F002-T001: View vehicle list with pagination (Happy Path)', async ({ page }) => {
    const vehicleList = new VehicleListPage(page);

    await vehicleList.goto();

    // Verify vehicles from seed data are displayed
    await expect(vehicleList.vehicleRows).toHaveCount(20); // Default page size
    await expect(vehicleList.paginationInfo).toContainText('1-20 of 50'); // Seed creates 50 vehicles

    // Navigate to page 2
    await vehicleList.clickNextPage();
    await expect(vehicleList.paginationInfo).toContainText('21-40 of 50');
  });

  test('F002-T002: Filter vehicles by status (Filtering)', async ({ page }) => {
    const vehicleList = new VehicleListPage(page);

    await vehicleList.goto();
    await vehicleList.selectStatusFilter('IN_SERVICE');

    // Verify only IN_SERVICE vehicles shown (80% of seed data)
    const rows = await vehicleList.vehicleRows.count();
    expect(rows).toBeGreaterThan(30); // Approximately 40 of 50 vehicles
  });

  test('F003-T001: Update vehicle information (Happy Path)', async ({ page }) => {
    const vehicleList = new VehicleListPage(page);
    const vehicleForm = new VehicleFormPage(page);

    await vehicleList.goto();

    // Click edit on first vehicle (from seed data)
    await vehicleList.clickEditVehicle(0);

    // Update odometer reading
    await vehicleForm.fillOdometer('50000');
    await vehicleForm.submit();

    // Verify update
    await expect(page.locator('.success-toast')).toContainText('Vehicle updated');
    await expect(vehicleList.vehicleRows.first()).toContainText('50,000 mi');
  });

  test('F004-T001: Delete vehicle (Happy Path)', async ({ page }) => {
    const vehicleList = new VehicleListPage(page);

    await vehicleList.goto();

    const initialCount = await vehicleList.vehicleRows.count();

    // Delete first vehicle
    await vehicleList.clickDeleteVehicle(0);
    await page.locator('[data-testid="confirm-delete"]').click();

    // Verify deletion
    await expect(page.locator('.success-toast')).toContainText('Vehicle deleted');
    await expect(vehicleList.vehicleRows).toHaveCount(initialCount - 1);
  });

  test('F004-T002: Attempt to delete assigned vehicle (Business Rule)', async ({ page }) => {
    const vehicleList = new VehicleListPage(page);

    await vehicleList.goto();

    // Find vehicle with active assignment (from seed data)
    await vehicleList.clickDeleteVehicle('1FMCU0G61HUA12345'); // Known assigned vehicle
    await page.locator('[data-testid="confirm-delete"]').click();

    // Verify prevention
    await expect(page.locator('.error-message')).toContainText('Cannot delete vehicle with active assignments');
  });

  // Additional 4 scenarios for view details, bulk operations, etc.
});
```

#### F042-F043: Driver Management (10 scenarios)

**Test File**: `e2e/specs/tier1-core-crud/driver.spec.ts`

```typescript
test.describe('Driver Management - CRUD Operations', () => {

  test('F042-T001: Create driver with all certifications', async ({ page }) => {
    const driverForm = new DriverFormPage(page);

    await driverForm.goto();
    await driverForm.fillFirstName('John');
    await driverForm.fillLastName('Doe');
    await driverForm.fillLicenseNumber('D1234567'); // CA format
    await driverForm.selectLicenseState('CA');
    await driverForm.fillLicenseExpiration('2026-12-31');

    // Add certifications
    await driverForm.addCertification('CDL', '2026-06-30');
    await driverForm.addCertification('HAZMAT', '2025-12-31');

    await driverForm.submit();

    await expect(page.locator('.success-toast')).toContainText('Driver created');

    // Verify certifications stored
    const driver = await driverForm.getDriverByName('John', 'Doe');
    expect(driver.certifications).toHaveLength(2);
  });

  test('F042-T002: Create driver with expired license (Validation)', async ({ page }) => {
    const driverForm = new DriverFormPage(page);

    await driverForm.goto();
    await driverForm.fillFirstName('Jane');
    await driverForm.fillLastName('Smith');
    await driverForm.fillLicenseExpiration('2020-01-01'); // Expired

    await driverForm.submit();

    await expect(page.locator('.error-message')).toContainText('License has expired');
  });

  // Additional 8 scenarios
});
```

#### F024-F025: Work Order Management (8 scenarios)

**Test File**: `e2e/specs/tier1-core-crud/work-order.spec.ts`

```typescript
test.describe('Work Order Management - CRUD Operations', () => {

  test('F024-T001: Create preventive maintenance work order', async ({ page }) => {
    const workOrderForm = new WorkOrderFormPage(page);

    await workOrderForm.goto();
    await workOrderForm.selectVehicle('1FMCU0G61HUA12345'); // From seed data
    await workOrderForm.selectType('PREVENTIVE');
    await workOrderForm.fillDescription('30,000 mile service');
    await workOrderForm.setPriority('MEDIUM');

    await workOrderForm.submit();

    await expect(page.locator('.success-toast')).toContainText('Work order created');

    // Verify work order number generation (WO-YYYY-XXXXX)
    const workOrderNumber = await workOrderForm.getGeneratedWorkOrderNumber();
    expect(workOrderNumber).toMatch(/^WO-2026-\d{5}$/);
  });

  test('F024-T002: Assign work order to mechanic', async ({ page }) => {
    const workOrderDetail = new WorkOrderDetailPage(page);

    // Navigate to existing work order (from seed data)
    await workOrderDetail.gotoWorkOrder('WO-2026-00001');

    // Assign to mechanic
    await workOrderDetail.assignTo('mechanic1@tenant1.test');

    await expect(page.locator('.success-toast')).toContainText('Work order assigned');

    // Verify state transition (PENDING → IN_PROGRESS)
    const status = await workOrderDetail.getStatus();
    expect(status).toBe('IN_PROGRESS');
  });

  // Additional 6 scenarios
});
```

#### F146-F147: User Management (8 scenarios)

**Test File**: `e2e/specs/tier1-core-crud/user-management.spec.ts`

```typescript
test.describe('User Management - CRUD Operations', () => {

  test('F146-T001: Create user with FLEET_MANAGER role', async ({ page }) => {
    const userForm = new UserFormPage(page);

    await loginAs(page, 'SYSTEM_ADMIN'); // Only admin can create users

    await userForm.goto();
    await userForm.fillEmail('newmanager@tenant1.test');
    await userForm.fillFirstName('Alice');
    await userForm.fillLastName('Manager');
    await userForm.selectRole('FLEET_MANAGER');
    await userForm.fillPassword('ComplexP@ssw0rd123');

    await userForm.submit();

    await expect(page.locator('.success-toast')).toContainText('User created');

    // Verify password hashing (bcrypt cost 12+)
    const user = await userForm.getUserByEmail('newmanager@tenant1.test');
    expect(user.password_hash).toMatch(/^\$2[aby]\$12\$/);
  });

  test('F146-T002: Attempt to create user with weak password', async ({ page }) => {
    const userForm = new UserFormPage(page);

    await loginAs(page, 'SYSTEM_ADMIN');
    await userForm.goto();

    await userForm.fillEmail('test@tenant1.test');
    await userForm.fillPassword('weak'); // Too short

    await userForm.submit();

    await expect(page.locator('.error-message')).toContainText('Password must be at least 8 characters');
  });

  // Additional 6 scenarios
});
```

---

## Tier 2: Critical Workflows (19 Scenarios)

### Priority: P0 (Critical Workflows)
### Timeline: Week 3-4
### Target Coverage: 10% → 15%

#### F026: Maintenance Lifecycle Workflow (5 scenarios)

**Test File**: `e2e/specs/tier2-workflows/maintenance-lifecycle.spec.ts`

```typescript
test.describe('Maintenance Lifecycle - End-to-End Workflow', () => {

  test('F026-T001: Complete maintenance workflow (Happy Path)', async ({ page }) => {
    // 1. Schedule maintenance
    const schedule = new MaintenanceSchedulePage(page);
    await schedule.createSchedule({
      vehicle: '1FMCU0G61HUA12345',
      type: 'PREVENTIVE',
      dueDate: '2026-02-01',
      estimatedCost: 500
    });

    // 2. Auto-generate work order (cron job simulation)
    await page.waitForTimeout(1000); // Simulate scheduled job

    // 3. Assign to mechanic
    const workOrder = new WorkOrderDetailPage(page);
    await workOrder.gotoLatestWorkOrder();
    await workOrder.assignTo('mechanic1@tenant1.test');

    // Verify state: PENDING → IN_PROGRESS
    expect(await workOrder.getStatus()).toBe('IN_PROGRESS');

    // 4. Complete work
    await loginAs(page, 'MECHANIC');
    await workOrder.addLabor(2.5, 'Oil change and filter replacement');
    await workOrder.addPart('Oil Filter', 15.99, 1);
    await workOrder.addPart('Motor Oil 5W-30', 29.99, 6);
    await workOrder.markComplete();

    // Verify state: IN_PROGRESS → COMPLETED
    expect(await workOrder.getStatus()).toBe('COMPLETED');

    // 5. Approve completion (Fleet Manager)
    await loginAs(page, 'FLEET_MANAGER');
    await workOrder.approve();

    // Verify final state: COMPLETED → CLOSED
    expect(await workOrder.getStatus()).toBe('CLOSED');

    // Verify cost calculation
    const totalCost = await workOrder.getTotalCost();
    expect(totalCost).toBe((2.5 * 75) + 15.99 + (29.99 * 6)); // $15.99 + $179.94 + $187.50 = $383.43

    // Verify vehicle maintenance history updated
    const vehicleDetail = new VehicleDetailPage(page);
    await vehicleDetail.gotoVehicle('1FMCU0G61HUA12345');
    await vehicleDetail.selectTab('Maintenance');

    expect(await vehicleDetail.maintenanceHistory).toContainText('Oil change');
  });

  // Additional 4 scenarios (timeout, cancellation, cost overrun, parts shortage)
});
```

#### F065-F066: Incident Workflow (5 scenarios)

#### F087: Document Processing with OCR (4 scenarios)

#### F100: Personal Use Billing Workflow (5 scenarios)

---

## Tier 3: Real-Time & Integrations (18 Scenarios)

### Priority: P0 (Real-Time Critical)
### Timeline: Week 5-6
### Target Coverage: 15% → 20%

#### F118-F120: GPS Tracking & Geofencing (6 scenarios)

**Test File**: `e2e/specs/tier3-integrations/gps-tracking.spec.ts`

```typescript
test.describe('GPS Tracking & Geofencing', () => {

  test('F118-T001: Receive GPS location update via webhook', async ({ page, request }) => {
    const vehicleMap = new VehicleMapPage(page);

    await vehicleMap.goto();

    // Simulate Samsara webhook POST
    const webhookResponse = await request.post('http://localhost:3000/api/webhooks/samsara/gps', {
      data: {
        vehicle: { externalId: 'VEHICLE_001' },
        location: { latitude: 37.7749, longitude: -122.4194 },
        time: new Date().toISOString(),
        speed: 55
      },
      headers: {
        'X-Samsara-Signature': 'valid-hmac-signature'
      }
    });

    expect(webhookResponse.status()).toBe(200);

    // Verify real-time update on map (WebSocket)
    await page.waitForTimeout(500); // Allow WebSocket propagation

    const vehicleMarker = await vehicleMap.getVehicleMarker('VEHICLE_001');
    expect(vehicleMarker.position.lat).toBeCloseTo(37.7749, 4);
    expect(vehicleMarker.position.lng).toBeCloseTo(-122.4194, 4);
  });

  test('F120-T001: Trigger geofence violation alert', async ({ page, request }) => {
    // Create geofence
    const geofence = new GeofencePage(page);
    await geofence.create({
      name: 'Headquarters',
      center: { lat: 37.7749, lng: -122.4194 },
      radius: 1000 // meters
    });

    // Simulate GPS update OUTSIDE geofence
    await request.post('http://localhost:3000/api/webhooks/samsara/gps', {
      data: {
        vehicle: { externalId: 'VEHICLE_001' },
        location: { latitude: 37.8000, longitude: -122.4500 }, // ~5km away
        time: new Date().toISOString()
      }
    });

    // Verify alert created
    const alerts = new AlertsPage(page);
    await alerts.goto();

    await expect(alerts.alertsList).toContainText('Geofence violation: VEHICLE_001');
    await expect(alerts.alertsList).toContainText('Outside Headquarters');
  });

  // Additional 4 scenarios
});
```

---

## Page Object Model Templates

### Base Page Object

```typescript
// e2e/page-objects/base.page.ts
import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly url: string;

  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;
  }

  async goto() {
    await this.page.goto(this.url);
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('[data-testid="page-loaded"]', { timeout: 10000 });
  }

  async fillInput(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  async clickButton(selector: string) {
    await this.page.click(selector);
  }

  async selectDropdown(selector: string, value: string) {
    await this.page.selectOption(selector, value);
  }

  async uploadFile(selector: string, filePath: string) {
    await this.page.setInputFiles(selector, filePath);
  }

  async getTableRowCount(tableSelector: string): Promise<number> {
    return await this.page.locator(`${tableSelector} tbody tr`).count();
  }

  async waitForToast(message: string, type: 'success' | 'error' = 'success') {
    await this.page.waitForSelector(`.${type}-toast:has-text("${message}")`, { timeout: 5000 });
  }
}
```

### Vehicle List Page Object

```typescript
// e2e/page-objects/fleet/vehicle-list.page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

export class VehicleListPage extends BasePage {
  readonly pageTitle: Locator;
  readonly addVehicleButton: Locator;
  readonly vehicleTable: Locator;
  readonly vehicleRows: Locator;
  readonly statusFilter: Locator;
  readonly searchInput: Locator;
  readonly paginationInfo: Locator;
  readonly nextPageButton: Locator;

  constructor(page: Page) {
    super(page, '/fleet-hub-consolidated');

    this.pageTitle = page.locator('h1');
    this.addVehicleButton = page.locator('[data-testid="add-vehicle"]');
    this.vehicleTable = page.locator('[data-testid="vehicle-table"]');
    this.vehicleRows = this.vehicleTable.locator('tbody tr');
    this.statusFilter = page.locator('[data-testid="status-filter"]');
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.paginationInfo = page.locator('[data-testid="pagination-info"]');
    this.nextPageButton = page.locator('[data-testid="next-page"]');
  }

  async clickAddVehicle() {
    await this.addVehicleButton.click();
  }

  async selectStatusFilter(status: string) {
    await this.statusFilter.selectOption(status);
    await this.waitForPageLoad();
  }

  async searchVehicle(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  async clickNextPage() {
    await this.nextPageButton.click();
    await this.waitForPageLoad();
  }

  async clickEditVehicle(index: number) {
    await this.vehicleRows.nth(index).locator('[data-testid="edit-button"]').click();
  }

  async clickDeleteVehicle(indexOrVin: number | string) {
    if (typeof indexOrVin === 'number') {
      await this.vehicleRows.nth(indexOrVin).locator('[data-testid="delete-button"]').click();
    } else {
      await this.vehicleRows.filter({ hasText: indexOrVin }).locator('[data-testid="delete-button"]').click();
    }
  }

  async getVehicleByVIN(vin: string) {
    // Query database helper
    const { getVehicleByVIN } = await import('../utils/database-helper');
    return await getVehicleByVIN(vin);
  }

  async getLatestAuditLog() {
    const { getLatestAuditLog } = await import('../utils/database-helper');
    return await getLatestAuditLog();
  }
}
```

---

## Test Fixtures & Utilities

### Authentication Fixture

```typescript
// e2e/fixtures/auth-fixture.ts
import { Page } from '@playwright/test';

export async function loginAs(page: Page, role: string) {
  const credentials = {
    'SYSTEM_ADMIN': { email: 'admin@tenant1.test', password: 'FleetTest2026!' },
    'FLEET_MANAGER': { email: 'manager@tenant1.test', password: 'FleetTest2026!' },
    'MECHANIC': { email: 'mechanic@tenant1.test', password: 'FleetTest2026!' },
    'DRIVER': { email: 'driver@tenant1.test', password: 'FleetTest2026!' }
  };

  const cred = credentials[role];

  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', cred.email);
  await page.fill('[data-testid="password-input"]', cred.password);
  await page.click('[data-testid="login-button"]');

  await page.waitForURL('/dashboard');
}
```

### Database Helper

```typescript
// e2e/utils/database-helper.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { Pool } from 'pg';

const execAsync = promisify(exec);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://fleet_user:fleet_password@localhost:5432/fleet_db'
});

export async function resetDatabase() {
  await execAsync('cd api && npm run db:reset:fast');
}

export async function seedDatabase() {
  await execAsync('cd api && npm run seed');
}

export async function getVehicleByVIN(vin: string) {
  const result = await pool.query('SELECT * FROM vehicles WHERE vin = $1', [vin]);
  return result.rows[0];
}

export async function getLatestAuditLog() {
  const result = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1');
  return result.rows[0];
}

export async function getUserByEmail(email: string) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}
```

---

## Test Execution Plan

### Local Development

```bash
# Run all tests
npm run test:e2e

# Run specific tier
npm run test:e2e -- e2e/specs/tier1-core-crud

# Run specific feature
npm run test:e2e -- e2e/specs/tier1-core-crud/vehicle.spec.ts

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run with UI mode (debug)
npm run test:e2e -- --ui

# Generate HTML report
npm run test:e2e -- --reporter=html
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: fleet_db_test
          POSTGRES_USER: fleet_user
          POSTGRES_PASSWORD: fleet_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          npm ci
          cd api && npm ci

      - name: Run migrations
        run: cd api && npm run migrate

      - name: Create database snapshot
        run: cd api && npm run db:snapshot baseline

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start API server
        run: cd api && npm run dev &

      - name: Start frontend server
        run: npm run dev &

      - name: Wait for servers
        run: npx wait-on http://localhost:5173 http://localhost:3000/health

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://fleet_user:fleet_password@localhost:5432/fleet_db_test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Coverage Tracking

### Test Coverage Dashboard

Create `/artifacts/testing/test-coverage-tracker.json`:

```json
{
  "last_updated": "2026-01-08",
  "overall_coverage": {
    "features_tested": 47,
    "features_total": 187,
    "percentage": 25.1,
    "scenarios_implemented": 141,
    "scenarios_planned": 562
  },
  "tier_progress": {
    "tier1_core_crud": {
      "status": "COMPLETE",
      "features": 12,
      "scenarios": 38,
      "pass_rate": 100
    },
    "tier2_workflows": {
      "status": "COMPLETE",
      "features": 8,
      "scenarios": 19,
      "pass_rate": 100
    },
    "tier3_integrations": {
      "status": "COMPLETE",
      "features": 6,
      "scenarios": 18,
      "pass_rate": 95
    }
  },
  "category_coverage": {
    "Fleet Management": 52,
    "Maintenance": 44,
    "Driver Management": 42,
    "Compliance": 36,
    "Telematics": 33,
    "Incidents": 40
  }
}
```

---

## Success Criteria

### Phase 5 Complete When:
- ✅ 107 new test scenarios implemented
- ✅ 25% feature coverage achieved (47/187 features)
- ✅ All P0 CRUD operations tested
- ✅ Critical workflows tested end-to-end
- ✅ Page Object Model architecture established
- ✅ CI/CD pipeline configured
- ✅ Test coverage dashboard created
- ✅ < 10s database reset verified in CI
- ✅ All tests passing with 95%+ success rate

---

## Next Steps After Phase 5

1. **Phase 6**: Implement dataflow verification harness
2. **Phase 7**: CAG critique and remediation loop
3. **Phase 8**: UI/UX standardization with visual regression tests
4. **Phase 9**: FedRAMP hardening with security-focused tests
5. **Phase 10**: Final certification with full regression suite

---

**This plan is ready for autonomous implementation by test generation agents.**
