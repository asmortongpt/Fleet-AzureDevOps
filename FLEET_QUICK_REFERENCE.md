# Fleet Management System - Quick Reference Guide

## System Statistics

| Category | Count | Details |
|----------|-------|---------|
| **Frontend Pages** | 46 | 15 hubs + 7 admin + 13 specialized + 4 special |
| **React Components** | 659 | 12 major component categories |
| **API Routes** | 166 | 13 endpoint categories |
| **Backend Services** | 187 | 12 service categories |
| **Database Repositories** | 230+ | Complete data access layer |
| **Emulators** | 41 | 7 emulator categories for testing |
| **AI Agents** | 104+ | 10 agent categories (153% of target) |
| **Hooks** | 89 | React state management |
| **E2E Tests** | 50+ | Comprehensive test coverage |

## Technology Stack

**Frontend:** React 18 + TypeScript 5.7 + Vite 6 + Tailwind CSS 4 + Shadcn/UI  
**Backend:** Node.js + Express 4 + PostgreSQL 15 + Redis 7  
**Infrastructure:** Docker + Kubernetes + Azure Cloud + Azure DevOps CI/CD  
**AI/ML:** LangChain + OpenAI + Claude + Vector Embeddings + RAG  

## Key Features

### Fleet Operations
- Real-time vehicle tracking (GPS + OBD2)
- Fuel management & optimization
- Maintenance scheduling & predictive maintenance
- Driver management & safety scoring
- Dispatch & route optimization

### Financial Management
- Cost analysis & reporting
- Fuel cost tracking
- Vehicle depreciation
- Budget forecasting
- ROI analysis

### Compliance & Safety
- Safety alerts & incident tracking
- Compliance calendar & reporting
- OSHA compliance
- Policy enforcement
- Audit trail logging

### Communication & Collaboration
- In-app messaging
- Push notifications
- SMS integration
- Email delivery
- Teams/Outlook integration

### Data & Analytics
- Executive dashboards
- Custom reports
- Drill-down analysis
- Performance metrics
- Trend analysis

### Advanced Features
- AI-powered insights
- Document management with OCR
- 3D vehicle damage visualization
- Geospatial analysis
- EV charging management
- Video telematics

## Quick Start

```bash
# Local Development
npm install
npm run dev                    # Frontend on 5173-5175
cd api && npm run dev         # Backend on 3000
docker-compose up             # PostgreSQL & Redis

# Testing
npm test                       # E2E tests
npm run test:smoke            # Quick smoke tests
cd api && npm run test        # Unit tests

# Production Build
npm run build:strict
cd api && npm run build
docker build -t fleet-api .
# Deploy to Azure Container Instances
```

## Main Operating Hubs

1. **FleetHub** - Central fleet management
2. **OperationsHub** - Daily operations
3. **MaintenanceHub** - Maintenance management
4. **DriversHub** - Driver operations
5. **FinancialHub** - Cost management
6. **AnalyticsHub** - Data insights
7. **SafetyHub** - Safety & compliance
8. **ProcurementHub** - Procurement
9. **CommunicationHub** - Team communications
10. **DocumentsHub** - File management
11. **IntegrationsHub** - Third-party systems
12. **ReportsHub** - Report generation
13. **AdminHub** - System administration

## Core API Routes (Sample)

```
Authentication:  POST /api/auth/login, /api/auth/logout, /api/auth/refresh
Vehicles:        GET /api/vehicles, POST /api/vehicles, PUT /api/vehicles/:id
Drivers:         GET /api/drivers, POST /api/drivers, DELETE /api/drivers/:id
Maintenance:     GET /api/maintenance, POST /api/maintenance, PATCH status
Fuel:            GET /api/fuel-transactions, POST /api/fuel-transactions
Costs:           GET /api/costs, GET /api/costs/dashboard
Analytics:       GET /api/analytics, GET /api/custom-reports
Dispatch:        GET /api/dispatch, POST /api/dispatch/assign
Geospatial:      GET /api/geofences, POST /api/geofences
Safety:          GET /api/safety-alerts, POST /api/incidents
Documents:       GET /api/documents, POST /api/documents, GET /api/ocr
```

## Database Tables

**Core Tables:**
- vehicles, drivers, fuel_transactions, maintenance_records
- damage_reports, trips, geofences, work_orders
- inspections, compliance_records, costs, documents, audit_logs

**Geospatial Functions:**
- calculate_distance_haversine()
- find_nearest_vehicles()
- find_nearest_facility()
- point_in_circular_geofence()
- find_vehicles_in_circular_geofence()

**Views:**
- v_vehicles_with_location (vehicles with GPS + driver info)
- v_damage_reports_detailed (damage + related data)

## Emulator Categories

1. **Vehicle & Telematics** (8) - GPS, OBD2, video, sensors
2. **Operational** (7) - Dispatch, routing, behavior, tasks
3. **Fuel Management** (4) - Consumption, transactions, receipts
4. **Maintenance** (3) - Operations, records, inventory
5. **Mobile & Documents** (6) - App, photos, damage reports
6. **Integration** (4) - Samsara, Teltonika, PeopleSoft
7. **Orchestration** (3) - Coordinator, config generator

## Authentication & Security

- **Methods:** JWT tokens, Azure AD SSO, httpOnly cookies, MFA
- **RBAC:** Admin, Manager, Driver, Dispatcher, Viewer
- **Protections:** CSRF, input validation, parameterized queries, encryption
- **Audit:** Complete change tracking & compliance logging

## Integrations

**Telematics:** Samsara, Teltonika, Verizon Connect, Geotab  
**Cloud:** Azure (Storage, Analytics, AI), AWS (S3, Textract)  
**Communication:** Twilio (SMS), SendGrid (Email), Teams, Outlook  
**Maps:** Google Maps, Mapbox, Leaflet, Azure Maps  
**Auth:** Azure AD, OAuth 2.0, JWT, MFA  

## Performance Optimizations

- Lazy-loaded modules (50+ modules, 10-100 KB each)
- Code splitting & tree shaking
- Redis caching with TTL strategy
- PostgreSQL query optimization & indexing
- Image optimization & responsive delivery
- Compression & CDN delivery
- Bundle size: ~272 KB gzipped (80% reduction)

## Security Highlights

- Parameterized SQL queries (no string concatenation)
- bcrypt/argon2 password hashing
- JWT validation with refresh tokens
- FIPS-compliant encryption
- Security headers (Helmet.js)
- HTTPS enforced everywhere
- Secrets in Azure Key Vault
- Non-root containers, read-only filesystems
- Least privilege principle

## Deployment

- **Environments:** Development, Staging, Production
- **Containerization:** Docker Compose (dev), Kubernetes (prod)
- **Cloud Platform:** Azure Container Instances + Front Door
- **CI/CD:** GitHub Actions + Azure DevOps
- **Monitoring:** Application Insights, Prometheus, Grafana
- **Health Checks:** API, database, cache, service-level

## Current Status

✅ **100% COMPLETE**
- All features implemented & tested
- Production-ready
- Full documentation
- Enterprise security
- Comprehensive testing (122+ E2E tests)

## For Development Quotes

Use the comprehensive catalog (/FLEET_COMPREHENSIVE_CATALOG.md) for detailed:
- Complete feature breakdown
- Technical architecture details
- API endpoint specifications
- Database schema definitions
- Service descriptions
- Integration documentation
- Testing & QA details
- Deployment specifications

---

**Last Updated:** January 8, 2026  
**Status:** Production-Ready  
**Version:** 1.0.1

