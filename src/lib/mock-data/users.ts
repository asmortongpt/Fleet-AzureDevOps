/**
 * Mock Data for User Management
 * Sample users, roles, permissions, teams, sessions, and login history
 */

import type {
  User,
  Role,
  Team,
  Permission,
  PermissionGroup,
  ActiveSession,
  LoginHistoryEntry,
} from '@/types/user-management'

/* ============================================================
   PERMISSION GROUPS
   ============================================================ */

export const permissionGroups: PermissionGroup[] = [
  {
    id: 'fleet',
    name: 'Fleet Management',
    description: 'Permissions for managing fleet operations',
    permissions: ['fleet:view', 'fleet:create', 'fleet:edit', 'fleet:delete', 'fleet:export'],
  },
  {
    id: 'vehicles',
    name: 'Vehicle Management',
    description: 'Permissions for managing vehicles',
    permissions: [
      'vehicles:view',
      'vehicles:create',
      'vehicles:edit',
      'vehicles:delete',
      'vehicles:export',
    ],
  },
  {
    id: 'reports',
    name: 'Reports',
    description: 'Permissions for viewing and managing reports',
    permissions: [
      'reports:view',
      'reports:create',
      'reports:edit',
      'reports:delete',
      'reports:export',
    ],
  },
  {
    id: 'users',
    name: 'User Management',
    description: 'Permissions for managing users',
    permissions: ['users:view', 'users:create', 'users:edit', 'users:delete', 'users:export'],
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Permissions for managing system settings',
    permissions: ['settings:view', 'settings:edit'],
  },
  {
    id: 'admin',
    name: 'Administration',
    description: 'Administrative permissions',
    permissions: [
      'admin:full_access',
      'admin:manage_roles',
      'admin:manage_teams',
      'admin:view_audit_logs',
      'admin:manage_security',
    ],
  },
]

/* ============================================================
   ROLES
   ============================================================ */

