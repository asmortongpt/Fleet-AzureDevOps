/**
 * Database Table Type Definitions - Part 2
 * Migrations 008-015
 *
 * Generated: 2026-01-08
 */

import { UUID, Timestamp, JSONB } from './database-tables';

// ============================================================================
// Migration 008: Work Orders & Scheduling Tables
// ============================================================================

export interface WorkOrderTemplate {
  id: UUID;
  tenant_id: UUID;
  template_name: string;
  service_category: 'preventive' | 'repair' | 'inspection' | 'modification' | 'recall';
  description?: string;
  estimated_duration_hours?: number;
  estimated_cost?: number;
  task_list: JSONB;
  required_parts?: JSONB;
  required_skills?: string[];
  safety_requirements?: string[];
  instructions?: string;
  checklist_items?: JSONB;
  applies_to_vehicle_types?: string[];
  is_active: boolean;
  usage_count: number;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface WorkOrderTask {
  id: UUID;
  tenant_id: UUID;
  work_order_id: UUID;
  task_number: number;
  task_description: string;
  task_type: 'diagnostic' | 'repair' | 'replacement' | 'adjustment' | 'inspection' | 'cleaning';
  assigned_to?: UUID;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  priority: number;
  estimated_duration_hours?: number;
  actual_duration_hours?: number;
  started_at?: Timestamp;
  completed_at?: Timestamp;
  completion_notes?: string;
  required_parts?: JSONB;
  parts_used?: JSONB;
  labor_cost?: number;
  parts_cost?: number;
  total_cost?: number;
  quality_check_required: boolean;
  quality_check_passed?: boolean;
  quality_checked_by?: UUID;
  quality_check_notes?: string;
  photos?: string[];
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ServiceBay {
  id: UUID;
  tenant_id: UUID;
  location_id?: UUID;
  bay_number: string;
  bay_name: string;
  bay_type: 'lift' | 'drive_through' | 'inspection_pit' | 'wash_bay' | 'paint_booth' | 'general';
  capacity: 'light_duty' | 'medium_duty' | 'heavy_duty';
  max_weight_capacity_lbs?: number;
  equipment_available?: string[];
  is_active: boolean;
  is_occupied: boolean;
  current_work_order_id?: UUID;
  occupied_since?: Timestamp;
  maintenance_required: boolean;
  last_maintenance_date?: Timestamp;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface ServiceBaySchedule {
  id: UUID;
  tenant_id: UUID;
  service_bay_id: UUID;
  work_order_id: UUID;
  vehicle_id: UUID;
  scheduled_start: Timestamp;
  scheduled_end: Timestamp;
  actual_start?: Timestamp;
  actual_end?: Timestamp;
  duration_hours?: number;
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'no_show' | 'cancelled';
  checked_in_at?: Timestamp;
  checked_in_by?: UUID;
  assigned_technician?: UUID;
  priority: 'routine' | 'urgent' | 'emergency';
  customer_waiting: boolean;
  estimated_completion?: Timestamp;
  completion_notified: boolean;
  notification_sent_at?: Timestamp;
  cancellation_reason?: string;
  rescheduled_to?: UUID;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface Technician {
  id: UUID;
  tenant_id: UUID;
  user_id?: UUID;
  technician_name: string;
  employee_number?: string;
  specializations?: string[];
  certifications: JSONB;
  skill_level: 'apprentice' | 'journeyman' | 'master' | 'specialist';
  hourly_rate?: number;
  is_active: boolean;
  availability_schedule?: JSONB;
  max_concurrent_jobs: number;
  current_workload: number;
  performance_rating?: number;
  completed_jobs_count: number;
  average_job_duration_hours?: number;
  quality_score?: number;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface RecurringMaintenanceSchedule {
  id: UUID;
  tenant_id: UUID;
  schedule_name: string;
  vehicle_id: UUID;
  service_type: string;
  work_order_template_id?: UUID;
  trigger_type: 'mileage' | 'time' | 'engine_hours' | 'combined';
  trigger_interval_miles?: number;
  trigger_interval_days?: number;
  trigger_interval_hours?: number;
  last_service_date?: Timestamp;
  last_service_mileage?: number;
  last_service_engine_hours?: number;
  next_due_date?: Timestamp;
  next_due_mileage?: number;
  next_due_engine_hours?: number;
  is_overdue?: boolean;
  auto_create_work_order: boolean;
  advance_notice_days: number;
  assigned_service_bay?: UUID;
  assigned_technician?: UUID;
  estimated_duration_hours?: number;
  estimated_cost?: number;
  is_active: boolean;
  notification_sent: boolean;
  notification_sent_at?: Timestamp;
  last_work_order_created?: UUID;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

// ============================================================================
// Migration 009: Communication & Notifications Tables
// ============================================================================

export interface Notification {
  id: UUID;
  tenant_id: UUID;
  notification_type: 'info' | 'warning' | 'error' | 'success' | 'alert';
  category: 'maintenance' | 'safety' | 'compliance' | 'financial' | 'system' | 'custom';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipient_type: 'user' | 'role' | 'department' | 'all';
  recipient_id?: UUID;
  recipient_email?: string;
  channels: string[];
  send_in_app: boolean;
  send_email: boolean;
  send_sms: boolean;
  send_teams: boolean;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sent_at?: Timestamp;
  delivered_at?: Timestamp;
  read_at?: Timestamp;
  read_by?: UUID;
  email_message_id?: string;
  sms_message_id?: string;
  teams_message_id?: string;
  action_url?: string;
  action_label?: string;
  related_entity_type?: string;
  related_entity_id?: UUID;
  expires_at?: Timestamp;
  is_expired?: boolean;
  error_message?: string;
  retry_count: number;
  metadata?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface NotificationPreference {
  id: UUID;
  tenant_id: UUID;
  user_id: UUID;
  notification_category: string;
  enabled: boolean;
  channel_email: boolean;
  channel_sms: boolean;
  channel_in_app: boolean;
  channel_teams: boolean;
  channel_webhook: boolean;
  frequency: 'realtime' | 'digest_hourly' | 'digest_daily' | 'digest_weekly';
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  quiet_hours_timezone?: string;
  minimum_priority?: 'low' | 'medium' | 'high' | 'urgent';
  custom_filters?: JSONB;
  notes?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Message {
  id: UUID;
  tenant_id: UUID;
  conversation_id?: UUID;
  parent_message_id?: UUID;
  subject?: string;
  message_body: string;
  message_type: 'direct' | 'group' | 'announcement' | 'system';
  sender_id: UUID;
  recipient_ids: UUID[];
  recipient_type: 'user' | 'role' | 'department' | 'team';
  priority: 'normal' | 'high' | 'urgent';
  has_attachments: boolean;
  attachments?: JSONB;
  related_entity_type?: string;
  related_entity_id?: UUID;
  is_read: boolean;
  read_by?: UUID[];
  read_at?: Timestamp;
  is_archived: boolean;
  is_starred: boolean;
  tags?: string[];
  mentions?: UUID[];
  reactions?: JSONB;
  edited_at?: Timestamp;
  deleted_at?: Timestamp;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface TeamsIntegrationMessage {
  id: UUID;
  tenant_id: UUID;
  teams_message_id: string;
  teams_conversation_id: string;
  teams_channel_id?: string;
  message_type: 'channel_message' | 'chat_message' | 'adaptive_card';
  subject?: string;
  content: string;
  sender_teams_id: string;
  sender_user_id?: UUID;
  recipient_teams_ids?: string[];
  mentioned_users?: UUID[];
  has_attachments: boolean;
  attachments?: JSONB;
  adaptive_card_payload?: JSONB;
  related_entity_type?: string;
  related_entity_id?: UUID;
  sync_status: 'synced' | 'pending' | 'failed';
  last_synced_at?: Timestamp;
  sync_error?: string;
  teams_timestamp: Timestamp;
  is_deleted: boolean;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface OutlookEmail {
  id: UUID;
  tenant_id: UUID;
  outlook_message_id: string;
  conversation_id?: string;
  folder_path?: string;
  subject?: string;
  body_preview?: string;
  body_content?: string;
  body_type: 'text' | 'html';
  sender_email: string;
  sender_name?: string;
  sender_user_id?: UUID;
  to_recipients: JSONB;
  cc_recipients?: JSONB;
  bcc_recipients?: JSONB;
  received_timestamp: Timestamp;
  sent_timestamp?: Timestamp;
  importance: 'low' | 'normal' | 'high';
  has_attachments: boolean;
  attachments?: JSONB;
  categories?: string[];
  is_read: boolean;
  is_draft: boolean;
  related_entity_type?: string;
  related_entity_id?: UUID;
  sync_status: 'synced' | 'pending' | 'failed';
  last_synced_at?: Timestamp;
  sync_error?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AlertRule {
  id: UUID;
  tenant_id: UUID;
  rule_name: string;
  rule_category: 'vehicle' | 'maintenance' | 'driver' | 'fuel' | 'safety' | 'compliance' | 'financial' | 'custom';
  description?: string;
  trigger_conditions: JSONB;
  notification_channels: string[];
  notification_recipients: UUID[];
  alert_priority: 'low' | 'medium' | 'high' | 'critical';
  alert_message_template: string;
  cooldown_minutes: number;
  last_triggered_at?: Timestamp;
  trigger_count: number;
  is_active: boolean;
  effective_hours?: JSONB;
  effective_days?: number[];
  escalation_rules?: JSONB;
  auto_resolve: boolean;
  auto_resolve_after_minutes?: number;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface AlertHistory {
  id: UUID;
  tenant_id: UUID;
  alert_rule_id: UUID;
  rule_name: string;
  alert_priority: 'low' | 'medium' | 'high' | 'critical';
  trigger_conditions_met: JSONB;
  alert_message: string;
  related_entity_type?: string;
  related_entity_id?: UUID;
  notification_sent: boolean;
  notification_channels_used?: string[];
  notification_recipients?: UUID[];
  sent_at?: Timestamp;
  acknowledged: boolean;
  acknowledged_by?: UUID;
  acknowledged_at?: Timestamp;
  resolved: boolean;
  resolved_by?: UUID;
  resolved_at?: Timestamp;
  resolution_notes?: string;
  escalated: boolean;
  escalated_to?: UUID[];
  escalated_at?: Timestamp;
  triggered_at: Timestamp;
  custom_fields?: JSONB;
}

// ============================================================================
// Migration 010: Safety & Compliance Tables
// ============================================================================

export interface AccidentReport {
  id: UUID;
  tenant_id: UUID;
  report_number: string;
  incident_date: Timestamp;
  reported_date: Timestamp;
  vehicle_id: UUID;
  driver_id: UUID;
  location: JSONB;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  severity: 'minor' | 'moderate' | 'severe' | 'fatal';
  accident_type: 'collision' | 'rollover' | 'hit_object' | 'hit_pedestrian' | 'hit_animal' | 'mechanical' | 'other';
  at_fault?: boolean;
  other_parties_involved: JSONB;
  injuries: JSONB;
  fatalities: number;
  property_damage: boolean;
  estimated_damage_cost?: number;
  vehicle_damage_description?: string;
  damage_photos?: string[];
  weather_conditions?: string;
  road_conditions?: string;
  lighting_conditions?: string;
  traffic_conditions?: string;
  posted_speed_limit?: number;
  vehicle_speed_estimate?: number;
  police_notified: boolean;
  police_report_number?: string;
  police_department?: string;
  officer_name?: string;
  citations_issued?: string[];
  drug_alcohol_test_required: boolean;
  drug_test_result?: string;
  alcohol_test_result?: string;
  witness_names?: string[];
  witness_statements?: JSONB;
  driver_statement?: string;
  preventability?: 'preventable' | 'non_preventable' | 'pending_review';
  investigation_status: 'pending' | 'in_progress' | 'completed' | 'closed';
  investigation_notes?: string;
  investigated_by?: UUID;
  corrective_actions?: string[];
  insurance_claim_number?: string;
  insurance_notified_at?: Timestamp;
  claim_status?: string;
  reported_by: UUID;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface SafetyInspection {
  id: UUID;
  tenant_id: UUID;
  inspection_number: string;
  vehicle_id: UUID;
  inspection_type: 'dot' | 'pre_trip' | 'post_trip' | 'annual' | 'random' | 'preventive';
  inspection_date: Timestamp;
  inspector_id: UUID;
  inspector_name?: string;
  odometer_reading?: number;
  location?: string;
  checklist_template_id?: UUID;
  checklist_results: JSONB;
  overall_status: 'pass' | 'pass_with_defects' | 'fail';
  defects_found?: JSONB;
  critical_defects: number;
  major_defects: number;
  minor_defects: number;
  defect_photos?: string[];
  work_orders_created?: UUID[];
  vehicle_out_of_service: boolean;
  out_of_service_reason?: string;
  returned_to_service_at?: Timestamp;
  returned_by?: UUID;
  dot_certification_number?: string;
  dot_inspector_license?: string;
  next_inspection_due?: Timestamp;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DriverViolation {
  id: UUID;
  tenant_id: UUID;
  violation_number: string;
  driver_id: UUID;
  vehicle_id?: UUID;
  violation_date: Timestamp;
  violation_type: 'speeding' | 'reckless_driving' | 'running_red_light' | 'illegal_parking' | 'license_suspended' | 'other';
  citation_number?: string;
  issuing_agency?: string;
  officer_name?: string;
  violation_location?: string;
  violation_description: string;
  fine_amount?: number;
  court_costs?: number;
  total_amount_due?: number;
  points_assessed?: number;
  state?: string;
  court_date?: Timestamp;
  court_location?: string;
  plea?: 'guilty' | 'not_guilty' | 'no_contest' | 'pending';
  court_outcome?: string;
  appeal_filed: boolean;
  appeal_status?: string;
  payment_status: 'unpaid' | 'partially_paid' | 'paid' | 'waived';
  paid_by: 'driver' | 'company' | 'split';
  payment_date?: Timestamp;
  driver_reimbursed: boolean;
  company_response?: string;
  corrective_action_taken?: string;
  training_required: boolean;
  training_completed: boolean;
  training_completed_at?: Timestamp;
  insurance_notified: boolean;
  affects_insurance_rate: boolean;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface ComplianceDocument {
  id: UUID;
  tenant_id: UUID;
  document_type: 'license' | 'permit' | 'registration' | 'insurance' | 'certification' | 'inspection' | 'lease' | 'contract' | 'other';
  document_category: string;
  document_name: string;
  document_number?: string;
  issuing_authority?: string;
  issue_date?: Timestamp;
  expiration_date?: Timestamp;
  status?: 'active' | 'expiring_soon' | 'expired' | 'suspended' | 'revoked';
  renewal_required: boolean;
  renewal_initiated: boolean;
  renewal_date?: Timestamp;
  auto_renew: boolean;
  linked_entity_type: 'fleet' | 'vehicle' | 'driver' | 'facility';
  linked_entity_id: UUID;
  document_file_id?: UUID;
  file_url?: string;
  reminder_days_before?: number;
  reminder_sent: boolean;
  reminder_sent_at?: Timestamp;
  responsible_party?: UUID;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface HoursOfServiceLog {
  id: UUID;
  tenant_id: UUID;
  driver_id: UUID;
  log_date: Timestamp;
  duty_status: 'off_duty' | 'sleeper_berth' | 'driving' | 'on_duty_not_driving';
  start_time: Timestamp;
  end_time?: Timestamp;
  duration_minutes?: number;
  location?: JSONB;
  odometer_start?: number;
  odometer_end?: number;
  vehicle_id?: UUID;
  trailer_id?: UUID;
  shipping_document?: string;
  remarks?: string;
  violations?: string[];
  is_certified: boolean;
  certified_at?: Timestamp;
  signature?: string;
  eld_provider?: string;
  eld_device_id?: string;
  edited: boolean;
  edited_by?: UUID;
  edited_at?: Timestamp;
  edit_reason?: string;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DriverTrainingRecord {
  id: UUID;
  tenant_id: UUID;
  driver_id: UUID;
  training_name: string;
  training_type: 'orientation' | 'safety' | 'defensive_driving' | 'hazmat' | 'equipment_operation' | 'compliance' | 'other';
  training_method: 'classroom' | 'online' | 'hands_on' | 'simulator' | 'field' | 'self_paced';
  provider_name?: string;
  instructor_name?: string;
  training_date: Timestamp;
  duration_hours?: number;
  location?: string;
  completion_status: 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  completed_at?: Timestamp;
  pass_score_required?: number;
  score_achieved?: number;
  passed: boolean;
  certification_issued: boolean;
  certification_number?: string;
  certification_expiration?: Timestamp;
  recertification_required: boolean;
  recertification_due?: Timestamp;
  cost?: number;
  materials_provided?: string[];
  assessment_results?: JSONB;
  training_file_id?: UUID;
  certificate_file_id?: UUID;
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface SafetyMeeting {
  id: UUID;
  tenant_id: UUID;
  meeting_number: string;
  meeting_type: 'toolbox_talk' | 'monthly_safety' | 'incident_review' | 'training' | 'quarterly_review' | 'other';
  meeting_date: Timestamp;
  meeting_duration_minutes?: number;
  location?: string;
  facilitator_id?: UUID;
  topics_covered: string[];
  agenda?: string;
  meeting_notes?: string;
  attendees: UUID[];
  attendance_signatures?: JSONB;
  required_attendees?: UUID[];
  absent_attendees?: UUID[];
  materials_distributed?: string[];
  quiz_administered: boolean;
  quiz_results?: JSONB;
  action_items?: JSONB;
  follow_up_required: boolean;
  follow_up_date?: Timestamp;
  meeting_recording_url?: string;
  attachments?: UUID[];
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

export interface InsurancePolicy {
  id: UUID;
  tenant_id: UUID;
  policy_number: string;
  policy_type: 'liability' | 'collision' | 'comprehensive' | 'physical_damage' | 'cargo' | 'workers_comp' | 'umbrella' | 'other';
  insurance_provider: string;
  agent_name?: string;
  agent_phone?: string;
  agent_email?: string;
  policy_effective_date: Timestamp;
  policy_expiration_date: Timestamp;
  renewal_status?: 'pending' | 'initiated' | 'completed' | 'cancelled';
  coverage_limits: JSONB;
  deductible_amount?: number;
  premium_amount: number;
  premium_frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  payment_method?: string;
  payment_status: 'current' | 'overdue' | 'cancelled';
  covered_vehicles?: UUID[];
  covered_drivers?: UUID[];
  claim_count: number;
  claims?: UUID[];
  policy_documents?: UUID[];
  notes?: string;
  custom_fields?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: UUID;
  updated_by?: UUID;
}

// Continue with remaining tables in next message...
