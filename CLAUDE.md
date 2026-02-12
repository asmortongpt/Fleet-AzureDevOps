# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CTAFleet is an enterprise fleet management system with a React/TypeScript frontend and a Node.js/Express backend. It provides real-time vehicle tracking, driver management, telematics, compliance monitoring, and cost analytics. Multi-tenant, Azure AD authenticated, deployed to Azure.

## Development Commands

### Frontend (React + Vite) — root directory
```bash
npm install --legacy-peer-deps     # Required: React 18/19 peer dep conflicts
npm run dev                        # Dev server on http://localhost:5173
npm run build                      # Production build (Vite + Terser)
npm run typecheck                  # tsc --noEmit
npm run lint                       # ESLint
npm test                           # Vitest (unit tests)
npm run test:watch                 # Watch mode
npm run test:coverage              # With V8 coverage
npm run test:a11y                  # Accessibility tests only
```

### Backend API (api/) — primary backend
```bash
cd api
npm install
npm run dev                        # tsx watch on http://localhost:3001 (loads ../.env via dotenv-cli)
npm run build                      # esbuild production bundle → dist/server.js
npm run typecheck                  # tsc --noEmit
npm run lint                       # ESLint with security plugin
npm test                           # Vitest
npm run test:integration           # Integration tests (separate vitest config)
npm run seed                       # Seed database via orchestrator
npm run seed:reset                 # Reset + seed
npm run migrate                    # Run Drizzle migrations
npm run db:studio                  # Drizzle Kit visual DB explorer
npm run db:reset                   # Full database reset
npm run db:seed                    # Reset + seed (combined)
```

### Standalone API (api-standalone/) — simplified dev/prototyping server
```bash
cd api-standalone && npm install && DB_HOST=localhost npm start   # http://localhost:3000
```

### Database (PostgreSQL 16)
```bash
docker run -d --name fleet-postgres \
  -e POSTGRES_DB=fleet_db -e POSTGRES_USER=fleet_user \
  -e POSTGRES_PASSWORD=fleet_password -p 5432:5432 postgres:16-alpine
# Or: docker start fleet-postgres
```

### Running a single test
```bash
npx vitest run src/path/to/file.test.tsx           # Frontend (from root)
cd api && npx vitest run src/path/to/file.test.ts  # Backend
```

## Architecture

### Two Backend Servers

1. **`api/`** — Primary production backend. Express + TypeScript + Drizzle ORM. Runs on port 3001. Has full auth, RBAC, middleware stack, 118+ migrations, 217 route files, background jobs (Bull/BullMQ), Redis caching, Sentry, OpenTelemetry.

2. **`api-standalone/`** — Minimal plain JS Express server for prototyping. Runs on port 3000. No auth, no middleware. Not for production.

The Vite dev server proxies `/api/*` and `/auth/*` to `http://localhost:3001` (see `vite.config.ts`).

### Frontend Architecture (src/)

**Routing**: React Router v7 in `src/main.tsx` (route definitions) and `src/App.tsx` (lazy-loaded component mapping). 40+ lazy-loaded route modules. Public routes: `/login`, `/auth/callback`. All others wrapped in `ProtectedRoute`.

**State management** uses four layers:
- **React Contexts** (`src/contexts/`) — cross-cutting: AuthContext (MSAL + JWT), TenantContext (multi-tenancy), PolicyContext, DrilldownContext, PermissionContext, FeatureFlagContext
- **TanStack Query v5** — server state fetching/caching
- **Zustand** — lightweight global client state
- **Jotai** — atomic reactive state for specific UI

**Custom hooks** (`src/hooks/`) — 45+ hooks. Key patterns: `use-api.ts` (HTTP client with retry), `use-fleet-data.ts`, `use-reactive-*.ts` (domain-specific reactive data).

**UI**: shadcn/ui components in `src/components/ui/`, feature modules in `src/components/modules/`, hub layouts in `src/components/hubs/`.

### Backend Architecture (api/src/)

**Middleware chain** (order matters):
Logger → CORS → Security Headers (Helmet) → Request ID → CSRF (double-submit cookie) → JWT Auth → Rate Limiting (Redis) → RBAC/Permissions → Tenant Scoping → Route Handler → Error Handler (Sentry)

**Key directories**:
- `routes/` — 217 route files, one per domain (drivers.ts, fleet.ts, etc.)
- `middleware/` — auth.ts, rbac.ts, csrf.ts, rate-limit.ts, permissions.ts, audit.ts
- `db/` — Drizzle ORM config, schema, seeds, migrations
- `repositories/` — Data access layer (240+ files)
- `services/` — Business logic (auth, audit, secrets/Key Vault, config)
- `schemas/` — Zod validation schemas
- `emulators/` — OBD2, GPS, telematics emulators for testing
- `jobs/` — Bull/BullMQ background job processing
- `monitoring/` — Sentry, Application Insights, Prometheus

**Auth**: Azure AD JWT validation (RS256, FIPS-compliant) + local JWT fallback. RBAC roles: SuperAdmin, Admin, Manager, User, ReadOnly. 100+ fine-grained permissions (`driver:view:self`, `fleet:edit`, etc.).

**Database**: PostgreSQL via Drizzle ORM. Pool: 20 connections, 30s idle timeout. 100+ tables. Migrations in `api/src/migrations/`.

### Path Aliases
`@/` → `src/` (configured in both tsconfig.json and vite.config.ts)

## Environment Setup

Copy `.env.example` to `.env` and fill in values. Key variables:
- `VITE_AZURE_AD_CLIENT_ID` / `VITE_AZURE_AD_TENANT_ID` — Azure AD auth
- `VITE_API_URL` — Backend URL (empty = localhost)
- `VITE_GOOGLE_MAPS_API_KEY` — Map features
- `DATABASE_URL` — PostgreSQL connection string (backend)
- Frontend vars must be prefixed with `VITE_` to be exposed to the browser

The backend loads `../.env` from the root via `dotenv-cli` (see api/package.json dev script).

## Common Issues

### Database IDs as Numbers
PostgreSQL returns `id` as integers. Some frontend components expect strings. Wrap with `String(vehicle.id)` when needed for `.slice()` or string comparisons.

### CORS with Credentials
Backend CORS must specify exact origin (not `*`) when frontend uses `credentials: 'include'`. The backend reads origin from the request header.

### Lazy Loading Failures
Check: (1) file exists at expected path, (2) export type matches — some use named exports requiring `.then(m => ({ default: m.ComponentName }))`.

### npm install Failures
Always use `npm install --legacy-peer-deps` in the root (React peer dependency conflicts).

## Tech Stack

**Frontend**: React 19, TypeScript, Vite 7, TailwindCSS v4, shadcn/ui (Radix), TanStack Query v5, React Router v7, Recharts, AG Grid, Three.js/R3F, Framer Motion, Zustand, Jotai, MSAL (Azure AD)

**Backend**: Express 4, TypeScript, Drizzle ORM, PostgreSQL (node-pg), Redis (ioredis), Bull/BullMQ, Zod, Winston, Sentry, OpenTelemetry, Socket.io

**Infrastructure**: Docker, Azure AD, Azure Key Vault, Azure Static Web Apps, AKS, Application Insights

**Testing**: Vitest, Testing Library, Playwright (e2e in `/e2e/`), axe-core (a11y), MSW (mocking)
