/**
 * Accounts Payable & Depreciation Route Tests
 *
 * @module routes/__tests__/accounts-payable.test
 * @created 2026-02-02
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool } from 'pg';
import { APAgingService } from '../../services/ap-aging';
import { DepreciationService } from '../../services/depreciation';
import {
  AccountsPayable,
  CreateAccountsPayableInput,
  PaymentInput,
  CreateDepreciationInput,
  AssetDepreciation,
} from '../../types/accounts-payable';

describe('Accounts Payable & Depreciation System', () => {
  let pool: Pool;
  let apAgingService: APAgingService;
  let depreciationService: DepreciationService;
  let testTenantId: string;
  let testVendorId: string;
  let testAssetId: string;
  let testVehicleId: string;
  let testAPId: string;

  beforeAll(async () => {
    // Initialize pool (use test database)
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'fleet_db',
      user: process.env.DB_USER || 'fleet_user',
      password: process.env.DB_PASSWORD || 'fleet_password',
    });

    apAgingService = new APAgingService(pool);
    depreciationService = new DepreciationService(pool);

    // Create test tenant
    const tenantResult = await pool.query(
      `INSERT INTO tenants (tenant_name, is_active) VALUES ($1, $2) RETURNING id`,
      ['Test AP Tenant', true]
    );
    testTenantId = tenantResult.rows[0].id;

    // Create test vendor
    const vendorResult = await pool.query(
      `INSERT INTO vendors (tenant_id, name, contact_email, contact_phone, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [testTenantId, 'Test Vendor Inc', 'vendor@test.com', '555-1234', true]
    );
    testVendorId = vendorResult.rows[0].id;

    // Create test asset
    const assetResult = await pool.query(
      `INSERT INTO assets (tenant_id, asset_number, name, type, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [testTenantId, 'ASSET-001', 'Test Equipment', 'machinery', 'active']
    );
    testAssetId = assetResult.rows[0].id;

    // Create test vehicle
    const vehicleResult = await pool.query(
      `INSERT INTO vehicles (tenant_id, vehicle_number, make, model, year, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [testTenantId, 'VEH-001', 'Ford', 'F-150', 2024, 'active']
    );
    testVehicleId = vehicleResult.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testTenantId) {
      await pool.query('DELETE FROM tenants WHERE id = $1', [testTenantId]);
    }
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up AP and depreciation records before each test
    if (testTenantId) {
      await pool.query('DELETE FROM depreciation_schedule WHERE tenant_id = $1', [testTenantId]);
      await pool.query('DELETE FROM asset_depreciation WHERE tenant_id = $1', [testTenantId]);
      await pool.query('DELETE FROM accounts_payable WHERE tenant_id = $1', [testTenantId]);
    }
  });

  // ============================================================================
  // ACCOUNTS PAYABLE TESTS
  // ============================================================================

  describe('AP CRUD Operations', () => {
    it('should create a new AP record', async () => {
      const input: CreateAccountsPayableInput = {
        tenant_id: testTenantId,
        vendor_id: testVendorId,
        invoice_number: 'INV-001',
        invoice_date: new Date('2026-02-01'),
        due_date: new Date('2026-03-01'),
        amount_due: 1500.00,
        payment_terms: 'net-30',
        discount_available: 30.00,
        discount_date: new Date('2026-02-11'),
      };

      const ap = await apAgingService.createAP(input);

      expect(ap).toBeDefined();
      expect(ap.id).toBeDefined();
      expect(ap.invoice_number).toBe('INV-001');
      expect(ap.amount_due).toBe(1500.00);
      expect(ap.balance_remaining).toBe(1500.00);
      expect(ap.status).toBe('unpaid');

      testAPId = ap.id;
    });

    it('should record a payment', async () => {
      // Create AP record first
      const input: CreateAccountsPayableInput = {
        tenant_id: testTenantId,
        vendor_id: testVendorId,
        invoice_number: 'INV-002',
        invoice_date: new Date('2026-02-01'),
        due_date: new Date('2026-03-01'),
        amount_due: 2000.00,
      };

      const ap = await apAgingService.createAP(input);

      // Record payment
      const payment: PaymentInput = {
        amount_paid: 1000.00,
        paid_date: new Date('2026-02-15'),
        payment_method: 'check',
        payment_reference: 'CHK-12345',
      };

      const updatedAP = await apAgingService.recordPayment(ap.id, payment);

      expect(updatedAP.amount_paid).toBe(1000.00);
      expect(updatedAP.balance_remaining).toBe(1000.00);
      expect(updatedAP.status).toBe('partially-paid');
    });

    it('should mark as paid when full payment recorded', async () => {
      // Create AP record
      const input: CreateAccountsPayableInput = {
        tenant_id: testTenantId,
        vendor_id: testVendorId,
        invoice_number: 'INV-003',
        invoice_date: new Date('2026-02-01'),
        due_date: new Date('2026-03-01'),
        amount_due: 500.00,
      };

      const ap = await apAgingService.createAP(input);

      // Record full payment
      const payment: PaymentInput = {
        amount_paid: 500.00,
        paid_date: new Date('2026-02-10'),
        payment_method: 'ach',
      };

      const updatedAP = await apAgingService.recordPayment(ap.id, payment);

      expect(updatedAP.amount_paid).toBe(500.00);
      expect(updatedAP.balance_remaining).toBe(0);
      expect(updatedAP.status).toBe('paid');
    });
  });

  describe('AP Aging Reports', () => {
    it('should generate aging report', async () => {
      // Create multiple AP records with different dates
      const invoices = [
        {
          invoice_number: 'INV-AGING-1',
          invoice_date: new Date('2026-01-01'),
          due_date: new Date('2026-02-01'),
          amount_due: 1000.00,
        },
        {
          invoice_number: 'INV-AGING-2',
          invoice_date: new Date('2025-12-01'),
          due_date: new Date('2026-01-01'),
          amount_due: 2000.00,
        },
        {
          invoice_number: 'INV-AGING-3',
          invoice_date: new Date('2025-11-01'),
          due_date: new Date('2025-12-01'),
          amount_due: 3000.00,
        },
      ];

      for (const invoice of invoices) {
        await apAgingService.createAP({
          tenant_id: testTenantId,
          vendor_id: testVendorId,
          ...invoice,
        });
      }

      const report = await apAgingService.generateAgingReport(testTenantId);

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.total_invoices).toBeGreaterThan(0);
      expect(report.summary.total_outstanding).toBeGreaterThan(0);
      expect(report.by_vendor).toHaveLength(1);
      expect(report.by_vendor[0].vendor_name).toBe('Test Vendor Inc');
    });

    it('should identify overdue invoices', async () => {
      // Create overdue invoice
      await apAgingService.createAP({
        tenant_id: testTenantId,
        vendor_id: testVendorId,
        invoice_number: 'INV-OVERDUE',
        invoice_date: new Date('2025-12-01'),
        due_date: new Date('2026-01-01'),
        amount_due: 5000.00,
      });

      const overdueInvoices = await apAgingService.getOverdueInvoices(testTenantId);

      expect(overdueInvoices.length).toBeGreaterThan(0);
      expect(overdueInvoices[0].status).toBe('overdue');
    });
  });

  describe('Cash Flow Forecasting', () => {
    it('should generate cash flow forecast', async () => {
      // Create invoices with future due dates
      const futureInvoices = [
        {
          invoice_number: 'INV-FUTURE-1',
          invoice_date: new Date(),
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          amount_due: 1000.00,
        },
        {
          invoice_number: 'INV-FUTURE-2',
          invoice_date: new Date(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          amount_due: 2000.00,
        },
      ];

      for (const invoice of futureInvoices) {
        await apAgingService.createAP({
          tenant_id: testTenantId,
          vendor_id: testVendorId,
          ...invoice,
        });
      }

      const forecast = await apAgingService.generateCashFlowForecast(testTenantId, 90);

      expect(forecast).toBeDefined();
      expect(Array.isArray(forecast)).toBe(true);
      expect(forecast.length).toBeGreaterThan(0);
    });
  });

  describe('AP Metrics', () => {
    it('should calculate dashboard metrics', async () => {
      // Create test invoices
      await apAgingService.createAP({
        tenant_id: testTenantId,
        vendor_id: testVendorId,
        invoice_number: 'INV-METRICS-1',
        invoice_date: new Date('2026-01-01'),
        due_date: new Date('2026-02-01'),
        amount_due: 1000.00,
      });

      const metrics = await apAgingService.getDashboardMetrics(testTenantId);

      expect(metrics).toBeDefined();
      expect(metrics.unpaid_count).toBeGreaterThanOrEqual(0);
      expect(metrics.total_outstanding).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // DEPRECIATION TESTS
  // ============================================================================

  describe('Depreciation Calculations', () => {
    it('should calculate straight-line depreciation', () => {
      const annualDepreciation = depreciationService.calculateStraightLine(
        50000, // original cost
        5000,  // salvage value
        5      // useful life years
      );

      expect(annualDepreciation).toBe(9000); // (50000 - 5000) / 5 = 9000
    });

    it('should calculate declining-balance depreciation', () => {
      const depreciation = depreciationService.calculateDecliningBalance(
        50000, // book value
        5000,  // salvage value
        5      // useful life years
      );

      expect(depreciation).toBeGreaterThan(0);
      expect(depreciation).toBeLessThanOrEqual(20000); // 50000 * (2/5) = 20000
    });

    it('should calculate units-of-production depreciation', () => {
      const depreciation = depreciationService.calculateUnitsOfProduction(
        50000,  // original cost
        5000,   // salvage value
        100000, // total estimated units (miles)
        10000   // units used in period
      );

      expect(depreciation).toBe(4500); // (50000 - 5000) * (10000 / 100000) = 4500
    });
  });

  describe('Depreciation Record Management', () => {
    it('should create depreciation record for asset', async () => {
      const input: CreateDepreciationInput = {
        tenant_id: testTenantId,
        asset_id: testAssetId,
        depreciation_method: 'straight-line',
        original_cost: 50000,
        salvage_value: 5000,
        useful_life_years: 5,
        start_date: new Date('2026-01-01'),
        notes: 'Test depreciation',
      };

      const depreciation = await depreciationService.createDepreciation(input);

      expect(depreciation).toBeDefined();
      expect(depreciation.id).toBeDefined();
      expect(depreciation.depreciation_method).toBe('straight-line');
      expect(depreciation.depreciation_per_year).toBe(9000);
    });

    it('should create depreciation record for vehicle', async () => {
      const input: CreateDepreciationInput = {
        tenant_id: testTenantId,
        vehicle_id: testVehicleId,
        depreciation_method: 'declining-balance',
        original_cost: 35000,
        salvage_value: 5000,
        useful_life_years: 5,
        start_date: new Date('2026-01-01'),
      };

      const depreciation = await depreciationService.createDepreciation(input);

      expect(depreciation).toBeDefined();
      expect(depreciation.vehicle_id).toBe(testVehicleId);
      expect(depreciation.depreciation_method).toBe('declining-balance');
    });

    it('should calculate period depreciation', async () => {
      // Create depreciation record
      const input: CreateDepreciationInput = {
        tenant_id: testTenantId,
        asset_id: testAssetId,
        depreciation_method: 'straight-line',
        original_cost: 60000,
        salvage_value: 6000,
        useful_life_years: 5,
        start_date: new Date('2026-01-01'),
      };

      const depreciation = await depreciationService.createDepreciation(input);

      // Calculate depreciation for a month
      const result = await depreciationService.calculatePeriodDepreciation(
        depreciation.id,
        new Date('2026-01-01'),
        new Date('2026-01-31')
      );

      expect(result).toBeDefined();
      expect(result.depreciation_expense).toBeGreaterThan(0);
      expect(result.depreciation_expense).toBeLessThanOrEqual(900); // (60000-6000)/5/12 = 900
    });
  });

  describe('Depreciation Schedules', () => {
    it('should generate depreciation schedule', async () => {
      // Create depreciation record
      const input: CreateDepreciationInput = {
        tenant_id: testTenantId,
        asset_id: testAssetId,
        depreciation_method: 'straight-line',
        original_cost: 48000,
        salvage_value: 8000,
        useful_life_years: 5,
        start_date: new Date('2026-01-01'),
      };

      const depreciation = await depreciationService.createDepreciation(input);

      // Calculate a period to create schedule entry
      await depreciationService.calculatePeriodDepreciation(
        depreciation.id,
        new Date('2026-01-01'),
        new Date('2026-01-31')
      );

      const schedule = await depreciationService.getDepreciationSchedule(depreciation.id);

      expect(schedule).toBeDefined();
      expect(Array.isArray(schedule)).toBe(true);
      expect(schedule.length).toBeGreaterThan(0);
    });

    it('should project future depreciation', async () => {
      // Create depreciation record
      const input: CreateDepreciationInput = {
        tenant_id: testTenantId,
        asset_id: testAssetId,
        depreciation_method: 'straight-line',
        original_cost: 50000,
        salvage_value: 5000,
        useful_life_years: 5,
        start_date: new Date('2026-01-01'),
      };

      const depreciation = await depreciationService.createDepreciation(input);

      const projection = await depreciationService.projectDepreciationSchedule(
        depreciation.id,
        12 // 12 months
      );

      expect(projection).toBeDefined();
      expect(Array.isArray(projection)).toBe(true);
      expect(projection.length).toBeGreaterThan(0);
      expect(projection[0].is_actual).toBe(false);
    });
  });

  describe('Monthly Depreciation Journal', () => {
    it('should generate monthly journal entries', async () => {
      // Create multiple depreciation records
      const assets = [
        {
          asset_id: testAssetId,
          original_cost: 50000,
          salvage_value: 5000,
        },
      ];

      for (const asset of assets) {
        await depreciationService.createDepreciation({
          tenant_id: testTenantId,
          asset_id: asset.asset_id,
          depreciation_method: 'straight-line',
          original_cost: asset.original_cost,
          salvage_value: asset.salvage_value,
          useful_life_years: 5,
          start_date: new Date('2026-01-01'),
        });
      }

      const journal = await depreciationService.generateMonthlyJournal(
        testTenantId,
        2026,
        1 // January
      );

      expect(journal).toBeDefined();
      expect(journal.period).toBe('2026-01');
      expect(journal.entries).toBeDefined();
      expect(journal.total_monthly_expense).toBeGreaterThan(0);
    });
  });

  describe('Depreciation Summary', () => {
    it('should generate depreciation summary', async () => {
      // Create depreciation records
      await depreciationService.createDepreciation({
        tenant_id: testTenantId,
        asset_id: testAssetId,
        depreciation_method: 'straight-line',
        original_cost: 50000,
        salvage_value: 5000,
        useful_life_years: 5,
        start_date: new Date('2026-01-01'),
      });

      const summary = await depreciationService.getDepreciationSummary(testTenantId);

      expect(summary).toBeDefined();
      expect(Array.isArray(summary)).toBe(true);
      expect(summary.length).toBeGreaterThan(0);
    });
  });
});
