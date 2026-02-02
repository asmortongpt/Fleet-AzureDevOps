export const mockWorkOrders = [
  {
    id: 1,
    vehicle: 'Ram 1500 (FL-2024-203)',
    type: 'Oil Change',
    status: 'in_progress',
    priority: 'medium',
    scheduled_date: '2025-02-03',
    estimated_cost: 125.00,
    actual_cost: null,
    technician: 'Mike Torres',
    notes: 'Standard oil change and filter replacement'
  },
  {
    id: 2,
    vehicle: 'Chevrolet Silverado (FL-2023-102)',
    type: 'Tire Rotation',
    status: 'scheduled',
    priority: 'low',
    scheduled_date: '2025-02-10',
    estimated_cost: 80.00,
    actual_cost: null,
    technician: 'Sarah Martinez',
    notes: 'Rotate tires and check alignment'
  },
  {
    id: 3,
    vehicle: 'Ford F-150 (FL-2024-001)',
    type: 'Brake Inspection',
    status: 'completed',
    priority: 'high',
    scheduled_date: '2025-01-28',
    estimated_cost: 350.00,
    actual_cost: 385.50,
    technician: 'Mike Torres',
    notes: 'Replaced front brake pads'
  }
];

export const mockMaintenanceStats = {
  total_work_orders: 3,
  in_progress: 1,
  scheduled: 1,
  completed: 1,
  total_cost: 385.50,
  avg_completion_time: '2.5 days'
};
