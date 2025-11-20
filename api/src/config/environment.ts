import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvironmentConfig {
  // Application
  NODE_ENV: string;
  PORT: number;
  API_URL: string;
  FRONTEND_URL: string;

  // Database
  DATABASE_URL: string;
  DB_HOST?: string;
  DB_PORT?: number;
  DB_NAME?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;

  // Redis (optional - cache will be disabled if not configured)
  REDIS_URL?: string;

  // JWT Authentication
  JWT_SECRET: string;
  JWT_EXPIRY?: string;

  // Microsoft OAuth
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
  MICROSOFT_TENANT_ID?: string;
  MICROSOFT_REDIRECT_URI?: string;

  // Azure Key Vault (optional)
  AZURE_KEY_VAULT_URL?: string;
  AZURE_CLIENT_ID?: string;
  AZURE_CLIENT_SECRET?: string;
  AZURE_TENANT_ID?: string;

  // CORS
  CORS_ORIGIN?: string;

  // Feature Flags
  USE_MOCK_DATA?: string;
  ENABLE_CACHE?: string;
  ENABLE_RATE_LIMITING?: string;
}

class Environment {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validate();
  }

  private loadConfig(): EnvironmentConfig {
    return {
      // Application
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: parseInt(process.env.PORT || '3000', 10),
      API_URL: process.env.API_URL || 'http://localhost:3000',
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

      // Database
      DATABASE_URL: process.env.DATABASE_URL || '',
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,

      // Redis
      REDIS_URL: process.env.REDIS_URL,

      // JWT
      JWT_SECRET: process.env.JWT_SECRET || '',
      JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',

      // Microsoft OAuth
      MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID || process.env.AZURE_AD_CLIENT_ID,
      MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET || process.env.AZURE_AD_CLIENT_SECRET,
      MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID || process.env.AZURE_AD_TENANT_ID,
      MICROSOFT_REDIRECT_URI: process.env.MICROSOFT_REDIRECT_URI,

      // Azure Key Vault
      AZURE_KEY_VAULT_URL: process.env.AZURE_KEY_VAULT_URL,
      AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID,
      AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
      AZURE_TENANT_ID: process.env.AZURE_TENANT_ID,

      // CORS
      CORS_ORIGIN: process.env.CORS_ORIGIN,

      // Feature Flags
      USE_MOCK_DATA: process.env.USE_MOCK_DATA,
      ENABLE_CACHE: process.env.ENABLE_CACHE,
      ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING
    };
  }

  private validate(): void {
    const errors: string[] = [];

    // Critical production requirements
    if (this.config.NODE_ENV === 'production') {
      // JWT secret is absolutely required
      if (!this.config.JWT_SECRET || this.config.JWT_SECRET.length < 32) {
        errors.push('JWT_SECRET must be set and at least 32 characters in production');
      }

      // Database must be configured
      if (!this.config.DATABASE_URL && (!this.config.DB_HOST || !this.config.DB_NAME)) {
        errors.push('Database configuration required (DATABASE_URL or DB_HOST/DB_NAME)');
      }

      // Mock data not allowed in production
      if (this.config.USE_MOCK_DATA === 'true') {
        errors.push('USE_MOCK_DATA cannot be enabled in production');
      }
    }

    // Development warnings - JWT_SECRET still required even in development
    if (this.config.NODE_ENV === 'development') {
      if (!this.config.JWT_SECRET) {
        console.warn('⚠️  WARNING: JWT_SECRET not set even in development.');
        console.warn('⚠️  Set JWT_SECRET environment variable to prevent startup errors.');
        console.warn('⚠️  Generate one with: openssl rand -base64 48');
      }
    }

    // JWT_SECRET is required in all environments
    if (!this.config.JWT_SECRET) {
      errors.push('JWT_SECRET must be set in all environments (generate with: openssl rand -base64 48)');
    } else if (this.config.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    }

    if (errors.length > 0) {
      console.error('❌ Environment configuration errors:');
      errors.forEach(error => console.error(`  - ${error}`));
      throw new Error('Invalid environment configuration. Check logs above.');
    }

    console.log('✅ Environment configuration validated');
    console.log(`   - Environment: ${this.config.NODE_ENV}`);
    console.log(`   - Port: ${this.config.PORT}`);
    console.log(`   - Database: ${this.config.DATABASE_URL ? 'Configured' : 'Using individual params'}`);
    console.log(`   - Redis: ${this.config.REDIS_URL ? 'Enabled' : 'Disabled'}`);
    console.log(`   - JWT Secret: ${this.config.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - Microsoft OAuth: ${this.config.MICROSOFT_CLIENT_ID ? 'Configured' : 'Not configured'}`);
  }

  get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  getAll(): EnvironmentConfig {
    return { ...this.config };
  }

  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }
}

export const env = new Environment();
