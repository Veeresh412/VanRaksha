"""
Spectral index calculations (NDVI and NDBI) for Sentinel-2 imagery.
Bands used:
- B4: Red (665 nm)
- B8: NIR (842 nm)
- B11: SWIR (1610 nm)
"""

import numpy as np
from typing import Tuple, Union
from geospatial.logger import get_logger

logger = get_logger("indices")


def compute_ndvi(nir: Union[float, np.ndarray], red: Union[float, np.ndarray]) -> Union[float, np.ndarray]:
    """
    Computes Normalized Difference Vegetation Index (NDVI).
    NDVI = (NIR - RED) / (NIR + RED)
    """
    denominator = nir + red
    if isinstance(denominator, np.ndarray):
        with np.errstate(divide='ignore', invalid='ignore'):
            ndvi = np.where(denominator != 0, (nir - red) / denominator, 0.0)
            return np.clip(ndvi, -1.0, 1.0)
    else:
        if denominator == 0:
            return 0.0
        return float(np.clip((nir - red) / denominator, -1.0, 1.0))


def compute_ndbi(swir: Union[float, np.ndarray], nir: Union[float, np.ndarray]) -> Union[float, np.ndarray]:
    """
    Computes Normalized Difference Built-up Index (NDBI).
    NDBI = (SWIR - NIR) / (SWIR + NIR)
    """
    denominator = swir + nir
    if isinstance(denominator, np.ndarray):
        with np.errstate(divide='ignore', invalid='ignore'):
            ndbi = np.where(denominator != 0, (swir - nir) / denominator, 0.0)
            return np.clip(ndbi, -1.0, 1.0)
    else:
        if denominator == 0:
            return 0.0
        return float(np.clip((swir - nir) / denominator, -1.0, 1.0))


def compute_deltas(
    baseline_ndvi: Union[float, np.ndarray],
    current_ndvi: Union[float, np.ndarray],
    baseline_ndbi: Union[float, np.ndarray],
    current_ndbi: Union[float, np.ndarray]
) -> Tuple[Union[float, np.ndarray], Union[float, np.ndarray]]:
    """
    Computes spectral index change deltas:
    ndvi_delta = current_ndvi - baseline_ndvi
    ndbi_delta = current_ndbi - baseline_ndbi
    """
    ndvi_delta = current_ndvi - baseline_ndvi
    ndbi_delta = current_ndbi - baseline_ndbi
    logger.debug(f"Computed spectral deltas: min_ndvi_delta={np.min(ndvi_delta):.3f}, max_ndbi_delta={np.max(ndbi_delta):.3f}")
    return ndvi_delta, ndbi_delta
