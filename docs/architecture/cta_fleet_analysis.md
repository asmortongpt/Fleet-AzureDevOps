# CTAFleet System Comprehensive Analysis

## Executive Summary

CTAFleet is an **enterprise-grade fleet management system** with 89 database tables organized into 20 logical groups. The architecture implements a **multi-tenant SaaS model** with real-time telematics, AI/ML capabilities, advanced compliance monitoring, and comprehensive financial tracking. The system uses React/TypeScript frontend with Node.js/Express backend, PostgreSQL database, and Redis caching.

**Tech Stack:**
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS v4, shadcn/ui, TanStack Query, React Router, Recharts
- **Backend**: Express.js, PostgreSQL 14+, node-pg, ioredis
- **Infrastructure**: Docker, Azure (AD, Key Vault, Blob Storage, Application Insights), Sentry
- **Real-time**: WebSocket connections for live telemetry
- **AI/ML**: Cognition engine, predictions registry, embeddings for RAG

---

## 1. DATABASE SCHEMA & DATA RELATIONSHIPS

### 1.1 Core Fleet Management (6 tables)

**Purpose**: Essential entities for multi-tenant fleet operations

| Table | Purpose | Key Fields | Relationships |
|-------|---------|-----------|-----------------|
| `tenants` | Organization isolation | id, name, domain, settings, is_active | 1:Many with all tables (multi-tenant) |
| `users` | Authentication & authorization | id, email, role, mfa_enabled, tenant_id | Belongs to tenant; has 1:1 driver or admin role |
| `vehicles` | Core vehicle inventory | id, vin, make, model, year, license_plate, status, location (GEOGRAPHY), odometer, assigned_driver_id | Tenant-scoped; FK to assigned_driver (users) |
| `drivers` | Driver profiles & licensing | id, user_id, license_number, cdl_class, medical_card_expiration, safety_score | 1:1 with users; 1:Many trips/assignments |
| `facilities` | Garages, depots, service centers | id, name, facility_type, location (GEOGRAPHY), capacity | Tenant-scoped; related to vehicle assignments |
| `vendors` | Parts suppliers, fuel providers | id, vendor_name, vendor_type, contact_info | Tenant-scoped; related to work orders, purchases |

**Key Relationships:**
```
tenants (1:M) ──→ users, vehicles, drivers, facilities, vendors
vehicles ──→ users (assigned_driver_id) [assignment]
drivers ──→ users (1:1 user_id) [identity link]
vehicles ──→ facilities (assigned_facility_id) [depot assignment]
```

**Row-Level Security (RLS)**: All tables have tenant isolation via `tenant_id` column with policies enforcing `auth.uid() = tenant_id`.

---

### 1.2 Telematics & Tracking (6 tables)

**Purpose**: GPS, OBD-II diagnostics, vehicle behavior analysis

| Table | Purpose | Key Fields | Update Frequency |
|-------|---------|-----------|------------------|
| `vehicle_locations` | Real-time GPS history | id, vehicle_id, latitude, longitude, altitude, speed, heading, recorded_at | High-frequency (every 5-30 seconds) |
| `obd_telemetry` | OBD-II diagnostics | id, vehicle_id, rpm, fuel_level, coolant_temp, dtc_codes, battery_voltage | 1-10 Hz depending on device |
| `telemetry_data` | Unified telematics | id, vehicle_id, speed, fuel_level, engine_hours, harsh_braking, harsh_acceleration, speeding | 1-10 Hz |
| `driver_behavior_events` | Safety-related events | id, vehicle_id, driver_id, event_type (harsh_braking, speeding, etc), timestamp | Event-triggered |
| `video_telematics_footage` | Dashcam/telematics video | id, vehicle_id, video_url, event_type, timestamp | Event-triggered |
| `trips` | Trip tracking | id, vehicle_id, driver_id, start_time, end_time, distance, route | Per-trip |

**Data Flow:**
```
GPS Device/OBD2 Device 
    ↓
WebSocket/MQTT Ingestion
    ↓
vehicle_locations, obd_telemetry, telemetry_data (INSERT)
    ↓
Aggregation Service (driver_behavior_events, predictions)
    ↓
Real-time Push to Frontend (WebSocket)
```

**Indexing Strategy:**
- `idx_vehicle_locations_vehicle_time` for recent location queries
- `idx_vehicle_locations_geospatial` for proximity searches
- `idx_telemetry_data_vehicle_timestamp` for time-series range queries
- NOTE: Consider TimescaleDB hypertables for time-series optimization

---

### 1.3 Geolocation & Route Optimization (8 tables)

**Purpose**: Route planning, geofencing, delivery optimization

| Table | Purpose | Key Fields | Notable Features |
|-------|---------|-----------|------------------|
| `routes` | Route definitions | id, vehicle_id, driver_id, status (planned/in_progress/completed), geometry | Planned vs actual route comparison |
| `route_stops` | Delivery/pickup points | id, route_id, sequence, location, arrival_time, departure_time | Sequential ordering |
| `route_waypoints` | Route path nodes | id, route_id, latitude, longitude, sequence | GPS path definition |
| `geofences` | Virtual boundaries | id, name, geometry (POLYGON), alert_on_entry, alert_on_exit | Used for alerts & compliance |
| `geofence_events` | Boundary crossings | id, geofence_id, vehicle_id, event_type (entry/exit), timestamp | Audit trail |
| `route_optimization_jobs` | Optimization tasks | id, status, vehicle_count, total_distance, optimization_duration_ms | Background job tracking |
| `optimized_routes` | Optimized route results | id, optimization_job_id, route_id, original_distance, optimized_distance | Comparison metrics |
| `route_performance_metrics` | Route KPIs | id, route_id, on_time_delivery_count, fuel_efficiency, driver_efficiency | Analytics |

**PostGIS Integration:**
- `location GEOGRAPHY(POINT, 4326)` for lat/lng points
- `geometry GEOGRAPHY(POLYGON, 4326)` for geofence boundaries
- Enables spatial queries: `ST_DWithin()`, `ST_Contains()`, distance calculations

---

### 1.4 Maintenance & Operations (4 tables)

**Purpose**: Work order management, maintenance scheduling, service history

| Table | Purpose | Key Fields | Business Logic |
|-------|---------|-----------|-----------------|
| `work_orders` | Maintenance tasks | id, vehicle_id, type, status, assigned_technician_id, odometer_reading, labor_hours, parts_cost | Cost tracking; status workflow |
| `maintenance_schedules` | PM schedules | id, vehicle_id, schedule_type, interval_type (miles/hours/calendar), next_due_date | Preventive maintenance planning |
| `asset_maintenance` | Equipment maintenance | id, asset_id, maintenance_type, last_performed, next_due | Asset-level tracking |
| `service_history` | Complete service log | id, vehicle_id, service_date, service_type, technician_id, cost, notes | Immutable history |

**Relationships & Cost Calculation:**
```
vehicles (1:M) ──→ work_orders
work_orders:
  - labor_cost + parts_cost = total_cost (GENERATED ALWAYS AS)
  - Requires: odometer_reading, labor_hours tracking
  - Status workflow: open → in_progress → completed → closed

vehicles (1:M) ──→ maintenance_schedules
  - Interval types: MILES, HOURS, CALENDAR_DAYS
  - Triggers: When vehicle.odometer >= schedule.next_due_distance
```

---

### 1.5 Asset Management (5 tables)

**Purpose**: Track non-vehicle assets (tools, equipment, mobile devices)

| Table | Purpose | Key Fields | Lifecycle |
|-------|---------|-----------|-----------|
| `assets` | Asset inventory | id, asset_tag (unique barcode), asset_type, serial_number, purchase_price, current_value, condition, warranty_expiration | Full lifecycle tracking |
| `asset_assignments` | Asset-to-user mapping | id, asset_id, assigned_to (user_id), assignment_date, return_date | Checkout/checkin system |
| `asset_transfers` | Asset movement history | id, asset_id, from_user_id, to_user_id, transfer_date, reason | Audit trail |
| `asset_audit_log` | Immutable audit | id, asset_id, action, performed_by, timestamp | Compliance log |
| `asset_tags` | Category/labeling | id, asset_id, tag_name | Flexible tagging |

**QR Code Integration:**
- `assets.qr_code` enables mobile app scanning for checkout/checkin
- Mobile endpoints: POST `/mobile-assignment` for field operations

---

### 1.6 Financial & Accounting (11 tables)

**Purpose**: Expenses, invoicing, cost allocation, depreciation

| Table | Purpose | Key Fields | Business Purpose |
|-------|---------|-----------|------------------|
| `expenses` | Employee expense tracking | id, expense_type, amount, tax_amount, reimbursement_status | Reimbursement workflow |
| `invoices` | Vendor invoices | id, vendor_id, amount, due_date, payment_status | AP workflow |
| `purchase_orders` | PO management | id, vendor_id, status, total_amount | Procurement |
| `fuel_cards` | Fleet fuel card accounts | id, fuel_card_number, account_balance, card_status | Fleet fuel program |
| `fuel_card_transactions` | Card transaction log | id, fuel_card_id, transaction_date, amount, fuel_quantity | Reconciliation |
| `payment_methods` | Payment options | id, payment_type, is_active | Configuration |
| `budget_allocations` | Department budgets | id, department, budget_type, allocated_amount, spent_amount | Budget control |
| `cost_allocations` | Cost assignment | id, vehicle_id, cost_type, amount, allocation_date | Cost center accounting |
| `depreciation_schedules` | Asset depreciation | id, asset_id, method (straight_line/declining), useful_life_years, salvage_value | Accounting |
| `depreciation_entries` | Monthly depreciation | id, schedule_id, period, depreciation_amount, book_value | Monthly entries |
| `cost_tracking` | Consolidated costs | id, vehicle_id, cost_category, amount, tracked_date | Analytics |

**Cost Calculation Examples:**
```
vehicle.total_maintenance_cost = SUM(work_orders.total_cost) for vehicle
vehicle.total_fuel_cost = SUM(fuel_transactions.total_cost) for vehicle
vehicle.cost_per_mile = vehicle.total_cost / vehicle.mileage
vehicle.book_value = purchase_price - SUM(depreciation_entries.depreciation_amount)
```

---

### 1.7 Fuel Management (9 tables)

**Purpose**: Fuel transactions, station management, price tracking, contracts

| Table | Purpose | Key Fields | Integration |
|-------|---------|-----------|--------------|
| `fuel_transactions` | Fuel purchases | id, vehicle_id, gallons, price_per_gallon, total_cost (GENERATED), odometer_reading | Direct from telematics |
| `fuel_stations` | Station directory | id, station_name, brand, location (GEOGRAPHY), fuel_types[], accepts_fleet_cards | Location-based queries |
| `fuel_prices` | Historical pricing | id, station_id, fuel_type, price, effective_date | Price trend analysis |
| `fuel_purchase_orders` | Bulk fuel POs | id, vendor_id, quantity, unit_price, delivery_date | Supply chain |
| `fuel_contracts` | Vendor contracts | id, vendor_id, contract_terms, pricing_structure, term_start, term_end | Procurement |
| `fuel_price_alerts` | Price monitoring | id, station_id, fuel_type, alert_price, alert_when | Alert rules |
| `bulk_fuel_inventory` | On-site fuel storage | id, facility_id, fuel_type, quantity, capacity, last_refill | Inventory tracking |
| `fuel_price_forecasts` | Predictive pricing | id, fuel_type, predicted_price, confidence_score, forecast_date | ML predictions |
| `fuel_savings_analytics` | Cost savings tracking | id, scenario_id, baseline_cost, optimized_cost, potential_savings | What-if analysis |

**Analytics Workflow:**
```
Vehicle refueling
  ↓
fuel_transactions INSERT
  ↓
Calculate MPG: vehicle.mileage_delta / gallons
  ↓
Compare to historical_avg_mpg
  ↓
IF mpg < threshold: trigger alert
  ↓
fuel_price_alerts trigger cost optimization
```

---

### 1.8 Documents & Knowledge Management (10 tables)

**Purpose**: Document storage, versioning, RAG (Retrieval-Augmented Generation)

