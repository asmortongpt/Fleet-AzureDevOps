/**
 * Global Application Store using Zustand
 * Provides centralized state management for the CTAFleet application
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  settingsOpen: boolean;
  loading: boolean;
  loadingMessage?: string;
}

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;

  // UI state
  ui: UIState;

  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;

  // Selected entities (for drilldown)
  selectedVehicleId: string | null;
  selectedDriverId: string | null;
  selectedWorkOrderId: string | null;

  // View preferences
  mapProvider: 'google' | 'azure' | 'leaflet';
  chartType: 'bar' | 'line' | 'area';
  dashboardLayout: 'default' | 'compact' | 'expanded';

  // Filters
  globalFilters: {
    dateRange: { start: string; end: string } | null;
    departments: string[];
    regions: string[];
    statuses: string[];
  };

  // Actions
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;

  // UI actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleSettings: () => void;
  setLoading: (loading: boolean, message?: string) => void;

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Selection actions
  selectVehicle: (id: string | null) => void;
  selectDriver: (id: string | null) => void;
  selectWorkOrder: (id: string | null) => void;
  clearSelections: () => void;

  // Preference actions
  setMapProvider: (provider: 'google' | 'azure' | 'leaflet') => void;
  setChartType: (type: 'bar' | 'line' | 'area') => void;
  setDashboardLayout: (layout: 'default' | 'compact' | 'expanded') => void;

  // Filter actions
  setGlobalFilters: (filters: Partial<AppState['globalFilters']>) => void;
  clearFilters: () => void;
}

const initialUIState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  settingsOpen: false,
  loading: false,
};

const initialGlobalFilters: AppState['globalFilters'] = {
  dateRange: null,
  departments: [],
  regions: [],
  statuses: [],
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        ui: initialUIState,
        notifications: [],
        unreadNotificationCount: 0,
        selectedVehicleId: null,
        selectedDriverId: null,
        selectedWorkOrderId: null,
        mapProvider: 'azure',
        chartType: 'bar',
        dashboardLayout: 'default',
        globalFilters: initialGlobalFilters,

        // User actions
        setUser: (user) => set({ user, isAuthenticated: !!user }),

        login: (user) => set({ user, isAuthenticated: true }),

        logout: () =>
          set({
            user: null,
            isAuthenticated: false,
            notifications: [],
            unreadNotificationCount: 0,
          }),

        // UI actions
        toggleSidebar: () =>
          set((state) => ({
            ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
          })),

        setSidebarOpen: (open) =>
          set((state) => ({
            ui: { ...state.ui, sidebarOpen: open },
          })),

        toggleSidebarCollapse: () =>
          set((state) => ({
            ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed },
          })),

        openCommandPalette: () =>
          set((state) => ({
            ui: { ...state.ui, commandPaletteOpen: true },
          })),

        closeCommandPalette: () =>
          set((state) => ({
            ui: { ...state.ui, commandPaletteOpen: false },
          })),

        toggleSettings: () =>
          set((state) => ({
            ui: { ...state.ui, settingsOpen: !state.ui.settingsOpen },
          })),

        setLoading: (loading, message) =>
          set((state) => ({
            ui: { ...state.ui, loading, loadingMessage: message },
          })),

        // Notification actions
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
            read: false,
          };

          set((state) => ({
            notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep max 50
            unreadNotificationCount: state.unreadNotificationCount + 1,
          }));
        },

        markNotificationAsRead: (id) =>
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1),
          })),

        markAllNotificationsAsRead: () =>
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadNotificationCount: 0,
          })),

        removeNotification: (id) =>
          set((state) => {
            const notification = state.notifications.find((n) => n.id === id);
            return {
              notifications: state.notifications.filter((n) => n.id !== id),
              unreadNotificationCount: notification && !notification.read
                ? Math.max(0, state.unreadNotificationCount - 1)
                : state.unreadNotificationCount,
            };
          }),

        clearNotifications: () =>
          set({ notifications: [], unreadNotificationCount: 0 }),

        // Selection actions
        selectVehicle: (id) => set({ selectedVehicleId: id }),
        selectDriver: (id) => set({ selectedDriverId: id }),
        selectWorkOrder: (id) => set({ selectedWorkOrderId: id }),

        clearSelections: () =>
          set({
            selectedVehicleId: null,
            selectedDriverId: null,
            selectedWorkOrderId: null,
          }),

        // Preference actions
        setMapProvider: (provider) => set({ mapProvider: provider }),
        setChartType: (type) => set({ chartType: type }),
        setDashboardLayout: (layout) => set({ dashboardLayout: layout }),

        // Filter actions
        setGlobalFilters: (filters) =>
          set((state) => ({
            globalFilters: { ...state.globalFilters, ...filters },
          })),

        clearFilters: () => set({ globalFilters: initialGlobalFilters }),
      }),
      {
        name: 'ctafleet-app-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist only specific parts of the state
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          mapProvider: state.mapProvider,
          chartType: state.chartType,
          dashboardLayout: state.dashboardLayout,
          ui: {
            sidebarCollapsed: state.ui.sidebarCollapsed,
          },
        }),
      }
    ),
    { name: 'CTAFleet App Store' }
  )
);

// Selectors for better performance
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useUnreadCount = () => useAppStore((state) => state.unreadNotificationCount);
export const useUIState = () => useAppStore((state) => state.ui);
export const useSelectedVehicle = () => useAppStore((state) => state.selectedVehicleId);
export const useGlobalFilters = () => useAppStore((state) => state.globalFilters);
