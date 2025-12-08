import { Pool, PoolClient } from 'pg';

import { User, Session } from '../types';

import { config } from './config';
import { logger } from './logger';

class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      max: config.database.max,
      idleTimeoutMillis: config.database.idleTimeoutMillis,
      connectionTimeoutMillis: config.database.connectionTimeoutMillis,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected database error', { error: err.message });
    });

    this.pool.on('connect', () => {
      logger.info('New database connection established');
    });
  }

  async query<T>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: result.rowCount });
      return result.rows as T[];
    } catch (error) {
      logger.error('Database query error', { text, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW() as current_time');
      logger.info('Database connection test successful', { time: result[0] });
      return true;
    } catch (error) {
      logger.error('Database connection test failed', { error: error instanceof Error ? error.message : error });
      return false;
    }
  }

  // User operations
  async findUserByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.query<User>(query, [email]);
    return result.length > 0 ? result[0] : null;
  }

  async findUserByMicrosoftId(microsoftId: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE microsoft_id = $1';
    const result = await this.query<User>(query, [microsoftId]);
    return result.length > 0 ? result[0] : null;
  }

  async findUserById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.query<User>(query, [id]);
    return result.length > 0 ? result[0] : null;
  }

  async createUser(
    email: string,
    microsoftId: string,
    displayName: string,
    role: string = 'user'
  ): Promise<User> {
    const query = `
      INSERT INTO users (email, microsoft_id, display_name, role, auth_provider)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await this.query<User>(query, [email, microsoftId, displayName, role, 'microsoft']);
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const { display_name, role } = updates;
    const query = `
      UPDATE users
      SET display_name = COALESCE($1, display_name),
          role = COALESCE($2, role),
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await this.query<User>(query, [display_name, role, id]);
    return result[0];
  }

  // Session operations
  async createSession(userId: number, token: string, expiresAt: Date): Promise<Session> {
    const query = `
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await this.query<Session>(query, [userId, token, expiresAt]);
    return result[0];
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    const query = 'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()';
    const result = await this.query<Session>(query, [token]);
    return result.length > 0 ? result[0] : null;
  }

  async deleteSession(token: string): Promise<void> {
    const query = 'DELETE FROM sessions WHERE token = $1';
    await this.query(query, [token]);
  }

  async deleteUserSessions(userId: number): Promise<void> {
    const query = 'DELETE FROM sessions WHERE user_id = $1';
    await this.query(query, [userId]);
  }

  async cleanupExpiredSessions(): Promise<number> {
    const query = 'SELECT cleanup_expired_sessions()';
    const result = await this.query<{ cleanup_expired_sessions: number }>(query);
    return result[0].cleanup_expired_sessions;
  }

  async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database pool closed');
  }
}

export const db = new Database();
