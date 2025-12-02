import { createContext, useContext, ReactNode, useState } from "react"
import { Tenant, User } from "./types"

interface TenantContextType {
  tenant: Tenant | null
  user: User | null
  setTenant: (tenant: Tenant | null) => void
  setUser: (user: User | null) => void
  hasPermission: (permission: string) => boolean
  isAuthenticated: boolean
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

// Default demo tenant for development
const DEFAULT_TENANT: Tenant = {
  id: "tenant-demo",
  name: "Demo Fleet Corporation",
  domain: "demo.fleet.com",
  status: "active",
  plan: "enterprise",
  maxUsers: 50000,
  maxVehicles: 40000,
  features: [
    "multi-tenant",
    "advanced-analytics",
    "ai-assistant",
    "ms-office-integration",
    "predictive-maintenance",
    "gps-tracking",
    "automated-scheduling"
  ],
  createdAt: new Date().toISOString(),
  contactEmail: "admin@demo.fleet.com"
}

const DEFAULT_USER: User = {
  id: "user-admin",
  tenantId: "tenant-demo",
  email: "admin@demo.fleet.com",
  name: "Fleet Administrator",
  role: "admin",
  permissions: [
    "vehicles.view",
    "vehicles.create",
    "vehicles.edit",
    "vehicles.delete",
    "drivers.view",
    "drivers.create",
    "drivers.edit",
    "drivers.delete",
    "maintenance.view",
    "maintenance.create",
    "maintenance.approve",
    "reports.view",
    "reports.generate",
    "vendors.view",
    "vendors.manage",
    "purchase-orders.view",
    "purchase-orders.create",
    "purchase-orders.approve",
    "invoices.view",
    "invoices.process",
    "settings.manage"
  ],
  status: "active",
  createdAt: new Date().toISOString()
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(DEFAULT_TENANT)
  const [user, setUser] = useState<User | null>(DEFAULT_USER)

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    if (user.role === "super-admin") return true
    return user.permissions.includes(permission)
  }

  const isAuthenticated = !!user && !!tenant

  return (
    <TenantContext.Provider
      value={{
        tenant,
        user,
        setTenant,
        setUser,
        hasPermission,
        isAuthenticated
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider")
  }
  return context
}
