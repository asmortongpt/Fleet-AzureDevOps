# CTA Fleet Management System - Entity Relationship Diagram

**Database:** PostgreSQL 14+
**Total Tables:** 89
**Architecture:** Multi-tenant with Row-Level Security (RLS)
**Date:** February 5, 2026

---

## Core Multi-Tenancy Architecture

```mermaid
erDiagram
    %% ===================================================================
    %% CORE MULTI-TENANCY - ROOT OF ALL RELATIONSHIPS
    %% ===================================================================
    tenants ||--o{ users : "has many"
    tenants ||--o{ vehicles : "owns"
    tenants ||--o{ drivers : "employs"
    tenants ||--o{ facilities : "operates"
    tenants ||--o{ vendors : "contracts with"

    tenants {
        uuid id PK
        varchar name
        varchar domain UK
        jsonb settings
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    %% ===================================================================
    %% CORE ENTITIES
    %% ===================================================================
    users {
        uuid id PK
        uuid tenant_id FK
        varchar email UK
        varchar password_hash
        varchar first_name
        varchar last_name
        varchar role
        boolean is_active
        boolean mfa_enabled
        timestamptz created_at
    }

    vehicles {
        uuid id PK
        uuid tenant_id FK
        varchar vin UK
        varchar make
        varchar model
        integer year
        varchar status
        geography location
        decimal odometer
        uuid assigned_driver_id FK
        uuid assigned_facility_id FK
        timestamptz created_at
    }

    drivers {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        varchar license_number UK
        date license_expiration
        decimal safety_score
        integer incidents_count
        timestamptz created_at
    }

    facilities {
        uuid id PK
        uuid tenant_id FK
        varchar name
        varchar facility_type
        geography location
        integer capacity
        integer service_bays
        boolean is_active
    }

    vendors {
        uuid id PK
        uuid tenant_id FK
        varchar vendor_name
        varchar vendor_type
        varchar contact_email
        boolean is_active
    }

    %% ===================================================================
    %% RELATIONSHIPS - CORE
    %% ===================================================================
    users ||--o{ drivers : "is driver profile"
    vehicles }o--|| drivers : "assigned to"
    vehicles }o--|| facilities : "located at"
```

---

## Fleet Operations & Maintenance

```mermaid
erDiagram
    %% ===================================================================
    %% MAINTENANCE & WORK ORDERS
    %% ===================================================================
    vehicles ||--o{ work_orders : "requires"
    facilities ||--o{ work_orders : "services at"
    users ||--o{ work_orders : "technician assigned"
    vendors ||--o{ work_orders : "parts from"

    vehicles ||--o{ maintenance_schedules : "scheduled for"
    vehicles ||--o{ service_history : "history"

    work_orders {
        uuid id PK
        uuid tenant_id FK
        varchar work_order_number UK
        uuid vehicle_id FK
        uuid facility_id FK
        uuid assigned_technician_id FK
        varchar type
        varchar priority
        varchar status
        decimal labor_cost
        decimal parts_cost
        decimal total_cost
        timestamptz created_at
    }

    maintenance_schedules {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        varchar schedule_type
        integer interval_miles
        integer interval_days
        date next_due_date
        varchar status
    }

    service_history {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        uuid work_order_id FK
        date service_date
        varchar service_type
        decimal cost
    }

    asset_maintenance {
        uuid id PK
        uuid tenant_id FK
        uuid asset_id FK
        date maintenance_date
        varchar maintenance_type
        decimal cost
    }
```

---

## Telematics & Real-Time Tracking

