import { ReactNode } from "react"
import {
  Speedometer,
  Users,
  Wrench,
  ChartLine,
  GasPump,
  MapTrifold,
  Database,
  MapPin,
  Receipt,
  ClipboardText,
  Pulse,
  CarProfile,
  Package,
  ShoppingCart,
  Storefront,
  FileText,
  ChatsCircle,
  Robot,
  CalendarDots,
  Envelope,
  Scan,
  Chat,
  FirstAid,
  Brain,
  VideoCamera,
  BatteryCharging,
  Engine,
  Cube,
  GlobeHemisphereWest,
  Broadcast,
  TrafficSign,
  Barcode,
  CheckSquare,
  Warning,
  PresentationChart,
  Bell,
  FolderOpen,
  ChatCircleDots,
  Trophy,
  ChartBar,
  CurrencyDollar
} from "@phosphor-icons/react"

export interface NavigationItem {
  id: string
  label: string
  icon: ReactNode
  section?: "main" | "management" | "procurement" | "communication" | "tools"
}

export const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Fleet Dashboard",
    icon: <Speedometer className="w-5 h-5" />,
    section: "main"
  },
  {
    id: "executive-dashboard",
    label: "Executive Dashboard",
    icon: <PresentationChart className="w-5 h-5" />,
    section: "main"
  },
  {
    id: "dispatch-console",
    label: "Dispatch Console",
    icon: <Broadcast className="w-5 h-5" />,
    section: "main"
  },
  {
    id: "gps-tracking",
    label: "Live GPS Tracking",
    icon: <MapPin className="w-5 h-5" />,
    section: "main"
  },
  {
    id: "gis-map",
    label: "GIS Command Center",
    icon: <MapTrifold className="w-5 h-5" />,
    section: "main"
  },
  {
    id: "traffic-cameras",
    label: "Traffic Cameras",
    icon: <TrafficSign className="w-5 h-5" />,
    section: "main"
  },
  {
    id: "geofences",
    label: "Geofence Management",
    icon: <MapPin className="w-5 h-5" />,
    section: "main"
  },
  {
    id: "vehicle-telemetry",
    label: "Vehicle Telemetry",
    icon: <Engine className="w-5 h-5" />,
    section: "main"
  },
  {
    id: "map-layers",
    label: "Enhanced Map Layers",
    icon: <MapTrifold className="w-5 h-5" />,
    section: "main"
  },
  {
    id: "arcgis-integration",
    label: "ArcGIS Integration",
    icon: <GlobeHemisphereWest className="w-5 h-5" />,
    section: "tools"
  },
  {
    id: "map-settings",
    label: "Map Provider Settings",
    icon: <MapTrifold className="w-5 h-5" />,
    section: "tools"
  },
  {
    id: "route-optimization",
    label: "Route Optimization",
    icon: <MapPin className="w-5 h-5" />,
    section: "main"
  },
  {
    id: "people",
    label: "People Management",
    icon: <Users className="w-5 h-5" />,
    section: "management"
  },
  {
    id: "garage",
    label: "Garage & Service",
    icon: <Wrench className="w-5 h-5" />,
    section: "management"
  },
  {
    id: "virtual-garage",
    label: "Virtual Garage 3D",
    icon: <Cube className="w-5 h-5" />,
    section: "management"
  },
  {
    id: "predictive",
    label: "Predictive Maintenance",
    icon: <Pulse className="w-5 h-5" />,
    section: "management"
  },
  {
    id: "driver-mgmt",
    label: "Driver Performance",
    icon: <CarProfile className="w-5 h-5" />,
    section: "management"
  },
  {
    id: "asset-management",
    label: "Asset Management",
    icon: <Barcode className="w-5 h-5" />,
    section: "management"
  },
  {
    id: "equipment-dashboard",
    label: "Equipment Dashboard",
    icon: <Engine className="w-5 h-5" />,
    section: "management"
  },
  {
    id: "task-management",
    label: "Task Management",
    icon: <CheckSquare className="w-5 h-5" />,
    section: "management"
  },
  {
    id: "incident-management",
    label: "Incident Management",
    icon: <Warning className="w-5 h-5" />,
    section: "management"
  },
  {
    id: "notifications",
    label: "Alerts & Notifications",
    icon: <Bell className="w-5 h-5" />,
    section: "management"
  },
  {
    id: "push-notification-admin",
    label: "Push Notifications",
    icon: <Bell className="w-5 h-5" />,
    section: "communication"
  },
  {
    id: "documents",
    label: "Document Management",
    icon: <FolderOpen className="w-5 h-5" />,
    section: "management"
  },
  {
    id: "document-qa",
    label: "Document Q&A",
    icon: <ChatCircleDots className="w-5 h-5" />,
    section: "management"
  },
  {
    id: "vendor-management",
    label: "Vendor Management",
    icon: <Storefront className="w-5 h-5" />,
    section: "procurement"
  },
  {
    id: "parts-inventory",
    label: "Parts Inventory",
    icon: <Package className="w-5 h-5" />,
    section: "procurement"
  },
  {
    id: "purchase-orders",
    label: "Purchase Orders",
    icon: <ShoppingCart className="w-5 h-5" />,
    section: "procurement"
  },
  {
    id: "invoices",
    label: "Invoices & Billing",
    icon: <FileText className="w-5 h-5" />,
    section: "procurement"
  },
  {
    id: "ai-assistant",
    label: "AI Assistant",
    icon: <Robot className="w-5 h-5" />,
    section: "communication"
  },
  {
    id: "teams-integration",
    label: "Teams Messages",
    icon: <ChatsCircle className="w-5 h-5" />,
    section: "communication"
  },
  {
    id: "email-center",
    label: "Email Center",
    icon: <Envelope className="w-5 h-5" />,
    section: "communication"
  },
  {
    id: "maintenance-scheduling",
    label: "Maintenance Calendar",
    icon: <CalendarDots className="w-5 h-5" />,
    section: "communication"
  },
  {
    id: "receipt-processing",
    label: "Receipt Processing",
    icon: <Scan className="w-5 h-5" />,
    section: "communication"
  },
  {
    id: "communication-log",
    label: "Communication Log",
    icon: <Chat className="w-5 h-5" />,
    section: "communication"
  },
  {
    id: "osha-forms",
    label: "OSHA Safety Forms",
    icon: <FirstAid className="w-5 h-5" />,
    section: "communication"
  },
  {
    id: "policy-engine",
    label: "Policy Engine",
    icon: <Brain className="w-5 h-5" />,
    section: "communication"
  },
  {
    id: "video-telematics",
    label: "Video Telematics",
    icon: <VideoCamera className="w-5 h-5" />,
    section: "communication"
  },
  {
    id: "ev-charging",
    label: "EV Charging",
    icon: <BatteryCharging className="w-5 h-5" />,
    section: "communication"
  },
  {
    id: "form-builder",
    label: "Custom Form Builder",
    icon: <FileText className="w-5 h-5" />,
    section: "communication"
  },
  {
    id: "mileage",
    label: "Mileage Reimbursement",
    icon: <Receipt className="w-5 h-5" />,
    section: "tools"
  },
  {
    id: "personal-use",
    label: "Personal Use",
    icon: <CarProfile className="w-5 h-5" />,
    section: "tools"
  },
  {
    id: "personal-use-policy",
    label: "Personal Use Policy",
    icon: <Brain className="w-5 h-5" />,
    section: "tools"
  },
  {
    id: "reimbursement-queue",
    label: "Reimbursement Queue",
    icon: <Receipt className="w-5 h-5" />,
    section: "tools"
  },
  {
    id: "charges-billing",
    label: "Charges & Billing",
    icon: <CurrencyDollar className="w-5 h-5" />,
    section: "tools"
  },
  {
    id: "maintenance-request",
    label: "Maintenance Request",
    icon: <ClipboardText className="w-5 h-5" />,
    section: "tools"
  },
  {
    id: "fuel",
    label: "Fuel Management",
    icon: <GasPump className="w-5 h-5" />,
    section: "tools"
  },
  {
    id: "routes",
    label: "Route Management",
    icon: <MapTrifold className="w-5 h-5" />,
    section: "tools"
  },
  {
    id: "workbench",
    label: "Data Workbench",
    icon: <Database className="w-5 h-5" />,
    section: "tools"
  },
  {
    id: "comprehensive",
    label: "Fleet Analytics",
    icon: <ChartLine className="w-5 h-5" />,
    section: "tools"
  },
  {
    id: "driver-scorecard",
    label: "Driver Scorecard",
    icon: <Trophy className="w-5 h-5" />,
    section: "tools"
  },
  {
    id: "fleet-optimizer",
    label: "Fleet Optimizer",
    icon: <ChartBar className="w-5 h-5" />,
    section: "tools"
  },
  {
    id: "cost-analysis",
    label: "Cost Analysis",
    icon: <CurrencyDollar className="w-5 h-5" />,
    section: "tools"
  },
  {
    id: "fuel-purchasing",
    label: "Fuel Purchasing",
    icon: <GasPump className="w-5 h-5" />,
    section: "tools"
  },
  {
    id: "custom-reports",
    label: "Custom Report Builder",
    icon: <FileText className="w-5 h-5" />,
    section: "tools"
  }
]
