"""
Authentication and user management schemas.

Security:
- Email validation
- Password strength requirements (if applicable)
- Role whitelist validation
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime

from pydantic import Field, field_validator

from .base import BaseSchema, TimestampMixin, UUIDMixin, sanitize_string, validate_email


class LoginRequest(BaseSchema):
    """Login request (for testing/dev - production uses Azure AD OIDC)."""

    email: str = Field(..., max_length=255, description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password")

    @field_validator("email")
    @classmethod
    def validate_email_field(cls, v: str) -> str:
        return validate_email(v)


class TokenResponse(BaseSchema):
    """JWT token response."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(default=3600, description="Token expiration in seconds")


class UserCreate(BaseSchema):
    """User creation request."""

    email: str = Field(..., max_length=255, description="User email address")
    full_name: str = Field(..., min_length=1, max_length=255, description="Full name")
    roles: List[str] = Field(
        default=["viewer"], description="User roles (RBAC)"
    )
    oidc_sub: Optional[str] = Field(
        None, max_length=255, description="Azure AD subject ID"
    )
    organization_id: UUID = Field(..., description="Organization ID")

    @field_validator("email")
    @classmethod
    def validate_email_field(cls, v: str) -> str:
        return validate_email(v)

    @field_validator("full_name")
    @classmethod
    def sanitize_full_name(cls, v: str) -> str:
        return sanitize_string(v)

    @field_validator("roles")
    @classmethod
    def validate_roles(cls, v: List[str]) -> List[str]:
        """Validate roles against whitelist."""
        allowed_roles = {"admin", "dispatcher", "supervisor", "operator", "viewer"}

        for role in v:
            if role not in allowed_roles:
                raise ValueError(
                    f"Invalid role: {role}. Allowed: {', '.join(sorted(allowed_roles))}"
                )

        return v


class UserUpdate(BaseSchema):
    """User update request."""

    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    roles: Optional[List[str]] = None
    is_active: Optional[bool] = None

    @field_validator("full_name")
    @classmethod
    def sanitize_full_name(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_string(v) if v is not None else v

    @field_validator("roles")
    @classmethod
    def validate_roles(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate roles against whitelist."""
        if v is None:
            return v

        allowed_roles = {"admin", "dispatcher", "supervisor", "operator", "viewer"}

        for role in v:
            if role not in allowed_roles:
                raise ValueError(
                    f"Invalid role: {role}. Allowed: {', '.join(sorted(allowed_roles))}"
                )

        return v


class UserResponse(BaseSchema, UUIDMixin, TimestampMixin):
    """User response."""

    email: str
    full_name: str
    roles: List[str]
    is_active: bool
    organization_id: UUID
    last_login_at: Optional[datetime] = None
    oidc_sub: Optional[str] = None

    model_config = {
        "from_attributes": True,  # Allow ORM model conversion
    }
