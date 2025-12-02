"""
Security Middleware for FastAPI Services
Mitigates CVE-2025-62727 (Starlette DoS) and provides defense-in-depth

This module provides:
1. Request body size limits to prevent memory exhaustion
2. Range header validation to mitigate the specific CVE
3. Rate limiting configuration for DoS protection
"""

from typing import Callable
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# ============================================================================
# CONFIGURATION
# ============================================================================

# Maximum request body size (10MB default)
MAX_REQUEST_SIZE_BYTES = 10 * 1024 * 1024

# Maximum number of Range header values allowed
MAX_RANGE_VALUES = 10

# Rate limiting defaults (requests per minute per IP)
DEFAULT_RATE_LIMIT = "100/minute"


# ============================================================================
# REQUEST SIZE LIMIT MIDDLEWARE
# ============================================================================

class LimitRequestSizeMiddleware(BaseHTTPMiddleware):
    """
    Middleware to limit request body size.
    Prevents memory exhaustion attacks by rejecting oversized requests early.
    """

    def __init__(self, app, max_size: int = MAX_REQUEST_SIZE_BYTES):
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request: Request, call_next: Callable):
        # Check Content-Length header if present
        content_length = request.headers.get('content-length')

        if content_length:
            try:
                size = int(content_length)
                if size > self.max_size:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": "Request entity too large",
                            "max_size_bytes": self.max_size,
                            "received_size_bytes": size
                        }
                    )
            except ValueError:
                # Invalid Content-Length header
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid Content-Length header"}
                )

        return await call_next(request)


# ============================================================================
# RANGE HEADER VALIDATION MIDDLEWARE (CVE-2025-62727 Mitigation)
# ============================================================================

class RangeHeaderMiddleware(BaseHTTPMiddleware):
    """
    Middleware to validate Range headers.
    Mitigates CVE-2025-62727 by rejecting malicious Range headers with
    excessive range values that could cause DoS.
    """

    def __init__(self, app, max_ranges: int = MAX_RANGE_VALUES):
        super().__init__(app)
        self.max_ranges = max_ranges

    async def dispatch(self, request: Request, call_next: Callable):
        range_header = request.headers.get('range', '')

        if range_header:
            # Count the number of ranges (comma-separated)
            range_count = range_header.count(',') + 1

            if range_count > self.max_ranges:
                return JSONResponse(
                    status_code=416,
                    content={
                        "detail": "Too many range values in Range header",
                        "max_ranges_allowed": self.max_ranges,
                        "ranges_received": range_count
                    }
                )

            # Validate Range header format (should start with "bytes=")
            if not range_header.lower().startswith('bytes='):
                return JSONResponse(
                    status_code=416,
                    content={"detail": "Invalid Range header format"}
                )

        return await call_next(request)


# ============================================================================
# SECURITY HEADERS MIDDLEWARE
# ============================================================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all responses.
    """

    async def dispatch(self, request: Request, call_next: Callable):
        response = await call_next(request)

        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Cache-Control"] = "no-store"

        return response


# ============================================================================
# RATE LIMITING CONFIGURATION
# ============================================================================

def configure_rate_limiting(app: FastAPI, default_limit: str = DEFAULT_RATE_LIMIT):
    """
    Configure rate limiting for a FastAPI application.

    Args:
        app: FastAPI application instance
        default_limit: Default rate limit string (e.g., "100/minute")

    Returns:
        Limiter instance for use with @limiter.limit() decorator

    Usage:
        from slowapi import Limiter
        from slowapi.util import get_remote_address

        limiter = configure_rate_limiting(app)

        @app.get("/api/resource")
        @limiter.limit("50/minute")
        async def get_resource(request: Request):
            ...
    """
    try:
        from slowapi import Limiter, _rate_limit_exceeded_handler
        from slowapi.util import get_remote_address
        from slowapi.errors import RateLimitExceeded

        limiter = Limiter(key_func=get_remote_address, default_limits=[default_limit])
        app.state.limiter = limiter
        app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

        return limiter
    except ImportError:
        print("Warning: slowapi not installed. Rate limiting disabled.")
        return None


# ============================================================================
# CONVENIENCE FUNCTION TO ADD ALL SECURITY MIDDLEWARE
# ============================================================================

def add_security_middleware(
    app: FastAPI,
    max_request_size: int = MAX_REQUEST_SIZE_BYTES,
    max_ranges: int = MAX_RANGE_VALUES,
    enable_rate_limiting: bool = True,
    rate_limit: str = DEFAULT_RATE_LIMIT
):
    """
    Add all security middleware to a FastAPI application.

    This function provides defense-in-depth against DoS attacks including
    CVE-2025-62727 mitigation.

    Args:
        app: FastAPI application instance
        max_request_size: Maximum request body size in bytes
        max_ranges: Maximum number of Range header values allowed
        enable_rate_limiting: Whether to enable rate limiting
        rate_limit: Default rate limit string

    Returns:
        Limiter instance if rate limiting is enabled, None otherwise

    Example:
        app = FastAPI()
        limiter = add_security_middleware(app)
    """
    # Add middleware in reverse order (last added = first executed)

    # 1. Security headers (outermost - always adds headers)
    app.add_middleware(SecurityHeadersMiddleware)

    # 2. Range header validation (CVE-2025-62727 mitigation)
    app.add_middleware(RangeHeaderMiddleware, max_ranges=max_ranges)

    # 3. Request size limit (innermost - rejects large requests first)
    app.add_middleware(LimitRequestSizeMiddleware, max_size=max_request_size)

    # 4. Configure rate limiting
    limiter = None
    if enable_rate_limiting:
        limiter = configure_rate_limiting(app, rate_limit)

    return limiter
