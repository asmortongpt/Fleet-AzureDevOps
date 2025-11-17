# Fleet Application - Comprehensive Codebase Structure Overview

## Executive Summary

The Fleet application is a full-stack fleet management system built with:
- **Frontend**: React 19 with Vite, TypeScript, Tailwind CSS, and Radix UI components
- **Backend**: Node.js/Express API with PostgreSQL database
- **Architecture**: Monorepo with separate frontend and API packages
- **Authentication**: JWT-based with RBAC (Role-Based Access Control) and fine-grained permissions
- **Tech Stack**: Modern, cloud-ready with Azure integration, AI/ML features, and real-time capabilities

---

## 1. Database Schema & Models

### Database Technology
- **PostgreSQL** (primary database)
- Connection pooling with pg library (max 20 connections)
- Migrations in SQL format (30+ migration files)
- Support for TimescaleDB for time-series data (telematics)

### Core Tables Structure

#### Base Tables (Demo Data Creation Pattern)
```
tenants
├── users (tenant_id, role, scope_level, approval_limit, facility_ids, team_vehicle_ids, team_driver_ids)
├── drivers (license_number, license_state, license_expiry, cdl_class, is_active)
├── vehicles (unit_number, make, model, year, vin, license_plate, fuel_type, status, odometer, assigned_driver_id)
└── facilities (name, address, location, type)
```

#### Telematics Integration (Migration 009)
```
telematics_providers (samsara, geotab, verizon, motive, smartcar)
├── vehicle_telematics_connections (access_token, sync_status)
├── vehicle_telemetry (real-time location, speed, fuel, battery, temperature, tire pressure, engine diagnostics)
├── driver_safety_events (harsh braking, acceleration, speeding, following distance)
├── driver_hos_logs (hours of service, duty status for ELD compliance)
├── vehicle_diagnostic_codes (DTC codes, severity, detection dates)
├── geofences (circle/polygon, alert triggers)
├── geofence_events (entry/exit/dwell)
├── driver_behavior_scores (daily/weekly/monthly safety scores)
└── telematics_webhook_events (webhook event log)
```

#### AI/ML Features (Migration 002)
```
ai_conversations (tenant_id, user_id, intent, extracted_data, messages, completeness)
ai_validations (entity_type, validation_result, confidence, suggestions)
document_analyses (ocr_text, extracted_data, confidence_scores)
```

#### Documents & Management (Migration 007, 023)
```
documents (vehicle_id, driver_id, work_order_id, document_type, ocr_text, metadata)
├── document_folders
├── document_permissions
├── document_versions
└── document_geo (geolocation metadata)
```

#### Maintenance & Operations
```
maintenance_schedules (is_recurring, recurrence_pattern, auto_create_work_order)
├── maintenance_schedule_history
├── maintenance_notifications
└── vehicle_telemetry_snapshots

work_orders (status, facility_id, vehicle_id, assigned_to)
purchase_orders (total, approval_status, approval_limit)
fuel_transactions (gallons, price_per_gallon, odometer, receipt_number)
routes (driver_id, start_location, end_location)
```

#### Compliance & Policies
```
osha_compliance_forms
├── personal_use_policies (personal_use_percentage, mileage_rate, calculation_method)
├── personal_use_charges (trip_id, personal_use_percentage, charge_amount)
├── trip_marking (trip_date, start_location, end_location, marked_as_personal)
└── reimbursement_requests (status, amount, approval_status)

policy_templates (template_type, template_config)
```

#### Microsoft Integration
```
teams_integration (channel_id, channel_name, tenant_id)
outlook_events (event_id, calendar_id, status)
calendar_events (event_type, start_time, end_time)
adaptive_cards (card_id, payload, action_handlers)
```

#### Security & Audit
```
users (email, password_hash, role, tenant_id, scope_level, account_locked_until)
├── user_roles (user_id, role_id, expires_at, is_active)
├── permissions (name, description)
├── role_permissions (role_id, permission_id)
├── permission_check_logs (user_id, permission_name, granted, reason, ip_address)
└── password_reset_tokens (token_hash, expires_at)

security_events (event_type, severity, user_id, resource_type)
```

### Key Schema Features
- **Multi-tenancy**: tenant_id field on all tables
- **Row-Level Security**: scope_level and team_*_ids for fine-grained access
- **Audit Trail**: Created/updated timestamps, audit logs
- **Soft Deletes**: Status columns used instead of DELETE
- **JSONB Metadata**: Raw provider data, custom fields, and configuration
- **Indexes**: Strategic indexes on frequently queried columns (vehicle_id, timestamp, status, provider_id)

---

## 2. API Routes & Controllers

### API Structure
- **Location**: `/api/src/routes/` (90+ route files)
- **Middleware Chain**: Auth → Permissions → Field Masking → Audit Log
- **Response Format**: JSON with pagination support
- **Error Handling**: Centralized error responses with status codes

### Route Organization by Domain

