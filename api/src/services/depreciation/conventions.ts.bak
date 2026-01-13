import { Convention } from "../../types";

export function monthsBetween(start: Date, end: Date) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

export function daysBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function conventionMonths(start: Date, end: Date, usefulLifeMonths: number, convention: Convention) {
  if (end < start) return 0;
  if (convention === "ACTUAL_DAYS") {
    const days = daysBetween(start, end) + 1;
    return Math.min(usefulLifeMonths, days / 30.4167); // avg month
  }
  if (convention === "HALF_MONTH") {
    const m = monthsBetween(start, end);
    return Math.min(usefulLifeMonths, m + 0.5);
  }
  // FULL_MONTH
  return Math.min(usefulLifeMonths, monthsBetween(start, end) + 1);
}
