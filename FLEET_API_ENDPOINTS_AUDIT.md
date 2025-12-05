# Fleet Management System - Complete API Endpoint & Integration Audit

## Executive Summary

Comprehensive inventory of all API endpoints, external service integrations, and workflows for the Fleet Management System. This includes frontend API hooks, backend routes, external service connections, and WebSocket integrations.

**Total Endpoints: 120+ documented endpoints across 20+ categories**
**External Integrations: 15+ services**
**WebSocket Connections: 4 real-time channels**

---

## 1. FRONTEND API HOOKS & ENDPOINTS

### 1.1 Primary API Hook Module (`src/hooks/use-api.ts`)

This is the central API client with CSRF protection and state management.

#### CSRF Protection Implementation
- **Endpoint**: `/api/v1/csrf-token` (GET)
- **Purpose**: Fetch CSRF token for state-changing operations
- **Mechanism**: 
  - Tokens stored in memory (NOT localStorage) to prevent XSS
  - Included in `X-CSRF-Token` header for POST/PUT/DELETE/PATCH
  - Auto-refreshes on 403 errors
  - Clears on logout

#### Query Hooks (GET Endpoints)

| Hook Function | Endpoint | Method | Auth Required |
|---|---|---|---|
| `useVehicles()` | `/api/vehicles` | GET | Yes |
| `useDrivers()` | `/api/drivers` | GET | Yes |
| `useMaintenance()` | `/api/maintenance` | GET | Yes |
| `useWorkOrders()` | `/api/work-orders` | GET | Yes |
| `useFuelTransactions()` | `/api/fuel-transactions` | GET | Yes |
| `useFacilities()` | `/api/facilities` | GET | Yes |
| `useMaintenanceSchedules()` | `/api/maintenance-schedules` | GET | Yes |
| `useRoutes()` | `/api/routes` | GET | Yes |

#### Mutation Hooks (CREATE/UPDATE/DELETE Endpoints)

**Vehicle Operations**
- CREATE: POST `/api/vehicles`
- UPDATE: PUT `/api/vehicles/{id}`
- DELETE: DELETE `/api/vehicles/{id}`

**Driver Operations**
- CREATE: POST `/api/drivers`
- UPDATE: PUT `/api/drivers/{id}`
- DELETE: DELETE `/api/drivers/{id}`

**Maintenance Operations**
- CREATE: POST `/api/maintenance`
- UPDATE: PUT `/api/maintenance/{id}`
- DELETE: DELETE `/api/maintenance/{id}`

**Work Order Operations**
- CREATE: POST `/api/work-orders`
- UPDATE: PUT `/api/work-orders/{id}`
- DELETE: DELETE `/api/work-orders/{id}`

**Fuel Transaction Operations**
- CREATE: POST `/api/fuel-transactions`
- UPDATE: PUT `/api/fuel-transactions/{id}`
- DELETE: DELETE `/api/fuel-transactions/{id}`

**Facility Operations**
- CREATE: POST `/api/facilities`
- UPDATE: PUT `/api/facilities/{id}`
- DELETE: DELETE `/api/facilities/{id}`

**Maintenance Schedule Operations**
- CREATE: POST `/api/maintenance-schedules`
- UPDATE: PUT `/api/maintenance-schedules/{id}`
- DELETE: DELETE `/api/maintenance-schedules/{id}`

**Route Operations**
- CREATE: POST `/api/routes`
- UPDATE: PUT `/api/routes/{id}`
- DELETE: DELETE `/api/routes/{id}`

---

## 2. COMPLETE ENDPOINT REGISTRY

### 2.1 Authentication Endpoints

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| auth-login | `/api/auth/login` | POST | User login | No |
| auth-register | `/api/auth/register` | POST | User registration | No |
| auth-logout | `/api/auth/logout` | POST | User logout | Yes |
| auth-csrf | `/api/csrf` | GET | Get CSRF token | No |
| auth-verify | `/api/v1/auth/verify` | GET | Verify auth token | Yes |

