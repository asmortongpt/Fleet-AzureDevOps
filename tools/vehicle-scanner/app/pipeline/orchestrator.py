"""Pipeline orchestrator — runs the 7-stage vehicle scanning pipeline."""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from typing import Optional

from app.config import RESULTS_DIR, UPLOAD_DIR
from app.models import (
    ComparisonResult,
    DamageItem,
    DamageReport,
    ProcessedImage,
    ScanResults,
    ScanStage,
    ScanStatus,
)

logger = logging.getLogger(__name__)

# In-memory scan tracking (production: Redis)
_scans: dict[str, ScanStatus] = {}
_scan_results: dict[str, ScanResults] = {}
_scan_damages: dict[str, list[DamageItem]] = {}
_scan_frames: dict[str, list[Path]] = {}


def get_scan_status(scan_id: str) -> Optional[ScanStatus]:
    """Get current status of a scan."""
    return _scans.get(scan_id)


def get_scan_results(scan_id: str) -> Optional[ScanResults]:
    """Get completed scan results."""
    return _scan_results.get(scan_id)


def get_scan_damages(scan_id: str) -> list[DamageItem]:
    """Get damage items for a scan."""
    return _scan_damages.get(scan_id, [])


def get_scan_frames(scan_id: str) -> list[Path]:
    """Get frame paths for a scan."""
    return _scan_frames.get(scan_id, [])


def _update_status(
    scan_id: str,
    stage: ScanStage,
    progress: float,
    description: str = "",
    eta: float | None = None,
    error: str | None = None,
):
    """Update scan status in the tracking dict."""
    _scans[scan_id] = ScanStatus(
        scan_id=scan_id,
        status=stage,
        progress=min(progress, 100.0),
        stage_description=description,
        eta_seconds=eta,
        error_message=error,
    )


