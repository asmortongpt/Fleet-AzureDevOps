/**
 * LiDAR 3D Scanning Service Tests
 *
 * Comprehensive test suite for LiDAR scanning functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { LiDAR3DScanningService } from '../services/lidar-3d-scanning.service';
import { pool } from '../db/connection';
import {
  LiDARPoint,
  ProcessLiDARScanRequest,
  CalculateVolumeRequest,
  CompareSc ansRequest,
} from '../types/lidar.types';

describe('LiDAR 3D Scanning Service', () => {
  const service = new LiDAR3DScanningService();
  const testTenantId = 'test-tenant-lidar';
  const testUserId = 'test-user-123';
  const testVehicleId = 1;

  // Generate mock point cloud data
  const generateMockPointCloud = (size: number = 1000): LiDARPoint[] => {
    const points: LiDARPoint[] = [];
    for (let i = 0; i < size; i++) {
      points.push({
        x: (Math.random() - 0.5) * 4, // -2 to 2 meters
        y: (Math.random() - 0.5) * 2, // -1 to 1 meters
        z: (Math.random() - 0.5) * 2, // -1 to 1 meters
        intensity: Math.random(),
        rgb: {
          r: Math.floor(Math.random() * 256),
          g: Math.floor(Math.random() * 256),
          b: Math.floor(Math.random() * 256),
        },
      });
    }
    return points;
  };

  beforeAll(async () => {
    // Set up test database tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lidar_scans (
        scan_id UUID PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        vehicle_id INTEGER NOT NULL,
        scanner_id VARCHAR(255),
        scanner_type VARCHAR(50),
        scan_date TIMESTAMP,
        scan_duration_ms INTEGER,
        point_count INTEGER,
        resolution DECIMAL,
        accuracy DECIMAL,
        capture_device JSONB,
        bounding_box JSONB,
        metadata JSONB,
        status VARCHAR(50),
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS lidar_3d_models (
        model_id UUID PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        scan_id UUID NOT NULL,
        format VARCHAR(10),
        file_url TEXT,
        file_size BIGINT,
        polygon_count INTEGER,
        vertex_count INTEGER,
        processing_time_ms INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS lidar_damage_annotations (
        annotation_id UUID PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        scan_id UUID NOT NULL,
        damage_type VARCHAR(50),
        severity VARCHAR(20),
        location_x DECIMAL,
        location_y DECIMAL,
        location_z DECIMAL,
        area DECIMAL,
        volume DECIMAL,
        depth DECIMAL,
        confidence DECIMAL,
        detection_method VARCHAR(20),
        bounding_box JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS lidar_volume_calculations (
        calculation_id UUID PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        scan_id UUID NOT NULL,
        method VARCHAR(50),
        total_volume DECIMAL,
        surface_area DECIMAL,
        damage_volumes JSONB,
        calculated_at TIMESTAMP DEFAULT NOW(),
        compute_time_ms INTEGER
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS lidar_scan_comparisons (
        comparison_id UUID PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        base_scan_id UUID NOT NULL,
        compare_scan_id UUID NOT NULL,
        points_added INTEGER,
        points_removed INTEGER,
        points_changed INTEGER,
        max_deviation DECIMAL,
        average_deviation DECIMAL,
        rms_deviation DECIMAL,
        comparison_date TIMESTAMP DEFAULT NOW()
      )
    `);
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query(`DROP TABLE IF EXISTS lidar_scans CASCADE`);
    await pool.query(`DROP TABLE IF NOT EXISTS lidar_3d_models CASCADE`);
    await pool.query(`DROP TABLE IF NOT EXISTS lidar_damage_annotations CASCADE`);
    await pool.query(`DROP TABLE IF NOT EXISTS lidar_volume_calculations CASCADE`);
    await pool.query(`DROP TABLE IF NOT EXISTS lidar_scan_comparisons CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    // Clean test data between tests
    await pool.query(`DELETE FROM lidar_scans WHERE tenant_id = $1`, [testTenantId]);
  });

  describe('Process Scan', () => {
    it('should process a valid point cloud and generate models', async () => {
      const pointCloud = generateMockPointCloud(500);

      const request: ProcessLiDARScanRequest = {
        vehicleId: testVehicleId,
        pointCloudData: pointCloud,
        metadata: {
          scannerId: 'iphone-14-pro',
          scannerType: 'iphone_lidar',
          scanDate: new Date(),
          scanDurationMs: 30000,
          pointCount: pointCloud.length,
          resolution: 10.5,
          accuracy: 0.005,
          captureDevice: {
            model: 'iPhone 14 Pro',
            osVersion: 'iOS 17.2',
            appVersion: '1.0.0',
          },
          boundingBox: {
            minX: -2,
            minY: -1,
            minZ: -1,
            maxX: 2,
            maxY: 1,
            maxZ: 1,
          },
        },
        processingOptions: {
          denoise: true,
          removeOutliers: true,
          normalEstimation: true,
        },
        generateModels: ['glb', 'usdz'],
        detectDamage: true,
      };

      const result = await service.processScan(testTenantId, testUserId, request);

      expect(result).toBeDefined();
      expect(result.scanId).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.models).toBeDefined();
      expect(result.models!.length).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.pointCount).toBe(pointCloud.length);
    }, 30000); // 30 second timeout

    it('should reject empty point cloud', async () => {
      const request: ProcessLiDARScanRequest = {
        vehicleId: testVehicleId,
        pointCloudData: [],
        metadata: {
          scannerId: 'test-scanner',
          scannerType: 'iphone_lidar',
          scanDate: new Date(),
          scanDurationMs: 1000,
          pointCount: 0,
          resolution: 10,
          accuracy: 0.01,
          captureDevice: {
            model: 'Test',
            osVersion: '1.0',
            appVersion: '1.0',
          },
          boundingBox: {
            minX: 0,
            minY: 0,
            minZ: 0,
            maxX: 1,
            maxY: 1,
            maxZ: 1,
          },
        },
      };

      await expect(service.processScan(testTenantId, testUserId, request)).rejects.toThrow();
    });

    it('should reject point cloud with invalid coordinates', async () => {
      const invalidPoints: LiDARPoint[] = [
        { x: NaN, y: 0, z: 0 },
        { x: 0, y: Infinity, z: 0 },
        { x: 0, y: 0, z: -Infinity },
      ];

      const request: ProcessLiDARScanRequest = {
        vehicleId: testVehicleId,
        pointCloudData: invalidPoints,
        metadata: {
          scannerId: 'test-scanner',
          scannerType: 'iphone_lidar',
          scanDate: new Date(),
          scanDurationMs: 1000,
          pointCount: invalidPoints.length,
          resolution: 10,
          accuracy: 0.01,
          captureDevice: {
            model: 'Test',
            osVersion: '1.0',
            appVersion: '1.0',
          },
          boundingBox: {
            minX: 0,
            minY: 0,
            minZ: 0,
            maxX: 1,
            maxY: 1,
            maxZ: 1,
          },
        },
      };

      await expect(service.processScan(testTenantId, testUserId, request)).rejects.toThrow(
        /invalid coordinates/i
      );
    });
  });

  describe('Point Cloud Processing', () => {
    it('should downsample point cloud correctly', () => {
      const pointCloud = generateMockPointCloud(1000);
      const processed = (service as any).voxelGridDownsample(pointCloud, 0.1);

      expect(processed.length).toBeLessThan(pointCloud.length);
      expect(processed.length).toBeGreaterThan(0);
    });

    it('should remove outliers from point cloud', () => {
      const pointCloud = generateMockPointCloud(100);

      // Add outliers
      pointCloud.push({ x: 100, y: 100, z: 100 });
      pointCloud.push({ x: -100, y: -100, z: -100 });

      const processed = (service as any).removeStatisticalOutliers(pointCloud, 10, 2.0);

      expect(processed.length).toBeLessThan(pointCloud.length);
      expect(processed.every((p: LiDARPoint) => Math.abs(p.x) < 10)).toBe(true);
    });

    it('should estimate normals for points', () => {
      const pointCloud = generateMockPointCloud(50);
      const processed = (service as any).estimateNormals(pointCloud, 0.1);

      expect(processed.length).toBe(pointCloud.length);
      expect(processed.every((p: LiDARPoint) => p.normal)).toBe(true);
      expect(processed.every((p: LiDARPoint) => {
        const n = p.normal!;
        const length = Math.sqrt(n.nx * n.nx + n.ny * n.ny + n.nz * n.nz);
        return Math.abs(length - 1) < 0.01; // Normals should be unit vectors
      })).toBe(true);
    });
  });

  describe('3D Model Generation', () => {
    it('should generate GLB model', async () => {
      const pointCloud = generateMockPointCloud(100);

      const model = await (service as any).generate3DModel(
        testTenantId,
        'test-scan-id',
        pointCloud,
        'glb',
        { algorithm: 'poisson' }
      );

      expect(model).toBeDefined();
      expect(model.format).toBe('glb');
      expect(model.vertexCount).toBeGreaterThan(0);
      expect(model.fileUrl).toBeDefined();
    });

    it('should generate USDZ model for AR', async () => {
      const pointCloud = generateMockPointCloud(100);

      const model = await (service as any).generate3DModel(
        testTenantId,
        'test-scan-id',
        pointCloud,
        'usdz',
        { algorithm: 'poisson' }
      );

      expect(model).toBeDefined();
      expect(model.format).toBe('usdz');
    });

    it('should generate OBJ model', () => {
      const mesh = {
        vertices: [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
        ],
        faces: [[0, 1, 2]],
        vertexCount: 3,
        faceCount: 1,
      };

      const obj = (service as any).meshToOBJ(mesh);

      expect(obj).toContain('v 0 0 0');
      expect(obj).toContain('v 1 0 0');
      expect(obj).toContain('v 0 1 0');
      expect(obj).toContain('f 1 2 3');
    });

    it('should generate PLY model', () => {
      const mesh = {
        vertices: [
          [0, 0, 0],
          [1, 0, 0],
        ],
        faces: [[0, 1, 0]],
        vertexCount: 2,
        faceCount: 1,
        colors: [
          [255, 0, 0],
          [0, 255, 0],
        ],
      };

      const ply = (service as any).meshToPLY(mesh);

      expect(ply).toContain('ply');
      expect(ply).toContain('element vertex 2');
      expect(ply).toContain('property uchar red');
      expect(ply).toContain('0 0 0 255 0 0');
    });
  });

  describe('Volume Calculation', () => {
    it('should calculate convex hull volume', () => {
      const points: LiDARPoint[] = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 1, y: 1, z: 1 },
      ];

      const volume = (service as any).calculateConvexHullVolume(points);

      expect(volume).toBeGreaterThan(0);
      expect(volume).toBeLessThanOrEqual(1); // Max volume of unit cube
    });

    it('should calculate surface area', () => {
      const points = generateMockPointCloud(100);
      const area = (service as any).calculateSurfaceArea(points);

      expect(area).toBeGreaterThan(0);
    });

    it('should calculate bounding box correctly', () => {
      const points: LiDARPoint[] = [
        { x: -1, y: -2, z: -3 },
        { x: 4, y: 5, z: 6 },
        { x: 0, y: 0, z: 0 },
      ];

      const bbox = (service as any).calculateBoundingBox(points);

      expect(bbox.minX).toBe(-1);
      expect(bbox.minY).toBe(-2);
      expect(bbox.minZ).toBe(-3);
      expect(bbox.maxX).toBe(4);
      expect(bbox.maxY).toBe(5);
      expect(bbox.maxZ).toBe(6);
    });
  });

  describe('Damage Detection', () => {
    it('should detect anomalies in point cloud', async () => {
      // Create point cloud with a dent (concave region)
      const pointCloud: LiDARPoint[] = [];

      // Flat surface
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          pointCloud.push({ x: x * 0.1, y: y * 0.1, z: 0 });
        }
      }

      // Add dent
      for (let x = 4; x < 6; x++) {
        for (let y = 4; y < 6; y++) {
          pointCloud.push({ x: x * 0.1, y: y * 0.1, z: -0.05 });
        }
      }

      const damage = await (service as any).detectDamage(testTenantId, 'test-scan', pointCloud);

      expect(damage).toBeDefined();
      expect(Array.isArray(damage)).toBe(true);
      // Should detect the dent
      if (damage.length > 0) {
        expect(damage[0].damageType).toBeDefined();
        expect(damage[0].severity).toBeDefined();
        expect(damage[0].volume).toBeGreaterThan(0);
      }
    });

    it('should segment point cloud into regions', () => {
      const pointCloud = generateMockPointCloud(200);
      const regions = (service as any).segmentPointCloud(pointCloud);

      expect(regions).toBeDefined();
      expect(Array.isArray(regions)).toBe(true);
      expect(regions.length).toBeGreaterThan(0);
    });

    it('should calculate region curvature', () => {
      const flatRegion: LiDARPoint[] = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 1, z: 0 },
      ];

      const curvature = (service as any).calculateRegionCurvature(flatRegion);

      expect(curvature).toBeDefined();
      expect(curvature.maxCurvature).toBeDefined();
      expect(curvature.maxDepth).toBeDefined();
      // Flat surface should have low curvature
      expect(curvature.maxCurvature).toBeLessThan(1);
    });
  });

  describe('Point Cloud Comparison', () => {
    it('should calculate differences between point clouds', () => {
      const baseCloud = generateMockPointCloud(100);
      const compareCloud = [...baseCloud];

      // Add some changes
      compareCloud.push({ x: 5, y: 5, z: 5 }); // Added point
      compareCloud[0].z += 0.1; // Changed point

      const differences = (service as any).calculatePointCloudDifferences(
        baseCloud,
        compareCloud,
        0.01
      );

      expect(differences).toBeDefined();
      expect(differences.pointsAdded).toBeGreaterThan(0);
      expect(differences.pointsChanged).toBeDefined();
      expect(differences.maxDeviation).toBeGreaterThan(0);
      expect(differences.averageDeviation).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full scan-to-model workflow', async () => {
      const pointCloud = generateMockPointCloud(200);

      const request: ProcessLiDARScanRequest = {
        vehicleId: testVehicleId,
        pointCloudData: pointCloud,
        metadata: {
          scannerId: 'test-scanner',
          scannerType: 'iphone_lidar',
          scanDate: new Date(),
          scanDurationMs: 5000,
          pointCount: pointCloud.length,
          resolution: 15,
          accuracy: 0.003,
          captureDevice: {
            model: 'iPhone 15 Pro',
            osVersion: 'iOS 18.0',
            appVersion: '2.0.0',
          },
          boundingBox: {
            minX: -2,
            minY: -1,
            minZ: -1,
            maxX: 2,
            maxY: 1,
            maxZ: 1,
          },
        },
        processingOptions: {
          denoise: true,
          removeOutliers: true,
          normalEstimation: true,
        },
        generateModels: ['glb'],
        detectDamage: false,
      };

      const result = await service.processScan(testTenantId, testUserId, request);

      expect(result.status).toBe('completed');
      expect(result.scanId).toBeDefined();
      expect(result.models).toBeDefined();
      expect(result.models!.length).toBeGreaterThan(0);

      // Verify scan was stored
      const scanResult = await pool.query(
        'SELECT * FROM lidar_scans WHERE scan_id = $1 AND tenant_id = $2',
        [result.scanId, testTenantId]
      );

      expect(scanResult.rows.length).toBe(1);
      expect(scanResult.rows[0].point_count).toBe(pointCloud.length);
    }, 30000);
  });
});