#### Core Fleet Management
- `vehicles.ts` - GET/POST/PUT vehicles with scope-based filtering
- `drivers.ts` - Driver management with team filtering
- `work-orders.ts` - Work order lifecycle management
- `maintenance-schedules.ts` - Recurring maintenance with auto work order generation
- `fuel-transactions.ts` - Fuel entry and cost tracking
- `routes.ts` - Route planning and execution
- `geofences.ts` - Geofence management with alerts

#### Telematics & Tracking
- `telematics.routes.ts` - Multi-provider telematics integration (Samsara, Geotab, etc.)
- `smartcar.routes.ts` - Smartcar API integration
- `video-telematics.routes.ts` - Video data from telematics
- `gps-tracking.tsx` (frontend) - Real-time GPS visualization

#### Dispatch & Operations
- `dispatch.routes.ts` - Radio channels, emergency alerts, metrics
- `task-management.routes.ts` - Task assignment and tracking
- `route-optimization.routes.ts` - AI-powered route optimization
- `mobile-integration.routes.ts` - Mobile app endpoints

#### Documents & OCR
- `documents.routes.ts` - Document CRUD and versioning
- `fleet-documents.routes.ts` - Fleet-wide document management
- `attachments.routes.ts` - File uploads and storage
- `ocr.routes.ts` - OCR processing and text extraction
- `document-search.example.ts` - Document search with embeddings

#### Communications
- `teams.routes.ts` - Microsoft Teams integration
- `outlook.routes.ts` - Outlook calendar and email
- `communications.ts` - Internal messaging
- `push-notifications.routes.ts` - Push notifications
- `presence.routes.ts` - User presence tracking

#### Compliance & Personal Use
- `osha-compliance.ts` - OSHA form management
- `personal-use-policies.ts` - Policy configuration
- `personal-use-charges.ts` - Charge calculations
- `trip-marking.ts` - Trip marking for personal use
- `reimbursement-requests.ts` - Request workflow

#### Analytics & Reporting
- `custom-reports.routes.ts` - Custom report builder
- `cost-analysis.routes.ts` - Cost tracking and analysis
- `driver-scorecard.routes.ts` - Driver performance metrics
- `executive-dashboard.routes.ts` - High-level metrics
- `ai-insights.routes.ts` - AI-powered insights

#### Intelligent Features
- `ai-chat.ts` - Natural language interactions
- `ai-search.ts` - Semantic search with embeddings
- `ai-task-asset.routes.ts` - AI-powered task assignment
- `ai-insights.routes.ts` - Automated insights generation
- `langchain.routes.ts` - LangChain orchestration

#### EV & Alternative Fuels
- `ev-management.routes.ts` - EV-specific metrics
- `charging-stations.ts` - Charging station locations
- `charging-sessions.ts` - Session tracking

#### Other Features
- `vehicle-3d.routes.ts` - 3D vehicle visualization
- `heavy-equipment.routes.ts` - Non-vehicle equipment
- `asset-management.routes.ts` - General asset tracking
- `incident-management.routes.ts` - Incident reporting
- `alerts.routes.ts` - Alert management
- `policy-templates.ts` - Reusable policy templates

#### Admin & System
- `health.routes.ts` - Health check endpoints
- `permissions.ts` - Permission management
- `sync.routes.ts` - Data synchronization
- `queue.routes.ts` - Job queue management

### API Endpoint Patterns

All endpoints follow REST conventions with middleware chain:

```typescript
router.get(
  '/:id',
  authenticateJWT,                    // Step 1: Verify JWT token
  requirePermission('resource:view:scope'),  // Step 2: Check permission
  applyFieldMasking('resource'),     // Step 3: Mask sensitive fields
  auditLog({ action: 'READ', resourceType: 'resources' }),  // Step 4: Log action
  async (req: AuthRequest, res: Response) => {
    // Endpoint handler
    // Apply row-level filtering based on req.user.scope_level
  }
)
```

### Key API Features
- **Pagination**: Standard `page` and `limit` query parameters
- **Filtering**: Resource-type specific filters
- **Sorting**: orderBy query parameter
- **Field Masking**: Sensitive field redaction based on user role
- **Audit Logging**: All operations logged with user, action, IP, user-agent
- **Rate Limiting**: Custom rate limits for sensitive operations
- **Error Responses**: Consistent error format with resource recommendations

---

## 3. Authentication & Authorization Implementation

### Authentication Architecture

#### JWT-Based Authentication
```typescript
// Token payload structure
{
  id: string           // User ID
  email: string        // User email
  role: string         // User role (admin, manager, supervisor, driver)
  tenant_id: string    // Multi-tenant isolation
}
```

**Location**: `/api/src/middleware/auth.ts`

#### Authentication Flow
1. **Login**: User provides credentials → Server validates → Returns JWT token
2. **Token Storage**: Frontend stores in sessionStorage/localStorage
3. **API Requests**: Include token in `Authorization: Bearer <token>` header
4. **Validation**: Each request validated with JWT_SECRET from environment
5. **Account Lock**: Failed login attempts trigger temporary account lock (AC-7 FedRAMP)

**Key Features**:
- Account locking after failed attempts
- Token expiration handling
- Mock data mode for development (USE_MOCK_DATA env variable)

### Authorization System

