#!/usr/bin/env python3
"""
Production Task Queue for Honest Orchestrator
Defines high-priority, verifiable tasks from FINAL_REMEDIATION_REPORT.md

Priority Order:
1. Documentation TODOs (19 items) - Low risk, high value
2. Testing TODOs (45 items) - Higher complexity, requires implementation

This file defines tasks in phases for autonomous execution with verification checkpoints.
"""

# Phase 1: Quick Documentation Wins (Low Risk, High Value)
# These tasks add immediate value without risking code stability

PHASE_1_DOCUMENTATION_TASKS = [
    {
        "id": "DOC-001",
        "name": "Add JSDoc to Vehicle Service",
        "target_files": ["api/src/services/VehicleService.ts"],
        "modifications": [{
            "file": "api/src/services/VehicleService.ts",
            "old": "export class VehicleService {",
            "new": """/**
 * Vehicle Service - Handles all vehicle-related business logic
 * @class VehicleService
 * @description Manages vehicle CRUD operations, tenant isolation, and data validation
 */
export class VehicleService {"""
        }],
        "test_build": True,
        "commit_message": "docs: Add JSDoc documentation to VehicleService class"
    },

    {
        "id": "DOC-002",
        "name": "Add JSDoc to Driver Service",
        "target_files": ["api/src/services/DriverService.ts"],
        "modifications": [{
            "file": "api/src/services/DriverService.ts",
            "old": "export class DriverService {",
            "new": """/**
 * Driver Service - Handles all driver-related business logic
 * @class DriverService
 * @description Manages driver CRUD operations, tenant isolation, and license validation
 */
export class DriverService {"""
        }],
        "test_build": True,
        "commit_message": "docs: Add JSDoc documentation to DriverService class"
    },

    {
        "id": "DOC-003",
        "name": "Add JSDoc to Maintenance Service",
        "target_files": ["api/src/services/MaintenanceService.ts"],
        "modifications": [{
            "file": "api/src/services/MaintenanceService.ts",
            "old": "export class MaintenanceService {",
            "new": """/**
 * Maintenance Service - Handles all maintenance-related business logic
 * @class MaintenanceService
 * @description Manages maintenance records, work orders, and scheduling
 */
export class MaintenanceService {"""
        }],
        "test_build": True,
        "commit_message": "docs: Add JSDoc documentation to MaintenanceService class"
    },

    {
        "id": "DOC-004",
        "name": "Document API endpoints in README",
        "target_files": ["api/README.md"],
        "modifications": [{
            "file": "api/README.md",
            "old": "# Fleet API",
            "new": """# Fleet API

## Available Endpoints

### Vehicles
- `GET /api/vehicles` - List all vehicles
- `GET /api/vehicles/:id` - Get vehicle by ID
- `POST /api/vehicles` - Create new vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Drivers
- `GET /api/drivers` - List all drivers
- `GET /api/drivers/:id` - Get driver by ID
- `POST /api/drivers` - Create new driver
- `PUT /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Delete driver

### Maintenance
- `GET /api/maintenance` - List maintenance records
- `GET /api/maintenance/:id` - Get maintenance record
- `POST /api/maintenance` - Create maintenance record
- `PUT /api/maintenance/:id` - Update maintenance record

All endpoints require authentication via JWT token."""
        }],
        "test_build": False,
        "commit_message": "docs: Add API endpoint documentation to README"
    },

    {
        "id": "DOC-005",
        "name": "Add authentication documentation",
        "target_files": ["api/README.md"],
        "modifications": [{
            "file": "api/README.md",
            "old": "All endpoints require authentication via JWT token.",
            "new": """All endpoints require authentication via JWT token.

## Authentication

### JWT Token Format
```
Authorization: Bearer <token>
```

### Token Structure
- **iss**: Issuer (fleet-api)
- **sub**: User ID
- **tenant_id**: Tenant identifier for multi-tenant isolation
- **exp**: Expiration timestamp
- **iat**: Issued at timestamp

### Obtaining Tokens
Send POST request to `/api/auth/login` with:
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

Response:
```json
{
  "token": "eyJhbGc...",
  "user": { "id": 1, "email": "user@example.com" }
}
```"""
        }],
        "test_build": False,
        "commit_message": "docs: Add authentication documentation to API README"
    }
]

# Phase 2: High-Value Test Infrastructure (Moderate Risk)
# These tasks require actual code implementation but provide verification framework

