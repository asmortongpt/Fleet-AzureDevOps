import { withAITracking } from '@microsoft/applicationinsights-react-js'
import { Shield } from "lucide-react"
import { useState, useMemo, lazy, Suspense } from "react"

import { DrilldownManager } from "@/components/DrilldownManager"
import { EnhancedErrorBoundary } from "@/components/EnhancedErrorBoundary"
import { ToastContainer } from "@/components/common/ToastContainer"
import { RoleSwitcher } from "@/components/demo/RoleSwitcher"
import { QueryErrorBoundary } from "@/components/errors/QueryErrorBoundary"
import { CommandCenterLayout } from "@/components/layout/CommandCenterLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFleetData } from "@/hooks/use-fleet-data"
import { navigationItems } from "@/lib/navigation"
import telemetryService from '@/lib/telemetry'

// Lazy load all modules for code splitting - reduces initial bundle by 80%+
// Modules now organized in feature-based folders for better maintainability

// FLEET MODULES

const FleetAnalytics = lazy(() => import("@/components/modules/fleet/FleetAnalytics").then(m => ({ default: m.FleetAnalytics })))
const VehicleTelemetry = lazy(() => import("@/components/modules/fleet/VehicleTelemetry").then(m => ({ default: m.VehicleTelemetry })))
const VirtualGarage = lazy(() => import("@/components/modules/fleet/VirtualGarage").then(m => ({ default: m.VirtualGarage })))
const FleetOptimizer = lazy(() => import("@/components/modules/fleet/FleetOptimizer").then(m => ({ default: m.FleetOptimizer })))

// ANALYTICS MODULES
const ExecutiveDashboard = lazy(() => import("@/components/modules/analytics/ExecutiveDashboard").then(m => ({ default: m.ExecutiveDashboard })))
const DataWorkbench = lazy(() => import("@/components/modules/analytics/DataWorkbench").then(m => ({ default: m.DataWorkbench })))
const EndpointMonitor = lazy(() => import("@/components/modules/analytics/EndpointMonitor").then(m => ({ default: m.EndpointMonitor })))
const CostAnalysisCenter = lazy(() => import("@/components/modules/analytics/CostAnalysisCenter").then(m => ({ default: m.CostAnalysisCenter })))
const CustomReportBuilder = lazy(() => import("@/components/modules/analytics/CustomReportBuilder").then(m => ({ default: m.CustomReportBuilder })))
const AnalyticsDashboard = lazy(() => import("@/components/analytics/AnalyticsDashboard").then(m => ({ default: m.AnalyticsDashboard })))

// ADMIN MODULES
const CommandCenter = lazy(() => import("@/pages/CommandCenter"))
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"))

const PolicyEngineWorkbench = lazy(() => import("@/components/modules/admin/PolicyEngineWorkbench").then(m => ({ default: m.PolicyEngineWorkbench })))
const Notifications = lazy(() => import("@/components/modules/admin/Notifications").then(m => ({ default: m.Notifications })))
const PushNotificationAdmin = lazy(() => import("@/components/modules/admin/PushNotificationAdmin"))

// MAINTENANCE MODULES
const GarageService = lazy(() => import("@/components/modules/maintenance/GarageService").then(m => ({ default: m.GarageService })))
const PredictiveMaintenance = lazy(() => import("@/components/modules/maintenance/PredictiveMaintenance").then(m => ({ default: m.PredictiveMaintenance })))
const MaintenanceScheduling = lazy(() => import("@/components/modules/maintenance/MaintenanceScheduling").then(m => ({ default: m.MaintenanceScheduling })))
const MaintenanceRequest = lazy(() => import("@/components/modules/maintenance/MaintenanceRequest").then(m => ({ default: m.MaintenanceRequest })))

// FUEL MODULES
const FuelManagement = lazy(() => import("@/components/modules/fuel/FuelManagement").then(m => ({ default: m.FuelManagement })))
const FuelPurchasing = lazy(() => import("@/components/modules/fuel/FuelPurchasing").then(m => ({ default: m.FuelPurchasing })))

