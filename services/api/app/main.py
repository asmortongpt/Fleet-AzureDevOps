"""
Radio Fleet Dispatch API
FastAPI application with CORS configuration for production deployment
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import logging
import os

# Import CSRF middleware
from app.middleware.csrf import CSRFMiddleware, generate_csrf_token

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Radio Fleet Dispatch API",
    description="Production-ready API for radio monitoring, dispatch coordination, and fleet management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# =============================================================================
# CORS Configuration
# =============================================================================
# Allow multiple origins for development, staging, and production
# IMPORTANT: These origins must match your deployed frontend URLs

ALLOWED_ORIGINS = [
    # Local development
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",

    # Production domains
    "https://fleet.capitaltechalliance.com",

    # Azure Static Web Apps (current deployments)
    "https://green-pond-0f040980f.3.azurestaticapps.net",
    "https://purple-river-0f465960f.3.azurestaticapps.net",

    # Capital Tech Hub (if integrated)
    "https://capitaltechhub.com",
    "https://www.capitaltechhub.com",
]

# Allow environment variable to add additional origins
# Format: ADDITIONAL_CORS_ORIGINS=https://example1.com,https://example2.com
additional_origins = os.getenv("ADDITIONAL_CORS_ORIGINS", "").split(",")
for origin in additional_origins:
    if origin.strip():
        ALLOWED_ORIGINS.append(origin.strip())

logger.info(f"CORS enabled for origins: {ALLOWED_ORIGINS}")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "User-Agent",
        "DNT",
        "Cache-Control",
        "X-Mx-ReqToken",
        "Keep-Alive",
        "X-Requested-With",
        "If-Modified-Since",
    ],
    expose_headers=["Content-Length", "Content-Type"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Add Trusted Host middleware for security
# Only accept requests from known hosts
ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "fleet.capitaltechalliance.com",
    "green-pond-0f040980f.3.azurestaticapps.net",
    "purple-river-0f465960f.3.azurestaticapps.net",
    "*.capitaltechalliance.com",
    "*.azurewebsites.net",
]

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=ALLOWED_HOSTS
)

# Add CSRF Protection Middleware
# IMPORTANT: Add CSRF middleware AFTER CORS and TrustedHost but BEFORE routes
app.add_middleware(
    CSRFMiddleware,
    allowed_origins=set(ALLOWED_ORIGINS)
)

# =============================================================================
# Health Check Endpoints
# =============================================================================

class HealthResponse(BaseModel):
    """Health check response model"""
    status: str
    version: str
    environment: str


@app.get("/health", response_model=HealthResponse, tags=["Health"])
@app.get("/healthz", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint for load balancers and monitoring
    Returns 200 OK if service is healthy
    """
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        environment=os.getenv("MODE", "development")
    )


@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint - API information
    """
    return {
        "name": "Radio Fleet Dispatch API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "health": "/health",
        "cors_origins": len(ALLOWED_ORIGINS),
    }


# =============================================================================
# CORS Test Endpoint
# =============================================================================

@app.get("/cors-test", tags=["Development"])
async def cors_test():
    """
    Test endpoint to verify CORS is working correctly
    Call this from your frontend to ensure CORS is properly configured
    """
    return {
        "message": "CORS is working correctly!",
        "allowed_origins": ALLOWED_ORIGINS,
        "timestamp": __import__("datetime").datetime.now().isoformat(),
    }


# =============================================================================
# CSRF Token Endpoint
# =============================================================================

class CSRFTokenResponse(BaseModel):
    """CSRF token response model"""
    csrf_token: str
    expires_in: int  # seconds


@app.get("/csrf-token", response_model=CSRFTokenResponse, tags=["Security"])
async def get_csrf_token_endpoint(request: Request):
    """
    Get a CSRF token for use in state-changing requests.

    This endpoint generates a new CSRF token and returns it.
    The token is also set as a cookie in the response.

    Frontend applications should:
    1. Call this endpoint when the application loads
    2. Include the token in the X-CSRF-Token header for POST/PUT/PATCH/DELETE requests
    3. The cookie will be automatically sent with requests

    Returns:
        CSRFTokenResponse: The CSRF token and expiration time
    """
    # Check if token already exists in cookie
    existing_token = request.cookies.get("csrf_token")
    if existing_token:
        # Return existing token
        return CSRFTokenResponse(
            csrf_token=existing_token,
            expires_in=28800  # 8 hours in seconds
        )

    # Generate new token (will be set as cookie by middleware)
    csrf_token = generate_csrf_token()

    return CSRFTokenResponse(
        csrf_token=csrf_token,
        expires_in=28800  # 8 hours in seconds
    )


# =============================================================================
# API Routes (TODO: Implement business logic)
# =============================================================================

# TODO: Add authentication middleware
# TODO: Add database connection
# TODO: Add API routes for:
#   - Radio transmissions
#   - Incidents
#   - Dispatch operations
#   - Fleet tracking
#   - User management
#   - Policy management

# Example route structure:
# from app.routes import radio, incidents, dispatch, fleet, users, policy
# app.include_router(radio.router, prefix="/api/radio", tags=["Radio"])
# app.include_router(incidents.router, prefix="/api/incidents", tags=["Incidents"])
# app.include_router(dispatch.router, prefix="/api/dispatch", tags=["Dispatch"])
# app.include_router(fleet.router, prefix="/api/fleet", tags=["Fleet"])
# app.include_router(users.router, prefix="/api/users", tags=["Users"])
# app.include_router(policy.router, prefix="/api/policy", tags=["Policy"])


# =============================================================================
# Error Handlers
# =============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Global exception handler for unhandled errors
    Logs error and returns generic error response
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again later.",
        }
    )


# =============================================================================
# Startup and Shutdown Events
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """
    Application startup event
    Initialize connections and resources
    """
    logger.info("Starting Radio Fleet Dispatch API")
    logger.info(f"Environment: {os.getenv('MODE', 'development')}")
    logger.info(f"CORS Origins: {len(ALLOWED_ORIGINS)}")

    # TODO: Initialize database connection pool
    # TODO: Initialize Redis connection
    # TODO: Initialize Kafka/Event Hub connection
    # TODO: Initialize Azure services (Storage, Speech, etc.)


@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown event
    Close connections and cleanup resources
    """
    logger.info("Shutting down Radio Fleet Dispatch API")

    # TODO: Close database connections
    # TODO: Close Redis connections
    # TODO: Close Kafka connections
    # TODO: Cleanup Azure service connections


if __name__ == "__main__":
    import uvicorn

    # Development server configuration
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
