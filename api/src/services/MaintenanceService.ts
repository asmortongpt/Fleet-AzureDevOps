import { Pool } from 'pg';

/**
 * MaintenanceService - Business Logic Layer for Maintenance Operations
 * Extracted from route handlers for better separation of concerns
 */
export class MaintenanceService {
  constructor(private db: Pool) {}

  async getAll(tenantId: number, filters?: any) {
    const query = `
      SELECT *
      FROM maintenances
      WHERE tenant_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query, [tenantId]);
    return result.rows;
  }

  async getById(id: number, tenantId: number) {
    const query = `
      SELECT *
      FROM maintenances
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.db.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async create(data: any, tenantId: number) {
    // Business validation logic
    this.validateMaintenanceData(data);

    const query = `
      INSERT INTO maintenances (data, tenant_id, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `;
    const result = await this.db.query(query, [JSON.stringify(data), tenantId]);
    return result.rows[0];
  }

  /**
   * Validate maintenance record data for business rules
   */
  private validateMaintenanceData(data: any): void {
    const errors: string[] = [];

    // Required fields validation
    if (!data.vehicle_id) {
      errors.push('vehicle_id is required');
    }

    if (!data.maintenance_type) {
      errors.push('maintenance_type is required');
    }

    if (!data.scheduled_date && !data.completed_date) {
      errors.push('Either scheduled_date or completed_date is required');
    }

    // Date validation
    if (data.scheduled_date) {
      const scheduledDate = new Date(data.scheduled_date);
      if (isNaN(scheduledDate.getTime())) {
        errors.push('scheduled_date must be a valid date');
      }
    }

    if (data.completed_date) {
      const completedDate = new Date(data.completed_date);
      if (isNaN(completedDate.getTime())) {
        errors.push('completed_date must be a valid date');
      }

      // Completed date cannot be in the future
      if (completedDate > new Date()) {
        errors.push('completed_date cannot be in the future');
      }
    }

    // Date range validation
    if (data.scheduled_date && data.completed_date) {
      const scheduled = new Date(data.scheduled_date);
      const completed = new Date(data.completed_date);

      if (completed < scheduled) {
        errors.push('completed_date cannot be before scheduled_date');
      }
    }

    // Status validation
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'overdue'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    }

    // Status transition validation
    if (data.status === 'completed' && !data.completed_date) {
      errors.push('completed_date is required when status is completed');
    }

    // Cost validation
    if (data.cost !== undefined && data.cost !== null) {
      const cost = parseFloat(data.cost);
      if (isNaN(cost) || cost < 0) {
        errors.push('cost must be a non-negative number');
      }
    }

    // Odometer validation
    if (data.odometer_reading !== undefined && data.odometer_reading !== null) {
      const odometer = parseInt(data.odometer_reading, 10);
      if (isNaN(odometer) || odometer < 0) {
        errors.push('odometer_reading must be a non-negative integer');
      }
    }

    // Priority validation
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (data.priority && !validPriorities.includes(data.priority)) {
      errors.push(`priority must be one of: ${validPriorities.join(', ')}`);
    }

    // Throw validation error if any errors found
    if (errors.length > 0) {
      const error = new Error(`Validation failed: ${errors.join('; ')}`);
      (error as any).statusCode = 400;
      (error as any).validationErrors = errors;
      throw error;
    }
  }

  async update(id: number, data: any, tenantId: number) {
    // Verify ownership
    const existing = await this.getById(id, tenantId);
    if (!existing) {
      throw new Error('Maintenance not found or access denied');
    }

    // Validate business rules
    this.validateMaintenanceData(data);

    // Additional validation for status transitions
    const existingData = JSON.parse(existing.data);
    this.validateStatusTransition(existingData.status, data.status);

    const query = `
      UPDATE maintenances
      SET data = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.db.query(query, [JSON.stringify(data), id, tenantId]);
    return result.rows[0];
  }

  /**
   * Validate status transitions follow business rules
   */
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    if (!newStatus || currentStatus === newStatus) {
      return; // No transition
    }

    const invalidTransitions: Record<string, string[]> = {
      'completed': ['scheduled', 'in_progress'], // Cannot revert from completed
      'cancelled': ['scheduled', 'in_progress', 'completed'], // Cannot revert from cancelled
    };

    const forbiddenStatuses = invalidTransitions[currentStatus] || [];
    if (forbiddenStatuses.includes(newStatus)) {
      const error = new Error(
        `Invalid status transition: Cannot change from '${currentStatus}' to '${newStatus}'`
      );
      (error as any).statusCode = 400;
      throw error;
    }
  }

  async delete(id: number, tenantId: number) {
    // Soft delete
    const query = `
      UPDATE maintenances
      SET deleted_at = NOW()
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await this.db.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }
}

