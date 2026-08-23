"""
Sentinel-2 Satellite Imagery Fetcher with cloud cover degradation window expansion.
Supports both Live GEE ImageCollection fetching and Mock Simulator fallback.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Tuple

from geospatial.config import (
    CLOUDY_PIXEL_PERCENTAGE,
    CLOUD_WINDOW_EXPANSION_DAYS,
    MAX_CLOUD_EXPANSION_DAYS,
    BASELINE_LOOKBACK_DAYS,
    CURRENT_WINDOW_DAYS,
)
from geospatial.core.gee_auth import is_mock_mode, get_data_source_tag
from geospatial.exceptions import NoImageryAvailableError
from geospatial.logger import get_logger

logger = get_logger("imagery_fetcher")


def calculate_date_windows(start_date_str: str, end_date_str: str) -> Tuple[datetime, datetime, datetime, datetime]:
    """
    Calculates explicit baseline and current time windows.
    - Baseline: [start_date - BASELINE_LOOKBACK_DAYS, start_date]
    - Current: [end_date - CURRENT_WINDOW_DAYS, end_date]
    """
    fmt = "%Y-%m-%d"
    start_dt = datetime.strptime(start_date_str, fmt)
    end_dt = datetime.strptime(end_date_str, fmt)

    baseline_start = start_dt - timedelta(days=BASELINE_LOOKBACK_DAYS)
    baseline_end = start_dt

    current_start = end_dt - timedelta(days=CURRENT_WINDOW_DAYS)
    current_end = end_dt

    return baseline_start, baseline_end, current_start, current_end


def fetch_sentinel2_imagery(aoi_geojson: Dict[str, Any], start_date_str: str, end_date_str: str) -> Dict[str, Any]:
    """
    Fetches baseline and current Sentinel-2 spectral composites for given AOI and dates.
    Expands search window by CLOUD_WINDOW_EXPANSION_DAYS up to MAX_CLOUD_EXPANSION_DAYS
    if cloud cover exceeds thresholds.

    Raises:
        NoImageryAvailableError: If zero images meet threshold after maximum window expansion.
    """
    mock_mode = is_mock_mode()
    data_source = get_data_source_tag()

    baseline_start, baseline_end, current_start, current_end = calculate_date_windows(start_date_str, end_date_str)

    district = aoi_geojson.get("features", [{}])[0].get("properties", {}).get("district", "Mayurbhanj")
    logger.info(
        f"Fetching Sentinel-2 ({data_source}) for {district}: "
        f"Baseline=[{baseline_start.strftime('%Y-%m-%d')} to {baseline_end.strftime('%Y-%m-%d')}], "
        f"Current=[{current_start.strftime('%Y-%m-%d')} to {current_end.strftime('%Y-%m-%d')}]"
    )

    if not mock_mode:
        try:
            import ee
            aoi_geometry = ee.Geometry(aoi_geojson["features"][0]["geometry"])
            
            def get_cloud_free_composite(date_start: datetime, date_end: datetime) -> Tuple[Any, int]:
                curr_start = date_start
                curr_end = date_end
                expanded_days = 0
                collection = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                
                while expanded_days <= MAX_CLOUD_EXPANSION_DAYS:
                    filtered = (
                        collection
                        .filterBounds(aoi_geometry)
                        .filterDate(curr_start.strftime("%Y-%m-%d"), curr_end.strftime("%Y-%m-%d"))
                        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", CLOUDY_PIXEL_PERCENTAGE))
                    )
                    count = filtered.size().getInfo()
                    if count > 0:
                        return filtered.median(), expanded_days
                    
                    expanded_days += CLOUD_WINDOW_EXPANSION_DAYS
                    curr_start -= timedelta(days=CLOUD_WINDOW_EXPANSION_DAYS)
                    logger.warning(
                        f"Cloud cover threshold missed ({CLOUDY_PIXEL_PERCENTAGE}%). "
                        f"Expanding window by {CLOUD_WINDOW_EXPANSION_DAYS}d (total expansion: {expanded_days}d)"
                    )

                raise NoImageryAvailableError(
                    f"No cloud-free imagery available for range [{date_start.strftime('%Y-%m-%d')} to {date_end.strftime('%Y-%m-%d')}] "
                    f"even after {MAX_CLOUD_EXPANSION_DAYS}-day expansion with cloud threshold {CLOUDY_PIXEL_PERCENTAGE}%."
                )

            baseline_img, baseline_exp = get_cloud_free_composite(baseline_start, baseline_end)
            current_img, current_exp = get_cloud_free_composite(current_start, current_end)

            return {
                "status": "success",
                "data_source": "live_gee",
                "baseline_expansion_days": baseline_exp,
                "current_expansion_days": current_exp,
                "gee_baseline_img": baseline_img,
                "gee_current_img": current_img,
            }
        except NoImageryAvailableError as e:
            logger.error(str(e))
            raise
        except Exception as err:
            logger.warning(f"GEE imagery fetch error ({err}). Falling back to mock imagery simulator.")

    # Mock Data Generator
    return {
        "status": "success",
        "data_source": "mock",
        "baseline_expansion_days": 0,
        "current_expansion_days": 0,
        "baseline_period": f"{baseline_start.strftime('%Y-%m-%d')} to {baseline_end.strftime('%Y-%m-%d')}",
        "current_period": f"{current_start.strftime('%Y-%m-%d')} to {current_end.strftime('%Y-%m-%d')}",
        "aoi": district,
    }
