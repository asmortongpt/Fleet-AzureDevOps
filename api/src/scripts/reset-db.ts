import path from 'path';

import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function resetDatabase() {
    const client = await pool.connect();
    try {
        console.log('🗑️  Dropping public schema...');
        await client.query('DROP SCHEMA public CASCADE');
        console.log('✨  Recreating public schema...');
        await client.query('CREATE SCHEMA public');
        await client.query('GRANT ALL ON SCHEMA public TO public');
        // await client.query(`GRANT ALL ON SCHEMA public TO "${process.env.DB_USER}"`);
        console.log('✅  Database reset successful');
    } catch (err) {
        console.error('❌  Error resetting database:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

resetDatabase();