```mermaid
erDiagram
    %% ===================================================================
    %% TELEMATICS & GPS TRACKING
    %% ===================================================================
    vehicles ||--o{ vehicle_locations : "tracked"
    vehicles ||--o{ obd_telemetry : "diagnostics"
    vehicles ||--o{ telemetry_data : "telemetry"
    vehicles ||--o{ driver_behavior_events : "events"
    vehicles ||--o{ video_telematics_footage : "footage"
    vehicles ||--o{ trips : "completed"

    drivers ||--o{ driver_behavior_events : "behavior"
    drivers ||--o{ trips : "drove"

    vehicle_locations {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        decimal latitude
        decimal longitude
        decimal speed
        decimal heading
        timestamptz recorded_at
    }

    obd_telemetry {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        integer rpm
        integer speed
        decimal fuel_level
        text[] dtc_codes
        timestamptz recorded_at
    }

    telemetry_data {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        decimal latitude
        decimal longitude
        boolean harsh_braking
        boolean harsh_acceleration
        boolean speeding
        jsonb raw_data
        timestamptz timestamp
    }

    driver_behavior_events {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        uuid driver_id FK
        varchar event_type
        decimal severity_score
        timestamptz event_time
    }

    trips {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        uuid driver_id FK
        timestamptz start_time
        timestamptz end_time
        decimal distance
        decimal duration
    }
```

---

## Routes & Geofences

```mermaid
erDiagram
    %% ===================================================================
    %% ROUTE OPTIMIZATION & GEOFENCES
    %% ===================================================================
    vehicles ||--o{ routes : "travels"
    drivers ||--o{ routes : "drives"
    routes ||--o{ route_stops : "has stops"
    routes ||--o{ route_waypoints : "has waypoints"
    routes ||--o{ optimized_routes : "optimized as"

    vehicles ||--o{ geofence_events : "triggered"
    geofences ||--o{ geofence_events : "events"

    routes {
        uuid id PK
        uuid tenant_id FK
        varchar route_name
        uuid vehicle_id FK
        uuid driver_id FK
        varchar status
        decimal total_distance
        jsonb waypoints
        timestamptz created_at
    }

    geofences {
        uuid id PK
        uuid tenant_id FK
        varchar name
        geography geometry
        boolean alert_on_entry
        boolean alert_on_exit
        boolean is_active
    }

    geofence_events {
        uuid id PK
        uuid tenant_id FK
        uuid geofence_id FK
        uuid vehicle_id FK
        uuid driver_id FK
        varchar event_type
        timestamptz event_time
    }

    route_optimization_jobs {
        uuid id PK
        uuid tenant_id FK
        varchar status
        jsonb input_params
        jsonb output_result
    }

    route_stops {
        uuid id PK
        uuid route_id FK
        varchar stop_name
        geography location
        integer sequence_order
    }

    optimized_routes {
        uuid id PK
        uuid tenant_id FK
        uuid original_route_id FK
        jsonb optimized_waypoints
        decimal estimated_savings
    }
```

---

## Financial Management & Accounting

```mermaid
erDiagram
    %% ===================================================================
    %% FINANCIAL & ACCOUNTING
    %% ===================================================================
    vehicles ||--o{ expenses : "incurs"
    drivers ||--o{ expenses : "submits"
    users ||--o{ expenses : "approves"

    vendors ||--o{ invoices : "bills"
    vendors ||--o{ purchase_orders : "fulfills"

    vehicles ||--o{ fuel_transactions : "fuels"
    drivers ||--o{ fuel_transactions : "purchases"
    fuel_stations ||--o{ fuel_transactions : "sold at"

    expenses {
        uuid id PK
        uuid tenant_id FK
        varchar expense_number UK
        uuid vehicle_id FK
        uuid driver_id FK
        uuid submitted_by_user_id FK
        decimal amount
        varchar reimbursement_status
        timestamptz created_at
    }

    invoices {
        uuid id PK
        uuid tenant_id FK
        uuid vendor_id FK
        varchar invoice_number UK
        decimal amount
        varchar status
        date due_date
    }

    purchase_orders {
        uuid id PK
        uuid tenant_id FK
        uuid vendor_id FK
        varchar po_number UK
        decimal total_amount
        varchar status
    }

    fuel_transactions {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        uuid driver_id FK
        decimal gallons
        decimal price_per_gallon
        decimal total_cost
        timestamptz transaction_date
    }

    fuel_stations {
        uuid id PK
        uuid tenant_id FK
        varchar station_name
        decimal lat
        decimal lng
        text[] fuel_types
        boolean accepts_fleet_cards
    }

    fuel_cards {
        uuid id PK
        uuid tenant_id FK
        varchar card_number UK
        uuid assigned_driver_id FK
        boolean is_active
    }

    budget_allocations {
        uuid id PK
        uuid tenant_id FK
        varchar budget_category
        decimal allocated_amount
        decimal spent_amount
        integer fiscal_year
    }

    depreciation_schedules {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        varchar method
        decimal purchase_price
        decimal salvage_value
        integer useful_life_years
    }

    cost_tracking {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        varchar cost_category
        decimal amount
        date cost_date
    }
```

