export type InspectType =
  | "vehicle"
  | "driver"
  | "trip"
  | "route"
  | "alert"
  | "task"
  | "dispatch"
  | "maintenance";

export type InspectTarget = {
  type: InspectType;
  id: string;
  tab?: string;
  focusMetric?: string;
};
