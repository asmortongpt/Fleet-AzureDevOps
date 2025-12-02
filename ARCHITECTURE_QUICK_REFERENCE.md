# Fleet Architecture - Quick Reference

## Technology Stack at a Glance

### Frontend
```
React 19 + TypeScript + Vite 6
├── UI: Radix UI + Tailwind CSS 4
├── State: React Query + Context
├── Maps: Leaflet/Google Maps
├── 3D: Three.js + React Three Fiber
├── Forms: React Hook Form + Zod
├── Testing: Playwright + Vitest
└── Icons: Phosphor, Heroicons, Lucide
```

### Backend
```
Node.js + Express + TypeScript
├── Database: PostgreSQL (pool-based)
├── File Storage: Local FS + Azure Blob
├── Auth: JWT
├── Queue: pg-boss
├── AI/ML: Anthropic, OpenAI, LangChain
├── Cloud: Azure (Storage, Cosmos, Identity)
├── Logging: Winston
└── Testing: Vitest + Supertest
```

### DevOps
```
Docker → Kubernetes (AKS) → Azure Pipelines
├── Container Registry: Azure ACR
├── Static Hosting: Azure Static Web Apps
├── Database: Managed PostgreSQL
└── Monitoring: Application Insights
```

---

## Project Structure Quick Map

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `/src` | Frontend React app | App.tsx, main.tsx, pages/, components/ |
| `/src/components` | React components | modules/, ui/, shared/, common/ |
| `/src/components/modules` | Feature modules (50+) | DocumentManagement.tsx, FleetDashboard.tsx |
| `/src/lib` | Utilities & types | types.ts, api-client.ts, navigation.tsx |
| `/api/src` | Backend Express app | server.ts, routes/, services/ |
| `/api/src/routes` | API endpoints (60+) | documents.routes.ts, vehicles.ts |
| `/api/src/services` | Business logic (50+) | document-management.service.ts, mapbox.service.ts |
| `/api/src/migrations` | Database migrations | 023_document_management_ocr.sql |
| `/e2e` | E2E tests (122+) | 00-smoke/, 01-main-modules/ |
| `/deployment` | Deploy configs | Docker, k8s manifests |

---

## Document System - File Locations

### Backend
| File | Purpose |
|------|---------|
| `/api/src/services/document-management.service.ts` | Core document service (upload, process, query) |
| `/api/src/services/attachment.service.ts` | Azure Blob Storage integration |
| `/api/src/services/document-rag.service.ts` | RAG/semantic search |
| `/api/src/routes/documents.routes.ts` | Document API endpoints |
| `/api/src/routes/documents.ts` | Additional document routes |
| `/api/src/routes/attachments.routes.ts` | Attachment endpoints |
| `/api/src/migrations/023_document_management_ocr.sql` | Database schema (14 tables, 140+ columns) |

### Frontend
| File | Purpose |
|------|---------|
| `/src/components/modules/DocumentManagement.tsx` | Document management UI |
| `/src/components/modules/DocumentQA.tsx` | RAG Q&A interface |
| `/src/lib/api-client.ts` | Document API calls |

### Configuration
| File | Purpose |
|------|---------|
| `/api/src/config/database.ts` | Database pool configuration |
| `.env.staging` | Staging environment variables |
| `.env.production.template` | Production configuration template |

---

## Map Integration - Quick Guide

### Map Providers
| Provider | Type | Key File | API Key | Best Use |
|----------|------|----------|---------|----------|
| **Leaflet** | Free, OSM | LeafletMap.tsx | None | Default, no costs |
| **Google Maps** | Paid | GoogleMap.tsx | Required | Advanced features |
| **Mapbox** | Paid | mapbox.service.ts | Required | Routing, traffic |
| **ArcGIS** | Enterprise | arcgis-layers API | Optional | GIS integration |

