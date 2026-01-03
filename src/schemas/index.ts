/**
 * Form Validation Schemas Index
 *
 * Centralized export for all Zod validation schemas
 * Total: 123 validated fields across 4 major forms
 *
 * Usage:
 * ```tsx
 * import { vehicleSchema, type VehicleFormData } from '@/schemas'
 * ```
 */

// Vehicle Schema (47 fields)
export {
  vehicleSchema,
  vehicleUpdateSchema,
  vehicleSectionSchemas,
  vehicleBasicInfoSchema,
  vehicleSpecsSchema,
  vehicleMaintenanceSchema,
  vehicleTelematicsSchema,
  type VehicleFormData,
} from './vehicle.schema'

// Driver Schema (33 fields)
export {
  driverSchema,
  driverUpdateSchema,
  driverSectionSchemas,
  driverPersonalInfoSchema,
  driverLicenseSchema,
  driverEmploymentSchema,
  type DriverFormData,
  calculateDriverAge,
  isCDL,
  getDaysUntilExpiration,
} from './driver.schema'

// Work Order Schema (28 fields)
export {
  workOrderSchema,
  workOrderUpdateSchema,
  workOrderSectionSchemas,
  workOrderDetailsSchema,
  workOrderPartsLaborSchema,
  workOrderCompletionSchema,
  type WorkOrderFormData,
  calculateTotalCost,
  calculateLaborCost,
  isWorkOrderOverdue,
  getPriorityColor,
  generateWorkOrderNumber,
} from './work-order.schema'

// User Schema (15 fields + permissions)
export {
  userSchema,
  userUpdateSchema,
  passwordChangeSchema,
  userSectionSchemas,
  userDetailsSchema,
  userPermissionsSchema,
  type UserFormData,
  rolePermissions,
  getDefaultPermissionsForRole,
  hasPermission,
  validatePasswordStrength,
} from './user.schema'

// Total Fields Summary
export const SCHEMA_STATS = {
  vehicle: 47,
  driver: 33,
  workOrder: 28,
  user: 15,
  total: 123,
}
