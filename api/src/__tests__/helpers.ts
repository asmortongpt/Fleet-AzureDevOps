import jwt from 'jsonwebtoken';

export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'admin',
  tenant_id: '1',
  is_active: true,
  ...overrides
});

export const createAuthToken = (user = createMockUser()) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

export const mockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: createMockUser(),
  ...overrides
});

export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

export const mockNext = () => jest.fn();
