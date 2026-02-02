/**
 * Module Registry - Declarative module definitions for the ArchonY SPA
 *
 * Replaces the 120+ case switch statement in App.tsx with a data-driven registry.
 * Each module defines its id, label, category, lazy component, panel width, and search keywords.
 */
import { lazy, type LazyExoticComponent, type ComponentType } from 'react'

export type ModuleCategory = 'fleet' | 'operations' | 'maintenance' | 'safety' | 'analytics' | 'admin'
export type PanelWidth = 'narrow' | 'medium' | 'wide' | 'takeover'

export interface ModuleDefinition {
  id: string
  label: string
  category: ModuleCategory
  component: LazyExoticComponent<ComponentType<any>>
  panelWidth: PanelWidth
  keywords: string[]
  roles?: string[]
  aliases?: string[] // Alternative module IDs that map to this module
  icon?: string // Lucide icon name for CommandPalette results
}

// Helper to create lazy imports with named exports
const lazyNamed = <T extends ComponentType<any>>(
  importFn: () => Promise<{ [key: string]: T }>,
  name: string
): LazyExoticComponent<T> =>
  lazy(() => importFn().then(m => ({ default: (m as any)[name] })))

// ============================================================================
// FLEET MODULES
// ============================================================================

const FleetAnalytics = lazyNamed(() => import('@/components/modules/fleet/FleetAnalytics'), 'FleetAnalytics')
const VehicleTelemetry = lazyNamed(() => import('@/components/modules/fleet/VehicleTelemetry'), 'VehicleTelemetry')
const VirtualGarage = lazyNamed(() => import('@/components/modules/fleet/VirtualGarage'), 'VirtualGarage')
const FleetOptimizer = lazyNamed(() => import('@/components/modules/fleet/FleetOptimizer'), 'FleetOptimizer')
const LiveFleetDashboard = lazyNamed(() => import('@/components/dashboard/LiveFleetDashboard'), 'LiveFleetDashboard')
const FleetOperationsHub = lazy(() => import('@/pages/FleetOperationsHub'))

// DRIVER MODULES
const DriverPerformance = lazyNamed(() => import('@/components/modules/drivers/DriverPerformance'), 'DriverPerformance')
const DriverScorecard = lazyNamed(() => import('@/components/modules/drivers/DriverScorecard'), 'DriverScorecard')

// ASSET MODULES
const AssetManagement = lazyNamed(() => import('@/components/modules/assets/AssetManagement'), 'AssetManagement')
const EquipmentDashboard = lazyNamed(() => import('@/components/modules/assets/EquipmentDashboard'), 'EquipmentDashboard')

// ============================================================================
// OPERATIONS MODULES
// ============================================================================

const RouteManagement = lazyNamed(() => import('@/components/modules/operations/RouteManagement'), 'RouteManagement')
const AdvancedRouteOptimization = lazyNamed(() => import('@/components/modules/operations/AdvancedRouteOptimization'), 'AdvancedRouteOptimization')
const TaskManagement = lazyNamed(() => import('@/components/modules/operations/TaskManagement'), 'TaskManagement')
const DispatchConsole = lazy(() => import('@/components/modules/operations/DispatchConsole'))
const OperationsWorkspace = lazyNamed(() => import('@/components/workspaces/OperationsWorkspace'), 'OperationsWorkspace')

// FUEL MODULES
const FuelManagement = lazyNamed(() => import('@/components/modules/fuel/FuelManagement'), 'FuelManagement')
const FuelPurchasing = lazyNamed(() => import('@/components/modules/fuel/FuelPurchasing'), 'FuelPurchasing')

// ============================================================================
// MAINTENANCE MODULES
// ============================================================================

