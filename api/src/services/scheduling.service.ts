/**
 * Unified Scheduling Service
 * Orchestrates vehicle reservations, maintenance scheduling, service bay management,
 * and calendar integrations (Microsoft + Google)
 */

import pool from '../config/database'
import * as microsoftCalendar from './calendar.service'
import * as googleCalendar from './google-calendar.service'
import { QueryResult } from 'pg'

interface SchedulingConflict {
  type: string
  severity: string
  description: string
  conflictingAppointments: any[]
}

interface VehicleReservation {
  vehicleId: string
  reservedBy: string
  driverId?: string
  reservationType: string
  startTime: Date
  endTime: Date
  pickupLocation?: string
  dropoffLocation?: string
  estimatedMiles?: number
  purpose?: string
  notes?: string
}

interface MaintenanceAppointment {
  vehicleId: string
  appointmentTypeId: string
  scheduledStart: Date
  scheduledEnd: Date
  assignedTechnicianId?: string
  serviceBayId?: string
  workOrderId?: string
  priority?: string
  notes?: string
}

interface ServiceBaySchedule {
  serviceBayId: string
  vehicleId?: string
  workOrderId?: string
  appointmentTypeId?: string
  scheduledStart: Date
  scheduledEnd: Date
  assignedTechnicianId?: string
  priority?: string
  notes?: string
}

/**
 * Check for scheduling conflicts for a vehicle
 */
export async function checkVehicleConflicts(
  tenantId: string,
  vehicleId: string,
  startTime: Date,
  endTime: Date,
  excludeReservationId?: string
): Promise<SchedulingConflict[]> {
  const conflicts: SchedulingConflict[] = []

  try {
    // Check vehicle reservations
    let query = `
      SELECT vr.*, v.make, v.model, v.license_plate,
             u.first_name || ' ' || u.last_name as reserved_by_name
      FROM vehicle_reservations vr
      JOIN vehicles v ON vr.vehicle_id = v.id
      JOIN users u ON vr.reserved_by = u.id
      WHERE vr.tenant_id = $1
        AND vr.vehicle_id = $2
        AND vr.status NOT IN ('cancelled', 'completed')
        AND (
          ($3 BETWEEN vr.start_time AND vr.end_time) OR
          ($4 BETWEEN vr.start_time AND vr.end_time) OR
          (vr.start_time BETWEEN $3 AND $4)
        )
    `
    const params: any[] = [tenantId, vehicleId, startTime, endTime]

    if (excludeReservationId) {
      query += ' AND vr.id != $5'
      params.push(excludeReservationId)
    }

    const reservations = await pool.query(query, params)

    if (reservations.rows.length > 0) {
      conflicts.push({
        type: 'vehicle_double_booked',
        severity: 'high',
        description: `Vehicle is already reserved during this time period`,
        conflictingAppointments: reservations.rows
      })
    }

    // Check maintenance appointments
    const maintenance = await pool.query(
      `SELECT sbs.*, v.make, v.model, v.license_plate,
              sb.bay_name, at.name as appointment_type
       FROM service_bay_schedules sbs
       JOIN vehicles v ON sbs.vehicle_id = v.id
       LEFT JOIN service_bays sb ON sbs.service_bay_id = sb.id
       LEFT JOIN appointment_types at ON sbs.appointment_type_id = at.id
       WHERE sbs.tenant_id = $1
         AND sbs.vehicle_id = $2
         AND sbs.status NOT IN ('cancelled', 'completed')
         AND (
           ($3 BETWEEN sbs.scheduled_start AND sbs.scheduled_end) OR
           ($4 BETWEEN sbs.scheduled_start AND sbs.scheduled_end) OR
           (sbs.scheduled_start BETWEEN $3 AND $4)
         )`,
      [tenantId, vehicleId, startTime, endTime]
    )

    if (maintenance.rows.length > 0) {
      conflicts.push({
        type: 'vehicle_in_maintenance',
        severity: 'high',
        description: `Vehicle has scheduled maintenance during this time`,
        conflictingAppointments: maintenance.rows
      })
    }

    // Check if vehicle is out of service
    const vehicle = await pool.query(
      'SELECT status FROM vehicles WHERE id = $1`,
      [vehicleId]
    )

    if (vehicle.rows.length > 0 && vehicle.rows[0].status === 'out_of_service') {
      conflicts.push({
        type: 'vehicle_out_of_service',
        severity: 'critical',
        description: 'Vehicle is currently out of service`,
        conflictingAppointments: []
      })
    }

  } catch (error) {
    console.error('Error checking vehicle conflicts:', error)
    throw error
  }

  return conflicts
}

