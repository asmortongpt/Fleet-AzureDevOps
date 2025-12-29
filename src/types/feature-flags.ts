/**
 * Feature Flag Type Definitions
 *
 * Provides type-safe access to feature flags throughout the application.
 * Add new flags here to get TypeScript autocomplete and validation.
 */

/**
 * Known feature flags in the system
 */
export type FeatureFlagKey =
  // Core Features
  | 'real-time-telemetry'
  | 'advanced-analytics'
  | 'vehicle-3d-viewer'
  | 'route-optimization'
  | 'predictive-maintenance'

  // Integrations
  | 'azure-maps-integration'
  | 'google-maps-integration'
  | 'mapbox-integration'
  | 'obd2-integration'
  | 'telematics-integration'

  // Advanced Features
  | 'ai-driver-scoring'
  | 'automated-workflows'
  | 'custom-reports'
  | 'export-excel'
  | 'export-pdf'
  | 'bulk-operations'

  // Beta Features
  | 'beta-mobile-app'
  | 'beta-driver-app'
  | 'beta-inspector-tools'
  | 'beta-fuel-predictions'

  // Experimental
  | 'experimental-ar-viewer'
  | 'experimental-voice-commands'
  | 'experimental-offline-mode'

  // UI Enhancements
  | 'dark-mode'
  | 'compact-view'
  | 'advanced-filters'
  | 'drag-drop-scheduling'
  | 'multi-tab-interface';

/**
 * Feature flag metadata
 */
export interface FeatureFlagMetadata {
  key: FeatureFlagKey;
  name: string;
  description: string;
  category: 'core' | 'integration' | 'advanced' | 'beta' | 'experimental' | 'ui';
  defaultEnabled: boolean;
  requiresPermission?: string;
  minimumPlan?: 'free' | 'basic' | 'professional' | 'enterprise';
}

/**
 * Feature flag registry with metadata
 */
