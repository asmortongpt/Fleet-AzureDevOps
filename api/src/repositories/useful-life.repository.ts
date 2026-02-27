import { db } from "../db";

export interface UsefulLifeRule {
  id: number;
  category: string;
  min_months: number;
  max_months: number;
  default_months: number;
  default_method: string;
  notes?: string | null;
  effective_date: string;
}

export class UsefulLifeRepository {
  static async getRule(category: string): Promise<UsefulLifeRule | null> {
    const { rows } = await db.query(
      `SELECT id, category, min_months, max_months, default_months, default_method, notes, effective_date FROM useful_life_rules WHERE category=$1 ORDER BY effective_date DESC LIMIT 1`,
      [category]
    );
    return rows[0] ?? null;
  }
}
