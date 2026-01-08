import { db } from "../db";

export class PoliciesRepository {
  static async getPolicy<T = any>(key: string): Promise<T | null> {
    const { rows } = await db.query(`SELECT value FROM accounting_policies WHERE key=$1 ORDER BY effective_date DESC LIMIT 1`, [key]);
    return rows[0]?.value ?? null;
  }
}
