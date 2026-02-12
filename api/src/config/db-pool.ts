import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  statement_timeout: 10000,
  query_timeout: 10000
};

const databaseUrl =
  process.env.DATABASE_URL ||
  // Safe local default for dev/demo environments.
  // Matches other parts of the codebase that assume a local `fleet_dev` database.
  (process.env.DB_HOST || process.env.DB_NAME || process.env.DB_USER
    ? undefined
    : 'postgresql://postgres:postgres@localhost:5432/fleet_dev');

export const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ...poolConfig,
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'fleet_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ...poolConfig,
    });

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('New database connection established');
});

pool.on('remove', () => {
  console.log('Database connection removed from pool');
});

export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT NOW()');
    return true;
  } catch (err) {
    console.error('Database connection test failed:', err);
    return false;
  }
}
