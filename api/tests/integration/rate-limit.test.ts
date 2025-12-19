import request from 'supertest';

import { app } from '../../src/app';

describe('Rate Limiting', () => {
  it('should rate limit excessive requests', async () => {
    for (let i = 0; i < 100; i++) {
      await request(app).get('/api/vehicles');
    }

    const response = await request(app)
      .get('/api/vehicles')
      .expect(429);

    expect(response.body.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
