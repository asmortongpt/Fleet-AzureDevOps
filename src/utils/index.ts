// WebGL Compatibility Management
export {
  WebGLCompatibilityProvider,
  useWebGLCapabilities,
  CompatibleCanvas,
  QualitySettingsPanel,
  detectWebGLCapabilities,
  determineOptimalSettings,
  type WebGLCapabilities,
  type QualitySettings,
} from './WebGLCompatibilityManager';

// Other utility exports can be added here as needed
export * from './accessibility';
export * from './analytics';
export * from './api-security';
export * from './apiResponse';
export * from './cache';
export * from './cors-preflight';
export * from './damage2Dto3DMapper';
export * from './demo-data-generator';
export * from './exportUtils';
export * from './formatDate';
export * from './formValidation';
export * from './imageOptimization';
export * from './logger';
export * from './mapHealthCheck';
export * from './memoryAPI';
export * from './performance';
export * from './privacy';
export * from './retry';
// Note: WebVital is exported from ./performance, so we only export functions from ./rum to avoid conflicts
export { onCLS, onFCP, onFID, onINP, onLCP, onTTFB } from './rum';
export * from './secure-cookie';
export * from './secure-storage';
export * from './toast';
export * from './transactionUtils';
export * from './validation';
export * from './xss-sanitizer';
