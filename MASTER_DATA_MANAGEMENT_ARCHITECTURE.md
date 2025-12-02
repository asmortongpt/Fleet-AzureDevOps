# Master Data Management (MDM) Architecture

**Date**: November 11, 2025
**Status**: 🏗️ **ARCHITECTURE DESIGN**

---

## 🎯 Executive Summary

Implementing enterprise-grade **Master Data Management (MDM)** system to centralize and govern all master data entities across the Fleet Management platform, with **plug-and-play integration** to Active Directory, Azure AD, Microsoft Graph, and other identity providers.

---

## 🏛️ MDM Core Entities

### 1. Master People (Users/Employees)
**Primary Sources**:
- Azure Active Directory
- Microsoft Graph API
- Active Directory (LDAP)
- OKTA
- Google Workspace
- Custom HR systems

**Master Attributes**:
```typescript
interface MasterPerson {
  // Core Identity
  id: string                          // Internal MDM ID
  externalIds: Record<string, string> // { "azure_ad": "uuid", "ad": "samAccountName", ... }

  // Basic Info
  firstName: string
  lastName: string
  displayName: string
  email: string
  alternateEmails: string[]
  phone: string
  mobilePhone: string

  // Employment
  employeeId: string
  department: string
  jobTitle: string
  manager: string                     // Reference to another MasterPerson
  officeLocation: string              // Reference to MasterPlace
  hireDate: Date
  employmentStatus: 'active' | 'inactive' | 'terminated' | 'onLeave'
  employmentType: 'fullTime' | 'partTime' | 'contractor' | 'temp'

  // Access & Permissions
  roles: string[]                     // Fleet management roles
  azureAdGroups: string[]
  licenses: string[]

  // Fleet-Specific
  driverId?: string
  cdlNumber?: string
  cdlClass?: string
  cdlExpiration?: Date
  assignedVehicles: string[]          // References to MasterThing (vehicles)
  homeBase: string                    // Reference to MasterPlace

  // Custom Fields (extensible)
  customFields: Record<string, any>

  // Metadata
  source: 'azure_ad' | 'ad' | 'manual' | 'import'
  sourceSystem: string
  lastSyncedAt?: Date
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}
```

### 2. Master Places (Locations/Facilities)
**Primary Sources**:
- Azure Maps
- Google Maps
- ArcGIS
- SharePoint Sites
- Custom facility databases

**Master Attributes**:
```typescript
interface MasterPlace {
  // Core Identity
  id: string
  externalIds: Record<string, string>

  // Basic Info
  name: string
  type: 'office' | 'warehouse' | 'garage' | 'fuel_station' | 'charging_station' | 'customer_site' | 'other'

  // Location
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  coordinates: {
    latitude: number
    longitude: number
  }

  // Contact
  phone: string
  email: string
  website?: string

  // Operational
  operatingHours?: {
    monday: { open: string; close: string; isClosed: boolean }
    tuesday: { open: string; close: string; isClosed: boolean }
    // ... other days
  }
  capacity?: number
  amenities: string[]

  // Fleet-Specific
  isMaintenanceFacility: boolean
  isFuelStation: boolean
  isChargingStation: boolean
  isHomeBase: boolean
  assignedVehicles: string[]          // References to MasterThing
  manager: string                     // Reference to MasterPerson

  // Geofence
  geofenceRadius?: number             // meters
  geofencePolygon?: {
    lat: number
    lon: number
  }[]

  // Custom Fields
  customFields: Record<string, any>

  // Metadata
  source: string
  lastSyncedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### 3. Master Things (Assets/Vehicles)
**Primary Sources**:
- Fleet management system
- Telematics providers (Geotab, Verizon Connect, Samsara)
- OEM systems (Ford, GM, Tesla APIs)
- Asset tracking systems

**Master Attributes**:
```typescript
interface MasterThing {
  // Core Identity
  id: string
  externalIds: Record<string, string>

