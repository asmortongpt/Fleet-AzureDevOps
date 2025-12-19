/**
 * Break-Glass Repository
 *
 * Provides data access methods for break-glass emergency access sessions.
 * All queries use parameterized placeholders and enforce tenant isolation.
 * 
 * SECURITY CONTROLS:
 * - All queries use parameterized placeholders ($1, $2, etc) - NEVER string concatenation
 * - Tenant isolation enforced through QueryContext
 * - JOIN with users table validates tenant ownership before mutations
 */

import { injectable } from 'inversify';
import { Pool } from 'pg';

import { connectionManager } from '../config/connection-manager';

import { BaseRepository, QueryContext } from './BaseRepository';

export interface BreakGlassSession {
  id: string;
  user_id: string;
  elevated_role_id: string;
  reason: string;
  ticket_reference: string;
  max_duration_minutes: number;
  status: 'pending' | 'active' | 'revoked' | 'expired';
  approved_by?: string;
  approved_at?: Date;
  start_time?: Date;
  end_time?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  name: string;
  just_in_time_elevation_allowed: boolean;
  tenant_id: string;
}

export interface BreakGlassSessionWithDetails extends BreakGlassSession {
  requester_email?: string;
  requester_name?: string;
  role_name?: string;
  minutes_remaining?: number;
}

@injectable()
export class BreakGlassRepository extends BaseRepository<BreakGlassSession> {
  protected tableName = 'break_glass_sessions';
  protected idColumn = 'id';

  private get pool(): Pool {
    return connectionManager.getPool();
  }

  /**
   * Find role by ID with JIT elevation check
   * SECURITY: Validates role belongs to tenant using parameterized query
   */
  async findRoleById(roleId: string, context: QueryContext): Promise<Role | null> {
    const result = await this.pool.query(
      `SELECT id, name, just_in_time_elevation_allowed, tenant_id
       FROM roles
       WHERE id = $1 AND tenant_id = $2`,
      [roleId, context.tenantId]
    );
    return result.rows[0] || null;
  }

