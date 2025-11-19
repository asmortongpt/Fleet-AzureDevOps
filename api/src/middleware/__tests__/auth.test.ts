import { authenticateJWT, authorize } from '../auth';
import { mockRequest, mockResponse, mockNext, createAuthToken, createMockUser } from '../../__tests__/helpers';
import jwt from 'jsonwebtoken';

describe('Authentication Middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test-secret';
    process.env.USE_MOCK_DATA = 'false';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('authenticateJWT', () => {
    it('should authenticate valid JWT token', () => {
      const token = createAuthToken();
      const req = mockRequest({
        headers: { authorization: `Bearer ${token}` },
        user: undefined
      });
      const res = mockResponse();
      const next = mockNext();

      authenticateJWT(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.email).toBe('test@example.com');
    });

    it('should skip authentication if user already exists', () => {
      const existingUser = createMockUser({ email: 'existing@example.com' });
      const req = mockRequest({ user: existingUser });
      const res = mockResponse();
      const next = mockNext();

      authenticateJWT(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.email).toBe('existing@example.com');
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject missing token', () => {
      const req = mockRequest({ headers: {}, user: undefined });
      const res = mockResponse();
      const next = mockNext();

      authenticateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      const req = mockRequest({
        headers: { authorization: 'Bearer invalid-token' },
        user: undefined
      });
      const res = mockResponse();
      const next = mockNext();

      authenticateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });

    it('should reject expired token', () => {
      const expiredToken = jwt.sign(
        { id: '1', email: 'test@example.com' },
        'test-secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );
      const req = mockRequest({
        headers: { authorization: `Bearer ${expiredToken}` },
        user: undefined
      });
      const res = mockResponse();
      const next = mockNext();

      authenticateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });

    it('should bypass authentication when USE_MOCK_DATA is true', () => {
      process.env.USE_MOCK_DATA = 'true';
      const req = mockRequest({ headers: {}, user: undefined });
      const res = mockResponse();
      const next = mockNext();

      authenticateJWT(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.email).toBe('demo@fleet.local');
      expect(req.user.role).toBe('admin');
    });

    it('should return 500 if JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      const token = createAuthToken();
      const req = mockRequest({
        headers: { authorization: `Bearer ${token}` },
        user: undefined
      });
      const res = mockResponse();
      const next = mockNext();

      authenticateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server configuration error' });
    });
  });

  describe('authorize', () => {
    it('should allow user with correct role', () => {
      const req = mockRequest({
        user: createMockUser({ role: 'admin' }),
        method: 'POST'
      });
      const res = mockResponse();
      const next = mockNext();

      const middleware = authorize('admin', 'fleet_manager');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow all authenticated users for GET requests', () => {
      const req = mockRequest({
        user: createMockUser({ role: 'viewer' }),
        method: 'GET'
      });
      const res = mockResponse();
      const next = mockNext();

      const middleware = authorize('admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject user with incorrect role for non-GET requests', () => {
      const req = mockRequest({
        user: createMockUser({ role: 'viewer' }),
        method: 'POST'
      });
      const res = mockResponse();
      const next = mockNext();

      const middleware = authorize('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        required: ['admin'],
        current: 'viewer'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests', () => {
      const req = mockRequest({ user: undefined });
      const res = mockResponse();
      const next = mockNext();

      const middleware = authorize('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow multiple roles', () => {
      const req = mockRequest({
        user: createMockUser({ role: 'fleet_manager' }),
        method: 'POST'
      });
      const res = mockResponse();
      const next = mockNext();

      const middleware = authorize('admin', 'fleet_manager', 'supervisor');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
