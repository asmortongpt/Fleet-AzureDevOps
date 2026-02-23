"""
Convert CarDD (Car Damage Detection) dataset to YOLO format.

Reads CarDD annotations (XML VOC-format or JSON) and maps categories to our
8-class fleet damage taxonomy. Outputs YOLO-format .txt annotation files with
normalized bounding boxes and generates a dataset.yaml for training.

Usage:
    python scripts/convert_cardd.py --input-dir /path/to/CarDD --output-dir data/damage-dataset

Damage class mapping (8 classes):
  0: dent, 1: scratch, 2: rust, 3: crack,
  4: broken_light, 5: broken_glass, 6: paint_chip, 7: missing_part
"""

from __future__ import annotations

import argparse
import json
import logging
import random
import shutil
import xml.etree.ElementTree as ET
from pathlib import Path

import yaml

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Our 8 damage classes
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

# Map CarDD category names (various naming conventions) to our classes
CARDD_TO_FLEET_MAP: dict[str, str] = {
    # Dents
    "dent": "dent",
    "dents": "dent",
    "deformation": "dent",
    # Scratches
    "scratch": "scratch",
    "scratches": "scratch",
    "scuff": "scratch",
    # Rust
    "rust": "rust",
    "corrosion": "rust",
    "oxidation": "rust",
    # Cracks
    "crack": "crack",
    "cracks": "crack",
    "fracture": "crack",
    # Lights
    "broken_light": "broken_light",
    "broken light": "broken_light",
    "headlight": "broken_light",
    "taillight": "broken_light",
    "lamp": "broken_light",
    "light": "broken_light",
    # Glass
    "broken_glass": "broken_glass",
    "broken glass": "broken_glass",
    "glass": "broken_glass",
    "windshield": "broken_glass",
    "window": "broken_glass",
    "shattered": "broken_glass",
    # Paint chips
    "paint_chip": "paint_chip",
    "paint chip": "paint_chip",
    "paint": "paint_chip",
    "chip": "paint_chip",
    "chipping": "paint_chip",
    "peeling": "paint_chip",
    # Missing parts
    "missing_part": "missing_part",
    "missing part": "missing_part",
    "missing": "missing_part",
    "detached": "missing_part",
    # Generic damage -> dent (default)
    "damage": "dent",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert CarDD dataset to YOLO format for fleet damage training.",
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        required=True,
        help="Path to CarDD dataset root directory",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        required=True,
        help="Path to output YOLO-format dataset directory",
    )
    parser.add_argument(
        "--val-split",
        type=float,
        default=0.2,
        help="Fraction of data for validation split (default: 0.2)",
    )
    return parser.parse_args()


def _map_category(raw_name: str) -> int | None:
    """Map a raw CarDD category name to a fleet damage class index."""
    normalized = raw_name.strip().lower().replace("-", "_")
    fleet_name = CARDD_TO_FLEET_MAP.get(normalized)
    if fleet_name is None:
        return None
    return DAMAGE_CLASSES.index(fleet_name)


def _parse_voc_xml(xml_path: Path) -> list[dict]:
    """Parse a Pascal VOC XML annotation file."""
    tree = ET.parse(xml_path)
    root = tree.getroot()

    size_el = root.find("size")
    if size_el is None:
        return []

    img_w = int(size_el.findtext("width", "0"))
    img_h = int(size_el.findtext("height", "0"))

    if img_w == 0 or img_h == 0:
        return []

    annotations = []
    for obj in root.findall("object"):
        name = obj.findtext("name", "")
        class_id = _map_category(name)
        if class_id is None:
            logger.debug("Skipping unmapped category: %s", name)
            continue

        bndbox = obj.find("bndbox")
        if bndbox is None:
            continue

        x1 = float(bndbox.findtext("xmin", "0"))
        y1 = float(bndbox.findtext("ymin", "0"))
        x2 = float(bndbox.findtext("xmax", "0"))
        y2 = float(bndbox.findtext("ymax", "0"))

        # Convert to YOLO format: class_id cx cy w h (normalized)
        cx = ((x1 + x2) / 2.0) / img_w
        cy = ((y1 + y2) / 2.0) / img_h
        w = (x2 - x1) / img_w
        h = (y2 - y1) / img_h

        annotations.append({
            "class_id": class_id,
            "cx": cx,
            "cy": cy,
            "w": w,
            "h": h,
        })

    return annotations


def _parse_json_annotations(json_path: Path) -> dict[str, list[dict]]:
    """
    Parse a JSON annotation file (COCO-like format).

    Returns a dict mapping image filename -> list of YOLO annotations.
    """
    with open(json_path) as f:
        data = json.load(f)

    # Build category mapping
    categories = {cat["id"]: cat["name"] for cat in data.get("categories", [])}

    # Build image ID -> filename + dimensions mapping
    images = {}
    for img in data.get("images", []):
        images[img["id"]] = {
            "filename": img["file_name"],
            "width": img["width"],
            "height": img["height"],
        }

    # Process annotations
    results: dict[str, list[dict]] = {}
    for ann in data.get("annotations", []):
        img_id = ann["image_id"]
        if img_id not in images:
            continue

        img_info = images[img_id]
        cat_name = categories.get(ann["category_id"], "")
        class_id = _map_category(cat_name)
        if class_id is None:
            continue

        # COCO bbox: [x, y, width, height] (absolute)
        bbox = ann["bbox"]
        img_w = img_info["width"]
        img_h = img_info["height"]

        cx = (bbox[0] + bbox[2] / 2.0) / img_w
        cy = (bbox[1] + bbox[3] / 2.0) / img_h
        w = bbox[2] / img_w
        h = bbox[3] / img_h

        filename = img_info["filename"]
        if filename not in results:
            results[filename] = []

        results[filename].append({
            "class_id": class_id,
            "cx": cx,
            "cy": cy,
            "w": w,
            "h": h,
        })

    return results


