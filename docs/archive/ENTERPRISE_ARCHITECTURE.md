# Fleet Management System - Enterprise Architecture
## Production-Ready Government-Grade Application

**Customer:** Capital Transit Alliance (CTA) / StarMetro
**Classification:** Government Enterprise System
**Security Level:** FedRAMP Moderate, NIST 800-53 Compliance Required

---

## EXECUTIVE SUMMARY

This document defines the complete architectural transformation from the current prototype to a production-ready, government-grade fleet management system suitable for military-grade security requirements.

**Current State:** Development prototype with scattered components, inconsistent UI, basic authentication
**Target State:** Enterprise-grade system with Clean Architecture, USWDS design system, comprehensive security controls, and full audit compliance

---

## 1. DESIGN SYSTEM - USWDS 3.0 Based

### Why USWDS?
- **Mandatory for federal agencies** under 21st Century IDEA
- **Accessibility built-in** - WCAG 2.1 AA compliance by default
- **Consistent with government standards** - Users recognize familiar patterns
- **Professional, minimalist** - No flashy cards, clean data presentation

### Design Principles
```
1. Data density over decoration - Tables/lists, not cards
2. Minimalist color palette - Navy, gray, white (official colors)
3. High contrast for readability - 4.5:1 minimum
4. Consistent spacing - 8px grid system
5. Professional typography - Source Sans Pro (USWDS standard)
```

### Color Palette
```typescript
// src/design-system/tokens/colors.ts
export const colors = {
  // Primary - Government Blue
  primary: {
    base: '#005EA2',      // USWDS blue-60
    dark: '#1C3F94',      // USWDS blue-80
    light: '#2378C3',     // USWDS blue-50
  },

  // Semantic - Status Colors
  success: '#00A91C',     // USWDS green-cool-50
  warning: '#FFBE2E',     // USWDS gold-20
  error: '#D54309',       // USWDS red-warm-60
  info: '#2378C3',        // USWDS blue-50

  // Neutrals - High Contrast
  gray: {
    900: '#1B1B1B',       // Text primary
    700: '#565C65',       // Text secondary
    300: '#A9AEB1',       // Borders
    100: '#E6E6E6',       // Backgrounds
    50: '#F0F0F0',        // Subtle backgrounds
  },

  // Surface
  background: '#FFFFFF',
  surface: '#F0F0F0',
}
```

### Typography
```typescript
// src/design-system/tokens/typography.ts
export const typography = {
  fontFamily: {
    sans: '"Source Sans Pro", system-ui, -apple-system, sans-serif',
    mono: '"Roboto Mono", "Courier New", monospace',
  },

  // Scale (USWDS standard)
  fontSize: {
    xs: '0.8125rem',   // 13px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.375rem',    // 22px
    '2xl': '1.75rem',  // 28px
    '3xl': '2.5rem',   // 40px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
}
```

---

## 2. FOLDER STRUCTURE - Clean Architecture

### Why Clean Architecture?
- **Separation of concerns** - Business logic independent of UI
- **Testable** - Each layer can be tested in isolation
- **Maintainable** - Changes in one layer don't cascade
- **Scalable** - Easy to add features without refactoring

