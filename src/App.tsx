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
  CarProfile
} from "@phosphor-icons/react"
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
// TEMPORARILY DISABLED: AIAssistant requires @mui/material dependency
// import { AIAssistant } from "@/components/modules/AIAssistant"
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
import { ThemeToggle } from "@/components/ThemeToggle"
import { DrilldownManager } from "@/components/DrilldownManager"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useFacilities } from "@/hooks/use-api"

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
        return <ExecutiveDashboard />
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
        </div>
    </DrilldownManager>
  )
}

export default App
