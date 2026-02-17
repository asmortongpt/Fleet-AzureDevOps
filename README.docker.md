# Fleet-CTA Docker Deployment Guide

Complete Docker setup for the Fleet-CTA application with frontend, backend, PostgreSQL, and Redis.

## Prerequisites

- Docker Engine 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ (included with Docker Desktop)
- At least 4GB available RAM
- 10GB available disk space

## Quick Start

### 1. Prepare Environment

```bash
# Copy Docker environment configuration
cp .env.docker .env.docker.local

# (Optional) Edit configuration for your needs
nano .env.docker.local
```

### 2. Build Docker Images

```bash
# Build both frontend and backend images
docker-compose build

# View built images
docker images | grep fleet
```

### 3. Start Services

```bash
# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4. Verify Services

```bash
# Check service status
docker-compose ps

# Test backend health
curl http://localhost:3001/api/health

# Test frontend
curl http://localhost/

# Open in browser: http://localhost
```

## Service Endpoints

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Frontend | http://localhost | React UI |
| Backend API | http://localhost:3001 | REST API |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |

## Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service (backend, frontend, postgres, redis)
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Follow in real-time
docker-compose logs -f -t backend
```

### Stop Services

```bash
# Stop all services (data persists)
docker-compose stop

# Resume services
docker-compose start

# Stop and remove containers (data persists in volumes)
docker-compose down

# Stop and remove everything including volumes (WARNING: deletes data)
docker-compose down -v
```

### Access Running Containers

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# Database shell
docker-compose exec postgres psql -U fleet_user -d fleet_db

# Redis CLI
docker-compose exec redis redis-cli
```

### Database Management

```bash
# View database
docker-compose exec postgres psql -U fleet_user -d fleet_db -c "\dt"

# Run migrations
docker-compose exec backend npm run migrate

# Seed database
docker-compose exec backend npm run seed

# Backup database
docker-compose exec postgres pg_dump -U fleet_user -d fleet_db > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U fleet_user -d fleet_db < backup.sql
```

### Rebuild Services

```bash
# Rebuild all images (without cache)
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache backend

# Rebuild and restart
docker-compose up -d --build
```

## Configuration

### Environment Variables

Edit `.env.docker.local` to customize:

```env
# Database
DATABASE_URL=postgresql://fleet_user:fleet_password@postgres:5432/fleet_db
DB_WEBAPP_POOL_SIZE=30

# Redis
REDIS_URL=redis://redis:6379

# API
VITE_API_URL=http://localhost
JWT_SECRET=your-jwt-secret-key-change-in-production

# Authentication
SKIP_AUTH=true
```

### Port Mapping

Default ports (change in docker-compose.yml):
- Frontend: 80 → 80
- Backend: 3001 → 3001
- PostgreSQL: 5432 → 5432
- Redis: 6379 → 6379

### Volumes

Data persistence:
- `postgres_data` - PostgreSQL database
- `redis_data` - Redis cache

Remove with: `docker-compose down -v`

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs -f

# Check port conflicts
lsof -i :80
lsof -i :3001
lsof -i :5432

# Kill process using port
kill -9 <PID>
```

### Database Connection Error

```bash
# Verify database is healthy
docker-compose exec postgres pg_isready -U fleet_user

# Check DATABASE_URL is correct
docker-compose exec backend echo $DATABASE_URL

# View database logs
docker-compose logs postgres
```

### Frontend Not Loading

```bash
# Check nginx config
docker-compose exec frontend cat /etc/nginx/nginx.conf

# Check frontend logs
docker-compose logs frontend

# Verify backend is accessible from frontend
docker-compose exec frontend wget -O - http://backend:3001/api/health
```

### Memory Issues

```bash
# Check resource usage
docker stats

# Limit container memory (in docker-compose.yml)
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

### Clean Everything (Start Fresh)

```bash
# Stop all services and remove data
docker-compose down -v

# Remove all images
docker rmi fleet-cta-frontend fleet-cta-backend

# Start fresh
docker-compose build --no-cache
docker-compose up -d
```

## Production Deployment

### Before Production

1. **Change Secrets**
   ```bash
   # Generate new JWT secret
   openssl rand -base64 32
   ```

2. **Set Secure Environment**
   ```env
   NODE_ENV=production
   SKIP_AUTH=false
   JWT_SECRET=<your-generated-secret>
   ```

3. **Use Volume Backups**
   ```bash
   docker-compose exec postgres pg_dump -U fleet_user -d fleet_db | gzip > backup-$(date +%Y%m%d).sql.gz
   ```

4. **Enable HTTPS**
   - Use nginx reverse proxy with SSL certificate
   - Use Certbot for Let's Encrypt

5. **Resource Limits**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1'
         memory: 512M
       reservations:
         cpus: '0.5'
         memory: 256M
   ```

### Docker Hub Push

```bash
# Login to Docker Hub
docker login -u asmorton

# Tag images
docker tag fleet-cta-backend:latest asmorton/fleet-cta-backend:latest
docker tag fleet-cta-frontend:latest asmorton/fleet-cta-frontend:latest

# Push to registry
docker push asmorton/fleet-cta-backend:latest
docker push asmorton/fleet-cta-frontend:latest
```

## Health Checks

Services include automated health checks:

```bash
# Check health status
docker-compose ps

# View health check details
docker inspect <container-id> | grep -A 5 Healthcheck

# Manual health check
curl -v http://localhost/health        # Frontend
curl -v http://localhost:3001/api/health  # Backend
```

## Monitoring

```bash
# Real-time resource usage
docker stats

# View events
docker events

# Inspect container
docker inspect fleet-api
docker logs fleet-api
```

## Support

For issues or questions:
1. Check Docker logs: `docker-compose logs -f`
2. Verify configuration in `.env.docker.local`
3. Review README.md for application-specific issues
4. Check health endpoints: `/health` and `/api/health`

---

**Last Updated:** February 2026
**Application:** CTA Fleet Management System
**Docker Version:** 20.10+
**Docker Compose Version:** 2.0+