#### Role-Based Access Control (RBAC)
**Roles**: admin, manager, supervisor, driver

**Scope Levels** (hierarchical):
- `global` - Access all resources across tenant
- `fleet` - Access all vehicles/drivers in fleet
- `team` - Access own team's vehicles/drivers
- `own` - Access only personally assigned resource

**Permission Format**: `resource:verb:scope`

Examples:
- `vehicle:view:team` - View team vehicles
- `work_order:create:team` - Create work orders for team
- `purchase_order:approve` - Approve purchase orders
- `report:export:fleet` - Export fleet reports

#### Permission Database Structure
```
permissions
├── id (UUID)
├── name (resource:verb:scope)
└── description

role_permissions
├── role_id → permissions (many-to-many)
└── permission_id

user_roles
├── user_id → role_id (with expiration and activation)
└── is_active, expires_at
```

**Location**: `/api/src/middleware/permissions.ts`

#### Permission Checking
```typescript
// Middleware usage
router.post(
  '/work-orders',
  requirePermission('work_order:create:team'),  // Check permission
  {
    validateScope: async (req) => {
      // Row-level policy check
      return validateResourceScope(req.user.id, 'work_order', req.body.id)
    }
  },
  handler
)
```

#### Scope Validation
- **Vehicle Scope**: Check `team_vehicle_ids` array in user record
- **Driver Scope**: Check `team_driver_ids` array
- **Work Order**: Check if facility_id matches user's `facility_ids`
- **Route**: Check if driver_id is in `team_driver_ids`

#### Special Authorization Rules

**1. Separation of Duties (SoD)**
- Prevents self-approval of work orders, purchase orders, and safety incidents
- Enforced via `preventSelfApproval` middleware

**2. Approval Limits**
- Users have `approval_limit` field
- Purchase orders exceeding limit require escalation
- Enforced via `checkApprovalLimit` middleware

**3. Vehicle Status Validation**
- Operations restricted based on vehicle status (active, maintenance, retired)
- Enforced via `requireVehicleStatus` middleware

**4. Rate Limiting**
- Sensitive operations (GPS access, video retrieval) have rate limits
- Custom in-memory rate limit store with configurable windows

### Permission Cache
- **In-Memory Cache** with 5-minute TTL
- **Cache Key**: `user:{userId}`
- **Cache Invalidation**: `clearPermissionCache()` called on role changes

### Field Masking
**Location**: `/api/src/utils/fieldMasking.ts`

Redacts sensitive fields based on user role:
- Drivers don't see other drivers' personal contact info
- Managers don't see salary/compensation data
- Restricted fields stored in masking configuration per resource type

### Audit Logging
**Location**: `/api/src/middleware/audit.ts`

Logs all operations with:
- User ID
- Tenant ID
- Action (READ, CREATE, UPDATE, DELETE)
- Resource Type
- Timestamp
- IP Address
- User Agent
- Resource ID (for specific record access)

---

## 4. Frontend Structure (React Components)

### Framework & Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite with hot module reloading
- **Styling**: Tailwind CSS 4.1.11 with custom utilities
- **UI Components**: Radix UI + Custom components
- **State Management**: React hooks + Context API
- **Data Fetching**: React Query (TanStack Query 5.83.1) + SWR 2.3.6
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts 2.15.1
- **Maps**: Google Maps, Mapbox, Leaflet, Azure Maps

### Project Structure

```
/src
├── App.tsx                           # Main app component with module routing
├── main.tsx                          # Vite entry point
├── pages/                            # Page components
│   ├── AuthCallback.tsx
│   ├── Login.tsx
│   └── PersonalUse/                  # Personal use feature pages
│       ├── ChargesAndBilling.tsx
│       ├── ReimbursementQueue.tsx
│       └── PersonalUseDashboard.tsx
├── components/                       # Reusable components
│   ├── modules/                      # Feature modules (67 components!)
│   │   ├── FleetDashboard.tsx
│   │   ├── PeopleManagement.tsx
│   │   ├── GarageService.tsx
│   │   ├── PredictiveMaintenance.tsx
│   │   ├── FuelManagement.tsx
│   │   ├── GPSTracking.tsx
│   │   ├── DispatchConsole.tsx
│   │   ├── DocumentManagement.tsx
│   │   ├── PersonalUseDashboard.tsx
│   │   ├── PersonalUsePolicyConfig.tsx
│   │   ├── VideoTelematics.tsx
│   │   ├── EVChargingManagement.tsx
│   │   ├── TaskManagement.tsx
│   │   ├── TeamsIntegration.tsx
│   │   ├── EmailCenter.tsx
│   │   ├── ExecutiveDashboard.tsx
│   │   ├── FleetOptimizer.tsx
│   │   ├── CostAnalysisCenter.tsx
│   │   ├── DriverScorecard.tsx
│   │   ├── IncidentManagement.tsx
│   │   └── [60+ more feature modules]
│   ├── common/                       # Common UI components
│   ├── shared/                       # Shared components
│   ├── ui/                           # Radix UI wrapper components
│   ├── documents/                    # Document system components
│   ├── drilldown/                    # Drilldown UI components
│   ├── DispatchConsole.tsx
│   ├── GoogleMap.tsx
│   ├── MapboxMap.tsx
│   ├── LeafletMap.tsx
│   ├── UniversalMap.tsx
│   ├── Vehicle3DViewer.tsx
│   └── RouteOptimizer.tsx
├── contexts/                         # React Context providers
│   ├── DrilldownContext.tsx
│   └── documents/
├── hooks/                            # Custom React hooks
│   ├── use-api.ts
│   ├── use-fleet-data.ts
│   ├── useAuth.ts
│   ├── useTeams.ts
│   ├── useOutlook.ts
│   ├── useCalendar.ts
│   ├── useWebSocket.ts
│   ├── usePerformanceMonitor.ts
│   └── [20+ more hooks]
├── services/                         # Frontend services
│   ├── analytics.ts
│   └── errorReporting.ts
├── lib/                              # Utilities and helpers
│   ├── navigation.ts                 # Navigation configuration
│   └── [other utilities]
├── types/                            # TypeScript type definitions
├── utils/                            # Utility functions
├── config/                           # App configuration
├── tests/                            # Test files
└── styles/                           # CSS files

```

