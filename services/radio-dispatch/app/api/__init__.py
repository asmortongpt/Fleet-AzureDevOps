"""API routes."""

from fastapi import APIRouter

from .transmissions import router as transmissions_router
from .channels import router as channels_router
from .policies import router as policies_router

router = APIRouter()

router.include_router(transmissions_router, prefix="/transmissions", tags=["transmissions"])
router.include_router(channels_router, prefix="/channels", tags=["channels"])
router.include_router(policies_router, prefix="/policies", tags=["policies"])

__all__ = ["router"]
