# Fleet Management API - Complete Documentation

## Interactive API Documentation

### Swagger UI (Recommended)

Visit **`http://<your-api-url>/api/docs`** for interactive API documentation.

Features:
- Try all 93 endpoints directly in browser
- See request/response examples
- Test with demo credentials
- View data models and schemas
- Download OpenAPI spec

**Demo URLs**:
- Local: http://localhost:3000/api/docs
- Kubernetes: http://fleet-api-service:3000/api/docs (internal)
- Production: https://api.fleetmanagement.com/api/docs

### OpenAPI Specification

Download the complete OpenAPI 3.0 spec:
- JSON: `GET /api/openapi.json`

Use with tools like:
- Postman (import OpenAPI spec)
- Insomnia (import spec)
- OpenAPI Generator (generate SDKs)
- Redoc (alternative documentation UI)

## Quick Start

### 1. Authentication

All endpoints require JWT authentication except:
- `/api/health` - Health check
- `/api/auth/login` - Login endpoint

**Login Request**:
\`\`\`bash
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "admin@demofleet.com",
    "password": "Demo@123"
  }'
\`\`\`

**Response**:
\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "22222222-2222-2222-2222-222222222221",
    "email": "admin@demofleet.com",
    "first_name": "Sarah",
    "last_name": "Williams",
    "role": "admin",
    "tenant_id": "11111111-1111-1111-1111-111111111111"
  }
}
\`\`\`

### 2. Using the Token

Include the token in the `Authorization` header:

\`\`\`bash
curl -X GET http://localhost:3000/api/vehicles \\
  -H "Authorization: Bearer <your-token>"
\`\`\`

## API Modules

### Core Fleet Management (18 endpoints)

#### Vehicles (5 endpoints)
- `GET /api/vehicles` - List all vehicles with pagination
- `GET /api/vehicles/:id` - Get vehicle details
- `POST /api/vehicles` - Create new vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

**Example: Get all vehicles**
\`\`\`bash
GET /api/vehicles?page=1&limit=50
Authorization: Bearer <token>
\`\`\`

**Response**:
\`\`\`json
{
  "data": [
    {
      "id": "55555555-5555-5555-5555-555555555501",
      "vin": "1HGBH41JXMN109186",
      "make": "Ford",
      "model": "Transit",
      "year": 2023,
      "vehicle_type": "van",
      "license_plate": "ABC-1234",
      "status": "active",
      "mileage": 15234,
      "fuel_type": "gasoline"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 35,
    "pages": 1
  }
}
\`\`\`

#### Drivers (5 endpoints)
- `GET /api/drivers` - List drivers
- `GET /api/drivers/:id` - Get driver details
- `POST /api/drivers` - Create driver
- `PUT /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Delete driver

#### Facilities (5 endpoints)
- Manage fleet facilities, depots, and service locations

#### Vendors (5 endpoints)
- Manage service providers and parts suppliers

### Maintenance & Operations (23 endpoints)

#### Work Orders (5 endpoints)
- `GET /api/work-orders` - List work orders
- `GET /api/work-orders/:id` - Get work order details
- `POST /api/work-orders` - Create work order
- `PUT /api/work-orders/:id` - Update work order
- `DELETE /api/work-orders/:id` - Delete work order

#### Maintenance Schedules (5 endpoints)
- Preventive maintenance scheduling

#### Inspections (5 endpoints)
- Vehicle inspection workflows

#### Purchase Orders (5 endpoints)
- Parts and service procurement

### Fuel & Energy (13 endpoints)

#### Fuel Transactions (5 endpoints)
- Track fuel purchases and costs

#### Charging Stations (5 endpoints)
- EV charging infrastructure management

#### Charging Sessions (5 endpoints)
- EV charging history and energy usage

### Safety & Compliance (18 endpoints)

#### Safety Incidents (5 endpoints)
- Incident reporting and tracking

#### Video Events (5 endpoints)
- Dashcam and telematics video events

#### Policies (5 endpoints)
- Fleet policies and compliance rules

#### Communication Logs (5 endpoints)
- Driver communication tracking

### Real-time & Tracking (13 endpoints)

#### Routes (5 endpoints)
- Route planning and tracking

#### Geofences (5 endpoints)
- Geographic boundary management

#### Telemetry (5 endpoints)
- Real-time vehicle telematics data

## Common Patterns

### Pagination

All list endpoints support pagination:

