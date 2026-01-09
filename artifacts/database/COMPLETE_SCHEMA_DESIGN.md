# Complete Database Schema Design for Fleet Management System
**Generated:** 2026-01-08
**Status:** Gap Analysis & Required Tables

## Executive Summary

The current database schema has **29 tables** covering basic fleet operations. However, the application codebase reveals requirements for approximately **85-100 additional tables** to support all implemented features.

### Current Schema (29 Tables)
- Core Fleet Operations: 8 tables
- 3D Models & Auth: 3 tables
- Policy Management: 7 tables
- SOPs & Training: 9 tables
- Workflow Automation: 3 tables

### Missing Schema (85+ Tables Required)
Organized by functional domain below.

---

## 1. TELEMATICS & GPS TRACKING (12 Tables Missing)

### vehicleLocations
**Purpose:** Real-time and historical GPS tracking
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL REFERENCES tenants(id)
- vehicle_id: uuid NOT NULL REFERENCES vehicles(id)
- latitude: decimal(10, 8) NOT NULL
- longitude: decimal(11, 8) NOT NULL
- altitude: decimal(8, 2)
- speed: decimal(6, 2)  -- km/h
- heading: decimal(5, 2)  -- degrees 0-360
- accuracy: decimal(6, 2)  -- meters
- source: varchar(50)  -- 'geotab', 'samsara', 'obd', 'manual'
- recorded_at: timestamptz NOT NULL
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (vehicle_id, recorded_at DESC)
- (tenant_id, recorded_at DESC)
- GIST (ll_to_earth(latitude, longitude))  -- Geospatial
```

### obdTelemetry
**Purpose:** Real-time OBD-II vehicle diagnostics
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- vehicle_id: uuid NOT NULL REFERENCES vehicles(id)
- rpm: integer
- speed: integer  -- km/h
- engine_load: decimal(5, 2)  -- percentage
- coolant_temp: integer  -- celsius
- fuel_level: decimal(5, 2)  -- percentage
- throttle_position: decimal(5, 2)
- intake_air_temp: integer
- maf_rate: decimal(8, 2)  -- Mass Air Flow g/s
- battery_voltage: decimal(4, 2)
- fuel_pressure: decimal(6, 2)
- dtc_codes: text[]  -- Diagnostic Trouble Codes
- odometer: integer
- recorded_at: timestamptz NOT NULL
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (vehicle_id, recorded_at DESC)
- (tenant_id, recorded_at DESC)
```

### geofences
**Purpose:** Geographic boundary definitions
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- name: varchar(255) NOT NULL
- description: text
- type: varchar(20) NOT NULL  -- 'circle', 'polygon', 'rectangle'
- center_lat: decimal(10, 8)  -- For circles
- center_lng: decimal(11, 8)
- radius_meters: integer  -- For circles
- coordinates: jsonb  -- GeoJSON for polygons
- color: varchar(7)  -- Hex color
- is_active: boolean DEFAULT true
- alert_on_entry: boolean DEFAULT false
- alert_on_exit: boolean DEFAULT false
- alert_on_dwell: boolean DEFAULT false
- dwell_minutes: integer
- metadata: jsonb
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, is_active)
```

### geofenceEvents
**Purpose:** Vehicle geofence entry/exit logging
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- geofence_id: uuid NOT NULL REFERENCES geofences(id)
- vehicle_id: uuid NOT NULL REFERENCES vehicles(id)
- driver_id: uuid REFERENCES drivers(id)
- event_type: varchar(20) NOT NULL  -- 'entry', 'exit', 'dwell'
- latitude: decimal(10, 8)
- longitude: decimal(11, 8)
- dwell_duration_minutes: integer
- recorded_at: timestamptz NOT NULL
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (vehicle_id, recorded_at DESC)
- (geofence_id, recorded_at DESC)
- (tenant_id, recorded_at DESC)
```

### driverBehaviorEvents
**Purpose:** Harsh braking, acceleration, cornering events
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- vehicle_id: uuid NOT NULL REFERENCES vehicles(id)
- driver_id: uuid REFERENCES drivers(id)
- event_type: varchar(50) NOT NULL  -- 'harsh_braking', 'harsh_acceleration', 'harsh_cornering', 'speeding', 'idle_excess'
- severity: varchar(20)  -- 'minor', 'moderate', 'severe'
- speed_at_event: decimal(6, 2)  -- km/h
- speed_limit: integer  -- km/h
- g_force: decimal(4, 2)  -- For acceleration events
- latitude: decimal(10, 8)
- longitude: decimal(11, 8)
- address: text
- video_url: text  -- Link to dashcam footage
- recorded_at: timestamptz NOT NULL
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (driver_id, recorded_at DESC)
- (vehicle_id, recorded_at DESC)
- (tenant_id, event_type, recorded_at DESC)
```

### videoTelematicsFootage
**Purpose:** Dashcam and AI-cam video storage metadata
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- vehicle_id: uuid NOT NULL REFERENCES vehicles(id)
- driver_id: uuid REFERENCES drivers(id)
- event_id: uuid  -- FK to driverBehaviorEvents or incidents
- camera_position: varchar(20)  -- 'forward', 'interior', 'rear', 'side_left', 'side_right'
- video_url: text NOT NULL
- thumbnail_url: text
- duration_seconds: integer
- file_size_bytes: bigint
- resolution: varchar(20)  -- '1080p', '720p', '4K'
- latitude: decimal(10, 8)
- longitude: decimal(11, 8)
- recorded_at: timestamptz NOT NULL
- uploaded_at: timestamptz DEFAULT NOW()
- ai_analysis: jsonb  -- AI detection results
- tags: text[]
- is_archived: boolean DEFAULT false
INDEXES:
- (vehicle_id, recorded_at DESC)
- (driver_id, recorded_at DESC)
- (event_id)
```

### trips
**Purpose:** Complete trip records from start to end
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- vehicle_id: uuid NOT NULL REFERENCES vehicles(id)
- driver_id: uuid REFERENCES drivers(id)
- trip_number: varchar(50) UNIQUE
- start_location_lat: decimal(10, 8)
- start_location_lng: decimal(11, 8)
- start_address: text
- end_location_lat: decimal(10, 8)
- end_location_lng: decimal(11, 8)
- end_address: text
- start_odometer: integer
- end_odometer: integer
- distance_km: decimal(8, 2)
- duration_minutes: integer
- idle_time_minutes: integer
- max_speed_kph: decimal(6, 2)
- avg_speed_kph: decimal(6, 2)
- fuel_consumed_liters: decimal(8, 2)
- fuel_efficiency_l_per_100km: decimal(6, 2)
- started_at: timestamptz NOT NULL
- ended_at: timestamptz
- route_polyline: text  -- Encoded polyline
- usage_type: varchar(20)  -- 'business', 'personal', 'mixed' (IRS compliance)
- business_purpose: text
- metadata: jsonb
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (vehicle_id, started_at DESC)
- (driver_id, started_at DESC)
- (tenant_id, started_at DESC)
```

### routes
**Purpose:** Planned or optimized routes
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- route_name: varchar(255)
- description: text
- stops: jsonb  -- Array of {address, lat, lng, order, duration}
- polyline: text  -- Encoded polyline
- total_distance_km: decimal(8, 2)
- estimated_duration_minutes: integer
- optimization_criteria: varchar(50)  -- 'fastest', 'shortest', 'fuel_efficient'
- assigned_vehicle_id: uuid REFERENCES vehicles(id)
- assigned_driver_id: uuid REFERENCES drivers(id)
- scheduled_date: date
- status: varchar(20)  -- 'planned', 'active', 'completed', 'cancelled'
- actual_trip_id: uuid REFERENCES trips(id)
- created_by_user_id: uuid
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, scheduled_date, status)
- (assigned_vehicle_id, scheduled_date)
```

### trafficCameras (Florida 511 Integration)
**Purpose:** Traffic camera locations and live feeds
```sql
- id: uuid PRIMARY KEY
- fdot_id: varchar(50) UNIQUE
- name: varchar(255) NOT NULL
- description: text
- latitude: decimal(10, 8) NOT NULL
- longitude: decimal(11, 8) NOT NULL
- road: varchar(100)
- direction: varchar(10)
- county: varchar(50)
- feed_url: text
- thumbnail_url: text
- status: varchar(20)  -- 'active', 'inactive', 'maintenance'
- metadata: jsonb
- last_updated: timestamptz
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (county)
- GIST (ll_to_earth(latitude, longitude))
```