---

## Documents & Knowledge Management (RAG)

```mermaid
erDiagram
    %% ===================================================================
    %% DOCUMENT MANAGEMENT WITH RAG
    %% ===================================================================
    users ||--o{ documents : "uploads"
    document_categories ||--o{ documents : "categorizes"
    documents ||--o{ document_versions : "versioned"
    documents ||--o{ document_embeddings : "embedded"
    documents ||--o{ document_comments : "commented on"
    documents ||--o{ document_permissions : "shared with"
    document_folders ||--o{ documents : "organizes"

    documents {
        uuid id PK
        uuid tenant_id FK
        varchar file_name
        varchar file_type
        bigint file_size
        text file_url
        uuid category_id FK
        uuid uploaded_by FK
        text extracted_text
        varchar embedding_status
        timestamptz created_at
    }

    document_embeddings {
        uuid id PK
        uuid document_id FK
        text chunk_text
        integer chunk_index
        vector embedding
        varchar chunk_type
        integer page_number
        timestamptz created_at
    }

    document_versions {
        uuid id PK
        uuid document_id FK
        integer version_number
        text file_url
        uuid created_by FK
        timestamptz created_at
    }

    document_rag_queries {
        uuid id PK
        uuid tenant_id FK
        text query_text
        vector query_embedding
        jsonb results
        timestamptz created_at
    }

    document_categories {
        uuid id PK
        uuid tenant_id FK
        varchar category_name
        varchar description
    }

    document_comments {
        uuid id PK
        uuid document_id FK
        uuid user_id FK
        text comment_text
        timestamptz created_at
    }

    document_folders {
        uuid id PK
        uuid tenant_id FK
        varchar folder_name
        uuid parent_folder_id FK
    }
```

---

## AI/ML Infrastructure

```mermaid
erDiagram
    %% ===================================================================
    %% AI/ML & COGNITION ENGINE
    %% ===================================================================
    users ||--o{ ml_models : "creates"
    ml_models ||--o{ model_performance : "metrics"
    ml_models ||--o{ training_jobs : "trained by"
    ml_models ||--o{ model_ab_tests : "tested in"
    ml_models ||--o{ predictions : "predicts"

    predictions ||--o{ feedback_loops : "feedback"

    ml_models {
        uuid id PK
        uuid tenant_id FK
        varchar model_name
        varchar model_type
        varchar version
        varchar algorithm
        jsonb hyperparameters
        varchar status
        boolean is_active
        timestamptz created_at
    }

    predictions {
        uuid id PK
        uuid tenant_id FK
        uuid model_id FK
        varchar prediction_type
        varchar entity_type
        uuid entity_id
        jsonb prediction_value
        decimal confidence_score
        boolean is_correct
        timestamptz created_at
    }

    training_jobs {
        uuid id PK
        uuid model_id FK
        varchar status
        integer training_data_size
        integer duration_seconds
        timestamptz started_at
        timestamptz completed_at
    }

    model_performance {
        uuid id PK
        uuid model_id FK
        decimal accuracy
        decimal precision
        decimal recall
        decimal f1_score
        timestamptz evaluated_at
    }

    cognition_insights {
        uuid id PK
        uuid tenant_id FK
        varchar insight_type
        varchar severity
        text description
        jsonb recommended_actions
        boolean is_acknowledged
        timestamptz created_at
    }

    anomalies {
        uuid id PK
        uuid tenant_id FK
        varchar anomaly_type
        jsonb affected_entities
        decimal severity_score
        timestamptz detected_at
    }

    detected_patterns {
        uuid id PK
        uuid tenant_id FK
        varchar pattern_type
        jsonb pattern_data
        decimal confidence
        timestamptz detected_at
    }

    mcp_servers {
        uuid id PK
        uuid tenant_id FK
        varchar server_name
        varchar server_type
        text connection_url
        boolean is_active
        varchar connection_status
    }

    embedding_vectors {
        uuid id PK
        uuid tenant_id FK
        varchar source_type
        uuid source_id
        vector embedding
        timestamptz created_at
    }

    rag_queries {
        uuid id PK
        uuid tenant_id FK
        text query_text
        vector query_embedding
        jsonb results
        uuid user_id FK
        timestamptz created_at
    }
```

