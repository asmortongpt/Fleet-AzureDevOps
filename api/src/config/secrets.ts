/**
 * Azure Key Vault Secret Management
 *
 * This module provides centralized secret management using Azure Key Vault,
 * following FedRAMP SC-28 (Protection of Information at Rest) and
 * SOC 2 CC6.1 (Logical and Physical Access Controls - Secrets Management).
 *
 * Features:
 * - Automatic secret caching to reduce Key Vault API calls
 * - Graceful fallback to environment variables in development
 * - Comprehensive error handling and logging
 * - Secret rotation support
 * - Health monitoring
 *
 * Usage:
 *
 * ```typescript
 * import { getSecret, initializeSecrets } from './config/secrets'
 *
 * // Initialize secrets at application startup
 * await initializeSecrets()
 *
 * // Retrieve secrets
 * const jwtSecret = await getSecret('jwt-secret')
 * const dbPassword = await getSecret('db-password')
 * ```
 *
 * Environment Variables Required:
 * - AZURE_KEY_VAULT_URI: Key Vault URL (e.g., https://fleet-secrets-xxx.vault.azure.net/)
 * - NODE_ENV: Environment (production, staging, development)
 *
 * For local development without Azure access:
 * - Set USE_LOCAL_SECRETS=true
 * - Secrets will fall back to .env file
 */

import { SecretClient } from '@azure/keyvault-secrets'
import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity'
import dotenv from 'dotenv'

dotenv.config()

// ============================================================================
// CONFIGURATION
// ============================================================================

const VAULT_URI = process.env.AZURE_KEY_VAULT_URI || 'https://fleet-secrets-0d326d71.vault.azure.net/'
const USE_LOCAL_SECRETS = process.env.USE_LOCAL_SECRETS === 'true' || process.env.NODE_ENV === 'test'
const ENABLE_SECRET_CACHE = process.env.ENABLE_SECRET_CACHE !== 'false' // Enabled by default
const CACHE_TTL_MS = parseInt(process.env.SECRET_CACHE_TTL_MS || '300000') // 5 minutes default

// Critical secrets that MUST be loaded at startup
const CRITICAL_SECRETS = [
  'jwt-secret',
  'db-password',
  'azure-client-secret',
  'azure-storage-connection-string'
]

// ============================================================================
// STATE
// ============================================================================

let secretClient: SecretClient | null = null
let isInitialized = false
let initializationError: Error | null = null

interface CachedSecret {
  value: string
  expiresAt: number
}

const secretCache = new Map<string, CachedSecret>()
const secretAccessLog = new Map<string, number>() // Track access count for monitoring

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the Secret Client and pre-load critical secrets
 * This should be called once during application startup
 *
 * @throws Error if critical secrets cannot be loaded in production
 */