### Feature Modules (Located in `/src/components/modules/`)

**67 main feature modules** organized by domain:

#### Fleet Management (18 modules)
- FleetDashboard - Overview and KPIs
- PeopleManagement - Employee directory
- GarageService - Vehicle maintenance tracking
- PredictiveMaintenance - AI-powered maintenance predictions
- FuelManagement - Fuel tracking and analytics
- GPSTracking - Real-time vehicle tracking
- RouteManagement - Route planning and optimization
- VendorManagement - Vendor directory
- PartsInventory - Parts and equipment tracking
- PurchaseOrders - PO lifecycle management
- Invoices - Invoice management
- MileageReimbursement - Mileage tracking and reimbursement
- MaintenanceRequest - Work order requests
- MaintenanceScheduling - Maintenance calendar

#### Dispatch & Operations (8 modules)
- DispatchConsole - Radio dispatch and real-time coordination
- GISCommandCenter - Map-based command center
- TaskManagement - Task assignment and tracking
- EnhancedTaskManagement - Advanced task features
- AssetManagement - Non-vehicle asset tracking
- EquipmentDashboard - Equipment metrics
- IncidentManagement - Incident reporting and tracking
- TrafficCameras - Traffic camera monitoring

#### Communications & Integration (5 modules)
- TeamsIntegration - Microsoft Teams integration
- EmailCenter - Email management
- CommunicationLog - Communication history
- Notifications - In-app notifications
- PushNotificationAdmin - Push notification management

#### Analytics & Reporting (6 modules)
- FleetAnalytics - Comprehensive fleet analytics
- ExecutiveDashboard - Executive-level KPIs
- DriverPerformance - Driver metrics and scoring
- DriverScorecard - Detailed driver metrics
- CostAnalysisCenter - Cost tracking and analysis
- CustomReportBuilder - Dynamic report generation

#### AI & Intelligent Features (5 modules)
- AIAssistant - Natural language interface (temporarily disabled)
- DocumentQA - Q&A over documents
- DocumentManagement - Document storage and retrieval
- DataWorkbench - Data exploration and visualization
- CustomFormBuilder - Form builder with AI suggestions

#### EV & Alternative Fuels (2 modules)
- EVChargingManagement - EV charging management
- EVChargingDashboard - EV metrics and analytics

#### Compliance & Policies (4 modules)
- OSHAForms - OSHA compliance forms
- PersonalUseDashboard - Personal use tracking
- PersonalUsePolicyConfig - Policy configuration
- PolicyEngineWorkbench - Policy rule builder

#### Maps & Visualization (5 modules)
- EnhancedMapLayers - Advanced map layers
- MapSettings - Map configuration
- ArcGISIntegration - ArcGIS integration
- Vehicle3DViewer - 3D vehicle visualization
- VirtualGarage - 3D vehicle showroom

#### Video & Media (1 module)
- VideoTelematics - Video analysis from telematics

#### Other (3 modules)
- ReceiptProcessing - Receipt OCR
- Invoices - Invoice management
- CarbonFootprintTracker - Sustainability tracking

### Navigation & Routing

**Main Navigation** (`/src/lib/navigation.ts`):
- Configured as a switch statement in App.tsx
- Each navigation item maps to a module component
- Support for hierarchical menu structure

**Authentication Routes** (`/src/pages/`):
- Login.tsx - Login page
- AuthCallback.tsx - OAuth callback handler

### State Management

#### Context Providers
- **DrilldownContext** - Manages drilldown state for detailed views
- **Document Contexts** - Document system state

#### Custom Hooks
- **useAuth** - Authentication state and login/logout
- **useFleetData** - Fleet data loading with fallback to demo data
- **useApi** - Generic API call wrapper
- **useTeams** - Microsoft Teams integration
- **useOutlook** - Outlook calendar and email
- **useCalendar** - Calendar functionality
- **useWebSocket** - WebSocket connections for real-time data
- **useDemoMode** - Demo mode state
- **useNotifications** - Toast notifications
- **usePerformanceMonitor** - Performance monitoring
- **useLocalStorage** - Persistent browser storage
- **useTheme** - Theme switching
- **useAccessibility** - Accessibility features
- **useDebounce** - Input debouncing
- **useAsync** - Async operation handling

