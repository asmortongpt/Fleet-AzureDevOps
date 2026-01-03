import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { schema } from "../schemas/production.schema";

const DATABASE_PATH = process.env.DATABASE_URL?.replace("sqlite:", "") || "./dev.db";

console.log(`📁 Using SQLite database: ${DATABASE_PATH}`);

const sqlite = new Database(DATABASE_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    sqlite.prepare("SELECT 1").get();
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

export default db;