\`\`\`
GET /api/vehicles?page=2&limit=25
\`\`\`

**Parameters**:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)

**Response includes**:
\`\`\`json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 25,
    "total": 150,
    "pages": 6
  }
}
\`\`\`

### Filtering

Many endpoints support query parameters:

\`\`\`
GET /api/vehicles?status=active&vehicle_type=electric
GET /api/work-orders?priority=high&status=open
GET /api/drivers?license_status=active
\`\`\`

### Sorting

Use `sort` and `order` parameters:

\`\`\`
GET /api/vehicles?sort=mileage&order=desc
GET /api/work-orders?sort=scheduled_date&order=asc
\`\`\`

## Security & Access Control

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| **admin** | Full access to all endpoints |
| **fleet_manager** | Manage vehicles, drivers, work orders, routes |
| **technician** | View vehicles, manage work orders, inspections |
| **driver** | View assigned vehicles, routes, policies |
| **viewer** | Read-only access |

### Account Lockout (FedRAMP AC-7)

After 3 failed login attempts, the account is locked for 30 minutes.

**Locked Account Response**:
\`\`\`json
{
  "error": "Account locked due to multiple failed login attempts",
  "locked_until": "2025-11-09T01:30:00.000Z"
}
\`\`\`

### Rate Limiting

- **Limit**: 100 requests per minute per IP
- **Response**: 429 Too Many Requests
- **Headers**: `Retry-After` indicates wait time

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Resource created |
| 400 | Bad request / validation error |
| 401 | Unauthorized (authentication required) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 423 | Account locked |
| 429 | Too many requests (rate limit) |
| 500 | Internal server error |

### Error Response Format

\`\`\`json
{
  "error": "Descriptive error message",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}
\`\`\`

## Data Models

### Vehicle

\`\`\`typescript
interface Vehicle {
  id: string;                    // UUID
  tenant_id: string;             // UUID
  vin: string;                   // Vehicle Identification Number
  make: string;                  // Manufacturer
  model: string;                 // Model name
  year: number;                  // Model year
  vehicle_type: VehicleType;     // sedan | suv | truck | van | electric | hybrid
  license_plate: string;
  status: VehicleStatus;         // active | maintenance | out_of_service | retired
  mileage: number;
  fuel_type: FuelType;           // gasoline | diesel | electric | hybrid
  assigned_driver_id?: string;   // UUID (optional)
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;
}
\`\`\`

### Work Order

\`\`\`typescript
interface WorkOrder {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  title: string;
  description: string;
  work_order_type: WorkOrderType;  // repair | maintenance | inspection | recall
  priority: Priority;              // low | medium | high | critical
  status: WorkOrderStatus;         // open | in_progress | completed | cancelled
  assigned_to?: string;            // Technician user ID
  scheduled_date?: string;
  completed_date?: string;
  estimated_cost?: number;
  actual_cost?: number;
  created_at: string;
  updated_at: string;
}
\`\`\`

### Driver

\`\`\`typescript
interface Driver {
  id: string;
  tenant_id: string;
  user_id: string;                // References users table
  license_number: string;
  license_state: string;
  license_expiry: string;
  license_class: string;
  hire_date: string;
  employment_status: EmploymentStatus;  // active | on_leave | terminated
  assigned_vehicle_id?: string;
  created_at: string;
  updated_at: string;
}
\`\`\`

## SDKs & Client Libraries

### Generate TypeScript SDK

\`\`\`bash
npx @openapitools/openapi-generator-cli generate \\
  -i http://localhost:3000/api/openapi.json \\
  -g typescript-fetch \\
  -o ./sdk/typescript
\`\`\`

### Generate Python SDK

\`\`\`bash
openapi-generator generate \\
  -i http://localhost:3000/api/openapi.json \\
  -g python \\
  -o ./sdk/python
\`\`\`

### Generate C# SDK

\`\`\`bash
openapi-generator generate \\
  -i http://localhost:3000/api/openapi.json \\
  -g csharp-netcore \\
  -o ./sdk/csharp
\`\`\`

## Testing

### Postman Collection

1. Download OpenAPI spec from `/api/openapi.json`
2. Import into Postman: **Import → Upload Files**
3. Configure environment variables:
   - `baseUrl`: http://localhost:3000
   - `token`: (get from /api/auth/login)

### cURL Examples

**Create a vehicle**:
\`\`\`bash
curl -X POST http://localhost:3000/api/vehicles \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "vin": "1HGBH41JXMN109999",
    "make": "Tesla",
    "model": "Model 3",
    "year": 2024,
    "vehicle_type": "electric",
    "license_plate": "TESLA-01",
    "status": "active",
    "mileage": 0,
    "fuel_type": "electric"
  }'
\`\`\`

**Create a work order**:
\`\`\`bash
curl -X POST http://localhost:3000/api/work-orders \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "vehicle_id": "55555555-5555-5555-5555-555555555501",
    "title": "Oil Change",
    "description": "Regular 5,000 mile oil change",
    "work_order_type": "maintenance",
    "priority": "medium",
    "status": "open",
    "scheduled_date": "2025-11-15T10:00:00Z",
    "estimated_cost": 75.00
  }'
\`\`\`

## Performance

### Response Times (p95)

| Endpoint Category | Target | Current |
|------------------|--------|---------|
| Authentication | < 200ms | TBD |
| Read Operations | < 300ms | TBD |
| Write Operations | < 500ms | TBD |
| Bulk Operations | < 2000ms | TBD |

### Throughput

- **Target**: 500 requests/second per instance
- **Load Testing**: See `/tests/load/README.md`

## Versioning

API Version: **1.0.0**

Future versions will use URL versioning:
- v1: `/api/v1/vehicles`
- v2: `/api/v2/vehicles`

## Support

- **Documentation**: http://localhost:3000/api/docs
- **OpenAPI Spec**: http://localhost:3000/api/openapi.json
- **Email**: support@fleetmanagement.com
- **GitHub Issues**: https://github.com/your-org/fleet-management/issues
