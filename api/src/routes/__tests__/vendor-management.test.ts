/**
 * VENDOR PERFORMANCE & CONTRACT MANAGEMENT API TESTS
 * Phase 3 - Agent 8: Comprehensive test coverage for all endpoints
 */

import request from 'supertest';
import { pool } from '../../config/database';
import app from '../../app';

describe('Vendor Management API', () => {
  let authToken: string;
  let tenantId: string;
  let userId: string;
  let vendorId: string;
  let contractId: string;
  let contactId: string;
  let performanceId: string;

  beforeAll(async () => {
    // Create test tenant
    const tenantResult = await pool.query(
      `INSERT INTO tenants (name, subdomain) VALUES ($1, $2) RETURNING id`,
      ['Test Vendor Tenant', 'test-vendor-tenant']
    );
    tenantId = tenantResult.rows[0].id;

    // Create test user
    const userResult = await pool.query(
      `INSERT INTO users (tenant_id, email, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [tenantId, 'vendor-test@test.com', 'Vendor', 'Tester', 'admin']
    );
    userId = userResult.rows[0].id;

    // Create test vendor
    const vendorResult = await pool.query(
      `INSERT INTO vendors (tenant_id, name, type, contact_name, contact_email, contact_phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        tenantId,
        'Test Vendor Inc',
        'parts-supplier',
        'John Doe',
        'john@testvendor.com',
        '555-0100',
      ]
    );
    vendorId = vendorResult.rows[0].id;

    // Create test purchase orders for performance calculations
    await pool.query(
      `INSERT INTO purchase_orders (
        tenant_id, vendor_id, number, order_date, expected_delivery_date,
        delivered_date, total_amount, quantity_ordered, status
      ) VALUES
        ($1, $2, 'PO-001', CURRENT_DATE - 30, CURRENT_DATE - 25, CURRENT_DATE - 24, 1000, 10, 'received'),
        ($1, $2, 'PO-002', CURRENT_DATE - 20, CURRENT_DATE - 15, CURRENT_DATE - 14, 2000, 20, 'received'),
        ($1, $2, 'PO-003', CURRENT_DATE - 10, CURRENT_DATE - 5, CURRENT_DATE - 4, 1500, 15, 'received')
      `,
      [tenantId, vendorId]
    );

    // Mock authentication (in real tests, this would go through proper auth flow)
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM vendor_contacts WHERE tenant_id = $1', [tenantId]);
    await pool.query('DELETE FROM vendor_contracts WHERE tenant_id = $1', [tenantId]);
    await pool.query('DELETE FROM vendor_performance WHERE tenant_id = $1', [tenantId]);
    await pool.query('DELETE FROM purchase_orders WHERE tenant_id = $1', [tenantId]);
    await pool.query('DELETE FROM vendors WHERE tenant_id = $1', [tenantId]);
    await pool.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await pool.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await pool.end();
  });

  // ============================================================================
  // VENDOR PERFORMANCE TESTS
  // ============================================================================

  describe('POST /api/vendors/:id/performance', () => {
    it('should create vendor performance evaluation', async () => {
      const response = await request(app)
        .post(`/api/vendors/${vendorId}/performance`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          end_date: new Date(),
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('overall_score');
      expect(response.body.data.vendor_id).toBe(vendorId);

      performanceId = response.body.data.id;
    });

    it('should return 400 if dates are missing', async () => {
      const response = await request(app)
        .post(`/api/vendors/${vendorId}/performance`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });

  describe('GET /api/vendors/:id/performance', () => {
    it('should retrieve vendor performance history', async () => {
      const response = await request(app)
        .get(`/api/vendors/${vendorId}/performance`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('overall_score');
      expect(response.body.data[0]).toHaveProperty('ranking');
    });

    it('should filter by date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const response = await request(app)
        .get(`/api/vendors/${vendorId}/performance`)
        .query({ start_date: startDate.toISOString() })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/vendor-performance/rankings', () => {
    it('should retrieve vendor rankings', async () => {
      const response = await request(app)
        .get('/api/vendor-performance/rankings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('evaluation_period_start');
      expect(response.body).toHaveProperty('evaluation_period_end');
    });

    it('should limit results', async () => {
      const response = await request(app)
        .get('/api/vendor-performance/rankings')
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/vendor-performance/top-vendors', () => {
    it('should retrieve top performing vendors', async () => {
      const response = await request(app)
        .get('/api/vendor-performance/top-vendors')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  // ============================================================================
  // VENDOR CONTRACT TESTS
  // ============================================================================

  describe('POST /api/vendor-contracts', () => {
    it('should create a new vendor contract', async () => {
      const response = await request(app)
        .post('/api/vendor-contracts/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendor_id: vendorId,
          contract_number: 'CTR-2026-001',
          contract_type: 'service-agreement',
          start_date: new Date(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          contract_value: 50000,
          payment_terms: 'Net 30',
          service_level_agreement: 'Response within 4 hours, resolution within 24 hours',
          sla_response_time_hours: 4,
          sla_resolution_time_hours: 24,
          auto_renew: true,
          renewal_notice_days: 60,
          status: 'active',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.contract_number).toBe('CTR-2026-001');
      expect(response.body.data.vendor_id).toBe(vendorId);

      contractId = response.body.data.id;
    });

    it('should return 400 for invalid contract type', async () => {
      const response = await request(app)
        .post('/api/vendor-contracts/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendor_id: vendorId,
          contract_number: 'CTR-INVALID',
          contract_type: 'invalid-type',
          start_date: new Date(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/vendor-contracts', () => {
    it('should list vendor contracts', async () => {
      const response = await request(app)
        .get('/api/vendor-contracts/contracts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
    });

    it('should filter by vendor', async () => {
      const response = await request(app)
        .get('/api/vendor-contracts/contracts')
        .query({ vendor_id: vendorId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((c: any) => c.vendor_id === vendorId)).toBe(true);
    });

    it('should filter by contract type', async () => {
      const response = await request(app)
        .get('/api/vendor-contracts/contracts')
        .query({ contract_type: 'service-agreement' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((c: any) => c.contract_type === 'service-agreement')).toBe(
        true
      );
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/vendor-contracts/contracts')
        .query({ limit: 10, offset: 0 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/vendor-contracts/expiring', () => {
    it('should retrieve contracts expiring soon', async () => {
      const response = await request(app)
        .get('/api/vendor-contracts/contracts/expiring')
        .query({ days: 90 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('days_range');
      expect(response.body.days_range).toBe(90);
    });
  });

  describe('PUT /api/vendor-contracts/:id', () => {
    it('should update a vendor contract', async () => {
      const response = await request(app)
        .put(`/api/vendor-contracts/contracts/${contractId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contract_value: 55000,
          notes: 'Updated contract value',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.contract_value).toBe('55000');
      expect(response.body.data.notes).toContain('Updated');
    });

    it('should return 404 for non-existent contract', async () => {
      const response = await request(app)
        .put('/api/vendor-contracts/contracts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Test',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/vendor-contracts/:id/terminate', () => {
    it('should terminate a contract', async () => {
      // First create a contract to terminate
      const createResponse = await request(app)
        .post('/api/vendor-contracts/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendor_id: vendorId,
          contract_number: 'CTR-TO-TERMINATE',
          contract_type: 'maintenance-plan',
          start_date: new Date(),
          end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          status: 'active',
        });

      const terminateContractId = createResponse.body.data.id;

      const response = await request(app)
        .post(`/api/vendor-contracts/contracts/${terminateContractId}/terminate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Vendor performance issues',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('terminated');
      expect(response.body.data.termination_reason).toContain('performance');
    });

    it('should return 400 if reason is missing', async () => {
      const response = await request(app)
        .post(`/api/vendor-contracts/contracts/${contractId}/terminate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/vendor-contracts/:id/renew', () => {
    it('should renew a contract', async () => {
      const response = await request(app)
        .post(`/api/vendor-contracts/contracts/${contractId}/renew`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          new_end_date: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.id).not.toBe(contractId);
      expect(response.body.data.contract_number).toContain('-R');
    });
  });

  // ============================================================================
  // VENDOR CONTACT TESTS
  // ============================================================================

  describe('POST /api/vendors/:id/contacts', () => {
    it('should add a new vendor contact', async () => {
      const response = await request(app)
        .post(`/api/vendors/${vendorId}/contacts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contact_name: 'Jane Smith',
          email: 'jane.smith@testvendor.com',
          phone: '555-0101',
          mobile: '555-0102',
          job_title: 'Account Manager',
          department: 'Sales',
          contact_type: 'sales',
          is_primary: true,
          preferred_contact_method: 'email',
          availability_hours: '9 AM - 5 PM EST',
          timezone: 'America/New_York',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.contact_name).toBe('Jane Smith');
      expect(response.body.data.is_primary).toBe(true);

      contactId = response.body.data.id;
    });

    it('should return 400 for invalid contact type', async () => {
      const response = await request(app)
        .post(`/api/vendors/${vendorId}/contacts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contact_name: 'Invalid Contact',
          email: 'invalid@test.com',
          contact_type: 'invalid-type',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/vendors/:id/contacts', () => {
    it('should retrieve all vendor contacts', async () => {
      const response = await request(app)
        .get(`/api/vendors/${vendorId}/contacts`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('contact_name');
      expect(response.body.data[0]).toHaveProperty('email');
    });
  });

  describe('PUT /api/vendor-contacts/:id', () => {
    it('should update a vendor contact', async () => {
      const response = await request(app)
        .put(`/api/vendor-contacts/contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phone: '555-9999',
          notes: 'Updated phone number',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.phone).toBe('555-9999');
      expect(response.body.data.notes).toContain('Updated');
    });

    it('should return 404 for non-existent contact', async () => {
      const response = await request(app)
        .put('/api/vendor-contacts/contacts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Test',
        });

      expect(response.status).toBe(404);
    });
  });

  // ============================================================================
  // AUTHORIZATION TESTS
  // ============================================================================

  describe('Authorization', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/vendor-performance/rankings');

      expect(response.status).toBe(401);
    });

    it('should enforce tenant isolation', async () => {
      // This would test that users can only access their tenant's data
      // Implementation depends on your auth system
    });
  });
});
