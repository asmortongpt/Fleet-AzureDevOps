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
  CarProfile,
  MagnifyingGlass,
  Broadcast
} from "@phosphor-icons/react"
import { EntityLinkingProvider } from "@/contexts/EntityLinkingContext"
import { UniversalSearch, SearchTrigger, useGlobalSearch } from "@/components/UniversalSearch"
import { RealTimeEventHub, EventBadge } from "@/components/RealTimeEventHub"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { navigationItems } from "@/lib/navigation"
import { RoleSwitcher } from "@/components/demo/RoleSwitcher"
import { ToastContainer } from "@/components/common/ToastContainer"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { ModuleWrapper } from "@/components/common/ModuleWrapper"
import { ThemeToggle } from "@/components/ThemeToggle"
import { DrilldownManager } from "@/components/DrilldownManager"
import { useFleetData } from "@/hooks/use-fleet-data"
import { ModuleLoadingSpinner } from "@/components/common/ModuleLoadingSpinner"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

// ============================================================================
// LAZY LOADED MODULES - Performance Optimization
// Each module is loaded only when needed, reducing initial bundle size
// ============================================================================

// Fleet Operations
const FleetDashboard = lazy(() => import("@/components/modules/FleetDashboard"))
const GPSTracking = lazy(() => import("@/components/modules/GPSTracking"))
const VehicleTelemetry = lazy(() => import("@/components/modules/VehicleTelemetry"))
const DispatchConsole = lazy(() => import("@/components/DispatchConsole"))

// Maintenance
const GarageService = lazy(() => import("@/components/modules/GarageService"))
const VirtualGarage = lazy(() => import("@/components/modules/VirtualGarage"))
const PredictiveMaintenance = lazy(() => import("@/components/modules/PredictiveMaintenance"))
const MaintenanceRequest = lazy(() => import("@/components/modules/MaintenanceRequest"))
const MaintenanceScheduling = lazy(() => import("@/components/modules/MaintenanceScheduling"))

// People & Drivers
const PeopleManagement = lazy(() => import("@/components/modules/PeopleManagement"))
const DriverPerformance = lazy(() => import("@/components/modules/DriverPerformance"))
const DriverScorecard = lazy(() => import("@/components/modules/DriverScorecard"))

// Financial
const FuelManagement = lazy(() => import("@/components/modules/FuelManagement"))
const FuelPurchasing = lazy(() => import("@/components/modules/FuelPurchasing"))
const MileageReimbursement = lazy(() => import("@/components/modules/MileageReimbursement"))
const ReceiptProcessing = lazy(() => import("@/components/modules/ReceiptProcessing"))
const Invoices = lazy(() => import("@/components/modules/Invoices"))
const PurchaseOrders = lazy(() => import("@/components/modules/PurchaseOrders"))
const CostAnalysisCenter = lazy(() => import("@/components/modules/CostAnalysisCenter"))

// Procurement
const VendorManagement = lazy(() => import("@/components/modules/VendorManagement"))
const PartsInventory = lazy(() => import("@/components/modules/PartsInventory"))

// Communication
const TeamsIntegration = lazy(() => import("@/components/modules/TeamsIntegration"))
const EmailCenter = lazy(() => import("@/components/modules/EmailCenter"))
const CommunicationLog = lazy(() => import("@/components/modules/CommunicationLog"))

// Analytics & Reports
const FleetAnalytics = lazy(() => import("@/components/modules/FleetAnalytics"))
const FleetOptimizer = lazy(() => import("@/components/modules/FleetOptimizer"))
const ExecutiveDashboard = lazy(() => import("@/components/modules/ExecutiveDashboard"))
const CustomReportBuilder = lazy(() => import("@/components/modules/CustomReportBuilder"))

// Maps & Routes
const GISCommandCenter = lazy(() => import("@/components/modules/GISCommandCenter"))
const RouteManagement = lazy(() => import("@/components/modules/RouteManagement"))
const GeofenceManagement = lazy(() => import("@/components/modules/GeofenceManagement"))
const TrafficCameras = lazy(() => import("@/components/modules/TrafficCameras"))
const EnhancedMapLayers = lazy(() => import("@/components/modules/EnhancedMapLayers"))
const AdvancedRouteOptimization = lazy(() => import("@/components/modules/AdvancedRouteOptimization"))
const ArcGISIntegration = lazy(() => import("@/components/modules/ArcGISIntegration"))
const MapSettings = lazy(() => import("@/components/modules/MapSettings"))

// AI & Automation
const AIAssistant = lazy(() => import("@/components/modules/AIAssistant"))
const DataWorkbench = lazy(() => import("@/components/modules/DataWorkbench"))
const DocumentQA = lazy(() => import("@/components/modules/DocumentQA"))

