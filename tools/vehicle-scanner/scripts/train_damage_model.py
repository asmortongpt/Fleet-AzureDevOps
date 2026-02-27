"""
Train a fine-tuned YOLOv8 damage detection model for fleet vehicles.

Uses the ultralytics YOLO API to fine-tune a pre-trained YOLOv8 model on a
vehicle damage dataset with 8 damage classes:
  dent, scratch, rust, crack, broken_light, broken_glass, paint_chip, missing_part

Usage:
    python scripts/train_damage_model.py --data-dir data/damage-dataset --epochs 100

The trained best weights are exported to data/models/{output-name}.pt.
"""

from __future__ import annotations

import argparse
import logging
import shutil
import sys
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# The 8 damage classes our fleet model uses
DAMAGE_CLASSES = [
    "dent",
    "scratch",
    "rust",
    "crack",
    "broken_light",
    "broken_glass",
    "paint_chip",
    "missing_part",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fine-tune YOLOv8 on a vehicle damage dataset.",
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        required=True,
        help="Path to dataset directory containing dataset.yaml",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=100,
        help="Number of training epochs (default: 100)",
    )
    parser.add_argument(
        "--batch",
        type=int,
        default=16,
        help="Batch size (default: 16)",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=640,
        help="Input image size (default: 640)",
    )
    parser.add_argument(
        "--model-base",
        type=str,
        default="yolov8n.pt",
        help="Base YOLO model to fine-tune from (default: yolov8n.pt)",
    )
    parser.add_argument(
        "--output-name",
        type=str,
        default="fleet-damage-v1",
        help="Name for the output model file (default: fleet-damage-v1)",
    )
    return parser.parse_args()


def train(args: argparse.Namespace) -> None:
    """Run the fine-tuning training loop."""
    from ultralytics import YOLO

    dataset_yaml = args.data_dir / "dataset.yaml"
    if not dataset_yaml.exists():
        logger.error("dataset.yaml not found at %s", dataset_yaml)
        sys.exit(1)

    # Resolve output directory
    project_root = Path(__file__).resolve().parent.parent
    models_dir = project_root / "data" / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    output_path = models_dir / f"{args.output_name}.pt"

    logger.info("Loading base model: %s", args.model_base)
    model = YOLO(args.model_base)

    logger.info(
        "Starting training: epochs=%d, batch=%d, imgsz=%d, dataset=%s",
        args.epochs,
        args.batch,
        args.imgsz,
        dataset_yaml,
    )

    results = model.train(
        data=str(dataset_yaml),
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        project=str(models_dir / "runs"),
        name=args.output_name,
        exist_ok=True,
        verbose=True,
    )

    # Validate results
    metrics = results.results_dict if hasattr(results, "results_dict") else {}
    map50 = metrics.get("metrics/mAP50(B)", 0.0)
    map50_95 = metrics.get("metrics/mAP50-95(B)", 0.0)

    logger.info("Training complete. mAP@50=%.4f, mAP@50-95=%.4f", map50, map50_95)

    if map50 < 0.1:
        logger.warning(
            "mAP@50 is very low (%.4f). The model may not have converged. "
            "Consider increasing epochs or checking the dataset quality.",
            map50,
        )

    # Export best weights to the models directory
    best_weights = (
        models_dir / "runs" / args.output_name / "weights" / "best.pt"
    )
    if best_weights.exists():
        shutil.copy2(best_weights, output_path)
        logger.info("Best weights exported to %s", output_path)
    else:
        # Fallback: use last weights
        last_weights = (
            models_dir / "runs" / args.output_name / "weights" / "last.pt"
        )
        if last_weights.exists():
            shutil.copy2(last_weights, output_path)
            logger.warning("best.pt not found, exported last.pt to %s", output_path)
        else:
            logger.error("No trained weights found — training may have failed")
            sys.exit(1)

    logger.info(
        "Model saved: %s (%.1f MB)",
        output_path,
        output_path.stat().st_size / (1024 * 1024),
    )
    logger.info("Damage classes (%d): %s", len(DAMAGE_CLASSES), ", ".join(DAMAGE_CLASSES))


if __name__ == "__main__":
    args = parse_args()
    train(args)