export async function initializeSecrets(): Promise<void> {
  if (isInitialized) {
    console.log('⚠️  Secret client already initialized')
    return
  }

  console.log('🔐 Initializing Azure Key Vault secret management...')
  console.log(`   Vault URI: ${VAULT_URI}`)
  console.log(`   Environment: ${process.env.NODE_ENV}`)
  console.log(`   Local secrets mode: ${USE_LOCAL_SECRETS}`)

  try {
    if (USE_LOCAL_SECRETS) {
      console.log('⚠️  Using local .env secrets (development mode)')
      isInitialized = true
      return
    }

    // Create credential
    const credential = createCredential()

    // Initialize Secret Client
    secretClient = new SecretClient(VAULT_URI, credential)

    // Test connection by listing secrets (lightweight operation)
    const secretsIterator = secretClient.listPropertiesOfSecrets()
    await secretsIterator.next() // Just get first secret to verify access

    console.log('✅ Connected to Azure Key Vault')

    // Pre-load critical secrets
    console.log('🔄 Pre-loading critical secrets...')
    const loadPromises = CRITICAL_SECRETS.map(async (secretName) => {
      try {
        await getSecret(secretName)
        console.log(`   ✓ Loaded: ${secretName}`)
      } catch (error) {
        console.error(`   ✗ Failed to load: ${secretName}`, error)
        throw new Error(`Critical secret '${secretName}' not available`)
      }
    })

    await Promise.all(loadPromises)

    isInitialized = true
    console.log('✅ Secret initialization complete')

  } catch (error) {
    initializationError = error as Error
    console.error('❌ Secret initialization failed:', error)

    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Failed to initialize secrets in production: ${initializationError.message}`)
    } else {
      console.warn('⚠️  Falling back to local secrets due to initialization failure')
      isInitialized = true // Allow startup with local secrets
    }
  }
}

/**
 * Create Azure credential based on environment
 */
function createCredential() {
  // For local development with service principal
  if (process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET) {
    console.log('🔑 Using ClientSecretCredential (Service Principal)')
    return new ClientSecretCredential(
      process.env.AZURE_TENANT_ID,
      process.env.AZURE_CLIENT_ID,
      process.env.AZURE_CLIENT_SECRET
    )
  }

  // For Azure-hosted environments (App Service, AKS with Managed Identity)
  console.log('🔑 Using DefaultAzureCredential (Managed Identity)')
  return new DefaultAzureCredential()
}

// ============================================================================
// SECRET RETRIEVAL
// ============================================================================

/**
 * Retrieve a secret from Azure Key Vault with caching
 *
 * @param secretName - The name of the secret in Key Vault (use hyphens, not underscores)
 * @param options - Retrieval options
 * @returns The secret value
 * @throws Error if secret cannot be retrieved and no fallback exists
 *
 * @example
 * const dbPassword = await getSecret('db-password')
 * const apiKey = await getSecret('stripe-api-key', { bypassCache: true })
 */
export async function getSecret(
  secretName: string,
  options: { bypassCache?: boolean; fallbackEnvVar?: string } = {}
): Promise<string> {
  const { bypassCache = false, fallbackEnvVar } = options

  // Track access for monitoring
  secretAccessLog.set(secretName, (secretAccessLog.get(secretName) || 0) + 1)

  // Check cache first (unless bypassed)
  if (!bypassCache && ENABLE_SECRET_CACHE) {
    const cached = secretCache.get(secretName)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value
    }
  }

  // Use local secrets in development or if Key Vault unavailable
  if (USE_LOCAL_SECRETS || initializationError) {
    return getLocalSecret(secretName, fallbackEnvVar)
  }

  // Fetch from Key Vault
  try {
    if (!secretClient) {
      throw new Error('Secret client not initialized. Call initializeSecrets() first.')
    }

    const secret = await secretClient.getSecret(secretName)

    if (!secret.value) {
      throw new Error(`Secret '${secretName}' has no value`)
    }

    // Cache the secret
    if (ENABLE_SECRET_CACHE) {
      secretCache.set(secretName, {
        value: secret.value,
        expiresAt: Date.now() + CACHE_TTL_MS
      })
    }

    return secret.value

  } catch (error) {
    console.error(`Failed to retrieve secret '${secretName}' from Key Vault:`, error)

    // Try fallback to environment variable
    if (fallbackEnvVar) {
      const envValue = process.env[fallbackEnvVar]
      if (envValue) {
        console.warn(`⚠️  Using fallback environment variable: ${fallbackEnvVar}`)
        return envValue
      }
    }

    throw new Error(`Secret '${secretName}' not available and no fallback provided`)
  }
}

/**
 * Get secret from local environment variables
 * Converts Key Vault naming (hyphens) to env var naming (underscores)
 */
function getLocalSecret(secretName: string, fallbackEnvVar?: string): string {
  // Try explicit fallback first
  if (fallbackEnvVar) {
    const value = process.env[fallbackEnvVar]
    if (value) return value
  }

  // Convert secret-name to SECRET_NAME
  const envVarName = secretName.toUpperCase().replace(/-/g, '_')
  const value = process.env[envVarName]

  if (!value) {
    throw new Error(
      `Secret '${secretName}' not found in environment. ` +
      `Expected env var: ${envVarName}${fallbackEnvVar ? ` or ${fallbackEnvVar}` : ''}`
    )
  }

  return value
}

// ============================================================================
// BATCH RETRIEVAL
// ============================================================================

/**
 * Retrieve multiple secrets in parallel
 *
 * @param secretNames - Array of secret names to retrieve
 * @returns Map of secret names to values
 *
 * @example
 * const secrets = await getSecrets(['db-password', 'jwt-secret', 'api-key'])
 * const dbPassword = secrets.get('db-password')
 */
export async function getSecrets(secretNames: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  const promises = secretNames.map(async (name) => {
    try {
      const value = await getSecret(name)
      results.set(name, value)
    } catch (error) {
      console.error(`Failed to retrieve secret '${name}':`, error)
      throw error
    }
  })

  await Promise.all(promises)
  return results
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Clear the secret cache (useful after secret rotation)
 *
 * @param secretName - Optional: clear specific secret, or all if omitted
 */
export function clearSecretCache(secretName?: string): void {
  if (secretName) {
    secretCache.delete(secretName)
    console.log(`🔄 Cleared cache for secret: ${secretName}`)
  } else {
    secretCache.clear()
    console.log('🔄 Cleared all secret cache')
  }
}

/**
 * Refresh a specific secret (bypass cache and reload from Key Vault)
 *
 * @param secretName - The secret to refresh
 * @returns The updated secret value
 */
export async function refreshSecret(secretName: string): Promise<string> {
  clearSecretCache(secretName)
  return getSecret(secretName, { bypassCache: true })
}

// ============================================================================
// MONITORING & HEALTH
// ============================================================================

/**
 * Get secret management health status
 *
 * @returns Health status object
 */
export function getSecretHealthStatus() {
  return {
    initialized: isInitialized,
    error: initializationError?.message || null,
    usingLocalSecrets: USE_LOCAL_SECRETS,
    vaultUri: VAULT_URI,
    cacheEnabled: ENABLE_SECRET_CACHE,
    cacheSize: secretCache.size,
    cacheTtlMs: CACHE_TTL_MS,
    criticalSecretsLoaded: CRITICAL_SECRETS.length,
    mostAccessedSecrets: getMostAccessedSecrets(5)
  }
}

/**
 * Get statistics about secret usage
 */
function getMostAccessedSecrets(limit: number = 10) {
  return Array.from(secretAccessLog.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, accessCount: count }))
}

/**
 * Get all secrets currently in cache (names only, not values)
 */
export function getCachedSecretNames(): string[] {
  return Array.from(secretCache.keys())
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize secret names: convert env var style (UPPER_CASE) to Key Vault style (lower-case-hyphen)
 *
 * @param name - Secret name in any format
 * @returns Normalized name for Key Vault
 *
 * @example
 * normalizeSecretName('DB_PASSWORD') // 'db-password'
 * normalizeSecretName('db-password') // 'db-password'
 */
export function normalizeSecretName(name: string): string {
  return name.toLowerCase().replace(/_/g, '-')
}

/**
 * Check if secret exists in Key Vault without retrieving its value
 *
 * @param secretName - The secret to check
 * @returns True if secret exists
 */
export async function secretExists(secretName: string): Promise<boolean> {
  if (USE_LOCAL_SECRETS) {
    const envVarName = secretName.toUpperCase().replace(/-/g, '_')
    return !!process.env[envVarName]
  }

  try {
    if (!secretClient) return false
    await secretClient.getSecret(secretName)
    return true
  } catch {
    return false
  }
}

// ============================================================================
// SHUTDOWN
// ============================================================================

/**
 * Cleanup on application shutdown
 */
export function shutdownSecretManagement(): void {
  console.log('🔐 Shutting down secret management...')
  secretCache.clear()
  secretAccessLog.clear()
  isInitialized = false
  secretClient = null
  console.log('✅ Secret management shutdown complete')
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initializeSecrets,
  getSecret,
  getSecrets,
  clearSecretCache,
  refreshSecret,
  getSecretHealthStatus,
  getCachedSecretNames,
  normalizeSecretName,
  secretExists,
  shutdownSecretManagement
}
