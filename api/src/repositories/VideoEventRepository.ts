import { injectable } from 'inversify'

import { BaseRepository, PaginatedResult, PaginationOptions, QueryContext } from './base/BaseRepository'

/**
 * VideoEvent entity with complete field definitions
 */
export interface VideoEvent {
  id: string
  tenant_id: string
  vehicle_id: string
  driver_id?: string
  event_time: Date
  event_type?: string // harsh_braking, harsh_acceleration, collision, speeding, distraction
  severity?: 'low' | 'medium' | 'high' | 'critical'
  video_url?: string
  thumbnail_url?: string
  duration?: number // seconds
  latitude?: number
  longitude?: number
  speed?: number
  g_force?: number
  reviewed: boolean
  reviewed_by?: string
  reviewed_at?: Date
  notes?: string
  created_at: Date
  updated_at: Date
}

/**
 * VideoEventRepository - Handles video event data operations
 *
 * Security:
 * - All queries use parameterized statements ($1, $2, $3)
 * - Tenant isolation enforced on all operations
 * - Inherits BaseRepository security patterns
 */
@injectable()
export class VideoEventRepository extends BaseRepository<VideoEvent> {
  protected tableName = 'video_events'
  protected idColumn = 'id'

  /**
   * Find all video events with pagination for a tenant
   */
  async findAllPaginated(
    context: QueryContext,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<VideoEvent>> {
    // Default sort by event_time DESC (most recent first)
    const sortOptions = {
      ...options,
      sortBy: options.sortBy || 'event_time',
      sortOrder: options.sortOrder || 'DESC' as const
    }

    return this.findAll(context, sortOptions)
  }

  /**
   * Find video events by vehicle ID
   */
  async findByVehicle(
    vehicleId: string,
    context: QueryContext,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<VideoEvent>> {
    return this.findWhere({ vehicle_id: vehicleId } as Partial<VideoEvent>, context, options)
  }

  /**
   * Find video events by driver ID
   */
  async findByDriver(
    driverId: string,
    context: QueryContext,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<VideoEvent>> {
    return this.findWhere({ driver_id: driverId } as Partial<VideoEvent>, context, options)
  }

  /**
   * Find video events by event type
   */
  async findByEventType(
    eventType: string,
    context: QueryContext,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<VideoEvent>> {
    return this.findWhere({ event_type: eventType } as Partial<VideoEvent>, context, options)
  }

  /**
   * Find video events by severity
   */
  async findBySeverity(
    severity: 'low' | 'medium' | 'high' | 'critical',
    context: QueryContext,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<VideoEvent>> {
    return this.findWhere({ severity } as Partial<VideoEvent>, context, options)
  }

  /**
   * Find unreviewed video events
   */
  async findUnreviewed(
    context: QueryContext,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<VideoEvent>> {
    return this.findWhere({ reviewed: false } as Partial<VideoEvent>, context, options)
  }

  /**
   * Mark video event as reviewed
   */
  async markAsReviewed(
    id: string,
    context: QueryContext,
    notes?: string
  ): Promise<VideoEvent> {
    const pool = this.getPool(context)

    const result = await pool.query(
      `UPDATE ${this.tableName}
       SET reviewed = true,
           reviewed_by = $1,
           reviewed_at = NOW(),
           notes = COALESCE($2, notes),
           updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [context.userId, notes, id, context.tenantId]
    )

    if (result.rows.length === 0) {
      throw new Error(`VideoEvent not found`)
    }

    return result.rows[0]
  }

  /**
   * Get video event statistics for a tenant
   */
  async getStatistics(context: QueryContext): Promise<{
    total: number
    by_severity: Record<string, number>
    by_event_type: Record<string, number>
    unreviewed: number
  }> {
    const pool = this.getPool(context)

    // Get total count
    const totalResult = await pool.query(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE tenant_id = $1`,
      [context.tenantId]
    )

    // Get counts by severity
    const severityResult = await pool.query(
      `SELECT severity, COUNT(*) as count
       FROM ${this.tableName}
       WHERE tenant_id = $1 AND severity IS NOT NULL
       GROUP BY severity`,
      [context.tenantId]
    )

    // Get counts by event type
    const eventTypeResult = await pool.query(
      `SELECT event_type, COUNT(*) as count
       FROM ${this.tableName}
       WHERE tenant_id = $1 AND event_type IS NOT NULL
       GROUP BY event_type`,
      [context.tenantId]
    )

    // Get unreviewed count
    const unreviewedResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM ${this.tableName}
       WHERE tenant_id = $1 AND reviewed = false`,
      [context.tenantId]
    )

    return {
      total: parseInt(totalResult.rows[0].count, 10),
      by_severity: severityResult.rows.reduce((acc, row) => {
        acc[row.severity] = parseInt(row.count, 10)
        return acc
      }, {} as Record<string, number>),
      by_event_type: eventTypeResult.rows.reduce((acc, row) => {
        acc[row.event_type] = parseInt(row.count, 10)
        return acc
      }, {} as Record<string, number>),
      unreviewed: parseInt(unreviewedResult.rows[0].count, 10)
    }
  }
}
