/**
 * Reactive State Management with Jotai
 * Global state atoms for vehicles, filters, telemetry, and alerts
 */

import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import type {
  User,
  Role,
  Team,
  Permission,
  UserFilters,
  UserSortConfig,
  ActiveSession,
  LoginHistoryEntry,
  TwoFactorSetup,
} from '@/types/user-management'

/* ============================================================
   TYPES
   ============================================================ */

export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin: string
  licensePlate: string
  status: 'active' | 'maintenance' | 'offline' | 'retired'
  location?: {
    lat: number
    lng: number
    address?: string
    lastUpdate: string
  }
  mileage?: number
  fuelLevel?: number
  batteryLevel?: number
  driver?: {
    id: string
    name: string
  }
}

export interface TelemetryData {
  vehicleId: string
  timestamp: string
  speed: number
  rpm: number
  fuelLevel: number
  batteryVoltage: number
  engineTemp: number
  location: {
    lat: number
    lng: number
  }
  diagnostics?: {
    dtcCount: number
    codes: string[]
  }
}

export interface Alert {
  id: string
  vehicleId: string
  type: 'warning' | 'error' | 'info' | 'success'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: string
  acknowledged: boolean
  autoDissmiss?: boolean
  dismissAfter?: number // milliseconds
}

export interface VehicleFilters {
  status: string[]
  search: string
  make: string[]
  model: string[]
  year: {
    min?: number
    max?: number
  }
  mileage: {
    min?: number
    max?: number
  }
}

export interface WebSocketStatus {
  connected: boolean
  reconnecting: boolean
  lastConnected?: string
  errors: number
}

/* ============================================================
   BASE ATOMS
   ============================================================ */

// Vehicles atom - main data store
export const vehiclesAtom = atom<Vehicle[]>([])

// Telemetry data - keyed by vehicle ID
export const telemetryAtom = atom<Record<string, TelemetryData>>({})

// Alerts - array of active alerts
export const alertsAtom = atom<Alert[]>([])

// Vehicle filters
export const vehicleFiltersAtom = atomWithStorage<VehicleFilters>('vehicle-filters', {
  status: [],
  search: '',
  make: [],
  model: [],
  year: {},
  mileage: {},
})

// WebSocket connection status
export const websocketStatusAtom = atom<WebSocketStatus>({
  connected: false,
  reconnecting: false,
  errors: 0,
})

// Selected vehicle ID (for detail view)
export const selectedVehicleIdAtom = atomWithStorage<string | null>('selected-vehicle-id', null)

// Map view settings
export const mapSettingsAtom = atomWithStorage('map-settings', {
  center: { lat: 39.8283, lng: -98.5795 }, // Center of USA
  zoom: 4,
  showLabels: true,
  showTraffic: false,
  mapType: 'roadmap' as 'roadmap' | 'satellite' | 'hybrid' | 'terrain',
})

// UI state
export const sidebarOpenAtom = atomWithStorage('sidebar-open', true)
export const darkModeAtom = atomWithStorage('dark-mode', false)

/* ============================================================
   DERIVED ATOMS
   ============================================================ */

// Filtered vehicles based on current filters
export const filteredVehiclesAtom = atom((get) => {
  const vehicles = get(vehiclesAtom)
  const filters = get(vehicleFiltersAtom)

  return vehicles.filter((vehicle) => {
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(vehicle.status)) {
      return false
    }

    // Search filter (searches make, model, vin, license plate)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const searchableText =
        `${vehicle.make} ${vehicle.model} ${vehicle.vin} ${vehicle.licensePlate}`.toLowerCase()

      if (!searchableText.includes(searchLower)) {
        return false
      }
    }

    // Make filter
    if (filters.make.length > 0 && !filters.make.includes(vehicle.make)) {
      return false
    }

    // Model filter
    if (filters.model.length > 0 && !filters.model.includes(vehicle.model)) {
      return false
    }

    // Year filter
    if (filters.year.min && vehicle.year < filters.year.min) {
      return false
    }
    if (filters.year.max && vehicle.year > filters.year.max) {
      return false
    }

    // Mileage filter
    if (vehicle.mileage) {
      if (filters.mileage.min && vehicle.mileage < filters.mileage.min) {
        return false
      }
      if (filters.mileage.max && vehicle.mileage > filters.mileage.max) {
        return false
      }
    }

    return true
  })
})