// Safety & Compliance
const OSHAForms = lazy(() => import("@/components/modules/OSHAForms"))
const PolicyEngineWorkbench = lazy(() => import("@/components/modules/PolicyEngineWorkbench"))
const VideoTelematics = lazy(() => import("@/components/modules/VideoTelematics"))
const IncidentManagement = lazy(() => import("@/components/modules/IncidentManagement"))

// Assets & Equipment
const AssetManagement = lazy(() => import("@/components/modules/AssetManagement"))
const EquipmentDashboard = lazy(() => import("@/components/modules/EquipmentDashboard"))

// EV & Sustainability
const EVChargingManagement = lazy(() => import("@/components/modules/EVChargingManagement"))

// Personal Use
const PersonalUseDashboard = lazy(() => import("@/components/modules/PersonalUseDashboard"))
const PersonalUsePolicyConfig = lazy(() => import("@/components/modules/PersonalUsePolicyConfig"))
const ReimbursementQueue = lazy(() => import("@/pages/PersonalUse/ReimbursementQueue"))
const ChargesAndBilling = lazy(() => import("@/pages/PersonalUse/ChargesAndBilling"))

// Admin & Configuration
const DocumentManagement = lazy(() => import("@/components/modules/DocumentManagement"))
const CustomFormBuilder = lazy(() => import("@/components/modules/CustomFormBuilder"))
const TaskManagement = lazy(() => import("@/components/modules/TaskManagement"))
const Notifications = lazy(() => import("@/components/modules/Notifications"))
const PushNotificationAdmin = lazy(() => import("@/components/modules/PushNotificationAdmin"))

