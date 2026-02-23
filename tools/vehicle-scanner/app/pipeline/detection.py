"""Stage 4: YOLOv8 damage detection."""

from __future__ import annotations

import logging
import uuid
from pathlib import Path

import cv2
import numpy as np

from app.config import (
    YOLO_CONF_THRESHOLD,
    YOLO_IOU_THRESHOLD,
    DAMAGE_CLASS_MAP,
    SEVERITY_THRESHOLDS,
)
from app.models import BoundingBox, DamageItem, SeverityLevel
from app.utils.model_loader import load_yolo

logger = logging.getLogger(__name__)

# COCO classes that may indicate vehicle damage when detected on a car
# Phase 1: We use general object detection and filter for anomalies
# Phase 2: Fine-tuned model with dedicated damage classes
COCO_DAMAGE_INDICATORS = {
    # Objects that shouldn't be on a car body → potential damage
    # We focus on visual anomaly detection instead
}


def detect_damage(
    frame_paths: list[Path],
    output_dir: Path,
    on_progress: callable = None,
) -> list[DamageItem]:
    """
    Run YOLOv8 damage detection on all frames.

    Phase 1: Uses pre-trained YOLO for general detection. The model detects
    vehicles and objects; we analyze the detection patterns and confidence
    to identify potential damage areas (unusual detections, low-confidence
    regions on vehicle body).

    Phase 2: Will use a fine-tuned model with dedicated damage classes.

    Returns list of DamageItem instances.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    yolo = load_yolo()
    all_items: list[DamageItem] = []

    total = len(frame_paths)
    for frame_idx, frame_path in enumerate(frame_paths):
        img = cv2.imread(str(frame_path))
        if img is None:
            continue

        h, w = img.shape[:2]

        # Run YOLO inference
        results = yolo(
            img,
            conf=YOLO_CONF_THRESHOLD,
            iou=YOLO_IOU_THRESHOLD,
            verbose=False,
        )

        frame_items = _process_detections(results, frame_idx, w, h)
        all_items.extend(frame_items)

        # Also run visual anomaly detection (color/texture analysis)
        anomaly_items = _detect_visual_anomalies(img, frame_idx, w, h)
        all_items.extend(anomaly_items)

        # Save annotated frame
        annotated = _draw_detections(img, frame_items + anomaly_items)
        annotated_path = output_dir / f"frame_{frame_idx:04d}_detections.jpg"
        cv2.imwrite(str(annotated_path), annotated)

        if on_progress:
            on_progress((frame_idx + 1) / total * 100)

    # Deduplicate similar detections across frames
    all_items = _deduplicate_items(all_items)

    logger.info("Detected %d damage items across %d frames", len(all_items), total)
    return all_items


def _process_detections(
    results, frame_idx: int, img_w: int, img_h: int
) -> list[DamageItem]:
    """Process YOLO results into DamageItem list."""
    items: list[DamageItem] = []

    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue

        for i in range(len(boxes)):
            conf = float(boxes.conf[i])
            cls_id = int(boxes.cls[i])
            cls_name = result.names.get(cls_id, "unknown")

            # Phase 1: General detection — detect vehicles and their parts
            # Look for damage-indicative patterns
            x1, y1, x2, y2 = boxes.xyxy[i].tolist()

            # Skip detections that are clearly not damage-related
            if cls_name in ("person", "bicycle", "motorcycle", "bus", "train",
                            "traffic light", "stop sign", "parking meter"):
                continue

            # In Phase 1, we note detections that could indicate damage context
            # (e.g., a "car" detected with low confidence might have visual damage)
            if cls_name == "car" and conf < 0.5:
                # Low-confidence car detection may indicate visual anomaly
                items.append(DamageItem(
                    id=str(uuid.uuid4())[:8],
                    damage_type="potential_anomaly",
                    severity=_classify_severity(conf, (x2 - x1) * (y2 - y1) / (img_w * img_h)),
                    confidence=conf,
                    bbox=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2),
                    frame_index=frame_idx,
                    description=f"Low-confidence vehicle region (YOLO: {cls_name} @ {conf:.2f})",
                ))

    return items


def _detect_visual_anomalies(
    img: np.ndarray, frame_idx: int, img_w: int, img_h: int
) -> list[DamageItem]:
    """
    Detect visual anomalies using color/texture analysis.

    Looks for:
    - Color discontinuities (paint damage, rust spots)
    - Texture anomalies (dents cause lighting irregularities)
    - Edge discontinuities (cracks, scratches)
    """
    items: list[DamageItem] = []
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # --- Edge-based scratch/crack detection ---
    edges = cv2.Canny(gray, 50, 150)
    # Dilate to connect nearby edges
    kernel = np.ones((3, 3), np.uint8)
    edges_dilated = cv2.dilate(edges, kernel, iterations=2)

    # Find contours of edge regions
    contours, _ = cv2.findContours(edges_dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for contour in contours:
        area = cv2.contourArea(contour)
        total_area = img_w * img_h
        area_ratio = area / total_area

        # Filter: only significant edge clusters (0.1% - 5% of image)
        if 0.001 < area_ratio < 0.05:
            x, y, w, h = cv2.boundingRect(contour)
            aspect = max(w, h) / max(min(w, h), 1)

            # Long thin contours → likely scratches
            if aspect > 4:
                conf = min(area_ratio * 20, 0.8)  # Scale confidence by area
                items.append(DamageItem(
                    id=str(uuid.uuid4())[:8],
                    damage_type="scratch",
                    severity=_classify_severity(conf, area_ratio),
                    confidence=conf,
                    bbox=BoundingBox(x1=float(x), y1=float(y), x2=float(x + w), y2=float(y + h)),
                    frame_index=frame_idx,
                    description="Linear edge pattern detected (potential scratch)",
                ))

    # --- Color anomaly detection (rust/paint damage) ---
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # Rust detection: orange-brown hue range
    rust_lower = np.array([5, 80, 80])
    rust_upper = np.array([25, 255, 200])
    rust_mask = cv2.inRange(hsv, rust_lower, rust_upper)

    # Clean up noise
    rust_mask = cv2.morphologyEx(rust_mask, cv2.MORPH_OPEN, kernel, iterations=2)
    rust_contours, _ = cv2.findContours(rust_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for contour in rust_contours:
        area = cv2.contourArea(contour)
        area_ratio = area / (img_w * img_h)

        if area_ratio > 0.0005:  # At least 0.05% of image
            x, y, w, h = cv2.boundingRect(contour)
            conf = min(area_ratio * 30 + 0.3, 0.85)
            items.append(DamageItem(
                id=str(uuid.uuid4())[:8],
                damage_type="rust",
                severity=_classify_severity(conf, area_ratio),
                confidence=conf,
                bbox=BoundingBox(x1=float(x), y1=float(y), x2=float(x + w), y2=float(y + h)),
                frame_index=frame_idx,
                description="Orange-brown color anomaly detected (potential rust)",
            ))

    return items


def _classify_severity(confidence: float, area_ratio: float) -> SeverityLevel:
    """Classify damage severity based on confidence and area."""
    # Combine confidence and area into a severity score
    score = confidence * 0.6 + min(area_ratio * 100, 1.0) * 0.4

    if score < SEVERITY_THRESHOLDS["minor"]:
        return SeverityLevel.minor
    elif score < SEVERITY_THRESHOLDS["moderate"]:
        return SeverityLevel.moderate
    else:
        return SeverityLevel.severe


def _draw_detections(img: np.ndarray, items: list[DamageItem]) -> np.ndarray:
    """Draw detection boxes and labels on image."""
    annotated = img.copy()

    severity_colors = {
        SeverityLevel.minor: (0, 200, 0),       # Green
        SeverityLevel.moderate: (0, 165, 255),   # Orange
        SeverityLevel.severe: (0, 0, 255),       # Red
    }

    for item in items:
        bbox = item.bbox
        color = severity_colors.get(item.severity, (255, 255, 255))

        # Draw box
        pt1 = (int(bbox.x1), int(bbox.y1))
        pt2 = (int(bbox.x2), int(bbox.y2))
        cv2.rectangle(annotated, pt1, pt2, color, 2)

        # Draw label
        label = f"{item.damage_type} ({item.confidence:.0%})"
        label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(
            annotated,
            (pt1[0], pt1[1] - label_size[1] - 8),
            (pt1[0] + label_size[0] + 4, pt1[1]),
            color,
            -1,
        )
        cv2.putText(
            annotated, label,
            (pt1[0] + 2, pt1[1] - 4),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1,
        )

    return annotated


def _deduplicate_items(items: list[DamageItem], iou_threshold: float = 0.5) -> list[DamageItem]:
    """Remove duplicate detections across frames using IoU."""
    if len(items) <= 1:
        return items

    unique: list[DamageItem] = []

    for item in items:
        is_dup = False
        for existing in unique:
            if item.damage_type == existing.damage_type:
                iou = _compute_iou(item.bbox, existing.bbox)
                if iou > iou_threshold:
                    # Keep the higher-confidence one
                    if item.confidence > existing.confidence:
                        unique.remove(existing)
                        unique.append(item)
                    is_dup = True
                    break
        if not is_dup:
            unique.append(item)

    return unique


def _compute_iou(a: BoundingBox, b: BoundingBox) -> float:
    """Compute Intersection over Union between two bounding boxes."""
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