#### Data Fetching
- **React Query** - Server state management with caching and synchronization
- **SWR** - Stale-while-revalidate pattern for API data
- **Direct fetch** - For real-time and WebSocket data

### UI Component Library

#### Radix UI Components Used
- Accordion, Alert Dialog, Avatar
- Checkbox, Collapsible, Context Menu
- Dialog, Dropdown Menu, Hover Card
- Label, Menubar, Navigation Menu
- Popover, Progress, Radio Group
- Scroll Area, Select, Separator
- Slider, Switch, Tabs, Toggle, Toggle Group
- Tooltip

#### Map Libraries
- **Google Maps API** - Primary mapping solution
- **Mapbox GL** - Vector tile maps
- **Leaflet** - Lightweight alternative with Esri integration
- **Azure Maps** - Microsoft Azure integration
- **Custom UniversalMap** - Abstraction layer over multiple map providers

#### Visualization Libraries
- **Recharts** - Charts and graphs
- **D3.js** - Advanced data visualization
- **Three.js** - 3D graphics for vehicle visualization
- **React Three Fiber** - React wrapper for Three.js

### Styling
- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **Custom utilities** - Extended Tailwind configuration
- **CSS Modules** - For component-scoped styles
- **Theme support** - Light/dark mode toggle

### Key Frontend Features
- **Responsive Design** - Mobile-first approach
- **Accessibility** - WCAG 2AA compliance with axe-core testing
- **Performance Monitoring** - Real-time performance metrics
- **Error Boundaries** - Graceful error handling
- **Demo Mode** - Works with mock data when API unavailable
- **Role-Based UI** - Components conditionally rendered based on user role
- **Drilldown Navigation** - Multi-level detail views with breadcrumbs
- **Real-Time Updates** - WebSocket support for live data

---

## 5. Existing Vehicle, Employee & Assignment Management

### Vehicle Management

#### Vehicle Data Model
```
vehicles {
  id, tenant_id, unit_number, make, model, year, vin, license_plate
  vehicle_type, fuel_type, status (active|maintenance|retired)
  odometer, assigned_driver_id
  telematics_connections → vehicle_telematics_connections
  telemetry_data → vehicle_telemetry
  diagnostic_codes → vehicle_diagnostic_codes
  safety_events → driver_safety_events
  geofence_events → geofence_events
}
```

#### Existing Vehicle Features
- **Real-Time Tracking**: GPS location, speed, heading from 5+ telematics providers
- **Telemetry**: Fuel level, battery %, engine RPM, coolant temp, oil life
- **Diagnostics**: DTC codes with severity levels (info, warning, critical)
- **Safety Events**: Harsh braking, acceleration, speeding, distracted driving
- **Maintenance Tracking**: Scheduled maintenance with auto work order generation
- **Geofencing**: Entry/exit/dwell alerts for defined locations
- **3D Visualization**: Three.js-based vehicle model viewer
- **EV Support**: Battery level, charging status, estimated range
- **Temperature Monitoring**: For reefer trucks with multi-probe support
- **Tire Pressure Monitoring**: Individual tire PSI tracking

#### Vehicle Routes
- GET `/vehicles` - List all vehicles (with pagination, role-based filtering)
- GET `/vehicles/:id` - Vehicle details
- POST `/vehicles` - Create vehicle
- PUT `/vehicles/:id` - Update vehicle
- DELETE `/vehicles/:id` - Retire vehicle
- GET `/vehicles/:id/telemetry` - Real-time telemetry
- GET `/vehicles/:id/diagnostics` - Diagnostic codes
- GET `/vehicles/:id/safety-events` - Safety event history
- GET `/vehicles/:id/geofence-events` - Geofence activity
- POST `/vehicles/:id/geofence-alert` - Manual geofence test

### Employee/Driver Management

#### Driver Data Model
```
drivers {
  id, tenant_id, user_id, license_number, license_state, license_expiry
  cdl_class, is_active, mvr_status
  safety_events → driver_safety_events
  behavior_scores → driver_behavior_scores
  hos_logs → driver_hos_logs
  assigned_vehicles → vehicles (one-to-many)
}

users {
  id, tenant_id, email, password_hash, first_name, last_name, role
  phone, avatar_url, is_active, account_locked_until
  scope_level (global|fleet|team|own)
  facility_ids, team_driver_ids, team_vehicle_ids (for scope filtering)
  approval_limit, personal_use_policy_config
}
```

#### Existing Driver Features
- **License Management**: Expiry tracking, CDL class verification
- **Safety Scoring**: Daily/weekly/monthly behavior scores
- **Safety Events**: Categorized driving events with severity
- **Hours of Service**: ELD compliance tracking (8 HOS-related fields)
- **Performance Metrics**: Harsh driving events, speeding, following distance
- **Reimbursement**: Mileage and personal use tracking
- **Assignments**: Vehicle and route assignments
- **Communication**: Email, Teams, push notifications