### weatherStations (Florida DOT Weather)
**Purpose:** Weather conditions affecting routes
```sql
- id: uuid PRIMARY KEY
- station_id: varchar(50) UNIQUE
- name: varchar(255)
- latitude: decimal(10, 8)
- longitude: decimal(11, 8)
- temperature_f: decimal(5, 2)
- conditions: varchar(100)
- wind_speed_mph: decimal(5, 2)
- visibility_miles: decimal(5, 2)
- road_conditions: varchar(50)  -- 'dry', 'wet', 'icy', 'snow'
- last_updated: timestamptz
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- GIST (ll_to_earth(latitude, longitude))
```

### evChargingStations
**Purpose:** EV charging station locations and availability
```sql
- id: uuid PRIMARY KEY
- station_id: varchar(50) UNIQUE
- name: varchar(255) NOT NULL
- address: text
- latitude: decimal(10, 8) NOT NULL
- longitude: decimal(11, 8) NOT NULL
- operator: varchar(100)
- network: varchar(100)
- num_ports: integer
- charging_levels: text[]  -- 'level1', 'level2', 'dcfast'
- max_power_kw: decimal(6, 2)
- pricing: text
- access_type: varchar(20)  -- 'public', 'private', 'restricted'
- available_24x7: boolean
- amenities: jsonb
- last_updated: timestamptz
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- GIST (ll_to_earth(latitude, longitude))
- (operator)
```

### tollPlazas
**Purpose:** Toll plaza locations and operators
```sql
- id: uuid PRIMARY KEY
- plaza_id: varchar(50) UNIQUE
- name: varchar(255) NOT NULL
- latitude: decimal(10, 8) NOT NULL
- longitude: decimal(11, 8) NOT NULL
- road: varchar(100)
- direction: varchar(10)
- operator: varchar(100)
- supports_sunpass: boolean
- supports_ezpass: boolean
- num_lanes: integer
- toll_rates: jsonb
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- GIST (ll_to_earth(latitude, longitude))
```

---

## 2. DOCUMENT MANAGEMENT & RAG (8 Tables Missing)

### documents
**Purpose:** Document metadata and storage
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- document_name: varchar(500) NOT NULL
- description: text
- file_type: varchar(50)  -- 'pdf', 'docx', 'xlsx', 'jpg', 'png'
- file_size_bytes: bigint
- file_url: text NOT NULL  -- Azure Blob Storage URL
- thumbnail_url: text
- folder_id: uuid REFERENCES document_folders(id)
- uploaded_by_user_id: uuid NOT NULL
- vehicle_id: uuid REFERENCES vehicles(id)
- driver_id: uuid REFERENCES drivers(id)
- entity_type: varchar(50)  -- 'vehicle', 'driver', 'policy', 'maintenance'
- entity_id: uuid
- version: integer DEFAULT 1
- parent_document_id: uuid REFERENCES documents(id)  -- Version control
- tags: text[]
- is_scanned_ai: boolean DEFAULT false
- ai_extracted_text: text
- ai_metadata: jsonb  -- Claude document analysis results
- embedding_vector: vector(1536)  -- RAG embeddings
- access_control: jsonb  -- {users: [], roles: [], departments: []}
- is_archived: boolean DEFAULT false
- retention_date: date
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, entity_type, entity_id)
- (folder_id)
- (uploaded_by_user_id, created_at DESC)
- ivfflat (embedding_vector vector_cosine_ops)  -- Vector similarity search
```

### document_folders
**Purpose:** Hierarchical folder structure
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- folder_name: varchar(255) NOT NULL
- parent_folder_id: uuid REFERENCES document_folders(id)
- path: text  -- Materialized path /parent/child/grandchild
- description: text
- color: varchar(7)
- icon: varchar(50)
- access_control: jsonb
- created_by_user_id: uuid
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, parent_folder_id)
- (path)
```

### document_shares
**Purpose:** Document sharing and permissions
```sql
- id: uuid PRIMARY KEY
- document_id: uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE
- shared_by_user_id: uuid NOT NULL
- shared_with_user_id: uuid
- shared_with_role: varchar(100)
- shared_with_department: varchar(100)
- permission_level: varchar(20) NOT NULL  -- 'view', 'edit', 'admin'
- expires_at: timestamptz
- can_reshare: boolean DEFAULT false
- share_link: varchar(255) UNIQUE  -- Public sharing link
- access_count: integer DEFAULT 0
- last_accessed_at: timestamptz
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (document_id)
- (shared_with_user_id)
- (share_link)
```

### document_versions
**Purpose:** Document version history
```sql
- id: uuid PRIMARY KEY
- document_id: uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE
- version_number: integer NOT NULL
- file_url: text NOT NULL
- file_size_bytes: bigint
- change_description: text
- changed_by_user_id: uuid NOT NULL
- checksum: varchar(64)  -- SHA-256
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (document_id, version_number DESC)
```

### document_comments
**Purpose:** Collaborative document annotations
```sql
- id: uuid PRIMARY KEY
- document_id: uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE
- user_id: uuid NOT NULL
- comment_text: text NOT NULL
- page_number: integer
- position_x: decimal(5, 2)
- position_y: decimal(5, 2)
- reply_to_comment_id: uuid REFERENCES document_comments(id)
- is_resolved: boolean DEFAULT false
- resolved_by_user_id: uuid
- resolved_at: timestamptz
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (document_id, created_at DESC)
- (reply_to_comment_id)
```

### document_ai_analysis
**Purpose:** AI/RAG document analysis results
```sql
- id: uuid PRIMARY KEY
- document_id: uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE
- analysis_type: varchar(50) NOT NULL  -- 'extraction', 'classification', 'summary', 'qa'
- ai_model: varchar(100)  -- 'claude-3-5-sonnet', 'gpt-4'
- prompt_used: text
- response: text
- confidence_score: decimal(3, 2)
- extracted_entities: jsonb  -- Names, dates, amounts, etc.
- metadata: jsonb
- analyzed_at: timestamptz DEFAULT NOW()
INDEXES:
- (document_id, analysis_type)
```

### rag_embeddings
**Purpose:** Vector embeddings for semantic search
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- source_type: varchar(50) NOT NULL  -- 'document', 'policy', 'sop', 'manual'
- source_id: uuid NOT NULL
- chunk_text: text NOT NULL
- chunk_index: integer
- embedding_vector: vector(1536)
- model_used: varchar(100)  -- 'text-embedding-ada-002', 'claude-embed'
- metadata: jsonb
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (source_type, source_id, chunk_index)
- ivfflat (embedding_vector vector_cosine_ops)
```

### document_audit_log
**Purpose:** Complete audit trail for compliance
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- document_id: uuid REFERENCES documents(id)
- user_id: uuid NOT NULL
- action: varchar(50) NOT NULL  -- 'created', 'viewed', 'edited', 'shared', 'deleted', 'downloaded', 'printed'
- ip_address: inet
- user_agent: text
- details: jsonb
- occurred_at: timestamptz DEFAULT NOW()
INDEXES:
- (document_id, occurred_at DESC)
- (user_id, occurred_at DESC)
- (tenant_id, occurred_at DESC)
```

---

## 3. FINANCIAL & ACCOUNTING (10 Tables Missing)

### expenses
**Purpose:** FLAIR expense submission and tracking
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- expense_number: varchar(50) UNIQUE
- expense_type: varchar(50) NOT NULL  -- 'fuel', 'maintenance', 'toll', 'parking', 'other'
- category: varchar(100)
- vehicle_id: uuid REFERENCES vehicles(id)
- driver_id: uuid REFERENCES drivers(id)
- submitted_by_user_id: uuid NOT NULL
- vendor_id: uuid REFERENCES vendors(id)
- receipt_document_id: uuid REFERENCES documents(id)
- expense_date: date NOT NULL
- amount: decimal(12, 2) NOT NULL
- currency: varchar(3) DEFAULT 'USD'
- tax_amount: decimal(12, 2)
- description: text
- reimbursement_status: varchar(20)  -- 'pending', 'approved', 'rejected', 'paid'
- approval_workflow_id: uuid
- approved_by_user_id: uuid
- approved_at: timestamptz
- rejection_reason: text
- paid_at: timestamptz
- payment_method: varchar(50)
- payment_reference: varchar(100)
- cost_center: varchar(100)
- project_code: varchar(100)
- metadata: jsonb
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, expense_date DESC)
- (submitted_by_user_id, reimbursement_status)
- (vehicle_id)
```

### invoices
**Purpose:** Vendor invoices and accounts payable
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- invoice_number: varchar(100) UNIQUE NOT NULL
- vendor_id: uuid NOT NULL REFERENCES vendors(id)
- invoice_type: varchar(50)  -- 'fuel', 'parts', 'service', 'lease', 'insurance'
- invoice_date: date NOT NULL
- due_date: date NOT NULL
- po_number: varchar(100)  -- Purchase Order reference
- subtotal: decimal(12, 2) NOT NULL
- tax_amount: decimal(12, 2)
- discount_amount: decimal(12, 2)
- total_amount: decimal(12, 2) NOT NULL
- currency: varchar(3) DEFAULT 'USD'
- payment_terms: varchar(100)
- payment_status: varchar(20)  -- 'unpaid', 'partial', 'paid', 'overdue'
- paid_amount: decimal(12, 2) DEFAULT 0
- paid_at: timestamptz
- payment_method: varchar(50)
- payment_reference: varchar(100)
- line_items: jsonb  -- [{description, quantity, unit_price, amount}]
- notes: text
- attached_documents: uuid[]  -- Array of document IDs
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, invoice_date DESC)
- (vendor_id, payment_status)
- (due_date, payment_status)
```

