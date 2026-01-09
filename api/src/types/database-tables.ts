/**
 * Database Table Type Definitions
 * Auto-generated from database migrations 005-015
 *
 * This file contains TypeScript interfaces for all 83 new database tables.
 * These types ensure type safety across the application.
 *
 * Generated: 2026-01-08
 */

// ============================================================================
// Common Types
// ============================================================================

export type UUID = string;
export type Timestamp = Date | string;
export type JSONB = Record<string, any>;

// ============================================================================
// Migration 005: Telematics & GPS Tables
// ============================================================================

export interface VehicleLocation {
  id: UUID;
  tenant_id: UUID;
  vehicle_id: UUID;
  latitude: number;
  longitude: number;
  altitude_meters?: number;
  heading_degrees?: number;
  speed_mph?: number;
  accuracy_meters?: number;
  gps_timestamp: Timestamp;
  odometer_reading?: number;
  engine_status?: 'running' | 'idling' | 'off';
  ignition_on: boolean;
  is_moving: boolean;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  geofence_ids?: UUID[];
  data_source?: string;
  device_id?: string;
  created_at: Timestamp;
}

export interface OBDTelemetry {
  id: UUID;
  tenant_id: UUID;
  vehicle_id: UUID;
  timestamp: Timestamp;
  odometer_reading?: number;
  engine_hours?: number;
  fuel_level_percent?: number;
  fuel_level_gallons?: number;
  engine_rpm?: number;
  speed_mph?: number;
  coolant_temp_f?: number;
  oil_pressure_psi?: number;
  battery_voltage?: number;
  throttle_position_percent?: number;
  engine_load_percent?: number;
  intake_air_temp_f?: number;
  mass_air_flow_rate?: number;
  dtc_codes?: string[];
  has_check_engine: boolean;
  mil_status: boolean;
  vin?: string;
  device_id?: string;
  raw_data?: JSONB;
  created_at: Timestamp;
}