function App() {
  const [activeModule, setActiveModule] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { isOpen: searchOpen, setIsOpen: setSearchOpen} = useGlobalSearch()
  const [isMobile, setIsMobile] = useState(false)

  const fleetData = useFleetData()
  const facilities = fleetData.facilities || []

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // Auto-close sidebar on mobile by default
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fleetData.initializeData()
  }, [fleetData.initializeData])

  // Keyboard shortcuts for navigation
  useKeyboardShortcuts([
    {
      key: 'k',
      meta: true,
      callback: () => setSearchOpen(true),
      description: 'Open search'
    },
    {
      key: 'b',
      meta: true,
      callback: () => setSidebarOpen(!sidebarOpen),
      description: 'Toggle sidebar'
    },
    {
      key: 'Escape',
      callback: () => {
        if (searchOpen) setSearchOpen(false)
      },
      description: 'Close search'
    },
    {
      key: '1',
      meta: true,
      callback: () => setActiveModule('dashboard'),
      description: 'Go to dashboard'
    },
    {
      key: '2',
      meta: true,
      callback: () => setActiveModule('gps-tracking'),
      description: 'Go to GPS tracking'
    },
    {
      key: '3',
      meta: true,
      callback: () => setActiveModule('people'),
      description: 'Go to people management'
    },
    {
      key: '4',
      meta: true,
      callback: () => setActiveModule('garage'),
      description: 'Go to maintenance'
    },
    {
      key: '5',
      meta: true,
      callback: () => setActiveModule('fuel'),
      description: 'Go to fuel management'
    }
  ])

  const renderModule = () => {
    // Wrap each module in Suspense for lazy loading
    const wrapModule = (Component: React.ComponentType<any>, props: any = {}, skeletonType: string = "default") => (
      <ErrorBoundary>
        <Suspense fallback={<ModuleLoadingSpinner />}>
          <ModuleWrapper moduleName={Component.name} skeletonType={skeletonType}>
            <Component {...props} />
          </ModuleWrapper>
        </Suspense>
      </ErrorBoundary>
    )

    switch (activeModule) {
      case "dashboard":
        return wrapModule(FleetDashboard, { data: fleetData }, "dashboard")
      case "executive-dashboard":
        return wrapModule(ExecutiveDashboard, {}, "dashboard")
      case "dispatch-console":
        return wrapModule(GPSTracking, { vehicles: fleetData.vehicles || [], facilities }, "dashboard")
      case "people":
        return wrapModule(PeopleManagement, { data: fleetData }, "table")
      case "garage":
        return wrapModule(GarageService, { data: fleetData }, "cards")
      case "virtual-garage":
        return wrapModule(VirtualGarage, { data: fleetData }, "cards")
      case "predictive":
        return wrapModule(PredictiveMaintenance, { data: fleetData }, "dashboard")
      case "fuel":
        return wrapModule(FuelManagement, { data: fleetData }, "table")
      case "gps-tracking":
        return wrapModule(GPSTracking, { vehicles: fleetData.vehicles || [], facilities }, "dashboard")
      case "workbench":
        return wrapModule(DataWorkbench, { data: fleetData }, "table")
      case "mileage":
        return wrapModule(MileageReimbursement, { data: fleetData }, "table")
      case "maintenance-request":
        return wrapModule(MaintenanceRequest, { data: fleetData }, "form")
      case "routes":
        return wrapModule(RouteManagement, { data: fleetData }, "dashboard")
      case "gis-map":
        return wrapModule(GISCommandCenter, { data: fleetData }, "dashboard")
      case "traffic-cameras":
        return wrapModule(TrafficCameras, {}, "cards")
      case "driver-mgmt":
        return wrapModule(DriverPerformance, { data: fleetData }, "table")
      case "comprehensive":
        return wrapModule(FleetAnalytics, { data: fleetData }, "chart")
      case "vendor-management":
        return wrapModule(VendorManagement, {}, "table")
      case "parts-inventory":
        return wrapModule(PartsInventory, {}, "table")
      case "purchase-orders":
        return wrapModule(PurchaseOrders, {}, "table")
      case "invoices":
        return wrapModule(Invoices, {}, "table")
      case "ai-assistant":
        return wrapModule(AIAssistant, {}, "default")
      case "teams-integration":
        return wrapModule(TeamsIntegration, {}, "default")
      case "email-center":
        return wrapModule(EmailCenter, {}, "table")
      case "maintenance-scheduling":
        return wrapModule(MaintenanceScheduling, {}, "table")
      case "receipt-processing":
        return wrapModule(ReceiptProcessing, {}, "form")
      case "communication-log":
        return wrapModule(CommunicationLog, {}, "table")
      case "geofences":
        return wrapModule(GeofenceManagement, {}, "dashboard")
      case "osha-forms":
        return wrapModule(OSHAForms, {}, "form")
      case "policy-engine":
        return wrapModule(PolicyEngineWorkbench, {}, "form")
      case "video-telematics":
        return wrapModule(VideoTelematics, {}, "cards")
      case "ev-charging":
        return wrapModule(EVChargingManagement, {}, "dashboard")
      case "vehicle-telemetry":
        return wrapModule(VehicleTelemetry, {}, "chart")
      case "map-layers":
        return wrapModule(EnhancedMapLayers, {}, "dashboard")
      case "route-optimization":
        return wrapModule(AdvancedRouteOptimization, {}, "dashboard")
      case "form-builder":
        return wrapModule(CustomFormBuilder, {}, "form")
      case "personal-use":
        return wrapModule(PersonalUseDashboard, {}, "dashboard")
      case "personal-use-policy":
        return wrapModule(PersonalUsePolicyConfig, {}, "form")
      case "reimbursement-queue":
        return wrapModule(ReimbursementQueue, {}, "table")
      case "charges-billing":
        return wrapModule(ChargesAndBilling, {}, "table")
      case "arcgis-integration":
        return wrapModule(ArcGISIntegration, {}, "dashboard")
      case "map-settings":
        return wrapModule(MapSettings, {}, "form")
      case "asset-management":
        return wrapModule(AssetManagement, {}, "table")
      case "equipment-dashboard":
        return wrapModule(EquipmentDashboard, {}, "dashboard")
      case "task-management":
        return wrapModule(TaskManagement, {}, "table")
      case "incident-management":
        return wrapModule(IncidentManagement, {}, "table")
      case "notifications":
        return wrapModule(Notifications, {}, "default")
      case "push-notifications":
        return wrapModule(PushNotificationAdmin, {}, "default")
      case "document-management":
        return wrapModule(DocumentManagement, {}, "table")
      case "document-qa":
        return wrapModule(DocumentQA, {}, "default")
      case "driver-scorecard":
        return wrapModule(DriverScorecard, {}, "table")
      case "fleet-optimizer":
        return wrapModule(FleetOptimizer, {}, "dashboard")
      case "cost-analysis":
        return wrapModule(CostAnalysisCenter, {}, "dashboard")
      case "fuel-purchasing":
        return wrapModule(FuelPurchasing, {}, "table")
      case "custom-reports":
        return wrapModule(CustomReportBuilder, {}, "form")
      default:
        return wrapModule(FleetDashboard, { data: fleetData }, "dashboard")
    }
  }

  // Group navigation items by category
  const groupedNavigation = useMemo(() => {
    const groups: Record<string, typeof navigationItems> = {
      'Fleet Operations': [],
      'Maintenance': [],
      'People & Drivers': [],
      'Financial': [],
      'Communication': [],
      'Analytics': [],
      'Maps & Routes': [],
      'AI & Automation': [],
      'Admin': [],
    }

    // Categorize navigation items
    navigationItems.forEach(item => {
      if (['dashboard', 'executive-dashboard', 'dispatch-console', 'gps-tracking', 'vehicle-telemetry'].includes(item.id)) {
        groups['Fleet Operations'].push(item)
      } else if (['garage', 'virtual-garage', 'predictive', 'maintenance-request', 'maintenance-scheduling'].includes(item.id)) {
        groups['Maintenance'].push(item)
      } else if (['people', 'driver-mgmt', 'driver-scorecard'].includes(item.id)) {
        groups['People & Drivers'].push(item)
      } else if (['fuel', 'fuel-purchasing', 'mileage', 'receipt-processing', 'invoices', 'purchase-orders', 'cost-analysis'].includes(item.id)) {
        groups['Financial'].push(item)
      } else if (['teams-integration', 'email-center', 'communication-log'].includes(item.id)) {
        groups['Communication'].push(item)
      } else if (['comprehensive', 'fleet-optimizer', 'custom-reports'].includes(item.id)) {
        groups['Analytics'].push(item)
      } else if (['gis-map', 'routes', 'geofences', 'traffic-cameras', 'map-layers', 'route-optimization', 'arcgis-integration', 'map-settings'].includes(item.id)) {
        groups['Maps & Routes'].push(item)
      } else if (['ai-assistant', 'workbench', 'document-qa'].includes(item.id)) {
        groups['AI & Automation'].push(item)
      } else {
        groups['Admin'].push(item)
      }
    })

    return groups
  }, [])

  return (
    <EntityLinkingProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Mobile Overlay Background */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Overlay on mobile, side-by-side on desktop */}
        <div className={`
          ${isMobile ? 'fixed left-0 top-0 h-full z-50' : 'relative'}
          ${sidebarOpen ? "w-64" : "w-0"}
          transition-all duration-300 bg-card border-r flex flex-col overflow-hidden
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        `}>
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CarProfile size={32} weight="bold" className="text-primary" />
              <h1 className="font-bold text-lg">Fleet Manager</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {Object.entries(groupedNavigation).map(([category, items]) => {
                if (items.length === 0) return null
                return (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {category}
                    </h3>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <Button
                          key={item.id}
                          variant={activeModule === item.id ? "secondary" : "ghost"}
                          className="w-full justify-start gap-2"
                          onClick={() => {
                            setActiveModule(item.id)
                            // Auto-close sidebar on mobile after selection
                            if (isMobile) {
                              setSidebarOpen(false)
                            }
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
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header - Mobile optimized with larger touch targets */}
          <div className="border-b bg-card">
            <div className="flex items-center justify-between p-3 md:p-4">
              <div className="flex items-center gap-2">
                {!sidebarOpen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                    className={isMobile ? 'h-10 w-10' : ''}
                  >
                    <List size={isMobile ? 24 : 20} />
                  </Button>
                )}
                <SearchTrigger onOpen={() => setSearchOpen(true)} />
              </div>

              <div className="flex items-center gap-1 md:gap-2">
                {/* Hide some buttons on very small screens */}
                <div className="hidden sm:flex items-center gap-1 md:gap-2">
                  <ThemeToggle />
                  <RoleSwitcher />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`relative ${isMobile ? 'h-10 w-10' : ''}`}
                    >
                      <Bell size={isMobile ? 24 : 20} />
                      <EventBadge />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className={isMobile ? "w-[calc(100vw-2rem)]" : "w-[400px]"}
                  >
                    <RealTimeEventHub />
                  </PopoverContent>
                </Popover>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={isMobile ? 'h-10 w-10' : ''}
                    >
                      <Avatar className={isMobile ? "h-9 w-9" : "h-8 w-8"}>
                        <AvatarFallback>AM</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={isMobile ? "w-48" : ""}>
                    {/* Show hidden options on mobile */}
                    {isMobile && (
                      <>
                        <DropdownMenuItem className="sm:hidden">
                          <Gear size={16} className="mr-2" />
                          Theme
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="sm:hidden" />
                      </>
                    )}
                    <DropdownMenuItem>
                      <Gear size={16} className="mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <SignOut size={16} className="mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Module Content */}
          <div className="flex-1 overflow-auto">
            {renderModule()}
          </div>
        </div>

        {/* Universal Search */}
        <UniversalSearch
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
        />

        {/* Drilldown Manager */}
        <DrilldownManager />

        {/* Toast Notifications */}
        <ToastContainer />
      </div>
    </EntityLinkingProvider>
  )
}

export default App
