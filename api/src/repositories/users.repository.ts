
import { Pool } from 'pg'

import { NotFoundError, ValidationError } from '../lib/errors'
import { BaseRepository } from '../repositories/BaseRepository';
import { FIPSCryptoService } from '../services/fips-crypto.service'

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface User {
  id: string
  tenant_id: string
  email: string
  password_hash: string
  first_name: string
  last_name: string
  phone?: string
  role: 'admin' | 'fleet_manager' | 'driver' | 'technician' | 'viewer'
  is_active: boolean
  failed_login_attempts: number
  account_locked_until?: Date
  last_login_at?: Date
  mfa_enabled: boolean
  mfa_secret?: string
  sso_provider?: string
  sso_provider_id?: string
  created_at: Date
  updated_at: Date
}

export interface CreateUserData {
  email: string
  password?: string
  first_name: string
  last_name: string
  phone?: string
  role?: 'admin' | 'fleet_manager' | 'driver' | 'technician' | 'viewer'
  sso_provider?: string
  sso_provider_id?: string
}

export interface UpdateUserData {
  email?: string
  password?: string
  first_name?: string
  last_name?: string
  phone?: string
  role?: 'admin' | 'fleet_manager' | 'driver' | 'technician' | 'viewer'
  is_active?: boolean
  mfa_enabled?: boolean
  mfa_secret?: string
}

/**
 * UsersRepository - B3
 * All queries use parameterized statements ($1, $2, $3)
 * All operations enforce tenant isolation
 * Provides auth-specific methods for login, registration, token management
 */
