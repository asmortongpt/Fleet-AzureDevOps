// server/src/config/jwt.config.ts

import { strict as assert } from "assert";

import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import dotenv from "dotenv";
import { createLogger, transports, format } from "winston";
import { z } from "zod";


// Load environment variables
dotenv.config();

// Initialize logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
  ],
});

// Zod schema for environment validation
const envSchema = z.object({
  AZURE_KEY_VAULT_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32).refine((s) => s !== "", "JWT_SECRET cannot be empty"),
  TENANT_ID: z.string().uuid(),
});

// Validate environment variables
const env = envSchema.safeParse(process.env);

if (!env.success) {
  logger.error("Environment validation failed", { errors: env.error.errors });
  throw new Error("Invalid environment configuration");
}

// FedRAMP SC-8: Protect the confidentiality and integrity of transmitted information
// Ensure HTTPS is used for all communications with Azure Key Vault

async function getJwtSecret(tenant_id: string): Promise<string> {
  try {
    if (env.data.AZURE_KEY_VAULT_URL) {
      const credential = new DefaultAzureCredential();
      const client = new SecretClient(env.data.AZURE_KEY_VAULT_URL, credential);
      const secret = await client.getSecret(`jwt-secret-${tenant_id}`);
      if (!secret.value || secret.value.length < 32) {
        logger.warn("Retrieved JWT secret is weak or missing", { tenant_id });
        throw new Error("Weak or missing JWT secret from Azure Key Vault");
      }
      return secret.value;
    } else {
      if (env.data.JWT_SECRET.length < 32) {
        logger.warn("Using weak JWT secret from environment variable", { tenant_id });
        throw new Error("Weak JWT secret in environment variable");
      }
      return env.data.JWT_SECRET;
    }
  } catch (error) {
    logger.error("Failed to retrieve JWT secret", { error, tenant_id });
    throw new Error("Failed to retrieve JWT secret");
  }
}

// Secret rotation support
async function rotateJwtSecret(tenant_id: string, newSecret: string): Promise<void> {
  assert(newSecret.length >= 32, "New JWT secret must be at least 32 characters long");
  try {
    if (env.data.AZURE_KEY_VAULT_URL) {
      const credential = new DefaultAzureCredential();
      const client = new SecretClient(env.data.AZURE_KEY_VAULT_URL, credential);
      await client.setSecret(`jwt-secret-${tenant_id}`, newSecret);
      logger.info("JWT secret rotated successfully", { tenant_id });
    } else {
      logger.warn("Secret rotation is not supported without Azure Key Vault", { tenant_id });
    }
  } catch (error) {
    logger.error("Failed to rotate JWT secret", { error, tenant_id });
    throw new Error("Failed to rotate JWT secret");
  }
}

export { getJwtSecret, rotateJwtSecret };