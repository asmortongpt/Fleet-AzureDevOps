# Fleet Management System - Local Development Setup

Complete guide to run the Fleet Management application on your local machine.

## Prerequisites

### Required Software
- **Node.js**: v20.x or later
- **npm**: v10.x or later
- **PostgreSQL**: v15.x or later
- **Git**: Latest version

### Optional (Recommended)
- **Docker Desktop**: For running PostgreSQL and Redis in containers
- **Redis**: v7.x or later (for caching and real-time features)
- **VS Code**: Recommended IDE

## Quick Start (5 Minutes)

### Option 1: Using Docker (Recommended)

1. **Start Database and Services**
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Adminer (Database UI) on port 8080

2. **Install Dependencies**
```bash
# Install frontend dependencies
npm install

# Install API dependencies
cd api
npm install
cd ..
```

3. **Setup Database**
```bash
# Run migrations and seed data
cd api
npm run db:migrate
npm run db:seed
cd ..
```

4. **Start Development Servers**

Open two terminal windows:

**Terminal 1 - API Server:**
```bash
cd api
npm run dev
```
API runs on: http://localhost:3000

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend runs on: http://localhost:5173

5. **Open Browser**
Navigate to: http://localhost:5173

---

### Option 2: Using Local PostgreSQL

If you prefer to use PostgreSQL installed directly on your Mac:

1. **Install PostgreSQL**
```bash
brew install postgresql@15
brew services start postgresql@15
```

2. **Create Database and User**
```bash
psql postgres

# In psql terminal:
CREATE DATABASE fleetdb;
CREATE USER fleetadmin WITH PASSWORD 'FleetAdmin2024!Secure';
GRANT ALL PRIVILEGES ON DATABASE fleetdb TO fleetadmin;
ALTER DATABASE fleetdb OWNER TO fleetadmin;
\q
```

3. **Update Environment Files**

Edit `/Users/andrewmorton/Documents/GitHub/Fleet/api/.env.local`:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleetdb
DB_USER=fleetadmin
DB_PASSWORD=FleetAdmin2024!Secure
```

4. **Continue with steps 2-5 from Option 1**

---

## Environment Files

### Frontend Environment (.env.local)

Create `/Users/andrewmorton/Documents/GitHub/Fleet/.env.local`:

```bash
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_ENVIRONMENT=development

# Azure Maps (use demo key or get your own)
VITE_AZURE_MAPS_SUBSCRIPTION_KEY=560t3GIDj2PBsHx1wDcgQ67VK6d6wgkdcHK0rTmTRhYUQzFizj4SJQQJ99BKACYeBjFbS4kUAAAgAZMP7TCI

# Azure AD / Microsoft Authentication (Optional for local dev)
VITE_AZURE_CLIENT_ID=80fe6628-1dc4-41fe-894f-919b12ecc994
VITE_AZURE_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
VITE_AZURE_AD_REDIRECT_URI=http://localhost:5173/auth/callback

# Feature Flags
VITE_ENABLE_AI_ASSISTANT=true
VITE_ENABLE_TEAMS_INTEGRATION=false
VITE_ENABLE_EMAIL_CENTER=false
VITE_ENABLE_DARK_MODE=true
```

### API Environment (api/.env.local)

Create `/Users/andrewmorton/Documents/GitHub/Fleet/api/.env.local`:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleetdb
DB_USER=fleetadmin
DB_PASSWORD=FleetAdmin2024!Secure
DB_SSL=false

# JWT Configuration
JWT_SECRET=dev-secret-key-change-in-production-min-32-chars-long
MFA_ENCRYPTION_KEY=8cedee3eff68813f1bd4b6fd2c79de60bb566890499ba064b2ca6be847fde60e

# API Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
FRONTEND_URL=http://localhost:5173

# Azure AD / Microsoft Authentication (Optional)
AZURE_CLIENT_ID=80fe6628-1dc4-41fe-894f-919b12ecc994
AZURE_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
AZURE_CLIENT_SECRET=your_azure_client_secret_here
AZURE_AD_REDIRECT_URI=http://localhost:5173/auth/callback

# Redis Configuration (Optional - use if running Redis)
REDIS_URL=redis://localhost:6379
# Leave empty to use in-memory rate limiting
# REDIS_URL=

# AI Services (Optional - add your own keys)
OPENAI_API_KEY=sk-proj-YOUR-KEY-HERE
CLAUDE_API_KEY=sk-ant-YOUR-KEY-HERE
GEMINI_API_KEY=YOUR-KEY-HERE
```

---

## Docker Compose Setup (Recommended)

