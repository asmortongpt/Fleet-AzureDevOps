/**
 * Example: Using Azure Key Vault with Connection Manager
 *
 * This file demonstrates how to integrate the existing ConnectionManager
 * with Azure Key Vault secrets instead of environment variables.
 *
 * To enable Key Vault integration:
 * 1. Ensure secrets.ts is configured (AZURE_KEY_VAULT_URI set)
 * 2. Call initializeSecrets() before initializeConnectionManager()
 * 3. Update connection-manager.ts to use getSecret() for passwords
 *
 * Example implementation below:
 */

import { Pool } from 'pg'
import { getSecret } from './secrets'
import { ConnectionError } from '../services/dal/errors'

/**
 * Initialize database configuration with secrets from Azure Key Vault
 *
 * This function replaces hardcoded environment variables with Key Vault secrets
 * for sensitive database credentials.
 *
 * @returns Database configuration object
 */
export async function getDatabaseConfigFromKeyVault() {
  try {
    // Fetch database secrets from Key Vault
    const [
      dbHost,
      dbPort,
      dbName,
      dbUser,
      dbPassword
    ] = await Promise.all([
      getSecret('db-host', { fallbackEnvVar: 'DB_HOST' }),
      getSecret('db-port', { fallbackEnvVar: 'DB_PORT' }),
      getSecret('db-name', { fallbackEnvVar: 'DB_NAME' }),
      getSecret('db-username', { fallbackEnvVar: 'DB_USER' }),
      getSecret('db-password', { fallbackEnvVar: 'DB_PASSWORD' })
    ])

    return {
      host: dbHost,
      port: parseInt(dbPort),
      database: dbName,
      user: dbUser,
      password: dbPassword,
      ssl: getDatabaseSSLConfig()
    }
  } catch (error) {
    console.error('Failed to retrieve database config from Key Vault:', error)
    throw new ConnectionError('Database configuration unavailable')
  }
}

/**
 * Database SSL configuration helper
 */
function getDatabaseSSLConfig() {
  if (process.env.DATABASE_SSL === 'true') {
    if (process.env.NODE_ENV === 'production') {
      return {
        rejectUnauthorized: true,
        ca: process.env.DB_SSL_CA,
      }
    }
    return { rejectUnauthorized: false }
  }
  return false
}

/**
 * Example: Modified ConnectionManager setupConfigurations() method
 *
 * Replace the existing setupConfigurations() in connection-manager.ts with this:
 */
export async function setupConfigurationsWithKeyVault(connectionManager: any): Promise<void> {
  // Get base config from Key Vault
  const baseConfig = await getDatabaseConfigFromKeyVault()

  // Admin pool configuration
  connectionManager.poolConfigs.set('admin', {
    ...baseConfig,
    // Admin credentials can also come from Key Vault
    user: await getSecret('db-admin-username', { fallbackEnvVar: 'DB_ADMIN_USER' }),
    password: await getSecret('db-admin-password', { fallbackEnvVar: 'DB_ADMIN_PASSWORD' }),
    max: parseInt(process.env.DB_ADMIN_POOL_SIZE || '5'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  })

  // Web app pool configuration
  connectionManager.poolConfigs.set('webapp', {
    ...baseConfig,
    max: parseInt(process.env.DB_WEBAPP_POOL_SIZE || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '2000')
  })

  // Read-only pool configuration
  connectionManager.poolConfigs.set('readonly', {
    ...baseConfig,
    user: await getSecret('db-readonly-username', { fallbackEnvVar: 'DB_READONLY_USER' }),
    password: await getSecret('db-readonly-password', { fallbackEnvVar: 'DB_READONLY_PASSWORD' }),
    max: parseInt(process.env.DB_READONLY_POOL_SIZE || '10'),
    idleTimeoutMillis: parseInt(process.env.DB_READONLY_IDLE_TIMEOUT_MS || '60000'),
    connectionTimeoutMillis: parseInt(process.env.DB_READONLY_CONNECTION_TIMEOUT_MS || '5000')
  })
}

/**
 * Example: Application Startup with Key Vault Integration
 *
 * In your server.ts or index.ts:
 */
export async function exampleStartup() {
  // Step 1: Initialize secrets from Azure Key Vault
  const { initializeSecrets } = await import('./secrets')
  await initializeSecrets()

  // Step 2: Initialize database connections
  // The connection manager will now use secrets from Key Vault
  const { initializeConnectionManager } = await import('./connection-manager')
  await initializeConnectionManager()

  // Step 3: Start your application
  console.log('Application ready with Key Vault integration')
}

/**
 * Alternative: Minimal changes approach
 *
 * If you prefer minimal code changes, you can pre-load Key Vault secrets
 * into environment variables at startup:
 */
export async function preloadSecretsToEnv() {
  const { getSecret } = await import('./secrets')

  // Map Key Vault secrets to environment variables
  const secretMapping = {
    'db-host': 'DB_HOST',
    'db-port': 'DB_PORT',
    'db-name': 'DB_NAME',
    'db-username': 'DB_USER',
    'db-password': 'DB_PASSWORD',
    'jwt-secret': 'JWT_SECRET',
    'azure-storage-connection-string': 'AZURE_STORAGE_CONNECTION_STRING'
  }

  for (const [keyVaultName, envVarName] of Object.entries(secretMapping)) {
    try {
      const value = await getSecret(keyVaultName)
      process.env[envVarName] = value
    } catch (error) {
      console.warn(`Failed to load ${keyVaultName} from Key Vault:`, error)
    }
  }

  console.log('✅ Secrets preloaded from Key Vault to environment')
}

/**
 * Then in server.ts:
 *
 * import { initializeSecrets } from './config/secrets'
 * import { preloadSecretsToEnv } from './config/connection-manager-keyvault.example'
 * import { initializeConnectionManager } from './config/connection-manager'
 *
 * async function main() {
 *   await initializeSecrets()
 *   await preloadSecretsToEnv()
 *   await initializeConnectionManager()
 *   // ... start server
 * }
 */