const GarageService = lazyNamed(() => import('@/components/modules/maintenance/GarageService'), 'GarageService')
const PredictiveMaintenance = lazyNamed(() => import('@/components/modules/maintenance/PredictiveMaintenance'), 'PredictiveMaintenance')
const MaintenanceScheduling = lazyNamed(() => import('@/components/modules/maintenance/MaintenanceScheduling'), 'MaintenanceScheduling')
const MaintenanceRequest = lazyNamed(() => import('@/components/modules/maintenance/MaintenanceRequest'), 'MaintenanceRequest')
const MaintenanceWorkspace = lazyNamed(() => import('@/components/workspaces/MaintenanceWorkspace'), 'MaintenanceWorkspace')

// ============================================================================
// SAFETY & COMPLIANCE MODULES
// ============================================================================

const OSHAForms = lazyNamed(() => import('@/components/modules/compliance/OSHAForms'), 'OSHAForms')
const VideoTelematics = lazyNamed(() => import('@/components/modules/compliance/VideoTelematics'), 'VideoTelematics')
const IncidentManagement = lazyNamed(() => import('@/components/modules/compliance/IncidentManagement'), 'IncidentManagement')
const DocumentManagement = lazyNamed(() => import('@/components/modules/compliance/DocumentManagement'), 'DocumentManagement')
const DocumentQA = lazyNamed(() => import('@/components/modules/compliance/DocumentQA'), 'DocumentQA')
const ComplianceSafetyHub = lazy(() => import('@/pages/ComplianceSafetyHub'))
const ComplianceWorkspace = lazyNamed(() => import('@/components/workspaces/ComplianceWorkspace'), 'ComplianceWorkspace')
const PolicyEngineWorkbench = lazyNamed(() => import('@/components/modules/admin/PolicyEngineWorkbench'), 'PolicyEngineWorkbench')

// ============================================================================
// ANALYTICS & REPORTING MODULES
// ============================================================================

const ExecutiveDashboard = lazyNamed(() => import('@/components/modules/analytics/ExecutiveDashboard'), 'ExecutiveDashboard')
const DataWorkbench = lazyNamed(() => import('@/components/modules/analytics/DataWorkbench'), 'DataWorkbench')
const EndpointMonitor = lazyNamed(() => import('@/components/modules/analytics/EndpointMonitor'), 'EndpointMonitor')
const CostAnalysisCenter = lazyNamed(() => import('@/components/modules/analytics/CostAnalysisCenter'), 'CostAnalysisCenter')
const CustomReportBuilder = lazyNamed(() => import('@/components/modules/analytics/CustomReportBuilder'), 'CustomReportBuilder')
const AnalyticsWorkspace = lazyNamed(() => import('@/components/workspaces/AnalyticsWorkspace'), 'AnalyticsWorkspace')
const BusinessManagementHub = lazy(() => import('@/pages/BusinessManagementHub'))

// ============================================================================
// ADMIN & CONFIGURATION MODULES
// ============================================================================

const AdminDashboard = lazy(() => import('@/pages/AdminHub'))
const AdminConfigurationHub = lazy(() => import('@/pages/AdminConfigurationHub'))
const Notifications = lazyNamed(() => import('@/components/modules/admin/Notifications'), 'Notifications')
const PushNotificationAdmin = lazy(() => import('@/components/modules/admin/PushNotificationAdmin'))

// INTEGRATIONS
const GISCommandCenter = lazyNamed(() => import('@/components/modules/integrations/GISCommandCenter'), 'GISCommandCenter')
const TeamsIntegration = lazyNamed(() => import('@/components/modules/integrations/TeamsIntegration'), 'TeamsIntegration')
const EmailCenter = lazyNamed(() => import('@/components/modules/integrations/EmailCenter'), 'EmailCenter')
const ArcGISIntegration = lazyNamed(() => import('@/components/modules/integrations/ArcGISIntegration'), 'ArcGISIntegration')
const MapSettings = lazyNamed(() => import('@/components/modules/integrations/MapSettings'), 'MapSettings')
const EnhancedMapLayers = lazyNamed(() => import('@/components/modules/integrations/EnhancedMapLayers'), 'EnhancedMapLayers')

