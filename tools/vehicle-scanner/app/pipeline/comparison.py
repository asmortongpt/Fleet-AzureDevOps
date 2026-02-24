"""Stage 6: Change comparison between scans using SSIM + ORB feature matching."""

from __future__ import annotations

import logging
from pathlib import Path

import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim

from app.config import COMPARISON_SSIM_THRESHOLD, ORB_FEATURES
from app.models import (
    BoundingBox,
    ComparisonItem,
    ComparisonResult,
    DamageItem,
    SeverityLevel,
)
from app.utils.image_utils import load_image, resize_max, save_image

logger = logging.getLogger(__name__)


def compare_scans(
    current_frames: list[Path],
    previous_frames: list[Path],
    current_damages: list[DamageItem],
    previous_damages: list[DamageItem],
    output_dir: Path,
    current_scan_id: str,
    previous_scan_id: str,
    vehicle_id: str | None = None,
) -> ComparisonResult:
    """
    Compare two scans of the same vehicle to detect changes.

    1. Aligns frames using ORB feature matching
    2. Computes SSIM difference maps
    3. Cross-references damage detections
    4. Classifies changes as new/resolved/unchanged/worsened
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    # Find best frame pairs (align current frames to previous frames)
    frame_pairs = _match_frames(current_frames, previous_frames)

    # Compute structural differences
    diff_regions = []
    for curr_path, prev_path in frame_pairs:
        regions = _compute_ssim_diff(curr_path, prev_path, output_dir)
        diff_regions.extend(regions)

    # Cross-reference damage detections
    new_damages = []
    resolved_damages = []
    unchanged_damages = []
    worsened_damages = []

    # Match current damages against previous
    matched_prev = set()
    for curr_item in current_damages:
        best_match = None
        best_iou = 0.0

        for prev_item in previous_damages:
            if prev_item.id in matched_prev:
                continue
            iou = _compute_iou(curr_item.bbox, prev_item.bbox)
            if iou > best_iou and iou > 0.3:
                best_iou = iou
                best_match = prev_item

        if best_match:
            matched_prev.add(best_match.id)
            # Compare severity
            if _severity_value(curr_item.severity) > _severity_value(best_match.severity):
                worsened_damages.append(curr_item)
            else:
                unchanged_damages.append(curr_item)
        else:
            new_damages.append(curr_item)

    # Previous damages not matched → resolved
    for prev_item in previous_damages:
        if prev_item.id not in matched_prev:
            resolved_damages.append(prev_item)

    # Calculate overall change score
    # Negative = vehicle got worse, Positive = vehicle improved
    new_penalty = sum(_severity_value(d.severity) for d in new_damages) * -10
    worsened_penalty = sum(_severity_value(d.severity) for d in worsened_damages) * -5
    resolved_bonus = sum(_severity_value(d.severity) for d in resolved_damages) * 10
    overall_change = max(-100, min(100, resolved_bonus + new_penalty + worsened_penalty))

    # Generate comparison image
    comparison_image_url = None
    if frame_pairs:
        comp_path = _create_comparison_image(frame_pairs[0], output_dir)
        if comp_path:
            comparison_image_url = f"/scan/{current_scan_id}/comparison.jpg"

    result = ComparisonResult(
        current_scan_id=current_scan_id,
        previous_scan_id=previous_scan_id,
        vehicle_id=vehicle_id,
        new_damages=new_damages,
        resolved_damages=resolved_damages,
        unchanged_damages=unchanged_damages,
        worsened_damages=worsened_damages,
        overall_change_score=overall_change,
        comparison_image_url=comparison_image_url,
    )

    logger.info(
        "Comparison complete: %d new, %d resolved, %d unchanged, %d worsened (score: %.1f)",
        len(new_damages), len(resolved_damages), len(unchanged_damages),
        len(worsened_damages), overall_change,
    )
    return result


def _match_frames(
    current_frames: list[Path], previous_frames: list[Path]
) -> list[tuple[Path, Path]]:
    """Match current frames to previous frames using ORB feature matching."""
    if not current_frames or not previous_frames:
        return []

    orb = cv2.ORB_create(nfeatures=ORB_FEATURES)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)

    pairs = []

    # For each current frame, find best matching previous frame
    prev_descriptors = []
    for prev_path in previous_frames:
        img = load_image(prev_path)
        gray = cv2.cvtColor(resize_max(img, 640), cv2.COLOR_BGR2GRAY)
        kp, des = orb.detectAndCompute(gray, None)
        prev_descriptors.append((prev_path, des))

    for curr_path in current_frames:
        img = load_image(curr_path)
        gray = cv2.cvtColor(resize_max(img, 640), cv2.COLOR_BGR2GRAY)
        kp_curr, des_curr = orb.detectAndCompute(gray, None)

        if des_curr is None:
            continue

        best_match_path = None
        best_match_count = 0

        for prev_path, des_prev in prev_descriptors:
            if des_prev is None:
                continue
            try:
                matches = bf.match(des_curr, des_prev)
                if len(matches) > best_match_count:
                    best_match_count = len(matches)
                    best_match_path = prev_path
            except cv2.error:
                continue

        if best_match_path and best_match_count > 10:
            pairs.append((curr_path, best_match_path))

    logger.info("Matched %d frame pairs", len(pairs))
    return pairs


def _compute_ssim_diff(
    curr_path: Path, prev_path: Path, output_dir: Path
) -> list[dict]:
    """Compute SSIM difference between two aligned frames."""
    curr_img = resize_max(load_image(curr_path), 1024)
    prev_img = resize_max(load_image(prev_path), 1024)

    # Ensure same dimensions
    h = min(curr_img.shape[0], prev_img.shape[0])
    w = min(curr_img.shape[1], prev_img.shape[1])
    curr_img = curr_img[:h, :w]
    prev_img = prev_img[:h, :w]

    # Convert to grayscale for SSIM
    curr_gray = cv2.cvtColor(curr_img, cv2.COLOR_BGR2GRAY)
    prev_gray = cv2.cvtColor(prev_img, cv2.COLOR_BGR2GRAY)

    try:
        score, diff = ssim(prev_gray, curr_gray, full=True)
    except Exception as e:
        logger.warning("SSIM computation failed: %s", e)
        return []

    # Convert diff to uint8 (0=different, 255=identical)
    diff_img = (diff * 255).astype(np.uint8)

    # Threshold to find changed regions
    _, thresh = cv2.threshold(diff_img, int(COMPARISON_SSIM_THRESHOLD * 255), 255, cv2.THRESH_BINARY_INV)

    # Find contours of changed regions
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    regions = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area > 100:  # Filter tiny noise
            x, y, bw, bh = cv2.boundingRect(contour)
            regions.append({
                "bbox": BoundingBox(x1=x, y1=y, x2=x + bw, y2=y + bh),
                "area": area,
                "ssim_score": score,
            })

    # Save diff visualization
    diff_vis = cv2.applyColorMap(255 - diff_img, cv2.COLORMAP_JET)
    diff_path = output_dir / f"diff_{curr_path.stem}.jpg"
    save_image(diff_vis, diff_path)

    return regions


def _create_comparison_image(
    frame_pair: tuple[Path, Path], output_dir: Path
) -> Path | None:
    """Create a side-by-side comparison image."""
    curr_path, prev_path = frame_pair

    curr_img = resize_max(load_image(curr_path), 960)
    prev_img = resize_max(load_image(prev_path), 960)

    # Match heights
    h = min(curr_img.shape[0], prev_img.shape[0])
    curr_img = curr_img[:h, :]
    prev_img = prev_img[:h, :]

    # Add labels
    cv2.putText(prev_img, "Previous", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 200, 0), 2)
    cv2.putText(curr_img, "Current", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 165, 255), 2)

    # Stack side by side
    combined = np.hstack([prev_img, curr_img])
    comp_path = output_dir / "comparison.jpg"
    save_image(combined, comp_path)
    return comp_path


def _compute_iou(a: BoundingBox, b: BoundingBox) -> float:
    """Compute Intersection over Union."""
    x1 = max(a.x1, b.x1)
    y1 = max(a.y1, b.y1)
    x2 = min(a.x2, b.x2)
    y2 = min(a.y2, b.y2)

    if x2 <= x1 or y2 <= y1:
        return 0.0

    intersection = (x2 - x1) * (y2 - y1)
    area_a = (a.x2 - a.x1) * (a.y2 - a.y1)
    area_b = (b.x2 - b.x1) * (b.y2 - b.y1)
    union = area_a + area_b - intersection
    return intersection / max(union, 1e-6)


def _severity_value(severity: SeverityLevel) -> float:
    """Convert severity to numeric value for scoring."""
    return {"minor": 1.0, "moderate": 2.0, "severe": 3.0}.get(severity, 0.0)
