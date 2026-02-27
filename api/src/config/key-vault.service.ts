/**
 * Azure Key Vault Service
 *
 * Secure credential management using Azure Key Vault
 * Implements best practices:
 * - Centralized secret management
 * - Automatic secret rotation support
 * - Caching with TTL
 * - Fallback to environment variables for local development
 * - Comprehensive error handling and logging
 */

import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

import logger from '../utils/logger';

// Cache configuration
interface SecretCache {
  value: string;
  expiresAt: number;
}

interface KeyVaultConfig {
  vaultUrl: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  cacheTTL?: number; // in milliseconds
  enableCache?: boolean;
  fallbackToEnv?: boolean;
}

export class KeyVaultService {
  private client: SecretClient | null = null;
  private cache: Map<string, SecretCache> = new Map();
  private config: Required<KeyVaultConfig>;
  private initialized = false;

  constructor(config: KeyVaultConfig) {
    this.config = {
      vaultUrl: config.vaultUrl,
      tenantId: config.tenantId || process.env.AZURE_TENANT_ID || '',
      clientId: config.clientId || process.env.AZURE_CLIENT_ID || '',
      clientSecret: config.clientSecret || process.env.AZURE_CLIENT_SECRET || '',
      cacheTTL: config.cacheTTL || 5 * 60 * 1000, // 5 minutes default
      enableCache: config.enableCache !== false, // enabled by default
      fallbackToEnv: config.fallbackToEnv !== false // enabled by default
    };
  }

