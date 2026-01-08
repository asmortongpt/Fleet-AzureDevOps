"""
WebSocket Service - Real-time event broadcasting via Socket.IO.
Handles WebSocket connections, authentication, room management, and Kafka event streaming.
"""
import os
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional
from datetime import datetime

import socketio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import redis.asyncio as aioredis

from auth import WebSocketAuth, AuthenticationError
from kafka_consumer import KafkaEventConsumer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Environment configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
PORT = int(os.getenv("WEBSOCKET_PORT", "8001"))
PING_INTERVAL = int(os.getenv("PING_INTERVAL", "25"))  # seconds
PING_TIMEOUT = int(os.getenv("PING_TIMEOUT", "60"))  # seconds

# Global instances
kafka_consumer: Optional[KafkaEventConsumer] = None
redis_client: Optional[aioredis.Redis] = None
auth_manager: Optional[WebSocketAuth] = None


# Pydantic models for API
class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(description="Service status")
    timestamp: str = Field(description="Current timestamp")
    websocket_connected: int = Field(description="Number of connected WebSocket clients")
    kafka_status: Dict[str, Any] = Field(description="Kafka consumer status")


class SubscribeRequest(BaseModel):
    """Room subscription request."""
    room: str = Field(description="Room identifier to subscribe to")


class UnsubscribeRequest(BaseModel):
    """Room unsubscription request."""
    room: str = Field(description="Room identifier to unsubscribe from")


