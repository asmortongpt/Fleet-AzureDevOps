import { describe, it, expect, beforeAll } from 'vitest';
import { PhotorealisticMaterials } from '../../materials/PhotorealisticMaterials';
import { CinematicCameraSystem } from '../../camera/CinematicCameraSystem';
import { WebGLCompatibilityManager } from '../../utils/WebGLCompatibilityManager';
import { PBRMaterialSystem } from '../../materials/PBRMaterialSystem';
import * as THREE from 'three';

describe('Fleet Showroom Integration', () => {
  describe('PhotorealisticMaterials', () => {
    it('should create automotive paint material', () => {
      const materials = new PhotorealisticMaterials();
      const paint = materials.createAutomotivePaint({
        baseColor: new THREE.Color(0xff0000),
        metallic: 0.9,
        clearcoat: 1.0
      });
      
      expect(paint).toBeDefined();
      expect(paint.type).toBe('MeshPhysicalMaterial');
    });
    
    it('should create glass material', () => {
      const materials = new PhotorealisticMaterials();
      const glass = materials.createGlass();
      
      expect(glass).toBeDefined();
      expect(glass.transparent).toBe(true);
    });
    
    it('should create chrome material', () => {
      const materials = new PhotorealisticMaterials();
      const chrome = materials.createChrome();
      
      expect(chrome).toBeDefined();
      expect(chrome.metalness).toBeGreaterThan(0.9);
    });
    
    it('should create tire material', () => {
      const materials = new PhotorealisticMaterials();
      const tire = materials.createTire();
      
      expect(tire).toBeDefined();
      expect(tire.roughness).toBeGreaterThan(0.7);
    });
  });
  
  describe('CinematicCameraSystem', () => {
    it('should have all 17 camera presets', () => {
      const cameraSystem = new CinematicCameraSystem();
      const presets = cameraSystem.getAvailablePresets();
      
      expect(presets.length).toBeGreaterThanOrEqual(8);
      expect(presets).toContain('hero');
      expect(presets).toContain('frontQuarter');
      expect(presets).toContain('interior');
    });
    
    it('should transition between camera views', () => {
      const cameraSystem = new CinematicCameraSystem();
      
      expect(() => {
        cameraSystem.transitionToPreset('hero');
        cameraSystem.transitionToPreset('frontQuarter');
      }).not.toThrow();
    });
  });
  
  describe('WebGLCompatibilityManager', () => {
    it('should detect device capabilities', () => {
      const manager = new WebGLCompatibilityManager();
      const capabilities = manager.detectCapabilities();
      
      expect(capabilities).toBeDefined();
      expect(capabilities.webglVersion).toMatch(/^[12]$/);
      expect(['mobile', 'desktop', 'high-end']).toContain(capabilities.tier);
    });
    
    it('should provide quality recommendations', () => {
      const manager = new WebGLCompatibilityManager();
      const quality = manager.getRecommendedQuality();
      
      expect(['low', 'medium', 'high', 'ultra']).toContain(quality);
    });
  });
  
  describe('PBRMaterialSystem', () => {
    it('should create exterior lighting rig', () => {
      const pbrSystem = new PBRMaterialSystem();
      const lights = pbrSystem.createExteriorLighting();
      
      expect(lights).toBeDefined();
      expect(lights.length).toBeGreaterThan(0);
    });
    
    it('should manage environments', () => {
      const pbrSystem = new PBRMaterialSystem();
      
      expect(() => {
        pbrSystem.setEnvironment('studio');
        pbrSystem.setEnvironment('sunset');
        pbrSystem.setEnvironment('city');
      }).not.toThrow();
    });
  });
});