// OPERATIONS MODULES
const RouteManagement = lazy(() => import("@/components/modules/operations/RouteManagement").then(m => ({ default: m.RouteManagement })))
const AdvancedRouteOptimization = lazy(() => import("@/components/modules/operations/AdvancedRouteOptimization").then(m => ({ default: m.AdvancedRouteOptimization })))
const TaskManagement = lazy(() => import("@/components/modules/operations/TaskManagement").then(m => ({ default: m.TaskManagement })))


// INTEGRATIONS MODULES
const GISCommandCenter = lazy(() => import("@/components/modules/integrations/GISCommandCenter").then(m => ({ default: m.GISCommandCenter })))
const TeamsIntegration = lazy(() => import("@/components/modules/integrations/TeamsIntegration").then(m => ({ default: m.TeamsIntegration })))
const EmailCenter = lazy(() => import("@/components/modules/integrations/EmailCenter").then(m => ({ default: m.EmailCenter })))
const ArcGISIntegration = lazy(() => import("@/components/modules/integrations/ArcGISIntegration").then(m => ({ default: m.ArcGISIntegration })))
const MapSettings = lazy(() => import("@/components/modules/integrations/MapSettings").then(m => ({ default: m.MapSettings })))
const EnhancedMapLayers = lazy(() => import("@/components/modules/integrations/EnhancedMapLayers").then(m => ({ default: m.EnhancedMapLayers })))

// PROCUREMENT MODULES
const VendorManagement = lazy(() => import("@/components/modules/procurement/VendorManagement").then(m => ({ default: m.VendorManagement })))
const PartsInventory = lazy(() => import("@/components/modules/procurement/PartsInventory").then(m => ({ default: m.PartsInventory })))
const PurchaseOrders = lazy(() => import("@/components/modules/procurement/PurchaseOrders").then(m => ({ default: m.PurchaseOrders })))
const Invoices = lazy(() => import("@/components/modules/procurement/Invoices").then(m => ({ default: m.Invoices })))

// TOOLS MODULES
const MileageReimbursement = lazy(() => import("@/components/modules/tools/MileageReimbursement").then(m => ({ default: m.MileageReimbursement })))
const ReceiptProcessing = lazy(() => import("@/components/modules/tools/ReceiptProcessing").then(m => ({ default: m.ReceiptProcessing })))

const CustomFormBuilder = lazy(() => import("@/components/modules/tools/CustomFormBuilder").then(m => ({ default: m.CustomFormBuilder })))

// COMMUNICATION MODULES
const CommunicationLog = lazy(() => import("@/components/modules/communication/CommunicationLog").then(m => ({ default: m.CommunicationLog })))

// MAP-FIRST UX TRANSFORMATION
const LiveFleetDashboard = lazy(() => import("@/components/dashboard/LiveFleetDashboard").then(m => ({ default: m.LiveFleetDashboard })))

// COMPLIANCE MODULES
const OSHAForms = lazy(() => import("@/components/modules/compliance/OSHAForms").then(m => ({ default: m.OSHAForms })))
const VideoTelematics = lazy(() => import("@/components/modules/compliance/VideoTelematics").then(m => ({ default: m.VideoTelematics })))
const IncidentManagement = lazy(() => import("@/components/modules/compliance/IncidentManagement").then(m => ({ default: m.IncidentManagement })))
const DocumentManagement = lazy(() => import("@/components/modules/compliance/DocumentManagement").then(m => ({ default: m.DocumentManagement })))
const DocumentQA = lazy(() => import("@/components/modules/compliance/DocumentQA").then(m => ({ default: m.DocumentQA })))

// COMPLIANCE - PHASE 2 MAP-FIRST MODULES

// CHARGING MODULES
const EVChargingManagement = lazy(() => import("@/components/modules/charging/EVChargingManagement").then(m => ({ default: m.EVChargingManagement })))

// PERSONAL USE MODULES
const PersonalUseDashboard = lazy(() => import("@/components/modules/personal-use/PersonalUseDashboard").then(m => ({ default: m.PersonalUseDashboard })))
const PersonalUsePolicyConfig = lazy(() => import("@/components/modules/personal-use/PersonalUsePolicyConfig").then(m => ({ default: m.PersonalUsePolicyConfig })))
const ReimbursementQueue = lazy(() => import("@/pages/PersonalUse/ReimbursementQueue").then(m => ({ default: m.ReimbursementQueue })))
const ChargesAndBilling = lazy(() => import("@/pages/PersonalUse/ChargesAndBilling").then(m => ({ default: m.ChargesAndBilling })))

