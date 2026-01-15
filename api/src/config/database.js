"use strict";
/**
 * Database Configuration
 *
 * This module provides database connection management with multiple connection pools
 * for different access levels (admin, webapp, readonly).
 *
 * IMPORTANT: The legacy single pool export is maintained for backward compatibility,
 * but new code should use the ConnectionManager for better security.
 *
 * Migration Path:
 * 1. Old code: import pool from './config/database'
 * 2. New code: import { connectionManager, PoolType } from './config/connection-manager'
 *
 * Usage Examples:
 *
 * // For standard CRUD operations (recommended)
 * const pool = connectionManager.getWritePool()
 *
 * // For read-only operations (reporting, analytics)
 * const pool = connectionManager.getReadPool()
 *
 * // For admin operations (migrations only)
 * const pool = connectionManager.getAdminPool()
 *
 * // Or use the DAL (Data Access Layer) for better abstraction
 * import { BaseRepository } from './services/dal'
 * class VendorRepository extends BaseRepository<Vendor> {
 *   constructor() {
 *     super('vendors', connectionManager.getWritePool())
 *   }
 * }
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.getPoolStats = exports.getDatabaseHealth = exports.getAdminPool = exports.getWritePool = exports.getReadPool = exports.PoolType = exports.connectionManager = void 0;
exports.initializeDatabase = initializeDatabase;
const dotenv_1 = __importDefault(require("dotenv"));
const connection_manager_1 = require("./connection-manager");
Object.defineProperty(exports, "connectionManager", { enumerable: true, get: function () { return connection_manager_1.connectionManager; } });
Object.defineProperty(exports, "PoolType", { enumerable: true, get: function () { return connection_manager_1.PoolType; } });
dotenv_1.default.config();
/**
 * Initialize the connection manager
 * This should be called once during application startup
 */
async function initializeDatabase() {
    console.log('🔄 Initializing database connections...');
    try {
        await (0, connection_manager_1.initializeConnectionManager)();
        console.log('✅ Database initialization complete');
    }
    catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}
/**
 * Convenience exports for different pool types
 */
const getReadPool = () => connection_manager_1.connectionManager.getReadPool();
exports.getReadPool = getReadPool;
const getWritePool = () => connection_manager_1.connectionManager.getWritePool();
exports.getWritePool = getWritePool;
const getAdminPool = () => connection_manager_1.connectionManager.getAdminPool();
exports.getAdminPool = getAdminPool;
/**
 * Get database health status
 */
const getDatabaseHealth = () => connection_manager_1.connectionManager.getHealthStatus();
exports.getDatabaseHealth = getDatabaseHealth;
/**
 * Get pool statistics
 */
const getPoolStats = () => connection_manager_1.connectionManager.getAllPoolStats();
exports.getPoolStats = getPoolStats;
/**
 * Legacy pool export with lazy initialization for backward compatibility
 * Uses a Proxy to defer pool access until it's actually used
 *
 * DEPRECATED: Use getWritePool() for new code
 */
const poolProxy = new Proxy({}, {
    get(target, prop) {
        const pool = connection_manager_1.connectionManager.getWritePool();
        return pool[prop];
    }
});
exports.pool = poolProxy;
/**
 * Default export (legacy compatibility)
 */
exports.default = exports.pool;
//# sourceMappingURL=database.js.map