| Table | Purpose | Key Fields | AI/ML Integration |
|-------|---------|-----------|------------------|
| `documents` | Document metadata | id, file_name, file_type, file_size, extracted_text, ocr_status, embedding_status | Source for RAG |
| `document_categories` | Content organization | id, name, description | Taxonomy |
| `document_versions` | Version control | id, document_id, version_number, file_url, created_by, upload_date | Audit trail |
| `document_access_log` | Access audit | id, document_id, user_id, access_type, timestamp | Compliance |
| `document_permissions` | ACL | id, document_id, user_id/role_id, permission_type | Fine-grained access |
| `document_embeddings` | Vector embeddings | id, document_id, chunk_text, embedding (vector(1536)), chunk_index, page_number | Semantic search |
| `document_rag_queries` | RAG history | id, query, matched_documents, retrieved_chunks, confidence_score, result_used | ML feedback |
| `document_relationships` | Links between docs | id, source_doc_id, target_doc_id, relationship_type | Knowledge graph |
| `document_comments` | Annotations | id, document_id, user_id, comment_text, created_at | Collaboration |
| `document_folders` | Folder structure | id, parent_folder_id, folder_name, is_archived | Hierarchy |

**RAG Pipeline:**
```
PDF/Document Upload
  ↓
OCR Processing (ocr_status = 'processing' → 'completed')
  ↓
Text Chunking (create document_embeddings rows)
  ↓
Generate Embeddings via Claude API (1536-dim vectors)
  ↓
Store in document_embeddings.embedding (pgvector)
  ↓
Semantic Search: SELECT ... WHERE embedding <-> query_embedding < threshold
  ↓
Returned to AI agents for context
```

**Vector Index:**
```sql
CREATE INDEX ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops)
```

---

### 1.9 Operations & Tasks (10 tables)

**Purpose**: Task management, incident tracking, workflow automation

| Table | Purpose | Key Fields | Workflow |
|-------|---------|-----------|----------|
| `tasks` | Work items | id, task_title, status (pending/in_progress/completed), assigned_to, due_date, priority | CRUD operations |
| `task_comments` | Task discussion | id, task_id, user_id, comment_text, created_at | Collaboration |
| `task_time_entries` | Time tracking | id, task_id, user_id, hours_logged, date | Billing/analytics |
| `task_checklist_items` | Task subtasks | id, task_id, item_text, is_completed, order | Granular tracking |
| `task_attachments` | File attachments | id, task_id, file_url, uploaded_by, upload_date | Documents |
| `incidents` | Safety/operational incidents | id, incident_type, severity, vehicle_id, driver_id, reported_by, root_cause | Investigation workflow |
| `incident_actions` | Corrective actions | id, incident_id, action_description, assigned_to, due_date, status | Follow-up |
| `incident_timeline` | Event sequence | id, incident_id, event_description, timestamp, created_by | Narrative building |
| `incident_witnesses` | Witness tracking | id, incident_id, witness_name, contact_info, statement | Documentation |
| `incident_photos` | Incident images | id, incident_id, photo_url, uploaded_by, upload_date | Evidence |

**Incident Workflow:**
```
Safety Event Occurs
  ↓
Driver/Manager Reports → incidents INSERT
  ↓
Investigation Phase (status = 'open')
  ↓
Documents Added (incident_photos, incident_timeline)
  ↓
Root Cause Analysis → root_cause field
  ↓
Corrective Actions → incident_actions rows
  ↓
Verification Complete → status = 'closed'
```

---

### 1.10 Safety & Compliance (5 tables)

**Purpose**: Safety incidents, vehicle inspections, damage reports

| Table | Purpose | Key Fields | Compliance |
|-------|---------|-----------|-----------|
| `safety_incidents` | Safety events | id, incident_type, severity, vehicle_id, injured_count, property_damage, investigation_status | DOT/OSHA tracking |
| `inspections` | Vehicle pre-trip/post-trip | id, vehicle_id, inspection_date, inspector_id, status (pass/fail/warning) | Regulatory requirement |
| `inspection_forms` | Inspection templates | id, form_name, questions[], form_version | Dynamic forms |
| `damage_reports` | Vehicle damage | id, vehicle_id, damage_date, severity, description, estimated_repair_cost, photos[] | Insurance tracking |
| `video_events` | Dashcam events | id, vehicle_id, event_type (crash_detected, harsh_braking, etc), video_url, timestamp | Evidence |

---

### 1.11 Analytics & Reporting (12 tables)

**Purpose**: Custom reports, dashboards, performance metrics

| Table | Purpose | Key Fields | Use Case |
|-------|---------|-----------|----------|
| `custom_reports` | Report definitions | id, report_name, data_sources[], filters, columns (JSONB), is_public | Drag-and-drop builder |
| `report_schedules` | Automated reports | id, report_id, schedule_type (daily/weekly/monthly), recipients[] | Scheduled delivery |
| `report_executions` | Report run history | id, report_id, executed_by, execution_time, row_count, file_url, status | Audit trail |
| `report_templates` | Pre-built templates | id, template_name, data_sources[], description | Reusable patterns |
| `report_shares` | Report sharing | id, report_id, shared_with_user_id, shared_at | Collaboration |
| `report_favorites` | User preferences | id, report_id, user_id, favorited_at | UX enhancement |
| `driver_scores` | Driver performance | id, driver_id, safety_score, efficiency_score, compliance_score, overall_score, period_start, period_end | Gamification/incentives |
| `driver_achievements` | Driver milestones | id, driver_id, achievement_type, earned_date, milestone_value | Morale |
| `utilization_metrics` | Vehicle efficiency | id, vehicle_id, active_hours, idle_hours, utilization_rate, cost_per_mile, period | KPI tracking |
| `fleet_optimization_recommendations` | AI suggestions | id, recommendation_type, affected_entities, estimated_savings, confidence_score, created_by_model | ML insights |

---

### 1.12 AI/ML Infrastructure (13 tables)

**Purpose**: Machine learning model management, predictions, AI cognition

| Table | Purpose | Key Fields | ML Pipeline |
|-------|---------|-----------|-----------|
| `ml_models` | Model registry | id, model_name, model_type (predictive/classification/ranking), version, framework (PyTorch/TensorFlow), is_active, deployed_at | A/B testing capable |
| `model_performance` | Accuracy tracking | id, model_id, metric_name (accuracy/precision/recall/f1), metric_value, evaluation_date | Model monitoring |
| `training_jobs` | Training runs | id, model_id, training_data_size, training_duration_seconds, status (running/completed/failed) | Experiment tracking |
| `model_ab_tests` | A/B test campaigns | id, model_a_id, model_b_id, test_duration, winner_id, performance_delta | Model comparison |
| `predictions` | Model outputs | id, model_id, entity_type, entity_id, prediction_value, confidence_score, actual_outcome, is_correct | Feedback loop |
| `feedback_loops` | Ground truth | id, prediction_id, actual_value, feedback_date, user_feedback | Model improvement |
| `embedding_vectors` | Vector embeddings | id, entity_type, entity_id, embedding (vector), model_id, created_at | Similarity searches |
| `rag_queries` | RAG interactions | id, query_text, retrieved_documents, answer_generated, user_feedback | LLM fine-tuning |
| `cognition_insights` | AI-generated insights | id, insight_type (maintenance_prediction/cost_optimization/safety_alert), severity, title, description, confidence_score, recommended_actions | Actionable AI |
| `detected_patterns` | Anomaly detection | id, pattern_type, affected_entities, pattern_description, severity, first_detected, last_detected | Proactive alerting |
| `anomalies` | Outlier tracking | id, anomaly_type, entity_type, entity_id, anomaly_score, context_data | Quality assurance |
| `mcp_servers` | MCP connections | id, server_name, server_type, connection_url, is_active, connection_status | Tool integration |
| `mcp_tool_executions` | MCP tool logs | id, mcp_server_id, tool_name, parameters, execution_result, execution_time_ms | Tool usage analytics |

**ML Workflow Example: Maintenance Prediction**
```
Historical Data
  ↓
Feature Engineering (failure patterns, age, mileage, DTC codes)
  ↓
Train Model (ml_models: model_type='predictive')
  ↓
Deploy to Production (is_active=true, deployed_at=NOW())
  ↓
New Telemetry Arrives
  ↓
Run Inference → predictions INSERT
  ↓
IF confidence_score > 0.85:
    → cognition_insights INSERT (maintenance recommendation)
    → Send alert to fleet manager
  ↓
Wait for actual maintenance outcome
  ↓
INSERT INTO feedback_loops (prediction_id, actual_value=maintenance_needed)
  ↓
Model retraining triggered
```

---

### 1.13 Security & Authentication (15 tables)

**Purpose**: User authentication, audit logging, access control

| Table | Purpose | Key Fields | Security |
|-------|---------|-----------|----------|
| `configuration_settings` | System config | id, setting_name, setting_value, is_encrypted | Environment-specific |
| `configuration_versions` | Config history | id, setting_id, version_number, changed_by, change_date | Rollback capability |
| `configuration_approvals` | Change approval | id, setting_id, changed_by, approved_by, status | 4-eyes principle |
| `mfa_tokens` | MFA codes | id, user_id, token_hash, is_used, created_at, expires_at | TOTP/SMS |
| `session_tokens` | Session management | id, user_id, token_hash, created_at, expires_at, last_activity | Session tracking |
| `revoked_tokens` | Token blacklist | id, token_hash, revoked_at, revocation_reason | Logout enforcement |
| `api_keys` | API authentication | id, user_id, key_hash, key_name, is_active, last_used | API access |
| `encryption_keys` | Key management | id, key_name, key_version, algorithm (AES-256), key_material_encrypted, status | Key rotation |
| `audit_logs` | Immutable audit trail | id (BIGSERIAL), user_id, action, resource_type, resource_id, request_method, response_status, ip_address, correlation_id | Compliance |
| `audit_log_digests` | Log summaries | id, date_range, digest_hash, entry_count | Tamper detection |
| `security_events` | Security alerts | id, event_type, severity, user_id, description, ip_address, timestamp | Incident response |
| `rate_limits` | API rate limiting | id, endpoint_path, user_id/ip_address, request_count, reset_time | DDoS protection |
| `blocked_entities` | Blacklist | id, entity_type (user/ip/email), entity_value, blocked_at, reason | Access control |
| `data_classifications` | Data sensitivity | id, resource_type, classification_level (public/internal/sensitive/confidential), retention_days | Data governance |
| `data_access_logs` | PII access tracking | id, accessed_by, resource_id, access_type, accessed_at | GDPR/compliance |

**Audit Logging:**
- **Partitioned by month** for performance: `PARTITION BY RANGE (event_timestamp)`
- **Immutable design**: Triggers prevent UPDATE/DELETE
- **Correlation IDs**: Link related requests across services
- **Example flow**:
  ```sql
  INSERT INTO audit_logs (
    user_id, action, resource_type, resource_id, 
    request_method, request_path, response_status, 
    ip_address, execution_time_ms, correlation_id
  ) VALUES (...)
  ```

---

### 1.14 Communications & Notifications (9 tables)

**Purpose**: Alerts, messages, notification delivery

| Table | Purpose | Key Fields | Delivery Method |
|-------|---------|-----------|-----------------|
| `notifications` | User notifications | id, user_id, notification_type, title, message, link, is_read, priority | In-app, push, email |
| `notification_preferences` | User settings | id, user_id, notification_type, channel (in_app/push/email), is_enabled | User-controlled |
| `messages` | Direct messages | id, from_user_id, to_user_id, message_text, is_read | Chat feature |
| `alert_rules` | Alert conditions | id, alert_type, condition (JSON), recipients, is_active | Rule engine |
| `alerts` | Alert instances | id, alert_rule_id, triggered_at, alert_data, severity | Real-time events |
| `alert_delivery_log` | Delivery tracking | id, alert_id, channel, recipient, status (sent/failed/bounced), delivery_time | SLA tracking |
| `alert_escalations` | Escalation chains | id, alert_id, escalation_level, escalated_to_user_id, escalated_at | On-call management |
| `alert_history` | Historical alerts | id, alert_id, timestamp, change_description | Audit trail |
| `communication_logs` | All communications | id, communication_type, from_entity, to_entity, timestamp, message, status | Comprehensive log |

