#!/usr/bin/env ts-node
import * as fs from 'fs';
import { execSync } from 'child_process';

// Auto-generated table schemas
const tableSchemas: Record<string, string[]> = {
  accident_investigations: ['id', 'accident_date', 'accident_time', 'location', 'vehicle_id', 'driver_id', 'investigation_date', 'investigator_name', 'investigator_title', 'accident_type', 'severity', 'weather_conditions', 'road_conditions', 'visibility', 'what_happened', 'why_it_happened', 'immediate_causes', 'root_causes', 'contributing_factors', 'corrective_actions', 'preventive_measures', 'responsible_party', 'target_completion_date', 'actual_completion_date', 'effectiveness_review_date', 'effectiveness_review_notes', 'photos_url', 'police_report_url', 'witness_statements_url', 'investigation_status', 'created_at', 'updated_at'],
  activity_log: ['id', 'entity_type', 'entity_id', 'event_type', 'user_id', 'user_name', 'event_data', 'ip_address', 'user_agent', 'created_at'],
  adaptive_card_actions: ['id', 'card_id', 'message_id', 'action_type', 'action_data', 'user_id', 'result', 'created_at'],
  ai_anomaly_baselines: ['id', 'tenant_id', 'metric_name', 'entity_type', 'entity_id', 'statistical_data', 'sample_size', 'last_calculated'],
  ai_control_checks: ['id', 'tenant_id', 'user_id', 'transaction_type', 'transaction_id', 'transaction_data', 'passed', 'violations', 'required_approvals', 'automated_actions', 'severity', 'action_taken', 'created_at'],
  ai_conversations: ['id', 'tenant_id', 'user_id', 'conversation_id', 'intent', 'status', 'extracted_data', 'messages', 'completeness', 'missing_fields', 'created_at', 'updated_at', 'completed_at'],
  ai_detection_models: ['id', 'model_name', 'model_type', 'model_version', 'enabled', 'confidence_threshold', 'api_endpoint', 'accuracy_rate', 'false_positive_rate', 'avg_processing_time_ms', 'total_detections', 'supported_events', 'metadata', 'created_at', 'updated_at'],
  ai_evidence: ['id', 'tenant_id', 'related_table', 'related_id', 'evidence_type', 'evidence_data', 'model_used', 'confidence', 'created_at'],
  ai_suggestions: ['id', 'tenant_id', 'field_name', 'context_hash', 'suggestions', 'confidence', 'usage_count', 'created_at', 'last_used_at', 'expires_at'],
  ai_validations: ['id', 'tenant_id', 'user_id', 'entity_type', 'entity_id', 'validation_result', 'is_valid', 'confidence', 'warnings', 'anomalies', 'suggestions', 'auto_applied', 'created_at'],
  alert_delivery_log: ['id', 'alert_id', 'channel', 'recipient', 'status', 'error_message', 'sent_at'],
  alert_escalations: ['id', 'alert_id', 'escalated_from', 'escalated_to', 'escalated_by', 'escalation_reason', 'escalated_at'],
  alert_rules: ['id', 'tenant_id', 'rule_name', 'rule_type', 'conditions', 'severity', 'channels', 'recipients', 'is_enabled', 'cooldown_minutes', 'created_by', 'created_at', 'updated_at'],
  alerts: ['id', 'tenant_id', 'rule_id', 'alert_type', 'severity', 'title', 'message', 'entity_type', 'entity_id', 'link', 'status', 'channels_sent', 'acknowledged_by', 'acknowledged_at', 'resolved_by', 'resolved_at', 'resolution_notes', 'created_at', 'updated_at'],
  annual_reauthorization_cycles: ['id', 'tenant_id', 'year', 'cycle_name', 'start_date', 'deadline_date', 'completion_date', 'status', 'total_assignments_count', 'reauthorized_count', 'modified_count', 'terminated_count', 'submitted_to_fleet', 'submitted_at', 'submitted_by_user_id', 'notes', 'created_at', 'updated_at', 'created_by_user_id'],
  anomalies: ['id', 'tenant_id', 'anomaly_type', 'entity_type', 'entity_id', 'metric_name', 'expected_value', 'actual_value', 'deviation_score', 'severity', 'description', 'detection_method', 'model_id', 'root_cause_analysis', 'recommended_action', 'is_false_positive', 'is_resolved', 'resolved_by', 'resolved_at', 'resolution_notes', 'detected_at', 'created_at'],
  api_request_logs: ['id', 'request_id', 'user_id', 'tenant_id', 'method', 'path', 'query_params', 'request_headers', 'request_body_size', 'response_status', 'response_size', 'response_time_ms', 'ip_address', 'user_agent', 'rate_limit_hit', 'cached', 'error_message', 'created_at'],
  appointment_types: ['id', 'tenant_id', 'name', 'description', 'color', 'default_duration', 'requires_vehicle', 'requires_driver', 'requires_technician', 'requires_service_bay', 'buffer_time_before', 'buffer_time_after', 'is_active', 'created_at', 'updated_at'],
  approval_tracking: ['id', 'tenant_id', 'approval_workflow_id', 'entity_type', 'entity_id', 'current_step', 'total_steps', 'overall_status', 'approver_user_id', 'approver_role', 'action', 'action_date', 'comments', 'notification_sent', 'notification_sent_at', 'created_at', 'updated_at'],
  approval_workflows: ['id', 'tenant_id', 'workflow_name', 'workflow_type', 'workflow_steps', 'is_active', 'requires_sequential_approval', 'description', 'created_at', 'updated_at'],
  approvals: ['id', 'tenant_id', 'approval_type', 'item_type', 'item_id', 'requested_by', 'approved_by', 'amount', 'budget_code', 'department', 'priority', 'description', 'justification', 'current_budget', 'spent_to_date', 'remaining_budget', 'after_approval_budget', 'status', 'approval_conditions', 'approved_amount', 'rejection_reason', 'info_requested', 'request_date', 'approved_at', 'created_at', 'updated_at'],
  ar_sessions: ['id', 'vehicle_id', 'user_id', 'platform', 'ar_framework', 'device_model', 'os_version', 'started_at', 'ended_at', 'duration_seconds', 'placement_attempts', 'successful_placements', 'screenshots_taken', 'viewed_angles', 'zoomed_in', 'opened_doors', 'viewed_interior', 'led_to_inquiry', 'led_to_purchase', 'session_rating', 'anchor_type', 'lighting_estimation', 'occlusion_enabled', 'session_data', 'created_at'],
  arcgis_layers: ['id', 'tenant_id', 'name', 'description', 'service_url', 'layer_type', 'enabled', 'opacity', 'min_zoom', 'max_zoom', 'refresh_interval', 'authentication', 'styling', 'metadata', 'created_at', 'updated_at'],
  asset_assignments: ['id', 'asset_id', 'assigned_to', 'assigned_by', 'assignment_date', 'return_date', 'notes', 'created_at'],
  asset_audit_log: ['id', 'asset_id', 'action', 'field_name', 'old_value', 'new_value', 'performed_by', 'timestamp'],
  asset_comments: ['id', 'asset_id', 'created_by', 'comment_text', 'created_at', 'updated_at'],
  asset_file_attachments: ['id', 'asset_id', 'file_name', 'file_url', 'file_type', 'file_size', 'uploaded_by', 'uploaded_at'],
  asset_history: ['id', 'asset_id', 'action', 'performed_by', 'assigned_to', 'location', 'notes', 'timestamp'],
  asset_maintenance: ['id', 'asset_id', 'maintenance_type', 'maintenance_date', 'description', 'cost', 'performed_by', 'next_maintenance_date', 'created_at'],
  asset_relationships: ['id', 'parent_asset_id', 'child_asset_id', 'relationship_type', 'connection_point', 'is_primary', 'effective_from', 'effective_to', 'notes', 'created_at', 'created_by', 'updated_at'],
  asset_templates: ['id', 'tenant_id', 'template_name', 'description', 'asset_type', 'default_depreciation_rate', 'custom_fields', 'is_public', 'created_by', 'usage_count', 'created_at', 'updated_at'],
  asset_transfers: ['id', 'asset_id', 'from_location', 'to_location', 'from_user', 'to_user', 'transfer_date', 'transfer_reason', 'notes', 'initiated_by', 'created_at'],
  assets: ['id', 'tenant_id', 'asset_tag', 'asset_name', 'asset_type', 'category', 'description', 'manufacturer', 'model', 'serial_number', 'purchase_date', 'purchase_price', 'current_value', 'depreciation_rate', 'condition', 'status', 'location', 'assigned_to', 'warranty_expiration', 'last_maintenance', 'qr_code', 'metadata', 'created_at', 'updated_at', 'created_by', 'updated_by'],
  attachment_access_log: ['id', 'attachment_id', 'user_id', 'action', 'ip_address', 'user_agent', 'access_method', 'metadata', 'accessed_at'],
  authentication_logs: ['id', 'user_id', 'email', 'tenant_id', 'event_type', 'success', 'failure_reason', 'ip_address', 'user_agent', 'session_id', 'mfa_used', 'location_country', 'location_city', 'created_at'],
  battery_health_logs: ['id', 'vehicle_id', 'timestamp', 'state_of_health_percent', 'state_of_charge_percent', 'capacity_kwh', 'capacity_degradation_percent', 'min_cell_voltage_v', 'max_cell_voltage_v', 'cell_voltage_delta_v', 'battery_temp_c', 'min_cell_temp_c', 'max_cell_temp_c', 'charge_cycles_total', 'fast_charge_cycles', 'calendar_age_days', 'charge_throughput_kwh', 'requires_attention', 'alert_reason', 'created_at'],
  break_glass_logs: ['id', 'user_id', 'tenant_id', 'reason', 'approver_id', 'approval_method', 'action_taken', 'resource_type', 'resource_id', 'duration_minutes', 'ip_address', 'user_agent', 'revoked', 'revoked_at', 'revoked_by', 'created_at', 'expires_at'],
  break_glass_sessions: ['id', 'user_id', 'elevated_role_id', 'reason', 'ticket_reference', 'approved_by', 'approved_at', 'start_time', 'end_time', 'max_duration_minutes', 'status', 'created_at'],
  budget_allocations: ['id', 'tenant_id', 'budget_category', 'allocated_amount', 'spent_amount', 'remaining_amount', 'fiscal_year', 'fiscal_quarter', 'alert_threshold', 'created_at', 'updated_at'],
  bulk_fuel_inventory: ['id', 'tenant_id', 'location', 'facility_id', 'tank_id', 'fuel_type', 'capacity', 'current_volume', 'reorder_threshold', 'reorder_quantity', 'average_cost_per_gallon', 'last_purchase_cost', 'inventory_value', 'last_delivery_date', 'last_delivery_gallons', 'last_delivery_cost', 'next_delivery_scheduled', 'last_reading_date', 'reading_method', 'low_level_alert_sent', 'status', 'created_at', 'updated_at', 'notes', 'metadata'],
  calendar_events: ['id', 'event_id', 'subject', 'start_time', 'end_time', 'location', 'attendees', 'organizer', 'event_type', 'entity_type', 'entity_id', 'status', 'is_online_meeting', 'online_meeting_url', 'created_at', 'updated_at'],
  calendar_integrations: ['id', 'tenant_id', 'user_id', 'provider', 'is_primary', 'is_enabled', 'access_token', 'refresh_token', 'token_expiry', 'calendar_id', 'calendar_name', 'sync_direction', 'sync_vehicle_reservations', 'sync_maintenance_appointments', 'sync_work_orders', 'last_sync_at', 'sync_status', 'sync_errors', 'settings', 'created_at', 'updated_at'],
  calendar_sync_log: ['id', 'calendar_integration_id', 'sync_type', 'sync_direction', 'started_at', 'completed_at', 'events_synced', 'events_created', 'events_updated', 'events_deleted', 'errors', 'status', 'created_at'],
  call_recordings: ['id', 'communication_id', 'recording_url', 'recording_duration_seconds', 'recording_size_bytes', 'is_transcribed', 'transcription_text', 'transcription_confidence', 'transcription_language', 'ai_speaker_count', 'ai_speakers', 'ai_key_moments', 'ai_action_items', 'ai_sentiment_timeline', 'consent_obtained', 'consent_timestamp', 'retention_until', 'created_at'],
  camera_capture_metadata: ['id', 'document_id', 'device_manufacturer', 'device_model', 'os_name', 'os_version', 'app_version', 'photo_taken_at', 'camera_make', 'camera_model', 'focal_length', 'aperture', 'iso', 'flash_used', 'orientation', 'latitude', 'longitude', 'altitude', 'location_accuracy', 'location_address', 'image_width', 'image_height', 'image_resolution_dpi', 'file_size_original_bytes', 'file_size_compressed_bytes', 'compression_ratio', 'auto_crop_applied', 'auto_rotate_applied', 'auto_brightness_applied', 'auto_contrast_applied', 'edge_detection_applied', 'created_at'],
  camera_data_sources: ['id', 'name', 'description', 'source_type', 'service_url', 'enabled', 'sync_interval_minutes', 'authentication', 'field_mapping', 'last_sync_at', 'last_sync_status', 'last_sync_error', 'total_cameras_synced', 'metadata', 'created_at', 'updated_at'],
  carbon_footprint_log: ['id', 'vehicle_id', 'log_date', 'kwh_consumed', 'miles_driven', 'efficiency_kwh_per_mile', 'grid_carbon_intensity_g_per_kwh', 'carbon_emitted_kg', 'ice_equivalent_gallons', 'ice_carbon_kg', 'carbon_saved_kg', 'carbon_saved_percent', 'renewable_energy_kwh', 'renewable_percent', 'created_at'],
  charging_connectors: ['id', 'station_id', 'connector_id', 'evse_id', 'connector_type', 'power_type', 'max_power_kw', 'max_voltage_v', 'max_current_amp', 'status', 'is_enabled', 'error_code', 'current_transaction_id', 'current_vehicle_id', 'created_at', 'updated_at'],
  charging_load_management: ['id', 'facility_id', 'max_facility_power_kw', 'current_load_kw', 'available_power_kw', 'active_sessions_count', 'queued_sessions_count', 'solar_generation_kw', 'battery_storage_kwh', 'current_electricity_rate', 'is_peak_period', 'timestamp'],
  charging_reservations: ['id', 'station_id', 'connector_id', 'vehicle_id', 'driver_id', 'reservation_start', 'reservation_end', 'duration_minutes', 'ocpp_reservation_id', 'status', 'charging_session_id', 'reminder_sent', 'notes', 'created_at', 'updated_at'],
  charging_schedules: ['id', 'vehicle_id', 'driver_id', 'schedule_name', 'schedule_type', 'start_time', 'end_time', 'days_of_week', 'specific_date', 'target_soc_percent', 'charging_priority', 'max_charge_rate_kw', 'prefer_off_peak', 'prefer_renewable', 'allow_v2g', 'off_peak_start', 'off_peak_end', 'is_active', 'last_triggered', 'created_at', 'updated_at'],
  charging_session_metrics: ['id', 'session_id', 'timestamp', 'energy_active_import_wh', 'power_active_import_w', 'current_import_amp', 'voltage_v', 'soc_percent', 'battery_temperature_c', 'current_price_per_kwh', 'raw_data', 'created_at'],
  charging_sessions: ['id', 'transaction_id', 'station_id', 'connector_id', 'vehicle_id', 'driver_id', 'start_time', 'end_time', 'duration_minutes', 'start_soc_percent', 'end_soc_percent', 'energy_delivered_kwh', 'max_power_kw', 'avg_power_kw', 'energy_cost', 'idle_fee', 'total_cost', 'session_status', 'stop_reason', 'scheduled_start_time', 'scheduled_end_time', 'charging_profile', 'is_smart_charging', 'target_soc_percent', 'reservation_id', 'rfid_tag', 'authorization_method', 'meter_start', 'meter_stop', 'raw_ocpp_data', 'created_at', 'updated_at'],
  charging_stations: ['id', 'station_id', 'name', 'location_name', 'latitude', 'longitude', 'address', 'facility_id', 'parking_space', 'manufacturer', 'model', 'firmware_version', 'serial_number', 'power_type', 'max_power_kw', 'voltage_v', 'current_amp', 'num_connectors', 'ocpp_version', 'ws_url', 'api_endpoint', 'network_provider', 'status', 'is_online', 'is_enabled', 'last_heartbeat', 'last_status_update', 'requires_authentication', 'rfid_enabled', 'mobile_app_enabled', 'public_access', 'price_per_kwh_off_peak', 'price_per_kwh_on_peak', 'price_per_minute_idle', 'supports_smart_charging', 'load_management_enabled', 'solar_integrated', 'notes', 'installation_date', 'warranty_expiry_date', 'last_maintenance_date', 'created_at', 'updated_at'],
  chat_messages: ['id', 'session_id', 'role', 'content', 'sources', 'model_used', 'tokens_used', 'cost_usd', 'processing_time_ms', 'error_message', 'feedback_rating', 'feedback_helpful', 'feedback_comment', 'created_at'],
  chat_session_shares: ['id', 'session_id', 'shared_with_user_id', 'shared_with_role', 'can_view', 'can_edit', 'can_share', 'created_at', 'created_by', 'revoked_at'],
  chat_sessions: ['id', 'tenant_id', 'user_id', 'title', 'description', 'document_scope', 'system_prompt', 'model_name', 'temperature', 'max_tokens', 'message_count', 'total_tokens_used', 'total_cost_usd', 'created_at', 'updated_at', 'last_message_at', 'is_active', 'deleted_at'],
  chat_system_prompts: ['id', 'prompt_name', 'prompt_text', 'description', 'is_default', 'created_at'],
  coaching_notes: ['id', 'tenant_id', 'driver_id', 'coach_id', 'note', 'coaching_type', 'follow_up_required', 'follow_up_date', 'created_at', 'updated_at'],
  cognition_insights: ['id', 'tenant_id', 'insight_type', 'severity', 'title', 'description', 'affected_entities', 'data_sources', 'confidence_score', 'recommended_actions', 'potential_impact', 'supporting_data', 'model_ids', 'is_acknowledged', 'acknowledged_by', 'acknowledged_at', 'is_actioned', 'action_taken', 'action_by', 'action_at', 'expires_at', 'created_at'],
  communication_attachments: ['id', 'communication_id', 'filename', 'original_filename', 'file_size_bytes', 'mime_type', 'storage_path', 'storage_url', 'is_scanned', 'scan_result', 'ocr_extracted_text', 'ocr_confidence', 'ai_detected_type', 'ai_extracted_data', 'thumbnail_url', 'created_at'],
  communication_automation_rules: ['id', 'rule_name', 'rule_description', 'trigger_event', 'trigger_conditions', 'action_type', 'template_id', 'recipient_roles', 'additional_recipients', 'delay_minutes', 'repeat_if_no_response', 'repeat_interval_hours', 'max_repeats', 'is_active', 'last_triggered_at', 'trigger_count', 'created_at', 'created_by', 'updated_at'],
  communication_entity_links: ['id', 'communication_id', 'entity_type', 'entity_id', 'link_type', 'relevance_score', 'auto_detected', 'manually_added', 'created_at'],
  communication_insights: ['id', 'period_start', 'period_end', 'total_communications', 'by_type', 'by_category', 'by_sentiment', 'avg_response_time_hours', 'response_rate_percent', 'most_communicated_vehicles', 'most_communicated_drivers', 'trending_topics', 'trending_keywords', 'anomalies_detected', 'ai_recommendations', 'generated_at'],
  communication_preferences: ['id', 'user_id', 'prefer_email', 'email_address', 'prefer_sms', 'phone_number', 'prefer_push_notifications', 'prefer_in_app', 'frequency', 'quiet_hours_start', 'quiet_hours_end', 'subscribed_categories', 'subscribed_entities', 'opted_out_categories', 'opted_out_completely', 'created_at', 'updated_at'],
  communication_templates: ['id', 'template_name', 'template_category', 'subject_template', 'body_template', 'required_variables', 'optional_variables', 'auto_trigger_conditions', 'usage_count', 'last_used_at', 'is_active', 'created_at', 'created_by', 'updated_at'],
  communications: ['id', 'communication_type', 'direction', 'subject', 'body', 'from_user_id', 'from_contact_name', 'from_contact_email', 'from_contact_phone', 'to_user_ids', 'to_contact_names', 'to_contact_emails', 'to_contact_phones', 'cc_emails', 'bcc_emails', 'communication_datetime', 'duration_seconds', 'ai_detected_category', 'ai_detected_priority', 'ai_detected_sentiment', 'ai_confidence_score', 'ai_extracted_keywords', 'ai_summary', 'ai_suggested_actions', 'manual_category', 'manual_priority', 'manual_tags', 'status', 'requires_follow_up', 'follow_up_by_date', 'follow_up_completed', 'follow_up_completed_date', 'attachments', 'parent_communication_id', 'thread_id', 'is_thread_start', 'full_text_search', 'created_at', 'created_by', 'updated_at', 'updated_by'],
  compliance_audit_trail: ['id', 'tenant_id', 'user_id', 'compliance_type', 'event_type', 'event_description', 'related_resource_type', 'related_resource_id', 'metadata', 'retention_years', 'created_at'],
  compliance_records: ['id', 'tenant_id', 'requirement_id', 'vehicle_id', 'driver_id', 'due_date', 'completion_date', 'completed_by', 'status', 'compliance_percentage', 'notes', 'attachments', 'next_due_date', 'created_at', 'updated_at'],
  compliance_requirements: ['id', 'tenant_id', 'requirement_code', 'requirement_name', 'regulatory_body', 'category', 'description', 'frequency', 'applies_to', 'penalty_for_non_compliance', 'document_url', 'is_active', 'effective_date', 'created_at', 'updated_at'],
  configuration_change_logs: ['id', 'user_id', 'tenant_id', 'setting_name', 'setting_category', 'old_value', 'new_value', 'change_reason', 'approved_by', 'rollback_available', 'rollback_data', 'ip_address', 'user_agent', 'created_at'],
  cost_benefit_analyses: ['id', 'tenant_id', 'vehicle_assignment_id', 'department_id', 'requesting_position', 'prepared_by_user_id', 'prepared_date', 'annual_fuel_cost', 'annual_maintenance_cost', 'annual_insurance_cost', 'annual_parking_cost', 'vehicle_elimination_savings', 'productivity_impact_hours', 'productivity_impact_dollars', 'on_call_expense_reduction', 'mileage_reimbursement_reduction', 'labor_cost_savings', 'total_annual_costs', 'annual_fuel_cost', 'total_annual_benefits', 'vehicle_elimination_savings', 'on_call_expense_reduction', 'net_benefit', 'on_call_expense_reduction', 'public_safety_impact', 'visibility_requirement', 'response_time_impact', 'employee_identification_need', 'specialty_equipment_need', 'other_non_quantifiable_factors', 'recommendation', 'reviewed_by_user_id', 'reviewed_at', 'approval_status', 'created_at', 'updated_at', 'created_by_user_id'],
  cost_tracking: ['id', 'tenant_id', 'cost_category', 'cost_subcategory', 'vehicle_id', 'driver_id', 'route_id', 'vendor_id', 'amount', 'currency', 'description', 'transaction_date', 'invoice_number', 'is_budgeted', 'is_anomaly', 'cost_per_mile', 'cost_per_hour', 'variance_from_budget', 'created_at', 'updated_at', 'metadata'],
  custom_field_definitions: ['id', 'tenant_id', 'entity_type', 'field_name', 'field_label', 'field_type', 'description', 'required', 'default_value', 'options', 'validation', 'conditional', 'group_name', 'sort_order', 'is_active', 'created_at', 'updated_at'],
  custom_field_groups: ['id', 'tenant_id', 'entity_type', 'group_name', 'group_label', 'description', 'sort_order', 'is_collapsible', 'is_collapsed_by_default', 'created_at'],
  custom_field_values: ['id', 'tenant_id', 'field_id', 'entity_type', 'entity_id', 'value', 'created_at', 'updated_at'],
  custom_reports: ['id', 'tenant_id', 'report_name', 'description', 'data_sources', 'filters', 'columns', 'grouping', 'sorting', 'aggregations', 'joins', 'created_by', 'updated_by', 'is_public', 'is_template', 'created_at', 'updated_at'],
  damage_detections: ['id', 'tenant_id', 'vehicle_id', 'reported_by', 'photo_url', 'ai_detections', 'severity', 'estimated_cost', 'status', 'detected_at', 'resolved_at', 'created_at'],
  damage_reports: ['id', 'tenant_id', 'vehicle_id', 'reported_by', 'damage_description', 'damage_severity', 'damage_location', 'photos', 'triposr_task_id', 'triposr_status', 'triposr_model_url', 'linked_work_order_id', 'inspection_id', 'created_at', 'updated_at'],
  data_access_logs: ['id', 'user_id', 'tenant_id', 'action', 'resource_type', 'resource_id', 'fields_accessed', 'pii_accessed', 'phi_accessed', 'ip_address', 'user_agent', 'request_path', 'query_params', 'response_status', 'created_at'],
  db_user_audit: ['id', 'db_user', 'operation', 'table_name', 'record_id', 'ip_address', 'created_at'],
  dead_letter_queue: ['id', 'job_id', 'queue_name', 'job_type', 'payload', 'error', 'stack_trace', 'retry_count', 'original_created_at', 'moved_to_dlq_at', 'reviewed', 'reviewed_by', 'reviewed_at', 'resolution_notes', 'retry_attempted', 'retry_attempted_at', 'created_at'],
  departments: ['id', 'tenant_id', 'name', 'code', 'description', 'parent_department_id', 'director_user_id', 'is_active', 'created_at', 'updated_at'],
  deployments: ['id', 'tenant_id', 'environment', 'version', 'commit_hash', 'branch', 'deployed_by_user_id', 'status', 'started_at', 'completed_at', 'rollback_at', 'deployment_notes', 'quality_gate_summary', 'metadata', 'created_at', 'updated_at'],
  detected_patterns: ['id', 'tenant_id', 'pattern_type', 'pattern_name', 'description', 'occurrence_frequency', 'first_detected_at', 'last_detected_at', 'occurrence_count', 'affected_entities', 'pattern_characteristics', 'confidence_score', 'statistical_significance', 'is_monitored', 'alert_threshold', 'created_at', 'updated_at'],
  device_telemetry: ['id', 'vehicle_device_id', 'timestamp', 'data_type', 'raw_data', 'processed_data', 'latitude', 'longitude', 'speed', 'heading', 'odometer', 'fuel_level', 'engine_hours', 'diagnostic_codes', 'created_at'],
  dispatch_active_listeners: ['id', 'channel_id', 'user_id', 'connection_id', 'connected_at', 'last_heartbeat', 'device_type', 'device_info'],
  dispatch_channel_subscriptions: ['id', 'channel_id', 'user_id', 'role_name', 'can_transmit', 'can_listen', 'can_moderate', 'subscribed_at', 'subscribed_by'],
  dispatch_channels: ['id', 'name', 'description', 'channel_type', 'is_active', 'priority_level', 'color_code', 'created_at', 'updated_at', 'created_by'],
  dispatch_emergency_alerts: ['id', 'user_id', 'vehicle_id', 'alert_type', 'alert_status', 'location_lat', 'location_lng', 'location_address', 'description', 'acknowledged_by', 'acknowledged_at', 'resolved_by', 'resolved_at', 'response_time_seconds', 'created_at', 'updated_at'],
  dispatch_incident_tags: ['id', 'transmission_id', 'tag_type', 'confidence_score', 'detected_by', 'detected_at', 'entities', 'sentiment', 'auto_created_work_order'],
  dispatch_metrics: ['id', 'metric_date', 'channel_id', 'total_transmissions', 'total_duration_seconds', 'emergency_transmissions', 'average_response_time_seconds', 'unique_users', 'peak_concurrent_users', 'transcription_accuracy', 'created_at'],
  dispatch_transcriptions: ['id', 'transmission_id', 'transcription_text', 'confidence_score', 'language_code', 'transcribed_at', 'transcription_service', 'processing_time_ms'],
  dispatch_transmissions: ['id', 'channel_id', 'user_id', 'transmission_start', 'transmission_end', 'duration_seconds', 'audio_blob_url', 'audio_format', 'audio_size_bytes', 'is_emergency', 'location_lat', 'location_lng', 'device_info', 'created_at'],
  document_access_log: ['id', 'document_id', 'user_id', 'action', 'ip_address', 'user_agent', 'metadata', 'accessed_at'],
  document_analyses: ['id', 'tenant_id', 'user_id', 'document_url', 'document_type', 'extracted_data', 'confidence_scores', 'suggested_matches', 'validation_issues', 'needs_review', 'reviewed', 'reviewed_by', 'reviewed_at', 'created_at'],
  document_audit_log: ['id', 'tenant_id', 'document_id', 'folder_id', 'user_id', 'action', 'entity_type', 'old_values', 'new_values', 'ip_address', 'user_agent', 'session_id', 'result', 'error_message', 'metadata', 'created_at'],
  document_categories: ['id', 'tenant_id', 'category_name', 'description', 'color', 'icon', 'created_at', 'updated_at'],
  document_classifications: ['id', 'tenant_id', 'document_id', 'detected_type', 'confidence', 'primary_category', 'secondary_category', 'tags', 'model_name', 'model_version', 'processing_time_ms', 'created_at'],
  document_comments: ['id', 'document_id', 'user_id', 'comment_text', 'page_number', 'position', 'is_resolved', 'resolved_by', 'resolved_at', 'parent_comment_id', 'created_at', 'updated_at'],
  document_embeddings: ['id', 'document_id', 'chunk_text', 'chunk_index', 'embedding', 'chunk_type', 'page_number', 'section_title', 'token_count', 'metadata', 'created_at'],
  document_folders: ['id', 'tenant_id', 'parent_folder_id', 'folder_name', 'description', 'color', 'icon', 'path', 'depth', 'is_system', 'metadata', 'created_by', 'created_at', 'updated_at', 'deleted_at'],
  document_indexing_log: ['id', 'tenant_id', 'document_id', 'indexing_time_ms', 'status', 'error_message', 'created_at'],
  document_pages: ['id', 'document_id', 'page_number', 'page_image_url', 'page_thumbnail_url', 'ocr_text', 'ocr_confidence', 'ocr_bounding_boxes', 'ai_detected_content_type', 'ai_extracted_tables', 'ai_extracted_forms', 'created_at'],
  document_permissions: ['id', 'document_id', 'user_id', 'role', 'permission_type', 'granted_by', 'granted_at', 'expires_at'],
  document_processing_queue: ['id', 'document_id', 'job_type', 'priority', 'status', 'queued_at', 'started_at', 'completed_at', 'processing_duration_ms', 'result', 'error_message', 'retry_count', 'max_retries', 'next_retry_at', 'processed_by_worker'],
  document_rag_queries: ['id', 'tenant_id', 'user_id', 'query_text', 'query_embedding', 'response_text', 'matched_documents', 'matched_chunks', 'relevance_scores', 'execution_time_ms', 'feedback_rating', 'feedback_comment', 'metadata', 'created_at'],
  document_relationships: ['id', 'source_document_id', 'target_document_id', 'relationship_type', 'notes', 'created_by', 'created_at'],
  document_shares: ['id', 'document_id', 'share_token', 'share_type', 'password_hash', 'expires_at', 'max_downloads', 'download_count', 'allowed_emails', 'created_by', 'metadata', 'created_at', 'last_accessed_at'],
  document_storage_locations: ['id', 'tenant_id', 'location_name', 'location_type', 'is_default', 'is_active', 'configuration', 'capacity_bytes', 'used_bytes', 'metadata', 'created_at', 'updated_at'],
  document_summaries: ['id', 'tenant_id', 'document_id', 'summary_type', 'summary_text', 'key_points', 'keywords', 'sentiment', 'sentiment_score', 'model_name', 'original_length', 'summary_length', 'compression_ratio', 'created_at'],
  document_versions: ['id', 'document_id', 'version_number', 'file_url', 'file_size', 'file_hash', 'uploaded_by', 'change_notes', 'metadata', 'created_at'],
  documents: ['id', 'tenant_id', 'file_name', 'file_type', 'file_size', 'file_url', 'file_hash', 'category_id', 'tags', 'description', 'uploaded_by', 'is_public', 'version_number', 'status', 'metadata', 'extracted_text', 'ocr_status', 'ocr_completed_at', 'embedding_status', 'embedding_completed_at', 'created_at', 'updated_at'],
  driver_achievements: ['id', 'tenant_id', 'driver_id', 'achievement_type', 'achievement_name', 'achievement_description', 'icon', 'points', 'metric_value', 'threshold_met', 'earned_at'],
  driver_behavior_scores: ['id', 'driver_id', 'provider_id', 'score_date', 'score_type', 'overall_score', 'harsh_braking_score', 'harsh_acceleration_score', 'harsh_turning_score', 'speeding_score', 'distracted_driving_score', 'following_distance_score', 'harsh_braking_count', 'harsh_acceleration_count', 'harsh_turning_count', 'speeding_count', 'distracted_driving_count', 'miles_driven', 'hours_driven', 'created_at'],
  driver_coaching_sessions: ['id', 'driver_id', 'video_event_id', 'session_type', 'coaching_topic', 'coach_id', 'coach_notes', 'driver_acknowledgment', 'driver_signature', 'outcome', 'action_items', 'follow_up_required', 'follow_up_date', 'scheduled_at', 'conducted_at', 'acknowledged_at', 'metadata', 'created_at', 'updated_at'],
  driver_hos_logs: ['id', 'external_log_id', 'driver_id', 'provider_id', 'log_date', 'duty_status', 'start_time', 'end_time', 'duration_minutes', 'latitude', 'longitude', 'address', 'odometer_miles', 'has_violations', 'violations', 'raw_data', 'created_at'],
  driver_optimization_profiles: ['id', 'driver_id', 'shift_start_time', 'shift_end_time', 'max_hours_per_day', 'break_duration_minutes', 'has_cdl', 'can_operate_refrigerated', 'can_operate_heavy_duty', 'preferred_area_polygon', 'avoid_area_polygon', 'avg_stops_per_hour', 'completion_rate_percent', 'available_for_optimization', 'unavailable_dates', 'created_at', 'updated_at'],
  driver_recognitions: ['id', 'tenant_id', 'driver_id', 'recognized_by', 'recognition_type', 'description', 'points', 'created_at'],
  driver_reports: ['id', 'tenant_id', 'driver_id', 'mobile_id', 'report_type', 'data', 'submitted_at', 'created_at', 'updated_at'],
  driver_safety_events: ['id', 'external_event_id', 'vehicle_id', 'driver_id', 'provider_id', 'event_type', 'severity', 'latitude', 'longitude', 'address', 'speed_mph', 'g_force', 'duration_seconds', 'video_request_id', 'video_url', 'video_thumbnail_url', 'video_expires_at', 'timestamp', 'raw_data', 'created_at'],
  driver_scores: ['id', 'tenant_id', 'driver_id', 'safety_score', 'efficiency_score', 'compliance_score', 'overall_score', 'incidents_count', 'violations_count', 'harsh_braking_count', 'harsh_acceleration_count', 'harsh_cornering_count', 'speeding_events_count', 'avg_fuel_economy', 'idle_time_hours', 'optimal_route_adherence', 'hos_violations_count', 'inspection_completion_rate', 'documentation_compliance', 'trend', 'rank_position', 'percentile', 'period_start', 'period_end', 'created_at', 'updated_at'],
  driver_scores_history: ['id', 'tenant_id', 'driver_id', 'date', 'overall_score', 'smooth_driving_score', 'speed_compliance_score', 'fuel_efficiency_score', 'safety_score', 'trips_count', 'miles_driven', 'harsh_events_count', 'speeding_events_count', 'rank_in_fleet', 'percentile', 'created_at'],
  electronic_forms: ['id', 'tenant_id', 'form_name', 'form_type', 'form_version', 'form_schema', 'display_order', 'is_active', 'description', 'created_at', 'updated_at', 'created_by_user_id'],
  embedding_collections: ['id', 'tenant_id', 'collection_name', 'collection_type', 'description', 'embedding_provider', 'embedding_model', 'embedding_dimensions', 'distance_metric', 'total_embeddings', 'total_tokens', 'total_cost_usd', 'metadata', 'created_at', 'updated_at', 'is_active'],
  embedding_vectors: ['id', 'tenant_id', 'document_type', 'document_id', 'document_title', 'document_source', 'content_chunk', 'chunk_index', 'chunk_total', 'embedding', 'embedding_model', 'metadata', 'created_at', 'updated_at'],
  emulator_cost_records: ['id', 'session_id', 'vehicle_id', 'timestamp', 'category', 'amount', 'description', 'invoice_number', 'vendor_id', 'vendor_name', 'created_at'],
  emulator_driver_behavior: ['id', 'session_id', 'vehicle_id', 'timestamp', 'event_type', 'severity', 'latitude', 'longitude', 'speed', 'speed_limit', 'duration', 'score', 'created_at'],
  emulator_events: ['id', 'session_id', 'vehicle_id', 'event_type', 'timestamp', 'event_data', 'metadata', 'created_at'],
  emulator_fuel_transactions: ['id', 'session_id', 'vehicle_id', 'timestamp', 'station_id', 'station_name', 'latitude', 'longitude', 'gallons', 'price_per_gallon', 'total_cost', 'fuel_type', 'payment_method', 'odometer', 'receipt_number', 'created_at'],
  emulator_gps_telemetry: ['id', 'session_id', 'vehicle_id', 'timestamp', 'latitude', 'longitude', 'altitude', 'speed', 'heading', 'odometer', 'accuracy', 'satellite_count', 'created_at'],
  emulator_iot_data: ['id', 'session_id', 'vehicle_id', 'timestamp', 'sensor_data', 'created_at'],
  emulator_maintenance_events: ['id', 'session_id', 'vehicle_id', 'timestamp', 'event_type', 'category', 'description', 'parts', 'labor_hours', 'labor_cost', 'total_cost', 'vendor_id', 'vendor_name', 'warranty', 'next_due_odometer', 'created_at'],
  emulator_sessions: ['id', 'session_name', 'scenario_id', 'started_at', 'stopped_at', 'status', 'config', 'stats', 'created_at', 'updated_at'],
  emulator_vehicles: ['id', 'session_id', 'vehicle_id', 'status', 'started_at', 'stopped_at', 'metrics', 'created_at', 'updated_at'],
  equipment_attachments: ['id', 'equipment_id', 'attachment_type', 'attachment_name', 'manufacturer', 'model', 'serial_number', 'condition', 'purchase_date', 'purchase_cost', 'current_value', 'last_inspection_date', 'weight_lbs', 'is_currently_attached', 'attached_date', 'notes', 'created_at', 'updated_at'],
  equipment_checklist_responses: ['id', 'checklist_id', 'template_item_id', 'item_description', 'response', 'notes', 'photo_url', 'created_at'],
  equipment_checklist_template_items: ['id', 'template_id', 'item_description', 'item_category', 'sort_order', 'is_critical', 'requires_photo', 'pass_fail', 'created_at'],
  equipment_checklist_templates: ['id', 'tenant_id', 'template_name', 'equipment_type', 'checklist_type', 'description', 'is_active', 'created_at', 'updated_at'],
  equipment_cost_analysis: ['id', 'equipment_id', 'analysis_period_start', 'analysis_period_end', 'depreciation_cost', 'interest_cost', 'insurance_cost', 'storage_cost', 'fuel_cost', 'maintenance_cost', 'repair_cost', 'operator_cost', 'total_hours', 'productive_hours', 'utilization_rate', 'total_cost', 'cost_per_hour', 'revenue_generated', 'profit_loss', 'roi_percentage', 'notes', 'created_at'],
  equipment_hour_meter_readings: ['id', 'equipment_id', 'reading_date', 'hours', 'odometer_miles', 'fuel_level_percent', 'recorded_by', 'job_site', 'operator_id', 'billable_hours', 'notes', 'photo_url', 'created_at'],
  equipment_maintenance_checklists: ['id', 'equipment_id', 'checklist_template_id', 'completed_date', 'completed_by', 'engine_hours_at_completion', 'overall_status', 'inspector_name', 'notes', 'signature_url', 'created_at'],
  equipment_maintenance_schedules: ['id', 'equipment_id', 'maintenance_type', 'description', 'schedule_type', 'interval_hours', 'last_performed_hours', 'next_due_hours', 'interval_days', 'last_performed_date', 'next_due_date', 'priority', 'estimated_cost', 'estimated_downtime_hours', 'assigned_to', 'vendor_id', 'status', 'is_active', 'notes', 'created_at', 'updated_at'],
  equipment_operator_certifications: ['id', 'tenant_id', 'driver_id', 'equipment_type', 'certification_number', 'certification_date', 'expiry_date', 'certifying_authority', 'certification_level', 'status', 'training_hours', 'instructor_name', 'certificate_file_url', 'notes', 'created_at', 'updated_at'],
  equipment_types: ['id', 'type_name', 'category', 'description', 'requires_certification', 'default_maintenance_hours', 'created_at'],
  equipment_utilization_logs: ['id', 'equipment_id', 'log_date', 'shift', 'operator_id', 'job_site', 'project_code', 'start_time', 'end_time', 'productive_hours', 'idle_hours', 'maintenance_hours', 'down_hours', 'starting_hours', 'ending_hours', 'fuel_consumed_gallons', 'material_moved_units', 'billable_hours', 'non_billable_hours', 'hourly_rate', 'total_revenue', 'notes', 'created_by', 'created_at'],
  equipment_work_assignments: ['id', 'equipment_id', 'operator_id', 'job_site', 'project_code', 'assignment_start', 'assignment_end', 'estimated_hours', 'actual_hours', 'status', 'notes', 'created_by', 'created_at', 'updated_at'],
  esg_reports: ['id', 'report_period', 'report_year', 'report_month', 'report_quarter', 'total_ev_count', 'total_fleet_count', 'ev_adoption_percent', 'total_kwh_consumed', 'total_miles_driven', 'avg_efficiency_kwh_per_mile', 'total_charging_sessions', 'total_carbon_emitted_kg', 'total_carbon_saved_kg', 'carbon_reduction_percent', 'carbon_offset_required_kg', 'total_renewable_kwh', 'renewable_percent', 'total_energy_cost', 'ice_fuel_cost_equivalent', 'total_cost_savings', 'environmental_score', 'sustainability_rating', 'meets_esg_targets', 'esg_notes', 'generated_at', 'generated_by'],
  ev_specifications: ['id', 'vehicle_id', 'battery_capacity_kwh', 'usable_capacity_kwh', 'battery_chemistry', 'battery_warranty_years', 'battery_warranty_miles', 'max_ac_charge_rate_kw', 'max_dc_charge_rate_kw', 'charge_port_type', 'supports_v2g', 'supports_bidirectional_charging', 'epa_range_miles', 'real_world_range_miles', 'efficiency_mpge', 'efficiency_kwh_per_100mi', 'has_active_thermal_management', 'preconditioning_supported', 'current_battery_health_percent', 'degradation_rate_percent_per_year', 'estimated_cycles_remaining', 'created_at', 'updated_at'],
  evidence_locker: ['id', 'locker_name', 'locker_type', 'case_number', 'incident_date', 'incident_description', 'legal_hold', 'legal_hold_reason', 'legal_hold_started_at', 'legal_hold_released_at', 'created_by', 'assigned_to', 'department', 'status', 'closed_at', 'archived_at', 'retention_policy', 'retention_expires_at', 'auto_delete', 'metadata', 'created_at', 'updated_at'],
  extracted_entities: ['id', 'tenant_id', 'document_id', 'entity_type', 'entity_value', 'entity_normalized', 'context_text', 'position_start', 'position_end', 'page_number', 'confidence', 'metadata', 'created_at'],
  feedback_loops: ['id', 'tenant_id', 'prediction_id', 'model_id', 'feedback_type', 'original_prediction', 'corrected_value', 'actual_value', 'feedback_score', 'was_prediction_helpful', 'feedback_notes', 'entity_type', 'entity_id', 'should_retrain', 'incorporated_into_training', 'training_job_id', 'provided_by', 'created_at'],
  file_processing_queue: ['id', 'attachment_id', 'processing_type', 'status', 'priority', 'retry_count', 'max_retries', 'error_message', 'processing_started_at', 'processing_completed_at', 'created_at', 'updated_at'],
  file_storage_containers: ['id', 'container_name', 'container_type', 'description', 'access_level', 'file_count', 'total_size_bytes', 'last_cleanup_at', 'is_active', 'created_at', 'updated_at'],
  file_virus_scan_results: ['id', 'attachment_id', 'scanner_name', 'scan_result', 'threat_names', 'scan_details', 'scan_duration_ms', 'scanned_at'],
  fleet_documents: ['id', 'tenant_id', 'vehicle_id', 'driver_id', 'work_order_id', 'document_type', 'title', 'description', 'file_name', 'original_file_name', 'file_size', 'mime_type', 'storage_path', 'blob_url', 'ocr_text', 'metadata', 'uploaded_by', 'uploaded_at', 'expires_at', 'is_archived', 'created_at', 'updated_at'],
  fleet_optimization_recommendations: ['id', 'tenant_id', 'recommendation_type', 'title', 'description', 'priority', 'potential_savings', 'implementation_cost', 'payback_period_months', 'confidence_score', 'vehicle_ids', 'driver_ids', 'status', 'created_at', 'reviewed_at', 'reviewed_by', 'metadata'],
  form_submissions: ['id', 'tenant_id', 'electronic_form_id', 'form_data', 'submitted_by_user_id', 'submitted_at', 'vehicle_assignment_id', 'cost_benefit_analysis_id', 'status', 'created_at', 'updated_at'],
  fuel_contracts: ['id', 'tenant_id', 'supplier_name', 'supplier_contact', 'supplier_email', 'supplier_phone', 'contract_type', 'contract_number', 'fuel_types', 'discount_rate', 'fixed_price_per_gallon', 'minimum_volume', 'maximum_volume', 'start_date', 'end_date', 'renewal_date', 'auto_renew', 'contract_value', 'annual_savings_estimate', 'station_ids', 'geographic_coverage', 'status', 'contract_document_url', 'created_at', 'updated_at', 'terms_and_conditions', 'metadata'],
  fuel_price_alerts: ['id', 'tenant_id', 'alert_type', 'alert_name', 'fuel_type', 'threshold', 'comparison_operator', 'geographic_scope', 'scope_value', 'center_lat', 'center_lng', 'radius_miles', 'notification_channels', 'notification_recipients', 'notification_frequency', 'is_active', 'last_triggered_at', 'trigger_count', 'created_at', 'updated_at', 'created_by', 'metadata'],
  fuel_price_forecasts: ['id', 'tenant_id', 'fuel_type', 'geographic_scope', 'scope_value', 'forecast_date', 'predicted_price', 'confidence_interval_low', 'confidence_interval_high', 'confidence_score', 'model_version', 'generated_at', 'features', 'actual_price', 'prediction_error', 'created_at'],
  fuel_prices: ['id', 'fuel_station_id', 'fuel_type', 'price_per_gallon', 'source', 'confidence_score', 'timestamp', 'previous_price', 'price_change', 'created_at'],
  fuel_purchase_orders: ['id', 'tenant_id', 'vehicle_id', 'driver_id', 'station_id', 'fuel_type', 'gallons', 'price_per_gallon', 'total_cost', 'odometer', 'tank_capacity', 'previous_odometer', 'purchase_date', 'payment_method', 'card_last_four', 'transaction_id', 'invoice_number', 'purchase_location_lat', 'purchase_location_lng', 'market_price', 'discount_applied', 'savings_amount', 'status', 'created_at', 'updated_at', 'notes', 'metadata'],
  fuel_receipts: ['id', 'tenant_id', 'vehicle_id', 'driver_id', 'receipt_number', 'purchase_date', 'station_name', 'station_address', 'fuel_type', 'gallons', 'price_per_gallon', 'total_amount', 'odometer', 'miles_since_last_fill', 'calculated_mpg', 'payment_method', 'card_last_4', 'market_average', 'image_url', 'status', 'approved_by', 'approved_at', 'flagged_by', 'flagged_at', 'created_at'],
  fuel_savings_analytics: ['id', 'tenant_id', 'period_start', 'period_end', 'total_gallons_purchased', 'total_spent', 'average_price_paid', 'market_average_price', 'contract_discount_savings', 'optimal_timing_savings', 'optimal_location_savings', 'bulk_purchase_savings', 'total_savings', 'purchases_at_optimal_price_pct', 'purchases_with_contract_discount_pct', 'avg_deviation_from_route', 'created_at'],
  fuel_stations: ['id', 'tenant_id', 'station_name', 'brand', 'address', 'city', 'state', 'zip_code', 'country', 'lat', 'lng', 'fuel_types', 'accepts_fleet_cards', 'fleet_card_brands', 'has_24_hour_access', 'has_truck_access', 'phone', 'website', 'rating', 'reviews_count', 'is_active', 'last_verified_date', 'created_at', 'updated_at', 'metadata'],
  fuel_transactions: ['id', 'tenant_id', 'vehicle_id', 'driver_id', 'transaction_date', 'vendor_name', 'vendor_id', 'location_name', 'address', 'latitude', 'longitude', 'city', 'state', 'zip_code', 'fuel_type', 'quantity_gallons', 'price_per_gallon', 'total_cost', 'currency', 'odometer', 'engine_hours', 'fuel_level_before', 'fuel_level_after', 'miles_since_last_fill', 'mpg', 'cost_per_mile', 'payment_method', 'card_last_four', 'receipt_number', 'invoice_number', 'is_verified', 'verified_by', 'verified_at', 'is_anomaly', 'anomaly_reason', 'anomaly_score', 'notes', 'created_at', 'updated_at'],
  geofence_events: ['id', 'vehicle_id', 'geofence_id', 'driver_id', 'provider_id', 'event_type', 'latitude', 'longitude', 'timestamp', 'dwell_duration_minutes', 'created_at'],
  geofences: ['id', 'name', 'description', 'geofence_type', 'center_latitude', 'center_longitude', 'radius_meters', 'polygon_coordinates', 'alert_on_entry', 'alert_on_exit', 'alert_on_dwell', 'dwell_threshold_minutes', 'created_by', 'created_at', 'updated_at'],
  geographic_policy_rules: ['id', 'tenant_id', 'rule_name', 'rule_description', 'primary_region', 'primary_region_type', 'allowed_regions', 'central_latitude', 'central_longitude', 'radius_miles', 'require_secured_parking_outside_region', 'allow_on_call_exception', 'allow_facility_exception', 'rule_logic', 'is_active', 'effective_date', 'created_at', 'updated_at', 'created_by_user_id'],
  hazmat_inventory: ['id', 'vehicle_id', 'material_name', 'un_number', 'hazard_class', 'packing_group', 'quantity', 'unit_of_measure', 'storage_location', 'storage_temperature_min', 'storage_temperature_max', 'sds_available', 'sds_url', 'sds_last_reviewed', 'requires_placard', 'requires_special_permit', 'special_permit_number', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_procedures', 'received_date', 'expiration_date', 'disposal_date', 'disposal_method', 'created_at', 'updated_at'],
  heavy_equipment: ['id', 'tenant_id', 'asset_id', 'equipment_type', 'manufacturer', 'model', 'model_year', 'serial_number', 'vin', 'capacity_tons', 'max_reach_feet', 'lift_height_feet', 'bucket_capacity_yards', 'operating_weight_lbs', 'engine_hours', 'odometer_miles', 'last_hour_meter_reading', 'last_hour_meter_date', 'last_inspection_date', 'next_inspection_date', 'inspection_frequency_days', 'certification_expiry', 'certifying_authority', 'is_rental', 'rental_rate_daily', 'rental_company', 'rental_contract_number', 'rental_start_date', 'rental_end_date', 'acquisition_cost', 'residual_value', 'total_maintenance_cost', 'hourly_operating_cost', 'current_job_site', 'availability_status', 'fuel_type', 'fuel_capacity_gallons', 'notes', 'metadata', 'created_at', 'updated_at', 'created_by', 'updated_by'],
  hos_logs: ['id', 'tenant_id', 'driver_id', 'mobile_id', 'duty_status', 'start_time', 'end_time', 'location', 'notes', 'created_at', 'updated_at'],
  incident_actions: ['id', 'incident_id', 'action_type', 'action_description', 'assigned_to', 'due_date', 'completed_date', 'status', 'notes', 'created_by', 'created_at'],
  incident_photos: ['id', 'incident_id', 'photo_url', 'photo_type', 'caption', 'taken_at', 'uploaded_by', 'uploaded_at'],
  incident_timeline: ['id', 'incident_id', 'event_type', 'description', 'performed_by', 'timestamp'],
  incident_witnesses: ['id', 'incident_id', 'witness_name', 'contact_info', 'statement', 'created_at'],
  incidents: ['id', 'tenant_id', 'incident_title', 'incident_type', 'severity', 'status', 'incident_date', 'incident_time', 'location', 'description', 'vehicle_id', 'driver_id', 'reported_by', 'assigned_investigator', 'injuries_reported', 'injury_details', 'property_damage', 'damage_estimate', 'weather_conditions', 'road_conditions', 'police_report_number', 'insurance_claim_number', 'resolution_notes', 'root_cause', 'preventive_measures', 'closed_by', 'closed_date', 'metadata', 'created_at', 'updated_at'],
  index_usage_stats: ['id', 'index_name', 'table_name', 'scans', 'tuples_read', 'tuples_fetched', 'last_updated'],
  indexing_jobs: ['id', 'tenant_id', 'job_type', 'status', 'progress', 'total_documents', 'processed_documents', 'error_message', 'metadata', 'started_at', 'completed_at', 'created_at'],
  job_queue: ['id', 'type', 'status', 'payload', 'progress', 'error_message', 'user_id', 'tenant_id', 'created_at', 'updated_at', 'completed_at'],
  job_tracking: ['id', 'job_id', 'queue_name', 'job_type', 'status', 'priority', 'payload', 'result', 'error', 'stack_trace', 'retry_count', 'max_retries', 'started_at', 'completed_at', 'failed_at', 'created_at', 'updated_at'],
  keyless_entry_logs: ['id', 'tenant_id', 'vehicle_id', 'user_id', 'device_id', 'command', 'location', 'success', 'error_message', 'executed_at'],
  maintenance_notifications: ['id', 'tenant_id', 'schedule_id', 'work_order_id', 'user_id', 'notification_type', 'message', 'read', 'sent_via', 'sent_at', 'created_at'],
  maintenance_schedule_history: ['id', 'tenant_id', 'schedule_id', 'work_order_id', 'execution_type', 'next_due_before', 'next_due_after', 'mileage_at_creation', 'engine_hours_at_creation', 'error_message', 'status', 'created_at'],
  maintenance_schedules: ['id', 'asset_id', 'scheduled_date', 'status', 'description', 'created_at'],
  manufacturer_maintenance_schedules: ['id', 'make', 'model', 'year_from', 'year_to', 'engine_type', 'service_type', 'service_category', 'interval_miles', 'interval_months', 'interval_engine_hours', 'description', 'estimated_duration_minutes', 'estimated_cost_min', 'estimated_cost_max', 'parts_required', 'labor_hours', 'priority', 'created_at', 'updated_at'],
  mcp_servers: ['id', 'tenant_id', 'server_name', 'server_type', 'connection_url', 'api_key_encrypted', 'configuration', 'capabilities', 'is_active', 'last_connected_at', 'connection_status', 'health_check_url', 'last_health_check', 'health_status', 'error_message', 'created_by', 'created_at', 'updated_at'],
  mcp_tool_executions: ['id', 'tenant_id', 'server_id', 'tool_name', 'input_parameters', 'output_result', 'execution_time_ms', 'status', 'error_message', 'user_id', 'created_at'],
  ml_model_performance: ['id', 'tenant_id', 'model_name', 'model_version', 'model_type', 'accuracy', 'precision_score', 'recall', 'f1_score', 'mean_absolute_error', 'root_mean_squared_error', 'training_samples', 'training_duration_seconds', 'training_date', 'is_active', 'deployment_date', 'created_at', 'metadata'],
  ml_models: ['id', 'tenant_id', 'model_name', 'model_type', 'version', 'algorithm', 'framework', 'hyperparameters', 'feature_importance', 'training_data_size', 'training_duration_seconds', 'model_artifacts_url', 'model_binary', 'status', 'is_active', 'deployed_at', 'created_by', 'created_at', 'updated_at'],
  ml_predictions: ['id', 'tenant_id', 'prediction_type', 'entity_type', 'entity_id', 'predicted_value', 'confidence_score', 'prediction_date', 'model_name', 'model_version', 'training_date', 'features', 'actual_value', 'prediction_error', 'created_at', 'metadata'],
  mobile_analytics: ['id', 'tenant_id', 'user_id', 'device_id', 'event_type', 'event_data', 'created_at'],
  mobile_devices: ['id', 'user_id', 'tenant_id', 'device_token', 'platform', 'device_name', 'device_model', 'os_version', 'app_version', 'last_active', 'is_active', 'created_at', 'updated_at'],
  mobile_ocr_captures: ['id', 'tenant_id', 'user_id', 'capture_type', 'document_id', 'image_path', 'ocr_data', 'confidence_scores', 'processing_time', 'ocr_provider', 'created_at', 'updated_at'],
  mobile_photos: ['id', 'tenant_id', 'user_id', 'mobile_id', 'photo_url', 'metadata', 'taken_at', 'created_at'],
  model_ab_tests: ['id', 'tenant_id', 'test_name', 'model_a_id', 'model_b_id', 'traffic_split_percent', 'status', 'start_date', 'end_date', 'model_a_predictions', 'model_b_predictions', 'model_a_metrics', 'model_b_metrics', 'winner', 'notes', 'created_by', 'created_at', 'updated_at'],
  model_performance: ['id', 'model_id', 'tenant_id', 'evaluation_date', 'dataset_type', 'metrics', 'accuracy', 'precision_score', 'recall', 'f1_score', 'mae', 'rmse', 'r2_score', 'confusion_matrix', 'feature_importance', 'sample_predictions', 'notes', 'created_at'],
  notes: ['id', 'tenant_id', 'entity_type', 'entity_id', 'user_id', 'note_text', 'note_type', 'is_private', 'created_at', 'updated_at'],
  notification_preferences: ['id', 'user_id', 'email_notifications', 'sms_notifications', 'push_notifications', 'in_app_notifications', 'notification_types', 'quiet_hours_start', 'quiet_hours_end', 'timezone', 'created_at', 'updated_at'],
  notification_templates: ['id', 'name', 'type', 'email_subject', 'email_body', 'sms_text', 'push_title', 'push_body', 'in_app_title', 'in_app_message', 'variables', 'created_at'],
  notifications: ['id', 'tenant_id', 'user_id', 'type', 'title', 'message', 'priority', 'data', 'action_url', 'read_at', 'created_at'],
  ocpp_message_log: ['id', 'station_id', 'message_id', 'message_type', 'action', 'direction', 'payload', 'response_payload', 'error_code', 'error_description', 'timestamp'],
  ocr_batch_jobs: ['id', 'tenant_id', 'user_id', 'total_documents', 'completed_documents', 'failed_documents', 'status', 'options', 'created_at', 'updated_at', 'REFERENCES', 'ON', 'REFERENCES', 'ON'],
  ocr_corrections: ['id', 'document_id', 'ocr_text_original', 'ocr_confidence_original', 'ocr_text_corrected', 'correction_type', 'corrected_by', 'corrected_at', 'sent_to_training', 'training_batch_id'],
  ocr_jobs: ['id', 'document_id', 'tenant_id', 'user_id', 'batch_id', 'queue_job_id', 'file_path', 'file_name', 'file_size', 'mime_type', 'options', 'status', 'priority', 'progress', 'result', 'error', 'started_at', 'completed_at', 'failed_at', 'processing_time', 'retry_count', 'max_retries', 'created_at', 'updated_at', 'REFERENCES', 'ON', 'REFERENCES', 'ON'],
  ocr_language_detections: ['id', 'ocr_result_id', 'language_code', 'confidence', 'page_number', 'detected_at', 'REFERENCES', 'ON'],
  ocr_provider_stats: ['id', 'tenant_id', 'provider', 'date', 'total_jobs', 'successful_jobs', 'failed_jobs', 'total_pages', 'avg_confidence', 'avg_processing_time', 'total_cost', 'created_at', 'updated_at', 'REFERENCES', 'ON'],
  ocr_results: ['id', 'document_id', 'provider', 'full_text', 'pages', 'tables', 'forms', 'languages', 'primary_language', 'average_confidence', 'processing_time', 'metadata', 'created_at', 'updated_at', 'REFERENCES', 'ON'],
  odometer_readings: ['id', 'tenant_id', 'vehicle_id', 'odometer_reading', 'reading_date', 'reading_type', 'unit', 'photo_path', 'trip_id', 'reservation_id', 'confidence_score', 'notes', 'created_by', 'created_at', 'updated_at'],
  on_call_callback_trips: ['id', 'tenant_id', 'on_call_period_id', 'driver_id', 'trip_date', 'trip_start_time', 'trip_end_time', 'miles_driven', 'includes_commute_trip', 'commute_miles', 'used_assigned_vehicle', 'used_private_vehicle', 'vehicle_id', 'reimbursement_requested', 'reimbursement_amount', 'reimbursement_status', 'purpose', 'notes', 'created_at', 'updated_at'],
  on_call_periods: ['id', 'tenant_id', 'driver_id', 'department_id', 'start_datetime', 'end_datetime', 'schedule_type', 'schedule_notes', 'on_call_vehicle_assignment_id', 'geographic_region', 'commuting_constraints', 'callback_count', 'callback_notes', 'is_active', 'acknowledged_by_driver', 'acknowledged_at', 'created_at', 'updated_at', 'created_by_user_id', 'end_datetime'],
  optimized_routes: ['id', 'job_id', 'tenant_id', 'route_number', 'route_name', 'vehicle_id', 'driver_id', 'total_stops', 'total_distance_miles', 'total_duration_minutes', 'driving_duration_minutes', 'service_duration_minutes', 'total_weight_lbs', 'total_volume_cuft', 'total_packages', 'capacity_utilization_percent', 'fuel_cost', 'labor_cost', 'total_cost', 'planned_start_time', 'planned_end_time', 'actual_start_time', 'actual_end_time', 'route_geometry', 'route_polyline', 'waypoints', 'traffic_factor', 'alternative_routes_count', 'status', 'notes', 'created_at', 'updated_at'],
  osha_form_templates: ['id', 'form_number', 'form_name', 'form_category', 'description', 'version', 'effective_date', 'expiration_date', 'is_active', 'requires_signature', 'retention_years', 'json_schema', 'created_at', 'updated_at'],
  parts_price_quotes: ['id', 'tenant_id', 'quote_number', 'requested_by', 'requested_at', 'vehicle_id', 'work_order_id', 'parts_requested', 'status', 'expires_at', 'quotes_received', 'best_quote_vendor_id', 'best_quote_total', 'notes', 'created_at', 'updated_at'],
  parts_pricing_history: ['id', 'catalog_item_id', 'vendor_id', 'price_date', 'list_price', 'cost_price', 'in_stock', 'stock_quantity', 'price_change_percent', 'price_change_reason', 'created_at'],
  password_reset_tokens: ['id', 'user_id', 'tenant_id', 'token_hash', 'expires_at', 'used_at', 'ip_address', 'user_agent', 'created_at'],
  payment_schedules: ['id', 'tenant_id', 'driver_id', 'payment_method', 'schedule_type', 'amount', 'start_date', 'end_date', 'next_payment_date', 'last_payment_date', 'is_active', 'suspended_at', 'suspended_reason', 'charge_ids', 'notes', 'metadata', 'created_at', 'updated_at', 'created_by_user_id', 'end_date'],
  permission_check_logs: ['id', 'user_id', 'tenant_id', 'permission_name', 'resource_type', 'resource_id', 'granted', 'reason', 'ip_address', 'user_agent', 'created_at'],
  permissions: ['id', 'name', 'resource', 'verb', 'scope', 'description', 'created_at'],
  personal_use_charges: ['id', 'tenant_id', 'driver_id', 'trip_usage_id', 'charge_period', 'charge_period_start', 'charge_period_end', 'miles_charged', 'rate_per_mile', 'total_charge', 'charge_status', 'payment_method', 'paid_at', 'waived_by_user_id', 'waived_at', 'waived_reason', 'invoice_number', 'invoice_date', 'due_date', 'notes', 'metadata', 'created_at', 'updated_at', 'created_by_user_id', 'total_charge', 'OR', 'OR', 'charge_period_end'],
  personal_use_policies: ['id', 'tenant_id', 'allow_personal_use', 'require_approval', 'max_personal_miles_per_month', 'max_personal_miles_per_year', 'charge_personal_use', 'personal_use_rate_per_mile', 'reporting_required', 'approval_workflow', 'notification_settings', 'auto_approve_under_miles', 'auto_approve_days_advance', 'effective_date', 'expiration_date', 'created_by_user_id', 'created_at', 'updated_at', 'OR', 'expiration_date', 'max_personal_miles_per_year', 'OR', 'OR'],
  photo_processing_queue: ['id', 'tenant_id', 'user_id', 'photo_id', 'blob_url', 'status', 'priority', 'retry_count', 'max_retries', 'error_message', 'processing_started_at', 'processing_completed_at', 'created_at', 'updated_at'],
  policy_acknowledgments: ['id', 'policy_id', 'employee_id', 'acknowledged_at', 'acknowledgment_method', 'signature_data', 'ip_address', 'device_info', 'test_taken', 'test_score', 'test_passed', 'training_completed', 'training_completed_at', 'training_duration_minutes', 'is_current', 'superseded_by_acknowledgment_id'],
  policy_compliance_audits: ['id', 'policy_id', 'audit_date', 'auditor_name', 'audit_type', 'location', 'department', 'employees_audited', 'vehicles_audited', 'compliance_score', 'compliant_items', 'non_compliant_items', 'findings', 'corrective_actions_required', 'corrective_actions', 'corrective_actions_completed', 'corrective_actions_due_date', 'follow_up_required', 'follow_up_date', 'follow_up_completed', 'audit_report_url', 'photos_urls', 'created_at', 'created_by'],
  policy_templates: ['id', 'policy_code', 'policy_name', 'policy_category', 'sub_category', 'policy_objective', 'policy_scope', 'policy_content', 'procedures', 'regulatory_references', 'industry_standards', 'responsible_roles', 'approval_required_from', 'version', 'effective_date', 'review_cycle_months', 'next_review_date', 'expiration_date', 'supersedes_policy_id', 'status', 'is_mandatory', 'applies_to_roles', 'requires_training', 'requires_test', 'test_questions', 'related_forms', 'attachments', 'times_acknowledged', 'last_acknowledged_at', 'created_at', 'created_by', 'updated_at', 'updated_by', 'approved_at', 'approved_by'],
  policy_violations: ['id', 'policy_id', 'employee_id', 'violation_date', 'violation_time', 'location', 'violation_description', 'severity', 'vehicle_id', 'related_incident_id', 'witnesses', 'witness_statements', 'investigation_notes', 'root_cause', 'disciplinary_action', 'action_description', 'action_date', 'action_taken_by', 'is_repeat_offense', 'previous_violations', 'offense_count', 'training_required', 'training_completed', 'training_completion_date', 'employee_statement', 'employee_acknowledged', 'employee_acknowledged_date', 'employee_signature', 'appeal_filed', 'appeal_date', 'appeal_reason', 'appeal_decision', 'appeal_decision_date', 'case_status', 'created_at', 'created_by', 'updated_at'],
  ppe_assignments: ['id', 'employee_id', 'equipment_type', 'equipment_description', 'size', 'manufacturer', 'model_number', 'issue_date', 'expected_replacement_date', 'actual_replacement_date', 'condition_status', 'last_inspection_date', 'next_inspection_date', 'osha_required', 'certification_required', 'certification_number', 'certification_expiry_date', 'is_active', 'retirement_date', 'retirement_reason', 'created_at', 'updated_at'],
  prebuilt_safety_policies: ['id', 'template_name', 'template_content', 'customization_fields', 'is_industry_standard'],
  predictions: ['id', 'tenant_id', 'model_id', 'prediction_type', 'entity_type', 'entity_id', 'input_features', 'prediction_value', 'confidence_score', 'probability_distribution', 'prediction_date', 'actual_outcome', 'outcome_date', 'is_correct', 'error_magnitude', 'metadata', 'created_at'],
  procedure_completions: ['id', 'tenant_id', 'procedure_id', 'vehicle_id', 'driver_id', 'completed_by', 'completion_date', 'duration_minutes', 'notes', 'verification_signature', 'attachments', 'status', 'created_at'],
  procedures: ['id', 'tenant_id', 'procedure_code', 'procedure_name', 'procedure_type', 'description', 'steps', 'related_policy_id', 'frequency', 'estimated_duration_minutes', 'requires_certification', 'document_url', 'status', 'version', 'created_at', 'updated_at'],
  push_notification_preferences: ['id', 'user_id', 'tenant_id', 'category', 'enabled', 'quiet_hours_start', 'quiet_hours_end', 'created_at', 'updated_at'],
  push_notification_recipients: ['id', 'push_notification_id', 'user_id', 'device_id', 'device_token', 'delivery_status', 'error_message', 'delivered_at', 'opened_at', 'clicked_at', 'action_taken', 'created_at', 'updated_at'],
  push_notification_templates: ['id', 'tenant_id', 'template_name', 'category', 'title_template', 'message_template', 'data_payload_template', 'action_buttons', 'priority', 'sound', 'is_active', 'created_by', 'created_at', 'updated_at'],
  push_notifications: ['id', 'tenant_id', 'notification_type', 'category', 'priority', 'title', 'message', 'data_payload', 'action_buttons', 'image_url', 'sound', 'badge_count', 'scheduled_for', 'sent_at', 'delivery_status', 'total_recipients', 'delivered_count', 'opened_count', 'clicked_count', 'failed_count', 'created_by', 'created_at', 'updated_at'],
  quality_gates: ['id', 'deployment_id', 'gate_type', 'status', 'result_data', 'error_message', 'executed_at', 'execution_time_seconds', 'executed_by_user_id', 'metadata', 'created_at'],
  queue_alerts: ['id', 'level', 'queue_name', 'message', 'metric', 'current_value', 'threshold', 'acknowledged', 'acknowledged_by', 'acknowledged_at', 'created_at'],
  queue_statistics: ['id', 'queue_name', 'timestamp', 'jobs_pending', 'jobs_active', 'jobs_completed', 'jobs_failed', 'avg_processing_time_ms', 'jobs_per_minute', 'created_at'],
  rag_queries: ['id', 'tenant_id', 'user_id', 'query_text', 'query_embedding', 'context_type', 'retrieved_chunks', 'generated_response', 'confidence_score', 'sources_cited', 'was_helpful', 'user_feedback', 'processing_time_ms', 'created_at'],
  rate_limit_tracking: ['id', 'service_name', 'endpoint', 'window_start', 'window_end', 'request_count', 'limit_value', 'created_at'],
  reauthorization_decisions: ['id', 'tenant_id', 'reauthorization_cycle_id', 'vehicle_assignment_id', 'decision', 'decision_date', 'decided_by_user_id', 'modification_notes', 'new_vehicle_id', 'new_driver_id', 'parameter_changes', 'termination_reason', 'termination_effective_date', 'director_reviewed', 'director_review_date', 'director_notes', 'created_at', 'updated_at'],
  receipt_line_items: ['id', 'document_id', 'line_number', 'item_description', 'quantity', 'unit_price', 'line_total', 'product_category', 'product_code', 'is_taxable', 'tax_rate', 'tax_amount', 'is_approved', 'approved_by', 'approved_at', 'gl_account_code', 'cost_center', 'created_at'],
  recurring_appointments: ['id', 'tenant_id', 'appointment_type_id', 'vehicle_id', 'recurrence_pattern', 'recurrence_interval', 'recurrence_days', 'recurrence_day_of_month', 'start_date', 'end_date', 'time_of_day', 'duration', 'assigned_technician_id', 'service_bay_id', 'last_generated_date', 'next_occurrence_date', 'is_active', 'notes', 'created_at', 'updated_at'],
  refresh_tokens: ['id', 'user_id', 'token_hash', 'expires_at', 'created_at', 'revoked_at'],
  reimbursement_requests: ['id', 'tenant_id', 'driver_id', 'charge_id', 'request_amount', 'description', 'expense_date', 'category', 'receipt_file_path', 'receipt_uploaded_at', 'receipt_metadata', 'status', 'submitted_at', 'reviewed_at', 'reviewed_by_user_id', 'reviewer_notes', 'approved_amount', 'payment_date', 'payment_method', 'payment_reference', 'created_at', 'updated_at', 'created_by_user_id', 'OR', 'OR', 'OR'],
  report_executions: ['id', 'report_id', 'schedule_id', 'executed_by', 'execution_time', 'execution_duration_ms', 'row_count', 'file_url', 'file_size_bytes', 'format', 'status', 'error_message', 'metadata'],
  report_favorites: ['id', 'user_id', 'report_id', 'created_at'],
  report_schedules: ['id', 'report_id', 'schedule_type', 'schedule_config', 'recipients', 'format', 'is_active', 'last_run', 'next_run', 'created_by', 'created_at', 'updated_at'],
  report_shares: ['id', 'report_id', 'shared_with_user_id', 'permission', 'shared_by', 'created_at'],
  report_templates: ['id', 'tenant_id', 'template_name', 'description', 'category', 'preview_image', 'config', 'is_system_template', 'usage_count', 'created_by', 'created_at', 'updated_at'],
  role_permissions: ['id', 'role_id', 'permission_id', 'conditions', 'created_at'],
  roles: ['id', 'name', 'display_name', 'description', 'is_system_role', 'mfa_required', 'just_in_time_elevation_allowed', 'max_dataset_size', 'created_at', 'updated_at'],
  route_optimization_cache: ['id', 'cache_key', 'stops_count', 'vehicles_count', 'optimization_params', 'solution', 'solver_time_seconds', 'cache_hits', 'created_at', 'last_accessed_at', 'expires_at'],
  route_optimization_jobs: ['id', 'tenant_id', 'job_name', 'job_type', 'optimization_goal', 'max_vehicles', 'max_stops_per_route', 'max_route_duration_minutes', 'consider_traffic', 'consider_time_windows', 'consider_vehicle_capacity', 'consider_driver_hours', 'consider_ev_range', 'scheduled_date', 'scheduled_time', 'time_zone', 'status', 'progress_percent', 'total_routes', 'total_distance_miles', 'total_duration_minutes', 'estimated_fuel_cost', 'estimated_time_saved_minutes', 'estimated_cost_savings', 'solver_runtime_seconds', 'solver_status', 'optimization_score', 'created_by', 'created_at', 'started_at', 'completed_at', 'error_message'],
  route_performance_metrics: ['id', 'route_id', 'planned_distance_miles', 'actual_distance_miles', 'distance_variance_percent', 'planned_duration_minutes', 'actual_duration_minutes', 'time_variance_percent', 'planned_cost', 'actual_cost', 'cost_variance_percent', 'stops_completed', 'stops_failed', 'completion_rate_percent', 'on_time_arrivals', 'late_arrivals', 'on_time_rate_percent', 'time_saved_minutes', 'distance_saved_miles', 'cost_savings', 'driver_rating', 'driver_feedback', 'created_at'],
  route_stops: ['id', 'job_id', 'tenant_id', 'stop_name', 'stop_type', 'priority', 'address', 'latitude', 'longitude', 'earliest_arrival', 'latest_arrival', 'service_duration_minutes', 'weight_lbs', 'volume_cuft', 'package_count', 'requires_refrigeration', 'requires_liftgate', 'requires_signature', 'access_notes', 'customer_name', 'customer_phone', 'customer_email', 'assigned_route_id', 'assigned_sequence', 'estimated_arrival_time', 'actual_arrival_time', 'actual_departure_time', 'status', 'completion_notes', 'metadata', 'created_at', 'updated_at'],
  route_waypoints: ['id', 'route_id', 'sequence', 'waypoint_type', 'latitude', 'longitude', 'stop_id', 'distance_from_previous_miles', 'duration_from_previous_minutes', 'instruction', 'estimated_arrival', 'actual_arrival', 'created_at'],
  safety_data_sheets: ['id', 'product_name', 'manufacturer', 'product_code', 'cas_number', 'chemical_formula', 'ghs_pictograms', 'signal_word', 'hazard_statements', 'precautionary_statements', 'appearance', 'odor', 'ph', 'flash_point', 'autoignition_temperature', 'storage_requirements', 'handling_precautions', 'incompatible_materials', 'first_aid_measures', 'firefighting_measures', 'accidental_release_measures', 'sds_document_url', 'revision_date', 'version', 'is_current', 'next_review_date', 'created_at', 'updated_at'],
  safety_policies: ['id', 'tenant_id', 'policy_number', 'policy_name', 'policy_category', 'description', 'effective_date', 'review_date', 'status', 'document_url', 'created_by', 'approved_by', 'approval_date', 'version', 'created_at', 'updated_at'],
  safety_training_records: ['id', 'employee_id', 'training_type', 'training_topic', 'training_date', 'training_duration_hours', 'trainer_name', 'training_location', 'training_method', 'is_osha_required', 'osha_standard', 'certification_issued', 'certification_number', 'certification_expiry_date', 'test_score', 'passed', 'certificate_url', 'training_materials_url', 'renewal_required', 'renewal_frequency_months', 'next_renewal_date', 'created_at', 'updated_at'],
  saved_filters: ['id', 'user_id', 'entity_type', 'filter_name', 'filter_config', 'is_default', 'created_at'],
  saved_searches: ['id', 'tenant_id', 'user_id', 'name', 'query', 'filters', 'notification_enabled', 'created_at', 'last_run_at'],
  scheduled_jobs: ['id', 'job_name', 'queue_name', 'cron_expression', 'payload', 'next_run_at', 'last_run_at', 'enabled', 'created_at', 'updated_at'],
  scheduled_notifications: ['id', 'tenant_id', 'user_id', 'type', 'title', 'message', 'channels', 'priority', 'data', 'action_url', 'scheduled_for', 'sent_at', 'created_at'],
  scheduling_conflicts: ['id', 'tenant_id', 'conflict_type', 'severity', 'entity_type', 'entity_id', 'appointment_1_id', 'appointment_1_type', 'appointment_2_id', 'appointment_2_type', 'conflict_start', 'conflict_end', 'description', 'resolution_status', 'resolved_by', 'resolved_at', 'resolution_notes', 'created_at'],
  scheduling_notification_preferences: ['id', 'user_id', 'email_enabled', 'sms_enabled', 'teams_enabled', 'reminder_times', 'quiet_hours_start', 'quiet_hours_end', 'created_at', 'updated_at'],
  scheduling_reminders_sent: ['id', 'entity_id', 'entity_type', 'hours_before', 'sent_at'],
  search_click_tracking: ['id', 'user_id', 'query', 'document_id', 'result_position', 'relevance_score', 'created_at'],
  search_history: ['id', 'user_id', 'query', 'result_count', 'clicked_documents', 'created_at'],
  search_query_log: ['id', 'tenant_id', 'user_id', 'query_text', 'query_terms', 'filters', 'result_count', 'search_time_ms', 'created_at'],
  secured_parking_locations: ['id', 'tenant_id', 'name', 'facility_id', 'address', 'city', 'state', 'zip_code', 'county', 'region', 'latitude', 'longitude', 'total_spaces', 'available_spaces', 'requires_access_card', 'access_instructions', 'has_security_camera', 'has_security_guard', 'has_fence', 'has_lighting', 'is_active', 'contact_name', 'contact_phone', 'contact_email', 'notes', 'metadata', 'created_at', 'updated_at', 'created_by_user_id'],
  security_incidents: ['id', 'incident_type', 'severity', 'user_id', 'tenant_id', 'ip_address', 'user_agent', 'request_path', 'request_method', 'request_body', 'details', 'resolved', 'resolved_at', 'resolved_by', 'resolution_notes', 'created_at'],
  service_bay_schedules: ['id', 'tenant_id', 'service_bay_id', 'work_order_id', 'vehicle_id', 'appointment_type_id', 'scheduled_start', 'scheduled_end', 'actual_start', 'actual_end', 'status', 'assigned_technician_id', 'priority', 'notes', 'calendar_event_id', 'microsoft_event_id', 'google_event_id', 'created_at', 'updated_at'],
  service_bays: ['id', 'tenant_id', 'facility_id', 'bay_number', 'bay_name', 'bay_type', 'capabilities', 'equipment', 'max_vehicle_weight', 'max_vehicle_height', 'is_active', 'notes', 'created_at', 'updated_at'],
  sms_logs: ['id', 'tenant_id', 'to_number', 'from_number', 'body', 'message_sid', 'status', 'error_code', 'error_message', 'sent_at', 'delivered_at', 'created_by', 'created_at', 'updated_at'],
  sms_templates: ['id', 'tenant_id', 'name', 'body', 'category', 'variables', 'is_active', 'created_at', 'updated_at'],
  sod_rules: ['id', 'role_id', 'conflicting_role_id', 'reason', 'created_at'],
  sync_conflicts: ['id', 'tenant_id', 'user_id', 'device_id', 'conflict_type', 'mobile_id', 'server_id', 'mobile_data', 'server_data', 'resolution', 'resolved_at', 'created_at'],
  sync_errors: ['id', 'resource_type', 'resource_id', 'error_type', 'error_message', 'error_details', 'retry_count', 'resolved', 'created_at'],
  sync_history: ['id', 'resource_type', 'user_id', 'team_id', 'status', 'delta_token', 'items_synced', 'error', 'started_at', 'completed_at', 'created_at'],
  sync_jobs: ['id', 'job_type', 'status', 'started_at', 'completed_at', 'duration_ms', 'resources_processed', 'items_synced', 'errors_count', 'metadata', 'error_message'],
  sync_state: ['id', 'resource_type', 'resource_id', 'last_sync_at', 'delta_token', 'sync_status', 'error_message', 'items_synced', 'created_at', 'updated_at'],
  task_attachments: ['id', 'task_id', 'file_name', 'file_url', 'file_type', 'file_size', 'uploaded_by', 'uploaded_at'],
  task_checklist_items: ['id', 'task_id', 'item_text', 'is_completed', 'completed_by', 'completed_at', 'sort_order', 'created_at'],
  task_comments: ['id', 'task_id', 'comment_text', 'created_by', 'created_at', 'updated_at'],
  task_file_attachments: ['id', 'task_id', 'file_name', 'file_url', 'file_type', 'file_size', 'uploaded_by', 'uploaded_at'],
  task_tag_mappings: ['task_id', 'tag_id'],
  task_tags: ['id', 'tenant_id', 'tag_name', 'tag_color', 'usage_count', 'created_at'],
  task_templates: ['id', 'tenant_id', 'template_name', 'description', 'task_type', 'priority', 'estimated_hours', 'checklist_items', 'tags', 'is_public', 'created_by', 'usage_count', 'created_at', 'updated_at'],
  task_time_entries: ['id', 'task_id', 'user_id', 'start_time', 'end_time', 'duration_minutes', 'notes', 'created_at'],
  tasks: ['id', 'tenant_id', 'task_title', 'description', 'task_type', 'priority', 'status', 'assigned_to', 'created_by', 'due_date', 'start_date', 'completed_date', 'estimated_hours', 'actual_hours', 'completion_percentage', 'vehicle_id', 'work_order_id', 'parent_task_id', 'tags', 'metadata', 'created_at', 'updated_at'],
  technician_availability: ['id', 'tenant_id', 'technician_id', 'availability_type', 'start_time', 'end_time', 'recurring_pattern', 'recurring_days', 'recurrence_end_date', 'notes', 'created_at', 'updated_at'],
  telematics_providers: ['id', 'name', 'display_name', 'api_endpoint', 'supports_webhooks', 'supports_video', 'supports_temperature', 'supports_hos', 'created_at'],
  telematics_webhook_events: ['id', 'provider_id', 'event_type', 'external_id', 'payload', 'processed', 'processed_at', 'error', 'created_at'],
  telemetry_equipment_events: ['id', 'vehicle_id', 'event_time', 'engine_hours', 'pto_hours', 'aux_hours', 'cycle_count', 'hydraulic_pressure_bar', 'boom_angle_degrees', 'load_weight_kg', 'attachment_position', 'fuel_level_percent', 'coolant_temp_celsius', 'oil_pressure_bar', 'fault_codes', 'warning_codes', 'operator_id', 'job_site', 'project_code', 'created_at'],
  tenant_index_stats: ['tenant_id', 'total_indexed', 'last_indexed_at', 'last_optimization', 'optimization_count', 'created_at', 'updated_at'],
  tenant_teams_config: ['id', 'tenant_id', 'team_id', 'channel_id', 'channel_name', 'is_default', 'notification_types', 'created_at', 'updated_at'],
  tracking_devices: ['id', 'tenant_id', 'device_type', 'manufacturer', 'model_number', 'serial_number', 'hardware_version', 'firmware_version', 'purchase_date', 'warranty_expiry_date', 'unit_cost', 'status', 'notes', 'created_at', 'updated_at'],
  traffic_cameras: ['id', 'source_id', 'external_id', 'name', 'address', 'cross_street1', 'cross_street2', 'cross_streets', 'camera_url', 'stream_url', 'image_url', 'latitude', 'longitude', 'enabled', 'operational', 'last_checked_at', 'metadata', 'created_at', 'updated_at', 'synced_at'],
  training_completions: ['id', 'tenant_id', 'program_id', 'user_id', 'driver_id', 'completion_date', 'expiration_date', 'score', 'certification_number', 'instructor_name', 'training_location', 'status', 'certificate_url', 'notes', 'created_at', 'updated_at'],
  training_jobs: ['id', 'tenant_id', 'model_id', 'job_name', 'model_type', 'status', 'training_config', 'data_source', 'data_filters', 'train_start_date', 'train_end_date', 'test_split_ratio', 'validation_split_ratio', 'total_samples', 'training_samples', 'validation_samples', 'test_samples', 'started_at', 'completed_at', 'duration_seconds', 'error_message', 'logs', 'created_by', 'created_at', 'updated_at'],
  training_programs: ['id', 'tenant_id', 'program_code', 'program_name', 'program_type', 'description', 'duration_hours', 'certification_valid_years', 'is_required', 'required_for_roles', 'training_provider', 'cost_per_person', 'online_url', 'is_active', 'created_at', 'updated_at'],
  trip_events: ['id', 'trip_id', 'event_type', 'severity', 'timestamp', 'latitude', 'longitude', 'address', 'speed_mph', 'g_force', 'speed_limit_mph', 'description', 'metadata', 'created_at'],
  trip_gps_breadcrumbs: ['id', 'trip_id', 'timestamp', 'latitude', 'longitude', 'accuracy_meters', 'altitude_meters', 'speed_mph', 'heading_degrees', 'engine_rpm', 'fuel_level_percent', 'coolant_temp_f', 'throttle_position_percent', 'metadata', 'created_at'],
  trip_segments: ['id', 'trip_id', 'segment_number', 'start_time', 'end_time', 'duration_seconds', 'start_location', 'end_location', 'distance_miles', 'segment_type', 'purpose', 'created_at'],
  trip_usage_classification: ['id', 'tenant_id', 'trip_id', 'vehicle_id', 'driver_id', 'usage_type', 'business_purpose', 'business_percentage', 'personal_notes', 'miles_total', 'miles_business', 'CASE', 'WHEN', 'WHEN', 'WHEN', 'ELSE', 'END', 'miles_personal', 'CASE', 'WHEN', 'WHEN', 'WHEN', 'ELSE', 'END', 'trip_date', 'start_location', 'end_location', 'start_odometer', 'end_odometer', 'approved_by_user_id', 'approved_at', 'approval_status', 'rejection_reason', 'metadata', 'created_at', 'updated_at', 'created_by_user_id', 'OR', 'OR', 'end_odometer'],
  trips: ['id', 'tenant_id', 'vehicle_id', 'driver_id', 'status', 'start_time', 'end_time', 'duration_seconds', 'start_location', 'end_location', 'start_odometer_miles', 'end_odometer_miles', 'distance_miles', 'avg_speed_mph', 'max_speed_mph', 'idle_time_seconds', 'fuel_consumed_gallons', 'fuel_efficiency_mpg', 'fuel_cost', 'driver_score', 'harsh_acceleration_count', 'harsh_braking_count', 'harsh_cornering_count', 'speeding_count', 'usage_type', 'business_purpose', 'classification_status', 'metadata', 'created_at', 'updated_at'],
  user_notification_preferences: ['id', 'user_id', 'notification_type', 'channels', 'is_enabled', 'quiet_hours_start', 'quiet_hours_end', 'created_at', 'updated_at'],
  user_preferences: ['id', 'user_id', 'default_task_view', 'default_asset_view', 'items_per_page', 'enable_keyboard_shortcuts', 'theme', 'created_at', 'updated_at'],
  user_roles: ['id', 'user_id', 'role_id', 'assigned_by', 'assigned_at', 'expires_at', 'is_active'],
  utilization_metrics: ['id', 'tenant_id', 'vehicle_id', 'total_hours', 'active_hours', 'idle_hours', 'maintenance_hours', 'utilization_rate', 'total_miles', 'trips_count', 'avg_trip_length', 'revenue_per_hour', 'cost_per_mile', 'roi', 'recommendation', 'recommendation_type', 'potential_savings', 'period_start', 'period_end', 'created_at', 'updated_at'],
  vehicle_alerts: ['id', 'vehicle_id', 'alert_type', 'message', 'severity', 'created_at', 'resolved', 'resolved_at'],
  vehicle_assignment_history: ['id', 'tenant_id', 'vehicle_assignment_id', 'change_type', 'change_timestamp', 'changed_by_user_id', 'previous_values', 'new_values', 'field_changed', 'old_value', 'new_value', 'change_reason', 'ip_address', 'user_agent', 'created_at'],
  vehicle_assignments: ['id', 'tenant_id', 'vehicle_id', 'driver_id', 'department_id', 'assignment_type', 'start_date', 'end_date', 'is_ongoing', 'lifecycle_state', 'authorized_use', 'commuting_authorized', 'on_call_only', 'recommended_by_user_id', 'recommended_at', 'recommendation_notes', 'approval_status', 'approved_by_user_id', 'approved_at', 'denied_by_user_id', 'denied_at', 'approval_notes', 'denial_reason', 'geographic_constraints', 'requires_secured_parking', 'secured_parking_location_id', 'cost_benefit_analysis_id', 'created_at', 'updated_at', 'created_by_user_id', 'end_date', 'assignment_type'],
  vehicle_cameras: ['id', 'vehicle_id', 'external_camera_id', 'camera_type', 'camera_name', 'resolution', 'field_of_view_degrees', 'has_infrared', 'has_audio', 'status', 'last_ping_at', 'firmware_version', 'recording_mode', 'pre_event_buffer_seconds', 'post_event_buffer_seconds', 'max_clip_duration_seconds', 'privacy_blur_faces', 'privacy_blur_plates', 'privacy_audio_redaction', 'metadata', 'created_at', 'updated_at'],
  vehicle_damage: ['id', 'vehicle_id', 'position_x', 'position_y', 'position_z', 'normal_x', 'normal_y', 'normal_z', 'severity', 'severity', 'damage_type', 'damage_type', 'part_name', 'part_name', 'description', 'repair_notes', 'photo_urls', 'cost_estimate', 'actual_repair_cost', 'currency', 'repair_status', 'repair_status', 'repair_scheduled_date', 'repair_completed_date', 'repair_shop_name', 'repair_order_number', 'insurance_claim_number', 'insurance_approved', 'insurance_approved_amount', 'reported_by', 'reported_at', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'position_x', 'position_y', 'position_z', 'normal_x', 'normal_y', 'normal_z', 'cost_estimate', 'repair_completed_date', 'repair_scheduled_date', 'repair_completed_date'],
  vehicle_devices: ['id', 'tenant_id', 'vehicle_id', 'device_id', 'installation_date', 'installed_by', 'installation_location', 'device_identifier', 'sim_card_number', 'data_plan_provider', 'monthly_cost', 'removal_date', 'removed_by', 'removal_reason', 'is_active', 'last_communication', 'signal_strength', 'battery_level', 'device_status', 'configuration', 'created_at', 'updated_at'],
  vehicle_diagnostic_codes: ['id', 'vehicle_id', 'provider_id', 'dtc_code', 'dtc_description', 'severity', 'first_detected_at', 'last_detected_at', 'cleared_at', 'freeze_frame_data', 'raw_data', 'created_at'],
  vehicle_inspections: ['id', 'tenant_id', 'vehicle_id', 'driver_id', 'inspection_type', 'inspection_date', 'location', 'odometer', 'inspection_data', 'vehicle_condition', 'defects', 'photos', 'driver_signature', 'status', 'reviewed_by', 'reviewed_at', 'created_at'],
  vehicle_optimization_profiles: ['id', 'vehicle_id', 'max_weight_lbs', 'max_volume_cuft', 'max_packages', 'has_refrigeration', 'has_liftgate', 'has_temperature_control', 'avg_speed_mph', 'fuel_mpg', 'fuel_cost_per_gallon', 'is_electric', 'battery_capacity_kwh', 'range_miles', 'charge_time_minutes', 'cost_per_mile', 'cost_per_hour', 'available_for_optimization', 'created_at', 'updated_at'],
  vehicle_reservations: ['id', 'tenant_id', 'vehicle_id', 'reserved_by', 'driver_id', 'reservation_type', 'start_time', 'end_time', 'pickup_location', 'dropoff_location', 'estimated_miles', 'purpose', 'status', 'approval_status', 'approved_by', 'approved_at', 'rejection_reason', 'actual_start_time', 'actual_end_time', 'actual_miles', 'start_odometer', 'end_odometer', 'calendar_event_id', 'microsoft_event_id', 'google_event_id', 'notes', 'reminder_sent', 'created_at', 'updated_at'],
  vehicle_safety_inspections: ['id', 'vehicle_id', 'driver_id', 'inspection_date', 'inspection_time', 'inspection_type', 'odometer_reading', 'brakes_status', 'brakes_notes', 'steering_status', 'steering_notes', 'lights_status', 'lights_notes', 'tires_status', 'tires_notes', 'horn_status', 'horn_notes', 'windshield_wipers_status', 'windshield_wipers_notes', 'mirrors_status', 'mirrors_notes', 'seatbelts_status', 'seatbelts_notes', 'emergency_equipment_status', 'emergency_equipment_notes', 'fluid_leaks_status', 'fluid_leaks_notes', 'body_damage_status', 'body_damage_notes', 'overall_status', 'defects_found', 'defects_corrected', 'vehicle_out_of_service', 'driver_signature', 'mechanic_signature', 'supervisor_signature', 'follow_up_required', 'follow_up_completed', 'follow_up_date', 'follow_up_notes', 'created_at', 'updated_at'],
  vehicle_telematics_connections: ['id', 'vehicle_id', 'provider_id', 'external_vehicle_id', 'access_token', 'refresh_token', 'token_expires_at', 'last_sync_at', 'sync_status', 'sync_error', 'metadata', 'created_at', 'updated_at'],
  vehicle_telemetry: ['id', 'vehicle_id', 'provider_id', 'timestamp', 'latitude', 'longitude', 'heading', 'speed_mph', 'altitude_ft', 'address', 'odometer_miles', 'fuel_percent', 'fuel_gallons', 'battery_percent', 'battery_voltage_12v', 'engine_rpm', 'engine_state', 'engine_hours', 'temperature_f', 'temperature_probe_1', 'temperature_probe_2', 'temperature_probe_3', 'tire_pressure_fl', 'tire_pressure_fr', 'tire_pressure_rl', 'tire_pressure_rr', 'oil_life_percent', 'coolant_temp_f', 'is_charging', 'charge_rate_kw', 'estimated_range_miles', 'raw_data', 'created_at'],
  vehicle_telemetry_snapshots: ['id', 'tenant_id', 'vehicle_id', 'odometer_reading', 'engine_hours', 'fuel_level', 'battery_level', 'last_gps_location', 'snapshot_date', 'created_at'],
  vendor_api_configs: ['id', 'vendor_id', 'api_type', 'api_base_url', 'api_key_encrypted', 'api_username_encrypted', 'api_password_encrypted', 'oauth_token', 'oauth_refresh_token', 'oauth_expires_at', 'catalog_endpoint', 'pricing_endpoint', 'availability_endpoint', 'order_endpoint', 'tracking_endpoint', 'request_format', 'response_format', 'rate_limit_requests_per_minute', 'timeout_seconds', 'field_mappings', 'supports_realtime_pricing', 'supports_inventory_check', 'supports_online_ordering', 'supports_order_tracking', 'supports_webhooks', 'webhook_url', 'auto_sync_enabled', 'sync_frequency_minutes', 'last_sync_at', 'last_sync_status', 'last_sync_error', 'is_active', 'consecutive_failures', 'last_successful_request', 'average_response_time_ms', 'notes', 'created_at', 'updated_at'],
  vendor_parts_catalog: ['id', 'vendor_id', 'part_number', 'manufacturer_part_number', 'universal_part_number', 'part_name', 'part_category', 'part_subcategory', 'compatible_makes', 'compatible_models', 'compatible_years', 'compatible_vehicle_types', 'specifications', 'description', 'technical_notes', 'list_price', 'cost_price', 'currency', 'pricing_tier', 'volume_discounts', 'contract_price', 'contract_expiry_date', 'in_stock', 'stock_quantity', 'lead_time_days', 'reorder_threshold', 'minimum_order_quantity', 'part_condition', 'warranty_months', 'warranty_miles', 'quality_rating', 'return_policy', 'vendor_api_id', 'vendor_api_url', 'last_price_update', 'last_availability_check', 'api_sync_enabled', 'is_active', 'is_preferred', 'superseded_by', 'notes', 'created_at', 'updated_at'],
  vendor_performance_metrics: ['id', 'vendor_id', 'period_start', 'period_end', 'quotes_requested', 'quotes_responded', 'avg_quote_response_time_hours', 'quotes_accepted', 'orders_placed', 'orders_completed', 'orders_cancelled', 'total_order_value', 'on_time_deliveries', 'late_deliveries', 'avg_delivery_delay_days', 'wrong_parts_delivered', 'parts_returned', 'parts_warranty_claims', 'avg_part_quality_rating', 'avg_price_competitiveness', 'contract_compliance_percent', 'pricing_errors', 'overall_performance_score', 'would_recommend', 'notes', 'created_at', 'updated_at'],
  vendor_quote_responses: ['id', 'quote_request_id', 'vendor_id', 'response_date', 'response_method', 'vendor_quote_number', 'line_items', 'subtotal', 'tax', 'shipping', 'discount', 'total', 'payment_terms', 'delivery_method', 'estimated_delivery_date', 'warranty_terms', 'api_response_raw', 'api_response_time_ms', 'valid_until', 'is_valid', 'notes', 'created_at', 'updated_at'],
  video_analytics_summary: ['id', 'period_type', 'period_start', 'period_end', 'vehicle_id', 'driver_id', 'total_events', 'harsh_braking_count', 'harsh_acceleration_count', 'harsh_turning_count', 'speeding_count', 'distracted_driving_count', 'drowsiness_count', 'phone_use_count', 'no_seatbelt_count', 'minor_events', 'moderate_events', 'severe_events', 'critical_events', 'coaching_sessions_conducted', 'events_requiring_coaching', 'ai_detections', 'ai_false_positives', 'avg_ai_confidence', 'total_clips_recorded', 'total_video_minutes', 'total_video_storage_gb', 'created_at'],
  video_privacy_audit: ['id', 'video_event_id', 'accessed_by', 'access_type', 'access_reason', 'privacy_action', 'before_state', 'after_state', 'consent_obtained', 'legal_authorization', 'ip_address', 'user_agent', 'created_at'],
  video_processing_queue: ['id', 'video_event_id', 'task_type', 'priority', 'status', 'attempts', 'max_attempts', 'started_at', 'completed_at', 'processing_time_seconds', 'error_message', 'result_data', 'created_at', 'updated_at'],
  video_safety_events: ['id', 'external_event_id', 'vehicle_id', 'driver_id', 'camera_id', 'provider_id', 'event_type', 'severity', 'confidence_score', 'ai_detected_behaviors', 'ai_object_detections', 'ai_face_analysis', 'ai_vehicle_analysis', 'ai_processing_status', 'ai_processed_at', 'latitude', 'longitude', 'address', 'speed_mph', 'g_force', 'duration_seconds', 'event_timestamp', 'event_start_time', 'event_end_time', 'video_request_id', 'video_url', 'video_thumbnail_url', 'video_duration_seconds', 'video_file_size_mb', 'video_resolution', 'video_codec', 'video_expires_at', 'video_download_status', 'video_storage_path', 'additional_camera_clips', 'marked_as_evidence', 'evidence_locker_id', 'retention_policy', 'retention_expires_at', 'delete_after_days', 'reviewed', 'reviewed_by', 'reviewed_at', 'review_notes', 'coaching_required', 'coaching_completed', 'coaching_completed_at', 'privacy_faces_blurred', 'privacy_plates_blurred', 'privacy_audio_redacted', 'privacy_processing_status', 'false_positive', 'disputed', 'dispute_notes', 'metadata', 'created_at', 'updated_at'],
  webhook_events: ['id', 'webhook_id', 'source', 'event_type', 'payload', 'processed', 'processed_at', 'error', 'created_at'],
  webhook_processing_queue: ['id', 'webhook_event_id', 'priority', 'status', 'attempts', 'max_attempts', 'next_retry_at', 'error_message', 'created_at', 'started_at', 'completed_at'],
  webhook_subscriptions: ['id', 'subscription_id', 'resource_type', 'resource_path', 'expiration_date', 'client_state', 'notification_url', 'is_active', 'last_notification_at', 'created_at', 'updated_at'],
  work_orders: ['id', 'tenant_id', 'work_order_number', 'vehicle_id', 'schedule_id', 'title', 'description', 'work_type', 'priority', 'status', 'scheduled_date', 'scheduled_start_time', 'scheduled_end_time', 'actual_start_time', 'actual_end_time', 'assigned_vendor_id', 'assigned_technician', 'assigned_by', 'odometer_in', 'odometer_out', 'engine_hours_in', 'engine_hours_out', 'fuel_level_in', 'fuel_level_out', 'services_performed', 'parts_used', 'labor_hours', 'estimated_cost', 'parts_cost', 'labor_cost', 'tax', 'total_cost', 'purchase_order_id', 'invoice_number', 'invoice_date', 'payment_status', 'inspection_results', 'issues_found', 'recommendations', 'photos', 'documents', 'requires_approval', 'approved_by', 'approved_at', 'approval_notes', 'created_by', 'created_at', 'updated_at', 'completed_at', 'cancelled_at', 'cancellation_reason'],
};

// Total tables: 338

interface QueryOccurrence {
  file: string;
  lineNumber: number;
  fullLine: string;
  query: string;
  tableName: string | null;
}

function extractTableName(query: string): string | null {
  const fromMatch = query.match(/FROM\s+([a-z_]+)/i);
  if (fromMatch) {
    return fromMatch[1];
  }
  if (query.includes('${this.tableName}')) {
    return 'dynamic';
  }
  return null;
}

function findAllSelectStarQueries(): QueryOccurrence[] {
  const grepOutput = execSync(
    'grep -r "SELECT \\*" /Users/andrewmorton/Documents/GitHub/Fleet/api/src --include="*.ts" -n',
    { encoding: 'utf-8' }
  );

  const occurrences: QueryOccurrence[] = [];
  const lines = grepOutput.trim().split('\n');

  for (const line of lines) {
    const match = line.match(/^(.+?):(\d+):(.+)$/);
    if (!match) continue;

    const [, file, lineNumber, content] = match;

    if (content.trim().startsWith('//') || content.trim().startsWith('*')) {
      continue;
    }

    const queryMatch = content.match(/(['"`])SELECT \*.*?\1/);
    if (!queryMatch) continue;

    const query = queryMatch[0].slice(1, -1);
    const tableName = extractTableName(query);

    occurrences.push({
      file,
      lineNumber: parseInt(lineNumber),
      fullLine: content,
      query,
      tableName
    });
  }

  return occurrences;
}

function getExplicitColumns(tableName: string): string {
  const columns = tableSchemas[tableName];
  if (!columns) {
    console.warn(`⚠️  Unknown table: ${tableName}`);
    return '*';
  }

  if (columns.length <= 3) {
    return columns.join(', ');
  }

  return '\n      ' + columns.join(',\n      ');
}

function replaceSelectStar(query: string, tableName: string): string {
  const columns = getExplicitColumns(tableName);
  return query.replace('SELECT *', `SELECT ${columns}`);
}

function fixFileQueries(filePath: string, occurrences: QueryOccurrence[]): number {
  let content = fs.readFileSync(filePath, 'utf-8');
  let fixCount = 0;

  const fileOccurrences = occurrences
    .filter(o => o.file === filePath)
    .sort((a, b) => b.lineNumber - a.lineNumber);

  for (const occurrence of fileOccurrences) {
    if (!occurrence.tableName || occurrence.tableName === 'dynamic') {
      console.log(`⚠️  Skipping dynamic table in ${filePath}:${occurrence.lineNumber}`);
      continue;
    }

    if (!tableSchemas[occurrence.tableName]) {
      console.log(`⚠️  Unknown table "${occurrence.tableName}" in ${filePath}:${occurrence.lineNumber}`);
      continue;
    }

    const oldQuery = occurrence.query;
    const newQuery = replaceSelectStar(oldQuery, occurrence.tableName);

    if (oldQuery !== newQuery) {
      content = content.replace(oldQuery, newQuery);
      fixCount++;
      console.log(`✅ Fixed ${occurrence.tableName} in ${filePath}:${occurrence.lineNumber}`);
    }
  }

  if (fixCount > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return fixCount;
}

function main() {
  console.log('🔍 Finding all SELECT * queries...\n');

  const occurrences = findAllSelectStarQueries();
  console.log(`\n📊 Found ${occurrences.length} SELECT * occurrences\n`);

  const fileGroups = new Map<string, QueryOccurrence[]>();
  for (const occurrence of occurrences) {
    const existing = fileGroups.get(occurrence.file) || [];
    existing.push(occurrence);
    fileGroups.set(occurrence.file, existing);
  }

  console.log(`📁 Across ${fileGroups.size} files\n`);
  console.log('🔧 Starting automated fixes...\n');

  let totalFixed = 0;
  let filesModified = 0;

  for (const [file, fileOccurrences] of fileGroups) {
    const fixed = fixFileQueries(file, fileOccurrences);
    if (fixed > 0) {
      totalFixed += fixed;
      filesModified++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ COMPLETE: Fixed ${totalFixed} queries in ${filesModified} files`);
  console.log('='.repeat(60));

  console.log('\n🔍 Verifying remaining SELECT * queries...');
  const remainingOutput = execSync(
    'grep -r "SELECT \\*" /Users/andrewmorton/Documents/GitHub/Fleet/api/src --include="*.ts" | wc -l',
    { encoding: 'utf-8' }
  ).trim();

  console.log(`\n📊 Remaining SELECT * queries: ${remainingOutput}`);

  if (parseInt(remainingOutput) === 0) {
    console.log('\n🎉 SUCCESS! All SELECT * queries eliminated!');
  } else {
    console.log('\n⚠️  Some queries remain (likely in comments or need manual fixing)');
  }
}

main();
