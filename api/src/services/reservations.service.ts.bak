/**
 * Reservations Service
 * 
 * Business logic layer for vehicle reservations
 * Handles validation, approval workflows, and Microsoft integrations
 */

import { Pool, PoolClient } from 'pg';

import logger from '../config/logger';
import { NotFoundError, ValidationError } from '../errors/ApplicationError';
import { QueryContext, PaginationOptions, PaginatedResult } from '../repositories/BaseRepository';
import ReservationsRepository, {
  Reservation,
  ReservationWithDetails,
  CreateReservationData,
  UpdateReservationData,
  ReservationFilters,
} from '../repositories/ReservationsRepository';

import MicrosoftIntegrationService from './microsoft-integration.service';


export interface UserContext {
  id: string;
  name: string;
  email: string;
  roles: string[];
  tenant_id: string;
  org_id?: string;
}

export class ReservationsService {
  private repository: ReservationsRepository;
  private microsoftService: MicrosoftIntegrationService;

  constructor(pool: Pool) {
    this.repository = new ReservationsRepository();
    this.microsoftService = new MicrosoftIntegrationService(pool);
  }

  /**
   * Helper: Check if user can view all reservations
   */
  private canViewAllReservations(user: UserContext): boolean {
    const roles = user.roles || [];
    return roles.includes('Admin') || roles.includes('FleetManager') || roles.includes('Auditor');
  }

  /**
   * Helper: Check if user can approve reservations
   */
  private canApproveReservations(user: UserContext): boolean {
    const roles = user.roles || [];
    return roles.includes('Admin') || roles.includes('FleetManager');
  }

  /**
   * Helper: Determine if reservation requires approval
   */
  private async requiresApproval(
    purpose: string,
    userId: string,
    context: QueryContext
  ): Promise<boolean> {
    // Personal reservations always require approval
    if (purpose === 'personal') {
      return true;
    }

    // Check if user has auto-approval privilege for business reservations
    const hasAutoApproval = await this.repository.userHasAutoApproval(userId, context);
    return !hasAutoApproval;
  }

