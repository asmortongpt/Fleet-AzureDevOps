/**
 * Example: Vehicle Repository using BaseRepository
 *
 * This demonstrates best practices for repository pattern implementation
 */

import { BaseRepository, QueryContext, PaginationOptions, PaginatedResult } from './BaseRepository';
import { Pool } from 'pg';

export interface Vehicle {
  id: number;
  tenant_id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  odometer: number;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by?: string;
  deleted_at?: Date;
  deleted_by?: string;
}

export interface VehicleFilters {
  status?: Vehicle['status'];
  make?: string;
  model?: string;
  year?: number;
  minOdometer?: number;
  maxOdometer?: number;
}

/**
 * Vehicle Repository - Handles all vehicle data access
 */
export class VehicleRepository extends BaseRepository<Vehicle> {
  protected tableName = 'vehicles';
  protected idColumn = 'id';

  /**
   * Find vehicles by status
   */
  async findByStatus(
    status: Vehicle['status'],
    context: QueryContext,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Vehicle>> {
    return this.findWhere({ status } as Partial<Vehicle>, context, options);
  }

  /**
   * Find vehicle by VIN
   */
  async findByVIN(vin: string, context: QueryContext): Promise<Vehicle | null> {
    try {
      const pool = this.getPool(context);
      const result = await pool.query<Vehicle>(
        `SELECT * FROM ${this.tableName}
         WHERE vin = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [vin, context.tenantId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find vehicle by VIN: ${error}`);
    }
  }

  /**
   * Advanced filtering with multiple criteria
   */
  async findWithFilters(
    filters: VehicleFilters,
    context: QueryContext,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<Vehicle>> {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'id',
        sortOrder = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      const pool = this.getPool(context);

      // Build dynamic WHERE clause
      const whereConditions = ['tenant_id = $1', 'deleted_at IS NULL'];
      const values: any[] = [context.tenantId];
      let paramIndex = 2;

      if (filters.status) {
        whereConditions.push(`status = $${paramIndex++}`);
        values.push(filters.status);
      }

      if (filters.make) {
        whereConditions.push(`make ILIKE $${paramIndex++}`);
        values.push(`%${filters.make}%`);
      }

      if (filters.model) {
        whereConditions.push(`model ILIKE $${paramIndex++}`);
        values.push(`%${filters.model}%`);
      }

      if (filters.year) {
        whereConditions.push(`year = $${paramIndex++}`);
        values.push(filters.year);
      }

      if (filters.minOdometer !== undefined) {
        whereConditions.push(`odometer >= $${paramIndex++}`);
        values.push(filters.minOdometer);
      }

      if (filters.maxOdometer !== undefined) {
        whereConditions.push(`odometer <= $${paramIndex++}`);
        values.push(filters.maxOdometer);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated data
      const dataResult = await pool.query<Vehicle>(
        `SELECT * FROM ${this.tableName}
         WHERE ${whereClause}
         ORDER BY ${sortBy} ${sortOrder}
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...values, limit, offset]
      );

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to filter vehicles: ${error}`);
    }
  }

  /**
   * Get vehicles due for maintenance
   */
  async findDueForMaintenance(
    context: QueryContext,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Vehicle>> {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'odometer',
        sortOrder = 'DESC'
      } = options || {};

      const offset = (page - 1) * limit;
      const pool = this.getPool(context);

      // Complex query joining with maintenance schedules
      const query = `
        SELECT DISTINCT v.*
        FROM vehicles v
        LEFT JOIN maintenance_schedules ms ON v.id = ms.vehicle_id
        WHERE v.tenant_id = $1
          AND v.deleted_at IS NULL
          AND v.status = 'active'
          AND (
            -- Due based on odometer
            (ms.interval_type = 'odometer' AND v.odometer >= ms.next_service_odometer)
            OR
            -- Due based on date
            (ms.interval_type = 'date' AND ms.next_service_date <= CURRENT_DATE)
          )
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(DISTINCT v.id) as count
        FROM vehicles v
        LEFT JOIN maintenance_schedules ms ON v.id = ms.vehicle_id
        WHERE v.tenant_id = $1
          AND v.deleted_at IS NULL
          AND v.status = 'active'
          AND (
            (ms.interval_type = 'odometer' AND v.odometer >= ms.next_service_odometer)
            OR
            (ms.interval_type = 'date' AND ms.next_service_date <= CURRENT_DATE)
          )
      `;

      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, [context.tenantId]),
        pool.query<Vehicle>(query, [context.tenantId, limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].count, 10);

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to find vehicles due for maintenance: ${error}`);
    }
  }

  /**
   * Bulk update vehicle status
   */
  async bulkUpdateStatus(
    vehicleIds: number[],
    status: Vehicle['status'],
    context: QueryContext
  ): Promise<number> {
    try {
      const pool = this.getPool(context);

      const result = await pool.query(
        `UPDATE ${this.tableName}
         SET status = $1, updated_at = NOW(), updated_by = $2
         WHERE id = ANY($3) AND tenant_id = $4 AND deleted_at IS NULL`,
        [status, context.userId, vehicleIds, context.tenantId]
      );

      return result.rowCount || 0;
    } catch (error) {
      throw new Error(`Failed to bulk update vehicle status: ${error}`);
    }
  }

  /**
   * Get vehicle statistics
   */
  async getStatistics(context: QueryContext): Promise<{
    total: number;
    byStatus: Record<Vehicle['status'], number>;
    averageOdometer: number;
    oldestVehicleYear: number;
    newestVehicleYear: number;
  }> {
    try {
      const pool = this.getPool(context);

      const result = await pool.query(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'active') as active,
           COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
           COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance,
           COUNT(*) FILTER (WHERE status = 'retired') as retired,
           AVG(odometer)::int as avg_odometer,
           MIN(year) as oldest_year,
           MAX(year) as newest_year
         FROM ${this.tableName}
         WHERE tenant_id = $1 AND deleted_at IS NULL`,
        [context.tenantId]
      );

      const row = result.rows[0];

      return {
        total: parseInt(row.total, 10),
        byStatus: {
          active: parseInt(row.active, 10),
          inactive: parseInt(row.inactive, 10),
          maintenance: parseInt(row.maintenance, 10),
          retired: parseInt(row.retired, 10)
        },
        averageOdometer: row.avg_odometer || 0,
        oldestVehicleYear: row.oldest_year || 0,
        newestVehicleYear: row.newest_year || 0
      };
    } catch (error) {
      throw new Error(`Failed to get vehicle statistics: ${error}`);
    }
  }
}
