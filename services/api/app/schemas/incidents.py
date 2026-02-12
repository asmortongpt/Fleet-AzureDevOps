"""
Incident management schemas.

Security:
- Strict validation for all incident fields
- Geographic coordinate validation
- Status/priority whitelists
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import Field, field_validator

from .base import BaseSchema, TimestampMixin, UUIDMixin, sanitize_string


class IncidentCreate(BaseSchema):
    """Incident creation request."""

    title: str = Field(..., min_length=1, max_length=500, description="Incident title")
    description: Optional[str] = Field(
        None, max_length=50000, description="Detailed description"
    )
    priority: str = Field(
        default="NORMAL", description="Priority: LOW, NORMAL, HIGH, URGENT, CRITICAL"
    )
    incident_type: Optional[str] = Field(None, max_length=100, description="Type")
    location_geo: Optional[Dict[str, Any]] = Field(
        None, description="Geographic location {lat, lng, address}"
    )
    assigned_to: Optional[UUID] = Field(None, description="Assigned user ID")
    related_transmission_ids: List[UUID] = Field(
        default_factory=list, description="Related transmission IDs"
    )

    @field_validator("title")
    @classmethod
    def sanitize_title(cls, v: str) -> str:
        return sanitize_string(v)

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_string(v) if v is not None else v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        """Validate priority against whitelist."""
        allowed_priorities = {"LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"}
        v_upper = v.upper()

        if v_upper not in allowed_priorities:
            raise ValueError(
                f"Invalid priority: {v}. Allowed: {', '.join(sorted(allowed_priorities))}"
            )

        return v_upper

    @field_validator("incident_type")
    @classmethod
    def sanitize_incident_type(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_string(v) if v is not None else v

    @field_validator("location_geo")
    @classmethod
    def validate_location_geo(
        cls, v: Optional[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Validate geographic location structure."""
        if v is None:
            return v

        # Validate latitude
        if "lat" in v:
            lat = float(v["lat"])
            if not (-90 <= lat <= 90):
                raise ValueError("Latitude must be between -90 and 90")

        # Validate longitude
        if "lng" in v:
            lng = float(v["lng"])
            if not (-180 <= lng <= 180):
                raise ValueError("Longitude must be between -180 and 180")

        # Sanitize address if present
        if "address" in v and isinstance(v["address"], str):
            v["address"] = sanitize_string(v["address"])

        return v

    @field_validator("related_transmission_ids")
    @classmethod
    def validate_transmission_ids(cls, v: List[UUID]) -> List[UUID]:
        """Limit number of related transmissions."""
        if len(v) > 100:
            raise ValueError("Maximum 100 related transmissions allowed")
        return v


class IncidentUpdate(BaseSchema):
    """Incident update request."""

    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=50000)
    priority: Optional[str] = None
    status: Optional[str] = None
    incident_type: Optional[str] = Field(None, max_length=100)
    location_geo: Optional[Dict[str, Any]] = None
    assigned_to: Optional[UUID] = None

    @field_validator("title")
    @classmethod
    def sanitize_title(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_string(v) if v is not None else v

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_string(v) if v is not None else v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        allowed_priorities = {"LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"}
        v_upper = v.upper()

        if v_upper not in allowed_priorities:
            raise ValueError(
                f"Invalid priority: {v}. Allowed: {', '.join(sorted(allowed_priorities))}"
            )

        return v_upper

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        allowed_statuses = {
            "open",
            "acknowledged",
            "in_progress",
            "resolved",
            "closed",
        }
        v_lower = v.lower()

        if v_lower not in allowed_statuses:
            raise ValueError(
                f"Invalid status: {v}. Allowed: {', '.join(sorted(allowed_statuses))}"
            )

        return v_lower

    @field_validator("location_geo")
    @classmethod
    def validate_location_geo(
        cls, v: Optional[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Validate geographic location structure."""
        if v is None:
            return v

        # Validate latitude
        if "lat" in v:
            lat = float(v["lat"])
            if not (-90 <= lat <= 90):
                raise ValueError("Latitude must be between -90 and 90")

        # Validate longitude
        if "lng" in v:
            lng = float(v["lng"])
            if not (-180 <= lng <= 180):
                raise ValueError("Longitude must be between -180 and 180")

        # Sanitize address if present
        if "address" in v and isinstance(v["address"], str):
            v["address"] = sanitize_string(v["address"])

        return v


class IncidentResponse(BaseSchema, UUIDMixin, TimestampMixin):
    """Incident response."""

    title: str
    description: Optional[str]
    priority: str
    status: str
    incident_type: Optional[str]
    location_geo: Optional[Dict[str, Any]]
    assigned_to: Optional[UUID]
    organization_id: UUID
    opened_at: datetime
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]
    closed_at: Optional[datetime]
    related_transmission_ids: List[UUID]
    pmo_project_id: Optional[str]

    model_config = {
        "from_attributes": True,
    }