**Alert Example: Harsh Braking Detected**
```
OBD Telemetry: harsh_braking = true
  ↓
Backend processes telemetry
  ↓
Check alert_rules WHERE alert_type = 'harsh_braking_detected'
  ↓
Evaluate condition: IF braking_g_force > 0.8
  ↓
IF TRUE: alerts INSERT + driver_behavior_events INSERT
  ↓
Get alert_rule.recipients → notification_preferences
  ↓
Send via preferred channels: email, SMS, in-app push
  ↓
Track in alert_delivery_log
```

---

### 1.15 Integrations (5 tables)

**Purpose**: Third-party service synchronization

| Table | Purpose | Key Fields | Sync Type |
|-------|---------|-----------|----------|
| `webhook_subscriptions` | Webhook registrations | id, event_type, target_url, secret, is_active | Outbound webhooks |
| `microsoft_graph_sync` | Teams/Outlook sync | id, user_id, sync_type, last_sync_time, sync_status | Microsoft 365 integration |
| `calendar_integrations` | Calendar events | id, user_id, external_calendar_id, event_mapping | Scheduling |
| `teams_integration_messages` | Teams messages | id, message_id, channel_id, message_content, timestamp | Chat notifications |
| `outlook_emails` | Email sync | id, email_address, message_id, subject, received_date | Email integration |

---

### 1.16 Search & Indexing (7 tables)

**Purpose**: Full-text search, query optimization

| Table | Purpose | Key Fields | Search Type |
|-------|---------|-----------|-----------|
| `search_query_log` | Search history | id, user_id, query_text, results_count, execution_time_ms | Analytics |
| `indexing_jobs` | Index maintenance | id, entity_type, status (queued/running/completed/failed) | Background jobs |
| `document_indexing_log` | Document search index | id, document_id, indexed_at, token_count, full_text | Full-text search |
| `tenant_index_stats` | Per-tenant stats | id, tenant_id, total_indexed_documents, index_size_bytes, last_updated | Monitoring |
| `search_history` | User searches | id, user_id, search_query, entity_type, timestamp | UX analytics |
| `saved_searches` | Saved queries | id, user_id, search_name, query_definition, is_public, created_at | Bookmarks |
| `search_click_tracking` | Search result clicks | id, search_query, clicked_entity_id, clicked_entity_type, rank_position, timestamp | Click-through analysis |

---

### 1.17 Policies & Governance (2 tables)

**Purpose**: Business rule enforcement

| Table | Purpose | Key Fields | Rule Types |
|-------|---------|-----------|-----------|
| `policies` | Policy definitions | id, policy_name, policy_type (safety/fuel/usage), rules (JSONB), is_active, server_side_enforcement | Versioned rules |
| `policy_violations` | Violation tracking | id, policy_id, vehicle_id/driver_id, violation_date, violation_severity, remediation_status | Compliance tracking |

**Example Policy (JSONB):**
```json
{
  "name": "Max Daily Driving Hours",
  "type": "driver_safety",
  "rules": {
    "max_driving_hours_per_day": 10,
    "required_break_minutes": 30,
    "alert_at_hours": 9.5
  },
  "enforcement": "server_side",
  "applicable_roles": ["driver"],
  "consequences": ["alert", "disable_vehicle", "notify_manager"]
}
```

---

### 1.18 Master Data Management (4 tables)

**Purpose**: Reference data governance

| Table | Purpose | Key Fields | Purpose |
|-------|---------|-----------|---------|
| `mdm_people` | Master people records | id, name, email, phone, role | Consolidate duplicate users |
| `mdm_places` | Master locations | id, location_name, lat, lng, location_type | Geography master |
| `mdm_things` | Master assets | id, asset_name, asset_type, category, manufacturer | Asset master |
| `mdm_audit_log` | MDM changes | id, entity_type, entity_id, change_description, changed_by | Change tracking |

---

## 2. API ARCHITECTURE

### 2.1 Endpoint Organization

**179 API routes** organized into logical modules:

```
/api/
├── /auth/                          # Authentication & SSO
│   ├── POST /login
│   ├── POST /logout
│   ├── POST /refresh-token
│   ├── GET /me (current user)
│   ├── POST /mfa-setup
│   ├── POST /microsoft-login
│   └── POST /csrf-token
├── /vehicles/                      # Fleet Management
│   ├── GET / (list all vehicles)
│   ├── GET /:id (get vehicle detail)
│   ├── POST / (create vehicle)
│   ├── PUT /:id (update vehicle)
│   ├── DELETE /:id
│   ├── GET /:id/telemetry (real-time data)
│   ├── GET /:id/history (location history)
│   ├── GET /:id/maintenance (service records)
│   └── POST /:id/assignments (assign driver)
├── /drivers/                       # Driver Management
│   ├── GET / (list drivers)
│   ├── GET /:id (driver profile)
│   ├── POST / (hire driver)
│   ├── PUT /:id (update driver)
│   ├── GET /:id/scores (safety score)
│   ├── GET /:id/incidents (safety record)
│   └── GET /:id/trips (trip history)
├── /telematics/                    # Real-time Vehicle Data
│   ├── GET /location/:vehicle-id (current location)
│   ├── GET /history/:vehicle-id (GPS trail)
│   ├── GET /obd/:vehicle-id (OBD-II diagnostics)
│   ├── WebSocket /live (stream live updates)
│   └── POST /geofence-breach (alert hook)
├── /maintenance/                   # Work Order Management
│   ├── GET / (list work orders)
│   ├── POST / (create work order)
│   ├── GET /:id (WO detail)
│   ├── PUT /:id (update status)
│   ├── GET /schedules (PM schedules)
│   └── POST /schedules (create schedule)
├── /fuel/                          # Fuel Management
│   ├── GET /transactions (fuel purchases)
│   ├── POST /transactions (log fuel purchase)
│   ├── GET /stations (nearby stations)
│   ├── GET /prices (price history)
│   ├── GET /analytics (fuel efficiency)
│   └── POST /alerts (price alert rules)
├── /routes/                        # Route Optimization
│   ├── GET / (list routes)
│   ├── POST / (create route)
│   ├── POST /:id/optimize (run optimization)
│   ├── GET /:id/performance (KPIs)
│   └── POST /:id/stops (add delivery stops)
├── /compliance/                    # Compliance Monitoring
│   ├── GET /status (fleet compliance)
│   ├── GET /inspections (vehicle inspections)
│   ├── POST /inspections (create inspection)
│   ├── GET /incidents (safety incidents)
│   ├── POST /incidents (report incident)
│   └── GET /violations (policy violations)
├── /documents/                     # Document Management & RAG
│   ├── POST / (upload document)
│   ├── GET / (list documents)
│   ├── GET /:id (download document)
│   ├── POST /search (semantic search via RAG)
│   ├── POST /:id/embeddings (generate embeddings)
│   └── DELETE /:id (soft delete)
├── /ai/                            # AI/ML Endpoints
│   ├── POST /predict (run model prediction)
│   ├── POST /chat (AI assistant chat)
│   ├── GET /insights (cognition engine insights)
│   ├── POST /damage-detection (analyze vehicle damage from image)
│   ├── POST /dispatch (AI-powered dispatch)
│   └── POST /rag-search (semantic document search)
├── /reports/                       # Reporting & Analytics
│   ├── GET / (list custom reports)
│   ├── POST / (create report definition)
│   ├── POST /:id/execute (run report)
│   ├── GET /templates (report templates)
│   └── GET /:id/download (export report)
├── /analytics/                     # Fleet Analytics
│   ├── GET /dashboard (executive dashboard)
│   ├── GET /utilization (vehicle utilization)
│   ├── GET /driver-scores (driver performance)
│   ├── GET /cost-analysis (fleet cost breakdown)
│   └── GET /fuel-efficiency (MPG trends)
├── /admin/                         # Administration
│   ├── GET /users (manage users)
│   ├── POST /users (create user)
│   ├── PUT /users/:id (update user)
│   ├── POST /users/:id/roles (assign roles)
│   ├── GET /tenants (multi-tenant management)
│   └── POST /audit-logs (view audit trail)
├── /assets/                        # Asset Management
│   ├── GET / (list assets)
│   ├── POST / (add asset)
│   ├── GET /:id (asset detail)
│   ├── POST /:id/checkout (checkout asset)
│   ├── POST /:id/checkin (checkin asset)
│   └── GET /:id/history (asset movement history)
├── /tasks/                         # Task Management
│   ├── GET / (list tasks)
│   ├── POST / (create task)
│   ├── PUT /:id (update task)
│   ├── POST /:id/comments (add comment)
│   ├── POST /:id/time-entries (log time)
│   └── DELETE /:id (delete task)
├── /webhooks/                      # Webhook Management
│   ├── GET / (list subscriptions)
│   ├── POST / (subscribe to event)
│   ├── DELETE /:id (unsubscribe)
│   ├── POST /test (test webhook)
│   └── GET /logs (delivery logs)
├── /health/                        # Health Checks
│   ├── GET / (basic health)
│   ├── GET /detailed (component status)
│   ├── GET /readiness (startup readiness)
│   └── GET /liveness (live status)
└── /monitoring/                    # System Monitoring
    ├── GET /metrics (Prometheus metrics)
    ├── GET /performance (API latency)
    ├── GET /errors (error rate)
    └── GET /traffic (traffic analysis)
```

### 2.2 Authentication & Authorization Flow

```
Frontend Login Request
  ↓
POST /api/auth/login
  ↓
Backend Validates Credentials
  ↓
Generate JWT Token
  ↓
Set httpOnly Cookie (CSRF Token)
  ↓
Return Token + User Info
  ↓
Frontend: Store Token (in-memory for SPA security)
  ↓
All Subsequent Requests
  ├─ Include Token in Authorization header
  ├─ Include CSRF Token in X-CSRF-Token header
  └─ Include httpOnly cookie (automatic)
  ↓
Backend Middleware
  ├─ Verify JWT signature
  ├─ Check token expiration
  ├─ Validate CSRF token (for state-changing requests)
  ├─ Extract user_id and tenant_id
  ├─ Check RBAC permissions
  └─ Apply Row-Level Security (RLS) policies
  ↓
Response
  └─ Only rows WHERE tenant_id = user.tenant_id
```

**Key Security Layers:**

1. **CSRF Protection (CRIT-F-002)**: 
   - Token fetched from `/api/csrf-token` on app init
   - Stored in memory (NOT localStorage to prevent XSS)
   - Included in `X-CSRF-Token` header for POST/PUT/DELETE
   - Automatic retry on 403 with token refresh

2. **httpOnly Cookies (CRIT-F-001)**:
   - Session token stored server-side with httpOnly flag
   - Prevents JavaScript access (XSS protection)
   - Automatically sent with credentials: 'include'

3. **JWT Validation**:
   - Signature verification with public key
   - Expiration check
   - Issuer validation

4. **RBAC + Multi-tenant Isolation**:
   - User role-based permissions checked per endpoint
   - Row-Level Security (RLS) enforces tenant_id filtering in database
   - Resource-level authorization via `requireRBAC` middleware

### 2.3 Request/Response Flow Example

**GET /api/vehicles (Fetch Fleet)**

**Frontend:**
```typescript
const response = await fetch('/api/vehicles', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include httpOnly cookie
});
```

**Backend Middleware Chain:**
```
1. authenticateJWT middleware
   ├─ Extract token from Authorization header
   ├─ Verify JWT signature
   ├─ Extract user_id, tenant_id, role
   ├─ Attach to req.user
   └─ Continue to next middleware

2. requireRBAC middleware
   ├─ Check role in [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST]
   ├─ Check permission: PERMISSIONS.VEHICLE_READ
   ├─ enforceTenantIsolation: true
   └─ Verify req.user.tenant_id exists

3. validateQuery middleware
   ├─ Validate page, pageSize, search, status params
   └─ Reject invalid input

4. asyncHandler (error wrapping)
   ├─ Execute controller logic
   ├─ Catch exceptions
   └─ Format error response
```

**Backend Controller Logic:**
```typescript
// Check cache first (cache-aside pattern)
const cacheKey = `vehicles:list:${tenantId}:${page}:${pageSize}:${search}:${status}`;
const cached = await cacheService.get(cacheKey);
if (cached) return cached;

// Query database (tenant-isolated via RLS)
const vehicleService = container.get(VehicleService);
let vehicles = await vehicleService.getAllVehicles(tenantId);

// Filter & paginate
vehicles = vehicles.filter(v => 
  (!search || matchesSearch(v, search)) &&
  (!status || v.status === status)
);

const total = vehicles.length;
const data = vehicles.slice(offset, offset + pageSize);

// Cache result (5 min TTL)
await cacheService.set(cacheKey, { data, total }, 300);

// Audit log
auditService.log({
  userId: req.user.id,
  action: 'VEHICLE_LIST_READ',
  resourceType: 'vehicle',
  ipAddress: req.ip,
  executionTimeMs: perfEnd - perfStart,
});

// Return response
res.json({ data, total });
```

**Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "vin": "KMHEC4A44EU003884",
      "make": "Ford",
      "model": "F-150",
      "year": 2023,
      "licensePlate": "FL-CAB-001",
      "status": "active",
      "location": {
        "lat": 37.7749,
        "lng": -122.4194,
        "address": "123 Main St, San Francisco, CA"
      },
      "mileage": 45230.5,
      "fuelLevel": 87.5,
      "assignedDriver": "driver-uuid-001",
      "lastService": "2024-12-01T10:30:00Z",
      "nextService": "2025-03-01T10:30:00Z"
    }
  ],
  "total": 245
}
```

---

## 3. FRONTEND FEATURES & DATA FLOW

### 3.1 Major Hub Pages

CTAFleet organizes features into **12+ hub pages**, each with specialized components:

| Hub Page | Purpose | Key Components | Data Sources |
|----------|---------|-----------------|---------------|
| **FleetHub** | Real-time fleet tracking | Map (Google Maps), vehicle list, filters, live status | `/api/vehicles`, `/api/telematics/location`, WebSocket |
| **DriversHub** | Driver management | Driver profiles, scorecards, trip history, incidents | `/api/drivers`, `/api/driver-scores`, incidents |
| **MaintenanceHub** | Work order management | WO list, schedule, technician assignments, parts | `/api/maintenance`, `/api/work-orders` |
| **FuelHub** | Fuel analytics | Transactions, station map, price trends, cost analysis | `/api/fuel/transactions`, `/api/fuel/prices` |
| **ComplianceHub** | Safety & compliance | Inspections, incidents, violations, training | `/api/compliance`, `/api/inspections` |
| **FinancialHub** | Cost analytics | Expenses, invoices, budgets, depreciation | `/api/expenses`, `/api/invoices`, reports |
| **DocumentsHub** | Document management | Upload, search, version history, RAG queries | `/api/documents`, `/api/documents/search` |
| **AdminHub** | System administration | Users, roles, tenants, settings, audit logs | `/api/admin/users`, `/api/admin/tenants` |
| **ReportsHub** | Custom reporting | Report builder, templates, scheduling, export | `/api/reports`, `/api/custom-reports` |
| **AnalyticsHub** | Executive dashboard | KPIs, trends, forecasts, what-if analysis | `/api/analytics`, aggregated endpoints |
| **AssetsHub** | Asset tracking | Inventory, checkout/checkin, transfers, QR codes | `/api/assets`, mobile endpoints |
| **CommandCenter** | Dispatch console | Real-time dispatch, route optimization, driver chat | `/api/dispatch`, `/api/routes/optimize` |

### 3.2 Component Architecture

**Hierarchical Structure:**

```
src/components/
├── ui/                                    # Base shadcn/ui components
│   ├── Button.tsx, Card.tsx, Dialog.tsx
│   ├── Form.tsx, Input.tsx, Select.tsx
│   └── Table.tsx, Tabs.tsx, Toast.tsx
├── modules/                               # Feature-specific components
│   ├── fleet/
│   │   ├── VehicleList.tsx               # Paginated list
│   │   ├── VehicleDetail.tsx             # Full vehicle profile
│   │   ├── VehicleMap.tsx                # Google Maps integration
│   │   ├── VehicleStatus.tsx             # Live status badge
│   │   └── VehicleForm.tsx               # Create/edit vehicle
│   ├── drivers/
│   │   ├── DriverList.tsx
│   │   ├── DriverProfile.tsx
│   │   ├── DriverScorecard.tsx           # Performance metrics
│   │   └── IncidentHistory.tsx           # Safety record
│   ├── maintenance/
│   │   ├── WorkOrderList.tsx
│   │   ├── WorkOrderForm.tsx
│   │   ├── MaintenanceSchedule.tsx
│   │   └── PartsInventory.tsx
│   ├── compliance/
│   │   ├── InspectionForm.tsx            # Dynamic form rendering
│   │   ├── IncidentReport.tsx
│   │   └── ComplianceChecklist.tsx
│   └── reports/
│       ├── ReportBuilder.tsx             # Drag-and-drop builder
│       ├── ReportTemplate.tsx
│       └── ExportOptions.tsx
├── layout/                                # Layout wrappers
│   ├── CommandCenterLayout.tsx           # Dispatch console
│   ├── MapFirstLayout.tsx                # Map-primary layout
│   └── DashboardLayout.tsx               # Hub layout
├── hubs/                                  # Hub-specific containers
│   ├── FleetHub/
│   ├── DriversHub/
│   ├── MaintenanceHub/
│   └── [other hubs]
├── visualizations/                        # Charts & graphics
│   ├── FleetStatusChart.tsx              # Recharts
│   ├── UtilizationTrendChart.tsx
│   ├── CostBreakdownChart.tsx
│   ├── VehicleHeatmap.tsx
│   └── RouteVisualization.tsx            # 3D route display
└── dialogs/
    ├── QuickAssignDriver.tsx
    ├── RouteOptimizationDialog.tsx
    └── IncidentReportDialog.tsx
```

### 3.3 Data Flow Patterns

**Pattern 1: List with Real-time Updates**

```
FleetHub Component
├─ useQuery (fetch initial vehicle list)
│  └─ GET /api/vehicles?page=1&pageSize=20
├─ WebSocket subscription
│  └─ SUBSCRIBE vehicle.location_updated
└─ Render VehicleList
   ├─ Display cached data
   └─ Live update vehicle positions

When vehicle location changes:
  IoT Device/GPS
    ↓
  Backend receives telemetry
    ↓
  INSERT INTO vehicle_locations
    ↓
  Broadcast via WebSocket
    ↓
  Frontend receives message
    ↓
  useQueryClient.setQueryData() (optimistic update)
    ↓
  Re-render VehicleList with new location
```

**Pattern 2: Drill-Through Analytics**

```
Dashboard Shows: "45 Active Vehicles"
  ↓
User Clicks on "45"
  ↓
DrilldownContext stores drill-through params:
  {
    entity: "vehicles",
    filter: { status: "active" },
    origin: "dashboard_summary_card"
  }
  ↓
Navigate to FleetHub with drill-through context
  ↓
VehicleList applies automatic filter
  ↓
Display filtered results with "Back to Dashboard" link
```

**Pattern 3: Multi-step Form (Create Work Order)**

```
WorkOrderForm (modal/page)
├─ Step 1: Select Vehicle
│  ├─ useQuery GET /api/vehicles
│  ├─ Show filtered list
│  └─ User selects vehicle
├─ Step 2: Select Work Type
│  └─ Show predefined categories (oil_change, tire_rotation, etc)
├─ Step 3: Assign Technician
│  ├─ useQuery GET /api/admin/users?role=technician
│  └─ Show available technicians
├─ Step 4: Schedule & Details
│  └─ Enter parts, labor hours, notes
└─ Step 5: Review & Submit
   ├─ useMutation POST /api/work-orders (with CSRF token)
   ├─ Show loading state
   ├─ On success: toast notification + navigate away
   └─ On error: show error message + allow retry
```

### 3.4 State Management

**Technology Stack:**
- **TanStack Query (React Query)**: Server state (API data)
- **React Context**: Global state (auth, theme, permissions)
- **Custom Hooks**: Computed state & side effects

**Key Contexts:**

```typescript
// AuthContext - User & permissions
const { user, hasPermission, isRole } = useAuth();

// WebSocketContext - Real-time connection
const { subscribe, unsubscribe } = useWebSocket();

// DrilldownContext - Drill-through state
const { drillthrough, setDrillthrough } = useDrilldown();

// FeatureFlagContext - Feature toggles
const { isFeatureEnabled } = useFeatureFlags();

// TenantContext - Multi-tenant data
const { currentTenant, switchTenant } = useTenant();
```

**Example: Vehicle Details Page with Real-time Updates**

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/contexts/WebSocketContext';

export function VehicleDetail({ vehicleId }) {
  const queryClient = useQueryClient();
  const { subscribe } = useWebSocket();

  // Fetch vehicle data
  const { data: vehicle, isLoading } = useQuery(
    ['vehicle', vehicleId],
    () => fetch(`/api/vehicles/${vehicleId}`).then(r => r.json()),
    { 
      refetchInterval: 30000, // Fallback refetch every 30s
      staleTime: 10000,
    }
  );

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribe(
      `vehicle.${vehicleId}.telemetry_updated`,
      (payload) => {
        // Update query cache with new data
        queryClient.setQueryData(['vehicle', vehicleId], prev => ({
          ...prev,
          location: payload.location,
          speed: payload.speed,
          fuelLevel: payload.fuelLevel,
          lastUpdate: new Date(),
        }));
      }
    );

    return unsubscribe;
  }, [vehicleId, subscribe, queryClient]);

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <h1>{vehicle.make} {vehicle.model}</h1>
      <VehicleMap location={vehicle.location} />
      <TelemetryPanel vehicle={vehicle} />
      <MaintenanceHistory vehicleId={vehicleId} />
      <IncidentHistory vehicleId={vehicleId} />
    </div>
  );
}
```

### 3.5 Real-time Data Synchronization

**WebSocket Implementation:**

```typescript
// src/lib/websocket.ts
export class FleetWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(url: string, token: string) {
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      // Authenticate WebSocket
      this.ws?.send(JSON.stringify({
        type: 'auth',
        token,
      }));
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const handlers = this.listeners.get(message.type) || [];
      handlers.forEach(h => h(message.payload));
    };

    this.ws.onclose = () => {
      this.attemptReconnect();
    };
  }

  subscribe(eventType: string, handler: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)?.push(handler);

    // Send subscription to server
    this.ws?.send(JSON.stringify({
      type: 'subscribe',
      channel: eventType,
    }));

    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(eventType);
      if (handlers) {
        handlers.splice(handlers.indexOf(handler), 1);
      }
    };
  }
}

// Usage in components
const { subscribe } = useWebSocket();

subscribe('vehicle.location.updated', (payload) => {
  // payload: { vehicleId, latitude, longitude, speed, timestamp }
  updateVehicleMarker(payload);
});
```

**Message Types:**
```
1. vehicle.location.updated
   { vehicleId, lat, lng, speed, heading, accuracy, timestamp }

2. vehicle.telemetry.updated
   { vehicleId, rpm, fuelLevel, coolantTemp, engineHours, dtcCodes, timestamp }

3. driver.behavior.event
   { vehicleId, driverId, eventType, severity, timestamp, context }

4. maintenance.alert
   { vehicleId, alertType, message, severity, scheduledAction }

5. compliance.violation
   { vehicleId, driverId, violationType, severity, timestamp }

6. geofence.breach
   { vehicleId, driverId, geofenceId, eventType (entry/exit), timestamp }

7. fuel.alert
   { vehicleId, alertType, fuelLevel, estimatedRange }

8. system.notification
   { type, title, message, priority, actions }
```

---

## 4. KEY WORKFLOWS

### 4.1 Vehicle Tracking & Real-time Updates

**Workflow: GPS Update Reception → Fleet Map Display**

