/**
 * Secrets Management Service - Public API
 *
 * Export all public types and the service factory function.
 */

export {
  SecretsManagementService,
  createSecretsService,
  SecretMetadata,
  RotationPolicy,
  SecretVersion,
  AccessLog,
  ExpiringSecret,
  SecretHealthReport,
  RotationResult,
  SecretPermission,
} from './SecretsManagementService';

// Re-export for convenience
export type { Pool } from 'pg';
