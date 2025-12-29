// Dependency Injection Types
export const TYPES = {
  VehicleService: Symbol.for('VehicleService'),
  UserService: Symbol.for('UserService'),
  AuthService: Symbol.for('AuthService'),
  Database: Symbol.for('Database'),
  Logger: Symbol.for('Logger'),
  Redis: Symbol.for('Redis'),
  Queue: Symbol.for('Queue'),
};

// JWT Payload interface
export interface JWTPayload {
  userId?: string | number;
  id?: string | number;
  email: string;
  role?: string;
  tenantId?: string | number;
  tenant_id?: string | number;
  iat?: number;
  exp?: number;
}

// User interface matching codebase expectations
export interface User {
  id: string | number;
  email: string;
  tenantId: string;
  tenant_id?: string;
  role: string;
  display_name: string;
  auth_provider?: string;
  created_at?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Express Request extensions
declare global {
  namespace Express {
    interface Request {
      user?: User;
      tenantId?: string;
      userId?: string;
      version?: string;
    }
  }
}

export {};