  /**
   * Check if user has active or pending elevation
   * SECURITY: Joins with users table to enforce tenant isolation
   */
  async findActiveOrPendingSession(userId: string, context: QueryContext): Promise<BreakGlassSession | null> {
    const result = await this.pool.query(
      `SELECT bg.*
       FROM break_glass_sessions bg
       JOIN users u ON bg.user_id = u.id
       WHERE bg.user_id = $1
         AND u.tenant_id = $2
         AND bg.status IN ('pending', 'active')
       LIMIT 1`,
      [userId, context.tenantId]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new break-glass session request
   * SECURITY: Uses parameterized query to prevent SQL injection
   */
  async createSession(data: {
    user_id: string;
    elevated_role_id: string;
    reason: string;
    ticket_reference: string;
    max_duration_minutes: number;
  }): Promise<BreakGlassSession> {
    const result = await this.pool.query(
      `INSERT INTO break_glass_sessions
       (user_id, elevated_role_id, reason, ticket_reference, max_duration_minutes, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [
        data.user_id,
        data.elevated_role_id,
        data.reason,
        data.ticket_reference,
        data.max_duration_minutes
      ]
    );
    return result.rows[0];
  }

  /**
   * List elevation requests with user and role details
   * SECURITY: Filters by tenant_id through user join with parameterized query
   */
  async findRequestsWithDetails(
    status: string | null,
    context: QueryContext
  ): Promise<BreakGlassSessionWithDetails[]> {
    const result = await this.pool.query(
      `SELECT
         bg.*,
         u.email as requester_email,
         u.first_name || ' ' || u.last_name as requester_name,
         r.name as role_name
       FROM break_glass_sessions bg
       JOIN users u ON bg.user_id = u.id
       JOIN roles r ON bg.elevated_role_id = r.id
       WHERE u.tenant_id = $1
         AND ($2::varchar IS NULL OR bg.status = $2)
       ORDER BY bg.created_at DESC`,
      [context.tenantId, status]
    );
    return result.rows;
  }

  /**
   * Find session by ID with tenant validation
   * SECURITY: Joins with users table to verify tenant ownership
   */
  async findSessionByIdWithTenant(
    sessionId: string,
    context: QueryContext
  ): Promise<(BreakGlassSession & { tenant_id: string }) | null> {
    const result = await this.pool.query(
      `SELECT bg.*, u.tenant_id
       FROM break_glass_sessions bg
       JOIN users u ON bg.user_id = u.id
       WHERE bg.id = $1 AND u.tenant_id = $2`,
      [sessionId, context.tenantId]
    );
    return result.rows[0] || null;
  }

  /**
   * Approve and activate a break-glass session
   * SECURITY: Session must be pre-validated for tenant ownership
   */
  async approveSession(sessionId: string, approvedBy: string, endTime: Date): Promise<void> {
    await this.pool.query(
      `UPDATE break_glass_sessions
       SET status = 'active',
           approved_by = $1,
           approved_at = NOW(),
           start_time = NOW(),
           end_time = $2
       WHERE id = $3`,
      [approvedBy, endTime, sessionId]
    );
  }

  /**
   * Deny a break-glass session
   * SECURITY: Session must be pre-validated for tenant ownership
   */
  async denySession(sessionId: string, deniedBy: string): Promise<void> {
    await this.pool.query(
      `UPDATE break_glass_sessions
       SET status = 'revoked',
           approved_by = $1,
           approved_at = NOW()
       WHERE id = $2`,
      [deniedBy, sessionId]
    );
  }

  /**
   * Create temporary user_role assignment
   * SECURITY: user_id and role_id must be pre-validated for tenant ownership
   */
  async createTemporaryUserRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    expiresAt: Date
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at, is_active)
       VALUES ($1, $2, $3, $4, true)`,
      [userId, roleId, assignedBy, expiresAt]
    );
  }

  /**
   * Revoke a break-glass session
   * SECURITY: Session must be pre-validated for tenant ownership
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.pool.query(
      `UPDATE break_glass_sessions
       SET status = 'revoked',
           end_time = NOW()
       WHERE id = $1`,
      [sessionId]
    );
  }

  /**
   * Deactivate temporary user_role
   * SECURITY: user_id and role_id must be pre-validated for tenant ownership
   */
  async deactivateTemporaryUserRole(userId: string, roleId: string): Promise<void> {
    await this.pool.query(
      `UPDATE user_roles
       SET is_active = false
       WHERE user_id = $1
         AND role_id = $2
         AND expires_at IS NOT NULL`,
      [userId, roleId]
    );
  }

  /**
   * Find active elevations for user
   * SECURITY: Validates user belongs to tenant using parameterized query
   */
  async findActiveElevations(
    userId: string,
    context: QueryContext
  ): Promise<BreakGlassSessionWithDetails[]> {
    const result = await this.pool.query(
      `SELECT
         bg.*,
         r.name as role_name,
         EXTRACT(EPOCH FROM (bg.end_time - NOW())) / 60 as minutes_remaining
       FROM break_glass_sessions bg
       JOIN users u ON bg.user_id = u.id
       JOIN roles r ON bg.elevated_role_id = r.id
       WHERE bg.user_id = $1
         AND u.tenant_id = $2
         AND bg.status = 'active'
         AND bg.end_time > NOW()
       ORDER BY bg.end_time ASC`,
      [userId, context.tenantId]
    );
    return result.rows;
  }

  /**
   * Find FleetAdmin users for notification
   * SECURITY: Filters by tenant_id using parameterized query
   */
  async findFleetAdminUsers(context: QueryContext): Promise<Array<{ id: string }>> {
    const result = await this.pool.query(
      `SELECT DISTINCT u.id
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       WHERE u.tenant_id = $1
         AND r.name = 'FleetAdmin'
         AND ur.is_active = true`,
      [context.tenantId]
    );
    return result.rows;
  }

  /**
   * Create notification for user
   * SECURITY: tenant_id and user_id must be pre-validated
   */
  async createNotification(data: {
    tenant_id: string;
    user_id: string;
    notification_type: string;
    title: string;
    message: string;
    link?: string;
    priority: string;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO notifications (tenant_id, user_id, notification_type, title, message, link, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.tenant_id,
        data.user_id,
        data.notification_type,
        data.title,
        data.message,
        data.link || null,
        data.priority
      ]
    );
  }

  /**
   * Expire active sessions past their end_time
   * Background job - no tenant filter needed as it processes all tenants
   * SECURITY: Uses parameterized query
   */
  async expireActiveSessions(): Promise<void> {
    await this.pool.query(
      `UPDATE break_glass_sessions
       SET status = 'expired'
       WHERE status = 'active'
         AND end_time < NOW()`
    );
  }

  /**
   * Deactivate expired user_roles
   * Background job - no tenant filter needed as it processes all tenants
   * SECURITY: Uses parameterized query
   */
  async deactivateExpiredUserRoles(): Promise<void> {
    await this.pool.query(
      `UPDATE user_roles
       SET is_active = false
       WHERE expires_at IS NOT NULL
         AND expires_at < NOW()
         AND is_active = true`
    );
  }
}
