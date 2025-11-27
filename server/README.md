# Fleet Management API

Production-ready backend API for the Fleet Management System with Azure AD SSO authentication.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker
- Kubernetes cluster
- Azure Container Registry access
- PostgreSQL database
- Redis instance

### Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials

# Run in development mode
npm run dev
```

### Production Deployment

```bash
# Build and push Docker image
./build-and-push.sh

# Run database migration
./run-migration.sh

# Deploy to Kubernetes
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Verify deployment
kubectl get pods -n fleet-management -l app=fleet-api
```

## API Documentation

### Base URL
- Production: `https://fleet.capitaltechalliance.com/api/v1`
- Development: `http://localhost:3000/api/v1`

### Authentication

All endpoints except `/health` and auth endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Health Check
```
GET /health

Response:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-27T05:11:25.243Z",
  "version": "1.0.0"
}
```

#### Microsoft OAuth Login
```
POST /api/v1/auth/microsoft/login

Response:
{
  "authUrl": "https://login.microsoftonline.com/...",
  "state": "csrf-token"
}
```

#### OAuth Callback
```
GET /api/v1/auth/microsoft/callback?code=xxx&state=xxx

Redirects to: https://fleet.capitaltechalliance.com?token=<jwt-token>
```

#### Logout
```
POST /api/v1/auth/logout
Authorization: Bearer <token>

Response:
{
  "message": "Logged out successfully"
}
```

#### Verify Token
```
GET /api/v1/auth/verify
Authorization: Bearer <token>

Response:
{
  "user": {
    "id": 1,
    "email": "user@capitaltechalliance.com",
    "displayName": "John Doe",
    "role": "user",
    "tenantId": 1
  }
}
```

## Environment Variables

Required environment variables (see `.env.example`):

```
NODE_ENV=production
PORT=3000

AZURE_AD_CLIENT_ID=<client-id>
AZURE_AD_CLIENT_SECRET=<secret>
AZURE_AD_TENANT_ID=<tenant-id>
AZURE_AD_REDIRECT_URI=<redirect-uri>

JWT_SECRET=<secret>
JWT_EXPIRES_IN=24h

DATABASE_HOST=<host>
DATABASE_PORT=5432
DATABASE_NAME=<database>
DATABASE_USER=<user>
DATABASE_PASSWORD=<password>

REDIS_HOST=<host>
REDIS_PORT=6379

FRONTEND_URL=<frontend-url>
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  microsoft_id VARCHAR(255) UNIQUE,
  display_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  tenant_id INTEGER DEFAULT 1,
  auth_provider VARCHAR(50) DEFAULT 'microsoft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Security

This API implements industry-standard security practices:

- ✅ Parameterized SQL queries only ($1, $2, $3)
- ✅ No hardcoded secrets (environment variables)
- ✅ JWT authentication with expiration
- ✅ Input validation (whitelist approach)
- ✅ Security headers (Helmet)
- ✅ CORS restricted to frontend domain
- ✅ Rate limiting (10 req/15min for auth, 100 req/15min for API)
- ✅ Non-root container user
- ✅ HTTPS everywhere
- ✅ Session cleanup (expired sessions removed hourly)

## Testing

```bash
# Run tests (TODO: implement)
npm test

# Manual testing
kubectl port-forward -n fleet-management svc/fleet-api-service 3000:3000

# Test health
curl http://localhost:3000/health

# Test OAuth login
curl -X POST http://localhost:3000/api/v1/auth/microsoft/login
```

## Monitoring

View logs:
```bash
# All pods
kubectl logs -n fleet-management -l app=fleet-api -f

# Specific pod
kubectl logs -n fleet-management <pod-name> -f
```

Check metrics:
```bash
# Pod status
kubectl get pods -n fleet-management -l app=fleet-api

# Resource usage
kubectl top pods -n fleet-management -l app=fleet-api
```

## Troubleshooting

### Database Connection Issues
```bash
# Test connection from API pod
kubectl exec -it <pod-name> -n fleet-management -- sh
apk add postgresql-client
psql -h fleet-postgres-service -U fleetadmin -d fleet_production
```

### OAuth Issues
- Verify redirect URI matches Azure AD configuration exactly
- Check AZURE_AD_CLIENT_SECRET is set correctly in secrets
- Review logs for detailed error messages

### Pod Not Starting
```bash
kubectl describe pod <pod-name> -n fleet-management
kubectl logs <pod-name> -n fleet-management
```

## Development

### Project Structure
```
src/
├── routes/          # API route handlers
├── middleware/      # Express middleware
├── services/        # Business logic and external services
├── types/           # TypeScript type definitions
└── index.ts         # Application entry point
```

### Adding New Routes

1. Create route file in `src/routes/`
2. Import and use in `src/index.ts`
3. Add authentication middleware if needed
4. Update API documentation

Example:
```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/vehicles', authenticateToken, async (req, res) => {
  // Implementation
});

export default router;
```

## License

MIT

## Support

For issues or questions, contact the development team.
