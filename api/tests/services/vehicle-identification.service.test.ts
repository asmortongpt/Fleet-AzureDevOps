/**
 * Vehicle Identification Service Unit Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { VehicleIdentificationService } from '../../src/services/vehicle-identification.service'
import { testPool, cleanupDatabase, seedTestDatabase, closeTestDatabase } from '../setup'

describe('VehicleIdentificationService', () => {
  let service: VehicleIdentificationService
  const testTenantId = 'test-tenant-id'
  let testVehicleId: string

  beforeAll(async () => {
    await seedTestDatabase()
    service = new VehicleIdentificationService()

    // Create a test vehicle
    const result = await testPool.query(
      `INSERT INTO vehicles (
        tenant_id, vehicle_number, vin, license_plate, make, model, year, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [testTenantId, 'V-001', '1HGBH41JXMN109186', 'ABC123', 'Honda', 'Accord', 2021, 'active']
    )
    testVehicleId = result.rows[0].id
  })

  afterAll(async () => {
    await testPool.query('DELETE FROM vehicles WHERE tenant_id = $1', [testTenantId])
    await closeTestDatabase()
  })

  describe('generateVehicleQRCode', () => {
    it('should generate QR code for vehicle', async () => {
      const qrCode = await service.generateVehicleQRCode(testVehicleId, testTenantId)

      expect(qrCode).toBeDefined()
      expect(qrCode).toContain('data:image/png')
    })

    it('should store QR identifier in database', async () => {
      await service.generateVehicleQRCode(testVehicleId, testTenantId)

      const result = await testPool.query(
        'SELECT qr_code FROM vehicles WHERE id = $1',
        [testVehicleId]
      )

      expect(result.rows[0].qr_code).toBeDefined()
      expect(result.rows[0].qr_code).toContain('FLEET-')
    })

    it('should throw error for non-existent vehicle', async () => {
      await expect(
        service.generateVehicleQRCode('non-existent-id', testTenantId)
      ).rejects.toThrow('Vehicle not found')
    })

    it('should not generate QR for other tenant vehicles', async () => {
      await expect(
        service.generateVehicleQRCode(testVehicleId, 'different-tenant-id')
      ).rejects.toThrow('Vehicle not found')
    })
  })

  describe('identifyByQRCode', () => {
    let qrData: string

    beforeEach(async () => {
      // Generate QR code first
      await service.generateVehicleQRCode(testVehicleId, testTenantId)

      // Get the QR data
      const result = await testPool.query(
        'SELECT id, vehicle_number, vin, license_plate, make, model, year FROM vehicles WHERE id = $1',
        [testVehicleId]
      )

      const vehicle = result.rows[0]
      qrData = JSON.stringify({
        type: 'fleet_vehicle',
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.vehicle_number,
        vin: vehicle.vin,
        licensePlate: vehicle.license_plate,
        tenantId: testTenantId
      })
    })

    it('should identify vehicle by QR code', async () => {
      const identification = await service.identifyByQRCode(qrData, testTenantId)

      expect(identification).toBeDefined()
      expect(identification?.vehicleId).toBe(testVehicleId)
      expect(identification?.vehicleNumber).toBe('V-001')
      expect(identification?.vin).toBe('1HGBH41JXMN109186')
    })

    it('should return null for invalid QR code type', async () => {
      const invalidData = JSON.stringify({
        type: 'invalid_type',
        data: 'test'
      })

      const identification = await service.identifyByQRCode(invalidData, testTenantId)
      expect(identification).toBeNull()
    })

    it('should not identify vehicles from other tenants', async () => {
      const identification = await service.identifyByQRCode(qrData, 'different-tenant-id')
      expect(identification).toBeNull()
    })
  })

  describe('identifyByVIN', () => {
    it('should identify vehicle by VIN', async () => {
      const identification = await service.identifyByVIN('1HGBH41JXMN109186', testTenantId)

      expect(identification).toBeDefined()
      expect(identification?.vehicleId).toBe(testVehicleId)
      expect(identification?.vin).toBe('1HGBH41JXMN109186')
    })

    it('should return null for non-existent VIN', async () => {
      const identification = await service.identifyByVIN('NONEXISTENT123456', testTenantId)
      expect(identification).toBeNull()
    })

    it('should be case-insensitive', async () => {
      const identification = await service.identifyByVIN('1hgbh41jxmn109186', testTenantId)
      expect(identification).toBeDefined()
    })
  })

  describe('identifyByLicensePlate', () => {
    it('should identify vehicle by license plate', async () => {
      const identification = await service.identifyByLicensePlate('ABC123', testTenantId)

      expect(identification).toBeDefined()
      expect(identification?.vehicleId).toBe(testVehicleId)
      expect(identification?.licensePlate).toBe('ABC123')
    })

    it('should return null for non-existent plate', async () => {
      const identification = await service.identifyByLicensePlate('XYZ999', testTenantId)
      expect(identification).toBeNull()
    })

    it('should be case-insensitive', async () => {
      const identification = await service.identifyByLicensePlate('abc123', testTenantId)
      expect(identification).toBeDefined()
    })
  })

  describe('validateVIN', () => {
    it('should validate correct VIN format', () => {
      const isValid = service.validateVIN('1HGBH41JXMN109186')
      expect(isValid).toBe(true)
    })

    it('should reject invalid VIN format', () => {
      const isValid = service.validateVIN('INVALID')
      expect(isValid).toBe(false)
    })

    it('should reject VIN with invalid length', () => {
      const isValid = service.validateVIN('1HGBH41JX')
      expect(isValid).toBe(false)
    })

    it('should reject VIN with invalid characters', () => {
      const isValid = service.validateVIN('1HGBH41JXMN10918O') // Contains 'O'
      expect(isValid).toBe(false)
    })
  })
})
