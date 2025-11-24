import { useState, useMemo, useEffect } from "react"
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
import { FleetDashboard } from "@/components/modules/FleetDashboard"
import { PeopleManagement } from "@/components/modules/PeopleManagement"
import { GarageService } from "@/components/modules/GarageService"
import { PredictiveMaintenance } from "@/components/modules/PredictiveMaintenance"
import { FuelManagement } from "@/components/modules/FuelManagement"
import { GPSTracking } from "@/components/modules/GPSTracking"
import { DataWorkbench } from "@/components/modules/DataWorkbench"
import { MileageReimbursement } from "@/components/modules/MileageReimbursement"
import { MaintenanceRequest } from "@/components/modules/MaintenanceRequest"
import { RouteManagement } from "@/components/modules/RouteManagement"
import { GISCommandCenter } from "@/components/modules/GISCommandCenter"
import { TrafficCameras } from "@/components/modules/TrafficCameras"
import { DriverPerformance } from "@/components/modules/DriverPerformance"
import { FleetAnalytics } from "@/components/modules/FleetAnalytics"
import { VendorManagement } from "@/components/modules/VendorManagement"
import { PartsInventory } from "@/components/modules/PartsInventory"
import { PurchaseOrders } from "@/components/modules/PurchaseOrders"
import { Invoices } from "@/components/modules/Invoices"
import AIAssistant from "@/components/modules/AIAssistant"
import { TeamsIntegration } from "@/components/modules/TeamsIntegration"
import { EmailCenter } from "@/components/modules/EmailCenter"
import { MaintenanceScheduling } from "@/components/modules/MaintenanceScheduling"
import { ReceiptProcessing } from "@/components/modules/ReceiptProcessing"
import { CommunicationLog } from "@/components/modules/CommunicationLog"
import { GeofenceManagement } from "@/components/modules/GeofenceManagement"
import { OSHAForms } from "@/components/modules/OSHAForms"
import { PolicyEngineWorkbench } from "@/components/modules/PolicyEngineWorkbench"
import { VideoTelematics } from "@/components/modules/VideoTelematics"
import { EVChargingManagement } from "@/components/modules/EVChargingManagement"
import { EnhancedMapLayers } from "@/components/modules/EnhancedMapLayers"
import { AdvancedRouteOptimization } from "@/components/modules/AdvancedRouteOptimization"
import { CustomFormBuilder } from "@/components/modules/CustomFormBuilder"
import { VehicleTelemetry } from "@/components/modules/VehicleTelemetry"
import { VirtualGarage } from "@/components/modules/VirtualGarage"
import { PersonalUseDashboard } from "@/components/modules/PersonalUseDashboard"
import { PersonalUsePolicyConfig } from "@/components/modules/PersonalUsePolicyConfig"
import { ReimbursementQueue } from "@/pages/PersonalUse/ReimbursementQueue"
import { ChargesAndBilling } from "@/pages/PersonalUse/ChargesAndBilling"
import { ArcGISIntegration } from "@/components/modules/ArcGISIntegration"
import { MapSettings } from "@/components/modules/MapSettings"
import { ExecutiveDashboard } from "@/components/modules/ExecutiveDashboard"
import DispatchConsole from "@/components/DispatchConsole"
import { AssetManagement } from "@/components/modules/AssetManagement"
import { EquipmentDashboard } from "@/components/modules/EquipmentDashboard"
import { TaskManagement } from "@/components/modules/TaskManagement"
import { IncidentManagement } from "@/components/modules/IncidentManagement"
import { Notifications } from "@/components/modules/Notifications"
import PushNotificationAdmin from "@/components/modules/PushNotificationAdmin"
import { DocumentManagement } from "@/components/modules/DocumentManagement"
import { DocumentQA } from "@/components/modules/DocumentQA"
import { DriverScorecard } from "@/components/modules/DriverScorecard"
import { FleetOptimizer } from "@/components/modules/FleetOptimizer"
import { CostAnalysisCenter } from "@/components/modules/CostAnalysisCenter"
import { FuelPurchasing } from "@/components/modules/FuelPurchasing"
import { CustomReportBuilder } from "@/components/modules/CustomReportBuilder"
import { RoleSwitcher } from "@/components/demo/RoleSwitcher"
import { ToastContainer } from "@/components/common/ToastContainer"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { ModuleWrapper } from "@/components/common/ModuleWrapper"
import { ThemeToggle } from "@/components/ThemeToggle"
import { DrilldownManager } from "@/components/DrilldownManager"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useFacilities } from "@/hooks/use-api"

