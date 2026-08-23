"""
Rule-based dual condition change detector and spatial pixel clustering engine.
Requires both NDVI vegetation drop AND NDBI built-up increase at the same location.
Enforces MIN_CLUSTER_PIXELS to suppress single-pixel sensor noise.
"""

import numpy as np
from typing import List, Dict, Any
from scipy.ndimage import label, center_of_mass

from geospatial.config import (
    NDVI_LOSS_THRESHOLD,
    NDBI_RISE_THRESHOLD,
    MIN_CLUSTER_PIXELS,
)
from geospatial.core.indices import compute_deltas
from geospatial.logger import get_logger

logger = get_logger("change_detector")


def detect_candidate_clusters(
    ndvi_baseline: np.ndarray,
    ndvi_current: np.ndarray,
    ndbi_baseline: np.ndarray,
    ndbi_current: np.ndarray,
    transform_info: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Detects candidate change clusters where BOTH dual conditions are satisfied:
      1. delta_ndvi < NDVI_LOSS_THRESHOLD (-0.15)
      2. delta_ndbi > NDBI_RISE_THRESHOLD (+0.10)
    Filters out clusters smaller than MIN_CLUSTER_PIXELS (4 pixels) to suppress single-pixel noise.
    """
    ndvi_delta, ndbi_delta = compute_deltas(ndvi_baseline, ndvi_current, ndbi_baseline, ndbi_current)

    # Dual condition boolean mask
    dual_mask = (ndvi_delta < NDVI_LOSS_THRESHOLD) & (ndbi_delta > NDBI_RISE_THRESHOLD)

    # 8-connectivity structure for pixel cluster labeling
    structure = np.ones((3, 3), dtype=int)
    labeled_array, num_features = label(dual_mask, structure=structure)

    candidates = []
    min_lat = transform_info["min_lat"]
    max_lat = transform_info["max_lat"]
    min_lng = transform_info["min_lng"]
    max_lng = transform_info["max_lng"]
    rows = transform_info["rows"]
    cols = transform_info["cols"]

    lat_resolution = (max_lat - min_lat) / rows
    lng_resolution = (max_lng - min_lng) / cols

    for feature_id in range(1, num_features + 1):
        pixel_coords = np.where(labeled_array == feature_id)
        pixel_count = len(pixel_coords[0])

        # Enforce MIN_CLUSTER_PIXELS noise threshold
        if pixel_count < MIN_CLUSTER_PIXELS:
            logger.debug(f"Cluster {feature_id} ignored: {pixel_count} pixels < MIN_CLUSTER_PIXELS ({MIN_CLUSTER_PIXELS})")
            continue

        # Calculate centroid in pixel space
        cy_pixel, cx_pixel = center_of_mass(dual_mask, labeled_array, feature_id)

        # Convert pixel centroid to lat/lng geographic coordinates
        lat = max_lat - (cy_pixel * lat_resolution)
        lng = min_lng + (cx_pixel * lng_resolution)

        # Average deltas across cluster pixels
        avg_ndvi_delta = float(np.mean(ndvi_delta[pixel_coords]))
        avg_ndbi_delta = float(np.mean(ndbi_delta[pixel_coords]))

        candidates.append({
            "lat": round(float(lat), 6),
            "lng": round(float(lng), 6),
            "pixel_count": int(pixel_count),
            "ndvi_delta": round(avg_ndvi_delta, 4),
            "ndbi_delta": round(avg_ndbi_delta, 4),
        })

    logger.info(f"Dual condition thresholding detected {len(candidates)} candidate change clusters (raw pixel features: {num_features}).")
    return candidates
