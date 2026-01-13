/**
 * Swagger/OpenAPI Configuration
 *
 * Auto-generates interactive API documentation for all 93 endpoints
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fleet Management System API',
      version: '1.0.0',
      description: `
# Fleet Management System - Complete API Documentation

A comprehensive fleet management platform with 93 RESTful API endpoints covering all aspects of fleet operations.

## Features

- **Multi-tenant Architecture**: Secure data isolation per organization
- **Role-Based Access Control (RBAC)**: Admin, Fleet Manager, Technician, Driver roles
- **Real-time Tracking**: Vehicle telemetry and GPS tracking
- **Maintenance Management**: Work orders, schedules, and inspections
- **Compliance & Safety**: Incident reporting, policy management, driver compliance
- **EV Support**: Charging stations, sessions, and energy management
- **FedRAMP Compliance**: Built to federal security standards

## Authentication

All API endpoints (except /api/auth/login and /api/health) require JWT authentication.

### Getting Started

1. **Login**:
   \`\`\`bash
   POST /api/auth/login
   {
     "email": "admin@demofleet.com",
     "password": "Demo@123"
   }
   \`\`\`

2. **Use Token**:
   Include the token in all subsequent requests:
   \`\`\`
   Authorization: Bearer <your-token>
   \`\`\`

3. **Demo Credentials**:
   - Admin: admin@demofleet.com / Demo@123
   - Manager: manager@demofleet.com / Demo@123
   - Technician: tech@demofleet.com / Demo@123
   - Driver: driver1@demofleet.com / Demo@123

## Rate Limiting

- 100 requests per minute per IP
- 429 status code when limit exceeded
- Retry-After header indicates wait time

## Pagination

List endpoints support pagination:

- \`page\`: Page number (default: 1)
- \`limit\`: Items per page (default: 50, max: 100)

Response includes pagination metadata:
\`\`\`json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
\`\`\`

## Error Handling

Standard HTTP status codes:

- **200 OK**: Success
- **201 Created**: Resource created
- **400 Bad Request**: Validation error
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **423 Locked**: Account locked (security)
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

Error response format:
\`\`\`json
{
  "error": "Descriptive error message",
  "details": { ... }
}
\`\`\`
      `,
      contact: {
        name: 'Fleet Management Support',
        email: 'support@fleetmanagement.com',
        url: 'https://fleetmanagement.com/support'
      },
      license: {
        name: 'Commercial',
        url: 'https://fleetmanagement.com/license'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'http://fleet-api-service:3000',
        description: 'Kubernetes cluster (internal)'
      },
      {
        url: 'https://api.fleetmanagement.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenant_id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'fleet_manager', 'driver', 'technician', 'viewer'] },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Vehicle: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenant_id: { type: 'string', format: 'uuid' },
            vin: { type: 'string', description: 'Vehicle Identification Number' },
            make: { type: 'string' },
            model: { type: 'string' },
            year: { type: 'integer' },
            vehicle_type: { type: 'string', enum: ['sedan', 'suv', 'truck', 'van', 'electric', 'hybrid'] },
            license_plate: { type: 'string' },
            status: { type: 'string', enum: ['active', 'maintenance', 'out_of_service', 'retired'] },
            mileage: { type: 'number' },
            fuel_type: { type: 'string', enum: ['gasoline', 'diesel', 'electric', 'hybrid'] },
            assigned_driver_id: { type: 'string', format: 'uuid', nullable: true },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        WorkOrder: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenant_id: { type: 'string', format: 'uuid' },
            vehicle_id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            work_order_type: { type: 'string', enum: ['repair', 'maintenance', 'inspection', 'recall'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            status: { type: 'string', enum: ['open', 'in_progress', 'completed', 'cancelled'] },
            assigned_to: { type: 'string', format: 'uuid', nullable: true },
            scheduled_date: { type: 'string', format: 'date-time', nullable: true },
            completed_date: { type: 'string', format: 'date-time', nullable: true },
            estimated_cost: { type: 'number', nullable: true },
            actual_cost: { type: 'number', nullable: true },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' },
            details: { type: 'object', description: 'Additional error details', nullable: true }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' }
              }
            }
          }
        }
      },
      parameters: {
        page: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number for pagination'
        },
        limit: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          description: 'Number of items per page'
        }
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Authentication required' }
            }
          }
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Insufficient permissions', required: ['admin'], current: 'driver' }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Resource not found' }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Validation failed', details: { field: 'email', message: 'Invalid email format' } }
            }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Vehicles', description: 'Vehicle fleet management' },
      { name: 'Drivers', description: 'Driver management and assignments' },
      { name: 'Work Orders', description: 'Maintenance and repair work orders' },
      { name: 'Maintenance Schedules', description: 'Preventive maintenance scheduling' },
      { name: 'Fuel Transactions', description: 'Fuel usage and cost tracking' },
      { name: 'Routes', description: 'Route planning and tracking' },
      { name: 'Geofences', description: 'Geographic boundary management' },
      { name: 'Inspections', description: 'Vehicle inspection workflows' },
      { name: 'Safety Incidents', description: 'Incident reporting and tracking' },
      { name: 'Video Events', description: 'Dashcam and telematics video events' },
      { name: 'Charging Stations', description: 'EV charging infrastructure' },
      { name: 'Charging Sessions', description: 'EV charging history' },
      { name: 'Purchase Orders', description: 'Parts and service procurement' },
      { name: 'Communication Logs', description: 'Driver communication tracking' },
      { name: 'Policies', description: 'Fleet policies and compliance' },
      { name: 'Facilities', description: 'Fleet facilities and locations' },
      { name: 'Vendors', description: 'Service provider management' },
      { name: 'Telemetry', description: 'Real-time vehicle telemetry data' }
    ]
  },
  apis: ['./src/routes/*.ts'], // Path to API route files
};

export const swaggerSpec = swaggerJsdoc(options);
