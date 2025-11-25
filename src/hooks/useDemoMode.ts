// Demo Mode Hook
// Manages demo mode state, role switching, and demo user profiles

import { useState, useCallback } from 'react';import { useAuth } from './useAuth';
import logger from '@/utils/logger'

export type UserRole =
  | 'fleet_manager'
  | 'driver'
  | 'technician'
  | 'dispatcher'
  | 'safety_officer'
  | 'accountant'
  | 'admin';

interface DemoUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar: string;
}

// Demo user profiles for each role
const DEMO_USERS: Record<UserRole, DemoUserProfile> = {
  fleet_manager: {
    id: 'demo-fleet-manager',
    email: 'sarah.johnson@fleet.demo',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'fleet_manager',
    avatar: '/avatars/fleet-manager.png'
  },
  driver: {
    id: 'demo-driver',
    email: 'mike.rodriguez@fleet.demo',
    firstName: 'Mike',
    lastName: 'Rodriguez',
    role: 'driver',
    avatar: '/avatars/driver.png'
  },
  technician: {
    id: 'demo-technician',
    email: 'david.chen@fleet.demo',
    firstName: 'David',
    lastName: 'Chen',
    role: 'technician',
    avatar: '/avatars/technician.png'
  },
  dispatcher: {
    id: 'demo-dispatcher',
    email: 'lisa.martinez@fleet.demo',
    firstName: 'Lisa',
    lastName: 'Martinez',
    role: 'dispatcher',
    avatar: '/avatars/dispatcher.png'
  },
  safety_officer: {
    id: 'demo-safety-officer',
    email: 'james.wilson@fleet.demo',
    firstName: 'James',
    lastName: 'Wilson',
    role: 'safety_officer',
    avatar: '/avatars/safety-officer.png'
  },
  accountant: {
    id: 'demo-accountant',
    email: 'emily.taylor@fleet.demo',
    firstName: 'Emily',
    lastName: 'Taylor',
    role: 'accountant',
    avatar: '/avatars/accountant.png'
  },
  admin: {
    id: 'demo-admin',
    email: 'admin@fleet.demo',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    avatar: '/avatars/admin.png'
  }
};

export const useDemoMode = () => {
  const { setUser } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // Check localStorage for demo mode state
    return localStorage.getItem('demo_mode') === 'true';
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    // Check localStorage for saved role
    const savedRole = localStorage.getItem('demo_role') as UserRole;
    return savedRole || 'fleet_manager';
  });

  // Enable demo mode
  const enableDemoMode = useCallback((initialRole: UserRole = 'fleet_manager') => {
    setIsDemoMode(true);
    setCurrentRole(initialRole);
    localStorage.setItem('demo_mode', 'true');
    localStorage.setItem('demo_role', initialRole);

    // Set demo user in auth context
    const demoUser = DEMO_USERS[initialRole];
    setUser({
      ...demoUser,
      token: 'demo-token-' + demoUser.id
    });
  }, [setUser]);

  // Disable demo mode
  const disableDemoMode = useCallback(() => {
    setIsDemoMode(false);
    localStorage.removeItem('demo_mode');
    localStorage.removeItem('demo_role');

    // Clear demo user from auth context
    setUser(null);
  }, [setUser]);

  // Switch to a different role
  const switchRole = useCallback(async (newRole: UserRole) => {
    if (!isDemoMode) {
      logger.warn('Cannot switch roles outside of demo mode');
      return;
    }

    // Simulate API delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));

    setCurrentRole(newRole);
    localStorage.setItem('demo_role', newRole);

    // Update demo user in auth context
    const demoUser = DEMO_USERS[newRole];
    setUser({
      ...demoUser,
      token: 'demo-token-' + demoUser.id
    });
  }, [isDemoMode, setUser]);

  // Get current demo user
  const getCurrentDemoUser = useCallback(() => {
    return DEMO_USERS[currentRole];
  }, [currentRole]);

  // Check if specific role is active
  const isRole = useCallback((role: UserRole) => {
    return isDemoMode && currentRole === role;
  }, [isDemoMode, currentRole]);

  // Get permissions for current role
  const getPermissions = useCallback(() => {
    const rolePermissions: Record<UserRole, string[]> = {
      fleet_manager: ['vehicles.view', 'vehicles.create', 'vehicles.update', 'vehicles.delete', 'maintenance.view', 'maintenance.schedule', 'reports.view', 'reports.export', 'team.view'],
      driver: ['vehicles.view', 'inspections.create', 'routes.view', 'fuel.log', 'incidents.report'],
      technician: ['maintenance.view', 'maintenance.update', 'workorders.view', 'workorders.update', 'parts.view', 'parts.request'],
      dispatcher: ['vehicles.view', 'vehicles.track', 'routes.view', 'routes.assign', 'drivers.contact', 'emergency.respond'],
      safety_officer: ['incidents.view', 'incidents.investigate', 'training.view', 'training.assign', 'compliance.view', 'compliance.report', 'safety.metrics'],
      accountant: ['costs.view', 'costs.analyze', 'budgets.view', 'budgets.manage', 'invoices.view', 'invoices.process', 'reports.financial'],
      admin: ['*'] // Full access
    };

    return rolePermissions[currentRole] || [];
  }, [currentRole]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission: string) => {
    const permissions = getPermissions();
    return permissions.includes('*') || permissions.includes(permission);
  }, [getPermissions]);

  return {
    isDemoMode,
    currentRole,
    enableDemoMode,
    disableDemoMode,
    switchRole,
    getCurrentDemoUser,
    isRole,
    hasPermission,
    getPermissions,
    demoUsers: DEMO_USERS
  };
};
