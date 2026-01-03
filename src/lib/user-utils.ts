/**
 * User Management Utilities
 * Helper functions for users, roles, permissions, and teams
 */

import type { User, Role, Team, Permission, TeamNode } from '@/types/user-management'

/* ============================================================
   PERMISSION UTILITIES
   ============================================================ */

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  user: User | null,
  roles: Role[],
  permission: Permission
): boolean {
  if (!user) return false

  const userRoles = roles.filter((r) => user.roleIds.includes(r.id))
  const permissions = new Set<Permission>()

  userRoles.forEach((role) => {
    role.permissions.forEach((p) => permissions.add(p))
  })

  return permissions.has(permission) || permissions.has('admin:full_access')
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  user: User | null,
  roles: Role[],
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(user, roles, permission))
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  user: User | null,
  roles: Role[],
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(user, roles, permission))
}

/**
 * Check if a user can access a route based on required permissions
 */
export function canAccessRoute(
  user: User | null,
  roles: Role[],
  requiredPermissions: Permission[]
): boolean {
  if (!user) return false
  if (requiredPermissions.length === 0) return true
  return hasAllPermissions(user, roles, requiredPermissions)
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: User | null, roles: Role[]): Permission[] {
  if (!user) return []

  const userRoles = roles.filter((r) => user.roleIds.includes(r.id))
  const permissions = new Set<Permission>()

  userRoles.forEach((role) => {
    role.permissions.forEach((p) => permissions.add(p))
  })

  return Array.from(permissions)
}

/**
 * Check if a user is an admin
 */
export function isAdmin(user: User | null, roles: Role[]): boolean {
  return hasPermission(user, roles, 'admin:full_access')
}

/* ============================================================
   USER UTILITIES
   ============================================================ */

/**
 * Get user initials from name
 */
export function getUserInitials(user: User): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }
  return user.displayName.slice(0, 2).toUpperCase()
}

/**
 * Get color for user status badge
 */
export function getUserStatusColor(status: User['status']): string {
  switch (status) {
    case 'active':
      return 'green'
    case 'inactive':
      return 'gray'
    case 'invited':
      return 'blue'
    case 'suspended':
      return 'red'
    default:
      return 'gray'
  }
}

/**
 * Format last active time in relative format
 */
