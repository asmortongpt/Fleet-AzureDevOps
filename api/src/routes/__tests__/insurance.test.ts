/**
 * Insurance & Claims Management Routes Tests
 * Comprehensive test suite for insurance policies and claims
 */

import request from 'supertest';
import { Pool } from 'pg';

import app from '../../app';
import { pool } from '../../db/connection';
import { InsuranceClaimsService } from '../../services/insurance-claims';
import { COIGeneratorService } from '../../services/coi-generator';

describe('Insurance & Claims Management Routes', () => {
  let authToken: string;
  let tenantId: string;
  let userId: string;
  let policyId: string;
  let incidentId: string;
  let claimId: string;
  let vehicleId: string;
  let driverId: string;

  beforeAll(async () => {
    // Setup test data
    const tenantResult = await pool.query(
      `INSERT INTO tenants (name, slug) VALUES ('Test Tenant', 'test-tenant') RETURNING id`
    );
    tenantId = tenantResult.rows[0].id;

    const userResult = await pool.query(
      `INSERT INTO users (tenant_id, email, first_name, last_name, role)
       VALUES ($1, 'test@example.com', 'Test', 'User', 'Admin') RETURNING id`,
      [tenantId]
    );
    userId = userResult.rows[0].id;

    // Create test vehicle
    const vehicleResult = await pool.query(
      `INSERT INTO vehicles (tenant_id, unit_number, vin, make, model, year, status)
       VALUES ($1, 'TEST-001', 'TEST123456789', 'Ford', 'F-150', 2024, 'active') RETURNING id`,
      [tenantId]
    );
    vehicleId = vehicleResult.rows[0].id;

    // Create test driver
    const driverResult = await pool.query(
      `INSERT INTO drivers (tenant_id, first_name, last_name, email, license_number)
       VALUES ($1, 'John', 'Doe', 'john@example.com', 'DL123456') RETURNING id`,
      [tenantId]
    );
    driverId = driverResult.rows[0].id;

    // Generate mock JWT token
    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    // Cleanup test data
    await pool.query('DELETE FROM insurance_claims WHERE tenant_id = $1', [tenantId]);
    await pool.query('DELETE FROM vehicle_insurance_assignments WHERE tenant_id = $1', [tenantId]);
    await pool.query('DELETE FROM driver_insurance_assignments WHERE tenant_id = $1', [tenantId]);
    await pool.query('DELETE FROM insurance_policies WHERE tenant_id = $1', [tenantId]);
    await pool.query('DELETE FROM incidents WHERE tenant_id = $1', [tenantId]);
    await pool.query('DELETE FROM vehicles WHERE tenant_id = $1', [tenantId]);
    await pool.query('DELETE FROM drivers WHERE tenant_id = $1', [tenantId]);
    await pool.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await pool.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await pool.end();
  });

  describe('POST /api/insurance/policies', () => {
    it('should create a new insurance policy', async () => {
      const policyData = {
        policy_number: 'POL-TEST-001',
        policy_type: 'comprehensive',
        insurance_carrier: 'Test Insurance Co.',
        carrier_contact_name: 'Jane Smith',
        carrier_contact_phone: '555-1234',
        carrier_contact_email: 'jane@testinsurance.com',
        policy_start_date: '2026-01-01',
        policy_end_date: '2026-12-31',
        premium_amount: 5000.0,
        premium_frequency: 'annual',
        deductible_amount: 500.0,
        coverage_limits: {
          bodily_injury: 1000000,
          property_damage: 500000,
          collision: 100000,
          comprehensive: 100000,
        },
        auto_renew: true,
        renewal_notice_days: 60,
        notes: 'Test policy for comprehensive fleet coverage',
      };

      const response = await request(app)
        .post('/api/insurance/policies')
        .set('Authorization', authToken)
        .send(policyData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.policy_number).toBe(policyData.policy_number);
      expect(response.body.insurance_carrier).toBe(policyData.insurance_carrier);
      expect(response.body.status).toBe('active');

      policyId = response.body.id;
    });

    it('should reject policy with invalid dates', async () => {
      const invalidPolicyData = {
        policy_number: 'POL-INVALID-001',
        policy_type: 'liability',
        insurance_carrier: 'Test Insurance Co.',
        policy_start_date: '2026-12-31',
        policy_end_date: '2026-01-01', // End before start
        premium_amount: 3000.0,
        coverage_limits: {
          bodily_injury: 500000,
        },
      };

      await request(app)
        .post('/api/insurance/policies')
        .set('Authorization', authToken)
        .send(invalidPolicyData)
        .expect(400);
    });

    it('should reject duplicate policy number', async () => {
      const duplicatePolicyData = {
        policy_number: 'POL-TEST-001', // Same as first test
        policy_type: 'collision',
        insurance_carrier: 'Another Insurance Co.',
        policy_start_date: '2026-01-01',
        policy_end_date: '2026-12-31',
        premium_amount: 4000.0,
        coverage_limits: {
          collision: 75000,
        },
      };

      await request(app)
        .post('/api/insurance/policies')
        .set('Authorization', authToken)
        .send(duplicatePolicyData)
        .expect(409);
    });
  });

  describe('GET /api/insurance/policies', () => {
    it('should list all insurance policies', async () => {
      const response = await request(app)
        .get('/api/insurance/policies')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should filter policies by status', async () => {
      const response = await request(app)
        .get('/api/insurance/policies?status=active')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data.every((p: any) => p.status === 'active')).toBe(true);
    });

    it('should filter policies by type', async () => {
      const response = await request(app)
        .get('/api/insurance/policies?policy_type=comprehensive')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data.every((p: any) => p.policy_type === 'comprehensive')).toBe(true);
    });
  });

  describe('GET /api/insurance/policies/:id', () => {
    it('should get policy details by ID', async () => {
      const response = await request(app)
        .get(`/api/insurance/policies/${policyId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.id).toBe(policyId);
      expect(response.body.policy_number).toBe('POL-TEST-001');
    });

    it('should return 404 for non-existent policy', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .get(`/api/insurance/policies/${fakeId}`)
        .set('Authorization', authToken)
        .expect(404);
    });
  });

  describe('PUT /api/insurance/policies/:id', () => {
    it('should update an insurance policy', async () => {
      const updateData = {
        premium_amount: 5500.0,
        notes: 'Updated premium amount',
      };

      const response = await request(app)
        .put(`/api/insurance/policies/${policyId}`)
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body.premium_amount).toBe('5500.00');
      expect(response.body.notes).toBe(updateData.notes);
    });
  });

  describe('GET /api/insurance/policies/expiring', () => {
    it('should get expiring policies within 30 days', async () => {
      const response = await request(app)
        .get('/api/insurance/policies/expiring?days=30')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get expiring policies within 90 days', async () => {
      const response = await request(app)
        .get('/api/insurance/policies/expiring?days=90')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('POST /api/insurance/claims', () => {
    beforeAll(async () => {
      // Create test incident
      const incidentResult = await pool.query(
        `INSERT INTO incidents (tenant_id, incident_number, vehicle_id, driver_id, incident_type,
                                severity, status, incident_date, description, reported_by_id)
         VALUES ($1, 'INC-TEST-001', $2, $3, 'accident', 'medium', 'reported',
                 CURRENT_DATE, 'Test accident for claim filing', $4)
         RETURNING id`,
        [tenantId, vehicleId, driverId, userId]
      );
      incidentId = incidentResult.rows[0].id;
    });

    it('should file a new insurance claim', async () => {
      const claimData = {
        incident_id: incidentId,
        policy_id: policyId,
        claim_type: 'collision',
        filed_date: '2026-02-02',
        claim_amount_requested: 15000.0,
        at_fault_party: 'our-driver',
        at_fault_percentage: 100,
        total_loss: false,
        claim_notes: 'Minor collision, repairable damage',
      };

      const response = await request(app)
        .post('/api/insurance/claims')
        .set('Authorization', authToken)
        .send(claimData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.claim_number).toMatch(/^CLM-\d{6}$/);
      expect(response.body.status).toBe('filed');
      expect(response.body.incident_id).toBe(incidentId);

      claimId = response.body.id;
    });

    it('should reject claim for non-existent incident', async () => {
      const invalidClaimData = {
        incident_id: '00000000-0000-0000-0000-000000000000',
        policy_id: policyId,
        claim_type: 'collision',
        filed_date: '2026-02-02',
        claim_amount_requested: 10000.0,
      };

      await request(app)
        .post('/api/insurance/claims')
        .set('Authorization', authToken)
        .send(invalidClaimData)
        .expect(404);
    });
  });

  describe('GET /api/insurance/claims/:id', () => {
    it('should get claim details by ID', async () => {
      const response = await request(app)
        .get(`/api/insurance/claims/${claimId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.id).toBe(claimId);
      expect(response.body).toHaveProperty('policy_number');
      expect(response.body).toHaveProperty('incident_number');
      expect(response.body).toHaveProperty('vehicle_unit');
    });
  });

  describe('PUT /api/insurance/claims/:id/status', () => {
    it('should update claim status to under-review', async () => {
      const statusUpdate = {
        status: 'under-review',
        insurance_adjuster_name: 'Bob Johnson',
        insurance_adjuster_phone: '555-9876',
        insurance_adjuster_email: 'bob@testinsurance.com',
        notes: 'Claim under review by adjuster',
      };

      const response = await request(app)
        .put(`/api/insurance/claims/${claimId}/status`)
        .set('Authorization', authToken)
        .send(statusUpdate)
        .expect(200);

      expect(response.body.status).toBe('under-review');
      expect(response.body.insurance_adjuster_name).toBe(statusUpdate.insurance_adjuster_name);
      expect(response.body.timeline.length).toBeGreaterThan(1);
    });

    it('should update claim status to approved with amounts', async () => {
      const approvalUpdate = {
        status: 'approved',
        claim_amount_approved: 12000.0,
        payout_amount: 11500.0,
        payout_date: '2026-02-15',
        notes: 'Claim approved with reduced amount',
      };

      const response = await request(app)
        .put(`/api/insurance/claims/${claimId}/status`)
        .set('Authorization', authToken)
        .send(approvalUpdate)
        .expect(200);

      expect(response.body.status).toBe('approved');
      expect(parseFloat(response.body.claim_amount_approved)).toBe(12000.0);
      expect(parseFloat(response.body.payout_amount)).toBe(11500.0);
    });
  });

  describe('GET /api/insurance/claims', () => {
    it('should list all claims', async () => {
      const response = await request(app)
        .get('/api/insurance/claims')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter claims by status', async () => {
      const response = await request(app)
        .get('/api/insurance/claims?status=approved')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data.every((c: any) => c.status === 'approved')).toBe(true);
    });

    it('should filter claims by date range', async () => {
      const response = await request(app)
        .get('/api/insurance/claims?date_from=2026-02-01&date_to=2026-02-28')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Coverage Verification', () => {
    beforeAll(async () => {
      // Assign vehicle to policy
      await pool.query(
        `INSERT INTO vehicle_insurance_assignments (tenant_id, vehicle_id, policy_id, start_date, is_active)
         VALUES ($1, $2, $3, CURRENT_DATE, true)`,
        [tenantId, vehicleId, policyId]
      );

      // Assign driver to policy
      await pool.query(
        `INSERT INTO driver_insurance_assignments (tenant_id, driver_id, policy_id, start_date, is_active)
         VALUES ($1, $2, $3, CURRENT_DATE, true)`,
        [tenantId, driverId, policyId]
      );
    });

    describe('GET /api/vehicles/:vehicleId/insurance', () => {
      it('should get vehicle insurance coverage', async () => {
        const response = await request(app)
          .get(`/api/vehicles/${vehicleId}/insurance`)
          .set('Authorization', authToken)
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0]).toHaveProperty('policy_number');
      });
    });

    describe('GET /api/drivers/:driverId/insurance', () => {
      it('should get driver insurance coverage', async () => {
        const response = await request(app)
          .get(`/api/drivers/${driverId}/insurance`)
          .set('Authorization', authToken)
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0]).toHaveProperty('policy_number');
      });
    });

    describe('POST /api/insurance/verify-coverage', () => {
      it('should verify coverage for vehicle and driver', async () => {
        const verificationRequest = {
          vehicle_id: vehicleId,
          driver_id: driverId,
          date: '2026-02-02',
        };

        const response = await request(app)
          .post('/api/insurance/verify-coverage')
          .set('Authorization', authToken)
          .send(verificationRequest)
          .expect(200);

        expect(response.body.is_covered).toBe(true);
        expect(response.body.policies.length).toBeGreaterThan(0);
        expect(response.body.gaps).toBeUndefined();
      });

      it('should detect coverage gaps', async () => {
        const fakeVehicleId = '00000000-0000-0000-0000-000000000000';
        const verificationRequest = {
          vehicle_id: fakeVehicleId,
          date: '2026-02-02',
        };

        const response = await request(app)
          .post('/api/insurance/verify-coverage')
          .set('Authorization', authToken)
          .send(verificationRequest)
          .expect(200);

        expect(response.body.is_covered).toBe(false);
        expect(response.body.gaps).toBeDefined();
        expect(response.body.gaps.length).toBeGreaterThan(0);
      });
    });
  });

  describe('InsuranceClaimsService', () => {
    let claimsService: InsuranceClaimsService;

    beforeAll(() => {
      claimsService = new InsuranceClaimsService(pool);
    });

    describe('calculateLossRatio', () => {
      it('should calculate loss ratio correctly', async () => {
        const lossRatio = await claimsService.calculateLossRatio(
          tenantId,
          '2026-01-01',
          '2026-12-31'
        );

        expect(lossRatio).toHaveProperty('total_premiums_paid');
        expect(lossRatio).toHaveProperty('total_claims_paid');
        expect(lossRatio).toHaveProperty('loss_ratio_percentage');
        expect(lossRatio).toHaveProperty('claim_count');
        expect(typeof lossRatio.loss_ratio_percentage).toBe('number');
      });
    });

    describe('getExpirationAlerts', () => {
      it('should get expiration alerts within 30 days', async () => {
        const alerts = await claimsService.getExpirationAlerts(tenantId, 30);

        expect(Array.isArray(alerts)).toBe(true);
      });

      it('should get expiration alerts within 90 days', async () => {
        const alerts = await claimsService.getExpirationAlerts(tenantId, 90);

        expect(Array.isArray(alerts)).toBe(true);
      });
    });

    describe('getClaimsSummary', () => {
      it('should get claims summary statistics', async () => {
        const summary = await claimsService.getClaimsSummary(tenantId);

        expect(summary).toHaveProperty('total_claims');
        expect(summary).toHaveProperty('filed_claims');
        expect(summary).toHaveProperty('approved_claims');
        expect(summary).toHaveProperty('total_requested');
        expect(summary).toHaveProperty('total_paid');
      });
    });
  });

  describe('COIGeneratorService', () => {
    let coiService: COIGeneratorService;

    beforeAll(() => {
      coiService = new COIGeneratorService(pool);
    });

    describe('generateCOIForPolicy', () => {
      it('should generate Certificate of Insurance PDF', async () => {
        const pdfBuffer = await coiService.generateCOIForPolicy(
          policyId,
          tenantId,
          'Test Certificate Holder Corp',
          '123 Main St, Anytown, USA 12345',
          'Fleet management services',
          ['City of Anytown']
        );

        expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
        expect(pdfBuffer.length).toBeGreaterThan(0);
        // Check PDF magic number
        expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
      });

      it('should reject COI generation for invalid policy', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';

        await expect(
          coiService.generateCOIForPolicy(
            fakeId,
            tenantId,
            'Test Holder',
            '123 Main St'
          )
        ).rejects.toThrow('Policy not found');
      });
    });
  });
});
