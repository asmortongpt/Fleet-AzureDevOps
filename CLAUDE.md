# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Testing
npm test                    # Run all E2E tests
npm run test:ui             # Run tests in UI mode
npm run test:headed         # Run tests in headed mode (see browser)
npm run test:report         # View test report
npm run test:smoke          # Quick smoke tests
npm run test:main           # Main modules tests
npm run test:management     # Management modules
npm run test:a11y           # Accessibility tests
npm run test:security       # Security tests
npm run test:performance    # Performance tests

# Run single test file
npx playwright test tests/e2e/fleet-dashboard.spec.ts
```

## Architecture Overview

### Multi-Module Lazy-Loaded Architecture

Fleet is a comprehensive fleet management platform with **50+ specialized modules** that are lazy-loaded for optimal performance. The architecture follows a hub-and-spoke pattern:

**Core Application (`src/App.tsx`):**
- Main application shell with sidebar navigation
- Lazy loads all modules using React.lazy() and Suspense
- Module switching via `activeModule` state
- Reduces initial bundle by 80%+ through code splitting

**Module Structure:**
- All modules in `src/components/modules/` (40+ files)
- Each module is self-contained with own data fetching, UI, and logic
- Modules are registered in `src/lib/navigation.tsx` with sections: main, management, procurement, communication, tools

**Data Architecture - Hybrid API/Demo Pattern:**
- Production: Uses React Query (TanStack Query) hooks from `src/hooks/use-api.ts`
- Development/Demo: Falls back to demo data from `src/lib/demo-data.ts`
- Central data hook: `src/hooks/use-fleet-data.ts` manages hybrid data flow
- Demo mode: `localStorage.getItem('demo_mode') !== 'false'`

### Key Systems

**Drilldown Navigation System (`src/contexts/DrilldownContext.tsx`):**
- Multi-level breadcrumb navigation through related entities
- Stack-based history: push/pop/reset/goToLevel
- Used throughout for deep data exploration (vehicle → maintenance → work order)

**Inspect Drawer System (`src/services/inspect/`):**
- Side drawer for detailed entity views
- Triggered via drilldown or direct entity selection
- Supports all entity types: vehicles, drivers, work orders, facilities

**Real-time Telemetry:**
- Live vehicle updates using WebSocket emulation
- Hooks: `src/hooks/useVehicleTelemetry.ts`, `src/hooks/useSystemStatus.ts`
- Integrates with Microsoft Application Insights (`src/lib/telemetry.ts`)

**Module Registry Pattern:**
- Navigation items defined in `src/lib/navigation.tsx`
- Maps module IDs to components, icons, and sections
- Sidebar auto-generates from this registry

### Component Patterns

**Shadcn/UI Components:**
- All UI components in `src/components/ui/` (based on Radix UI)
- Accessible, composable primitives
- Customized with Tailwind CSS

**Layout Patterns:**
- **No-scroll dashboards:** Use `h-screen` + `grid-rows-[auto_1fr]` pattern
- **Split-screen layouts:** Map LEFT, Table/Data RIGHT (or configurable ratios)
- **Table over Cards:** Prefer spreadsheet-style tables for data density

**Data Fetching Pattern:**
```typescript
// Use React Query hooks from use-api.ts
import { useVehicles, useVehicleMutations } from '@/hooks/use-api'