/**
 * Check for service bay conflicts
 */
export async function checkServiceBayConflicts(
  tenantId: string,
  serviceBayId: string,
  startTime: Date,
  endTime: Date,
  excludeScheduleId?: string
): Promise<SchedulingConflict[]> {
  const conflicts: SchedulingConflict[] = []

  try {
    let query = `
      SELECT sbs.*, sb.bay_name, sb.bay_number,
             v.make, v.model, v.license_plate
      FROM service_bay_schedules sbs
      JOIN service_bays sb ON sbs.service_bay_id = sb.id
      LEFT JOIN vehicles v ON sbs.vehicle_id = v.id
      WHERE sbs.tenant_id = $1
        AND sbs.service_bay_id = $2
        AND sbs.status NOT IN ('cancelled', 'completed')
        AND (
          ($3 BETWEEN sbs.scheduled_start AND sbs.scheduled_end) OR
          ($4 BETWEEN sbs.scheduled_start AND sbs.scheduled_end) OR
          (sbs.scheduled_start BETWEEN $3 AND $4)
        )
    `
    const params: any[] = [tenantId, serviceBayId, startTime, endTime]

    if (excludeScheduleId) {
      query += ' AND sbs.id != $5'
      params.push(excludeScheduleId)
    }

    const schedules = await pool.query(query, params)

    if (schedules.rows.length > 0) {
      conflicts.push({
        type: 'service_bay_occupied',
        severity: 'high',
        description: 'Service bay is already scheduled during this time`,
        conflictingAppointments: schedules.rows
      })
    }

  } catch (error) {
    console.error('Error checking service bay conflicts:', error)
    throw error
  }

  return conflicts
}

/**
 * Check technician availability
 */
export async function checkTechnicianAvailability(
  tenantId: string,
  technicianId: string,
  startTime: Date,
  endTime: Date
): Promise<{ available: boolean; conflicts: SchedulingConflict[] }> {
  const conflicts: SchedulingConflict[] = []

  try {
    // Check technician availability records
    const availability = await pool.query(
      `SELECT id, tenant_id, technician_id, day_of_week, start_time, end_time, created_at, updated_at FROM technician_availability
       WHERE tenant_id = $1
         AND technician_id = $2
         AND availability_type != 'available'
         AND (
           ($3 BETWEEN start_time AND end_time) OR
           ($4 BETWEEN start_time AND end_time) OR
           (start_time BETWEEN $3 AND $4)
         )`,
      [tenantId, technicianId, startTime, endTime]
    )

    if (availability.rows.length > 0) {
      conflicts.push({
        type: 'technician_unavailable',
        severity: 'medium',
        description: `Technician is ${availability.rows[0].availability_type}`,
        conflictingAppointments: availability.rows
      })
    }

    // Check existing service bay schedules
    const schedules = await pool.query(
      `SELECT sbs.*, v.make, v.model, v.license_plate, sb.bay_name
       FROM service_bay_schedules sbs
       LEFT JOIN vehicles v ON sbs.vehicle_id = v.id
       LEFT JOIN service_bays sb ON sbs.service_bay_id = sb.id
       WHERE sbs.tenant_id = $1
         AND sbs.assigned_technician_id = $2
         AND sbs.status NOT IN ('cancelled', 'completed')
         AND (
           ($3 BETWEEN sbs.scheduled_start AND sbs.scheduled_end) OR
           ($4 BETWEEN sbs.scheduled_start AND sbs.scheduled_end) OR
           (sbs.scheduled_start BETWEEN $3 AND $4)
         )`,
      [tenantId, technicianId, startTime, endTime]
    )

    if (schedules.rows.length > 0) {
      conflicts.push({
        type: 'technician_double_booked',
        severity: 'high',
        description: 'Technician is already assigned to another job`,
        conflictingAppointments: schedules.rows
      })
    }

  } catch (error) {
    console.error('Error checking technician availability:', error)
    throw error
  }

  return {
    available: conflicts.length === 0,
    conflicts
  }
}

/**
 * Create vehicle reservation with calendar sync
 */