export function formatLastActive(lastActive: string | undefined): string {
  if (!lastActive) return 'Never'

  const now = new Date()
  const then = new Date(lastActive)
  const diffMinutes = Math.floor((now.getTime() - then.getTime()) / 60000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
  return `${Math.floor(diffMinutes / 1440)}d ago`
}

/**
 * Get user's full name
 */
export function getUserFullName(user: User): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`
  }
  return user.displayName
}

/**
 * Format user for display (e.g., in dropdowns)
 */
export function formatUserDisplay(user: User): string {
  return `${user.displayName} (${user.email})`
}

/* ============================================================
   ROLE UTILITIES
   ============================================================ */

/**
 * Get role by ID
 */
export function getRoleById(roles: Role[], roleId: string): Role | undefined {
  return roles.find((r) => r.id === roleId)
}

/**
 * Get role names for a user
 */
export function getUserRoleNames(user: User, roles: Role[]): string[] {
  return user.roleIds.map((roleId) => getRoleById(roles, roleId)?.name).filter(Boolean) as string[]
}

/**
 * Check if role is a system role (cannot be deleted)
 */
export function isSystemRole(role: Role): boolean {
  return role.isSystemRole
}

/* ============================================================
   TEAM UTILITIES
   ============================================================ */

/**
 * Build team hierarchy tree from flat list
 */
export function buildTeamTree(teams: Team[]): TeamNode[] {
  const teamMap = new Map<string, TeamNode>()
  const rootTeams: TeamNode[] = []

  // Create nodes
  teams.forEach((team) => {
    teamMap.set(team.id, { ...team, children: [] })
  })

  // Build tree structure
  teams.forEach((team) => {
    const node = teamMap.get(team.id)!

    if (team.parentTeamId) {
      const parent = teamMap.get(team.parentTeamId)
      if (parent) {
        parent.children.push(node)
      } else {
        rootTeams.push(node)
      }
    } else {
      rootTeams.push(node)
    }
  })

  return rootTeams
}

/**
 * Get all descendant team IDs (recursive)
 */
export function getDescendantTeamIds(teamId: string, teams: Team[]): string[] {
  const descendants: string[] = []
  const children = teams.filter((t) => t.parentTeamId === teamId)

  children.forEach((child) => {
    descendants.push(child.id)
    descendants.push(...getDescendantTeamIds(child.id, teams))
  })

  return descendants
}

/**
 * Get all ancestor team IDs (recursive)
 */
export function getAncestorTeamIds(teamId: string, teams: Team[]): string[] {
  const ancestors: string[] = []
  const team = teams.find((t) => t.id === teamId)

  if (team?.parentTeamId) {
    ancestors.push(team.parentTeamId)
    ancestors.push(...getAncestorTeamIds(team.parentTeamId, teams))
  }

  return ancestors
}

/**
 * Get team path (breadcrumb) from root to team
 */
export function getTeamPath(teamId: string, teams: Team[]): Team[] {
  const path: Team[] = []
  let currentTeam = teams.find((t) => t.id === teamId)

  while (currentTeam) {
    path.unshift(currentTeam)
    currentTeam = currentTeam.parentTeamId
      ? teams.find((t) => t.id === currentTeam!.parentTeamId)
      : undefined
  }

  return path
}

/**
 * Get team depth level in hierarchy
 */
export function getTeamDepth(teamId: string, teams: Team[]): number {
  return getAncestorTeamIds(teamId, teams).length
}

/**
 * Check if team has children
 */
export function hasChildTeams(teamId: string, teams: Team[]): boolean {
  return teams.some((t) => t.parentTeamId === teamId)
}

/**
 * Get team member count (including descendants)
 */
export function getTeamMemberCount(teamId: string, teams: Team[], includeDescendants = false): number {
  const team = teams.find((t) => t.id === teamId)
  if (!team) return 0

  let count = team.memberIds.length

  if (includeDescendants) {
    const descendantIds = getDescendantTeamIds(teamId, teams)
    descendantIds.forEach((descendantId) => {
      const descendant = teams.find((t) => t.id === descendantId)
      if (descendant) {
        count += descendant.memberIds.length
      }
    })
  }

  return count
}

/* ============================================================
   VALIDATION UTILITIES
   ============================================================ */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone format (E.164)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone)
}

/**
 * Check password strength
 */
export function getPasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4 | 5
  feedback: string[]
} {
  const feedback: string[] = []
  let score: 0 | 1 | 2 | 3 | 4 | 5 = 0

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters')
    return { score, feedback }
  }

  if (password.length >= 12) score = (score + 1) as 0 | 1 | 2 | 3 | 4 | 5
  if (/[a-z]/.test(password)) score = (score + 1) as 0 | 1 | 2 | 3 | 4 | 5
  if (/[A-Z]/.test(password)) score = (score + 1) as 0 | 1 | 2 | 3 | 4 | 5
  if (/[0-9]/.test(password)) score = (score + 1) as 0 | 1 | 2 | 3 | 4 | 5
  if (/[^A-Za-z0-9]/.test(password)) score = (score + 1) as 0 | 1 | 2 | 3 | 4 | 5

  if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters')
  if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters')
  if (/[0-9]/.test(password)) feedback.push('Add numbers')
  if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Add special characters')

  return { score, feedback }
}

/* ============================================================
   FORMATTING UTILITIES
   ============================================================ */

/**
 * Format date in locale format
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format datetime in locale format
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date

  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  return formatDate(d)
}

/* ============================================================
   EXPORT CSV UTILITIES
   ============================================================ */

/**
 * Export users to CSV
 */
export function exportUsersToCSV(users: User[], filename = 'users.csv'): void {
  const headers = [
    'ID',
    'Display Name',
    'Email',
    'Status',
    'Job Title',
    'Department',
    'Phone',
    'Created At',
    'Last Active',
  ]

  const rows = users.map((user) => [
    user.id,
    user.displayName,
    user.email,
    user.status,
    user.jobTitle || '',
    user.department || '',
    user.phone || '',
    formatDate(user.createdAt),
    user.lastActive ? formatDateTime(user.lastActive) : 'Never',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
