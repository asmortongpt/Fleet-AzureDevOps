
import { Pool } from 'pg'
import { NotFoundError, ValidationError } from '../lib/errors'
import { BaseRepository } from './base/BaseRepository';

export interface Vendor {
    id: string
    tenantId: string
    name: string
    code?: string
    type?: string
    isActive: boolean
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    website?: string
    taxId?: string
    paymentTerms?: string
    preferredVendor: boolean
    rating?: number
    notes?: string
    metadata?: any
    createdAt: Date
    updatedAt: Date
}

/**
 * VendorsRepository
 */
export class VendorsRepository extends BaseRepository<Vendor> {
    constructor(pool: Pool) {
        super(pool, 'vendors');
    }

    async findById(id: string, tenantId: string): Promise<Vendor | null> {
        const result = await this.pool.query(
            `SELECT id, tenant_id AS "tenantId", name, code, type, is_active AS "isActive", 
              contact_name AS "contactName", contact_email AS "contactEmail", 
              contact_phone AS "contactPhone", address, city, state, zip_code AS "zipCode", 
              country, website, tax_id AS "taxId", payment_terms AS "paymentTerms", 
              preferred_vendor AS "preferredVendor", rating, notes, 
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM vendors WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        )
        return result.rows[0] || null
    }

    async findByTenant(tenantId: string): Promise<Vendor[]> {
        const result = await this.pool.query(
            `SELECT id, name, type, is_active AS "isActive", contact_email AS "contactEmail"
       FROM vendors WHERE tenant_id = $1 ORDER BY name ASC`,
            [tenantId]
        )
        return result.rows
    }

    async create(data: Partial<Vendor>, tenantId: string): Promise<Vendor> {
        if (!data.name) {
            throw new ValidationError('Vendor name is required')
        }

        const result = await this.pool.query(
            `INSERT INTO vendors (
        tenant_id, name, code, type, is_active, contact_name, contact_email, 
        contact_phone, address, city, state, zip_code, country, website, 
        tax_id, payment_terms, preferred_vendor, rating, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id, name, type, is_active AS "isActive"`,
            [
                tenantId,
                data.name,
                data.code || null,
                data.type || null,
                data.isActive ?? true,
                data.contactName || null,
                data.contactEmail || null,
                data.contactPhone || null,
                data.address || null,
                data.city || null,
                data.state || null,
                data.zipCode || null,
                data.country || 'USA',
                data.website || null,
                data.taxId || null,
                data.paymentTerms || null,
                data.preferredVendor ?? false,
                data.rating || null,
                data.notes || null
            ]
        )
        return result.rows[0]
    }

    async update(id: string, data: Partial<Vendor>, tenantId: string): Promise<Vendor> {
        const existing = await this.findById(id, tenantId)
        if (!existing) {
            throw new NotFoundError('Vendor')
        }

        const result = await this.pool.query(
            `UPDATE vendors 
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           is_active = COALESCE($3, is_active),
           contact_name = COALESCE($4, contact_name),
           contact_email = COALESCE($5, contact_email),
           rating = COALESCE($6, rating),
           updated_at = NOW()
       WHERE id = $7 AND tenant_id = $8
       RETURNING id, name, type, is_active AS "isActive"`,
            [
                data.name,
                data.type,
                data.isActive,
                data.contactName,
                data.contactEmail,
                data.rating,
                id,
                tenantId
            ]
        )
        return result.rows[0]
    }

    async delete(id: string, tenantId: string): Promise<boolean> {
        const result = await this.pool.query(
            'DELETE FROM vendors WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        )
        return (result.rowCount ?? 0) > 0
    }
}
