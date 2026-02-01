/**
 * Contexts Barrel Export
 * Re-exports all context providers and hooks for centralized import management
 */

// Auth Context - complete exports
export { AuthProvider, useAuth } from './AuthContext';
export type { User, UserRole, AuthContextType } from './AuthContext';

// Other Context Providers
export { DrilldownProvider, useDrilldown } from './DrilldownContext';
export type { DrilldownContextType } from './DrilldownContext';

export { FeatureFlagProvider, useFeatureFlags } from './FeatureFlagContext';
export { TenantProvider, useTenant } from './TenantContext';
export { NavigationProvider, useNavigation } from './NavigationContext';
export { PermissionProvider, usePermission } from './PermissionContext';
export { PolicyProvider, usePolicy } from './PolicyContext';
export { GlobalStateProvider, useGlobalState } from './GlobalStateContext';
export { EntityLinkingProvider, useEntityLinking } from './EntityLinkingContext';
export { WebSocketProvider, useWebSocketContext } from './WebSocketContext';
export { ToastProvider, useToast } from './ToastContext';
export { SSOAuthProvider, useSSOAuth } from './SSOAuthContext';
