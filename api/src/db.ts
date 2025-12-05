/**
 * Database module - exports pool for backward compatibility
 */

import poolInstance from './config/database'

// Export both 'pool' and 'db' as named exports for flexibility
export const pool = poolInstance
export const db = poolInstance
export default poolInstance
