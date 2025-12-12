import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { ErrorBoundary } from "@/components/ErrorBoundary";

// Layout component
import { MainLayout } from "@/components/layout/MainLayout";

// Loading spinner component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading module...</p>
    </div>
  </div>
);

// --- LAZY-LOADED MODULES ---
// FLEET
const FleetDashboard = lazy(() => import("@/components/modules/fleet/FleetDashboard").then(m => ({ default: m.FleetDashboard })));
const FleetDashboardModern = lazy(() => import("@/components/modules/fleet/FleetDashboardModern").then(m => ({ default: m.FleetDashboardModern })));
const FleetAnalytics = lazy(() => import("@/components/modules/fleet/FleetAnalytics").then(m => ({ default: m.FleetAnalytics })));
const GPSTracking = lazy(() => import("@/components/modules/fleet/GPSTracking").then(m => ({ default: m.GPSTracking })));
const VehicleTelemetry = lazy(() => import("@/components/modules/fleet/VehicleTelemetry").then(m => ({ default: m.VehicleTelemetry })));
const VirtualGarage = lazy(() => import("@/components/modules/fleet/VirtualGarage").then(m => ({ default: m.VirtualGarage })));

// ANALYTICS
const ExecutiveDashboard = lazy(() => import("@/components/modules/analytics/ExecutiveDashboard").then(m => ({ default: m.ExecutiveDashboard })));
const DataWorkbench = lazy(() => import("@/components/modules/analytics/DataWorkbench").then(m => ({ default: m.DataWorkbench })));
const EndpointMonitor = lazy(() => import("@/components/modules/analytics/EndpointMonitor").then(m => ({ default: m.EndpointMonitor })));

// ADMIN
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const PeopleManagement = lazy(() => import("@/components/modules/admin/PeopleManagement").then(m => ({ default: m.PeopleManagement })));
const PolicyEngineWorkbench = lazy(() => import("@/components/modules/admin/PolicyEngineWorkbench").then(m => ({ default: m.PolicyEngineWorkbench })));
const Notifications = lazy(() => import("@/components/modules/admin/Notifications").then(m => ({ default: m.Notifications })));
const PushNotificationAdmin = lazy(() => import("@/components/modules/admin/PushNotificationAdmin"));

// MAINTENANCE
const GarageService = lazy(() => import("@/components/modules/maintenance/GarageService").then(m => ({ default: m.GarageService })));
const PredictiveMaintenance = lazy(() => import("@/components/modules/maintenance/PredictiveMaintenance").then(m => ({ default: m.PredictiveMaintenance })));
const MaintenanceScheduling = lazy(() => import("@/components/modules/maintenance/MaintenanceScheduling").then(m => ({ default: m.MaintenanceScheduling })));

// FUEL
const FuelManagement = lazy(() => import("@/components/modules/fuel/FuelManagement").then(m => ({ default: m.FuelManagement })));
const FuelPurchasing = lazy(() => import("@/components/modules/fuel/FuelPurchasing").then(m => ({ default: m.FuelPurchasing })));

// OPERATIONS
const RouteManagement = lazy(() => import("@/components/modules/operations/RouteManagement").then(m => ({ default: m.RouteManagement })));
const GeofenceManagement = lazy(() => import("@/components/modules/operations/GeofenceManagement").then(m => ({ default: m.GeofenceManagement })));
const AdvancedRouteOptimization = lazy(() => import("@/components/modules/operations/AdvancedRouteOptimization").then(m => ({ default: m.AdvancedRouteOptimization })));
const TaskManagement = lazy(() => import("@/components/modules/operations/TaskManagement").then(m => ({ default: m.TaskManagement })));
const DispatchConsole = lazy(() => import("@/components/DispatchConsole"));

// INTEGRATIONS
const GISCommandCenter = lazy(() => import("@/components/modules/integrations/GISCommandCenter").then(m => ({ default: m.GISCommandCenter })));
const TeamsIntegration = lazy(() => import("@/components/modules/integrations/TeamsIntegration").then(m => ({ default: m.TeamsIntegration })));
const EmailCenter = lazy(() => import("@/components/modules/integrations/EmailCenter").then(m => ({ default: m.EmailCenter })));
const ArcGISIntegration = lazy(() => import("@/components/modules/integrations/ArcGISIntegration").then(m => ({ default: m.ArcGISIntegration })));
const MapSettings = lazy(() => import("@/components/modules/integrations/MapSettings").then(m => ({ default: m.MapSettings })));
const EnhancedMapLayers = lazy(() => import("@/components/modules/integrations/EnhancedMapLayers").then(m => ({ default: m.EnhancedMapLayers })));

// PROCUREMENT
const VendorManagement = lazy(() => import("@/components/modules/procurement/VendorManagement").then(m => ({ default: m.VendorManagement })));
const PartsInventory = lazy(() => import("@/components/modules/procurement/PartsInventory").then(m => ({ default: m.PartsInventory })));
const PurchaseOrders = lazy(() => import("@/components/modules/procurement/PurchaseOrders").then(m => ({ default: m.PurchaseOrders })));
const Invoices = lazy(() => import("@/components/modules/procurement/Invoices").then(m => ({ default: m.Invoices })));

// TOOLS
const MileageReimbursement = lazy(() => import("@/components/modules/tools/MileageReimbursement").then(m => ({ default: m.MileageReimbursement })));
const ReceiptProcessing = lazy(() => import("@/components/modules/tools/ReceiptProcessing").then(m => ({ default: m.ReceiptProcessing })));
const TrafficCameras = lazy(() => import("@/components/modules/tools/TrafficCameras").then(m => ({ default: m.TrafficCameras })));
const CustomFormBuilder = lazy(() => import("@/components/modules/tools/CustomFormBuilder").then(m => ({ default: m.CustomFormBuilder })));