### 2.2 Vehicle Management

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| vehicles-list | `/api/vehicles` | GET | List all vehicles | Yes |
| vehicles-get | `/api/vehicles/:id` | GET | Get vehicle details | Yes |
| vehicles-create | `/api/vehicles` | POST | Create vehicle | Yes |
| vehicles-update | `/api/vehicles/:id` | PUT | Update vehicle | Yes |
| vehicles-delete | `/api/vehicles/:id` | DELETE | Delete vehicle | Yes |
| vehicles-telemetry | `/api/vehicles/:id/telemetry` | POST | Update telemetry | Yes |

### 2.3 Driver Management

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| drivers-list | `/api/drivers` | GET | List all drivers | Yes |
| drivers-get | `/api/drivers/:id` | GET | Get driver details | Yes |
| drivers-create | `/api/drivers` | POST | Create driver | Yes |
| drivers-update | `/api/drivers/:id` | PUT | Update driver | Yes |
| drivers-delete | `/api/drivers/:id` | DELETE | Delete driver | Yes |

### 2.4 Work Orders

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| workorders-list | `/api/work-orders` | GET | List work orders | Yes |
| workorders-get | `/api/work-orders/:id` | GET | Get work order | Yes |
| workorders-create | `/api/work-orders` | POST | Create work order | Yes |
| workorders-update | `/api/work-orders/:id` | PUT | Update work order | Yes |
| workorders-delete | `/api/work-orders/:id` | DELETE | Delete work order | Yes |

### 2.5 Maintenance Schedules

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| maintenance-list | `/api/maintenance-schedules` | GET | List schedules | Yes |
| maintenance-get | `/api/maintenance-schedules/:id` | GET | Get schedule | Yes |
| maintenance-create | `/api/maintenance-schedules` | POST | Create schedule | Yes |
| maintenance-update | `/api/maintenance-schedules/:id` | PUT | Update schedule | Yes |
| maintenance-delete | `/api/maintenance-schedules/:id` | DELETE | Delete schedule | Yes |

### 2.6 Fuel Transactions

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| fuel-list | `/api/fuel-transactions` | GET | List transactions | Yes |
| fuel-get | `/api/fuel-transactions/:id` | GET | Get transaction | Yes |
| fuel-create | `/api/fuel-transactions` | POST | Create transaction | Yes |
| fuel-update | `/api/fuel-transactions/:id` | PUT | Update transaction | Yes |
| fuel-delete | `/api/fuel-transactions/:id` | DELETE | Delete transaction | Yes |

### 2.7 Routes

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| routes-list | `/api/routes` | GET | List routes | Yes |
| routes-get | `/api/routes/:id` | GET | Get route | Yes |
| routes-create | `/api/routes` | POST | Create route | Yes |
| routes-update | `/api/routes/:id` | PUT | Update route | Yes |
| routes-delete | `/api/routes/:id` | DELETE | Delete route | Yes |

### 2.8 Geofences

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| geofences-list | `/api/geofences` | GET | List geofences | Yes |
| geofences-get | `/api/geofences/:id` | GET | Get geofence | Yes |
| geofences-create | `/api/geofences` | POST | Create geofence | Yes |
| geofences-update | `/api/geofences/:id` | PUT | Update geofence | Yes |
| geofences-delete | `/api/geofences/:id` | DELETE | Delete geofence | Yes |

### 2.9 Inspections

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| inspections-list | `/api/inspections` | GET | List inspections | Yes |
| inspections-get | `/api/inspections/:id` | GET | Get inspection | Yes |
| inspections-create | `/api/inspections` | POST | Create inspection | Yes |
| inspections-update | `/api/inspections/:id` | PUT | Update inspection | Yes |
| inspections-delete | `/api/inspections/:id` | DELETE | Delete inspection | Yes |