  /**
   * Initialize the Key Vault client
   */
  async initialize(): Promise<void> {
    try {
      // Validate configuration
      if (!this.config.vaultUrl) {
        throw new Error('Key Vault URL is required');
      }

      // Create credential based on available configuration
      let credential;

      if (this.config.clientId && this.config.clientSecret && this.config.tenantId) {
        // Use service principal authentication
        credential = new ClientSecretCredential(
          this.config.tenantId,
          this.config.clientId,
          this.config.clientSecret
        );
        logger.info('Key Vault: Using service principal authentication');
      } else {
        // Use managed identity or Azure CLI authentication
        credential = new DefaultAzureCredential();
        logger.info('Key Vault: Using default Azure credential (managed identity or Azure CLI)');
      }

      // Create the Key Vault client
      this.client = new SecretClient(this.config.vaultUrl, credential);

      // Test connection
      await this.testConnection();

      this.initialized = true;
      logger.info('Key Vault service initialized successfully', {
        vaultUrl: this.config.vaultUrl,
        cacheEnabled: this.config.enableCache,
        cacheTTL: this.config.cacheTTL
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      logger.error('Failed to initialize Key Vault service', {
        error: errMsg,
        vaultUrl: this.config.vaultUrl
      });

      if (!this.config.fallbackToEnv) {
        throw error;
      }

      logger.warn('Key Vault initialization failed, falling back to environment variables');
    }
  }

  /**
   * Test Key Vault connection
   */
  private async testConnection(): Promise<void> {
    if (!this.client) {
      throw new Error('Key Vault client not initialized');
    }

    try {
      // Try to list secrets (just to test connection)
      const secretsIterator = this.client.listPropertiesOfSecrets();
      await secretsIterator.next();
      logger.info('Key Vault connection test successful');
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      logger.error('Key Vault connection test failed', { error: errMsg });
      throw new Error(`Key Vault connection failed: ${errMsg}`);
    }
  }

  /**
   * Get a secret from Key Vault
   * Falls back to environment variable if Key Vault is unavailable
   */
  async getSecret(secretName: string): Promise<string | null> {
    // Check cache first
    if (this.config.enableCache) {
      const cached = this.getCachedSecret(secretName);
      if (cached !== null) {
        return cached;
      }
    }

    // Try to get from Key Vault
    if (this.initialized && this.client) {
      try {
        const secret = await this.client.getSecret(secretName);

        if (secret.value) {
          // Cache the secret
          if (this.config.enableCache) {
            this.cacheSecret(secretName, secret.value);
          }

          logger.debug(`Secret '${secretName}' retrieved from Key Vault`);
          return secret.value;
        }
      } catch (error: unknown) {
        logger.warn(`Failed to get secret '${secretName}' from Key Vault: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`);
      }
    }

    // Fallback to environment variable
    if (this.config.fallbackToEnv) {
      const envValue = process.env[secretName];
      if (envValue) {
        logger.debug(`Secret '${secretName}' retrieved from environment variable`);
        return envValue;
      }
    }

    logger.warn(`Secret '${secretName}' not found in Key Vault or environment`);
    return null;
  }

  /**
   * Get multiple secrets at once
   */
  async getSecrets(secretNames: string[]): Promise<Record<string, string | null>> {
    const secrets: Record<string, string | null> = {};

    await Promise.all(
      secretNames.map(async (name) => {
        secrets[name] = await this.getSecret(name);
      })
    );

    return secrets;
  }

  /**
   * Set a secret in Key Vault (admin operation)
   */
  async setSecret(secretName: string, secretValue: string): Promise<void> {
    if (!this.initialized || !this.client) {
      throw new Error('Key Vault service not initialized');
    }

    try {
      await this.client.setSecret(secretName, secretValue);
      logger.info(`Secret '${secretName}' set in Key Vault`);

      // Invalidate cache
      this.cache.delete(secretName);
    } catch (error: unknown) {
      logger.error(`Failed to set secret '${secretName}' in Key Vault`, {
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
      throw error;
    }
  }

  /**
   * Delete a secret from Key Vault (admin operation)
   */
  async deleteSecret(secretName: string): Promise<void> {
    if (!this.initialized || !this.client) {
      throw new Error('Key Vault service not initialized');
    }

    try {
      const poller = await this.client.beginDeleteSecret(secretName);
      await poller.pollUntilDone();
      logger.info(`Secret '${secretName}' deleted from Key Vault`);

      // Invalidate cache
      this.cache.delete(secretName);
    } catch (error: unknown) {
      logger.error(`Failed to delete secret '${secretName}' from Key Vault`, {
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
      throw error;
    }
  }

  /**
   * List all secrets in Key Vault (admin operation)
   */
  async listSecrets(): Promise<string[]> {
    if (!this.initialized || !this.client) {
      throw new Error('Key Vault service not initialized');
    }

    const secretNames: string[] = [];

    try {
      for await (const secretProperties of this.client.listPropertiesOfSecrets()) {
        if (secretProperties.name) {
          secretNames.push(secretProperties.name);
        }
      }

      logger.info(`Listed ${secretNames.length} secrets from Key Vault`);
      return secretNames;
    } catch (error: unknown) {
      logger.error('Failed to list secrets from Key Vault', {
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
      throw error;
    }
  }

  /**
   * Get cached secret
   */
  private getCachedSecret(secretName: string): string | null {
    const cached = this.cache.get(secretName);

    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(secretName);
      return null;
    }

    return cached.value;
  }

  /**
   * Cache a secret
   */
  private cacheSecret(secretName: string, value: string): void {
    this.cache.set(secretName, {
      value,
      expiresAt: Date.now() + this.config.cacheTTL
    });
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Key Vault cache cleared');
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    let cleared = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      logger.debug(`Cleared ${cleared} expired cache entries`);
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; ttl: number } {
    return {
      size: this.cache.size,
      ttl: this.config.cacheTTL
    };
  }
}

// Singleton instance
let keyVaultService: KeyVaultService | null = null;

/**
 * Initialize and get the Key Vault service singleton
 */
export async function getKeyVaultService(): Promise<KeyVaultService> {
  if (!keyVaultService) {
    const vaultUrl = process.env.AZURE_KEY_VAULT_URL ||
                     process.env.KEY_VAULT_URL ||
                     'https://fleet-secrets.vault.azure.net/';

    keyVaultService = new KeyVaultService({
      vaultUrl,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      enableCache: true,
      fallbackToEnv: process.env.NODE_ENV === 'development'
    });

    await keyVaultService.initialize();

    // Set up periodic cache cleanup
    setInterval(() => {
      keyVaultService?.clearExpiredCache();
    }, 60 * 1000); // Every minute
  }

  return keyVaultService;
}

export default KeyVaultService;
