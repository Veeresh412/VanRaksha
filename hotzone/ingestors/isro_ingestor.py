import os
import glob
from pathlib import Path
from typing import List, Dict, Any
import pandas as pd
from hotzone.logger import logger

# Odisha District Centroids (Public Knowledge Lookup)
ODISHA_DISTRICT_CENTROIDS = {
    "mayurbhanj": (21.9328, 86.7364),
    "keonjhar": (21.6289, 85.5817),
    "sundergarh": (22.1190, 84.0326),
    "kandhamal": (20.3150, 84.1400),
    "koraput": (18.8135, 82.7118),
    "kalahandi": (19.9137, 83.1649),
    "rayagada": (19.1712, 83.4163),
    "nawarangpur": (19.2308, 82.5489),
    "malkangiri": (18.3424, 81.8841),
    "gajapati": (18.8350, 84.1333),
}

def load_isro_data(data_path: str) -> List[Dict[str, Any]]:
    """
    Parses ISRO FSI district forest cover change CSV files and returns normalized loss records.
    """
    if not os.path.exists(data_path):
        logger.warning(f"ISRO data path '{data_path}' does not exist — check skipped")
        return []

    csv_files = glob.glob(os.path.join(data_path, "*.csv"))
    if not csv_files:
        logger.warning(f"No CSV files found in ISRO data path '{data_path}' — returning empty list")
        return []

    records = []
    for csv_file in csv_files:
        try:
            df = pd.read_csv(csv_file, comment="#")
            required_cols = {"district", "state", "year", "total_forest_km2"}
            if not required_cols.issubset(set(df.columns)):
                logger.warning(f"CSV '{csv_file}' missing required columns {required_cols - set(df.columns)}")
                continue

            df["district_clean"] = df["district"].astype(str).str.strip().str.lower()
            df = df.sort_values(["district_clean", "year"])

            for district, group in df.groupby("district_clean"):
                if len(group) >= 2:
                    sorted_group = group.sort_values("year")
                    prev_row = sorted_group.iloc[-2]
                    curr_row = sorted_group.iloc[-1]

                    loss = float(prev_row["total_forest_km2"]) - float(curr_row["total_forest_km2"])
                    raw_loss = max(0.0, loss)

                    centroid = ODISHA_DISTRICT_CENTROIDS.get(district, (20.5000, 84.5000))
                    records.append({
                        "district": district,
                        "lat": centroid[0],
                        "lng": centroid[1],
                        "year": int(curr_row["year"]),
                        "raw_value": raw_loss,
                        "source": "isro",
                        "unit": "km2_forest_lost",
                    })

        except Exception as e:
            logger.warning(f"Error parsing ISRO CSV '{csv_file}': {e}")

    if not records:
        return []

    # Min-Max Normalization (0.0 to 1.0)
    raw_vals = [r["raw_value"] for r in records]
    max_val = max(raw_vals) if raw_vals else 1.0
    min_val = min(raw_vals) if raw_vals else 0.0
    val_range = (max_val - min_val) if max_val > min_val else 1.0

    for r in records:
        r["value"] = round(float((r["raw_value"] - min_val) / val_range), 4)

    return records