Create `/Users/andrewmorton/Documents/GitHub/Fleet/docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: fleet-postgres
    environment:
      POSTGRES_DB: fleetdb
      POSTGRES_USER: fleetadmin
      POSTGRES_PASSWORD: FleetAdmin2024!Secure
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fleetadmin -d fleetdb"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: fleet-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  adminer:
    image: adminer:latest
    container_name: fleet-adminer
    ports:
      - "8080:8080"
    environment:
      ADMINER_DEFAULT_SERVER: postgres

volumes:
  postgres_data:
  redis_data:
```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v
```

---

## Database Setup

### Run Migrations

```bash
cd api

# Check database connection
npm run db:check

# Run all migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

### Manual Database Setup

If you need to manually set up the database:

```bash
# Connect to database
psql -h localhost -U fleetadmin -d fleetdb

# Or if using Docker:
docker exec -it fleet-postgres psql -U fleetadmin -d fleetdb
```

---

## Development Workflow

### Starting Development

1. **Terminal 1 - Start Database (if using Docker)**
```bash
docker-compose up postgres redis
```

2. **Terminal 2 - Start API Server**
```bash
cd api
npm run dev
```

3. **Terminal 3 - Start Frontend**
```bash
npm run dev
```

### Useful Commands

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# API
cd api
npm run dev          # Start API with hot reload
npm run build        # Compile TypeScript
npm run start        # Run compiled code
npm run test         # Run tests
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
```

### Database Management UI

**Adminer** (web-based):
- URL: http://localhost:8080
- System: PostgreSQL
- Server: postgres (or localhost if not using Docker)
- Username: fleetadmin
- Password: FleetAdmin2024!Secure
- Database: fleetdb

**VS Code Extension**:
- Install "PostgreSQL" extension by Chris Kolkman
- Add connection with above credentials

---

## Testing

### Frontend Tests
```bash
npm run test
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### API Tests
```bash
cd api
npm run test
npm run test:watch
npm run test:coverage
```

### E2E Tests (Playwright)
```bash
npx playwright install  # First time only
npx playwright test     # Run all tests
npx playwright test --ui  # Interactive mode
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# Find process using port 3000 (API)
lsof -ti:3000 | xargs kill -9

# Find process using port 5432 (PostgreSQL)
lsof -ti:5432 | xargs kill -9
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps
# or
brew services list | grep postgresql

# Test connection
psql -h localhost -U fleetadmin -d fleetdb -c "SELECT 1;"

# Reset database
docker-compose down -v
docker-compose up -d
cd api && npm run db:migrate && npm run db:seed
```

### Clear Node Modules

```bash
# Frontend
rm -rf node_modules package-lock.json
npm install

# API
cd api
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Loading

```bash
# Make sure you're using .env.local (not .env)
# Vite loads .env.local automatically in dev mode

# Restart dev servers after changing .env files
```

---

## Production Build (Local Testing)

```bash
# Build frontend
npm run build

# Preview production build
npm run preview

# Build API
cd api
npm run build
npm run start
```

---

## API Endpoints

Once running, you can access:

- **API Base**: http://localhost:3000
- **API Health**: http://localhost:3000/health
- **API Docs (Swagger)**: http://localhost:3000/api-docs
- **GraphQL Playground**: http://localhost:3000/graphql (if enabled)

### Example API Calls

```bash
# Health check
curl http://localhost:3000/health

# Get vehicles
curl http://localhost:3000/api/vehicles

# Get drivers
curl http://localhost:3000/api/drivers

# With authentication (if enabled)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/vehicles
```

---

## VS Code Configuration

Recommended `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

Recommended extensions:
- ESLint
- Prettier
- PostgreSQL
- Docker
- Tailwind CSS IntelliSense

---

## Next Steps

1. ✅ Database running
2. ✅ API server running on :3000
3. ✅ Frontend running on :5173
4. 📝 Customize environment variables
5. 🔐 Set up authentication (optional)
6. 🗺️ Get Azure Maps key (optional)
7. 🤖 Add AI API keys (optional)

## Need Help?

- Check logs: `docker-compose logs -f`
- Database logs: `docker-compose logs postgres`
- API logs: Check terminal running `npm run dev` in api folder
- Frontend logs: Check browser console

---

## Production Deployment

For production deployment to Azure Kubernetes, see:
- `DEPLOYMENT.md` (if exists)
- Current production: http://68.220.148.2
- Azure Kubernetes namespace: `fleet-management`

**Do not use .env.local files in production!** Production uses Kubernetes Secrets and ConfigMaps.
