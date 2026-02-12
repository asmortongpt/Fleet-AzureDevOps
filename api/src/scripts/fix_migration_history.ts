
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import * as dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

// @ts-expect-error - Type mismatch
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'fleet_management',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function fixHistory() {
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

        // Get currently applied (likely 0)
        const existing = await client.query('SELECT filename FROM schema_migrations');
        const appliedSet = new Set(existing.rows.map(r => r.filename));

        await client.query('BEGIN');

        for (const file of files) {
            // If it's one of the NEW files, skip it (so it runs for real)
            if (file.startsWith('20260108')) {
                console.log(`Skipping (will run later): ${file}`);
                continue;
            }

            // If already applied, skip
            if (appliedSet.has(file)) {
                continue;
            }

            // Otherwise, mark as applied (fake it)
            console.log(`Marking as applied: ${file}`);
            await client.query(
                'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
                [file]
            );
        }

        await client.query('COMMIT');
        console.log('Migration history fixed.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

fixHistory();