  // Basic Info
  name: string
  type: 'vehicle' | 'equipment' | 'tool' | 'device' | 'other'
  category: string                    // 'sedan', 'truck', 'van', etc.

  // Vehicle Specific
  vin?: string
  make: string
  model: string
  year: number
  color: string
  licensePlate: string
  registrationState: string
  registrationExpiration?: Date

  // Ownership
  ownershipType: 'owned' | 'leased' | 'rental'
  owner?: string                      // Company/department

  // Assignment
  assignedTo?: string                 // Reference to MasterPerson
  homeBase?: string                   // Reference to MasterPlace
  currentLocation?: {
    placeId?: string                  // Reference to MasterPlace
    latitude: number
    longitude: number
    timestamp: Date
  }

  // Operational
  status: 'active' | 'maintenance' | 'retired' | 'sold'
  mileage: number
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'cng'
  isElectric: boolean
  batteryCapacity?: number            // kWh for EVs

  // Telematics
  telematicsProviderId?: string
  telematicsDeviceId?: string
  hasGPS: boolean
  hasOBD2: boolean
  hasDashcam: boolean

  // Maintenance
  lastServiceDate?: Date
  nextServiceDate?: Date
  warrantyExpiration?: Date

  // Financial
  purchaseDate?: Date
  purchasePrice?: number
  currentValue?: number

  // Custom Fields
  customFields: Record<string, any>

