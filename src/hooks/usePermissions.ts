import { useAuth } from './useAuth'
export type Role = 'admin' | 'manager' | 'driver' | 'viewer'
export type Permission = 'view_vehicles' | 'edit_vehicles' | 'delete_vehicles' | 'view_drivers' | 'edit_drivers' | 'delete_drivers' | 'view_reports' | 'edit_reports' | 'view_costs' | 'manage_budget'
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['view_vehicles', 'edit_vehicles', 'delete_vehicles', 'view_drivers', 'edit_drivers', 'delete_drivers', 'view_reports', 'edit_reports', 'view_costs', 'manage_budget'],
  manager: ['view_vehicles', 'edit_vehicles', 'view_drivers', 'edit_drivers', 'view_reports', 'edit_reports', 'view_costs'],
  driver: ['view_vehicles', 'view_reports'],
  viewer: ['view_vehicles', 'view_drivers', 'view_reports']
}
export function usePermissions() {
  const { user } = useAuth()
  const role = (user?.role || 'viewer') as Role
  return {
    role,
    hasPermission: (p: Permission) => ROLE_PERMISSIONS[role]?.includes(p) || false,
    canView: (r: string) => ROLE_PERMISSIONS[role]?.includes(`view_${r}` as Permission) || false,
    canEdit: (r: string) => ROLE_PERMISSIONS[role]?.includes(`edit_${r}` as Permission) || false,
    canDelete: (r: string) => ROLE_PERMISSIONS[role]?.includes(`delete_${r}` as Permission) || false
  }
}