### 2.10 Safety Incidents

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| incidents-list | `/api/safety-incidents` | GET | List incidents | Yes |
| incidents-get | `/api/safety-incidents/:id` | GET | Get incident | Yes |
| incidents-create | `/api/safety-incidents` | POST | Create incident | Yes |
| incidents-update | `/api/safety-incidents/:id` | PUT | Update incident | Yes |
| incidents-delete | `/api/safety-incidents/:id` | DELETE | Delete incident | Yes |

### 2.11 Charging Stations

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| charging-list | `/api/charging-stations` | GET | List stations | Yes |
| charging-get | `/api/charging-stations/:id` | GET | Get station | Yes |
| charging-create | `/api/charging-stations` | POST | Create station | Yes |
| charging-update | `/api/charging-stations/:id` | PUT | Update station | Yes |
| charging-delete | `/api/charging-stations/:id` | DELETE | Delete station | Yes |

### 2.12 Purchase Orders

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| po-list | `/api/purchase-orders` | GET | List purchase orders | Yes |
| po-get | `/api/purchase-orders/:id` | GET | Get purchase order | Yes |
| po-create | `/api/purchase-orders` | POST | Create purchase order | Yes |
| po-update | `/api/purchase-orders/:id` | PUT | Update purchase order | Yes |
| po-delete | `/api/purchase-orders/:id` | DELETE | Delete purchase order | Yes |

### 2.13 Facilities

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| facilities-list | `/api/facilities` | GET | List facilities | Yes |
| facilities-get | `/api/facilities/:id` | GET | Get facility | Yes |
| facilities-create | `/api/facilities` | POST | Create facility | Yes |
| facilities-update | `/api/facilities/:id` | PUT | Update facility | Yes |
| facilities-delete | `/api/facilities/:id` | DELETE | Delete facility | Yes |

### 2.14 Vendors

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| vendors-list | `/api/vendors` | GET | List vendors | Yes |
| vendors-get | `/api/vendors/:id` | GET | Get vendor | Yes |
| vendors-create | `/api/vendors` | POST | Create vendor | Yes |
| vendors-update | `/api/vendors/:id` | PUT | Update vendor | Yes |
| vendors-delete | `/api/vendors/:id` | DELETE | Delete vendor | Yes |

### 2.15 Telemetry

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| telemetry-list | `/api/telemetry` | GET | List telemetry data | Yes |
| telemetry-get | `/api/telemetry/:id` | GET | Get telemetry | Yes |
| telemetry-create | `/api/telemetry` | POST | Create telemetry | Yes |

### 2.16 AI Services

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| ai-query | `/api/ai/query` | POST | AI query | Yes |
| ai-assistant | `/api/ai/assistant` | POST | AI assistant | Yes |
| ai-receipt | `/api/ai/receipt/extract` | POST | Process receipt | Yes |

### 2.17 Traffic Cameras

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| cameras-list | `/api/traffic-cameras` | GET | List cameras | Yes |
| cameras-get | `/api/traffic-cameras/:id` | GET | Get camera | Yes |
| cameras-nearby | `/api/traffic-cameras/nearby` | GET | Find nearby cameras | Yes |
| cameras-sources | `/api/traffic-cameras/sources/list` | GET | List sources | Yes |
| cameras-sync | `/api/traffic-cameras/sync` | POST | Sync all cameras | Yes |
| cameras-sync-source | `/api/traffic-cameras/sources/:id/sync` | POST | Sync source | Yes |

### 2.18 ArcGIS Layers

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| arcgis-list | `/api/arcgis-layers` | GET | List layers | Yes |
| arcgis-get | `/api/arcgis-layers/:id` | GET | Get layer | Yes |
| arcgis-enabled | `/api/arcgis-layers/enabled/list` | GET | List enabled layers | Yes |
| arcgis-create | `/api/arcgis-layers` | POST | Create layer | Yes |
| arcgis-update | `/api/arcgis-layers/:id` | PUT | Update layer | Yes |
| arcgis-delete | `/api/arcgis-layers/:id` | DELETE | Delete layer | Yes |

