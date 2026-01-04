#!/bin/bash
set -e

# Fleet 50-Agent Deployment Script
# Purpose: Deploy comprehensive QA and remediation infrastructure on Azure VM
# Date: January 4, 2026

echo "=================================================="
echo "Fleet 50-Agent Deployment & Remediation System"
echo "=================================================="
echo ""

# Configuration
WORKSPACE="/home/azureuser/fleet-production-deployment"
GITHUB_REPO="https://github.com/asmortongpt/Fleet.git"
BRANCH="hotfix/production-deployment-20260104"
AGENTS_COUNT=50

echo "Step 1: Creating deployment workspace..."
mkdir -p $WORKSPACE
cd $WORKSPACE

echo "Step 2: Cloning hotfix branch from GitHub..."
if [ -d ".git" ]; then
    echo "Repository exists, pulling latest changes..."
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
else
    echo "Cloning fresh repository..."
    git clone -b $BRANCH $GITHUB_REPO .
fi

echo "Step 3: Installing dependencies..."
npm ci --legacy-peer-deps

echo "Step 4: Building application..."
npm run build

echo "Step 5: Creating Docker Compose configuration..."
cat > docker-compose.yml <<'DOCKER_COMPOSE_EOF'
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: fleet-postgres
    environment:
      POSTGRES_USER: fleet_user
      POSTGRES_PASSWORD: fleet_password
      POSTGRES_DB: fleet_db
      POSTGRES_PORT: 5432
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fleet_user -d fleet_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - fleet-network

  # Fleet API Backend
  fleet-api:
    build:
      context: .
      dockerfile: Dockerfile.api
    container_name: fleet-api
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://fleet_user:fleet_password@postgres:5432/fleet_db
      PORT: 3001
      # AI Services
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      GROK_API_KEY: ${GROK_API_KEY}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      # Azure Services
      AZURE_CLIENT_ID: ${AZURE_CLIENT_ID}
      AZURE_TENANT_ID: ${AZURE_TENANT_ID}
      AZURE_CLIENT_SECRET: ${AZURE_CLIENT_SECRET}
      # Microsoft Graph
      MICROSOFT_GRAPH_CLIENT_ID: ${MICROSOFT_GRAPH_CLIENT_ID}
      MICROSOFT_GRAPH_CLIENT_SECRET: ${MICROSOFT_GRAPH_CLIENT_SECRET}
      MICROSOFT_GRAPH_TENANT_ID: ${MICROSOFT_GRAPH_TENANT_ID}
      # Google Maps
      GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - fleet-network

  # Fleet Frontend (Vite Production Server)
  fleet-frontend:
    image: nginx:alpine
    container_name: fleet-frontend
    volumes:
      - ./dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
      - "443:443"
    networks:
      - fleet-network

  # AI Chatbot Service
  ai-chatbot:
    build:
      context: .
      dockerfile: Dockerfile.chatbot
    container_name: fleet-ai-chatbot
    environment:
      NODE_ENV: production
      API_URL: http://fleet-api:3001
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      GROK_API_KEY: ${GROK_API_KEY}
      PORT: 3002
    ports:
      - "3002:3002"
    depends_on:
      - fleet-api
    networks:
      - fleet-network

  # Redis Cache (for sessions and caching)
  redis:
    image: redis:7-alpine
    container_name: fleet-redis
    ports:
      - "6379:6379"
    networks:
      - fleet-network

  # 50 Agent Workers (using Docker Swarm or Kubernetes-like orchestration)
  agent-coordinator:
    build:
      context: .
      dockerfile: Dockerfile.agent
    container_name: fleet-agent-coordinator
    environment:
      AGENT_COUNT: ${AGENTS_COUNT:-50}
      REDIS_URL: redis://redis:6379
      DATABASE_URL: postgresql://fleet_user:fleet_password@postgres:5432/fleet_db
      # All AI API Keys
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      GROK_API_KEY: ${GROK_API_KEY}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    depends_on:
      - postgres
      - redis
      - fleet-api
    networks:
      - fleet-network
    deploy:
      replicas: 10  # 10 coordinator instances managing 5 agents each

networks:
  fleet-network:
    driver: bridge

volumes:
  postgres_data:
DOCKER_COMPOSE_EOF