---

## Safety & Compliance

```mermaid
erDiagram
    %% ===================================================================
    %% SAFETY, COMPLIANCE & INCIDENTS
    %% ===================================================================
    vehicles ||--o{ safety_incidents : "involved in"
    drivers ||--o{ safety_incidents : "reported"

    vehicles ||--o{ inspections : "inspected"
    inspection_forms ||--o{ inspections : "uses template"

    vehicles ||--o{ damage_reports : "damaged"
    vehicles ||--o{ video_events : "recorded"

    incidents ||--o{ incident_actions : "corrective actions"
    incidents ||--o{ incident_timeline : "timeline"
    incidents ||--o{ incident_witnesses : "witnesses"
    incidents ||--o{ incident_photos : "photos"

    safety_incidents {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        uuid driver_id FK
        varchar incident_type
        varchar severity
        date incident_date
        text description
    }

    inspections {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        uuid inspector_id FK
        uuid form_id FK
        date inspection_date
        varchar status
        jsonb results
    }

    inspection_forms {
        uuid id PK
        uuid tenant_id FK
        varchar form_name
        jsonb checklist_items
        boolean is_active
    }

    damage_reports {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        varchar damage_type
        text description
        jsonb damage_location_3d
        decimal estimated_cost
    }

    video_events {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        varchar event_type
        text video_url
        timestamptz event_time
    }

    incidents {
        uuid id PK
        uuid tenant_id FK
        varchar incident_title
        uuid vehicle_id FK
        uuid driver_id FK
        varchar severity
        varchar status
        date incident_date
        boolean injuries_reported
        boolean property_damage
    }
```

---

## Tasks, Operations & Workflow

```mermaid
erDiagram
    %% ===================================================================
    %% TASK MANAGEMENT & OPERATIONS
    %% ===================================================================
    users ||--o{ tasks : "assigned"
    vehicles ||--o{ tasks : "related to"
    tasks ||--o{ task_comments : "commented"
    tasks ||--o{ task_time_entries : "time tracked"
    tasks ||--o{ task_checklist_items : "checklist"
    tasks ||--o{ task_attachments : "attached files"
    tasks ||--o{ tasks : "subtasks"

    tasks {
        uuid id PK
        uuid tenant_id FK
        varchar task_title
        text description
        varchar task_type
        varchar priority
        varchar status
        uuid assigned_to FK
        uuid created_by FK
        date due_date
        uuid vehicle_id FK
        uuid parent_task_id FK
        timestamptz created_at
    }

    task_comments {
        uuid id PK
        uuid task_id FK
        uuid user_id FK
        text comment_text
        timestamptz created_at
    }

    task_time_entries {
        uuid id PK
        uuid task_id FK
        uuid user_id FK
        decimal hours_worked
        timestamptz entry_date
    }

    task_checklist_items {
        uuid id PK
        uuid task_id FK
        varchar item_text
        boolean is_completed
        integer sequence_order
    }

    task_attachments {
        uuid id PK
        uuid task_id FK
        varchar file_name
        text file_url
        timestamptz uploaded_at
    }
```