const { data, isLoading, error } = useVehicles()
const { updateVehicle } = useVehicleMutations()
```

## TypeScript Configuration

**Strict Mode Enabled:** Full TypeScript strict mode is enabled in `tsconfig.json`:
- All strict checks: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, etc.
- Code quality: `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`
- **No unsafe operations allowed** - all types must be explicit

**Path Aliases:**
- `@/*` maps to `src/*` for clean imports
- Example: `import { Button } from "@/components/ui/button"`

## Critical Build Fixes

**Module Preload Order Fix (vite.config.ts):**
- Custom plugin fixes React dependency loading order
- Prevents: "Cannot read properties of undefined (reading 'useLayoutEffect')"
- Ensures `react-vendor` loads before `react-utils` (which contains @floating-ui/react)

**Code Splitting Strategy:**
- Main chunk: ~927 KB (272 KB gzipped)
- Each module: 10-100 KB lazy-loaded on demand
- Reduces initial load time by 80%+

## Testing Infrastructure

**Playwright E2E Tests:**
- 122+ tests organized in `tests/e2e/` by category
- Test structure: `00-smoke-tests/`, `01-main-modules/`, `02-management-modules/`, etc.
- Runs against: `http://localhost:5173` (dev) or `http://68.220.148.2` (production)
- CI/CD: Automated on PR, push to main, and nightly at 2 AM UTC

**Test Best Practices:**
- Tests grouped by module functionality
- Mobile + desktop configurations
- Accessibility, performance, and security test suites
- Artifacts retained for 7-30 days

## Environment Variables

**Demo Mode Control:**
```bash
# Enable demo data (default)
localStorage.setItem('demo_mode', 'true')

# Disable demo data (use real API)
localStorage.setItem('demo_mode', 'false')
```

**Debug Logging:**
```bash
# Enable verbose fleet data logging
localStorage.setItem('debug_fleet_data', 'true')
```

## Common Development Patterns

### Adding a New Module

1. Create component in `src/components/modules/YourModule.tsx`
2. Add lazy import in `src/App.tsx`:
   ```typescript
   const YourModule = lazy(() => import("@/components/modules/YourModule").then(m => ({ default: m.YourModule })))
   ```
3. Register in `src/lib/navigation.tsx`:
   ```typescript
   {
     id: "your-module",
     label: "Your Module",
     icon: <Icon className="w-5 h-5" />,
     section: "main" // or management/procurement/communication/tools
   }
   ```
4. Add case in `src/App.tsx` renderActiveModule():
   ```typescript
   case "your-module":
     return <YourModule data={fleetData} />
   ```

### Adding a New API Endpoint

1. Define hook in `src/hooks/use-api.ts`:
   ```typescript
   export function useYourData() {
     return useQuery({
       queryKey: ['your-data'],
       queryFn: async () => {
         const res = await fetch('/api/your-endpoint')
         return res.json()
       }
     })
   }
   ```
2. Add mutation if needed:
   ```typescript
   export function useYourMutations() {
     const queryClient = useQueryClient()
     return {
       createItem: useMutation({
         mutationFn: async (data) => { /* ... */ },
         onSuccess: () => queryClient.invalidateQueries(['your-data'])
       })
     }
   }
   ```

### Using Drilldown Navigation

```typescript
import { useDrilldown } from '@/contexts/DrilldownContext'

const { push } = useDrilldown()

// Navigate to related entity
push({
  id: `vehicle-${vehicle.id}`,
  type: 'vehicle',
  label: `${vehicle.make} ${vehicle.model}`,
  data: vehicle
})
```

## Performance Considerations

- **Lazy Loading:** All modules MUST be lazy-loaded via React.lazy()
- **Code Splitting:** Vite automatically splits vendor/react chunks
- **Memoization:** Use `useMemo` for expensive computations in tables/lists
- **Virtual Scrolling:** Consider for lists >100 items
- **Bundle Analysis:** Run `npm run build:analyze` to check bundle sizes

## Deployment

**Production URL:** `http://68.220.148.2`

**CI/CD Pipeline:**
- GitHub Actions workflows in `.github/workflows/`
- Automated testing on PR and merge
- Production deployment triggers on main branch push

---

# Backend API Architecture

Fleet includes a comprehensive Express/TypeScript backend API in the `api/` directory.

## API Development Commands

