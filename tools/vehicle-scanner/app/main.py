"""FastAPI application — Vehicle Scanner Pipeline API."""

from __future__ import annotations

import asyncio
import logging
import shutil
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import ALLOWED_EXTENSIONS, MAX_UPLOAD_SIZE_MB, RESULTS_DIR, UPLOAD_DIR
from app.models import (
    CompareRequest,
    ComparisonResult,
    DamageReport,
    HealthResponse,
    ScanResults,
    ScanStage,
    ScanStartResponse,
    ScanStatus,
)
from app.pipeline.orchestrator import (
    get_scan_damages,
    get_scan_frames,
    get_scan_results,
    get_scan_status,
    run_pipeline,
)
from app.utils.model_loader import get_device, get_loaded_models, preload_models

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Vehicle Scanner Pipeline",
    description="Phone video/photo to showroom quality + damage detection",
    version="1.0.0",
)

# CORS for frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    """Pre-load ML models on startup."""
    logger.info("Vehicle Scanner starting up...")
    await asyncio.to_thread(preload_models)
    logger.info("Vehicle Scanner ready")


# ========================
# Scan Endpoints
# ========================

@app.post("/scan", response_model=ScanStartResponse)
async def start_scan(
    files: list[UploadFile] = File(...),
    vehicle_id: str = Form(default=None),
    make: str = Form(default=None),
    model: str = Form(default=None),
    year: int = Form(default=None),
    previous_scan_id: str = Form(default=None),
):
    """Upload video/photos and start the scanning pipeline."""
    scan_id = str(uuid.uuid4())

    # Validate files
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    # Create upload directory
    upload_dir = UPLOAD_DIR / scan_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    input_paths: list[Path] = []

    for file in files:
        # Validate extension
        ext = Path(file.filename or "unknown").suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
            )

        # Save file
        file_path = upload_dir / (file.filename or f"upload_{len(input_paths)}{ext}")
        content = await file.read()

        # Check file size
        size_mb = len(content) / (1024 * 1024)
        if size_mb > MAX_UPLOAD_SIZE_MB:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {size_mb:.1f}MB (max: {MAX_UPLOAD_SIZE_MB}MB)",
            )

        file_path.write_bytes(content)
        input_paths.append(file_path)

    logger.info("Scan %s: %d files uploaded (vehicle: %s %s %s %s)",
                scan_id, len(input_paths), vehicle_id, make, model, year)

    # Start pipeline in background thread
    asyncio.get_event_loop().run_in_executor(
        None,
        run_pipeline,
        scan_id,
        input_paths,
        vehicle_id,
        make,
        model,
        year,
        previous_scan_id,
    )

    return ScanStartResponse(
        scan_id=scan_id,
        status=ScanStage.uploading,
        message=f"Scan started with {len(input_paths)} file(s)",
    )


@app.get("/scan/{scan_id}/status", response_model=ScanStatus)
async def scan_status(scan_id: str):
    """Get current pipeline progress."""
    status = get_scan_status(scan_id)
    if status is None:
        raise HTTPException(status_code=404, detail=f"Scan not found: {scan_id}")
    return status


@app.get("/scan/{scan_id}/results", response_model=ScanResults)
async def scan_results(scan_id: str):
    """Get complete scan results including damage report and processed images."""
    results = get_scan_results(scan_id)
    if results is None:
        status = get_scan_status(scan_id)
        if status is None:
            raise HTTPException(status_code=404, detail=f"Scan not found: {scan_id}")
        if status.status == ScanStage.error:
            raise HTTPException(status_code=500, detail=status.error_message or "Pipeline failed")
        raise HTTPException(status_code=202, detail=f"Scan still processing: {status.stage_description}")
    return results


@app.get("/scan/{scan_id}/damage-report", response_model=DamageReport)
async def damage_report(scan_id: str):
    """Get damage report only."""
    results = get_scan_results(scan_id)
    if results is None or results.damage_report is None:
        raise HTTPException(status_code=404, detail="Damage report not available")
    return results.damage_report


@app.get("/scan/{scan_id}/renders")
async def scan_renders(scan_id: str):
    """Get processed showroom images."""
    results = get_scan_results(scan_id)
    if results is None:
        raise HTTPException(status_code=404, detail="Scan results not available")
    return {"scan_id": scan_id, "showroom_images": results.showroom_images}


# ========================
# Comparison Endpoint
# ========================

@app.post("/compare", response_model=ComparisonResult)
async def compare_scans_endpoint(request: CompareRequest):
    """Compare two scans for change detection."""
    # Validate both scans exist and are complete
    for sid in [request.current_scan_id, request.previous_scan_id]:
        status = get_scan_status(sid)
        if status is None:
            raise HTTPException(status_code=404, detail=f"Scan not found: {sid}")
        if status.status != ScanStage.complete:
            raise HTTPException(status_code=400, detail=f"Scan {sid} is not complete")

    current_frames = get_scan_frames(request.current_scan_id)
    previous_frames = get_scan_frames(request.previous_scan_id)
    current_damages = get_scan_damages(request.current_scan_id)
    previous_damages = get_scan_damages(request.previous_scan_id)

    from app.pipeline.comparison import compare_scans

    comparison_dir = RESULTS_DIR / request.current_scan_id / "comparison"
    result = await asyncio.to_thread(
        compare_scans,
        current_frames,
        previous_frames,
        current_damages,
        previous_damages,
        comparison_dir,
        request.current_scan_id,
        request.previous_scan_id,
        request.vehicle_id,
    )
    return result


# ========================
# Static File Serving
# ========================

@app.get("/scan/{scan_id}/{file_type}/{filename}")
async def serve_scan_file(scan_id: str, file_type: str, filename: str):
    """Serve processed scan files (images, masks, etc.)."""
    file_path = RESULTS_DIR / scan_id / file_type / filename
    if not file_path.exists():
        # Also try direct under results dir
        file_path = RESULTS_DIR / scan_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    media_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".json": "application/json",
    }
    media_type = media_types.get(file_path.suffix.lower(), "application/octet-stream")
    return FileResponse(file_path, media_type=media_type)


# ========================
# Health Check
# ========================

@app.get("/health", response_model=HealthResponse)
async def health():
    """Service health check with model status."""
    # Calculate disk usage of data directory
    data_dir = RESULTS_DIR.parent
    try:
        usage = sum(f.stat().st_size for f in data_dir.rglob("*") if f.is_file())
        disk_mb = usage / (1024 * 1024)
    except Exception:
        disk_mb = None

    return HealthResponse(
        status="ok",
        device=get_device(),
        models_loaded=get_loaded_models(),
        disk_usage_mb=disk_mb,
    )
