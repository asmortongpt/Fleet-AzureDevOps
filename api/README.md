# Fleet Management API
## Backend Service for Fleet Management System

**Technology Stack:**
- Node.js 20 LTS
- Express.js 4.x
- TypeScript 5.x
- Azure Cosmos DB / Azure SQL
- Azure OpenAI Service
- Microsoft Graph API

---

## 🚀 Quick Start

### Prerequisites
```bash
- Node.js 20 or higher
- Azure CLI installed
- Azure subscription with resources created
```

### Installation
```bash
cd api
npm install
```

### Configuration
Create `.env` file:
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_CONNECTION_STRING=your-cosmos-or-sql-connection-string

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com
AZURE_OPENAI_KEY=your-key
AZURE_OPENAI_DEPLOYMENT=gpt-4

# Microsoft Graph
MS_GRAPH_CLIENT_ID=your-client-id
MS_GRAPH_CLIENT_SECRET=your-secret
MS_GRAPH_TENANT_ID=your-tenant-id

# JWT
JWT_SECRET=your-secret-key-min-32-characters
JWT_EXPIRES_IN=1h

# CORS
CORS_ORIGIN=http://localhost:5173,https://your-frontend.azurestaticapps.net
```

### Development
```bash
npm run dev          # Start with hot reload
npm run build        # Build for production
npm start            # Run production build
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

---

## 📁 Project Structure

```
api/
├── src/
│   ├── server.ts              # Express app entry
│   ├── config/
│   │   ├── database.ts        # DB connection
│   │   ├── azure.ts           # Azure clients
│   │   └── environment.ts     # Environment config
│   ├── routes/
│   │   ├── vehicles.ts        # Vehicle endpoints
│   │   ├── drivers.ts         # Driver endpoints
│   │   └── ...                # Other routes
│   ├── controllers/
│   │   ├── vehicleController.ts
│   │   └── ...
│   ├── services/
│   │   ├── vehicleService.ts  # Business logic
│   │   └── ...
│   ├── models/
│   │   ├── Vehicle.ts         # Type definitions
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification
│   │   ├── validation.ts      # Input validation
│   │   ├── errorHandler.ts    # Error handling
│   │   └── rateLimiter.ts     # Rate limiting
│   └── utils/
│       ├── logger.ts          # Winston logger
│       └── apiResponse.ts     # Standard responses
├── tests/
│   ├── unit/                  # Unit tests
│   └── integration/           # Integration tests
├── package.json
├── tsconfig.json
└── .env                       # Environment variables
```

---

## 🔌 API Endpoints

### Vehicles
```
GET    /api/vehicles              # List all vehicles
POST   /api/vehicles              # Create vehicle
GET    /api/vehicles/:id          # Get vehicle by ID
PUT    /api/vehicles/:id          # Update vehicle
DELETE /api/vehicles/:id          # Delete vehicle
GET    /api/vehicles/search       # Search vehicles
```

### Drivers
```
GET    /api/drivers               # List all drivers
POST   /api/drivers               # Create driver
GET    /api/drivers/:id           # Get driver by ID
PUT    /api/drivers/:id           # Update driver
DELETE /api/drivers/:id           # Delete driver
```

### Work Orders
```
GET    /api/work-orders           # List work orders
POST   /api/work-orders           # Create work order
GET    /api/work-orders/:id       # Get work order
PUT    /api/work-orders/:id       # Update work order
DELETE /api/work-orders/:id       # Delete work order
```

*(18 total entity endpoints)*

---

## 🔐 Authentication

All endpoints (except `/api/health` and `/api/auth/login`) require JWT authentication:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://fleet-api.azurewebsites.net/api/vehicles
```

### Login
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "role": "fleet_manager"
  }
}
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 🚀 Deployment

### Deploy to Azure Functions

```bash
# Build
npm run build

# Deploy
func azure functionapp publish fleet-api-production
```

---

## 📊 Monitoring

API uses Azure Application Insights for monitoring:
- Request tracking
- Performance metrics
- Error tracking
- Custom events

View dashboard: [Azure Portal → Application Insights](https://portal.azure.com)

---

## 🔧 Development Tips

### Adding a New Entity

1. Create model in `src/models/`
2. Create service in `src/services/`
3. Create controller in `src/controllers/`
4. Create routes in `src/routes/`
5. Register routes in `src/server.ts`
6. Write tests in `tests/`

---

## 📄 License
MIT
