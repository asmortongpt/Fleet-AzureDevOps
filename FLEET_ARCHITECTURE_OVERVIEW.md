# Fleet Codebase Architecture Overview

## 1. Project Structure

### Frontend/Backend Framework
- **Frontend**: React 19 + TypeScript with Vite bundler
- **Backend**: Node.js/Express.js with TypeScript
- **Package Manager**: npm with workspace configuration for monorepo
- **Build Tool**: Vite 6.3.5
- **Development Server**: Dev server running on port 5173 (frontend) and 3000 (backend)

### Directory Structure
```
Fleet/
├── src/                          # Frontend React application
│   ├── components/               # React components
│   │   ├── modules/              # Feature modules (50+ modules)
│   │   ├── common/               # Shared components
│   │   ├── ui/                   # Radix UI primitive components
│   │   ├── shared/               # Shared utilities
│   │   └── drilldown/            # Drilldown navigation system
│   ├── pages/                    # Page components (Auth, PersonalUse)
│   ├── lib/                      # Utilities and type definitions
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript type definitions
│   └── App.tsx                   # Main app entry point with routing
├── api/                          # Backend Express.js API
│   ├── src/
│   │   ├── routes/               # API endpoint definitions (60+ routes)
│   │   ├── services/             # Business logic services (50+ services)
│   │   ├── config/               # Configuration files
│   │   ├── data/                 # Mock data
│   │   ├── middleware/           # Express middleware
│   │   ├── migrations/           # Database migration SQL files
│   │   ├── jobs/                 # Scheduled jobs
│   │   ├── jobs/                 # Queue processing
│   │   └── server.ts             # Express app setup
│   └── package.json
├── e2e/                          # Playwright E2E tests
├── tests/                        # Unit and integration tests
├── deployment/                   # Deployment configurations
├── kubernetes/                   # Kubernetes manifests
└── public/                       # Static assets
```

---

## 2. Map Integration

### Supported Map Providers

1. **Leaflet (Free, Default)**
   - OpenStreetMap-based mapping
   - No API key required
   - Multiple styles: OSM, Dark, Topographic, Satellite
   - Components: `/src/components/LeafletMap.tsx`
   - File: `/home/user/Fleet/src/components/LeafletMap.tsx` (1,500+ lines)
   - Features:
     - Marker clustering for performance
     - Vehicle, facility, and camera markers
     - Full-featured production implementation
     - WCAG 2.2 AA accessibility compliance
     - React 19 compatible with proper effect cleanup

2. **Google Maps**
   - Optional alternative provider
   - Components: `/src/components/GoogleMap.tsx`
   - Requires Google Maps API key
   - Integrated via `@react-google-maps/api` package

3. **Mapbox Integration**
   - Routing and directions service
   - Geocoding and reverse geocoding
   - Traffic analysis and isochrone generation
   - Service file: `/api/src/services/mapbox.service.ts`
   - Features:
     - Route optimization with traffic considerations
     - Distance matrix calculations
     - Congestion analysis
     - Fuel consumption estimation
   - Requires MAPBOX_API_KEY environment variable

4. **ArcGIS Layers**
   - GIS layer integration and management
   - API routes: `/api/arcgis-layers`
   - Service: `/api/src/services/` (referenced in routes)
   - Supports custom GIS data sources

### Universal Map Component
- **File**: `/src/components/UniversalMap.tsx`
- **Purpose**: Abstracts map provider selection
- **Features**:
  - Provider switching (Leaflet or Google)
  - Vehicle and facility visualization
  - Traffic camera markers
  - Route display capabilities
  - Error boundaries with graceful fallback
  - Local storage-based provider persistence

---

## 3. Data Storage Pattern

### Database

**Primary Database: PostgreSQL**
- Connection: Pool-based (max 20 connections)
- Host: `fleet-postgres-service` (Kubernetes service)
- Database: `fleetdb`
- SSL support for production
- Configuration: `/api/src/config/database.ts`

### Database Schema

