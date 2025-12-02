import { ApiResponse } from '../apiResponse';
import { mockResponse } from '../../__tests__/helpers';

describe('ApiResponse Utility', () => {
  describe('success', () => {
    it('should format success response', () => {
      const res = mockResponse();
      const data = { id: 1, name: 'Test' };

      ApiResponse.success(res, data, 'Operation successful');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data,
        message: 'Operation successful',
        timestamp: expect.any(String)
      }));
    });

    it('should format success response without message', () => {
      const res = mockResponse();
      const data = { id: 1, name: 'Test' };

      ApiResponse.success(res, data);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data,
        timestamp: expect.any(String)
      }));
      expect(res.json).toHaveBeenCalledWith(expect.not.objectContaining({
        message: expect.anything()
      }));
    });

    it('should use custom status code', () => {
      const res = mockResponse();
      const data = { id: 1 };

      ApiResponse.success(res, data, undefined, 201);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should include meta information', () => {
      const res = mockResponse();
      const data = [{ id: 1 }];
      const meta = { page: 1, limit: 10, total: 100 };

      ApiResponse.success(res, data, undefined, 200, meta);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data,
        meta
      }));
    });
  });

  describe('error', () => {
    it('should format error response', () => {
      const res = mockResponse();

      ApiResponse.error(res, 'Something went wrong', 'ERROR_CODE', 400);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Something went wrong',
        code: 'ERROR_CODE',
        timestamp: expect.any(String)
      }));
    });

    it('should use default error code', () => {
      const res = mockResponse();

      ApiResponse.error(res, 'Error message');

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'ERROR'
      }));
    });

    it('should include error details', () => {
      const res = mockResponse();
      const details = { field: 'email', reason: 'Invalid format' };

      ApiResponse.error(res, 'Validation error', 'VALIDATION_ERROR', 422, details);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        details
      }));
    });
  });

  describe('validationError', () => {
    it('should format validation error', () => {
      const res = mockResponse();
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' }
      ];

      ApiResponse.validationError(res, errors);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: { errors }
      }));
    });
  });

  describe('notFound', () => {
    it('should format not found error', () => {
      const res = mockResponse();

      ApiResponse.notFound(res, 'Vehicle');

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Vehicle not found',
        code: 'NOT_FOUND'
      }));
    });

    it('should use default resource name', () => {
      const res = mockResponse();

      ApiResponse.notFound(res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Resource not found'
      }));
    });
  });

  describe('unauthorized', () => {
    it('should format unauthorized error', () => {
      const res = mockResponse();

      ApiResponse.unauthorized(res, 'Invalid credentials');

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Invalid credentials',
        code: 'UNAUTHORIZED'
      }));
    });

    it('should use default message', () => {
      const res = mockResponse();

      ApiResponse.unauthorized(res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Unauthorized'
      }));
    });
  });

  describe('forbidden', () => {
    it('should format forbidden error', () => {
      const res = mockResponse();

      ApiResponse.forbidden(res, 'Access denied');

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Access denied',
        code: 'FORBIDDEN'
      }));
    });
  });

  describe('serverError', () => {
    it('should format server error', () => {
      const res = mockResponse();

      ApiResponse.serverError(res, 'Database connection failed');

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Database connection failed',
        code: 'SERVER_ERROR'
      }));
    });

    it('should include error details', () => {
      const res = mockResponse();
      const details = { stack: 'Error stack trace...' };

      ApiResponse.serverError(res, 'Internal error', details);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        details
      }));
    });
  });

  describe('paginated', () => {
    it('should format paginated response', () => {
      const res = mockResponse();
      const data = [{ id: 1 }, { id: 2 }];

      ApiResponse.paginated(res, data, 1, 10, 100);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data,
        meta: expect.objectContaining({
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
          hasNextPage: true,
          hasPreviousPage: false
        })
      }));
    });

    it('should calculate pagination correctly for last page', () => {
      const res = mockResponse();
      const data = [{ id: 91 }, { id: 92 }];

      ApiResponse.paginated(res, data, 10, 10, 92);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        meta: expect.objectContaining({
          page: 10,
          totalPages: 10,
          hasNextPage: false,
          hasPreviousPage: true
        })
      }));
    });
  });

  describe('created', () => {
    it('should format created response', () => {
      const res = mockResponse();
      const data = { id: 1, name: 'New Resource' };

      ApiResponse.created(res, data);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data,
        message: 'Resource created successfully'
      }));
    });

    it('should use custom message', () => {
      const res = mockResponse();
      const data = { id: 1 };

      ApiResponse.created(res, data, 'Vehicle created');

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Vehicle created'
      }));
    });
  });

  describe('noContent', () => {
    it('should send 204 response', () => {
      const res = mockResponse();

      ApiResponse.noContent(res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
