# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CTAFleet is an enterprise fleet management system with a React/TypeScript frontend and a Node.js/Express backend. Multi-tenant, Azure AD authenticated, deployed to Azure. Features: real-time vehicle tracking, driver management, telematics, compliance monitoring, cost analytics.

## Development Commands

### Frontend (root directory)
```bash
npm install --legacy-peer-deps     # Required: React 18/19 peer dep conflicts
npm run dev                        # Vite dev server → http://localhost:5173
npm run build                      # Production build (Vite + Terser)
npm run typecheck                  # tsc --noEmit
npm run lint                       # ESLint
npm test                           # Vitest unit tests
npm run test:coverage              # With V8 coverage
npm run test:a11y                  # Accessibility tests
```

### Backend (api/)
```bash
cd api && npm install
npm run dev                        # tsx watch → http://localhost:3001 (loads ../.env via dotenv-cli)
npm run build                      # esbuild → dist/server.js
npm run typecheck                  # tsc --noEmit
npm test                           # Vitest
npm run test:integration           # Integration tests
npm run migrate                    # Drizzle migrations
npm run seed                       # Seed database
npm run db:studio                  # Drizzle Kit visual explorer
```

### Database (PostgreSQL 16)
```bash
docker run -d --name fleet-postgres \
  -e POSTGRES_DB=fleet_db -e POSTGRES_USER=fleet_user \
  -e POSTGRES_PASSWORD=fleet_password -p 5432:5432 postgres:16-alpine
```

### Running Tests
```bash
npx vitest run src/path/to/file.test.tsx           # Single frontend test
cd api && npx vitest run src/path/to/file.test.ts  # Single backend test
npx playwright test tests/e2e/fleet-comprehensive.spec.ts  # E2E (28 tests)
npx playwright test --headed                       # E2E with visible browser
```

### E2E Testing Requirement
Set `DB_WEBAPP_POOL_SIZE=30` in `.env` before running E2E tests. Default pool size (10) causes connection exhaustion with parallel tests.

### After Schema Changes
```bash
cd api && npm run migrate && redis-cli FLUSHDB     # Run migrations + flush Redis cache
```

## Architecture

### Two Backend Servers

1. **`api/`** — Production backend (Express + TypeScript + Drizzle ORM, port 3001). Full auth, RBAC, 140+ registered routes, background jobs (Bull/BullMQ), Redis caching, Sentry, OpenTelemetry.
2. **`api-standalone/`** — Minimal JS Express server for prototyping (port 3000). No auth. Not for production.

Vite proxies `/api/*` and `/auth/*` to `http://localhost:3001` (see `vite.config.ts`).

### Frontend (src/)

**Routing**: React Router v7. Routes defined in `src/main.tsx`, lazy-loaded components mapped in `src/App.tsx`. 60+ code-split modules. Public routes: `/login`, `/auth/callback`. Everything else requires auth via `ProtectedRoute`.

**Provider nesting order** (in `main.tsx`): QueryClientProvider → MsalProvider → ThemeProvider → SentryErrorBoundary → BrandingProvider → AuthProvider → TenantProvider → PolicyProvider → FeatureFlagProvider → DrilldownProvider → InspectProvider → PanelProvider → BrowserRouter

**State management** (four layers):
- **React Contexts** (`src/contexts/`) — AuthContext, TenantContext, PolicyContext, DrilldownContext, PermissionContext, FeatureFlagContext
- **TanStack Query v5** — server state fetching/caching (staleTime: 60s)
- **Zustand** — global client state
- **Jotai** — atomic reactive state for specific UI

**UI**: shadcn/ui (Radix) in `src/components/ui/`, feature modules in `src/components/modules/`, hub layouts in `src/components/hubs/`.

**Path alias**: `@/` → `src/` (configured in tsconfig.json and vite.config.ts)

### Backend (api/src/)

**Middleware chain** (order matters in `server.ts`):
Sentry → Helmet (CSP) → CORS → Body Parsers (10MB) → Cookie Parser → Request ID → Rate Limiter → Response Formatter → Telemetry → Dev Auth Bypass → CSRF → Routes → Error Handler

**Key directories**:
- `routes/` — 140+ route files, **manually imported and registered** in `server.ts` (no auto-loader). Many route files exist but are unregistered.
- `repositories/` — Data access layer (240+ files). All use parameterized queries ($1, $2) — never string concatenation.
- `middleware/` — auth.ts, rbac.ts, csrf.ts, rate-limit.ts, tenant-context.ts, etc. Field masking (`api/src/utils/fieldMasking.ts`) removes cost fields for non-admin roles.
- `schemas/` — Zod validation schemas
- `emulators/` — OBD2, GPS, telematics emulators
- `jobs/` — Bull/BullMQ background processing