**Core Tables**:
- `vehicles` - Fleet vehicle management
- `drivers` - Driver information
- `work_orders` - Maintenance work orders
- `maintenance_schedules` - Preventive maintenance
- `fuel_transactions` - Fuel consumption tracking
- `routes` - Route planning and tracking
- `geofences` - Geographic boundaries
- `documents` - Document storage (see below)
- `users` - User accounts with authentication
- `facilities` - GIS facilities and depots

**Document Management Tables**:
- `documents` - Main document repository
  - File metadata, OCR status, AI classification
  - Entity linking (vehicles, drivers, maintenance)
  - Financial data (receipts/invoices)
  - Version control and soft delete support
  - 140+ columns for comprehensive metadata
  
- `document_categories` - Document type taxonomy
- `document_pages` - Multi-page document tracking
- `receipt_line_items` - OCR-extracted line items
- `document_shares` - Collaborative sharing with permissions
- `document_comments` - Annotations and comments
- `document_audit_log` - Comprehensive audit trail
- `document_processing_queue` - Async processing jobs
- `camera_capture_metadata` - Mobile camera capture EXIF data
- `ocr_corrections` - OCR training feedback

**Indexes**: Optimized with 20+ indexes for performance
**Views**: `v_documents_retention_due`, `v_recent_uploads`
**Triggers**: Auto-update of full-text search, retention dates, audit logs

### File Storage

**Current Implementation**:
- **Local Filesystem**: Default storage in `/uploads/documents/`
- **Path Structure**: `/uploads/documents/{tenantId}/{filename}`
- **Initialization**: Auto-creates tenant directories
- **Service**: `DocumentManagementService` in `/api/src/services/document-management.service.ts`

**Azure Blob Storage Integration**:
- Attachment service using Azure SDK
- Service: `/api/src/services/attachment.service.ts`
- Containers:
  - `teams-files` - Microsoft Teams uploads
  - `email-attachments` - Outlook email attachments
  - `communication-files` - Communication records
- File size limits:
  - Teams: 25MB
  - Outlook: 150MB
  - General: 100MB
- Features:
  - SAS token generation for secure access
  - Thumbnail generation (using Sharp)
  - Virus scanning preparation
  - Chunked upload for large files (4MB chunks)

### Caching & Performance
- Redis not explicitly mentioned in current setup
- SWR (Stale-While-Revalidate) for frontend caching
- React Query (@tanstack/react-query) for server state
- Debouncing and lazy loading in map components

---

## 4. UI Framework

### Component Library
- **Primary**: Radix UI (Unstyled, accessible primitives)
  - 25+ UI components (button, dialog, input, select, etc.)
  - WCAG 2.2 AA accessible
  - All located in `/src/components/ui/`

- **CSS Framework**: Tailwind CSS 4.1.11
  - Utility-first approach
  - Custom configuration in `tailwind.config.js`
  - Responsive design support
  - Dark mode support via `next-themes`

- **Icons**: 
  - Phosphor Icons (@phosphor-icons/react)
  - Heroicons (@heroicons/react)
  - Lucide Icons (lucide-react)

- **Additional Components**:
  - GitHub Spark integration for component scaffolding
  - Embla Carousel for carousels
  - Framer Motion for animations
  - React Hot Toast and Sonner for notifications
  - React Error Boundary for error handling

### Design System Tokens
- Color system via Radix UI Colors
- Responsive breakpoints via Tailwind
- Dark/Light theme support
- Custom CSS variables integration

---

## 5. Document/File Handling Capabilities

### Existing Document System

**Upload Capabilities**:
- Multi-format support: PDF, DOCX, DOC, XLS, XLSX, PNG, JPEG, GIF, TXT, CSV
- File size limits: 50MB API, with provider-specific limits
- Upload methods: Web form, mobile camera, mobile gallery, email, scanner, API
- Device metadata capture: Device type, OS, browser, location

**OCR & AI Processing**:
- OCR providers: Tesseract, Google Vision, AWS Textract, Azure Computer Vision
- OCR confidence scoring (0-1 scale)
- Multi-language support (defaults to English)
- Structured data extraction (vendor, date, amount, items)
- Per-page OCR with bounding boxes

