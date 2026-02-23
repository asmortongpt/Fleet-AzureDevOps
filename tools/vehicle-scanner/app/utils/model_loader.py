"""Lazy model loading with GPU/CPU fallback."""

from __future__ import annotations

import logging
from typing import Any, Optional

from app.config import (
    DEVICE,
    YOLO_MODEL,
    SAM_ENABLED,
    ESRGAN_ENABLED,
    YOLO_FINE_TUNED,
    FINE_TUNED_MODEL_PATH,
)

logger = logging.getLogger(__name__)

# Singleton model cache
_models: dict[str, Any] = {}


def get_device() -> str:
    """Return the current compute device."""
    return DEVICE


def load_yolo() -> Any:
    """Load YOLOv8 model (lazy, cached).

    If YOLO_FINE_TUNED is True and the fine-tuned weights exist at
    FINE_TUNED_MODEL_PATH, loads those instead of the default pre-trained model.
    """
    if "yolo" not in _models:
        from ultralytics import YOLO

        if YOLO_FINE_TUNED and FINE_TUNED_MODEL_PATH.exists():
            model_path = str(FINE_TUNED_MODEL_PATH)
            logger.info(
                "Loading fine-tuned damage model: %s on %s",
                FINE_TUNED_MODEL_PATH.name,
                DEVICE,
            )
        else:
            model_path = YOLO_MODEL
            if YOLO_FINE_TUNED:
                logger.warning(
                    "YOLO_FINE_TUNED is True but model not found at %s — "
                    "falling back to default model: %s",
                    FINE_TUNED_MODEL_PATH,
                    YOLO_MODEL,
                )
            else:
                logger.info("Loading YOLOv8 model: %s on %s", YOLO_MODEL, DEVICE)

        model = YOLO(model_path)
        if DEVICE == "cuda":
            model.to("cuda")
        _models["yolo"] = model
        logger.info("YOLOv8 loaded successfully")
    return _models["yolo"]


def load_sam2() -> Optional[Any]:
    """Load SAM2 model if enabled (lazy, cached)."""
    if not SAM_ENABLED:
        return None
    if "sam2" not in _models:
        logger.info("Loading SAM2 model on %s", DEVICE)
        try:
            from segment_anything_2 import sam_model_registry, SamPredictor

            sam = sam_model_registry["sam2_hiera_tiny"](checkpoint=None)
            if DEVICE == "cuda":
                sam.to("cuda")
            predictor = SamPredictor(sam)
            _models["sam2"] = predictor
            logger.info("SAM2 loaded successfully")
        except ImportError:
            logger.warning("SAM2 not installed — segmentation will use YOLO boxes only")
            _models["sam2"] = None
        except Exception as e:
            logger.warning("SAM2 failed to load: %s — falling back to YOLO boxes", e)
            _models["sam2"] = None
    return _models["sam2"]


def load_esrgan() -> Optional[Any]:
    """Load Real-ESRGAN model if enabled (lazy, cached)."""
    if not ESRGAN_ENABLED:
        return None
    if "esrgan" not in _models:
        logger.info("Loading Real-ESRGAN on %s", DEVICE)
        try:
            from realesrgan import RealESRGANer
            from basicsr.archs.rrdbnet_arch import RRDBNet

            rrdb_model = RRDBNet(
                num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4
            )
            upsampler = RealESRGANer(
                scale=4,
                model_path="https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
                model=rrdb_model,
                tile=0,
                tile_pad=10,
                pre_pad=0,
                half=DEVICE == "cuda",
                device=DEVICE,
            )
            _models["esrgan"] = upsampler
            logger.info("Real-ESRGAN loaded successfully")
        except ImportError:
            logger.warning("Real-ESRGAN not installed — upscaling disabled")
            _models["esrgan"] = None
        except Exception as e:
            logger.warning("Real-ESRGAN failed to load: %s — upscaling disabled", e)
            _models["esrgan"] = None
    return _models["esrgan"]


def get_loaded_models() -> dict[str, bool]:
    """Return a dict of model names → whether they're loaded."""
    return {
        "yolo": "yolo" in _models,
        "sam2": "sam2" in _models and _models["sam2"] is not None,
        "esrgan": "esrgan" in _models and _models["esrgan"] is not None,
    }


def preload_models() -> None:
    """Pre-load all enabled models at startup."""
    logger.info("Pre-loading models...")
    load_yolo()
    if SAM_ENABLED:
        load_sam2()
    if ESRGAN_ENABLED:
        load_esrgan()
    logger.info("Model pre-loading complete: %s", get_loaded_models())
