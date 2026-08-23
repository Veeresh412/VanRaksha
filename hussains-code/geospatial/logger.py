"""
Standardized logging module for FRAWatch / Vanrakshak Geospatial Engine.
Logger name: frawatch.geospatial
Format: [TIMESTAMP] [LEVEL] [MODULE] — message
"""

import os
import logging
from typing import Optional

_LOGGER_INITIALIZED = False


def setup_logger(module_name: Optional[str] = None) -> logging.Logger:
    """
    Sets up and returns a standardized logger for the geospatial module.
    
    Format: [2026-08-22 03:14:00] [INFO] [module_name] — message
    Log level is controlled via LOG_LEVEL environment variable (default: INFO).
    """
    global _LOGGER_INITIALIZED

    log_level_str = os.getenv("LOG_LEVEL", "INFO").upper()
    log_level = getattr(logging, log_level_str, logging.INFO)

    root_logger = logging.getLogger("frawatch.geospatial")
    root_logger.setLevel(log_level)

    if not _LOGGER_INITIALIZED:
        handler = logging.StreamHandler()
        handler.setLevel(log_level)

        class CustomFormatter(logging.Formatter):
            def format(self, record):
                # Custom format: [TIMESTAMP] [LEVEL] [MODULE] — message
                timestamp = self.formatTime(record, "%Y-%m-%d %H:%M:%S")
                module = getattr(record, "custom_module", record.module)
                return f"[{timestamp}] [{record.levelname}] [{module}] — {record.getMessage()}"

        formatter = CustomFormatter()
        handler.setFormatter(formatter)

        if not root_logger.handlers:
            root_logger.addHandler(handler)
        root_logger.propagate = False
        _LOGGER_INITIALIZED = True

    if module_name:
        return LoggerAdapter(root_logger, {"custom_module": module_name})
    return root_logger


class LoggerAdapter(logging.LoggerAdapter):
    """Adapter to insert module name into log record."""

    def process(self, msg, kwargs):
        kwargs["extra"] = kwargs.get("extra", {})
        kwargs["extra"]["custom_module"] = self.extra.get("custom_module", "geospatial")
        return msg, kwargs


def get_logger(module_name: str) -> logging.LoggerAdapter:
    """Convenience helper to fetch logger for a specific module."""
    return setup_logger(module_name)
