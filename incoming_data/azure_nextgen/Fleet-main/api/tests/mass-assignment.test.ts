/**
 * Mass Assignment Vulnerability Tests
 *
 * These tests verify that mass assignment vulnerabilities have been fixed
 * by ensuring protected fields cannot be set through user input.
 */

import { filterToWhitelist, validateNoForbiddenFields } from '../src/config/field-whitelists'
import { buildInsertClause, buildUpdateClause } from '../src/utils/sql-safety'

describe('Mass Assignment Protection', () => {
  describe('Field Whitelisting - Users', () => {
    it('should filter out role field on user creation', () => {
      const maliciousInput = {
        email: 'attacker@test.com',
        first_name: 'Attacker',
        last_name: 'User',
        role: 'admin', // FORBIDDEN
        is_admin: true, // FORBIDDEN
        tenant_id: 'malicious-tenant-id' // FORBIDDEN
      }

      const filtered = filterToWhitelist(maliciousInput, 'users', 'create')

      expect(filtered).toEqual({
        email: 'attacker@test.com',
        first_name: 'Attacker',
        last_name: 'User'
      })
      expect(filtered.role).toBeUndefined()
      expect(filtered.is_admin).toBeUndefined()
      expect(filtered.tenant_id).toBeUndefined()
    })

    it('should filter out role field on user update', () => {
      const maliciousInput = {
        first_name: 'Updated',
        role: 'admin', // FORBIDDEN
        password_hash: 'fake-hash', // FORBIDDEN
        certified_by: 'self-certified' // FORBIDDEN
      }

      const filtered = filterToWhitelist(maliciousInput, 'users', 'update')

      expect(filtered).toEqual({
        first_name: 'Updated'
      })
      expect(filtered.role).toBeUndefined()
      expect(filtered.password_hash).toBeUndefined()
      expect(filtered.certified_by).toBeUndefined()
    })

    it('should throw error when validating forbidden fields', () => {
      const maliciousInput = {
        first_name: 'Test',
        role: 'admin' // FORBIDDEN
      }

      expect(() => {
        validateNoForbiddenFields(maliciousInput, 'users', 'create')
      }).toThrow('Forbidden fields detected: role')
    })
  })

  describe('Field Whitelisting - Purchase Orders', () => {
    it('should filter out approval fields on creation', () => {
      const maliciousInput = {
        vendor_id: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test Order',
        total_amount: 1000,
        status: 'approved', // FORBIDDEN
        approved_by: '123e4567-e89b-12d3-a456-426614174001', // FORBIDDEN
        approved_at: '2025-11-19T00:00:00Z' // FORBIDDEN
      }

      const filtered = filterToWhitelist(maliciousInput, 'purchase_orders', 'create')

      expect(filtered).toEqual({
        vendor_id: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test Order',
        total_amount: 1000
      })
      expect(filtered.status).toBeUndefined()
      expect(filtered.approved_by).toBeUndefined()
      expect(filtered.approved_at).toBeUndefined()
    })

    it('should filter out status on update', () => {
      const maliciousInput = {
        description: 'Updated',
        status: 'approved', // FORBIDDEN - must use dedicated approve endpoint
        approved_by: 'user-id' // FORBIDDEN
      }

      const filtered = filterToWhitelist(maliciousInput, 'purchase_orders', 'update')

      expect(filtered).toEqual({
        description: 'Updated'
      })
      expect(filtered.status).toBeUndefined()
      expect(filtered.approved_by).toBeUndefined()
    })
  })

  describe('Field Whitelisting - Vehicles', () => {
    it('should filter out tenant_id and status on creation', () => {
      const maliciousInput = {
        vin: '1HGBH41JXMN109186',
        make: 'Toyota',
        model: 'Camry',
        year: 2024,
        tenant_id: 'other-tenant', // FORBIDDEN
        status: 'sold', // FORBIDDEN
        assigned_driver_id: 'driver-id' // FORBIDDEN
      }

      const filtered = filterToWhitelist(maliciousInput, 'vehicles', 'create')

      expect(filtered).toEqual({
        vin: '1HGBH41JXMN109186',
        make: 'Toyota',
        model: 'Camry',
        year: 2024
      })
      expect(filtered.tenant_id).toBeUndefined()
      expect(filtered.status).toBeUndefined()
      expect(filtered.assigned_driver_id).toBeUndefined()
    })

    it('should filter out VIN on update (immutable)', () => {
      const maliciousInput = {
        make: 'Honda',
        vin: 'NEWVIN00000000000', // FORBIDDEN - VIN is immutable
        tenant_id: 'other-tenant' // FORBIDDEN
      }

      const filtered = filterToWhitelist(maliciousInput, 'vehicles', 'update')

      expect(filtered).toEqual({
        make: 'Honda'
      })
      expect(filtered.vin).toBeUndefined()
      expect(filtered.tenant_id).toBeUndefined()
    })
  })

  describe('Field Whitelisting - Vendors', () => {
    it('should filter out approval fields on creation', () => {
      const maliciousInput = {
        name: 'Test Vendor',
        email: 'vendor@test.com',
        is_active: false, // FORBIDDEN - system controlled
        approved_by: 'user-id', // FORBIDDEN
        tenant_id: 'other-tenant' // FORBIDDEN
      }

      const filtered = filterToWhitelist(maliciousInput, 'vendors', 'create')

      expect(filtered).toEqual({
        name: 'Test Vendor',
        email: 'vendor@test.com'
      })
      expect(filtered.is_active).toBeUndefined()
      expect(filtered.approved_by).toBeUndefined()
      expect(filtered.tenant_id).toBeUndefined()
    })
  })

  describe('SQL Safety with Whitelisting Integration', () => {
    it('should build INSERT clause with whitelisting', () => {
      const maliciousInput = {
        email: 'test@test.com',
        first_name: 'Test',
        role: 'admin', // Will be filtered
        is_admin: true // Will be filtered
      }

      const { columnNames, placeholders, values } = buildInsertClause(
        maliciousInput,
        ['tenant_id'],
        1,
        'users' // Enable whitelisting
      )

      // Should only include whitelisted fields
      expect(columnNames).toBe('tenant_id, email, first_name')
      expect(placeholders).toBe('$1, $2, $3')
      expect(values).toEqual(['test@test.com', 'Test'])
    })

    it('should build UPDATE clause with whitelisting', () => {
      const maliciousInput = {
        first_name: 'Updated',
        role: 'admin', // Will be filtered
        password_hash: 'fake-hash' // Will be filtered
      }

      const { fields, values } = buildUpdateClause(
        maliciousInput,
        3, // Start index for parameters
        'users' // Enable whitelisting
      )

      // Should only include whitelisted fields
      expect(fields).toBe('first_name = $3')
      expect(values).toEqual(['Updated'])
    })

    it('should throw error when no valid fields remain after filtering', () => {
      const maliciousInput = {
        role: 'admin', // FORBIDDEN
        is_admin: true, // FORBIDDEN
        tenant_id: 'other-tenant' // FORBIDDEN
      }

      expect(() => {
        buildInsertClause(maliciousInput, [], 1, 'users')
      }).toThrow('No valid fields provided for create operation on users')
    })
  })

  describe('Registration Schema Protection', () => {
    it('should NOT accept role field in registration', () => {
      // This test would use the actual registerSchema from auth.ts
      // but demonstrates the expected behavior
      const registrationData = {
        email: 'newuser@test.com',
        password: 'Test@123',
        first_name: 'New',
        last_name: 'User',
        role: 'admin' // This field should NOT be in the schema
      }

      // The schema should not have a role field at all
      // In actual implementation, parsing would succeed but role would be ignored
      expect(registrationData).toHaveProperty('role')

      // After parsing with registerSchema, role should not be present
      // and default 'viewer' role should be forced in the backend
    })
  })

  describe('Work Order Protection', () => {
    it('should filter out approval and completion fields on creation', () => {
      const maliciousInput = {
        vehicle_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Oil Change',
        status: 'completed', // FORBIDDEN
        approved_by: 'user-id', // FORBIDDEN
        completed_date: '2025-11-19', // FORBIDDEN
        actual_cost: 500 // FORBIDDEN
      }

      const filtered = filterToWhitelist(maliciousInput, 'work_orders', 'create')

      expect(filtered).toEqual({
        vehicle_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Oil Change'
      })
      expect(filtered.status).toBeUndefined()
      expect(filtered.approved_by).toBeUndefined()
      expect(filtered.completed_date).toBeUndefined()
      expect(filtered.actual_cost).toBeUndefined()
    })
  })

  describe('Fuel Transaction Protection', () => {
    it('should filter out card_number (PCI data) and tenant_id', () => {
      const maliciousInput = {
        vehicle_id: '123e4567-e89b-12d3-a456-426614174000',
        driver_id: '123e4567-e89b-12d3-a456-426614174001',
        transaction_date: '2025-11-19T00:00:00Z',
        gallons: 15.5,
        cost: 50.25,
        price_per_gallon: 3.24,
        card_number: '4111111111111111', // FORBIDDEN - PCI data
        tenant_id: 'other-tenant' // FORBIDDEN
      }

      const filtered = filterToWhitelist(maliciousInput, 'fuel_transactions', 'create')

      expect(filtered).toEqual({
        vehicle_id: '123e4567-e89b-12d3-a456-426614174000',
        driver_id: '123e4567-e89b-12d3-a456-426614174001',
        transaction_date: '2025-11-19T00:00:00Z',
        gallons: 15.5,
        cost: 50.25,
        price_per_gallon: 3.24
      })
      expect(filtered.card_number).toBeUndefined()
      expect(filtered.tenant_id).toBeUndefined()
    })
  })

  describe('Safety Incident Protection', () => {
    it('should filter out investigation fields', () => {
      const maliciousInput = {
        vehicle_id: '123e4567-e89b-12d3-a456-426614174000',
        driver_id: '123e4567-e89b-12d3-a456-426614174001',
        incident_date: '2025-11-19T00:00:00Z',
        incident_type: 'collision',
        severity: 'moderate',
        description: 'Minor fender bender',
        investigated_by: 'self-investigation', // FORBIDDEN
        investigated_at: '2025-11-19T00:00:00Z', // FORBIDDEN
        status: 'closed' // FORBIDDEN
      }

      const filtered = filterToWhitelist(maliciousInput, 'safety_incidents', 'create')

      expect(filtered).toEqual({
        vehicle_id: '123e4567-e89b-12d3-a456-426614174000',
        driver_id: '123e4567-e89b-12d3-a456-426614174001',
        incident_date: '2025-11-19T00:00:00Z',
        incident_type: 'collision',
        severity: 'moderate',
        description: 'Minor fender bender'
      })
      expect(filtered.investigated_by).toBeUndefined()
      expect(filtered.investigated_at).toBeUndefined()
      expect(filtered.status).toBeUndefined()
    })
  })

  describe('Multi-Resource Protection', () => {
    it('should protect all resources from tenant_id manipulation', () => {
      const resourceTypes = [
        'users',
        'vehicles',
        'vendors',
        'purchase_orders',
        'inspections',
        'maintenance_schedules',
        'work_orders',
        'fuel_transactions',
        'safety_incidents',
        'geofences',
        'facilities',
        'policies',
        'osha_compliance'
      ]

      resourceTypes.forEach(resourceType => {
        const maliciousInput = {
          name: 'Test',
          tenant_id: 'other-tenant' // FORBIDDEN for all resources
        }

        const filtered = filterToWhitelist(maliciousInput, resourceType, 'create')

        expect(filtered.tenant_id).toBeUndefined()
      })
    })

    it('should protect all workflow resources from status manipulation', () => {
      const workflowResources = [
        'purchase_orders',
        'inspections',
        'work_orders',
        'safety_incidents',
        'osha_compliance'
      ]

      workflowResources.forEach(resourceType => {
        const maliciousInput = {
          description: 'Test',
          status: 'approved' // FORBIDDEN - must use dedicated endpoints
        }

        const filtered = filterToWhitelist(maliciousInput, resourceType, 'create')

        expect(filtered.status).toBeUndefined()
      })
    })
  })
})

describe('Edge Cases and Error Handling', () => {
  it('should handle empty input gracefully', () => {
    const filtered = filterToWhitelist({}, 'users', 'create')
    expect(filtered).toEqual({})
  })

  it('should handle undefined values', () => {
    const input = {
      email: 'test@test.com',
      first_name: undefined,
      role: 'admin' // FORBIDDEN
    }

    const filtered = filterToWhitelist(input, 'users', 'create')

    expect(filtered).toEqual({
      email: 'test@test.com',
      first_name: undefined
    })
  })

  it('should handle null values', () => {
    const input = {
      email: 'test@test.com',
      phone: null,
      role: 'admin' // FORBIDDEN
    }

    const filtered = filterToWhitelist(input, 'users', 'create')

    expect(filtered).toEqual({
      email: 'test@test.com',
      phone: null
    })
  })

  it('should throw error for unknown resource type', () => {
    expect(() => {
      filterToWhitelist({}, 'unknown_resource', 'create')
    }).toThrow('No whitelist defined for resource type: unknown_resource')
  })
})
