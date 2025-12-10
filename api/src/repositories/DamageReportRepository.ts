/**
 * Damage Report Repository
 *
 * Handles data access for vehicle damage reports with TripoSR integration
 */

import { BaseRepository, QueryContext, PaginationOptions, PaginatedResult } from './BaseRepository';

export interface DamageReport {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  reported_by: string | null;
  damage_description: string;
  damage_severity: 'minor' | 'moderate' | 'severe';
  damage_location: string | null;
  photos: string[];
  videos?: string[];
  lidar_scans?: string[];
  triposr_task_id: string | null;
  triposr_status: 'pending' | 'processing' | 'completed' | 'failed';
  triposr_model_url: string | null;
  linked_work_order_id: string | null;
  inspection_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DamageReportCreateInput {
  vehicle_id: string;
  reported_by?: string;
  damage_description: string;
  damage_severity: 'minor' | 'moderate' | 'severe';
  damage_location?: string;
  photos?: string[];
  videos?: string[];
  lidar_scans?: string[];
  triposr_task_id?: string;
  triposr_status?: 'pending' | 'processing' | 'completed' | 'failed';
  triposr_model_url?: string;
  linked_work_order_id?: string;
  inspection_id?: string;
}

export interface DamageReportUpdateInput {
  damage_description?: string;
  damage_severity?: 'minor' | 'moderate' | 'severe';
  damage_location?: string;
  photos?: string[];
  videos?: string[];
  lidar_scans?: string[];
  triposr_task_id?: string;
  triposr_status?: 'pending' | 'processing' | 'completed' | 'failed';
  triposr_model_url?: string;
  linked_work_order_id?: string;
  inspection_id?: string;
}

export class DamageReportRepository extends BaseRepository<DamageReport> {
  protected tableName = 'damage_reports';
  protected idColumn = 'id';

  /**
   * Find all damage reports with optional vehicle filter
   */
  async findAllWithPagination(
    context: QueryContext,
    options: PaginationOptions & { vehicle_id?: string } = {}
  ): Promise<PaginatedResult<DamageReport>> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      vehicle_id
    } = options;

    const offset = (page - 1) * limit;
    const pool = this.getPool(context);

