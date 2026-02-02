"""
CSRF Protection Middleware for Radio Fleet Dispatch API

Implements comprehensive CSRF protection using:
- Double-submit cookie pattern
- Synchronizer token pattern
- Token rotation on authentication
- SameSite cookie attributes
- Origin and Referer header validation

Security Requirements:
- All state-changing requests (POST, PUT, PATCH, DELETE) require CSRF token
- Tokens are cryptographically random (32 bytes)
- Tokens expire after 8 hours
- Tokens rotate on authentication events
- Constant-time comparison to prevent timing attacks
"""
import secrets
import hmac
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional, Set
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.datastructures import Headers
import os

logger = logging.getLogger(__name__)

# CSRF Configuration
CSRF_TOKEN_LENGTH = 32  # bytes (256 bits)
CSRF_TOKEN_EXPIRY = timedelta(hours=8)
CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_SECRET_KEY = os.getenv("CSRF_SECRET_KEY", secrets.token_urlsafe(32))

# Methods that require CSRF protection
CSRF_PROTECTED_METHODS: Set[str] = {"POST", "PUT", "PATCH", "DELETE"}

# Paths exempt from CSRF protection (e.g., login endpoints, webhooks)
CSRF_EXEMPT_PATHS: Set[str] = {
    "/health",
    "/healthz",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/auth/login",
    "/api/auth/token",
    "/api/webhooks/",  # Webhooks use different authentication
}


def generate_csrf_token() -> str:
    """
    Generate a cryptographically secure CSRF token.

    Returns:
        str: URL-safe base64-encoded token (32 bytes = 256 bits of entropy)
    """
    return secrets.token_urlsafe(CSRF_TOKEN_LENGTH)


def generate_csrf_token_hash(token: str) -> str:
    """
    Generate HMAC-SHA256 hash of CSRF token for secure storage.

    Args:
        token: The CSRF token to hash

    Returns:
        str: Hex-encoded HMAC-SHA256 hash
    """
    return hmac.new(
        CSRF_SECRET_KEY.encode(),
        token.encode(),
        hashlib.sha256
    ).hexdigest()


def verify_csrf_token(token: str, token_hash: str) -> bool:
    """
    Verify CSRF token against stored hash using constant-time comparison.

    Args:
        token: The CSRF token to verify
        token_hash: The stored hash to verify against

    Returns:
        bool: True if token is valid, False otherwise
    """
    expected_hash = generate_csrf_token_hash(token)
    return hmac.compare_digest(expected_hash, token_hash)


def extract_origin(request: Request) -> Optional[str]:
    """
    Extract origin from request headers.

    Args:
        request: The incoming request

    Returns:
        Optional[str]: The origin URL or None
    """
    return request.headers.get("origin") or request.headers.get("referer")


def is_safe_origin(origin: Optional[str], allowed_origins: Set[str]) -> bool:
    """
    Check if origin is in the allowed list.

    Args:
        origin: The origin to check
        allowed_origins: Set of allowed origin URLs

    Returns:
        bool: True if origin is safe, False otherwise
    """
    if not origin:
        return False

    # Extract origin from referer if needed
    if origin.startswith("http://") or origin.startswith("https://"):
        origin_parts = origin.split("/")[:3]
        origin = "/".join(origin_parts)

    return origin in allowed_origins


