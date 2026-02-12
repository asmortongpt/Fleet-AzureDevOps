import {
  Map,
  Shield,
  MessageCircle,
  DollarSign,
  Settings,
  Box,
  Clock
} from "lucide-react"
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
 * Consolidated Hub Navigation - 5 Primary Hubs
 *
 * Screen Consolidation: 79 screens → 5 consolidated hubs
 * Each hub uses the HubPage component with tabbed navigation
 *
 * Hub Breakdown:
 * 1. Fleet Hub - Fleet, Drivers, Operations, Maintenance, Assets (5 tabs)
 * 2. Safety & Compliance - Compliance, Safety, Policies, Reports (4 tabs)
 * 3. Financial Hub - Financial, Procurement, Analytics, Reports (4 tabs)
 * 4. Communication Hub - People, Communication, Work (3 tabs)
 * 5. Admin Hub - Admin, Config, Data, Integrations, Documents (5 tabs)
 *
 * Total: 21 tabs consolidating 79+ original screens
 */
export const navigationItems: NavigationItem[] = [
  {
    id: "fleet-hub-consolidated",
    label: "Fleet Hub",
    icon: <Map className="w-3 h-3" />,
    section: "hubs",
    category: "Operations",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'Dispatcher', 'Driver', 'Analyst', 'Auditor']
  },
  {
    id: "safety-compliance-hub",
    label: "Safety & Compliance",
    icon: <Shield className="w-3 h-3" />,
    section: "hubs",
    category: "Safety & Compliance",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'SafetyOfficer', 'Auditor']
  },
  {
    id: "hos",
    label: "Hours of Service",
    icon: <Clock className="w-3 h-3" />,
    section: "hubs",
    category: "Safety & Compliance",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'Dispatcher', 'Driver', 'SafetyOfficer', 'Auditor']
  },
  {
    id: "procurement-hub-consolidated",
    label: "Financial Hub",
    icon: <DollarSign className="w-3 h-3" />,
    section: "hubs",
    category: "Financial",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Finance', 'Analyst', 'Auditor']
  },
  {
    id: "communication-hub-consolidated",
    label: "Communication Hub",
    icon: <MessageCircle className="w-3 h-3" />,
    section: "hubs",
    category: "Communication",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'Dispatcher', 'SafetyOfficer']
  },
  {
    id: "admin-hub-consolidated",
    label: "Admin Hub",
    icon: <Settings className="w-3 h-3" />,
    section: "hubs",
    category: "Admin",
    roles: ['SuperAdmin', 'Admin', 'FleetAdmin']
  },
  {
    id: "3d-garage",
    label: "3D Garage",
    icon: <Box className="w-3 h-3" />,
    section: "tools",
    category: "Tools",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Mechanic', 'Viewer']
  }
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
