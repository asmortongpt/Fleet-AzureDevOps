# WebSocket Service - Quick Start Guide

## Prerequisites

- Python 3.11+
- Redis (for session management)
- Kafka (for event streaming)
- JWT token from the API service

## Option 1: Quick Start with Docker Compose (Recommended)

This starts everything needed: WebSocket service, Redis, Kafka, and Zookeeper.

```bash
# 1. Create .env file
cp .env.example .env
# Edit .env with your JWT_SECRET

# 2. Start all services
make docker-run

# 3. Check logs
make docker-logs

# 4. Check health
curl http://localhost:8001/health
```

## Option 2: Local Development

### Step 1: Install Dependencies

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### Step 2: Start Required Services

```bash
# Start Redis (in separate terminal)
redis-server

# Start Kafka (in separate terminal or use docker-compose)
# See docker-compose.yml for Kafka setup
```

### Step 3: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
# Minimum required:
# - JWT_SECRET (must match API service)
# - KAFKA_BOOTSTRAP_SERVERS
# - REDIS_URL
```

### Step 4: Run Service

```bash
# Option A: Using start script
./start.sh

# Option B: Using Make
make dev

# Option C: Direct Python
python main.py

# Option D: Using uvicorn with auto-reload
uvicorn main:socket_app --host 0.0.0.0 --port 8001 --reload
```

## Testing the Service

### 1. Health Check

```bash
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-17T17:00:00Z",
  "websocket_connected": 0,
  "kafka_status": {
    "running": true,
    "connected": true
  }
}
```

### 2. Test with HTML Client

```bash
# Open test_client.html in browser
open test_client.html

# Or start a simple HTTP server
python -m http.server 8080
# Then navigate to http://localhost:8080/test_client.html
```

### 3. Test with Python Client

```bash
# Get a JWT token from your API service first
export JWT_TOKEN="your-jwt-token-here"

# Connect and listen
./test_client.py --token $JWT_TOKEN

# Connect and subscribe to specific rooms
./test_client.py --token $JWT_TOKEN --rooms "channel:123:org:456" "incident:789:org:456"

# Run for specific duration (seconds)
./test_client.py --token $JWT_TOKEN --duration 60
```

### 4. Test with JavaScript/TypeScript

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:8001', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected!');

  // Subscribe to organization room (automatic)
  // Subscribe to specific channel
  socket.emit('subscribe', { room: 'channel:123:org:456' });
});

socket.on('transmission_started', (data) => {
  console.log('Transmission started:', data);
});

socket.on('transcription_completed', (data) => {
  console.log('Transcription:', data.transcription);
});
```

## Common Room Patterns

### Organization Room (Automatic)
```
org:{organization_id}
```
Automatically joined on connection. Receives organization-wide events.

### Channel Room
```
channel:{channel_id}:org:{organization_id}
```
Receives transmission and transcription events for specific radio channel.

### Incident Room
```
incident:{incident_id}:org:{organization_id}
```
Receives incident updates, task assignments, and related transmissions.

### Asset Room
```
asset:{asset_id}:org:{organization_id}
```
Receives position updates and status changes for specific asset/vehicle.

## Event Types Broadcasted

| Event Name                 | When Triggered                          |
|---------------------------|-----------------------------------------|
| `transmission_started`     | Radio transmission begins               |
| `transmission_completed`   | Radio transmission ends                 |
| `transcription_completed`  | Speech-to-text completes                |
| `transmission_tagged`      | Transmission tagged/categorized         |
| `incident_created`         | New incident created                    |
| `incident_updated`         | Incident details updated                |
| `incident_status_changed`  | Incident status changes                 |
| `task_assigned`            | Task assigned to user                   |
| `task_completed`           | Task marked complete                    |
| `task_updated`             | Task details updated                    |
| `asset_position_updated`   | Vehicle/asset GPS position updates      |
| `asset_status_changed`     | Vehicle/asset status changes            |
| `alert_created`            | System alert created                    |
| `alert_acknowledged`       | Alert acknowledged by user              |

## Troubleshooting

### Connection Fails with "Invalid token"

**Problem**: JWT token is invalid or expired

**Solution**:
1. Generate new token from API service
2. Verify JWT_SECRET matches between API and WebSocket services
3. Check token expiration time

### No Events Received

**Problem**: Not receiving events despite successful connection

**Solution**:
1. Verify Kafka consumer is running: `curl http://localhost:8001/health`
2. Check you're subscribed to correct room
3. Verify events are being published to Kafka topics
4. Check Kafka consumer logs

### Redis Connection Error

**Problem**: "Failed to connect to Redis"

**Solution**:
1. Verify Redis is running: `redis-cli ping`
2. Check REDIS_URL in .env
3. Verify Redis is accessible from service

### Kafka Connection Error

**Problem**: "Failed to connect to Kafka"

**Solution**:
1. Verify Kafka is running
2. Check KAFKA_BOOTSTRAP_SERVERS in .env
3. Verify topics exist: `kafka-topics --list --bootstrap-server localhost:9092`

## Production Deployment

### Environment Variables (Production)

```bash
# Service
MODE=production
WEBSOCKET_PORT=8001
LOG_LEVEL=INFO

# Security
JWT_SECRET=<strong-random-secret>
JWT_ALGORITHM=HS256

# Infrastructure
KAFKA_BOOTSTRAP_SERVERS=kafka-broker-1:9092,kafka-broker-2:9092,kafka-broker-3:9092
REDIS_URL=redis://redis-cluster:6379/0

# CORS (adjust for your frontend domains)
CORS_ORIGINS=https://app.example.com,https://admin.example.com

# Connection tuning
PING_INTERVAL=25
PING_TIMEOUT=60
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: websocket-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: websocket-service
  template:
    metadata:
      labels:
        app: websocket-service
    spec:
      containers:
      - name: websocket
        image: radio-fleet-websocket:latest
        ports:
        - containerPort: 8001
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        - name: KAFKA_BOOTSTRAP_SERVERS
          value: "kafka:9092"
        - name: REDIS_URL
          value: "redis://redis:6379/0"
        livenessProbe:
          httpGet:
            path: /health
            port: 8001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8001
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Load Balancer Configuration

For sticky sessions (recommended):
- Use cookie-based session affinity
- Session cookie name: `io` (Socket.IO default)
- Enable WebSocket upgrade support

## Monitoring

### Metrics to Monitor

- Active WebSocket connections: `/stats` endpoint
- Kafka consumer lag
- Redis connection pool usage
- Message throughput (messages/second)
- Connection/disconnection rate
- Error rate

### Health Check Endpoint

```bash
# Kubernetes liveness probe
GET /health

# Returns 200 if healthy, 503 if not
```

### Logs to Watch

```bash
# Connection events
"Client connected: sid=..."
"Client disconnected: sid=..."

# Authentication
"Token validated for user..."
"Authentication failed for sid=..."

# Room subscriptions
"Client {sid} subscribed to room..."
"User {user_id} unauthorized for room..."

# Kafka consumer
"Kafka consumer started"
"Broadcasted {event} to room..."
```

## Getting Help

- **README.md**: Comprehensive documentation
- **API Documentation**: `/docs` endpoint (FastAPI auto-generated)
- **Health Status**: `/health` endpoint
- **Service Stats**: `/stats` endpoint

## Next Steps

1. ✅ Service is running
2. 📝 Update JWT_SECRET in production
3. 🔐 Configure CORS for your frontend domains
4. 📊 Set up monitoring and alerting
5. 🚀 Deploy to production environment
6. 📈 Monitor connection count and throughput
7. 🔄 Set up horizontal scaling as needed
