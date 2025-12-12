import { tripMarkingRepository } from '../trip-marking.repository'
import { pool } from '../../db'

// Mock the database pool
jest.mock('../../db', () => ({
  pool: {
    query: jest.fn()
  }
}))

const mockPool = pool as jest.Mocked<typeof pool>

describe('TripMarkingRepository', () => {
  const tenantId = 'tenant-123'
  const userId = 'user-456'
  const tripId = 'trip-789'
  const vehicleId = 'vehicle-101'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('findTripById', () => {
    it('should find trip by ID with tenant isolation', async () => {
      const mockTrip = {
        id: tripId,
        tenant_id: tenantId,
        vehicle_id: vehicleId,
        distance_miles: 50
      }
      mockPool.query.mockResolvedValueOnce({ rows: [mockTrip] } as any)

      const result = await tripMarkingRepository.findTripById(tripId, tenantId)

      expect(result).toEqual(mockTrip)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT t.*, v.id as vehicle_id'),
        [tripId, tenantId]
      )
    })

    it('should return null when trip not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any)

      const result = await tripMarkingRepository.findTripById(tripId, tenantId)

      expect(result).toBeNull()
    })
  })

  describe('getActivePolicy', () => {
    it('should get active personal use policy', async () => {
      const mockPolicy = {
        id: 'policy-1',
        tenant_id: tenantId,
        rate_per_mile: 0.50,
        is_active: true
      }
      mockPool.query.mockResolvedValueOnce({ rows: [mockPolicy] } as any)

      const result = await tripMarkingRepository.getActivePolicy(tenantId)

      expect(result).toEqual(mockPolicy)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM personal_use_policies'),
        [tenantId]
      )
    })

    it('should return null when no active policy exists', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any)

      const result = await tripMarkingRepository.getActivePolicy(tenantId)

      expect(result).toBeNull()
    })
  })

  describe('getAutoApprovalSettings', () => {
    it('should get auto-approval settings', async () => {
      const mockSettings = {
        auto_approve_under_miles: 25,
        require_approval: true
      }
      mockPool.query.mockResolvedValueOnce({ rows: [mockSettings] } as any)

      const result = await tripMarkingRepository.getAutoApprovalSettings(tenantId)

      expect(result).toEqual(mockSettings)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('auto_approve_under_miles'),
        [tenantId]
      )
    })
  })

  describe('findExistingUsage', () => {
    it('should find existing usage classification', async () => {
      const mockUsage = { id: 'usage-1' }
      mockPool.query.mockResolvedValueOnce({ rows: [mockUsage] } as any)

      const result = await tripMarkingRepository.findExistingUsage(tripId)

      expect(result).toEqual(mockUsage)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('trip_usage_classification'),
        [tripId]
      )
    })
  })

  describe('updateUsageClassification', () => {
    it('should update existing usage classification', async () => {
      const usageId = 'usage-1'
      const updateData = {
        usage_type: 'personal',
        business_percentage: 0,
        business_purpose: '',
        personal_notes: 'Personal trip',
        miles_total: 50,
        miles_business: 0,
        miles_personal: 50,
        approval_status: 'pending'
      }
      const mockUpdated = { id: usageId, ...updateData }
      mockPool.query.mockResolvedValueOnce({ rows: [mockUpdated] } as any)

      const result = await tripMarkingRepository.updateUsageClassification(usageId, updateData)

      expect(result).toEqual(mockUpdated)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE trip_usage_classification'),
        expect.arrayContaining([
          updateData.usage_type,
          updateData.business_percentage,
          updateData.business_purpose,
          updateData.personal_notes,
          updateData.miles_total,
          updateData.miles_business,
          updateData.miles_personal,
          updateData.approval_status
        ])
      )
    })
  })

  describe('createUsageClassification', () => {
    it('should create new usage classification', async () => {
      const createData = {
        tenant_id: tenantId,
        trip_id: tripId,
        vehicle_id: vehicleId,
        driver_id: userId,
        usage_type: 'personal',
        miles_total: 50,
        miles_business: 0,
        miles_personal: 50,
        trip_date: new Date(),
        approval_status: 'pending',
        created_by_user_id: userId
      }
      const mockCreated = { id: 'usage-new', ...createData }
      mockPool.query.mockResolvedValueOnce({ rows: [mockCreated] } as any)

      const result = await tripMarkingRepository.createUsageClassification(createData)

      expect(result).toEqual(mockCreated)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO trip_usage_classification'),
        expect.arrayContaining([
          createData.tenant_id,
          createData.trip_id,
          createData.vehicle_id,
          createData.driver_id,
          createData.usage_type
        ])
      )
    })

    it('should handle optional trip_id for personal trip start', async () => {
      const createData = {
        tenant_id: tenantId,
        vehicle_id: vehicleId,
        driver_id: userId,
        usage_type: 'personal',
        miles_total: 0,
        miles_business: 0,
        miles_personal: 0,
        trip_date: new Date(),
        approval_status: 'pending',
        created_by_user_id: userId
      }
      const mockCreated = { id: 'usage-new', ...createData }
      mockPool.query.mockResolvedValueOnce({ rows: [mockCreated] } as any)

      const result = await tripMarkingRepository.createUsageClassification(createData)

      expect(result).toEqual(mockCreated)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([null]) // trip_id should be null
      )
    })
  })

  describe('getUsageById', () => {
    it('should get complete usage record', async () => {
      const usageId = 'usage-1'
      const mockUsage = {
        id: usageId,
        tenant_id: tenantId,
        trip_id: tripId,
        vehicle_id: vehicleId,
        driver_id: userId
      }
      mockPool.query.mockResolvedValueOnce({ rows: [mockUsage] } as any)

      const result = await tripMarkingRepository.getUsageById(usageId)

      expect(result).toEqual(mockUsage)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [usageId]
      )
    })
  })

  describe('verifyVehicleOwnership', () => {
    it('should return true when vehicle belongs to tenant', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: vehicleId }] } as any)

      const result = await tripMarkingRepository.verifyVehicleOwnership(vehicleId, tenantId)

      expect(result).toBe(true)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id FROM vehicles'),
        [vehicleId, tenantId]
      )
    })

    it('should return false when vehicle does not belong to tenant', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any)

      const result = await tripMarkingRepository.verifyVehicleOwnership(vehicleId, tenantId)

      expect(result).toBe(false)
    })
  })

  describe('upsertUsageClassification', () => {
    it('should upsert usage classification for split', async () => {
      const upsertData = {
        tenant_id: tenantId,
        trip_id: tripId,
        vehicle_id: vehicleId,
        driver_id: userId,
        usage_type: 'mixed',
        business_percentage: 60,
        business_purpose: 'Client meeting',
        miles_total: 100,
        miles_business: 60,
        miles_personal: 40,
        trip_date: new Date(),
        approval_status: 'pending',
        created_by_user_id: userId
      }
      const mockUpserted = { id: 'usage-1', ...upsertData }
      mockPool.query.mockResolvedValueOnce({ rows: [mockUpserted] } as any)

      const result = await tripMarkingRepository.upsertUsageClassification(upsertData)

      expect(result).toEqual(mockUpserted)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT (trip_id)'),
        expect.arrayContaining([
          upsertData.tenant_id,
          upsertData.trip_id,
          upsertData.usage_type,
          upsertData.business_percentage
        ])
      )
    })
  })

  describe('getPersonalTripsByDriver', () => {
    it('should get personal trips with pagination', async () => {
      const mockTrips = [
        { id: 'trip-1', driver_id: userId, usage_type: 'personal', miles_personal: 30 },
        { id: 'trip-2', driver_id: userId, usage_type: 'mixed', miles_personal: 20 }
      ]
      mockPool.query.mockResolvedValueOnce({ rows: mockTrips } as any)

      const result = await tripMarkingRepository.getPersonalTripsByDriver(userId, tenantId, {
        page: 1,
        limit: 50
      })

      expect(result).toEqual(mockTrips)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('trip_usage_classification'),
        expect.arrayContaining([userId, tenantId])
      )
    })

    it('should filter by date range', async () => {
      const mockTrips = []
      mockPool.query.mockResolvedValueOnce({ rows: mockTrips } as any)

      const result = await tripMarkingRepository.getPersonalTripsByDriver(userId, tenantId, {
        page: 1,
        limit: 50,
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      })

      expect(result).toEqual(mockTrips)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('t.trip_date >='),
        expect.arrayContaining([userId, tenantId, '2024-01-01', '2024-12-31'])
      )
    })
  })

  describe('countPersonalTripsByDriver', () => {
    it('should count personal trips', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: '42' }] } as any)

      const result = await tripMarkingRepository.countPersonalTripsByDriver(userId, tenantId)

      expect(result).toBe(42)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*)'),
        [userId, tenantId]
      )
    })
  })

  describe('getUsageDetailsByTripId', () => {
    it('should get usage details with user and vehicle info', async () => {
      const mockDetails = {
        id: 'usage-1',
        trip_id: tripId,
        tenant_id: tenantId,
        created_by_name: 'John Doe',
        approved_by_name: 'Jane Manager',
        make: 'Toyota',
        model: 'Camry',
        license_plate: 'ABC123'
      }
      mockPool.query.mockResolvedValueOnce({ rows: [mockDetails] } as any)

      const result = await tripMarkingRepository.getUsageDetailsByTripId(tripId, tenantId)

      expect(result).toEqual(mockDetails)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN users'),
        [tripId, tenantId]
      )
    })

    it('should return null when usage not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any)

      const result = await tripMarkingRepository.getUsageDetailsByTripId(tripId, tenantId)

      expect(result).toBeNull()
    })
  })

  describe('Tenant Isolation', () => {
    it('should enforce tenant_id filtering in all queries', async () => {
      // Test that all methods include tenant_id in WHERE clause
      const methods = [
        () => tripMarkingRepository.findTripById(tripId, tenantId),
        () => tripMarkingRepository.getActivePolicy(tenantId),
        () => tripMarkingRepository.getAutoApprovalSettings(tenantId),
        () => tripMarkingRepository.verifyVehicleOwnership(vehicleId, tenantId),
        () => tripMarkingRepository.getPersonalTripsByDriver(userId, tenantId),
        () => tripMarkingRepository.countPersonalTripsByDriver(userId, tenantId),
        () => tripMarkingRepository.getUsageDetailsByTripId(tripId, tenantId)
      ]

      mockPool.query.mockResolvedValue({ rows: [] } as any)

      for (const method of methods) {
        await method()
      }

      // Verify all calls included tenant_id parameter
      expect(mockPool.query).toHaveBeenCalledTimes(methods.length)
      mockPool.query.mock.calls.forEach(call => {
        expect(call[1]).toContain(tenantId)
      })
    })
  })

  describe('Parameterized Queries', () => {
    it('should use parameterized queries only', async () => {
      const methods = [
        () => tripMarkingRepository.findTripById(tripId, tenantId),
        () => tripMarkingRepository.getActivePolicy(tenantId),
        () => tripMarkingRepository.verifyVehicleOwnership(vehicleId, tenantId)
      ]

      mockPool.query.mockResolvedValue({ rows: [] } as any)

      for (const method of methods) {
        await method()
      }

      // Verify all queries use $1, $2, etc. placeholders
      mockPool.query.mock.calls.forEach(call => {
        const query = call[0] as string
        expect(query).toMatch(/\$\d+/)
        expect(call[1]).toBeInstanceOf(Array)
      })
    })
  })
})
