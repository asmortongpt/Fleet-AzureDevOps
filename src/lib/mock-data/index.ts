import { mockVehicles, mockVehicleStats } from './vehicles';
import { mockDrivers, mockDriverStats } from './drivers';
import { mockWorkOrders, mockMaintenanceStats } from './maintenance';

export const mockData = {
  vehicles: mockVehicles,
  vehicleStats: mockVehicleStats,
  drivers: mockDrivers,
  driverStats: mockDriverStats,
  workOrders: mockWorkOrders,
  maintenanceStats: mockMaintenanceStats,

  // Analytics data
  analytics: {
    fuelCostTrend: [
      { month: 'Jan', cost: 1250 },
      { month: 'Feb', cost: 1180 },
      { month: 'Mar', cost: 1420 },
      { month: 'Apr', cost: 1350 },
      { month: 'May', cost: 1290 },
      { month: 'Jun', cost: 1380 }
    ],
    maintenanceCostTrend: [
      { month: 'Jan', cost: 850 },
      { month: 'Feb', cost: 920 },
      { month: 'Mar', cost: 780 },
      { month: 'Apr', cost: 1100 },
      { month: 'May', cost: 860 },
      { month: 'Jun', cost: 940 }
    ],
    utilizationRate: 85,
    avgMPG: 18.5,
    totalMiles: 87620
  },

  // Compliance data
  compliance: {
    inspections_due: 2,
    licenses_expiring: 1,
    registrations_due: 0,
    safety_violations: 3,
    compliance_rate: 94
  }
};

export { mockVehicles, mockVehicleStats, mockDrivers, mockDriverStats, mockWorkOrders, mockMaintenanceStats };