### purchase_orders
**Purpose:** Purchase order management
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- po_number: varchar(100) UNIQUE NOT NULL
- vendor_id: uuid NOT NULL REFERENCES vendors(id)
- requisition_id: uuid
- po_type: varchar(50)  -- 'parts', 'service', 'equipment', 'supplies'
- requested_by_user_id: uuid NOT NULL
- approved_by_user_id: uuid
- po_date: date NOT NULL
- expected_delivery_date: date
- delivery_address: text
- subtotal: decimal(12, 2) NOT NULL
- tax_amount: decimal(12, 2)
- shipping_amount: decimal(12, 2)
- total_amount: decimal(12, 2) NOT NULL
- currency: varchar(3) DEFAULT 'USD'
- payment_terms: varchar(100)
- status: varchar(20)  -- 'draft', 'pending_approval', 'approved', 'sent', 'partially_received', 'received', 'cancelled'
- line_items: jsonb  -- [{item, description, quantity, unit_price, amount}]
- notes: text
- terms_and_conditions: text
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, po_date DESC)
- (vendor_id, status)
- (status, expected_delivery_date)
```

### budget_allocations
**Purpose:** Department/fleet budget tracking
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- fiscal_year: integer NOT NULL
- fiscal_period: varchar(20)  -- 'Q1', 'Q2', 'Q3', 'Q4', 'JAN', 'FEB', etc.
- department: varchar(100)
- cost_center: varchar(100)
- category: varchar(100)  -- 'fuel', 'maintenance', 'insurance', 'depreciation'
- allocated_amount: decimal(12, 2) NOT NULL
- spent_amount: decimal(12, 2) DEFAULT 0
- committed_amount: decimal(12, 2) DEFAULT 0  -- POs not yet invoiced
- remaining_amount: decimal(12, 2) GENERATED ALWAYS AS (allocated_amount - spent_amount - committed_amount) STORED
- percent_utilized: decimal(5, 2) GENERATED ALWAYS AS ((spent_amount + committed_amount) / NULLIF(allocated_amount, 0) * 100) STORED
- notes: text
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, fiscal_year, fiscal_period)
- (department, category)
```

### cost_allocations
**Purpose:** Allocate expenses to departments/projects
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- source_type: varchar(50) NOT NULL  -- 'expense', 'invoice', 'fuel_transaction', 'maintenance_record'
- source_id: uuid NOT NULL
- allocation_date: date NOT NULL
- department: varchar(100)
- cost_center: varchar(100)
- project_code: varchar(100)
- vehicle_id: uuid REFERENCES vehicles(id)
- allocated_amount: decimal(12, 2) NOT NULL
- allocation_percentage: decimal(5, 2)
- allocation_method: varchar(50)  -- 'manual', 'automatic', 'usage_based'
- notes: text
- created_by_user_id: uuid
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, allocation_date DESC)
- (source_type, source_id)
- (department, cost_center)
```

### depreciation_schedules
**Purpose:** Vehicle asset depreciation tracking
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- vehicle_id: uuid NOT NULL REFERENCES vehicles(id)
- depreciation_method: varchar(50)  -- 'straight_line', 'declining_balance', 'units_of_production'
- purchase_price: decimal(12, 2) NOT NULL
- salvage_value: decimal(12, 2) NOT NULL
- useful_life_years: integer
- useful_life_miles: integer
- depreciation_start_date: date NOT NULL
- current_book_value: decimal(12, 2)
- accumulated_depreciation: decimal(12, 2) DEFAULT 0
- is_active: boolean DEFAULT true
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (vehicle_id)
- (tenant_id, is_active)
```

### depreciation_entries
**Purpose:** Periodic depreciation journal entries
```sql
- id: uuid PRIMARY KEY
- depreciation_schedule_id: uuid NOT NULL REFERENCES depreciation_schedules(id)
- period: varchar(20) NOT NULL  -- 'YYYY-MM'
- period_start_date: date NOT NULL
- period_end_date: date NOT NULL
- depreciation_amount: decimal(12, 2) NOT NULL
- beginning_book_value: decimal(12, 2)
- ending_book_value: decimal(12, 2)
- miles_driven: integer
- notes: text
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (depreciation_schedule_id, period DESC)
```

### fuel_cards
**Purpose:** Fuel card management and transactions
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- card_number: varchar(50) UNIQUE NOT NULL
- card_provider: varchar(100)  -- 'WEX', 'Voyager', 'FleetCor'
- card_type: varchar(50)
- assigned_vehicle_id: uuid REFERENCES vehicles(id)
- assigned_driver_id: uuid REFERENCES drivers(id)
- card_status: varchar(20)  -- 'active', 'suspended', 'lost', 'expired', 'cancelled'
- credit_limit: decimal(12, 2)
- current_balance: decimal(12, 2)
- pin_required: boolean DEFAULT true
- restrictions: jsonb  -- {fuel_type: [], max_amount: 0, locations: []}
- issue_date: date
- expiration_date: date
- last_used_at: timestamptz
- metadata: jsonb
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, card_status)
- (assigned_vehicle_id)
- (card_number)
```

### fuel_card_transactions
**Purpose:** Detailed fuel card transaction records
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- fuel_card_id: uuid NOT NULL REFERENCES fuel_cards(id)
- fuel_transaction_id: uuid REFERENCES fuelTransactions(id)
- vehicle_id: uuid REFERENCES vehicles(id)
- driver_id: uuid REFERENCES drivers(id)
- transaction_date: timestamptz NOT NULL
- merchant_name: varchar(255)
- merchant_location: text
- latitude: decimal(10, 8)
- longitude: decimal(11, 8)
- fuel_type: varchar(50)
- quantity_liters: decimal(8, 2)
- unit_price: decimal(6, 3)
- total_amount: decimal(12, 2) NOT NULL
- odometer: integer
- is_approved: boolean DEFAULT true
- approval_status: varchar(20)  -- 'pending', 'approved', 'flagged', 'rejected'
- flagged_reason: text
- metadata: jsonb
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (fuel_card_id, transaction_date DESC)
- (vehicle_id, transaction_date DESC)
- (tenant_id, transaction_date DESC)
- (approval_status)
```

### payment_methods
**Purpose:** Payment method registry
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- payment_type: varchar(50)  -- 'credit_card', 'bank_account', 'fuel_card', 'check', 'wire'
- payment_name: varchar(255)
- account_number_last4: varchar(4)
- bank_name: varchar(255)
- routing_number: varchar(50)
- billing_address: text
- is_default: boolean DEFAULT false
- is_active: boolean DEFAULT true
- metadata: jsonb  -- Encrypted sensitive data reference
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, is_active)
```

---

## 4. ENHANCED WORK ORDERS & SCHEDULING (6 Tables Missing)

### work_order_templates
**Purpose:** Reusable work order templates
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- template_name: varchar(255) NOT NULL
- description: text
- work_order_type: varchar(50)
- estimated_hours: decimal(6, 2)
- estimated_cost: decimal(12, 2)
- task_checklist: jsonb  -- [{task, required, order}]
- required_parts: jsonb  -- [{part_id, quantity}]
- required_skills: text[]
- sop_document_ids: uuid[]
- instructions: text
- is_active: boolean DEFAULT true
- created_by_user_id: uuid
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, is_active)
```

### work_order_tasks
**Purpose:** Individual tasks within work orders
```sql
- id: uuid PRIMARY KEY
- work_order_id: uuid NOT NULL REFERENCES maintenanceRecords(id)
- task_order: integer
- task_description: text NOT NULL
- assigned_technician_id: uuid
- estimated_hours: decimal(6, 2)
- actual_hours: decimal(6, 2)
- status: varchar(20)  -- 'pending', 'in_progress', 'completed', 'blocked'
- completion_notes: text
- completed_by_user_id: uuid
- completed_at: timestamptz
- requires_inspection: boolean DEFAULT false
- inspection_passed: boolean
- metadata: jsonb
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (work_order_id, task_order)
- (assigned_technician_id, status)
```

