# WebSocket Service

Real-time event broadcasting service for Radio Fleet Dispatch using Socket.IO over WebSocket.

## Overview

This service provides real-time event streaming to connected clients via WebSocket connections. It consumes events from Kafka topics and broadcasts them to appropriate Socket.IO rooms based on organization, channel, incident, and asset scoping.

## Features

- **JWT Authentication**: Secure WebSocket connections with JWT token validation
- **Room-Based Broadcasting**: Automatic routing to organization, channel, incident, and asset rooms
- **Kafka Integration**: Consumes events from Kafka topics for real-time updates
- **Redis Session Management**: Distributed session storage for horizontal scaling
- **Connection Management**: Automatic heartbeat/ping-pong, reconnection handling
- **Authorization**: Fine-grained room access control based on user roles and organization
- **Health Monitoring**: Health check and statistics endpoints

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Clients   │◄───────►│  WebSocket Svc   │◄───────►│    Kafka    │
│  (Browser)  │  WS/HTTP│   (Socket.IO)    │  Events │   Brokers   │
└─────────────┘         └──────────────────┘         └─────────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │    Redis    │
                        │  (Sessions) │
                        └─────────────┘
```

## Event Types

The service broadcasts the following events:

| Socket.IO Event            | Kafka Event Type           | Target Rooms                    |
|---------------------------|---------------------------|---------------------------------|
| `transmission_started`     | `transmission.started`    | Channel, Incident               |
| `transmission_completed`   | `transmission.completed`  | Channel, Incident               |
| `transcription_completed`  | `transcription.completed` | Channel, Incident               |
| `transmission_tagged`      | `transmission.tagged`     | Channel, Incident               |
| `incident_created`         | `incident.created`        | Incident, Organization          |
| `incident_updated`         | `incident.updated`        | Incident                        |
| `incident_status_changed`  | `incident.status_changed` | Incident                        |
| `task_assigned`            | `task.assigned`           | Incident                        |
| `task_completed`           | `task.completed`          | Incident                        |
| `task_updated`             | `task.updated`            | Incident                        |
| `asset_position_updated`   | `asset.position_updated`  | Asset, Incident (if assigned)   |
| `asset_status_changed`     | `asset.status_changed`    | Asset, Incident (if assigned)   |
| `alert_created`            | `alert.created`           | Organization                    |
| `alert_acknowledged`       | `alert.acknowledged`      | Organization                    |

## Room Structure

Rooms follow a hierarchical naming convention:

- **Organization**: `org:{organization_id}`
- **Channel**: `channel:{channel_id}:org:{organization_id}`
- **Incident**: `incident:{incident_id}:org:{organization_id}`
- **Asset**: `asset:{asset_id}:org:{organization_id}`

## Client Usage

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:8001', {
  auth: {
    token: 'your-jwt-token'
  },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### Subscribe to Rooms

```javascript
// Subscribe to channel updates
socket.emit('subscribe', { room: 'channel:123:org:456' });

// Subscribe to incident updates
socket.emit('subscribe', { room: 'incident:789:org:456' });

// Listen for subscription confirmation
socket.on('subscribed', (data) => {
  console.log('Subscribed to:', data.room);
});
```

### Listen for Events

```javascript
// Listen for transmission events
socket.on('transmission_started', (data) => {
  console.log('Transmission started:', data);
});

socket.on('transcription_completed', (data) => {
  console.log('Transcription:', data.transcription);
});

// Listen for incident events
socket.on('incident_updated', (data) => {
  console.log('Incident updated:', data);
});

// Listen for asset position updates
socket.on('asset_position_updated', (data) => {
  console.log('Asset position:', data.latitude, data.longitude);
});
```

### Unsubscribe from Rooms

```javascript
socket.emit('unsubscribe', { room: 'channel:123:org:456' });

