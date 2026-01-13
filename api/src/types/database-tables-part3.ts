/**
 * Database Table Type Definitions - Part 3
 * Migrations 011-015
 *
 * Generated: 2026-01-08
 */

import {
  UUID,
  Timestamp,
  JSONB,
  VehicleLocation,
  OBDTelemetry,
  Geofence,
  GeofenceEvent,
  DriverBehaviorEvent,
  VideoTelematicsFootage,
  Trip,
  Route,
  TripUsageClassification,
  PersonalUsePolicy,
  PersonalUseCharge,
  DocumentFolder,
  Document,
  DocumentShare,
  DocumentVersion,
  DocumentComment,
  DocumentAIAnalysis,
  RAGEmbedding,
  DocumentAuditLog,
  Expense,
  Invoice,
  PurchaseOrder,
  BudgetAllocation,
  CostAllocation,
  DepreciationSchedule,
  DepreciationEntry,
  FuelCard,
  FuelCardTransaction,
  PaymentMethod,
  // WorkOrderTemplate,
  // WorkOrderTask,
  // ServiceBay,
  // ServiceBaySchedule,
  // Technician,
  // RecurringMaintenanceSchedule,
  // Notification,
  // NotificationPreference,
  // Message,
  // TeamsIntegrationMessage,
  // OutlookEmail,
  // AlertRule,
  // AlertHistory,
  // AccidentReport,
  // SafetyInspection,
  // DriverViolation,
  // ComplianceDocument,
  // HoursOfServiceLog,
  // DriverTrainingRecord,
  // SafetyMeeting,
  // InsurancePolicy
} from './database-tables';

// ============================================================================
// Migration 011: Asset Management & 3D Models Tables
// ============================================================================

