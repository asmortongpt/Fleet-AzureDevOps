"""API endpoints for radio channels."""

from typing import List
from uuid import UUID
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class ChannelCreate(BaseModel):
    """Schema for creating channel."""
    org_id: UUID
    name: str
    talkgroup: str | None = None
    source_type: str  # SIP, HTTP, FILE, API
    source_config: dict
    is_active: bool = True


class ChannelResponse(BaseModel):
    """Schema for channel response."""
    id: UUID
    org_id: UUID
    name: str
    talkgroup: str | None
    source_type: str
    source_config: dict
    is_active: bool

    class Config:
        from_attributes = True


@router.post("/", response_model=ChannelResponse, status_code=201)
async def create_channel(channel: ChannelCreate):
    """Create new radio channel."""
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/", response_model=List[ChannelResponse])
async def list_channels(org_id: UUID | None = None):
    """List all radio channels."""
    return []


@router.get("/{channel_id}", response_model=ChannelResponse)
async def get_channel(channel_id: UUID):
    """Get channel details."""
    raise HTTPException(status_code=404, detail="Channel not found")


@router.put("/{channel_id}", response_model=ChannelResponse)
async def update_channel(channel_id: UUID, channel: ChannelCreate):
    """Update channel configuration."""
    raise HTTPException(status_code=501, detail="Not implemented")


@router.delete("/{channel_id}", status_code=204)
async def delete_channel(channel_id: UUID):
    """Delete channel."""
    raise HTTPException(status_code=501, detail="Not implemented")