export interface Geofence {
  id: UUID;
  tenant_id: UUID;
  geofence_name: string;
  geofence_type: 'circle' | 'polygon' | 'route_corridor';
  shape_data: JSONB;
  center_latitude?: number;
  center_longitude?: number;
  radius_meters?: number;
  polygon_coordinates?: JSONB;
  category?: 'customer_site' | 'depot' | 'service_area' | 'restricted_zone' | 'toll_zone' | 'custom';
  description?: string;
  color?: string;
  is_active: boolean;
  send_entry_alerts: boolean;
  send_exit_alerts: boolean;
  alert_recipients?: string[];
  allowed_vehicles?: UUID[];
  restricted_vehicles?: UUID[];
  active_hours_start?: string;
  active_hours_end?: string;
  active_days_of_week?: number[];
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface GeofenceEvent {
  id: UUID;
  tenant_id: UUID;
  geofence_id: UUID;
  vehicle_id: UUID;
  driver_id?: UUID;
  event_type: 'entry' | 'exit' | 'dwell' | 'violation';
  event_timestamp: Timestamp;
  latitude: number;
  longitude: number;
  speed_mph?: number;
  heading_degrees?: number;
  dwell_duration_minutes?: number;
  is_authorized: boolean;
  alert_sent: boolean;
  alert_sent_at?: Timestamp;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
}

export interface DriverBehaviorEvent {
  id: UUID;
  tenant_id: UUID;
  vehicle_id: UUID;
  driver_id?: UUID;
  trip_id?: UUID;
  event_type: 'harsh_braking' | 'harsh_acceleration' | 'harsh_cornering' | 'speeding' | 'idling_excessive' | 'seatbelt_violation' | 'distracted_driving';
  event_timestamp: Timestamp;
  latitude: number;
  longitude: number;
  speed_before_mph?: number;
  speed_after_mph?: number;
  speed_limit_mph?: number;
  g_force?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration_seconds?: number;
  video_footage_id?: UUID;
  address?: string;
  weather_conditions?: string;
  road_conditions?: string;
  requires_coaching: boolean;
  coaching_completed: boolean;
  coaching_completed_at?: Timestamp;
  coaching_notes?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
}

export interface VideoTelematicsFootage {
  id: UUID;
  tenant_id: UUID;
  vehicle_id: UUID;
  driver_id?: UUID;
  camera_position: 'forward' | 'driver_facing' | 'side' | 'rear' | '360';
  recording_timestamp: Timestamp;
  duration_seconds: number;
  trigger_event?: 'harsh_braking' | 'harsh_acceleration' | 'collision' | 'manual' | 'scheduled';
  video_url?: string;
  thumbnail_url?: string;
  storage_path?: string;
  file_size_mb?: number;
  resolution?: string;
  has_audio: boolean;
  latitude?: number;
  longitude?: number;
  speed_mph?: number;
  g_force?: number;
  ai_analysis_status?: 'pending' | 'processing' | 'completed' | 'failed';
  ai_detected_events?: string[];
  ai_confidence_scores?: JSONB;
  is_reviewed: boolean;
  reviewed_by?: UUID;
  reviewed_at?: Timestamp;
  review_notes?: string;
  retention_until?: Timestamp;
  is_evidence: boolean;
  linked_incident_id?: UUID;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Trip {
  id: UUID;
  tenant_id: UUID;
  vehicle_id: UUID;
  driver_id?: UUID;
  trip_number: string;
  start_timestamp: Timestamp;
  end_timestamp?: Timestamp;
  duration_minutes?: number;
  start_odometer?: number;
  end_odometer?: number;
  distance_miles?: number;
  start_location?: JSONB;
  end_location?: JSONB;
  start_address?: string;
  end_address?: string;
  route_taken?: JSONB;
  purpose?: 'business' | 'personal' | 'commute' | 'unknown';
  is_personal_use: boolean;
  business_classification?: string;
  avg_speed_mph?: number;
  max_speed_mph?: number;
  idle_time_minutes?: number;
  fuel_consumed_gallons?: number;
  fuel_cost?: number;
  mpg?: number;
  driver_behavior_score?: number;
  harsh_events_count?: number;
  stops_count?: number;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Route {
  id: UUID;
  tenant_id: UUID;
  route_name: string;
  route_type: 'planned' | 'optimized' | 'historical' | 'template';
  origin: JSONB;
  destination: JSONB;
  waypoints?: JSONB;
  distance_miles?: number;
  estimated_duration_minutes?: number;
  route_geometry?: JSONB;
  encoded_polyline?: string;
  traffic_enabled: boolean;
  avoid_tolls: boolean;
  avoid_highways: boolean;
  avoid_ferries: boolean;
  optimization_criteria?: 'fastest' | 'shortest' | 'fuel_efficient' | 'avoid_traffic';
  optimization_score?: number;
  assigned_vehicles?: UUID[];
  assigned_drivers?: UUID[];
  active_days_of_week?: number[];
  is_active: boolean;
  usage_count: number;
  last_used_at?: Timestamp;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface TripUsageClassification {
  id: UUID;
  tenant_id: UUID;
  trip_id: UUID;
  vehicle_id: UUID;
  driver_id?: UUID;
  classification: 'business' | 'personal' | 'commute';
  classification_method: 'automatic' | 'manual' | 'policy_based' | 'gps_analysis';
  confidence_score?: number;
  business_purpose?: string;
  client_name?: string;
  project_code?: string;
  cost_center?: string;
  personal_use_charge?: number;
  irs_deductible_percent?: number;
  classified_by?: UUID;
  classified_at: Timestamp;
  requires_review: boolean;
  reviewed_by?: UUID;
  reviewed_at?: Timestamp;
  review_notes?: string;
  supporting_documents?: UUID[];
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface PersonalUsePolicy {
  id: UUID;
  tenant_id: UUID;
  policy_name: string;
  applies_to: 'all_vehicles' | 'vehicle_class' | 'department' | 'specific_vehicles';
  scope_ids?: UUID[];
  allows_personal_use: boolean;
  max_personal_miles_per_month?: number;
  max_personal_trips_per_month?: number;
  charge_method: 'cents_per_mile' | 'flat_monthly' | 'percentage_of_lease' | 'irs_standard';
  charge_rate?: number;
  irs_rate_year?: number;
  commute_allowed: boolean;
  max_commute_miles_per_day?: number;
  weekend_personal_use: boolean;
  requires_preapproval: boolean;
  restricted_hours?: JSONB;
  effective_from: Timestamp;
  effective_until?: Timestamp;
  is_active: boolean;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface PersonalUseCharge {
  id: UUID;
  tenant_id: UUID;
  vehicle_id: UUID;
  driver_id: UUID;
  billing_period: string;
  period_start: Timestamp;
  period_end: Timestamp;
  personal_miles: number;
  personal_trips_count: number;
  charge_amount?: number;
  calculation_method: string;
  rate_applied?: number;
  policy_id?: UUID;
  invoice_id?: UUID;
  payment_status: 'pending' | 'invoiced' | 'paid' | 'waived';
  paid_at?: Timestamp;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// Migration 006: Document Management & RAG Tables
// ============================================================================

export interface DocumentFolder {
  id: UUID;
  tenant_id: UUID;
  folder_name: string;
  parent_folder_id?: UUID;
  folder_path: string;
  folder_level: number;
  description?: string;
  color?: string;
  icon?: string;
  is_shared: boolean;
  is_public: boolean;
  owner_id: UUID;
  permissions?: JSONB;
  document_count: number;
  total_size_mb?: number;
  is_system_folder: boolean;
  sort_order: number;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface Document {
  id: UUID;
  tenant_id: UUID;
  folder_id?: UUID;
  document_name: string;
  original_filename: string;
  file_type: string;
  file_extension?: string;
  mime_type?: string;
  file_size_bytes: number;
  file_url: string;
  storage_path: string;
  thumbnail_url?: string;
  page_count?: number;
  document_category?: 'policy' | 'procedure' | 'contract' | 'invoice' | 'report' | 'manual' | 'certification' | 'insurance' | 'registration' | 'other';
  tags?: string[];
  description?: string;
  version_number: number;
  is_latest_version: boolean;
  parent_document_id?: UUID;
  checksum_sha256?: string;
  linked_entity_type?: string;
  linked_entity_id?: UUID;
  owner_id: UUID;
  uploaded_by: UUID;
  is_confidential: boolean;
  access_level: 'public' | 'internal' | 'confidential' | 'restricted';
  encryption_enabled: boolean;
  requires_signature: boolean;
  signature_status?: 'unsigned' | 'partially_signed' | 'fully_signed';
  expiration_date?: Timestamp;
  is_expired?: boolean;
  retention_period_years?: number;
  deletion_date?: Timestamp;
  view_count: number;
  download_count: number;
  last_viewed_at?: Timestamp;
  last_downloaded_at?: Timestamp;
  ai_extracted_text?: string;
  ai_summary?: string;
  ai_keywords?: string[];
  ai_entities?: JSONB;
  ai_analysis_status?: 'pending' | 'processing' | 'completed' | 'failed';
  ai_model_used?: string;
  search_vector?: any; // tsvector type
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface DocumentShare {
  id: UUID;
  tenant_id: UUID;
  document_id: UUID;
  share_type: 'link' | 'email' | 'user' | 'role';
  share_token?: string;
  shared_with_user_id?: UUID;
  shared_with_email?: string;
  shared_with_role?: string;
  permissions: string[];
  allow_download: boolean;
  allow_edit: boolean;
  allow_delete: boolean;
  allow_share: boolean;
  is_public: boolean;
  requires_password: boolean;
  password_hash?: string;
  max_views?: number;
  view_count: number;
  expires_at?: Timestamp;
  is_expired?: boolean;
  last_accessed_at?: Timestamp;
  shared_by: UUID;
  share_message?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DocumentVersion {
  id: UUID;
  tenant_id: UUID;
  document_id: UUID;
  version_number: number;
  file_url: string;
  storage_path: string;
  file_size_bytes: number;
  checksum_sha256: string;
  change_description?: string;
  changed_by: UUID;
  is_major_version: boolean;
  version_tag?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
}

export interface DocumentComment {
  id: UUID;
  tenant_id: UUID;
  document_id: UUID;
  parent_comment_id?: UUID;
  comment_text: string;
  comment_type: 'general' | 'annotation' | 'review' | 'approval';
  annotation_data?: JSONB;
  mentioned_users?: UUID[];
  is_resolved: boolean;
  resolved_by?: UUID;
  resolved_at?: Timestamp;
  commented_by: UUID;
  edited_at?: Timestamp;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DocumentAIAnalysis {
  id: UUID;
  tenant_id: UUID;
  document_id: UUID;
  analysis_type: 'extraction' | 'classification' | 'summarization' | 'ocr' | 'entity_recognition' | 'sentiment';
  ai_provider: 'openai' | 'anthropic' | 'google' | 'azure';
  model_name: string;
  model_version?: string;
  prompt_used?: string;
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  started_at?: Timestamp;
  completed_at?: Timestamp;
  processing_duration_seconds?: number;
  extracted_data?: JSONB;
  classification_result?: string;
  classification_confidence?: number;
  summary_text?: string;
  entities_found?: JSONB;
  sentiment_score?: number;
  key_phrases?: string[];
  tokens_used?: number;
  cost_usd?: number;
  error_message?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
}

export interface RAGEmbedding {
  id: UUID;
  tenant_id: UUID;
  source_type: string;
  source_id: UUID;
  chunk_text: string;
  chunk_index: number;
  embedding_vector: number[]; // vector(1536) type
  model_used: string;
  chunk_metadata?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DocumentAuditLog {
  id: UUID;
  tenant_id: UUID;
  document_id: UUID;
  action: 'create' | 'read' | 'update' | 'delete' | 'download' | 'share' | 'comment' | 'version';
  action_details?: string;
  performed_by: UUID;
  ip_address?: string;
  user_agent?: string;
  changes?: JSONB;
  occurred_at: Timestamp;
}

// ============================================================================
// Migration 007: Financial & Accounting Tables
// ============================================================================

export interface Expense {
  id: UUID;
  tenant_id: UUID;
  expense_number: string;
  expense_type: 'fuel' | 'maintenance' | 'repair' | 'toll' | 'parking' | 'meal' | 'lodging' | 'other';
  expense_category?: string;
  expense_date: Timestamp;
  amount: number;
  currency: string;
  merchant_name?: string;
  description?: string;
  receipt_url?: string;
  receipt_uploaded: boolean;
  vehicle_id?: UUID;
  driver_id?: UUID;
  work_order_id?: UUID;
  payment_method: 'cash' | 'credit_card' | 'fuel_card' | 'company_check' | 'reimbursement';
  fuel_card_id?: UUID;
  submitted_by: UUID;
  submitted_at: Timestamp;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';
  approved_by?: UUID;
  approved_at?: Timestamp;
  approval_notes?: string;
  rejected_reason?: string;
  reimbursed_at?: Timestamp;
  reimbursement_method?: string;
  is_billable: boolean;
  billed_to_client?: string;
  invoice_id?: UUID;
  cost_center?: string;
  project_code?: string;
  gl_account?: string;
  tax_amount?: number;
  is_tax_deductible: boolean;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface Invoice {
  id: UUID;
  tenant_id: UUID;
  invoice_number: string;
  invoice_type: 'purchase' | 'service' | 'recurring' | 'credit_memo';
  vendor_id?: UUID;
  vendor_name: string;
  invoice_date: Timestamp;
  due_date: Timestamp;
  is_overdue?: boolean;
  payment_terms?: string;
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  amount_paid: number;
  balance_due?: number;
  currency: string;
  line_items?: JSONB;
  purchase_order_id?: UUID;
  received_date?: Timestamp;
  three_way_match_status?: 'pending' | 'matched' | 'discrepancy' | 'not_applicable';
  match_discrepancy_notes?: string;
  payment_status: 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  payment_date?: Timestamp;
  payment_method?: string;
  payment_reference?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: UUID;
  approved_at?: Timestamp;
  gl_account?: string;
  cost_center?: string;
  department?: string;
  document_url?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface PurchaseOrder {
  id: UUID;
  tenant_id: UUID;
  po_number: string;
  po_type: 'standard' | 'blanket' | 'contract' | 'service';
  vendor_id?: UUID;
  vendor_name: string;
  po_date: Timestamp;
  delivery_date?: Timestamp;
  requested_by: UUID;
  department?: string;
  cost_center?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'issued' | 'partially_received' | 'received' | 'closed' | 'cancelled';
  subtotal: number;
  tax_amount?: number;
  shipping_cost?: number;
  total_amount: number;
  currency: string;
  line_items?: JSONB;
  shipping_address?: JSONB;
  billing_address?: JSONB;
  approval_workflow?: JSONB;
  approved_by?: UUID;
  approved_at?: Timestamp;
  issued_at?: Timestamp;
  received_date?: Timestamp;
  receiving_notes?: string;
  linked_invoice_id?: UUID;
  vehicle_id?: UUID;
  work_order_id?: UUID;
  payment_terms?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface BudgetAllocation {
  id: UUID;
  tenant_id: UUID;
  budget_name: string;
  budget_category: 'fuel' | 'maintenance' | 'capital' | 'operations' | 'personnel' | 'overhead' | 'custom';
  fiscal_year: number;
  period_type: 'annual' | 'quarterly' | 'monthly';
  period_start: Timestamp;
  period_end: Timestamp;
  allocated_amount: number;
  spent_amount: number;
  committed_amount: number;
  remaining_amount?: number;
  percent_utilized?: number;
  department?: string;
  cost_center?: string;
  vehicle_group_id?: UUID;
  manager_id?: UUID;
  alert_threshold_percent: number;
  critical_threshold_percent: number;
  status?: 'ok' | 'warning' | 'critical' | 'exceeded';
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface CostAllocation {
  id: UUID;
  tenant_id: UUID;
  allocation_date: Timestamp;
  source_type: 'expense' | 'invoice' | 'work_order';
  source_id: UUID;
  total_amount: number;
  allocation_method: 'equal' | 'percentage' | 'usage_based' | 'manual';
  allocations: JSONB;
  is_final: boolean;
  finalized_by?: UUID;
  finalized_at?: Timestamp;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
}

export interface DepreciationSchedule {
  id: UUID;
  tenant_id: UUID;
  vehicle_id: UUID;
  asset_type: 'vehicle' | 'equipment' | 'trailer';
  depreciation_method: 'straight_line' | 'declining_balance' | 'sum_of_years_digits' | 'units_of_production';
  purchase_date: Timestamp;
  purchase_cost: number;
  salvage_value: number;
  useful_life_years?: number;
  useful_life_miles?: number;
  depreciation_rate_percent?: number;
  start_date: Timestamp;
  end_date?: Timestamp;
  is_active: boolean;
  total_depreciation?: number;
  current_book_value?: number;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface DepreciationEntry {
  id: UUID;
  tenant_id: UUID;
  depreciation_schedule_id: UUID;
  vehicle_id: UUID;
  entry_date: Timestamp;
  period_label: string;
  depreciation_amount: number;
  accumulated_depreciation: number;
  book_value: number;
  odometer_reading?: number;
  miles_driven_period?: number;
  calculation_details?: JSONB;
  is_adjustment: boolean;
  adjustment_reason?: string;
  gl_posted: boolean;
  gl_posted_at?: Timestamp;
  gl_journal_entry_id?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  created_by?: UUID;
}

export interface FuelCard {
  id: UUID;
  tenant_id: UUID;
  card_number: string;
  card_provider: string;
  card_type: 'fleet_card' | 'credit_card' | 'debit_card';
  assigned_to_type: 'vehicle' | 'driver' | 'unassigned';
  assigned_to_id?: UUID;
  cardholder_name?: string;
  issue_date?: Timestamp;
  expiration_date?: Timestamp;
  is_expired?: boolean;
  status: 'active' | 'inactive' | 'lost' | 'stolen' | 'expired' | 'cancelled';
  daily_limit?: number;
  monthly_limit?: number;
  allowed_fuel_types?: string[];
  pin_required: boolean;
  odometer_required: boolean;
  restrictions?: JSONB;
  deactivated_at?: Timestamp;
  deactivation_reason?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface FuelCardTransaction {
  id: UUID;
  tenant_id: UUID;
  fuel_card_id: UUID;
  transaction_number: string;
  transaction_date: Timestamp;
  merchant_name?: string;
  merchant_address?: string;
  merchant_city?: string;
  merchant_state?: string;
  merchant_zip?: string;
  latitude?: number;
  longitude?: number;
  vehicle_id?: UUID;
  driver_id?: UUID;
  fuel_type?: string;
  quantity_gallons?: number;
  unit_price?: number;
  subtotal?: number;
  tax?: number;
  total_amount: number;
  currency: string;
  odometer_reading?: number;
  product_codes?: string[];
  is_duplicate: boolean;
  is_out_of_sequence: boolean;
  is_outside_geofence: boolean;
  is_excessive_quantity: boolean;
  is_unusual_time: boolean;
  fraud_score?: number;
  fraud_review_status?: 'none' | 'flagged' | 'under_review' | 'approved' | 'declined';
  reviewed_by?: UUID;
  reviewed_at?: Timestamp;
  review_notes?: string;
  invoice_id?: UUID;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface PaymentMethod {
  id: UUID;
  tenant_id: UUID;
  method_name: string;
  payment_type: 'credit_card' | 'debit_card' | 'bank_account' | 'fuel_card' | 'check' | 'cash' | 'wire_transfer' | 'ach';
  is_default: boolean;
  card_last_four?: string;
  card_brand?: string;
  card_expiry?: string;
  bank_name?: string;
  account_last_four?: string;
  routing_number_encrypted?: string;
  billing_address?: JSONB;
  is_active: boolean;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

// Continue in next message due to length...