### 2.19 Microsoft Teams Integration

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| teams-list | `/api/teams` | GET | List teams | Yes |
| teams-get | `/api/teams/:id` | GET | Get team | Yes |
| teams-channels | `/api/teams/:id/channels` | GET | List channels | Yes |
| teams-messages | `/api/teams/:teamId/channels/:channelId/messages` | GET | List messages | Yes |
| teams-send | `/api/teams/:teamId/channels/:channelId/messages` | POST | Send message | Yes |

### 2.20 Outlook Integration

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| outlook-folders | `/api/outlook/folders` | GET | List folders | Yes |
| outlook-messages | `/api/outlook/messages` | GET | List messages | Yes |
| outlook-send | `/api/outlook/send` | POST | Send email | Yes |
| outlook-search | `/api/outlook/messages/search` | GET | Search messages | Yes |

### 2.21 Calendar Events

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| calendar-events | `/api/calendar/events` | GET | List events | Yes |
| calendar-create | `/api/calendar/events` | POST | Create event | Yes |
| calendar-accept | `/api/calendar/events/:id/accept` | POST | Accept event | Yes |
| calendar-decline | `/api/calendar/events/:id/decline` | POST | Decline event | Yes |
| calendar-find | `/api/calendar/findMeetingTimes` | POST | Find meeting times | Yes |

### 2.22 Adaptive Cards

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| cards-maintenance | `/api/adaptive-cards/maintenance` | POST | Send maintenance card | Yes |
| cards-workorder | `/api/adaptive-cards/work-order` | POST | Send work order card | Yes |
| cards-approval | `/api/adaptive-cards/approval` | POST | Send approval card | Yes |
| cards-inspection | `/api/adaptive-cards/inspection` | POST | Send inspection card | Yes |

### 2.23 User Presence

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| presence-get | `/api/presence/:userId` | GET | Get user presence | Yes |
| presence-set | `/api/presence` | POST | Set presence | Yes |

### 2.24 Personal Use Policies

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| personal-policies | `/api/personal-use-policies` | GET | Get policies | Yes |
| personal-trip-usage | `/api/trip-usage` | GET | List trip usage | Yes |
| personal-mark-trip | `/api/trips/:id/mark` | POST | Mark trip | Yes |

### 2.25 Asset Relationships

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| relationships-list | `/api/asset-relationships` | GET | List relationships | Yes |
| relationships-active | `/api/asset-relationships/active` | GET | List active | Yes |
| relationships-get | `/api/asset-relationships/:id` | GET | Get relationship | Yes |
| relationships-create | `/api/asset-relationships` | POST | Create relationship | Yes |
| relationships-update | `/api/asset-relationships/:id` | PUT | Update relationship | Yes |
| relationships-delete | `/api/asset-relationships/:id` | DELETE | Delete relationship | Yes |

### 2.26 OBD2 Emulator

| ID | Path | Method | Description | Auth |
|---|---|---|---|---|
| obd2-start | `/api/obd2-emulator/start` | POST | Start emulator | Yes |
| obd2-stop | `/api/obd2-emulator/stop/:id` | POST | Stop emulator | Yes |

### 2.27 Radio Dispatch Endpoints (`lib/radioApi.ts`)

#### Radio Channels
- GET `/api/radio/channels` - List all channels
- GET `/api/radio/channels/{channelId}` - Get specific channel
- POST `/api/radio/channels` - Create new channel
- PUT `/api/radio/channels/{channelId}` - Update channel
- DELETE `/api/radio/channels/{channelId}` - Delete channel
- POST `/api/radio/channels/{channelId}/test` - Test channel
- GET `/api/radio/channels/{channelId}/statistics` - Get channel stats

#### Transmissions
- GET `/api/radio/transmissions` - List transmissions
- GET `/api/radio/transmissions/{transmissionId}` - Get transmission
- POST `/api/radio/transmissions/search` - Search transcripts
- GET `/api/radio/transmissions/export` - Export transcripts

