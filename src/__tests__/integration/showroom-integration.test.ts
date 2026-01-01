import { describe, it, expect, beforeAll } from 'vitest';
import { PhotorealisticMaterials } from '../../materials/PhotorealisticMaterials';
import { cinematicPresets } from '../../camera/CinematicCameraSystem';
import { detectWebGLCapabilities, determineOptimalSettings } from '../../utils/WebGLCompatibilityManager';
import * as THREE from 'three';

describe('Fleet Showroom Integration', () => {
  describe('PhotorealisticMaterials', () => {
    it('should create automotive paint material', () => {
      const paint = PhotorealisticMaterials.createCarPaintMaterial('#ff0000', 'gloss');

      expect(paint).toBeDefined();
      expect(paint.type).toBe('ShaderMaterial');
    });

    it('should create glass material', () => {
      const glass = PhotorealisticMaterials.createAutomotiveGlass(0.2);

      expect(glass).toBeDefined();
      expect(glass.transparent).toBe(true);
    });

    it('should create chrome material', () => {
      const chrome = PhotorealisticMaterials.createChromeMaterial();

      expect(chrome).toBeDefined();
      expect(chrome.metalness).toBeGreaterThan(0.9);
    });

    it('should create tire material', () => {
      const tire = PhotorealisticMaterials.createTireMaterial();

      expect(tire).toBeDefined();
      expect(tire.roughness).toBeGreaterThan(0.7);
    });
  });
  
  describe('CinematicCameraSystem', () => {
    it('should have all camera presets', () => {
      expect(cinematicPresets).toBeDefined();
      expect(cinematicPresets.professional).toBeDefined();
      expect(cinematicPresets.showcase).toBeDefined();
      expect(cinematicPresets.interactive).toBeDefined();
    });

    it('should have proper transition config', () => {
      const professional = cinematicPresets.professional;

      expect(professional.transitionConfig).toBeDefined();
      expect(professional.transitionConfig.duration).toBeGreaterThan(0);
      expect(professional.transitionConfig.easing).toBeDefined();
    });
  });
  
  describe('WebGLCompatibilityManager', () => {
    it('should detect device capabilities', () => {
      const capabilities = detectWebGLCapabilities();

      if (capabilities) {
        expect(capabilities.webgl).toBe(true);
        expect(capabilities.maxTextureSize).toBeGreaterThan(0);
        expect(capabilities.renderer).toBeDefined();
      } else {
        // WebGL not supported in test environment
        expect(capabilities).toBeNull();
      }
    });

    it('should provide quality recommendations', () => {
      const mockCapabilities = {
        webgl: true,
        webgl2: true,
        maxTextureSize: 4096,
        maxVertexTextures: 16,
        maxFragmentTextures: 16,
        maxVaryingVectors: 15,
        maxVertexAttribs: 16,
        maxRenderBufferSize: 4096,
        renderer: 'Test Renderer',
        vendor: 'Test Vendor',
        version: 'WebGL 2.0',
        extensions: {}
      };

      const quality = determineOptimalSettings(mockCapabilities);

      expect(quality).toBeDefined();
      expect(['off', 'low', 'medium', 'high']).toContain(quality.shadows);
      expect(['off', 'low', 'medium', 'high']).toContain(quality.reflections);
    });
  });
});
