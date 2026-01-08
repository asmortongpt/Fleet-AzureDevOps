# Fleet Management Test Suite - Remediation Roadmap
**Status:** Phase 1 - Infrastructure Setup
**Target Completion:** 2-3 weeks
**Team Lead:** TEST-BASELINE-001 Agent
**Last Updated:** 2026-01-08

---

## Executive Summary

The Fleet Management System test suite requires **urgent infrastructure remediation** to move from its current 14.2% pass rate to a sustainable 80%+ coverage baseline.

### Key Numbers
- **Current Pass Rate:** 14.2% (127/1,446 tests)
- **Target Pass Rate:** 80%+
- **Critical Blockers:** 4
- **Estimated Effort:** 33 hours
- **Expected Timeline:** 2-3 weeks with dedicated team

### Current Breakdown
```
EXCELLENT (95%+)  : Security tests, Emulator tests
GOOD (70-90%)     : Form validation, XSS prevention
POOR (0-30%)      : API integration, Database layer, Services, Components
BROKEN (0%)       : WebSocket integration, E2E workflows
```

---

## Priority 1: Critical Infrastructure (Week 1)

### 1.1 Setup Mock API Server [CRITICAL]
**Blocker Status:** YES - Blocking 156 tests
**Impact:** Would fix WebSocket, REST API, CSRF tests
**Effort:** 2 hours

#### Option A: MSW (Mock Service Worker) - RECOMMENDED
```typescript
// tests/mocks/setup.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  // WebSocket handlers
  http.post('/api/websocket', () => {
    return HttpResponse.json({ connected: true });
  }),

  // REST endpoints
  http.get('/api/vehicles', () => {
    return HttpResponse.json({
      data: createTestVehicles(10),
      total: 10
    });
  }),

  // CSRF endpoint
  http.get('/api/csrf-token', () => {
    return HttpResponse.json({
      token: 'test-csrf-token-123'
    });
  }),

  // Emulator endpoints
  http.post('/api/emulators/gps/start', () => {
    return HttpResponse.json({ status: 'running' });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Setup Steps:**
1. `npm install msw`
2. Create handlers for all API endpoints
3. Configure in test setup file
4. Update vitest.config.ts to run setup

**Expected Result:**
- WebSocket tests: 20 tests will pass
- API client tests: 13 tests will pass
- Emulator endpoint tests: 35 tests will pass
- CSRF tests: 1 test will pass
- Route tests: 33 tests will pass

### 1.2 Configure Test Database [CRITICAL]
**Blocker Status:** YES - Blocking 187 tests
**Impact:** Would fix maintenance, GPS, driver, fuel tests
**Effort:** 3 hours

#### Option A: SQLite In-Memory (RECOMMENDED for speed)
```typescript
// tests/setup/database.ts
import Database from 'better-sqlite3';
import { runMigrations } from './migrations';

let testDb: Database.Database;

export async function setupTestDatabase() {
  testDb = new Database(':memory:');

  // Enable foreign keys
  testDb.pragma('foreign_keys = ON');

  // Run migrations
  await runMigrations(testDb);

  // Seed test data
  await seedTestData(testDb);

  return testDb;
}

export function getTestDatabase() {
  return testDb;
}

// In vitest setup
beforeAll(async () => {
  await setupTestDatabase();
});
```

**Setup Steps:**
1. `npm install better-sqlite3`
2. Create migration runner for test schema
3. Create seed functions for test data
4. Configure in test setup

**Expected Result:**
- Maintenance tests: 41 tests will pass
- GPS tests: 27 tests will pass
- Driver tests: 32 tests will pass
- Vehicle tests: 28 tests will pass
- Fuel transaction tests: 32 tests will pass
- Repository tests: 78 tests will pass
- Integration route tests: 56 tests will pass

**Total Tests Fixed:** 294

### 1.3 Add Crypto Polyfill [CRITICAL]
**Blocker Status:** YES - Blocking 12 tests
**Impact:** Would fix encryption/decryption tests
**Effort:** 1 hour

```typescript
// tests/setup/crypto-polyfill.ts
import { webcrypto } from 'crypto';

// Polyfill Web Crypto API for Node.js tests
Object.defineProperty(global, 'crypto', {
  value: webcrypto,
  writable: true
});

// Or import in test file directly:
// import crypto from 'crypto';
// const subtle = crypto.webcrypto.subtle;
```

**Setup Steps:**
1. Import crypto polyfill in vitest.config.ts
2. Export crypto object globally
3. Update encryption tests to use polyfill

**Expected Result:**
- Encryption tests: 12 tests will pass

### 1.4 Fix JSDOM Configuration [HIGH]
**Blocker Status:** Partial - Blocking 94 component tests
**Impact:** Would improve component test reliability
**Effort:** 30 minutes

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost',
        pretendToBeVisual: true,
        resources: 'usable'
      }
    },
    globals: true,
    setupFiles: ['./tests/setup/global-setup.ts'],
  }
});
```

