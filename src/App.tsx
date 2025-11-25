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
import { ThemeToggle } from "@/components/ThemeToggle"
import { DrilldownManager } from "@/components/DrilldownManager"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useFacilities } from "@/hooks/use-api"

// Lazy load all modules for code splitting - reduces initial bundle by 80%+
const FleetDashboard = lazy(() => import("@/components/modules/FleetDashboard").then(m => ({ default: m.FleetDashboard })))
const ExecutiveDashboard = lazy(() => import("@/components/modules/ExecutiveDashboard").then(m => ({ default: m.ExecutiveDashboard })))
const PeopleManagement = lazy(() => import("@/components/modules/PeopleManagement").then(m => ({ default: m.PeopleManagement })))
const GarageService = lazy(() => import("@/components/modules/GarageService").then(m => ({ default: m.GarageService })))
const PredictiveMaintenance = lazy(() => import("@/components/modules/PredictiveMaintenance").then(m => ({ default: m.PredictiveMaintenance })))
const FuelManagement = lazy(() => import("@/components/modules/FuelManagement").then(m => ({ default: m.FuelManagement })))
const GPSTracking = lazy(() => import("@/components/modules/GPSTracking").then(m => ({ default: m.GPSTracking })))
const DataWorkbench = lazy(() => import("@/components/modules/DataWorkbench").then(m => ({ default: m.DataWorkbench })))
const MileageReimbursement = lazy(() => import("@/components/modules/MileageReimbursement").then(m => ({ default: m.MileageReimbursement })))
const MaintenanceRequest = lazy(() => import("@/components/modules/MaintenanceRequest").then(m => ({ default: m.MaintenanceRequest })))
const RouteManagement = lazy(() => import("@/components/modules/RouteManagement").then(m => ({ default: m.RouteManagement })))
const GISCommandCenter = lazy(() => import("@/components/modules/GISCommandCenter").then(m => ({ default: m.GISCommandCenter })))
const TrafficCameras = lazy(() => import("@/components/modules/TrafficCameras").then(m => ({ default: m.TrafficCameras })))
const DriverPerformance = lazy(() => import("@/components/modules/DriverPerformance").then(m => ({ default: m.DriverPerformance })))
const FleetAnalytics = lazy(() => import("@/components/modules/FleetAnalytics").then(m => ({ default: m.FleetAnalytics })))
const VendorManagement = lazy(() => import("@/components/modules/VendorManagement").then(m => ({ default: m.VendorManagement })))
const PartsInventory = lazy(() => import("@/components/modules/PartsInventory").then(m => ({ default: m.PartsInventory })))
const PurchaseOrders = lazy(() => import("@/components/modules/PurchaseOrders").then(m => ({ default: m.PurchaseOrders })))
const Invoices = lazy(() => import("@/components/modules/Invoices").then(m => ({ default: m.Invoices })))
const TeamsIntegration = lazy(() => import("@/components/modules/TeamsIntegration").then(m => ({ default: m.TeamsIntegration })))
const EmailCenter = lazy(() => import("@/components/modules/EmailCenter").then(m => ({ default: m.EmailCenter })))
const MaintenanceScheduling = lazy(() => import("@/components/modules/MaintenanceScheduling").then(m => ({ default: m.MaintenanceScheduling })))
const ReceiptProcessing = lazy(() => import("@/components/modules/ReceiptProcessing").then(m => ({ default: m.ReceiptProcessing })))
const CommunicationLog = lazy(() => import("@/components/modules/CommunicationLog").then(m => ({ default: m.CommunicationLog })))
const GeofenceManagement = lazy(() => import("@/components/modules/GeofenceManagement").then(m => ({ default: m.GeofenceManagement })))
const OSHAForms = lazy(() => import("@/components/modules/OSHAForms").then(m => ({ default: m.OSHAForms })))
const PolicyEngineWorkbench = lazy(() => import("@/components/modules/PolicyEngineWorkbench").then(m => ({ default: m.PolicyEngineWorkbench })))
const VideoTelematics = lazy(() => import("@/components/modules/VideoTelematics").then(m => ({ default: m.VideoTelematics })))
const EVChargingManagement = lazy(() => import("@/components/modules/EVChargingManagement").then(m => ({ default: m.EVChargingManagement })))
const EnhancedMapLayers = lazy(() => import("@/components/modules/EnhancedMapLayers").then(m => ({ default: m.EnhancedMapLayers })))
const AdvancedRouteOptimization = lazy(() => import("@/components/modules/AdvancedRouteOptimization").then(m => ({ default: m.AdvancedRouteOptimization })))
const CustomFormBuilder = lazy(() => import("@/components/modules/CustomFormBuilder").then(m => ({ default: m.CustomFormBuilder })))
const VehicleTelemetry = lazy(() => import("@/components/modules/VehicleTelemetry").then(m => ({ default: m.VehicleTelemetry })))
const VirtualGarage = lazy(() => import("@/components/modules/VirtualGarage").then(m => ({ default: m.VirtualGarage })))
const PersonalUseDashboard = lazy(() => import("@/components/modules/PersonalUseDashboard").then(m => ({ default: m.PersonalUseDashboard })))
const PersonalUsePolicyConfig = lazy(() => import("@/components/modules/PersonalUsePolicyConfig").then(m => ({ default: m.PersonalUsePolicyConfig })))
const ReimbursementQueue = lazy(() => import("@/pages/PersonalUse/ReimbursementQueue").then(m => ({ default: m.ReimbursementQueue })))
const ChargesAndBilling = lazy(() => import("@/pages/PersonalUse/ChargesAndBilling").then(m => ({ default: m.ChargesAndBilling })))
const ArcGISIntegration = lazy(() => import("@/components/modules/ArcGISIntegration").then(m => ({ default: m.ArcGISIntegration })))
const MapSettings = lazy(() => import("@/components/modules/MapSettings").then(m => ({ default: m.MapSettings })))
const DispatchConsole = lazy(() => import("@/components/DispatchConsole"))
const AssetManagement = lazy(() => import("@/components/modules/AssetManagement").then(m => ({ default: m.AssetManagement })))
const EquipmentDashboard = lazy(() => import("@/components/modules/EquipmentDashboard").then(m => ({ default: m.EquipmentDashboard })))
const TaskManagement = lazy(() => import("@/components/modules/TaskManagement").then(m => ({ default: m.TaskManagement })))
const IncidentManagement = lazy(() => import("@/components/modules/IncidentManagement").then(m => ({ default: m.IncidentManagement })))
const Notifications = lazy(() => import("@/components/modules/Notifications").then(m => ({ default: m.Notifications })))
const PushNotificationAdmin = lazy(() => import("@/components/modules/PushNotificationAdmin"))
const DocumentManagement = lazy(() => import("@/components/modules/DocumentManagement").then(m => ({ default: m.DocumentManagement })))
const DocumentQA = lazy(() => import("@/components/modules/DocumentQA").then(m => ({ default: m.DocumentQA })))
const DriverScorecard = lazy(() => import("@/components/modules/DriverScorecard").then(m => ({ default: m.DriverScorecard })))
const FleetOptimizer = lazy(() => import("@/components/modules/FleetOptimizer").then(m => ({ default: m.FleetOptimizer })))
const CostAnalysisCenter = lazy(() => import("@/components/modules/CostAnalysisCenter").then(m => ({ default: m.CostAnalysisCenter })))
const FuelPurchasing = lazy(() => import("@/components/modules/FuelPurchasing").then(m => ({ default: m.FuelPurchasing })))
const CustomReportBuilder = lazy(() => import("@/components/modules/CustomReportBuilder").then(m => ({ default: m.CustomReportBuilder })))

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

  const fleetData = useFleetData()
  // Use facilities from fleetData (which includes demo data fallback)
  const facilities = fleetData.facilities || []

  useEffect(() => {
    fleetData.initializeData()
  }, [fleetData.initializeData])

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <FleetDashboard data={fleetData} />
      case "executive-dashboard":
        return <ExecutiveDashboard data={fleetData} />
      case "dispatch-console":
        // Dispatch console uses GPS tracking with different view
        return <GPSTracking vehicles={fleetData.vehicles || []} facilities={facilities} />
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
      case "maintenance-request":
        return <MaintenanceRequest data={fleetData} />
      case "routes":
        return <RouteManagement data={fleetData} />
      case "gis-map":
        return <GISCommandCenter data={fleetData} />
      case "traffic-cameras":
        return <TrafficCameras />
      case "driver-mgmt":
        return <DriverPerformance data={fleetData} />
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
        return <AssetManagement data={fleetData} />
      case "equipment-dashboard":
        return <EquipmentDashboard data={fleetData} />
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
      case "driver-scorecard":
        return <DriverScorecard />
      case "fleet-optimizer":
        return <FleetOptimizer />
      case "cost-analysis":
        return <CostAnalysisCenter />
      case "fuel-purchasing":
        return <FuelPurchasing />
      case "custom-reports":
        return <CustomReportBuilder />
      default:
        return <FleetDashboard data={fleetData} />
    }
  }

  const groupedNav = useMemo(() => {
    const groups: Record<string, typeof navigationItems> = {
      main: [],
      management: [],
      procurement: [],
      communication: [],
      tools: []
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
            <div className="p-2 bg-primary text-primary-foreground rounded-lg">
              <CarProfile className="w-6 h-6" weight="bold" />
            </div>
            <div>
              <h1 className="font-semibold tracking-tight">Fleet Manager</h1>
              <p className="text-xs text-muted-foreground">Enterprise</p>
            </div>
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
                        onClick={() => setActiveModule(item.id)}
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
              <Button variant="ghost" size="icon">
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
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              {renderModule()}
            </Suspense>
          </ErrorBoundary>
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

export default App
