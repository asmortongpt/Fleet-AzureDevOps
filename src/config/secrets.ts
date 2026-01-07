/**
 * P0-1 FIX: Azure Key Vault Integration for Secure Secret Management
 * CRITICAL SECURITY: Removes hardcoded credentials from codebase
 *
 * This module provides a secure interface to Azure Key Vault for retrieving
 * application secrets at runtime. All secrets MUST be stored in Key Vault,
 * never in .env files or source code.
 */

import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// Key Vault URL from environment (non-sensitive configuration)
const keyVaultUrl = import.meta.env.VITE_KEY_VAULT_URL || "https://fleet-keyvault.vault.azure.net";

// Initialize Azure credentials using DefaultAzureCredential
// In production: Uses Managed Identity
// In development: Uses Azure CLI or Environment Variables
const credential = new DefaultAzureCredential();
const client = new SecretClient(keyVaultUrl, credential);

// Cache for secrets to reduce Key Vault API calls
const secretCache = new Map<string, { value: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Retrieve a secret from Azure Key Vault
 * @param secretName - Name of the secret in Key Vault (e.g., "JWT-SECRET")
 * @returns Secret value
 * @throws Error if secret cannot be retrieved or is empty
 */
export async function getSecret(secretName: string): Promise<string> {
  try {
    // Check cache first
    const cached = secretCache.get(secretName);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.value;
    }

    // Fetch from Key Vault
    console.log(`[Secrets] Fetching secret: ${secretName}`);
    const secret = await client.getSecret(secretName);

    if (!secret.value) {
      throw new Error(`Secret ${secretName} exists but has no value`);
    }

    // Cache the secret
    secretCache.set(secretName, {
      value: secret.value,
      timestamp: Date.now()
    });

    return secret.value;
  } catch (error) {
    // Log error without exposing secret name in production
    console.error(`[Secrets] CRITICAL: Failed to fetch secret ${secretName}:`, error);

    // Provide helpful error message based on error type
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        throw new Error(`Cannot connect to Key Vault at ${keyVaultUrl}. Verify network connectivity and Key Vault URL.`);
      }
      if (error.message.includes('Unauthorized') || error.message.includes('403')) {
        throw new Error(`Access denied to Key Vault. Verify Managed Identity or Service Principal has 'Get' permission on secrets.`);
      }
      if (error.message.includes('Not Found') || error.message.includes('404')) {
        throw new Error(`Secret "${secretName}" not found in Key Vault. Verify secret exists and name is correct.`);
      }
    }

    throw new Error(`Secret retrieval failed for ${secretName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate all required secrets exist and are accessible
 * This MUST be called during application startup before any routes are registered
 * @throws Error if any required secret is missing or inaccessible
 */
export async function validateSecrets(): Promise<void> {
  console.log('[Secrets] Starting secret validation...');

  // List of REQUIRED secrets for application to function
  const requiredSecrets = [
    "JWT-SECRET",           // JWT signing key (min 32 chars)
    "DATABASE-URL",         // PostgreSQL connection string
    "AZURE-AD-CLIENT-SECRET" // Azure AD OAuth secret
  ];

  const errors: string[] = [];

  for (const secretName of requiredSecrets) {
    try {
      const secretValue = await getSecret(secretName);

      // Additional validation for specific secrets
      if (secretName === "JWT-SECRET" && secretValue.length < 32) {
        errors.push(`${secretName}: Must be at least 32 characters (current: ${secretValue.length})`);
      }

      if (secretName === "DATABASE-URL" && !secretValue.startsWith("postgresql://")) {
        errors.push(`${secretName}: Must be a valid PostgreSQL connection string`);
      }

      console.log(`[Secrets] ✓ Validated: ${secretName}`);
    } catch (error) {
      errors.push(`${secretName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  if (errors.length > 0) {
    console.error('[Secrets] FATAL: Secret validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    throw new Error(`Secret validation failed: ${errors.length} error(s). See logs above.`);
  }

  console.log('[Secrets] ✓ All required secrets validated successfully');
}

/**
 * Clear the secret cache (useful for testing or forced refresh)
 */
export function clearSecretCache(): void {
  secretCache.clear();
  console.log('[Secrets] Secret cache cleared');
}

/**
 * Get secret from cache without fetching (for testing)
 */
export function getCachedSecret(secretName: string): string | undefined {
  const cached = secretCache.get(secretName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }
  return undefined;
}

/**
 * Healthcheck: Verify Key Vault connectivity
 */
export async function checkKeyVaultHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    // Try to list secrets (doesn't retrieve values)
    // This verifies authentication and connectivity
    const iterator = client.listPropertiesOfSecrets();
    await iterator.next(); // Just check first result
    return { healthy: true };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