export const mockRoles: Role[] = [
  {
    id: 'role-admin',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: ['admin:full_access'] as Permission[],
    userCount: 3,
    isSystemRole: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role-fleet-manager',
    name: 'Fleet Manager',
    description: 'Manage fleet operations, vehicles, and reports',
    permissions: [
      'fleet:view',
      'fleet:create',
      'fleet:edit',
      'fleet:export',
      'vehicles:view',
      'vehicles:create',
      'vehicles:edit',
      'vehicles:export',
      'reports:view',
      'reports:create',
      'reports:export',
      'settings:view',
    ] as Permission[],
    userCount: 8,
    isSystemRole: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role-dispatcher',
    name: 'Dispatcher',
    description: 'Dispatch vehicles and manage routes',
    permissions: [
      'fleet:view',
      'fleet:edit',
      'vehicles:view',
      'vehicles:edit',
      'reports:view',
    ] as Permission[],
    userCount: 12,
    isSystemRole: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role-driver',
    name: 'Driver',
    description: 'View assigned vehicles and submit reports',
    permissions: ['fleet:view', 'vehicles:view', 'reports:view', 'reports:create'] as Permission[],
    userCount: 45,
    isSystemRole: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role-viewer',
    name: 'Viewer',
    description: 'Read-only access to fleet and reports',
    permissions: ['fleet:view', 'vehicles:view', 'reports:view'] as Permission[],
    userCount: 15,
    isSystemRole: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
]

/* ============================================================
   TEAMS
   ============================================================ */

export const mockTeams: Team[] = [
  {
    id: 'team-executive',
    name: 'Executive Team',
    description: 'Executive leadership',
    memberIds: ['user-1', 'user-2'],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'team-operations',
    name: 'Operations',
    description: 'Fleet operations management',
    teamLeadId: 'user-3',
    memberIds: ['user-3', 'user-4', 'user-5', 'user-6'],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'team-dispatch-north',
    name: 'North Region Dispatch',
    description: 'Dispatch team for northern region',
    parentTeamId: 'team-operations',
    teamLeadId: 'user-7',
    memberIds: ['user-7', 'user-8', 'user-9', 'user-10'],
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'team-dispatch-south',
    name: 'South Region Dispatch',
    description: 'Dispatch team for southern region',
    parentTeamId: 'team-operations',
    teamLeadId: 'user-11',
    memberIds: ['user-11', 'user-12', 'user-13', 'user-14'],
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'team-drivers-north',
    name: 'North Region Drivers',
    description: 'Driver pool for northern region',
    parentTeamId: 'team-dispatch-north',
    teamLeadId: 'user-7',
    memberIds: Array.from({ length: 20 }, (_, i) => `user-${15 + i}`),
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'team-drivers-south',
    name: 'South Region Drivers',
    description: 'Driver pool for southern region',
    parentTeamId: 'team-dispatch-south',
    teamLeadId: 'user-11',
    memberIds: Array.from({ length: 25 }, (_, i) => `user-${35 + i}`),
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'team-maintenance',
    name: 'Maintenance Team',
    description: 'Vehicle maintenance and repair',
    teamLeadId: 'user-60',
    memberIds: ['user-60', 'user-61', 'user-62', 'user-63'],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'team-analytics',
    name: 'Analytics Team',
    description: 'Data analysis and reporting',
    teamLeadId: 'user-64',
    memberIds: ['user-64', 'user-65', 'user-66'],
    createdAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'team-safety',
    name: 'Safety & Compliance',
    description: 'Safety protocols and regulatory compliance',
    teamLeadId: 'user-67',
    memberIds: ['user-67', 'user-68', 'user-69'],
    createdAt: '2024-01-05T00:00:00Z',
  },
  {
    id: 'team-it',
    name: 'IT Support',
    description: 'Technical support and system administration',
    teamLeadId: 'user-1',
    memberIds: ['user-1', 'user-70', 'user-71'],
    createdAt: '2024-01-01T00:00:00Z',
  },
]

/* ============================================================
   USERS
   ============================================================ */

const departments = [
  'Operations',
  'Dispatch',
  'Maintenance',
  'Analytics',
  'Safety',
  'IT',
  'Executive',
  'Human Resources',
  'Finance',
]

const firstNames = [
  'John',
  'Jane',
  'Michael',
  'Sarah',
  'David',
  'Emily',
  'Robert',
  'Lisa',
  'William',
  'Jennifer',
  'James',
  'Mary',
  'Christopher',
  'Patricia',
  'Daniel',
  'Linda',
  'Matthew',
  'Barbara',
  'Anthony',
  'Elizabeth',
]

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
]

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@fleetmanager.com',
    emailVerified: true,
    displayName: 'System Administrator',
    firstName: 'Admin',
    lastName: 'User',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    jobTitle: 'System Administrator',
    department: 'IT',
    phone: '+1 (555) 000-0001',
    bio: 'System administrator with full access to all features',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/adminuser',
    },
    roleIds: ['role-admin'],
    teamIds: ['team-executive', 'team-it'],
    status: 'active',
    lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'director@fleetmanager.com',
    emailVerified: true,
    displayName: 'Fleet Director',
    firstName: 'Sarah',
    lastName: 'Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    jobTitle: 'Director of Fleet Operations',
    department: 'Executive',
    phone: '+1 (555) 000-0002',
    bio: 'Overseeing all fleet operations and strategic planning',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/sarahjohnson',
    },
    roleIds: ['role-admin'],
    teamIds: ['team-executive'],
    status: 'active',
    lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z',
  },
  // Generate additional users
  ...Array.from({ length: 68 }, (_, i) => {
    const userId = `user-${i + 3}`
    const firstName = firstNames[i % firstNames.length] ?? 'Unknown'
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length] ?? 'User'
    const displayName = `${firstName} ${lastName}`
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@fleetmanager.com`
    const department = departments[i % departments.length]

    let roleIds: string[] = []
    let teamIds: string[] = []
    let jobTitle = ''

    // Assign roles based on user index
    if (i < 3) {
      roleIds = ['role-fleet-manager']
      teamIds = ['team-operations']
      jobTitle = 'Fleet Manager'
    } else if (i < 13) {
      roleIds = ['role-dispatcher']
      teamIds = i < 8 ? ['team-dispatch-north'] : ['team-dispatch-south']
      jobTitle = 'Dispatcher'
    } else if (i < 53) {
      roleIds = ['role-driver']
      teamIds = i < 33 ? ['team-drivers-north'] : ['team-drivers-south']
      jobTitle = 'Driver'
    } else if (i < 57) {
      roleIds = ['role-fleet-manager']
      teamIds = ['team-maintenance']
      jobTitle = 'Maintenance Manager'
    } else if (i < 60) {
      roleIds = ['role-viewer']
      teamIds = ['team-analytics']
      jobTitle = 'Data Analyst'
    } else if (i < 63) {
      roleIds = ['role-fleet-manager']
      teamIds = ['team-safety']
      jobTitle = 'Safety Officer'
    } else {
      roleIds = ['role-viewer']
      jobTitle = 'Support Staff'
    }

    // Determine status
    let status: User['status'] = 'active'
    if (i % 20 === 0) status = 'inactive'
    if (i % 23 === 0) status = 'invited'
    if (i % 31 === 0) status = 'suspended'

    const daysAgo = Math.floor(Math.random() * 90)
    const hoursAgo = Math.floor(Math.random() * 24)

    return {
      id: userId,
      email,
      emailVerified: status !== 'invited',
      displayName,
      firstName,
      lastName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${i}`,
      jobTitle,
      department,
      phone: `+1 (555) ${String(i).padStart(3, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      bio: `${jobTitle} with ${Math.floor(Math.random() * 10) + 1} years of experience in fleet management`,
      roleIds,
      teamIds,
      status,
      lastActive:
        status === 'active'
          ? new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()
          : undefined,
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    } as User
  }),
]

/* ============================================================
   ACTIVE SESSIONS
   ============================================================ */

export const mockActiveSessions: ActiveSession[] = [
  {
    id: 'session-1',
    userId: 'user-1',
    deviceType: 'Desktop',
    deviceOS: 'Windows 11',
    browser: 'Chrome',
    browserVersion: '120.0.0',
    ipAddress: '192.168.1.100',
    location: {
      city: 'New York',
      region: 'NY',
      country: 'United States',
      countryCode: 'US',
    },
    lastActive: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'session-2',
    userId: 'user-1',
    deviceType: 'Mobile',
    deviceOS: 'iOS 17.2',
    browser: 'Safari',
    browserVersion: '17.2',
    ipAddress: '192.168.1.101',
    location: {
      city: 'New York',
      region: 'NY',
      country: 'United States',
      countryCode: 'US',
    },
    lastActive: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'session-3',
    userId: 'user-1',
    deviceType: 'Tablet',
    deviceOS: 'iPad OS 17.2',
    browser: 'Safari',
    browserVersion: '17.2',
    ipAddress: '10.0.0.50',
    location: {
      city: 'Boston',
      region: 'MA',
      country: 'United States',
      countryCode: 'US',
    },
    lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

/* ============================================================
   LOGIN HISTORY
   ============================================================ */

export const mockLoginHistory: LoginHistoryEntry[] = Array.from({ length: 50 }, (_, i) => {
  const daysAgo = Math.floor(i / 2)
  const hoursAgo = (i % 2) * 12
  const status = i % 15 === 0 ? 'failed' : i % 25 === 0 ? 'blocked' : 'success'

  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge']
  const deviceTypes = ['Desktop', 'Mobile', 'Tablet']
  const cities = [
    'New York',
    'Los Angeles',
    'Chicago',
    'Houston',
    'Phoenix',
    'Philadelphia',
    'San Antonio',
    'San Diego',
  ]
  const regions = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA']

  return {
    id: `login-${i + 1}`,
    userId: 'user-1',
    timestamp: new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000).toISOString(),
    deviceType: deviceTypes[i % deviceTypes.length],
    deviceOS:
      deviceTypes[i % deviceTypes.length] === 'Mobile'
        ? i % 2 === 0
          ? 'iOS 17.2'
          : 'Android 14'
        : 'Windows 11',
    browser: browsers[i % browsers.length],
    ipAddress: `${192 + (i % 3)}.${168 + (i % 2)}.${1 + (i % 10)}.${100 + i}`,
    location: {
      city: cities[i % cities.length],
      region: regions[i % regions.length],
      country: 'United States',
      countryCode: 'US',
    },
    status,
    failureReason:
      status === 'failed'
        ? 'Invalid password'
        : status === 'blocked'
          ? 'Too many failed attempts'
          : undefined,
  } as LoginHistoryEntry
})