### Key Components
- **UniversalMap.tsx** - Provider abstraction layer
- **LeafletMap.tsx** (1,500+ lines) - Full-featured Leaflet implementation
- **GoogleMap.tsx** - Google Maps wrapper
- **MapboxService** - Routing, geocoding, traffic

---

## Database Schema Overview

### Main Tables (10)
```
vehicles ─┐
drivers  ─┤
facilities├─ documents ─┬─ document_categories
users    ─┤             ├─ document_pages
work_orders┘            ├─ receipt_line_items
                        ├─ document_shares
                        ├─ document_comments
                        ├─ document_audit_log
                        ├─ document_processing_queue
                        ├─ camera_capture_metadata
                        └─ ocr_corrections
```

### Document Table Features
- **140+ columns** for comprehensive metadata
- **21 indexes** for performance
- **Triggers** for automatic audit logging
- **Views** for common queries (retention, recent uploads)

---

## API Endpoints - Document System

### Core Operations
```
POST   /api/documents/upload              Upload document
GET    /api/documents                     List documents
GET    /api/documents/{id}                Get detail
PUT    /api/documents/{id}                Update
DELETE /api/documents/{id}                Soft delete
```

### Administrative
```
GET    /api/documents/categories          List categories
POST   /api/documents/categories          Create category
GET    /api/documents/{id}/access-log     View audit
GET    /api/documents/statistics          Usage stats
```

### Advanced
```
POST   /api/documents/search              Semantic search
POST   /api/documents/ask                 RAG Q&A
POST   /api/attachments/upload            Multi-file upload
GET    /api/attachments/{id}              Get attachment
```

---

## Authentication & Security

### JWT Flow
```
Login → Generate JWT → Include in headers → Validate on each request
         ↓
    Set req.user = { id, email, role, tenant_id }
```

### Authorization Patterns
- **Tenant Isolation**: All queries filtered by tenant_id
- **Role-Based**: access_restricted_to_roles array
- **Document Sharing**: Granular permissions (view, edit, delete, share)
- **API Rate Limiting**: 100 requests/minute per IP

### File Security
- MIME type whitelist
- Dangerous extension blacklist
- Encryption flag support
- SAS token generation (Azure)

---

## Development Workflow

### Frontend
```bash
npm run dev          # Start dev server (port 5173)
npm run build        # Production build
npm run lint         # ESLint check
npm run test         # Playwright E2E tests
npm run test:ui      # Interactive test UI
```

### Backend
```bash
npm run dev          # Start dev server (port 3000) with tsx watch
npm run build        # TypeScript compilation
npm run start        # Run compiled code
npm run seed         # Populate test data
npm run migrate      # Run database migrations
```

### Full Stack
```bash
docker-compose up    # Local dev with database
npm run test:all     # All tests
```

---

## Environment Variables

### Essential for Local Development
```bash
# Database
DB_HOST=fleet-postgres-service
DB_PORT=5432
DB_NAME=fleetdb
DB_USER=fleetadmin
DB_PASSWORD=<secure>

# Authentication
JWT_SECRET=<random>

# File Storage
DOCUMENT_UPLOAD_DIR=/uploads/documents
AZURE_STORAGE_CONNECTION_STRING=<if using Azure>

# Maps
MAPBOX_API_KEY=<optional>
GOOGLE_MAPS_API_KEY=<optional>

# AI Services
OPENAI_API_KEY=<for summaries>
ANTHROPIC_API_KEY=<alternative>

# Microsoft Integration
MICROSOFT_CLIENT_ID=<Teams/Outlook>
MICROSOFT_CLIENT_SECRET=<>

# Deployment
NODE_ENV=development|staging|production
```

---

## Performance Optimization Checklist

### Database
- [x] 21 indexes on documents and related tables
- [x] Full-text search (TSVECTOR)
- [x] Pagination in queries
- [x] Connection pooling (max 20)

### Frontend
- [x] Marker clustering (Leaflet)
- [x] Lazy loading of map tiles
- [x] Code splitting via Vite
- [x] React Query caching
- [x] Debounced searches

