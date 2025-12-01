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
const FleetDashboard = lazy(() => import("@/components/modules/FleetDashboard").then(m => ({ default: m.FleetDashboard })))
const FleetDashboardModern = lazy(() => import("@/components/modules/FleetDashboardModern").then(m => ({ default: m.FleetDashboardModern })))
const ExecutiveDashboard = lazy(() => import("@/components/modules/ExecutiveDashboard").then(m => ({ default: m.ExecutiveDashboard })))
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"))
const PeopleManagement = lazy(() => import("@/components/modules/PeopleManagement").then(m => ({ default: m.PeopleManagement })))
const GarageService = lazy(() => import("@/components/modules/GarageService").then(m => ({ default: m.GarageService })))
const PredictiveMaintenance = lazy(() => import("@/components/modules/PredictiveMaintenance").then(m => ({ default: m.PredictiveMaintenance })))
const FuelManagement = lazy(() => import("@/components/modules/FuelManagement").then(m => ({ default: m.FuelManagement })))
const GPSTracking = lazy(() => import("@/components/modules/GPSTracking").then(m => ({ default: m.GPSTracking })))
const DataWorkbench = lazy(() => import("@/components/modules/DataWorkbench").then(m => ({ default: m.DataWorkbench })))
const MileageReimbursement = lazy(() => import("@/components/modules/MileageReimbursement").then(m => ({ default: m.MileageReimbursement })))
const RouteManagement = lazy(() => import("@/components/modules/RouteManagement").then(m => ({ default: m.RouteManagement })))
const GISCommandCenter = lazy(() => import("@/components/modules/GISCommandCenter").then(m => ({ default: m.GISCommandCenter })))
const TrafficCameras = lazy(() => import("@/components/modules/TrafficCameras").then(m => ({ default: m.TrafficCameras })))
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
const FuelPurchasing = lazy(() => import("@/components/modules/FuelPurchasing").then(m => ({ default: m.FuelPurchasing })))
const EndpointMonitor = lazy(() => import("@/components/modules/EndpointMonitor").then(m => ({ default: m.EndpointMonitor })))
const SettingsPage = lazy(() => import("@/pages/SettingsPage"))
const ProfilePage = lazy(() => import("@/pages/ProfilePage"))

// Loading spinner component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">Loading module...</p>
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
      case "dashboard":
        return <FleetDashboard data={fleetData} />
      case "executive-dashboard":
        return <ExecutiveDashboard />
      case "admin-dashboard":
        return <AdminDashboard />
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
      case "settings":
        return <SettingsPage />
      case "profile":
        return <ProfilePage />
      default:
        return <FleetDashboardModern data={fleetData} />
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

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex">
      {/* Glass-morphism sidebar with backdrop blur */}
      <aside
        className={`fixed left-0 top-0 h-full bg-card/95 backdrop-blur-xl border-r border-border/50 shadow-2xl shadow-primary/5 transition-all duration-300 ease-in-out z-50 ${
          sidebarOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        {/* Logo header with refined spacing */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <img
              src="/logos/logo-horizontal.svg"
              alt="Fleet Management"
              className="h-8 w-auto transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>

        {/* Scrollable navigation area */}
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="px-3 py-4 space-y-6">
            {Object.entries(groupedNav).map(([section, items]) => {
              if (items.length === 0) return null

              return (
                <div key={section} className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-3">
                    {section}
                  </p>
                  <div className="space-y-0.5">
                    {items.map(item => (
                      <Button
                        key={item.id}
                        variant={activeModule === item.id ? "secondary" : "ghost"}
                        className={`w-full justify-start gap-3 px-3 py-2 h-auto transition-all duration-300 ${
                          activeModule === item.id
                            ? "bg-primary/10 text-primary font-medium shadow-sm shadow-primary/10 hover:bg-primary/15"
                            : "hover:bg-accent/50 hover:shadow-sm hover:translate-x-0.5"
                        }`}
                        onClick={() => {
                          telemetryService.trackButtonClick(`nav-${item.id}`, {
                            category: item.category,
                            label: item.label
                          })
                          setActiveModule(item.id)
                        }}
                      >
                        <span className={`transition-transform duration-300 ${
                          activeModule === item.id ? "scale-110" : ""
                        }`}>
                          {item.icon}
                        </span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        {/* Collapse button with refined styling */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-4 border-t border-border/50 bg-gradient-to-t from-card via-card to-transparent backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 px-3 py-2 hover:bg-accent/50 transition-all duration-300 hover:translate-x-0.5"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">Collapse</span>
          </Button>
        </div>
      </aside>

      {/* Main content area with smooth transitions */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* Modern header with glass-morphism and refined spacing */}
        <header className="border-b border-border/50 bg-card/80 backdrop-blur-lg sticky top-0 z-40 shadow-sm">
          <div className="px-6 h-16 flex items-center justify-between">
            {/* Left section: Menu toggle and page title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                className="hover:bg-accent/50 transition-all duration-300 hover:scale-105"
              >
                <List className="w-5 h-5" />
              </Button>
              <div className="hidden sm:block">
                <h2 className="text-base font-semibold text-foreground leading-tight">
                  {navigationItems.find(item => item.id === activeModule)?.label || "Dashboard"}
                </h2>
                <p className="text-xs text-muted-foreground font-medium">Fleet Management System</p>
              </div>
            </div>

            {/* Right section: Actions and user menu */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* Notification bell with pulse animation */}
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-accent/50 transition-all duration-300 hover:scale-105"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
              </Button>

              {/* Settings button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  telemetryService.trackButtonClick('nav-settings', { source: 'header' })
                  setActiveModule('settings')
                }}
                title="Settings"
                className="hover:bg-accent/50 transition-all duration-300 hover:scale-105"
              >
                <Gear className="w-5 h-5" />
              </Button>

              {/* User profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all duration-300 hover:scale-105"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-sm">
                        FM
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 shadow-lg">
                  <DropdownMenuItem className="cursor-pointer transition-colors duration-200">
                    <Gear className="w-4 h-4 mr-3" />
                    <span className="font-medium">Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive transition-colors duration-200">
                    <SignOut className="w-4 h-4 mr-3" />
                    <span className="font-medium">Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main content area with fade-in transitions */}
        <main id="main-content" className="p-4 sm:p-6 lg:p-8">
          <EnhancedErrorBoundary
            showDetails={import.meta.env.DEV}
            onError={(error, errorInfo) => {
              console.error('App Error Boundary:', error, errorInfo);
            }}
          >
            <QueryErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <div className="animate-in fade-in duration-500">
                  {renderModule()}
                </div>
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
