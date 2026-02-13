/**
 * Application Configuration Service
 *
 * Centralized configuration management with:
 * - Azure Key Vault integration
 * - Environment-based configuration
 * - Schema validation
 * - Type safety
 * - Secure credential handling
 */

import { z } from 'zod';

import logger from '../utils/logger';

import { getKeyVaultService } from './key-vault.service';

// Configuration schema with validation
const ConfigSchema = z.object({
  // Application
  app: z.object({
    name: z.string().default('Fleet Management System'),
    env: z.enum(['development', 'staging', 'production']).default('development'),
    port: z.coerce.number().default(3000),
    logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info')
  }),

  // Database
  database: z.object({
    host: z.string().default('localhost'),
    port: z.coerce.number().default(5432),
    name: z.string().default('fleet_db'),
    user: z.string(),
    password: z.string(),
    ssl: z.boolean().default(false),
    maxConnections: z.coerce.number().default(20),
    idleTimeoutMs: z.coerce.number().default(30000),
    connectionTimeoutMs: z.coerce.number().default(10000)
  }),

  // Redis
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.coerce.number().default(6379),
    password: z.string().optional(),
    db: z.coerce.number().default(0),
    enableTLS: z.boolean().default(false)
  }),

  // AI Services
  ai: z.object({
    openai: z.object({
      apiKey: z.string().optional(),
      organization: z.string().optional(),
      model: z.string().default('gpt-4')
    }),
    anthropic: z.object({
      apiKey: z.string().optional(),
      model: z.string().default('claude-3-5-sonnet-20241022')
    }),
    azureOpenAI: z.object({
      apiKey: z.string().optional(),
      endpoint: z.string().optional(),
      deploymentId: z.string().optional()
    }),
    gemini: z.object({
      apiKey: z.string().optional()
    })
  }),

  // Azure Services
  azure: z.object({
    tenantId: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    subscriptionId: z.string().optional(),
    keyVault: z.object({
      url: z.string().optional(),
      enabled: z.boolean().default(false)
    }),
    applicationInsights: z.object({
      connectionString: z.string().optional(),
      enabled: z.boolean().default(false)
    }),
    computerVision: z.object({
      endpoint: z.string().optional(),
      apiKey: z.string().optional()
    })
  }),

  // Email
  email: z.object({
    host: z.string().default('smtp.office365.com'),
    port: z.coerce.number().default(587),
    user: z.string().optional(),
    password: z.string().optional(),
    from: z.string().optional(),
    useTLS: z.boolean().default(true)
  }),

  // Security
  security: z.object({
    jwtSecret: z.string(),
    jwtExpiration: z.string().default('24h'),
    bcryptRounds: z.coerce.number().default(12),
    corsOrigins: z.array(z.string()).default([]),
    rateLimitWindowMs: z.coerce.number().default(15 * 60 * 1000),
    rateLimitMaxRequests: z.coerce.number().default(100)
  }),

  // Monitoring
  monitoring: z.object({
    sentry: z.object({
      dsn: z.string().optional(),
      environment: z.string().optional(),
      enabled: z.boolean().default(false)
    }),
    datadog: z.object({
      apiKey: z.string().optional(),
      enabled: z.boolean().default(false)
    })
  }),

  // External Services
  external: z.object({
    smartcar: z.object({
      clientId: z.string().optional(),
      clientSecret: z.string().optional()
    }),
    github: z.object({
      pat: z.string().optional()
    })
  })
});

export type AppConfig = z.infer<typeof ConfigSchema>;

class AppConfigService {
  private config: AppConfig | null = null;
  private initialized = false;

