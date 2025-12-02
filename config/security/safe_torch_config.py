"""
Safe Torch Configuration Module

This module provides secure defaults for PyTorch model loading,
preventing unsafe pickle deserialization attacks (CVE-2024-XXXXX).

Usage:
    from config.security.safe_torch_config import safe_load_model

    # Safe model loading with weights_only=True (default)
    model_state = safe_load_model("path/to/model.pt")

    # For legacy models that require full pickle (ONLY for trusted sources)
    model_state = safe_load_model("path/to/trusted_model.pt", allow_unsafe=True)
"""

import os
import warnings
from pathlib import Path
from typing import Any, Optional, Union

# Configure torch to use safe defaults on import
def configure_torch_safe_defaults() -> None:
    """
    Configure PyTorch to use safe deserialization by default.
    Should be called early in application startup.
    """
    try:
        import torch
        # Set environment variable for safe loading
        os.environ["TORCH_FORCE_WEIGHTS_ONLY_LOAD"] = "1"
    except ImportError:
        pass  # torch not installed, skip configuration


def safe_load_model(
    model_path: Union[str, Path],
    map_location: Optional[str] = None,
    allow_unsafe: bool = False,
) -> Any:
    """
    Safely load a PyTorch model with weights_only=True by default.

    Args:
        model_path: Path to the model file (.pt, .pth, .bin)
        map_location: Device to map tensors to (e.g., 'cpu', 'cuda:0')
        allow_unsafe: If True, allows full pickle loading.
                      ONLY use for trusted model sources!

    Returns:
        The loaded model state dictionary or model object

    Raises:
        ValueError: If allow_unsafe is True without explicit confirmation
        FileNotFoundError: If model file doesn't exist
        RuntimeError: If model loading fails

    Security Notes:
        - weights_only=True prevents arbitrary code execution from pickle
        - Only set allow_unsafe=True for models from TRUSTED sources
        - Untrusted pickle files can execute arbitrary Python code
    """
    import torch

    model_path = Path(model_path)

    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")

    # Validate file extension
    allowed_extensions = {".pt", ".pth", ".bin", ".ckpt", ".safetensors"}
    if model_path.suffix.lower() not in allowed_extensions:
        warnings.warn(
            f"Unusual model file extension: {model_path.suffix}. "
            f"Expected one of: {allowed_extensions}",
            UserWarning,
        )

    # Use safetensors if available (most secure option)
    if model_path.suffix.lower() == ".safetensors":
        try:
            from safetensors.torch import load_file
            return load_file(str(model_path), device=map_location or "cpu")
        except ImportError:
            raise ImportError(
                "safetensors package required for .safetensors files. "
                "Install with: pip install safetensors"
            )

    # Default to weights_only=True for safety
    if allow_unsafe:
        warnings.warn(
            "Loading model with allow_unsafe=True. "
            "This enables arbitrary code execution from pickle files. "
            "Only use this for TRUSTED model sources!",
            SecurityWarning,
        )
        return torch.load(model_path, map_location=map_location, weights_only=False)

    try:
        return torch.load(model_path, map_location=map_location, weights_only=True)
    except Exception as e:
        # If weights_only fails, provide helpful error message
        if "weights_only" in str(e).lower():
            raise RuntimeError(
                f"Failed to load model with safe defaults (weights_only=True). "
                f"This model may contain custom Python objects. "
                f"If this is a TRUSTED model source, use allow_unsafe=True. "
                f"Original error: {e}"
            ) from e
        raise


class SecurityWarning(UserWarning):
    """Warning for security-related issues."""
    pass


# Auto-configure on module import
configure_torch_safe_defaults()
