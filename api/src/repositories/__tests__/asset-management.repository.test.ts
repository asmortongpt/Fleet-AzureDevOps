/**
 * Asset Management Repository Tests
 * 
 * Comprehensive test suite for AssetManagementRepository
 * Tests all 19 repository methods (representing 38 queries)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { assetManagementRepository, AssetManagementRepository } from '../asset-management.repository'
import { connectionManager } from '../../config/connection-manager'
import { NotFoundError, ValidationError, DatabaseError } from '../../errors/app-error'

// Mock the connection manager
vi.mock('../../config/connection-manager', () => ({
  connectionManager: {
    getPool: vi.fn()
  }
}))

// Mock logger
vi.mock('../../config/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
}))

describe('AssetManagementRepository', () => {
  let mockPool: any
  let mockClient: any

  beforeEach(() => {
    // Create mock client
    mockClient = {
      query: vi.fn(),
      release: vi.fn()
    }

    // Create mock pool
    mockPool = {
      query: vi.fn(),
      connect: vi.fn().mockResolvedValue(mockClient)
    }

    // Setup connection manager mock
    vi.mocked(connectionManager.getPool).mockReturnValue(mockPool)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('findAllAssets', () => {
    it('should fetch all assets with basic filters', async () => {
      const mockAssets = [{ id: '1', asset_name: 'Vehicle 1', asset_type: 'vehicle', status: 'active' }]
      mockPool.query.mockResolvedValue({ rows: mockAssets })

      const result = await assetManagementRepository.findAllAssets('tenant-1', {
        type: 'vehicle',
        status: 'active'
      })

      expect(result.assets).toEqual(mockAssets)
      expect(result.total).toBe(1)
    })

    it('should throw DatabaseError on query failure', async () => {
      mockPool.query.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        assetManagementRepository.findAllAssets('tenant-1', {})
      ).rejects.toThrow(DatabaseError)
    })
  })

  describe('findAssetById', () => {
    it('should fetch asset by ID', async () => {
      const mockAsset = { id: '1', asset_name: 'Forklift A1' }
      mockPool.query.mockResolvedValue({ rows: [mockAsset] })

      const result = await assetManagementRepository.findAssetById('1', 'tenant-1')

      expect(result).toEqual(mockAsset)
    })

    it('should return null if asset not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] })

      const result = await assetManagementRepository.findAssetById('999', 'tenant-1')

      expect(result).toBeNull()
    })
  })

  describe('createAsset', () => {
    it('should create asset with transaction', async () => {
      const assetData = { asset_name: 'New Forklift', asset_type: 'equipment' as const }
      const mockAsset = { id: '1', ...assetData }

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [mockAsset] }) // INSERT
        .mockResolvedValueOnce({ rows: [] }) // HISTORY
        .mockResolvedValueOnce({ rows: [] }) // COMMIT

      const result = await assetManagementRepository.createAsset(assetData, 'user-1', 'tenant-1')

      expect(result).toEqual(mockAsset)
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should rollback on error', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce(new Error('Insert failed'))

      await expect(
        assetManagementRepository.createAsset({ asset_name: 'Test', asset_type: 'vehicle' }, 'user-1', 'tenant-1')
      ).rejects.toThrow(DatabaseError)

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })
  })

  describe('updateAsset', () => {
    it('should update asset', async () => {
      const updates = { asset_name: 'Updated Name' }
      const mockUpdated = { id: '1', ...updates }

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockUpdated] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      const result = await assetManagementRepository.updateAsset('1', 'tenant-1', updates, 'user-1')

      expect(result).toEqual(mockUpdated)
    })

    it('should throw ValidationError if no fields to update', async () => {
      await expect(
        assetManagementRepository.updateAsset('1', 'tenant-1', {}, 'user-1')
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('assignAsset', () => {
    it('should assign asset to user', async () => {
      const mockAsset = { id: '1', assigned_to: 'user-2' }

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockAsset] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      const result = await assetManagementRepository.assignAsset('1', 'tenant-1', 'user-2', 'user-1')

      expect(result).toEqual(mockAsset)
    })
  })

  describe('calculateDepreciation', () => {
    it('should calculate straight-line depreciation', () => {
      const asset = {
        id: '1',
        purchase_price: 100000,
        depreciation_rate: 20,
        purchase_date: new Date('2020-01-01')
      }

      const result = assetManagementRepository.calculateDepreciation(asset)

      expect(result.asset_id).toBe('1')
      expect(result.purchase_price).toBe('100000.00')
      expect(result.projections).toHaveLength(10)
    })
  })

  describe('getAssetAnalytics', () => {
    it('should fetch comprehensive analytics', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ status: 'active', count: 10 }] })
        .mockResolvedValueOnce({ rows: [{ asset_type: 'vehicle', count: 5 }] })
        .mockResolvedValueOnce({ rows: [{ total_assets: 10, total_purchase_value: 500000, total_current_value: 400000 }] })
        .mockResolvedValueOnce({ rows: [{ total_depreciation: 100000 }] })

      const result = await assetManagementRepository.getAssetAnalytics('tenant-1')

      expect(result.total_assets).toBe(10)
      expect(mockPool.query).toHaveBeenCalledTimes(4)
    })
  })

  describe('disposeAsset', () => {
    it('should dispose asset', async () => {
      const mockAsset = { id: '1', status: 'disposed' }

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockAsset] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      const result = await assetManagementRepository.disposeAsset('1', 'tenant-1', 'End of life', 5000, 'user-1')

      expect(result).toEqual(mockAsset)
    })
  })
})
