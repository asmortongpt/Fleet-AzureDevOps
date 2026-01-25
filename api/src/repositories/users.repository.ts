
import { Pool } from 'pg'
import { NotFoundError, ValidationError } from '../lib/errors'
import { BaseRepository } from './base/BaseRepository';

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface User {
  id: string
  tenantId: string
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  phone?: string
  role: string
  isActive: boolean
  lastLoginAt?: Date
  azureAdObjectId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserData {
  email: string
  password?: string
  firstName: string
  lastName: string
  phone?: string
  role?: string
  azureAdObjectId?: string
}

export interface UpdateUserData {
  email?: string
  password?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: string
  isActive?: boolean
}

/**
 * UsersRepository - B3
 * All queries use parameterized statements ($1, $2, $3)
 * All operations enforce tenant isolation
 */
export class UsersRepository extends BaseRepository<User> {
  constructor(pool: Pool) {
    super(pool, 'users');
  }

  /**
   * Find user by ID with tenant isolation
   */
  async findById(id: string, tenantId: string): Promise<User | null> {
    const result = await this.pool.query(
      `SELECT id, tenant_id AS "tenantId", email, first_name AS "firstName", 
              last_name AS "lastName", role, is_active AS "isActive", phone, 
              last_login_at AS "lastLoginAt", azure_ad_object_id AS "azureAdObjectId",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM users 
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string, tenantId?: string): Promise<User | null> {
    let query: string
    let params: any[]

    if (tenantId) {
      query = `SELECT id, tenant_id AS "tenantId", email, password_hash AS "passwordHash",
                      first_name AS "firstName", last_name AS "lastName", role, 
                      is_active AS "isActive", phone, last_login_at AS "lastLoginAt",
                      azure_ad_object_id AS "azureAdObjectId", created_at AS "createdAt", 
                      updated_at AS "updatedAt"
               FROM users 
               WHERE email = $1 AND tenant_id = $2 AND is_active = true`
      params = [email.toLowerCase(), tenantId]
    } else {
      query = `SELECT id, tenant_id AS "tenantId", email, password_hash AS "passwordHash",
                      first_name AS "firstName", last_name AS "lastName", role, 
                      is_active AS "isActive", phone, last_login_at AS "lastLoginAt",
                      azure_ad_object_id AS "azureAdObjectId", created_at AS "createdAt", 
                      updated_at AS "updatedAt"
               FROM users 
               WHERE email = $1 AND is_active = true`
      params = [email.toLowerCase()]
    }

    const result = await this.pool.query(query, params)
    return result.rows[0] || null
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )
    return result.rows.length > 0
  }

  /**
   * Reset failed login attempts and update last login
   */
  async updateLastLogin(userId: string, tenantId: string): Promise<void> {
    await this.pool.query(
      `UPDATE users
       SET last_login_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    )
  }

  /**
   * Create new user
   */
  async create(data: CreateUserData, tenantId: string): Promise<User> {
    if (!data.email || !data.firstName || !data.lastName) {
      throw new ValidationError('Email, first name, and last name are required')
    }

    const result = await this.pool.query(
      `INSERT INTO users (
        tenant_id, email, password_hash, first_name, last_name, phone, role,
        azure_ad_object_id, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING id, tenant_id AS "tenantId", email, first_name AS "firstName", 
                last_name AS "lastName", role, phone, is_active AS "isActive", 
                created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        tenantId,
        data.email.toLowerCase(),
        data.password || 'SSO', // Placeholder if no password
        data.firstName,
        data.lastName,
        data.phone || null,
        data.role || 'viewer',
        data.azureAdObjectId || null
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

    const result = await this.pool.query(
      `UPDATE users 
       SET email = COALESCE($1, email),
           password_hash = COALESCE($2, password_hash),
           first_name = COALESCE($3, first_name),
           last_name = COALESCE($4, last_name),
           phone = COALESCE($5, phone),
           role = COALESCE($6, role),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $8 AND tenant_id = $9
       RETURNING id, tenant_id AS "tenantId", email, first_name AS "firstName", 
                 last_name AS "lastName", role, is_active AS "isActive", phone, 
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.email?.toLowerCase(),
        data.password,
        data.firstName,
        data.lastName,
        data.phone,
        data.role,
        data.isActive,
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
      `SELECT id, tenant_id AS "tenantId", email, first_name AS "firstName", 
              last_name AS "lastName", role, is_active AS "isActive", phone, 
              last_login_at AS "lastLoginAt", created_at AS "createdAt", 
              updated_at AS "updatedAt"
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
  async count(filters: Record<string, unknown> = {}, tenantId: string): Promise<number> {
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
      `SELECT id, tenant_id AS "tenantId", email, first_name AS "firstName", 
              last_name AS "lastName", role, is_active AS "isActive", phone, 
              created_at AS "createdAt", updated_at AS "updatedAt"
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
}

export const createUsersRepository = (pool: Pool) => new UsersRepository(pool)
