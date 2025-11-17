/**
 * Asset Management API Integration Tests
 * Tests all asset management endpoints including CRUD operations,
 * multi-tenant isolation, authentication, and authorization
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../../src/server'
import {
  generateTestToken,
  cleanupDatabase,
  seedTestDatabase,
  closeTestDatabase,
  generateTestAsset,
  testPool
} from '../setup'

describe('Asset Management API', () => {
  let authToken: string
  let secondTenantToken: string
  let createdAssetId: string

  beforeAll(async () => {
    await seedTestDatabase()
    authToken = generateTestToken()
    secondTenantToken = generateTestToken({ tenant_id: 'different-tenant' })
  })

  afterAll(async () => {
    await cleanupDatabase()
    await closeTestDatabase()
  })

  beforeEach(async () => {
    // Clean assets between tests
    await testPool.query('DELETE FROM asset_history WHERE 1=1')
    await testPool.query('DELETE FROM assets WHERE 1=1')
  })

  describe('POST /api/asset-management', () => {
    it('should create a new asset with valid data', async () => {
      const assetData = generateTestAsset()

      const response = await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assetData)
        .expect(201)

      expect(response.body.asset).toBeDefined()
      expect(response.body.asset.asset_name).toBe(assetData.asset_name)
      expect(response.body.asset.asset_type).toBe(assetData.asset_type)
      expect(response.body.asset.qr_code_data).toContain('ASSET:')
      expect(response.body.message).toBe('Asset created successfully')

      createdAssetId = response.body.asset.id
    })

    it('should reject asset creation without authentication', async () => {
      const assetData = generateTestAsset()

      await request(app)
        .post('/api/asset-management')
        .send(assetData)
        .expect(401)
    })

    it('should create asset history entry on creation', async () => {
      const assetData = generateTestAsset()

      const response = await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assetData)
        .expect(201)

      const assetId = response.body.asset.id

      // Verify history entry was created
      const historyResult = await testPool.query(
        'SELECT * FROM asset_history WHERE asset_id = $1',
        [assetId]
      )

      expect(historyResult.rows.length).toBe(1)
      expect(historyResult.rows[0].action).toBe('created')
    })

    it('should generate unique QR codes for each asset', async () => {
      const asset1Data = generateTestAsset({ asset_tag: 'TAG-001' })
      const asset2Data = generateTestAsset({ asset_tag: 'TAG-002' })

      const response1 = await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(asset1Data)
        .expect(201)

      const response2 = await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(asset2Data)
        .expect(201)

      expect(response1.body.asset.qr_code_data).not.toBe(response2.body.asset.qr_code_data)
    })
  })

  describe('GET /api/asset-management', () => {
    beforeEach(async () => {
      // Create test assets
      await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestAsset({ asset_type: 'vehicle', status: 'active' }))

      await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestAsset({ asset_type: 'equipment', status: 'maintenance' }))
    })

    it('should retrieve all assets for authenticated user', async () => {
      const response = await request(app)
        .get('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.assets).toBeDefined()
      expect(response.body.assets.length).toBeGreaterThanOrEqual(2)
      expect(response.body.total).toBeDefined()
    })

    it('should filter assets by type', async () => {
      const response = await request(app)
        .get('/api/asset-management?type=vehicle')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.assets.length).toBeGreaterThan(0)
      response.body.assets.forEach((asset: any) => {
        expect(asset.asset_type).toBe('vehicle')
      })
    })

    it('should filter assets by status', async () => {
      const response = await request(app)
        .get('/api/asset-management?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      response.body.assets.forEach((asset: any) => {
        expect(asset.status).toBe('active')
      })
    })

    it('should search assets by name', async () => {
      const uniqueName = `Unique-Asset-${Date.now()}`
      await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestAsset({ asset_name: uniqueName }))

      const response = await request(app)
        .get(`/api/asset-management?search=${uniqueName}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.assets.length).toBeGreaterThan(0)
      expect(response.body.assets[0].asset_name).toBe(uniqueName)
    })

    it('should enforce multi-tenant isolation', async () => {
      // Create asset with first tenant
      await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestAsset())

      // Try to retrieve with different tenant token
      const response = await request(app)
        .get('/api/asset-management')
        .set('Authorization', `Bearer ${secondTenantToken}`)
        .expect(200)

      // Should return empty or only second tenant's assets
      const firstTenantAssets = response.body.assets.filter(
        (a: any) => a.tenant_id === 'test-tenant-id'
      )
      expect(firstTenantAssets.length).toBe(0)
    })
  })

  describe('GET /api/asset-management/:id', () => {
    let testAssetId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestAsset())

      testAssetId = response.body.asset.id
    })

    it('should retrieve asset by ID with full details', async () => {
      const response = await request(app)
        .get(`/api/asset-management/${testAssetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.asset).toBeDefined()
      expect(response.body.asset.id).toBe(testAssetId)
      expect(response.body.history).toBeDefined()
      expect(response.body.maintenance).toBeDefined()
    })

    it('should return 404 for non-existent asset', async () => {
      await request(app)
        .get('/api/asset-management/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })

    it('should not allow access to other tenant assets', async () => {
      await request(app)
        .get(`/api/asset-management/${testAssetId}`)
        .set('Authorization', `Bearer ${secondTenantToken}`)
        .expect(404)
    })
  })

  describe('PUT /api/asset-management/:id', () => {
    let testAssetId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestAsset())

      testAssetId = response.body.asset.id
    })

    it('should update asset successfully', async () => {
      const updates = {
        asset_name: 'Updated Asset Name',
        status: 'maintenance',
        current_value: '40000'
      }

      const response = await request(app)
        .put(`/api/asset-management/${testAssetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200)

      expect(response.body.asset.asset_name).toBe(updates.asset_name)
      expect(response.body.asset.status).toBe(updates.status)
      expect(response.body.asset.current_value).toBe(updates.current_value)
    })

    it('should create history entry on update', async () => {
      await request(app)
        .put(`/api/asset-management/${testAssetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'maintenance' })
        .expect(200)

      const historyResult = await testPool.query(
        'SELECT * FROM asset_history WHERE asset_id = $1 AND action = $2',
        [testAssetId, 'updated']
      )

      expect(historyResult.rows.length).toBeGreaterThan(0)
    })

    it('should reject update with no fields', async () => {
      await request(app)
        .put(`/api/asset-management/${testAssetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
    })

    it('should not allow update of other tenant assets', async () => {
      await request(app)
        .put(`/api/asset-management/${testAssetId}`)
        .set('Authorization', `Bearer ${secondTenantToken}`)
        .send({ status: 'inactive' })
        .expect(404)
    })
  })

  describe('POST /api/asset-management/:id/assign', () => {
    let testAssetId: string
    let testUserId: string

    beforeEach(async () => {
      const assetResponse = await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestAsset())

      testAssetId = assetResponse.body.asset.id
      testUserId = 'test-user-id'
    })

    it('should assign asset to user', async () => {
      const response = await request(app)
        .post(`/api/asset-management/${testAssetId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assigned_to: testUserId,
          notes: 'Test assignment'
        })
        .expect(200)

      expect(response.body.asset.assigned_to).toBe(testUserId)
    })

    it('should log assignment in history', async () => {
      await request(app)
        .post(`/api/asset-management/${testAssetId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assigned_to: testUserId })
        .expect(200)

      const historyResult = await testPool.query(
        'SELECT * FROM asset_history WHERE asset_id = $1 AND action = $2',
        [testAssetId, 'assigned']
      )

      expect(historyResult.rows.length).toBe(1)
      expect(historyResult.rows[0].assigned_to).toBe(testUserId)
    })
  })

  describe('POST /api/asset-management/:id/transfer', () => {
    let testAssetId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestAsset({ location: 'Original Location' }))

      testAssetId = response.body.asset.id
    })

    it('should transfer asset to new location', async () => {
      const response = await request(app)
        .post(`/api/asset-management/${testAssetId}/transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          new_location: 'New Location',
          transfer_reason: 'Relocation',
          notes: 'Transfer test'
        })
        .expect(200)

      expect(response.body.asset.location).toBe('New Location')
    })
  })

  describe('GET /api/asset-management/:id/depreciation', () => {
    let testAssetId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestAsset({
          purchase_price: '100000',
          depreciation_rate: '20',
          purchase_date: '2022-01-01'
        }))

      testAssetId = response.body.asset.id
    })

    it('should calculate asset depreciation', async () => {
      const response = await request(app)
        .get(`/api/asset-management/${testAssetId}/depreciation`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.asset_id).toBe(testAssetId)
      expect(response.body.purchase_price).toBe('100000.00')
      expect(response.body.depreciation_rate).toBe('20')
      expect(response.body.annual_depreciation).toBeDefined()
      expect(response.body.current_value).toBeDefined()
      expect(response.body.projections).toBeDefined()
      expect(response.body.projections.length).toBe(10)
    })

    it('should provide accurate depreciation calculations', async () => {
      const response = await request(app)
        .get(`/api/asset-management/${testAssetId}/depreciation`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Annual depreciation should be 20% of 100,000 = 20,000
      expect(response.body.annual_depreciation).toBe('20000.00')

      // Current value should be less than purchase price
      const currentValue = parseFloat(response.body.current_value)
      expect(currentValue).toBeLessThan(100000)
    })
  })

  describe('GET /api/asset-management/analytics/summary', () => {
    beforeEach(async () => {
      // Create test assets with different statuses and types
      await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestAsset({ asset_type: 'vehicle', status: 'active', purchase_price: '50000' }))

      await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestAsset({ asset_type: 'equipment', status: 'maintenance', purchase_price: '30000' }))

      await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestAsset({ asset_type: 'vehicle', status: 'active', purchase_price: '60000' }))
    })

    it('should return asset analytics summary', async () => {
      const response = await request(app)
        .get('/api/asset-management/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.by_status).toBeDefined()
      expect(response.body.by_type).toBeDefined()
      expect(response.body.total_assets).toBeGreaterThan(0)
      expect(response.body.total_purchase_value).toBeDefined()
      expect(response.body.total_current_value).toBeDefined()
    })

    it('should provide accurate counts by status', async () => {
      const response = await request(app)
        .get('/api/asset-management/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const activeCount = response.body.by_status.find((s: any) => s.status === 'active')
      const maintenanceCount = response.body.by_status.find((s: any) => s.status === 'maintenance')

      expect(parseInt(activeCount?.count || 0)).toBeGreaterThanOrEqual(2)
      expect(parseInt(maintenanceCount?.count || 0)).toBeGreaterThanOrEqual(1)
    })

    it('should provide accurate counts by type', async () => {
      const response = await request(app)
        .get('/api/asset-management/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const vehicleCount = response.body.by_type.find((t: any) => t.asset_type === 'vehicle')
      const equipmentCount = response.body.by_type.find((t: any) => t.asset_type === 'equipment')

      expect(parseInt(vehicleCount?.count || 0)).toBeGreaterThanOrEqual(2)
      expect(parseInt(equipmentCount?.count || 0)).toBeGreaterThanOrEqual(1)
    })
  })

  describe('DELETE /api/asset-management/:id', () => {
    let testAssetId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestAsset())

      testAssetId = response.body.asset.id
    })

    it('should dispose asset successfully', async () => {
      const response = await request(app)
        .delete(`/api/asset-management/${testAssetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          disposal_reason: 'End of life',
          disposal_value: '5000'
        })
        .expect(200)

      expect(response.body.asset.status).toBe('disposed')
      expect(response.body.asset.disposal_reason).toBe('End of life')
      expect(response.body.asset.disposal_value).toBe('5000')
    })

    it('should log disposal in history', async () => {
      await request(app)
        .delete(`/api/asset-management/${testAssetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ disposal_reason: 'Test disposal' })
        .expect(200)

      const historyResult = await testPool.query(
        'SELECT * FROM asset_history WHERE asset_id = $1 AND action = $2',
        [testAssetId, 'disposed']
      )

      expect(historyResult.rows.length).toBe(1)
    })

    it('should not allow disposal of other tenant assets', async () => {
      await request(app)
        .delete(`/api/asset-management/${testAssetId}`)
        .set('Authorization', `Bearer ${secondTenantToken}`)
        .send({ disposal_reason: 'Test' })
        .expect(404)
    })
  })
})
