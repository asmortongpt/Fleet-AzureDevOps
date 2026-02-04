// Type declarations for Fleet CTA internal modules that don't exist yet
// These modules will be implemented as features are built out

// Services
declare module '@/services/PerformanceMonitor' {
    export const performanceMonitor: {
        trackWebVitals(): void;
    };
}

declare module '@/services/RedisService' {
    export const cacheService: {
        getStats(): Promise<any>;
    };
}

declare module '@/services/GeotabService' {
    export interface GeotabDevice {
        id: string;
        name: string;
        vehicleIdentificationNumber?: string;
    }
    export const geotabService: {
        getDevices(): Promise<GeotabDevice[]>;
        getDeviceLocation(id: string): Promise<any>;
    };
}

declare module '@/services/SamsaraService' {
    export const samsaraService: {
        getVehicleLocations(): Promise<any[]>;
    };
}

declare module '@/services/analyticsService' {
    export function fetchIdleAssets(): Promise<any[]>;
    export function fetchUtilizationData(): Promise<any[]>;
    export function fetchROIMetrics(): Promise<any[]>;
}

declare module '@/services/maintenanceService' {
    export function getMaintenanceHistory(vehicleId: string): Promise<any[]>;
    export function getMaintenanceRecords(): Promise<any[]>;
}

declare module '@/services/vehicleService' {
    export function getVehicles(): Promise<any[]>;
    export function getVehicleById(id: string): Promise<any>;
}

declare module '@/services/outlookCalendarService' {
    export interface CalendarEvent {
        id: string;
        subject: string;
        start: { dateTime: string };
        end: { dateTime: string };
        location?: { displayName: string };
    }
    export const outlookCalendarService: {
        getEvents(): Promise<CalendarEvent[]>;
        createEvent(event: any): Promise<any>;
    };
}

declare module '@/services/FLAIRIntegration' {
    export interface FLAIRExpense {
        id: string;
        amount: number;
        description: string;
    }
    export interface FLAIRApproval {
        id: string;
        status: string;
    }
}

declare module '@/services/api/RealDatabaseAPI' {
    export function createDriver(data: any): Promise<any>;
    export function createVehicle(data: any): Promise<any>;
}

declare module '@/services/analytics/AdvancedAnalyticsService' {
    export const advancedAnalyticsService: any;
}

declare module '@/services/inventory/BarcodeRFIDTrackingService' {
    export const barcodeRFIDTrackingService: any;
}

declare module '@/services/inventory/PredictiveReorderingService' {
    export const predictiveReorderingService: any;
}

declare module '@/services/inventory/WarrantyRecallService' {
    export const warrantyRecallService: any;
}

declare module '@/services/procurement/PurchaseOrderWorkflowService' {
    export const purchaseOrderWorkflowService: any;
}

declare module '@/services/AccurateVehicleImageService' {
    export const accurateVehicleImageService: any;
}

declare module '@/services/RealDataService' {
    export const realDataService: any;
}

declare module '@/services/ReferenceBasedVehicleGenerator' {
    export const referenceBasedVehicleGenerator: any;
}

declare module '@/services/vehicleImageService' {
    export const vehicleImageService: any;
}

// Contexts
declare module '@/context/FleetLocalContext' {
    export function useFleetLocalContext(): {
        addToOfflineQueue(item: any): void;
    };
}

declare module '@contexts/FleetDataContext' {
    export function useFleetDataContext(): any;
}

declare module '@/contexts/AuthContext' {
    export function useAuthContext(): any;
}

// Hooks
// Note: useAuth is defined in @/hooks/useAuth.ts - do not override here

declare module '@/hooks/useDatabase' {
    export function useDatabase(): any;
}

// Utils
declare module '@/utils/exportUtils' {
    export function exportToCSV(data: any[]): void;
    export function exportToExcel(data: any[]): void;
}

declare module '@/utils/validation' {
    export function validateTenantId(id: string): boolean;
}

declare module '@/utils/security' {
    export const securityUtils: any;
}

// Types
// Note: Driver and Vehicle are defined in @/types/index.ts - do not override here

// Components
declare module '@/components/ui/Badge' {
    export const Badge: React.ComponentType<any>;
}

declare module '@/components/ui/Progress' {
    export const Progress: React.ComponentType<any>;
}

declare module '@/components/ui/use-toast' {
    export function useToast(): any;
}

declare module '@/components/ui/toast' {
    export const Toast: React.ComponentType<any>;
    export const ToastProvider: React.ComponentType<any>;
}

declare module '@/components/charts/AdvancedChart' {
    export const AdvancedChart: React.ComponentType<any>;
}

declare module '@/components/metrics/RealtimeMetrics' {
    export const RealtimeMetrics: React.ComponentType<any>;
}

declare module '@/components/integrations/IntegrationCard' {
    export const IntegrationCard: React.ComponentType<any>;
}

declare module '@/components/operations/SplitView' {
    export const SplitView: React.ComponentType<any>;
}

declare module '@/components/operations/InlineActions' {
    export const InlineActions: React.ComponentType<any>;
}

declare module '@/components/EmptyState' {
    export const EmptyState: React.ComponentType<any>;
}

declare module '@/components/ErrorPanel' {
    export const ErrorPanel: React.ComponentType<any>;
}

declare module '@/components/ErrorFallback' {
    export const ErrorFallback: React.ComponentType<any>;
}

declare module '@/components/CSRFInput' {
    export const CSRFInput: React.ComponentType<any>;
}

declare module '@/components/common/Toast' {
    export const Toast: React.ComponentType<any>;
}

// Feature modules
declare module '../services/OutlookCalendarService' {
    export const outlookCalendarService: any;
}

declare module '../mileage/FDOTMileageCalculator' {
    export const FDOTMileageCalculator: React.ComponentType<any>;
}

declare module '../vehicle/OBD2RealTimeConnection' {
    export const OBD2RealTimeConnection: React.ComponentType<any>;
}

declare module '../vehicle/VehicleDetailView' {
    export const VehicleDetailView: React.ComponentType<any>;
}

declare module './VehicleShowroomSelector' {
    export const VehicleShowroomSelector: React.ComponentType<any>;
}

// Radio dispatch modules
declare module '@/lib/use-csrf' {
    export function useCsrf(): any;
}

declare module '@/lib/hooks/useMutation' {
    export function useMutation(): any;
}

declare module '@/lib/hooks/useApiData' {
    export function useApiData(): any;
}

declare module '@/lib/api' {
    export const api: any;
}

declare module '@/lib/auth' {
    export const auth: any;
}

// Scripts
declare module '../scripts/accessibility-audit' {
    export const accessibilityAudit: any;
}