socket.on('unsubscribed', (data) => {
  console.log('Unsubscribed from:', data.room);
});
```

### Error Handling

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);

  if (reason === 'io server disconnect') {
    // Server disconnected, manually reconnect
    socket.connect();
  }
});
```

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-17T12:00:00Z",
  "websocket_connected": 42,
  "kafka_status": {
    "running": true,
    "connected": true,
    "topics": ["radio.events.transmission", "..."],
    "group_id": "websocket-service"
  }
}
```

### Statistics
```
GET /stats
```

Response:
```json
{
  "active_websocket_connections": 42,
  "kafka_consumer_running": true,
  "redis_stats": {
    "connected_clients": 5,
    "used_memory_human": "2.5M"
  },
  "timestamp": "2025-10-17T12:00:00Z"
}
```

## Development

### Local Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run the service**:
   ```bash
   python main.py
   ```

   Or with uvicorn directly:
   ```bash
   uvicorn main:socket_app --host 0.0.0.0 --port 8001 --reload
   ```

### Docker Build

```bash
docker build -t radio-fleet-websocket:latest .
```

### Docker Run

```bash
docker run -d \
  --name websocket-service \
  -p 8001:8001 \
  -e JWT_SECRET=your-secret \
  -e KAFKA_BOOTSTRAP_SERVERS=kafka:9092 \
  -e REDIS_URL=redis://redis:6379 \
  radio-fleet-websocket:latest
```

## Configuration

### Environment Variables

| Variable                  | Description                          | Default               |
|--------------------------|--------------------------------------|-----------------------|
| `WEBSOCKET_PORT`         | Service port                         | `8001`                |
| `JWT_SECRET`             | JWT signing secret                   | *Required*            |
| `JWT_ALGORITHM`          | JWT algorithm                        | `HS256`               |
| `KAFKA_BOOTSTRAP_SERVERS`| Kafka broker addresses               | `localhost:9092`      |
| `REDIS_URL`              | Redis connection URL                 | `redis://localhost:6379` |
| `CORS_ORIGINS`           | Allowed CORS origins (comma-sep)     | `http://localhost:3000` |
| `PING_INTERVAL`          | Ping interval in seconds             | `25`                  |
| `PING_TIMEOUT`           | Ping timeout in seconds              | `60`                  |
| `LOG_LEVEL`              | Logging level                        | `INFO`                |

### Kafka Topics

The service subscribes to these topics by default:
- `radio.events.transmission`
- `radio.events.transcription`
- `radio.events.incident`
- `radio.events.task`
- `radio.events.asset`
- `radio.events.alert`

## Security

### Authentication

All WebSocket connections **must** provide a valid JWT token in the connection handshake:

```javascript
{
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIs...'
  }
}
```

Required JWT claims:
- `sub`: User ID
- `organization_id`: Organization ID
- `exp`: Expiration timestamp

Optional claims:
- `roles`: Array of user roles

### Authorization

Room access is controlled based on:
1. **Organization membership**: Users can only join rooms in their organization
2. **Role-based access**: Certain rooms require specific roles (e.g., operator)
3. **Resource ownership**: Users must have access to the specific resource (channel, incident, etc.)

## Monitoring

### Health Checks

The service exposes a `/health` endpoint for health monitoring:
- Kubernetes liveness probes
- Load balancer health checks
- Service mesh health

### Metrics

Consider integrating with:
- Prometheus (connection count, message throughput)
- OpenTelemetry (distributed tracing)
- Azure Application Insights

### Logging

Structured logs include:
- Connection/disconnection events
- Authentication failures
- Room subscriptions
- Message broadcasting
- Kafka consumer status
- Error conditions

## Scaling

### Horizontal Scaling

To run multiple instances:

1. **Use Redis adapter** for Socket.IO:
   - Enables cross-instance message broadcasting
   - Shares session state across instances

2. **Load balancer configuration**:
   - Sticky sessions (recommended)
   - WebSocket support enabled

3. **Kafka consumer groups**:
   - Each instance joins the same consumer group
   - Messages are distributed across instances

### Vertical Scaling

Single instance can handle:
- ~10,000 concurrent connections
- ~100,000 messages/second throughput

Adjust based on:
- Message size
- Broadcasting fanout
- Hardware resources

## Troubleshooting

### Connection Refused

- Check JWT token validity
- Verify CORS origins
- Ensure service is running

### No Events Received

- Verify room subscription
- Check Kafka consumer status (`/health`)
- Verify event is published to Kafka

### Authentication Failures

- Check JWT secret matches API service
- Verify token hasn't expired
- Ensure required claims are present

### High Memory Usage

- Check for connection leaks
- Monitor Redis memory usage
- Adjust consumer max poll records

## Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/
```

## License

Copyright (c) 2025 Radio Fleet Dispatch
