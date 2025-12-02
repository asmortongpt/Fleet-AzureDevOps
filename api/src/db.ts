/**
 * Database module - exports pool for backward compatibility
 */

import pool from './config/database'

export const db = pool
export default pool
