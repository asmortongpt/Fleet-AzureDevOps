import { db } from "../db";

export interface AccountingPeriod {
  id: number;
  period_start: string;
  period_end: string;
  is_closed: boolean;
  closed_at?: string | null;
  closed_by?: string | null;
}

export class AccountingPeriodsRepository {
  static async list(): Promise<AccountingPeriod[]> {
    const { rows } = await db.query(`SELECT * FROM accounting_periods ORDER BY period_start DESC`);
    return rows;
  }

  static async create(period_start: string, period_end: string): Promise<AccountingPeriod> {
    const { rows } = await db.query(
      `INSERT INTO accounting_periods(period_start, period_end) VALUES ($1,$2) RETURNING *`,
      [period_start, period_end]
    );
    return rows[0];
  }

  static async getById(id: number): Promise<AccountingPeriod | null> {
    const { rows } = await db.query(`SELECT * FROM accounting_periods WHERE id=$1`, [id]);
    return rows[0] ?? null;
  }

  static async close(id: number, closedBy: string | null): Promise<AccountingPeriod> {
    const { rows } = await db.query(
      `UPDATE accounting_periods SET is_closed=TRUE, closed_at=NOW(), closed_by=$2 WHERE id=$1 RETURNING *`,
      [id, closedBy]
    );
    if (!rows[0]) throw new Error("Period not found");
    return rows[0];
  }
}
