/**
 * Reactive State Management using Jotai
 * Global atoms for application-wide state
 */

import { atom } from 'jotai'

// Track unsaved changes in forms
export const hasUnsavedChangesAtom = atom(false)

// Track active modal state
export const activeModalAtom = atom<string | null>(null)

// Track loading states
export const globalLoadingAtom = atom(false)

// Track notification count
export const notificationCountAtom = atom(0)

// Track current theme
export const themeAtom = atom<'light' | 'dark'>('dark')

// Track sidebar open state
export const sidebarOpenAtom = atom(true)

// Track current user preferences
export const userPreferencesAtom = atom({
  emailNotifications: true,
  pushNotifications: true,
  maintenanceAlerts: true,
  fuelAlerts: true,
  language: 'en',
  timezone: 'America/New_York',
})

// Export all atoms
export const reactiveState = {
  hasUnsavedChangesAtom,
  activeModalAtom,
  globalLoadingAtom,
  notificationCountAtom,
  themeAtom,
  sidebarOpenAtom,
  userPreferencesAtom,
}

export default reactiveState
