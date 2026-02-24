"""Stage 5: SAM2 pixel-precise damage segmentation."""

from __future__ import annotations

import logging
from pathlib import Path

import cv2
import numpy as np

from app.models import DamageItem
from app.utils.image_utils import load_image, save_image
from app.utils.model_loader import load_sam2

logger = logging.getLogger(__name__)


def segment_damages(
    frame_paths: list[Path],
    damage_items: list[DamageItem],
    output_dir: Path,
    on_progress: callable = None,
) -> list[DamageItem]:
    """
    Generate pixel-precise masks for each damage detection.

    If SAM2 is available: uses point prompts at bbox centers to generate masks.
    Fallback: uses YOLO bounding boxes as approximate rectangular masks.

    Updates each DamageItem with mask_url and area_percent.
    Returns the updated items.
    """
    masks_dir = output_dir / "masks"
    masks_dir.mkdir(parents=True, exist_ok=True)

    sam_predictor = load_sam2()
    total = len(damage_items)

    for i, item in enumerate(damage_items):
        # Get the frame this detection belongs to
        frame_idx = item.frame_index
        if frame_idx >= len(frame_paths):
            continue

        frame_path = frame_paths[frame_idx]
        img = load_image(frame_path)
        h, w = img.shape[:2]

        if sam_predictor is not None:
            mask = _segment_with_sam2(sam_predictor, img, item)
        else:
            mask = _segment_with_bbox(img, item)

        if mask is not None:
            # Save mask
            mask_path = masks_dir / f"mask_{item.id}.png"
            save_image(mask, mask_path)
            item.mask_url = f"/scan/masks/mask_{item.id}.png"

            # Calculate area percentage
            mask_gray = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY) if len(mask.shape) == 3 else mask
            mask_pixels = np.count_nonzero(mask_gray)
            total_pixels = h * w
            item.area_percent = round((mask_pixels / total_pixels) * 100, 3)

        if on_progress:
            on_progress((i + 1) / max(total, 1) * 100)

    logger.info("Segmented %d damage items (%s)",
                total, "SAM2" if sam_predictor else "bbox fallback")
    return damage_items


def _segment_with_sam2(predictor, img: np.ndarray, item: DamageItem) -> np.ndarray | None:
    """Use SAM2 to generate a precise mask from bbox center point."""
    try:
        # Convert BGR to RGB for SAM2
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        predictor.set_image(rgb)

        # Use bbox center as point prompt
        cx = (item.bbox.x1 + item.bbox.x2) / 2
        cy = (item.bbox.y1 + item.bbox.y2) / 2
        input_point = np.array([[cx, cy]])
        input_label = np.array([1])  # Foreground

        # Also use bbox as box prompt for better results
        input_box = np.array([item.bbox.x1, item.bbox.y1, item.bbox.x2, item.bbox.y2])

        masks, scores, _ = predictor.predict(
            point_coords=input_point,
            point_labels=input_label,
            box=input_box,
            multimask_output=True,
        )

        # Take the highest-scoring mask
        best_idx = np.argmax(scores)
        mask = masks[best_idx]

        # Convert boolean mask to uint8 image
        mask_img = (mask * 255).astype(np.uint8)
        return mask_img

    except Exception as e:
        logger.warning("SAM2 segmentation failed for item %s: %s — falling back to bbox", item.id, e)
        return _segment_with_bbox(img, item)


def _segment_with_bbox(img: np.ndarray, item: DamageItem) -> np.ndarray | None:
    """Create a rectangular mask from the bounding box (fallback)."""
    h, w = img.shape[:2]
    mask = np.zeros((h, w), dtype=np.uint8)

    x1 = max(0, int(item.bbox.x1))
    y1 = max(0, int(item.bbox.y1))
    x2 = min(w, int(item.bbox.x2))
    y2 = min(h, int(item.bbox.y2))

    mask[y1:y2, x1:x2] = 255
    return mask


def create_damage_overlay(
    img: np.ndarray,
    damage_items: list[DamageItem],
    masks_dir: Path,
    alpha: float = 0.4,
) -> np.ndarray:
    """Create an overlay image showing all damage regions with color coding."""
    from app.models import SeverityLevel

    overlay = img.copy()
    severity_colors = {
        SeverityLevel.minor: (0, 200, 0),       # Green (BGR)
        SeverityLevel.moderate: (0, 165, 255),   # Orange
        SeverityLevel.severe: (0, 0, 255),       # Red
    }

    for item in damage_items:
        color = severity_colors.get(item.severity, (255, 255, 255))

        # Try to load mask
        mask_path = masks_dir / f"mask_{item.id}.png"
        if mask_path.exists():
            mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
            if mask is not None and mask.shape[:2] == img.shape[:2]:
                # Color overlay on mask region
                colored = np.zeros_like(img)
                colored[:] = color
                mask_bool = mask > 127
                overlay[mask_bool] = cv2.addWeighted(
                    overlay[mask_bool], 1 - alpha,
                    colored[mask_bool], alpha, 0,
                )
                continue

        # Fallback: draw filled rectangle with alpha
        x1 = max(0, int(item.bbox.x1))
        y1 = max(0, int(item.bbox.y1))
        x2 = min(img.shape[1], int(item.bbox.x2))
        y2 = min(img.shape[0], int(item.bbox.y2))

        sub_overlay = overlay[y1:y2, x1:x2].copy()
        cv2.rectangle(overlay, (x1, y1), (x2, y2), color, -1)
        overlay[y1:y2, x1:x2] = cv2.addWeighted(sub_overlay, 1 - alpha, overlay[y1:y2, x1:x2], alpha, 0)

    return overlay
