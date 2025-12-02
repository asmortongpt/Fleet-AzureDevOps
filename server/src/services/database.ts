/**
 * Database Service
 * Migrated to Drizzle ORM for type-safe database operations
 * Maintains backward compatibility with existing Database class interface
 */

import { Pool, PoolClient } from 'pg';
import { db, pool as drizzlePool } from '../../../api/src/db';
import { users, sessions } from '../../../api/src/db/schema';
import { eq, gt, sql } from 'drizzle-orm';
import { config } from './config';
import { logger } from './logger';
import { User, Session } from '../types';

class Database {
  private pool: Pool;

  constructor() {
    // Use the same pool configuration for backward compatibility
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

  /**
   * Legacy query method - kept for backward compatibility
   * New code should use Drizzle ORM directly via db import
   */
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
      const result = await db.execute(sql`SELECT NOW() as current_time`);
      logger.info('Database connection test successful', { time: result.rows[0] });
      return true;
    } catch (error) {
      logger.error('Database connection test failed', { error: error instanceof Error ? error.message : error });
      return false;
    }
  }

  // User operations - migrated to Drizzle ORM
  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return result.length > 0 ? (result[0] as User) : null;
    } catch (error) {
      logger.error('Error finding user by email', { error });
      throw error;
    }
  }

  async findUserByMicrosoftId(microsoftId: string): Promise<User | null> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.microsoftId, microsoftId))
        .limit(1);

      return result.length > 0 ? (result[0] as User) : null;
    } catch (error) {
      logger.error('Error finding user by Microsoft ID', { error });
      throw error;
    }
  }

  async findUserById(id: number): Promise<User | null> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return result.length > 0 ? (result[0] as User) : null;
    } catch (error) {
      logger.error('Error finding user by ID', { error });
      throw error;
    }
  }

  async createUser(
    email: string,
    microsoftId: string,
    displayName: string,
    role: string = 'user'
  ): Promise<User> {
    try {
      const result = await db
        .insert(users)
        .values({
          email,
          microsoftId,
          displayName,
          role,
          authProvider: 'microsoft',
          isActive: true,
        })
        .returning();

      return result[0] as User;
    } catch (error) {
      logger.error('Error creating user', { error });
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    try {
      const updateData: any = {};

      if (updates.display_name !== undefined) {
        updateData.displayName = updates.display_name;
      }
      if (updates.role !== undefined) {
        updateData.role = updates.role;
      }
      if (updates.is_active !== undefined) {
        updateData.isActive = updates.is_active;
      }
      if (updates.last_login_at !== undefined) {
        updateData.lastLoginAt = updates.last_login_at;
      }

      const result = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      return result[0] as User;
    } catch (error) {
      logger.error('Error updating user', { error });
      throw error;
    }
  }

  // Session operations - migrated to Drizzle ORM
  async createSession(userId: number, token: string, expiresAt: Date): Promise<Session> {
    try {
      const result = await db
        .insert(sessions)
        .values({
          userId,
          token,
          expiresAt,
        })
        .returning();

      return result[0] as Session;
    } catch (error) {
      logger.error('Error creating session', { error });
      throw error;
    }
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    try {
      const result = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      // Check if session is expired
      const session = result[0];
      if (session.expiresAt && new Date(session.expiresAt) <= new Date()) {
        return null;
      }

      return session as Session;
    } catch (error) {
      logger.error('Error finding session by token', { error });
      throw error;
    }
  }

  async deleteSession(token: string): Promise<void> {
    try {
      await db
        .delete(sessions)
        .where(eq(sessions.token, token));
    } catch (error) {
      logger.error('Error deleting session', { error });
      throw error;
    }
  }

  async deleteUserSessions(userId: number): Promise<void> {
    try {
      await db
        .delete(sessions)
        .where(eq(sessions.userId, userId));
    } catch (error) {
      logger.error('Error deleting user sessions', { error });
      throw error;
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await db
        .delete(sessions)
        .where(sql`${sessions.expiresAt} <= NOW()`)
        .returning();

      return result.length;
    } catch (error) {
      logger.error('Error cleaning up expired sessions', { error });
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    await drizzlePool.end();
    logger.info('Database pool closed');
  }
}

// Export singleton instance
export const db = new Database();
