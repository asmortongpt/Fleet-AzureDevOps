/**
 * Field Whitelists for Mass Assignment Protection
 *
 * Defines allowed fields for INSERT and UPDATE operations per resource type.
 * Prevents users from setting protected fields like role, tenant_id, approval fields, etc.
 *
 * Protected fields are never allowed in user input:
 * - id, tenant_id (system-controlled)
 * - created_at, updated_at, created_by, updated_by (audit fields)
 * - approved_by, approved_at, certified_by, certified_at (workflow fields)
 * - role, is_admin, is_active (privilege fields)
 * - password_hash (security fields)
 */

export interface ResourceWhitelist {
  // Fields allowed when creating a new resource
  create: string[]
  // Fields allowed when updating an existing resource
  update: string[]
}

/**
 * Field whitelists per resource type
 */
export const FIELD_WHITELISTS: Record<string, ResourceWhitelist> = {
  // Users table
  users: {
    create: [
      'email',
      'first_name',
      'last_name',
      'phone',
      'department',
      'job_title',
      'employee_id',
      'license_number',
      'license_state',
      'license_expiry',
      'hire_date',
      'emergency_contact',
      'emergency_phone',
      'address',
      'city',
      'state',
      'zip_code'
      // NOT ALLOWED: role, is_admin, tenant_id, password_hash, is_active,
      // failed_login_attempts, account_locked_until, certified_by, certified_at
    ],
    update: [
      'first_name',
      'last_name',
      'phone',
      'department',
      'job_title',
      'employee_id',
      'license_number',
      'license_state',
      'license_expiry',
      'emergency_contact',
      'emergency_phone',
      'address',
      'city',
      'state',
      'zip_code'
      // NOT ALLOWED: email, role, is_admin, tenant_id, password_hash, is_active,
      // failed_login_attempts, account_locked_until, certified_by, certified_at
    ]
  },

  // Vehicles table
  vehicles: {
    create: [
      'vin',
      'make',
      'model',
      'year',
      'license_plate',
      'license_state',
      'vehicle_type',
      'fuel_type',
      'color',
      'current_mileage',
      'purchase_date',
      'purchase_price',
      'department',
      'location',
      'notes',
      'engine_type',
      'transmission',
      'seating_capacity',
      // Multi-asset fields
      'asset_category',
      'asset_type',
      'power_type',
      'operational_status',
      'primary_metric',
      'is_road_legal',
      'location_id',
      'group_id',
      'fleet_id'
      // NOT ALLOWED: tenant_id, assigned_driver_id, status (workflow)
    ],
    update: [
      'make',
      'model',
      'year',
      'license_plate',
      'license_state',
      'vehicle_type',
      'fuel_type',
      'color',
      'current_mileage',
      'department',
      'location',
      'notes',
      'engine_type',
      'transmission',
      'seating_capacity',
      // Multi-asset fields
      'asset_category',
      'asset_type',
      'power_type',
      'operational_status',
      'primary_metric',
      'is_road_legal',
      'location_id',
      'group_id',
      'fleet_id'
      // NOT ALLOWED: vin (immutable), tenant_id, assigned_driver_id, status
    ]
  },

  // Vendors table
  vendors: {
    create: [
      'name',
      'contact_name',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'zip_code',
      'website',
      'vendor_type',
      'payment_terms',
      'tax_id',
      'notes',
      'primary_contact',
      'secondary_contact',
      'preferred_payment_method'
      // NOT ALLOWED: tenant_id, is_active, approved_by, approved_at
    ],
    update: [
      'name',
      'contact_name',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'zip_code',
      'website',
      'vendor_type',
      'payment_terms',
      'tax_id',
      'notes',
      'primary_contact',
      'secondary_contact',
      'preferred_payment_method'
      // NOT ALLOWED: tenant_id, is_active, approved_by, approved_at
    ]
  },

  // Purchase Orders table
  purchase_orders: {
    create: [
      'vendor_id',
      'order_number',
      'description',
      'total_amount',
      'currency',
      'due_date',
      'shipping_address',
      'billing_address',
      'notes',
      'line_items',
      'tax_amount',
      'shipping_amount',
      'priority'
      // NOT ALLOWED: status, tenant_id, approved_by, approved_at, created_by
    ],
    update: [
      'vendor_id',
      'order_number',
      'description',
      'total_amount',
      'currency',
      'due_date',
      'shipping_address',
      'billing_address',
      'notes',
      'line_items',
      'tax_amount',
      'shipping_amount',
      'priority'
      // NOT ALLOWED: status, tenant_id, approved_by, approved_at, created_by
    ]
  },

  // Inspections table
  inspections: {
    create: [
      'vehicle_id',
      'inspector_id',
      'inspection_type',
      'inspection_date',
      'mileage',
      'location',
      'notes',
      'inspection_items',
      'defects_found',
      'maintenance_required'
      // NOT ALLOWED: status, tenant_id, approved_by, approved_at
    ],
    update: [
      'inspection_type',
      'inspection_date',
      'mileage',
      'location',
      'notes',
      'inspection_items',
      'defects_found',
      'maintenance_required'
      // NOT ALLOWED: vehicle_id, inspector_id, status, tenant_id, approved_by, approved_at
    ]
  },

  // Maintenance Schedules table
  maintenance_schedules: {
    create: [
      'vehicle_id',
      'service_type',
      'description',
      'frequency_type',
      'frequency_value',
      'last_service_date',
      'last_service_mileage',
      'next_service_date',
      'next_service_mileage',
      'estimated_cost',
      'priority',
      'notes'
      // NOT ALLOWED: status, tenant_id, is_active
    ],
    update: [
      'service_type',
      'description',
      'frequency_type',
      'frequency_value',
      'last_service_date',
      'last_service_mileage',
      'next_service_date',
      'next_service_mileage',
      'estimated_cost',
      'priority',
      'notes'
      // NOT ALLOWED: vehicle_id, status, tenant_id, is_active
    ]
  },

  // Work Orders table
  work_orders: {
    create: [
      'vehicle_id',
      'title',
      'description',
      'priority',
      'due_date',
      'estimated_cost',
      'estimated_hours',
      'assigned_to',
      'parts_required',
      'notes'
      // NOT ALLOWED: status, tenant_id, approved_by, approved_at, completed_date, actual_cost
    ],
    update: [
      'title',
      'description',
      'priority',
      'due_date',
      'estimated_cost',
      'estimated_hours',
      'assigned_to',
      'parts_required',
      'notes'
      // NOT ALLOWED: vehicle_id, status, tenant_id, approved_by, approved_at, completed_date, actual_cost
    ]
  },

  // Fuel Transactions table
  fuel_transactions: {
    create: [
      'vehicle_id',
      'driver_id',
      'transaction_date',
      'gallons',
      'cost',
      'price_per_gallon',
      'mileage',
      'location',
      'fuel_type',
      'receipt_number',
      'notes'
      // NOT ALLOWED: tenant_id, card_number (PCI data)
    ],
    update: [
      'transaction_date',
      'gallons',
      'cost',
      'price_per_gallon',
      'mileage',
      'location',
      'fuel_type',
      'receipt_number',
      'notes'
      // NOT ALLOWED: vehicle_id, driver_id, tenant_id, card_number
    ]
  },

  // Safety Incidents table
  safety_incidents: {
    create: [
      'vehicle_id',
      'driver_id',
      'incident_date',
      'incident_type',
      'severity',
      'location',
      'description',
      'injuries',
      'property_damage',
      'police_report_number',
      'witness_names',
      'witness_contacts',
      'notes'
      // NOT ALLOWED: status, tenant_id, investigated_by, investigated_at
    ],
    update: [
      'incident_date',
      'incident_type',
      'severity',
      'location',
      'description',
      'injuries',
      'property_damage',
      'police_report_number',
      'witness_names',
      'witness_contacts',
      'notes'
      // NOT ALLOWED: vehicle_id, driver_id, status, tenant_id, investigated_by, investigated_at
    ]
  },

  // Geofences table
  geofences: {
    create: [
      'name',
      'description',
      'fence_type',
      'coordinates',
      'radius',
      'address',
      'city',
      'state',
      'zip_code',
      'is_active',
      'entry_notification',
      'exit_notification',
      'color'
      // NOT ALLOWED: tenant_id
    ],
    update: [
      'name',
      'description',
      'fence_type',
      'coordinates',
      'radius',
      'address',
      'city',
      'state',
      'zip_code',
      'is_active',
      'entry_notification',
      'exit_notification',
      'color'
      // NOT ALLOWED: tenant_id
    ]
  },

  // Facilities table
  facilities: {
    create: [
      'name',
      'facility_type',
      'address',
      'city',
      'state',
      'zip_code',
      'country',
      'latitude',
      'longitude',
      'capacity',
      'operating_hours',
      'contact_name',
      'contact_phone',
      'contact_email',
      'notes'
      // NOT ALLOWED: tenant_id, is_active
    ],
    update: [
      'name',
      'facility_type',
      'address',
      'city',
      'state',
      'zip_code',
      'country',
      'latitude',
      'longitude',
      'capacity',
      'operating_hours',
      'contact_name',
      'contact_phone',
      'contact_email',
      'notes'
      // NOT ALLOWED: tenant_id, is_active
    ]
  },

  // Charging Stations table
  charging_stations: {
    create: [
      'facility_id',
      'station_name',
      'station_type',
      'connector_type',
      'power_output',
      'voltage',
      'amperage',
      'status',
      'network_provider',
      'cost_per_kwh',
      'notes'
      // NOT ALLOWED: tenant_id
    ],
    update: [
      'facility_id',
      'station_name',
      'station_type',
      'connector_type',
      'power_output',
      'voltage',
      'amperage',
      'status',
      'network_provider',
      'cost_per_kwh',
      'notes'
      // NOT ALLOWED: tenant_id
    ]
  },

  // Policies table
  policies: {
    create: [
      'policy_name',
      'policy_type',
      'description',
      'effective_date',
      'expiry_date',
      'policy_document',
      'version',
      'notes'
      // NOT ALLOWED: tenant_id, approved_by, approved_at, is_active
    ],
    update: [
      'policy_name',
      'policy_type',
      'description',
      'effective_date',
      'expiry_date',
      'policy_document',
      'version',
      'notes'
      // NOT ALLOWED: tenant_id, approved_by, approved_at, is_active
    ]
  },

  // Policy Templates table
  policy_templates: {
    create: [
      'template_name',
      'category',
      'description',
      'template_content',
      'variables',
      'default_values',
      'version'
      // NOT ALLOWED: tenant_id, is_active
    ],
    update: [
      'template_name',
      'category',
      'description',
      'template_content',
      'variables',
      'default_values',
      'version'
      // NOT ALLOWED: tenant_id, is_active
    ]
  },

  // OSHA Compliance table
  osha_compliance: {
    create: [
      'vehicle_id',
      'inspection_date',
      'inspector_name',
      'compliance_type',
      'inspection_items',
      'violations_found',
      'corrective_actions',
      'next_inspection_date',
      'notes'
      // NOT ALLOWED: status, tenant_id, approved_by, approved_at
    ],
    update: [
      'inspection_date',
      'inspector_name',
      'compliance_type',
      'inspection_items',
      'violations_found',
      'corrective_actions',
      'next_inspection_date',
      'notes'
      // NOT ALLOWED: vehicle_id, status, tenant_id, approved_by, approved_at
    ]
  }
}

