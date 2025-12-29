import crypto from 'crypto';
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

import { config } from './config';
import { logger } from './logger';

/**
 * Encryption Key Interface
 */
interface EncryptionKey {
  id: string;
  version: string;
  algorithm: string;
  key: Buffer;
}

/**
 * Encrypted Data Interface
 */
interface EncryptedData {
  iv: string;
  ciphertext: string;
  tag: string;
  algorithm: string;
  timestamp: number;
}

/**
 * Encryption Service with Azure Key Vault Integration
 * Implements AES-256-GCM encryption for sensitive data
 */
class EncryptionService {
  private secretClient: SecretClient | null = null;
  private masterKey: EncryptionKey | null = null;
  private readonly keyVaultUrl = process.env.AZURE_KEYVAULT_URL;
  private readonly masterKeyName = process.env.AZURE_KEYVAULT_MASTER_KEY_NAME || 'fleet-master-key';
  private keyCache: Map<string, { key: EncryptionKey; expiresAt: number }> = new Map();
  private readonly KEY_CACHE_TTL = 3600000; // 1 hour

  constructor() {
    // Initialize Azure Key Vault client if URL is configured
    if (this.keyVaultUrl) {
      try {
        const credential = new DefaultAzureCredential();
        this.secretClient = new SecretClient(this.keyVaultUrl, credential);
        logger.info('Azure Key Vault client initialized', {
          keyVaultUrl: this.keyVaultUrl,
        });
      } catch (error) {
        logger.warn('Failed to initialize Azure Key Vault client', {
          error: error instanceof Error ? error.message : error,
        });
        // Continue with fallback to environment variable
      }
    }
  }

  /**
   * Get master encryption key from Azure Key Vault or environment variable
   */
  async getMasterKey(): Promise<EncryptionKey> {
    // Check cache first
    const cached = this.keyCache.get(this.masterKeyName);
    if (cached && cached.expiresAt > Date.now()) {
      logger.debug('Using cached master key');
      return cached.key;
    }

    // Try to fetch from Azure Key Vault
    if (this.secretClient) {
      try {
        const secret = await this.secretClient.getSecret(this.masterKeyName);
        if (secret.value) {
          const keyBuffer = Buffer.from(secret.value, 'base64');
          const key: EncryptionKey = {
            id: secret.id || this.masterKeyName,
            version: secret.properties.version || 'latest',
            algorithm: 'AES-256-GCM',
            key: keyBuffer,
          };

          // Cache the key
          this.keyCache.set(this.masterKeyName, {
            key,
            expiresAt: Date.now() + this.KEY_CACHE_TTL,
          });

          logger.info('Master key retrieved from Azure Key Vault');
          return key;
        }
      } catch (error) {
        logger.warn('Failed to fetch master key from Azure Key Vault', {
          error: error instanceof Error ? error.message : error,
        });
      }
    }

    // Fallback to environment variable
    const envKey = process.env.FLEET_ENCRYPTION_KEY;
    if (!envKey) {
      throw new Error(
        'FLEET_ENCRYPTION_KEY not configured in environment. Set AZURE_KEYVAULT_URL or FLEET_ENCRYPTION_KEY.'
      );
    }

    const keyBuffer = Buffer.from(envKey, 'base64');
    const key: EncryptionKey = {
      id: 'env-key',
      version: '1.0',
      algorithm: 'AES-256-GCM',
      key: keyBuffer,
    };

    logger.info('Using master key from environment variable');
    return key;
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   * Returns: { iv, ciphertext, tag, algorithm, timestamp }
   */
  async encrypt(plaintext: string | Buffer): Promise<EncryptedData> {
    try {
      const masterKey = await this.getMasterKey();

      // Generate random IV (initialization vector)
      const iv = crypto.randomBytes(12);

      // Create cipher
      const cipher = crypto.createCipheriv('aes-256-gcm', masterKey.key, iv);

      // Encrypt data
      const data = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf-8') : plaintext;
      const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

      // Get authentication tag
      const tag = cipher.getAuthTag();

      return {
        iv: iv.toString('hex'),
        ciphertext: encrypted.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: 'AES-256-GCM',
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Encryption failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt encrypted data
   */
  async decrypt(encryptedData: EncryptedData): Promise<string> {
    try {
      const masterKey = await this.getMasterKey();

      // Reconstruct buffers from hex strings
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const ciphertext = Buffer.from(encryptedData.ciphertext, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey.key, iv);

      // Set authentication tag
      decipher.setAuthTag(tag);

      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return decrypted.toString('utf-8');
    } catch (error) {
      logger.error('Decryption failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash sensitive data using bcrypt
   * Used for passwords and other non-recoverable hashes
   */
  async hashPassword(password: string, saltRounds: number = 12): Promise<string> {
    try {
      const bcrypt = require('bcrypt');
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      logger.error('Password hashing failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify password against bcrypt hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const bcrypt = require('bcrypt');
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Password verification failed', {
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  /**
   * Create HMAC signature for data integrity verification
   */
  createSignature(data: Buffer | string): string {
    const dataBuffer = typeof data === 'string' ? Buffer.from(data) : data;
    const hmac = crypto.createHmac('sha256', this.masterKey?.key || Buffer.from('default-secret'));
    hmac.update(dataBuffer);
    return hmac.digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  verifySignature(data: Buffer | string, signature: string): boolean {
    const expectedSignature = this.createSignature(data);
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  }

  /**
   * Generate random encryption key (for testing only)
   */
  generateRandomKey(length: number = 32): Buffer {
    return crypto.randomBytes(length);
  }

  /**
   * Clear key cache (for key rotation scenarios)
   */
  clearKeyCache(): void {
    this.keyCache.clear();
    logger.info('Encryption key cache cleared');
  }

  /**
   * Rotate encryption key
   * This is a critical operation that should be performed carefully
   */
  async rotateKey(): Promise<void> {
    try {
      if (!this.secretClient) {
        throw new Error('Azure Key Vault not configured');
      }

      // Generate new key
      const newKey = this.generateRandomKey(32);
      const encodedKey = newKey.toString('base64');

      // Store new version in Key Vault
      const versionedKeyName = `${this.masterKeyName}-${Date.now()}`;
      await this.secretClient.setSecret(versionedKeyName, encodedKey);

      // Update master key reference
      await this.secretClient.setSecret(this.masterKeyName, encodedKey);

      // Clear cache to force reload
      this.clearKeyCache();

      logger.info('Master key rotated successfully', {
        newVersion: versionedKeyName,
      });
    } catch (error) {
      logger.error('Key rotation failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw new Error('Key rotation failed');
    }
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