function App() {
  const [activeModule, setActiveModule] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { isOpen: searchOpen, setIsOpen: setSearchOpen } = useGlobalSearch()

  const fleetData = useFleetData()
  // Use facilities from fleetData (which includes demo data fallback)
  const facilities = fleetData.facilities || []

  useEffect(() => {
    fleetData.initializeData()
  }, [fleetData.initializeData])

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <ModuleWrapper moduleName="FleetDashboard" skeletonType="dashboard"><FleetDashboard data={fleetData} /></ModuleWrapper>
      case "executive-dashboard":
        return <ModuleWrapper moduleName="ExecutiveDashboard" skeletonType="dashboard"><ExecutiveDashboard /></ModuleWrapper>
      case "dispatch-console":
        return <ModuleWrapper moduleName="DispatchConsole" skeletonType="dashboard"><GPSTracking vehicles={fleetData.vehicles || []} facilities={facilities} /></ModuleWrapper>
      case "people":
        return <ModuleWrapper moduleName="PeopleManagement" skeletonType="table"><PeopleManagement data={fleetData} /></ModuleWrapper>
      case "garage":
        return <ModuleWrapper moduleName="GarageService" skeletonType="cards"><GarageService data={fleetData} /></ModuleWrapper>
      case "virtual-garage":
        return <ModuleWrapper moduleName="VirtualGarage" skeletonType="cards"><VirtualGarage data={fleetData} /></ModuleWrapper>
      case "predictive":
        return <ModuleWrapper moduleName="PredictiveMaintenance" skeletonType="dashboard"><PredictiveMaintenance data={fleetData} /></ModuleWrapper>
      case "fuel":
        return <ModuleWrapper moduleName="FuelManagement" skeletonType="table"><FuelManagement data={fleetData} /></ModuleWrapper>
      case "gps-tracking":
        return <ModuleWrapper moduleName="GPSTracking" skeletonType="dashboard"><GPSTracking vehicles={fleetData.vehicles || []} facilities={facilities} /></ModuleWrapper>
      case "workbench":
        return <ModuleWrapper moduleName="DataWorkbench" skeletonType="table"><DataWorkbench data={fleetData} /></ModuleWrapper>
      case "mileage":
        return <ModuleWrapper moduleName="MileageReimbursement" skeletonType="table"><MileageReimbursement data={fleetData} /></ModuleWrapper>
      case "maintenance-request":
        return <ModuleWrapper moduleName="MaintenanceRequest" skeletonType="form"><MaintenanceRequest data={fleetData} /></ModuleWrapper>
      case "routes":
        return <ModuleWrapper moduleName="RouteManagement" skeletonType="dashboard"><RouteManagement data={fleetData} /></ModuleWrapper>
      case "gis-map":
        return <ModuleWrapper moduleName="GISCommandCenter" skeletonType="dashboard"><GISCommandCenter data={fleetData} /></ModuleWrapper>
      case "traffic-cameras":
        return <ModuleWrapper moduleName="TrafficCameras" skeletonType="cards"><TrafficCameras /></ModuleWrapper>
      case "driver-mgmt":
        return <ModuleWrapper moduleName="DriverPerformance" skeletonType="table"><DriverPerformance data={fleetData} /></ModuleWrapper>
      case "comprehensive":
        return <ModuleWrapper moduleName="FleetAnalytics" skeletonType="chart"><FleetAnalytics data={fleetData} /></ModuleWrapper>
      case "vendor-management":
        return <ModuleWrapper moduleName="VendorManagement" skeletonType="table"><VendorManagement /></ModuleWrapper>
      case "parts-inventory":
        return <ModuleWrapper moduleName="PartsInventory" skeletonType="table"><PartsInventory /></ModuleWrapper>
      case "purchase-orders":
        return <ModuleWrapper moduleName="PurchaseOrders" skeletonType="table"><PurchaseOrders /></ModuleWrapper>
      case "invoices":
        return <ModuleWrapper moduleName="Invoices" skeletonType="table"><Invoices /></ModuleWrapper>
      case "ai-assistant":
        return <ModuleWrapper moduleName="AIAssistant" skeletonType="default"><AIAssistant /></ModuleWrapper>
      case "teams-integration":
        return <ModuleWrapper moduleName="TeamsIntegration" skeletonType="default"><TeamsIntegration /></ModuleWrapper>
      case "email-center":
        return <ModuleWrapper moduleName="EmailCenter" skeletonType="table"><EmailCenter /></ModuleWrapper>
      case "maintenance-scheduling":
        return <ModuleWrapper moduleName="MaintenanceScheduling" skeletonType="table"><MaintenanceScheduling /></ModuleWrapper>
      case "receipt-processing":
        return <ModuleWrapper moduleName="ReceiptProcessing" skeletonType="form"><ReceiptProcessing /></ModuleWrapper>
      case "communication-log":
        return <ModuleWrapper moduleName="CommunicationLog" skeletonType="table"><CommunicationLog /></ModuleWrapper>
      case "geofences":
        return <ModuleWrapper moduleName="GeofenceManagement" skeletonType="dashboard"><GeofenceManagement /></ModuleWrapper>
      case "osha-forms":
        return <ModuleWrapper moduleName="OSHAForms" skeletonType="form"><OSHAForms /></ModuleWrapper>
      case "policy-engine":
        return <ModuleWrapper moduleName="PolicyEngineWorkbench" skeletonType="form"><PolicyEngineWorkbench /></ModuleWrapper>
      case "video-telematics":
        return <ModuleWrapper moduleName="VideoTelematics" skeletonType="cards"><VideoTelematics /></ModuleWrapper>
      case "ev-charging":
        return <ModuleWrapper moduleName="EVChargingManagement" skeletonType="dashboard"><EVChargingManagement /></ModuleWrapper>
      case "vehicle-telemetry":
        return <ModuleWrapper moduleName="VehicleTelemetry" skeletonType="chart"><VehicleTelemetry /></ModuleWrapper>
      case "map-layers":
        return <ModuleWrapper moduleName="EnhancedMapLayers" skeletonType="dashboard"><EnhancedMapLayers /></ModuleWrapper>
      case "route-optimization":
        return <ModuleWrapper moduleName="AdvancedRouteOptimization" skeletonType="dashboard"><AdvancedRouteOptimization /></ModuleWrapper>
      case "form-builder":
        return <ModuleWrapper moduleName="CustomFormBuilder" skeletonType="form"><CustomFormBuilder /></ModuleWrapper>
      case "personal-use":
        return <ModuleWrapper moduleName="PersonalUseDashboard" skeletonType="dashboard"><PersonalUseDashboard /></ModuleWrapper>
      case "personal-use-policy":
        return <ModuleWrapper moduleName="PersonalUsePolicyConfig" skeletonType="form"><PersonalUsePolicyConfig /></ModuleWrapper>
      case "reimbursement-queue":
        return <ModuleWrapper moduleName="ReimbursementQueue" skeletonType="table"><ReimbursementQueue /></ModuleWrapper>
      case "charges-billing":
        return <ModuleWrapper moduleName="ChargesAndBilling" skeletonType="table"><ChargesAndBilling /></ModuleWrapper>
      case "arcgis-integration":
        return <ModuleWrapper moduleName="ArcGISIntegration" skeletonType="dashboard"><ArcGISIntegration /></ModuleWrapper>
      case "map-settings":
        return <ModuleWrapper moduleName="MapSettings" skeletonType="form"><MapSettings /></ModuleWrapper>
      case "asset-management":
        return <ModuleWrapper moduleName="AssetManagement" skeletonType="table"><AssetManagement /></ModuleWrapper>
      case "equipment-dashboard":
        return <ModuleWrapper moduleName="EquipmentDashboard" skeletonType="dashboard"><EquipmentDashboard /></ModuleWrapper>
      case "task-management":
        return <ModuleWrapper moduleName="TaskManagement" skeletonType="table"><TaskManagement /></ModuleWrapper>
      case "incident-management":
        return <ModuleWrapper moduleName="IncidentManagement" skeletonType="table"><IncidentManagement /></ModuleWrapper>
      case "notifications":
        return <ModuleWrapper moduleName="Notifications" skeletonType="table"><Notifications /></ModuleWrapper>
      case "push-notification-admin":
        return <ModuleWrapper moduleName="PushNotificationAdmin" skeletonType="form"><PushNotificationAdmin /></ModuleWrapper>
      case "documents":
        return <ModuleWrapper moduleName="DocumentManagement" skeletonType="table"><DocumentManagement /></ModuleWrapper>
      case "document-qa":
        return <ModuleWrapper moduleName="DocumentQA" skeletonType="form"><DocumentQA /></ModuleWrapper>
      case "driver-scorecard":
        return <ModuleWrapper moduleName="DriverScorecard" skeletonType="dashboard"><DriverScorecard /></ModuleWrapper>
      case "fleet-optimizer":
        return <ModuleWrapper moduleName="FleetOptimizer" skeletonType="dashboard"><FleetOptimizer /></ModuleWrapper>
      case "cost-analysis":
        return <ModuleWrapper moduleName="CostAnalysisCenter" skeletonType="chart"><CostAnalysisCenter /></ModuleWrapper>
      case "fuel-purchasing":
        return <ModuleWrapper moduleName="FuelPurchasing" skeletonType="table"><FuelPurchasing /></ModuleWrapper>
      case "custom-reports":
        return <ModuleWrapper moduleName="CustomReportBuilder" skeletonType="form"><CustomReportBuilder /></ModuleWrapper>
      default:
        return <ModuleWrapper moduleName="FleetDashboard" skeletonType="dashboard"><FleetDashboard data={fleetData} /></ModuleWrapper>
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
      <EntityLinkingProvider
        vehicles={fleetData.vehicles || []}
        drivers={fleetData.drivers || []}
        workOrders={fleetData.workOrders || []}
        fuelTransactions={fleetData.fuelTransactions || []}
        maintenanceSchedules={fleetData.maintenanceRequests || []}
      >
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
              {/* Universal Search */}
              <SearchTrigger onClick={() => setSearchOpen(true)} />

              <ThemeToggle />

              {/* Real-Time Event Hub */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Broadcast className="w-5 h-5" />
                    <EventBadge className="absolute -top-1 -right-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[400px] p-0">
                  <RealTimeEventHub compact maxEvents={20} />
                </PopoverContent>
              </Popover>

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

        <main className="p-6">
          <ErrorBoundary>
            {renderModule()}
          </ErrorBoundary>
        </main>
      </div>

      {/* Role Switcher FAB button */}
      <RoleSwitcher />

      {/* Toast notifications */}
      <ToastContainer />

      {/* Universal Search Dialog */}
      <UniversalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
        </div>
      </EntityLinkingProvider>
    </DrilldownManager>
  )
}

export default App
