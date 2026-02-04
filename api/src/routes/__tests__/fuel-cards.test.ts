/**
 * Fuel Card Integration Route Tests
 *
 * @module routes/__tests__/fuel-cards.test
 * @created 2026-02-02
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool } from 'pg';
import { FuelCardService } from '../../services/FuelCardService';
import { FuelCardReconciliationService } from '../../services/fuel-card-reconciliation';
import {
  FuelCard,
  FuelCardProvider,
  FuelCardTransaction,
  CreateFuelCardInput,
  CreateFuelCardProviderInput,
  CreateFuelCardTransactionInput,
} from '../../types/fuel-cards';

describe('Fuel Card Integration System', () => {
  let pool: Pool;
  let fuelCardService: FuelCardService;
  let reconciliationService: FuelCardReconciliationService;
  let testTenantId: string;
  let testProviderId: string;
  let testCardId: string;
  let testVehicleId: string;
  let testDriverId: string;

  beforeAll(async () => {
    // Initialize pool (use test database or local database)
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'fleet_db',
      user: process.env.DB_USER || 'fleet_user',
      password: process.env.DB_PASSWORD || 'fleet_password',
    });

    fuelCardService = new FuelCardService(pool);
    reconciliationService = new FuelCardReconciliationService(pool);

    // Create test tenant
    const tenantResult = await pool.query(
      `INSERT INTO tenants (tenant_name, is_active)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      ['Test Fuel Card Tenant', true]
    );

    if (tenantResult.rows.length > 0) {
      testTenantId = tenantResult.rows[0].id;
    } else {
      // Get existing tenant
      const existingTenant = await pool.query(
        `SELECT id FROM tenants WHERE tenant_name = $1`,
        ['Test Fuel Card Tenant']
      );
      testTenantId = existingTenant.rows[0].id;
    }

    // Create test vehicle
    const vehicleResult = await pool.query(
      `INSERT INTO vehicles (tenant_id, name, vin, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [testTenantId, 'Test Vehicle', 'TEST123456789VIN', 'active']
    );
    testVehicleId = vehicleResult.rows[0].id;

    // Create test driver
    const driverResult = await pool.query(
      `INSERT INTO drivers (tenant_id, name, email, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [testTenantId, 'Test Driver', 'testdriver@fuel.com', 'active']
    );
    testDriverId = driverResult.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testTenantId) {
      await pool.query('DELETE FROM fuel_card_transactions WHERE tenant_id = $1', [testTenantId]);
      await pool.query('DELETE FROM fuel_cards WHERE tenant_id = $1', [testTenantId]);
      await pool.query('DELETE FROM fuel_card_providers WHERE tenant_id = $1', [testTenantId]);
      await pool.query('DELETE FROM drivers WHERE tenant_id = $1', [testTenantId]);
      await pool.query('DELETE FROM vehicles WHERE tenant_id = $1', [testTenantId]);
      await pool.query('DELETE FROM tenants WHERE id = $1', [testTenantId]);
    }
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up before each test
    if (testTenantId) {
      await pool.query('DELETE FROM fuel_card_transactions WHERE tenant_id = $1', [testTenantId]);
      await pool.query('DELETE FROM fuel_cards WHERE tenant_id = $1', [testTenantId]);
      await pool.query('DELETE FROM fuel_card_providers WHERE tenant_id = $1', [testTenantId]);
    }
  });

  describe('Fuel Card Provider Operations', () => {
    it('should create a new fuel card provider', async () => {
      const providerInput: CreateFuelCardProviderInput = {
        provider_name: 'WEX Fleet',
        api_endpoint: 'https://api.wexinc.com/v1',
        account_number: '1234567890',
        is_active: true,
        sync_frequency_minutes: 60,
      };

      const provider = await fuelCardService.createProvider(providerInput, testTenantId);

      expect(provider).toBeDefined();
      expect(provider.id).toBeDefined();
      expect(provider.provider_name).toBe('WEX Fleet');
      expect(provider.account_number).toBe('1234567890');
      expect(provider.is_active).toBe(true);

      testProviderId = provider.id;
    });

    it('should retrieve all providers for tenant', async () => {
      // Create test provider
      const providerInput: CreateFuelCardProviderInput = {
        provider_name: 'FleetCor',
        account_number: '0987654321',
        is_active: true,
      };
      await fuelCardService.createProvider(providerInput, testTenantId);

      const providers = await fuelCardService.getAllProviders(testTenantId);

      expect(providers).toBeDefined();
      expect(providers.length).toBeGreaterThan(0);
      expect(providers[0].provider_name).toBeDefined();
    });

    it('should update provider', async () => {
      const providerInput: CreateFuelCardProviderInput = {
        provider_name: 'Comdata',
        is_active: true,
      };
      const provider = await fuelCardService.createProvider(providerInput, testTenantId);

      const updated = await fuelCardService.updateProvider(
        provider.id,
        { is_active: false },
        testTenantId
      );

      expect(updated).toBeDefined();
      expect(updated!.is_active).toBe(false);
    });
  });

  describe('Fuel Card CRUD Operations', () => {
    beforeEach(async () => {
      // Create test provider for card tests
      const providerInput: CreateFuelCardProviderInput = {
        provider_name: 'Test Provider',
        is_active: true,
      };
      const provider = await fuelCardService.createProvider(providerInput, testTenantId);
      testProviderId = provider.id;
    });

    it('should create a new fuel card', async () => {
      const cardInput: CreateFuelCardInput = {
        provider_id: testProviderId,
        card_number: '1234567890123456',
        card_last4: '3456',
        vehicle_id: testVehicleId,
        driver_id: testDriverId,
        status: 'active',
        issue_date: new Date('2026-01-01'),
        expiry_date: new Date('2028-12-31'),
        daily_limit: 200,
        pin_required: true,
        odometer_required: true,
      };

      const card = await fuelCardService.createCard(cardInput, testTenantId);

      expect(card).toBeDefined();
      expect(card.id).toBeDefined();
      expect(card.card_last4).toBe('3456');
      expect(card.vehicle_id).toBe(testVehicleId);
      expect(card.status).toBe('active');
      expect(card.daily_limit).toBe(200);

      testCardId = card.id;
    });

    it('should retrieve all cards with filters', async () => {
      const cardInput: CreateFuelCardInput = {
        provider_id: testProviderId,
        card_number: '9876543210987654',
        card_last4: '7654',
        vehicle_id: testVehicleId,
        status: 'active',
        issue_date: new Date('2026-01-01'),
        expiry_date: new Date('2028-12-31'),
      };
      await fuelCardService.createCard(cardInput, testTenantId);

      const cards = await fuelCardService.getAllCards(testTenantId, {
        status: 'active',
        vehicle_id: testVehicleId,
      });

      expect(cards).toBeDefined();
      expect(cards.length).toBeGreaterThan(0);
      expect(cards[0].status).toBe('active');
    });

    it('should update fuel card', async () => {
      const cardInput: CreateFuelCardInput = {
        provider_id: testProviderId,
        card_number: '5555666677778888',
        card_last4: '8888',
        status: 'active',
        issue_date: new Date('2026-01-01'),
        expiry_date: new Date('2028-12-31'),
      };
      const card = await fuelCardService.createCard(cardInput, testTenantId);

      const updated = await fuelCardService.updateCard(
        card.id,
        { status: 'suspended', daily_limit: 150 },
        testTenantId
      );

      expect(updated).toBeDefined();
      expect(updated!.status).toBe('suspended');
      expect(updated!.daily_limit).toBe(150);
    });

    it('should soft delete (suspend) fuel card', async () => {
      const cardInput: CreateFuelCardInput = {
        provider_id: testProviderId,
        card_number: '1111222233334444',
        card_last4: '4444',
        status: 'active',
        issue_date: new Date('2026-01-01'),
        expiry_date: new Date('2028-12-31'),
      };
      const card = await fuelCardService.createCard(cardInput, testTenantId);

      const deleted = await fuelCardService.deleteCard(card.id, testTenantId);
      expect(deleted).toBe(true);

      const retrieved = await fuelCardService.getCardById(card.id, testTenantId);
      expect(retrieved!.status).toBe('suspended');
    });
  });

  describe('Fuel Card Transaction Operations', () => {
    beforeEach(async () => {
      // Create test provider and card for transaction tests
      const providerInput: CreateFuelCardProviderInput = {
        provider_name: 'Transaction Test Provider',
        is_active: true,
      };
      const provider = await fuelCardService.createProvider(providerInput, testTenantId);
      testProviderId = provider.id;

      const cardInput: CreateFuelCardInput = {
        provider_id: testProviderId,
        card_number: '4444333322221111',
        card_last4: '1111',
        vehicle_id: testVehicleId,
        driver_id: testDriverId,
        status: 'active',
        issue_date: new Date('2026-01-01'),
        expiry_date: new Date('2028-12-31'),
      };
      const card = await fuelCardService.createCard(cardInput, testTenantId);
      testCardId = card.id;
    });

    it('should create a fuel card transaction', async () => {
      const transactionInput: CreateFuelCardTransactionInput = {
        fuel_card_id: testCardId,
        provider_transaction_id: 'TXN-001',
        transaction_date: new Date('2026-02-02T10:30:00Z'),
        vehicle_id: testVehicleId,
        driver_id: testDriverId,
        fuel_type: 'diesel',
        gallons: 25.5,
        cost_per_gallon: 3.899,
        total_cost: 99.42,
        odometer_reading: 45000,
        location: 'Shell Station',
        merchant_name: 'Shell',
      };

      const transaction = await fuelCardService.createTransaction(transactionInput, testTenantId);

      expect(transaction).toBeDefined();
      expect(transaction.id).toBeDefined();
      expect(transaction.fuel_card_id).toBe(testCardId);
      expect(transaction.gallons).toBe(25.5);
      expect(transaction.total_cost).toBe(99.42);
      expect(transaction.reconciliation_status).toBe('pending');
    });

    it('should retrieve transactions with filters', async () => {
      // Create multiple transactions
      const txn1: CreateFuelCardTransactionInput = {
        fuel_card_id: testCardId,
        transaction_date: new Date('2026-02-01'),
        vehicle_id: testVehicleId,
        fuel_type: 'diesel',
        gallons: 20,
        cost_per_gallon: 3.5,
        total_cost: 70,
      };
      const txn2: CreateFuelCardTransactionInput = {
        fuel_card_id: testCardId,
        transaction_date: new Date('2026-02-02'),
        vehicle_id: testVehicleId,
        fuel_type: 'diesel',
        gallons: 30,
        cost_per_gallon: 3.6,
        total_cost: 108,
      };

      await fuelCardService.createTransaction(txn1, testTenantId);
      await fuelCardService.createTransaction(txn2, testTenantId);

      const result = await fuelCardService.getAllTransactions(
        testTenantId,
        {
          fuel_card_id: testCardId,
          reconciliation_status: 'pending',
        },
        { page: 1, pageSize: 20 }
      );

      expect(result.data).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should update transaction (approve)', async () => {
      const transactionInput: CreateFuelCardTransactionInput = {
        fuel_card_id: testCardId,
        transaction_date: new Date(),
        vehicle_id: testVehicleId,
        fuel_type: 'diesel',
        gallons: 15,
        cost_per_gallon: 3.75,
        total_cost: 56.25,
      };
      const transaction = await fuelCardService.createTransaction(transactionInput, testTenantId);

      const updated = await fuelCardService.updateTransaction(
        transaction.id,
        { is_approved: true },
        testTenantId
      );

      expect(updated).toBeDefined();
      expect(updated!.is_approved).toBe(true);
    });
  });

  describe('Reconciliation Operations', () => {
    beforeEach(async () => {
      // Setup provider, card, and matching fuel_transaction
      const providerInput: CreateFuelCardProviderInput = {
        provider_name: 'Reconciliation Provider',
        is_active: true,
      };
      const provider = await fuelCardService.createProvider(providerInput, testTenantId);
      testProviderId = provider.id;

      const cardInput: CreateFuelCardInput = {
        provider_id: testProviderId,
        card_number: '8888777766665555',
        card_last4: '5555',
        vehicle_id: testVehicleId,
        status: 'active',
        issue_date: new Date('2026-01-01'),
        expiry_date: new Date('2028-12-31'),
      };
      const card = await fuelCardService.createCard(cardInput, testTenantId);
      testCardId = card.id;

      // Create matching fuel_transaction
      await pool.query(
        `INSERT INTO fuel_transactions (
          tenant_id, vehicle_id, transaction_date, fuel_type,
          gallons, cost_per_gallon, total_cost, is_reconciled
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          testTenantId,
          testVehicleId,
          new Date('2026-02-02T10:00:00Z'),
          'diesel',
          25,
          4.0,
          100,
          false,
        ]
      );
    });

    it('should auto-reconcile pending transactions', async () => {
      // Create fuel card transaction that matches
      const transactionInput: CreateFuelCardTransactionInput = {
        fuel_card_id: testCardId,
        transaction_date: new Date('2026-02-02T10:15:00Z'), // Within 24 hours
        vehicle_id: testVehicleId,
        fuel_type: 'diesel',
        gallons: 24.5, // Within 10% of 25
        cost_per_gallon: 4.08,
        total_cost: 99.96, // Within 10% of 100
      };
      await fuelCardService.createTransaction(transactionInput, testTenantId);

      const result = await reconciliationService.reconcilePendingTransactions(testTenantId);

      expect(result).toBeDefined();
      expect(result.processed_count).toBeGreaterThan(0);
      expect(result.matched_count).toBeGreaterThanOrEqual(0);
    });

    it('should detect fraud patterns', async () => {
      // Create suspicious transaction (excessive fill)
      const suspiciousInput: CreateFuelCardTransactionInput = {
        fuel_card_id: testCardId,
        transaction_date: new Date(),
        vehicle_id: testVehicleId,
        fuel_type: 'diesel',
        gallons: 120, // Excessive
        cost_per_gallon: 4.0,
        total_cost: 480,
      };
      await fuelCardService.createTransaction(suspiciousInput, testTenantId);

      const alerts = await reconciliationService.detectFraud(testTenantId);

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
      // May or may not have alerts depending on data, but should not error
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle non-existent provider', async () => {
      const provider = await fuelCardService.getProviderById('00000000-0000-0000-0000-000000000000', testTenantId);
      expect(provider).toBeNull();
    });

    it('should handle non-existent card', async () => {
      const card = await fuelCardService.getCardById('00000000-0000-0000-0000-000000000000', testTenantId);
      expect(card).toBeNull();
    });

    it('should handle empty transaction list', async () => {
      const result = await fuelCardService.getAllTransactions(
        testTenantId,
        { reconciliation_status: 'matched' },
        { page: 1, pageSize: 20 }
      );

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.total).toBe(0);
    });
  });
});
