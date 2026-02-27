"""Pydantic models for request/response schemas."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ScanStage(str, Enum):
    uploading = "uploading"
    extracting = "extracting"
    preprocessing = "preprocessing"
    detecting = "detecting"
    segmenting = "segmenting"
    comparing = "comparing"
    reporting = "reporting"
    complete = "complete"
    error = "error"


class SeverityLevel(str, Enum):
    minor = "minor"
    moderate = "moderate"
    severe = "severe"


# --- Requests ---

class CompareRequest(BaseModel):
    current_scan_id: str
    previous_scan_id: str
    vehicle_id: Optional[str] = None


# --- Responses ---

class ScanStartResponse(BaseModel):
    scan_id: str
    status: ScanStage = ScanStage.uploading
    message: str = "Scan started"


class ScanStatus(BaseModel):
    scan_id: str
    status: ScanStage
    progress: float = Field(ge=0, le=100)
    stage_description: str = ""
    eta_seconds: Optional[float] = None
    error_message: Optional[str] = None


class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class DamageItem(BaseModel):
    id: str
    damage_type: str
    severity: SeverityLevel
    confidence: float = Field(ge=0, le=1)
    bbox: BoundingBox
    mask_url: Optional[str] = None
    area_percent: Optional[float] = None
    frame_index: int = 0
    description: str = ""


class DamageReport(BaseModel):
    scan_id: str
    vehicle_id: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    timestamp: datetime
    items: list[DamageItem] = []
    overall_score: float = Field(ge=0, le=100, description="Vehicle condition 0-100 (100=perfect)")
    total_damage_area_percent: float = 0.0
    annotated_image_url: Optional[str] = None
    frame_count: int = 0


class ProcessedImage(BaseModel):
    frame_index: int
    original_url: str
    processed_url: str
    thumbnail_url: Optional[str] = None


class ScanResults(BaseModel):
    scan_id: str
    status: ScanStage
    damage_report: Optional[DamageReport] = None
    processed_images: list[ProcessedImage] = []
    showroom_images: list[str] = []


class ComparisonItem(BaseModel):
    damage_type: str
    status: str  # "new", "resolved", "unchanged", "worsened"
    current: Optional[DamageItem] = None
    previous: Optional[DamageItem] = None


class ComparisonResult(BaseModel):
    current_scan_id: str
    previous_scan_id: str
    vehicle_id: Optional[str] = None
    new_damages: list[DamageItem] = []
    resolved_damages: list[DamageItem] = []
    unchanged_damages: list[DamageItem] = []
    worsened_damages: list[DamageItem] = []
    overall_change_score: float = Field(ge=-100, le=100, description="Negative=worse, Positive=improved")
    comparison_image_url: Optional[str] = None


class HealthResponse(BaseModel):
    status: str = "ok"
    device: str
    models_loaded: dict[str, bool] = {}
    disk_usage_mb: Optional[float] = None
