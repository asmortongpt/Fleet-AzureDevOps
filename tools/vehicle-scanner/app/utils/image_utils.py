"""Shared image processing helpers."""

from __future__ import annotations

import base64
import io
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from app.config import STUDIO_BG_TOP, STUDIO_BG_BOTTOM


def load_image(path: str | Path) -> np.ndarray:
    """Load image as BGR numpy array."""
    img = cv2.imread(str(path))
    if img is None:
        raise ValueError(f"Failed to load image: {path}")
    return img


def save_image(img: np.ndarray, path: str | Path) -> str:
    """Save BGR numpy array to disk. Returns the path string."""
    path = str(path)
    cv2.imwrite(path, img)
    return path


def resize_max(img: np.ndarray, max_dim: int = 1920) -> np.ndarray:
    """Resize image so largest dimension is at most max_dim, preserving aspect ratio."""
    h, w = img.shape[:2]
    if max(h, w) <= max_dim:
        return img
    scale = max_dim / max(h, w)
    new_w, new_h = int(w * scale), int(h * scale)
    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)


def to_rgb(img: np.ndarray) -> np.ndarray:
    """Convert BGR to RGB."""
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def to_bgr(img: np.ndarray) -> np.ndarray:
    """Convert RGB to BGR."""
    return cv2.cvtColor(img, cv2.COLOR_RGB2BGR)


def to_pil(img: np.ndarray) -> Image.Image:
    """Convert BGR numpy array to PIL Image (RGB)."""
    return Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))


def from_pil(pil_img: Image.Image) -> np.ndarray:
    """Convert PIL Image (RGB/RGBA) to BGR numpy array."""
    if pil_img.mode == "RGBA":
        # Convert RGBA to BGR with alpha compositing on white
        bg = Image.new("RGB", pil_img.size, (255, 255, 255))
        bg.paste(pil_img, mask=pil_img.split()[3])
        return cv2.cvtColor(np.array(bg), cv2.COLOR_RGB2BGR)
    return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)


def create_studio_background(width: int, height: int) -> np.ndarray:
    """Create a vertical gradient background matching the showroom aesthetic."""
    bg = np.zeros((height, width, 3), dtype=np.uint8)
    for y in range(height):
        ratio = y / max(height - 1, 1)
        bg[y, :] = [
            int(STUDIO_BG_TOP[i] * (1 - ratio) + STUDIO_BG_BOTTOM[i] * ratio)
            for i in range(3)
        ]
    return bg


def composite_on_studio_bg(
    rgba_img: Image.Image, target_width: int = 1920, target_height: int = 1080
) -> np.ndarray:
    """Composite an RGBA image onto the studio gradient background."""
    bg = create_studio_background(target_width, target_height)
    bg_pil = Image.fromarray(bg)

    # Resize image to fit within background (80% of width, maintain aspect)
    img_w, img_h = rgba_img.size
    max_w = int(target_width * 0.80)
    max_h = int(target_height * 0.85)
    scale = min(max_w / img_w, max_h / img_h)
    new_w, new_h = int(img_w * scale), int(img_h * scale)
    resized = rgba_img.resize((new_w, new_h), Image.LANCZOS)

    # Center the image
    x_offset = (target_width - new_w) // 2
    y_offset = (target_height - new_h) // 2

    if resized.mode == "RGBA":
        bg_pil.paste(resized, (x_offset, y_offset), resized.split()[3])
    else:
        bg_pil.paste(resized, (x_offset, y_offset))

    return cv2.cvtColor(np.array(bg_pil), cv2.COLOR_RGB2BGR)


def image_to_base64(img: np.ndarray, fmt: str = ".jpg") -> str:
    """Encode image to base64 string."""
    _, buffer = cv2.imencode(fmt, img)
    return base64.b64encode(buffer).decode("utf-8")


def create_thumbnail(img: np.ndarray, size: int = 256) -> np.ndarray:
    """Create a square thumbnail from an image."""
    h, w = img.shape[:2]
    # Center crop to square
    dim = min(h, w)
    y_start = (h - dim) // 2
    x_start = (w - dim) // 2
    cropped = img[y_start : y_start + dim, x_start : x_start + dim]
    return cv2.resize(cropped, (size, size), interpolation=cv2.INTER_AREA)
