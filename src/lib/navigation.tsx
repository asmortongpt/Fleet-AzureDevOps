import {
  Map,
  ShieldCheck,
  BarChart3,
  Users,
  Settings,
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
 * Consolidated Hub Navigation - 5 Primary Hubs (ArchonY redesign)
 *
 * Screen Consolidation: 79 screens -> 5 consolidated hubs
 * Each hub uses the HubPage component with tabbed navigation
 *
 * Hub Breakdown:
 * 1. Fleet Command - Fleet, Drivers, Operations, Maintenance, Assets (5 tabs)
 * 2. Safety & Compliance - Compliance, Safety, Policies, Reports (4 tabs)
 * 3. Business Intelligence - Financial, Procurement, Analytics, Reports (4 tabs)
 * 4. People & Communication - People, Communication, Work (3 tabs)
 * 5. Admin & Configuration - Admin, Config, Data, Integrations, Documents (5 tabs)
 *
 * Total: 21 tabs consolidating 79+ original screens
 */
export const navigationItems: NavigationItem[] = [
  {
    id: "fleet-hub-consolidated",
    label: "Fleet Command",
    icon: <Map className="w-3 h-3" />,
    section: "hubs",
    category: "Operations",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'Dispatcher', 'Driver', 'Analyst', 'Auditor']
  },
  {
    id: "safety-compliance-hub",
    label: "Safety & Compliance",
    icon: <ShieldCheck className="w-3 h-3" />,
    section: "hubs",
    category: "Safety & Compliance",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'SafetyOfficer', 'Auditor']
  },
  {
    id: "procurement-hub-consolidated",
    label: "Business Intelligence",
    icon: <BarChart3 className="w-3 h-3" />,
    section: "hubs",
    category: "Financial",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Finance', 'Analyst', 'Auditor']
  },
  {
    id: "communication-hub-consolidated",
    label: "People & Communication",
    icon: <Users className="w-3 h-3" />,
    section: "hubs",
    category: "Communication",
    roles: ['Admin', 'FleetAdmin', 'Manager', 'FleetManager', 'Supervisor', 'Dispatcher', 'SafetyOfficer']
  },
  {
    id: "admin-hub-consolidated",
    label: "Admin & Configuration",
    icon: <Settings className="w-3 h-3" />,
    section: "hubs",
    category: "Admin",
    roles: ['SuperAdmin', 'Admin', 'FleetAdmin']
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