// PROCUREMENT
const VendorManagement = lazyNamed(() => import('@/components/modules/procurement/VendorManagement'), 'VendorManagement')
const PartsInventory = lazyNamed(() => import('@/components/modules/procurement/PartsInventory'), 'PartsInventory')
const PurchaseOrders = lazyNamed(() => import('@/components/modules/procurement/PurchaseOrders'), 'PurchaseOrders')
const Invoices = lazyNamed(() => import('@/components/modules/procurement/Invoices'), 'Invoices')

// TOOLS
const MileageReimbursement = lazyNamed(() => import('@/components/modules/tools/MileageReimbursement'), 'MileageReimbursement')
const ReceiptProcessing = lazyNamed(() => import('@/components/modules/tools/ReceiptProcessing'), 'ReceiptProcessing')
const CustomFormBuilder = lazyNamed(() => import('@/components/modules/tools/CustomFormBuilder'), 'CustomFormBuilder')

// COMMUNICATION
const CommunicationLog = lazyNamed(() => import('@/components/modules/communication/CommunicationLog'), 'CommunicationLog')
const PeopleCommunicationHub = lazy(() => import('@/pages/PeopleCommunicationHub'))

// CHARGING & EV
const EVChargingManagement = lazyNamed(() => import('@/components/modules/charging/EVChargingManagement'), 'EVChargingManagement')
const ChargingHub = lazy(() => import('@/pages/ChargingHub'))
const EVHub = lazy(() => import('@/pages/EVHub'))

// PERSONAL USE
const PersonalUseDashboard = lazyNamed(() => import('@/components/modules/personal-use/PersonalUseDashboard'), 'PersonalUseDashboard')
const PersonalUsePolicyConfig = lazyNamed(() => import('@/components/modules/personal-use/PersonalUsePolicyConfig'), 'PersonalUsePolicyConfig')
const ReimbursementQueue = lazyNamed(() => import('@/pages/PersonalUse/ReimbursementQueue'), 'ReimbursementQueue')
const ChargesAndBilling = lazyNamed(() => import('@/pages/PersonalUse/ChargesAndBilling'), 'ChargesAndBilling')

// PAGES
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const SafetyAlertsPage = lazy(() => import('@/pages/SafetyAlertsPage'))
const VehicleShowroom3D = lazy(() => import('@/pages/VehicleShowroom3D'))

// LEGACY HUB PAGES (backward compat)
const HOSHubPage = lazy(() => import('@/pages/HOSHub'))
const FuelHubPage = lazy(() => import('@/pages/FuelHub'))
const IncidentHubPage = lazy(() => import('@/pages/IncidentHub'))
const AnalyticsHubPage = lazy(() => import('@/pages/AnalyticsHub'))
const ReportsHubPage = lazy(() => import('@/pages/ReportsHub'))

// WORKSPACE MODULES
const FleetWorkspace = lazyNamed(() => import('@/components/workspaces/FleetWorkspace'), 'FleetWorkspace')
const DriversWorkspace = lazyNamed(() => import('@/components/workspaces/DriversWorkspace'), 'DriversWorkspace')

// AI
const AIAssistantChat = lazyNamed(() => import('@/components/ai/AIAssistantChat'), 'AIAssistantChat')

// ============================================================================
// MODULE REGISTRY
// ============================================================================

