# CTAFleet - Complete File Structure & Locations

## Database Schema Files

### Schema Documentation
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/artifacts/system_map/db_schema_complete.json` - Complete 89-table schema with relationships
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/artifacts/system_map/db_schema.json` - Simplified schema reference

---

## Backend (API) Files

### Main Application Entry Points
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/app.ts` - Express application setup
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/main.ts` - Application main entry
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/server-simple.ts` - Simple server variant
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/server.production.ts` - Production configuration
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/container.ts` - Dependency injection container

### API Route Modules (179 endpoints total)
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/routes/`

**Core Modules:**
- `auth.routes.ts` / `auth.ts` - Authentication endpoints
- `vehicles.ts` - Fleet vehicle management
- `drivers.ts` - Driver profiles and management
- `telematics.routes.ts` / `telemetry.ts` - Real-time telemetry
- `maintenance.ts` - Work order and maintenance
- `fuel.routes.ts` / `fuel.ts` - Fuel management
- `routes.ts` - Route optimization
- `compliance.ts` - Compliance monitoring
- `documents.routes.ts` / `documents.ts` - Document management
- `tasks.ts` - Task management
- `incidents.ts` - Incident tracking
- `assets.routes.ts` / `assets.ts` - Asset management
- `analytics.ts` - Analytics endpoints
- `reports.routes.ts` - Custom reports
- `admin.routes.ts` - Administration
- `health.routes.ts` / `health.ts` - Health checks

**Specialized Routes (100+ additional files):**
- `ai*.ts` - AI/ML endpoints (damage detection, dispatch, insights, etc.)
- `charging*.ts` - EV charging management
- `compliance*.ts` - Advanced compliance
- `cost*.ts` - Cost analysis
- `damage*.ts` - Damage reporting
- `dispatch.ts` - Dispatch optimization
- `driver-scorecard.routes.ts` - Driver performance
- `fuel*.ts` - Extended fuel management
- `geofences.ts` / `geospatial.routes.ts` - Geofencing
- `incident*.ts` - Incident management
- `integrations*.ts` - External integrations
- `mobile*.ts` - Mobile app endpoints (15 variations)
- `monitoring.ts` - System monitoring
- `notifications.ts` / `alerts.routes.ts` - Notifications & alerts
- `obd2*.ts` - OBD-II diagnostics
- `ocr.routes.ts` - OCR processing
- `purchase-orders*.ts` - Procurement
- `quality-gates.ts` - Quality assurance
- `reservations.ts` - Vehicle reservations
- `scheduling*.ts` - Scheduling & calendar
- `search.ts` - Search functionality
- `smartcar.routes.ts` - SmartCar integration
- `storage*.ts` - Storage management
- `teams.ts` / `outlook.routes.ts` - Microsoft integration
- `tenants.ts` - Tenant management
- `trip*.ts` - Trip tracking
- `users.ts` - User management
- `vendors.ts` - Vendor management
- `video*.ts` - Video/dashcam management
- `weather.ts` - Weather integration
- `webhooks/` - Webhook management

**Route Organization:**
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/routes/admin/` - Admin-specific routes
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/routes/auth/` - Auth route organization
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/routes/ai/` - AI route organization
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/routes/documents/` - Document routes
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/routes/drill-through/` - Drill-through routes
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/routes/monitoring/` - Monitoring routes
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/routes/system/` - System routes
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/routes/webhooks/` - Webhook routes