export class UsersRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Find user by ID with tenant isolation
   */
  async findById(id: string, tenantId: string): Promise<User | null> {
    const result = await this.pool.query(
      `SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, 
              failed_login_attempts, account_locked_until, last_login_at, mfa_enabled, 
              created_at, updated_at, sso_provider, sso_provider_id
       FROM users 
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Find user by email (for login - no tenant filter needed initially)
   */
  async findByEmail(email: string, tenantId?: string): Promise<User | null> {
    let query: string
    let params: any[]

    if (tenantId) {
      query = `SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, 
                      password_hash, failed_login_attempts, account_locked_until, last_login_at, 
                      mfa_enabled, created_at, updated_at, sso_provider, sso_provider_id
               FROM users 
               WHERE email = $1 AND tenant_id = $2 AND is_active = true`
      params = [email.toLowerCase(), tenantId]
    } else {
      // For login: check globally first, get tenant from user record
      query = `SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, 
                      password_hash, failed_login_attempts, account_locked_until, last_login_at, 
                      mfa_enabled, created_at, updated_at, sso_provider, sso_provider_id
               FROM users 
               WHERE email = $1 AND is_active = true`
      params = [email.toLowerCase()]
    }

    const result = await this.pool.query(query, params)
    return result.rows[0] || null
  }

  /**
   * Check if email exists (for registration validation)
   */
  async emailExists(email: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )
    return result.rows.length > 0
  }

  /**
   * Validate password for a user
   */
  async validatePassword(userId: string, password: string, tenantId: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT password_hash FROM users WHERE id = $1 AND tenant_id = $2',
      [userId, tenantId]
    )
    
    if (result.rows.length === 0) {
      return false
    }

    return await FIPSCryptoService.verifyPassword(password, result.rows[0].password_hash)
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedLogins(userId: string, tenantId: string): Promise<number> {
    const result = await this.pool.query(
      `UPDATE users 
       SET failed_login_attempts = failed_login_attempts + 1
       WHERE id = $1 AND tenant_id = $2
       RETURNING failed_login_attempts`,
      [userId, tenantId]
    )
    return result.rows[0]?.failed_login_attempts || 0
  }

  /**
   * Lock account after too many failed attempts
   */
  async lockAccount(userId: string, tenantId: string, lockUntil: Date): Promise<void> {
    await this.pool.query(
      `UPDATE users 
       SET account_locked_until = $1
       WHERE id = $2 AND tenant_id = $3`,
      [lockUntil, userId, tenantId]
    )
  }

  /**
   * Update failed login attempts and lock status
   */
  async updateFailedLoginAttempts(
    userId: string, 
    tenantId: string, 
    attempts: number, 
    lockedUntil: Date | null
  ): Promise<void> {
    await this.pool.query(
      `UPDATE users
       SET failed_login_attempts = $1,
           account_locked_until = $2
       WHERE id = $3 AND tenant_id = $4`,
      [attempts, lockedUntil, userId, tenantId]
    )
  }

  /**
   * Reset failed login attempts and update last login
   */
  async updateLastLogin(userId: string, tenantId: string): Promise<void> {
    await this.pool.query(
      `UPDATE users
       SET failed_login_attempts = 0,
           account_locked_until = NULL,
           last_login_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    )
  }

  /**
   * Create new user
   */
  async create(data: CreateUserData, tenantId: string): Promise<User> {
    // Validate required fields
    if (!data.email || !data.first_name || !data.last_name) {
      throw new ValidationError('Email, first name, and last name are required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      throw new ValidationError('Invalid email format')
    }

    // Check for duplicate email
    const exists = await this.emailExists(data.email)
    if (exists) {
      throw new ValidationError(`User with email ${data.email} already exists`)
    }

    // Hash password if provided, otherwise use SSO placeholder
    let passwordHash: string
    if (data.password) {
      passwordHash = await FIPSCryptoService.hashPassword(data.password)
    } else {
      passwordHash = 'SSO' // SSO users don't have password
    }

    const result = await this.pool.query(
      `INSERT INTO users (
        tenant_id, email, password_hash, first_name, last_name, phone, role,
        sso_provider, sso_provider_id, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      RETURNING id, tenant_id, email, first_name, last_name, role, phone, is_active, 
                created_at, updated_at, sso_provider, sso_provider_id`,
      [
        tenantId,
        data.email.toLowerCase(),
        passwordHash,
        data.first_name,
        data.last_name,
        data.phone || null,
        data.role || 'viewer',
        data.sso_provider || null,
        data.sso_provider_id || null
      ]
    )
    return result.rows[0]
  }

  /**
   * Update user
   */
  async update(
    userId: string,
    data: UpdateUserData,
    tenantId: string
  ): Promise<User> {
    const existing = await this.findById(userId, tenantId)
    if (!existing) {
      throw new NotFoundError('User')
    }

    // Validate email format if provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        throw new ValidationError('Invalid email format')
      }
    }

    // Hash password if provided
    let passwordHash: string | undefined
    if (data.password) {
      passwordHash = await FIPSCryptoService.hashPassword(data.password)
    }

    const result = await this.pool.query(
      `UPDATE users 
       SET email = COALESCE($1, email),
           password_hash = COALESCE($2, password_hash),
           first_name = COALESCE($3, first_name),
           last_name = COALESCE($4, last_name),
           phone = COALESCE($5, phone),
           role = COALESCE($6, role),
           is_active = COALESCE($7, is_active),
           mfa_enabled = COALESCE($8, mfa_enabled),
           mfa_secret = COALESCE($9, mfa_secret),
           updated_at = NOW()
       WHERE id = $10 AND tenant_id = $11
       RETURNING id, tenant_id, email, first_name, last_name, role, is_active, phone, 
                 created_at, updated_at, mfa_enabled, sso_provider, sso_provider_id`,
      [
        data.email?.toLowerCase(),
        passwordHash,
        data.first_name,
        data.last_name,
        data.phone,
        data.role,
        data.is_active,
        data.mfa_enabled,
        data.mfa_secret,
        userId,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Delete user
   */
  async delete(userId: string, tenantId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM users WHERE id = $1 AND tenant_id = $2',
      [userId, tenantId]
    )
    return (result.rowCount ?? 0) > 0
  }

  /**
   * Get default tenant ID (for registration/SSO)
   */
  async getDefaultTenantId(): Promise<string | null> {
    const result = await this.pool.query(
      'SELECT id FROM tenants ORDER BY created_at LIMIT 1'
    )
    return result.rows[0]?.id || null
  }

  /**
   * Create default tenant if none exists
   */
  async createDefaultTenant(): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO tenants (name, domain) 
       VALUES ($1, $2) 
       RETURNING id`,
      ['Default Tenant', 'default']
    )
    return result.rows[0].id
  }

  /**
   * Get or create default tenant
   */
  async getOrCreateDefaultTenant(): Promise<string> {
    let tenantId = await this.getDefaultTenantId()
    if (!tenantId) {
      tenantId = await this.createDefaultTenant()
    }
    return tenantId
  }

  /**
   * Find all users for a tenant with pagination
   */
  async findByTenant(
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<User[]> {
    const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'desc' } = pagination
    const offset = (page - 1) * limit

    const allowedSortColumns = ['id', 'email', 'first_name', 'last_name', 'role', 'created_at']
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at'
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const result = await this.pool.query(
      `SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, 
              failed_login_attempts, account_locked_until, last_login_at, mfa_enabled, 
              created_at, updated_at, sso_provider, sso_provider_id
       FROM users 
       WHERE tenant_id = $1 
       ORDER BY ${safeSortBy} ${safeSortOrder} 
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    )
    return result.rows
  }

  /**
   * Count users for a tenant
   */
  async count(tenantId: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) FROM users WHERE tenant_id = $1',
      [tenantId]
    )
    return parseInt(result.rows[0].count, 10)
  }

  /**
   * Search users by keyword
   */
  async search(keyword: string, tenantId: string): Promise<User[]> {
    const searchTerm = `%${keyword}%`
    const result = await this.pool.query(
      `SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, 
              created_at, updated_at, sso_provider, sso_provider_id
       FROM users 
       WHERE tenant_id = $1 
       AND (
         email ILIKE $2 OR 
         first_name ILIKE $2 OR 
         last_name ILIKE $2
       )
       ORDER BY last_name ASC`,
      [tenantId, searchTerm]
    )
    return result.rows
  }

  /**
   * Store refresh token
   */
  async storeRefreshToken(
    userId: string, 
    tenantId: string, 
    tokenHash: string, 
    expiresAt: Date
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO refresh_tokens (user_id, tenant_id, token_hash, expires_at, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId, tenantId, tokenHash, expiresAt]
    )
  }

  /**
   * Find refresh token
   */
  async findRefreshToken(
    userId: string, 
    tenantId: string, 
    tokenHash: string
  ): Promise<any | null> {
    const result = await this.pool.query(
      `SELECT id, user_id, token_hash, expires_at, created_at 
       FROM refresh_tokens
       WHERE user_id = $1 AND tenant_id = $2 AND token_hash = $3 
       AND revoked_at IS NULL AND expires_at > NOW()`,
      [userId, tenantId, tokenHash]
    )
    return result.rows[0] || null
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(tokenHash: string, tenantId: string): Promise<void> {
    await this.pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND tenant_id = $2',
      [tokenHash, tenantId]
    )
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllRefreshTokens(userId: string, tenantId: string): Promise<void> {
    await this.pool.query(
      `UPDATE refresh_tokens SET revoked_at = NOW()
       WHERE user_id = $1 AND tenant_id = $2 AND revoked_at IS NULL`,
      [userId, tenantId]
    )
  }

  /**
   * Revoke expired refresh tokens for a user
   */
  async revokeExpiredRefreshTokens(userId: string, tenantId: string): Promise<void> {
    await this.pool.query(
      `UPDATE refresh_tokens SET revoked_at = NOW()
       WHERE user_id = $1 AND tenant_id = $2 AND expires_at < NOW() AND revoked_at IS NULL`,
      [userId, tenantId]
    )
  }
}

export const createUsersRepository = (pool: Pool) => new UsersRepository(pool)
