import { useState, useMemo, useEffect, lazy, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  Gear,
  Bell,
  SignOut,
  List,
  X,
  CarProfile
} from "@phosphor-icons/react"
import { navigationItems } from "@/lib/navigation"
import { RoleSwitcher } from "@/components/demo/RoleSwitcher"
import { ToastContainer } from "@/components/common/ToastContainer"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { EnhancedErrorBoundary } from "@/components/EnhancedErrorBoundary"
import { QueryErrorBoundary } from "@/components/errors/QueryErrorBoundary"
import { ThemeToggle } from "@/components/ThemeToggle"
import { DrilldownManager } from "@/components/DrilldownManager"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useFacilities } from "@/hooks/use-api"
import { withAITracking } from '@microsoft/applicationinsights-react-js'
import telemetryService from '@/lib/telemetry'

// Lazy load all modules for code splitting - reduces initial bundle by 80%+
// Modules now organized in feature-based folders for better maintainability

// FLEET MODULES
const FleetDashboard = lazy(() => import("@/components/modules/fleet/FleetDashboard").then(m => ({ default: m.FleetDashboard })))
const FleetDashboardModern = lazy(() => import("@/components/modules/fleet/FleetDashboardModern").then(m => ({ default: m.FleetDashboardModern })))
const FleetAnalytics = lazy(() => import("@/components/modules/fleet/FleetAnalytics").then(m => ({ default: m.FleetAnalytics })))
const GPSTracking = lazy(() => import("@/components/modules/fleet/GPSTracking").then(m => ({ default: m.GPSTracking })))
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
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"))
const PeopleManagement = lazy(() => import("@/components/modules/admin/PeopleManagement").then(m => ({ default: m.PeopleManagement })))
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
const GeofenceManagement = lazy(() => import("@/components/modules/operations/GeofenceManagement").then(m => ({ default: m.GeofenceManagement })))
const AdvancedRouteOptimization = lazy(() => import("@/components/modules/operations/AdvancedRouteOptimization").then(m => ({ default: m.AdvancedRouteOptimization })))
const TaskManagement = lazy(() => import("@/components/modules/operations/TaskManagement").then(m => ({ default: m.TaskManagement })))
const DispatchConsole = lazy(() => import("@/components/DispatchConsole"))

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
const TrafficCameras = lazy(() => import("@/components/modules/tools/TrafficCameras").then(m => ({ default: m.TrafficCameras })))
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
const ComplianceMapView = lazy(() => import("@/components/compliance/ComplianceMapView").then(m => ({ default: m.ComplianceMapView })))
const ComplianceDashboard = lazy(() => import("@/components/compliance/ComplianceDashboard").then(m => ({ default: m.ComplianceDashboard })))

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

// DRIVER MODULES
const DriverPerformance = lazy(() => import("@/components/modules/drivers/DriverPerformance").then(m => ({ default: m.DriverPerformance })))
const DriverScorecard = lazy(() => import("@/components/modules/drivers/DriverScorecard").then(m => ({ default: m.DriverScorecard })))
const DriversDashboard = lazy(() => import("@/components/drivers/DriversDashboard").then(m => ({ default: m.DriversDashboard })))

// WORKSPACE MODULES (Phase 1 UX Consolidation)
const OperationsWorkspace = lazy(() => import("@/components/workspaces/OperationsWorkspace").then(m => ({ default: m.OperationsWorkspace })))
const FleetWorkspace = lazy(() => import("@/components/workspaces/FleetWorkspace").then(m => ({ default: m.FleetWorkspace })))
const MaintenanceWorkspace = lazy(() => import("@/components/workspaces/MaintenanceWorkspace").then(m => ({ default: m.MaintenanceWorkspace })))
const AnalyticsWorkspace = lazy(() => import("@/components/workspaces/AnalyticsWorkspace").then(m => ({ default: m.AnalyticsWorkspace })))
const ComplianceWorkspace = lazy(() => import("@/components/workspaces/ComplianceWorkspace").then(m => ({ default: m.ComplianceWorkspace })))
const DriversWorkspace = lazy(() => import("@/components/workspaces/DriversWorkspace").then(m => ({ default: m.DriversWorkspace })))

