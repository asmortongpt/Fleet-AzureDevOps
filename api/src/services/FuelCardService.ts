import { injectable, inject } from 'inversify';
import { Pool } from 'pg';
import crypto from 'crypto';
import { TYPES } from '../types';
import {
  FuelCard,
  FuelCardProvider,
  FuelCardTransaction,
  CreateFuelCardInput,
  CreateFuelCardProviderInput,
  CreateFuelCardTransactionInput,
  UpdateFuelCardInput,
  UpdateFuelCardProviderInput,
  UpdateFuelCardTransactionInput,
  FuelCardTransactionFilters,
  FuelCardUtilization,
  PaginationParams
} from '../types/fuel-cards';

/**
 * FuelCardService - Business Logic Layer for Fuel Card Operations
 * Handles providers, cards, and transactions with proper separation of concerns
 */
@injectable()
export class FuelCardService {
  constructor(@inject(TYPES.DatabasePool) private db: Pool) {}

  // ============================================================================
  // Fuel Card Providers
  // ============================================================================

  async getAllProviders(tenantId: string): Promise<FuelCardProvider[]> {
    const query = `
      SELECT * FROM fuel_card_providers
      WHERE tenant_id = $1
      ORDER BY provider_name ASC
    `;
    const result = await this.db.query(query, [tenantId]);
    return result.rows;
  }

  async getProviderById(id: string, tenantId: string): Promise<FuelCardProvider | null> {
    const query = `
      SELECT * FROM fuel_card_providers
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.db.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async createProvider(data: CreateFuelCardProviderInput, tenantId: string): Promise<FuelCardProvider> {
    const {
      provider_name,
      api_endpoint,
      api_key,
      account_number,
      is_active = true,
      sync_frequency_minutes = 60,
      metadata = {}
    } = data;

    const api_key_encrypted = api_key ? this.encryptApiKey(api_key) : null;

    const query = `
      INSERT INTO fuel_card_providers (
        tenant_id, provider_name, api_endpoint, api_key_encrypted,
        account_number, is_active, sync_frequency_minutes, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await this.db.query(query, [
      tenantId,
      provider_name,
      api_endpoint,
      api_key_encrypted,
      account_number,
      is_active,
      sync_frequency_minutes,
      JSON.stringify(metadata)
    ]);

    return result.rows[0];
  }

  async updateProvider(id: string, data: UpdateFuelCardProviderInput, tenantId: string): Promise<FuelCardProvider | null> {
    const existing = await this.getProviderById(id, tenantId);
    if (!existing) {
      return null;
    }

    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramCounter = 1;

    const allowedFields: (keyof UpdateFuelCardProviderInput)[] = [
      'provider_name', 'api_endpoint', 'account_number', 'is_active', 'sync_frequency_minutes', 'metadata'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'metadata') {
          updates.push(`${field} = $${paramCounter++}`);
          values.push(JSON.stringify(data[field]));
        } else {
          updates.push(`${field} = $${paramCounter++}`);
          values.push(data[field]);
        }
      }
    }

    // Handle API key separately (needs encryption)
    if (data.api_key !== undefined) {
      updates.push(`api_key_encrypted = $${paramCounter++}`);
      values.push(data.api_key ? this.encryptApiKey(data.api_key) : null);
    }

    if (updates.length === 0) {
      return existing;
    }

    values.push(id, tenantId);
    const query = `
      UPDATE fuel_card_providers
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCounter++} AND tenant_id = $${paramCounter++}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  // ============================================================================
  // Fuel Cards
  // ============================================================================

  async getAllCards(tenantId: string, filters?: { status?: string; vehicle_id?: string; driver_id?: string }): Promise<FuelCard[]> {
    let query = `SELECT * FROM fuel_cards WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    let paramCounter = 2;

    if (filters?.status) {
      query += ` AND status = $${paramCounter++}`;
      params.push(filters.status);
    }

    if (filters?.vehicle_id) {
      query += ` AND vehicle_id = $${paramCounter++}`;
      params.push(filters.vehicle_id);
    }

