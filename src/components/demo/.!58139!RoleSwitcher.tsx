// Role Switcher Component for Demo Mode
// Allows users to toggle between different roles to see different perspectives

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';

import { useDemoMode } from '../../hooks/useDemoMode';
import { trackEvent } from '../../utils/analytics';
import { showToast } from '../../utils/toast';
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
