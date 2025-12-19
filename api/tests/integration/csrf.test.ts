import request from 'supertest';

import { app } from '../../src/app';

describe('CSRF Protection', () => {
  it('should reject POST request without CSRF token', async () => {
    const response = await request(app)
      .post('/api/vehicles')
      .send({ make: 'Test', model: 'Model', year: 2024 })
      .expect(403);

    expect(response.body.code).toBe('CSRF_VALIDATION_FAILED');
  });
});