def _write_yolo_label(label_path: Path, annotations: list[dict]) -> None:
    """Write YOLO-format annotation file."""
    lines = []
    for ann in annotations:
        lines.append(
            f"{ann['class_id']} {ann['cx']:.6f} {ann['cy']:.6f} {ann['w']:.6f} {ann['h']:.6f}"
        )
    label_path.write_text("\n".join(lines) + "\n" if lines else "")


def convert(args: argparse.Namespace) -> None:
    """Run the full CarDD to YOLO conversion."""
    input_dir = args.input_dir.resolve()
    output_dir = args.output_dir.resolve()

    if not input_dir.exists():
        logger.error("Input directory does not exist: %s", input_dir)
        return

    # Create output structure
    train_images = output_dir / "images" / "train"
    val_images = output_dir / "images" / "val"
    train_labels = output_dir / "labels" / "train"
    val_labels = output_dir / "labels" / "val"

    for d in (train_images, val_images, train_labels, val_labels):
        d.mkdir(parents=True, exist_ok=True)

    # Collect all image-annotation pairs
    image_annotations: dict[Path, list[dict]] = {}

    # Strategy 1: Look for VOC XML annotations
    xml_files = list(input_dir.rglob("*.xml"))
    if xml_files:
        logger.info("Found %d XML annotation files (VOC format)", len(xml_files))
        for xml_path in xml_files:
            annotations = _parse_voc_xml(xml_path)
            if not annotations:
                continue

            # Find corresponding image
            stem = xml_path.stem
            img_path = None
            for ext in (".jpg", ".jpeg", ".png", ".bmp"):
                candidate = xml_path.parent / f"{stem}{ext}"
                if candidate.exists():
                    img_path = candidate
                    break
                # Also check sibling image directories
                for img_dir_name in ("JPEGImages", "images", "imgs"):
                    candidate = xml_path.parent.parent / img_dir_name / f"{stem}{ext}"
                    if candidate.exists():
                        img_path = candidate
                        break
                if img_path:
                    break

            if img_path:
                image_annotations[img_path] = annotations

    # Strategy 2: Look for COCO JSON annotations
    json_files = list(input_dir.rglob("*.json"))
    annotation_jsons = [f for f in json_files if "annotation" in f.stem.lower() or f.stem == "instances"]
    if not annotation_jsons:
        # Try any JSON that looks like annotations
        annotation_jsons = [f for f in json_files if f.stat().st_size > 1024]

    for json_path in annotation_jsons:
        try:
            parsed = _parse_json_annotations(json_path)
            logger.info("Parsed %d images from %s", len(parsed), json_path.name)

            for filename, annotations in parsed.items():
                # Find image file
                img_path = None
                for search_dir in [json_path.parent, input_dir]:
                    candidate = search_dir / filename
                    if candidate.exists():
                        img_path = candidate
                        break
                    # Search subdirectories
                    for p in search_dir.rglob(Path(filename).name):
                        img_path = p
                        break
                    if img_path:
                        break

                if img_path and img_path not in image_annotations:
                    image_annotations[img_path] = annotations

        except (json.JSONDecodeError, KeyError) as e:
            logger.debug("Skipping %s: %s", json_path.name, e)

    if not image_annotations:
        logger.error(
            "No valid image-annotation pairs found in %s. "
            "Expected VOC XML or COCO JSON annotations.",
            input_dir,
        )
        return

    logger.info("Total image-annotation pairs: %d", len(image_annotations))

    # Split into train/val
    all_items = list(image_annotations.items())
    random.shuffle(all_items)
    split_idx = int(len(all_items) * (1 - args.val_split))

    train_items = all_items[:split_idx]
    val_items = all_items[split_idx:]

    logger.info("Split: %d train, %d val", len(train_items), len(val_items))

    # Write files
    stats = {"train": 0, "val": 0, "annotations": 0}

    for split_name, items, img_dir, lbl_dir in [
        ("train", train_items, train_images, train_labels),
        ("val", val_items, val_images, val_labels),
    ]:
        for img_path, annotations in items:
            # Copy image
            dst_img = img_dir / img_path.name
            if dst_img.exists():
                # Handle name collisions
                dst_img = img_dir / f"{img_path.stem}_{hash(str(img_path)) % 10000}{img_path.suffix}"
            shutil.copy2(img_path, dst_img)

            # Write YOLO label
            label_path = lbl_dir / f"{dst_img.stem}.txt"
            _write_yolo_label(label_path, annotations)

            stats[split_name] += 1
            stats["annotations"] += len(annotations)

    # Generate dataset.yaml
    dataset_config = {
        "path": str(output_dir),
        "train": "images/train",
        "val": "images/val",
        "nc": len(DAMAGE_CLASSES),
        "names": DAMAGE_CLASSES,
    }

    yaml_path = output_dir / "dataset.yaml"
    with open(yaml_path, "w") as f:
        yaml.dump(dataset_config, f, default_flow_style=False, sort_keys=False)

    logger.info("Dataset conversion complete:")
    logger.info("  Output: %s", output_dir)
    logger.info("  Train images: %d", stats["train"])
    logger.info("  Val images: %d", stats["val"])
    logger.info("  Total annotations: %d", stats["annotations"])
    logger.info("  Classes: %s", ", ".join(DAMAGE_CLASSES))
    logger.info("  dataset.yaml: %s", yaml_path)


if __name__ == "__main__":
    args = parse_args()
    convert(args)
