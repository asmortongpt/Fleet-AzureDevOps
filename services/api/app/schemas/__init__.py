"""
Pydantic validation schemas for Radio Fleet Dispatch API.

All schemas use Pydantic v2 with strict validation to prevent injection attacks.
"""

from .base import *
from .auth import *
from .radio import *
from .incidents import *
from .tasks import *
from .fleet import *
from .policy import *
from .webhooks import *
from .admin import *

__all__ = [
    # Base
    "BaseSchema",
    "PaginationParams",
    "PaginatedResponse",

    # Auth
    "LoginRequest",
    "TokenResponse",
    "UserResponse",
    "UserCreate",
    "UserUpdate",

    # Radio
    "RadioChannelCreate",
    "RadioChannelUpdate",
    "RadioChannelResponse",
    "TransmissionCreate",
    "TransmissionUpdate",
    "TransmissionResponse",

    # Incidents
    "IncidentCreate",
    "IncidentUpdate",
    "IncidentResponse",

    # Tasks
    "TaskCreate",
    "TaskUpdate",
    "TaskResponse",
    "ChecklistItemCreate",

    # Fleet
    "AssetCreate",
    "AssetUpdate",
    "AssetResponse",
    "CrewCreate",
    "CrewUpdate",
    "CrewResponse",

    # Policy
    "PolicyCreate",
    "PolicyUpdate",
    "PolicyResponse",
    "PolicyEvaluationRequest",

    # Webhooks
    "WebhookCreate",
    "WebhookUpdate",
    "WebhookResponse",

    # Admin
    "OrganizationCreate",
    "OrganizationUpdate",
    "OrganizationResponse",
    "FeatureFlagUpdate",
]