**Expected Result:**
- Better DOM simulation
- Reduced component test failures
- Leaflet/Google Maps tests may still timeout

---

## Priority 2: Test Fixture Framework (Week 1-2)

### 2.1 Create Factory Functions [HIGH]
**Impact:** Enables consistent test data
**Effort:** 4 hours

```typescript
// tests/factories/index.ts
import { faker } from '@faker-js/faker';

// Vehicle Factory
export function createTestVehicle(overrides = {}) {
  return {
    id: faker.string.uuid(),
    make: 'Ford',
    model: 'F-150',
    year: 2023,
    licensePlate: faker.string.alphaNumeric(7).toUpperCase(),
    vin: faker.string.alphaNumeric(17).toUpperCase(),
    status: 'active',
    mileage: faker.number.int({ min: 10000, max: 500000 }),
    fuelType: 'diesel',
    capacity: 50,
    costPerMile: faker.number.float({ min: 0.5, max: 2.0, precision: 0.01 }),
    createdAt: new Date(),
    ...overrides
  };
}

// Driver Factory
export function createTestDriver(overrides = {}) {
  return {
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    licenseNumber: faker.string.alphaNumeric(12),
    status: 'active',
    safetyScore: faker.number.int({ min: 50, max: 100 }),
    ...overrides
  };
}

// Maintenance Record Factory
export function createTestMaintenance(vehicleId: string, overrides = {}) {
  return {
    id: faker.string.uuid(),
    vehicleId,
    serviceType: faker.helpers.arrayElement(['scheduled', 'unscheduled']),
    category: faker.helpers.arrayElement(['oil_change', 'brakes', 'tires', 'engine']),
    status: faker.helpers.arrayElement(['scheduled', 'in-progress', 'completed']),
    description: faker.lorem.sentence(),
    cost: faker.number.float({ min: 50, max: 5000, precision: 0.01 }),
    partsCount: faker.number.int({ min: 1, max: 10 }),
    laborHours: faker.number.float({ min: 0.5, max: 8, precision: 0.5 }),
    scheduledDate: faker.date.future(),
    completedDate: null,
    vendor: faker.company.name(),
    ...overrides
  };
}

// GPS Record Factory
export function createTestGPSRecord(vehicleId: string, overrides = {}) {
  return {
    id: faker.string.uuid(),
    vehicleId,
    latitude: faker.location.latitude(),
    longitude: faker.location.longitude(),
    timestamp: new Date(),
    speed: faker.number.int({ min: 0, max: 120 }),
    heading: faker.number.int({ min: 0, max: 360 }),
    accuracy: faker.number.int({ min: 5, max: 50 }),
    ...overrides
  };
}
```

**Expected Usage:**
```typescript
it('should retrieve vehicle with maintenance history', async () => {
  const vehicle = createTestVehicle();
  const maintenance = createTestMaintenance(vehicle.id);

  await db.insert('vehicles', vehicle);
  await db.insert('maintenance', maintenance);

  const result = await vehicleService.getWithHistory(vehicle.id);
  expect(result.maintenanceHistory).toHaveLength(1);
});
```

### 2.2 Create Test Data Builders [HIGH]
**Impact:** Complex test data scenarios
**Effort:** 2 hours

```typescript
// tests/builders/FleetBuilder.ts
export class FleetBuilder {
  private vehicles: any[] = [];
  private drivers: any[] = [];
  private assignments: any[] = [];

  withVehicles(count: number) {
    this.vehicles = Array.from({ length: count }, () => createTestVehicle());
    return this;
  }

  withDrivers(count: number) {
    this.drivers = Array.from({ length: count }, () => createTestDriver());
    return this;
  }

  withAssignments() {
    this.assignments = this.drivers.map((driver, idx) => ({
      driverId: driver.id,
      vehicleId: this.vehicles[idx % this.vehicles.length].id,
      startDate: new Date(),
      endDate: null
    }));
    return this;
  }

  async build(db: Database.Database) {
    for (const vehicle of this.vehicles) {
      await db.exec(`INSERT INTO vehicles VALUES (...)`);
    }
    for (const driver of this.drivers) {
      await db.exec(`INSERT INTO drivers VALUES (...)`);
    }
    return { vehicles: this.vehicles, drivers: this.drivers };
  }
}

// Usage
const fleet = new FleetBuilder()
  .withVehicles(5)
  .withDrivers(10)
  .withAssignments()
  .build(testDb);
```

