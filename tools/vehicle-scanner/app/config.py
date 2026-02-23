"""Configuration for the vehicle scanner pipeline."""

import os
from pathlib import Path

import torch

# --- Paths ---
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
RESULTS_DIR = DATA_DIR / "results"
MODELS_DIR = DATA_DIR / "models"

# Ensure directories exist
for d in (UPLOAD_DIR, RESULTS_DIR, MODELS_DIR):
    d.mkdir(parents=True, exist_ok=True)

# --- Device ---
DEVICE = os.getenv("DEVICE", "cuda" if torch.cuda.is_available() else "cpu")

# --- Frame extraction ---
MAX_FRAMES = 30
SSIM_DEDUP_THRESHOLD = 0.85  # Frames more similar than this are dropped

# --- YOLO damage detection ---
YOLO_MODEL = os.getenv("YOLO_MODEL", "yolov8n.pt")
YOLO_CONF_THRESHOLD = 0.25
YOLO_IOU_THRESHOLD = 0.45

# Vehicle damage classes (Phase 1: mapped from COCO pre-trained detections)
# Phase 2: fine-tuned model with dedicated damage classes
DAMAGE_CLASS_MAP = {
    "dent": {"severity_weight": 0.6, "color": (0, 165, 255)},       # orange
    "scratch": {"severity_weight": 0.3, "color": (0, 255, 255)},    # yellow
    "crack": {"severity_weight": 0.8, "color": (0, 0, 255)},        # red
    "rust": {"severity_weight": 0.7, "color": (0, 100, 200)},       # dark orange
    "broken_light": {"severity_weight": 0.9, "color": (255, 0, 0)}, # blue (BGR)
    "broken_glass": {"severity_weight": 0.9, "color": (255, 0, 0)},
    "paint_chip": {"severity_weight": 0.2, "color": (200, 200, 0)}, # cyan
    "missing_part": {"severity_weight": 1.0, "color": (128, 0, 128)},
}

# --- Fine-tuned damage model (Phase 2) ---
YOLO_FINE_TUNED = os.getenv("YOLO_FINE_TUNED", "false").lower() == "true"
FINE_TUNED_MODEL_PATH = MODELS_DIR / "fleet-damage-v1.pt"
FINE_TUNED_DAMAGE_CLASSES = [
    "dent", "scratch", "rust", "crack",
    "broken_light", "broken_glass", "paint_chip", "missing_part",
]

# --- SAM2 segmentation ---
SAM_MODEL = os.getenv("SAM_MODEL", "sam2_hiera_tiny")
SAM_ENABLED = os.getenv("SAM_ENABLED", "false").lower() == "true"

# --- Real-ESRGAN upscaling ---
ESRGAN_SCALE = 4
ESRGAN_ENABLED = os.getenv("ESRGAN_ENABLED", "false").lower() == "true"

# --- Comparison ---
COMPARISON_SSIM_THRESHOLD = 0.90  # Below this = significant change
ORB_FEATURES = 1000  # ORB feature count for alignment

# --- Damage scoring ---
SEVERITY_THRESHOLDS = {
    "minor": 0.4,     # confidence < 0.4 or small area
    "moderate": 0.7,  # confidence 0.4-0.7
    "severe": 1.0,    # confidence > 0.7 or large area
}

# --- Studio background gradient (matches showroom aesthetic) ---
STUDIO_BG_TOP = (26, 26, 26)      # #1a1a1a
STUDIO_BG_BOTTOM = (10, 10, 10)   # #0a0a0a

# --- Upload limits ---
MAX_UPLOAD_SIZE_MB = 500
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm", ".jpg", ".jpeg", ".png", ".heic", ".heif"}
