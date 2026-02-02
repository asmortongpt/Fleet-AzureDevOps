"""
Base Pydantic schemas and validators.

Security: All validators use whitelist approach and sanitize inputs.
"""

from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, ConfigDict
import re


class BaseSchema(BaseModel):
    """Base schema with strict validation configuration."""

    model_config = ConfigDict(
        # Strict validation - reject unexpected types
        strict=True,
        # Forbid extra fields - reject unexpected input
        extra="forbid",
        # Use enum values instead of names
        use_enum_values=True,
        # Validate assignment after creation
        validate_assignment=True,
        # Don't allow arbitrary types
        arbitrary_types_allowed=False,
    )


class PaginationParams(BaseModel):
    """Pagination query parameters with validation."""

    page: int = Field(default=1, ge=1, le=10000, description="Page number (1-indexed)")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page")
    sort: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Sort field (prefix with - for DESC)",
    )

    @field_validator("sort")
    @classmethod
    def validate_sort_field(cls, v: Optional[str]) -> Optional[str]:
        """Validate sort field against whitelist to prevent SQL injection."""
        if v is None:
            return v

        # Remove leading dash for DESC
        field = v.lstrip("-")

        # Whitelist of allowed sort fields
        allowed_fields = {
            "id",
            "created_at",
            "updated_at",
            "started_at",
            "ended_at",
            "opened_at",
            "closed_at",
            "priority",
            "status",
            "title",
            "name",
        }

        if field not in allowed_fields:
            raise ValueError(
                f"Invalid sort field: {field}. Allowed: {', '.join(sorted(allowed_fields))}"
            )

        return v


T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""

    data: List[T]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {
            "page": 1,
            "limit": 20,
            "total": 0,
            "pages": 0,
        }
    )


class TimestampMixin(BaseModel):
    """Mixin for created_at and updated_at timestamps."""

    created_at: datetime
    updated_at: datetime


class UUIDMixin(BaseModel):
    """Mixin for UUID primary key."""

    id: UUID


# Security validators (reusable)


def sanitize_string(value: str) -> str:
    """
    Sanitize string input to prevent XSS and injection attacks.

    - Strips leading/trailing whitespace
    - Removes null bytes
    - Validates against control characters
    """
    if value is None:
        return value

    # Strip whitespace
    value = value.strip()

    # Remove null bytes (used in injection attacks)
    value = value.replace("\x00", "")

    # Reject strings with control characters (except newline, tab, carriage return)
    if re.search(r"[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]", value):
        raise ValueError("String contains invalid control characters")

    return value


def validate_no_sql_keywords(value: str) -> str:
    """
    Check for common SQL injection patterns.

    This is a defense-in-depth measure. Primary protection is parameterized queries.
    """
    if value is None:
        return value

    # Convert to lowercase for comparison
    lower_value = value.lower()

    # Common SQL injection patterns
    sql_patterns = [
        r"\bunion\s+select\b",
        r"\bdrop\s+table\b",
        r"\bdelete\s+from\b",
        r"\binsert\s+into\b",
        r"\bupdate\s+\w+\s+set\b",
        r";\s*--",
        r"/\*.*\*/",
        r"\bexec\s*\(",
        r"\bexecute\s*\(",
        r"\bxp_\w+",  # SQL Server extended stored procedures
    ]

    for pattern in sql_patterns:
        if re.search(pattern, lower_value):
            raise ValueError("Input contains potentially malicious SQL patterns")

    return value


def validate_url(value: str) -> str:
    """Validate URL format and protocol whitelist."""
    if value is None:
        return value

    # Must start with https:// or http:// (for dev)
    if not re.match(r"^https?://", value):
        raise ValueError("URL must start with http:// or https://")

    # Reject URLs with credentials
    if "@" in value.split("/")[2]:  # Check domain part
        raise ValueError("URLs with embedded credentials are not allowed")

    # Reject javascript: and data: URIs
    if re.match(r"^(javascript|data|vbscript):", value, re.IGNORECASE):
        raise ValueError("Dangerous URL scheme detected")

    return value


def validate_email(value: str) -> str:
    """Validate email format."""
    if value is None:
        return value

    # Simple email validation (RFC 5322 simplified)
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

    if not re.match(email_pattern, value):
        raise ValueError("Invalid email format")

    return value.lower()