### service_bays
**Purpose:** Garage bay management
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- facility_id: uuid REFERENCES facilities(id)
- bay_name: varchar(100) NOT NULL
- bay_number: varchar(20) NOT NULL
- bay_type: varchar(50)  -- 'general', 'alignment', 'bodywork', 'paint', 'heavy_equipment'
- max_vehicle_weight_lbs: integer
- max_lift_capacity_lbs: integer
- equipment_available: text[]
- is_operational: boolean DEFAULT true
- current_work_order_id: uuid REFERENCES maintenanceRecords(id)
- metadata: jsonb
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (facility_id, is_operational)
- (tenant_id)
```

### service_bay_schedule
**Purpose:** Bay utilization scheduling
```sql
- id: uuid PRIMARY KEY
- service_bay_id: uuid NOT NULL REFERENCES service_bays(id)
- work_order_id: uuid NOT NULL REFERENCES maintenanceRecords(id)
- vehicle_id: uuid NOT NULL REFERENCES vehicles(id)
- scheduled_start: timestamptz NOT NULL
- scheduled_end: timestamptz NOT NULL
- actual_start: timestamptz
- actual_end: timestamptz
- notes: text
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (service_bay_id, scheduled_start, scheduled_end)
- (work_order_id)
```

### technicians
**Purpose:** Technician profiles and certifications
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- user_id: uuid REFERENCES users(id)
- employee_id: varchar(50)
- first_name: varchar(100) NOT NULL
- last_name: varchar(100) NOT NULL
- email: varchar(255)
- phone: varchar(20)
- facility_id: uuid REFERENCES facilities(id)
- specializations: text[]  -- 'engine', 'transmission', 'electrical', 'hvac', 'bodywork'
- certifications: jsonb  -- [{name, issuer, number, expiry_date}]
- hourly_rate: decimal(8, 2)
- hire_date: date
- status: varchar(20)  -- 'active', 'on_leave', 'terminated'
- metadata: jsonb
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, status)
- (facility_id)
- (user_id)
```

### recurring_maintenance_schedules
**Purpose:** PM scheduling based on time/mileage
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- vehicle_id: uuid NOT NULL REFERENCES vehicles(id)
- schedule_name: varchar(255)
- maintenance_type: varchar(100)  -- 'oil_change', 'tire_rotation', 'brake_inspection'
- template_id: uuid REFERENCES work_order_templates(id)
- trigger_type: varchar(20)  -- 'mileage', 'time', 'engine_hours'
- trigger_interval_miles: integer
- trigger_interval_days: integer
- trigger_interval_hours: integer
- last_completed_mileage: integer
- last_completed_date: date
- last_completed_hours: integer
- next_due_mileage: integer
- next_due_date: date
- next_due_hours: integer
- is_active: boolean DEFAULT true
- auto_create_work_order: boolean DEFAULT false
- advance_notice_days: integer DEFAULT 7
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (vehicle_id, is_active)
- (tenant_id, next_due_date)
```

---

## 5. COMMUNICATION & NOTIFICATIONS (7 Tables Missing)

### notifications
**Purpose:** System-wide notification center
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- user_id: uuid NOT NULL
- notification_type: varchar(50)  -- 'alert', 'reminder', 'approval', 'message', 'system'
- category: varchar(50)  -- 'vehicle', 'maintenance', 'safety', 'policy', 'expense'
- title: varchar(255) NOT NULL
- message: text NOT NULL
- priority: varchar(20)  -- 'low', 'medium', 'high', 'urgent'
- entity_type: varchar(50)  -- 'vehicle', 'driver', 'work_order', 'expense'
- entity_id: uuid
- action_url: text
- action_label: varchar(100)
- is_read: boolean DEFAULT false
- read_at: timestamptz
- is_dismissed: boolean DEFAULT false
- dismissed_at: timestamptz
- delivery_channels: text[]  -- 'in_app', 'email', 'sms', 'teams'
- email_sent_at: timestamptz
- sms_sent_at: timestamptz
- metadata: jsonb
- expires_at: timestamptz
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (user_id, is_read, created_at DESC)
- (tenant_id, notification_type, created_at DESC)
```

### notification_preferences
**Purpose:** User notification settings
```sql
- id: uuid PRIMARY KEY
- user_id: uuid NOT NULL UNIQUE
- email_enabled: boolean DEFAULT true
- sms_enabled: boolean DEFAULT false
- push_enabled: boolean DEFAULT true
- teams_enabled: boolean DEFAULT true
- quiet_hours_enabled: boolean DEFAULT false
- quiet_hours_start: time
- quiet_hours_end: time
- notification_settings: jsonb  -- {category: {email: true, sms: false, push: true}}
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
```

### messages
**Purpose:** Internal messaging system
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- conversation_id: uuid
- sender_user_id: uuid NOT NULL
- recipient_user_id: uuid
- recipient_group_id: uuid  -- For group messages
- subject: varchar(500)
- message_body: text NOT NULL
- parent_message_id: uuid REFERENCES messages(id)  -- Threading
- attachments: jsonb  -- [{file_name, file_url, file_type, file_size}]
- is_read: boolean DEFAULT false
- read_at: timestamptz
- is_archived: boolean DEFAULT false
- is_starred: boolean DEFAULT false
- sent_at: timestamptz DEFAULT NOW()
INDEXES:
- (conversation_id, sent_at DESC)
- (recipient_user_id, is_read, sent_at DESC)
- (sender_user_id, sent_at DESC)
```

### teams_integration_messages
**Purpose:** Microsoft Teams message sync
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- teams_message_id: varchar(255) UNIQUE
- teams_channel_id: varchar(255)
- teams_team_id: varchar(255)
- sender_email: varchar(255)
- sender_name: varchar(255)
- message_content: text
- message_type: varchar(50)  -- 'text', 'html', 'card'
- mentions: jsonb  -- [{user_id, email, name}]
- attachments: jsonb
- reactions: jsonb
- is_reply: boolean DEFAULT false
- reply_to_message_id: varchar(255)
- created_at_teams: timestamptz
- synced_at: timestamptz DEFAULT NOW()
INDEXES:
- (teams_channel_id, created_at_teams DESC)
- (teams_message_id)
```

### outlook_emails
**Purpose:** Outlook email integration
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- outlook_message_id: varchar(255) UNIQUE
- conversation_id: varchar(255)
- user_email: varchar(255)
- from_address: varchar(255)
- to_addresses: text[]
- cc_addresses: text[]
- subject: varchar(1000)
- body_preview: text
- body_content: text
- body_content_type: varchar(20)  -- 'html', 'text'
- importance: varchar(20)  -- 'low', 'normal', 'high'
- has_attachments: boolean DEFAULT false
- attachments: jsonb
- is_read: boolean DEFAULT false
- is_draft: boolean DEFAULT false
- received_datetime: timestamptz
- sent_datetime: timestamptz
- entity_references: jsonb  -- Auto-detected vehicle IDs, WO numbers, etc.
- synced_at: timestamptz DEFAULT NOW()
INDEXES:
- (user_email, received_datetime DESC)
- (outlook_message_id)
- (conversation_id)
```

### alert_rules
**Purpose:** Configurable alerting rules
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- rule_name: varchar(255) NOT NULL
- description: text
- alert_type: varchar(50)  -- 'maintenance_due', 'inspection_expiring', 'cost_threshold', 'geofence', 'driver_behavior'
- trigger_conditions: jsonb  -- Complex conditions in JSON
- severity: varchar(20)  -- 'info', 'warning', 'critical'
- notification_channels: text[]  -- 'in_app', 'email', 'sms', 'teams'
- recipient_users: uuid[]
- recipient_roles: text[]
- is_active: boolean DEFAULT true
- cooldown_minutes: integer DEFAULT 60  -- Prevent alert spam
- last_triggered_at: timestamptz
- created_by_user_id: uuid
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, is_active)
- (alert_type)
```