### Structure
```
src/
├── app/                          # Application Layer
│   ├── layout.tsx                # Root layout with providers
│   ├── routes.tsx                # Route definitions
│   └── providers/
│       ├── AuthProvider.tsx      # Authentication context
│       ├── SecurityProvider.tsx  # Security & audit context
│       └── ThemeProvider.tsx     # Design system provider
│
├── features/                     # Feature Modules (Business Logic)
│   ├── fleet/
│   │   ├── domain/              # Business entities & rules
│   │   │   ├── entities/
│   │   │   │   ├── Vehicle.ts
│   │   │   │   └── MaintenanceRecord.ts
│   │   │   ├── repositories/    # Data access interfaces
│   │   │   │   └── IVehicleRepository.ts
│   │   │   └── usecases/        # Business operations
│   │   │       ├── GetVehicleList.ts
│   │   │       └── ScheduleMaintenance.ts
│   │   │
│   │   ├── application/         # Application services
│   │   │   ├── VehicleService.ts
│   │   │   └── dto/
│   │   │       └── VehicleDTO.ts
│   │   │
│   │   ├── infrastructure/      # External integrations
│   │   │   ├── api/
│   │   │   │   └── VehicleApiClient.ts
│   │   │   └── repositories/
│   │   │       └── VehicleRepository.ts
│   │   │
│   │   └── presentation/        # UI Components
│   │       ├── pages/
│   │       │   ├── VehicleListPage.tsx
│   │       │   └── VehicleDetailPage.tsx
│   │       ├── components/
│   │       │   ├── VehicleTable.tsx
│   │       │   └── MaintenanceSchedule.tsx
│   │       └── hooks/
│   │           └── useVehicleList.ts
│   │
│   ├── maintenance/
│   ├── procurement/
│   ├── analytics/
│   └── admin/
│
├── shared/                       # Shared Utilities
│   ├── design-system/           # USWDS-based components
│   │   ├── components/
│   │   │   ├── Button.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── DataGrid.tsx
│   │   │   └── Banner.tsx
│   │   ├── tokens/
│   │   │   ├── colors.ts
│   │   │   ├── typography.ts
│   │   │   └── spacing.ts
│   │   └── hooks/
│   │       └── useBreakpoint.ts
│   │
│   ├── security/                # Security utilities
│   │   ├── audit/
│   │   │   └── AuditLogger.ts
│   │   ├── encryption/
│   │   │   └── DataEncryption.ts
│   │   └── rbac/
│   │       └── PermissionGuard.tsx
│   │
│   ├── api/                     # API layer
│   │   ├── client.ts            # Axios instance with interceptors
│   │   ├── endpoints.ts         # API endpoint definitions
│   │   └── middleware/
│   │       ├── auth.ts
│   │       ├── retry.ts
│   │       └── audit.ts
│   │
│   └── utils/
│       ├── validation.ts
│       ├── formatting.ts
│       └── date.ts
│
├── core/                        # Core Configuration
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── security.config.ts
│   │   └── feature-flags.ts
│   │
│   ├── types/
│   │   ├── api.types.ts
│   │   ├── security.types.ts
│   │   └── common.types.ts
│   │
│   └── constants/
│       ├── routes.ts
│       ├── permissions.ts
│       └── api.ts
│
└── store/                       # State Management (Zustand)
    ├── auth/
    ├── fleet/
    └── middleware/
        ├── logger.ts
        └── audit.ts
```

---

## 3. UI COMPONENT ARCHITECTURE

### Data Presentation - NO CARDS

**Current Problem:** Everything is a card. Cards waste space and look unprofessional.

**Solution:** Use appropriate components:

```typescript
// BAD - Current approach
<div className="grid grid-cols-4 gap-4">
  <StatCard title="Vehicles" value="156" />
  <StatCard title="Active" value="142" />
</div>

// GOOD - Professional approach
<Table>
  <thead>
    <tr>
      <th>Metric</th>
      <th>Current</th>
      <th>Target</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Total Vehicles</td>
      <td>156</td>
      <td>160</td>
      <td><StatusBadge status="on-track" /></td>
    </tr>
  </tbody>
</Table>
```

### Component Library (USWDS-compliant)

```typescript
// src/shared/design-system/components/Table.tsx
interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  sortable?: boolean
  filterable?: boolean
  pagination?: PaginationConfig
  onRowClick?: (row: T) => void
  striped?: boolean
  compact?: boolean
  stickyHeader?: boolean
}

// Features:
// - Keyboard navigation (arrow keys, tab)
// - Screen reader support (ARIA labels)
// - Responsive (horizontal scroll on mobile)
// - Export to CSV/Excel
// - Column resizing
// - Row selection (checkbox)
// - Inline editing
```

```typescript
// src/shared/design-system/components/DataGrid.tsx
// Advanced data grid for complex operations
// Features:
// - Virtual scrolling (handle 10,000+ rows)
// - Cell renderers
// - Aggregations
// - Filtering (multi-column)
// - Grouping
// - Pinned columns
```

```typescript
// src/shared/design-system/components/Banner.tsx
// USWDS Banner component for alerts/messages
// Variants: info, success, warning, error, emergency
```

---

## 4. SECURITY ARCHITECTURE - Military Grade

### Requirements
- **FedRAMP Moderate** controls (325 controls minimum)
- **NIST 800-53** compliance
- **Audit logging** for ALL actions
- **Encryption** at rest and in transit
- **RBAC + ABAC** for access control
- **Session management** with timeout
- **Data classification** and handling

### Implementation