    if (filters?.driver_id) {
      query += ` AND driver_id = $${paramCounter++}`;
      params.push(filters.driver_id);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async getCardById(id: string, tenantId: string): Promise<FuelCard | null> {
    const query = `
      SELECT * FROM fuel_cards
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.db.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async createCard(data: CreateFuelCardInput, tenantId: string): Promise<FuelCard> {
    const {
      provider_id,
      card_number,
      card_last4,
      vehicle_id,
      driver_id,
      status = 'active',
      issue_date,
      expiry_date,
      daily_limit,
      weekly_limit,
      monthly_limit,
      allowed_fuel_types,
      allowed_product_codes,
      pin_required = true,
      odometer_required = true,
      metadata = {}
    } = data;

    const card_number_encrypted = this.encryptCardNumber(card_number);

    const query = `
      INSERT INTO fuel_cards (
        tenant_id, provider_id, card_number_encrypted, card_last4,
        vehicle_id, driver_id, status, issue_date, expiry_date,
        daily_limit, weekly_limit, monthly_limit,
        allowed_fuel_types, allowed_product_codes,
        pin_required, odometer_required, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const result = await this.db.query(query, [
      tenantId,
      provider_id,
      card_number_encrypted,
      card_last4,
      vehicle_id || null,
      driver_id || null,
      status,
      issue_date,
      expiry_date,
      daily_limit || null,
      weekly_limit || null,
      monthly_limit || null,
      allowed_fuel_types || null,
      allowed_product_codes || null,
      pin_required,
      odometer_required,
      JSON.stringify(metadata)
    ]);

    return result.rows[0];
  }

  async updateCard(id: string, data: UpdateFuelCardInput, tenantId: string): Promise<FuelCard | null> {
    const existing = await this.getCardById(id, tenantId);
    if (!existing) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    const allowedFields: (keyof UpdateFuelCardInput)[] = [
      'vehicle_id', 'driver_id', 'status', 'expiry_date',
      'daily_limit', 'weekly_limit', 'monthly_limit',
      'allowed_fuel_types', 'allowed_product_codes',
      'pin_required', 'odometer_required', 'metadata'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'metadata') {
          updates.push(`${field} = $${paramCounter++}`);
          values.push(JSON.stringify(data[field]));
        } else {
          updates.push(`${field} = $${paramCounter++}`);
          values.push(data[field]);
        }
      }
    }

    if (updates.length === 0) {
      return existing;
    }

    values.push(id, tenantId);
    const query = `
      UPDATE fuel_cards
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCounter++} AND tenant_id = $${paramCounter++}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async deleteCard(id: string, tenantId: string): Promise<boolean> {
    // Soft delete by setting status to 'suspended'
    const result = await this.updateCard(id, { status: 'suspended' }, tenantId);
    return result !== null;
  }

  // ============================================================================
  // Fuel Card Transactions
  // ============================================================================

  async getCardTransactions(
    cardId: string,
    tenantId: string,
    pagination?: PaginationParams
  ): Promise<{ data: FuelCardTransaction[]; total: number }> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM fuel_card_transactions
      WHERE fuel_card_id = $1 AND tenant_id = $2
    `;
    const countResult = await this.db.query(countQuery, [cardId, tenantId]);
    const total = parseInt(countResult.rows[0].total, 10);

    const query = `
      SELECT * FROM fuel_card_transactions
      WHERE fuel_card_id = $1 AND tenant_id = $2
      ORDER BY transaction_date DESC
      LIMIT $3 OFFSET $4
    `;
    const result = await this.db.query(query, [cardId, tenantId, pageSize, offset]);

    return { data: result.rows, total };
  }