### alert_history
**Purpose:** Alert firing history
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- alert_rule_id: uuid NOT NULL REFERENCES alert_rules(id)
- alert_type: varchar(50)
- severity: varchar(20)
- entity_type: varchar(50)
- entity_id: uuid
- alert_message: text
- trigger_data: jsonb  -- Snapshot of data that triggered alert
- acknowledged_by_user_id: uuid
- acknowledged_at: timestamptz
- resolution_notes: text
- fired_at: timestamptz DEFAULT NOW()
INDEXES:
- (alert_rule_id, fired_at DESC)
- (tenant_id, entity_type, entity_id, fired_at DESC)
```

---

## 6. SAFETY, INCIDENTS & COMPLIANCE (8 Tables Missing)

### accident_reports
**Purpose:** Detailed accident/incident reporting
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- incident_id: uuid REFERENCES incidents(id)
- report_number: varchar(100) UNIQUE
- vehicle_id: uuid NOT NULL REFERENCES vehicles(id)
- driver_id: uuid NOT NULL REFERENCES drivers(id)
- incident_date: timestamptz NOT NULL
- location: text
- latitude: decimal(10, 8)
- longitude: decimal(11, 8)
- weather_conditions: varchar(100)
- road_conditions: varchar(100)
- traffic_conditions: varchar(100)
- incident_type: varchar(50)  -- 'collision', 'rollover', 'vandalism', 'theft'
- severity: varchar(20)  -- 'minor', 'moderate', 'severe', 'fatal'
- at_fault: boolean
- police_notified: boolean DEFAULT false
- police_report_number: varchar(100)
- police_department: varchar(255)
- injuries: jsonb  -- [{person, injury_type, severity, hospitalized}]
- fatalities: integer DEFAULT 0
- property_damage: text
- estimated_damage_cost: decimal(12, 2)
- other_parties: jsonb  -- [{name, contact, insurance, vehicle}]
- witnesses: jsonb  -- [{name, contact, statement}]
- description: text
- photos: text[]  -- URLs to incident photos
- video_urls: text[]
- dashcam_footage_id: uuid REFERENCES videoTelematicsFootage(id)
- drug_alcohol_test_required: boolean DEFAULT false
- drug_test_result: varchar(50)
- alcohol_test_result: varchar(50)
- claims_filed: jsonb  -- [{claim_number, insurer, status, amount}]
- investigation_status: varchar(50)  -- 'pending', 'in_progress', 'completed'
- investigation_notes: text
- preventability: varchar(50)  -- 'preventable', 'non_preventable', 'pending_review'
- corrective_actions: text
- reported_by_user_id: uuid
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, incident_date DESC)
- (vehicle_id, incident_date DESC)
- (driver_id, incident_date DESC)
- (investigation_status)
```

### safety_inspections
**Purpose:** Vehicle safety inspection records
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- vehicle_id: uuid NOT NULL REFERENCES vehicles(id)
- inspection_type: varchar(100)  -- 'DOT', 'pre_trip', 'post_trip', 'annual', 'quarterly'
- inspector_id: uuid  -- Could be driver or technician
- inspection_date: timestamptz NOT NULL
- inspection_location: text
- odometer: integer
- inspection_status: varchar(20)  -- 'passed', 'failed', 'conditional'
- checklist_results: jsonb  -- [{item, status, notes, photo_url}]
- defects_found: jsonb  -- [{item, severity, action_required}]
- requires_maintenance: boolean DEFAULT false
- work_order_created_id: uuid REFERENCES maintenanceRecords(id)
- next_inspection_due: date
- certification_number: varchar(100)
- certification_expiry: date
- inspector_signature: text  -- Base64 signature image
- notes: text
- photos: text[]
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (vehicle_id, inspection_date DESC)
- (tenant_id, inspection_type, inspection_date DESC)
- (inspection_status, next_inspection_due)
```

### driver_violations
**Purpose:** Traffic citations and violations
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- driver_id: uuid NOT NULL REFERENCES drivers(id)
- vehicle_id: uuid REFERENCES vehicles(id)
- violation_type: varchar(100)  -- 'speeding', 'red_light', 'stop_sign', 'parking', 'DUI', 'seatbelt'
- citation_number: varchar(100)
- violation_date: timestamptz NOT NULL
- location: text
- issuing_agency: varchar(255)
- officer_name: varchar(255)
- violation_description: text
- fine_amount: decimal(8, 2)
- points: integer
- court_date: date
- court_location: text
- plea: varchar(50)  -- 'not_guilty', 'guilty', 'no_contest', 'dismissed'
- outcome: varchar(100)
- fine_paid: boolean DEFAULT false
- fine_paid_date: date
- fine_paid_by: varchar(50)  -- 'driver', 'company'
- insurance_notified: boolean DEFAULT false
- points_added_to_record: boolean DEFAULT false
- affects_insurance: boolean DEFAULT false
- corrective_action_taken: text
- attachments: text[]  -- Citation documents, court papers
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (driver_id, violation_date DESC)
- (tenant_id, violation_date DESC)
- (fine_paid, fine_paid_date)
```

### compliance_documents
**Purpose:** Regulatory compliance documentation
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- document_type: varchar(100) NOT NULL  -- 'DOT_annual_review', 'OSHA_log', 'EPA_report', 'insurance_certificate', 'license'
- entity_type: varchar(50)  -- 'fleet', 'vehicle', 'driver', 'facility'
- entity_id: uuid
- document_number: varchar(100)
- issuing_authority: varchar(255)
- issue_date: date
- expiration_date: date
- renewal_required: boolean DEFAULT true
- renewal_reminder_days: integer DEFAULT 30
- status: varchar(20)  -- 'active', 'expiring_soon', 'expired', 'renewed'
- document_url: text
- verification_method: varchar(100)
- verified_by_user_id: uuid
- verified_at: timestamptz
- compliance_requirements: text
- notes: text
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, document_type, status)
- (entity_type, entity_id, expiration_date)
- (expiration_date, status)
```

### hours_of_service_logs
**Purpose:** DOT HOS compliance (for CDL drivers)
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- driver_id: uuid NOT NULL REFERENCES drivers(id)
- vehicle_id: uuid REFERENCES vehicles(id)
- log_date: date NOT NULL
- duty_status: varchar(20) NOT NULL  -- 'off_duty', 'sleeper_berth', 'driving', 'on_duty_not_driving'
- status_start_time: timestamptz NOT NULL
- status_end_time: timestamptz
- duration_minutes: integer
- location_start: text
- location_end: text
- odometer_start: integer
- odometer_end: integer
- remarks: text
- violations: text[]  -- ['11_hour_driving', '14_hour_window', '70_hour_8_day']
- is_certified: boolean DEFAULT false
- certified_at: timestamptz
- eld_provider: varchar(100)  -- Electronic Logging Device
- eld_device_id: varchar(100)
- is_edited: boolean DEFAULT false
- edit_reason: text
- edited_by_user_id: uuid
- edited_at: timestamptz
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (driver_id, log_date DESC)
- (tenant_id, log_date DESC)
- (violations)  -- GIN index for arrays
```

### driver_training_records
**Purpose:** Driver training completion tracking
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- driver_id: uuid NOT NULL REFERENCES drivers(id)
- training_type: varchar(100)  -- 'defensive_driving', 'hazmat', 'forklift', 'smith_system'
- training_provider: varchar(255)
- training_date: date NOT NULL
- completion_date: date
- expiration_date: date
- certification_number: varchar(100)
- score: decimal(5, 2)
- passing_score: decimal(5, 2)
- status: varchar(20)  -- 'completed', 'failed', 'expired', 'in_progress'
- instructor_name: varchar(255)
- training_hours: decimal(4, 1)
- training_location: text
- certificate_url: text
- notes: text
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (driver_id, training_type, completion_date DESC)
- (tenant_id, expiration_date)
- (status, expiration_date)
```

### safety_meetings
**Purpose:** Safety meeting attendance and topics
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- meeting_date: timestamptz NOT NULL
- meeting_type: varchar(100)  -- 'toolbox_talk', 'monthly_safety', 'incident_review', 'training'
- topic: varchar(500) NOT NULL
- facilitator_user_id: uuid
- location: text
- duration_minutes: integer
- attendees: jsonb  -- [{driver_id, user_id, signed, signature_url}]
- agenda: text
- minutes: text
- action_items: jsonb  -- [{description, assigned_to, due_date, status}]
- handouts: text[]  -- URLs to documents
- quiz_results: jsonb  -- [{driver_id, score, passed}]
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, meeting_date DESC)
```

### insurance_policies
**Purpose:** Fleet insurance policy tracking
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- policy_number: varchar(100) UNIQUE NOT NULL
- insurance_carrier: varchar(255) NOT NULL
- policy_type: varchar(100)  -- 'auto_liability', 'physical_damage', 'cargo', 'workers_comp'
- coverage_type: varchar(100)  -- 'comprehensive', 'collision', 'liability'
- policy_start_date: date NOT NULL
- policy_end_date: date NOT NULL
- premium_amount: decimal(12, 2)
- deductible: decimal(12, 2)
- coverage_limits: jsonb  -- {bodily_injury: 1000000, property_damage: 500000}
- covered_vehicles: uuid[]  -- Array of vehicle IDs
- covered_drivers: uuid[]  -- Array of driver IDs
- agent_name: varchar(255)
- agent_contact: varchar(255)
- policy_document_url: text
- renewal_status: varchar(20)  -- 'current', 'expiring', 'expired', 'renewed'
- claims_filed: integer DEFAULT 0
- total_claims_paid: decimal(12, 2) DEFAULT 0
- is_active: boolean DEFAULT true
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, policy_type, is_active)
- (policy_end_date, renewal_status)
```

---

## 7. ASSET MANAGEMENT & 3D MODELS (5 Tables Missing)

### asset_tags
**Purpose:** Physical asset tagging and barcodes
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- entity_type: varchar(50) NOT NULL  -- 'vehicle', 'equipment', 'part', 'tool'
- entity_id: uuid NOT NULL
- tag_type: varchar(50)  -- 'barcode', 'qr_code', 'rfid', 'nfc'
- tag_identifier: varchar(255) UNIQUE NOT NULL
- tag_location: varchar(255)  -- Physical location on asset
- is_primary: boolean DEFAULT false
- is_active: boolean DEFAULT true
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (tag_identifier)
- (entity_type, entity_id)
```

