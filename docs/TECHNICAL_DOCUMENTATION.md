# Fleet Management System - Technical Documentation

**Version**: 1.0.0
**Last Updated**: 2025-12-31
**Created By**: Agent 10

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [API Documentation](#api-documentation)
5. [Authentication & Authorization](#authentication--authorization)
6. [Database Schema](#database-schema)
7. [Deployment Guide](#deployment-guide)
8. [Development Setup](#development-setup)
9. [Testing Strategy](#testing-strategy)
10. [Performance Optimization](#performance-optimization)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Dashboard   │  │ Virtual      │  │ AI Assistant │  │
│  │              │  │ Garage 3D    │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Admin Panel  │  │ RBAC System  │  │ API Client   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   API Layer (REST)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Vehicles    │  │  Drivers     │  │  Maintenance │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PostgreSQL  │  │  Redis Cache │  │  File Storage│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Frontend:**
- User interface rendering
- State management
- API communication
- Client-side validation
- RBAC permission checking

**API Layer:**
- Request validation
- Business logic
- Database operations
- Authentication/Authorization
- Response formatting

**Data Layer:**
- Data persistence
- Caching
- File storage
- Backup/recovery

---

## Technology Stack

### Frontend

- **Framework**: React 18.2
- **Language**: TypeScript 5.x
- **Build Tool**: Vite
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **3D Graphics**: React Three Fiber + Three.js
- **State Management**: React Context + Hooks
- **HTTP Client**: Fetch API with custom wrapper
- **Routing**: React Router v6

### Backend (Reference)

- **Runtime**: Node.js 20.x
- **Database**: PostgreSQL 14+
- **Cache**: Redis 7.0
- **ORM**: Drizzle ORM
- **API**: RESTful JSON APIs

### DevOps

- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Testing**: Playwright (E2E), Vitest (Unit)
- **Deployment**: Azure Static Web Apps
- **Monitoring**: Azure Application Insights

---

## Project Structure

```
fleet-local/
├── src/
│   ├── components/
│   │   ├── admin/              # Admin-only components
│   │   │   ├── UserManagement.tsx
│   │   │   ├── SecurityCompliance.tsx
│   │   │   ├── SystemConfiguration.tsx
│   │   │   └── MonitoringDashboard.tsx
│   │   ├── ai/                 # AI Assistant components
│   │   │   └── AIAssistantChat.tsx
│   │   ├── common/             # Shared components
│   │   │   ├── DataDrilldown.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── ProtectedAction.tsx
│   │   │   └── APILoader.tsx
│   │   ├── garage/             # Virtual Garage 3D
│   │   │   ├── controls/
│   │   │   │   └── VirtualGarageControls.tsx
│   │   │   ├── environment/
│   │   │   └── Asset3DViewer.tsx
│   │   └── ui/                 # shadcn/ui components
│   │       ├── card.tsx
│   │       ├── button.tsx
│   │       ├── table.tsx
│   │       └── ...
│   ├── pages/                  # Route pages
│   │   ├── Dashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── DrilldownDemo.tsx
│   │   └── ...
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useRBAC.ts
│   │   └── useAPI.ts
│   ├── lib/                    # Core libraries
│   │   ├── api-client.ts       # HTTP client
│   │   ├── rbac.ts             # RBAC system
│   │   └── ...
│   ├── utils/                  # Utility functions
│   ├── types/                  # TypeScript types
│   └── App.tsx                 # Main app component
├── tests/
│   └── e2e/
│       └── fleet-management.spec.ts
├── docs/                       # Documentation
│   ├── USER_GUIDE.md
│   ├── TECHNICAL_DOCUMENTATION.md
│   └── API_REFERENCE.md
├── playwright.config.ts        # E2E test config
├── vite.config.ts              # Vite config
└── package.json                # Dependencies
```

---

## API Documentation

### Base URL

```
Development: http://localhost:3001/api
Production: https://api.fleet.com/api
```

### Authentication

All API requests (except /auth endpoints) require authentication via httpOnly cookies set by the backend.

**Login:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@fleet.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJ...",
  "user": {
    "id": "1",
    "email": "admin@fleet.com",
    "role": "admin"
  }
}
```

### Vehicles API

**List All Vehicles:**
```http
GET /api/vehicles?page=1&limit=20&status=active
```

**Get Vehicle by ID:**
```http
GET /api/vehicles/VEH-001
```

**Create Vehicle:**
```http
POST /api/vehicles
Content-Type: application/json

{
  "vin": "1FTFW1E50PFA12345",
  "make": "Ford",
  "model": "F-150",
  "year": 2024,
  "licensePlate": "ABC-1234",
  "vehicleType": "truck",
  "status": "active"
}
```

**Update Vehicle:**
```http
PUT /api/vehicles/VEH-001
Content-Type: application/json

{
  "mileage": 12500,
  "status": "maintenance"
}
```

**Delete Vehicle:**
```http
DELETE /api/vehicles/VEH-001
```

### Users API

**List All Users (Admin only):**
```http
GET /api/users?page=1&limit=20&role=manager
```

**Create User (Admin only):**
```http
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@fleet.com",
  "role": "operator",
  "department": "Operations"
}
```

### Reports API

**Get Fleet Summary:**
```http
GET /api/reports/fleet-summary
```

**Get Maintenance Summary:**
```http
GET /api/reports/maintenance-summary
```

**Export Data:**
```http
GET /api/reports/export/vehicles?format=csv
```

---

## Authentication & Authorization

### RBAC System

**Role Hierarchy:**
1. **Admin** - Full access (level 4)
2. **Manager** - Fleet management (level 3)
3. **Operator** - Daily operations (level 2)
4. **Viewer** - Read-only (level 1)

**Permission Matrix:**

| Permission | Admin | Manager | Operator | Viewer |
|------------|-------|---------|----------|--------|
| view_all | ✅ | ✅ | ✅ | ✅ |
| create | ✅ | ✅ | ❌ | ❌ |
| edit_all | ✅ | ✅ | ❌ | ❌ |
| edit_own | ✅ | ✅ | ✅ | ❌ |
| delete_all | ✅ | ❌ | ❌ | ❌ |
| delete_own | ✅ | ✅ | ❌ | ❌ |
| manage_users | ✅ | ❌ | ❌ | ❌ |
| manage_settings | ✅ | ❌ | ❌ | ❌ |

**Resource Access:**

| Resource | Admin | Manager | Operator | Viewer |
|----------|-------|---------|----------|--------|
| vehicles | ✅ | ✅ | ✅ | ✅ |
| drivers | ✅ | ✅ | ✅ | ❌ |
| trips | ✅ | ✅ | ✅ | ✅ |
| maintenance | ✅ | ✅ | ✅ | ❌ |
| reports | ✅ | ✅ | ✅ | ✅ |
| users | ✅ | ❌ | ❌ | ❌ |
| settings | ✅ | ❌ | ❌ | ❌ |
| analytics | ✅ | ✅ | ❌ | ❌ |

### Using RBAC in Code

**Check Permission:**
```tsx
import { useRBAC } from '@/hooks/useRBAC';

function MyComponent() {
  const rbac = useRBAC();

  if (!rbac.hasPermission('edit_all')) {
    return <AccessDenied />;
  }

  return <EditForm />;
}
```

**Protected Route:**
```tsx
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

<ProtectedRoute requiredResource="users">
  <UserManagement />
</ProtectedRoute>
```

**Protected Action:**
```tsx
import { ProtectedAction } from '@/components/common/ProtectedAction';

<ProtectedAction permission="delete_all" resource="vehicles">
  <Button onClick={handleDelete}>Delete Vehicle</Button>
</ProtectedAction>
```

---

## Database Schema

### Key Tables

**vehicles**
```sql
CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  vin VARCHAR(17) UNIQUE NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  license_plate VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  mileage INTEGER,
  fuel_level DECIMAL(5,2),
  assigned_driver_id INTEGER REFERENCES drivers(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**users**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL,
  department VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**maintenance_records**
```sql
CREATE TABLE maintenance_records (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id),
  maintenance_type VARCHAR(50) NOT NULL,
  scheduled_date TIMESTAMP,
  completed_date TIMESTAMP,
  cost DECIMAL(10,2),
  vendor VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Deployment Guide

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Azure CLI (for Azure deployment)
- Git

### Build for Production

```bash
# Install dependencies
npm install

# Run tests
npm run test

# Build production bundle
npm run build

# Preview production build
npm run preview
```

### Deploy to Azure Static Web Apps

```bash
# Login to Azure
az login

# Deploy
az staticwebapp deploy \
  --app-name fleet-management \
  --resource-group fleet-rg \
  --source-dir ./dist
```

### Environment Variables

Create `.env.production`:

```env
VITE_API_BASE_URL=https://api.fleet.com
VITE_AZURE_AD_CLIENT_ID=your-client-id
VITE_AZURE_AD_TENANT_ID=your-tenant-id
VITE_ENABLE_3D_GARAGE=true
VITE_ENABLE_AI_ASSISTANT=true
```

---

## Development Setup

### Local Development

```bash
# Clone repository
git clone https://github.com/your-org/fleet-management.git
cd fleet-management

# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:5173
```

### Running Tests

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Generate coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint TypeScript
npm run lint

# Format with Prettier
npm run format

# Type check
npm run type-check
```

---

## Testing Strategy

### Test Coverage

- **E2E Tests**: 15 tests covering all user flows
- **Unit Tests**: Component and utility tests
- **Integration Tests**: API integration tests

### Test Pyramid

```
           /\
          /  \  E2E Tests (15)
         /    \
        /------\
       / Unit   \ Unit Tests (50+)
      /  Tests   \
     /------------\
```

### Running E2E Tests

```bash
# All browsers
npm run test:e2e

# Chrome only
npm run test:e2e -- --project=chromium

# Mobile
npm run test:e2e -- --project=mobile-chrome

# Debug mode
npm run test:e2e -- --debug
```

---

## Performance Optimization

### Frontend Optimizations

- **Code Splitting**: Routes lazy-loaded
- **Tree Shaking**: Unused code eliminated
- **Asset Optimization**: Images compressed
- **Caching**: Service worker for offline support
- **CDN**: Static assets served from CDN

### Backend Optimizations

- **Database Indexing**: All foreign keys indexed
- **Redis Caching**: Frequent queries cached
- **Connection Pooling**: Database connections reused
- **Batch Requests**: Multiple API calls combined
- **Compression**: Gzip/Brotli for responses

### Monitoring

- **Application Insights**: Track errors and performance
- **Custom Metrics**: Monitor API latency
- **User Analytics**: Track feature usage
- **Alerts**: Automated alerts for errors

---

## Contributing

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Write self-documenting code
- Add JSDoc comments for complex functions

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Example:**
```
feat(vehicles): add bulk import feature

Add ability to import vehicles from CSV file.
Includes validation and error handling.

Closes #123
```

---

## Support

**Technical Issues**: dev@fleet.com
**Documentation**: https://docs.fleet.com
**GitHub**: https://github.com/your-org/fleet-management

**Generated with [Claude Code](https://claude.com/claude-code)**