// HUB MODULES (Phase 2-3 Map-First UX Transformation)
const ReportsHub = lazy(() => import("@/components/hubs/reports/ReportsHub").then(m => ({ default: m.ReportsHub })))
const OperationsHub = lazy(() => import("@/components/hubs/operations/OperationsHub").then(m => ({ default: m.OperationsHub })))
const MaintenanceHub = lazy(() => import("@/components/hubs/maintenance/MaintenanceHub").then(m => ({ default: m.MaintenanceHub })))
const ProcurementHub = lazy(() => import("@/components/hubs/procurement/ProcurementHub").then(m => ({ default: m.ProcurementHub })))
const CommunicationHub = lazy(() => import("@/components/hubs/communication/CommunicationHub").then(m => ({ default: m.CommunicationHub })))
const SafetyHub = lazy(() => import("@/components/hubs/safety/SafetyHub").then(m => ({ default: m.SafetyHub })))
const AssetsHub = lazy(() => import("@/components/hubs/assets/AssetsHub").then(m => ({ default: m.AssetsHub })))

// PAGES
const SettingsPage = lazy(() => import("@/pages/SettingsPage"))
const ProfilePage = lazy(() => import("@/pages/ProfilePage"))

// Loading spinner component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading module...</p>
    </div>
  </div>
)

