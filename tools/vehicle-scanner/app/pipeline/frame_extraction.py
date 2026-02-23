"""Stage 1: Extract keyframes from video or pass through photos."""

from __future__ import annotations

import logging
from pathlib import Path

import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim

from app.config import MAX_FRAMES, SSIM_DEDUP_THRESHOLD
from app.utils.image_utils import resize_max, save_image

logger = logging.getLogger(__name__)

# Photo file extensions
PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".bmp", ".tiff", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm", ".mkv"}


def extract_frames(
    input_paths: list[Path],
    output_dir: Path,
    on_progress: callable = None,
) -> list[Path]:
    """
    Extract keyframes from input files.

    For videos: extract unique frames using SSIM deduplication.
    For photos: copy/resize directly.

    Returns list of frame file paths.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    frames: list[Path] = []

    for file_path in input_paths:
        ext = file_path.suffix.lower()

        if ext in VIDEO_EXTENSIONS:
            video_frames = _extract_video_frames(file_path, output_dir, len(frames))
            frames.extend(video_frames)
        elif ext in PHOTO_EXTENSIONS:
            frame_path = _process_photo(file_path, output_dir, len(frames))
            if frame_path:
                frames.append(frame_path)

        if on_progress:
            on_progress(min(len(frames) / max(MAX_FRAMES, 1) * 100, 100))

    # Cap total frames
    if len(frames) > MAX_FRAMES:
        indices = np.linspace(0, len(frames) - 1, MAX_FRAMES, dtype=int)
        frames = [frames[i] for i in indices]

    logger.info("Extracted %d keyframes from %d input files", len(frames), len(input_paths))
    return frames


def _extract_video_frames(
    video_path: Path, output_dir: Path, start_index: int
) -> list[Path]:
    """Extract unique keyframes from a video using SSIM deduplication."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        logger.error("Failed to open video: %s", video_path)
        return []

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    # Sample at ~2 fps for efficiency
    sample_interval = max(int(fps / 2), 1)

    frames: list[Path] = []
    prev_gray = None
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % sample_interval != 0:
            frame_idx += 1
            continue

        # Resize for faster SSIM comparison
        small = resize_max(frame, 640)
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

        # SSIM deduplication
        is_unique = True
        if prev_gray is not None:
            try:
                # Ensure same dimensions for SSIM
                if gray.shape == prev_gray.shape:
                    score = ssim(prev_gray, gray)
                    if score > SSIM_DEDUP_THRESHOLD:
                        is_unique = False
                else:
                    is_unique = True
            except Exception:
                is_unique = True

        if is_unique:
            # Save full-resolution frame
            resized = resize_max(frame, 1920)
            idx = start_index + len(frames)
            frame_path = output_dir / f"frame_{idx:04d}.jpg"
            save_image(resized, frame_path)
            frames.append(frame_path)
            prev_gray = gray

            if len(frames) >= MAX_FRAMES * 2:  # Collect extra, trim later
                break

        frame_idx += 1

    cap.release()
    logger.info("Extracted %d unique frames from video (%d total frames, %.1f fps)",
                len(frames), total_frames, fps)
    return frames


def _process_photo(photo_path: Path, output_dir: Path, index: int) -> Path | None:
    """Load, resize, and save a photo as a frame."""
    img = cv2.imread(str(photo_path))
    if img is None:
        logger.warning("Failed to load photo: %s", photo_path)
        return None

    resized = resize_max(img, 1920)
    frame_path = output_dir / f"frame_{index:04d}.jpg"
    save_image(resized, frame_path)
    return frame_path
