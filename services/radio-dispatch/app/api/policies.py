"""API endpoints for dispatch policies."""

from typing import List
from uuid import UUID
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class PolicyCreate(BaseModel):
    """Schema for creating policy."""
    org_id: UUID
    name: str
    description: str | None = None
    conditions: dict
    actions: list[dict]
    is_active: bool = True
    priority: int = 100
    operating_mode: str = "hitl"  # monitor_only, hitl, autonomous


class PolicyResponse(BaseModel):
    """Schema for policy response."""
    id: UUID
    org_id: UUID
    name: str
    description: str | None
    conditions: dict
    actions: list[dict]
    is_active: bool
    priority: int
    operating_mode: str
    created_at: datetime
    last_triggered_at: datetime | None

    class Config:
        from_attributes = True


class PolicyExecutionResponse(BaseModel):
    """Schema for policy execution."""
    id: UUID
    policy_id: UUID
    transmission_id: UUID
    conditions_matched: dict
    actions_executed: list[dict]
    execution_status: str
    created_incident_id: UUID | None
    created_task_ids: list[UUID] | None
    requires_approval: bool
    approved_by: UUID | None
    approved_at: datetime | None
    executed_at: datetime

    class Config:
        from_attributes = True


@router.post("/", response_model=PolicyResponse, status_code=201)
async def create_policy(policy: PolicyCreate):
    """Create new dispatch policy."""
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/", response_model=List[PolicyResponse])
async def list_policies(org_id: UUID | None = None, is_active: bool | None = None):
    """List dispatch policies."""
    return []


@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(policy_id: UUID):
    """Get policy details."""
    raise HTTPException(status_code=404, detail="Policy not found")


@router.put("/{policy_id}", response_model=PolicyResponse)
async def update_policy(policy_id: UUID, policy: PolicyCreate):
    """Update policy."""
    raise HTTPException(status_code=501, detail="Not implemented")


@router.delete("/{policy_id}", status_code=204)
async def delete_policy(policy_id: UUID):
    """Delete policy."""
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/executions/pending", response_model=List[PolicyExecutionResponse])
async def list_pending_executions(org_id: UUID):
    """List executions pending approval (HITL queue)."""
    return []


@router.post("/executions/{execution_id}/approve")
async def approve_execution(execution_id: UUID, approved_by: UUID, notes: str | None = None):
    """Approve pending policy execution."""
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/executions/{execution_id}/reject")
async def reject_execution(execution_id: UUID, rejected_by: UUID, reason: str | None = None):
    """Reject pending policy execution."""
    raise HTTPException(status_code=501, detail="Not implemented")
