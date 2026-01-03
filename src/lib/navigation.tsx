import {
  MapTrifold,
  Broadcast,
  Wrench,
  Users,
  ChartLine,
  Shield,
  Package,
  Gear,
  Warning,
  Barcode,
  ChatsCircle
} from "@phosphor-icons/react"
import { ReactNode } from "react"

export interface NavigationItem {
  id: string
  label: string
  icon: ReactNode
  section?: "main" | "management" | "procurement" | "communication" | "tools" | "hubs"
  roles?: string[]
  permissions?: string[]
  category?: string
}

/**
 * Consolidated Hub Navigation
 * 
 * Production Readiness: 79 screens → 11 hubs
 * Each hub uses the HubPage component with tabbed navigation
 * 
 * Role Mapping (from database RBAC schema):
 * - FleetAdmin/Admin: Full access to all modules
 * - Manager/FleetManager: Operational oversight across most modules
 * - Supervisor: Team management, vehicles, drivers
 * - Dispatcher: Routes, vehicle locations, driver assignments
 * - Mechanic/Technician: Maintenance and work orders
 * - Driver: Own vehicle, routes, inspections
 * - SafetyOfficer: Safety incidents, compliance, video
 * - Finance: Financial reports, procurement, costs
 * - Analyst: Reports and analytics (read-only)
 * - Auditor: Audit logs and compliance (read-only)
 */
export const navigationItems: NavigationItem[] = [
  // ==================== PRIMARY HUBS ====================
  {
    id: "fleet-hub-consolidated",
    label: "Fleet Hub",
    icon: <MapTrifold className="w-5 h-5" />,
    section: "hubs",
    category: "Operations",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'Dispatcher', 'Driver', 'Analyst', 'Auditor']
  },
  {
    id: "operations-hub-consolidated",
    label: "Operations Hub",
    icon: <Broadcast className="w-5 h-5" />,
    section: "hubs",
    category: "Operations",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'Dispatcher', 'Analyst', 'Auditor']
  },
  {
    id: "maintenance-hub-consolidated",
    label: "Maintenance Hub",
    icon: <Wrench className="w-5 h-5" />,
    section: "hubs",
    category: "Operations",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'Mechanic', 'Technician', 'Analyst', 'Auditor']
  },
  {
    id: "drivers-hub-consolidated",
    label: "Drivers Hub",
    icon: <Users className="w-5 h-5" />,
    section: "hubs",
    category: "Operations",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'Dispatcher', 'SafetyOfficer', 'Analyst', 'Auditor']
  },

  // ==================== ANALYTICS & REPORTING ====================
  {
    id: "analytics-hub-consolidated",
    label: "Analytics Hub",
    icon: <ChartLine className="w-5 h-5" />,
    section: "hubs",
    category: "Analytics",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Finance', 'Analyst', 'Auditor']
  },

  // ==================== COMPLIANCE & SAFETY ====================
  {
    id: "compliance-hub-consolidated",
    label: "Compliance Hub",
    icon: <Shield className="w-5 h-5" />,
    section: "hubs",
    category: "Compliance",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'SafetyOfficer', 'Auditor']
  },
  {
    id: "safety-hub-consolidated",
    label: "Safety Hub",
    icon: <Warning className="w-5 h-5" />,
    section: "hubs",
    category: "Compliance",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'SafetyOfficer', 'Auditor']
  },

  // ==================== PROCUREMENT & ASSETS ====================
  {
    id: "procurement-hub-consolidated",
    label: "Procurement Hub",
    icon: <Package className="w-5 h-5" />,
    section: "hubs",
    category: "Procurement",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Finance', 'Auditor']
  },
  {
    id: "assets-hub-consolidated",
    label: "Assets Hub",
    icon: <Barcode className="w-5 h-5" />,
    section: "hubs",
    category: "Procurement",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Finance', 'Analyst', 'Auditor']
  },

  // ==================== ADMIN & COMMUNICATION ====================
  {
    id: "admin-hub-consolidated",
    label: "Admin Hub",
    icon: <Gear className="w-5 h-5" />,
    section: "hubs",
    category: "Admin",
    roles: ['SuperAdmin', 'Admin', 'FleetAdmin']
  },
  {
    id: "communication-hub-consolidated",
    label: "Communication Hub",
    icon: <ChatsCircle className="w-5 h-5" />,
    section: "hubs",
    category: "Communication",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'Dispatcher', 'SafetyOfficer']
  },
]


/**
 * Get navigation items filtered by category
 */
export function getNavigationByCategory(category: string): NavigationItem[] {
  return navigationItems.filter(item => item.category === category)
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  return [...new Set(navigationItems.map(item => item.category).filter(Boolean) as string[])]
}
