"""Complete implementation of transmission endpoints with database operations."""

from typing import List, Optional
from uuid import UUID
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.logging import get_logger
from app.models.radio import RadioTransmission, RadioChannel
from app.services.transcription import TranscriptionService
from app.workers.tasks import process_audio_transmission

logger = get_logger(__name__)

router = APIRouter()


# ==========================================
# Pydantic Schemas
# ==========================================

class TransmissionCreate(BaseModel):
    """Schema for creating transmission."""
    channel_id: UUID
    org_id: UUID
    started_at: datetime
    ended_at: Optional[datetime] = None
    language_code: str = "en-US"


class TransmissionResponse(BaseModel):
    """Schema for transmission response."""
    id: UUID
    channel_id: UUID
    org_id: UUID
    started_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: Optional[float]
    audio_uri: Optional[str]
    audio_format: str
    transcript: Optional[str]
    transcript_confidence: Optional[float]
    language_code: str
    entities: Optional[dict]
    intent: Optional[str]
    priority: str
    tags: Optional[List[str]]
    processing_status: str
    error_message: Optional[str]
    related_incident_id: Optional[UUID]
    related_task_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TransmissionList(BaseModel):
    """Paginated transmission list."""
    items: List[TransmissionResponse]
    total: int
    page: int
    per_page: int


# ==========================================
# API Endpoints
# ==========================================

@router.post("/upload", response_model=TransmissionResponse, status_code=status.HTTP_201_CREATED)
async def upload_audio_transmission(
    channel_id: UUID,
    org_id: UUID,
    audio: UploadFile = File(...),
    language_code: str = "en-US",
    db: AsyncSession = Depends(get_db)
):
    """
    Upload audio file and create transmission for processing.

    Steps:
    1. Validate channel exists
    2. Upload audio to Azure Blob Storage
    3. Create transmission record
    4. Queue for async processing
    """
    try:
        logger.info("Uploading audio transmission",
                    filename=audio.filename,
                    channel_id=str(channel_id),
                    org_id=str(org_id))

        # Validate channel exists
        result = await db.execute(
            select(RadioChannel).where(
                RadioChannel.id == channel_id,
                RadioChannel.org_id == org_id,
                RadioChannel.is_active == True
            )
        )
        channel = result.scalar_one_or_none()
        if not channel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Active channel {channel_id} not found for org {org_id}"
            )

        # Read audio data
        audio_data = await audio.read()
        if len(audio_data) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty audio file"
            )

        # Determine audio format from filename
        audio_format = "wav"
        if audio.filename:
            ext = audio.filename.split(".")[-1].lower()
            if ext in ["wav", "mp3", "m4a", "ogg", "flac"]:
                audio_format = ext

        # Upload to Azure Blob Storage
        transcription_service = TranscriptionService()
        transmission_id = uuid.uuid4()
        blob_filename = f"{org_id}/{channel_id}/{transmission_id}.{audio_format}"

        audio_uri = await transcription_service.upload_audio(
            audio_data,
            blob_filename,
            content_type=audio.content_type or "audio/wav"
        )

        # Calculate duration if provided
        started_at = datetime.utcnow()
        ended_at = None
        duration_seconds = None

        # Create transmission record
        transmission = RadioTransmission(
            id=transmission_id,
            channel_id=channel_id,
            org_id=org_id,
            started_at=started_at,
            ended_at=ended_at,
            duration_seconds=duration_seconds,
            audio_uri=audio_uri,
            audio_format=audio_format,
            language_code=language_code,
            processing_status="pending"
        )

        db.add(transmission)
        await db.commit()
        await db.refresh(transmission)

        logger.info("Transmission created",
                    transmission_id=str(transmission.id),
                    audio_uri=audio_uri)

        # Queue for async processing
        process_audio_transmission.delay(str(transmission.id))
        logger.info("Queued for processing", transmission_id=str(transmission.id))

        return TransmissionResponse.model_validate(transmission)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to upload transmission", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload transmission: {str(e)}"
        )


