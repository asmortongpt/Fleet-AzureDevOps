/**
 * Recurring Maintenance Service (Stubbed for Build)
 */

export const processRecurringSchedules = async (tenantId: string, daysAhead: number): Promise<any> => {
  return { processed: 0, created: 0, errors: 0 };
};

export const getRecurringScheduleStats = async (tenantId: string): Promise<any> => {
  return {};
};

// Export interfaces if needed by other files (stubbed as empty for now)
export interface RecurringSchedule { }
export interface MaintenanceSchedule { }