export async function createVehicleReservation(
  tenantId: string,
  reservation: VehicleReservation,
  syncToCalendar: boolean = true
): Promise<any> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Check for conflicts
    const conflicts = await checkVehicleConflicts(
      tenantId,
      reservation.vehicleId,
      reservation.startTime,
      reservation.endTime
    )

    // If critical conflicts exist, throw error
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical' || c.severity === 'high')
    if (criticalConflicts.length > 0) {
      throw new Error(`Cannot create reservation: ${criticalConflicts[0].description}`)
    }

    // Create reservation
    const result = await client.query(
      `INSERT INTO vehicle_reservations (
        tenant_id, vehicle_id, reserved_by, driver_id, reservation_type,
        start_time, end_time, pickup_location, dropoff_location,
        estimated_miles, purpose, notes, status, approval_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        tenantId,
        reservation.vehicleId,
        reservation.reservedBy,
        reservation.driverId,
        reservation.reservationType,
        reservation.startTime,
        reservation.endTime,
        reservation.pickupLocation,
        reservation.dropoffLocation,
        reservation.estimatedMiles,
        reservation.purpose,
        reservation.notes,
        'pending',
        'pending'
      ]
    )

    const createdReservation = result.rows[0]

    // Sync to calendar if enabled
    if (syncToCalendar) {
      try {
        await syncReservationToCalendars(tenantId, createdReservation, reservation.reservedBy)
      } catch (error) {
        console.error('Error syncing to calendar:', error)
        // Don't fail the reservation if calendar sync fails
      }
    }

    await client.query('COMMIT')

    return createdReservation
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error creating vehicle reservation:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Create maintenance appointment with service bay and calendar sync
 */
export async function createMaintenanceAppointment(
  tenantId: string,
  appointment: MaintenanceAppointment,
  userId: string,
  syncToCalendar: boolean = true
): Promise<any> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Check vehicle conflicts
    const vehicleConflicts = await checkVehicleConflicts(
      tenantId,
      appointment.vehicleId,
      appointment.scheduledStart,
      appointment.scheduledEnd
    )

    if (vehicleConflicts.some(c => c.severity === 'critical' || c.severity === 'high')) {
      throw new Error(`Vehicle conflict: ${vehicleConflicts[0].description}`)
    }

    // Check service bay conflicts if specified
    if (appointment.serviceBayId) {
      const bayConflicts = await checkServiceBayConflicts(
        tenantId,
        appointment.serviceBayId,
        appointment.scheduledStart,
        appointment.scheduledEnd
      )

      if (bayConflicts.length > 0) {
        throw new Error(`Service bay conflict: ${bayConflicts[0].description}`)
      }
    }

    // Check technician availability if specified
    if (appointment.assignedTechnicianId) {
      const techAvailability = await checkTechnicianAvailability(
        tenantId,
        appointment.assignedTechnicianId,
        appointment.scheduledStart,
        appointment.scheduledEnd
      )

      if (!techAvailability.available) {
        throw new Error(`Technician conflict: ${techAvailability.conflicts[0].description}`)
      }
    }

    // Create service bay schedule
    const result = await client.query(
      `INSERT INTO service_bay_schedules (
        tenant_id, service_bay_id, vehicle_id, work_order_id, appointment_type_id,
        scheduled_start, scheduled_end, assigned_technician_id, priority, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        tenantId,
        appointment.serviceBayId,
        appointment.vehicleId,
        appointment.workOrderId,
        appointment.appointmentTypeId,
        appointment.scheduledStart,
        appointment.scheduledEnd,
        appointment.assignedTechnicianId,
        appointment.priority || 'medium',
        appointment.notes,
        'scheduled'
      ]
    )

    const createdAppointment = result.rows[0]

    // Sync to calendar if enabled
    if (syncToCalendar) {
      try {
        await syncMaintenanceToCalendars(tenantId, createdAppointment, userId)
      } catch (error) {
        console.error('Error syncing to calendar:', error)
        // Don't fail the appointment if calendar sync fails
      }
    }

    await client.query('COMMIT')

    return createdAppointment
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error creating maintenance appointment:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Find available service bays
 */
