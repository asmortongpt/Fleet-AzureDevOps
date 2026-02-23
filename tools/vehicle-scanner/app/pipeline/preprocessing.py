"""Stage 2-3: Background removal and image enhancement."""

from __future__ import annotations

import logging
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from app.utils.image_utils import (
    composite_on_studio_bg,
    create_thumbnail,
    save_image,
    to_pil,
)
from app.utils.model_loader import load_esrgan

logger = logging.getLogger(__name__)


def remove_background(frame_path: Path, output_dir: Path) -> Path:
    """Remove background from a vehicle image using rembg (U2-Net)."""
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        from rembg import remove

        input_img = Image.open(frame_path)
        result = remove(input_img)  # Returns RGBA PIL Image

        output_path = output_dir / f"{frame_path.stem}_nobg.png"
        result.save(str(output_path))
        logger.debug("Background removed: %s", output_path.name)
        return output_path
    except ImportError:
        logger.warning("rembg not installed — skipping background removal")
        # Copy original as fallback
        output_path = output_dir / f"{frame_path.stem}_nobg.png"
        Image.open(frame_path).save(str(output_path))
        return output_path
    except Exception as e:
        logger.error("Background removal failed for %s: %s", frame_path.name, e)
        output_path = output_dir / f"{frame_path.stem}_nobg.png"
        Image.open(frame_path).save(str(output_path))
        return output_path


def create_showroom_image(nobg_path: Path, output_dir: Path) -> Path:
    """Composite a background-removed image onto the studio gradient."""
    output_dir.mkdir(parents=True, exist_ok=True)

    rgba_img = Image.open(nobg_path).convert("RGBA")
    showroom = composite_on_studio_bg(rgba_img, 1920, 1080)

    output_path = output_dir / f"{nobg_path.stem}_showroom.jpg"
    save_image(showroom, output_path)
    return output_path


def upscale_image(image_path: Path, output_dir: Path) -> Path:
    """Upscale image using Real-ESRGAN if available."""
    output_dir.mkdir(parents=True, exist_ok=True)

    esrgan = load_esrgan()
    if esrgan is None:
        # No upscaling available — just copy
        output_path = output_dir / f"{image_path.stem}_upscaled.jpg"
        img = cv2.imread(str(image_path))
        save_image(img, output_path)
        return output_path

    try:
        img = cv2.imread(str(image_path), cv2.IMREAD_UNCHANGED)
        output, _ = esrgan.enhance(img, outscale=4)
        output_path = output_dir / f"{image_path.stem}_upscaled.jpg"
        save_image(output, output_path)
        logger.debug("Upscaled: %s", output_path.name)
        return output_path
    except Exception as e:
        logger.error("Upscaling failed for %s: %s", image_path.name, e)
        output_path = output_dir / f"{image_path.stem}_upscaled.jpg"
        img = cv2.imread(str(image_path))
        save_image(img, output_path)
        return output_path


def preprocess_frames(
    frame_paths: list[Path],
    output_dir: Path,
    on_progress: callable = None,
) -> dict:
    """
    Run preprocessing on all frames:
    1. Background removal
    2. Showroom composite
    3. Upscaling (if enabled)
    4. Thumbnails

    Returns dict with paths to processed outputs.
    """
    nobg_dir = output_dir / "nobg"
    showroom_dir = output_dir / "showroom"
    upscaled_dir = output_dir / "upscaled"
    thumb_dir = output_dir / "thumbnails"

    results = {
        "nobg": [],
        "showroom": [],
        "upscaled": [],
        "thumbnails": [],
    }

    total = len(frame_paths)
    for i, frame_path in enumerate(frame_paths):
        # Background removal
        nobg_path = remove_background(frame_path, nobg_dir)
        results["nobg"].append(nobg_path)

        # Showroom composite
        showroom_path = create_showroom_image(nobg_path, showroom_dir)
        results["showroom"].append(showroom_path)

        # Upscale (Phase 2)
        upscaled_path = upscale_image(frame_path, upscaled_dir)
        results["upscaled"].append(upscaled_path)

        # Thumbnail
        thumb_dir.mkdir(parents=True, exist_ok=True)
        img = cv2.imread(str(frame_path))
        if img is not None:
            thumb = create_thumbnail(img, 256)
            thumb_path = thumb_dir / f"{frame_path.stem}_thumb.jpg"
            save_image(thumb, thumb_path)
            results["thumbnails"].append(thumb_path)

        if on_progress:
            on_progress((i + 1) / total * 100)

    logger.info("Preprocessed %d frames: %d showroom, %d thumbnails",
                total, len(results["showroom"]), len(results["thumbnails"]))
    return results