// ASSETS MODULES
const AssetManagement = lazy(() => import("@/components/modules/assets/AssetManagement").then(m => ({ default: m.AssetManagement })))
const EquipmentDashboard = lazy(() => import("@/components/modules/assets/EquipmentDashboard").then(m => ({ default: m.EquipmentDashboard })))

// PAGES
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"))

// DRIVER MODULES
const DriverPerformance = lazy(() => import("@/components/modules/drivers/DriverPerformance").then(m => ({ default: m.DriverPerformance })))
const DriverScorecard = lazy(() => import("@/components/modules/drivers/DriverScorecard").then(m => ({ default: m.DriverScorecard })))

// WORKSPACE MODULES (Phase 1 UX Consolidation)
const OperationsWorkspace = lazy(() => import("@/components/workspaces/OperationsWorkspace").then(m => ({ default: m.OperationsWorkspace })))
const FleetWorkspace = lazy(() => import("@/components/workspaces/FleetWorkspace").then(m => ({ default: m.FleetWorkspace })))
const DriversWorkspace = lazy(() => import("@/components/workspaces/DriversWorkspace").then(m => ({ default: m.DriversWorkspace })))
const MaintenanceWorkspace = lazy(() => import("@/components/workspaces/MaintenanceWorkspace").then(m => ({ default: m.MaintenanceWorkspace })))
const AnalyticsWorkspace = lazy(() => import("@/components/workspaces/AnalyticsWorkspace").then(m => ({ default: m.AnalyticsWorkspace })))
const ComplianceWorkspace = lazy(() => import("@/components/workspaces/ComplianceWorkspace").then(m => ({ default: m.ComplianceWorkspace })))

// HUB MODULES (Phase 2-3 Map-First UX Transformation)
const ReportsHub = lazy(() => import("@/components/hubs/reports/ReportsHub").then(m => ({ default: m.ReportsHub })))
const OperationsHub = lazy(() => import("@/components/hubs/operations/OperationsHub").then(m => ({ default: m.OperationsHub })))
const MaintenanceHub = lazy(() => import("@/components/hubs/maintenance/MaintenanceHub").then(m => ({ default: m.MaintenanceHub })))
const ProcurementHub = lazy(() => import("@/components/hubs/procurement/ProcurementHub").then(m => ({ default: m.ProcurementHub })))
const CommunicationHub = lazy(() => import("@/components/hubs/communication/CommunicationHub").then(m => ({ default: m.CommunicationHub })))
const SafetyHub = lazy(() => import("@/components/hubs/safety/SafetyHub").then(m => ({ default: m.SafetyHub })))
const AssetsHub = lazy(() => import("@/components/hubs/assets/AssetsHub").then(m => ({ default: m.AssetsHub })))

// NEW CONSOLIDATED HUB PAGES (Production Readiness Phase 3)
const FleetHubPage = lazy(() => import("@/pages/FleetHub"))
const OperationsHubPage = lazy(() => import("@/pages/OperationsHub"))
const MaintenanceHubPage = lazy(() => import("@/pages/MaintenanceHub"))
const DriversHubPage = lazy(() => import("@/pages/DriversHub"))
const AnalyticsHubPage = lazy(() => import("@/pages/AnalyticsHub"))
const ComplianceHubPage = lazy(() => import("@/pages/ComplianceHub"))
const ProcurementHubPage = lazy(() => import("@/pages/ProcurementHub"))
const AdminHubPage = lazy(() => import("@/pages/AdminHub"))
const SafetyHubPage = lazy(() => import("@/pages/SafetyHub"))
const AssetsHubPage = lazy(() => import("@/pages/AssetsHub"))
const CommunicationHubPage = lazy(() => import("@/pages/CommunicationHub"))

// PAGES
const SettingsPage = lazy(() => import("@/pages/SettingsPage"))
const ProfilePage = lazy(() => import("@/pages/ProfilePage"))

