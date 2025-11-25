# Fleet API Backend - Quick Start Card

## Start Server (One Command)
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/api && ./start-api-server.sh
```

## Check Server Status
```bash
curl http://localhost:3000/api/health
```

## Stop Server
```bash
kill $(lsof -ti :3000)
```

## Test API Endpoints
```bash
# Health (public)
curl http://localhost:3000/api/health

# Vehicles (requires auth)
curl http://localhost:3000/api/vehicles

# Drivers (requires auth)
curl http://localhost:3000/api/drivers

# Work Orders (requires auth)
curl http://localhost:3000/api/work-orders
```

## Initialize Database (First Time Only)
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/api
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE fleet_management;"
psql -h localhost -p 5432 -U postgres -c "CREATE USER fleet_user WITH PASSWORD 'fleet_password';"
psql -h localhost -p 5432 -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE fleet_management TO fleet_user;"
psql -h localhost -p 5432 -U fleet_user -d fleet_management -f database/schema.sql
```

## Current Status
- ✅ Server: RUNNING on port 3000 (PID: 7230)
- ✅ Health: HEALTHY
- ✅ Database: PostgreSQL running
- ✅ Endpoints: Responding (require auth)

## Documentation
- Full Guide: `/Users/andrewmorton/Documents/GitHub/Fleet/API_BACKEND_STARTUP_GUIDE.md`
- Validation Report: `/Users/andrewmorton/Documents/GitHub/Fleet/AGENT_3_BACKEND_VALIDATION_REPORT.md`

## Troubleshooting
- PostgreSQL not running: `brew services start postgresql@14`
- Port in use: `lsof -ti :3000` then `kill <PID>`
- Server won't start: Check environment variables in `.env`

---
**Last Updated**: 2025-11-25 | **Agent 3**: Backend Validator