export const moduleRegistry: ModuleDefinition[] = [
  // --- FLEET CATEGORY ---
  {
    id: 'live-fleet-dashboard',
    label: 'Live Fleet Dashboard',
    category: 'fleet',
    component: LiveFleetDashboard,
    panelWidth: 'takeover',
    keywords: ['dashboard', 'live', 'map', 'fleet', 'gps', 'tracking', 'real-time'],
    aliases: ['dashboard', 'gps-tracking'],
  },
  {
    id: 'fleet',
    label: 'Fleet Operations Hub',
    category: 'fleet',
    component: FleetOperationsHub,
    panelWidth: 'wide',
    keywords: ['fleet', 'vehicles', 'drivers', 'operations', 'hub'],
    aliases: ['fleet-hub-consolidated', 'operations-hub-consolidated', 'maintenance-hub-consolidated', 'drivers-hub-consolidated', 'assets-hub-consolidated', 'operations', 'maintenance', 'drivers', 'assets'],
  },
  {
    id: 'comprehensive',
    label: 'Fleet Analytics',
    category: 'fleet',
    component: FleetAnalytics,
    panelWidth: 'wide',
    keywords: ['analytics', 'fleet', 'reports', 'charts'],
  },
  {
    id: 'vehicle-telemetry',
    label: 'Vehicle Telemetry',
    category: 'fleet',
    component: VehicleTelemetry,
    panelWidth: 'wide',
    keywords: ['telemetry', 'vehicle', 'obd', 'diagnostics'],
  },
  {
    id: 'virtual-garage',
    label: 'Virtual Garage',
    category: 'fleet',
    component: VirtualGarage,
    panelWidth: 'takeover',
    keywords: ['garage', 'virtual', '3d', 'vehicle'],
  },
  {
    id: 'fleet-optimizer',
    label: 'Fleet Optimizer',
    category: 'fleet',
    component: FleetOptimizer,
    panelWidth: 'wide',
    keywords: ['optimizer', 'fleet', 'efficiency'],
  },
  {
    id: 'driver-mgmt',
    label: 'Driver Performance',
    category: 'fleet',
    component: DriverPerformance,
    panelWidth: 'wide',
    keywords: ['driver', 'performance', 'management'],
  },
  {
    id: 'driver-scorecard',
    label: 'Driver Scorecard',
    category: 'fleet',
    component: DriverScorecard,
    panelWidth: 'wide',
    keywords: ['driver', 'scorecard', 'safety', 'score'],
  },
  {
    id: 'asset-management',
    label: 'Asset Management',
    category: 'fleet',
    component: AssetManagement,
    panelWidth: 'wide',
    keywords: ['asset', 'management', 'inventory'],
  },
  {
    id: 'equipment-dashboard',
    label: 'Equipment Dashboard',
    category: 'fleet',
    component: EquipmentDashboard,
    panelWidth: 'wide',
    keywords: ['equipment', 'heavy', 'dashboard'],
    aliases: ['heavy-equipment'],
  },
  {
    id: 'fleet-workspace',
    label: 'Fleet Workspace',
    category: 'fleet',
    component: FleetWorkspace,
    panelWidth: 'takeover',
    keywords: ['fleet', 'workspace'],
  },
  {
    id: 'drivers-workspace',
    label: 'Drivers Workspace',
    category: 'fleet',
    component: DriversWorkspace,
    panelWidth: 'takeover',
    keywords: ['drivers', 'workspace'],
  },
  {
    id: '3d-garage',
    label: '3D Vehicle Showroom',
    category: 'fleet',
    component: VehicleShowroom3D,
    panelWidth: 'takeover',
    keywords: ['3d', 'showroom', 'vehicle', 'garage'],
    aliases: ['vehicle-showroom', 'showroom'],
  },

  // --- OPERATIONS CATEGORY ---
  {
    id: 'dispatch-console',
    label: 'Dispatch Console',
    category: 'operations',
    component: DispatchConsole,
    panelWidth: 'takeover',
    keywords: ['dispatch', 'console', 'assign', 'route'],
  },
  {
    id: 'routes',
    label: 'Route Management',
    category: 'operations',
    component: RouteManagement,
    panelWidth: 'wide',
    keywords: ['route', 'management', 'planning'],
  },
  {
    id: 'route-optimization',
    label: 'Route Optimization',
    category: 'operations',
    component: AdvancedRouteOptimization,
    panelWidth: 'wide',
    keywords: ['route', 'optimization', 'advanced'],
  },
  {
    id: 'task-management',
    label: 'Task Management',
    category: 'operations',
    component: TaskManagement,
    panelWidth: 'medium',
    keywords: ['task', 'management', 'assign', 'work'],
  },
  {
    id: 'fuel',
    label: 'Fuel Management',
    category: 'operations',
    component: FuelManagement,
    panelWidth: 'wide',
    keywords: ['fuel', 'management', 'consumption'],
  },
  {
    id: 'fuel-purchasing',
    label: 'Fuel Purchasing',
    category: 'operations',
    component: FuelPurchasing,
    panelWidth: 'medium',
    keywords: ['fuel', 'purchasing', 'cards'],
  },
  {
    id: 'fuel-management',
    label: 'Fuel Hub',
    category: 'operations',
    component: FuelHubPage,
    panelWidth: 'wide',
    keywords: ['fuel', 'hub'],
  },
  {
    id: 'operations-workspace',
    label: 'Operations Workspace',
    category: 'operations',
    component: OperationsWorkspace,
    panelWidth: 'takeover',
    keywords: ['operations', 'workspace'],
  },
  {
    id: 'gis-map',
    label: 'GIS Command Center',
    category: 'operations',
    component: GISCommandCenter,
    panelWidth: 'takeover',
    keywords: ['gis', 'map', 'command', 'center'],
  },
  {
    id: 'ev-charging',
    label: 'EV Charging',
    category: 'operations',
    component: EVChargingManagement,
    panelWidth: 'wide',
    keywords: ['ev', 'charging', 'electric', 'station'],
  },
  {
    id: 'charging-hub',
    label: 'Charging Hub',
    category: 'operations',
    component: ChargingHub,
    panelWidth: 'wide',
    keywords: ['charging', 'hub', 'ev'],
    aliases: ['charging'],
  },
  {
    id: 'ev-hub',
    label: 'EV Hub',
    category: 'operations',
    component: EVHub,
    panelWidth: 'wide',
    keywords: ['ev', 'hub', 'electric'],
    aliases: ['ev'],
  },
  {
    id: 'personal-use',
    label: 'Personal Use',
    category: 'operations',
    component: PersonalUseDashboard,
    panelWidth: 'medium',
    keywords: ['personal', 'use', 'private'],
  },
  {
    id: 'personal-use-policy',
    label: 'Personal Use Policy',
    category: 'operations',
    component: PersonalUsePolicyConfig,
    panelWidth: 'medium',
    keywords: ['personal', 'use', 'policy', 'config'],
  },
  {
    id: 'reimbursement-queue',
    label: 'Reimbursement Queue',
    category: 'operations',
    component: ReimbursementQueue,
    panelWidth: 'medium',
    keywords: ['reimbursement', 'queue', 'mileage'],
  },
  {
    id: 'charges-billing',
    label: 'Charges & Billing',
    category: 'operations',
    component: ChargesAndBilling,
    panelWidth: 'medium',
    keywords: ['charges', 'billing', 'personal'],
  },

  // --- MAINTENANCE CATEGORY ---
  {
    id: 'garage',
    label: 'Garage Service',
    category: 'maintenance',
    component: GarageService,
    panelWidth: 'wide',
    keywords: ['garage', 'service', 'repair', 'bay'],
  },
  {
    id: 'predictive',
    label: 'Predictive Maintenance',
    category: 'maintenance',
    component: PredictiveMaintenance,
    panelWidth: 'wide',
    keywords: ['predictive', 'maintenance', 'ai', 'forecast'],
  },
  {
    id: 'maintenance-scheduling',
    label: 'Maintenance Scheduling',
    category: 'maintenance',
    component: MaintenanceScheduling,
    panelWidth: 'medium',
    keywords: ['maintenance', 'scheduling', 'calendar'],
  },
  {
    id: 'maintenance-request',
    label: 'Maintenance Request',
    category: 'maintenance',
    component: MaintenanceRequest,
    panelWidth: 'medium',
    keywords: ['maintenance', 'request', 'work order'],
  },
  {
    id: 'maintenance-workspace',
    label: 'Maintenance Workspace',
    category: 'maintenance',
    component: MaintenanceWorkspace,
    panelWidth: 'takeover',
    keywords: ['maintenance', 'workspace'],
  },

  // --- SAFETY CATEGORY ---
  {
    id: 'safety',
    label: 'Safety & Compliance Hub',
    category: 'safety',
    component: ComplianceSafetyHub,
    panelWidth: 'wide',
    keywords: ['safety', 'compliance', 'hub'],
    aliases: ['compliance', 'compliance-hub-consolidated', 'safety-hub-consolidated', 'safety-compliance-hub', 'policy-hub'],
  },
  {
    id: 'osha-forms',
    label: 'OSHA Forms',
    category: 'safety',
    component: OSHAForms,
    panelWidth: 'medium',
    keywords: ['osha', 'forms', 'safety', 'compliance'],
  },
  {
    id: 'video-telematics',
    label: 'Video Telematics',
    category: 'safety',
    component: VideoTelematics,
    panelWidth: 'wide',
    keywords: ['video', 'telematics', 'dashcam', 'camera'],
  },
  {
    id: 'incident-management',
    label: 'Incident Management',
    category: 'safety',
    component: IncidentManagement,
    panelWidth: 'wide',
    keywords: ['incident', 'management', 'report', 'accident'],
  },
  {
    id: 'incidents',
    label: 'Incidents Hub',
    category: 'safety',
    component: IncidentHubPage,
    panelWidth: 'wide',
    keywords: ['incidents', 'hub'],
  },
  {
    id: 'policy-engine',
    label: 'Policy Engine',
    category: 'safety',
    component: PolicyEngineWorkbench,
    panelWidth: 'wide',
    keywords: ['policy', 'engine', 'rules', 'enforcement'],
    aliases: ['policy-management'],
  },
  {
    id: 'safety-alerts',
    label: 'Safety Alerts',
    category: 'safety',
    component: SafetyAlertsPage,
    panelWidth: 'medium',
    keywords: ['safety', 'alerts', 'notifications'],
  },
  {
    id: 'hos',
    label: 'Hours of Service',
    category: 'safety',
    component: HOSHubPage,
    panelWidth: 'wide',
    keywords: ['hours', 'service', 'hos', 'eld', 'compliance'],
    aliases: ['hours-of-service'],
  },
  {
    id: 'compliance-workspace',
    label: 'Compliance Workspace',
    category: 'safety',
    component: ComplianceWorkspace,
    panelWidth: 'takeover',
    keywords: ['compliance', 'workspace'],
  },
  {
    id: 'documents',
    label: 'Document Management',
    category: 'safety',
    component: DocumentManagement,
    panelWidth: 'wide',
    keywords: ['documents', 'management', 'files'],
  },
  {
    id: 'document-qa',
    label: 'Document QA',
    category: 'safety',
    component: DocumentQA,
    panelWidth: 'medium',
    keywords: ['document', 'qa', 'quality', 'review'],
  },

  // --- ANALYTICS CATEGORY ---
  {
    id: 'financial',
    label: 'Business Management Hub',
    category: 'analytics',
    component: BusinessManagementHub,
    panelWidth: 'wide',
    keywords: ['business', 'financial', 'management', 'hub'],
    aliases: ['financial-hub-consolidated', 'procurement-hub-consolidated', 'analytics-hub-consolidated', 'reports-hub', 'insights-hub', 'procurement'],
  },
  {
    id: 'executive-dashboard',
    label: 'Executive Dashboard',
    category: 'analytics',
    component: ExecutiveDashboard,
    panelWidth: 'takeover',
    keywords: ['executive', 'dashboard', 'ceo', 'overview'],
  },
  {
    id: 'workbench',
    label: 'Data Workbench',
    category: 'analytics',
    component: DataWorkbench,
    panelWidth: 'takeover',
    keywords: ['data', 'workbench', 'query', 'explore'],
  },
  {
    id: 'endpoint-monitor',
    label: 'Endpoint Monitor',
    category: 'analytics',
    component: EndpointMonitor,
    panelWidth: 'wide',
    keywords: ['endpoint', 'monitor', 'api', 'health'],
  },
  {
    id: 'cost-analysis',
    label: 'Cost Analysis',
    category: 'analytics',
    component: CostAnalysisCenter,
    panelWidth: 'wide',
    keywords: ['cost', 'analysis', 'financial', 'spending'],
  },
  {
    id: 'custom-reports',
    label: 'Custom Reports',
    category: 'analytics',
    component: CustomReportBuilder,
    panelWidth: 'takeover',
    keywords: ['custom', 'reports', 'builder', 'create'],
  },
  {
    id: 'analytics',
    label: 'Analytics Hub',
    category: 'analytics',
    component: AnalyticsHubPage,
    panelWidth: 'wide',
    keywords: ['analytics', 'hub'],
  },
  {
    id: 'analytics-workspace',
    label: 'Analytics Workspace',
    category: 'analytics',
    component: AnalyticsWorkspace,
    panelWidth: 'takeover',
    keywords: ['analytics', 'workspace'],
  },
  {
    id: 'reports',
    label: 'Reports Hub',
    category: 'analytics',
    component: ReportsHubPage,
    panelWidth: 'wide',
    keywords: ['reports', 'hub', 'generate'],
  },
  {
    id: 'vendor-management',
    label: 'Vendor Management',
    category: 'analytics',
    component: VendorManagement,
    panelWidth: 'medium',
    keywords: ['vendor', 'management', 'supplier'],
  },
  {
    id: 'parts-inventory',
    label: 'Parts Inventory',
    category: 'analytics',
    component: PartsInventory,
    panelWidth: 'medium',
    keywords: ['parts', 'inventory', 'stock'],
  },
  {
    id: 'purchase-orders',
    label: 'Purchase Orders',
    category: 'analytics',
    component: PurchaseOrders,
    panelWidth: 'medium',
    keywords: ['purchase', 'orders', 'po'],
  },
  {
    id: 'invoices',
    label: 'Invoices',
    category: 'analytics',
    component: Invoices,
    panelWidth: 'medium',
    keywords: ['invoices', 'billing', 'payment'],
  },
  {
    id: 'mileage',
    label: 'Mileage Reimbursement',
    category: 'analytics',
    component: MileageReimbursement,
    panelWidth: 'medium',
    keywords: ['mileage', 'reimbursement', 'expense'],
  },
  {
    id: 'receipt-processing',
    label: 'Receipt Processing',
    category: 'analytics',
    component: ReceiptProcessing,
    panelWidth: 'medium',
    keywords: ['receipt', 'processing', 'expense', 'scan'],
  },

  // --- ADMIN CATEGORY ---
  {
    id: 'admin',
    label: 'Admin & Configuration',
    category: 'admin',
    component: AdminConfigurationHub,
    panelWidth: 'wide',
    keywords: ['admin', 'configuration', 'settings', 'hub'],
    aliases: ['admin-hub-consolidated', 'integrations-hub-consolidated', 'documents-hub', 'cta-configuration-hub', 'data-governance-hub', 'configuration-hub', 'integrations'],
  },
  {
    id: 'admin-dashboard',
    label: 'Admin Dashboard',
    category: 'admin',
    component: AdminDashboard,
    panelWidth: 'takeover',
    keywords: ['admin', 'dashboard', 'system'],
  },
  {
    id: 'communication',
    label: 'People & Communication',
    category: 'admin',
    component: PeopleCommunicationHub,
    panelWidth: 'wide',
    keywords: ['people', 'communication', 'hub'],
    aliases: ['communication-hub-consolidated', 'people-hub', 'work-hub'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    category: 'admin',
    component: Notifications,
    panelWidth: 'narrow',
    keywords: ['notifications', 'alerts', 'messages'],
  },
  {
    id: 'push-notification-admin',
    label: 'Push Notification Admin',
    category: 'admin',
    component: PushNotificationAdmin,
    panelWidth: 'medium',
    keywords: ['push', 'notification', 'admin'],
  },
  {
    id: 'teams-integration',
    label: 'Teams Integration',
    category: 'admin',
    component: TeamsIntegration,
    panelWidth: 'medium',
    keywords: ['teams', 'microsoft', 'integration', 'chat'],
  },
  {
    id: 'email-center',
    label: 'Email Center',
    category: 'admin',
    component: EmailCenter,
    panelWidth: 'wide',
    keywords: ['email', 'center', 'messaging'],
  },
  {
    id: 'communication-log',
    label: 'Communication Log',
    category: 'admin',
    component: CommunicationLog,
    panelWidth: 'medium',
    keywords: ['communication', 'log', 'history'],
  },
  {
    id: 'arcgis-integration',
    label: 'ArcGIS Integration',
    category: 'admin',
    component: ArcGISIntegration,
    panelWidth: 'wide',
    keywords: ['arcgis', 'gis', 'integration', 'map'],
  },
  {
    id: 'map-settings',
    label: 'Map Settings',
    category: 'admin',
    component: MapSettings,
    panelWidth: 'medium',
    keywords: ['map', 'settings', 'configuration'],
  },
  {
    id: 'map-layers',
    label: 'Map Layers',
    category: 'admin',
    component: EnhancedMapLayers,
    panelWidth: 'medium',
    keywords: ['map', 'layers', 'overlay'],
  },
  {
    id: 'form-builder',
    label: 'Form Builder',
    category: 'admin',
    component: CustomFormBuilder,
    panelWidth: 'takeover',
    keywords: ['form', 'builder', 'custom', 'create'],
  },
  {
    id: 'ai-assistant',
    label: 'AI Assistant',
    category: 'admin',
    component: AIAssistantChat,
    panelWidth: 'medium',
    keywords: ['ai', 'assistant', 'chat', 'help'],
  },
  {
    id: 'settings',
    label: 'Settings',
    category: 'admin',
    component: SettingsPage,
    panelWidth: 'wide',
    keywords: ['settings', 'preferences', 'account'],
  },
  {
    id: 'profile',
    label: 'Profile',
    category: 'admin',
    component: ProfilePage,
    panelWidth: 'medium',
    keywords: ['profile', 'user', 'account'],
  },
]

// ============================================================================
// LOOKUP HELPERS
// ============================================================================

/** Build an alias → module-id map for fast lookup */
const aliasMap = new Map<string, string>()
for (const mod of moduleRegistry) {
  aliasMap.set(mod.id, mod.id)
  if (mod.aliases) {
    for (const alias of mod.aliases) {
      aliasMap.set(alias, mod.id)
    }
  }
}

/** Look up a module by id or alias. Returns undefined if not found. */
export function getModule(idOrAlias: string): ModuleDefinition | undefined {
  const resolvedId = aliasMap.get(idOrAlias) ?? idOrAlias
  return moduleRegistry.find(m => m.id === resolvedId)
}

/** Get all modules in a category */
export function getModulesByCategory(category: ModuleCategory): ModuleDefinition[] {
  return moduleRegistry.filter(m => m.category === category)
}

/** Search modules by keyword (for CommandPalette) */
export function searchModules(query: string): ModuleDefinition[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return moduleRegistry.filter(m =>
    m.label.toLowerCase().includes(q) ||
    m.keywords.some(k => k.includes(q)) ||
    m.id.includes(q)
  )
}

/** Category metadata for the IconRail */
export const categoryConfig: Record<ModuleCategory, { label: string; iconName: string }> = {
  fleet: { label: 'Fleet', iconName: 'Truck' },
  operations: { label: 'Operations', iconName: 'Route' },
  maintenance: { label: 'Maintenance', iconName: 'Wrench' },
  safety: { label: 'Safety', iconName: 'ShieldCheck' },
  analytics: { label: 'Analytics', iconName: 'BarChart3' },
  admin: { label: 'Admin', iconName: 'Settings' },
}