    try {
      // Build query with optional vehicle filter
      let query = `
        SELECT
          id,
          tenant_id,
          vehicle_id,
          reported_by AS reporter_id,
          damage_description AS description,
          damage_severity AS severity,
          damage_location AS location,
          photos,
          videos,
          lidar_scans,
          triposr_task_id,
          triposr_status,
          triposr_model_url,
          linked_work_order_id,
          inspection_id,
          created_at,
          updated_at
        FROM damage_reports
        WHERE tenant_id = $1
      `;

      const params: any[] = [context.tenantId];
      let paramIndex = 2;

      if (vehicle_id) {
        query += ` AND vehicle_id = $${paramIndex}`;
        params.push(vehicle_id);
        paramIndex++;
      }

      query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = `SELECT COUNT(*) as count FROM damage_reports WHERE tenant_id = $1`;
      const countParams: any[] = [context.tenantId];

      if (vehicle_id) {
        countQuery += ` AND vehicle_id = $2`;
        countParams.push(vehicle_id);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count, 10);

      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch damage reports: ${error}`);
    }
  }

  /**
   * Find damage report by ID with column mapping
   */
  async findByIdMapped(
    id: string,
    context: QueryContext
  ): Promise<DamageReport | null> {
    try {
      const pool = this.getPool(context);
      const result = await pool.query(
        `SELECT
          id,
          tenant_id,
          vehicle_id,
          reported_by AS reporter_id,
          damage_description AS description,
          damage_severity AS severity,
          damage_location AS location,
          photos,
          videos,
          lidar_scans,
          triposr_task_id,
          triposr_status,
          triposr_model_url,
          linked_work_order_id,
          inspection_id,
          created_at,
          updated_at
        FROM damage_reports
        WHERE id = $1 AND tenant_id = $2`,
        [id, context.tenantId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find damage report: ${error}`);
    }
  }

  /**
   * Create damage report
   */
  async createDamageReport(
    data: DamageReportCreateInput,
    context: QueryContext
  ): Promise<DamageReport> {
    try {
      const pool = this.getPool(context);
      const result = await pool.query(
        `INSERT INTO damage_reports (
          tenant_id,
          vehicle_id,
          reported_by,
          damage_description,
          damage_severity,
          damage_location,
          photos,
          videos,
          lidar_scans,
          triposr_task_id,
          triposr_status,
          triposr_model_url,
          linked_work_order_id,
          inspection_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          context.tenantId,
          data.vehicle_id,
          data.reported_by || context.userId,
          data.damage_description,
          data.damage_severity,
          data.damage_location || null,
          data.photos || [],
          data.videos || [],
          data.lidar_scans || [],
          data.triposr_task_id || null,
          data.triposr_status || 'pending',
          data.triposr_model_url || null,
          data.linked_work_order_id || null,
          data.inspection_id || null
        ]
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create damage report: ${error}`);
    }
  }

  /**
   * Update damage report with dynamic fields
   */
  async updateDamageReport(
    id: string,
    data: DamageReportUpdateInput,
    context: QueryContext
  ): Promise<DamageReport | null> {
    try {
      const pool = this.getPool(context);

      // Build dynamic SET clause
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 3;

      // Map frontend field names to database column names
      const fieldMap: Record<string, string> = {
        vehicle_id: 'vehicle_id',
        reported_by: 'reported_by',
        damage_description: 'damage_description',
        damage_severity: 'damage_severity',
        damage_location: 'damage_location',
        photos: 'photos',
        videos: 'videos',
        lidar_scans: 'lidar_scans',
        triposr_task_id: 'triposr_task_id',
        triposr_status: 'triposr_status',
        triposr_model_url: 'triposr_model_url',
        linked_work_order_id: 'linked_work_order_id',
        inspection_id: 'inspection_id'
      };

      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          const dbColumn = fieldMap[key] || key;
          fields.push(`${dbColumn} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (fields.length === 0) {
        // No fields to update, just return existing record
        return this.findById(id, context);
      }

      const result = await pool.query(
        `UPDATE damage_reports
         SET ${fields.join(', ')}, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [id, context.tenantId, ...values]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update damage report: ${error}`);
    }
  }

  /**
   * Update TripoSR processing status
   */
  async updateTripoSRStatus(
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    modelUrl: string | null,
    context: QueryContext
  ): Promise<DamageReport | null> {
    try {
      const pool = this.getPool(context);
      const result = await pool.query(
        `UPDATE damage_reports
         SET triposr_status = $1, triposr_model_url = $2, updated_at = NOW()
         WHERE id = $3 AND tenant_id = $4
         RETURNING *`,
        [status, modelUrl, id, context.tenantId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update TripoSR status: ${error}`);
    }
  }

  /**
   * Delete damage report
   */
  async deleteDamageReport(
    id: string,
    context: QueryContext
  ): Promise<boolean> {
    try {
      const pool = this.getPool(context);
      const result = await pool.query(
        `DELETE FROM damage_reports WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [id, context.tenantId]
      );

      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to delete damage report: ${error}`);
    }
  }

  /**
   * Find damage reports by vehicle ID
   */
  async findByVehicleId(
    vehicleId: string,
    context: QueryContext,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<DamageReport>> {
    return this.findAllWithPagination(context, { ...options, vehicle_id: vehicleId });
  }

  /**
   * Find damage reports by inspection ID
   */
  async findByInspectionId(
    inspectionId: string,
    context: QueryContext
  ): Promise<DamageReport[]> {
    try {
      const pool = this.getPool(context);
      const result = await pool.query(
        `SELECT * FROM damage_reports
         WHERE inspection_id = $1 AND tenant_id = $2
         ORDER BY created_at DESC`,
        [inspectionId, context.tenantId]
      );

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to find damage reports by inspection: ${error}`);
    }
  }
}