#### Dispatch Policies
- GET `/api/dispatch/policies` - List policies
- GET `/api/dispatch/policies/{policyId}` - Get policy
- POST `/api/dispatch/policies` - Create policy
- PUT `/api/dispatch/policies/{policyId}` - Update policy
- DELETE `/api/dispatch/policies/{policyId}` - Delete policy
- POST `/api/dispatch/policies/{policyId}/toggle` - Toggle policy
- GET `/api/dispatch/policies/{policyId}/statistics` - Get stats
- GET `/api/dispatch/policies/executions` - List executions
- GET `/api/dispatch/policies/executions/{executionId}` - Get execution
- POST `/api/dispatch/policies/executions/{executionId}/approve` - Approve
- POST `/api/dispatch/policies/executions/{executionId}/reject` - Reject

### 2.28 Damage Analysis

- POST `/api/damage/comprehensive-analysis` - Analyze damage
- POST `/api/damage/analyze-video` - Analyze video damage

### 2.29 Evidence Locker (Video Management)

- GET `/api/video/evidence-locker` - List evidence
- GET `/api/video/evidence-locker/{lockerId}` - Get evidence
- POST `/api/video/evidence-locker` - Create evidence
- GET `/api/video/events/{eventId}/clip` - Get video clip

### 2.30 Dispatch Console

- GET `/api/dispatch/channels` - List dispatch channels
- GET `/api/dispatch/channels/{channelId}/history` - Get history
- GET `/api/dispatch/channels/{channelId}/listeners` - Get listeners
- GET `/api/dispatch/emergency` - Get emergency status

---

## 3. EXTERNAL SERVICE INTEGRATIONS

### 3.1 Microsoft Azure Services

#### Azure AD Authentication
- **Service**: Azure Active Directory
- **Configuration**:
  - Client ID: `VITE_AZURE_AD_CLIENT_ID`
  - Tenant ID: `VITE_AZURE_AD_TENANT_ID`
  - Redirect URI: `VITE_AZURE_AD_REDIRECT_URI`
- **Files**: `src/lib/microsoft-auth.ts`, `src/pages/AuthCallback.tsx`
- **Endpoints**:
  - OAuth callback: `/auth/microsoft/callback`
  - Login verification: `/api/v1/auth/verify`

#### Azure OpenAI (GPT-4.5)
- **Service**: Azure OpenAI Service
- **Configuration**:
  - Endpoint: `AZURE_OPENAI_ENDPOINT`
  - API Key: `AZURE_OPENAI_KEY`
  - Deployment: `AZURE_OPENAI_DEPLOYMENT=gpt-4.5-preview`
  - API Version: `2023-12-01-preview`
- **Use Cases**: AI queries, assistant, receipt processing

#### Microsoft Application Insights
- **Service**: Azure Application Insights (Frontend)
- **Configuration**:
  - Connection String: `VITE_APPLICATION_INSIGHTS_CONNECTION_STRING`
  - Backend Connection: `APPLICATION_INSIGHTS_CONNECTION_STRING`
- **File**: `src/lib/telemetry.ts`
- **Telemetry Data**:
  - Page views
  - Custom events
  - Exceptions
  - Performance metrics
  - API call tracking

#### Microsoft Graph API
- **Service**: Microsoft Graph (Teams & Outlook)
- **Configuration**:
  - Client ID: `MS_GRAPH_CLIENT_ID`
  - Client Secret: `MS_GRAPH_CLIENT_SECRET`
  - Tenant: `MS_GRAPH_TENANT_ID`
  - Scope: `https://graph.microsoft.com/.default`
- **Endpoints**:
  - Teams: `/api/teams`
  - Outlook: `/api/outlook`
  - Calendar: `/api/calendar`

#### Azure Storage
- **Service**: Azure Blob Storage
- **Configuration**:
  - Connection String: `AZURE_STORAGE_CONNECTION_STRING`
  - Container: `fleet-files`
