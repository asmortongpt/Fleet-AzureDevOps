```typescript
// src/agents/ctaFleetAgent019.ts
import { Pool, PoolClient } from 'pg';
import { Logger } from 'winston';
import { injectable, inject } from 'tsyringe';
import { performance } from 'perf_hooks';

// Interface for query results
interface QueryResult<T> {
  rows: T[];
  rowCount: number;
  executionTime: number;
}

// Database configuration interface
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  maxConnections: number;
}

@injectable()
export class CTAFleetAgent019 {
  private pool: Pool;
  private readonly logger: Logger;

  constructor(
    @inject('Logger') logger: Logger,
    @inject('DatabaseConfig') config: DatabaseConfig
  ) {
    this.logger = logger;
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.maxConnections,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle client', { error: err.message });
    });
  }

  /**
   * Executes a parameterized query with performance monitoring
   * @param text SQL query text
   * @param params Query parameters for security
   * @returns Query results with execution metrics
   */
  async executeQuery<T>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    let client: PoolClient | undefined;
    const startTime = performance.now();

    try {
      client = await this.pool.connect();
      await client.query('BEGIN');

      // Enable query timing for PostgreSQL
      await client.query('SET LOCAL track_io_timing = on');

      const result = await client.query(text, params);
      const executionTime = performance.now() - startTime;

      await client.query('COMMIT');

      this.logger.info('Query executed successfully', {
        query: text,
        executionTime,
        rowCount: result.rowCount,
      });

      return {
        rows: result.rows as T[],
        rowCount: result.rowCount,
        executionTime,
      };
    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
      }
      this.logger.error('Error executing query', {
        query: text,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new DatabaseQueryError('Failed to execute database query', error);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Analyzes query performance using EXPLAIN ANALYZE
   * @param query SQL query to analyze
   * @param params Query parameters
   * @returns Analysis results
   */
  async analyzeQueryPerformance(query: string, params: any[] = []): Promise<string> {
    const explainQuery = `EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON) ${query}`;
    try {
      const result = await this.executeQuery<{ 'QUERY PLAN': any }>(explainQuery, params);
      return JSON.stringify(result.rows[0]['QUERY PLAN'], null, 2);
    } catch (error) {
      this.logger.error('Error analyzing query performance', { query, error });
      throw new DatabaseQueryError('Failed to analyze query performance', error);
    }
  }

  /**
   * Closes database connections
   */
  async shutdown(): Promise<void> {
    try {
      await this.pool.end();
      this.logger.info('Database pool closed');
    } catch (error) {
      this.logger.error('Error closing database pool', { error });
      throw new DatabaseQueryError('Failed to close database pool', error);
    }
  }
}

/**
 * Custom error class for database operations
 */
export class DatabaseQueryError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'DatabaseQueryError';
  }
}

// src/agents/ctaFleetAgent019.test.ts
import { Container } from 'tsyringe';
import { CTAFleetAgent019, DatabaseQueryError } from './ctaFleetAgent019';
import { createLogger } from 'winston';
import { expect } from 'chai';
import sinon from 'sinon';

describe('CTAFleetAgent019 - Database Query Optimization', () => {
  let agent: CTAFleetAgent019;
  let sandbox: sinon.SinonSandbox;

  const mockConfig: DatabaseConfig = {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    user: 'test_user',
    password: 'test_pass',
    maxConnections: 10,
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    Container.reset();

    Container.register('Logger', {
      useValue: createLogger({
        level: 'info',
        transports: [],
      }),
    });

    Container.register('DatabaseConfig', {
      useValue: mockConfig,
    });

    agent = Container.resolve(CTAFleetAgent019);
  });

  afterEach(async () => {
    sandbox.restore();
    await agent.shutdown();
  });

  it('should execute query successfully with performance metrics', async () => {
    const query = 'SELECT * FROM test_table WHERE id = $1';
    const params = [1];

    // Mock pool connection and query execution
    const mockClient = {
      query: sandbox.stub().resolves({
        rows: [{ id: 1, name: 'Test' }],
        rowCount: 1,
      }),
      release: sandbox.stub(),
    };

    sandbox.stub(agent['pool'], 'connect').resolves(mockClient as any);

    const result = await agent.executeQuery<{ id: number; name: string }>(query, params);

    expect(result.rows).to.have.lengthOf(1);
    expect(result.rowCount).to.equal(1);
    expect(result.executionTime).to.be.a('number');
    expect(result.executionTime).to.be.greaterThan(0);
  });

  it('should handle query execution errors', async () => {
    const query = 'SELECT * FROM nonexistent_table';
    sandbox.stub(agent['pool'], 'connect').rejects(new Error('Connection failed'));

    await expect(agent.executeQuery(query)).to.be.rejectedWith(DatabaseQueryError);
  });

  it('should analyze query performance', async () => {
    const query = 'SELECT * FROM test_table';
    const mockAnalysis = {
      'QUERY PLAN': { Plan: { 'Node Type': 'Seq Scan' } },
    };

    const mockClient = {
      query: sandbox.stub().resolves({
        rows: [mockAnalysis],
        rowCount: 1,
      }),
      release: sandbox.stub(),
    };

    sandbox.stub(agent['pool'], 'connect').resolves(mockClient as any);

    const analysis = await agent.analyzeQueryPerformance(query);
    expect(analysis).to.contain('Seq Scan');
  });

  it('should handle query analysis errors', async () => {
    const query = 'SELECT * FROM nonexistent_table';
    sandbox.stub(agent['pool'], 'connect').rejects(new Error('Analysis failed'));

    await expect(agent.analyzeQueryPerformance(query)).to.be.rejectedWith(DatabaseQueryError);
  });

  it('should shutdown database pool properly', async () => {
    const endStub = sandbox.stub(agent['pool'], 'end').resolves();
    await agent.shutdown();
    expect(endStub.calledOnce).to.be.true;
  });
});
```