// NEW FEATURE PAGES (Route Fixes)
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"))
const SafetyAlertsPage = lazy(() => import("@/pages/SafetyAlertsPage"))
// const HeavyEquipmentPage = lazy(() => import("@/pages/HeavyEquipmentPage"))

// Loading spinner component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading module...</p>
    </div>
  </div>
)

import { useAuth } from "@/contexts/AuthContext"
import { useNavigation } from "@/contexts/NavigationContext"

// ... existing imports

function App() {
  const { canAccess } = useAuth()
  const { activeModule, setActiveModule } = useNavigation()
  useState(() => telemetryService.initialize())

  const fleetData = useFleetData()

  // ... useEffects

  // Verify access for current module
  const currentNavItem = useMemo(() =>
    navigationItems.find(item => item.id === activeModule),
    [activeModule]
  )

  const hasAccessToModule = useMemo(() => {
    if (!currentNavItem) return true // Default to allow if not in nav (e.g. system pages)
    // Check if item has restrictions
    if (currentNavItem.roles || currentNavItem.permissions) {
      return canAccess(currentNavItem.roles as any, currentNavItem.permissions)
    }
    return true
  }, [currentNavItem, canAccess])

  const renderModule = () => {
    if (!hasAccessToModule) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50 rounded-lg">
          <Shield className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You do not have permission to view this module.
          </p>
          <Button onClick={() => setActiveModule('live-fleet-dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      )
    }

    switch (activeModule) {
      case "live-fleet-dashboard":
        return <LiveFleetDashboard />
      case "dashboard":
        return <CommandCenter />
      case "executive-dashboard":
        return <ExecutiveDashboard />
      case "admin-dashboard":
        return <AdminDashboard />
      case "operations-workspace":
        return <OperationsWorkspace />
      case "fleet-workspace":
        return <FleetWorkspace />
      case "drivers-workspace":
        return <DriversWorkspace />
      case "maintenance-workspace":
        return <MaintenanceWorkspace />
      case "analytics-workspace":
        return <AnalyticsWorkspace />
      case "compliance-workspace":
        return <ComplianceWorkspace />

      case "reports-hub":
        return <ReportsHub />
      case "operations-hub":
        return <OperationsHub />
      case "procurement-hub":
        return <ProcurementHub />
      case "communication-hub":
        return <CommunicationHub />
      case "dispatch-console":
        return <CommandCenter />
      case "fleet-hub": // Assuming 'fleet-hub' was a previous route or will be added
        return <CommandCenter />

      case "garage":
        return <GarageService />
      case "virtual-garage":
        return <VirtualGarage />
      case "predictive":
        return <PredictiveMaintenance />
      case "fuel":
        return <FuelManagement />
      case "gps-tracking":
        return <CommandCenter />
      case "workbench":
        return <DataWorkbench />
      case "mileage":
        return <MileageReimbursement />
      case "routes":
        return <RouteManagement />
      case "gis-map":
        return <GISCommandCenter />
      case "traffic-cameras":
        // Map-First Consolidation: Redirect to Dashboard with layer active
        return <LiveFleetDashboard initialLayer="traffic-cameras" />
      case "comprehensive":
        return <FleetAnalytics />
      case "vendor-management":
        return <VendorManagement />
      case "parts-inventory":
        return <PartsInventory />
      case "purchase-orders":
        return <PurchaseOrders />
      case "invoices":
        return <Invoices />
      case "ai-assistant":
        // TEMPORARILY DISABLED: AIAssistant requires @mui/material dependency
        return <div className="p-6"><Card><CardHeader><CardTitle>AI Assistant (Coming Soon)</CardTitle></CardHeader><CardContent>The AI Assistant feature requires additional dependencies and will be enabled in a future update.</CardContent></Card></div>
      case "teams-integration":
        return <TeamsIntegration />
      case "email-center":
        return <EmailCenter />
      case "maintenance-scheduling":
        return <MaintenanceScheduling />
      case "receipt-processing":
        return <ReceiptProcessing />
      case "communication-log":
        return <CommunicationLog />
      case "geofences":
        // Map-First Consolidation: Redirect to Dashboard with layer active
        return <LiveFleetDashboard initialLayer="geofences" />
      case "osha-forms":
        return <OSHAForms />
      case "policy-engine":
      case "policy-management":
        return <PolicyEngineWorkbench />
      case "video-telematics":
        return <VideoTelematics />
      case "ev-charging":
        return <EVChargingManagement />
      case "vehicle-telemetry":
        return <VehicleTelemetry />
      case "map-layers":
        return <EnhancedMapLayers />
      case "route-optimization":
        return <AdvancedRouteOptimization />
      case "form-builder":
        return <CustomFormBuilder />
      case "personal-use":
        return <PersonalUseDashboard />
      case "personal-use-policy":
        return <PersonalUsePolicyConfig />
      case "reimbursement-queue":
        return <ReimbursementQueue />
      case "charges-billing":
        return <ChargesAndBilling />
      case "arcgis-integration":
        return <ArcGISIntegration />
      case "map-settings":
        return <MapSettings />
      case "asset-management":
        return <AssetManagement />
      case "equipment-dashboard":
        return <EquipmentDashboard />
      case "task-management":
        return <TaskManagement />
      case "incident-management":
        return <IncidentManagement />
      case "notifications":
        return <Notifications />
      case "push-notification-admin":
        return <PushNotificationAdmin />
      case "documents":
        return <DocumentManagement />
      case "document-qa":
        return <DocumentQA />
      case "fuel-purchasing":
        return <FuelPurchasing />
      case "endpoint-monitor":
        return <EndpointMonitor />
      case "driver-mgmt":
        return <DriverPerformance />
      case "driver-scorecard":
        return <DriverScorecard />
      case "drivers":
        return <DriversWorkspace />
      case "fleet-optimizer":
        return <FleetOptimizer />
      case "cost-analysis":
        return <CostAnalysisCenter />
      case "maintenance-hub":
        return <MaintenanceHub />
      case "custom-reports":
        return <CustomReportBuilder />
      case "analytics":
        return <AnalyticsPage />
      case "maintenance-request":
        return <MaintenanceRequest data={fleetData} />
      case "safety-hub":
        return <SafetyHub />
      case "safety-alerts":
        return <SafetyAlertsPage />
      case "heavy-equipment":
        return <EquipmentDashboard /> // TODO: Replace with HeavyEquipmentPage when implemented
      case "assets-hub":
        return <AssetsHub />
      case "settings":
        return <SettingsPage />
      case "profile":
        return <ProfilePage />
      // NEW CONSOLIDATED HUB PAGES (Production Readiness Phase 3)
      case "fleet-hub-consolidated":
        return <FleetHubPage />
      case "operations-hub-consolidated":
        return <OperationsHubPage />
      case "maintenance-hub-consolidated":
        return <MaintenanceHubPage />
      case "drivers-hub-consolidated":
        return <DriversHubPage />
      case "analytics-hub-consolidated":
        return <AnalyticsHubPage />
      case "compliance-hub-consolidated":
        return <ComplianceHubPage />
      case "procurement-hub-consolidated":
        return <ProcurementHubPage />
      case "admin-hub-consolidated":
        return <AdminHubPage />
      case "safety-hub-consolidated":
        return <SafetyHubPage />
      case "assets-hub-consolidated":
        return <AssetsHubPage />
      case "communication-hub-consolidated":
        return <CommunicationHubPage />
      default:
        return <CommandCenter />
    }
  }



  return (
    <DrilldownManager>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      <CommandCenterLayout>
        <EnhancedErrorBoundary
          showDetails={import.meta.env.DEV}
          onError={(error, errorInfo) => {
            console.error('App Error Boundary:', error, errorInfo);
          }}
        >
          <QueryErrorBoundary>
            <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
              {renderModule()}
            </Suspense>
          </QueryErrorBoundary>
        </EnhancedErrorBoundary>
      </CommandCenterLayout>

      {/* Role Switcher FAB button */}
      <RoleSwitcher />

      {/* Toast notifications */}
      <ToastContainer />

    </DrilldownManager >
  )
}

// Export with Application Insights tracking if available
const reactPlugin = telemetryService.getReactPlugin()
export default reactPlugin ? withAITracking(reactPlugin, App) : App
