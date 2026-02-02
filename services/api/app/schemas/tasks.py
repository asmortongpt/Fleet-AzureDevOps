"""
Task management schemas.

Security:
- SLA validation
- Status whitelist
- Checklist item validation
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import Field, field_validator

from .base import BaseSchema, TimestampMixin, UUIDMixin, sanitize_string


class ChecklistItemCreate(BaseSchema):
    """Checklist item creation."""

    item_text: str = Field(
        ..., min_length=1, max_length=500, description="Checklist item text"
    )
    order_index: int = Field(..., ge=0, le=1000, description="Display order")

    @field_validator("item_text")
    @classmethod
    def sanitize_item_text(cls, v: str) -> str:
        return sanitize_string(v)


class TaskCreate(BaseSchema):
    """Task creation request."""

    incident_id: UUID = Field(..., description="Parent incident ID")
    title: str = Field(..., min_length=1, max_length=500, description="Task title")
    description: Optional[str] = Field(None, max_length=50000)
    priority: str = Field(
        default="NORMAL", description="Priority: LOW, NORMAL, HIGH, URGENT, CRITICAL"
    )
    assignee_id: Optional[UUID] = Field(None, description="Assigned user ID")
    sla_due_at: Optional[datetime] = Field(None, description="SLA deadline")
    checklist: List[ChecklistItemCreate] = Field(
        default_factory=list, description="Task checklist"
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
        allowed_priorities = {"LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"}
        v_upper = v.upper()
        if v_upper not in allowed_priorities:
            raise ValueError(
                f"Invalid priority: {v}. Allowed: {', '.join(sorted(allowed_priorities))}"
            )
        return v_upper

    @field_validator("checklist")
    @classmethod
    def validate_checklist(cls, v: List[ChecklistItemCreate]) -> List[ChecklistItemCreate]:
        if len(v) > 100:
            raise ValueError("Maximum 100 checklist items allowed")
        return v


class TaskUpdate(BaseSchema):
    """Task update request."""

    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=50000)
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[UUID] = None
    sla_due_at: Optional[datetime] = None

    @field_validator("title")
    @classmethod
    def sanitize_title(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_string(v) if v is not None else v

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_string(v) if v is not None else v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed_statuses = {"pending", "in_progress", "completed", "cancelled"}
        v_lower = v.lower()
        if v_lower not in allowed_statuses:
            raise ValueError(
                f"Invalid status: {v}. Allowed: {', '.join(sorted(allowed_statuses))}"
            )
        return v_lower

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


class TaskResponse(BaseSchema, UUIDMixin, TimestampMixin):
    """Task response."""

    incident_id: UUID
    title: str
    description: Optional[str]
    status: str
    priority: str
    assignee_id: Optional[UUID]
    sla_due_at: Optional[datetime]
    sla_paused_at: Optional[datetime]
    sla_paused_duration_ms: int
    completed_at: Optional[datetime]
    pmo_task_id: Optional[str]

    model_config = {
        "from_attributes": True,
    }
