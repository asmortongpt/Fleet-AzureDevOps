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
 */
export const navigationItems: NavigationItem[] = [
  // ==================== PRIMARY HUBS ====================
  {
    id: "fleet-hub-consolidated",
    label: "Fleet Hub",
    icon: <MapTrifold className="w-5 h-5" />,
    section: "hubs",
    category: "Operations"
  },
  {
    id: "operations-hub-consolidated",
    label: "Operations Hub",
    icon: <Broadcast className="w-5 h-5" />,
    section: "hubs",
    category: "Operations"
  },
  {
    id: "maintenance-hub-consolidated",
    label: "Maintenance Hub",
    icon: <Wrench className="w-5 h-5" />,
    section: "hubs",
    category: "Operations"
  },
  {
    id: "drivers-hub-consolidated",
    label: "Drivers Hub",
    icon: <Users className="w-5 h-5" />,
    section: "hubs",
    category: "Operations"
  },

  // ==================== ANALYTICS & REPORTING ====================
  {
    id: "analytics-hub-consolidated",
    label: "Analytics Hub",
    icon: <ChartLine className="w-5 h-5" />,
    section: "hubs",
    category: "Analytics"
  },

  // ==================== COMPLIANCE & SAFETY ====================
  {
    id: "compliance-hub-consolidated",
    label: "Compliance Hub",
    icon: <Shield className="w-5 h-5" />,
    section: "hubs",
    category: "Compliance"
  },
  {
    id: "safety-hub-consolidated",
    label: "Safety Hub",
    icon: <Warning className="w-5 h-5" />,
    section: "hubs",
    category: "Compliance"
  },

  // ==================== PROCUREMENT & ASSETS ====================
  {
    id: "procurement-hub-consolidated",
    label: "Procurement Hub",
    icon: <Package className="w-5 h-5" />,
    section: "hubs",
    category: "Procurement"
  },
  {
    id: "assets-hub-consolidated",
    label: "Assets Hub",
    icon: <Barcode className="w-5 h-5" />,
    section: "hubs",
    category: "Procurement"
  },

  // ==================== ADMIN & COMMUNICATION ====================
  {
    id: "admin-hub-consolidated",
    label: "Admin Hub",
    icon: <Gear className="w-5 h-5" />,
    section: "hubs",
    category: "Admin",
    roles: ['SuperAdmin', 'Admin']
  },
  {
    id: "communication-hub-consolidated",
    label: "Communication Hub",
    icon: <ChatsCircle className="w-5 h-5" />,
    section: "hubs",
    category: "Communication"
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
