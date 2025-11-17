// Type definitions for Recurring Maintenance System

export type RecurrenceType = 'mileage' | 'time' | 'engine_hours' | 'combined'
export type IntervalUnit = 'miles' | 'days' | 'weeks' | 'months' | 'engine_hours'
export type ScheduleStatus = 'scheduled' | 'due' | 'overdue' | 'completed'
export type SchedulePriority = 'low' | 'medium' | 'high' | 'urgent'
export type ExecutionType = 'auto_scheduled' | 'manual_trigger' | 'mileage_based' | 'time_based'
export type NotificationType = 'due_soon' | 'overdue' | 'work_order_created' | 'work_order_completed'

export interface RecurrencePattern {
  type: RecurrenceType
  interval_value: number
  interval_unit: IntervalUnit
  // Additional configuration
  lead_time_days?: number // How many days before due to create work order
  warning_threshold_days?: number // Days before due to send warning
  grace_period_days?: number // Days after due before marking overdue
}

export interface WorkOrderTemplate {
  priority: SchedulePriority
  assigned_technician?: string
  estimated_cost?: number
  estimated_duration_hours?: number
  description?: string
  parts?: string[]
  service_provider?: string
  instructions?: string
  checklist?: string[]
}

export interface MaintenanceSchedule {
  id: string
  tenant_id: string
  vehicle_id: string
  vehicle_number?: string
  service_type: string
  next_due: Date
  last_completed?: Date
  frequency?: string
  status: ScheduleStatus
  priority: SchedulePriority
  estimated_cost: number
  assigned_technician?: string
  service_provider?: string
  notes?: string
  parts?: string[]

  // Recurring fields
  is_recurring: boolean
  recurrence_pattern?: RecurrencePattern
  auto_create_work_order: boolean
  work_order_template?: WorkOrderTemplate
  last_work_order_created_at?: Date
  current_mileage?: number
  current_engine_hours?: number

  created_at: Date
  updated_at: Date
}

export interface MaintenanceScheduleHistory {
  id: string
  tenant_id: string
  schedule_id: string
  work_order_id?: string
  execution_type: ExecutionType
  next_due_before?: Date
  next_due_after?: Date
  mileage_at_creation?: number
  engine_hours_at_creation?: number
  error_message?: string
  status: 'success' | 'failed' | 'skipped'
  created_at: Date
}

export interface VehicleTelemetrySnapshot {
  id: string
  tenant_id: string
  vehicle_id: string
  odometer_reading?: number
  engine_hours?: number
  fuel_level?: number
  battery_level?: number
  last_gps_location?: {
    latitude: number
    longitude: number
    timestamp: Date
  }
  snapshot_date: Date
  created_at: Date
}

export interface MaintenanceNotification {
  id: string
  tenant_id: string
  schedule_id?: string
  work_order_id?: string
  user_id: string
  notification_type: NotificationType
  message: string
  read: boolean
  sent_via?: string[]
  sent_at?: Date
  created_at: Date
}

export interface WorkOrder {
  id: string
  tenant_id: string
  vehicle_id: string
  schedule_id?: string
  work_order_number: string
  title: string
  description?: string
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  priority: SchedulePriority
  assigned_to?: string
  estimated_cost?: number
  actual_cost?: number
  estimated_hours?: number
  actual_hours?: number
  parts_used?: string[]
  scheduled_date?: Date
  completed_date?: Date
  created_at: Date
  updated_at: Date
}

export interface DueSchedule {
  schedule: MaintenanceSchedule
  vehicle: {
    id: string
    vehicle_number: string
    make?: string
    model?: string
    year?: number
    vin?: string
  }
  telemetry?: VehicleTelemetrySnapshot
  days_until_due: number
  miles_until_due?: number
  hours_until_due?: number
  is_overdue: boolean
  last_work_order?: {
    id: string
    completed_date: Date
    actual_cost: number
  }
}

export interface ScheduleGenerationResult {
  success: boolean
  schedule_id: string
  work_order_id?: string
  error_message?: string
  next_due_date?: Date
  history_id: string
}

export interface RecurringScheduleStats {
  total_recurring: number
  total_active: number
  total_paused: number
  due_within_7_days: number
  due_within_30_days: number
  overdue: number
  work_orders_created_last_30_days: number
  avg_cost_per_schedule: number
  total_estimated_cost_next_30_days: number
}

export interface ValidationResult {
  is_valid: boolean
  errors: string[]
  warnings: string[]
  suggestions?: {
    field: string
    message: string
    suggested_value?: any
  }[]
}

// Request/Response types for API endpoints

export interface CreateRecurringScheduleRequest {
  vehicle_id: string
  service_type: string
  priority: SchedulePriority
  estimated_cost?: number
  recurrence_pattern: RecurrencePattern
  auto_create_work_order: boolean
  work_order_template: WorkOrderTemplate
  notes?: string
  parts?: string[]
}

export interface UpdateRecurrencePatternRequest {
  recurrence_pattern: RecurrencePattern
  auto_create_work_order?: boolean
  work_order_template?: WorkOrderTemplate
}

export interface GetDueSchedulesRequest {
  days_ahead?: number
  include_overdue?: boolean
  vehicle_id?: string
  service_type?: string
  priority?: SchedulePriority
}

export interface ManualWorkOrderGenerationRequest {
  schedule_id: string
  override_template?: Partial<WorkOrderTemplate>
  skip_due_check?: boolean
}

export interface BulkScheduleOperationRequest {
  schedule_ids: string[]
  operation: 'pause' | 'resume' | 'delete' | 'generate_work_orders'
}

export interface ScheduleHistoryResponse {
  schedule: MaintenanceSchedule
  history: (MaintenanceScheduleHistory & {
    work_order?: WorkOrder
  })[]
  total_work_orders: number
  total_cost: number
  avg_days_between_service: number
}
