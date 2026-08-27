import os
import glob
from datetime import datetime, timedelta
from typing import List, Dict, Any
import pandas as pd
from hotzone.logger import logger
from hotzone.config import GRID_RESOLUTION_DEG, LOOKBACK_DAYS

def load_gfw_data(data_path: str) -> List[Dict[str, Any]]:
    """
    Parses Global Forest Watch (GFW) deforestation alert CSV files within lookback window.
    """
    if not os.path.exists(data_path):
        logger.warning(f"GFW data path '{data_path}' does not exist — check skipped")
        return []

    csv_files = glob.glob(os.path.join(data_path, "*.csv"))
    if not csv_files:
        logger.warning(f"No CSV files found in GFW data path '{data_path}' — returning empty list")
        return []

    cutoff_date = datetime.now() - timedelta(days=LOOKBACK_DAYS)
    aggregated_cells: Dict[tuple, float] = {}

    for csv_file in csv_files:
        try:
            df = pd.read_csv(csv_file, comment="#")
            required_cols = {"latitude", "longitude"}
            if not required_cols.issubset(set(df.columns)):
                logger.warning(f"GFW CSV '{csv_file}' missing latitude/longitude columns")
                continue

            # Parse alert_date if available
            if "alert_date" in df.columns:
                df["parsed_date"] = pd.to_datetime(df["alert_date"], errors="coerce")
                df = df[df["parsed_date"].isna() | (df["parsed_date"] >= cutoff_date)]

            # Round lat/lng to GRID_RESOLUTION_DEG
            decimals = 2 if GRID_RESOLUTION_DEG >= 0.01 else 3
            df["grid_lat"] = df["latitude"].round(decimals)
            df["grid_lng"] = df["longitude"].round(decimals)

            for (lat, lng), group in df.groupby(["grid_lat", "grid_lng"]):
                cell_key = (float(lat), float(lng))
                alert_count = float(len(group))
                aggregated_cells[cell_key] = aggregated_cells.get(cell_key, 0.0) + alert_count

        except Exception as e:
            logger.warning(f"Error parsing GFW CSV '{csv_file}': {e}")

    if not aggregated_cells:
        return []

    # Normalize alert counts to 0.0 - 1.0 relative to max_count
    counts = list(aggregated_cells.values())
    max_count = max(counts) if counts else 1.0

    current_year = datetime.now().year
    records = []
    for (lat, lng), raw_count in aggregated_cells.items():
        norm_val = raw_count / max_count if max_count > 0 else 0.0
        records.append({
            "lat": lat,
            "lng": lng,
            "year": current_year,
            "raw_value": raw_count,
            "value": round(float(norm_val), 4),
            "source": "gfw",
            "unit": "alert_count",
        })

    return records
