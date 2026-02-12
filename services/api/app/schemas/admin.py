"""
Admin schemas for organization and system management.

Security:
- Slug validation (URL-safe)
- Operating mode whitelist
- Feature flag validation
"""

from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import Field, field_validator
import re

from .base import BaseSchema, TimestampMixin, UUIDMixin, sanitize_string


class OrganizationCreate(BaseSchema):
    """Organization creation request."""

    name: str = Field(..., min_length=1, max_length=255, description="Organization name")
    slug: str = Field(
        ..., min_length=1, max_length=100, description="URL-friendly identifier"
    )
    default_op_mode: str = Field(
        default="monitor_only",
        description="Default operating mode: monitor_only, hitl, autonomous_assist",
    )
    feature_flags: Dict[str, Any] = Field(
        default_factory=dict, description="Feature toggles"
    )

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return sanitize_string(v)

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate slug is URL-safe."""
        # Slugs should be lowercase alphanumeric with hyphens
        if not re.match(r"^[a-z0-9-]+$", v):
            raise ValueError(
                "Slug must contain only lowercase letters, numbers, and hyphens"
            )

        # Cannot start or end with hyphen
        if v.startswith("-") or v.endswith("-"):
            raise ValueError("Slug cannot start or end with a hyphen")

        # Cannot have consecutive hyphens
        if "--" in v:
            raise ValueError("Slug cannot contain consecutive hyphens")

        return v

    @field_validator("default_op_mode")
    @classmethod
    def validate_op_mode(cls, v: str) -> str:
        """Validate operating mode against whitelist."""
        allowed_modes = {"monitor_only", "hitl", "autonomous_assist"}
        v_lower = v.lower()

        if v_lower not in allowed_modes:
            raise ValueError(
                f"Invalid operating mode: {v}. Allowed: {', '.join(sorted(allowed_modes))}"
            )

        return v_lower

    @field_validator("feature_flags")
    @classmethod
    def validate_feature_flags(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Validate feature flags."""
        # Whitelist of allowed feature flags
        allowed_flags = {
            "autonomous_assist",
            "hitl",
            "pmo_integration",
            "fleet_tracking",
            "policy_engine",
            "webhook_delivery",
            "audit_logging",
            "real_time_transcription",
        }

        for key in v.keys():
            if key not in allowed_flags:
                raise ValueError(
                    f"Invalid feature flag: {key}. Allowed: {', '.join(sorted(allowed_flags))}"
                )

            # Ensure values are boolean
            if not isinstance(v[key], bool):
                raise ValueError(f"Feature flag '{key}' must be a boolean")

        return v


class OrganizationUpdate(BaseSchema):
    """Organization update request."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    default_op_mode: Optional[str] = None
    feature_flags: Optional[Dict[str, Any]] = None

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_string(v) if v is not None else v

    @field_validator("default_op_mode")
    @classmethod
    def validate_op_mode(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        allowed_modes = {"monitor_only", "hitl", "autonomous_assist"}
        v_lower = v.lower()

        if v_lower not in allowed_modes:
            raise ValueError(
                f"Invalid operating mode: {v}. Allowed: {', '.join(sorted(allowed_modes))}"
            )

        return v_lower

    @field_validator("feature_flags")
    @classmethod
    def validate_feature_flags(
        cls, v: Optional[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        if v is None:
            return v

        allowed_flags = {
            "autonomous_assist",
            "hitl",
            "pmo_integration",
            "fleet_tracking",
            "policy_engine",
            "webhook_delivery",
            "audit_logging",
            "real_time_transcription",
        }

        for key in v.keys():
            if key not in allowed_flags:
                raise ValueError(
                    f"Invalid feature flag: {key}. Allowed: {', '.join(sorted(allowed_flags))}"
                )

            if not isinstance(v[key], bool):
                raise ValueError(f"Feature flag '{key}' must be a boolean")

        return v


class OrganizationResponse(BaseSchema, UUIDMixin, TimestampMixin):
    """Organization response."""

    name: str
    slug: str
    default_op_mode: str
    feature_flags: Dict[str, Any]

    model_config = {
        "from_attributes": True,
    }


class FeatureFlagUpdate(BaseSchema):
    """Feature flag update request."""

    autonomous_assist: Optional[bool] = None
    hitl: Optional[bool] = None
    pmo_integration: Optional[bool] = None
    fleet_tracking: Optional[bool] = None
    policy_engine: Optional[bool] = None
    webhook_delivery: Optional[bool] = None
    audit_logging: Optional[bool] = None
    real_time_transcription: Optional[bool] = None