```
GPS Device (every 10 seconds)
  ├─ Latitude: 37.7749
  ├─ Longitude: -122.4194
  ├─ Speed: 45 mph
  ├─ Heading: 90° (east)
  └─ Accuracy: ±5 meters

IoT Gateway
  ├─ Receives GPS packet
  ├─ Validates format
  └─ Publishes to MQTT: vehicles/GPS/{deviceId}

Backend Service (Telematics Handler)
  ├─ Consume from message queue
  ├─ Extract vehicle_id from GPS device mapping
  ├─ Validate against database vehicle record
  ├─ INSERT INTO vehicle_locations:
  │  {
  │    id: uuid(),
  │    vehicle_id: '550e8400-e29b-41d4-a716-446655440000',
  │    latitude: 37.7749,
  │    longitude: -122.4194,
  │    speed: 45,
  │    heading: 90,
  │    accuracy: 5,
  │    recorded_at: NOW(),
  │    created_at: NOW()
  │  }
  ├─ UPDATE vehicles SET latitude=37.7749, longitude=-122.4194, speed=45
  ├─ Check for geofence_events (ST_Contains check against geofences)
  ├─ Detect behavior (speed > limit? → harsh_braking? → sharp_turn?)
  └─ Broadcast via WebSocket

WebSocket Broadcast (real-time to all subscribed clients)
  ├─ Event Type: vehicle.location.updated
  ├─ Payload:
  │  {
  │    vehicleId: '550e8400-e29b-41d4-a716-446655440000',
  │    latitude: 37.7749,
  │    longitude: -122.4194,
  │    speed: 45,
  │    heading: 90,
  │    timestamp: 1704067200000
  │  }
  └─ Send to all connected clients subscribed to this vehicle

Frontend (React Component)
  ├─ useWebSocket hook receives message
  ├─ Update TanStack Query cache:
  │  queryClient.setQueryData(['vehicle', vehicleId], prev => ({
  │    ...prev,
  │    location: { lat: 37.7749, lng: -122.4194 },
  │    speed: 45,
  │  }))
  ├─ Component re-renders with new data
  ├─ VehicleMap updates marker position
  ├─ VehicleList shows updated speed/location
  └─ If geofence_breach event received:
     ├─ Show toast notification
     ├─ Log to audit trail
     └─ Create alert for manager (optional auto-escalation)

UI Updates
  ├─ Vehicle marker moves on map
  ├─ Last updated timestamp refreshes
  ├─ Speed display updates
  └─ Route polyline adjusts if driver off-route
```

**Latency Profile:**
- GPS device to backend: 1-5 seconds
- Backend processing: 100-500ms
- WebSocket broadcast: 10-100ms
- **Total end-to-end latency: 2-6 seconds**
- Frontend visual update: Immediate (< 50ms)

---

### 4.2 Driver Management & Safety Scoring

**Workflow: Telematics → Behavior Events → Driver Score Update**

```
Driver Operating Vehicle
  ├─ OBD2 device collects metrics (1-10 Hz)
  │  ├─ RPM, speed, acceleration
  │  ├─ Braking force, steering angle
  │  └─ Fuel consumption
  └─ GPS tracks position continuously

Backend Telematics Processor
  ├─ INSERT INTO telemetry_data raw metrics
  ├─ Analyze Driving Behavior:
  │
  │  1. Harsh Braking Detection:
  │     IF braking_deceleration > 0.6g:
  │       ├─ Increment harsh_braking_count
  │       ├─ INSERT INTO driver_behavior_events
  │       ├─ Alert: "Harsh Braking Detected"
  │       └─ Optional: Store video clip if dashcam available
  │
  │  2. Speeding Detection:
  │     IF speed > speed_limit + 5mph:
  │       ├─ Record speeding_event
  │       ├─ Increment speeding_events_count
  │       └─ IF exceeds 10mph limit:
  │          ├─ Higher severity alert
  │          └─ Notify driver + manager
  │
  │  3. Acceleration Monitoring:
  │     IF acceleration > 0.5g:
  │       ├─ Record harsh_acceleration event
  │       └─ Increment count
  │
  │  4. Cornering Analysis:
  │     IF lateral_acceleration > 0.45g:
  │       ├─ Record sharp_turn event
  │       └─ May indicate aggressive driving
  │
  │  5. Idling Time:
  │     IF vehicle.speed == 0 for > 5 minutes:
  │       ├─ Increment idle_time counter
  │       ├─ Alert if excessive
  │       └─ Impacts utilization_metrics
  │
  └─ Store all in driver_behavior_events

Daily Score Recalculation (scheduled batch job)
  ├─ SELECT driver_id, COUNT(*) as event_count
  ├─ FROM driver_behavior_events
  ├─ WHERE DATE(created_at) = TODAY()
  │
  ├─ Calculate Safety Score (0-100):
  │  safety_score = 100
  │  safety_score -= (harsh_braking_count * 2)
  │  safety_score -= (speeding_events_count * 3)
  │  safety_score -= (harsh_acceleration_count * 1.5)
  │  safety_score -= (sharp_turn_count * 1)
  │  safety_score = MAX(0, safety_score)
  │
  ├─ Calculate Efficiency Score (0-100):
  │  efficiency_score = 100
  │  efficiency_score -= (excessive_idling_minutes / 10)
  │  efficiency_score -= (fuel_consumption_variance * 5)
  │
  ├─ Calculate Compliance Score (0-100):
  │  compliance_score = 100
  │  compliance_score -= (policy_violations_count * 5)
  │  compliance_score -= (incidents_count * 10)
  │
  ├─ Overall Score = (safety + efficiency + compliance) / 3
  │
  └─ INSERT/UPDATE INTO driver_scores:
     {
       driver_id: uuid,
       safety_score: 85.5,
       efficiency_score: 92.0,
       compliance_score: 98.0,
       overall_score: 91.8,
       incidents_count: 0,
       violations_count: 2,
       harsh_braking_count: 3,
       harsh_acceleration_count: 1,
       speeding_events_count: 2,
       trend: 'stable' | 'improving' | 'declining',
       rank_position: 15,
       percentile: 85,
       period_start: DATE_TRUNC('day', NOW()),
       period_end: DATE_TRUNC('day', NOW())
     }

Incentive/Gamification System
  ├─ IF driver.overall_score >= 95:
  │  ├─ Award achievement: "Safety Star"
  │  ├─ Increment driver_achievements
  │  └─ Send congratulatory notification
  ├─ Monthly Leaderboard Ranking:
  │  ├─ Rank drivers by overall_score
  │  ├─ Display in dashboard
  │  └─ Award bonus to top 10%
  └─ Safety Training Triggered:
     └─ IF driver.safety_score < 70:
        ├─ Auto-assign training module
        ├─ Send notification to driver + manager
        └─ Flag for intervention

Frontend Display (DriversHub → Driver Profile)
  ├─ Safety Scorecard Component:
  │  ├─ Gauge chart: Safety Score (85.5)
  │  ├─ Gauge chart: Efficiency Score (92.0)
  │  ├─ Gauge chart: Compliance Score (98.0)
  │  └─ Large number: Overall Score (91.8)
  ├─ Behavior Events Log:
  │  ├─ List recent harsh_braking events
  │  ├─ Timeline of speeding events
  │  └─ Video clips available for download
  ├─ Incident History:
  │  └─ Linked to incidents table
  └─ Trend Analysis:
     └─ Chart showing score progression over past 90 days
```

**Key Relationships:**
```
telemetry_data (raw metrics)
  ↓
driver_behavior_events (event classification)
  ↓
driver_scores (aggregated daily score)
  ↓
driver_achievements (gamification)
  ↓
notifications (alert driver/manager)
```

---

### 4.3 Maintenance Scheduling & Predictive Maintenance

**Workflow: PM Schedule → Maintenance Alert → Work Order Creation**

```
Maintenance Schedule Definition
  ├─ Vehicle makes/models have standard PM intervals:
  │  ├─ Oil change: Every 5,000 miles or 6 months
  │  ├─ Tire rotation: Every 10,000 miles or 12 months
  │  ├─ Inspection: Every 25,000 miles or 12 months
  │  └─ Major service: Every 50,000 miles or 24 months
  │
  └─ INSERT INTO maintenance_schedules:
     {
       vehicle_id: uuid,
       schedule_type: 'oil_change',
       interval_type: 'miles',
       interval_value: 5000,
       last_performed_date: '2024-12-01',
       last_performed_miles: 40000,
       next_due_miles: 45000,
       next_due_date: '2025-03-01'
     }

Real-time Monitoring (scheduled job every hour)
  ├─ SELECT maintenance_schedules
  ├─ JOIN vehicles ON schedules.vehicle_id = vehicles.id
  ├─ WHERE:
  │  ├─ vehicle.odometer >= schedule.next_due_miles OR
  │  └─ NOW() >= schedule.next_due_date
  │
  ├─ FOR EACH overdue schedule:
  │  ├─ Check if work_order already exists
  │  ├─ IF NOT:
  │  │  ├─ CREATE work_order:
  │  │  │  {
  │  │  │    vehicle_id: uuid,
  │  │  │    work_order_number: WO-2025-0001,
  │  │  │    type: 'scheduled_maintenance',
  │  │  │    priority: 'medium',
  │  │  │    status: 'open',
  │  │  │    description: 'Oil change - due at 45,000 miles',
  │  │  │    odometer_reading: current_miles,
  │  │  │    scheduled_start: TODAY(),
  │  │  │    created_by: SYSTEM
  │  │  │  }
  │  │  ├─ Send notification to fleet_manager
  │  │  ├─ Create task for technician assignment
  │  │  └─ Log to audit_logs
  │  │
  │  └─ IF existing work_order.status != 'completed':
  │     ├─ Escalate priority if > 2 weeks overdue
  │     └─ Send reminder notification
  │
  └─ Log job execution to indexing_jobs

Predictive Maintenance (ML Model)
  ├─ Model: 'predictive_failure_detection'
  ├─ Type: classification (failure_likely_soon: bool)
  ├─ Features:
  │  ├─ vehicle age (years)
  │  ├─ total_mileage
  │  ├─ engine_hours
  │  ├─ maintenance_compliance_score
  │  ├─ historical_failure_patterns
  │  ├─ OBD DTC codes (are any present?)
  │  ├─ Recent behavior patterns
  │  └─ Environmental factors
  │
  ├─ Input: New telemetry data arrives
  ├─ Feature Engineering → Input tensor
  ├─ Run inference via ml_models.model_binary
  ├─ Output:
  │  {
  │    prediction: 'failure_likely',
  │    confidence_score: 0.82,
  │    predicted_failure_type: 'transmission',
  │    time_to_failure_hours: 48
  │  }
  │
  ├─ IF confidence_score > 0.75:
  │  ├─ INSERT INTO predictions table
  │  ├─ INSERT INTO cognition_insights:
  │  │  {
  │  │    insight_type: 'predictive_maintenance',
  │  │    severity: 'high',
  │  │    title: 'Transmission failure predicted',
  │  │    description: '82% confidence of transmission failure within 48 hours',
  │  │    recommended_actions: [
  │  │      'Schedule immediate transmission inspection',
  │  │      'Remove vehicle from service until cleared',
  │  │      'Contact authorized transmission specialist'
  │  │    ],
  │  │    affected_entities: [{ type: 'vehicle', id: vehicle_id }]
  │  │  }
  │  ├─ Send high-priority alert to maintenance manager
  │  └─ Create urgent work_order
  │
  └─ Track prediction accuracy:
     ├─ Compare prediction_date → actual_maintenance_date
     ├─ Store feedback in feedback_loops
     └─ Trigger model retraining if needed

Technician Assignment & Execution
  ├─ Fleet Manager receives open work orders
  ├─ Dashboard shows:
  │  ├─ Vehicle details (make, model, current mileage)
  │  ├─ Maintenance required (oil change, tire rotation)
  │  ├─ Priority level (overdue? → red; upcoming? → yellow)
  │  └─ Available technicians
  │
  ├─ Manager assigns technician:
  │  └─ PUT /api/work-orders/{id}
  │     { assigned_technician_id: tech_uuid, status: 'assigned' }
  │
  ├─ Technician receives notification
  ├─ Technician logs into mobile app
  ├─ Technician scans vehicle QR code (optional)
  ├─ Technician views work order details + service manual link
  ├─ Technician performs work:
  │  ├─ Takes photos of work (optional)
  │  ├─ Records parts used
  │  ├─ Logs labor hours
  │  └─ Notes any additional issues discovered
  │
  ├─ Technician marks complete:
  │  ├─ PUT /api/work-orders/{id}
  │  │  {
  │  │    status: 'completed',
  │  │    actual_start: timestamp,
  │  │    actual_end: timestamp,
  │  │    labor_hours: 1.5,
  │  │    labor_cost: 150.00,
  │  │    parts_cost: 45.99,
  │  │    photos: ['url1', 'url2'],
  │  │    notes: 'Oil change completed, filter replaced'
  │  │  }
  │  ├─ Backend calculates total_cost (auto-calculated)
  │  ├─ Updates vehicle.last_service timestamp
  │  ├─ Updates maintenance_schedules.last_performed_date
  │  ├─ Inserts into service_history (immutable record)
  │  └─ Notifies vehicle manager
  │
  └─ Billing & Cost Tracking:
     ├─ INSERT INTO cost_allocations:
     │  { vehicle_id, cost_type: 'maintenance', amount: 195.99 }
     ├─ UPDATE utilization_metrics: cost_tracking
     └─ Aggregate for financial reports

Frontend Display (MaintenanceHub)
  ├─ Overdue Work Orders (critical view):
  │  ├─ Red banner with count
  │  ├─ Sort by days overdue
  │  └─ Quick-assign buttons
  ├─ Schedule Calendar:
  │  ├─ Shows upcoming maintenance by date
  │  └─ Heat map: dark = many vehicles; light = few
  ├─ Technician Schedule:
  │  ├─ List of assigned technicians
  │  ├─ Their current work orders
  │  └─ Utilization %
  └─ Cost Trends:
     ├─ Monthly maintenance spend
     ├─ Cost per vehicle per year
     └─ Trend vs budget
```