**Auth**: Azure AD JWT (RS256) + local JWT fallback. Roles: SuperAdmin, Admin, Manager, User, ReadOnly. 100+ permissions (`driver:view:self`, `fleet:edit`, etc.).

**Dev auth bypass** (triple-gated): `SKIP_AUTH=true` + `NODE_ENV !== 'production'` + non-production build. Sets dev user `00000000-0000-0000-0000-000000000001` with tenant `12345678-1234-1234-1234-123456789012` and role SuperAdmin.

**Database**: PostgreSQL via Drizzle ORM. 100+ tables. Migrations in `api/src/migrations/`. Pool manager: `api/src/config/connection-manager.ts`.

**Query pattern pitfall**: Route handlers use **explicit column lists** (not `SELECT *`). When adding new columns, update three places: (1) own scope queries, (2) team scope inline SQL in `vehicles.service.ts`, (3) global scope in `VehiclesRepository.selectColumns`.

### API Response Format
```json
{ "success": true, "data": [...], "meta": { ... } }
```

When adding new API routes:
1. Create route file in `api/src/routes/`
2. Add Zod schema in `api/src/schemas/[domain].ts`
3. **Manually register** the route in `server.ts` (imports + `app.use()`)
4. Test with `curl` — schema mismatches cause runtime 500s not caught by TypeScript

## Environment Setup

Copy `.env.example` to `.env`. Key variables:
- `VITE_AZURE_AD_CLIENT_ID` / `VITE_AZURE_AD_TENANT_ID` — Azure AD auth
- `VITE_API_URL` — Backend URL (empty = uses Vite proxy to localhost:3001)
- `VITE_GOOGLE_MAPS_API_KEY` — Map features
- `DATABASE_URL` — PostgreSQL connection string
- `SKIP_AUTH` — Dev mode auth bypass (set to `true`)
- `DB_WEBAPP_POOL_SIZE` — Connection pool size (set to `30` for E2E tests)
- Frontend vars must be prefixed with `VITE_`
- Backend loads `../.env` from root via dotenv-cli

## Common Issues

**npm install fails**: Use `--legacy-peer-deps` in root (React peer dep conflicts).

**Port 5173 in use**: Verify correct instance: `curl -s http://localhost:5173 | grep -o '<title>.*</title>'`. Kill wrong one: `lsof -i :5173`.

**tsx watch not reloading**: `pkill -f "tsx watch"` and restart `npm run dev`.

**CORS errors**: Backend CORS requires exact origin (not `*`) when frontend uses `credentials: 'include'`.

**Lazy loading failures**: Check (1) file exists at path, (2) export type — some need `.then(m => ({ default: m.ComponentName }))`.

**Database IDs**: PostgreSQL returns integers. Use `String(vehicle.id)` for frontend string operations.

**API returns stale data after schema change**: Must flush Redis (`redis-cli FLUSHDB`) and restart backend.

## Testing

**Zero mocks policy**: All tests use real PostgreSQL, real HTTP (Supertest), real JWT, real RBAC. No `vi.mock()`, no `vi.fn()`, no stubs.

**Test suites**:
- Frontend UI: `npm test -- src/components/ui/` (3,969 tests, 76 components)
- Frontend hooks: `npm test -- src/hooks/__tests__/`
- Backend routes: `cd api && npm test -- src/routes/__tests__/`
- Backend middleware: `cd api && npm test -- tests/integration/middleware/`
- E2E: `npx playwright test tests/e2e/`
- Visual regression: `npx playwright test tests/visual/`
- Security (OWASP): `cd api && npm test -- tests/security/`
- Load testing: `npm run load:normal` / `load:spike` / `load:stress`

## Tech Stack

**Frontend**: React 19, TypeScript, Vite 7, TailwindCSS v4, shadcn/ui (Radix), TanStack Query v5, React Router v7, Recharts, AG Grid, Three.js/R3F, Framer Motion, Zustand, Jotai, MSAL

**Backend**: Express 4, TypeScript, Drizzle ORM, PostgreSQL (pg), Redis (ioredis), Bull/BullMQ, Zod, Winston, Sentry, OpenTelemetry, Socket.io

**Testing**: Vitest, Testing Library, Playwright, axe-core, K6/Artillery

**Infrastructure**: Docker, Azure AD, Azure Key Vault, Azure Static Web Apps, AKS

## Git Workflow

```bash
git pull origin main
# Make changes, test locally
git add [specific files]
git commit -m "feat: description"
git push origin main
```

Push to both remotes: `git push origin main && git push azure main`