// Selected vehicle details
export const selectedVehicleAtom = atom((get) => {
  const vehicles = get(vehiclesAtom)
  const selectedId = get(selectedVehicleIdAtom)

  if (!selectedId) return null

  return vehicles.find((v) => v.id === selectedId) || null
})

// Vehicle statistics
export const vehicleStatsAtom = atom((get) => {
  const vehicles = get(vehiclesAtom)

  return {
    total: vehicles.length,
    active: vehicles.filter((v) => v.status === 'active').length,
    maintenance: vehicles.filter((v) => v.status === 'maintenance').length,
    offline: vehicles.filter((v) => v.status === 'offline').length,
    retired: vehicles.filter((v) => v.status === 'retired').length,
  }
})

// Unacknowledged alerts
export const unacknowledgedAlertsAtom = atom((get) => {
  const alerts = get(alertsAtom)
  return alerts.filter((alert) => !alert.acknowledged)
})

// Critical alerts
export const criticalAlertsAtom = atom((get) => {
  const alerts = get(alertsAtom)
  return alerts.filter((alert) => alert.severity === 'critical' && !alert.acknowledged)
})

// Alert counts by severity
export const alertCountsAtom = atom((get) => {
  const alerts = get(unacknowledgedAlertsAtom)

  return {
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    medium: alerts.filter((a) => a.severity === 'medium').length,
    low: alerts.filter((a) => a.severity === 'low').length,
  }
})

// Vehicles with active alerts
export const vehiclesWithAlertsAtom = atom((get) => {
  const vehicles = get(vehiclesAtom)
  const alerts = get(unacknowledgedAlertsAtom)

  const vehicleIdsWithAlerts = new Set(alerts.map((a) => a.vehicleId))

  return vehicles.filter((v) => vehicleIdsWithAlerts.has(v.id))
})

// Average fleet metrics
export const fleetMetricsAtom = atom((get) => {
  const vehicles = get(vehiclesAtom)

  const activeVehicles = vehicles.filter((v) => v.status === 'active')

  if (activeVehicles.length === 0) {
    return {
      avgFuelLevel: 0,
      avgBatteryLevel: 0,
      avgMileage: 0,
      totalMileage: 0,
    }
  }

  const totalFuel = activeVehicles.reduce((sum, v) => sum + (v.fuelLevel || 0), 0)
  const totalBattery = activeVehicles.reduce((sum, v) => sum + (v.batteryLevel || 0), 0)
  const totalMileage = activeVehicles.reduce((sum, v) => sum + (v.mileage || 0), 0)

  return {
    avgFuelLevel: totalFuel / activeVehicles.length,
    avgBatteryLevel: totalBattery / activeVehicles.length,
    avgMileage: totalMileage / activeVehicles.length,
    totalMileage,
  }
})

// Vehicles on map (with location data)
export const vehiclesOnMapAtom = atom((get) => {
  const vehicles = get(filteredVehiclesAtom)
  return vehicles.filter((v) => v.location && v.location.lat && v.location.lng)
})

/* ============================================================
   WRITE-ONLY ATOMS (Actions)
   ============================================================ */

// Add vehicle
export const addVehicleAtom = atom(null, (get, set, vehicle: Vehicle) => {
  const vehicles = get(vehiclesAtom)
  set(vehiclesAtom, [...vehicles, vehicle])
})