export async function findAvailableServiceBays(
  tenantId: string,
  facilityId: string,
  startTime: Date,
  endTime: Date,
  bayType?: string
): Promise<any[]> {
  try {
    let query = `
      SELECT sb.*, f.name as facility_name,
             COUNT(sbs.id) as current_schedules
      FROM service_bays sb
      JOIN facilities f ON sb.facility_id = f.id
      LEFT JOIN service_bay_schedules sbs ON sb.id = sbs.service_bay_id
        AND sbs.status NOT IN ('cancelled', 'completed')
        AND (
          ($3 BETWEEN sbs.scheduled_start AND sbs.scheduled_end) OR
          ($4 BETWEEN sbs.scheduled_start AND sbs.scheduled_end) OR
          (sbs.scheduled_start BETWEEN $3 AND $4)
        )
      WHERE sb.tenant_id = $1
        AND sb.facility_id = $2
        AND sb.is_active = true
    `

    const params: any[] = [tenantId, facilityId, startTime, endTime]

    if (bayType) {
      query += ' AND sb.bay_type = $5'
      params.push(bayType)
    }

    query += ' GROUP BY sb.id, f.name HAVING COUNT(sbs.id) = 0 ORDER BY sb.bay_number'

    const result = await pool.query(query, params)

    return result.rows
  } catch (error) {
    console.error('Error finding available service bays:', error)
    throw error
  }
}

/**
 * Find available vehicles for reservation
 */
export async function findAvailableVehicles(
  tenantId: string,
  startTime: Date,
  endTime: Date,
  vehicleType?: string
): Promise<any[]> {
  try {
    let query = `
      SELECT v.*, COUNT(vr.id) as reservation_count,
             COUNT(sbs.id) as maintenance_count
      FROM vehicles v
      LEFT JOIN vehicle_reservations vr ON v.id = vr.vehicle_id
        AND vr.status NOT IN ('cancelled', 'completed')
        AND (
          ($2 BETWEEN vr.start_time AND vr.end_time) OR
          ($3 BETWEEN vr.start_time AND vr.end_time) OR
          (vr.start_time BETWEEN $2 AND $3)
        )
      LEFT JOIN service_bay_schedules sbs ON v.id = sbs.vehicle_id
        AND sbs.status NOT IN ('cancelled', 'completed')
        AND (
          ($2 BETWEEN sbs.scheduled_start AND sbs.scheduled_end) OR
          ($3 BETWEEN sbs.scheduled_start AND sbs.scheduled_end) OR
          (sbs.scheduled_start BETWEEN $2 AND $3)
        )
      WHERE v.tenant_id = $1
        AND v.status = 'active'
    `

    const params: any[] = [tenantId, startTime, endTime]

    if (vehicleType) {
      query += ' AND v.vehicle_type = $4'
      params.push(vehicleType)
    }

    query += `
      GROUP BY v.id
      HAVING COUNT(vr.id) = 0 AND COUNT(sbs.id) = 0
      ORDER BY v.make, v.model
    `

    const result = await pool.query(query, params)

    return result.rows
  } catch (error) {
    console.error('Error finding available vehicles:', error)
    throw error
  }
}

/**
 * Sync reservation to all enabled calendars for a user
 */
