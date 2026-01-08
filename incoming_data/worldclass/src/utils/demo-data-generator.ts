/**
 * Shared utility functions for generating demo/mock data
 * Reduces duplication across data hooks like useFuelData, useMaintenanceData, etc.
 */

/**
 * Generate a random date within a range
 */
export function generateRandomDate(daysAgo: number, futureOffset: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo + futureOffset);
  return date.toISOString().split("T")[0] as string;
}

/**
 * Generate a range of dates for historical records
 */
export function generateDateRange(
  count: number,
  daysBetween: number = 3,
  startOffset: number = 0
): string[] {
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const daysAgo = startOffset + (count - i - 1) * daysBetween;
    dates.push(generateRandomDate(daysAgo));
  }
  return dates;
}

/**
 * Get a random item from an array
 */
export function randomItem<T>(array: T[]): T {
  const selected = array[Math.floor(Math.random() * array.length)];
  return selected as T;
}

/**
 * Generate a random number in a range
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float in a range
 */
export function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

/**
 * Generate unique IDs for records
 */
export function generateRecordId(prefix: string, index: number, subIndex: number): string {
  return `${prefix}-${index}-${subIndex}`;
}

/**
 * Sort records by date descending (most recent first)
 */
export function sortByDateDesc<T extends { date: string }>(records: T[]): T[] {
  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Calculate status based on date offset
 */
export function calculateStatus(
  daysOffset: number,
  options: {
    upcomingThreshold?: number;
    overdueThreshold?: number;
  } = {}
): 'upcoming' | 'overdue' | 'completed' {
  const { upcomingThreshold = 0, overdueThreshold = 60 } = options;

  if (daysOffset < upcomingThreshold) return 'upcoming';
  if (daysOffset > overdueThreshold) return 'overdue';
  return 'completed';
}

/**
 * Generate vehicle name from vehicle data
 */
export function formatVehicleName(vehicle: {
  year?: number | string;
  make: string;
  model: string;
}): string {
  return vehicle.year ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : `${vehicle.make} ${vehicle.model}`;
}

/**
 * Common locations for fuel/service records
 */
export const COMMON_LOCATIONS = [
  "Main Depot",
  "North Station",
  "South Station",
  "Highway 95",
  "Downtown",
  "East Side",
  "West Terminal",
  "Airport Hub"
];

/**
 * Common service types for maintenance
 */
export const COMMON_SERVICE_TYPES = [
  "Oil Change",
  "Tire Rotation",
  "Brake Service",
  "Engine Tune-up",
  "Transmission Service",
  "Battery Replacement",
  "Air Filter",
  "Inspection",
  "Alignment",
  "Coolant Flush"
];