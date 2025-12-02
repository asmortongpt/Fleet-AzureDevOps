# Fleet Security Configuration Package
from .safe_torch_config import safe_load_model, configure_torch_safe_defaults

__all__ = ["safe_load_model", "configure_torch_safe_defaults"]
