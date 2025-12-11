import { Pool } from 'pg';

// ============================================
// Interfaces
// ============================================

export interface VehicleReservation {
  id: number;
  tenant_id: number;
  vehicle_id: number;
  reserved_by: number;
  driver_id?: number;
  reservation_type: string;
  start_time: Date;
  end_time: Date;
  pickup_location?: string;
  dropoff_location?: string;
  estimated_miles?: number;
  purpose?: string;
  notes?: string;
  status: string;
  approval_status?: string;
  approved_by?: number;
  approved_at?: Date;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ReservationFilters {
  vehicleId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  driverId?: string;
}

export interface MaintenanceAppointment {
  id: number;
  tenant_id: number;
  vehicle_id?: number;
  appointment_type_id: number;
  scheduled_start: Date;
  scheduled_end: Date;
  assigned_technician_id?: number;
  service_bay_id?: number;
  work_order_id?: number;
  priority?: string;
  notes?: string;
  status: string;
  actual_start?: Date;
  actual_end?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface MaintenanceFilters {
  vehicleId?: string;
  technicianId?: string;
  serviceBayId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface CalendarIntegration {
  id: number;
  tenant_id: number;
  user_id: number;
  provider: string;
  calendar_id?: string;
  calendar_name?: string;
  is_primary: boolean;
  is_enabled: boolean;
  access_token?: string;
  refresh_token?: string;
  token_expiry?: Date;
  sync_direction?: string;
  sync_vehicle_reservations: boolean;
  sync_maintenance_appointments: boolean;
  sync_work_orders: boolean;
  last_sync_at?: Date;
  sync_status?: string;
  sync_errors?: any;
  settings?: any;
  created_at: Date;
  updated_at: Date;
}

export interface AppointmentType {
  id: number;
  tenant_id: number;
  name: string;
  description?: string;
  duration_minutes: number;
  default_resource_id?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// Repository Implementation
// ============================================

export class SchedulingRepository {
  constructor(private pool: Pool) {}

  // ============================================
  // Vehicle Reservations - Query 1
  // ============================================

  async findReservations(
    tenantId: number,
    filters?: ReservationFilters
  ): Promise<any[]> {
    let query = ;
    const params: any[] = [tenantId];
    let paramCount = 1;

    if (filters?.vehicleId) {
      params.push(filters.vehicleId);
      query +=  + String(++paramCount);
    }

    if (filters?.status) {
      params.push(filters.status);
      query +=  + String(++paramCount);
    }

    if (filters?.driverId) {
      params.push(filters.driverId);
      query +=  + String(++paramCount);
    }

    if (filters?.startDate) {
      params.push(filters.startDate);
      query +=  + String(++paramCount);
    }

    if (filters?.endDate) {
      params.push(filters.endDate);
      query +=  + String(++paramCount);
    }

    query += ;

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  // Query 2
  async updateReservation(
    tenantId: number,
    id: string,
    updates: Record<string, any>
  ): Promise<any | null> {
    const allowedFields = [
      'driver_id', 'reservation_type', 'start_time', 'end_time',
      'pickup_location', 'dropoff_location', 'estimated_miles',
      'purpose', 'notes', 'status', 'approval_status'
    ];

    const updateFields: string[] = [];
    const values: any[] = [tenantId, id];
    let paramCount = 2;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(field + ' = $' + String(++paramCount));
        values.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return null;
    }

    const query =  + updateFields.join(', ') + ;

    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Query 3
  async cancelReservation(
    tenantId: number,
    id: string
  ): Promise<any | null> {
    const result = await this.pool.query(
      ,
      ['cancelled', tenantId, id]
    );

    return result.rows[0] || null;
  }

  // Query 4
  async getReservationWithDetails(
    tenantId: number,
    id: string
  ): Promise<any | null> {
    const result = await this.pool.query(
      ,
      [tenantId, id]
    );

    return result.rows[0] || null;
  }

  // Query 5
  async approveReservation(
    tenantId: number,
    id: string,
    approvedBy: number
  ): Promise<any | null> {
    const result = await this.pool.query(
      ,
      ['approved', approvedBy, 'confirmed', tenantId, id]
    );

    return result.rows[0] || null;
  }

  // Query 6
  async rejectReservation(
    tenantId: number,
    id: string,
    rejectedBy: number,
    reason?: string
  ): Promise<any | null> {
    const result = await this.pool.query(
      ,
      ['rejected', rejectedBy, reason, 'cancelled', tenantId, id]
    );

    return result.rows[0] || null;
  }

  // ============================================
  // Maintenance Appointments - Query 7
  // ============================================

  async findMaintenanceAppointments(
    tenantId: number,
    filters?: MaintenanceFilters
  ): Promise<any[]> {
    let query = ;
    const params: any[] = [tenantId];
    let paramCount = 1;

    if (filters?.vehicleId) {
      params.push(filters.vehicleId);
      query +=  + String(++paramCount);
    }

    if (filters?.technicianId) {
      params.push(filters.technicianId);
      query +=  + String(++paramCount);
    }

    if (filters?.serviceBayId) {
      params.push(filters.serviceBayId);
      query +=  + String(++paramCount);
    }

    if (filters?.status) {
      params.push(filters.status);
      query +=  + String(++paramCount);
    }

    if (filters?.startDate) {
      params.push(filters.startDate);
      query +=  + String(++paramCount);
    }

    if (filters?.endDate) {
      params.push(filters.endDate);
      query +=  + String(++paramCount);
    }

    query += ;

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  // Query 8
  async updateMaintenanceAppointment(
    tenantId: number,
    id: string,
    updates: Record<string, any>
  ): Promise<any | null> {
    const allowedFields = [
      'appointment_type_id', 'scheduled_start', 'scheduled_end',
      'assigned_technician_id', 'service_bay_id', 'priority',
      'notes', 'status', 'actual_start', 'actual_end'
    ];

    const updateFields: string[] = [];
    const values: any[] = [tenantId, id];
    let paramCount = 2;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(field + ' = $' + String(++paramCount));
        values.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return null;
    }

    const query =  + updateFields.join(', ') + ;

    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // ============================================
  // Calendar Integrations - Queries 9-14
  // ============================================

  // Query 9
  async findCalendarIntegrations(userId: number): Promise<CalendarIntegration[]> {
    const result = await this.pool.query(
      ,
      [userId]
    );

    return result.rows;
  }

  // Query 10
  async getCalendarIntegrationById(
    userId: number,
    integrationId: string
  ): Promise<CalendarIntegration | null> {
    const result = await this.pool.query(
      ,
      [integrationId, userId]
    );

    return result.rows[0] || null;
  }

  // Query 11
  async getIntegrationProvider(
    userId: number,
    integrationId: string
  ): Promise<string | null> {
    const result = await this.pool.query(
      ,
      [integrationId, userId]
    );

    return result.rows[0]?.provider || null;
  }

  // Query 12
  async deleteCalendarIntegration(integrationId: string): Promise<void> {
    await this.pool.query(
      ,
      [integrationId]
    );
  }

  // Query 13
  async updateLastSyncTime(integrationId: string): Promise<void> {
    await this.pool.query(
      ,
      [integrationId]
    );
  }

  // ============================================
  // Appointment Types - Query 14
  // ============================================

  // Query 15
  async findAppointmentTypes(tenantId: number): Promise<AppointmentType[]> {
    const result = await this.pool.query(
      ,
      [tenantId]
    );

    return result.rows;
  }
}