#### Driver Routes
- GET `/drivers` - List drivers (role-based filtering)
- GET `/drivers/:id` - Driver details and metrics
- POST `/drivers` - Create driver
- PUT `/drivers/:id` - Update driver
- GET `/drivers/:id/scorecard` - Performance scorecard
- GET `/drivers/:id/safety-events` - Safety event history
- GET `/drivers/:id/hos-logs` - HOS compliance data
- GET `/drivers/:id/behavior-scores` - Score history
- POST `/drivers/:id/performance-report` - Generate report

### Assignment Management

#### Work Order System
```
work_orders {
  id, tenant_id, vehicle_id, assigned_to (driver/mechanic)
  facility_id, status (open|in_progress|completed)
  created_by, approved_by, completion_date
  work_type, priority, estimated_hours, actual_hours
  estimated_cost, actual_cost, parts, labor
}
```

#### Existing Assignment Features
- **Work Order Lifecycle**: Create → Assign → In Progress → Complete → Approve
- **Approval Workflow**: Separation of duties enforcement (creator ≠ approver)
- **Recurring Schedules**: Auto-generate work orders based on recurrence rules
  - Mileage-based (e.g., every 5,000 miles)
  - Time-based (e.g., monthly, quarterly, yearly)
  - Engine hour-based (e.g., every 500 hours)
  - Combined rules with multiple triggers
- **Cost Tracking**: Estimated vs actual, parts, labor, vendor costs
- **Parts Management**: Parts inventory linked to work orders
- **Vendor Management**: Vendor directory and pricing
- **Dispatch Assignment**: Tasks assigned to drivers/mechanics with SMS/email notification
- **Route Assignment**: Drivers assigned to routes with optimization

#### Assignment Routes
- POST `/work-orders` - Create work order
- GET `/work-orders` - List work orders (status filter)
- PUT `/work-orders/:id` - Update status
- GET `/work-orders/:id/timeline` - Approval timeline
- POST `/work-orders/:id/approve` - Approve (SoD enforcement)
- GET `/maintenance-schedules` - List maintenance schedules
- POST `/maintenance-schedules` - Create recurring schedule
- GET `/routes` - List assigned routes
- PUT `/routes/:id/status` - Update route status
- POST `/routes/:id/complete` - Mark route complete

### Dispatch System

#### Dispatch Console Features
- **Radio Channels**: Multiple dispatch channels with priority levels
- **Real-Time Location**: Live vehicle positions with WebSocket updates
- **Audio Streaming**: WebRTC-based audio dispatch
- **Emergency Alerts**: Quick emergency alert creation and acknowledgment
- **Metrics**: Dispatch performance metrics (response time, completion rate)
- **History**: Transmission history and event logs

#### Dispatch Routes
- GET `/dispatch/channels` - List available channels
- GET `/dispatch/channels/:id/history` - Channel transmission history
- POST `/dispatch/emergency` - Create emergency alert
- PUT `/dispatch/emergency/:id/acknowledge` - Acknowledge alert
- GET `/dispatch/metrics` - Performance metrics
- WebSocket: `/dispatch/ws` - Real-time audio streaming

---

## 6. Technology Stack & Configuration

### Frontend Stack
```json
{
  "framework": "React 19.0.0",
  "build": "Vite 6.3.5",
  "language": "TypeScript 5.7.2",
  "styling": "Tailwind CSS 4.1.11",
  "ui_components": "Radix UI (15+ components)",
  "icons": "Phosphor Icons 2.1.7, Heroicons 2.2.0, Lucide React 0.484.0",
  "forms": "React Hook Form 7.54.2",
  "validation": "Zod 3.25.76",
  "state": "React Query 5.83.1, SWR 2.3.6",
  "maps": "Google Maps API 2.20.3, Mapbox GL 3.10.0, Leaflet 1.9.4, Azure Maps 3.7.1",
  "visualization": "Recharts 2.15.1, D3.js 7.9.0, Three.js 0.181.1",
  "charts": "Recharts 2.15.1",
  "animation": "Framer Motion 12.6.2",
  "drag_drop": "Embla Carousel 8.5.2",
  "modals": "Vaul 1.1.2 (drawer), React Hot Toast 2.6.0",
  "markdown": "Marked 15.0.7",
  "testing": "Playwright 1.56.1, Vitest 4.0.8, Testing Library",
  "accessibility": "axe-core 4.11.0, Jest Axe 10.0.0",
  "performance": "Rollup Visualizer, Lighthouse integration"
}
```

