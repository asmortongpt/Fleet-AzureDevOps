import jwt from 'jsonwebtoken';
import { vi } from 'vitest';

interface MockUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  tenant_id: string;
  is_active: boolean;
}

interface RequestMockOptions {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  query?: Record<string, string | string[]>;
  headers?: Record<string, string>;
  user?: MockUser;
  ip?: string;
  get?: (name: string) => string | undefined;
}

interface MockResponse {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
}

export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: '1',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'admin',
  tenant_id: '1',
  is_active: true,
  ...overrides
});

export const createAuthToken = (user = createMockUser()): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

export const mockRequest = (overrides: RequestMockOptions = {}): RequestMockOptions => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: createMockUser(),
  ...overrides
});

export const mockResponse = (): MockResponse => {
  const res = {} as MockResponse;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
};

export const mockNext = () => vi.fn();
