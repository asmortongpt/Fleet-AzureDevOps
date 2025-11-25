/**
 * Environment Variable Validation Module
 *
 * This module uses Zod to validate ALL critical environment variables at application startup.
 * It implements a fail-fast approach: if validation fails, the server will not start.
 *
 * Security Considerations:
 * - Ensures JWT_SECRET meets minimum length requirements (48+ characters)
 * - Ensures CSRF_SECRET meets minimum length requirements (48+ characters)
 * - Validates that no default/placeholder values are used in production
 * - Validates DATABASE_CONNECTION_STRING format
 * - Validates CORS_ORIGIN does not contain placeholder domains
 *
 * Related: CWE-287 (Improper Authentication), CWE-798 (Use of Hard-coded Credentials)
 */

import { z } from 'zod';

// ============================================================================
// Constants for Validation
// ============================================================================

/** Minimum length for security secrets (JWT, CSRF) */
const MIN_SECRET_LENGTH = 48;

/** Common weak/placeholder secret patterns to reject */
const WEAK_SECRET_PATTERNS = [
  'changeme',
  'secret',
  'password',
  'test',
  'demo',
  'default',
  'your-secret-key',
  'your_secret_key',
  'replace_me',
  'replace-me',
  'placeholder',
  'example',
  'sample',
  'todo',
  'fixme',
  'xxx',
  'abc123',
  '123456'
];

/** Placeholder domains that should never appear in production CORS_ORIGIN */
const PLACEHOLDER_DOMAINS = [
  'example.com',
  'example.org',
  'placeholder.com',
  'your-domain.com',
  'yourdomain.com',
  'your-app.com',
  'yourapp.com',
  'change-me.com',
  'changeme.com',
  'todo.com',
  'replace-me.com',
  'replaceme.com',
  'test.local',
  'dev.local'
];

/** Valid NODE_ENV values */
const VALID_NODE_ENVS = ['development', 'staging', 'production'] as const;

// ============================================================================
// Custom Zod Refinements
// ============================================================================

/**
 * Validates that a secret does not contain weak/placeholder patterns
 */
function isNotWeakSecret(value: string): boolean {
  const lowerValue = value.toLowerCase();
  return !WEAK_SECRET_PATTERNS.some(pattern => lowerValue.includes(pattern));
}

/**
 * Validates that CORS_ORIGIN does not contain placeholder domains
 */
function hasNoPlaceholderDomains(value: string): boolean {
  const lowerValue = value.toLowerCase();
  return !PLACEHOLDER_DOMAINS.some(domain => lowerValue.includes(domain));
}

/**
 * Validates PostgreSQL connection string format
 * Supports both postgresql:// and postgres:// schemes
 */
function isValidDatabaseConnectionString(value: string): boolean {
  // Accept empty string for development mode (will use individual DB_* params)
  if (!value || value.trim() === '') {
    return true;
  }

  // PostgreSQL connection string pattern:
  // postgresql://[user[:password]@][host][:port][/database][?param=value]
  const postgresPattern = /^postgres(ql)?:\/\/(([^:@]+)(:[^@]+)?@)?([^/:]+)(:\d+)?(\/[^?]+)?(\?.+)?$/;

  // Also accept Azure SQL format: Server=...;Database=...;...
  const azureSqlPattern = /^(Server|server)=.+;(Database|database)=.+/;

  return postgresPattern.test(value) || azureSqlPattern.test(value);
}

// ============================================================================
// Environment Schema Definition
// ============================================================================

/**
 * Base schema for environment variables with common validation
 */