### Middleware
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/middleware/`

- `auth.middleware.ts` - JWT validation
- `authz.middleware.ts` - Authorization checking
- `csrf.d.ts` - CSRF protection
- `error.middleware.ts` - Error handling
- `rate-limit.middleware.ts` - Rate limiting
- `validate-request.ts` - Request validation
- `validateResource.ts` - Resource validation
- `validate.ts` - Input validation
- `permissions.ts` - Permission checking
- `modulePermissions.ts` - Module-level permissions
- `rbac.ts` - Role-based access control
- `async-handler.ts` - Async error handling
- `errorHandler.ts` - Global error handler
- `security.production.ts` - Production security
- `azure-ad-jwt.ts` - Azure AD JWT validation
- `development-auth-bypass.ts` - Dev-only auth bypass
- `sentryErrorHandler.ts` - Sentry integration
- `request-id.ts` - Request ID generation
- `performance.ts` - Performance monitoring
- `sanitization.ts` - Input sanitization

### Services
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/services/`

**Core Services:**
- `analytics/` - Analytics computation
- `auth/AuthenticationService.ts` - Authentication logic
- `authz/AuthorizationService.ts` - Authorization logic
- `audit/AuditService.ts` - Audit logging
- `cache/` - Caching layer
- `config/ConfigurationManagementService.ts` - Configuration
- `secrets/SecretsManagementService.ts` - Secrets management

**Domain Services:**
- `accounting/` - Financial calculations
- `ai/` - AI service layer
- `ai-bus/` - AI message bus
- `api-bus/` - Internal API bus
- `collaboration/` - Collaboration features
- `depreciation/` - Depreciation calculations
- `documents/` - Document service
- `governance/` - Policy governance
- `graphql/` - GraphQL service
- `health/` - Health check service
- `mcp/` - Model Context Protocol
- `monitoring/` - System monitoring
- `notifications/` - Notification delivery
- `policy/` - Policy enforcement
- `queue/` - Job queue service
- `storage/` - File storage
- `traffic/` - Traffic analytics
- `weather/` - Weather service
- `websocket/` - WebSocket management

### Modules
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/modules/`

- `compliance/` - Compliance module
- `drivers/` - Driver module
- `facilities/` - Facility module
- `fleet/` - Fleet module (vehicles)
- `incidents/` - Incident module
- `inspections/` - Inspection module
- `maintenance/` - Maintenance module
- `telemetry/` - Telematics module
- `work-orders/` - Work order module

### Database & Migrations
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/database/`

- `migrations/` - Database migrations
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/db/` - Alternative DB directory
- `db/migrations/` - Additional migrations
- `db/schemas/` - Schema definitions
- `db/seeds/` - Database seed data

### Type Definitions
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/types/`

- Core type definitions for backend
- Domain-specific types

### Schemas & Validation
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/schemas/`

- Zod validation schemas for all endpoints

### Repositories
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/repositories/`

- `base/` - Base repository classes
- `enhanced/` - Enhanced repository implementations
- Individual repository files per domain

### AI/ML Infrastructure
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/ai/`

- `agents/` - AI agents
- `cag/` - Cognition and grounding
- `gateway/` - AI gateway
- `ingest/` - Data ingestion
- `mcp/` - MCP integration
- `rag/` - RAG implementation

### Infrastructure
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/infrastructure/`

- `telematics/` - Telematics infrastructure
- `safety/` - Safety monitoring
- `webhooks/` - Webhook handling

### Jobs & Workers
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/jobs/`

- `processors/` - Job processors
- Background job implementations

### Utilities & Configuration
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/`

- `config/` - Configuration files
- `errors/` - Error definitions
- `lib/` - Utility libraries
- `lib/azure/` - Azure integrations
- `utils/` - Helper functions
- `permissions/` - Permission definitions
- `permissions/config/` - Permission configuration
- `validation/` - Validation utilities

---

## Frontend Files

### Main Application
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/`

- `main.tsx` - React application entry point
- `App.tsx` - Root application component

### Pages (Hub Pages)
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/pages/`

**Core Hub Pages:**
- `FleetHub.tsx` - Vehicle fleet management
- `DriversHub.tsx` - Driver management
- `MaintenanceHub.tsx` - Maintenance & work orders
- `FuelHub.tsx` - Fuel management
- `ComplianceHub.tsx` - Compliance monitoring
- `FinancialHub.tsx` - Financial analytics
- `DocumentsHub.tsx` - Document management
- `AdminHub.tsx` / `AdminDashboard.tsx` - Administration
- `ReportsHub.tsx` - Custom reporting
- `AnalyticsHub.tsx` - Executive dashboard
- `AssetsHub.tsx` - Asset management
- `CommandCenter.tsx` - Dispatch console