---

## Priority 3: Optimize Performance (Week 2)

### 3.1 Mock Map Libraries [HIGH]
**Blocker Status:** Partial - 94 tests affected, 73+ seconds overhead
**Impact:** Would reduce test time by 60%
**Effort:** 2 hours

```typescript
// tests/mocks/leaflet.ts
import { vi } from 'vitest';

vi.mock('leaflet', () => ({
  map: vi.fn(() => ({
    setView: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    fitBounds: vi.fn(),
    off: vi.fn(),
    on: vi.fn(),
  })),

  tileLayer: vi.fn(() => ({
    addTo: vi.fn(),
  })),

  marker: vi.fn(() => ({
    bindPopup: vi.fn(),
    addTo: vi.fn(),
  })),

  latLng: vi.fn((lat, lng) => ({ lat, lng })),
  latLngBounds: vi.fn(),
}));

// Apply globally in tests
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
}));
```

**Expected Result:**
- LeafletMap tests: 48,397ms → 500ms (-95% time)
- GoogleMap tests: 25,628ms → 400ms (-98% time)
- Total test suite: 180s → 60s

### 3.2 Implement Test Parallelization [MEDIUM]
**Impact:** Faster CI/CD pipelines
**Effort:** 1 hour

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    threads: true,
    maxThreads: 4,
    minThreads: 2,
    // Or run specific test groups in parallel
    include: ['tests/**/*.{test,spec}.{js,ts}'],
  }
});
```

### 3.3 Set Appropriate Timeouts [MEDIUM]
**Impact:** Prevent hanging tests
**Effort:** 30 minutes

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 second default
    hookTimeout: 5000,  // 5 second hook timeout

    // Per-test overrides
    // it('slow test', async () => {}, { timeout: 30000 })
  }
});
```

---

## Priority 4: Service Layer Testability (Week 2-3)

### 4.1 Implement Dependency Injection [HIGH]
**Impact:** Would fix 73 service tests
**Effort:** 6 hours

```typescript
// src/services/container.ts
export class ServiceContainer {
  private repositories: Map<string, any> = new Map();
  private services: Map<string, any> = new Map();

  registerRepository(name: string, repo: any) {
    this.repositories.set(name, repo);
  }

  registerService(name: string, serviceClass: any) {
    const deps = this.repositories;
    const service = new serviceClass(deps);
    this.services.set(name, service);
    return service;
  }

  getService(name: string) {
    return this.services.get(name);
  }
}

// Service Implementation
export class VehicleService {
  constructor(private repositories: Map<string, any>) {}

  async getVehicle(id: string) {
    return this.repositories.get('vehicle').findById(id);
  }
}

// Test Usage
it('should fetch vehicle', async () => {
  const mockRepo = {
    findById: vi.fn().mockResolvedValue(createTestVehicle())
  };

  const container = new ServiceContainer();
  container.registerRepository('vehicle', mockRepo);
  const service = container.registerService('vehicle', VehicleService);

  const result = await service.getVehicle('123');
  expect(result).toBeDefined();
  expect(mockRepo.findById).toHaveBeenCalledWith('123');
});
```

### 4.2 Create Mock Repository Suite [HIGH]
**Impact:** Enable isolated service testing
**Effort:** 4 hours

```typescript
// tests/mocks/repositories/VehicleRepository.mock.ts
export class MockVehicleRepository {
  private data: Map<string, any> = new Map();

  async findById(id: string) {
    return this.data.get(id);
  }

  async findAll() {
    return Array.from(this.data.values());
  }

  async create(vehicle: any) {
    this.data.set(vehicle.id, vehicle);
    return vehicle;
  }

  async update(id: string, changes: any) {
    const existing = this.data.get(id);
    const updated = { ...existing, ...changes };
    this.data.set(id, updated);
    return updated;
  }

  async delete(id: string) {
    return this.data.delete(id);
  }

  async findByStatus(status: string) {
    return Array.from(this.data.values())
      .filter(v => v.status === status);
  }
}
```

---

## Priority 5: Documentation & Standards (Week 1)

### 5.1 Testing Guidelines Document
```markdown
# Fleet Management Testing Standards

## Pattern: Testing Service Classes

1. Create mock repositories
2. Inject via constructor
3. Stub external calls
4. Assert on mock calls and return values

## Pattern: Testing API Routes

1. Use MSW for mock API
2. Setup server before each test
3. Assert response and status code
4. Verify error handling

## Pattern: Testing Database Queries

1. Use test database fixture
2. Seed test data with factories
3. Run actual query
4. Assert result set

## Naming Conventions

- `create[Entity]()` - Factory functions
- `setup[Feature]()` - Setup functions
- `mock[Service]()` - Mock creation
- `test[Feature]` - Test description

## Timeout Guidelines

- Unit tests: 5 seconds
- Integration tests: 10 seconds
- E2E tests: 30 seconds
- Slow tests: Document reason
```