---

### 4.4 Compliance Monitoring & Incident Investigation

**Workflow: Safety Event → Investigation → Resolution**

```
Safety Event Triggers
  ├─ 1. Telematics Event:
  │     └─ harsh_braking detected → driver_behavior_events INSERT
  │
  ├─ 2. Vehicle Damage:
  │     └─ Dashcam detects impact → video_events INSERT
  │
  ├─ 3. Manager Report:
  │     └─ Manager files incident report in UI
  │
  └─ 4. Policy Violation:
      └─ Speed governor exceeded → policy_violations INSERT

Incident Creation
  ├─ System or user submits incident report
  ├─ INSERT INTO incidents:
  │  {
  │    id: uuid,
  │    incident_title: 'Minor collision - parking lot',
  │    incident_type: 'property_damage',
  │    severity: 'low' | 'medium' | 'high' | 'critical',
  │    status: 'open',
  │    incident_date: '2025-01-15',
  │    incident_time: '14:30',
  │    location: 'Company parking lot, Building B',
  │    description: 'Backed into concrete post while parking',
  │    vehicle_id: uuid,
  │    driver_id: uuid,
  │    reported_by: user_uuid,
  │    injuries_reported: false,
  │    property_damage: true,
  │    damage_estimate: 5000.00,
  │    assigned_investigator: NULL,  // Not yet assigned
  │    created_at: NOW()
  │  }
  │
  ├─ Generate incident_photos from dashcam/user upload
  ├─ Send alert to incident_workflow_manager
  │
  └─ Create tasks:
     ├─ Task 1: Assign investigator
     ├─ Task 2: Collect witness statements
     ├─ Task 3: Review dashcam footage
     └─ Task 4: Determine root cause

Investigation Phase
  ├─ Investigator assigned:
  │  └─ PUT /api/incidents/{id}
  │     { assigned_investigator: investigator_uuid }
  │
  ├─ Investigator gathers evidence:
  │  ├─ Review dashcam video → INSERT incident_photos
  │  ├─ Interview driver & witnesses → INSERT incident_witnesses
  │  ├─ Examine vehicle damage → UPDATE damage_reports
  │  └─ Check driver history → JOIN incidents + driver_behavior_events
  │
  ├─ Timeline reconstruction:
  │  ├─ INSERT INTO incident_timeline multiple events:
  │  │  1. 14:25 - Driver entered parking lot
  │  │  2. 14:28 - Backing up vehicle
  │  │  3. 14:29 - Impact detected (dashcam timestamp)
  │  │  4. 14:30 - Driver reported incident
  │  └─ Build narrative
  │
  ├─ Root Cause Analysis (5 Whys):
  │  ├─ What: Vehicle struck concrete post while backing
  │  ├─ Why #1: Driver didn't see post (backup camera malfunction?)
  │  ├─ Why #2: Backup camera not working
  │  ├─ Why #3: Camera blocked by mud/ice
  │  ├─ Why #4: Vehicle not pre-trip inspected
  │  ├─ Root Cause: Preventive maintenance failure
  │  │
  │  └─ UPDATE incidents SET root_cause = 'No pre-trip inspection performed'
  │
  └─ Preventive Measures Assigned:
     ├─ INSERT INTO incident_actions:
     │  {
     │    incident_id: uuid,
     │    action_description: 'Inspect all backup cameras on fleet',
     │    assigned_to: maintenance_manager_uuid,
     │    due_date: NOW() + 7 DAYS,
     │    status: 'pending'
     │  }
     ├─ INSERT INTO incident_actions:
     │  {
     │    action_description: 'Retrain driver on pre-trip inspection',
     │    assigned_to: safety_trainer_uuid,
     │    due_date: NOW() + 3 DAYS,
     │    status: 'pending'
     │  }
     └─ Auto-create work_order for camera repair

Compliance Verification
  ├─ Ensure incident = policy_violations if applicable
  ├─ Check regulatory requirements (OSHA, DOT, company policy)
  ├─ Determine if outside-incident-investigation required
  ├─ Update driver safety record if behavior was factor
  └─ Recalculate driver_scores if incident affects metrics

Closure & Learning
  ├─ All incident_actions completed?
  ├─ YES:
  │  ├─ UPDATE incidents SET status = 'closed'
  │  ├─ Generate incident_summary report
  │  ├─ Share lessons learned with fleet
  │  └─ UPDATE driver training records
  │
  └─ Feedback loop for AI/ML:
     ├─ If similar incident occurs → lower confidence score for retrain
     └─ Trigger additional driver coaching

Frontend Display (ComplianceHub)
  ├─ Open Incidents (critical view):
  │  ├─ List all status = 'open'
  │  ├─ Sort by severity (critical → high → medium → low)
  │  └─ Days open counter (red if > 30 days)
  ├─ Incident Detail Page:
  │  ├─ Basic info: date, vehicle, driver, severity
  │  ├─ Description & narrative timeline
  │  ├─ Attached photos/videos
  │  ├─ Investigator assignment
  │  ├─ Root cause (editable)
  │  ├─ Preventive actions list
  │  └─ Status workflow buttons: Assign → Investigating → Closed
  ├─ Compliance Metrics:
  │  ├─ Incident rate (per 100k miles)
  │  ├─ Severity breakdown (pie chart)
  │  ├─ Trend over time (line chart)
  │  └─ Top causes (bar chart)
  └─ Driver Safety Report:
     ├─ Incidents per driver
     ├─ Pattern detection (chronic offenders)
     └─ Training needs assessment
```

---

### 4.5 Cost Analytics & Financial Reporting

**Workflow: Multi-source Cost Aggregation → Dashboard Display**

```
Cost Data Sources
  ├─ 1. Fuel Costs:
  │     └─ fuel_transactions: SUM(total_cost)
  ├─ 2. Maintenance Costs:
  │     └─ work_orders: SUM(labor_cost + parts_cost)
  ├─ 3. Employee Expenses:
  │     └─ expenses: SUM(amount)
  ├─ 4. Vendor Invoices:
  │     └─ invoices: SUM(amount)
  ├─ 5. Depreciation:
  │     └─ depreciation_entries: SUM(depreciation_amount)
  ├─ 6. Insurance & Registration:
  │     └─ cost_tracking: WHERE cost_category IN ('insurance', 'registration')
  └─ 7. EV Charging:
      └─ charging_sessions: SUM(cost)

Nightly Cost Aggregation (scheduled batch)
  ├─ Run at 2 AM (off-peak)
  ├─ FOR EACH vehicle:
  │  ├─ Query all cost sources for date range
  │  ├─ Calculate:
  │  │  total_fuel_cost = SUM(fuel_transactions.total_cost)
  │  │  total_maintenance_cost = SUM(work_orders.total_cost)
  │  │  total_operating_cost = total_fuel + total_maintenance + insurance + ...
  │  │  cost_per_mile = total_operating_cost / vehicle.mileage_delta
  │  │  cost_per_month = total_operating_cost / num_months_in_service
  │  │
  │  └─ INSERT/UPDATE cost_tracking:
  │     {
  │       vehicle_id: uuid,
  │       cost_category: 'fuel',
  │       amount: 1250.50,
  │       tracked_date: DATE_TRUNC('day', NOW()),
  │       currency: 'USD'
  │     }
  │     ... (repeat for each category)
  │
  └─ Generate utilization_metrics:
     {
       vehicle_id: uuid,
       total_miles: 45230,
       total_hours: 1203,
       active_hours: 987,
       idle_hours: 216,
       utilization_rate: 82%, // active_hours / total_hours
       cost_per_mile: 0.35,
       period_start: DATE_TRUNC('month', NOW()),
       period_end: DATE_TRUNC('month', NOW())
     }

Cost Per Vehicle Analysis
  ├─ Vehicle: 2023 Ford F-150
  ├─ Total Cost YTD: $12,450.75
  ├─ Breakdown:
  │  ├─ Fuel: $8,234.25 (66%)
  │  │  └─ MPG: 18.5 (below fleet avg of 19.2)
  │  ├─ Maintenance: $2,107.50 (17%)
  │  │  └─ Above avg (indicative of higher maintenance needs)
  │  ├─ Depreciation: $1,500.00 (12%)
  │  ├─ Insurance: $608.00 (5%)
  │  └─ Other: $1.00 (< 1%)
  │
  ├─ Metrics:
  │  ├─ Cost per Mile: $0.35
  │  ├─ Cost per Driver Hour: $18.50
  │  ├─ Miles YTD: 35,600
  │  ├─ Utilization Rate: 82% (above fleet avg 75%)
  │  └─ ROI Index: 0.92 (below 1.0 target)
  │
  └─ Recommendations (AI-generated via cognition_insights):
     ├─ "Maintenance costs 15% above average - Schedule comprehensive inspection"
     ├─ "Fuel efficiency below target - Driver training may help"
     └─ "Consider vehicle replacement - Age 5+ years, ROI declining"

Fleet-Level Cost Summary
  ├─ Total Fleet Cost YTD: $450,890.50
  ├─ Cost Breakdown (pie chart):
  │  ├─ Fuel: 65% ($292,578.83)
  │  ├─ Maintenance: 18% ($81,160.29)
  │  ├─ Depreciation: 10% ($45,089.05)
  │  ├─ Insurance: 5% ($22,544.52)
  │  └─ Other: 2% ($9,517.81)
  │
  ├─ Average Metrics:
  │  ├─ Cost per Vehicle per Month: $1,252.47
  │  ├─ Fleet MPG: 19.2
  │  ├─ Average Utilization: 75%
  │  └─ Cost Efficiency Index: 0.94
  │
  ├─ Trend Analysis (over 12 months):
  │  ├─ Fuel costs trending ↑ 3% (external: fuel price increase)
  │  ├─ Maintenance costs trending ↓ 8% (preventive PM working)
  │  ├─ Depreciation trending ↑ 2% (aging fleet)
  │  └─ Overall trend: Stable (within 2% YoY)
  │
  └─ Budget vs Actual:
     ├─ Budgeted: $500,000 YTD
     ├─ Actual: $450,890.50
     ├─ Variance: -$49,109.50 (9.8% under budget ✓)
     ├─ Projected Year-End: $540,000 (vs budget $600,000)
     └─ Status: ON TRACK to meet budget

What-If Analysis (user-initiated)
  ├─ Scenario 1: Replace 10 oldest vehicles
  │  ├─ Investment: $350,000
  │  ├─ Projected fuel savings: 12% ($35,000/year)
  │  ├─ Projected maintenance savings: 25% ($20,300/year)
  │  ├─ Total annual benefit: $55,300
  │  ├─ ROI: 15.8% (payback: 6.3 years)
  │  └─ Recommendation: MODERATE (positive ROI but long payback)
  │
  └─ Scenario 2: Implement driver training program
     ├─ Investment: $15,000
     ├─ Projected fuel savings: 8% ($23,400/year)
     ├─ Projected incident reduction: 20% ($10,000/year)
     ├─ Total annual benefit: $33,400
     ├─ ROI: 222% (payback: 5.4 months)
     └─ Recommendation: HIGH (quick ROI, do immediately!)

Report Generation & Export
  ├─ User selects:
  │  ├─ Report type: Cost Analysis
  │  ├─ Date range: Jan 1 - Dec 31, 2024
  │  ├─ Scope: Entire Fleet
  │  ├─ Format: PDF + Excel
  │  └─ Include: Charts, detailed tables, trend analysis
  │
  ├─ Backend:
  │  ├─ Query cost_tracking, utilization_metrics
  │  ├─ Aggregate by vehicle, department, cost category
  │  ├─ Generate visualizations
  │  ├─ Render to PDF/Excel
  │  └─ INSERT report_executions record
  │
  └─ User downloads:
     ├─ Fleet_Cost_Analysis_2024.pdf (12 pages)
     └─ Fleet_Cost_Analysis_2024.xlsx (multiple sheets)

Frontend Display (FinancialHub)
  ├─ Dashboard Cards (KPIs):
  │  ├─ Total Fleet Cost YTD: $450,890.50
  │  ├─ Cost per Mile: $0.32 ↓
  │  ├─ Budget Variance: -9.8% ✓
  │  └─ Trend: Stable (green)
  ├─ Cost Breakdown Chart (Recharts):
  │  └─ Pie/Donut chart: Fuel 65%, Maintenance 18%, ...
  ├─ Vehicle Cost Ranking:
  │  ├─ Most expensive: Vehicle #45 ($3,500/month)
  │  ├─ Least expensive: Vehicle #12 ($850/month)
  │  └─ Filterable by cost type
  ├─ Trend Analysis Chart:
  │  └─ Line chart: Cost over past 12 months
  ├─ Budget vs Actual:
  │  └─ Horizontal bar: Budget (dark), Actual (light), Variance
  └─ What-If Scenarios:
     ├─ Predefined scenarios (replace vehicles, training)
     ├─ Custom scenario builder
     └─ Compare ROI across scenarios
```