- **Purpose**: File uploads and document management

#### Azure Key Vault
- **Service**: Azure Key Vault
- **Configuration**: `AZURE_KEY_VAULT_URI`
- **Purpose**: Secrets management

#### Azure Maps
- **Service**: Azure Maps (optional fallback)
- **Configuration**: `VITE_AZURE_MAPS_SUBSCRIPTION_KEY`

### 3.2 Google Services

#### Google Maps API
- **Configuration**: `VITE_GOOGLE_MAPS_API_KEY=<YOUR_GOOGLE_MAPS_API_KEY>`
- **File**: `src/components/assets/AssetLocationMap.tsx`
- **Use Cases**: Vehicle location tracking, route planning, geofencing

#### Google OAuth (if configured)
- **Client ID**: `GOOGLE_CLIENT_ID`
- **Client Secret**: `GOOGLE_CLIENT_SECRET`

### 3.3 Error Tracking & Monitoring

#### Sentry (Frontend)
- **Configuration**:
  - DSN: `VITE_SENTRY_DSN`
  - Environment: `VITE_SENTRY_ENVIRONMENT`
  - Release: `VITE_SENTRY_RELEASE`
- **File**: `src/lib/sentry.ts`
- **Tracking**: JavaScript errors, exceptions, performance

#### Sentry (Backend)
- **Configuration**:
  - DSN: `SENTRY_DSN`
  - Environment: `SENTRY_ENVIRONMENT`
  - Release: `SENTRY_RELEASE`

### 3.4 Communication Services

#### SendGrid (Email)
- **Configuration**:
  - API Key: `SENDGRID_API_KEY`
  - From Email: `SENDGRID_FROM_EMAIL`
- **Purpose**: Email notifications

#### Twilio (SMS)
- **Configuration**:
  - Account SID: `TWILIO_ACCOUNT_SID`
  - Auth Token: `TWILIO_AUTH_TOKEN`
  - Phone: `TWILIO_PHONE_NUMBER`
- **Purpose**: SMS notifications

### 3.5 Database Services

#### PostgreSQL (Primary)
- **Configuration**:
  - Type: `DATABASE_TYPE=cosmosdb` (Azure Cosmos DB)
  - Connection String: `DATABASE_CONNECTION_STRING`
- **Credentials** (Docker Compose):
  - User: `POSTGRES_USER`
  - Password: `POSTGRES_PASSWORD`
  - Database: `POSTGRES_DB=fleetdb`

### 3.6 Third-Party Integrations

#### ArcGIS (Geospatial)
- **Endpoints**: `/api/arcgis-layers`
- **Features**: Layer management, geospatial data

#### Traffic Cameras (External Feed)
- **Endpoints**: `/api/traffic-cameras`
- **Features**: Camera sync, source management

---

## 4. WEBSOCKET CONNECTIONS

### 4.1 OBD2 Emulator
- **URL**: `ws://localhost:8000/ws/obd2/`
- **Category**: OBD2 Emulator
- **Purpose**: Real-time vehicle telemetry data
- **Status**: Tracked with reconnect logic

### 4.2 Radio Socket
- **URL**: `VITE_RADIO_SOCKET_URL` or `http://localhost:8000`
- **Category**: Radio Dispatch
- **Purpose**: Radio transmissions and policy triggers
- **Status**: Tracked for connectivity

### 4.3 Dispatch Socket
- **URL**: `VITE_DISPATCH_SOCKET_URL` or `http://localhost:8000`
- **Category**: Dispatch System
- **Purpose**: Dispatch events and unit status
- **Status**: Tracked for connectivity

### 4.4 General WebSocket
- **URL**: `/api/dispatch/ws`
- **Category**: General Events
- **Purpose**: Teams and Outlook events
- **Status**: Tracked for connectivity

---

## 5. ENVIRONMENT VARIABLES CONFIGURATION