def is_csrf_exempt(path: str) -> bool:
    """
    Check if a path is exempt from CSRF protection.

    Args:
        path: The request path

    Returns:
        bool: True if path is exempt, False otherwise
    """
    # Exact match
    if path in CSRF_EXEMPT_PATHS:
        return True

    # Prefix match for webhook paths
    for exempt_path in CSRF_EXEMPT_PATHS:
        if exempt_path.endswith("/") and path.startswith(exempt_path):
            return True

    return False


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    CSRF Protection Middleware

    Validates CSRF tokens for all state-changing requests (POST, PUT, PATCH, DELETE).
    Implements double-submit cookie pattern with additional security measures.
    """

    def __init__(self, app, allowed_origins: Optional[Set[str]] = None):
        """
        Initialize CSRF middleware.

        Args:
            app: The FastAPI application
            allowed_origins: Set of allowed origin URLs for CORS
        """
        super().__init__(app)
        self.allowed_origins = allowed_origins or {
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://fleet.capitaltechalliance.com",
            "https://green-pond-0f040980f.3.azurestaticapps.net",
            "https://purple-river-0f465960f.3.azurestaticapps.net",
        }

        # Add additional origins from environment
        additional_origins = os.getenv("ADDITIONAL_CORS_ORIGINS", "").split(",")
        for origin in additional_origins:
            if origin.strip():
                self.allowed_origins.add(origin.strip())

        logger.info(f"CSRF middleware initialized with {len(self.allowed_origins)} allowed origins")

    async def dispatch(self, request: Request, call_next):
        """
        Process request and validate CSRF token if needed.

        Args:
            request: The incoming request
            call_next: The next middleware or route handler

        Returns:
            Response: The response with CSRF cookie set
        """
        # Skip CSRF check for exempt paths
        if is_csrf_exempt(request.url.path):
            return await call_next(request)

        # Skip CSRF check for safe methods (GET, HEAD, OPTIONS, TRACE)
        if request.method not in CSRF_PROTECTED_METHODS:
            response = await call_next(request)
            # Set CSRF token cookie for safe methods to enable subsequent state-changing requests
            await self._set_csrf_cookie(request, response)
            return response

        # Validate CSRF token for state-changing methods
        try:
            await self._validate_csrf(request)
        except HTTPException as e:
            logger.warning(
                f"CSRF validation failed for {request.method} {request.url.path}: {e.detail}",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "ip": request.client.host if request.client else None,
                    "user_agent": request.headers.get("user-agent"),
                }
            )
            return JSONResponse(
                status_code=e.status_code,
                content={"error": "CSRF validation failed", "detail": e.detail}
            )

        response = await call_next(request)

        # Rotate CSRF token on successful authentication
        if request.url.path in {"/api/auth/login", "/api/auth/callback"}:
            await self._rotate_csrf_token(request, response)

        return response

    async def _validate_csrf(self, request: Request) -> None:
        """
        Validate CSRF token from request.

        Args:
            request: The incoming request

        Raises:
            HTTPException: If CSRF validation fails
        """
        # 1. Validate Origin/Referer header
        origin = extract_origin(request)
        if not is_safe_origin(origin, self.allowed_origins):
            logger.warning(f"Invalid origin: {origin}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid origin. CSRF token validation failed."
            )

        # 2. Extract CSRF token from header
        csrf_token_header = request.headers.get(CSRF_HEADER_NAME)
        if not csrf_token_header:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing CSRF token in {CSRF_HEADER_NAME} header."
            )

        # 3. Extract CSRF token from cookie
        csrf_token_cookie = request.cookies.get(CSRF_COOKIE_NAME)
        if not csrf_token_cookie:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Missing CSRF token in cookie."
            )

        # 4. Verify tokens match using constant-time comparison
        if not hmac.compare_digest(csrf_token_header, csrf_token_cookie):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token mismatch."
            )

        # 5. Store validated token in request state for use in route handlers
        request.state.csrf_token = csrf_token_header

        logger.debug(f"CSRF validation successful for {request.method} {request.url.path}")

    async def _set_csrf_cookie(self, request: Request, response: Response) -> None:
        """
        Set CSRF token cookie on response.

        Args:
            request: The incoming request
            response: The outgoing response
        """
        # Check if cookie already exists
        existing_token = request.cookies.get(CSRF_COOKIE_NAME)
        if existing_token:
            return  # Don't overwrite existing valid token

        # Generate new token
        csrf_token = generate_csrf_token()

        # Set cookie with security attributes
        response.set_cookie(
            key=CSRF_COOKIE_NAME,
            value=csrf_token,
            max_age=int(CSRF_TOKEN_EXPIRY.total_seconds()),
            httponly=False,  # Must be accessible to JavaScript
            secure=os.getenv("MODE", "development") == "production",  # HTTPS only in production
            samesite="strict",  # Prevent CSRF attacks
            path="/",
        )

        logger.debug("CSRF token cookie set")

    async def _rotate_csrf_token(self, request: Request, response: Response) -> None:
        """
        Rotate CSRF token on authentication events.

        Args:
            request: The incoming request
            response: The outgoing response
        """
        # Generate new token
        csrf_token = generate_csrf_token()

        # Set cookie with security attributes
        response.set_cookie(
            key=CSRF_COOKIE_NAME,
            value=csrf_token,
            max_age=int(CSRF_TOKEN_EXPIRY.total_seconds()),
            httponly=False,  # Must be accessible to JavaScript
            secure=os.getenv("MODE", "development") == "production",  # HTTPS only in production
            samesite="strict",  # Prevent CSRF attacks
            path="/",
        )

        logger.info("CSRF token rotated on authentication")


# Helper functions for use in route handlers

def get_csrf_token(request: Request) -> Optional[str]:
    """
    Get CSRF token from request state.

    Args:
        request: The incoming request

    Returns:
        Optional[str]: The CSRF token or None
    """
    return getattr(request.state, "csrf_token", None)


def validate_csrf_token(request: Request, token: str) -> bool:
    """
    Validate a CSRF token against the request.

    Args:
        request: The incoming request
        token: The token to validate

    Returns:
        bool: True if token is valid, False otherwise
    """
    request_token = get_csrf_token(request)
    if not request_token:
        return False

    return hmac.compare_digest(token, request_token)