def run_pipeline(
    scan_id: str,
    input_paths: list[Path],
    vehicle_id: str | None = None,
    make: str | None = None,
    model: str | None = None,
    year: int | None = None,
    previous_scan_id: str | None = None,
) -> None:
    """
    Run the full 7-stage pipeline. Called in a background thread.

    Stages:
    1. Frame Extraction (0-15%)
    2. Preprocessing / Background Removal (15-30%)
    3. Enhancement / Upscaling (30-40%)
    4. Damage Detection (40-60%)
    5. Damage Segmentation (60-75%)
    6. Change Comparison (75-85%)
    7. Report Generation (85-100%)
    """
    start_time = time.time()
    upload_dir = UPLOAD_DIR / scan_id
    results_dir = RESULTS_DIR / scan_id
    results_dir.mkdir(parents=True, exist_ok=True)

    frames_dir = results_dir / "frames"

    try:
        # ===== STAGE 1: Frame Extraction =====
        _update_status(scan_id, ScanStage.extracting, 0, "Extracting keyframes from input...")
        logger.info("[%s] Stage 1: Frame extraction", scan_id)

        from app.pipeline.frame_extraction import extract_frames

        frame_paths = extract_frames(
            input_paths,
            frames_dir,
            on_progress=lambda p: _update_status(
                scan_id, ScanStage.extracting, p * 0.15,
                f"Extracting frames ({p:.0f}%)",
                eta=_estimate_eta(start_time, p * 0.15),
            ),
        )
        _scan_frames[scan_id] = frame_paths

        if not frame_paths:
            _update_status(scan_id, ScanStage.error, 0, error="No valid frames extracted from input")
            return

        _update_status(scan_id, ScanStage.preprocessing, 15,
                        f"Extracted {len(frame_paths)} keyframes")

        # ===== STAGE 2-3: Preprocessing + Enhancement =====
        logger.info("[%s] Stage 2-3: Preprocessing (%d frames)", scan_id, len(frame_paths))

        from app.pipeline.preprocessing import preprocess_frames

        preprocess_results = preprocess_frames(
            frame_paths,
            results_dir,
            on_progress=lambda p: _update_status(
                scan_id, ScanStage.preprocessing, 15 + p * 0.25,
                f"Removing backgrounds & enhancing ({p:.0f}%)",
                eta=_estimate_eta(start_time, 15 + p * 0.25),
            ),
        )

        _update_status(scan_id, ScanStage.detecting, 40, "Preprocessing complete")

        # ===== STAGE 4: Damage Detection =====
        logger.info("[%s] Stage 4: Damage detection", scan_id)

        from app.pipeline.detection import detect_damage

        detections_dir = results_dir / "detections"
        damage_items = detect_damage(
            frame_paths,
            detections_dir,
            on_progress=lambda p: _update_status(
                scan_id, ScanStage.detecting, 40 + p * 0.20,
                f"Analyzing for damage ({p:.0f}%)",
                eta=_estimate_eta(start_time, 40 + p * 0.20),
            ),
        )
        _scan_damages[scan_id] = damage_items

        _update_status(scan_id, ScanStage.segmenting, 60,
                        f"Detected {len(damage_items)} potential damages")

        # ===== STAGE 5: Segmentation =====
        logger.info("[%s] Stage 5: Damage segmentation (%d items)", scan_id, len(damage_items))

        from app.pipeline.segmentation import segment_damages

        damage_items = segment_damages(
            frame_paths,
            damage_items,
            results_dir,
            on_progress=lambda p: _update_status(
                scan_id, ScanStage.segmenting, 60 + p * 0.15,
                f"Segmenting damage regions ({p:.0f}%)",
                eta=_estimate_eta(start_time, 60 + p * 0.15),
            ),
        )
        _scan_damages[scan_id] = damage_items

        # ===== STAGE 6: Comparison (optional) =====
        comparison: ComparisonResult | None = None
        if previous_scan_id and previous_scan_id in _scan_frames:
            logger.info("[%s] Stage 6: Comparing with previous scan %s", scan_id, previous_scan_id)
            _update_status(scan_id, ScanStage.comparing, 75, "Comparing with previous scan...")

            from app.pipeline.comparison import compare_scans

            prev_frames = _scan_frames[previous_scan_id]
            prev_damages = _scan_damages.get(previous_scan_id, [])
            comparison_dir = results_dir / "comparison"

            comparison = compare_scans(
                current_frames=frame_paths,
                previous_frames=prev_frames,
                current_damages=damage_items,
                previous_damages=prev_damages,
                output_dir=comparison_dir,
                current_scan_id=scan_id,
                previous_scan_id=previous_scan_id,
                vehicle_id=vehicle_id,
            )
        else:
            _update_status(scan_id, ScanStage.comparing, 85, "No previous scan to compare")

        # ===== STAGE 7: Report Generation =====
        logger.info("[%s] Stage 7: Generating report", scan_id)
        _update_status(scan_id, ScanStage.reporting, 85, "Generating damage report...")

        from app.pipeline.report import generate_report

        damage_report = generate_report(
            scan_id=scan_id,
            vehicle_id=vehicle_id,
            make=make,
            model=model,
            year=year,
            frame_paths=frame_paths,
            damage_items=damage_items,
            results_dir=results_dir,
            on_progress=lambda p: _update_status(
                scan_id, ScanStage.reporting, 85 + p * 0.15,
                f"Generating report ({p:.0f}%)",
                eta=_estimate_eta(start_time, 85 + p * 0.15),
            ),
        )

        # ===== Build final results =====
        processed_images = []
        showroom_images = []

        for i, frame_path in enumerate(frame_paths):
            original_url = f"/scan/{scan_id}/frames/{frame_path.name}"
            processed_url = original_url

            # Check for showroom image
            showroom_path = results_dir / "showroom" / f"{frame_path.stem}_nobg_showroom.jpg"
            if showroom_path.exists():
                processed_url = f"/scan/{scan_id}/showroom/{showroom_path.name}"
                showroom_images.append(processed_url)

            thumb_path = results_dir / "thumbnails" / f"{frame_path.stem}_thumb.jpg"
            thumb_url = f"/scan/{scan_id}/thumbnails/{thumb_path.name}" if thumb_path.exists() else None

            processed_images.append(ProcessedImage(
                frame_index=i,
                original_url=original_url,
                processed_url=processed_url,
                thumbnail_url=thumb_url,
            ))

        scan_results = ScanResults(
            scan_id=scan_id,
            status=ScanStage.complete,
            damage_report=damage_report,
            processed_images=processed_images,
            showroom_images=showroom_images,
        )
        _scan_results[scan_id] = scan_results

        elapsed = time.time() - start_time
        _update_status(scan_id, ScanStage.complete, 100,
                        f"Scan complete — {len(damage_items)} damages found ({elapsed:.1f}s)")

        logger.info("[%s] Pipeline complete in %.1fs: %d frames, %d damages, score=%.1f",
                     scan_id, elapsed, len(frame_paths), len(damage_items),
                     damage_report.overall_score)

    except Exception as e:
        logger.exception("[%s] Pipeline failed: %s", scan_id, e)
        _update_status(scan_id, ScanStage.error, 0, error=str(e))


def _estimate_eta(start_time: float, progress: float) -> float | None:
    """Estimate remaining time based on elapsed time and progress."""
    if progress <= 0:
        return None
    elapsed = time.time() - start_time
    total_estimated = elapsed / (progress / 100)
    remaining = total_estimated - elapsed
    return max(0, remaining)