### Frontend (Vite)

```
VITE_API_URL=                                    # API base URL
VITE_ENVIRONMENT=production
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCYed...         # Google Maps
VITE_AZURE_AD_CLIENT_ID=baae0851-0c24-...     # Azure AD
VITE_AZURE_AD_TENANT_ID=0ec14b81-7b82-...
VITE_AZURE_AD_REDIRECT_URI=https://...
VITE_AZURE_MAPS_SUBSCRIPTION_KEY=              # Azure Maps fallback
VITE_ENABLE_AI_ASSISTANT=true
VITE_ENABLE_TEAMS_INTEGRATION=true
VITE_ENABLE_EMAIL_CENTER=true
VITE_ENABLE_DARK_MODE=true
VITE_APPLICATION_INSIGHTS_CONNECTION_STRING=
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=fleet-ui@1.0.0
VITE_APP_VERSION=1.0.0
VITE_BUILD_ID=local
```

### Backend

```
PORT=3000
NODE_ENV=production
DATABASE_TYPE=cosmosdb
DATABASE_CONNECTION_STRING=
AZURE_OPENAI_ENDPOINT=https://andre-m9qftqda-eastus2.cognitiveservices.azure.com/
AZURE_OPENAI_KEY=
AZURE_OPENAI_DEPLOYMENT=gpt-4.5-preview
AZURE_OPENAI_API_VERSION=2023-12-01-preview
MS_GRAPH_CLIENT_ID=c4975a78-cc67-...
MS_GRAPH_CLIENT_SECRET=
MS_GRAPH_TENANT_ID=e51580cd-366b-...
MS_GRAPH_SCOPE=https://graph.microsoft.com/.default
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER_NAME=fleet-files
JWT_SECRET=your-secret-key-minimum-32-characters...
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CSRF_SECRET=your-csrf-secret-minimum-32-characters...
CORS_ORIGIN=https://fleet.capitaltechalliance.com,...
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
APPLICATION_INSIGHTS_CONNECTION_STRING=
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=fleet-api@1.0.0
AZURE_KEY_VAULT_URI=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@fleet.com
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

---

## 6. SECURITY FEATURES

### 6.1 CSRF Protection (CRIT-F-002)
- **Token Endpoint**: `/api/v1/csrf-token` (GET)
- **Token Storage**: Memory only (NOT localStorage)
- **Token Header**: `X-CSRF-Token`
- **Protected Methods**: POST, PUT, DELETE, PATCH
- **Auto-refresh**: On 403 errors
- **Implementation File**: `src/hooks/use-api.ts`, `src/lib/api-client.ts`

### 6.2 httpOnly Cookie Security (CRIT-F-001)
- **JWT Storage**: httpOnly cookies set by backend
- **XSS Protection**: Tokens NOT accessible via JavaScript
- **Secure Flag**: HTTPS only
- **SameSite**: Strict CSRF protection

### 6.3 Authentication Security
- **JWT Validation**: Proper JWT parsing and validation
- **Token Expiration**: 15 minutes (JWT_EXPIRES_IN)
- **Refresh Tokens**: 7 days (JWT_REFRESH_EXPIRES_IN)
- **Minimum Secret Length**: 32 characters required

### 6.4 Rate Limiting
- **Window**: 900,000 ms (15 minutes)
- **Max Requests**: 500 per window

### 6.5 CORS Configuration
- **Allowed Origins**:
  - `https://fleet.capitaltechalliance.com`
  - `https://purple-river-0f465960f.3.azurestaticapps.net`
  - `http://localhost:5173` (dev)

### 6.6 Data Sanitization
- **XSS Protection**: Output escaping via context
- **URL Masking**: Sensitive data masked in telemetry
- **Header Filtering**: Authorization headers removed from logs

---

## 7. API RESPONSE MIDDLEWARE

**File**: `src/middleware/apiResponseMiddleware.ts`

