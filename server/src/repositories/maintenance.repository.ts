import { Database } from '../services/database';

export interface MaintenanceRecord {
  id: number;
  tenant_id: number;
  vehicle_id: number;
  maintenance_type: string;
  description?: string;
  service_date: Date;
  service_provider?: string;
  cost?: number;
  odometer_reading?: number;
  next_service_date?: Date;
  next_service_odometer?: number;
  parts_replaced?: string;
  labor_hours?: number;
  status?: string;
  notes?: string;
  created_at?: Date;
  created_by?: number;
  updated_at?: Date;
  updated_by?: number;
  deleted_at?: Date;
}

export interface MaintenanceRecordWithRelations extends MaintenanceRecord {
  vehicle_number?: string;
  make?: string;
  model?: string;
}

export class MaintenanceRepository {
  constructor(private db: Database) {}

  async findByTenant(tenantId: number): Promise<MaintenanceRecordWithRelations[]> {
    return await this.db.query<MaintenanceRecordWithRelations>(
      `SELECT
        m.id, m.vehicle_id, m.maintenance_type, m.description,
        m.service_date, m.service_provider, m.cost, m.odometer_reading,
        m.next_service_date, m.next_service_odometer, m.parts_replaced,
        m.labor_hours, m.status, m.notes,
        m.created_at, m.created_by, m.updated_at, m.updated_by,
        v.vehicle_number, v.make, v.model
      FROM maintenance_records m
      LEFT JOIN vehicles v ON m.vehicle_id = v.id
      WHERE m.tenant_id = $1 AND m.deleted_at IS NULL
      ORDER BY m.service_date DESC`,
      [tenantId]
    );
  }

  async countByTenant(tenantId: number): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM maintenance_records WHERE tenant_id = $1 AND deleted_at IS NULL',
      [tenantId]
    );
    return parseInt(result[0]?.count || '0');
  }

  async findById(id: string, tenantId: number): Promise<MaintenanceRecordWithRelations | null> {
    const result = await this.db.query<MaintenanceRecordWithRelations>(
      `SELECT
        m.*,
        v.vehicle_number, v.make, v.model
      FROM maintenance_records m
      LEFT JOIN vehicles v ON m.vehicle_id = v.id
      WHERE m.id = $1 AND m.tenant_id = $2 AND m.deleted_at IS NULL`,
      [id, tenantId]
    );
    return result.length > 0 ? result[0] : null;
  }

  async create(maintenance: Partial<MaintenanceRecord>, tenantId: number, userId: number): Promise<MaintenanceRecord> {
    const {
      vehicle_id,
      maintenance_type,
      description,
      service_date,
      service_provider,
      cost,
      odometer_reading,
      next_service_date,
      next_service_odometer,
      parts_replaced,
      labor_hours,
      status,
      notes
    } = maintenance;

    const result = await this.db.query<MaintenanceRecord>(
      `INSERT INTO maintenance_records (
        tenant_id, vehicle_id, maintenance_type, description, service_date,
        service_provider, cost, odometer_reading, next_service_date,
        next_service_odometer, parts_replaced, labor_hours, status, notes,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        tenantId,
        vehicle_id,
        maintenance_type,
        description,
        service_date,
        service_provider,
        cost,
        odometer_reading,
        next_service_date,
        next_service_odometer,
        parts_replaced,
        labor_hours,
        status,
        notes,
        userId,
        userId
      ]
    );
    return result[0];
  }

  async update(id: string, updates: Partial<MaintenanceRecord>, tenantId: number, userId: number): Promise<MaintenanceRecord | null> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);

    if (fields.length === 0) {
      return null;
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 3}`).join(', ');

    const result = await this.db.query<MaintenanceRecord>(
      `UPDATE maintenance_records
       SET ${setClause}, updated_by = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $${fields.length + 3} AND deleted_at IS NULL
       RETURNING *`,
      [userId, id, ...values, tenantId]
    );

    return result.length > 0 ? result[0] : null;
  }

  async softDelete(id: string, tenantId: number, userId: number): Promise<boolean> {
    const result = await this.db.query<{ id: number }>(
      `UPDATE maintenance_records
       SET deleted_at = NOW(), updated_by = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
       RETURNING id`,
      [userId, id, tenantId]
    );

    return result.length > 0;
  }
}