export const FEATURE_FLAGS: Record<FeatureFlagKey, FeatureFlagMetadata> = {
  // Core Features
  'real-time-telemetry': {
    key: 'real-time-telemetry',
    name: 'Real-time Vehicle Telemetry',
    description: 'Live GPS tracking and vehicle status updates',
    category: 'core',
    defaultEnabled: true,
    minimumPlan: 'basic',
  },
  'advanced-analytics': {
    key: 'advanced-analytics',
    name: 'Advanced Analytics Dashboard',
    description: 'Advanced reporting and analytics features',
    category: 'core',
    defaultEnabled: true,
    minimumPlan: 'professional',
  },
  'vehicle-3d-viewer': {
    key: 'vehicle-3d-viewer',
    name: '3D Vehicle Viewer',
    description: 'Interactive 3D vehicle inspection and visualization',
    category: 'core',
    defaultEnabled: false,
    minimumPlan: 'enterprise',
  },
  'route-optimization': {
    key: 'route-optimization',
    name: 'AI Route Optimization',
    description: 'AI-powered route planning and optimization',
    category: 'core',
    defaultEnabled: false,
    minimumPlan: 'professional',
  },
  'predictive-maintenance': {
    key: 'predictive-maintenance',
    name: 'Predictive Maintenance',
    description: 'AI-based maintenance predictions and alerts',
    category: 'core',
    defaultEnabled: false,
    minimumPlan: 'enterprise',
  },

  // Integrations
  'azure-maps-integration': {
    key: 'azure-maps-integration',
    name: 'Azure Maps',
    description: 'Microsoft Azure Maps integration',
    category: 'integration',
    defaultEnabled: true,
  },
  'google-maps-integration': {
    key: 'google-maps-integration',
    name: 'Google Maps',
    description: 'Google Maps Platform integration',
    category: 'integration',
    defaultEnabled: false,
  },
  'mapbox-integration': {
    key: 'mapbox-integration',
    name: 'Mapbox',
    description: 'Mapbox mapping platform integration',
    category: 'integration',
    defaultEnabled: false,
  },
  'obd2-integration': {
    key: 'obd2-integration',
    name: 'OBD-II Integration',
    description: 'On-Board Diagnostics II device integration',
    category: 'integration',
    defaultEnabled: false,
    minimumPlan: 'professional',
  },
  'telematics-integration': {
    key: 'telematics-integration',
    name: 'Telematics Integration',
    description: 'Third-party telematics provider integration',
    category: 'integration',
    defaultEnabled: false,
    minimumPlan: 'enterprise',
  },

  // Advanced Features
  'ai-driver-scoring': {
    key: 'ai-driver-scoring',
    name: 'AI Driver Scoring',
    description: 'AI-powered driver performance scoring',
    category: 'advanced',
    defaultEnabled: false,
    minimumPlan: 'professional',
  },
  'automated-workflows': {
    key: 'automated-workflows',
    name: 'Automated Workflows',
    description: 'Automated maintenance and scheduling workflows',
    category: 'advanced',
    defaultEnabled: false,
    minimumPlan: 'professional',
  },
  'custom-reports': {
    key: 'custom-reports',
    name: 'Custom Report Builder',
    description: 'Build custom reports with drag-and-drop interface',
    category: 'advanced',
    defaultEnabled: false,
    minimumPlan: 'professional',
  },
  'export-excel': {
    key: 'export-excel',
    name: 'Excel Export',
    description: 'Export data to Excel spreadsheets',
    category: 'advanced',
    defaultEnabled: true,
  },
  'export-pdf': {
    key: 'export-pdf',
    name: 'PDF Export',
    description: 'Export reports and data to PDF',
    category: 'advanced',
    defaultEnabled: true,
  },
  'bulk-operations': {
    key: 'bulk-operations',
    name: 'Bulk Operations',
    description: 'Perform bulk updates and operations',
    category: 'advanced',
    defaultEnabled: true,
    minimumPlan: 'basic',
  },

  // Beta Features
  'beta-mobile-app': {
    key: 'beta-mobile-app',
    name: 'Mobile App (Beta)',
    description: 'Native mobile app for iOS and Android',
    category: 'beta',
    defaultEnabled: false,
  },
  'beta-driver-app': {
    key: 'beta-driver-app',
    name: 'Driver Mobile App (Beta)',
    description: 'Dedicated mobile app for drivers',
    category: 'beta',
    defaultEnabled: false,
  },
  'beta-inspector-tools': {
    key: 'beta-inspector-tools',
    name: 'Inspector Tools (Beta)',
    description: 'Advanced vehicle inspection tools',
    category: 'beta',
    defaultEnabled: false,
  },
  'beta-fuel-predictions': {
    key: 'beta-fuel-predictions',
    name: 'Fuel Cost Predictions (Beta)',
    description: 'AI-powered fuel cost forecasting',
    category: 'beta',
    defaultEnabled: false,
  },

  // Experimental
  'experimental-ar-viewer': {
    key: 'experimental-ar-viewer',
    name: 'AR Vehicle Viewer (Experimental)',
    description: 'Augmented reality vehicle inspection',
    category: 'experimental',
    defaultEnabled: false,
    minimumPlan: 'enterprise',
  },
  'experimental-voice-commands': {
    key: 'experimental-voice-commands',
    name: 'Voice Commands (Experimental)',
    description: 'Voice-activated controls and commands',
    category: 'experimental',
    defaultEnabled: false,
  },
  'experimental-offline-mode': {
    key: 'experimental-offline-mode',
    name: 'Offline Mode (Experimental)',
    description: 'Work offline with automatic sync',
    category: 'experimental',
    defaultEnabled: false,
  },

  // UI Enhancements
  'dark-mode': {
    key: 'dark-mode',
    name: 'Dark Mode',
    description: 'Dark color scheme for reduced eye strain',
    category: 'ui',
    defaultEnabled: true,
  },
  'compact-view': {
    key: 'compact-view',
    name: 'Compact View',
    description: 'Denser UI layout for power users',
    category: 'ui',
    defaultEnabled: false,
  },
  'advanced-filters': {
    key: 'advanced-filters',
    name: 'Advanced Filters',
    description: 'Advanced filtering and search capabilities',
    category: 'ui',
    defaultEnabled: true,
  },
  'drag-drop-scheduling': {
    key: 'drag-drop-scheduling',
    name: 'Drag & Drop Scheduling',
    description: 'Drag-and-drop interface for scheduling',
    category: 'ui',
    defaultEnabled: true,
  },
  'multi-tab-interface': {
    key: 'multi-tab-interface',
    name: 'Multi-tab Interface',
    description: 'Open multiple modules in tabs',
    category: 'ui',
    defaultEnabled: false,
  },
};

/**
 * Get feature flag metadata by key
 */
export function getFeatureFlagMetadata(key: FeatureFlagKey): FeatureFlagMetadata {
  return FEATURE_FLAGS[key];
}

/**
 * Get all feature flags by category
 */
export function getFeatureFlagsByCategory(
  category: FeatureFlagMetadata['category']
): FeatureFlagMetadata[] {
  return Object.values(FEATURE_FLAGS).filter((flag) => flag.category === category);
}

/**
 * Get all feature flag keys
 */
export function getAllFeatureFlagKeys(): FeatureFlagKey[] {
  return Object.keys(FEATURE_FLAGS) as FeatureFlagKey[];
}
