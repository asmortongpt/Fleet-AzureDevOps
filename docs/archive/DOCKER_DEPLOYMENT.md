# Docker Deployment Guide

## Fleet Management System - Docker & Container Orchestration

Complete guide for building, running, and deploying the Fleet Management System using Docker and Docker Compose.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Docker Architecture](#docker-architecture)
4. [Building Images](#building-images)
5. [Running Containers](#running-containers)
6. [Docker Compose](#docker-compose)
7. [Production Deployment](#production-deployment)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Overview

The Fleet Management System uses a multi-stage Docker build process optimized for:
- **Security**: Non-root user, minimal attack surface
- **Performance**: Small image size (~50MB compressed)
- **Reliability**: Health checks and graceful shutdown
- **Scalability**: Horizontal scaling with load balancing

### Image Specifications:

```
Base Image: nginx:1.25-alpine
Final Size: ~50-80MB (compressed)
Exposed Port: 8080
User: nginx-app (UID 101)
Health Check: /health.txt endpoint
```

---

## Prerequisites

### Required Software:

```bash
# Docker
docker --version  # >= 24.0.0

# Docker Compose
docker-compose --version  # >= 2.20.0

# Git
git --version  # >= 2.30.0
```

### Installation:

**macOS:**
```bash
# Install Docker Desktop
brew install --cask docker

# Verify installation
docker run hello-world
```

**Linux:**
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**Windows:**
```powershell
# Install Docker Desktop for Windows
winget install Docker.DockerDesktop
```

---

## Docker Architecture

### Multi-Stage Build:

```dockerfile
Stage 1: Dependencies
  ├── Install build tools
  └── Install npm packages

Stage 2: Builder
  ├── Copy dependencies
  ├── Copy source code
  └── Build application

Stage 3: Production
  ├── Nginx base image
  ├── Copy built artifacts
  ├── Configure security
  └── Set health checks

Stage 4: Development (optional)
  ├── Node base image
  ├── Development dependencies
  └── Hot reload enabled
```

### Build Targets:

- **production** (default): Optimized for deployment
- **development**: Hot reload for local development

---

## Building Images

### Production Build:

```bash
# Build production image
docker build -t fleet-management:latest .

# Build with build args
docker build \
  --build-arg NODE_ENV=production \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg VCS_REF=$(git rev-parse --short HEAD) \
  -t fleet-management:v1.0.0 .

# Build specific stage
docker build --target production -t fleet-management:prod .
```

### Development Build:

```bash
# Build development image
docker build --target development -t fleet-management:dev .
```

### Verify Build:

```bash
# Check image details
docker images fleet-management

# Inspect image
docker inspect fleet-management:latest

# Check image size
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep fleet
```

### Build Optimization:

```bash
# Use BuildKit for better caching
DOCKER_BUILDKIT=1 docker build -t fleet-management:latest .

# Multi-platform build
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t fleet-management:latest .
```

---

## Running Containers

### Quick Start:

```bash
# Run production container
docker run -d \
  --name fleet-frontend \
  -p 8080:8080 \
  --restart unless-stopped \
  fleet-management:latest

# Check if running
docker ps | grep fleet

# View logs
docker logs -f fleet-frontend

# Access application
open http://localhost:8080
```

### Advanced Options:

```bash
# Run with environment variables
docker run -d \
  --name fleet-frontend \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e API_URL=https://api.example.com \
  --restart unless-stopped \
  fleet-management:latest

# Run with resource limits
docker run -d \
  --name fleet-frontend \
  -p 8080:8080 \
  --memory="256m" \
  --cpus="0.5" \
  --restart unless-stopped \
  fleet-management:latest

# Run with health checks
docker run -d \
  --name fleet-frontend \
  -p 8080:8080 \
  --health-cmd="curl -f http://localhost:8080/health.txt || exit 1" \
  --health-interval=30s \
  --health-timeout=3s \
  --health-retries=3 \
  --restart unless-stopped \
  fleet-management:latest
```

### Development Container:

```bash
# Run development container with hot reload
docker run -d \
  --name fleet-frontend-dev \
  -p 5173:5173 \
  -v $(pwd):/app \
  -v /app/node_modules \
  fleet-management:dev

# View development logs
docker logs -f fleet-frontend-dev
```

### Container Management:

```bash
# Stop container
docker stop fleet-frontend

# Start stopped container
docker start fleet-frontend

# Restart container
docker restart fleet-frontend

# Remove container
docker rm -f fleet-frontend

# Execute command in running container
docker exec -it fleet-frontend sh

# Copy files from container
docker cp fleet-frontend:/usr/share/nginx/html/index.html ./
```

---

## Docker Compose

### Production Setup:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Development Setup:

```bash
# Start with development profile
docker-compose --profile development up -d

# View specific service logs
docker-compose logs -f frontend-dev
```

### Database Setup:

```bash
# Start with database
docker-compose --profile database up -d

# Access PostgreSQL
docker-compose exec postgres psql -U fleet_user -d fleet_db
```

### Full Stack:

```bash
# Start everything
docker-compose \
  --profile development \
  --profile database \
  --profile monitoring \
  up -d

# Scale frontend
docker-compose up -d --scale frontend=3

# Rebuild services
docker-compose up -d --build
```

### Environment Configuration:

Create `.env` file:
```env
# Application
NODE_ENV=production
VITE_AZURE_AD_CLIENT_ID=your-client-id
VITE_AZURE_AD_TENANT_ID=your-tenant-id

# Database
POSTGRES_DB=fleet_db
POSTGRES_USER=fleet_user
POSTGRES_PASSWORD=secure_password

# Redis
REDIS_PASSWORD=redis_password

# Build
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD)
```

---

## Production Deployment

### Container Registry:

```bash
# Tag for GitHub Container Registry
docker tag fleet-management:latest ghcr.io/asmortongpt/fleet-local:latest
docker tag fleet-management:latest ghcr.io/asmortongpt/fleet-local:v1.0.0

# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Push to registry
docker push ghcr.io/asmortongpt/fleet-local:latest
docker push ghcr.io/asmortongpt/fleet-local:v1.0.0
```

### Azure Container Registry:

```bash
# Login to ACR
az acr login --name yourregistry

# Tag for ACR
docker tag fleet-management:latest yourregistry.azurecr.io/fleet-management:latest

# Push to ACR
docker push yourregistry.azurecr.io/fleet-management:latest
```

### Production Best Practices:

1. **Use specific version tags** (not `latest`)
   ```bash
   docker pull ghcr.io/asmortongpt/fleet-local:v1.0.0
   ```

2. **Enable health checks**
   ```bash
   # Health check configured in Dockerfile
   curl -f http://localhost:8080/health.txt
   ```

3. **Set resource limits**
   ```yaml
   services:
     frontend:
       deploy:
         resources:
           limits:
             cpus: '0.50'
             memory: 256M
   ```

4. **Use secrets management**
   ```bash
   docker secret create app_secret secret.txt
   ```

5. **Enable logging**
   ```bash
   docker run \
     --log-driver=json-file \
     --log-opt max-size=10m \
     --log-opt max-file=3 \
     fleet-management:latest
   ```

---

## Monitoring & Logging

### Container Logs:

```bash
# View logs
docker logs fleet-frontend

# Follow logs
docker logs -f fleet-frontend

# Last 100 lines
docker logs --tail 100 fleet-frontend

# Logs with timestamps
docker logs -t fleet-frontend
```

### Health Checks:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' fleet-frontend

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' fleet-frontend

# Manual health check
curl -f http://localhost:8080/health.txt
```

### Resource Usage:

```bash
# Real-time stats
docker stats fleet-frontend

# One-time stats
docker stats --no-stream fleet-frontend

# All containers
docker stats
```

### Container Inspection:

```bash
# Full container details
docker inspect fleet-frontend

# Specific field
docker inspect --format='{{.Config.Image}}' fleet-frontend

# Network settings
docker inspect --format='{{.NetworkSettings.IPAddress}}' fleet-frontend
```

---

## Troubleshooting

### Container Won't Start:

```bash
# Check logs
docker logs fleet-frontend

# Check if port is in use
lsof -i :8080

# Start in foreground for debugging
docker run --rm -it fleet-management:latest

# Override entrypoint
docker run --rm -it --entrypoint sh fleet-management:latest
```

### Health Check Failing:

```bash
# Manual health check
curl -v http://localhost:8080/health.txt

# Check nginx logs
docker exec fleet-frontend cat /var/log/nginx/error.log

# Check if nginx is running
docker exec fleet-frontend ps aux | grep nginx
```

### Build Issues:

```bash
# Clean build without cache
docker build --no-cache -t fleet-management:latest .

# Check build context size
du -sh .

# Verify .dockerignore is working
docker build -t test . 2>&1 | grep "Sending build context"

# Debug specific stage
docker build --target builder -t debug .
```

### Performance Issues:

```bash
# Check resource usage
docker stats fleet-frontend

# Increase resources (Docker Desktop)
# Settings → Resources → Advanced

# Clear unused resources
docker system prune -a

# Check disk usage
docker system df
```

### Network Issues:

```bash
# Inspect network
docker network inspect fleet-network

# Check container connectivity
docker exec fleet-frontend ping -c 3 google.com

# Verify port binding
docker port fleet-frontend
```

---

## Best Practices

### Security:

1. **Use non-root user**
   ```dockerfile
   USER nginx-app
   ```

2. **Scan for vulnerabilities**
   ```bash
   docker scan fleet-management:latest
   ```

3. **Keep base images updated**
   ```bash
   docker pull nginx:1.25-alpine
   ```

4. **Use read-only filesystem**
   ```dockerfile
   securityContext:
     readOnlyRootFilesystem: true
   ```

### Performance:

1. **Minimize layers**
   - Combine RUN commands
   - Use multi-stage builds

2. **Leverage build cache**
   - Copy package files before source
   - Use BuildKit

3. **Optimize image size**
   - Use alpine base images
   - Remove unnecessary files
   - Use .dockerignore

### Reliability:

1. **Always use health checks**
2. **Set restart policies**
3. **Implement graceful shutdown**
4. **Use volume for persistent data**

---

## Quick Reference

### Common Commands:

```bash
# Build
docker build -t fleet-management:latest .

# Run
docker run -d -p 8080:8080 --name fleet fleet-management:latest

# Stop
docker stop fleet

# Logs
docker logs -f fleet

# Shell access
docker exec -it fleet sh

# Remove
docker rm -f fleet

# Cleanup
docker system prune -a
```

### Docker Compose:

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Rebuild
docker-compose up -d --build

# Cleanup
docker-compose down -v
```

---

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Docker Security](https://docs.docker.com/engine/security/)

---

**Last Updated**: 2025-12-31
**Maintained By**: Capital Tech Alliance DevOps Team
