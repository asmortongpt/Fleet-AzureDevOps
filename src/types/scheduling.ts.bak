/**
 * TypeScript interfaces for Scheduling Module
 */

export interface VehicleReservation {
  id: string
  tenant_id: string
  vehicle_id: string
  reserved_by: string
  driver_id?: string
  reservation_type: 'general' | 'delivery' | 'service' | 'personal'
  start_time: string
  end_time: string
  pickup_location?: string
  dropoff_location?: string
  estimated_miles?: number
  purpose?: string
  notes?: string
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  calendar_event_id?: string
  created_at: string
  updated_at: string
  // Joined fields
  make?: string
  model?: string
  license_plate?: string
  vin?: string
  reserved_by_name?: string
  driver_name?: string
}

export interface MaintenanceAppointment {
  id: string
  tenant_id: string
  vehicle_id?: string
  appointment_type_id: string
  scheduled_start: string
  scheduled_end: string
  actual_start?: string
  actual_end?: string
  assigned_technician_id?: string
  service_bay_id?: string
  work_order_id?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  calendar_event_id?: string
  created_at: string
  updated_at: string
  // Joined fields
  make?: string
  model?: string
  license_plate?: string
  vin?: string
  appointment_type?: string
  color?: string
  bay_name?: string
  bay_number?: string
  technician_name?: string
  work_order_number?: string
}

export interface AppointmentType {
  id: string
  name: string
  description?: string
  estimated_duration: number
  color: string
  icon?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CalendarIntegration {
  id: string
  user_id: string
  provider: 'google' | 'microsoft'
  calendar_id: string
  calendar_name: string
  is_primary: boolean
  is_enabled: boolean
  sync_direction: 'one_way' | 'two_way'
  sync_vehicle_reservations: boolean
  sync_maintenance_appointments: boolean
  last_sync_at?: string
  sync_status?: 'success' | 'failed' | 'syncing'
  created_at: string
}

export interface VehicleSchedule {
  vehicleId: string
  reservations: VehicleReservation[]
  maintenance: MaintenanceAppointment[]
}

export interface ScheduleConflict {
  vehicle: VehicleReservation[] | MaintenanceAppointment[]
  serviceBay: MaintenanceAppointment[]
  technician: MaintenanceAppointment[]
}

export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  license_plate: string
  vin: string
  status: string
  vehicle_type?: string
}

export interface ServiceBay {
  id: string
  bay_name: string
  bay_number: string
  bay_type?: string
  is_available: boolean
}

// Request/Response types
export interface CreateReservationRequest {
  vehicleId: string
  driverId?: string
  reservationType?: 'general' | 'delivery' | 'service' | 'personal'
  startTime: Date | string
  endTime: Date | string
  pickupLocation?: string
  dropoffLocation?: string
  estimatedMiles?: number
  purpose?: string
  notes?: string
  syncToCalendar?: boolean
}

export interface UpdateReservationRequest {
  driver_id?: string
  reservation_type?: 'general' | 'delivery' | 'service' | 'personal'
  start_time?: string
  end_time?: string
  pickup_location?: string
  dropoff_location?: string
  estimated_miles?: number
  purpose?: string
  notes?: string
  status?: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  approval_status?: 'pending' | 'approved' | 'rejected'
}

export interface CreateMaintenanceRequest {
  vehicleId: string
  appointmentTypeId: string
  scheduledStart: Date | string
  scheduledEnd: Date | string
  assignedTechnicianId?: string
  serviceBayId?: string
  workOrderId?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  notes?: string
  syncToCalendar?: boolean
}

export interface UpdateMaintenanceRequest {
  appointment_type_id?: string
  scheduled_start?: string
  scheduled_end?: string
  assigned_technician_id?: string
  service_bay_id?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  notes?: string
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  actual_start?: string
  actual_end?: string
}

export interface CheckConflictsRequest {
  vehicleId?: string
  serviceBayId?: string
  technicianId?: string
  startTime: Date | string
  endTime: Date | string
  excludeId?: string
}

export interface ReservationFilters {
  vehicleId?: string
  status?: string
  startDate?: string
  endDate?: string
  driverId?: string
}

export interface MaintenanceFilters {
  vehicleId?: string
  technicianId?: string
  serviceBayId?: string
  status?: string
  startDate?: string
  endDate?: string
}

export interface AvailableVehiclesParams {
  startTime: string
  endTime: string
  vehicleType?: string
}

export interface AvailableServiceBaysParams {
  facilityId: string
  startTime: string
  endTime: string
  bayType?: string
}

export interface CalendarSyncRequest {
  integrationId: string
  startDate?: string
  endDate?: string
}

export interface GoogleCalendarCallbackRequest {
  code: string
  isPrimary?: boolean
}
