import { createContext, useContext, ReactNode, useEffect, useState } from "react"

import { Tenant, User } from "./types"
import { useAuth } from "@/contexts"

interface TenantContextType {
  tenant: Tenant | null
  user: User | null
  setTenant: (tenant: Tenant | null) => void
  setUser: (user: User | null) => void
  hasPermission: (permission: string) => boolean
  isAuthenticated: boolean
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isLoading: authLoading } = useAuth()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!authUser) {
      setTenant(null)
      setUser(null)
      return
    }

    const roleMap: Record<string, User["role"]> = {
      SuperAdmin: "super-admin",
      Admin: "admin",
      Manager: "manager",
      User: "viewer",
      ReadOnly: "viewer"
    }

    const mappedUser: User = {
      id: authUser.id,
      tenantId: authUser.tenantId,
      email: authUser.email,
      name: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || authUser.email,
      role: roleMap[authUser.role] || "viewer",
      permissions: authUser.permissions || [],
      status: "active",
      createdAt: authUser.createdAt || ""
    }
    setUser(mappedUser)

    let cancelled = false
    const loadTenant = async () => {
      try {
        const response = await fetch(`/api/tenants/${authUser.tenantId}`, {
          credentials: "include"
        })
        if (!response.ok) {
          throw new Error(`Failed to fetch tenant (${response.status})`)
        }
        const payload = await response.json()
        const tenantData = payload.data || payload
        if (cancelled) return
        setTenant({
          id: tenantData.id,
          name: tenantData.name,
          domain: tenantData.domain || "",
          status: tenantData.status || "active",
          plan: tenantData.plan || "enterprise",
          maxUsers: tenantData.max_users ?? tenantData.maxUsers ?? 0,
          maxVehicles: tenantData.max_vehicles ?? tenantData.maxVehicles ?? 0,
          features: tenantData.features || [],
          createdAt: tenantData.created_at || tenantData.createdAt || new Date().toISOString(),
          contactEmail: tenantData.billing_email || tenantData.contactEmail || authUser.email
        })
      } catch {
        if (!cancelled) {
          setTenant(null)
        }
      }
    }

    loadTenant()

    return () => {
      cancelled = true
    }
  }, [authUser, authLoading])

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
