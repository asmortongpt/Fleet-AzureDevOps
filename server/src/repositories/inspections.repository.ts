import { Database } from '../services/database';

export interface Inspection {
  id: number;
  tenant_id: number;
  vehicle_id: number;
  inspector_id: number;
  inspection_type: string;
  inspection_date: Date;
  result: string;
  checklist_items?: any;
  overall_condition?: string;
  defects_found?: string;
  corrective_actions_required?: string;
  follow_up_required?: boolean;
  follow_up_date?: Date;
  odometer_reading?: number;
  attachments?: any;
  notes?: string;
  created_at?: Date;
  created_by?: number;
  updated_at?: Date;
  updated_by?: number;
  deleted_at?: Date;
}

export interface InspectionWithRelations extends Inspection {
  vehicle_number?: string;
  make?: string;
  model?: string;
  inspector_name?: string;
}

export class InspectionsRepository {
  constructor(private db: Database) {}

  async findByTenant(tenantId: number): Promise<InspectionWithRelations[]> {
    return await this.db.query<InspectionWithRelations>(
      `SELECT
        i.id, i.vehicle_id, i.inspector_id, i.inspection_type,
        i.inspection_date, i.result, i.checklist_items, i.overall_condition,
        i.defects_found, i.corrective_actions_required, i.follow_up_required,
        i.follow_up_date, i.odometer_reading, i.attachments, i.notes,
        i.created_at, i.created_by, i.updated_at, i.updated_by,
        v.vehicle_number, v.make, v.model,
        u.name as inspector_name
      FROM inspections i
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN users u ON i.inspector_id = u.id
      WHERE i.tenant_id = $1 AND i.deleted_at IS NULL
      ORDER BY i.inspection_date DESC`,
      [tenantId]
    );
  }

  async countByTenant(tenantId: number): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM inspections WHERE tenant_id = $1 AND deleted_at IS NULL',
      [tenantId]
    );
    return parseInt(result[0]?.count || '0');
  }

  async findById(id: string, tenantId: number): Promise<InspectionWithRelations | null> {
    const result = await this.db.query<InspectionWithRelations>(
      `SELECT
        i.*,
        v.vehicle_number, v.make, v.model,
        u.name as inspector_name
      FROM inspections i
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN users u ON i.inspector_id = u.id
      WHERE i.id = $1 AND i.tenant_id = $2 AND i.deleted_at IS NULL`,
      [id, tenantId]
    );
    return result.length > 0 ? result[0] : null;
  }

  async create(inspection: Partial<Inspection>, tenantId: number, userId: number): Promise<Inspection> {
    const {
      vehicle_id,
      inspector_id,
      inspection_type,
      inspection_date,
      result,
      checklist_items,
      overall_condition,
      defects_found,
      corrective_actions_required,
      follow_up_required,
      follow_up_date,
      odometer_reading,
      attachments,
      notes
    } = inspection;

    const resultData = await this.db.query<Inspection>(
      `INSERT INTO inspections (
        tenant_id, vehicle_id, inspector_id, inspection_type, inspection_date,
        result, checklist_items, overall_condition, defects_found,
        corrective_actions_required, follow_up_required, follow_up_date,
        odometer_reading, attachments, notes, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        tenantId,
        vehicle_id,
        inspector_id,
        inspection_type,
        inspection_date || new Date().toISOString(),
        result,
        checklist_items ? JSON.stringify(checklist_items) : null,
        overall_condition,
        defects_found,
        corrective_actions_required,
        follow_up_required,
        follow_up_date,
        odometer_reading,
        attachments ? JSON.stringify(attachments) : null,
        notes,
        userId,
        userId
      ]
    );
    return resultData[0];
  }

  async update(id: string, updates: Partial<Inspection>, tenantId: number, userId: number): Promise<Inspection | null> {
    const fields = Object.keys(updates);
    const values = Object.values(updates).map(value => {
      if (Array.isArray(value)) {
        return JSON.stringify(value);
      }
      return value;
    });

    if (fields.length === 0) {
      return null;
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 3}`).join(', ');

    const result = await this.db.query<Inspection>(
      `UPDATE inspections
       SET ${setClause}, updated_by = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $${fields.length + 3} AND deleted_at IS NULL
       RETURNING *`,
      [userId, id, ...values, tenantId]
    );

    return result.length > 0 ? result[0] : null;
  }

  async softDelete(id: string, tenantId: number, userId: number): Promise<boolean> {
    const result = await this.db.query<{ id: number }>(
      `UPDATE inspections
       SET deleted_at = NOW(), updated_by = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
       RETURNING id`,
      [userId, id, tenantId]
    );

    return result.length > 0;
  }

  async validateVehicle(vehicleId: number, tenantId: number): Promise<boolean> {
    const result = await this.db.query<{ id: number }>(
      'SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2',
      [vehicleId, tenantId]
    );
    return result.length > 0;
  }

  async validateInspector(inspectorId: number, tenantId: number): Promise<boolean> {
    const result = await this.db.query<{ id: number }>(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
      [inspectorId, tenantId]
    );
    return result.length > 0;
  }
}
