"""
TripoSR 3D Generation API
FREE Open-Source Photo-to-3D Service for Fleet Damage Reporting

Replaces Meshy AI with zero cost, same quality
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import torch
from PIL import Image
import trimesh
import numpy as np
import uuid
import os
import io
import logging
from pathlib import Path
import asyncio
from datetime import datetime

# TripoSR imports
try:
    from triposr.models import TripoSR as TripoSRModel
    from triposr.utils import remove_background, resize_foreground
except ImportError:
    print("Installing TripoSR...")
    os.system("pip install triposr pillow trimesh rembg")
    from triposr.models import TripoSR as TripoSRModel
    from triposr.utils import remove_background, resize_foreground

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TripoSR 3D Generation API",
    description="FREE Open-Source Photo-to-3D for Fleet Damage Reporting",
    version="1.0.0"
)

# CORS for Fleet frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage paths
OUTPUT_DIR = Path("/tmp/triposr-outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

# Model cache (load once, reuse)
MODEL_CACHE = None
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


class GenerationRequest(BaseModel):
    task_id: str
    image_url: Optional[str] = None
    remove_bg: bool = True
    foreground_ratio: float = 0.85


class GenerationStatus(BaseModel):
    task_id: str
    status: str  # "pending", "processing", "succeeded", "failed"
    model_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    error: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None


# In-memory task storage (use Redis in production)
TASKS = {}


def load_model():
    """Load TripoSR model (cached)"""
    global MODEL_CACHE
    if MODEL_CACHE is None:
        logger.info("Loading TripoSR model...")
        MODEL_CACHE = TripoSRModel.from_pretrained("stabilityai/TripoSR")
        MODEL_CACHE.to(DEVICE)
        logger.info(f"Model loaded on {DEVICE}")
    return MODEL_CACHE


def process_image(image: Image.Image, remove_bg: bool = True, foreground_ratio: float = 0.85):
    """Preprocess image for 3D generation"""
    if remove_bg:
        logger.info("Removing background...")
        image = remove_background(image)

    logger.info("Resizing foreground...")
    image = resize_foreground(image, foreground_ratio)

    return image


def generate_3d_mesh(image: Image.Image, task_id: str):
    """Generate 3D mesh from image using TripoSR"""
    try:
        # Load model
        model = load_model()

        # Generate 3D
        logger.info(f"Generating 3D mesh for task {task_id}...")
        with torch.no_grad():
            outputs = model([image], device=DEVICE)

        # Extract mesh
        mesh = outputs[0]

        # Export as GLB
        output_path = OUTPUT_DIR / f"{task_id}.glb"
        mesh.export(str(output_path))

        # Generate thumbnail (render from front view)
        thumbnail_path = OUTPUT_DIR / f"{task_id}_thumb.png"
        scene = trimesh.Scene(mesh)
        png = scene.save_image(resolution=[512, 512])
        with open(thumbnail_path, 'wb') as f:
            f.write(png)

        logger.info(f"Generated 3D model: {output_path}")

        return {
            "model_path": str(output_path),
            "thumbnail_path": str(thumbnail_path)
        }

    except Exception as e:
        logger.error(f"Error generating 3D: {str(e)}")
        raise


async def process_generation_task(task_id: str, image: Image.Image, remove_bg: bool, foreground_ratio: float):
    """Background task to process 3D generation"""
    try:
        # Update status
        TASKS[task_id]["status"] = "processing"

        # Preprocess image
        processed_image = process_image(image, remove_bg, foreground_ratio)

        # Generate 3D mesh (run in thread pool to avoid blocking)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, generate_3d_mesh, processed_image, task_id)

        # Update task status
        TASKS[task_id].update({
            "status": "succeeded",
            "model_url": f"/download/{task_id}.glb",
            "thumbnail_url": f"/download/{task_id}_thumb.png",
            "completed_at": datetime.utcnow().isoformat()
        })

        logger.info(f"Task {task_id} completed successfully")

    except Exception as e:
        logger.error(f"Task {task_id} failed: {str(e)}")
        TASKS[task_id].update({
            "status": "failed",
            "error": str(e),
            "completed_at": datetime.utcnow().isoformat()
        })


@app.get("/")
async def root():
    """Health check"""
    return {
        "service": "TripoSR 3D Generation API",
        "status": "running",
        "device": DEVICE,
        "model_loaded": MODEL_CACHE is not None
    }


@app.post("/api/generate", response_model=GenerationStatus)
async def create_generation(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    remove_bg: bool = True,
    foreground_ratio: float = 0.85
):
    """
    Create a new 3D generation task from uploaded image

    - **file**: Image file (damage photo)
    - **remove_bg**: Remove background from image
    - **foreground_ratio**: Resize foreground to this ratio
    """
    # Generate task ID
    task_id = str(uuid.uuid4())

    # Read image
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    # Create task record
    task = {
        "task_id": task_id,
        "status": "pending",
        "model_url": None,
        "thumbnail_url": None,
        "error": None,
        "created_at": datetime.utcnow().isoformat(),
        "completed_at": None
    }
    TASKS[task_id] = task

    # Start background processing
    background_tasks.add_task(
        process_generation_task,
        task_id,
        image,
        remove_bg,
        foreground_ratio
    )

    logger.info(f"Created task {task_id}")
    return GenerationStatus(**task)


@app.get("/api/tasks/{task_id}", response_model=GenerationStatus)
async def get_task_status(task_id: str):
    """Get status of a 3D generation task"""
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task not found")

    return GenerationStatus(**TASKS[task_id])


@app.get("/download/{filename}")
async def download_file(filename: str):
    """Download generated 3D model or thumbnail"""
    file_path = OUTPUT_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    if filename.endswith(".glb"):
        media_type = "model/gltf-binary"
    elif filename.endswith(".png"):
        media_type = "image/png"
    else:
        media_type = "application/octet-stream"

    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=filename
    )


@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task and its generated files"""
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task not found")

    # Delete files
    model_file = OUTPUT_DIR / f"{task_id}.glb"
    thumb_file = OUTPUT_DIR / f"{task_id}_thumb.png"

    if model_file.exists():
        model_file.unlink()
    if thumb_file.exists():
        thumb_file.unlink()

    # Remove from tasks
    del TASKS[task_id]

    return {"message": "Task deleted successfully"}


@app.get("/api/tasks", response_model=List[GenerationStatus])
async def list_tasks(status: Optional[str] = None):
    """List all tasks, optionally filtered by status"""
    tasks = list(TASKS.values())

    if status:
        tasks = [t for t in tasks if t["status"] == status]

    return [GenerationStatus(**t) for t in tasks]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
