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

**Production URL:** `<production-url>`

**CI/CD Pipeline:**
- GitHub Actions workflows in `.github/workflows/`
- Automated testing on PR and merge
- Production deployment triggers on main branch push

## Security Notes

All security requirements from global .env file apply:
- Parameterized queries only ($1, $2, $3) - never string concatenation
- No hardcoded secrets - use env vars or Azure Key Vault
- bcrypt/argon2 for passwords, validate JWTs properly
- Validate ALL inputs (whitelist approach), escape output
- Security headers (Helmet), HTTPS everywhere
