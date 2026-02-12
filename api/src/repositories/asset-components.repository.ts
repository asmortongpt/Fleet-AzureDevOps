import { db } from "../db";

import { AuditRepository } from "./audit.repository";

export interface AssetComponent {
  id: number;
  asset_id: number;
  name: string;
  category?: string | null;
  installed_date: string;
  depreciation_start_date: string;
  cost_basis: number;
  salvage_value: number;
  useful_life_months: number;
  depreciation_method: string;
  disposed_date?: string | null;
  disposed_amount?: number | null;
  notes?: string | null;
}

export interface CreateComponentInput {
  asset_id: number;
  name: string;
  category?: string | null;
  installed_date: string;
  depreciation_start_date?: string;
  cost_basis: number;
  salvage_value?: number;
  useful_life_months: number;
  depreciation_method?: string;
  notes?: string | null;
}

export interface UpdateComponentInput {
  name?: string;
  category?: string | null;
  installed_date?: string;
  depreciation_start_date?: string;
  cost_basis?: number;
  salvage_value?: number;
  useful_life_months?: number;
  depreciation_method?: string;
  notes?: string | null;
}

export class AssetComponentsRepository {
  static async listByAsset(assetId: number): Promise<AssetComponent[]> {
    const { rows } = await db.query(
      `SELECT * FROM asset_components WHERE asset_id=$1 ORDER BY installed_date ASC, id ASC`,
      [assetId]
    );
    return rows;
  }

  static async getById(id: number): Promise<AssetComponent | null> {
    const { rows } = await db.query(`SELECT * FROM asset_components WHERE id=$1`, [id]);
    return rows[0] ?? null;
  }

  static async create(input: CreateComponentInput, performedBy?: string | null): Promise<AssetComponent> {
    const depStart = input.depreciation_start_date ?? input.installed_date;
    const { rows } = await db.query(
      `INSERT INTO asset_components(
        asset_id,name,category,installed_date,depreciation_start_date,
        cost_basis,salvage_value,useful_life_months,depreciation_method,notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        input.asset_id,
        input.name,
        input.category ?? null,
        input.installed_date,
        depStart,
        input.cost_basis,
        input.salvage_value ?? 0,
        input.useful_life_months,
        input.depreciation_method ?? "STRAIGHT_LINE",
        input.notes ?? null,
      ]
    );
    const created = rows[0];
    await AuditRepository.record({ entityType: "asset_component", entityId: created.id, action: "CREATE", after: created, performedBy });
    return created;
  }

  static async update(id: number, input: UpdateComponentInput, performedBy?: string | null): Promise<AssetComponent> {
    const before = await this.getById(id);
    if (!before) throw new Error("Component not found");

    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [k,v] of Object.entries(input)) {
      if (v === undefined) continue;
      fields.push(`${k}=$${i++}`);
      values.push(v);
    }
    if (!fields.length) return before;
    values.push(id);

    const { rows } = await db.query(
      `UPDATE asset_components SET ${fields.join(", ")} WHERE id=$${i} RETURNING *`,
      values
    );
    const updated = rows[0];
    await AuditRepository.record({ entityType: "asset_component", entityId: id, action: "UPDATE", before, after: updated, performedBy });
    return updated;
  }

  static async dispose(id: number, disposed_date: string, disposed_amount?: number, performedBy?: string | null): Promise<AssetComponent> {
    const before = await this.getById(id);
    if (!before) throw new Error("Component not found");

    const { rows } = await db.query(
      `UPDATE asset_components SET disposed_date=$1, disposed_amount=$2 WHERE id=$3 RETURNING *`,
      [disposed_date, disposed_amount ?? null, id]
    );
    const updated = rows[0];
    await AuditRepository.record({ entityType: "asset_component", entityId: id, action: "DISPOSE", before, after: updated, performedBy });
    return updated;
  }
}