```bash
# API Development (run from api/ directory)
cd api
npm install --legacy-peer-deps  # Install dependencies
npm run dev                      # Start dev server with hot reload (tsx watch)
npm run build                    # Build TypeScript to dist/
npm start                        # Start production server
npm test                         # Run tests
npm run lint                     # Lint TypeScript code

# Database & Seeding
npm run migrate                  # Run database migrations
npm run seed                     # Seed comprehensive test data
npm run seed:verify              # Verify seeded data integrity

# Deployment
cd /Users/andrewmorton/Documents/GitHub/Fleet
az acr build --registry fleetproductionacr \
  --image fleet-api:latest \
  --file api/Dockerfile ./api    # Build API image in Azure ACR
```

## API Architecture Overview

**Technology Stack:**
- **Runtime:** Node.js 20 + Express.js
- **Language:** TypeScript (strict mode enabled)
- **DI Container:** InversifyJS for dependency injection
- **Database:** PostgreSQL with pg driver
- **Job Queue:** Bull (Redis-based) for background jobs
- **Monitoring:** Application Insights + Sentry
- **Authentication:** JWT + Azure AD OAuth
- **Security:** Helmet, CORS, CSRF protection, rate limiting

**Key Architectural Patterns:**

1. **Emulator-First Development** (`api/src/emulators/`):
   - Real-time GPS, fuel, maintenance, OBD2, and IoT data emulators
   - Enables full-stack development without external dependencies
   - Each emulator generates realistic test data with proper relationships
   - Used in both development and demo modes

2. **Dependency Injection Pattern** (`api/src/container.ts`):
   - InversifyJS container manages service lifecycle
   - Controllers → Services → Repositories architecture
   - Clean separation of concerns, easy to test

3. **Middleware Security Stack** (applied in order):
   - Security headers (Helmet) - HSTS, CSP, X-Frame-Options
   - CORS with strict origin validation
   - Global rate limiting (DoS prevention)
   - Route-specific smart rate limiting
   - CSRF token protection on state-changing operations
   - Input validation and sanitization

4. **Background Job Processing** (`api/src/jobs/`):
   - Bull queues for email, notifications, and reports
   - Cron-scheduled jobs for maintenance, webhooks, telemetry sync
   - Graceful shutdown with job cleanup

5. **Multi-Tenant Architecture**:
   - Tenant context middleware injects `tenant_id` into requests
   - Row-Level Security (RLS) enforced at database layer
   - All queries filtered by tenant automatically

## Route Organization (100+ endpoints)

Routes are organized by feature domain in `api/src/routes/`:

**Core Fleet Management:**
- `vehicles.ts` - Vehicle CRUD and telematics
- `drivers.ts` - Driver management and scoring
- `fuel-transactions.ts` - Fuel tracking and analytics
- `maintenance.ts` - Maintenance records
- `work-orders.ts` - Work order management

**Asset & Equipment:**
- `asset-management.routes.ts` - Asset tracking, QR codes, depreciation
- `heavy-equipment.routes.ts` - Heavy machinery management
- `assets-mobile.routes.ts` - Mobile asset tracking

**Tracking & Telematics:**
- `gps.ts` - Real-time GPS tracking (emulated)
- `telemetry.ts` - Vehicle telemetry data
- `geofences.ts` - Geofence management
- `obd2-emulator.routes.ts` - OBD2 diagnostic data

**EV Management:**
- `ev-management.routes.ts` - Electric vehicle operations
- `charging-sessions.ts` - Charging session tracking
- `charging-stations.ts` - Station management

**Documents & OCR:**
- `documents.ts` - Document storage and retrieval
- `ocr.routes.ts` - OCR processing for receipts/forms
- `attachments.routes.ts` - File uploads and attachments

**AI & Automation:**
- `ai-insights.routes.ts` - AI-powered analytics
- `langchain.routes.ts` - LangChain-based document Q&A
- `fleet-optimizer.routes.ts` - Fleet optimization algorithms

**Mobile Integration:**
- `mobile-*.routes.ts` - 10+ mobile app endpoints
- Mobile photo uploads, OCR, damage reports, trips

**System Management:**
- `health.routes.ts` - Health checks
- `monitoring.ts` - System monitoring
- `queue.routes.ts` - Job queue management