---

## Assets & Inventory

```mermaid
erDiagram
    %% ===================================================================
    %% ASSET MANAGEMENT
    %% ===================================================================
    users ||--o{ assets : "assigned"
    assets ||--o{ asset_assignments : "assignment history"
    assets ||--o{ asset_transfers : "transfer history"
    assets ||--o{ asset_audit_log : "audited"
    assets ||--o{ asset_tags : "tagged"
    assets ||--o{ asset_maintenance : "maintained"

    assets {
        uuid id PK
        uuid tenant_id FK
        varchar asset_tag UK
        varchar asset_name
        varchar asset_type
        varchar serial_number
        decimal purchase_price
        decimal current_value
        varchar status
        uuid assigned_to FK
        timestamptz created_at
    }

    asset_assignments {
        uuid id PK
        uuid asset_id FK
        uuid user_id FK
        timestamptz assigned_at
        timestamptz returned_at
        varchar condition_at_assignment
    }

    asset_transfers {
        uuid id PK
        uuid asset_id FK
        uuid from_user_id FK
        uuid to_user_id FK
        timestamptz transfer_date
        text reason
    }

    asset_audit_log {
        uuid id PK
        uuid asset_id FK
        varchar action
        jsonb changes
        uuid performed_by FK
        timestamptz performed_at
    }

    asset_tags {
        uuid id PK
        uuid asset_id FK
        varchar tag_name
        varchar tag_value
    }
```

---

## Communications & Notifications

```mermaid
erDiagram
    %% ===================================================================
    %% NOTIFICATIONS & ALERTS
    %% ===================================================================
    users ||--o{ notifications : "receives"
    users ||--o{ notification_preferences : "preferences"
    users ||--o{ messages : "sends/receives"

    alert_rules ||--o{ alerts : "triggers"
    alerts ||--o{ alert_delivery_log : "delivered"
    alerts ||--o{ alert_escalations : "escalated"

    notifications {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        varchar notification_type
        varchar title
        text message
        boolean is_read
        varchar priority
        timestamptz created_at
    }

    notification_preferences {
        uuid id PK
        uuid user_id FK
        varchar channel
        boolean enabled
        jsonb settings
    }

    messages {
        uuid id PK
        uuid tenant_id FK
        uuid from_user_id FK
        uuid to_user_id FK
        varchar subject
        text body
        boolean is_read
        timestamptz sent_at
    }

    alert_rules {
        uuid id PK
        uuid tenant_id FK
        varchar rule_name
        varchar rule_type
        jsonb conditions
        boolean is_active
    }

    alerts {
        uuid id PK
        uuid tenant_id FK
        uuid rule_id FK
        varchar severity
        text message
        jsonb context_data
        boolean is_acknowledged
        timestamptz triggered_at
    }

    alert_delivery_log {
        uuid id PK
        uuid alert_id FK
        varchar delivery_channel
        varchar status
        timestamptz delivered_at
    }

    alert_escalations {
        uuid id PK
        uuid alert_id FK
        uuid escalated_to_user_id FK
        integer escalation_level
        timestamptz escalated_at
    }

    communication_logs {
        uuid id PK
        uuid tenant_id FK
        varchar communication_type
        jsonb participants
        text subject
        timestamptz sent_at
    }
```

---

## Analytics & Reporting