export interface AssetTag {
  id: UUID;
  tenant_id: UUID;
  tag_number: string;
  tag_type: 'barcode' | 'qr_code' | 'rfid' | 'nfc' | 'ble_beacon';
  tag_format?: string;
  tag_data: string;
  entity_type: 'vehicle' | 'equipment' | 'tool' | 'part' | 'container' | 'facility' | 'driver_badge';
  entity_id: UUID;
  manufacturer?: string;
  model_number?: string;
  serial_number?: string;
  installed_at?: Timestamp;
  installed_by?: UUID;
  installation_location?: string;
  status: 'active' | 'inactive' | 'damaged' | 'lost' | 'replaced' | 'decommissioned';
  last_scanned_at?: Timestamp;
  last_scanned_by?: UUID;
  last_scan_location?: JSONB;
  scan_count: number;
  read_range_meters?: number;
  frequency_mhz?: number;
  memory_bytes?: number;
  is_read_only: boolean;
  encryption_enabled: boolean;
  battery_level_percent?: number;
  battery_last_checked?: Timestamp;
  battery_expected_life_days?: number;
  replacement_due_date?: Timestamp;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface AssetTransfer {
  id: UUID;
  tenant_id: UUID;
  transfer_number: string;
  transfer_type: 'assignment' | 'reassignment' | 'loan' | 'return' | 'relocation' | 'disposal' | 'donation' | 'sale' | 'repair' | 'maintenance';
  asset_type: 'vehicle' | 'equipment' | 'tool' | 'part' | 'container';
  asset_id: UUID;
  from_type?: 'driver' | 'department' | 'location' | 'vendor' | 'warehouse' | 'shop';
  from_id?: UUID;
  from_name?: string;
  from_signature?: string;
  from_signed_at?: Timestamp;
  to_type?: 'driver' | 'department' | 'location' | 'vendor' | 'warehouse' | 'shop';
  to_id?: UUID;
  to_name?: string;
  to_signature?: string;
  to_signed_at?: Timestamp;
  transfer_date: Timestamp;
  expected_return_date?: Timestamp;
  actual_return_date?: Timestamp;
  is_permanent: boolean;
  condition_at_transfer?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  condition_notes?: string;
  condition_photos?: JSONB;
  odometer_reading?: number;
  engine_hours?: number;
  pre_transfer_inspection?: JSONB;
  post_transfer_inspection?: JSONB;
  transfer_cost?: number;
  deposit_amount?: number;
  deposit_returned: boolean;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled' | 'disputed';
  requires_approval: boolean;
  approved_by?: UUID;
  approved_at?: Timestamp;
  approval_notes?: string;
  work_order_id?: UUID;
  purchase_order_id?: UUID;
  reason?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface TurboSquidModel {
  id: UUID;
  tenant_id: UUID;
  turbosquid_id?: string;
  turbosquid_url?: string;
  product_title: string;
  artist_name?: string;
  artist_profile_url?: string;
  model_category?: string;
  model_subcategory?: string;
  file_formats?: string[];
  polygon_count?: number;
  vertex_count?: number;
  quality_rating?: 'basic' | 'standard' | 'premium' | 'professional';
  has_textures: boolean;
  has_materials: boolean;
  has_rigging: boolean;
  has_animation: boolean;
  is_pbr: boolean;
  is_low_poly: boolean;
  real_world_scale: boolean;
  dimensions_meters?: JSONB;
  license_type?: 'royalty_free' | 'editorial' | 'extended' | 'exclusive';
  commercial_use_allowed: boolean;
  redistribution_allowed: boolean;
  price_usd?: number;
  purchased_at?: Timestamp;
  purchased_by?: UUID;
  license_agreement_url?: string;
  downloaded: boolean;
  download_url?: string;
  local_storage_path?: string;
  file_size_mb?: number;
  linked_vehicles?: UUID[];
  linked_equipment?: UUID[];
  usage_count: number;
  last_used_at?: Timestamp;
  thumbnail_url?: string;
  preview_images?: string[];
  preview_video_url?: string;
  tags?: string[];
  description?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface TripoSR3DGeneration {
  id: UUID;
  tenant_id: UUID;
  generation_number: string;
  generation_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  source_type: 'damage_report' | 'inspection' | 'vehicle_photo' | 'part_photo' | 'accident_scene';
  source_id: UUID;
  input_images: JSONB;
  image_count?: number;
  primary_image_url?: string;
  triposr_job_id?: string;
  triposr_model_version: string;
  processing_started_at?: Timestamp;
  processing_completed_at?: Timestamp;
  processing_duration_seconds?: number;
  quality_preset: 'fast' | 'balanced' | 'high_quality';
  target_polygon_count: number;
  texture_resolution: string;
  reconstruction_method: string;
  output_format: 'glb' | 'gltf' | 'obj' | 'fbx' | 'usdz';
  model_url?: string;
  model_size_mb?: number;
  actual_polygon_count?: number;
  actual_vertex_count?: number;
  has_texture: boolean;
  reconstruction_quality_score?: number;
  coverage_percent?: number;
  point_cloud_density?: number;
  texture_quality_score?: number;
  dimensions_meters?: JSONB;
  bounding_box?: JSONB;
  center_point?: JSONB;
  orientation?: JSONB;
  linked_vehicle_id?: UUID;
  linked_damage_report_id?: UUID;
  is_approved: boolean;
  approved_by?: UUID;
  approved_at?: Timestamp;
  detected_damage_severity?: 'none' | 'minor' | 'moderate' | 'severe' | 'total_loss';
  detected_damage_areas?: string[];
  estimated_repair_cost?: number;
  confidence_scores?: JSONB;
  thumbnail_url?: string;
  preview_video_url?: string;
  error_message?: string;
  retry_count: number;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface MeshyAIGeneration {
  id: UUID;
  tenant_id: UUID;
  generation_number: string;
  generation_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  generation_type: 'text_to_3d' | 'image_to_3d' | 'text_to_texture' | 'enhancement';
  text_prompt?: string;
  prompt_language: string;
  negative_prompt?: string;
  input_image_url?: string;
  reference_images?: string[];
  meshy_task_id?: string;
  meshy_model_version: string;
  processing_started_at?: Timestamp;
  processing_completed_at?: Timestamp;
  processing_duration_seconds?: number;
  art_style?: 'realistic' | 'cartoon' | 'low_poly' | 'isometric' | 'sci_fi' | 'fantasy';
  quality_preset: 'draft' | 'balanced' | 'high_quality' | 'ultra';
  target_polygon_count: number;
  enable_pbr: boolean;
  seed?: number;
  output_format: 'glb' | 'gltf' | 'obj' | 'fbx' | 'usdz';
  model_url?: string;
  model_size_mb?: number;
  actual_polygon_count?: number;
  actual_vertex_count?: number;
  dimensions_meters?: JSONB;
  has_texture: boolean;
  has_materials: boolean;
  has_rigging: boolean;
  generation_quality_score?: number;
  prompt_adherence_score?: number;
  aesthetic_score?: number;
  use_case?: 'vehicle_concept' | 'part_visualization' | 'training_simulation' | 'marketing_material' | 'damage_mockup' | 'facility_planning';
  linked_entity_type?: string;
  linked_entity_id?: UUID;
  is_approved: boolean;
  approved_by?: UUID;
  approved_at?: Timestamp;
  download_count: number;
  parent_generation_id?: UUID;
  variation_count: number;
  thumbnail_url?: string;
  preview_images?: string[];
  preview_video_url?: string;
  credits_used?: number;
  cost_usd?: number;
  error_message?: string;
  retry_count: number;
  tags?: string[];
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

// ============================================================================
// Migration 012: Reporting & Analytics Tables
// ============================================================================

export interface SavedReport {
  id: UUID;
  tenant_id: UUID;
  report_name: string;
  report_description?: string;
  report_category?: 'fleet_utilization' | 'maintenance' | 'fuel' | 'driver_performance' | 'financial' | 'compliance' | 'safety' | 'telematics' | 'custom';
  report_type: 'tabular' | 'chart' | 'map' | 'dashboard' | 'custom';
  output_format: 'pdf' | 'excel' | 'csv' | 'json' | 'html';
  data_source: string;
  query_definition: JSONB;
  chart_type?: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'gauge' | 'table' | 'map';
  chart_config?: JSONB;
  date_range_type: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'custom' | 'all_time';
  custom_date_from?: Timestamp;
  custom_date_to?: Timestamp;
  is_scheduled: boolean;
  schedule_frequency?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  schedule_cron?: string;
  schedule_time?: string;
  schedule_day_of_week?: number;
  schedule_day_of_month?: number;
  next_scheduled_run?: Timestamp;
  last_scheduled_run?: Timestamp;
  auto_email_recipients?: string[];
  auto_email_subject?: string;
  auto_email_body?: string;
  is_public: boolean;
  owner_id: UUID;
  shared_with_users?: UUID[];
  shared_with_roles?: string[];
  execution_count: number;
  last_executed_at?: Timestamp;
  last_executed_by?: UUID;
  average_execution_time_seconds?: number;
  is_favorite: boolean;
  folder_path?: string;
  tags?: string[];
  is_active: boolean;
  is_template: boolean;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface ReportExecution {
  id: UUID;
  tenant_id: UUID;
  saved_report_id?: UUID;
  report_name: string;
  report_category?: string;
  execution_trigger: 'manual' | 'scheduled' | 'api' | 'webhook';
  executed_by?: UUID;
  executed_at: Timestamp;
  parameters_used?: JSONB;
  date_range_from?: Timestamp;
  date_range_to?: Timestamp;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  started_at?: Timestamp;
  completed_at?: Timestamp;
  execution_time_seconds?: number;
  result_data?: JSONB;
  result_row_count?: number;
  result_size_kb?: number;
  cache_key?: string;
  cache_expires_at?: Timestamp;
  output_format?: string;
  output_file_url?: string;
  output_file_size_kb?: number;
  query_time_ms?: number;
  render_time_ms?: number;
  total_records_scanned?: number;
  memory_used_mb?: number;
  error_message?: string;
  error_stack_trace?: string;
  emailed_to?: string[];
  email_sent_at?: Timestamp;
  email_delivery_status?: 'pending' | 'sent' | 'delivered' | 'bounced' | 'failed';
  custom_fields?: JSONB;
}

export interface Dashboard {
  id: UUID;
  tenant_id: UUID;
  dashboard_name: string;
  dashboard_description?: string;
  dashboard_icon?: string;
  dashboard_type: 'overview' | 'executive' | 'operations' | 'maintenance' | 'safety' | 'financial' | 'custom';
  layout_type: 'grid' | 'freeform' | 'tabs' | 'accordion';
  grid_columns: number;
  widgets: JSONB;
  auto_refresh_enabled: boolean;
  auto_refresh_interval_seconds: number;
  last_refreshed_at?: Timestamp;
  is_default: boolean;
  is_public: boolean;
  owner_id: UUID;
  shared_with_users?: UUID[];
  shared_with_roles?: string[];
  theme: 'light' | 'dark' | 'auto';
  color_scheme?: string;
  show_filters: boolean;
  show_date_range: boolean;
  show_export_button: boolean;
  default_date_range: string;
  custom_date_from?: Timestamp;
  custom_date_to?: Timestamp;
  view_count: number;
  last_viewed_at?: Timestamp;
  last_viewed_by?: UUID;
  folder_path?: string;
  tags?: string[];
  sort_order: number;
  is_active: boolean;
  is_template: boolean;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface KPITarget {
  id: UUID;
  tenant_id: UUID;
  kpi_name: string;
  kpi_category: 'utilization' | 'maintenance' | 'fuel_efficiency' | 'safety' | 'cost' | 'compliance' | 'driver_performance' | 'sustainability';
  kpi_description?: string;
  metric_type: string;
  measurement_unit?: string;
  data_source: string;
  target_value: number;
  target_operator: '>=' | '>' | '<=' | '<' | '=';
  warning_threshold?: number;
  critical_threshold?: number;
  current_value?: number;
  last_calculated_at?: Timestamp;
  calculation_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  status?: 'unknown' | 'on_track' | 'warning' | 'critical' | 'off_track';
  percent_to_target?: number;
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'rolling_30_day' | 'rolling_90_day' | 'ytd' | 'custom';
  period_start_date?: Timestamp;
  period_end_date?: Timestamp;
  historical_values?: JSONB;
  applies_to?: 'entire_fleet' | 'vehicle_group' | 'single_vehicle' | 'driver' | 'department' | 'location';
  scope_id?: UUID;
  alert_on_warning: boolean;
  alert_on_critical: boolean;
  alert_recipients?: string[];
  last_alert_sent_at?: Timestamp;
  chart_type: 'gauge' | 'progress_bar' | 'line_chart' | 'number' | 'trend';
  color_good: string;
  color_warning: string;
  color_critical: string;
  is_active: boolean;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface BenchmarkData {
  id: UUID;
  tenant_id: UUID;
  benchmark_name: string;
  benchmark_category: 'utilization' | 'maintenance' | 'fuel_efficiency' | 'safety' | 'cost' | 'compliance' | 'driver_performance' | 'sustainability';
  data_source: string;
  source_url?: string;
  data_year: number;
  data_period?: string;
  industry_segment?: string;
  fleet_size_category?: string;
  geographic_region?: string;
  metric_name: string;
  metric_description?: string;
  measurement_unit?: string;
  percentile_10?: number;
  percentile_25?: number;
  percentile_50?: number;
  percentile_75?: number;
  percentile_90?: number;
  average_value?: number;
  sample_size?: number;
  our_value?: number;
  our_percentile?: number;
  gap_to_median?: number;
  gap_to_top_quartile?: number;
  performance_rating?: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  year_over_year_change?: number;
  trend_direction?: 'improving' | 'stable' | 'declining';
  calculation_methodology?: string;
  data_collection_method?: string;
  confidence_level?: number;
  is_current: boolean;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface AnalyticsCache {
  id: UUID;
  tenant_id: UUID;
  cache_key: string;
  cache_category: 'dashboard' | 'report' | 'kpi' | 'widget' | 'api_endpoint';
  source_type: string;
  source_query_hash?: string;
  aggregation_level: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  data_start_date?: Timestamp;
  data_end_date?: Timestamp;
  cached_result: JSONB;
  result_type?: 'single_value' | 'time_series' | 'grouped_summary' | 'raw_data';
  row_count?: number;
  data_size_kb?: number;
  computed_at: Timestamp;
  expires_at: Timestamp;
  is_expired?: boolean;
  ttl_seconds?: number;
  refresh_strategy: 'on_demand' | 'scheduled' | 'event_driven' | 'never';
  next_refresh_at?: Timestamp;
  last_refreshed_at?: Timestamp;
  hit_count: number;
  last_accessed_at?: Timestamp;
  access_frequency_per_hour?: number;
  computation_time_ms?: number;
  source_rows_scanned?: number;
  invalidated_at?: Timestamp;
  invalidation_reason?: string;
  auto_invalidate_on_tables?: string[];
  scope_type?: 'tenant_wide' | 'user_specific' | 'role_specific' | 'entity_specific';
  scope_id?: UUID;
  custom_fields?: JSONB;
}

// ============================================================================
// Migration 013: User Management & RBAC Tables
// ============================================================================

export interface Role {
  id: UUID;
  tenant_id: UUID;
  role_name: string;
  role_key: string;
  role_description?: string;
  parent_role_id?: UUID;
  role_level: number;
  hierarchy_path?: string;
  role_type: 'system' | 'tenant_admin' | 'built_in' | 'custom';
  is_system_role: boolean;
  permissions?: string[];
  access_scope: 'tenant_wide' | 'department' | 'location' | 'team' | 'self_only';
  scope_restrictions?: JSONB;
  can_create_work_orders: boolean;
  can_approve_expenses: boolean;
  can_manage_users: boolean;
  can_view_reports: boolean;
  can_export_data: boolean;
  max_approval_amount?: number;
  default_dashboard_id?: UUID;
  accessible_modules?: string[];
  ui_restrictions?: JSONB;
  is_active: boolean;
  user_count: number;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface UserRole {
  id: UUID;
  tenant_id: UUID;
  user_id: UUID;
  role_id: UUID;
  effective_from: Timestamp;
  effective_until?: Timestamp;
  is_active?: boolean;
  priority: number;
  is_primary_role: boolean;
  active_locations?: UUID[];
  active_departments?: UUID[];
  active_days_of_week?: number[];
  active_hours_start?: string;
  active_hours_end?: string;
  assigned_by?: UUID;
  assigned_at: Timestamp;
  assignment_reason?: string;
  requires_approval: boolean;
  approved_by?: UUID;
  approved_at?: Timestamp;
  approval_notes?: string;
  revoked_at?: Timestamp;
  revoked_by?: UUID;
  revocation_reason?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Permission {
  id: UUID;
  tenant_id?: UUID;
  permission_key: string;
  permission_name: string;
  permission_description?: string;
  resource: string;
  action: 'read' | 'create' | 'update' | 'delete' | 'approve' | 'export' | 'import' | 'share' | 'assign' | 'manage' | 'admin';
  parent_permission_key?: string;
  implies_permissions?: string[];
  scope_level: 'system' | 'tenant' | 'department' | 'team' | 'entity' | 'self';
  requires_permissions?: string[];
  conflicts_with_permissions?: string[];
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  requires_mfa: boolean;
  requires_approval: boolean;
  category?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  is_deprecated: boolean;
  deprecated_by?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface UserPermission {
  id: UUID;
  tenant_id: UUID;
  user_id: UUID;
  permission_key: string;
  permission_type: 'grant' | 'deny';
  scope_type?: 'all' | 'specific_entities' | 'department' | 'location' | 'conditions';
  scope_entities?: UUID[];
  scope_conditions?: JSONB;
  effective_from: Timestamp;
  effective_until?: Timestamp;
  is_active?: boolean;
  granted_by?: UUID;
  granted_at: Timestamp;
  reason: string;
  requires_approval: boolean;
  approved_by?: UUID;
  approved_at?: Timestamp;
  approval_notes?: string;
  revoked_at?: Timestamp;
  revoked_by?: UUID;
  revocation_reason?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface UserActivityLog {
  id: UUID;
  tenant_id: UUID;
  user_id?: UUID;
  user_email?: string;
  user_name?: string;
  impersonated_by?: UUID;
  session_id?: UUID;
  activity_type: 'login' | 'logout' | 'login_failed' | 'password_change' | 'password_reset' | 'create' | 'read' | 'update' | 'delete' | 'export' | 'import' | 'approve' | 'reject' | 'share' | 'download' | 'upload' | 'settings_change' | 'role_change' | 'permission_change';
  activity_category?: string;
  resource_type?: string;
  resource_id?: UUID;
  resource_name?: string;
  action_description?: string;
  changes?: JSONB;
  affected_fields?: string[];
  http_method?: string;
  endpoint?: string;
  request_body?: JSONB;
  response_status?: number;
  response_time_ms?: number;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  geo_location?: JSONB;
  timezone?: string;
  authentication_method?: string;
  mfa_verified?: boolean;
  is_suspicious: boolean;
  security_flags?: string[];
  risk_score?: number;
  success: boolean;
  error_message?: string;
  error_code?: string;
  query_count?: number;
  database_time_ms?: number;
  cache_hit?: boolean;
  occurred_at: Timestamp;
}

export interface APIToken {
  id: UUID;
  tenant_id: UUID;
  token_name: string;
  token_description?: string;
  token_hash: string;
  token_prefix?: string;
  user_id: UUID;
  scopes?: string[];
  role_id?: UUID;
  ip_whitelist?: string[];
  allowed_endpoints?: string[];
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  last_used_at?: Timestamp;
  last_used_ip?: string;
  last_used_endpoint?: string;
  total_requests: number;
  failed_requests: number;
  expires_at?: Timestamp;
  is_expired?: boolean;
  is_active: boolean;
  revoked_at?: Timestamp;
  revoked_by?: UUID;
  revocation_reason?: string;
  last_rotated_at?: Timestamp;
  rotation_policy_days: number;
  requires_mfa: boolean;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

// ============================================================================
// Migration 014: Integrations Tables
// ============================================================================

export interface MicrosoftGraphSync {
  id: UUID;
  tenant_id: UUID;
  sync_type: 'users' | 'calendar_events' | 'emails' | 'teams_messages' | 'onedrive_files' | 'sharepoint_documents' | 'contacts' | 'groups';
  resource_path: string;
  delta_link?: string;
  skip_token?: string;
  sync_token?: string;
  sync_status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  last_sync_started_at?: Timestamp;
  last_sync_completed_at?: Timestamp;
  last_sync_duration_seconds?: number;
  next_sync_scheduled_at?: Timestamp;
  records_fetched: number;
  records_created: number;
  records_updated: number;
  records_deleted: number;
  records_failed: number;
  sync_frequency: 'realtime' | 'every_15_min' | 'hourly' | 'every_4_hours' | 'daily' | 'manual';
  enabled: boolean;
  auto_sync: boolean;
  filter_query?: string;
  select_fields?: string[];
  expand_relations?: string[];
  user_id?: UUID;
  entity_type?: string;
  entity_id?: UUID;
  error_count: number;
  last_error_message?: string;
  last_error_at?: Timestamp;
  retry_count: number;
  max_retries: number;
  rate_limit_remaining?: number;
  rate_limit_reset_at?: Timestamp;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface CalendarIntegration {
  id: UUID;
  tenant_id: UUID;
  integration_name: string;
  calendar_provider: 'microsoft_365' | 'google_calendar' | 'apple_calendar' | 'exchange' | 'ical_url' | 'caldav';
  user_id: UUID;
  calendar_id?: string;
  calendar_name?: string;
  calendar_color?: string;
  is_primary_calendar: boolean;
  auth_method?: 'oauth2' | 'api_key' | 'basic_auth' | 'bearer_token';
  access_token_encrypted?: string;
  refresh_token_encrypted?: string;
  token_expires_at?: Timestamp;
  caldav_url?: string;
  sync_direction: 'import_only' | 'export_only' | 'bidirectional';
  sync_frequency: 'realtime' | 'every_5_min' | 'every_15_min' | 'hourly' | 'daily';
  sync_event_types?: string[];
  date_range_days_past: number;
  date_range_days_future: number;
  field_mappings?: JSONB;
  conflict_resolution: 'newest_wins' | 'provider_wins' | 'fleet_wins' | 'manual_review';
  last_sync_at?: Timestamp;
  last_sync_status?: string;
  events_synced_count: number;
  sync_errors_count: number;
  notify_on_sync_errors: boolean;
  notification_email?: string;
  is_active: boolean;
  is_verified: boolean;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface WebhookSubscription {
  id: UUID;
  tenant_id: UUID;
  subscription_name: string;
  subscription_description?: string;
  target_url: string;
  http_method: 'POST' | 'PUT' | 'PATCH';
  content_type: string;
  auth_type?: 'none' | 'api_key' | 'bearer_token' | 'basic_auth' | 'hmac_signature' | 'oauth2';
  auth_header_name?: string;
  auth_value_encrypted?: string;
  hmac_secret_encrypted?: string;
  event_types: string[];
  filter_conditions?: JSONB;
  include_fields?: string[];
  exclude_fields?: string[];
  payload_template?: JSONB;
  include_metadata: boolean;
  include_timestamp: boolean;
  retry_policy: 'none' | 'immediate' | 'exponential' | 'custom';
  max_retries: number;
  retry_intervals?: number[];
  timeout_seconds: number;
  rate_limit_per_minute?: number;
  rate_limit_per_hour?: number;
  enable_batching: boolean;
  batch_size: number;
  batch_window_seconds: number;
  is_active: boolean;
  is_verified: boolean;
  last_delivery_at?: Timestamp;
  last_success_at?: Timestamp;
  last_failure_at?: Timestamp;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  average_response_time_ms?: number;
  consecutive_failures: number;
  health_status: 'healthy' | 'degraded' | 'unhealthy' | 'paused';
  auto_pause_on_failures: number;
  alert_on_failure: boolean;
  alert_recipients?: string[];
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface WebhookDelivery {
  id: UUID;
  tenant_id: UUID;
  webhook_subscription_id: UUID;
  subscription_name?: string;
  event_type: string;
  event_id: UUID;
  event_timestamp: Timestamp;
  attempt_number: number;
  delivery_status: 'pending' | 'sending' | 'delivered' | 'failed' | 'retrying' | 'abandoned';
  request_url: string;
  request_method?: string;
  request_headers?: JSONB;
  request_payload?: JSONB;
  request_size_bytes?: number;
  response_status_code?: number;
  response_headers?: JSONB;
  response_body?: string;
  response_size_bytes?: number;
  response_time_ms?: number;
  sent_at?: Timestamp;
  received_at?: Timestamp;
  next_retry_at?: Timestamp;
  error_message?: string;
  error_code?: string;
  error_type?: string;
  is_retry: boolean;
  parent_delivery_id?: UUID;
  retries_remaining?: number;
  custom_fields?: JSONB;
}

export interface APIIntegration {
  id: UUID;
  tenant_id: UUID;
  integration_name: string;
  integration_type: string;
  provider: string;
  provider_logo_url?: string;
  api_base_url: string;
  api_version?: string;
  environment: 'sandbox' | 'staging' | 'production';
  auth_type: 'api_key' | 'oauth2' | 'basic_auth' | 'bearer_token' | 'jwt' | 'custom';
  api_key_encrypted?: string;
  client_id?: string;
  client_secret_encrypted?: string;
  access_token_encrypted?: string;
  refresh_token_encrypted?: string;
  token_expires_at?: Timestamp;
  token_refresh_url?: string;
  config?: JSONB;
  features_enabled?: string[];
  sync_enabled: boolean;
  sync_frequency?: string;
  last_sync_at?: Timestamp;
  next_sync_at?: Timestamp;
  rate_limit_per_second?: number;
  rate_limit_per_minute?: number;
  rate_limit_per_day?: number;
  current_usage_count: number;
  usage_reset_at?: Timestamp;
  health_status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  last_health_check_at?: Timestamp;
  consecutive_failures: number;
  last_error_at?: Timestamp;
  last_error_message?: string;
  error_count_24h: number;
  average_response_time_ms?: number;
  total_api_calls: number;
  successful_api_calls: number;
  failed_api_calls: number;
  webhook_url?: string;
  webhook_secret_encrypted?: string;
  support_email?: string;
  support_phone?: string;
  support_url?: string;
  billing_plan?: string;
  billing_cycle?: string;
  monthly_cost?: number;
  is_active: boolean;
  is_verified: boolean;
  verified_at?: Timestamp;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface IntegrationLog {
  id: UUID;
  tenant_id: UUID;
  integration_id?: UUID;
  integration_name?: string;
  integration_type?: string;
  log_level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  log_category?: string;
  operation?: string;
  operation_status?: 'started' | 'in_progress' | 'completed' | 'failed' | 'timeout';
  request_method?: string;
  request_url?: string;
  request_payload?: JSONB;
  response_status_code?: number;
  response_body?: JSONB;
  response_time_ms?: number;
  records_processed?: number;
  records_created?: number;
  records_updated?: number;
  records_failed?: number;
  error_message?: string;
  error_code?: string;
  error_stack_trace?: string;
  user_id?: UUID;
  related_entity_type?: string;
  related_entity_id?: UUID;
  occurred_at: Timestamp;
  custom_fields?: JSONB;
}

export interface ExternalSystemMapping {
  id: UUID;
  tenant_id: UUID;
  internal_entity_type: string;
  internal_entity_id: UUID;
  internal_entity_name?: string;
  external_system: string;
  integration_id?: UUID;
  external_id: string;
  external_id_type?: string;
  external_entity_type?: string;
  external_metadata?: JSONB;
  sync_direction?: 'import_only' | 'export_only' | 'bidirectional';
  last_synced_at?: Timestamp;
  sync_status?: 'active' | 'inactive' | 'error' | 'orphaned';
  is_verified: boolean;
  verified_at?: Timestamp;
  last_validation_error?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

// ============================================================================
// Migration 015: System & Miscellaneous Tables
// ============================================================================

export interface AuditTrail {
  id: UUID;
  tenant_id: UUID;
  user_id?: UUID;
  user_email?: string;
  user_name?: string;
  impersonated_by?: UUID;
  session_id?: UUID;
  action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'reject' | 'export' | 'import' | 'share' | 'restore' | 'archive' | 'login' | 'logout' | 'permission_change' | 'setting_change';
  action_category?: string;
  action_description: string;
  table_name?: string;
  record_id?: UUID;
  record_name?: string;
  old_values?: JSONB;
  new_values?: JSONB;
  changed_fields?: string[];
  source?: 'web_ui' | 'mobile_app' | 'api' | 'system' | 'scheduled_job' | 'import' | 'integration';
  source_ip?: string;
  user_agent?: string;
  http_method?: string;
  endpoint?: string;
  request_id?: UUID;
  is_sensitive: boolean;
  compliance_tags?: string[];
  retention_period_days: number;
  occurred_at: Timestamp;
  custom_fields?: JSONB;
}

export interface SystemSetting {
  id: UUID;
  tenant_id?: UUID;
  setting_key: string;
  setting_category: 'general' | 'security' | 'notifications' | 'integrations' | 'features' | 'maintenance' | 'billing' | 'compliance' | 'ui';
  setting_name: string;
  setting_description?: string;
  value_type: 'string' | 'integer' | 'decimal' | 'boolean' | 'json' | 'encrypted';
  string_value?: string;
  integer_value?: number;
  decimal_value?: number;
  boolean_value?: boolean;
  json_value?: JSONB;
  encrypted_value?: string;
  validation_rules?: JSONB;
  default_value?: string;
  scope: 'system' | 'tenant' | 'user' | 'location' | 'department';
  scope_id?: UUID;
  display_order: number;
  is_editable: boolean;
  is_visible: boolean;
  requires_restart: boolean;
  requires_permission?: string;
  requires_approval: boolean;
  is_active: boolean;
  is_deprecated: boolean;
  deprecated_by?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface FeatureFlag {
  id: UUID;
  tenant_id?: UUID;
  feature_key: string;
  feature_name: string;
  feature_description?: string;
  is_enabled: boolean;
  rollout_percentage: number;
  targeting_rules?: JSONB;
  is_ab_test: boolean;
  ab_variants?: JSONB;
  enabled_from?: Timestamp;
  enabled_until?: Timestamp;
  requires_features?: string[];
  conflicts_with_features?: string[];
  usage_count: number;
  last_checked_at?: Timestamp;
  error_rate?: number;
  killswitch_enabled: boolean;
  killswitch_reason?: string;
  killswitch_activated_by?: UUID;
  killswitch_activated_at?: Timestamp;
  owner_team?: string;
  jira_ticket?: string;
  documentation_url?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface ImportJob {
  id: UUID;
  tenant_id: UUID;
  job_name: string;
  import_type: string;
  source_file_name?: string;
  source_file_url?: string;
  source_file_size_mb?: number;
  source_file_format?: 'csv' | 'excel' | 'json' | 'xml' | 'api';
  status: 'pending' | 'validating' | 'processing' | 'completed' | 'failed' | 'partially_completed' | 'cancelled';
  total_rows?: number;
  rows_processed: number;
  rows_created: number;
  rows_updated: number;
  rows_skipped: number;
  rows_failed: number;
  progress_percent?: number;
  queued_at: Timestamp;
  started_at?: Timestamp;
  completed_at?: Timestamp;
  processing_duration_seconds?: number;
  import_config?: JSONB;
  skip_duplicates: boolean;
  update_existing: boolean;
  validate_before_import: boolean;
  validation_errors?: JSONB;
  validation_warnings?: JSONB;
  error_log_url?: string;
  error_summary?: string;
  result_file_url?: string;
  imported_record_ids?: UUID[];
  created_by: UUID;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ExportJob {
  id: UUID;
  tenant_id: UUID;
  job_name: string;
  export_type: string;
  export_format: 'csv' | 'excel' | 'json' | 'xml' | 'pdf';
  fields_to_export?: string[];
  filter_criteria?: JSONB;
  sort_criteria?: JSONB;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired' | 'cancelled';
  total_records?: number;
  records_processed: number;
  progress_percent?: number;
  queued_at: Timestamp;
  started_at?: Timestamp;
  completed_at?: Timestamp;
  processing_duration_seconds?: number;
  expires_at?: Timestamp;
  output_file_name?: string;
  output_file_url?: string;
  output_file_size_mb?: number;
  download_count: number;
  last_downloaded_at?: Timestamp;
  is_encrypted: boolean;
  encryption_password_hint?: string;
  access_requires_auth: boolean;
  allowed_download_count?: number;
  error_message?: string;
  created_by: UUID;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ScheduledJob {
  id: UUID;
  tenant_id?: UUID;
  job_name: string;
  job_type: string;
  job_description?: string;
  job_function: string;
  job_parameters?: JSONB;
  schedule_type: 'cron' | 'interval' | 'one_time' | 'manual';
  cron_expression?: string;
  interval_seconds?: number;
  scheduled_time?: Timestamp;
  last_run_at?: Timestamp;
  last_run_status?: 'success' | 'failed' | 'timeout' | 'cancelled';
  last_run_duration_seconds?: number;
  last_error_message?: string;
  next_run_at?: Timestamp;
  run_count: number;
  success_count: number;
  failure_count: number;
  average_duration_seconds?: number;
  max_duration_seconds?: number;
  timeout_seconds: number;
  max_retries: number;
  retry_delay_seconds: number;
  allow_concurrent_execution: boolean;
  is_currently_running: boolean;
  running_since?: Timestamp;
  priority: number;
  run_conditions?: JSONB;
  is_active: boolean;
  is_paused: boolean;
  paused_until?: Timestamp;
  notify_on_success: boolean;
  notify_on_failure: boolean;
  notification_recipients?: string[];
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface JobExecutionHistory {
  id: UUID;
  tenant_id?: UUID;
  scheduled_job_id?: UUID;
  job_name: string;
  job_type?: string;
  execution_status: 'started' | 'success' | 'failed' | 'timeout' | 'cancelled' | 'skipped';
  started_at: Timestamp;
  completed_at?: Timestamp;
  duration_seconds?: number;
  result_data?: JSONB;
  records_processed?: number;
  error_message?: string;
  error_stack_trace?: string;
  retry_count: number;
  memory_used_mb?: number;
  cpu_time_seconds?: number;
  triggered_by?: 'schedule' | 'manual' | 'api' | 'system_event' | 'dependency';
  triggered_by_user_id?: UUID;
  custom_fields?: JSONB;
}

export interface DataRetentionPolicy {
  id: UUID;
  tenant_id?: UUID;
  policy_name: string;
  policy_description?: string;
  table_name: string;
  data_category?: string;
  retention_period_days: number;
  archive_before_delete: boolean;
  archive_storage_location?: string;
  date_field: string;
  filter_conditions?: JSONB;
  action: 'archive' | 'delete' | 'anonymize' | 'compress';
  anonymization_rules?: JSONB;
  run_frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  run_time: string;
  last_run_at?: Timestamp;
  next_run_at?: Timestamp;
  last_run_records_processed?: number;
  last_run_records_archived?: number;
  last_run_records_deleted?: number;
  last_run_status?: string;
  last_run_error?: string;
  max_records_per_run: number;
  dry_run_mode: boolean;
  compliance_requirement?: string;
  legal_hold_exempt: boolean;
  is_active: boolean;
  is_approved: boolean;
  approved_by?: UUID;
  approved_at?: Timestamp;
  notify_before_execution: boolean;
  notification_recipients?: string[];
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

// ============================================================================
// Export all types
// ============================================================================

export type DatabaseTable =
  | VehicleLocation
  | OBDTelemetry
  | Geofence
  | GeofenceEvent
  | DriverBehaviorEvent
  | VideoTelematicsFootage
  | Trip
  | Route
  | TripUsageClassification
  | PersonalUsePolicy
  | PersonalUseCharge
  | DocumentFolder
  | Document
  | DocumentShare
  | DocumentVersion
  | DocumentComment
  | DocumentAIAnalysis
  | RAGEmbedding
  | DocumentAuditLog
  | Expense
  | Invoice
  | PurchaseOrder
  | BudgetAllocation
  | CostAllocation
  | DepreciationSchedule
  | DepreciationEntry
  | FuelCard
  | FuelCardTransaction
  | PaymentMethod
  | WorkOrderTemplate
  | WorkOrderTask
  | ServiceBay
  | ServiceBaySchedule
  | Technician
  | RecurringMaintenanceSchedule
  | Notification
  | NotificationPreference
  | Message
  | TeamsIntegrationMessage
  | OutlookEmail
  | AlertRule
  | AlertHistory
  | AccidentReport
  | SafetyInspection
  | DriverViolation
  | ComplianceDocument
  | HoursOfServiceLog
  | DriverTrainingRecord
  | SafetyMeeting
  | InsurancePolicy
  | AssetTag
  | AssetTransfer
  | TurboSquidModel
  | TripoSR3DGeneration
  | MeshyAIGeneration
  | SavedReport
  | ReportExecution
  | Dashboard
  | KPITarget
  | BenchmarkData
  | AnalyticsCache
  | Role
  | UserRole
  | Permission
  | UserPermission
  | UserActivityLog
  | APIToken
  | MicrosoftGraphSync
  | CalendarIntegration
  | WebhookSubscription
  | WebhookDelivery
  | APIIntegration
  | IntegrationLog
  | ExternalSystemMapping
  | AuditTrail
  | SystemSetting
  | FeatureFlag
  | ImportJob
  | ExportJob
  | ScheduledJob
  | JobExecutionHistory
  | DataRetentionPolicy;