## Critical Security Patterns

**SQL Injection Prevention:**
```typescript
// ALWAYS use parameterized queries
const result = await pool.query(
  'SELECT * FROM vehicles WHERE id = $1 AND tenant_id = $2',
  [vehicleId, tenantId]
)

// NEVER use string concatenation
// ❌ BAD: `SELECT * FROM vehicles WHERE id = ${vehicleId}`
```

**Authentication Pattern:**
```typescript
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

// Protect routes with JWT + permission checks
router.get('/sensitive-data',
  authenticateJWT,
  requirePermission('vehicles:read'),
  async (req, res) => { /* ... */ }
)
```

**CSRF Protection:**
```typescript
import { csrfProtection } from '../middleware/csrf'

// Apply CSRF to all state-changing operations
router.post('/create', csrfProtection, async (req, res) => { /* ... */ })
router.put('/update/:id', csrfProtection, async (req, res) => { /* ... */ })
router.delete('/delete/:id', csrfProtection, async (req, res) => { /* ... */ })
```

**Input Validation:**
```typescript
import { validate } from '../middleware/validation'
import { createVehicleSchema } from '../schemas/vehicle.schema'

// Validate request body with Zod schemas
router.post('/',
  validate(createVehicleSchema, 'body'),
  async (req, res) => { /* ... */ }
)
```

## Container Deployment

**Multi-Stage Docker Build** (`api/Dockerfile`):
1. Builder stage: Install deps + compile TypeScript
2. Production stage: Minimal Alpine image with only runtime deps
3. Runs with non-root user (`nodejs:1001`)
4. Uses `tsx` for direct TypeScript execution (faster startup than transpiled JS)
5. Health check on `/api/health` endpoint

**Production Deployment:**
- Deployed to Azure Container Apps
- PostgreSQL database (Azure Database for PostgreSQL)
- Redis for Bull queues (optional, gracefully degrades)
- Application Insights + Sentry for monitoring
- Environment variables managed via Azure Key Vault

**API Base URL:** `https://fleet-api.gentlepond-ec715fc2.eastus2.azurecontainerapps.io`

## Adding a New API Route

1. Create route file in `api/src/routes/your-feature.ts`:
   ```typescript
   import { Router } from 'express'
   import { authenticateJWT } from '../middleware/auth'
   import { csrfProtection } from '../middleware/csrf'
   import { pool } from '../container'

   const router = Router()

   router.get('/', authenticateJWT, async (req, res) => {
     const { tenant_id } = req.user
     const result = await pool.query(
       'SELECT * FROM your_table WHERE tenant_id = $1',
       [tenant_id]
     )
     res.json({ data: result.rows })
   })

   export default router
   ```

2. Register route in `api/src/server.ts`:
   ```typescript
   import yourFeatureRouter from './routes/your-feature'
   app.use('/api/your-feature', yourFeatureRouter)
   ```

3. Add schema validation in `api/src/schemas/your-feature.schema.ts` (use Zod)

4. Test with `npm test` and deploy via Azure ACR

## Debugging Tips

**Enable Verbose Logging:**
```bash
# In api/.env
LOG_LEVEL=debug
DEBUG=*
```

**Check Container Logs:**
```bash
az containerapp logs show \
  --name fleet-api \
  --resource-group fleet-production-rg \
  --tail 100
```

**Common TypeScript Errors:**
- Ensure `pool` is imported from `../container` (not `../database`)
- Use parameterized queries with `$1, $2, $3` placeholders
- Always type request/response objects for type safety

---

## Security Notes

All security requirements from global .env file apply:
- Parameterized queries only ($1, $2, $3) - never string concatenation
- No hardcoded secrets - use env vars or Azure Key Vault
- bcrypt/argon2 for passwords, validate JWTs properly
- Validate ALL inputs (whitelist approach), escape output
- Security headers (Helmet), HTTPS everywhere