@router.get("/", response_model=TransmissionList)
async def list_transmissions(
    org_id: Optional[UUID] = None,
    channel_id: Optional[UUID] = None,
    priority: Optional[str] = None,
    processing_status: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """
    List radio transmissions with filtering and pagination.

    Query Parameters:
    - org_id: Filter by organization
    - channel_id: Filter by channel
    - priority: Filter by priority (CRITICAL, HIGH, NORMAL, LOW)
    - processing_status: Filter by status (pending, transcribing, analyzing, complete, failed)
    - page: Page number (1-indexed)
    - per_page: Results per page (max 100)
    """
    try:
        # Build query with filters
        query = select(RadioTransmission)

        if org_id:
            query = query.where(RadioTransmission.org_id == org_id)
        if channel_id:
            query = query.where(RadioTransmission.channel_id == channel_id)
        if priority:
            query = query.where(RadioTransmission.priority == priority.upper())
        if processing_status:
            query = query.where(RadioTransmission.processing_status == processing_status)

        # Order by most recent first
        query = query.order_by(RadioTransmission.started_at.desc())

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        per_page = min(per_page, 100)  # Cap at 100
        offset = (page - 1) * per_page
        query = query.limit(per_page).offset(offset)

        # Execute query
        result = await db.execute(query)
        transmissions = result.scalars().all()

        logger.info("Listed transmissions",
                    count=len(transmissions),
                    total=total,
                    page=page)

        return TransmissionList(
            items=[TransmissionResponse.model_validate(t) for t in transmissions],
            total=total,
            page=page,
            per_page=per_page
        )

    except Exception as e:
        logger.error("Failed to list transmissions", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list transmissions: {str(e)}"
        )


@router.get("/{transmission_id}", response_model=TransmissionResponse)
async def get_transmission(
    transmission_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get transmission details by ID."""
    try:
        result = await db.execute(
            select(RadioTransmission).where(RadioTransmission.id == transmission_id)
        )
        transmission = result.scalar_one_or_none()

        if not transmission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transmission {transmission_id} not found"
            )

        return TransmissionResponse.model_validate(transmission)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get transmission", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get transmission: {str(e)}"
        )


@router.post("/{transmission_id}/reprocess", response_model=TransmissionResponse)
async def reprocess_transmission(
    transmission_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Re-process transmission (re-transcribe and re-analyze).

    Useful when:
    - Processing failed initially
    - NLP model improved
    - User wants updated analysis
    """
    try:
        # Get transmission
        result = await db.execute(
            select(RadioTransmission).where(RadioTransmission.id == transmission_id)
        )
        transmission = result.scalar_one_or_none()

        if not transmission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transmission {transmission_id} not found"
            )

        # Reset processing status
        transmission.processing_status = "pending"
        transmission.error_message = None
        await db.commit()

        # Re-queue for processing
        process_audio_transmission.delay(str(transmission.id))

        logger.info("Reprocessing transmission", transmission_id=str(transmission.id))

        await db.refresh(transmission)
        return TransmissionResponse.model_validate(transmission)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to reprocess transmission", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reprocess transmission: {str(e)}"
        )


@router.delete("/{transmission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transmission(
    transmission_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete transmission and associated audio file."""
    try:
        # Get transmission
        result = await db.execute(
            select(RadioTransmission).where(RadioTransmission.id == transmission_id)
        )
        transmission = result.scalar_one_or_none()

        if not transmission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transmission {transmission_id} not found"
            )

        # TODO: Delete audio from blob storage
        # transcription_service = TranscriptionService()
        # await transcription_service.delete_audio(transmission.audio_uri)

        # Delete from database
        await db.delete(transmission)
        await db.commit()

        logger.info("Deleted transmission", transmission_id=str(transmission.id))

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete transmission", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete transmission: {str(e)}"
        )
