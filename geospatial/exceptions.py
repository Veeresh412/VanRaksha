"""
Structured Custom Exception Hierarchy for FRAWatch Geospatial Engine.
"""


class GEEAuthError(Exception):
    """Raised when Google Earth Engine authentication or initialization fails."""
    pass


class NoImageryAvailableError(Exception):
    """Raised when no suitable satellite imagery is available within the expanded search window."""
    pass


class ProximityFilterError(Exception):
    """Raised when spatial proximity filtering encounters an unrecoverable geometry error."""
    pass


class PipelineError(Exception):
    """Raised when an unhandled error occurs during full pipeline execution."""
    pass
