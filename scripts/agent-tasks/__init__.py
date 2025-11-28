"""
Fleet Management AI Agent Tasks
Tasks for UI refresh using OpenAI and Google Gemini
"""

from .endpoint_monitor import create_endpoint_monitor
from .scrolling_optimizer import optimize_scrolling
from .darkmode_fixer import fix_darkmode
from .reactive_drilldown import implement_drilldown
from .responsive_designer import make_responsive

__all__ = [
    'create_endpoint_monitor',
    'optimize_scrolling',
    'fix_darkmode',
    'implement_drilldown',
    'make_responsive',
]
