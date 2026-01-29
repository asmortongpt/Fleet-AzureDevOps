export type InspectType =
  | "vehicle"
  | "driver"
  | "trip"
  | "route"
  | "alert"
  | "task"
  | "dispatch"
  | "maintenance"
  | "compliance-violation"
  | "safety-incident"
  | "safety-inspection"
  | "training-record"
  | "certification";

export type InspectTarget = {
  type: InspectType;
  id: string;
  tab?: string;
  focusMetric?: string;
};
