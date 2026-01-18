# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CTAFleet is an enterprise fleet management system with a React/TypeScript frontend and a Node.js/Express backend. The application provides real-time vehicle tracking, driver management, telematics, compliance monitoring, and cost analytics.

## Development Commands

### Frontend (React + Vite)
```bash
# Install dependencies (use --legacy-peer-deps for React 18 compatibility)
npm install --legacy-peer-deps

# Start development server (runs on http://localhost:5173)
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Run tests
npm test
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
npm run test:a11y         # Accessibility tests only
```

### Backend API (api-standalone/)
```bash
cd api-standalone
npm install

# Start server (runs on http://localhost:3000)
DB_HOST=localhost npm start
```

### Database (PostgreSQL via Docker)
```bash
# Start PostgreSQL container
docker run -d --name fleet-postgres \
  -e POSTGRES_DB=fleet_db \
  -e POSTGRES_USER=fleet_user \
  -e POSTGRES_PASSWORD=fleet_password \
  -p 5432:5432 \
  postgres:16-alpine

# Or start existing container
docker start fleet-postgres
```

## Architecture

### Frontend Structure
- **src/pages/**: Route-level page components (FleetHub, DriversHub, ComplianceHub, etc.)
- **src/components/**: Reusable UI components organized by domain
  - `ui/`: Base shadcn/ui components (Button, Card, Dialog, etc.)
  - `modules/`: Feature modules (fleet, drivers, compliance, charging, etc.)
  - `layout/`: Layout components (CommandCenterLayout, MapFirstLayout)
  - `hubs/`: Hub-specific components for each major feature area
  - `visualizations/`: Charts and data visualization components
- **src/hooks/**: Custom React hooks (`use-api.ts`, `use-reactive-fleet-data.ts`)
- **src/contexts/**: React contexts (AuthContext, DrilldownContext, TenantContext)
- **src/services/**: API clients and service layers
- **src/lib/**: Utility libraries (telemetry, push-notifications, auth)

### Backend Structure (api-standalone/)
Simple Express.js server with PostgreSQL:
- `/api/vehicles` - Vehicle CRUD operations
- `/api/drivers` - Driver management
- `/api/stats` - Fleet statistics
- Vite dev server proxies `/api/*` requests to port 3000

### Key Patterns
- **Path aliases**: `@/` maps to `src/` (configured in tsconfig.json and vite.config.ts)
- **Lazy loading**: Heavy components use React.lazy() for code splitting
- **Named vs Default exports**: Check component exports - some use named exports requiring `.then(m => ({ default: m.ComponentName }))`
- **Demo mode**: Set `VITE_USE_MOCK_DATA=true` in `.env` to bypass authentication

## Environment Setup

Create `.env` from `.env.example`:
```bash
VITE_USE_MOCK_DATA=true          # Enable demo mode (bypasses auth)
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=        # Optional: for map features
```

## Common Issues

### Database IDs as Numbers
The PostgreSQL database returns `id` as integers, but some frontend components expect strings. When fixing type errors with `.slice()` or string comparisons on IDs, wrap with `String(vehicle.id)`.

### CORS with Credentials
The backend CORS must specify the exact origin (not `*`) when frontend uses `credentials: 'include'`. The backend sets `Access-Control-Allow-Origin` from the request origin header.

### Missing Components
If lazy-loaded components fail to resolve, check:
1. The file exists at the expected path
2. Export type matches import (named vs default)
3. For named exports with lazy(): `lazy(() => import('./Component').then(m => ({ default: m.Component })))`

## Tech Stack

**Frontend**: React 18, TypeScript, Vite, TailwindCSS v4, shadcn/ui, TanStack Query, React Router, Recharts, AG Grid, Three.js (3D), Framer Motion

**Backend**: Express.js, PostgreSQL, node-pg

**Infrastructure**: Docker, Azure AD (auth), Azure Key Vault (secrets), Sentry (errors), Application Insights (telemetry)
