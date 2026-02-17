# Local Docker Build Guide

## Quick Start (Recommended)

### 1. Build frontend locally (one-time)
```bash
npm install --legacy-peer-deps
npm run build
```
This creates a `dist/` folder with the optimized frontend.

### 2. Build Docker images

**Option A: Use pre-built frontend (RECOMMENDED)**
```bash
# Frontend (uses pre-built dist/)
docker build -f Dockerfile.frontend.slim -t fleet-cta-frontend:latest .

# Backend (builds in Docker)
docker build -f Dockerfile.backend -t fleet-cta-backend:latest .

# Run with compose
docker-compose up -d
```

**Option B: Full Docker build (requires 8GB+ RAM)**
```bash
docker-compose build --no-cache
docker-compose up -d
```

### 3. Verify services
```bash
# Check all services running
docker-compose ps

# View logs
docker-compose logs -f

# Test endpoints
curl http://localhost              # Frontend
curl http://localhost:3001/api/health  # Backend
```

## Development Workflow

```bash
# 1. Make changes to React code
# 2. Rebuild frontend
npm run build

# 3. Rebuild Docker image
docker build -f Dockerfile.frontend.slim -t fleet-cta-frontend:latest .

# 4. Restart frontend service
docker-compose up -d --build frontend

# 5. Check result
curl http://localhost
```

## Troubleshooting

### Out of Memory
- Use Dockerfile.frontend.slim (pre-built approach)
- Allocate more RAM to Docker Desktop: Settings → Resources → Memory (8GB+)

### Port Already in Use
```bash
# Find what's using the port
lsof -i :80
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Container won't start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# View container status
docker ps -a
```

## Production Build

For production, use the full multi-stage build with adequate resources:
```bash
# On a machine with 8GB+ RAM
docker build -f Dockerfile.frontend -t fleet-cta-frontend:latest --build-arg NODE_OPTIONS="--max_old_space_size=4096" .
```

