// Role Switcher Component for Demo Mode
// Allows users to toggle between different roles to see different perspectives

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemoMode } from '../../hooks/useDemoMode';
import { showToast } from '../../utils/toast';
import { trackEvent } from '../../utils/analytics';
import './RoleSwitcher.css';

export type UserRole =
  | 'fleet_manager'
  | 'driver'
  | 'technician'
  | 'dispatcher'
  | 'safety_officer'
  | 'accountant'
  | 'admin';

interface RoleConfig {
  id: UserRole;
  name: string;
  icon: string;
  color: string;
  description: string;
  features: string[];
  demoUser: {
    name: string;
    avatar: string;
    email: string;
  };
}

const ROLES: RoleConfig[] = [
  {
    id: 'fleet_manager',
    name: 'Fleet Manager',
    icon: '👔',
    color: '#3B82F6',
    description: 'Full fleet oversight and management',
    features: [
      'Vehicle Management',
      'Maintenance Scheduling',
      'Cost Analysis',
      'Team Oversight'
    ],
    demoUser: {
      name: 'Sarah Johnson',
      avatar: '/avatars/fleet-manager.png',
      email: 'sarah.johnson@fleet.demo'
    }
  },
  {
    id: 'driver',
    name: 'Driver',
    icon: '🚗',
    color: '#10B981',
    description: 'Mobile-first experience for daily operations',
    features: [
      'Pre-Trip Inspections',
      'Route Navigation',
      'Fuel Logging',
      'Incident Reporting'
    ],
    demoUser: {
      name: 'Mike Rodriguez',
      avatar: '/avatars/driver.png',
      email: 'mike.rodriguez@fleet.demo'
    }
  },
  {
    id: 'technician',
    name: 'Technician',
    icon: '🔧',
    color: '#F59E0B',
    description: 'Maintenance and repair workflow',
    features: [
      'Work Order Queue',
      'Parts Inventory',
      'Service History',
      'Diagnostic Tools'
    ],
    demoUser: {
      name: 'David Chen',
      avatar: '/avatars/technician.png',
      email: 'david.chen@fleet.demo'
    }
  },
  {
    id: 'dispatcher',
    name: 'Dispatcher',
    icon: '📍',
    color: '#8B5CF6',
    description: 'Real-time fleet coordination',
    features: [
      'Live Vehicle Tracking',
      'Route Assignment',
      'Driver Communication',
      'Emergency Response'
    ],
    demoUser: {
      name: 'Lisa Martinez',
      avatar: '/avatars/dispatcher.png',
      email: 'lisa.martinez@fleet.demo'
    }
  },
  {
    id: 'safety_officer',
    name: 'Safety Officer',
    icon: '🛡️',
    color: '#EF4444',
    description: 'Safety compliance and incident management',
    features: [
      'Incident Investigation',
      'Driver Training',
      'Compliance Reports',
      'Safety Metrics'
    ],
    demoUser: {
      name: 'James Wilson',
      avatar: '/avatars/safety-officer.png',
      email: 'james.wilson@fleet.demo'
    }
  },
  {
    id: 'accountant',
    name: 'Accountant',
    icon: '💰',
    color: '#06B6D4',
    description: 'Financial tracking and reporting',
    features: [
      'Cost Analysis',
      'Budget Management',
      'Invoice Processing',
      'Financial Reports'
    ],
    demoUser: {
      name: 'Emily Taylor',
      avatar: '/avatars/accountant.png',
      email: 'emily.taylor@fleet.demo'
    }
  },
  {
    id: 'admin',
    name: 'Admin',
    icon: '⚙️',
    color: '#6B7280',
    description: 'System configuration and user management',
    features: [
      'User Management',
      'System Settings',
      'Integration Setup',
      'Security Config'
    ],
    demoUser: {
      name: 'Admin User',
      avatar: '/avatars/admin.png',
      email: 'admin@fleet.demo'
    }
  }
];