#### 4.1 Audit Logging
```typescript
// src/shared/security/audit/AuditLogger.ts
interface AuditEvent {
  timestamp: string
  userId: string
  action: string          // e.g., "VEHICLE_UPDATED"
  resource: string        // e.g., "Vehicle:VEH-12345"
  before?: unknown        // State before change
  after?: unknown         // State after change
  ip: string
  userAgent: string
  sessionId: string
  result: 'SUCCESS' | 'FAILURE' | 'DENIED'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

class AuditLogger {
  async log(event: AuditEvent): Promise<void> {
    // 1. Encrypt sensitive data
    const encrypted = await this.encrypt(event)

    // 2. Write to secure audit log (append-only)
    await this.writeToAuditLog(encrypted)

    // 3. Send to SIEM (Security Information and Event Management)
    if (event.severity === 'CRITICAL') {
      await this.sendToSIEM(event)
    }

    // 4. Trigger alerts for suspicious activity
    await this.checkForAnomalies(event)
  }
}

// Usage - wrap ALL mutations
async function updateVehicle(id: string, data: VehicleUpdate) {
  const before = await getVehicle(id)

  try {
    const after = await vehicleRepo.update(id, data)

    await auditLogger.log({
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      action: 'VEHICLE_UPDATED',
      resource: `Vehicle:${id}`,
      before,
      after,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      sessionId: session.id,
      result: 'SUCCESS',
      severity: 'MEDIUM',
    })

    return after
  } catch (error) {
    await auditLogger.log({
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      action: 'VEHICLE_UPDATE_FAILED',
      resource: `Vehicle:${id}`,
      before,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      sessionId: session.id,
      result: 'FAILURE',
      severity: 'HIGH',
    })

    throw error
  }
}
```

#### 4.2 RBAC + ABAC
```typescript
// src/shared/security/rbac/permissions.ts
enum Role {
  ADMIN = 'ADMIN',
  FLEET_MANAGER = 'FLEET_MANAGER',
  MAINTENANCE_SUPERVISOR = 'MAINTENANCE_SUPERVISOR',
  MECHANIC = 'MECHANIC',
  DRIVER = 'DRIVER',
  VIEWER = 'VIEWER',
}

enum Permission {
  // Vehicle permissions
  VEHICLE_VIEW = 'vehicle:view',
  VEHICLE_CREATE = 'vehicle:create',
  VEHICLE_UPDATE = 'vehicle:update',
  VEHICLE_DELETE = 'vehicle:delete',

  // Maintenance permissions
  MAINTENANCE_VIEW = 'maintenance:view',
  MAINTENANCE_CREATE = 'maintenance:create',
  MAINTENANCE_APPROVE = 'maintenance:approve',

  // Financial permissions
  BUDGET_VIEW = 'budget:view',
  BUDGET_APPROVE = 'budget:approve',

  // Admin permissions
  USER_MANAGE = 'user:manage',
  AUDIT_VIEW = 'audit:view',
}

// Role-Permission mapping
const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission),
  [Role.FLEET_MANAGER]: [
    Permission.VEHICLE_VIEW,
    Permission.VEHICLE_CREATE,
    Permission.VEHICLE_UPDATE,
    Permission.MAINTENANCE_VIEW,
    Permission.MAINTENANCE_CREATE,
    Permission.BUDGET_VIEW,
  ],
  // ... etc
}

// Attribute-based rules
interface AccessContext {
  user: User
  resource: Resource
  action: string
  environment: Environment
}

class AccessControlService {
  async checkAccess(context: AccessContext): Promise<boolean> {
    // 1. Check RBAC
    const hasRole = this.checkRole(context.user, context.action)
    if (!hasRole) return false

    // 2. Check ABAC
    const hasAttribute = await this.checkAttributes(context)
    if (!hasAttribute) return false

    // 3. Check organizational hierarchy
    const hasOrg = this.checkOrganization(context.user, context.resource)
    if (!hasOrg) return false

    // 4. Audit the access check
    await auditLogger.log({
      timestamp: new Date().toISOString(),
      userId: context.user.id,
      action: 'ACCESS_CHECK',
      resource: context.resource.id,
      result: 'SUCCESS',
      severity: 'LOW',
    })

    return true
  }
}
```

#### 4.3 Data Encryption
```typescript
// src/shared/security/encryption/DataEncryption.ts
class DataEncryption {
  // Encryption at rest
  async encryptField(data: string, classification: DataClassification): Promise<string> {
    if (classification === 'PUBLIC') {
      return data // No encryption needed
    }

    // Use AES-256-GCM for sensitive data
    const iv = crypto.randomBytes(16)
    const key = await this.getEncryptionKey(classification)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final(),
    ])

    const authTag = cipher.getAuthTag()

    // Return: iv + authTag + encrypted data
    return Buffer.concat([iv, authTag, encrypted]).toString('base64')
  }

  // Field-level encryption for PII
  async encryptPII(user: User): Promise<EncryptedUser> {
    return {
      id: user.id,
      email: await this.encryptField(user.email, 'PII'),
      phone: await this.encryptField(user.phone, 'PII'),
      ssn: await this.encryptField(user.ssn, 'SENSITIVE'),
      // ... non-sensitive fields in plaintext
    }
  }
}
```