### Backend Stack
```json
{
  "runtime": "Node.js",
  "framework": "Express.js 4.18.2",
  "language": "TypeScript 5.3.3",
  "database": "PostgreSQL 12+",
  "orm": "Raw SQL with pg client 8.16.3",
  "validation": "Zod 3.22.4",
  "auth": "JWT with jsonwebtoken 9.0.2, bcrypt 5.1.1",
  "middleware": [
    "CORS 2.8.5",
    "Helmet 7.1.0 (security headers)",
    "Rate Limiting 7.1.5"
  ],
  "file_upload": "Multer 2.0.2",
  "image": "Sharp 0.33.0 (image processing)",
  "queue": "pg-boss 12.2.0 (job queue)",
  "cron": "node-cron 4.2.1",
  "email": "Nodemailer 7.0.10",
  "qr_code": "qrcode 1.5.4",
  "api_docs": "Swagger JSDoc 6.2.8, Swagger UI Express 5.0.1",
  "telemetry": "OpenTelemetry SDK with OTLP exporter",
  "monitoring": "Application Insights 3.12.0",
  "logging": "Winston 3.11.0",
  "websockets": "ws 8.16.0",
  "http": "Axios 1.13.2, Supertest 6.3.3",
  "ai": [
    "Anthropic SDK 0.20.0",
    "OpenAI 4.28.0",
    "Azure OpenAI 1.0.0-beta.8",
    "LangChain Core 1.0.0",
    "LangChain OpenAI 1.0.0"
  ],
  "azure": [
    "Azure Storage Blob 12.18.0",
    "Azure Cosmos 4.0.0",
    "Azure Search 12.2.0",
    "Azure Computer Vision (OCR) 8.2.0",
    "Azure Identity 4.0.0",
    "Azure Cognitive Services Speech 1.34.1"
  ],
  "microsoft": [
    "Microsoft Graph Client 3.0.7",
    "Microsoft Teams SDK"
  ],
  "testing": "Vitest 1.1.0"
}
```

### Environment Configuration

#### Frontend Environment Variables (`.env.example`)
```env
# API Configuration
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000

# Maps & Geolocation
VITE_GOOGLE_MAPS_API_KEY=
VITE_MAPBOX_TOKEN=
VITE_AZURE_MAPS_KEY=

# Microsoft Integration
VITE_MICROSOFT_CLIENT_ID=
VITE_MICROSOFT_TENANT_ID=

# Third-party Services
VITE_SENTRY_DSN=
VITE_ANALYTICS_KEY=
```

#### Backend Environment Variables (`.env.example`)
```env
# Server
NODE_ENV=development
PORT=3000
USE_MOCK_DATA=true

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleetdb
DB_USER=fleetadmin
DB_PASSWORD=
DATABASE_SSL=false

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=24h

# Azure Services
AZURE_STORAGE_ACCOUNT=
AZURE_STORAGE_KEY=
AZURE_SEARCH_ENDPOINT=
AZURE_SEARCH_KEY=
AZURE_COSMOS_ENDPOINT=
AZURE_COSMOS_KEY=

# Telematics Providers
SAMSARA_API_KEY=
GEOTAB_USER=
GEOTAB_PASSWORD=
VERIZON_API_KEY=
MOTIVE_API_KEY=
SMARTCAR_API_KEY=

# AI/ML Services
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
AZURE_OPENAI_KEY=
AZURE_OPENAI_ENDPOINT=

# Microsoft Integration
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=
GRAPH_API_TOKEN=

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Job Queue
PGBOSS_DATABASE=
PGBOSS_CONNECTION_STRING=

# Monitoring
OTEL_EXPORTER_OTLP_ENDPOINT=
APPLICATION_INSIGHTS_INSTRUMENTATION_KEY=
```

### Configuration Files

#### Frontend
- `.eslintrc.json` - ESLint rules for React, TypeScript
- `.prettierrc` - Code formatting preferences
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript compiler options
- `tailwind.config.js` - Tailwind CSS customization
- `playwright.config.ts` - E2E test configuration
- `vitest.config.ts` - Unit test configuration
- `.pa11yci.json` - Accessibility testing

#### Backend
- `.eslintrc.json` - ESLint rules
- `tsconfig.json` - TypeScript configuration
- `Dockerfile` - Container build (development)
- `Dockerfile.production` - Production container
- `.dockerignore` - Docker build exclusions
- `vitest.config.ts` - Test configuration

### Docker Setup

#### Development Container (`Dockerfile`)
- Node.js base image
- Installs dependencies
- Runs in development mode with hot reload

#### Production Container (`Dockerfile.production`)
- Multi-stage build for optimization
- Production dependencies only
- Healthcheck endpoint configured

### Database Migrations

**Migration System**: Pure SQL files in `/api/src/migrations/`
- Auto-executed on server startup
- Tracked in `migrations_applied` table
- Format: Sequential numbering + descriptive name
- Examples:
  - `002-add-ai-features.sql` - AI conversation tables
  - `009_telematics_integration.sql` - Multi-provider telematics
  - `023_document_management_ocr.sql` - Document storage

### Testing Infrastructure

#### Frontend Testing
- **E2E Tests**: Playwright with 10 test categories
  - Smoke tests (basic functionality)
  - Main modules, management, procurement
  - Form validation, accessibility
  - Performance, security, load testing
- **Unit Tests**: Vitest with coverage
- **Accessibility**: axe-core + pa11y
- **Visual Regression**: Playwright visual tests
- **Performance**: Lighthouse integration

#### Backend Testing
- **Unit Tests**: Vitest
- **Integration Tests**: Supertest
- **Coverage Reports**: Generated with vitest