async function syncReservationToCalendars(
  tenantId: string,
  reservation: any,
  userId: string
): Promise<void> {
  try {
    // Get vehicle details
    const vehicle = await pool.query(
<<<<<<< HEAD
      'SELECT id, tenant_id, vin, license_plate, make, model, year, color, current_mileage, status, acquired_date, disposition_date, purchase_price, residual_value, created_at, updated_at, deleted_at FROM vehicles WHERE id = $1',
=======
      `SELECT
      id,
      tenant_id,
      vin,
      make,
      model,
      year,
      license_plate,
      vehicle_type,
      fuel_type,
      status,
      odometer,
      engine_hours,
      purchase_date,
      purchase_price,
      current_value,
      gps_device_id,
      last_gps_update,
      latitude,
      longitude,
      location,
      speed,
      heading,
      assigned_driver_id,
      assigned_facility_id,
      telematics_data,
      photos,
      notes,
      created_at,
      updated_at FROM vehicles WHERE id = $1`,
>>>>>>> feature/devsecops-audit-remediation
      [reservation.vehicle_id]
    )

    if (vehicle.rows.length === 0) return

    const vehicleInfo = vehicle.rows[0]
    const subject = `Vehicle Reservation: ${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.license_plate})`
    const body = `
      <strong>Reservation Details:</strong><br/>
      Vehicle: ${vehicleInfo.make} ${vehicleInfo.model}<br/>
      License Plate: ${vehicleInfo.license_plate}<br/>
      Type: ${reservation.reservation_type}<br/>
      ${reservation.pickup_location ? `Pickup: ${reservation.pickup_location}<br/>` : ''}
      ${reservation.dropoff_location ? `Dropoff: ${reservation.dropoff_location}<br/>` : ''}
      ${reservation.purpose ? `Purpose: ${reservation.purpose}<br/>` : ''}
    `

    // Get enabled calendar integrations
    const integrations = await pool.query(
      `SELECT id, tenant_id, user_id, calendar_type, calendar_id, is_synced, last_sync_at, created_at, updated_at FROM calendar_integrations
       WHERE user_id = $1 AND is_enabled = true`,
      [userId]
    )

    for (const integration of integrations.rows) {
      try {
        let eventId: string | null = null

        if (integration.provider === 'microsoft' && integration.sync_vehicle_reservations) {
          const event = await microsoftCalendar.createEvent(
            userId,
            subject,
            new Date(reservation.start_time),
            new Date(reservation.end_time),
            [],
            reservation.pickup_location,
            body
          )
          eventId = event.id
        } else if (integration.provider === 'google' && integration.sync_vehicle_reservations) {
          const event = await googleCalendar.createEvent(userId, {
            summary: subject,
            start: new Date(reservation.start_time),
            end: new Date(reservation.end_time),
            location: reservation.pickup_location,
            description: body.replace(/<br\/>/g, '\n').replace(/<\/?strong>/g, '')
          })
          eventId = event.id
        }

        // Update reservation with calendar event ID
        if (eventId) {
          const updateField = integration.provider === 'microsoft'
            ? 'microsoft_event_id'
            : 'google_event_id'

          await pool.query(
            `UPDATE vehicle_reservations SET ${updateField} = $1 WHERE id = $2`,
            [eventId, reservation.id]
          )
        }

      } catch (error) {
        console.error(`Error syncing to ${integration.provider} calendar:`, error)
      }
    }

  } catch (error) {
    console.error('Error syncing reservation to calendars:', error)
    throw error
  }
}

/**
 * Sync maintenance appointment to calendars
 */
async function syncMaintenanceToCalendars(
  tenantId: string,
  appointment: any,
  userId: string
): Promise<void> {
  try {
    // Get appointment details
    const details = await pool.query(
      `SELECT sbs.*, v.make, v.model, v.license_plate, v.vin,
              at.name as appointment_type, sb.bay_name,
              u.first_name || ' ' || u.last_name as technician_name
       FROM service_bay_schedules sbs
       LEFT JOIN vehicles v ON sbs.vehicle_id = v.id
       LEFT JOIN appointment_types at ON sbs.appointment_type_id = at.id
       LEFT JOIN service_bays sb ON sbs.service_bay_id = sb.id
       LEFT JOIN users u ON sbs.assigned_technician_id = u.id
       WHERE sbs.id = $1`,
      [appointment.id]
    )

    if (details.rows.length === 0) return

    const appt = details.rows[0]
    const subject = `Maintenance: ${appt.appointment_type} - ${appt.make} ${appt.model}`
    const location = appt.bay_name || 'Service Center`
    const body = `
      <strong>Maintenance Appointment:</strong><br/>
      Vehicle: ${appt.make} ${appt.model} (${appt.license_plate})<br/>
      VIN: ${appt.vin}<br/>
      Service Type: ${appt.appointment_type}<br/>
      ${appt.bay_name ? `Service Bay: ${appt.bay_name}<br/>` : ''}
      ${appt.technician_name ? `Technician: ${appt.technician_name}<br/>` : ''}
    `

    // Get enabled calendar integrations for relevant users
    const userIds = [userId]
    if (appt.assigned_technician_id) {
      userIds.push(appt.assigned_technician_id)
    }

    const integrations = await pool.query(
      `SELECT id, tenant_id, user_id, calendar_type, calendar_id, is_synced, last_sync_at, created_at, updated_at FROM calendar_integrations
       WHERE user_id = ANY($1) AND is_enabled = true`,
      [userIds]
    )

    for (const integration of integrations.rows) {
      try {
        let eventId: string | null = null

        if (integration.provider === 'microsoft' && integration.sync_maintenance_appointments) {
          const event = await microsoftCalendar.createEvent(
            integration.user_id,
            subject,
            new Date(appt.scheduled_start),
            new Date(appt.scheduled_end),
            [],
            location,
            body
          )
          eventId = event.id
        } else if (integration.provider === 'google' && integration.sync_maintenance_appointments) {
          const event = await googleCalendar.createEvent(integration.user_id, {
            summary: subject,
            start: new Date(appt.scheduled_start),
            end: new Date(appt.scheduled_end),
            location: location,
            description: body.replace(/<br\/>/g, '\n').replace(/<\/?strong>/g, '')
          })
          eventId = event.id
        }

        // Update appointment with calendar event ID
        if (eventId && integration.user_id === userId) {
          const updateField = integration.provider === 'microsoft'
            ? 'microsoft_event_id'
            : 'google_event_id'

          await pool.query(
            `UPDATE service_bay_schedules SET ${updateField} = $1 WHERE id = $2`,
            [eventId, appointment.id]
          )
        }

      } catch (error) {
        console.error(`Error syncing to ${integration.provider} calendar:`, error)
      }
    }

  } catch (error) {
    console.error('Error syncing maintenance to calendars:', error)
    throw error
  }
}