**Specialized Pages (20+ additional):**
- `AuthCallback.tsx` - OAuth callback handler
- `ComplianceSafetyHub.tsx` - Safety compliance
- `ComplianceReportingHub.tsx` - Compliance reporting
- `ConfigurationHub.tsx` / `CTAConfigurationHub.tsx` - Configuration
- `DataGovernanceHub.tsx` - Data governance
- `E2ETestPage.tsx` - Test page
- `EVHub.tsx` - Electric vehicle management
- `ChargingHub.tsx` - EV charging
- `FleetOperationsHub.tsx` - Operations
- `BusinessManagementHub.tsx` - Business management
- `CommunicationHub.tsx` - Communications
- `Admin*.tsx` - Additional admin pages
- 403.tsx - Error pages

### Components
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/components/`

**UI Components (Base):**
- `ui/` - shadcn/ui base components (Button, Card, Dialog, Form, Input, Select, Table, Tabs, Toast, etc.)

**Feature Modules:**
- `fleet/` - Fleet management components
- `drivers/` - Driver components
- `maintenance/` - Maintenance components
- `compliance/` - Compliance components
- `reports/` - Report components
- `dashboard/` - Dashboard components
- `admin/` - Admin panel components

**Layout Components:**
- `layout/CommandCenterLayout.tsx` - Dispatch console layout
- `layout/MapFirstLayout.tsx` - Map-primary layout
- `layout/DashboardLayout.tsx` - Hub dashboard layout

**Hub Components:**
- `hubs/FleetHub/` - Fleet hub components
- `hubs/DriversHub/` - Drivers hub components
- `hubs/MaintenanceHub/` - Maintenance hub components

**Visualization Components:**
- `visualizations/FleetStatusChart.tsx` - Status charts
- `visualizations/UtilizationTrendChart.tsx` - Utilization trends
- `visualizations/CostBreakdownChart.tsx` - Cost analysis
- `visualizations/VehicleHeatmap.tsx` - Heat maps
- `visualizations/RouteVisualization.tsx` - 3D route display

**Supporting Components:**
- `api/` - API interaction components
- `auth/` - Authentication UI
- `damage/` - Damage report UI
- `DamageReports/` - Damage reports
- `details/` - Detail view components
- `dialogs/` - Modal dialogs
- `documents/` - Document UI
- `3d/` - 3D visualization
- `analytics/` - Analytics UI
- `common/` - Common components
- `branding/` - Branding components

### Services (API Clients)
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/services/`

**Core Services:**
- `api.ts` - Axios API client
- `aiService.ts` - AI integration
- `analytics.ts` - Analytics API client
- `analyticsService.ts` - Analytics logic

**Domain Services:**
- `MaintenanceService.ts` - Maintenance operations
- `GarageService.ts` - Garage management
- `GeotabService.ts` - Geotab integration
- `PhotoUploadService.ts` - Photo handling
- `photo-storage.service.ts` - Photo storage
- `DrilldownService.ts` - Drill-through functionality
- `offline-sync.service.ts` - Offline synchronization
- `AIDamageDetectionService.ts` - AI damage detection
- `meshyAI.ts` - Meshy AI integration
- `microsoft365Service.ts` - Microsoft 365 integration
- `outlookIntegration.ts` - Outlook integration

**Supporting Services:**
- `Logger.ts` - Logging service
- `PerformanceMonitor.ts` - Performance monitoring
- `damageReportsApi.ts` - Damage reports API
- `dashboardApi.ts` - Dashboard API
- `branding.service.ts` - Branding service
- `keyless-entry.service.ts` - Keyless entry

