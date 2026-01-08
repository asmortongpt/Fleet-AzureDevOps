import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = {
  async query<T = any>(text: string, params?: any[]) {
    const res = await pool.query<T>(text, params);
    return res;
  },
};
