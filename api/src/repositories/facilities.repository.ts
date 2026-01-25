import { Pool } from 'pg'
import { NotFoundError, ValidationError } from '../lib/errors'
import { BaseRepository } from './base/BaseRepository';

export interface Facility {
    id: string
    name: string
    code?: string
    type: string
    status?: string
    isActive: boolean
    address?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    latitude?: number
    longitude?: number
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    capacity?: number
    currentOccupancy?: number
    operatingHours?: any
    tenantId: string
    createdAt: Date
    updatedAt: Date
}

export class FacilitiesRepository extends BaseRepository<Facility> {
    constructor(pool: Pool) {
        super(pool, 'facilities');
    }

    async findById(id: string, tenantId: string): Promise<Facility | null> {
        const result = await this.pool.query(
            `SELECT id, name, code, type, is_active AS "isActive", address, city, state, 
              zip_code AS "zipCode", country, latitude, longitude, 
              contact_name AS "contactName", contact_email AS "contactEmail", 
              contact_phone AS "contactPhone", capacity, 
              current_occupancy AS "currentOccupancy", 
              operating_hours AS "operatingHours", tenant_id AS "tenantId", 
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM facilities WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        )
        return result.rows[0] || null
    }

    async findByTenant(tenantId: string): Promise<Facility[]> {
        const result = await this.pool.query(
            `SELECT id, name, type, is_active AS "isActive", city, state 
       FROM facilities WHERE tenant_id = $1 ORDER BY name ASC`,
            [tenantId]
        )
        return result.rows
    }

    async create(data: Partial<Facility>, tenantId: string): Promise<Facility> {
        if (!data.name || !data.type) {
            throw new ValidationError('Name and type are required')
        }

        const result = await this.pool.query(
            `INSERT INTO facilities (
        name, code, type, is_active, address, city, state, zip_code, country,
        latitude, longitude, contact_name, contact_email, contact_phone,
        capacity, current_occupancy, operating_hours, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id, name, type, is_active AS "isActive", tenant_id AS "tenantId"`,
            [
                data.name,
                data.code || null,
                data.type,
                data.isActive ?? true,
                data.address || null,
                data.city || null,
                data.state || null,
                data.zipCode || null,
                data.country || 'USA',
                data.latitude || null,
                data.longitude || null,
                data.contactName || null,
                data.contactEmail || null,
                data.contactPhone || null,
                data.capacity || null,
                data.currentOccupancy || 0,
                data.operatingHours || null,
                tenantId
            ]
        )
        return result.rows[0]
    }

    async update(id: string, data: Partial<Facility>, tenantId: string): Promise<Facility> {
        const existing = await this.findById(id, tenantId)
        if (!existing) {
            throw new NotFoundError('Facility')
        }

        const result = await this.pool.query(
            `UPDATE facilities 
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           type = COALESCE($3, type),
           is_active = COALESCE($4, is_active),
           address = COALESCE($5, address),
           city = COALESCE($6, city),
           state = COALESCE($7, state),
           zip_code = COALESCE($8, zip_code),
           contact_name = COALESCE($9, contact_name),
           contact_email = COALESCE($10, contact_email),
           contact_phone = COALESCE($11, contact_phone),
           capacity = COALESCE($12, capacity),
           updated_at = NOW()
       WHERE id = $13 AND tenant_id = $14
       RETURNING id, name, type, is_active AS "isActive"`,
            [
                data.name,
                data.code,
                data.type,
                data.isActive,
                data.address,
                data.city,
                data.state,
                data.zipCode,
                data.contactName,
                data.contactEmail,
                data.contactPhone,
                data.capacity,
                id,
                tenantId
            ]
        )
        return result.rows[0]
    }

    async delete(id: string, tenantId: string): Promise<boolean> {
        const result = await this.pool.query(
            'DELETE FROM facilities WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        )
        return (result.rowCount ?? 0) > 0
    }
}
