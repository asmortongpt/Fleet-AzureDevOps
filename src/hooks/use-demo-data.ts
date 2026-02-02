import { useMemo } from 'react';
import { mockData } from '@/lib/mock-data';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export function useDemoData() {
  return useMemo(() => ({
    useMockData: USE_MOCK_DATA,
    mockData: USE_MOCK_DATA ? mockData : null,

    // Helper functions to get mock data
    getVehicles: () => USE_MOCK_DATA ? mockData.vehicles : null,
    getDrivers: () => USE_MOCK_DATA ? mockData.drivers : null,
    getWorkOrders: () => USE_MOCK_DATA ? mockData.workOrders : null,
    getAnalytics: () => USE_MOCK_DATA ? mockData.analytics : null,
    getCompliance: () => USE_MOCK_DATA ? mockData.compliance : null,
    getVehicleStats: () => USE_MOCK_DATA ? mockData.vehicleStats : null,
    getDriverStats: () => USE_MOCK_DATA ? mockData.driverStats : null,
    getMaintenanceStats: () => USE_MOCK_DATA ? mockData.maintenanceStats : null,
  }), []);
}

// Export mock data flag
export const useMockDataFlag = () => USE_MOCK_DATA;