```mermaid
erDiagram
    %% ===================================================================
    %% CUSTOM REPORTS & ANALYTICS
    %% ===================================================================
    users ||--o{ custom_reports : "creates"
    custom_reports ||--o{ report_schedules : "scheduled"
    custom_reports ||--o{ report_executions : "executed"
    custom_reports ||--o{ report_shares : "shared"
    users ||--o{ report_favorites : "favorited"

    drivers ||--o{ driver_scores : "scored"
    drivers ||--o{ driver_achievements : "earned"

    vehicles ||--o{ utilization_metrics : "metrics"
    vehicles ||--o{ fleet_optimization_recommendations : "recommendations"

    custom_reports {
        uuid id PK
        uuid tenant_id FK
        varchar report_name
        text[] data_sources
        jsonb filters
        jsonb columns
        uuid created_by FK
        boolean is_public
        timestamptz created_at
    }

    report_schedules {
        uuid id PK
        uuid report_id FK
        varchar frequency
        varchar format
        text[] recipients
        boolean is_active
    }

    report_executions {
        uuid id PK
        uuid report_id FK
        uuid executed_by FK
        integer row_count
        text file_url
        varchar status
        timestamptz execution_time
    }

    report_templates {
        uuid id PK
        uuid tenant_id FK
        varchar template_name
        jsonb template_config
        boolean is_public
    }

    driver_scores {
        uuid id PK
        uuid tenant_id FK
        uuid driver_id FK
        decimal safety_score
        decimal efficiency_score
        decimal overall_score
        date period_start
        date period_end
    }

    driver_achievements {
        uuid id PK
        uuid driver_id FK
        varchar achievement_type
        varchar achievement_name
        timestamptz earned_at
    }

    utilization_metrics {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        decimal utilization_rate
        decimal total_miles
        date period_start
        date period_end
    }
```

---

## Security & Authentication

```mermaid
erDiagram
    %% ===================================================================
    %% SECURITY & AUTHENTICATION
    %% ===================================================================
    users ||--o{ mfa_tokens : "2FA tokens"
    users ||--o{ session_tokens : "sessions"
    users ||--o{ api_keys : "API keys"
    users ||--o{ data_access_logs : "accessed data"

    configuration_settings ||--o{ configuration_versions : "versioned"
    configuration_settings ||--o{ configuration_approvals : "approved"

    audit_logs ||--o{ audit_log_digests : "summarized"

    mfa_tokens {
        uuid id PK
        uuid user_id FK
        varchar token_secret
        boolean is_verified
        timestamptz created_at
    }

    session_tokens {
        uuid id PK
        uuid user_id FK
        varchar token_hash
        inet ip_address
        text user_agent
        timestamptz expires_at
        timestamptz created_at
    }

    revoked_tokens {
        uuid id PK
        varchar token_hash UK
        varchar revocation_reason
        timestamptz revoked_at
    }

    api_keys {
        uuid id PK
        uuid tenant_id FK
        varchar key_name
        varchar key_hash UK
        text[] permissions
        boolean is_active
        timestamptz expires_at
    }

    encryption_keys {
        uuid id PK
        varchar key_identifier UK
        text encrypted_key
        varchar algorithm
        boolean is_active
    }

    audit_logs {
        bigserial id PK
        timestamptz event_timestamp
        varchar user_id
        varchar action
        varchar resource_type
        inet ip_address
        varchar severity
    }

    security_events {
        uuid id PK
        varchar event_type
        varchar severity
        jsonb event_data
        inet source_ip
        timestamptz detected_at
    }

    rate_limits {
        uuid id PK
        varchar limit_key UK
        integer request_count
        timestamptz window_start
        timestamptz window_end
    }

    blocked_entities {
        uuid id PK
        varchar entity_type
        varchar entity_value
        text reason
        timestamptz blocked_at
        timestamptz expires_at
    }

    data_classifications {
        uuid id PK
        varchar classification_level
        varchar description
        text[] access_requirements
    }
```

---

## Integrations & External Systems

```mermaid
erDiagram
    %% ===================================================================
    %% INTEGRATIONS
    %% ===================================================================
    users ||--o{ webhook_subscriptions : "subscribed"
    users ||--o{ microsoft_graph_sync : "synced"
    users ||--o{ calendar_integrations : "calendar"
    users ||--o{ outlook_emails : "emails"

    webhook_subscriptions {
        uuid id PK
        uuid tenant_id FK
        varchar event_type
        text callback_url
        varchar secret_key
        boolean is_active
    }

    microsoft_graph_sync {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        varchar sync_type
        timestamptz last_sync_at
        varchar sync_status
    }

    calendar_integrations {
        uuid id PK
        uuid user_id FK
        varchar provider
        varchar calendar_id
        boolean is_active
    }

    teams_integration_messages {
        uuid id PK
        uuid tenant_id FK
        varchar channel_id
        varchar message_id
        text content
        timestamptz sent_at
    }

    outlook_emails {
        uuid id PK
        uuid user_id FK
        varchar message_id
        varchar subject
        timestamptz received_at
    }
```