**AI Classification**:
- Auto-detection of document type (e.g., "Gas Receipt", "Repair Invoice")
- Entity extraction: vendor, date, total amount, tax, line items
- Auto-generated tags for search
- AI summary generation
- Confidence scoring

**Search & Discovery**:
- Full-text search with PostgreSQL TSVECTOR
- Tag-based search
- Category filtering
- Date range filtering
- OCR text search
- RAG (Retrieval-Augmented Generation) powered semantic search

**Version Control**:
- Document versioning with parent/child relationships
- Version tracking and comparison
- Latest version flagging

**Access Control**:
- Share tokens with expiration
- Role-based access restrictions
- Public/private document settings
- Granular permissions (view, download, edit, delete, reshare)
- Share password protection

**Audit Trail**:
- Comprehensive action logging: Upload, View, Download, Edit, Delete, Share, Approve, Reject
- User tracking with IP and device info
- Change history (old_values, new_values)
- Timestamp for all actions

**Financial Tracking**:
- Receipt/invoice line item extraction
- Currency tracking (default USD)
- Amount fields: total, tax, subtotal
- Payment method recording
- GL account code mapping
- Cost center assignment

**Retention Policies**:
- Category-based retention (2-30 years)
- Auto-calculated retention dates
- Legal hold support
- Archival tracking

### Attachment Service Integration

**Microsoft Integration**:
- Teams file uploads/downloads via Microsoft Graph
- Outlook email attachment handling
- Adaptive Cards for Teams messages

**File Security**:
- Allowed MIME types whitelist
- Dangerous file extension blacklist
- Encryption support flag
- Virus scanning preparation (infrastructure ready)

---

## 6. API Structure

### Architecture
- **REST API** with OpenAPI/Swagger documentation
- **Base URL**: `/api` prefix for all endpoints
- **Authentication**: JWT with optional mock data mode
- **Authorization**: Role-based access control
- **Rate Limiting**: 100 requests/minute per IP
- **CORS**: Configured for specific origins
- **Body Limit**: 10MB JSON, 10MB URL-encoded

### Key API Endpoints (60+ routes)

**Documents API** (`/api/documents`):
- `POST /documents/upload` - Upload document
- `GET /documents` - List with filters
- `GET /documents/{id}` - Get document detail
- `PUT /documents/{id}` - Update metadata
- `DELETE /documents/{id}` - Soft delete
- `GET /documents/{id}/access-log` - View audit trail
- `GET /documents/categories` - List categories
- `POST /documents/categories` - Create category
- `GET /documents/statistics` - Usage analytics

**Attachments API** (`/api/attachments`):
- Multi-file upload with Azure Blob Storage
- File validation and virus scanning
- Thumbnail generation
- SAS token management

**Document Q&A** (RAG-powered):
- Semantic search across documents
- Question answering using document content
- Vector embeddings for semantic similarity

**Maps & Geolocation** (`/api/arcgis-layers`, `/api/traffic-cameras`):
- ArcGIS layer management
- Traffic camera tracking
- Geofence management

**Vehicle Management** (`/api/vehicles`):
- Vehicle CRUD operations
- GPS tracking data
- Telemetry integration
- 3D model data

**Fleet Operations** (20+ modules):
- Drivers, work orders, maintenance schedules
- Fuel transactions, routes, geofences
- Inspections, damage reports, safety incidents
- Video events, charging stations/sessions
- Purchase orders, communications, policies

**Microsoft Integration**:
- Teams integration (`/api/teams`)
- Outlook integration (`/api/outlook`)
- Calendar management (`/api/calendar`)
- Presence tracking (`/api/presence`)
- Webhooks for Teams/Outlook events

**Advanced Features**:
- AI Insights and OCR
- Route optimization (`/api/route-optimization`)
- Video telematics (`/api/video`)
- EV charging management (`/api/ev`)
- Dispatch console (`/api/dispatch`)
- Queue management (`/api/queue`)

### Documentation
- **Swagger UI**: `/api/docs`
- **OpenAPI Spec**: `/api/openapi.json`
- **Health Check**: `GET /api/health`

