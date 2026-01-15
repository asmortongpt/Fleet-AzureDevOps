/**
 * User Management Type Definitions
 * Types for users, roles, permissions, teams, and security
 */

/* ============================================================
   USER TYPES
   ============================================================ */

export interface User {
  id: string
  email: string
  emailVerified: boolean
  displayName: string
  firstName?: string
  lastName?: string
  avatar?: string
  jobTitle?: string
  department?: string
  phone?: string
  bio?: string
  socialLinks?: {
    linkedin?: string
    github?: string
    twitter?: string
  }
  roleIds: string[]
  teamIds: string[]
  status: 'active' | 'inactive' | 'invited' | 'suspended'
  lastActive?: string
  createdAt: string
  updatedAt?: string
}

export interface UserFormData {
  displayName: string
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  jobTitle?: string
  department?: string
  bio?: string
  roleIds: string[]
  teamIds: string[]
  status: 'active' | 'inactive' | 'invited' | 'suspended'
}

/* ============================================================
   ROLE & PERMISSION TYPES
   ============================================================ */

export type Permission =
  // Fleet permissions
  | 'fleet:view'
  | 'fleet:create'
  | 'fleet:edit'
  | 'fleet:delete'
  | 'fleet:export'
  // Vehicle permissions
  | 'vehicles:view'
  | 'vehicles:create'
  | 'vehicles:edit'
  | 'vehicles:delete'
  | 'vehicles:export'
  // Reports permissions
  | 'reports:view'
  | 'reports:create'
  | 'reports:edit'
  | 'reports:delete'
  | 'reports:export'
  // Users permissions
  | 'users:view'
  | 'users:create'
  | 'users:edit'
  | 'users:delete'
  | 'users:export'
  // Settings permissions
  | 'settings:view'
  | 'settings:edit'
  // Admin permissions
  | 'admin:full_access'
  | 'admin:manage_roles'
  | 'admin:manage_teams'
  | 'admin:view_audit_logs'
  | 'admin:manage_security'

export interface PermissionGroup {
  id: string
  name: string
  description: string
  permissions: Permission[]
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  userCount: number
  isSystemRole: boolean
  createdAt: string
  updatedAt?: string
}

export interface RoleFormData {
  name: string
  description: string
  permissions: Permission[]
}

/* ============================================================
   TEAM TYPES
   ============================================================ */

export interface Team {
  id: string
  name: string
  description?: string
  parentTeamId?: string
  teamLeadId?: string
  memberIds: string[]
  permissions?: Permission[]
  createdAt: string
  updatedAt?: string
}

export interface TeamFormData {
  name: string
  description?: string
  parentTeamId?: string
  teamLeadId?: string
  memberIds: string[]
  permissions?: Permission[]
}

export interface TeamNode extends Team {
  children: TeamNode[]
}

/* ============================================================
   SECURITY TYPES
   ============================================================ */

export interface ActiveSession {
  id: string
  userId: string
  deviceType: string
  deviceOS: string
  browser: string
  browserVersion: string
  ipAddress: string
  location: {
    city: string
    region: string
    country: string
    countryCode: string
  }
  lastActive: string
  createdAt: string
}

export interface LoginHistoryEntry {
  id: string
  userId: string
  timestamp: string
  deviceType: string
  deviceOS: string
  browser: string
  ipAddress: string
  location: {
    city: string
    region: string
    country: string
    countryCode: string
  }
  status: 'success' | 'failed' | 'blocked'
  failureReason?: string
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4 | 5
  feedback: string[]
  requirements: {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecialChar: boolean
  }
}

export interface TwoFactorSetup {
  enabled: boolean
  secret?: string
  qrCode?: string
  backupCodes?: string[]
  verifiedAt?: string
}

/* ============================================================
   FILTER & SEARCH TYPES
   ============================================================ */

export interface UserFilters {
  search: string
  roles: string[]
  teams: string[]
  status: ('active' | 'inactive' | 'invited' | 'suspended')[]
  departments: string[]
}

export interface UserSortConfig {
  field: 'displayName' | 'email' | 'lastActive' | 'createdAt' | 'status'
  direction: 'asc' | 'desc'
}

/* ============================================================
   INVITATION TYPES
   ============================================================ */

export interface UserInvitation {
  email: string
  roleIds: string[]
  teamIds: string[]
  message?: string
  expiresAt?: string
}

export interface BulkInvitation {
  invitations: UserInvitation[]
  sendEmail: boolean
}

/* ============================================================
   ACTIVITY LOG TYPES
   ============================================================ */

export interface UserActivityEntry {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
  ipAddress: string
  timestamp: string
}

/* ============================================================
   API RESPONSE TYPES
   ============================================================ */

export interface UsersListResponse {
  users: User[]
  total: number
  page: number
  pageSize: number
}

export interface RolesListResponse {
  roles: Role[]
  total: number
}

export interface TeamsListResponse {
  teams: Team[]
  total: number
}

export interface SessionsListResponse {
  sessions: ActiveSession[]
  total: number
}

export interface LoginHistoryResponse {
  entries: LoginHistoryEntry[]
  total: number
  hasMore: boolean
}