All API responses use standardized structure:
```typescript
{
  success: boolean,
  data?: any,
  message: string,
  statusCode: number
}
```

---

## 8. CACHING STRATEGY

**File**: `src/middleware/cacheMiddleware.ts`

- **GET Requests**: Cached with configurable TTL
- **State-Changing Requests**: Never cached
- **Cache Key**: Based on URL and query parameters

---

## 9. KEY FEATURES & WORKFLOWS

### 9.1 Vehicle Management Workflow
1. Fetch vehicles: GET `/api/vehicles`
2. View details: GET `/api/vehicles/{id}`
3. Update telemetry: POST `/api/vehicles/{id}/telemetry`
4. Modify vehicle: PUT `/api/vehicles/{id}`

### 9.2 Maintenance Tracking Workflow
1. List schedules: GET `/api/maintenance-schedules`
2. Create work order: POST `/api/work-orders`
3. Update work order: PUT `/api/work-orders/{id}`
4. Log fuel: POST `/api/fuel-transactions`

### 9.3 Dispatch & Radio Workflow
1. Get channels: GET `/api/radio/channels`
2. List transmissions: GET `/api/radio/transmissions`
3. Execute policies: POST `/api/dispatch/policies/{id}/execute`
4. Approve/Reject: POST `/api/dispatch/policies/executions/{id}/approve`

### 9.4 AI-Assisted Workflows
1. AI Query: POST `/api/ai/query`
2. Receipt Processing: POST `/api/ai/receipt/extract`
3. AI Assistant: POST `/api/ai/assistant`

### 9.5 Communication Workflows
1. Send Teams message: POST `/api/teams/{teamId}/channels/{channelId}/messages`
2. Send email: POST `/api/outlook/send`
3. Schedule meeting: POST `/api/calendar/events`

---

## 10. TESTING CHECKLIST

- [ ] All authentication endpoints (login, logout, CSRF)
- [ ] All CRUD operations for vehicles, drivers, work orders
- [ ] Maintenance scheduling and tracking
- [ ] Fuel transaction logging
- [ ] Route planning and geofence management
- [ ] Radio dispatch policy execution
- [ ] AI services integration
- [ ] Microsoft Teams and Outlook integration
- [ ] WebSocket connectivity (OBD2, radio, dispatch)
- [ ] CSRF token generation and validation
- [ ] Rate limiting enforcement
- [ ] Error handling and telemetry
- [ ] CORS validation
- [ ] Authentication persistence
- [ ] Cache expiration
- [ ] Data sanitization and XSS prevention

---

## 11. CONFIGURATION FILES LOCATIONS

| Component | File Path |
|-----------|-----------|
| API Endpoints Registry | `/src/config/endpoints.ts` |
| Telemetry Config | `/src/config/telemetry.ts` |
| Sentry Setup | `/src/lib/sentry.ts` |
| Telemetry Service | `/src/lib/telemetry.ts` |
| Microsoft Auth | `/src/lib/microsoft-auth.ts` |
| Radio API | `/src/lib/radioApi.ts` |
| API Client | `/src/lib/api-client.ts` |
| Main API Hook | `/src/hooks/use-api.ts` |
| Environment Types | `/src/vite-end.d.ts` |
| Environment Config | `/.env` |

---

## 12. DEPLOYMENT URLS

- **Production Frontend**: `https://purple-river-0f465960f.3.azurestaticapps.net`
- **Fleet Domain**: `https://fleet.capitaltechalliance.com`
- **API Base**: Defaults to `window.location.origin`

---

## 13. KNOWN LIMITATIONS & DISABLED FEATURES

- **Application Insights (Backend)**: Disabled - SDK incompatible with React 19
- **Mock Data Mode**: Fallback available when API unavailable
- **Demo Mode**: `localStorage.setItem('demo_mode', 'true')`

---

*Audit Date: December 4, 2025*
*Total Endpoints Documented: 120+*
*External Services: 15+*
*WebSocket Channels: 4*