  async getAllTransactions(
    tenantId: string,
    filters?: FuelCardTransactionFilters,
    pagination?: PaginationParams
  ): Promise<{ data: FuelCardTransaction[]; total: number }> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let whereConditions = ['tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramCounter = 2;

    if (filters?.fuel_card_id) {
      whereConditions.push(`fuel_card_id = $${paramCounter++}`);
      params.push(filters.fuel_card_id);
    }

    if (filters?.vehicle_id) {
      whereConditions.push(`vehicle_id = $${paramCounter++}`);
      params.push(filters.vehicle_id);
    }

    if (filters?.driver_id) {
      whereConditions.push(`driver_id = $${paramCounter++}`);
      params.push(filters.driver_id);
    }

    if (filters?.reconciliation_status) {
      if (Array.isArray(filters.reconciliation_status)) {
        whereConditions.push(`reconciliation_status = ANY($${paramCounter++})`);
        params.push(filters.reconciliation_status);
      } else {
        whereConditions.push(`reconciliation_status = $${paramCounter++}`);
        params.push(filters.reconciliation_status);
      }
    }

    if (filters?.is_disputed !== undefined) {
      whereConditions.push(`is_disputed = $${paramCounter++}`);
      params.push(filters.is_disputed);
    }

    if (filters?.start_date) {
      whereConditions.push(`transaction_date >= $${paramCounter++}`);
      params.push(filters.start_date);
    }

    if (filters?.end_date) {
      whereConditions.push(`transaction_date <= $${paramCounter++}`);
      params.push(filters.end_date);
    }

    if (filters?.min_amount) {
      whereConditions.push(`total_cost >= $${paramCounter++}`);
      params.push(filters.min_amount);
    }

    if (filters?.max_amount) {
      whereConditions.push(`total_cost <= $${paramCounter++}`);
      params.push(filters.max_amount);
    }

    if (filters?.search) {
      whereConditions.push(`(merchant_name ILIKE $${paramCounter} OR location ILIKE $${paramCounter})`);
      params.push(`%${filters.search}%`);
      paramCounter++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Count query
    const countQuery = `SELECT COUNT(*) as total FROM fuel_card_transactions WHERE ${whereClause}`;
    const countResult = await this.db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Data query
    const query = `
      SELECT * FROM fuel_card_transactions
      WHERE ${whereClause}
      ORDER BY transaction_date DESC
      LIMIT $${paramCounter++} OFFSET $${paramCounter++}
    `;
    params.push(pageSize, offset);

    const result = await this.db.query(query, params);

    return { data: result.rows, total };
  }

  async getTransactionById(id: string, tenantId: string): Promise<FuelCardTransaction | null> {
    const query = `
      SELECT * FROM fuel_card_transactions
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.db.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async createTransaction(data: CreateFuelCardTransactionInput, tenantId: string): Promise<FuelCardTransaction> {
    const {
      fuel_card_id,
      provider_transaction_id,
      transaction_date,
      vehicle_id,
      driver_id,
      fuel_type,
      gallons,
      cost_per_gallon,
      total_cost,
      odometer_reading,
      location,
      latitude,
      longitude,
      merchant_name,
      merchant_address,
      product_code,
      unit_of_measure = 'gallons',
      receipt_url,
      metadata = {}
    } = data;

    const query = `
      INSERT INTO fuel_card_transactions (
        tenant_id, fuel_card_id, provider_transaction_id, transaction_date,
        vehicle_id, driver_id, fuel_type, gallons, cost_per_gallon, total_cost,
        odometer_reading, location, latitude, longitude, merchant_name, merchant_address,
        product_code, unit_of_measure, receipt_url, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `;

    const result = await this.db.query(query, [
      tenantId,
      fuel_card_id,
      provider_transaction_id || null,
      transaction_date,
      vehicle_id || null,
      driver_id || null,
      fuel_type,
      gallons,
      cost_per_gallon,
      total_cost,
      odometer_reading || null,
      location || null,
      latitude || null,
      longitude || null,
      merchant_name || null,
      merchant_address || null,
      product_code || null,
      unit_of_measure,
      receipt_url || null,
      JSON.stringify(metadata)
    ]);

    return result.rows[0];
  }

  async updateTransaction(id: string, data: UpdateFuelCardTransactionInput, tenantId: string): Promise<FuelCardTransaction | null> {
    const existing = await this.getTransactionById(id, tenantId);
    if (!existing) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    const allowedFields: (keyof UpdateFuelCardTransactionInput)[] = [
      'vehicle_id', 'driver_id', 'is_approved', 'is_disputed',
      'dispute_reason', 'reconciliation_status', 'metadata'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'metadata') {
          updates.push(`${field} = $${paramCounter++}`);
          values.push(JSON.stringify(data[field]));
        } else {
          updates.push(`${field} = $${paramCounter++}`);
          values.push(data[field]);
        }
      }
    }

    if (updates.length === 0) {
      return existing;
    }

    values.push(id, tenantId);
    const query = `
      UPDATE fuel_card_transactions
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCounter++} AND tenant_id = $${paramCounter++}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getCardUtilization(tenantId: string): Promise<FuelCardUtilization[]> {
    const query = `SELECT * FROM fuel_card_utilization WHERE card_id IN (
      SELECT id FROM fuel_cards WHERE tenant_id = $1
    )`;
    const result = await this.db.query(query, [tenantId]);
    return result.rows;
  }

  // ============================================================================
  // Helper Methods (AES-256-GCM Encryption)
  // ============================================================================

  private encryptApiKey(apiKey: string): string {
    const key = process.env.FUEL_CARD_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('FUEL_CARD_ENCRYPTION_KEY environment variable is required for fuel card encryption');
    }
    const keyBuffer = Buffer.from(key, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private encryptCardNumber(cardNumber: string): string {
    const key = process.env.FUEL_CARD_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('FUEL_CARD_ENCRYPTION_KEY environment variable is required for fuel card encryption');
    }
    const keyBuffer = Buffer.from(key, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    let encrypted = cipher.update(cardNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }
}