---

## 7. Implementation Recommendations for New Requirements

### Architecture Patterns

#### 1. **Adding New Entity/Module**
```
1. Create migration in /api/src/migrations/NNN_feature_name.sql
2. Create route in /api/src/routes/feature-name.ts
3. Create service in /api/src/services/feature-name.service.ts
4. Add permission patterns: resource:view:team, resource:create:team, etc.
5. Create frontend module in /src/components/modules/FeatureName.tsx
6. Add navigation entry in /src/lib/navigation.ts
7. Create hooks if needed in /src/hooks/
```

#### 2. **Multi-Tenancy**
- Always include `tenant_id` in WHERE clauses
- Use `req.user!.tenant_id` for filtering
- Create tenant-scoped indexes

#### 3. **Field Masking**
- Add field definitions in masking utility
- Apply via middleware: `applyFieldMasking('resource_type')`
- Test with different user roles

#### 4. **Role-Based Access**
- Define permissions: `resource:action:scope`
- Implement in route: `requirePermission('resource:action:scope')`
- Add SoD rules where needed: `preventSelfApproval()`
- Create role assignments via permission_check_logs audit

#### 5. **Telematics Integration**
- Register provider in `telematics_providers` table
- Create vehicle connection via API
- Implement webhook handler for real-time events
- Map provider data to unified `vehicle_telemetry` schema

#### 6. **Real-Time Updates**
- Implement WebSocket routes in `/routes/`
- Use pg-boss for async job processing
- Implement webhook handlers for external events
- Store in `telematics_webhook_events` log table

### Database Best Practices

1. **Indexing**: Create indexes on frequently filtered columns
2. **Constraints**: Use UNIQUE constraints for data integrity
3. **Foreign Keys**: Maintain referential integrity with CASCADE deletes
4. **Migrations**: Always include DOWN scripts for rollbacks
5. **Comments**: Document table and column purposes
6. **Views**: Create views for complex queries

### API Best Practices

1. **Pagination**: Always support `page` and `limit` parameters
2. **Filtering**: Support role-specific and attribute-based filters
3. **Error Responses**: Consistent JSON error format with status codes
4. **Validation**: Use Zod for request validation
5. **Audit Logging**: Log all mutations with user context
6. **Rate Limiting**: Apply to sensitive operations
7. **Documentation**: Add OpenAPI/Swagger comments

### Frontend Best Practices

1. **Component Organization**: Feature-based modular structure
2. **Type Safety**: Use TypeScript interfaces for all data
3. **State Management**: Use Context for global, hooks for local state
4. **Error Handling**: Implement ErrorBoundary components
5. **Performance**: Lazy load modules, use React Query caching
6. **Accessibility**: Use semantic HTML, test with axe-core
7. **Testing**: Write unit tests for utilities, E2E for workflows

---

## Key Files Reference

### Critical Configuration Files
- `/api/src/config/database.ts` - Database connection pool
- `/api/src/server.ts` - Express app setup and route registration
- `/api/src/middleware/auth.ts` - JWT authentication
- `/api/src/middleware/permissions.ts` - RBAC implementation
- `/src/App.tsx` - Frontend module routing
- `/src/lib/navigation.ts` - Navigation configuration
- `/vite.config.ts` - Frontend build configuration

### Main Integration Points
- `/api/src/routes/` - API endpoints (90+ files)
- `/api/src/services/` - Business logic (100+ files)
- `/src/components/modules/` - Feature UI (67 components)
- `/api/src/migrations/` - Database schema (30+ migrations)
- `/api/src/middleware/` - Middleware chain (auth, permissions, audit)

### Key Services
- DocumentAiService - OCR and document intelligence
- EmbeddingService - Vector embeddings for RAG
- OcrService - Optical character recognition
- SearchIndexService - Full-text and semantic search
- StorageManager - File upload/download
- DispatchService - Radio dispatch operations
- TeamsService - Microsoft Teams integration
- OutlookService - Outlook calendar/email
- QueueService - Job queue management
- WebRTCService - Real-time audio/video

---

## Summary

The Fleet application is a **comprehensive, enterprise-grade fleet management system** with:

✅ **Sophisticated Authentication**: JWT + RBAC with fine-grained permissions  
✅ **Multi-Tenant Architecture**: Isolated data with scope-based access  
✅ **Telematics Integration**: 5+ provider support (Samsara, Geotab, Verizon, etc.)  
✅ **Real-Time Features**: WebSocket dispatch, live GPS tracking  
✅ **AI/ML Capabilities**: Document intelligence, predictive analytics, semantic search  
✅ **Compliance Support**: OSHA forms, HOS logging, ELD compliance  
✅ **Rich Analytics**: Custom reports, executive dashboards, driver scorecards  
✅ **Microsoft Integration**: Teams, Outlook, Graph API  
✅ **Extensive Testing**: E2E, accessibility, performance, load testing  
✅ **Cloud-Ready**: Azure services, container support, scalable architecture  

The codebase is well-structured, following REST API patterns, security best practices (FedRAMP-aligned), and providing clear extension points for new features.
