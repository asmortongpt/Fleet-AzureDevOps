import { Pool, QueryResult } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = {
  async query<T extends Record<string, any> = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const res = await pool.query<T>(text, params);
    return res;
  },
};
