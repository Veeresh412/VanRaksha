"""
Google Earth Engine (GEE) Authentication and Fallback Handler.
Explicitly tracks and labels live GEE vs mock execution mode.
"""

from typing import Tuple
from geospatial.config import MOCK_MODE, GEE_PROJECT_ID, GEE_CREDENTIALS_PATH
from geospatial.exceptions import GEEAuthError
from geospatial.logger import get_logger

logger = get_logger("gee_auth")

_GEE_INITIALIZED = False
_IS_MOCK_MODE = True
_DATA_SOURCE_TAG = "mock"


def initialize_gee() -> Tuple[bool, str]:
    """
    Attempts to initialize the Google Earth Engine Python API.
    If MOCK_MODE is set or GEE initialization fails, raises GEEAuthError internally,
    logs a WARNING, and degrades gracefully to mock mode.

    Returns:
        Tuple[bool, str]: (is_mock_mode, data_source_tag)
    """
    global _GEE_INITIALIZED, _IS_MOCK_MODE, _DATA_SOURCE_TAG

    if _GEE_INITIALIZED:
        return _IS_MOCK_MODE, _DATA_SOURCE_TAG

    # If MOCK_MODE is forced via environment
    if MOCK_MODE:
        _GEE_INITIALIZED = True
        _IS_MOCK_MODE = True
        _DATA_SOURCE_TAG = "mock"
        logger.info("Forced MOCK_MODE=true via environment configuration. Operating in offline mock mode.")
        return _IS_MOCK_MODE, _DATA_SOURCE_TAG

    try:
        import ee
        if GEE_PROJECT_ID:
            ee.Initialize(project=GEE_PROJECT_ID)
        else:
            ee.Initialize()
        
        _GEE_INITIALIZED = True
        _IS_MOCK_MODE = False
        _DATA_SOURCE_TAG = "live_gee"
        logger.info("Google Earth Engine successfully initialized (data_source: live_gee).")
    except Exception as e:
        # Wrap in GEEAuthError and handle fallback
        auth_err = GEEAuthError(f"GEE authentication failed: {e}")
        logger.warning(
            f"GEE Auth Error ({auth_err}). Falling back gracefully to offline mock simulator (data_source: mock)."
        )
        _GEE_INITIALIZED = True
        _IS_MOCK_MODE = True
        _DATA_SOURCE_TAG = "mock"

    return _IS_MOCK_MODE, _DATA_SOURCE_TAG


def is_mock_mode() -> bool:
    """Returns True if running in mock/simulation mode."""
    if not _GEE_INITIALIZED:
        initialize_gee()
    return _IS_MOCK_MODE


def get_data_source_tag() -> str:
    """Returns 'live_gee' if connected to Earth Engine, or 'mock' if running fallback simulator."""
    if not _GEE_INITIALIZED:
        initialize_gee()
    return _DATA_SOURCE_TAG
