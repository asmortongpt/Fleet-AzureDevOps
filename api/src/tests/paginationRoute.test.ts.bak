import request from 'supertest';

import app from '../app';
import { PAGINATION } from '../config/constants';

describe('Pagination Route', () => {
  it('should return vehicles with default pagination', async () => {
    const response = await request(app).get('/vehicles');
    expect(response.status).toBe(200);
    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(PAGINATION.DEFAULT_PAGE_SIZE);
  });

  it('should return vehicles with custom pagination', async () => {
    const response = await request(app).get('/vehicles?page=2&pageSize=25');
    expect(response.status).toBe(200);
    expect(response.body.page).toBe(2);
    expect(response.body.pageSize).toBe(25);
  });

  it('should handle invalid page size', async () => {
    const response = await request(app).get('/vehicles?pageSize=600');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid request');
    expect(response.body.message).toBe('Page size too large');
  });
});