**Sub-directories:**
- `cache/` - Caching services
- `monitoring/` - Monitoring services
- `performance/` - Performance tracking
- `inspect/` - Inspection services
- `inventory/` - Inventory services

### Hooks (Custom React Hooks)
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/hooks/`

**Data Fetching:**
- `use-api.ts` - API data fetching with CSRF protection
- `use-fleet-data.ts` - Fleet data hook
- `use-fleet-data-batched.ts` - Batched fleet data
- `use-fuel-data.ts` - Fuel data hook
- `use-maintenance-data.ts` - Maintenance data
- `use-reactive-admin-data.ts` - Admin data hook
- `use-ho-data.ts` - Hours of Service data
- `use-demo-data.ts` - Demo data hook

**Utility Hooks:**
- `use-keyboard-shortcuts.ts` - Keyboard shortcuts
- `use-mobile.ts` - Mobile detection
- `use-media-query.ts` - Media queries
- `use-emulator-enhancement.ts` - Emulator support

**Drilldown & Navigation:**
- `use-drilldown-helpers.ts` - Drilldown utilities
- `drill-through/` - Drill-through hooks

**Index:**
- `index.ts` - Hook exports

### Contexts (Global State)
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/contexts/`

**Authentication & Authorization:**
- `AuthContext.tsx` - User authentication state
- `PermissionContext.tsx` - Permission state
- `SSOAuthContext.tsx` - SSO authentication

**Application State:**
- `GlobalStateContext.tsx` - Global state
- `TenantContext.tsx` - Multi-tenant state
- `FeatureFlagContext.tsx` - Feature flags

**UI State:**
- `ToastContext.tsx` - Toast notifications
- `PanelContext.tsx` - Panel management
- `NavigationContext.tsx` - Navigation state
- `DrilldownContext.tsx` - Drill-through state

**Real-time:**
- `WebSocketContext.tsx` - WebSocket connection

**Legacy:**
- `EntityLinkingContext.tsx` - Entity linking

**Alternative (context vs contexts):**
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/context/BrandingContext.tsx`
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/context/FleetLocalContext.tsx`

### Type Definitions
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/types/`

- `Vehicle.ts` - Vehicle type definitions
- `websocket.ts` - WebSocket message types
- `alert.ts` - Alert types
- `asset.ts` / `asset.types.ts` - Asset types
- `drill-through.ts` - Drill-through types
- `drilldown.ts` - Drilldown types
- `enums.ts` - Enum definitions
- `feature-flags.ts` - Feature flag types
- `notifications.ts` - Notification types
- `amt.types.ts` - AMT-specific types
- `endpoint-monitor.ts` - Endpoint monitoring
- `microsoft.ts` - Microsoft integration types
- `procurement.ts` - Procurement types
- `radio.ts` - Radio/dispatch types
- `scheduling.ts` - Scheduling types
- `telemetry.ts` - Telemetry types
- `traffic-cameras.ts` - Traffic camera types
- `trip-usage.ts` - Trip usage types
- `user-management.ts` - User management types
- `vehicle-condition.types.ts` - Vehicle condition types
- `branding.d.ts` - Branding definitions
- `global.d.ts` - Global type definitions
- `ux-components.d.ts` - UX component definitions
- `activity-log.ts` - Activity log types

### Utilities & Libraries
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/`

**Utilities:**
- `utils/` - General utilities
- `utils/logger/` - Logging utilities
- `utils/auth/` - Auth utilities
- `utils/validators/` - Validation functions
- `utils/__tests__/` - Unit tests

**Configuration:**
- `config/` - App configuration
- `core/multi-tenant/` - Multi-tenancy logic

**Repositories:**
- `repositories/` - Data access layer (if present)

**Database:**
- `database/` - Database utilities