---

## Search & Indexing

```mermaid
erDiagram
    %% ===================================================================
    %% SEARCH & FULL-TEXT INDEXING
    %% ===================================================================
    users ||--o{ search_query_log : "searches"
    users ||--o{ saved_searches : "saved"
    documents ||--o{ document_indexing_log : "indexed"

    search_query_log {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        text query_text
        integer results_count
        timestamptz searched_at
    }

    indexing_jobs {
        uuid id PK
        uuid tenant_id FK
        varchar index_type
        varchar status
        integer documents_processed
        timestamptz started_at
        timestamptz completed_at
    }

    document_indexing_log {
        uuid id PK
        uuid document_id FK
        varchar index_status
        timestamptz indexed_at
    }

    tenant_index_stats {
        uuid id PK
        uuid tenant_id FK
        integer total_documents
        bigint total_size_bytes
        timestamptz last_updated
    }

    search_history {
        uuid id PK
        uuid user_id FK
        text query_text
        timestamptz searched_at
    }

    saved_searches {
        uuid id PK
        uuid user_id FK
        varchar search_name
        text query_text
        jsonb filters
    }

    search_click_tracking {
        uuid id PK
        uuid search_query_id FK
        uuid result_id
        integer result_position
        timestamptz clicked_at
    }
```

---

## EV Charging Infrastructure

```mermaid
erDiagram
    %% ===================================================================
    %% ELECTRIC VEHICLE CHARGING
    %% ===================================================================
    vehicles ||--o{ charging_sessions : "charged"
    charging_stations ||--o{ charging_sessions : "session at"

    charging_stations {
        uuid id PK
        uuid tenant_id FK
        varchar station_name
        geography location
        integer charger_count
        varchar charger_type
        boolean is_active
    }

    charging_sessions {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        uuid station_id FK
        timestamptz start_time
        timestamptz end_time
        decimal energy_kwh
        decimal cost
    }

    ev_charging_stations {
        uuid id PK
        uuid tenant_id FK
        varchar station_id_external
        varchar provider
        jsonb capabilities
    }
```

---

## Policies & Governance

```mermaid
erDiagram
    %% ===================================================================
    %% BUSINESS POLICIES
    %% ===================================================================
    policies ||--o{ policy_violations : "violated"

    policies {
        uuid id PK
        uuid tenant_id FK
        varchar policy_name
        varchar policy_type
        jsonb rules
        boolean is_active
        boolean server_side_enforcement
    }

    policy_violations {
        uuid id PK
        uuid tenant_id FK
        uuid policy_id FK
        varchar entity_type
        uuid entity_id
        text violation_details
        varchar severity
        timestamptz detected_at
    }
```

---

## Master Data Management

```mermaid
erDiagram
    %% ===================================================================
    %% MASTER DATA MANAGEMENT (MDM)
    %% ===================================================================
    mdm_people {
        uuid id PK
        uuid tenant_id FK
        varchar canonical_name
        jsonb alternate_names
        jsonb attributes
        uuid source_system_id
        timestamptz created_at
    }

    mdm_places {
        uuid id PK
        uuid tenant_id FK
        varchar canonical_address
        geography location
        jsonb alternate_addresses
        jsonb attributes
    }

    mdm_things {
        uuid id PK
        uuid tenant_id FK
        varchar canonical_identifier
        varchar thing_type
        jsonb alternate_identifiers
        jsonb attributes
    }

    mdm_audit_log {
        uuid id PK
        varchar mdm_entity_type
        uuid mdm_entity_id
        varchar action
        jsonb changes
        timestamptz performed_at
    }
```