  /**
   * Get reservations with filters and pagination
   */
  async getReservations(
    user: UserContext,
    filters: Omit<ReservationFilters, 'user_can_view_all'>,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<ReservationWithDetails>> {
    const context: QueryContext = {
      userId: user.id,
      tenantId: user.tenant_id,
    };

    const enrichedFilters: ReservationFilters = {
      ...filters,
      user_can_view_all: this.canViewAllReservations(user),
    };

    return this.repository.findWithFilters(context, enrichedFilters, options);
  }

  /**
   * Get single reservation by ID
   */
  async getReservationById(
    id: string,
    user: UserContext
  ): Promise<ReservationWithDetails> {
    const context: QueryContext = {
      userId: user.id,
      tenantId: user.tenant_id,
    };

    const reservation = await this.repository.findByIdWithDetails(
      id,
      context,
      this.canViewAllReservations(user)
    );

    if (!reservation) {
      throw new NotFoundError('Reservation', id);
    }

    return reservation;
  }

  /**
   * Create new reservation
   */
  async createReservation(
    data: CreateReservationData,
    user: UserContext,
    client?: PoolClient
  ): Promise<{ reservation: Reservation; requires_approval: boolean }> {
    const context: QueryContext = {
      userId: user.id,
      tenantId: user.tenant_id,
      pool: client,
    };

    // Check if vehicle exists
    const vehicle = await this.repository.checkVehicleExists(data.vehicle_id, context);
    if (!vehicle) {
      throw new NotFoundError('Vehicle', data.vehicle_id);
    }

    // Check for conflicts
    const hasConflict = await this.repository.checkConflict(
      data.vehicle_id,
      data.start_datetime,
      data.end_datetime
    );

    if (hasConflict) {
      throw new ValidationError(
        'This vehicle is already reserved for the selected time period'
      );
    }

    // Determine if approval is required
    const needsApproval = await this.requiresApproval(data.purpose, user.id, context);

    // Create reservation
    const reservation = await this.repository.create(
      data,
      {
        userId: user.id,
        name: user.name || user.email,
        email: user.email,
        tenantId: user.tenant_id,
        orgId: user.org_id,
      },
      needsApproval
    );

    // Handle Microsoft integrations asynchronously (non-blocking)
    setImmediate(async () => {
      try {
        const eventId = await this.microsoftService.createCalendarEvent({
          ...reservation,
          ...vehicle,
        });

        if (eventId) {
          await this.repository.updateCalendarEventId(reservation.id, eventId, context);
        }

        await this.microsoftService.sendOutlookEmail(
          { ...reservation, ...vehicle },
          'created'
        );

        if (needsApproval) {
          await this.microsoftService.notifyFleetManagers({ ...reservation, ...vehicle });
        }
      } catch (error) {
        logger.error('Microsoft integration error:', error);
      }
    });

    return {
      reservation,
      requires_approval: needsApproval,
    };
  }

  /**
   * Update existing reservation
   */
  async updateReservation(
    id: string,
    data: UpdateReservationData,
    user: UserContext,
    client?: PoolClient
  ): Promise<Reservation> {
    const context: QueryContext = {
      userId: user.id,
      tenantId: user.tenant_id,
      pool: client,
    };

    // Get existing reservation
    const existing = await this.repository.findByIdWithDetails(
      id,
      context,
      this.canViewAllReservations(user)
    );

    if (!existing) {
      throw new NotFoundError('Reservation', id);
    }

    // Only allow updates to pending or confirmed reservations
    if (!['pending', 'confirmed'].includes(existing.status)) {
      throw new ValidationError('Only pending or confirmed reservations can be updated');
    }

    // If updating times, check for conflicts
    if (data.start_datetime || data.end_datetime) {
      const newStart = data.start_datetime || existing.start_datetime.toISOString();
      const newEnd = data.end_datetime || existing.end_datetime.toISOString();

      const hasConflict = await this.repository.checkConflict(
        existing.vehicle_id,
        newStart,
        newEnd,
        id
      );

      if (hasConflict) {
        throw new ValidationError('The updated time period conflicts with another reservation');
      }
    }

    // Update reservation
    const updated = await this.repository.update(id, data, context);

    // Update calendar event if exists (non-blocking)
    if (existing.microsoft_calendar_event_id) {
      setImmediate(async () => {
        try {
          await this.microsoftService.updateCalendarEvent(
            existing.microsoft_calendar_event_id!,
            updated,
            existing.reserved_by_email
          );
        } catch (error) {
          logger.error('Calendar update error:', error);
        }
      });
    }

    return updated;
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(
    id: string,
    user: UserContext,
    client?: PoolClient
  ): Promise<void> {
    const context: QueryContext = {
      userId: user.id,
      tenantId: user.tenant_id,
      pool: client,
    };

    // Get existing reservation
    const reservation = await this.repository.findByIdWithDetails(
      id,
      context,
      this.canViewAllReservations(user)
    );

    if (!reservation) {
      throw new NotFoundError('Reservation', id);
    }

    // Cancel reservation
    await this.repository.cancel(id, context);

    // Delete calendar event if exists (non-blocking)
    if (reservation.microsoft_calendar_event_id) {
      setImmediate(async () => {
        try {
          await this.microsoftService.deleteCalendarEvent(
            reservation.microsoft_calendar_event_id!,
            reservation.reserved_by_email
          );
          await this.microsoftService.sendOutlookEmail(reservation, 'cancelled');
        } catch (error) {
          logger.error('Calendar deletion error:', error);
        }
      });
    }
  }

  /**
   * Approve or reject reservation
   */
  async approveReservation(
    id: string,
    action: 'approve' | 'reject',
    user: UserContext,
    client?: PoolClient
  ): Promise<Reservation> {
    // Check permission
    if (!this.canApproveReservations(user)) {
      throw new ValidationError('You do not have permission to approve reservations');
    }

    const context: QueryContext = {
      userId: user.id,
      tenantId: user.tenant_id,
      pool: client,
    };

    // Get reservation
    const reservation = await this.repository.findByIdWithDetails(
      id,
      context,
      true // Admin/FleetManager can view all
    );

    if (!reservation) {
      throw new NotFoundError('Reservation', id);
    }

    if (reservation.status !== 'pending') {
      throw new ValidationError('Only pending reservations can be approved or rejected');
    }

    // Update reservation
    const newStatus = action === 'approve' ? 'confirmed' : 'cancelled';
    const updated = await this.repository.approveOrReject(
      id,
      { approved_by: user.id, status: newStatus },
      context
    );

    // Send notifications (non-blocking)
    setImmediate(async () => {
      try {
        await this.microsoftService.sendOutlookEmail(
          updated,
          action === 'approve' ? 'approved' : 'rejected'
        );

        if (action === 'approve') {
          await this.microsoftService.sendTeamsNotification(updated, 'approved');
        }
      } catch (error) {
        logger.error('Notification error:', error);
      }
    });

    return updated;
  }

  /**
   * Get vehicle availability
   */
  async getVehicleAvailability(
    vehicleId: string,
    startDate: string,
    endDate: string,
    user: UserContext
  ): Promise<any[]> {
    const context: QueryContext = {
      userId: user.id,
      tenantId: user.tenant_id,
    };

    return this.repository.getVehicleAvailability(vehicleId, startDate, endDate, context);
  }

  /**
   * Get vehicle reservations history
   */
  async getVehicleReservations(
    vehicleId: string,
    filters: { status?: string; start_date?: string; end_date?: string },
    user: UserContext
  ): Promise<any[]> {
    const context: QueryContext = {
      userId: user.id,
      tenantId: user.tenant_id,
    };

    return this.repository.getVehicleReservations(vehicleId, filters, context);
  }

  /**
   * Get pending approval reservations
   */
  async getPendingApprovals(user: UserContext): Promise<ReservationWithDetails[]> {
    // Check permission
    if (!this.canApproveReservations(user)) {
      throw new ValidationError('You do not have permission to view pending approvals');
    }

    const context: QueryContext = {
      userId: user.id,
      tenantId: user.tenant_id,
    };

    return this.repository.getPendingApprovals(context);
  }
}

export default ReservationsService;
