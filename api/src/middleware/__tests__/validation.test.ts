import { validate } from '../validation';
import { mockRequest, mockResponse, mockNext } from '../../__tests__/helpers';

describe('Validation Middleware', () => {
  it('should pass validation for valid data', () => {
    const req = mockRequest({
      body: {
        email: 'test@example.com',
        name: 'Test User'
      }
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate([
      { field: 'email', required: true, type: 'email' },
      { field: 'name', required: true, minLength: 2 }
    ]);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should reject missing required fields', () => {
    const req = mockRequest({ body: {} });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate([
      { field: 'email', required: true }
    ]);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should validate email format', () => {
    const req = mockRequest({
      body: { email: 'invalid-email' }
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate([
      { field: 'email', required: true, type: 'email' }
    ]);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('valid email')
          })
        ])
      })
    }));
  });

  it('should validate minLength', () => {
    const req = mockRequest({
      body: { password: 'short' }
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate([
      { field: 'password', required: true, minLength: 8 }
    ]);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: expect.stringContaining('at least 8')
          })
        ])
      })
    }));
  });

  it('should validate maxLength', () => {
    const req = mockRequest({
      body: { username: 'this-is-a-very-long-username-that-exceeds-limit' }
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate([
      { field: 'username', required: true, maxLength: 20 }
    ]);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('should validate UUID format', () => {
    const req = mockRequest({
      params: { id: 'not-a-uuid' }
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate([
      { field: 'id', required: true, type: 'uuid' }
    ], 'params');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: expect.stringContaining('valid UUID')
          })
        ])
      })
    }));
  });

  it('should validate string type', () => {
    const req = mockRequest({
      body: { name: 123 }
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate([
      { field: 'name', required: true, type: 'string' }
    ]);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('should validate number type', () => {
    const req = mockRequest({
      body: { age: 'not-a-number' }
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate([
      { field: 'age', required: true, type: 'number' }
    ]);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('should validate min value', () => {
    const req = mockRequest({
      body: { quantity: 0 }
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate([
      { field: 'quantity', required: true, type: 'number', min: 1 }
    ]);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('should validate max value', () => {
    const req = mockRequest({
      body: { quantity: 1000 }
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate([
      { field: 'quantity', required: true, type: 'number', max: 100 }
    ]);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('should validate with custom pattern', () => {
    const req = mockRequest({
      body: { zipcode: '1234' }
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate([
      { field: 'zipcode', required: true, pattern: /^\d{5}$/ }
    ]);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('should validate with custom function', () => {
    const req = mockRequest({
      body: { username: 'admin' }
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate([
      {
        field: 'username',
        required: true,
        custom: (value) => value !== 'admin' || 'Username "admin" is reserved'
      }
    ]);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('should skip validation for non-required empty fields', () => {
    const req = mockRequest({
      body: { optional_field: '' }
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate([
      { field: 'optional_field', required: false, minLength: 5 }
    ]);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should validate query parameters', () => {
    const req = mockRequest({
      query: { page: 'not-a-number' }
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate([
      { field: 'page', required: true, type: 'number' }
    ], 'query');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('should collect multiple validation errors', () => {
    const req = mockRequest({
      body: {
        email: 'invalid',
        password: '123',
        age: 'not-a-number'
      }
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate([
      { field: 'email', required: true, type: 'email' },
      { field: 'password', required: true, minLength: 8 },
      { field: 'age', required: true, type: 'number' }
    ]);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'password' }),
          expect.objectContaining({ field: 'age' })
        ])
      })
    }));
  });
});