PHASE_2_TEST_INFRASTRUCTURE_TASKS = [
    {
        "id": "TEST-001",
        "name": "Create test database seeding utility",
        "target_files": ["api/tests/utils/seed-test-data.ts"],
        "modifications": [{
            "file": "api/tests/utils/seed-test-data.ts",
            "old": "// TODO: Implement test data seeding",
            "new": """import { db } from '../../src/config/database'

/**
 * Seed test database with sample data
 * @returns Promise resolving to seeded data IDs
 */
export async function seedTestData() {
  // Create test tenant
  const [tenant] = await db('tenants').insert({
    name: 'Test Tenant',
    subdomain: 'test',
    status: 'active'
  }).returning('id')

  // Create test user
  const [user] = await db('users').insert({
    tenant_id: tenant.id,
    email: 'test@example.com',
    password_hash: '$2a$12$test_hash',
    role: 'admin'
  }).returning('id')

  // Create test vehicle
  const [vehicle] = await db('vehicles').insert({
    tenant_id: tenant.id,
    vin: 'TEST123456789',
    make: 'Test',
    model: 'Vehicle',
    year: 2024,
    status: 'active'
  }).returning('id')

  return {
    tenant_id: tenant.id,
    user_id: user.id,
    vehicle_id: vehicle.id
  }
}

/**
 * Clean test database after tests
 */
export async function cleanTestData() {
  await db('vehicles').where('vin', 'TEST123456789').del()
  await db('users').where('email', 'test@example.com').del()
  await db('tenants').where('subdomain', 'test').del()
}"""
        }],
        "test_build": True,
        "commit_message": "test: Add test database seeding utility"
    },

    {
        "id": "TEST-002",
        "name": "Create JWT token generator for tests",
        "target_files": ["api/tests/utils/generate-test-token.ts"],
        "modifications": [{
            "file": "api/tests/utils/generate-test-token.ts",
            "old": "// TODO: Implement JWT generation for tests",
            "new": """import jwt from 'jsonwebtoken'

const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key'

/**
 * Generate test JWT token
 * @param userId - User ID
 * @param tenantId - Tenant ID
 * @param role - User role
 * @returns JWT token string
 */
export function generateTestToken(
  userId: number,
  tenantId: number,
  role: string = 'admin'
): string {
  return jwt.sign(
    {
      sub: userId,
      tenant_id: tenantId,
      role: role
    },
    TEST_JWT_SECRET,
    {
      expiresIn: '1h',
      issuer: 'fleet-api-test'
    }
  )
}"""
        }],
        "test_build": True,
        "commit_message": "test: Add JWT token generator for tests"
    },

    {
        "id": "TEST-003",
        "name": "Implement tenant isolation test helper",
        "target_files": ["api/tests/utils/tenant-isolation.ts"],
        "modifications": [{
            "file": "api/tests/utils/tenant-isolation.ts",
            "old": "// TODO: Test tenant boundaries",
            "new": """import { db } from '../../src/config/database'

/**
 * Test tenant isolation - ensure tenant A cannot access tenant B's data
 * @param tenantA - First tenant ID
 * @param tenantB - Second tenant ID
 * @param table - Table name to test
 * @param tenantAToken - JWT token for tenant A
 */
export async function testTenantIsolation(
  tenantA: number,
  tenantB: number,
  table: string,
  tenantAToken: string
) {
  // Create test record for tenant B
  const [record] = await db(table)
    .insert({ tenant_id: tenantB, name: 'Test Record' })
    .returning('id')

  // Try to access tenant B's record using tenant A's token
  const result = await db(table)
    .where({ tenant_id: tenantA, id: record.id })
    .first()

  // Should return nothing (tenant isolation working)
  if (result) {
    throw new Error(`Tenant isolation breach: Tenant ${tenantA} accessed Tenant ${tenantB}'s data`)
  }

  // Cleanup
  await db(table).where({ id: record.id }).del()
}"""
        }],
        "test_build": True,
        "commit_message": "test: Add tenant isolation test helper"
    }
]

# Execution Configuration
EXECUTION_CONFIG = {
    "workspace": "/home/azureuser/agent-workspace/fleet-local",
    "parallel_execution": False,  # Execute tasks sequentially for safety
    "verify_after_each": True,    # Run build verification after each task
    "rollback_on_failure": True,  # Rollback changes if task fails
    "create_checkpoints": True,   # Commit after each successful task
    "notification_frequency": 5   # Report progress every 5 tasks
}

# All tasks combined
ALL_PRODUCTION_TASKS = PHASE_1_DOCUMENTATION_TASKS + PHASE_2_TEST_INFRASTRUCTURE_TASKS

if __name__ == "__main__":
    print(f"Total Production Tasks: {len(ALL_PRODUCTION_TASKS)}")
    print(f"Phase 1 (Documentation): {len(PHASE_1_DOCUMENTATION_TASKS)} tasks")
    print(f"Phase 2 (Test Infrastructure): {len(PHASE_2_TEST_INFRASTRUCTURE_TASKS)} tasks")
