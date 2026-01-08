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
// Note: WebVital is already exported from ./performance, and vitals functions are there too
// No need to re-export from ./rum which doesn't have those functions
export * from './secure-cookie';
export * from './secure-storage';
export * from './toast';
export * from './transactionUtils';
export * from './validation';
export * from './xss-sanitizer';