---

## 5. DATA FLOW PATTERNS

### 5.1 Request-Response Cycle

```
CLIENT INITIATES REQUEST
  ├─ User Action: Click "Load Vehicles" button
  └─ Frontend calls: fetch('/api/vehicles?page=1&pageSize=20')

FRONTEND REQUEST LAYER
  ├─ Axios interceptor adds headers:
  │  ├─ Authorization: Bearer {JWT_TOKEN}
  │  ├─ X-CSRF-Token: {CSRF_TOKEN}
  │  └─ Content-Type: application/json
  ├─ Credentials: include (sends httpOnly cookies)
  └─ Send to backend

BACKEND MIDDLEWARE CHAIN
  ├─ 1. Request ID middleware: Generate correlation_id
  ├─ 2. Security headers (Helmet): Add CSP, X-Frame-Options, etc.
  ├─ 3. CORS middleware: Validate origin
  ├─ 4. Body parser: Parse JSON
  ├─ 5. Rate limiter: Check rate_limits table
  │  ├─ IF user.ip in blocked_entities: 403 Forbidden
  │  └─ IF requests > limit: 429 Too Many Requests
  ├─ 6. JWT authentication middleware:
  │  ├─ Extract token from Authorization header
  │  ├─ Verify signature against public key
  │  ├─ Check expiration (exp claim)
  │  ├─ Decode payload (user_id, tenant_id, role, permissions)
  │  └─ Attach to req.user
  ├─ 7. CSRF validation (POST/PUT/DELETE only):
  │  ├─ Extract X-CSRF-Token header
  │  ├─ Compare to token stored in session_tokens
  │  └─ IF mismatch: 403 CSRF_VALIDATION_FAILED
  ├─ 8. RBAC middleware:
  │  ├─ Check req.user.role in required_roles
  │  ├─ Check required_permissions in req.user.permissions
  │  ├─ If tenant isolation enabled: verify req.user.tenant_id
  │  └─ If failed: 403 Forbidden
  └─ 9. Validation middleware:
     ├─ Parse query string parameters
     ├─ Validate using Zod schema
     └─ If invalid: 400 Bad Request

BACKEND CONTROLLER LOGIC
  ├─ Extract parameters:
  │  ├─ page = 1
  │  ├─ pageSize = 20
  │  ├─ tenantId = req.user.tenant_id
  │  └─ Implicitly: only show vehicles for this tenant
  ├─ Check cache (Redis):
  │  ├─ cacheKey = `vehicles:list:${tenantId}:1:20:`
  │  ├─ IF EXISTS: return cached result
  │  └─ Continue on cache miss
  ├─ Query database (with RLS):
  │  └─ SELECT * FROM vehicles
  │     WHERE tenant_id = {tenantId}
  │     LIMIT 20 OFFSET 0
  │
  │  RLS Policy enforces:
  │    → Only rows where tenant_id = auth.uid()
  │    → Cannot escape tenant isolation
  │
  ├─ Database connection:
  │  ├─ Pool from pg library
  │  ├─ Connection pooling (max 20 connections)
  │  ├─ Query execution with prepared statement
  │  │  → Parameterized query ($1, $2) prevents SQL injection
  │  └─ Result set returned
  │
  ├─ Post-process results:
  │  ├─ Format timestamps (ISO 8601)
  │  ├─ Compute derived fields (vehicle display name)
  │  ├─ Transform snake_case → camelCase (if applicable)
  │  └─ Filter sensitive data (e.g., remove driver salary)
  │
  ├─ Cache result (5 min TTL):
  │  └─ await cacheService.set(cacheKey, result, 300)
  │
  ├─ Audit log:
  │  └─ INSERT INTO audit_logs:
  │     {
  │       user_id: req.user.id,
  │       action: 'VEHICLE_LIST',
  │       resource_type: 'vehicle',
  │       request_method: 'GET',
  │       request_path: '/vehicles',
  │       response_status: 200,
  │       execution_time_ms: 45,
  │       ip_address: req.ip,
  │       correlation_id: req.id,
  │       timestamp: NOW()
  │     }
  │
  └─ Return response

BACKEND SENDS RESPONSE
  ├─ Status: 200 OK
  ├─ Headers:
  │  ├─ Content-Type: application/json
  │  ├─ Cache-Control: no-store
  │  ├─ X-Request-Id: {correlation_id}
  │  └─ X-Response-Time: 45ms
  ├─ Body:
  │  {
  │    "data": [
  │      {
  │        "id": "550e8400-e29b-41d4-a716-446655440000",
  │        "vin": "KMHEC4A44EU003884",
  │        "make": "Ford",
  │        "model": "F-150",
  │        ...
  │      }
  │    ],
  │    "total": 245,
  │    "page": 1,
  │    "pageSize": 20
  │  }
  └─ HTTP/1.1 200 OK

FRONTEND RECEIVES RESPONSE
  ├─ Axios interceptor:
  │  ├─ Check status (200-299 = success)
  │  └─ Return response to caller
  ├─ Component (useQuery hook):
  │  ├─ Update TanStack Query cache
  │  ├─ Trigger component re-render
  │  └─ Render new data
  └─ UI Update:
     ├─ VehicleList renders 20 vehicles
     ├─ Pagination shows total: 245
     └─ Loading spinner disappears

ERROR HANDLING
  ├─ If validation fails (400):
  │  {
  │    "error": "Validation failed",
  │    "details": {
  │      "page": "Must be a positive number"
  │    }
  │  }
  ├─ If unauthorized (401):
  │  ├─ Frontend: Clear token, redirect to login
  │  └─ Backend returns 401 Unauthorized
  ├─ If forbidden (403):
  │  └─ Backend returns 403 Forbidden (insufficient permissions)
  ├─ If not found (404):
  │  └─ Backend returns 404 Not Found
  └─ If server error (5xx):
     ├─ Sentry error reporting triggered
     ├─ User sees: "Something went wrong"
     └─ Dev can debug via Sentry dashboard
```

### 5.2 Real-time Update Flow (WebSocket)

```
CLIENT SUBSCRIBES TO REAL-TIME UPDATES
  ├─ Component mounts (useEffect)
  ├─ WebSocket connection established (already open at app level)
  ├─ useWebSocket.subscribe('vehicle.location.updated', handler)
  ├─ Send to server:
  │  {
  │    "type": "subscribe",
  │    "channel": "vehicle.location.updated"
  │  }
  └─ Server acknowledges subscription

GPS DEVICE SENDS LOCATION
  ├─ GPS transmits packet every 10 seconds
  ├─ Contains: lat, lng, speed, heading, timestamp
  ├─ Device ID: 550e8400 (maps to vehicle)
  └─ Sent to MQTT broker / message queue

BACKEND RECEIVES & PROCESSES TELEMETRY
  ├─ Consume from message queue
  ├─ Validate device ID
  ├─ Map to vehicle_id
  ├─ Create INSERT record:
  │  INSERT INTO vehicle_locations (...)
  │  VALUES (...) RETURNING *
  │
  ├─ Update vehicle summary:
  │  UPDATE vehicles
  │  SET latitude = 37.7749, longitude = -122.4194, speed = 45
  │  WHERE id = vehicle_id
  │
  ├─ Analyze driving behavior:
  │  ├─ Check if speed > speed_limit → harsh_braking event?
  │  ├─ Check geofence boundaries (ST_Contains query)
  │  └─ Generate behavior_events if needed
  │
  └─ Broadcast to WebSocket subscribers:
     ├─ For all clients subscribed to 'vehicle.location.updated':
     │  {
     │    "type": "vehicle.location.updated",
     │    "vehicleId": "550e8400-e29b-41d4-a716-446655440000",
     │    "latitude": 37.7749,
     │    "longitude": -122.4194,
     │    "speed": 45,
     │    "heading": 90,
     │    "accuracy": 5,
     │    "timestamp": 1704067200000
     │  }
     └─ Send to all connected clients (Socket.IO broadcast)

FRONTEND RECEIVES WEBSOCKET MESSAGE
  ├─ WebSocket message event listener triggers
  ├─ Parse incoming JSON
  ├─ Match against registered handlers
  ├─ Call handler function:
  │  onLocationUpdate({
  │    vehicleId: "550e8400...",
  │    latitude: 37.7749,
  │    longitude: -122.4194,
  │    speed: 45,
  │    ...
  │  })
  │
  ├─ Update TanStack Query cache:
  │  queryClient.setQueryData(['vehicle', vehicleId], prev => ({
  │    ...prev,
  │    location: { lat: 37.7749, lng: -122.4194 },
  │    speed: 45,
  │    lastUpdate: new Date()
  │  }))
  │
  └─ Component re-renders with new data

UI UPDATES VISUALLY
  ├─ VehicleMap:
  │  ├─ Move marker from old position to new position
  │  ├─ Animate transition (1 second smooth movement)
  │  ├─ Update heading (compass direction)
  │  └─ Speed indicator updates (45 mph)
  ├─ VehicleList:
  │  ├─ Row data refreshes
  │  ├─ Last updated timestamp shows "just now"
  │  └─ Speed column shows new value
  └─ Breadcrumb updates: "Last location 10 seconds ago"

SIMULTANEOUS UPDATES FOR ALL SUBSCRIBED CLIENTS
  ├─ Fleet Manager Dashboard:
  │  └─ Sees vehicle moving on fleet map
  ├─ Driver Mobile App:
  │  └─ Receives guidance update (new position for route)
  ├─ Dispatch Console:
  │  └─ Dispatch sees real-time vehicle positions
  └─ Multiple admin users viewing same dashboard:
     └─ All see vehicle move simultaneously

END-TO-END LATENCY
  ├─ GPS device → backend: 1-5s
  ├─ Backend processing: 100-500ms
  ├─ WebSocket broadcast: 10-100ms
  ├─ Network latency to client: 20-100ms
  ├─ Frontend update: < 50ms
  └─ **Total: 2-6 seconds typically**
```

### 5.3 State Management Pattern

**Multi-layer Architecture:**

