"""
CRS-Aware Proximity Filter module for FRA parcel boundary checks.
Reprojects geometries from WGS84 (EPSG:4326) to UTM Zone 45N (EPSG:32645)
to guarantee metric correctness for the 500-meter buffer evaluation in Mayurbhanj.
"""

from typing import List, Dict, Any
from shapely.geometry import Point, Polygon, shape
from shapely.geometry.base import BaseGeometry
from shapely.ops import transform
from pyproj import Transformer

from geospatial.config import (
    UTM_EPSG_MAYURBHANJ,
    TARGET_EPSG_WGS84,
    BUFFER_RADIUS_METERS,
)
from geospatial.exceptions import ProximityFilterError
from geospatial.logger import get_logger

logger = get_logger("proximity_filter")

# Coordinate Transformers
# EPSG:4326 (lon, lat) <-> EPSG:32645 (x, y in meters for UTM Zone 45N)
to_utm = Transformer.from_crs(f"EPSG:{TARGET_EPSG_WGS84}", f"EPSG:{UTM_EPSG_MAYURBHANJ}", always_xy=True)
to_wgs84 = Transformer.from_crs(f"EPSG:{UTM_EPSG_MAYURBHANJ}", f"EPSG:{TARGET_EPSG_WGS84}", always_xy=True)


def project_geometry(geom: BaseGeometry, transformer: Transformer) -> BaseGeometry:
    """Reprojects a Shapely geometry using the given pyproj Transformer."""
    return transform(transformer.transform, geom)


def filter_flags_by_fra_proximity(
    candidate_flags: List[Dict[str, Any]],
    fra_parcels_geojson: Dict[str, Any],
    buffer_meters: float = BUFFER_RADIUS_METERS
) -> List[Dict[str, Any]]:
    """
    Filters candidate flag points based on proximity to FRA parcel polygons.
    Guarantees metric accuracy by projecting geometries to UTM Zone 45N (EPSG:32645).
    """
    if not candidate_flags or not fra_parcels_geojson.get("features"):
        logger.info("Proximity filter skipped: empty candidate flags or FRA parcels featurecollection.")
        return []

    try:
        # 1. Parse and reproject FRA parcel geometries to UTM Zone 45N (EPSG:32645)
        utm_parcels = []
        for feature in fra_parcels_geojson["features"]:
            geom_wgs84 = shape(feature["geometry"])
            geom_utm = project_geometry(geom_wgs84, to_utm)
            parcel_id = feature.get("properties", {}).get("fra_parcel_id", "fra_unknown")
            utm_parcels.append({
                "fra_parcel_id": parcel_id,
                "geometry_utm": geom_utm,
                "properties": feature.get("properties", {})
            })

        retained_flags = []

        # 2. Evaluate each flag in UTM metric space
        for flag in candidate_flags:
            lat = flag["lat"]
            lng = flag["lng"]

            # Create Point geometry (lon, lat) and convert to UTM (x, y)
            point_wgs84 = Point(lng, lat)
            point_utm = project_geometry(point_wgs84, to_utm)

            min_dist_meters = float("inf")
            matched_parcel_id = None

            for parcel in utm_parcels:
                dist = point_utm.distance(parcel["geometry_utm"])
                if dist < min_dist_meters:
                    min_dist_meters = dist
                    matched_parcel_id = parcel["fra_parcel_id"]

            # Keep flag if within metric buffer_meters
            if min_dist_meters <= buffer_meters:
                flag_copy = dict(flag)
                flag_copy["fra_parcel_id"] = matched_parcel_id
                flag_copy["distance_to_fra_meters"] = round(min_dist_meters, 2)
                retained_flags.append(flag_copy)

        logger.info(f"{len(retained_flags)} candidate flags passed {buffer_meters}m proximity filter against FRA parcels.")
        return retained_flags

    except Exception as e:
        err_msg = f"Proximity filter geometry projection error: {e}"
        logger.error(err_msg)
        raise ProximityFilterError(err_msg) from e
