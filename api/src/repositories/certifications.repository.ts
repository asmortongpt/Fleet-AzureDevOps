
import { Pool } from 'pg'
import { NotFoundError, ValidationError } from '../lib/errors'
import { BaseRepository } from './base/BaseRepository';

export interface Certification {
  id: string
  tenantId: string
  driverId: string
  type: string
  number?: string
  issuingAuthority?: string
  issuedDate?: Date
  expiryDate?: Date
  status: 'active' | 'expired' | 'revoked' | 'pending'
  documentUrl?: string
  verifiedById?: string
  verifiedAt?: Date
  notes?: string
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

/**
 * CertificationsRepository
 */
export class CertificationsRepository extends BaseRepository<Certification> {
  constructor(pool: Pool) {
    super(pool, 'certifications');
  }

  async findById(id: string, tenantId: string): Promise<Certification | null> {
    const result = await this.pool.query(
      `SELECT id, tenant_id AS "tenantId", driver_id AS "driverId", type, number, 
              issuing_authority AS "issuingAuthority", issued_date AS "issuedDate", 
              expiry_date AS "expiryDate", status, document_url AS "documentUrl", 
              verified_by_id AS "verifiedById", verified_at AS "verifiedAt", 
              notes, metadata, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM certifications WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  async findByDriver(driverId: string, tenantId: string): Promise<Certification[]> {
    const result = await this.pool.query(
      `SELECT id, type, number, status, expiry_date AS "expiryDate"
       FROM certifications 
       WHERE driver_id = $1 AND tenant_id = $2 
       ORDER BY expiry_date ASC`,
      [driverId, tenantId]
    )
    return result.rows
  }

  async findByTenant(tenantId: string): Promise<Certification[]> {
    const result = await this.pool.query(
      `SELECT id, driver_id AS "driverId", type, status, expiry_date AS "expiryDate"
       FROM certifications 
       WHERE tenant_id = $1 
       ORDER BY expiry_date ASC`,
      [tenantId]
    )
    return result.rows
  }

  async create(data: Partial<Certification>, tenantId: string): Promise<Certification> {
    if (!data.driverId || !data.type) {
      throw new ValidationError('Driver ID and type are required')
    }

    const result = await this.pool.query(
      `INSERT INTO certifications (
        tenant_id, driver_id, type, number, issuing_authority, issued_date, 
        expiry_date, status, document_url, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, type, status`,
      [
        tenantId,
        data.driverId,
        data.type,
        data.number || null,
        data.issuingAuthority || null,
        data.issuedDate || null,
        data.expiryDate || null,
        data.status || 'pending',
        data.documentUrl || null,
        data.notes || null
      ]
    )
    return result.rows[0]
  }

  async update(id: string, data: Partial<Certification>, tenantId: string): Promise<Certification> {
    const existing = await this.findById(id, tenantId)
    if (!existing) {
      throw new NotFoundError('Certification')
    }

    const result = await this.pool.query(
      `UPDATE certifications 
       SET type = COALESCE($1, type),
           number = COALESCE($2, number),
           status = COALESCE($3, status),
           expiry_date = COALESCE($4, expiry_date),
           updated_at = NOW()
       WHERE id = $5 AND tenant_id = $6
       RETURNING id, type, status`,
      [
        data.type,
        data.number,
        data.status,
        data.expiryDate,
        id,
        tenantId
      ]
    )
    return result.rows[0]
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM certifications WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return (result.rowCount ?? 0) > 0
  }
}