/**
 * Gets the whitelist for a specific resource and operation
 */
export function getWhitelist(resourceType: string, operation: 'create' | 'update'): string[] {
  const whitelist = FIELD_WHITELISTS[resourceType]
  if (!whitelist) {
    throw new Error(`No whitelist defined for resource type: ${resourceType}`)
  }
  return whitelist[operation]
}

/**
 * Filters an object to only include whitelisted fields
 */
export function filterToWhitelist(
  data: Record<string, any>,
  resourceType: string,
  operation: 'create' | 'update'
): Record<string, any> {
  const allowedFields = getWhitelist(resourceType, operation)
  const filtered: Record<string, any> = {}

  for (const field of allowedFields) {
    if (data.hasOwnProperty(field)) {
      filtered[field] = data[field]
    }
  }

  return filtered
}

/**
 * Validates that only whitelisted fields are present in the data
 * Throws error if forbidden fields are detected
 */
export function validateNoForbiddenFields(
  data: Record<string, any>,
  resourceType: string,
  operation: 'create' | 'update'
): void {
  const allowedFields = getWhitelist(resourceType, operation)
  const providedFields = Object.keys(data)
  const forbiddenFields = providedFields.filter(field => !allowedFields.includes(field))

  if (forbiddenFields.length > 0) {
    throw new Error(
      `Forbidden fields detected: ${forbiddenFields.join(', ')}. ` +
      `Allowed fields for ${operation} on ${resourceType}: ${allowedFields.join(', ')}`
    )
  }
}