### asset_transfers
**Purpose:** Asset transfer history between locations/departments
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- asset_type: varchar(50)  -- 'vehicle', 'equipment', 'part'
- asset_id: uuid NOT NULL
- transfer_type: varchar(50)  -- 'location', 'department', 'assignment', 'custody'
- from_location_id: uuid REFERENCES facilities(id)
- to_location_id: uuid REFERENCES facilities(id)
- from_department: varchar(100)
- to_department: varchar(100)
- from_user_id: uuid
- to_user_id: uuid
- transfer_date: timestamptz NOT NULL
- transfer_reason: text
- condition_before: text
- condition_after: text
- approved_by_user_id: uuid
- transferred_by_user_id: uuid
- received_by_user_id: uuid
- notes: text
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (asset_type, asset_id, transfer_date DESC)
- (tenant_id, transfer_date DESC)
```

### turbosquid_models
**Purpose:** TurboSquid 3D model library integration
```sql
- id: uuid PRIMARY KEY
- turbosquid_id: varchar(100) UNIQUE
- model_name: varchar(500) NOT NULL
- description: text
- category: varchar(100)  -- 'vehicle', 'equipment', 'environment'
- vehicle_make: varchar(100)
- vehicle_model: varchar(100)
- vehicle_year: integer
- file_formats: text[]  -- ['fbx', 'obj', 'gltf', 'blend']
- poly_count: integer
- texture_resolution: varchar(50)
- is_rigged: boolean DEFAULT false
- is_animated: boolean DEFAULT false
- preview_image_url: text
- model_download_url: text
- license_type: varchar(100)
- price_usd: decimal(10, 2)
- rating: decimal(3, 2)
- tags: text[]
- downloaded_at: timestamptz
- local_file_path: text
- is_purchased: boolean DEFAULT false
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (vehicle_make, vehicle_model, vehicle_year)
- (category, tags)  -- GIN index for array
```

### triposr_3d_generations
**Purpose:** TripoSR AI-generated 3D models from damage photos
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- damage_report_id: uuid REFERENCES damageReports(id)
- vehicle_id: uuid REFERENCES vehicles(id)
- source_photos: text[]  -- URLs to input photos
- generation_status: varchar(20)  -- 'pending', 'processing', 'completed', 'failed'
- triposr_task_id: varchar(255)
- model_url: text  -- Generated GLB/GLTF URL
- preview_url: text
- poly_count: integer
- file_size_bytes: bigint
- processing_time_seconds: integer
- ai_confidence_score: decimal(3, 2)
- error_message: text
- metadata: jsonb
- started_at: timestamptz
- completed_at: timestamptz
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (damage_report_id)
- (vehicle_id, created_at DESC)
- (generation_status)
```

### meshy_ai_generations
**Purpose:** Meshy.AI text-to-3D model generation
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- generation_type: varchar(50)  -- 'text_to_3d', 'image_to_3d', 'refinement'
- prompt: text
- negative_prompt: text
- reference_images: text[]
- meshy_task_id: varchar(255) UNIQUE
- generation_status: varchar(20)  -- 'pending', 'processing', 'completed', 'failed'
- model_url: text
- preview_url: text
- texture_urls: jsonb
- poly_count: integer
- art_style: varchar(100)  -- 'realistic', 'cartoon', 'low_poly', 'pbr'
- seed: bigint
- steps: integer
- guidance_scale: decimal(4, 2)
- error_message: text
- processing_time_seconds: integer
- started_at: timestamptz
- completed_at: timestamptz
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, created_at DESC)
- (meshy_task_id)
- (generation_status)
```

---

## 8. REPORTING & ANALYTICS (6 Tables Missing)

### saved_reports
**Purpose:** User-saved report configurations
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- report_name: varchar(255) NOT NULL
- report_type: varchar(100)  -- 'fleet_utilization', 'maintenance_costs', 'fuel_analysis', 'custom'
- report_category: varchar(100)
- description: text
- report_config: jsonb  -- Complete report configuration
- filters: jsonb
- columns: jsonb
- grouping: jsonb
- sorting: jsonb
- chart_types: text[]
- schedule_enabled: boolean DEFAULT false
- schedule_frequency: varchar(50)  -- 'daily', 'weekly', 'monthly'
- schedule_day: integer  -- Day of week or month
- schedule_time: time
- email_recipients: text[]
- file_format: varchar(20)  -- 'pdf', 'excel', 'csv'
- is_public: boolean DEFAULT false
- is_favorite: boolean DEFAULT false
- access_control: jsonb
- created_by_user_id: uuid NOT NULL
- last_run_at: timestamptz
- run_count: integer DEFAULT 0
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, created_by_user_id)
- (tenant_id, is_public, is_favorite)
- (schedule_enabled, schedule_frequency)
```

### report_executions
**Purpose:** Report execution history and results
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- saved_report_id: uuid REFERENCES saved_reports(id)
- executed_by_user_id: uuid
- execution_type: varchar(20)  -- 'manual', 'scheduled', 'api'
- report_parameters: jsonb
- date_range_start: date
- date_range_end: date
- row_count: integer
- execution_time_ms: integer
- file_url: text  -- Generated file URL
- file_format: varchar(20)
- file_size_bytes: bigint
- status: varchar(20)  -- 'completed', 'failed', 'timeout'
- error_message: text
- executed_at: timestamptz DEFAULT NOW()
INDEXES:
- (saved_report_id, executed_at DESC)
- (tenant_id, executed_at DESC)
```

### dashboards
**Purpose:** Custom user dashboards
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- dashboard_name: varchar(255) NOT NULL
- description: text
- dashboard_type: varchar(50)  -- 'executive', 'operational', 'financial', 'safety', 'custom'
- layout_config: jsonb  -- Grid layout configuration
- widgets: jsonb  -- [{widget_id, type, config, position, size}]
- refresh_interval_seconds: integer DEFAULT 300
- is_default: boolean DEFAULT false
- is_public: boolean DEFAULT false
- access_control: jsonb
- created_by_user_id: uuid NOT NULL
- last_viewed_at: timestamptz
- view_count: integer DEFAULT 0
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, created_by_user_id)
- (tenant_id, is_default, is_public)
```

### kpi_targets
**Purpose:** KPI goals and target tracking
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- kpi_name: varchar(255) NOT NULL
- kpi_category: varchar(100)  -- 'safety', 'efficiency', 'cost', 'utilization', 'compliance'
- metric_type: varchar(100)  -- 'mpg', 'cost_per_mile', 'accidents_per_million_miles'
- target_value: decimal(12, 4) NOT NULL
- current_value: decimal(12, 4)
- unit_of_measure: varchar(50)
- period_type: varchar(20)  -- 'monthly', 'quarterly', 'yearly'
- period_start_date: date NOT NULL
- period_end_date: date NOT NULL
- department: varchar(100)
- vehicle_group: varchar(100)
- target_met: boolean DEFAULT false
- percent_to_target: decimal(5, 2)
- trend: varchar(20)  -- 'improving', 'declining', 'stable'
- notes: text
- created_by_user_id: uuid
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, kpi_category, period_start_date DESC)
- (tenant_id, period_end_date, target_met)
```

### benchmark_data
**Purpose:** Industry benchmark comparisons
```sql
- id: uuid PRIMARY KEY
- benchmark_category: varchar(100)  -- 'fuel_efficiency', 'maintenance_cost', 'safety'
- metric_name: varchar(255) NOT NULL
- industry_type: varchar(100)  -- 'transportation', 'utilities', 'government', 'construction'
- fleet_size_category: varchar(50)  -- 'small', 'medium', 'large', 'enterprise'
- region: varchar(100)
- benchmark_value: decimal(12, 4) NOT NULL
- percentile_25: decimal(12, 4)
- percentile_50: decimal(12, 4)
- percentile_75: decimal(12, 4)
- percentile_90: decimal(12, 4)
- sample_size: integer
- data_source: varchar(255)
- unit_of_measure: varchar(50)
- period: varchar(20)  -- '2024-Q4', '2024'
- as_of_date: date NOT NULL
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (benchmark_category, industry_type, fleet_size_category)
- (metric_name, region, period)
```

### analytics_cache
**Purpose:** Pre-computed analytics for performance
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- cache_key: varchar(500) UNIQUE NOT NULL
- cache_type: varchar(100)  -- 'dashboard', 'report', 'kpi', 'widget'
- aggregation_level: varchar(50)  -- 'vehicle', 'driver', 'department', 'fleet'
- period_type: varchar(20)  -- 'daily', 'weekly', 'monthly', 'yearly'
- period_start: date
- period_end: date
- cache_data: jsonb NOT NULL
- row_count: integer
- computation_time_ms: integer
- is_stale: boolean DEFAULT false
- expires_at: timestamptz NOT NULL
- created_at: timestamptz DEFAULT NOW()
- last_accessed_at: timestamptz
- access_count: integer DEFAULT 0
INDEXES:
- (cache_key, expires_at)
- (tenant_id, cache_type, is_stale)
- (expires_at)  -- For cleanup jobs
```

