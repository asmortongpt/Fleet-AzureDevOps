// Reactive state management for settings and user preferences
// This is a stub file - the actual implementation uses Jotai in specific components

import { atom } from 'jotai';

// Theme preference
export const themeAtom = atom<'light' | 'dark' | 'system'>('system');

// User settings
export const userSettingsAtom = atom({
  notifications: true,
  autoSave: true,
  compactMode: false,
});

// Track unsaved changes
export const hasUnsavedChangesAtom = atom(false);

// General settings
export const generalSettingsAtom = atom({
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
});

// Appearance settings
export const appearanceSettingsAtom = atom({
  theme: 'system' as 'light' | 'dark' | 'system',
  compactMode: false,
  fontSize: 'medium',
});

// Notification settings
export const notificationSettingsAtom = atom({
  email: true,
  push: true,
  sms: false,
});

// Security settings
export const securitySettingsAtom = atom({
  twoFactorEnabled: false,
  sessionTimeout: 30,
  ipWhitelist: [] as string[],
});

// Data privacy settings
export const dataPrivacySettingsAtom = atom({
  analyticsEnabled: true,
  shareData: false,
  dataRetentionDays: 90,
});

// Fleet settings
export const fleetSettingsAtom = atom({
  defaultView: 'map',
  autoRefresh: true,
  refreshInterval: 30,
});

// Advanced settings
export const advancedSettingsAtom = atom({
  debugMode: false,
  experimentalFeatures: false,
  apiTimeout: 30000,
});

// Current user
export const currentUserAtom = atom({
  id: '',
  name: '',
  email: '',
  avatar: '',
  role: 'user',
});

// Export for compatibility
export default {
  themeAtom,
  userSettingsAtom,
  hasUnsavedChangesAtom,
  generalSettingsAtom,
  appearanceSettingsAtom,
  notificationSettingsAtom,
  securitySettingsAtom,
  dataPrivacySettingsAtom,
  fleetSettingsAtom,
  advancedSettingsAtom,
  currentUserAtom,
};