---

## 7. Build Tools & Package Managers

### Frontend Build
- **Bundler**: Vite 6.3.5 (Lightning-fast, ESM-first)
- **Scripts**:
  ```bash
  npm run dev       # Development server (port 5173)
  npm run build     # Production build
  npm run preview   # Preview production build
  npm run lint      # ESLint
  npm run optimize  # Vite optimization
  ```

### Backend Build
- **Build Tool**: TypeScript compiler with tsx for dev
- **Scripts**:
  ```bash
  npm run dev       # tsx watch src/server.ts
  npm run build     # tsc
  npm run start     # node dist/server.js
  npm run seed      # Database seeding
  npm run migrate   # Run migrations
  ```

### Package Management
- **npm**: Primary package manager
- **Workspaces**: Configured for monorepo support
- **npm ci**: For reproducible installs in CI/CD

### Testing Stack
- **E2E Testing**: Playwright 1.56.1
  - 122+ tests covering all modules
  - Headless and headed modes
  - UI mode for interactive testing
  - Test organization: Smoke, Main, Management, Procurement, Tools, Workflows, Validation, A11y, Performance, Security, Load
  - CI/CD integration with GitHub Actions

- **Unit Testing**: Vitest 4.0.8 with coverage
- **Component Testing**: Testing Library (@testing-library/react)
- **Accessibility Testing**: Axe-core (@axe-core/playwright)
- **Performance Testing**: Playwright Lighthouse

### Development Dependencies
- **Linting**: ESLint 9+ with React hooks plugin
- **Formatting**: Prettier
- **Type Checking**: TypeScript 5.7
- **Bundler Plugins**:
  - @tailwindcss/vite
  - @vitejs/plugin-react-swc
  - GitHub Spark vite plugin
  - Phosphor icon proxy plugin

### Production Build & Deployment
- **Containerization**: Docker with multistage builds
- **Orchestration**: Kubernetes with Azure Kubernetes Service (AKS)
- **CI/CD**: Azure Pipelines (dev, staging, prod environments)
- **Static Hosting**: Azure Static Web Apps
- **Database**: Managed PostgreSQL
- **Blob Storage**: Azure Blob Storage
- **Configuration**: Docker Compose for local dev

---

## 8. Key Technologies Summary

### Frontend Stack
| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React | 19.0.0 |
| Language | TypeScript | 5.7.2 |
| Build Tool | Vite | 6.3.5 |
| Styling | Tailwind CSS | 4.1.11 |
| UI Components | Radix UI | Latest |
| Icons | Phosphor Icons | 2.1.7 |
| State Management | TanStack React Query | 5.83.1 |
| Routing | React Router | 7.9.5 |
| Animations | Framer Motion | 12.6.2 |
| 3D Graphics | Three.js + React Three Fiber | 0.181.1 |
| Maps | Leaflet + Google Maps | 1.9.4 / 2.20.3 |
| Forms | React Hook Form | 7.54.2 |
| Validation | Zod | 3.25.76 |
| Toast Notifications | Sonner | 2.0.1 |
| Dropzone | React Dropzone | 14.3.8 |
| Charts | Recharts | 2.15.1 |

### Backend Stack
| Category | Technology | Version |
|----------|-----------|---------|
| Runtime | Node.js | Latest |
| Framework | Express.js | 4.18.2 |
| Language | TypeScript | 5.3.3 |
| Database | PostgreSQL | Latest |
| ORM | Direct SQL via pg | 8.16.3 |
| Auth | JWT | 9.0.2 |
| File Upload | Multer | 2.0.2 |
| Azure Integration | @azure/storage-blob | 12.18.0 |
| Azure Integration | @azure/cosmos | 4.0.0 |
| Microsoft Graph | @microsoft/microsoft-graph-client | 3.0.7 |
| AI | @anthropic-ai/sdk | 0.20.0 |
| LangChain | @langchain/core | 1.0.0 |
| API Docs | Swagger JSDoc | 6.2.8 |
| Logging | Winston | 3.11.0 |
| Security | Helmet | 7.1.0 |
| CORS | cors | 2.8.5 |
| Compression | sharp | 0.33.0 |
| Job Queue | pg-boss | 12.2.0 |
| Rate Limiting | express-rate-limit | 7.1.5 |
| Telemetry | OpenTelemetry | Latest |
| Email | Nodemailer | 7.0.10 |
| QR Codes | qrcode | 1.5.4 |

