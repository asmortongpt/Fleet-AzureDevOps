/**
 * Authorization Service - Main Export
 *
 * Production-ready authorization system for Fleet Management
 *
 * @module services/authz
 */

// Main service
export {
  AuthorizationService,
  default as AuthzService
} from './AuthorizationService';

// Type exports
export type {
  AuthorizationDecision,
  PolicyDecision,
  AuthContext,
  Policy,
  PolicyCondition,
  Role,
  Permission
} from './AuthorizationService';

// Error exports
export {
  AuthorizationError,
  PermissionDeniedError,
  RoleAssignmentError,
  PolicyEvaluationError
} from './AuthorizationService';

// Example utilities (optional, for reference)
export * as Examples from './examples';

/**
 * Quick Start:
 *
 * ```typescript
 * import { AuthorizationService } from '@/services/authz';
 * import { pool } from '@/db/connection';
 *
 * const authzService = new AuthorizationService(pool, true);
 *
 * // Simple permission check
 * const canView = await authzService.hasPermission(
 *   userId,
 *   'vehicle:view:fleet'
 * );
 *
 * // Detailed check with context
 * const decision = await authzService.checkPermission(
 *   userId,
 *   'vehicle:update:team',
 *   vehicle,
 *   { environment: { ipAddress: req.ip } }
 * );
 * ```
 */
