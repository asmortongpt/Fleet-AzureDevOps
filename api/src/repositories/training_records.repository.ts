
import { Pool } from 'pg'
import { NotFoundError, ValidationError } from '../lib/errors'
import { BaseRepository } from './base/BaseRepository';

export interface TrainingRecord {
    id: string
    tenantId: string
    driverId: string
    trainingName: string
    trainingType?: string
    provider?: string
    instructorName?: string
    startDate?: Date
    endDate?: Date
    completionDate?: Date
    status: 'enrolled' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
    passed: boolean
    score?: number
    certificateNumber?: string
    certificateUrl?: string
    expiryDate?: Date
    hoursCompleted?: number
    cost?: number
    notes?: string
    metadata?: any
    createdAt: Date
    updatedAt: Date
}

/**
 * TrainingRecordsRepository
 */
export class TrainingRecordsRepository extends BaseRepository<TrainingRecord> {
    constructor(pool: Pool) {
        super(pool, 'training_records');
    }

    async findById(id: string, tenantId: string): Promise<TrainingRecord | null> {
        const result = await this.pool.query(
            `SELECT id, tenant_id AS "tenantId", driver_id AS "driverId", 
              training_name AS "trainingName", training_type AS "trainingType", 
              provider, instructor_name AS "instructorName", 
              start_date AS "startDate", end_date AS "endDate", 
              completion_date AS "completionDate", status, passed, score, 
              certificate_number AS "certificateNumber", 
              certificate_url AS "certificateUrl", expiry_date AS "expiryDate", 
              hours_completed AS "hoursCompleted", cost, notes, metadata, 
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM training_records WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        )
        return result.rows[0] || null
    }

    async findByDriver(driverId: string, tenantId: string): Promise<TrainingRecord[]> {
        const result = await this.pool.query(
            `SELECT id, training_name AS "trainingName", status, completion_date AS "completionDate"
       FROM training_records 
       WHERE driver_id = $1 AND tenant_id = $2 
       ORDER BY completion_date DESC`,
            [driverId, tenantId]
        )
        return result.rows
    }

    async findByTenant(tenantId: string): Promise<TrainingRecord[]> {
        const result = await this.pool.query(
            `SELECT id, driver_id AS "driverId", training_name AS "trainingName", status, 
              completion_date AS "completionDate"
       FROM training_records 
       WHERE tenant_id = $1 
       ORDER BY completion_date DESC`,
            [tenantId]
        )
        return result.rows
    }

    async create(data: Partial<TrainingRecord>, tenantId: string): Promise<TrainingRecord> {
        if (!data.driverId || !data.trainingName) {
            throw new ValidationError('Driver ID and training name are required')
        }

        const result = await this.pool.query(
            `INSERT INTO training_records (
        tenant_id, driver_id, training_name, training_type, provider, 
        instructor_name, start_date, end_date, completion_date, status, 
        passed, score, certificate_number, certificate_url, expiry_date, 
        hours_completed, cost, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id, training_name AS "trainingName", status`,
            [
                tenantId,
                data.driverId,
                data.trainingName,
                data.trainingType || null,
                data.provider || null,
                data.instructorName || null,
                data.startDate || null,
                data.endDate || null,
                data.completionDate || null,
                data.status || 'enrolled',
                data.passed ?? false,
                data.score || null,
                data.certificateNumber || null,
                data.certificateUrl || null,
                data.expiryDate || null,
                data.hoursCompleted || null,
                data.cost || null,
                data.notes || null
            ]
        )
        return result.rows[0]
    }

    async update(id: string, data: Partial<TrainingRecord>, tenantId: string): Promise<TrainingRecord> {
        const existing = await this.findById(id, tenantId)
        if (!existing) {
            throw new NotFoundError('TrainingRecord')
        }

        const result = await this.pool.query(
            `UPDATE training_records 
       SET training_name = COALESCE($1, training_name),
           status = COALESCE($2, status),
           passed = COALESCE($3, passed),
           completion_date = COALESCE($4, completion_date),
           updated_at = NOW()
       WHERE id = $5 AND tenant_id = $6
       RETURNING id, training_name AS "trainingName", status`,
            [
                data.trainingName,
                data.status,
                data.passed,
                data.completionDate,
                id,
                tenantId
            ]
        )
        return result.rows[0]
    }

    async delete(id: string, tenantId: string): Promise<boolean> {
        const result = await this.pool.query(
            'DELETE FROM training_records WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        )
        return (result.rowCount ?? 0) > 0
    }
}