### DevOps & Infrastructure
| Category | Technology |
|----------|-----------|
| Containerization | Docker |
| Orchestration | Kubernetes (AKS) |
| Cloud Platform | Microsoft Azure |
| CI/CD | Azure Pipelines |
| Monitoring | Application Insights |
| Static Hosting | Azure Static Web Apps |
| DNS | Azure DNS |

---

## 9. Architecture Patterns

### Frontend Architecture
1. **Module-Based Organization**
   - 50+ feature modules in `/components/modules/`
   - Each module is self-contained with its own state/logic
   - Shared UI components in `/components/ui/`
   
2. **State Management**
   - React Query for server state
   - React Context for app-wide state (likely)
   - Local component state with hooks
   - Drilldown navigation manager for multi-level UI

3. **Error Handling**
   - Error Boundary wrapper
   - Graceful fallbacks for maps
   - Toast notifications for user feedback

4. **Performance Optimization**
   - Lazy loading of map tiles
   - Marker clustering (Leaflet)
   - Debounced searches
   - Code splitting via Vite

### Backend Architecture
1. **Service-Oriented**
   - 50+ service files handling business logic
   - Separation of concerns (routes → services → database)
   - Specialized services for document OCR, RAG, AI classification

2. **Async Processing**
   - pg-boss for queue management
   - Background jobs: maintenance scheduler, telematics sync, Teams sync, webhook renewal
   - Document processing queue for OCR and AI
   - Non-blocking uploads with async text extraction

3. **Database Design**
   - Normalized schema with proper relationships
   - Comprehensive indexing for performance
   - Triggers for automatic audit logging and full-text search
   - Views for common queries

4. **Integration Patterns**
   - Microsoft Graph API integration (Teams, Outlook)
   - Mapbox service for routing/geocoding
   - OpenAI/Anthropic for AI features
   - Azure Blob Storage for file management
   - Webhook handlers for external events

---

## 10. Deployment & Environment Configuration

### Environment Variables
- Database credentials (host, port, user, password, SSL)
- Azure credentials (storage, identity, OpenAI)
- API keys (Mapbox, Google Maps, OpenAI)
- Microsoft Graph credentials
- Application Insights key
- Node environment (development, staging, production)
- Mock data mode toggle
- CORS origins

### Configuration Files
- `.env.development.template` - Dev environment
- `.env.staging` - Staging environment
- `.env.production.template` - Production environment
- `.env.local.example` - Local development
- `.env.maps.example` - Map provider keys
- `docker-compose.yml` - Local Docker setup
- Kubernetes manifests in `/kubernetes/`

### CI/CD Pipeline
- **Trigger**: Pull requests, commits to main, manual trigger
- **Steps**:
  - Lint code (ESLint)
  - Build frontend (Vite)
  - Build backend (TypeScript)
  - Run tests (Playwright E2E, Vitest unit)
  - Generate test reports
  - Deploy to staging/production
- **Artifacts**: Build outputs, test reports, screenshots

---

## Summary for Document Storage System Implementation

The Fleet codebase has:

✅ **Existing document management** with OCR and AI classification
✅ **Database schema** designed for comprehensive document metadata
✅ **File storage** infrastructure (local + Azure Blob Storage)
✅ **API endpoints** for document operations
✅ **Frontend components** for document upload and management
✅ **RAG capabilities** for semantic document search
✅ **Authentication & authorization** patterns
✅ **Audit logging** architecture
✅ **Async processing** queue for heavy operations
✅ **Multi-file format** support

**Key Architectural Principles**:
- Modular, service-oriented backend
- React component-based frontend
- PostgreSQL for structured data
- Async processing for long-running tasks
- Microsoft Azure integration
- Production-grade error handling
- Comprehensive testing coverage
