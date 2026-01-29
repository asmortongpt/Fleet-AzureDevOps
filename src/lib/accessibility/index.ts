/**
 * Accessibility Library
 *
 * Comprehensive accessibility utilities for WCAG 2.1 AA compliance
 * Exports all accessibility hooks, utilities, and testing tools
 */

// Hooks
export {
  useFocusTrap,
  useKeyboardNavigation,
  useAriaAnnouncer,
  useReducedMotion,
  useFocusVisible,
  useSkipLinks,
  useAccessibility,
} from './hooks';

// WCAG Color Contrast Utilities
export {
  hexToRgb,
  getLuminance,
  getContrastRatio,
  meetsWCAG,
  getWCAGCompliance,
  findCompliantColor,
  validateThemeColors,
  WCAG_REQUIREMENTS,
  type WCAGLevel,
  type TextSize,
} from './wcag-contrast';

// Axe-core Testing
export {
  initializeAxe,
  runAccessibilityAudit,
  generateAccessibilityReport,
  logAccessibilityViolations,
} from './axe-init';

// Re-export audit script
export { default as runAudit, downloadAuditReport } from '../../scripts/accessibility-audit';