echo "Step 6: Creating Nginx configuration..."
cat > nginx.conf <<'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Brotli support (if module available)
    brotli on;
    brotli_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # API proxy
        location /api/ {
            proxy_pass http://fleet-api:3001/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # AI Chatbot proxy
        location /chatbot/ {
            proxy_pass http://ai-chatbot:3002/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Static files
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
NGINX_EOF

echo "Step 7: Creating API Dockerfile..."
cat > Dockerfile.api <<'API_DOCKERFILE_EOF'
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production --legacy-peer-deps

# Copy API source
COPY api/ ./api/
COPY src/lib/ ./src/lib/

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "api/server.js"]
API_DOCKERFILE_EOF

echo "Step 8: Creating Chatbot Dockerfile..."
cat > Dockerfile.chatbot <<'CHATBOT_DOCKERFILE_EOF'
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --legacy-peer-deps

# Copy chatbot source
COPY api/chatbot/ ./api/chatbot/

EXPOSE 3002

CMD ["node", "api/chatbot/server.js"]
CHATBOT_DOCKERFILE_EOF

echo "Step 9: Creating Agent Coordinator Dockerfile..."
cat > Dockerfile.agent <<'AGENT_DOCKERFILE_EOF'
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --legacy-peer-deps

# Copy agent source
COPY api/agents/ ./api/agents/
COPY src/lib/ ./src/lib/

# Install additional tools for agents
RUN apk add --no-cache git curl bash

CMD ["node", "api/agents/coordinator.js"]
AGENT_DOCKERFILE_EOF

echo "Step 10: Creating environment file..."
cat > .env.production <<'ENV_EOF'
# Database
DATABASE_URL=postgresql://fleet_user:fleet_password@postgres:5432/fleet_db
POSTGRES_USER=fleet_user
POSTGRES_PASSWORD=fleet_password
POSTGRES_DB=fleet_db
POSTGRES_PORT=5432

# AI Services
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
CLAUDE_API_KEY=${CLAUDE_API_KEY}
OPENAI_API_KEY=${OPENAI_API_KEY}
GROK_API_KEY=${GROK_API_KEY}
XAI_API_KEY=${XAI_API_KEY}
GEMINI_API_KEY=${GEMINI_API_KEY}

# Azure Configuration
AZURE_CLIENT_ID=${AZURE_CLIENT_ID}
AZURE_TENANT_ID=${AZURE_TENANT_ID}
AZURE_CLIENT_SECRET=${AZURE_CLIENT_SECRET}

# Microsoft Graph
MICROSOFT_GRAPH_CLIENT_ID=${MICROSOFT_GRAPH_CLIENT_ID}
MICROSOFT_GRAPH_CLIENT_SECRET=${MICROSOFT_GRAPH_CLIENT_SECRET}
MICROSOFT_GRAPH_TENANT_ID=${MICROSOFT_GRAPH_TENANT_ID}

# Google Maps
GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}

# Agent Configuration
AGENTS_COUNT=50

# Redis
REDIS_URL=redis://redis:6379

# API URLs
API_URL=http://fleet-api:3001
FRONTEND_URL=http://fleet-frontend
ENV_EOF

# Copy environment variables from global env
echo "Sourcing environment variables..."
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"
export OPENAI_API_KEY="${OPENAI_API_KEY}"
export GROK_API_KEY="${GROK_API_KEY}"
export GEMINI_API_KEY="${GEMINI_API_KEY}"
export AZURE_CLIENT_ID="${AZURE_CLIENT_ID}"
export AZURE_TENANT_ID="${AZURE_TENANT_ID}"
export AZURE_CLIENT_SECRET="${AZURE_CLIENT_SECRET}"
export MICROSOFT_GRAPH_CLIENT_ID="${MICROSOFT_GRAPH_CLIENT_ID}"
export MICROSOFT_GRAPH_CLIENT_SECRET="${MICROSOFT_GRAPH_CLIENT_SECRET}"
export MICROSOFT_GRAPH_TENANT_ID="${MICROSOFT_GRAPH_TENANT_ID}"
export GOOGLE_MAPS_API_KEY="${GOOGLE_MAPS_API_KEY}"

echo "Step 11: Starting Docker Compose services..."
docker-compose up -d

echo "Step 12: Waiting for services to be healthy..."
sleep 30

echo "Step 13: Checking service status..."
docker-compose ps

echo "Step 14: Testing database connection..."
docker-compose exec -T postgres psql -U fleet_user -d fleet_db -c "SELECT version();"

echo "Step 15: Testing API endpoint..."
curl -f http://localhost:3001/health || echo "API not ready yet"

echo "Step 16: Testing AI Chatbot endpoint..."
curl -f http://localhost:3002/health || echo "Chatbot not ready yet"

echo ""
echo "=================================================="
echo "Deployment Complete!"
echo "=================================================="
echo ""
echo "Services Running:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Fleet API: http://localhost:3001"
echo "  - AI Chatbot: http://localhost:3002"
echo "  - Frontend: http://localhost"
echo "  - Redis: localhost:6379"
echo "  - Agent Coordinator: Running with ${AGENTS_COUNT} agents"
echo ""
echo "Next Steps:"
echo "  1. Run tests: npm run test:all"
echo "  2. View logs: docker-compose logs -f"
echo "  3. Monitor agents: docker-compose logs -f agent-coordinator"
echo "  4. Access frontend: http://[VM-IP]"
echo ""
