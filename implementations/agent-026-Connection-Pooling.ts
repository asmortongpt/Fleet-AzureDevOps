// src/connectionPool.ts
import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import { Logger } from './logger';

export interface ConnectionConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
  connectionLimit?: number;
  queueLimit?: number;
}

export class ConnectionPool {
  private pool: Pool | null = null;
  private config: ConnectionConfig;
  private logger: Logger;

  constructor(config: ConnectionConfig, logger: Logger = new Logger()) {
    this.config = {
      ...config,
      connectionLimit: config.connectionLimit || 10,
      queueLimit: config.queueLimit || 0,
      port: config.port || 3306,
    };
    this.logger = logger;
  }

  public async initialize(): Promise<void> {
    try {
      this.pool = await createPool({
        host: this.config.host,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        port: this.config.port,
        connectionLimit: this.config.connectionLimit,
        queueLimit: this.config.queueLimit,
        waitForConnections: true,
      });
      this.logger.info('Connection pool initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize connection pool:', error);
      throw error;
    }
  }

  public async getConnection(): Promise<PoolConnection> {
    if (!this.pool) {
      throw new Error('Connection pool not initialized');
    }
    try {
      const connection = await this.pool.getConnection();
      this.logger.debug('Connection acquired from pool');
      return connection;
    } catch (error) {
      this.logger.error('Error acquiring connection from pool:', error);
      throw error;
    }
  }

  public async query<T>(sql: string, params: any[] = []): Promise<T> {
    if (!this.pool) {
      throw new Error('Connection pool not initialized');
    }
    try {
      const [results] = await this.pool.query(sql, params);
      this.logger.debug('Query executed successfully', { sql });
      return results as T;
    } catch (error) {
      this.logger.error('Error executing query:', error);
      throw error;
    }
  }

  public async execute<T>(sql: string, params: any[] = []): Promise<T> {
    if (!this.pool) {
      throw new Error('Connection pool not initialized');
    }
    try {
      const [results] = await this.pool.execute(sql, params);
      this.logger.debug('Statement executed successfully', { sql });
      return results as T;
    } catch (error) {
      this.logger.error('Error executing statement:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.logger.info('Connection pool closed');
      this.pool = null;
    }
  }

  public getPoolStats(): { active: number; total: number; idle: number } {
    if (!this.pool) {
      return { active: 0, total: 0, idle: 0 };
    }
    return {
      active: this.pool.pool.activeConnections(),
      total: this.pool.pool.totalConnections(),
      idle: this.pool.pool.idleConnections(),
    };
  }
}

// src/logger.ts
export class Logger {
  public info(message: string, meta?: any): void {
    console.log(`[INFO] ${message}`, meta || '');
  }

  public debug(message: string, meta?: any): void {
    console.log(`[DEBUG] ${message}`, meta || '');
  }

  public error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, error || '');
  }
}

// src/index.ts
import { ConnectionPool, ConnectionConfig } from './connectionPool';

async function main() {
  const config: ConnectionConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'test_db',
    connectionLimit: 5,
  };

  const pool = new ConnectionPool(config);
  try {
    await pool.initialize();

    // Example usage
    const results = await pool.query<any[]>(
      'SELECT * FROM users WHERE id = ?',
      [1]
    );
    console.log('Query results:', results);

    // Check pool stats
    console.log('Pool stats:', pool.getPoolStats());

  } catch (error) {
    console.error('Application error:', error);
  } finally {
    await pool.close();
  }
}

// Run the example if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

// tests/connectionPool.test.ts
import { ConnectionPool, ConnectionConfig } from '../src/connectionPool';
import { Logger } from '../src/logger';
import { createConnection } from 'mysql2/promise';

jest.mock('mysql2/promise', () => {
  const mockPool = {
    getConnection: jest.fn().mockResolvedValue({
      release: jest.fn(),
    }),
    query: jest.fn().mockResolvedValue([[], []]),
    execute: jest.fn().mockResolvedValue([[], []]),
    end: jest.fn().mockResolvedValue(undefined),
    pool: {
      activeConnections: jest.fn().mockReturnValue(1),
      totalConnections: jest.fn().mockReturnValue(5),
      idleConnections: jest.fn().mockReturnValue(4),
    },
  };
  return {
    createPool: jest.fn().mockReturnValue(mockPool),
    createConnection: jest.fn().mockResolvedValue({
      end: jest.fn().mockResolvedValue(undefined),
    }),
  };
});

describe('ConnectionPool', () => {
  let config: ConnectionConfig;
  let logger: Logger;
  let pool: ConnectionPool;

  beforeEach(() => {
    config = {
      host: 'localhost',
      user: 'test',
      password: 'test',
      database: 'test_db',
      connectionLimit: 5,
    };
    logger = new Logger();
    pool = new ConnectionPool(config, logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize pool successfully', async () => {
    await expect(pool.initialize()).resolves.toBeUndefined();
    expect(pool.getPoolStats()).toEqual({
      active: 1,
      total: 5,
      idle: 4,
    });
  });

  test('should throw error if pool not initialized when getting connection', async () => {
    await expect(pool.getConnection()).rejects.toThrow('Connection pool not initialized');
  });

  test('should get connection from pool', async () => {
    await pool.initialize();
    const connection = await pool.getConnection();
    expect(connection).toBeDefined();
    expect(connection.release).toBeDefined();
  });

  test('should execute query successfully', async () => {
    await pool.initialize();
    const results = await pool.query<any[]>('SELECT * FROM test', [1]);
    expect(results).toEqual([]);
  });

  test('should execute statement successfully', async () => {
    await pool.initialize();
    const results = await pool.execute<any[]>('INSERT INTO test VALUES (?)', [1]);
    expect(results).toEqual([]);
  });

  test('should close pool successfully', async () => {
    await pool.initialize();
    await expect(pool.close()).resolves.toBeUndefined();
    expect(pool.getPoolStats()).toEqual({
      active: 0,
      total: 0,
      idle: 0,
    });
  });

  test('should handle initialization errors', async () => {
    const mockCreatePool = jest.requireMock('mysql2/promise').createPool;
    mockCreatePool.mockImplementation(() => {
      throw new Error('Initialization failed');
    });

    await expect(pool.initialize()).rejects.toThrow('Initialization failed');
  });

  test('should handle query errors', async () => {
    const mockCreatePool = jest.requireMock('mysql2/promise').createPool;
    mockCreatePool.mockReturnValue({
      ...mockCreatePool(),
      query: jest.fn().mockRejectedValue(new Error('Query failed')),
    });

    await pool.initialize();
    await expect(pool.query('SELECT * FROM test')).rejects.toThrow('Query failed');
  });
});
