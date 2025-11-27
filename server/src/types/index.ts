// Type definitions for Fleet Management API

export interface User {
  id: number;
  email: string;
  microsoft_id: string | null;
  display_name: string | null;
  role: 'admin' | 'user' | 'viewer';
  tenant_id: number;
  auth_provider: 'microsoft' | 'local';
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface MicrosoftTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
  id_token?: string;
}

export interface MicrosoftUserProfile {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  azureAd: {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    redirectUri: string;
    authority: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  database: DatabaseConfig;
  redis: {
    host: string;
    port: number;
  };
  frontendUrl: string;
  logLevel: string;
}