### File Storage
- [x] Chunked uploads (4MB chunks)
- [x] Thumbnail generation and caching
- [x] Gzip compression (text)
- [x] CDN delivery (static assets)

---

## Testing Coverage

### E2E Tests (122+)
- Smoke tests (critical paths)
- Main modules (vehicles, drivers, etc.)
- Management modules (maintenance, fuel, etc.)
- Accessibility (WCAG 2.2 AA)
- Performance (Lighthouse)
- Security (OWASP)
- Load testing

### Unit Tests
- Service logic
- Component rendering
- Utility functions
- API client

### Test Execution
```bash
npm test              # All E2E tests
npm run test:smoke    # Quick smoke tests
npm run test:ui       # Interactive UI
npm run test:headed   # See browser
npm run test:report   # View results
```

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Azure Blob Storage connected (if using)
- [ ] All services health check passing
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Logging aggregated (Application Insights)
- [ ] Backup strategy in place
- [ ] Disaster recovery tested

---

## Key Statistics

| Metric | Value |
|--------|-------|
| Frontend Components | 50+ modules |
| Backend Services | 50+ services |
| API Routes | 60+ endpoints |
| Database Tables | 100+ tables |
| Document Schema Columns | 140+ |
| Database Indexes | 21 (documents only) |
| E2E Test Cases | 122+ |
| UI Components | 25+ (Radix) |
| Icon Styles | 3 sets |
| TypeScript Files | 200+ |
| Supported File Formats | 15+ |
| Max Upload Size | 50MB API |
| Document Categories | 10+ predefined |

---

## Common Tasks

### Add New Document Category
```sql
INSERT INTO document_categories (category_name, description, retention_years)
VALUES ('New Category', 'Description', 7);
```

### Upload Document (API)
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@document.pdf" \
  -F "categoryId=1" \
  -F "tags=tag1,tag2" \
  -F "description=Test document"
```

### Query Documents by Category
```sql
SELECT d.* FROM documents d
WHERE d.document_category_id = 1
  AND d.status = 'Active'
ORDER BY d.created_at DESC;
```

### Enable OCR for Document Type
```sql
UPDATE document_categories
SET ocr_enabled = TRUE
WHERE category_name = 'Receipts';
```

---

## Troubleshooting Quick Links

### Database Connection Issues
- Check `/api/src/config/database.ts`
- Verify Kubernetes service name: `fleet-postgres-service`
- Confirm `fleetdb` database exists

### File Upload Failures
- Check `DOCUMENT_UPLOAD_DIR` permissions
- Verify Azure connection string (if using Blob)
- Check disk space availability

### OCR Processing
- Verify OCR provider credentials
- Check `document_processing_queue` table status
- Review `ocr_status` field in documents table

### Map Display Issues
- Verify Leaflet CSS loaded (browser console)
- Check map provider selection in localStorage
- Review Mapbox API key (if using Mapbox)

---

## Additional Resources

### Documentation
- Full Architecture: `FLEET_ARCHITECTURE_OVERVIEW.md`
- Implementation Guide: `DOCUMENT_STORAGE_IMPLEMENTATION_GUIDE.md`
- API Docs: `http://localhost:3000/api/docs`
- OpenAPI Spec: `http://localhost:3000/api/openapi.json`

### Repository Files
- Main README: `/README.md`
- Package Details: `/package.json`, `/api/package.json`
- Docker Setup: `docker-compose.yml`, `/Dockerfile`
- Kubernetes: `/kubernetes/`
- Tests: `/e2e/`, `/tests/`

---

## Contact & Support

**Architecture Author**: Fleet Development Team
**Last Updated**: November 16, 2025
**Repository**: https://github.com/asmortongpt/Fleet
**Branch**: claude/document-storage-ocr-ai

For detailed information, see the full architecture documentation files in the repository root.