---

## 9. USER MANAGEMENT & RBAC (6 Tables Missing)

### roles
**Purpose:** Role-based access control definitions
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid
- role_name: varchar(100) UNIQUE NOT NULL
- display_name: varchar(255)
- description: text
- role_type: varchar(50)  -- 'system', 'tenant', 'custom'
- permissions: jsonb  -- {resource: {actions: ['read', 'write', 'delete']}}
- is_system_role: boolean DEFAULT false  -- Cannot be deleted
- is_active: boolean DEFAULT true
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, is_active)
- (role_name)
```

### user_roles
**Purpose:** User-role assignments
```sql
- id: uuid PRIMARY KEY
- user_id: uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
- role_id: uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE
- assigned_by_user_id: uuid
- assigned_at: timestamptz DEFAULT NOW()
- expires_at: timestamptz
- is_active: boolean DEFAULT true
UNIQUE (user_id, role_id)
INDEXES:
- (user_id, is_active)
- (role_id)
```

### permissions
**Purpose:** Granular permission definitions
```sql
- id: uuid PRIMARY KEY
- permission_key: varchar(255) UNIQUE NOT NULL  -- 'vehicles.read', 'maintenance.write'
- permission_name: varchar(255) NOT NULL
- description: text
- resource: varchar(100)  -- 'vehicles', 'drivers', 'maintenance'
- action: varchar(50)  -- 'create', 'read', 'update', 'delete', 'approve'
- permission_category: varchar(100)
- is_system_permission: boolean DEFAULT true
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (permission_key)
- (resource, action)
```

### user_permissions
**Purpose:** Direct user permission overrides
```sql
- id: uuid PRIMARY KEY
- user_id: uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
- permission_id: uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE
- permission_type: varchar(20)  -- 'grant', 'deny'
- granted_by_user_id: uuid
- granted_at: timestamptz DEFAULT NOW()
- expires_at: timestamptz
- reason: text
UNIQUE (user_id, permission_id)
INDEXES:
- (user_id, permission_type)
- (permission_id)
```

### user_activity_log
**Purpose:** Comprehensive user activity auditing
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- user_id: uuid NOT NULL
- action_type: varchar(100) NOT NULL  -- 'login', 'logout', 'view', 'create', 'update', 'delete'
- resource_type: varchar(100)  -- 'vehicle', 'driver', 'work_order', 'document'
- resource_id: uuid
- action_details: jsonb
- ip_address: inet
- user_agent: text
- session_id: varchar(255)
- request_method: varchar(10)
- request_path: text
- response_status: integer
- duration_ms: integer
- occurred_at: timestamptz DEFAULT NOW()
INDEXES:
- (user_id, occurred_at DESC)
- (tenant_id, action_type, occurred_at DESC)
- (resource_type, resource_id, occurred_at DESC)
```

### api_tokens
**Purpose:** API authentication tokens
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- user_id: uuid REFERENCES users(id) ON DELETE CASCADE
- token_name: varchar(255) NOT NULL
- token_hash: varchar(255) UNIQUE NOT NULL  -- bcrypt hash of actual token
- token_prefix: varchar(20)  -- For display: "tok_abc123..."
- permissions: jsonb  -- Subset of permissions
- rate_limit: integer  -- Requests per hour
- allowed_ips: inet[]
- last_used_at: timestamptz
- usage_count: integer DEFAULT 0
- expires_at: timestamptz
- is_active: boolean DEFAULT true
- created_at: timestamptz DEFAULT NOW()
- revoked_at: timestamptz
- revoked_by_user_id: uuid
- revoked_reason: text
INDEXES:
- (token_hash)
- (user_id, is_active)
- (tenant_id, is_active)
```

---

## 10. INTEGRATION & EXTERNAL SYSTEMS (7 Tables Missing)

### microsoft_graph_sync
**Purpose:** Microsoft Graph API synchronization state
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- user_id: uuid NOT NULL REFERENCES users(id)
- sync_type: varchar(50)  -- 'calendar', 'email', 'teams', 'onedrive'
- resource_id: varchar(255)  -- Microsoft resource ID
- delta_token: text  -- For incremental sync
- last_sync_at: timestamptz
- next_sync_at: timestamptz
- sync_status: varchar(20)  -- 'success', 'failed', 'in_progress'
- error_message: text
- items_synced: integer
- items_failed: integer
- sync_duration_ms: integer
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (user_id, sync_type, last_sync_at DESC)
- (next_sync_at, sync_status)
```

### calendar_integrations
**Purpose:** External calendar sync configuration
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- user_id: uuid NOT NULL REFERENCES users(id)
- provider: varchar(50)  -- 'microsoft', 'google'
- calendar_id: varchar(255) NOT NULL
- calendar_name: varchar(500)
- is_primary: boolean DEFAULT false
- is_enabled: boolean DEFAULT true
- sync_direction: varchar(20)  -- 'one_way', 'two_way'
- sync_vehicle_reservations: boolean DEFAULT true
- sync_maintenance_appointments: boolean DEFAULT true
- sync_safety_meetings: boolean DEFAULT false
- last_sync_at: timestamptz
- sync_status: varchar(20)
- access_token_encrypted: text
- refresh_token_encrypted: text
- token_expires_at: timestamptz
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (user_id, provider, is_enabled)
- (last_sync_at, is_enabled)
```

### webhook_subscriptions
**Purpose:** Outgoing webhook subscriptions
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- webhook_name: varchar(255) NOT NULL
- endpoint_url: text NOT NULL
- event_types: text[]  -- ['vehicle.created', 'work_order.completed']
- http_method: varchar(10) DEFAULT 'POST'
- headers: jsonb  -- Custom HTTP headers
- secret_key: varchar(255)  -- For signature verification
- is_active: boolean DEFAULT true
- retry_on_failure: boolean DEFAULT true
- max_retries: integer DEFAULT 3
- timeout_seconds: integer DEFAULT 30
- last_triggered_at: timestamptz
- success_count: integer DEFAULT 0
- failure_count: integer DEFAULT 0
- created_by_user_id: uuid
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, is_active)
- (event_types)  -- GIN index for array
```

### webhook_deliveries
**Purpose:** Webhook delivery logs
```sql
- id: uuid PRIMARY KEY
- webhook_subscription_id: uuid NOT NULL REFERENCES webhook_subscriptions(id)
- event_type: varchar(100) NOT NULL
- event_id: uuid
- payload: jsonb
- request_headers: jsonb
- request_body: text
- response_status: integer
- response_headers: jsonb
- response_body: text
- delivery_attempt: integer DEFAULT 1
- delivery_status: varchar(20)  -- 'pending', 'success', 'failed', 'retrying'
- error_message: text
- duration_ms: integer
- triggered_at: timestamptz DEFAULT NOW()
- delivered_at: timestamptz
- next_retry_at: timestamptz
INDEXES:
- (webhook_subscription_id, triggered_at DESC)
- (delivery_status, next_retry_at)
```