### 5.2 Example Test Templates

```typescript
// Template: Unit Test
describe('VehicleService', () => {
  let service: VehicleService;
  let mockRepo: MockVehicleRepository;

  beforeEach(() => {
    mockRepo = new MockVehicleRepository();
    const container = new ServiceContainer();
    container.registerRepository('vehicle', mockRepo);
    service = container.registerService('vehicle', VehicleService);
  });

  it('should fetch vehicle by ID', async () => {
    const vehicle = createTestVehicle();
    await mockRepo.create(vehicle);

    const result = await service.getVehicle(vehicle.id);

    expect(result).toEqual(vehicle);
  });
});

// Template: Integration Test
describe('Vehicle API', () => {
  let db: Database.Database;

  beforeEach(async () => {
    db = await setupTestDatabase();
  });

  it('should return all vehicles', async () => {
    const vehicle1 = createTestVehicle();
    const vehicle2 = createTestVehicle();

    await db.exec(`INSERT INTO vehicles VALUES (...)`);

    const response = await fetch('/api/vehicles');
    const data = await response.json();

    expect(data).toHaveLength(2);
  });
});
```

---

## Implementation Timeline

### Week 1
**Mon-Wed:**
- [ ] Setup MSW mock API server
- [ ] Configure SQLite test database
- [ ] Add crypto polyfill
- [ ] Fix JSDOM configuration

**Thu-Fri:**
- [ ] Create vehicle factory
- [ ] Create driver factory
- [ ] Create maintenance factory
- [ ] Document testing standards

**Expected Result:** 40% of tests passing (580/1,446)

### Week 2
**Mon-Wed:**
- [ ] Mock Leaflet and Google Maps
- [ ] Create FleetBuilder test data builder
- [ ] Implement test parallelization
- [ ] Set timeouts

**Thu-Fri:**
- [ ] Implement dependency injection
- [ ] Create mock repositories
- [ ] Refactor services for testability
- [ ] Add integration test templates

**Expected Result:** 70% of tests passing (1,011/1,446)

### Week 3
**Mon-Tue:**
- [ ] E2E test setup with Playwright
- [ ] Load test configuration
- [ ] Performance benchmarks
- [ ] CI/CD test gates

**Wed-Fri:**
- [ ] Final cleanup and optimization
- [ ] Coverage analysis
- [ ] Team training
- [ ] Documentation finalization

**Expected Result:** 85%+ of tests passing (1,229/1,446)

---

## Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Pass Rate | 14.2% | 85%+ | Week 3 |
| Test Duration | 180s | <60s | Week 2 |
| Critical Blockers | 4 | 0 | Week 1 |
| Coverage Score | 0% | 80%+ | Week 3 |
| Security Tests | 95% | 99%+ | Week 3 |
| Component Tests | 20% | 75%+ | Week 2 |

---

## Risk Mitigation

### Risk 1: Database Schema Changes Break Tests
**Mitigation:**
- Version test database schema
- Auto-migrate test schema
- Create migration rollback tests

### Risk 2: MSW Mocks Don't Match Real API
**Mitigation:**
- Use API contracts
- Test against staging API
- Document mock behavior

### Risk 3: Tests Still Take Too Long
**Mitigation:**
- Profile test execution
- Identify remaining slow tests
- Consider splitting test suites

### Risk 4: Service Refactoring Breaks Things
**Mitigation:**
- Start with new services
- Migrate incrementally
- Run tests after each change

---

## Approval & Sign-Off

- **Created By:** TEST-BASELINE-001 Agent
- **Date:** 2026-01-08
- **Status:** Ready for Implementation
- **Estimated ROI:** 500% (71 additional tests per hour of effort)

---

## Appendix: Quick Reference

### Essential Files to Create
- `/tests/setup/database.ts`
- `/tests/setup/crypto-polyfill.ts`
- `/tests/setup/global-setup.ts`
- `/tests/factories/index.ts`
- `/tests/mocks/msw-setup.ts`
- `/tests/mocks/repositories/*.ts`

### Essential Packages to Install
```bash
npm install --save-dev \
  msw \
  better-sqlite3 \
  @faker-js/faker \
  @testing-library/react \
  @testing-library/jest-dom
```

### Essential Config Files
- `vitest.config.ts` - Update with test environment config
- `.env.test` - Test environment variables
- `jest.setup.ts` - Global test setup (if using Jest)