function App() {
  const [activeModule, setActiveModule] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [reactPlugin] = useState(() => telemetryService.initialize())

  const fleetData = useFleetData()
  // Use facilities from fleetData (which includes demo data fallback)
  const facilities = fleetData.facilities || []

  useEffect(() => {
    fleetData.initializeData()
  }, [fleetData.initializeData])

  // Initialize telemetry tracking
  useEffect(() => {
    // Track initial page view
    telemetryService.trackPageView('Application Loaded')

    // Track performance metrics after page load
    const perfTimer = setTimeout(() => {
      telemetryService.trackPerformance()
    }, 2000)

    // Track route changes
    const handleRouteChange = () => {
      telemetryService.trackPageView(window.location.pathname)
    }

    window.addEventListener('popstate', handleRouteChange)

    return () => {
      clearTimeout(perfTimer)
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  // Track module changes
  useEffect(() => {
    if (activeModule) {
      telemetryService.trackEvent('ModuleChanged', {
        module: activeModule,
        previousModule: window.sessionStorage.getItem('previousModule') || 'none'
      })
      window.sessionStorage.setItem('previousModule', activeModule)
    }
  }, [activeModule])

  const renderModule = () => {
    switch (activeModule) {
      case "live-fleet-dashboard":
        return <LiveFleetDashboard />
      case "dashboard":
        return <FleetDashboardModern />
      case "executive-dashboard":
        return <ExecutiveDashboard />
      case "admin-dashboard":
        return <AdminDashboard />
      case "operations-workspace":
        return <OperationsWorkspace data={fleetData} />
      case "fleet-workspace":
        return <FleetWorkspace data={fleetData} />
      case "maintenance-workspace":
        return <MaintenanceWorkspace data={fleetData} />
      case "analytics-workspace":
        return <AnalyticsWorkspace data={fleetData} />
      case "compliance-workspace":
        return <ComplianceWorkspace data={fleetData} />
      case "drivers-workspace":
        return <DriversWorkspace data={fleetData} />
      case "reports-hub":
        return <ReportsHub data={fleetData} />
      case "operations-hub":
        return <OperationsHub />
      case "procurement-hub":
        return <ProcurementHub />
      case "communication-hub":
        return <CommunicationHub />
      case "dispatch-console":
        return <DispatchConsole />
      case "people":
        return <PeopleManagement data={fleetData} />
      case "garage":
        return <GarageService data={fleetData} />
      case "virtual-garage":
        return <VirtualGarage data={fleetData} />
      case "predictive":
        return <PredictiveMaintenance data={fleetData} />
      case "fuel":
        return <FuelManagement data={fleetData} />
      case "gps-tracking":
        return <GPSTracking vehicles={fleetData.vehicles || []} facilities={facilities} />
      case "workbench":
        return <DataWorkbench data={fleetData} />
      case "mileage":
        return <MileageReimbursement data={fleetData} />
      case "routes":
        return <RouteManagement data={fleetData} />
      case "gis-map":
        return <GISCommandCenter data={fleetData} />
      case "traffic-cameras":
        return <TrafficCameras />
      case "comprehensive":
        return <FleetAnalytics data={fleetData} />
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
        return <GeofenceManagement />
      case "osha-forms":
        return <OSHAForms />
      case "policy-engine":
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
        return <DriverPerformance data={fleetData} />
      case "driver-scorecard":
        return <DriverScorecard />
      case "drivers":
        return <DriversDashboard data={fleetData} />
      case "fleet-optimizer":
        return <FleetOptimizer />
      case "cost-analysis":
        return <CostAnalysisCenter />
      case "maintenance-hub":
        return <MaintenanceHub />
      case "custom-reports":
        return <CustomReportBuilder />
      case "analytics":
        return <AnalyticsDashboard />
      case "maintenance-request":
        return <MaintenanceRequest data={fleetData} />
      case "safety-hub":
        return <SafetyHub />
      case "assets-hub":
        return <AssetsHub />
      case "settings":
        return <SettingsPage />
      case "profile":
        return <ProfilePage />
      default:
        return <FleetDashboardModern />
    }
  }

  const groupedNav = useMemo(() => {
    const groups: Record<string, typeof navigationItems> = {
      main: [],
      management: [],
      procurement: [],
      communication: [],
      tools: [],
      hubs: []
    }
    
    navigationItems.forEach(item => {
      const section = item.section || "main"
      groups[section].push(item)
    })
    
    return groups
  }, [])

  return (
    <DrilldownManager>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div className="min-h-screen bg-background flex">
      <aside 
        className={`fixed left-0 top-0 h-full bg-card border-r transition-all duration-300 z-50 ${
          sidebarOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        <div className="p-6 flex items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <img
              src="/logos/logo-horizontal.svg"
              alt="Fleet Management"
              className="h-8 w-auto"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-4 space-y-6">
            {Object.entries(groupedNav).map(([section, items]) => {
              if (items.length === 0) return null
              
              return (
                <div key={section}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                    {section}
                  </p>
                  <div className="space-y-1">
                    {items.map(item => (
                      <Button
                        key={item.id}
                        variant={activeModule === item.id ? "secondary" : "ghost"}
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          telemetryService.trackButtonClick(`nav-${item.id}`, {
                            category: item.category,
                            label: item.label
                          })
                          setActiveModule(item.id)
                        }}
                      >
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
            <span className="text-sm">Collapse</span>
          </Button>
        </div>
      </aside>

      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <header className="border-b bg-card sticky top-0 z-40">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                <List className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="font-semibold">
                  {navigationItems.find(item => item.id === activeModule)?.label || "Dashboard"}
                </h2>
                <p className="text-xs text-muted-foreground">Fleet Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  telemetryService.trackButtonClick('nav-settings', { source: 'header' })
                  setActiveModule('settings')
                }}
                title="Settings"
              >
                <Gear className="w-5 h-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        FM
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Gear className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <SignOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main id="main-content" className="p-6">
          <EnhancedErrorBoundary
            showDetails={import.meta.env.DEV}
            onError={(error, errorInfo) => {
              console.error('App Error Boundary:', error, errorInfo);
            }}
          >
            <QueryErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                {renderModule()}
              </Suspense>
            </QueryErrorBoundary>
          </EnhancedErrorBoundary>
        </main>
      </div>

      {/* Role Switcher FAB button */}
      <RoleSwitcher />

      {/* Toast notifications */}
      <ToastContainer />
        </div>
    </DrilldownManager>
  )
}

// Export with Application Insights tracking if available
const reactPlugin = telemetryService.getReactPlugin()
export default reactPlugin ? withAITracking(reactPlugin, App) : App