  // Metadata
  source: string
  lastSyncedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

---

## 🔌 Integration Architecture

### Data Source Connectors

```typescript
interface DataSourceConnector {
  id: string
  name: string
  type: 'azure_ad' | 'microsoft_graph' | 'active_directory' | 'okta' | 'google_workspace' | 'custom'
  enabled: boolean

  // Configuration
  config: {
    // Azure AD / Microsoft Graph
    tenantId?: string
    clientId?: string
    clientSecret?: string
    scopes?: string[]

    // Active Directory (LDAP)
    ldapUrl?: string
    baseDn?: string
    bindDn?: string
    bindPassword?: string

    // Custom
    apiUrl?: string
    apiKey?: string
    customHeaders?: Record<string, string>
  }

  // Sync Settings
  syncSettings: {
    autoSync: boolean
    syncIntervalMinutes: number
    lastSyncAt?: Date
    nextSyncAt?: Date
  }

  // Field Mapping
  fieldMapping: {
    sourceField: string
    targetField: string
    transformation?: 'lowercase' | 'uppercase' | 'trim' | 'custom'
    customTransform?: string  // JavaScript function as string
  }[]

  // Filters
  filters: {
    includeGroups?: string[]
    excludeGroups?: string[]
    includeOUs?: string[]
    customFilter?: string
  }
}
```

### Microsoft Graph Integration

```typescript
// api/src/services/integrations/MicrosoftGraphService.ts
import { Client } from '@microsoft/microsoft-graph-client'
import { ClientSecretCredential } from '@azure/identity'

export class MicrosoftGraphService {
  private client: Client

  constructor(tenantId: string, clientId: string, clientSecret: string) {
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret)

    this.client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken('https://graph.microsoft.com/.default')
          return token.token
        }
      }
    })
  }

  /**
   * Sync users from Azure AD
   */
  async syncUsers(filters?: { groups?: string[] }): Promise<MasterPerson[]> {
    let query = this.client.api('/users').select([
      'id',
      'displayName',
      'givenName',
      'surname',
      'mail',
      'userPrincipalName',
      'jobTitle',
      'department',
      'officeLocation',
      'businessPhones',
      'mobilePhone',
      'employeeId',
      'accountEnabled'
    ])

    if (filters?.groups) {
      // Filter by group membership
      query = query.filter(`memberOf/any(g:${filters.groups.map(g => `g/id eq '${g}'`).join(' or ')})`)
    }

    const users = await query.get()

    return users.value.map(user => this.mapAzureUserToMasterPerson(user))
  }

  /**
   * Get user's manager
   */
  async getUserManager(userId: string): Promise<MasterPerson | null> {
    try {
      const manager = await this.client.api(`/users/${userId}/manager`).get()
      return this.mapAzureUserToMasterPerson(manager)
    } catch (error) {
      return null
    }
  }

  /**
   * Get user's direct reports
   */
  async getUserDirectReports(userId: string): Promise<MasterPerson[]> {
    const reports = await this.client.api(`/users/${userId}/directReports`).get()
    return reports.value.map(user => this.mapAzureUserToMasterPerson(user))
  }

  /**
   * Get user's group memberships
   */
  async getUserGroups(userId: string): Promise<string[]> {
    const groups = await this.client.api(`/users/${userId}/memberOf`).get()
    return groups.value.map(group => group.displayName)
  }

  /**
   * Map Azure AD user to MasterPerson
   */
  private mapAzureUserToMasterPerson(azureUser: any): MasterPerson {
    return {
      id: `azure_${azureUser.id}`,
      externalIds: {
        azure_ad: azureUser.id,
        upn: azureUser.userPrincipalName
      },
      firstName: azureUser.givenName,
      lastName: azureUser.surname,
      displayName: azureUser.displayName,
      email: azureUser.mail || azureUser.userPrincipalName,
      alternateEmails: [],
      phone: azureUser.businessPhones?.[0] || '',
      mobilePhone: azureUser.mobilePhone || '',
      employeeId: azureUser.employeeId || '',
      department: azureUser.department || '',
      jobTitle: azureUser.jobTitle || '',
      manager: '', // Fetch separately
      officeLocation: azureUser.officeLocation || '',
      hireDate: new Date(), // Not available in Azure AD
      employmentStatus: azureUser.accountEnabled ? 'active' : 'inactive',
      employmentType: 'fullTime',
      roles: [],
      azureAdGroups: [],
      licenses: [],
      assignedVehicles: [],
      homeBase: '',
      customFields: {},
      source: 'azure_ad',
      sourceSystem: 'Microsoft Graph',
      lastSyncedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      updatedBy: 'system'
    }
  }
}
```

---

## 🗄️ Database Schema

### Master Data Tables

```sql
-- Master People
CREATE TABLE mdm_people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_ids JSONB NOT NULL DEFAULT '{}',

  -- Basic Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  alternate_emails TEXT[],
  phone VARCHAR(50),
  mobile_phone VARCHAR(50),

  -- Employment
  employee_id VARCHAR(50),
  department VARCHAR(100),
  job_title VARCHAR(100),
  manager_id UUID REFERENCES mdm_people(id),
  office_location_id UUID REFERENCES mdm_places(id),
  hire_date DATE,
  employment_status VARCHAR(20) CHECK (employment_status IN ('active', 'inactive', 'terminated', 'onLeave')),
  employment_type VARCHAR(20) CHECK (employment_type IN ('fullTime', 'partTime', 'contractor', 'temp')),

  -- Access
  roles TEXT[],
  azure_ad_groups TEXT[],
  licenses TEXT[],

  -- Fleet-Specific
  driver_id VARCHAR(50),
  cdl_number VARCHAR(50),
  cdl_class VARCHAR(10),
  cdl_expiration DATE,
  home_base_id UUID REFERENCES mdm_places(id),

  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',

  -- Metadata
  source VARCHAR(50) NOT NULL,
  source_system VARCHAR(100),
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100),

  -- Indexes
  CONSTRAINT unique_external_id_per_source UNIQUE (source, (external_ids->>'azure_ad'))
);

CREATE INDEX idx_mdm_people_email ON mdm_people(email);
CREATE INDEX idx_mdm_people_employee_id ON mdm_people(employee_id);
CREATE INDEX idx_mdm_people_external_ids ON mdm_people USING GIN (external_ids);
CREATE INDEX idx_mdm_people_department ON mdm_people(department);
CREATE INDEX idx_mdm_people_manager ON mdm_people(manager_id);

-- Master Places
CREATE TABLE mdm_places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_ids JSONB NOT NULL DEFAULT '{}',

  -- Basic Info
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('office', 'warehouse', 'garage', 'fuel_station', 'charging_station', 'customer_site', 'other')),

  -- Location
  address_street VARCHAR(200),
  address_city VARCHAR(100),
  address_state VARCHAR(50),
  address_zip_code VARCHAR(20),
  address_country VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Contact
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(500),

  -- Operational
  operating_hours JSONB,
  capacity INTEGER,
  amenities TEXT[],

  -- Fleet-Specific
  is_maintenance_facility BOOLEAN DEFAULT FALSE,
  is_fuel_station BOOLEAN DEFAULT FALSE,
  is_charging_station BOOLEAN DEFAULT FALSE,
  is_home_base BOOLEAN DEFAULT FALSE,
  manager_id UUID REFERENCES mdm_people(id),

  -- Geofence
  geofence_radius INTEGER,
  geofence_polygon JSONB,

  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',

  -- Metadata
  source VARCHAR(50) NOT NULL,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mdm_places_coordinates ON mdm_places(latitude, longitude);
CREATE INDEX idx_mdm_places_type ON mdm_places(type);

-- Master Things (Assets/Vehicles)
CREATE TABLE mdm_things (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_ids JSONB NOT NULL DEFAULT '{}',

  -- Basic Info
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('vehicle', 'equipment', 'tool', 'device', 'other')),
  category VARCHAR(50),

  -- Vehicle Specific
  vin VARCHAR(17) UNIQUE,
  make VARCHAR(50),
  model VARCHAR(100),
  year INTEGER,
  color VARCHAR(50),
  license_plate VARCHAR(20),
  registration_state VARCHAR(2),
  registration_expiration DATE,

  -- Ownership
  ownership_type VARCHAR(20) CHECK (ownership_type IN ('owned', 'leased', 'rental')),
  owner VARCHAR(100),

  -- Assignment
  assigned_to_id UUID REFERENCES mdm_people(id),
  home_base_id UUID REFERENCES mdm_places(id),
  current_location JSONB,

  -- Operational
  status VARCHAR(20) CHECK (status IN ('active', 'maintenance', 'retired', 'sold')),
  mileage INTEGER,
  fuel_type VARCHAR(20) CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid', 'cng')),
  is_electric BOOLEAN DEFAULT FALSE,
  battery_capacity DECIMAL(10, 2),

  -- Telematics
  telematics_provider_id VARCHAR(100),
  telematics_device_id VARCHAR(100),
  has_gps BOOLEAN DEFAULT FALSE,
  has_obd2 BOOLEAN DEFAULT FALSE,
  has_dashcam BOOLEAN DEFAULT FALSE,

  -- Maintenance
  last_service_date DATE,
  next_service_date DATE,
  warranty_expiration DATE,

  -- Financial
  purchase_date DATE,
  purchase_price DECIMAL(15, 2),
  current_value DECIMAL(15, 2),

  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',

  -- Metadata
  source VARCHAR(50) NOT NULL,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mdm_things_vin ON mdm_things(vin);
CREATE INDEX idx_mdm_things_assigned_to ON mdm_things(assigned_to_id);
CREATE INDEX idx_mdm_things_type ON mdm_things(type);

-- Data Source Connectors
CREATE TABLE mdm_data_source_connectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('azure_ad', 'microsoft_graph', 'active_directory', 'okta', 'google_workspace', 'custom')),
  enabled BOOLEAN DEFAULT TRUE,

  -- Configuration (encrypted)
  config JSONB NOT NULL,

  -- Sync Settings
  auto_sync BOOLEAN DEFAULT FALSE,
  sync_interval_minutes INTEGER DEFAULT 60,
  last_sync_at TIMESTAMP,
  next_sync_at TIMESTAMP,

  -- Field Mapping
  field_mapping JSONB DEFAULT '[]',

  -- Filters
  filters JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

-- Relationship Tables
CREATE TABLE mdm_people_vehicles (
  person_id UUID REFERENCES mdm_people(id) ON DELETE CASCADE,
  thing_id UUID REFERENCES mdm_things(id) ON DELETE CASCADE,
  assignment_type VARCHAR(20) CHECK (assignment_type IN ('primary', 'backup', 'pool')),
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by VARCHAR(100),
  PRIMARY KEY (person_id, thing_id)
);
```

---

## 🔄 Sync Process

### Automatic Sync Flow

```typescript
// api/src/services/mdm/MDMSyncService.ts
export class MDMSyncService {
  /**
   * Execute sync for all enabled connectors
   */
  async syncAll(): Promise<SyncResult[]> {
    const connectors = await this.getEnabledConnectors()
    const results: SyncResult[] = []

    for (const connector of connectors) {
      try {
        const result = await this.syncConnector(connector)
        results.push(result)

        // Update last sync time
        await this.updateConnectorLastSync(connector.id)
      } catch (error) {
        results.push({
          connectorId: connector.id,
          success: false,
          error: error.message,
          recordsProcessed: 0
        })
      }
    }

    return results
  }

  /**
   * Sync a specific connector
   */
  private async syncConnector(connector: DataSourceConnector): Promise<SyncResult> {
    switch (connector.type) {
      case 'azure_ad':
      case 'microsoft_graph':
        return await this.syncMicrosoftGraph(connector)

      case 'active_directory':
        return await this.syncActiveDirectory(connector)

      case 'okta':
        return await this.syncOkta(connector)

      default:
        throw new Error(`Unsupported connector type: ${connector.type}`)
    }
  }

  /**
   * Sync from Microsoft Graph
   */
  private async syncMicrosoftGraph(connector: DataSourceConnector): Promise<SyncResult> {
    const graphService = new MicrosoftGraphService(
      connector.config.tenantId,
      connector.config.clientId,
      connector.config.clientSecret
    )

    const users = await graphService.syncUsers(connector.filters)

    let created = 0
    let updated = 0
    let errors = 0

    for (const user of users) {
      try {
        const exists = await this.checkIfPersonExists(user.externalIds.azure_ad)

        if (exists) {
          await this.updatePerson(user)
          updated++
        } else {
          await this.createPerson(user)
          created++
        }
      } catch (error) {
        errors++
      }
    }

    return {
      connectorId: connector.id,
      success: true,
      recordsProcessed: users.length,
      created,
      updated,
      errors
    }
  }
}
```

---

## 🎨 UI Components

### MDM Configuration Panel

**Location**: `src/components/modules/MasterDataManagement.tsx`

**Features**:
- Configure data source connectors
- Map fields from source to MDM
- Set up sync schedules
- View sync history and logs
- Manual sync trigger
- Data quality dashboard

### Enhanced People Management

**Location**: `src/components/modules/PeopleManagement.tsx`

**Enhancements**:
- Azure AD sync button
- Show sync status and last sync time
- Display source system badge
- View external IDs
- Organizational hierarchy view
- Advanced filtering by department, manager, etc.
- Bulk import/export

---

## 📊 Benefits

1. **Single Source of Truth**: All master data centralized
2. **Automated Sync**: Always up-to-date with identity providers
3. **Plug-and-Play**: Easy to add new data sources
4. **Extensible**: Custom fields support any data
5. **Audit Trail**: Track all changes and sync history
6. **Relationship Management**: Connect people, places, and things
7. **Data Quality**: Validation and deduplication
8. **Enterprise-Ready**: Supports AD, Azure AD, OKTA, etc.

---

## 🚀 Implementation Plan

1. ✅ Design MDM architecture (this document)
2. 🔄 Create database migrations
3. 🔄 Implement Microsoft Graph service
4. 🔄 Implement MDM sync service
5. 🔄 Create MDM UI components
6. 🔄 Enhance People Management with AD integration
7. 🔄 Add Places and Things MDM
8. 🔄 Deploy to production

---

**Last Updated**: November 11, 2025, 5:15 AM EST
🤖 Generated with Claude Code