const baseEnvSchema = z.object({
  // ==========================================
  // Application Settings
  // ==========================================
  NODE_ENV: z.enum(VALID_NODE_ENVS, {
    errorMap: () => ({
      message: 'NODE_ENV must be one of: ${VALID_NODE_ENVS.join(', ')}'
    })
  }),

  PORT: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 3000)
    .pipe(z.number().min(1).max(65535)),

  // ==========================================
  // Security - JWT
  // ==========================================
  JWT_SECRET: z.string({
    required_error: 'JWT_SECRET environment variable is required',
    invalid_type_error: 'JWT_SECRET must be a string'
  })
    .min(MIN_SECRET_LENGTH, {
      message: `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters. Current minimum is for cryptographic security. Generate with: openssl rand -base64 64`
    })
    .refine(isNotWeakSecret, {
      message: 'JWT_SECRET contains a weak/placeholder pattern. Generate a secure secret with: openssl rand -base64 64'
    }),

  JWT_EXPIRY: z.string().optional().default('24h'),

  // ==========================================
  // Security - CSRF
  // ==========================================
  CSRF_SECRET: z.string({
    required_error: 'CSRF_SECRET environment variable is required',
    invalid_type_error: 'CSRF_SECRET must be a string'
  })
    .min(MIN_SECRET_LENGTH, {
      message: `CSRF_SECRET must be at least ${MIN_SECRET_LENGTH} characters. Generate with: openssl rand -base64 64`
    })
    .refine(isNotWeakSecret, {
      message: 'CSRF_SECRET contains a weak/placeholder pattern. Generate a secure secret with: openssl rand -base64 64'
    }),

  // ==========================================
  // Database
  // ==========================================
  DATABASE_CONNECTION_STRING: z.string()
    .optional()
    .default('')
    .refine(isValidDatabaseConnectionString, {
      message: 'DATABASE_CONNECTION_STRING must be a valid PostgreSQL connection string (postgresql://user:pass@host:port/database) or Azure SQL format'
    }),

  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.string().optional(),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),

  // ==========================================
  // CORS Configuration
  // ==========================================
  CORS_ORIGIN: z.string().optional(),

  // ==========================================
  // Redis (optional)
  // ==========================================
  REDIS_URL: z.string().optional(),

  // ==========================================
  // Azure AD / Microsoft OAuth
  // ==========================================
  AZURE_AD_CLIENT_ID: z.string().optional(),
  AZURE_AD_CLIENT_SECRET: z.string().optional(),
  AZURE_AD_TENANT_ID: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_TENANT_ID: z.string().optional(),

  // ==========================================
  // Azure Key Vault
  // ==========================================
  AZURE_KEY_VAULT_URL: z.string().optional(),
  AZURE_CLIENT_ID: z.string().optional(),
  AZURE_CLIENT_SECRET: z.string().optional(),
  AZURE_TENANT_ID: z.string().optional(),

  // ==========================================
  // Feature Flags
  // ==========================================
  USE_MOCK_DATA: z.string().optional(),
  ENABLE_CACHE: z.string().optional(),
  ENABLE_RATE_LIMITING: z.string().optional()
});

/**
 * Production-specific schema with stricter validation
 */
const productionEnvSchema = baseEnvSchema.refine(
  (data) => {
    // In production, CORS_ORIGIN must not contain placeholder domains
    if (data.CORS_ORIGIN) {
      return hasNoPlaceholderDomains(data.CORS_ORIGIN);
    }
    return true;
  },
  {
    message: 'CORS_ORIGIN contains placeholder domains that should not be used in production',
    path: ['CORS_ORIGIN']
  }
).refine(
  (data) => {
    // In production, USE_MOCK_DATA must not be true
    return data.USE_MOCK_DATA !== 'true';
  },
  {
    message: 'USE_MOCK_DATA cannot be enabled in production - this would bypass authentication',
    path: ['USE_MOCK_DATA']
  }
).refine(
  (data) => {
    // In production, database must be configured
    const hasConnectionString = data.DATABASE_CONNECTION_STRING && data.DATABASE_CONNECTION_STRING.length > 0;
    const hasDatabaseUrl = data.DATABASE_URL && data.DATABASE_URL.length > 0;
    const hasDbParams = data.DB_HOST && data.DB_NAME;
    return hasConnectionString || hasDatabaseUrl || hasDbParams;
  },
  {
    message: 'Database configuration required in production (DATABASE_CONNECTION_STRING, DATABASE_URL, or DB_HOST/DB_NAME)',
    path: ['DATABASE_CONNECTION_STRING']
  }
).refine(
  (data) => {
    // In production, CORS_ORIGIN should be set (not empty)
    return data.CORS_ORIGIN && data.CORS_ORIGIN.trim().length > 0;
  },
  {
    message: 'CORS_ORIGIN must be configured in production to prevent unauthorized cross-origin requests',
    path: ['CORS_ORIGIN']
  }
);

/**
 * Staging-specific schema with moderate validation
 */
const stagingEnvSchema = baseEnvSchema.refine(
  (data) => {
    // In staging, USE_MOCK_DATA must not be true
    return data.USE_MOCK_DATA !== 'true';
  },
  {
    message: 'USE_MOCK_DATA cannot be enabled in staging - this would bypass authentication',
    path: ['USE_MOCK_DATA']
  }
);

// ============================================================================
// Validation Result Type
// ============================================================================