  /**
   * Initialize configuration from Key Vault and environment
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing application configuration...');

      // Get Key Vault service
      const keyVault = await getKeyVaultService();

      // Build configuration object
      const rawConfig = await this.buildConfig(keyVault);

      // Validate configuration
      this.config = ConfigSchema.parse(rawConfig);

      this.initialized = true;

      logger.info('Application configuration initialized successfully', {
        env: this.config.app.env,
        port: this.config.app.port,
        keyVaultEnabled: this.config.azure.keyVault.enabled,
        databaseHost: this.config.database.host
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      logger.error('Failed to initialize application configuration', {
        error: errMsg,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Configuration initialization failed: ${errMsg}`);
    }
  }

  /**
   * Build configuration from Key Vault and environment
   */
  private async buildConfig(keyVault: any): Promise<any> {
    const env = process.env.NODE_ENV || 'development';
    const useKeyVault = keyVault.isInitialized() && env !== 'development';

    // Helper function to get value from Key Vault or env
    const getValue = async (keyVaultKey: string, envKey: string, defaultValue?: string): Promise<string | undefined> => {
      if (useKeyVault) {
        const value = await keyVault.getSecret(keyVaultKey);
        if (value) return value;
      }
      return process.env[envKey] || defaultValue;
    };

    return {
      app: {
        name: process.env.APP_NAME || 'Fleet Management System',
        env,
        port: process.env.PORT || 3000,
        logLevel: process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug')
      },

      database: {
        host: await getValue('DB-HOST', 'DB_HOST', 'localhost'),
        port: await getValue('DB-PORT', 'DB_PORT', '5432'),
        name: await getValue('DB-NAME', 'DB_NAME', 'fleet_db'),
        user: await getValue('DB-USER', 'DB_USER', 'postgres'),
        password: await getValue('DB-PASSWORD', 'DB_PASSWORD', ''),
        ssl: process.env.DB_SSL === 'true',
        maxConnections: process.env.DB_MAX_CONNECTIONS || 20,
        idleTimeoutMs: process.env.DB_IDLE_TIMEOUT_MS || 30000,
        connectionTimeoutMs: process.env.DB_CONNECTION_TIMEOUT_MS || 10000
      },

      redis: {
        host: await getValue('REDIS-HOST', 'REDIS_HOST', 'localhost'),
        port: await getValue('REDIS-PORT', 'REDIS_PORT', '6379'),
        password: await getValue('REDIS-PASSWORD', 'REDIS_PASSWORD'),
        db: process.env.REDIS_DB || 0,
        enableTLS: process.env.REDIS_TLS === 'true'
      },

      ai: {
        openai: {
          apiKey: await getValue('OPENAI-API-KEY', 'OPENAI_API_KEY'),
          organization: await getValue('OPENAI-ORGANIZATION', 'OPENAI_ORGANIZATION'),
          model: process.env.OPENAI_MODEL || 'gpt-4'
        },
        anthropic: {
          apiKey: await getValue('ANTHROPIC-API-KEY', 'ANTHROPIC_API_KEY'),
          model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
        },
        azureOpenAI: {
          apiKey: await getValue('AZURE-OPENAI-API-KEY', 'AZURE_OPENAI_API_KEY'),
          endpoint: await getValue('AZURE-OPENAI-ENDPOINT', 'AZURE_OPENAI_ENDPOINT'),
          deploymentId: await getValue('AZURE-OPENAI-DEPLOYMENT-ID', 'AZURE_OPENAI_DEPLOYMENT_ID')
        },
        gemini: {
          apiKey: await getValue('GEMINI-API-KEY', 'GEMINI_API_KEY')
        }
      },

      azure: {
        tenantId: await getValue('AZURE-TENANT-ID', 'AZURE_TENANT_ID'),
        clientId: await getValue('AZURE-CLIENT-ID', 'AZURE_CLIENT_ID'),
        clientSecret: await getValue('AZURE-CLIENT-SECRET', 'AZURE_CLIENT_SECRET'),
        subscriptionId: await getValue('AZURE-SUBSCRIPTION-ID', 'AZURE_SUBSCRIPTION_ID'),
        keyVault: {
          url: process.env.AZURE_KEY_VAULT_URL || process.env.KEY_VAULT_URL,
          enabled: useKeyVault
        },
        applicationInsights: {
          connectionString: await getValue('APPLICATION-INSIGHTS-CONNECTION-STRING', 'APPLICATION_INSIGHTS_CONNECTION_STRING'),
          enabled: !!(await getValue('APPLICATION-INSIGHTS-CONNECTION-STRING', 'APPLICATION_INSIGHTS_CONNECTION_STRING'))
        },
        computerVision: {
          endpoint: await getValue('AZURE-COMPUTER-VISION-ENDPOINT', 'AZURE_COMPUTER_VISION_ENDPOINT'),
          apiKey: await getValue('AZURE-COMPUTER-VISION-KEY', 'AZURE_COMPUTER_VISION_KEY')
        }
      },

      email: {
        host: process.env.EMAIL_HOST || 'smtp.office365.com',
        port: process.env.EMAIL_PORT || 587,
        user: await getValue('EMAIL-USER', 'EMAIL_USER'),
        password: await getValue('EMAIL-PASSWORD', 'EMAIL_PASS'),
        from: process.env.EMAIL_FROM,
        useTLS: process.env.EMAIL_USE_TLS !== 'false'
      },

      security: {
        jwtSecret: await getValue('JWT-SECRET', 'JWT_SECRET', 'change-me-in-production'),
        jwtExpiration: process.env.JWT_EXPIRATION || '24h',
        bcryptRounds: process.env.BCRYPT_ROUNDS || 12,
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || [],
        rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
        rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 100
      },

      monitoring: {
        sentry: {
          dsn: await getValue('SENTRY-DSN', 'SENTRY_DSN'),
          environment: env,
          enabled: !!(await getValue('SENTRY-DSN', 'SENTRY_DSN'))
        },
        datadog: {
          apiKey: await getValue('DATADOG-API-KEY', 'DATADOG_API_KEY'),
          enabled: !!(await getValue('DATADOG-API-KEY', 'DATADOG_API_KEY'))
        }
      },

      external: {
        smartcar: {
          clientId: await getValue('SMARTCAR-CLIENT-ID', 'SMARTCAR_CLIENT_ID'),
          clientSecret: await getValue('SMARTCAR-CLIENT-SECRET', 'SMARTCAR_CLIENT_SECRET')
        },
        github: {
          pat: await getValue('GITHUB-PAT', 'GITHUB_PAT')
        }
      }
    };
  }

  /**
   * Get the configuration object
   */
  getConfig(): AppConfig {
    if (!this.initialized || !this.config) {
      throw new Error('Configuration service not initialized. Call initialize() first.');
    }
    return this.config;
  }

  /**
   * Get a specific configuration value by path
   */
  get<T = any>(path: string): T {
    const config = this.getConfig();
    const keys = path.split('.');
    let value: any = config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        throw new Error(`Configuration path '${path}' not found`);
      }
    }

    return value as T;
  }

  /**
   * Check if configuration is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reload configuration (useful for secret rotation)
   */
  async reload(): Promise<void> {
    logger.info('Reloading application configuration...');
    this.initialized = false;
    this.config = null;
    await this.initialize();
  }
}

// Singleton instance
let appConfigService: AppConfigService | null = null;

/**
 * Get the application configuration service
 */
export async function getAppConfig(): Promise<AppConfigService> {
  if (!appConfigService) {
    appConfigService = new AppConfigService();
    await appConfigService.initialize();
  }
  return appConfigService;
}

/**
 * Initialize configuration service (should be called at application startup)
 */
export async function initializeConfig(): Promise<AppConfig> {
  const service = await getAppConfig();
  return service.getConfig();
}

export default AppConfigService;
