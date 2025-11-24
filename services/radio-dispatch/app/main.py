"""FastAPI application entry point with Socket.IO."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import socketio

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.api import router as api_router

# Setup logging
setup_logging()
logger = get_logger(__name__)

# Socket.IO server
sio = socketio.AsyncServer(
    async_mode=settings.SOCKETIO_ASYNC_MODE,
    cors_allowed_origins=settings.SOCKETIO_CORS_ALLOWED_ORIGINS,
    logger=True,
    engineio_logger=True
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    logger.info("Starting Radio Dispatch Service",
                version=settings.APP_VERSION,
                debug=settings.DEBUG)

    # Startup tasks
    yield

    # Shutdown tasks
    logger.info("Shutting down Radio Dispatch Service")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Socket.IO
socket_app = socketio.ASGIApp(
    socketio_server=sio,
    other_asgi_app=app,
    socketio_path="/socket.io"
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return JSONResponse(
        content={
            "status": "healthy",
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION
        }
    )


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs" if settings.DEBUG else None
    }


# ==========================================
# Socket.IO Event Handlers
# ==========================================

@sio.event
async def connect(sid, environ):
    """Handle client connection."""
    logger.info("Client connected", sid=sid)
    await sio.emit("connection_established", {"sid": sid}, to=sid)


@sio.event
async def disconnect(sid):
    """Handle client disconnection."""
    logger.info("Client disconnected", sid=sid)


@sio.event
async def subscribe_channel(sid, data):
    """Subscribe to radio channel updates."""
    channel_id = data.get("channel_id")
    if channel_id:
        await sio.enter_room(sid, f"channel_{channel_id}")
        logger.info("Client subscribed to channel",
                    sid=sid,
                    channel_id=channel_id)
        await sio.emit("subscribed", {"channel_id": channel_id}, to=sid)


@sio.event
async def unsubscribe_channel(sid, data):
    """Unsubscribe from radio channel updates."""
    channel_id = data.get("channel_id")
    if channel_id:
        await sio.leave_room(sid, f"channel_{channel_id}")
        logger.info("Client unsubscribed from channel",
                    sid=sid,
                    channel_id=channel_id)


# Helper function to emit real-time events
async def emit_transmission_event(channel_id: str, event_type: str, data: dict):
    """Emit real-time transmission event to subscribed clients."""
    await sio.emit(
        event_type,
        data,
        room=f"channel_{channel_id}"
    )
    logger.debug("Emitted transmission event",
                 channel_id=channel_id,
                 event_type=event_type)


# Export socket app for uvicorn
app_with_socketio = socket_app
