/**
 * Repository Layer Index
 * Exports all repositories with parameterized SQL queries
 * All operations enforce tenant isolation for security
 *
 * BACKEND-17, BACKEND-18, BACKEND-19, BACKEND-20, BACKEND-21
 */

// Core Entity Repositories
export * from './vehicles.repository'
export * from './drivers.repository'
export * from './maintenance.repository'
export * from './fuel.repository'
export * from './incidents.repository'

// Operational Repositories
export * from './workorders.repository'
export * from './inspections.repository'

// RBAC and Security Repositories
export * from './permissions.repository'
export * from './teams.repository'

// Alias exports for naming consistency
export * from './fuel-transactions.repository'

// Re-export commonly used types
export type { PaginationParams } from './vehicles.repository'

// Asset Management Repository
export * from './asset-management.repository'

// Document Management Repository
export * from './documents.repository'

// OSHA Compliance Repository
export * from './osha-compliance.repository'