---

## 5. STATE MANAGEMENT - Zustand with Middleware

### Why Zustand over Redux?
- **Simpler** - Less boilerplate
- **Smaller** - Better performance
- **TypeScript-first** - Better DX
- **Middleware support** - Logging, persistence, etc.

### Implementation
```typescript
// src/store/fleet/vehicleStore.ts
interface VehicleStore {
  // State
  vehicles: Vehicle[]
  loading: boolean
  error: Error | null

  // Actions
  fetchVehicles: () => Promise<void>
  updateVehicle: (id: string, data: VehicleUpdate) => Promise<void>
  deleteVehicle: (id: string) => Promise<void>

  // Computed
  activeVehicles: () => Vehicle[]
  maintenanceCount: () => number
}

export const useVehicleStore = create<VehicleStore>()(
  // Middleware stack
  persist(
    audit(
      immer((set, get) => ({
        vehicles: [],
        loading: false,
        error: null,

        fetchVehicles: async () => {
          set({ loading: true, error: null })
          try {
            const vehicles = await vehicleService.getAll()
            set({ vehicles, loading: false })
          } catch (error) {
            set({ error: error as Error, loading: false })
          }
        },

        updateVehicle: async (id, data) => {
          // Audit middleware will log this automatically
          const updated = await vehicleService.update(id, data)
          set((state) => {
            const index = state.vehicles.findIndex(v => v.id === id)
            state.vehicles[index] = updated
          })
        },

        activeVehicles: () => {
          return get().vehicles.filter(v => v.status === 'ACTIVE')
        },

        maintenanceCount: () => {
          return get().vehicles.filter(v => v.status === 'MAINTENANCE').length
        },
      })),
    ),
    {
      name: 'vehicle-storage',
      partialize: (state) => ({ vehicles: state.vehicles }), // Only persist vehicles
    }
  )
)

// Custom audit middleware
function audit<T>(config: StateCreator<T>) {
  return (set: SetState<T>, get: GetState<T>, api: StoreApi<T>) =>
    config(
      (partial, replace) => {
        const before = get()
        set(partial, replace)
        const after = get()

        // Log state changes
        auditLogger.log({
          timestamp: new Date().toISOString(),
          userId: getCurrentUser().id,
          action: 'STATE_CHANGE',
          before,
          after,
          severity: 'LOW',
        })
      },
      get,
      api
    )
}
```

---

## 6. MIGRATION PLAN

### Phase 1: Foundation (Week 1-2)
1. **Design System Setup**
   - Install USWDS design tokens
   - Create base components (Button, Table, DataGrid)
   - Set up Tailwind with USWDS theme

2. **Security Infrastructure**
   - Implement AuditLogger
   - Set up encryption utilities
   - Configure RBAC system

3. **Project Structure**
   - Create new folder structure
   - Set up feature modules
   - Configure path aliases

### Phase 2: Core Features (Week 3-4)
1. **Fleet Module**
   - Migrate VehicleListPage to use DataGrid
   - Implement proper domain layer
   - Add audit logging to all mutations

2. **Maintenance Module**
   - Replace cards with tables
   - Implement work order workflow
   - Add approval system

### Phase 3: Advanced Features (Week 5-6)
1. **Analytics**
   - Replace dashboard cards with data tables
   - Add export functionality
   - Implement custom reporting

2. **Admin**
   - User management
   - Audit log viewer
   - System configuration

### Phase 4: Polish & Deploy (Week 7-8)
1. **Testing**
   - Unit tests (85%+ coverage)
   - Integration tests
   - E2E tests
   - Accessibility tests (Pa11y, axe)

2. **Documentation**
   - API documentation
   - User guides
   - Security documentation (for ATO)

3. **Deployment**
   - CI/CD pipeline
   - Blue-green deployment
   - Monitoring & alerting

---

## NEXT IMMEDIATE STEPS

1. Create USWDS-based Table component to replace all cards
2. Implement AuditLogger for all data mutations
3. Refactor FleetHub to use professional data presentation
4. Set up proper folder structure for one feature module (Fleet)
5. Migrate vehicle list to use DataGrid with proper controls

**Which step do you want me to start with?**
