import { injectable, inject } from 'inversify';
import { Pool } from 'pg';

import { TYPES } from '../types';

/**
 * FueltransactionService - Business Logic Layer for Fueltransaction Operations
 * Extracted from route handlers for better separation of concerns
 *
 * NOTE: All IDs are UUIDs (string type), not integers
 */
@injectable()
export class FueltransactionService {
  constructor(@inject(TYPES.DatabasePool) private db: Pool) { }

  async getAll(tenantId: string | number, filters?: any) {
    const query = `
      SELECT *
      FROM fuel_transactions
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query, [tenantId]);
    return result.rows;
  }

  async getById(id: string | number, tenantId: string | number) {
    const query = `
      SELECT *
      FROM fuel_transactions
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.db.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async create(data: any, tenantId: string | number) {
    // TODO: Add business validation logic here
    // Extract fields from data object to match actual schema
    const {
      vehicle_id,
      driver_id,
      transaction_date,
      fuel_type,
      gallons,
      cost_per_gallon,
      total_cost,
      odometer,
      location,
      latitude,
      longitude,
      vendor_name,
      receipt_number,
      receipt_url,
      payment_method,
      card_last4,
      notes,
      metadata
    } = data;

    const query = `
      INSERT INTO fuel_transactions (
        tenant_id, vehicle_id, driver_id, transaction_date, fuel_type,
        gallons, cost_per_gallon, total_cost, odometer, location,
        latitude, longitude, vendor_name, receipt_number, receipt_url,
        payment_method, card_last4, notes, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `;
    const result = await this.db.query(query, [
      tenantId, vehicle_id, driver_id, transaction_date, fuel_type,
      gallons, cost_per_gallon, total_cost, odometer, location,
      latitude, longitude, vendor_name, receipt_number, receipt_url,
      payment_method, card_last4, notes, metadata ? JSON.stringify(metadata) : '{}'
    ]);
    return result.rows[0];
  }

  async update(id: string | number, data: any, tenantId: string | number) {
    // Verify ownership
    const existing = await this.getById(id, tenantId);
    if (!existing) {
      throw new Error('Fueltransaction not found or access denied');
    }

    // Build dynamic SET clause based on provided fields
    const allowedFields = [
      'vehicle_id', 'driver_id', 'transaction_date', 'fuel_type', 'gallons',
      'cost_per_gallon', 'total_cost', 'odometer', 'location', 'latitude',
      'longitude', 'vendor_name', 'receipt_number', 'receipt_url',
      'payment_method', 'card_last4', 'notes', 'metadata'
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCounter}`);
        values.push(field === 'metadata' ? JSON.stringify(data[field]) : data[field]);
        paramCounter++;
      }
    }

    if (updates.length === 0) {
      return existing; // No updates provided
    }

    updates.push(`updated_at = NOW()`);
    values.push(id, tenantId);

    const query = `
      UPDATE fuel_transactions
      SET ${updates.join(', ')}
      WHERE id = $${paramCounter} AND tenant_id = $${paramCounter + 1}
      RETURNING *
    `;
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async delete(id: string | number, tenantId: string | number) {
    // Hard delete since table doesn't have deleted_at column
    const query = `
      DELETE FROM fuel_transactions
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const result = await this.db.query(query, [id, tenantId]);
    return (result.rowCount ?? 0) > 0;
  }
}