// Update vehicle
export const updateVehicleAtom = atom(null, (get, set, update: Partial<Vehicle> & { id: string }) => {
  const vehicles = get(vehiclesAtom)
  set(
    vehiclesAtom,
    vehicles.map((v) => (v.id === update.id ? { ...v, ...update } : v))
  )
})

// Remove vehicle
export const removeVehicleAtom = atom(null, (get, set, vehicleId: string) => {
  const vehicles = get(vehiclesAtom)
  set(
    vehiclesAtom,
    vehicles.filter((v) => v.id !== vehicleId)
  )
})

// Add alert
export const addAlertAtom = atom(null, (get, set, alert: Alert) => {
  const alerts = get(alertsAtom)
  set(alertsAtom, [...alerts, alert])

  // Auto-dismiss if configured
  if (alert.autoDissmiss && alert.dismissAfter) {
    setTimeout(() => {
      set(removeAlertAtom, alert.id)
    }, alert.dismissAfter)
  }
})

// Acknowledge alert
export const acknowledgeAlertAtom = atom(null, (get, set, alertId: string) => {
  const alerts = get(alertsAtom)
  set(
    alertsAtom,
    alerts.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
  )
})

// Remove alert
export const removeAlertAtom = atom(null, (get, set, alertId: string) => {
  const alerts = get(alertsAtom)
  set(
    alertsAtom,
    alerts.filter((a) => a.id !== alertId)
  )
})

// Clear all acknowledged alerts
export const clearAcknowledgedAlertsAtom = atom(null, (get, set) => {
  const alerts = get(alertsAtom)
  set(
    alertsAtom,
    alerts.filter((a) => !a.acknowledged)
  )
})

// Update telemetry
export const updateTelemetryAtom = atom(null, (get, set, data: TelemetryData) => {
  const telemetry = get(telemetryAtom)
  set(telemetryAtom, {
    ...telemetry,
    [data.vehicleId]: data,
  })

  // Also update vehicle location if telemetry includes it
  if (data.location) {
    const vehicles = get(vehiclesAtom)
    set(
      vehiclesAtom,
      vehicles.map((v) =>
        v.id === data.vehicleId
          ? {
              ...v,
              location: {
                lat: data.location.lat,
                lng: data.location.lng,
                lastUpdate: data.timestamp,
              },
              fuelLevel: data.fuelLevel,
            }
          : v
      )
    )
  }
})

// Update WebSocket status
export const updateWebSocketStatusAtom = atom(null, (get, set, update: Partial<WebSocketStatus>) => {
  const current = get(websocketStatusAtom)
  set(websocketStatusAtom, { ...current, ...update })
})

/* ============================================================
   HELPER FUNCTIONS
   ============================================================ */

// Generate a unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Create an alert helper
export function createAlert(
  vehicleId: string,
  type: Alert['type'],
  severity: Alert['severity'],
  title: string,
  message: string,
  autoDissmiss = false,
  dismissAfter = 5000
): Alert {
  return {
    id: generateId(),
    vehicleId,
    type,
    severity,
    title,
    message,
    timestamp: new Date().toISOString(),
    acknowledged: false,
    autoDissmiss,
    dismissAfter,
  }
}

/* ============================================================
   SETTINGS TYPES & ATOMS
   ============================================================ */

export interface GeneralSettings {
  language: string
  timezone: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  numberFormat: 'us' | 'eu' | 'uk'
  defaultDashboard: string
  itemsPerPage: number
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto'
  colorScheme: 'blue' | 'green' | 'purple' | 'orange'
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  density: 'compact' | 'comfortable' | 'spacious'
  sidebarCollapsed: boolean
  animationsEnabled: boolean
}

