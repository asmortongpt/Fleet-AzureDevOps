import {
  MapTrifold,
  Broadcast,
  Wrench,
  Users,
  ChartLine,
  Shield,
  Package,
  Gear,
  Barcode,
  ChatsCircle,
  CurrencyDollar,
  Plugs,
  BookOpen,
  Database,
  FileText
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
    icon: <MapTrifold className="w-3 h-3" />,
    section: "hubs",
    category: "Operations",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'Dispatcher', 'Driver', 'Analyst', 'Auditor']
  },
  {
    id: "operations-hub-consolidated",
    label: "Operations Hub",
    icon: <Broadcast className="w-3 h-3" />,
    section: "hubs",
    category: "Operations",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'Dispatcher', 'Analyst', 'Auditor']
  },
  {
    id: "maintenance-hub-consolidated",
    label: "Maintenance Hub",
    icon: <Wrench className="w-3 h-3" />,
    section: "hubs",
    category: "Operations",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'Mechanic', 'Technician', 'Analyst', 'Auditor']
  },
  {
    id: "drivers-hub-consolidated",
    label: "Drivers Hub",
    icon: <Users className="w-3 h-3" />,
    section: "hubs",
    category: "Operations",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'Dispatcher', 'SafetyOfficer', 'Analyst', 'Auditor']
  },

  // ==================== ANALYTICS & REPORTING ====================
  {
    id: "analytics-hub-consolidated",
    label: "Analytics Hub",
    icon: <ChartLine className="w-3 h-3" />,
    section: "hubs",
    category: "Analytics",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Finance', 'Analyst', 'Auditor']
  },
  {
    id: "reports-hub",
    label: "Reports Hub",
    icon: <ChartLine className="w-3 h-3" />,
    section: "hubs",
    category: "Analytics",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Finance', 'Analyst', 'Auditor']
  },

  // ==================== COMPLIANCE & SAFETY ====================
  {
    id: "safety-compliance-hub",
    label: "Safety & Compliance",
    icon: <Shield className="w-3 h-3" />,
    section: "hubs",
    category: "Safety & Compliance",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'SafetyOfficer', 'Auditor']
  },
  {
    id: "policy-hub",
    label: "Policy Hub",
    icon: <BookOpen className="w-3 h-3" />,
    section: "hubs",
    category: "Governance",
    roles: ['SuperAdmin', 'Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'SafetyOfficer', 'Auditor']
  },
  {
    id: "documents-hub",
    label: "Documents Hub",
    icon: <FileText className="w-3 h-3" />,
    section: "hubs",
    category: "Operations",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'SafetyOfficer', 'Analyst', 'Auditor']
  },

  // ==================== PROCUREMENT & ASSETS ====================
  {
    id: "procurement-hub-consolidated",
    label: "Procurement Hub",
    icon: <Package className="w-3 h-3" />,
    section: "hubs",
    category: "Procurement",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Finance', 'Auditor']
  },
  {
    id: "assets-hub-consolidated",
    label: "Assets Hub",
    icon: <Barcode className="w-3 h-3" />,
    section: "hubs",
    category: "Procurement",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Finance', 'Analyst', 'Auditor']
  },

  // ==================== ADMIN & COMMUNICATION ====================
  {
    id: "admin-hub-consolidated",
    label: "Admin Hub",
    icon: <Gear className="w-3 h-3" />,
    section: "hubs",
    category: "Admin",
    roles: ['SuperAdmin', 'Admin', 'FleetAdmin']
  },
  {
    id: "communication-hub-consolidated",
    label: "Communication Hub",
    icon: <ChatsCircle className="w-3 h-3" />,
    section: "hubs",
    category: "Communication",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'Dispatcher', 'SafetyOfficer']
  },

  // ==================== FINANCIAL & INTEGRATIONS ====================
  {
    id: "financial-hub-consolidated",
    label: "Financial Hub",
    icon: <CurrencyDollar className="w-3 h-3" />,
    section: "hubs",
    category: "Financial",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Finance', 'Analyst', 'Auditor']
  },
  {
    id: "integrations-hub-consolidated",
    label: "Integrations Hub",
    icon: <Plugs className="w-3 h-3" />,
    section: "hubs",
    category: "Integrations",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'Finance']
  },

  // ==================== CTA SUPER ADMIN ====================
  {
    id: "cta-configuration-hub",
    label: "CTA Configuration",
    icon: <Gear className="w-3 h-3" />,
    section: "hubs",
    category: "CTA Admin",
    roles: ['SuperAdmin', 'CTAOwner']
  },
  {
    id: "data-governance-hub",
    label: "Data Governance",
    icon: <Database className="w-3 h-3" />,
    section: "hubs",
    category: "CTA Admin",
    roles: ['SuperAdmin']
  },

  // ==================== ADDITIONAL HUBS ====================
  {
    id: "work-hub",
    label: "Work Hub",
    icon: <Wrench className="w-3 h-3" />,
    section: "hubs",
    category: "Operations",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'Mechanic', 'Technician']
  },
  {
    id: "safety-hub",
    label: "Safety Hub",
    icon: <Shield className="w-3 h-3" />,
    section: "hubs",
    category: "Safety & Compliance",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'SafetyOfficer', 'Auditor']
  },
  {
    id: "people-hub",
    label: "People Hub",
    icon: <Users className="w-3 h-3" />,
    section: "hubs",
    category: "Operations",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor']
  },
  {
    id: "insights-hub",
    label: "Insights Hub",
    icon: <ChartLine className="w-3 h-3" />,
    section: "hubs",
    category: "Analytics",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Finance', 'Analyst', 'Auditor']
  },
  {
    id: "configuration-hub",
    label: "Configuration Hub",
    icon: <Gear className="w-3 h-3" />,
    section: "hubs",
    category: "Admin",
    roles: ['Admin', 'FleetAdmin']
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