**Libraries:**
- `lib/` - Shared libraries
- `lib/auth/` - Authentication library
- `lib/mock-data.ts` - Mock data for demo
- `lib/policy-engine/` - Policy engine
- `lib/msal-config.ts` - Azure MSAL config
- `lib/microsoft-auth.ts` - Microsoft auth helpers
- `lib/types.ts` - Common types

**Styling:**
- `styles/` - Global styles
- `materials/` - Material definitions

**Design System:**
- `shared/design-system/` - Design system

**Constants:**
- `constants/` - Application constants

### Testing
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/`

- `tests/` - Frontend tests
- `test/` - Additional tests
- `components/__tests__/` - Component tests
- `utils/__tests__/` - Utility tests
- `middleware/__tests__/` - Middleware tests

### Reporting Library
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/reporting_library/`

- `reports/` - Report definitions
- `dashboards/` - Dashboard definitions

### Features
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/features/`

- `business/` - Business features
- `fleet-3d/` - 3D fleet visualization
- `radio-dispatch/` - Radio dispatch
- `services/` - Feature services

### Containers & DI
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/`

- `container/` - Dependency injection container

---

## Configuration Files

### Root Configuration
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/package.json` - Frontend dependencies and scripts
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/tsconfig.json` - TypeScript configuration
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/vite.config.ts` - Vite bundler configuration
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/.env` - Environment variables
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/.env.example` - Environment template

### API Configuration
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/package.json` - Backend dependencies
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/tsconfig.json` - Backend TypeScript config
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/config/` - Backend configuration

---

## Infrastructure & Deployment

### Infrastructure Code
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/infrastructure/`

- Azure deployment configurations
- Kubernetes manifests (if applicable)
- Infrastructure as Code

### GitHub Actions Workflows
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/.github/workflows/`

- CI/CD pipeline definitions
- Build and deployment workflows

### Scripts
**Location**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/scripts/`

- Utility scripts for development and deployment

---

## Documentation & Artifacts

### Documentation
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/CLAUDE.md` - Project-specific Claude Code instructions
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/README.md` - Project README

### Design System
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/components/DESIGN_SYSTEM.md` - Design system documentation

### Artifacts & Analysis
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/artifacts/` - System analysis artifacts
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/artifacts/system_map/` - System mapping files

### Test Reports
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/test-results/` - Test execution reports
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/playwright-report/` - E2E test reports

### Screenshot Archives
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/screenshots/` - Application screenshots
- `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/kimi-review-screenshots/` - Review screenshots

---

## Key Configuration Details

### Frontend Entry
- `src/main.tsx` - React entry point
- `vite.config.ts` - Vite configuration with:
  - Path aliases (`@/` → `src/`)
  - React plugin setup
  - Dev server configuration
- `tsconfig.json` - TypeScript strict mode enabled

### Backend Entry
- `api/src/app.ts` - Express application
- `api/src/routes/index.ts` - Route registration
- `api/src/container.ts` - Dependency injection setup

### Database
- Schema: `/artifacts/system_map/db_schema_complete.json`
- Migrations: `api/src/db/migrations/`
- Seeds: `api/src/db/seeds/`

### Environment
- Frontend: `VITE_*` prefix for environment variables
- Backend: Standard Node.js environment variables
- Key variables:
  - `VITE_API_URL` - Backend API URL
  - `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key
  - `DATABASE_URL` - PostgreSQL connection
  - `REDIS_URL` - Redis connection
  - `AZURE_*` - Azure services credentials

---

## Summary Statistics

- **Backend Route Files**: 179 files in `/api/src/routes/`
- **Frontend Pages**: 30+ files in `/src/pages/`
- **Frontend Components**: 100+ files in `/src/components/`
- **Service Files**: 30+ files in `/src/services/`
- **Hook Files**: 20+ files in `/src/hooks/`
- **Context Files**: 12 files in `/src/contexts/`
- **Type Definition Files**: 26 files in `/src/types/`
- **Database Tables**: 89 tables in `/artifacts/system_map/db_schema_complete.json`