export interface NotificationSettings {
  emailNotifications: {
    maintenance: boolean
    alerts: boolean
    reports: boolean
    updates: boolean
  }
  inAppNotifications: boolean
  pushNotifications: boolean
  soundEnabled: boolean
  notificationFrequency: 'realtime' | 'hourly' | 'daily'
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

export interface FleetSettings {
  defaultView: 'list' | 'grid' | 'map'
  autoRefreshInterval: number
  distanceUnit: 'miles' | 'kilometers'
  fuelUnit: 'gallons' | 'liters'
  temperatureUnit: 'fahrenheit' | 'celsius'
  mapProvider: 'google' | 'mapbox' | 'arcgis'
  geofenceAlertsEnabled: boolean
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeout: number
  loginHistory: Array<{
    id: string
    timestamp: string
    device: string
    location: string
    ip: string
  }>
  activeSessions: Array<{
    id: string
    device: string
    browser: string
    lastActive: string
    ip: string
  }>
}

export interface DataPrivacySettings {
  dataRetentionPeriod: number
  cookiePreferences: {
    necessary: boolean
    analytics: boolean
    marketing: boolean
  }
  analyticsEnabled: boolean
}

export interface AdvancedSettings {
  developerMode: boolean
  apiEndpoint: string
  featureFlags: Record<string, boolean>
  debugLogging: boolean
  performanceMetrics: boolean
}

// Settings atoms with localStorage persistence
export const generalSettingsAtom = atomWithStorage<GeneralSettings>('general-settings', {
  language: 'en-US',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  numberFormat: 'us',
  defaultDashboard: 'dashboard',
  itemsPerPage: 25,
})

export const appearanceSettingsAtom = atomWithStorage<AppearanceSettings>('appearance-settings', {
  theme: 'auto',
  colorScheme: 'blue',
  fontSize: 'medium',
  density: 'comfortable',
  sidebarCollapsed: false,
  animationsEnabled: true,
})

export const notificationSettingsAtom = atomWithStorage<NotificationSettings>(
  'notification-settings',
  {
    emailNotifications: {
      maintenance: true,
      alerts: true,
      reports: true,
      updates: false,
    },
    inAppNotifications: true,
    pushNotifications: false,
    soundEnabled: true,
    notificationFrequency: 'realtime',
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  }
)

export const fleetSettingsAtom = atomWithStorage<FleetSettings>('fleet-settings', {
  defaultView: 'list',
  autoRefreshInterval: 30,
  distanceUnit: 'miles',
  fuelUnit: 'gallons',
  temperatureUnit: 'fahrenheit',
  mapProvider: 'google',
  geofenceAlertsEnabled: true,
})

export const securitySettingsAtom = atomWithStorage<SecuritySettings>('security-settings', {
  twoFactorEnabled: false,
  sessionTimeout: 30,
  loginHistory: [],
  activeSessions: [],
})

export const dataPrivacySettingsAtom = atomWithStorage<DataPrivacySettings>(
  'data-privacy-settings',
  {
    dataRetentionPeriod: 365,
    cookiePreferences: {
      necessary: true,
      analytics: true,
      marketing: false,
    },
    analyticsEnabled: true,
  }
)

export const advancedSettingsAtom = atomWithStorage<AdvancedSettings>('advanced-settings', {
  developerMode: false,
  apiEndpoint: import.meta.env.VITE_API_ENDPOINT || '/api',
  featureFlags: {},
  debugLogging: false,
  performanceMetrics: false,
})

// Track unsaved changes
export const hasUnsavedChangesAtom = atom<boolean>(false)

/* ============================================================
   USER MANAGEMENT ATOMS
   ============================================================ */

// Current authenticated user
export const currentUserAtom = atomWithStorage<User | null>('current-user', null)

// Users list (for admin management)
export const usersAtom = atom<User[]>([])

// Roles list
export const rolesAtom = atom<Role[]>([])

// Teams list
export const teamsAtom = atom<Team[]>([])

// Active sessions for current user
export const activeSessionsAtom = atom<ActiveSession[]>([])

// Login history for current user
export const loginHistoryAtom = atom<LoginHistoryEntry[]>([])

// User filters
export const userFiltersAtom = atom<UserFilters>({
  search: '',
  roles: [],
  teams: [],
  status: [],
  departments: [],
})

// User sort configuration
export const userSortConfigAtom = atom<UserSortConfig>({
  field: 'displayName',
  direction: 'asc',
})

// Selected user ID (for detail view/editing)
export const selectedUserIdAtom = atom<string | null>(null)

// Two-factor authentication setup
export const twoFactorSetupAtom = atom<TwoFactorSetup>({
  enabled: false,
})

// Current user's permissions (derived from roles)
export const currentUserPermissionsAtom = atom<Permission[]>((get) => {
  const currentUser = get(currentUserAtom)
  const roles = get(rolesAtom)

  if (!currentUser) return []

  const userRoles = roles.filter((role) => currentUser.roleIds.includes(role.id))
  const permissions = new Set<Permission>()

  userRoles.forEach((role) => {
    role.permissions.forEach((permission) => {
      permissions.add(permission)
    })
  })

  return Array.from(permissions)
})

// Check if current user has a specific permission
export const hasPermissionAtom = atom((get) => (permission: Permission) => {
  const permissions = get(currentUserPermissionsAtom)
  return permissions.includes(permission) || permissions.includes('admin:full_access')
})

// Check if current user has admin access
export const isAdminAtom = atom((get) => {
  const permissions = get(currentUserPermissionsAtom)
  return permissions.includes('admin:full_access')
})

// Filtered and sorted users
export const filteredUsersAtom = atom((get) => {
  const users = get(usersAtom)
  const filters = get(userFiltersAtom)
  const sortConfig = get(userSortConfigAtom)

  const filtered = users.filter((user) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const searchableText = `${user.displayName} ${user.email} ${user.jobTitle || ''} ${user.department || ''}`.toLowerCase()
      if (!searchableText.includes(searchLower)) {
        return false
      }
    }

    // Role filter
    if (filters.roles.length > 0) {
      const hasMatchingRole = user.roleIds.some((roleId) => filters.roles.includes(roleId))
      if (!hasMatchingRole) {
        return false
      }
    }

    // Team filter
    if (filters.teams.length > 0) {
      const hasMatchingTeam = user.teamIds.some((teamId) => filters.teams.includes(teamId))
      if (!hasMatchingTeam) {
        return false
      }
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(user.status)) {
      return false
    }

    // Department filter
    if (filters.departments.length > 0 && user.department) {
      if (!filters.departments.includes(user.department)) {
        return false
      }
    }

    return true
  })

  // Sort
  filtered.sort((a, b) => {
    let aValue: string | number = ''
    let bValue: string | number = ''

    switch (sortConfig.field) {
      case 'displayName':
        aValue = a.displayName.toLowerCase()
        bValue = b.displayName.toLowerCase()
        break
      case 'email':
        aValue = a.email.toLowerCase()
        bValue = b.email.toLowerCase()
        break
      case 'lastActive':
        aValue = a.lastActive || ''
        bValue = b.lastActive || ''
        break
      case 'createdAt':
        aValue = a.createdAt
        bValue = b.createdAt
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
    }

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1
    }
    return 0
  })

  return filtered
})

// User statistics
export const userStatsAtom = atom((get) => {
  const users = get(usersAtom)

  return {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    inactive: users.filter((u) => u.status === 'inactive').length,
    invited: users.filter((u) => u.status === 'invited').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
  }
})

// Get users by role
export const getUsersByRoleAtom = atom((get) => (roleId: string) => {
  const users = get(usersAtom)
  return users.filter((user) => user.roleIds.includes(roleId))
})

// Get users by team
export const getUsersByTeamAtom = atom((get) => (teamId: string) => {
  const users = get(usersAtom)
  return users.filter((user) => user.teamIds.includes(teamId))
})