// COMMUNICATION
const CommunicationLog = lazy(() => import("@/components/modules/communication/CommunicationLog").then(m => ({ default: m.CommunicationLog })));

// COMPLIANCE
const OSHAForms = lazy(() => import("@/components/modules/compliance/OSHAForms").then(m => ({ default: m.OSHAForms })));
const VideoTelematics = lazy(() => import("@/components/modules/compliance/VideoTelematics").then(m => ({ default: m.VideoTelematics })));
const IncidentManagement = lazy(() => import("@/components/modules/compliance/IncidentManagement").then(m => ({ default: m.IncidentManagement })));
const DocumentManagement = lazy(() => import("@/components/modules/compliance/DocumentManagement").then(m => ({ default: m.DocumentManagement })));
const DocumentQA = lazy(() => import("@/components/modules/compliance/DocumentQA").then(m => ({ default: m.DocumentQA })));

// CHARGING
const EVChargingManagement = lazy(() => import("@/components/modules/charging/EVChargingManagement").then(m => ({ default: m.EVChargingManagement })));

// PERSONAL USE
const PersonalUseDashboard = lazy(() => import("@/components/modules/personal-use/PersonalUseDashboard").then(m => ({ default: m.PersonalUseDashboard })));
const PersonalUsePolicyConfig = lazy(() => import("@/components/modules/personal-use/PersonalUsePolicyConfig").then(m => ({ default: m.PersonalUsePolicyConfig })));
const ReimbursementQueue = lazy(() => import("@/pages/PersonalUse/ReimbursementQueue").then(m => ({ default: m.ReimbursementQueue })));
const ChargesAndBilling = lazy(() => import("@/pages/PersonalUse/ChargesAndBilling").then(m => ({ default: m.ChargesAndBilling })));

// ASSETS
const AssetManagement = lazy(() => import("@/components/modules/assets/AssetManagement").then(m => ({ default: m.AssetManagement })));
const EquipmentDashboard = lazy(() => import("@/components/modules/assets/EquipmentDashboard").then(m => ({ default: m.EquipmentDashboard })));

// PAGES
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

const routes = [
  { path: "dashboard", element: <FleetDashboard /> },
  { path: "executive-dashboard", element: <ExecutiveDashboard /> },
  { path: "admin-dashboard", element: <AdminDashboard /> },
  { path: "dispatch-console", element: <DispatchConsole /> },
  { path: "people", element: <PeopleManagement /> },
  { path: "garage", element: <GarageService /> },
  { path: "virtual-garage", element: <VirtualGarage /> },
  { path: "predictive", element: <PredictiveMaintenance /> },
  { path: "fuel", element: <FuelManagement /> },
  { path: "gps-tracking", element: <GPSTracking /> },
  { path: "workbench", element: <DataWorkbench /> },
  { path: "mileage", element: <MileageReimbursement /> },
  { path: "routes", element: <RouteManagement /> },
  { path: "gis-map", element: <GISCommandCenter /> },
  { path: "traffic-cameras", element: <TrafficCameras /> },
  { path: "comprehensive", element: <FleetAnalytics /> },
  { path: "vendor-management", element: <VendorManagement /> },
  { path: "parts-inventory", element: <PartsInventory /> },
  { path: "purchase-orders", element: <PurchaseOrders /> },
  { path: "invoices", element: <Invoices /> },
  { path: "teams-integration", element: <TeamsIntegration /> },
  { path: "email-center", element: <EmailCenter /> },
  { path: "maintenance-scheduling", element: <MaintenanceScheduling /> },
  { path: "receipt-processing", element: <ReceiptProcessing /> },
  { path: "communication-log", element: <CommunicationLog /> },
  { path: "geofences", element: <GeofenceManagement /> },
  { path: "osha-forms", element: <OSHAForms /> },
  { path: "policy-engine", element: <PolicyEngineWorkbench /> },
  { path: "video-telematics", element: <VideoTelematics /> },
  { path: "ev-charging", element: <EVChargingManagement /> },
  { path: "vehicle-telemetry", element: <VehicleTelemetry /> },
  { path: "map-layers", element: <EnhancedMapLayers /> },
  { path: "route-optimization", element: <AdvancedRouteOptimization /> },
  { path: "form-builder", element: <CustomFormBuilder /> },
  { path: "personal-use", element: <PersonalUseDashboard /> },
  { path: "personal-use-policy", element: <PersonalUsePolicyConfig /> },
  { path: "reimbursement-queue", element: <ReimbursementQueue /> },
  { path: "charges-billing", element: <ChargesAndBilling /> },
  { path: "arcgis-integration", element: <ArcGISIntegration /> },
  { path: "map-settings", element: <MapSettings /> },
  { path: "asset-management", element: <AssetManagement /> },
  { path: "equipment-dashboard", element: <EquipmentDashboard /> },
  { path: "task-management", element: <TaskManagement /> },
  { path: "incident-management", element: <IncidentManagement /> },
  { path: "notifications", element: <Notifications /> },
  { path: "push-notification-admin", element: <PushNotificationAdmin /> },
  { path: "documents", element: <DocumentManagement /> },
  { path: "document-qa", element: <DocumentQA /> },
  { path: "fuel-purchasing", element: <FuelPurchasing /> },
  { path: "endpoint-monitor", element: <EndpointMonitor /> },
  { path: "settings", element: <SettingsPage /> },
  { path: "profile", element: <ProfilePage /> },
];

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <FleetDashboardModern />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      ...routes.map(route => ({
        path: route.path,
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              {route.element}
            </Suspense>
          </ErrorBoundary>
        ),
      })),
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