```
LAYER 1: CACHE (Redis)
  ├─ Purpose: Distributed cache for API responses
  ├─ TTL: 5-600 seconds (depending on data)
  ├─ Keys: `vehicles:list:${tenantId}:${page}:${pageSize}`
  ├─ Hit rate: 60-70% for typical usage patterns
  └─ Cache invalidation: On write operations (POST/PUT/DELETE)

LAYER 2: BROWSER CACHE (TanStack Query)
  ├─ Purpose: Client-side caching of API responses
  ├─ Scope: User's browser tab
  ├─ Storage: In-memory (cleared on page refresh)
  ├─ Keys: ['vehicle', vehicleId] or ['vehicles:list', filters]
  ├─ Stale time: 10 seconds (data considered "stale" after)
  ├─ Cache time: 5 minutes (data removed from cache after)
  └─ Features:
     ├─ Background refetch if stale & window refocused
     ├─ Optimistic updates before server response
     └─ Deduped requests (multiple identical requests = 1 API call)

LAYER 3: REACT STATE
  ├─ Purpose: Local component state for UI interactions
  ├─ Scope: Single component
  ├─ Storage: Component memory
  ├─ Examples:
  │  ├─ Form inputs (typing, unsaved changes)
  │  ├─ Modal visibility (open/closed)
  │  ├─ Tab selection (active tab)
  │  └─ Sorting/filtering (sort column, active filters)
  └─ NOT for: API data (use TanStack Query instead)

LAYER 4: REACT CONTEXT (Global State)
  ├─ Purpose: App-wide state for auth, theme, preferences
  ├─ Scope: Entire application
  ├─ Storage: Memory (cleared on page refresh)
  ├─ Examples:
  │  ├─ AuthContext: { user, isAuthenticated, roles, permissions }
  │  ├─ WebSocketContext: { connected, subscribe, publish }
  │  ├─ TenantContext: { currentTenant, switchTenant }
  │  ├─ PermissionContext: { canAccess, isRole }
  │  └─ FeatureFlagContext: { isEnabled }
  └─ Optimization:
     ├─ Separate contexts by concern
     ├─ Memoize provider values
     └─ Consider context selectors for fine-grained subscriptions

LAYER 5: DATABASE (PostgreSQL)
  ├─ Purpose: Persistent storage of all data
  ├─ Scope: Entire fleet operation history
  ├─ Storage: Disk (ACID transactions)
  ├─ Features:
  │  ├─ Transactions (ACID guarantees)
  │  ├─ Row-Level Security (tenant isolation)
  │  ├─ Partitioning (audit_logs by month)
  │  ├─ Full-text search (pg_trgm)
  │  ├─ Vector embeddings (pgvector)
  │  ├─ Geographic queries (PostGIS)
  │  └─ Time-series optimization (consider TimescaleDB)
  └─ Consistency: Eventual consistency with Redis cache
```

**Example Flow: Update Vehicle Status**

```
User Action: Click "Set Vehicle to Maintenance"
  ↓
Component State: isSubmitting = true
  ↓
Optimistic Update (immediate UI feedback):
  queryClient.setQueryData(['vehicle', vehicleId], prev => ({
    ...prev,
    status: 'maintenance'
  }))
  ↓
Show UI: Vehicle status changes to "maintenance" immediately
  ↓
Send Request: PUT /api/vehicles/{id} { status: 'maintenance' }
  ├─ Include CSRF token
  └─ Include JWT token

Server Processing:
  ├─ Validate JWT + CSRF
  ├─ Check permissions (user can update vehicles?)
  ├─ Validate input (status is valid enum?)
  ├─ Database transaction:
  │  ├─ UPDATE vehicles SET status = 'maintenance'
  │  ├─ INSERT INTO audit_logs (for compliance)
  │  ├─ INSERT INTO cost_tracking (if maintenance cost relevant)
  │  └─ COMMIT or ROLLBACK
  └─ Return updated vehicle object

Response Received:
  ├─ IF success (200):
  │  ├─ Update TanStack Query cache with server response
  │  ├─ Invalidate related queries (vehicle list)
  │  ├─ Clear Redis cache for this vehicle
  │  ├─ Show success toast: "Vehicle updated"
  │  └─ No action needed (optimistic update was correct)
  │
  └─ IF error (400/403/500):
     ├─ Revert optimistic update
     ├─ Show error toast with message
     ├─ Log to Sentry (if 5xx)
     └─ Enable user to retry

Final State:
  ├─ Database: vehicle.status = 'maintenance'
  ├─ Redis Cache: invalidated (next request fetches from DB)
  ├─ TanStack Query: vehicle.status = 'maintenance'
  ├─ React Context: no change (stateless update)
  └─ UI: Shows "maintenance" status badge
```

---

## 6. SECURITY ARCHITECTURE

### 6.1 Authentication & Authorization

**Multi-factor Authentication:**
```
1. JWT Token (Access Token)
   ├─ Issued on login
   ├─ Expires in 15 minutes
   ├─ Stored in memory (SPA best practice)
   ├─ Included in Authorization header
   └─ Verified at each protected endpoint

2. Refresh Token (Long-lived)
   ├─ Issued on login
   ├─ Expires in 7 days
   ├─ Stored in httpOnly cookie (prevents XSS)
   ├─ Automatic refresh via token-refresh.ts
   └─ Revoked on logout

3. CSRF Token (Session-specific)
   ├─ Fetched from /api/csrf-token on app init
   ├─ Stored in memory (NOT localStorage)
   ├─ Included in X-CSRF-Token header for state-changing requests
   ├─ Paired with httpOnly session cookie
   └─ Validated on server for all POST/PUT/DELETE

4. Session Cookie (httpOnly)
   ├─ Set on login response
   ├─ httpOnly flag: prevents JavaScript access (XSS protection)
   ├─ Secure flag: only sent over HTTPS
   ├─ SameSite: Strict (CSRF protection)
   └─ Automatically included with credentials: 'include'

5. MFA (Multi-factor Authentication)
   ├─ User can enable 2FA via TOTP (Google Authenticator)
   ├─ On login:
   │  ├─ Step 1: Email + password
   │  ├─ Step 2: If MFA enabled → Enter TOTP code
   │  └─ Step 3: Generate JWT token on success
   └─ MFA tokens stored in mfa_tokens table (with expiration)
```

### 6.2 Authorization Layers

**Role-Based Access Control (RBAC):**
```
Roles:
  ├─ SuperAdmin: Full system access
  ├─ Admin: Company/tenant admin
  ├─ Manager: Fleet/department manager
  ├─ User: Standard user (driver, technician)
  └─ ReadOnly: View-only access

Permissions Matrix:
  Vehicle Management:
  ├─ VEHICLE_READ: View vehicles (all roles)
  ├─ VEHICLE_CREATE: Create vehicle (Admin+)
  ├─ VEHICLE_UPDATE: Edit vehicle (Admin/Manager)
  ├─ VEHICLE_DELETE: Delete vehicle (SuperAdmin only)
  └─ VEHICLE_EXPORT: Export vehicle data (Manager+)

  Driver Management:
  ├─ DRIVER_READ: View drivers (all roles)
  ├─ DRIVER_CREATE: Hire driver (Admin+)
  ├─ DRIVER_UPDATE: Edit driver profile (Admin/Manager)
  └─ DRIVER_TERMINATE: Fire driver (Admin only)

  Compliance:
  ├─ COMPLIANCE_READ: View compliance dashboard (all roles)
  ├─ COMPLIANCE_WRITE: File incident report (Manager+)
  ├─ COMPLIANCE_INVESTIGATE: Assign investigator (Admin+)
  └─ COMPLIANCE_EXPORT: Export compliance reports (Admin+)

  Admin Functions:
  ├─ USER_MANAGEMENT: Manage users (SuperAdmin/Admin)
  ├─ TENANT_MANAGEMENT: Manage tenants (SuperAdmin)
  ├─ AUDIT_LOG_VIEW: View audit trail (Admin+)
  └─ CONFIG_WRITE: Change system settings (SuperAdmin)
```

**Resource-Level Authorization:**
```
Example: User tries to view vehicle
  ├─ Request: GET /api/vehicles/{vehicleId}
  ├─ Checks:
  │  ├─ Is user authenticated? → YES, continue
  │  ├─ Does user have VEHICLE_READ permission? → YES, continue
  │  ├─ Does vehicle belong to user's tenant? → YES, continue
  │  ├─ Is vehicle not deleted/archived? → YES, continue
  │  └─ Can return vehicle data
  └─ Database RLS: Only returns rows where tenant_id = user.tenant_id
```

### 6.3 Data Protection

**Encryption:**
```
At Rest:
  ├─ Database: Encrypted volumes (Azure Storage Encryption)
  ├─ Sensitive fields:
  │  ├─ password_hash: Bcrypt (cost >= 12)
  │  ├─ mfa_secret: AES-256 encryption
  │  ├─ api_keys.key_material: AES-256 encryption
  │  └─ session_tokens: Hashed (SHA-256)
  └─ Key management: Azure Key Vault

In Transit:
  ├─ All endpoints: HTTPS only
  ├─ TLS 1.3: Enforced (no TLS 1.0/1.1)
  ├─ Certificate pinning: Optional (for mobile apps)
  └─ API rate limiting: 1000 req/minute per user
```

**Input Validation:**
```
Validation Strategy: Whitelist (positive validation)
  ├─ Never assume input is safe
  ├─ Define schema for every endpoint
  ├─ Use Zod for schema validation
  ├─ Example:
  │  const vehicleCreateSchema = z.object({
  │    vin: z.string().length(17).regex(/^[A-HJ-NPR-Z0-9]{17}$/),
  │    make: z.string().min(1).max(100),
  │    model: z.string().min(1).max(100),
  │    year: z.number().int().min(1900).max(2050),
  │    licensePlate: z.string().min(1).max(20),
  │    fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid']),
  │  })
  │
  └─ Validation happens at:
     ├─ Frontend: useForm validation (UX)
     ├─ Backend middleware: validateBody/validateQuery (security)
     └─ Database constraints: CHECK constraints (last line of defense)

Output Encoding:
  ├─ JSON responses: Automatic (JSON.stringify)
  ├─ HTML in responses: Use DOMPurify (if any)
  ├─ CSV exports: Quote fields properly
  └─ Database: Use parameterized queries only
```

### 6.4 Audit Logging

```
What's Logged:
  ├─ All authentication events (login, logout, MFA)
  ├─ All data modifications (INSERT, UPDATE, DELETE)
  ├─ All permission checks (allowed, denied)
  ├─ All document access (for PII)
  ├─ System configuration changes
  ├─ Failed security checks
  └─ Anomalous access patterns

Audit Log Entry:
  {
    id: BigInt (BIGSERIAL),
    event_timestamp: NOW(),
    user_id: "user-uuid",
    session_id: "session-uuid",
    action: "VEHICLE_UPDATE",
    resource_type: "vehicle",
    resource_id: "vehicle-uuid",
    ip_address: "192.168.1.100",
    user_agent: "Mozilla/5.0...",
    request_method: "PUT",
    request_path: "/api/vehicles/...",
    request_body: { /* sensitive data redacted */ },
    response_status: 200,
    execution_time_ms: 125,
    metadata: {
      tenant_id: "tenant-uuid",
      role: "Manager",
      changes: {
        status: "active → maintenance"
      }
    },
    severity: "info",
    correlation_id: "req-123456"
  }

Retention Policy:
  ├─ Audit logs: 7 years (compliance)
  ├─ Security events: 5 years
  ├─ Session logs: 1 year
  └─ Data access logs: 2 years

Table Partitioning:
  ├─ Partitioned by MONTH for query performance
  ├─ Allows efficient range queries
  ├─ Example: SELECT * FROM audit_logs_2024_01
  └─ Old partitions can be archived to cold storage

Tamper Detection:
  ├─ Monthly digest generated (audit_log_digests table)
  ├─ Hash of all log entries for month
  ├─ Can detect if any log entries were modified
  └─ Hash chain: each month's hash includes previous month
```

---

## CONCLUSION

CTAFleet is a **comprehensive, enterprise-grade fleet management system** with:

1. **89 database tables** organized into 20 logical domains
2. **179 API endpoints** for all business operations
3. **Multi-tenant SaaS architecture** with complete tenant isolation
4. **Real-time telematics** via WebSocket connections
5. **Advanced AI/ML capabilities** with predictive maintenance, driver scoring, and cognition engine
6. **Multi-layer security** with JWT, CSRF, MFA, RBAC, RLS, and comprehensive audit logging
7. **Scalable infrastructure** with Redis caching, PostgreSQL + PostGIS, and Azure integrations

The system enables fleet operators to:
- Track vehicles in real-time with GPS and OBD-II telematics
- Manage drivers with safety scoring and behavioral analysis
- Schedule and track maintenance with predictive analytics
- Monitor fuel consumption and optimize routes
- Ensure compliance with safety and regulatory requirements
- Analyze costs across multiple dimensions
- Generate custom reports and dashboards
- Manage assets and inventory
- Collaborate across departments

All while maintaining enterprise-grade security, compliance, and data governance standards.

