import { Pool } from 'pg';

import { ModelsRepository, ModelSearchParams, ModelUploadData, SketchfabImportData } from '../models.repository';

// Mock pg Pool
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('ModelsRepository', () => {
  let repository: ModelsRepository;
  let mockPool: jest.Mocked<Pool>;
  const testTenantId = 1;

  beforeEach(() => {
    mockPool = new Pool() as jest.Mocked<Pool>;
    repository = new ModelsRepository(mockPool);
    jest.clearAllMocks();
  });

  describe('searchModels', () => {
    it('should search models with all filters', async () => {
      const mockModels = [
        { id: 1, name: 'Test Model', tenant_id: testTenantId, is_active: true },
        { id: 2, name: 'Another Model', tenant_id: testTenantId, is_active: true },
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockModels } as any)
        .mockResolvedValueOnce({ rows: [{ count: '2' }] } as any);

      const params: ModelSearchParams = {
        search: 'test',
        vehicleType: 'sedan',
        make: 'Toyota',
        source: 'custom',
        quality: 'high',
        limit: 10,
        offset: 0,
      };

      const result = await repository.searchModels(params, testTenantId);

      expect(result.models).toEqual(mockModels);
      expect(result.total).toBe(2);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should search models with default pagination', async () => {
      const mockModels = [{ id: 1, name: 'Test Model', tenant_id: testTenantId }];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockModels } as any)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any);

      const result = await repository.searchModels({}, testTenantId);

      expect(result.models).toEqual(mockModels);
      expect(result.total).toBe(1);
    });
  });

  describe('fullTextSearch', () => {
    it('should perform full-text search', async () => {
      const mockModels = [
        { id: 1, name: 'Jeep Wrangler', tenant_id: testTenantId },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockModels } as any);

      const result = await repository.fullTextSearch(
        'jeep',
        'suv',
        'Jeep',
        'custom',
        10,
        testTenantId
      );

      expect(result).toEqual(mockModels);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('search_vehicle_3d_models'),
        ['jeep', 'suv', 'Jeep', 'custom', 10, testTenantId]
      );
    });
  });

  describe('getFeaturedModels', () => {
    it('should get featured models', async () => {
      const mockModels = [
        { id: 1, name: 'Featured Model', is_featured: true, tenant_id: testTenantId },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockModels } as any);

      const result = await repository.getFeaturedModels(5, testTenantId);

      expect(result).toEqual(mockModels);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('v_featured_vehicle_3d_models'),
        [testTenantId, 5]
      );
    });
  });

  describe('getPopularModels', () => {
    it('should get popular models', async () => {
      const mockModels = [
        { id: 1, name: 'Popular Model', view_count: 1000, tenant_id: testTenantId },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockModels } as any);

      const result = await repository.getPopularModels(5, testTenantId);

      expect(result).toEqual(mockModels);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('v_popular_vehicle_3d_models'),
        [testTenantId, 5]
      );
    });
  });

  describe('getModelById', () => {
    it('should get model by ID and increment view count', async () => {
      const mockModel = { id: 1, name: 'Test Model', tenant_id: testTenantId };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockModel] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await repository.getModelById(1, testTenantId);

      expect(result).toEqual(mockModel);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(mockPool.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('increment_model_view_count'),
        [1]
      );
    });

    it('should return null for non-existent model', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      const result = await repository.getModelById(999, testTenantId);

      expect(result).toBeNull();
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('uploadModel', () => {
    it('should upload a custom model', async () => {
      const uploadData: ModelUploadData = {
        name: 'My Custom Model',
        description: 'A test model',
        vehicleType: 'truck',
        make: 'Ford',
        model: 'F-150',
        year: 2023,
        fileUrl: 'https://cdn.example.com/model.glb',
        fileFormat: 'glb',
        fileSizeMb: 25.5,
        source: 'custom',
        license: 'CC-BY',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        qualityTier: 'high',
        tags: ['truck', 'ford', 'f150'],
      };

      const mockResult = { id: 1, ...uploadData, tenant_id: testTenantId };
      mockPool.query.mockResolvedValueOnce({ rows: [mockResult] } as any);

      const result = await repository.uploadModel(uploadData, testTenantId);

      expect(result).toEqual(mockResult);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO vehicle_3d_models'),
        expect.arrayContaining([testTenantId, uploadData.name, uploadData.description])
      );
    });
  });

  describe('importSketchfabModel', () => {
    it('should import a Sketchfab model', async () => {
      const importData: SketchfabImportData = {
        name: 'Sketchfab Model',
        description: 'Imported from Sketchfab',
        fileUrl: 'https://sketchfab.com/models/abc123',
        source: 'sketchfab',
        sourceId: 'abc123',
        license: 'CC-BY-NC',
        licenseUrl: 'https://creativecommons.org/licenses/by-nc/4.0/',
        author: 'John Doe',
        authorUrl: 'https://sketchfab.com/johndoe',
        thumbnailUrl: 'https://sketchfab.com/thumb.jpg',
        polyCount: 50000,
        viewCount: 1500,
      };

      const mockResult = { id: 1, ...importData, tenant_id: testTenantId };
      mockPool.query.mockResolvedValueOnce({ rows: [mockResult] } as any);

      const result = await repository.importSketchfabModel(importData, testTenantId);

      expect(result).toEqual(mockResult);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO vehicle_3d_models'),
        expect.arrayContaining([testTenantId, importData.name, importData.sourceId])
      );
    });
  });

  describe('softDeleteModel', () => {
    it('should soft delete a model', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      await repository.softDeleteModel(1, testTenantId);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE vehicle_3d_models SET is_active = false'),
        [1, testTenantId]
      );
    });
  });

  describe('assignModelToVehicle', () => {
    it('should assign model to vehicle', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await repository.assignModelToVehicle(10, 1, testTenantId);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(mockPool.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE vehicles SET model_3d_id'),
        [1, 10, testTenantId]
      );
    });

    it('should throw error if model not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      await expect(
        repository.assignModelToVehicle(10, 999, testTenantId)
      ).rejects.toThrow('Model not found');
    });
  });

  describe('getModelForDownload', () => {
    it('should get model for download and increment download count', async () => {
      const mockModel = { id: 1, name: 'Downloadable Model', tenant_id: testTenantId };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockModel] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await repository.getModelForDownload(1, testTenantId);

      expect(result).toEqual(mockModel);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(mockPool.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('increment_model_download_count'),
        [1]
      );
    });

    it('should return null for non-existent model', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      const result = await repository.getModelForDownload(999, testTenantId);

      expect(result).toBeNull();
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  });
});