export const RoleSwitcher: React.FC = () => {
  const { isDemoMode, currentRole, switchRole } = useDemoMode();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('fleet_manager');

  const currentRoleConfig = ROLES.find(r => r.id === currentRole) || ROLES[0];

  const handleRoleSwitch = async (newRole: UserRole) => {
    // Animate transition
    setIsOpen(false);

    // Show loading state
    showToast('Switching roles...', { duration: 1000, type: 'info' });

    // Switch role in demo mode
    await switchRole(newRole);

    // Show success message
    const newRoleConfig = ROLES.find(r => r.id === newRole)!;
    showToast(
      `Now viewing as ${newRoleConfig.name}`,
      {
        duration: 3000,
        type: 'success',
        icon: newRoleConfig.icon
      }
    );

    // Track analytics
    trackEvent('demo_role_switched', {
      from: currentRole,
      to: newRole
    });
  };

  // Only show in demo mode
  if (!isDemoMode) {
    return null;
  }

  return (
    <>
      {/* Floating Role Switcher Button */}
      <motion.div
        className="role-switcher-fab"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.5 }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="role-fab-button"
          style={{ backgroundColor: currentRoleConfig.color }}
          aria-label="Switch Role"
        >
          <span className="role-icon">{currentRoleConfig.icon}</span>
          <span className="role-label">{currentRoleConfig.name}</span>
          <span className="expand-icon">{isOpen ? '×' : '↕'}</span>
        </button>

        {/* Demo Mode Badge */}
        <div className="demo-badge">DEMO MODE</div>
      </motion.div>

      {/* Role Selection Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="role-switcher-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Role Grid */}
            <motion.div
              className="role-switcher-panel"
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="panel-header">
                <h3>Switch Role</h3>
                <p>Experience the app from different perspectives</p>
              </div>

              <div className="roles-grid">
                {ROLES.map((role) => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    isActive={currentRole === role.id}
                    onClick={() => handleRoleSwitch(role.id)}
                  />
                ))}
              </div>

              <div className="panel-footer">
                <button
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );
};

// Individual Role Card Component
const RoleCard: React.FC<{
  role: RoleConfig;
  isActive: boolean;
  onClick: () => void;
}> = ({ role, isActive, onClick }) => {
  return (
    <motion.div
      className={`role-card ${isActive ? 'active' : ''}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        borderColor: isActive ? role.color : 'transparent',
        backgroundColor: isActive ? `${role.color}10` : 'white'
      }}
    >
      {isActive && (
        <div className="active-badge">
          ✓ Current Role
        </div>
      )}

      <div className="role-icon-large" style={{ backgroundColor: `${role.color}20` }}>
        <span style={{ color: role.color }}>{role.icon}</span>
      </div>

      <h4>{role.name}</h4>
      <p className="role-description">{role.description}</p>

      <div className="role-features">
        {role.features.slice(0, 3).map((feature, index) => (
          <span key={index} className="feature-tag">
            {feature}
          </span>
        ))}
        {role.features.length > 3 && (
          <span className="feature-tag">+{role.features.length - 3} more</span>
        )}
      </div>

      <div className="demo-user-info">
        <img
          src={role.demoUser.avatar}
          alt={role.demoUser.name}
          className="user-avatar"
          onError={(e) => {
            // Fallback to emoji if image fails
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling!.style.display = 'flex';
          }}
        />
        <div className="user-avatar-fallback" style={{ display: 'none', backgroundColor: role.color }}>
          {role.icon}
        </div>
        <div className="user-details">
          <strong>{role.demoUser.name}</strong>
          <small>{role.demoUser.email}</small>
        </div>
      </div>

      {!isActive && (
        <button className="switch-btn">
          Switch to this role →
        </button>
      )}
    </motion.div>
  );
};

// Quick Role Switcher Dropdown (Navbar)
export const RoleSwitcherDropdown: React.FC = () => {
  const { isDemoMode, currentRole, switchRole } = useDemoMode();
  const [isOpen, setIsOpen] = useState(false);

  if (!isDemoMode) return null;

  const currentRoleConfig = ROLES.find(r => r.id === currentRole) || ROLES[0];

  return (
    <div className="role-switcher-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="role-dropdown-trigger"
      >
        <span className="role-icon-nav">{currentRoleConfig.icon}</span>
        <span>{currentRoleConfig.name}</span>
        <span className="dropdown-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="role-dropdown-menu">
          <div className="dropdown-header">
            <strong>Demo Mode</strong>
            <span className="demo-badge-small">DEMO</span>
          </div>

          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => {
                switchRole(role.id);
                setIsOpen(false);
              }}
              className={`role-dropdown-item ${currentRole === role.id ? 'active' : ''}`}
            >
              <span className="role-icon">{role.icon}</span>
              <div>
                <strong>{role.name}</strong>
                <small>{role.demoUser.name}</small>
              </div>
              {currentRole === role.id && <span className="checkmark">✓</span>}
            </button>
          ))}

          <div className="dropdown-footer">
            <a href="/help/demo-mode" target="_blank">
              Learn about Demo Mode →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// Keyboard Shortcut for Role Switching
export const useRoleSwitcherShortcut = () => {
  const { isDemoMode, currentRole, switchRole } = useDemoMode();

  useEffect(() => {
    if (!isDemoMode) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + R = Cycle through roles
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        const currentIndex = ROLES.findIndex(r => r.id === currentRole);
        const nextIndex = (currentIndex + 1) % ROLES.length;
        switchRole(ROLES[nextIndex].id);
      }

      // Ctrl/Cmd + Shift + [1-7] = Switch to specific role
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && /^[1-7]$/.test(e.key)) {
        e.preventDefault();
        const roleIndex = parseInt(e.key) - 1;
        if (ROLES[roleIndex]) {
          switchRole(ROLES[roleIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDemoMode, currentRole, switchRole]);
};

// Note: Toast and analytics are now imported from utils