export type ValidatedEnv = z.infer<typeof baseEnvSchema>;

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validates all environment variables at application startup.
 *
 * This function should be called at the very beginning of server startup,
 * before any other initialization code runs. If validation fails, the
 * process will exit with code 1.
 *
 * @returns The validated environment configuration
 * @throws Will call process.exit(1) if validation fails
 */
export function validateEnv(): ValidatedEnv {
  console.log('');
  console.log('========================================');
  console.log('Environment Variable Validation');
  console.log('========================================');

  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`Environment: ${nodeEnv}`);
  console.log('');

  // Select appropriate schema based on environment
  let schema: z.ZodType<ValidatedEnv>;

  switch (nodeEnv) {
    case 'production':
      console.log('Using PRODUCTION validation rules (strictest)');
      schema = productionEnvSchema as z.ZodType<ValidatedEnv>;
      break;
    case 'staging':
      console.log('Using STAGING validation rules (moderate)');
      schema = stagingEnvSchema as z.ZodType<ValidatedEnv>;
      break;
    default:
      console.log('Using DEVELOPMENT validation rules (permissive)');
      schema = baseEnvSchema;
  }

  console.log('');

  // Perform validation
  const result = schema.safeParse(process.env);

  if (!result.success) {
    console.error('');
    console.error('========================================');
    console.error('FATAL: Environment Validation Failed');
    console.error('========================================');
    console.error('');
    console.error('The following environment variable issues were detected:');
    console.error('');

    // Format and display errors
    const errors = result.error.errors;
    errors.forEach((error, index) => {
      const path = error.path.length > 0 ? error.path.join('.') : 'unknown';
      console.error(`  ${index + 1}. ${path}`);
      console.error(`     Error: ${error.message}`);
      console.error('');
    });

    console.error('----------------------------------------');
    console.error('Resolution Steps:');
    console.error('----------------------------------------');
    console.error('');
    console.error('1. Create or update your .env file with the required variables');
    console.error('2. For secrets, generate secure values:');
    console.error('   - JWT_SECRET:  openssl rand -base64 64');
    console.error('   - CSRF_SECRET: openssl rand -base64 64');
    console.error('');
    console.error('3. For database, use one of these formats:');
    console.error('   - DATABASE_CONNECTION_STRING=postgresql://user:pass@host:5432/dbname');
    console.error('   - DATABASE_URL=postgresql://user:pass@host:5432/dbname');
    console.error('   - Or set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD individually');
    console.error('');
    console.error('4. For CORS, set allowed origins:');
    console.error('   - CORS_ORIGIN=https://your-frontend.com,https://api.your-domain.com');
    console.error('');
    console.error('========================================');
    console.error('Server startup aborted due to invalid configuration');
    console.error('========================================');
    console.error('');

    // Exit with failure code
    process.exit(1);
  }

  // Validation successful
  console.log('Validation Results:');
  console.log('');
  console.log(`  NODE_ENV:                    ${result.data.NODE_ENV}`);
  console.log(`  PORT:                        ${result.data.PORT}`);
  console.log(`  JWT_SECRET:                  [SET] (${result.data.JWT_SECRET.length} characters)`);
  console.log(`  CSRF_SECRET:                 [SET] (${result.data.CSRF_SECRET.length} characters)`);
  console.log('  DATABASE_CONNECTION_STRING:  ${result.data.DATABASE_CONNECTION_STRING ? '[SET]' : '[NOT SET - using individual params]'}');
  console.log('  CORS_ORIGIN:                 ${result.data.CORS_ORIGIN || '[NOT SET]'}');
  console.log('  REDIS_URL:                   ${result.data.REDIS_URL ? '[SET]' : '[NOT SET]'}');
  console.log('  USE_MOCK_DATA:               ${result.data.USE_MOCK_DATA || 'false'}');
  console.log('');
  console.log('========================================');
  console.log('Environment validation PASSED');
  console.log('========================================');
  console.log('');

  return result.data;
}

/**
 * Retrieves a validated environment variable value.
 * Call validateEnv() first to ensure validation has run.
 *
 * @param key The environment variable key
 * @returns The validated value or undefined
 */
export function getEnv<K extends keyof ValidatedEnv>(key: K): ValidatedEnv[K] | undefined {
  return process.env[key] as ValidatedEnv[K] | undefined;
}

/**
 * Checks if the current environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Checks if the current environment is staging
 */
export function isStaging(): boolean {
  return process.env.NODE_ENV === 'staging';
}

/**
 * Checks if the current environment is development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}

export default validateEnv;