### api_integrations
**Purpose:** Third-party API integration configs
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- integration_name: varchar(255) NOT NULL
- integration_type: varchar(100)  -- 'telematics', 'fuel_card', 'erp', 'accounting'
- provider: varchar(100)  -- 'geotab', 'samsara', 'wex', 'quickbooks', 'ariba'
- api_endpoint: text
- api_version: varchar(50)
- authentication_type: varchar(50)  -- 'oauth2', 'api_key', 'basic_auth'
- credentials_encrypted: text  -- Encrypted credentials
- is_active: boolean DEFAULT true
- sync_enabled: boolean DEFAULT true
- sync_frequency_minutes: integer DEFAULT 60
- last_sync_at: timestamptz
- next_sync_at: timestamptz
- sync_status: varchar(20)
- configuration: jsonb  -- Integration-specific config
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, provider, is_active)
- (next_sync_at, sync_enabled)
```

### integration_logs
**Purpose:** Integration activity and error logging
```sql
- id: uuid PRIMARY KEY
- integration_id: uuid NOT NULL REFERENCES api_integrations(id)
- log_type: varchar(50)  -- 'sync', 'push', 'pull', 'webhook', 'error'
- operation: varchar(100)
- records_processed: integer
- records_succeeded: integer
- records_failed: integer
- execution_time_ms: integer
- status: varchar(20)  -- 'success', 'partial', 'failed'
- error_details: jsonb
- log_data: jsonb
- occurred_at: timestamptz DEFAULT NOW()
INDEXES:
- (integration_id, occurred_at DESC)
- (status, occurred_at DESC)
```

### external_system_mappings
**Purpose:** Map internal IDs to external system IDs
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- integration_id: uuid NOT NULL REFERENCES api_integrations(id)
- entity_type: varchar(50) NOT NULL  -- 'vehicle', 'driver', 'work_order'
- internal_id: uuid NOT NULL
- external_id: varchar(255) NOT NULL
- external_system: varchar(100) NOT NULL  -- 'geotab', 'samsara', 'quickbooks'
- metadata: jsonb
- is_active: boolean DEFAULT true
- last_synced_at: timestamptz
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
UNIQUE (integration_id, entity_type, external_id)
INDEXES:
- (entity_type, internal_id, external_system)
- (integration_id, entity_type, is_active)
```

---

## 11. MISCELLANEOUS CRITICAL TABLES (8 Tables Missing)

### audit_trails
**Purpose:** System-wide audit logging for compliance
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- table_name: varchar(100) NOT NULL
- record_id: uuid NOT NULL
- operation: varchar(20) NOT NULL  -- 'INSERT', 'UPDATE', 'DELETE'
- old_values: jsonb
- new_values: jsonb
- changed_fields: text[]
- user_id: uuid
- ip_address: inet
- user_agent: text
- session_id: varchar(255)
- reason: text
- occurred_at: timestamptz DEFAULT NOW()
INDEXES:
- (table_name, record_id, occurred_at DESC)
- (user_id, occurred_at DESC)
- (tenant_id, occurred_at DESC)
```

### system_settings
**Purpose:** Application-level configuration
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid  -- NULL for global settings
- setting_key: varchar(255) UNIQUE NOT NULL
- setting_value: jsonb NOT NULL
- setting_type: varchar(50)  -- 'string', 'number', 'boolean', 'json'
- category: varchar(100)
- description: text
- is_public: boolean DEFAULT false  -- Visible to frontend
- is_encrypted: boolean DEFAULT false
- validation_rules: jsonb
- last_modified_by_user_id: uuid
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, setting_key)
- (category)
```

### feature_flags
**Purpose:** Feature toggles and A/B testing
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid  -- NULL for global flags
- flag_key: varchar(255) UNIQUE NOT NULL
- flag_name: varchar(255) NOT NULL
- description: text
- is_enabled: boolean DEFAULT false
- rollout_percentage: integer DEFAULT 0  -- 0-100
- target_users: uuid[]
- target_roles: text[]
- target_departments: text[]
- environment: varchar(50)  -- 'development', 'staging', 'production'
- created_by_user_id: uuid
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, is_enabled)
- (flag_key)
```

### import_jobs
**Purpose:** Bulk data import job tracking
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- import_type: varchar(100)  -- 'vehicles', 'drivers', 'fuel_transactions', 'maintenance'
- file_name: varchar(500)
- file_url: text
- file_size_bytes: bigint
- row_count: integer
- rows_processed: integer DEFAULT 0
- rows_succeeded: integer DEFAULT 0
- rows_failed: integer DEFAULT 0
- status: varchar(20)  -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
- error_log: jsonb  -- [{row, error, field}]
- validation_errors: jsonb
- import_parameters: jsonb
- started_at: timestamptz
- completed_at: timestamptz
- imported_by_user_id: uuid NOT NULL
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, status, created_at DESC)
- (imported_by_user_id, created_at DESC)
```

### export_jobs
**Purpose:** Data export job tracking
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- export_type: varchar(100)  -- 'vehicles', 'maintenance_history', 'fuel_analysis'
- export_format: varchar(20)  -- 'csv', 'excel', 'pdf', 'json'
- filters: jsonb
- columns: text[]
- row_count: integer
- file_url: text
- file_size_bytes: bigint
- expires_at: timestamptz
- status: varchar(20)  -- 'pending', 'processing', 'completed', 'failed', 'expired'
- error_message: text
- started_at: timestamptz
- completed_at: timestamptz
- requested_by_user_id: uuid NOT NULL
- created_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, status, created_at DESC)
- (requested_by_user_id, created_at DESC)
- (expires_at)
```

### scheduled_jobs
**Purpose:** Background job scheduler
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid
- job_name: varchar(255) NOT NULL
- job_type: varchar(100) NOT NULL  -- 'report', 'sync', 'cleanup', 'notification'
- job_handler: varchar(255) NOT NULL  -- Function/class to execute
- job_parameters: jsonb
- schedule_type: varchar(50)  -- 'cron', 'interval', 'one_time'
- cron_expression: varchar(100)
- interval_minutes: integer
- scheduled_time: timestamptz
- last_run_at: timestamptz
- last_run_status: varchar(20)
- last_run_duration_ms: integer
- next_run_at: timestamptz
- is_active: boolean DEFAULT true
- retry_on_failure: boolean DEFAULT true
- max_retries: integer DEFAULT 3
- failure_count: integer DEFAULT 0
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (next_run_at, is_active)
- (tenant_id, job_type, is_active)
```

### job_execution_history
**Purpose:** Job execution audit trail
```sql
- id: uuid PRIMARY KEY
- scheduled_job_id: uuid REFERENCES scheduled_jobs(id)
- execution_status: varchar(20)  -- 'success', 'failed', 'timeout'
- started_at: timestamptz NOT NULL
- completed_at: timestamptz
- duration_ms: integer
- records_processed: integer
- error_message: text
- error_stack_trace: text
- output_data: jsonb
- retry_attempt: integer DEFAULT 0
INDEXES:
- (scheduled_job_id, started_at DESC)
- (execution_status, started_at DESC)
```

### data_retention_policies
**Purpose:** Automated data lifecycle management
```sql
- id: uuid PRIMARY KEY
- tenant_id: uuid NOT NULL
- policy_name: varchar(255) NOT NULL
- table_name: varchar(100) NOT NULL
- retention_days: integer NOT NULL
- archive_before_delete: boolean DEFAULT true
- archive_storage_location: text
- delete_condition: jsonb  -- Additional SQL WHERE conditions
- is_active: boolean DEFAULT true
- last_executed_at: timestamptz
- records_archived: bigint DEFAULT 0
- records_deleted: bigint DEFAULT 0
- created_at: timestamptz DEFAULT NOW()
- updated_at: timestamptz DEFAULT NOW()
INDEXES:
- (tenant_id, table_name, is_active)
```

---

## Summary Statistics

### Tables by Category
| Category | Current Tables | Missing Tables | Total Needed |
|----------|---------------|----------------|--------------|
| Core Fleet Operations | 8 | 0 | 8 |
| Telematics & GPS | 0 | 12 | 12 |
| Document Management | 0 | 8 | 8 |
| Financial & Accounting | 0 | 10 | 10 |
| Work Orders & Scheduling | 1 | 6 | 7 |
| Communication & Notifications | 0 | 7 | 7 |
| Safety & Compliance | 1 | 8 | 9 |
| Asset Management & 3D | 1 | 5 | 6 |
| Reporting & Analytics | 0 | 6 | 6 |
| User Management & RBAC | 2 | 6 | 8 |
| Integrations | 0 | 7 | 7 |
| System/Miscellaneous | 2 | 8 | 10 |
| Policy/Training/SOP | 14 | 0 | 14 |
| **TOTAL** | **29** | **83** | **112** |

---

## Next Steps

1. **Review and Prioritize** - Determine which missing tables are critical path
2. **Generate SQL Migrations** - Create numbered migration files for each table
3. **Update API Layer** - Implement CRUD endpoints for new tables
4. **Update TypeScript Types** - Ensure type safety throughout application
5. **Implement Business Logic** - Wire up services and controllers
6. **Testing** - Unit and integration tests for new data models
7. **Documentation** - API docs and database ER diagrams

**Estimated Development Effort:** 3-4 sprints (6-8 weeks) with 2-3 developers
