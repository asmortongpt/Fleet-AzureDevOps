"""Stage 7: Generate damage report and annotated composite images."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np

from app.models import DamageItem, DamageReport, SeverityLevel
from app.pipeline.segmentation import create_damage_overlay
from app.utils.image_utils import load_image, save_image

logger = logging.getLogger(__name__)

# Severity weights for scoring
SEVERITY_PENALTY = {
    SeverityLevel.minor: 2,
    SeverityLevel.moderate: 8,
    SeverityLevel.severe: 20,
}


def generate_report(
    scan_id: str,
    vehicle_id: str | None,
    make: str | None,
    model: str | None,
    year: int | None,
    frame_paths: list[Path],
    damage_items: list[DamageItem],
    results_dir: Path,
    on_progress: callable = None,
) -> DamageReport:
    """
    Generate the final damage report with:
    1. Overall condition score
    2. Annotated composite image
    3. JSON report saved to disk
    """
    results_dir.mkdir(parents=True, exist_ok=True)
    masks_dir = results_dir / "masks"

    # --- Calculate overall condition score ---
    total_penalty = sum(
        SEVERITY_PENALTY.get(item.severity, 5) * item.confidence
        for item in damage_items
    )
    overall_score = max(0.0, min(100.0, 100.0 - total_penalty))

    # --- Calculate total damage area ---
    total_area = sum(item.area_percent or 0.0 for item in damage_items)

    # --- Create annotated composite image ---
    annotated_url = None
    if frame_paths:
        annotated_path = _create_annotated_composite(
            frame_paths, damage_items, masks_dir, results_dir, scan_id
        )
        if annotated_path:
            annotated_url = f"/scan/{scan_id}/annotated.jpg"

    if on_progress:
        on_progress(100)

    report = DamageReport(
        scan_id=scan_id,
        vehicle_id=vehicle_id,
        make=make,
        model=model,
        year=year,
        timestamp=datetime.now(timezone.utc),
        items=damage_items,
        overall_score=round(overall_score, 1),
        total_damage_area_percent=round(total_area, 3),
        annotated_image_url=annotated_url,
        frame_count=len(frame_paths),
    )

    # --- Save JSON report ---
    report_path = results_dir / "damage_report.json"
    report_path.write_text(report.model_dump_json(indent=2))
    logger.info("Report saved: %s (score: %.1f, %d items)", report_path, overall_score, len(damage_items))

    return report


def _create_annotated_composite(
    frame_paths: list[Path],
    damage_items: list[DamageItem],
    masks_dir: Path,
    output_dir: Path,
    scan_id: str,
) -> Path | None:
    """Create a composite annotated image showing all damage detections."""
    if not frame_paths:
        return None

    # Use the first frame as the primary annotated image
    primary_frame = frame_paths[0]
    img = load_image(primary_frame)
    if img is None:
        return None

    # Get damages for this frame
    frame_0_damages = [d for d in damage_items if d.frame_index == 0]

    # Create overlay with damage regions
    if frame_0_damages:
        annotated = create_damage_overlay(img, frame_0_damages, masks_dir, alpha=0.35)
    else:
        annotated = img.copy()

    # Add summary text at bottom
    h, w = annotated.shape[:2]
    total_items = len(damage_items)
    severe_count = sum(1 for d in damage_items if d.severity == SeverityLevel.severe)
    moderate_count = sum(1 for d in damage_items if d.severity == SeverityLevel.moderate)
    minor_count = sum(1 for d in damage_items if d.severity == SeverityLevel.minor)

    # Dark banner at bottom
    banner_h = 50
    annotated[-banner_h:, :] = annotated[-banner_h:, :] // 3

    summary = f"Scan: {scan_id[:8]}  |  Damages: {total_items}"
    if severe_count:
        summary += f"  |  Severe: {severe_count}"
    if moderate_count:
        summary += f"  |  Moderate: {moderate_count}"
    if minor_count:
        summary += f"  |  Minor: {minor_count}"

    cv2.putText(
        annotated, summary,
        (10, h - 15),
        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1,
    )

    # Save
    output_path = output_dir / "annotated.jpg"
    save_image(annotated, output_path)

    # --- Also create a multi-frame grid if multiple frames ---
    if len(frame_paths) > 1:
        _create_multi_frame_grid(frame_paths, damage_items, masks_dir, output_dir)

    return output_path


def _create_multi_frame_grid(
    frame_paths: list[Path],
    damage_items: list[DamageItem],
    masks_dir: Path,
    output_dir: Path,
    max_cols: int = 3,
    thumb_size: int = 480,
):
    """Create a grid of annotated frames."""
    n = min(len(frame_paths), 9)  # Max 3x3 grid
    cols = min(n, max_cols)
    rows = (n + cols - 1) // cols

    thumbs = []
    for i in range(n):
        img = load_image(frame_paths[i])
        if img is None:
            continue

        # Resize to thumbnail
        h, w = img.shape[:2]
        scale = thumb_size / max(h, w)
        resized = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

        # Add damage overlay
        frame_damages = [d for d in damage_items if d.frame_index == i]
        if frame_damages:
            resized = create_damage_overlay(resized, frame_damages, masks_dir, alpha=0.3)

        # Pad to square
        th, tw = resized.shape[:2]
        padded = np.zeros((thumb_size, thumb_size, 3), dtype=np.uint8)
        padded[:] = (10, 10, 10)  # Dark background
        y_off = (thumb_size - th) // 2
        x_off = (thumb_size - tw) // 2
        padded[y_off:y_off + th, x_off:x_off + tw] = resized

        # Frame label
        cv2.putText(padded, f"Frame {i + 1}", (10, 25),
                     cv2.FONT_HERSHEY_SIMPLEX, 0.6, (180, 180, 180), 1)

        thumbs.append(padded)

    if not thumbs:
        return

    # Pad to fill grid
    while len(thumbs) < rows * cols:
        blank = np.zeros((thumb_size, thumb_size, 3), dtype=np.uint8)
        blank[:] = (10, 10, 10)
        thumbs.append(blank)

    # Assemble grid
    grid_rows = []
    for r in range(rows):
        row_imgs = thumbs[r * cols:(r + 1) * cols]
        grid_rows.append(np.hstack(row_imgs))
    grid = np.vstack(grid_rows)

    grid_path = output_dir / "frames_grid.jpg"
    save_image(grid, grid_path)
    logger.info("Multi-frame grid saved: %s (%dx%d)", grid_path, cols, rows)
