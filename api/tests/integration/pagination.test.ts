import request from 'supertest';

import { app } from '../../src/app';

describe('Pagination', () => {
  it('should return paginated results with default values', async () => {
    const response = await request(app)
      .get('/api/vehicles')
      .expect(200);

    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 20
    });
  });
});
