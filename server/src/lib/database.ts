import { Pool, PoolClient } from 'pg';
import { register, Gauge } from 'prom-client';

interface TenantConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

const poolConfig = {
  min: 10,
  max: 30,
  idleTimeoutMillis: 600000,
  connectionTimeoutMillis: 30000,
  statement_timeout: 60000
};

const pools: Map<string, Pool> = new Map();

const activeConnections = new Gauge({
  name: 'db_active_connections',
  help: 'Number of active connections in the pool',
  labelNames: ['tenant_id']
});

const idleConnections = new Gauge({
  name: 'db_idle_connections',
  help: 'Number of idle connections in the pool',
  labelNames: ['tenant_id']
});

const waitingRequests = new Gauge({
  name: 'db_waiting_requests',
  help: 'Number of requests waiting for a connection',
  labelNames: ['tenant_id']
});

register.registerMetric(activeConnections);
register.registerMetric(idleConnections);
register.registerMetric(waitingRequests);

function createPool(tenantId: string, config: TenantConfig): Pool {
  const pool = new Pool({
    ...config,
    ...poolConfig
  });

  pool.on('connect', () => {
    updateMetrics(tenantId, pool);
  });

  pool.on('remove', () => {
    updateMetrics(tenantId, pool);
  });

  pool.on('error', (err) => {
    console.error(`Unexpected error on idle client for tenant ${tenantId}:`, err);
  });

  return pool;
}

function updateMetrics(tenantId: string, pool: Pool): void {
  activeConnections.set({ tenant_id: tenantId }, pool.totalCount - pool.idleCount);
  idleConnections.set({ tenant_id: tenantId }, pool.idleCount);
  waitingRequests.set({ tenant_id: tenantId }, pool.waitingCount);
}

export async function getPool(tenantId: string, config: TenantConfig): Promise<Pool> {
  if (!pools.has(tenantId)) {
    const pool = createPool(tenantId, config);
    pools.set(tenantId, pool);
  }
  return pools.get(tenantId)!;
}

export async function executeQuery<T>(tenantId: string, config: TenantConfig, query: string, params: any[] = []): Promise<T> {
  const pool = await getPool(tenantId, config);
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    const res = await client.query<T>(query, params);
    return res.rows[0];
  } catch (err) {
    console.error(`Error executing query for tenant ${tenantId}:`, err);
    throw err;
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function healthCheck(tenantId: string, config: TenantConfig): Promise<boolean> {
  try {
    await executeQuery(tenantId, config, 'SELECT 1');
    return true;
  } catch (err) {
    console.error(`Health check failed for tenant ${tenantId}:`, err);
    return false;
  }
}

process.on('SIGTERM', async () => {
  console.log('Graceful shutdown initiated');
  for (const [tenantId, pool] of pools.entries()) {
    try {
      await pool.end();
      console.log(`Closed pool for tenant ${tenantId}`);
    } catch (err) {
      console.error(`Error closing pool for tenant ${tenantId}:`, err);
    }
  }
  process.exit(0);
});

// Create default pool for non-tenant-specific queries
const defaultPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'fleet',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ...poolConfig
});

export const pool = defaultPool; // Alias for compatibility