---

## Infrastructure & Monitoring

```mermaid
erDiagram
    %% ===================================================================
    %% INFRASTRUCTURE DATA
    %% ===================================================================
    traffic_cameras {
        uuid id PK
        uuid tenant_id FK
        varchar camera_id
        geography location
        text stream_url
        boolean is_active
    }

    weather_stations {
        uuid id PK
        uuid tenant_id FK
        varchar station_id
        geography location
        jsonb current_conditions
        timestamptz last_updated
    }

    toll_plazas {
        uuid id PK
        uuid tenant_id FK
        varchar plaza_name
        geography location
        decimal toll_rate
        boolean is_active
    }
```

---

## Key Relationship Summary

### Multi-Tenancy (Root)
- **tenants** → All domain tables (tenant_id FK)
- All 89 tables have `tenant_id` for data isolation
- Row-Level Security (RLS) enforced at database layer

### Core Entity Relationships
- **users** ↔ **drivers** (one-to-one via user_id)
- **vehicles** → **drivers** (assigned_driver_id)
- **vehicles** → **facilities** (assigned_facility_id)
- **vehicles** → **work_orders** (one-to-many)

### Telemetry & Tracking
- **vehicles** → **vehicle_locations** (real-time GPS)
- **vehicles** → **obd_telemetry** (diagnostics)
- **vehicles** → **trips** (completed trips)
- **drivers** → **driver_behavior_events** (safety events)

### Financial & Costs
- **vehicles** → **expenses** (vehicle-related costs)
- **drivers** → **expenses** (reimbursements)
- **vendors** → **invoices** (billing)
- **vehicles** → **fuel_transactions** (fuel costs)

### AI/ML & Cognition
- **ml_models** → **predictions** (model outputs)
- **documents** → **document_embeddings** (RAG vectors)
- **predictions** → **feedback_loops** (continuous learning)

### Document & Knowledge
- **documents** → **document_embeddings** (pgvector for RAG)
- **documents** → **document_versions** (version history)
- **document_embeddings** uses `vector(1536)` for semantic search

---

## Database Statistics

| Metric | Value |
|--------|-------|
| **Total Tables** | 89 |
| **Foreign Key Relationships** | ~150 |
| **Database Extensions** | 7 (PostGIS, pgvector, etc.) |
| **Partitioned Tables** | audit_logs (monthly) |
| **Vector Dimensions** | 1536 (OpenAI embeddings) |
| **Row-Level Security** | Enabled on all domain tables |
| **Multi-Tenancy** | Full tenant isolation |

---

## Technology Features

### PostgreSQL Extensions
1. **uuid-ossp** - UUID generation
2. **pgcrypto** - Encryption functions
3. **postgis** - Geospatial queries
4. **pg_trgm** - Full-text search
5. **earthdistance** - Geographic calculations
6. **pgvector** - Vector embeddings (RAG)
7. **vector** - Alternative vector extension

### Index Types
- **B-tree** - Standard indexes
- **GIST** - PostGIS geospatial
- **GIN** - Full-text search, JSONB
- **ivfflat** - Vector similarity (pgvector)

### Special Features
- **Partitioning** - audit_logs by month
- **Generated Columns** - Computed totals
- **Array Columns** - Multi-value fields
- **JSONB Storage** - Flexible structured data
- **Geography Type** - PostGIS spatial data

---

## Notes

- This ERD represents the complete schema as of February 5, 2026
- All tables implement tenant_id for multi-tenancy
- Vector embeddings use 1536 dimensions (OpenAI standard)
- Time-series tables should use TimescaleDB hypertables in production
- Audit logs are partitioned monthly for performance
- All sensitive data is encrypted at rest and in transit

---

**Generated:** February 5, 2026
**System:** CTA Fleet Management Platform
**Database:** PostgreSQL 14+ with 7 extensions
**Total Entities:** 89 tables across 20 logical domains