/**
 * Get upcoming reservations for a user
 */
export async function getUpcomingReservations(
  tenantId: string,
  userId: string,
  daysAhead: number = 7
): Promise<any[]> {
  try {
    // Validate and sanitize daysAhead parameter
    const daysAheadNum = Math.max(1, Math.min(365, daysAhead || 7))

    const result = await pool.query(
      `SELECT vr.*, v.make, v.model, v.license_plate, v.vin,
              u.first_name || ' ' || u.last_name as driver_name
       FROM vehicle_reservations vr
       JOIN vehicles v ON vr.vehicle_id = v.id
       LEFT JOIN drivers d ON vr.driver_id = d.id
       LEFT JOIN users u ON d.user_id = u.id
       WHERE vr.tenant_id = $1
         AND vr.reserved_by = $2
         AND vr.status NOT IN ('cancelled', 'completed')
         AND vr.start_time >= NOW()
         AND vr.start_time <= NOW() + ($3 || ' days')::INTERVAL
       ORDER BY vr.start_time`,
      [tenantId, userId, daysAheadNum]
    )

    return result.rows
  } catch (error) {
    console.error('Error getting upcoming reservations:', error)
    throw error
  }
}

/**
 * Get vehicle schedule (reservations + maintenance)
 */
export async function getVehicleSchedule(
  tenantId: string,
  vehicleId: string,
  startDate: Date,
  endDate: Date
): Promise<any> {
  try {
    // Get reservations
    const reservations = await pool.query(
      `SELECT vr.*, u.first_name || ' ' || u.last_name as reserved_by_name,
              du.first_name || ' ' || du.last_name as driver_name
       FROM vehicle_reservations vr
       JOIN users u ON vr.reserved_by = u.id
       LEFT JOIN drivers d ON vr.driver_id = d.id
       LEFT JOIN users du ON d.user_id = du.id
       WHERE vr.tenant_id = $1
         AND vr.vehicle_id = $2
         AND vr.status NOT IN ('cancelled')
         AND vr.start_time <= $4
         AND vr.end_time >= $3
       ORDER BY vr.start_time`,
      [tenantId, vehicleId, startDate, endDate]
    )

    // Get maintenance appointments
    const maintenance = await pool.query(
      `SELECT sbs.*, at.name as appointment_type, sb.bay_name,
              u.first_name || ' ' || u.last_name as technician_name
       FROM service_bay_schedules sbs
       LEFT JOIN appointment_types at ON sbs.appointment_type_id = at.id
       LEFT JOIN service_bays sb ON sbs.service_bay_id = sb.id
       LEFT JOIN users u ON sbs.assigned_technician_id = u.id
       WHERE sbs.tenant_id = $1
         AND sbs.vehicle_id = $2
         AND sbs.status NOT IN ('cancelled')
         AND sbs.scheduled_start <= $4
         AND sbs.scheduled_end >= $3
       ORDER BY sbs.scheduled_start`,
      [tenantId, vehicleId, startDate, endDate]
    )

    return {
      reservations: reservations.rows,
      maintenance: maintenance.rows
    }
  } catch (error) {
    console.error('Error getting vehicle schedule:', error)
    throw error
  }
}

export default {
  checkVehicleConflicts,
  checkServiceBayConflicts,
  checkTechnicianAvailability,
  createVehicleReservation,
  createMaintenanceAppointment,
  findAvailableServiceBays,
  findAvailableVehicles,
  getUpcomingReservations,
  getVehicleSchedule
}
