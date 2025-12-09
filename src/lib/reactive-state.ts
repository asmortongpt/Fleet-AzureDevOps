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

// Export for compatibility
export default {
  themeAtom,
  userSettingsAtom,
};