# Socket.IO server setup
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=CORS_ORIGINS,
    logger=True,
    engineio_logger=False,
    ping_interval=PING_INTERVAL,
    ping_timeout=PING_TIMEOUT,
    max_http_buffer_size=1024 * 1024,  # 1MB
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown of external services.
    """
    global kafka_consumer, redis_client, auth_manager

    logger.info("Starting WebSocket service...")

    # Initialize Redis
    try:
        redis_client = await aioredis.from_url(
            REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        await redis_client.ping()
        logger.info("Connected to Redis")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {str(e)}")
        redis_client = None

    # Initialize authentication
    auth_manager = WebSocketAuth(jwt_secret=JWT_SECRET, jwt_algorithm=JWT_ALGORITHM)
    logger.info("Authentication manager initialized")

    # Initialize Kafka consumer
    try:
        kafka_consumer = KafkaEventConsumer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            sio=sio
        )
        await kafka_consumer.start()
        logger.info("Kafka consumer started")
    except Exception as e:
        logger.error(f"Failed to start Kafka consumer: {str(e)}")
        kafka_consumer = None

    logger.info("WebSocket service startup complete")

    yield

    # Shutdown
    logger.info("Shutting down WebSocket service...")

    if kafka_consumer:
        await kafka_consumer.stop()

    if redis_client:
        await redis_client.close()

    logger.info("WebSocket service shutdown complete")


# FastAPI app
app = FastAPI(
    title="Radio Fleet Dispatch - WebSocket Service",
    description="Real-time event broadcasting via WebSocket/Socket.IO",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Socket.IO app
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)


# Socket.IO event handlers
@sio.event
async def connect(sid: str, environ: Dict[str, Any], auth: Optional[Dict[str, Any]]):
    """
    Handle new WebSocket connection.

    Args:
        sid: Socket session ID
        environ: ASGI environ dict
        auth: Authentication data from client
    """
    try:
        # Extract token from auth data
        if not auth or "token" not in auth:
            logger.warning(f"Connection attempt without token, sid={sid}")
            return False

        token = auth["token"]

        # Validate token
        try:
            user_payload = auth_manager.validate_token(token)
        except AuthenticationError as e:
            logger.warning(f"Authentication failed for sid={sid}: {str(e)}")
            return False

        # Create session
        auth_manager.create_session(sid, user_payload)

        # Store session in Redis for distributed setups
        if redis_client:
            try:
                await redis_client.setex(
                    f"ws:session:{sid}",
                    3600,  # 1 hour TTL
                    str(user_payload)
                )
            except Exception as e:
                logger.error(f"Failed to store session in Redis: {str(e)}")

        logger.info(
            f"Client connected: sid={sid}, user={user_payload.get('sub')}, "
            f"org={user_payload.get('organization_id')}"
        )

        # Auto-join organization room
        org_id = user_payload.get("organization_id")
        if org_id:
            org_room = f"org:{org_id}"
            await sio.enter_room(sid, org_room)
            auth_manager.add_room_to_session(sid, org_room)
            logger.info(f"Client {sid} joined organization room {org_room}")

        return True

    except Exception as e:
        logger.error(f"Error in connect handler: {str(e)}", exc_info=True)
        return False


@sio.event
async def disconnect(sid: str):
    """
    Handle client disconnect.

    Args:
        sid: Socket session ID
    """
    try:
        session = auth_manager.get_session(sid)
        if session:
            logger.info(
                f"Client disconnected: sid={sid}, user={session.get('user_id')}"
            )
        else:
            logger.info(f"Client disconnected: sid={sid}")

        # Clean up session
        auth_manager.destroy_session(sid)

        # Remove from Redis
        if redis_client:
            try:
                await redis_client.delete(f"ws:session:{sid}")
            except Exception as e:
                logger.error(f"Failed to remove session from Redis: {str(e)}")

    except Exception as e:
        logger.error(f"Error in disconnect handler: {str(e)}", exc_info=True)


@sio.event
async def subscribe(sid: str, data: Dict[str, Any]):
    """
    Handle room subscription request.

    Args:
        sid: Socket session ID
        data: Subscription data containing 'room' field
    """
    try:
        room = data.get("room")
        if not room:
            await sio.emit("error", {"message": "Room not specified"}, room=sid)
            return

        # Get session
        session = auth_manager.get_session(sid)
        if not session:
            await sio.emit("error", {"message": "Session not found"}, room=sid)
            return

        # Check authorization
        user_payload = {
            "sub": session.get("user_id"),
            "organization_id": session.get("organization_id"),
            "roles": session.get("roles", [])
        }

        if not auth_manager.authorize_room_access(user_payload, room):
            await sio.emit("error", {"message": "Not authorized for this room"}, room=sid)
            logger.warning(
                f"User {session.get('user_id')} unauthorized for room {room}"
            )
            return

        # Join room
        await sio.enter_room(sid, room)
        auth_manager.add_room_to_session(sid, room)

        await sio.emit("subscribed", {"room": room}, room=sid)
        logger.info(f"Client {sid} subscribed to room {room}")

    except Exception as e:
        logger.error(f"Error in subscribe handler: {str(e)}", exc_info=True)
        await sio.emit("error", {"message": "Subscription failed"}, room=sid)


@sio.event
async def unsubscribe(sid: str, data: Dict[str, Any]):
    """
    Handle room unsubscription request.

    Args:
        sid: Socket session ID
        data: Unsubscription data containing 'room' field
    """
    try:
        room = data.get("room")
        if not room:
            await sio.emit("error", {"message": "Room not specified"}, room=sid)
            return

        # Leave room
        await sio.leave_room(sid, room)
        auth_manager.remove_room_from_session(sid, room)

        await sio.emit("unsubscribed", {"room": room}, room=sid)
        logger.info(f"Client {sid} unsubscribed from room {room}")

    except Exception as e:
        logger.error(f"Error in unsubscribe handler: {str(e)}", exc_info=True)
        await sio.emit("error", {"message": "Unsubscription failed"}, room=sid)


@sio.event
async def ping(sid: str):
    """
    Handle ping from client.

    Args:
        sid: Socket session ID
    """
    await sio.emit("pong", {"timestamp": datetime.utcnow().isoformat()}, room=sid)


# REST API endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    kafka_status = {"connected": False, "running": False}
    if kafka_consumer:
        kafka_status = await kafka_consumer.health_check()

    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        websocket_connected=auth_manager.get_active_sessions_count() if auth_manager else 0,
        kafka_status=kafka_status
    )


@app.get("/ready")
async def readiness_check():
    """Readiness check endpoint - service is ready to accept connections."""
    # Check if critical components are initialized
    if not auth_manager:
        raise HTTPException(status_code=503, detail="Auth manager not initialized")

    if not redis_client:
        raise HTTPException(status_code=503, detail="Redis not connected")

    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Radio Fleet Dispatch - WebSocket Service",
        "version": "1.0.0",
        "websocket_path": "/ws",
        "health_path": "/health"
    }


@app.get("/stats")
async def get_stats():
    """Get service statistics."""
    if not auth_manager:
        raise HTTPException(status_code=503, detail="Service not initialized")

    active_sessions = auth_manager.get_active_sessions_count()

    # Get Redis stats
    redis_stats = None
    if redis_client:
        try:
            redis_info = await redis_client.info()
            redis_stats = {
                "connected_clients": redis_info.get("connected_clients"),
                "used_memory_human": redis_info.get("used_memory_human"),
            }
        except Exception as e:
            logger.error(f"Error getting Redis stats: {str(e)}")

    return {
        "active_websocket_connections": active_sessions,
        "kafka_consumer_running": kafka_consumer.running if kafka_consumer else False,
        "redis_stats": redis_stats,
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:socket_app",
        host="0.0.0.0",
        port=PORT,
        log_level="info",
        access_log=True,
        reload=False  # Disable in production
    )
