import os
import math
from datetime import datetime, timezone
from typing import List, Dict, Any
from hotzone.logger import logger
from hotzone.config import (
    ISRO_DATA_PATH,
    GFW_DATA_PATH,
    DATABASE_URL,
    GRID_RESOLUTION_DEG,
    W_HISTORICAL_FLAGS,
    W_GFW_ALERTS,
    W_ISRO_COVER_LOSS,
    W_ROAD_PROXIMITY,
    W_SETTLEMENT_PROXIMITY,
)
from hotzone.ingestors.isro_ingestor import load_isro_data
from hotzone.ingestors.gfw_ingestor import load_gfw_data
from hotzone.ingestors.flag_ingestor import load_flag_history

def compute_risk_scores(district_id: str = "mayurbhanj") -> List[Dict[str, Any]]:
    """
    Combines ISRO forest cover loss, GFW alerts, live flag history, road proximity,
    and settlement expansion scores into a rule-based risk score per grid cell.
    """
    logger.info(f"Starting hotzone risk scoring for district: {district_id}")

    # 1. Call ingestors
    isro_records = load_isro_data(ISRO_DATA_PATH)
    gfw_records = load_gfw_data(GFW_DATA_PATH)
    flag_records = load_flag_history(DATABASE_URL)

    # Load OSM road and settlement points if available
    import math, os
    import pandas as pd
    road_pts = []
    settle_pts = []
    osm_dir = os.getenv("OSM_DATA_PATH", "hotzone/data/osm")

    if os.path.exists(os.path.join(osm_dir, "roads_mayurbhanj.csv")):
        try:
            rdf = pd.read_csv(os.path.join(osm_dir, "roads_mayurbhanj.csv"), comment="#")
            road_pts = list(zip(rdf["lat"].astype(float), rdf["lng"].astype(float)))
        except Exception as e:
            logger.warning(f"Failed loading roads OSM CSV: {e}")

    if os.path.exists(os.path.join(osm_dir, "settlements_mayurbhanj.csv")):
        try:
            sdf = pd.read_csv(os.path.join(osm_dir, "settlements_mayurbhanj.csv"), comment="#")
            settle_pts = list(zip(sdf["lat"].astype(float), sdf["lng"].astype(float)))
        except Exception as e:
            logger.warning(f"Failed loading settlements OSM CSV: {e}")

    # 2. Build unified grid map
    decimals = 2 if GRID_RESOLUTION_DEG >= 0.01 else 3
    cell_data: Dict[tuple, Dict[str, float]] = {}

    def get_cell(lat: float, lng: float) -> tuple:
        return (round(float(lat), decimals), round(float(lng), decimals))

    # Extract district-wide ISRO cover loss value safely
    isro_val_map = {str(r.get("district", "")).strip().lower(): float(r.get("value", 0.0)) for r in isro_records if "district" in r}
    district_isro_val = isro_val_map.get(district_id.strip().lower(), 0.5)

    for r in isro_records:
        key = get_cell(r["lat"], r["lng"])
        if key not in cell_data:
            cell_data[key] = {"flags": 0.0, "gfw": 0.0, "isro": 0.0, "road": 0.2, "settlement": 0.2}

    for r in gfw_records:
        key = get_cell(r["lat"], r["lng"])
        if key not in cell_data:
            cell_data[key] = {"flags": 0.0, "gfw": 0.0, "isro": 0.0, "road": 0.2, "settlement": 0.2}
        cell_data[key]["gfw"] = float(r["value"])

    for r in flag_records:
        key = get_cell(r["lat"], r["lng"])
        if key not in cell_data:
            cell_data[key] = {"flags": 0.0, "gfw": 0.0, "isro": 0.0, "road": 0.2, "settlement": 0.2}
        cell_data[key]["flags"] = float(r["value"])

    # Apply district-wide ISRO value to all active cells
    for key in cell_data:
        cell_data[key]["isro"] = district_isro_val

    if not cell_data:
        logger.info("No data points ingested — returning empty risk scores list")
        return []

    # 3. Compute risk score per cell
    results = []
    now_iso = datetime.now(timezone.utc).isoformat()

    for (lat, lng), vals in cell_data.items():
        v_flags = vals["flags"]
        v_gfw = vals["gfw"]
        v_isro = vals["isro"]
        v_road = vals["road"]
        v_settle = vals["settlement"]

        if road_pts:
            min_r_dist = min(math.sqrt((lat - rlat)**2 + (lng - rlng)**2) for rlat, rlng in road_pts)
            v_road = round(max(0.0, min(1.0, 1.0 - (min_r_dist / 0.15))), 4)

        if settle_pts:
            min_s_dist = min(math.sqrt((lat - slat)**2 + (lng - slng)**2) for slat, slng in settle_pts)
            v_settle = round(max(0.0, min(1.0, 1.0 - (min_s_dist / 0.15))), 4)

        weighted_factors = {
            "historical_flags": round(W_HISTORICAL_FLAGS * v_flags, 4),
            "gfw_alerts": round(W_GFW_ALERTS * v_gfw, 4),
            "isro_cover_loss": round(W_ISRO_COVER_LOSS * v_isro, 4),
            "road_proximity": round(W_ROAD_PROXIMITY * v_road, 4),
            "settlement_proximity": round(W_SETTLEMENT_PROXIMITY * v_settle, 4),
        }

        # Dominant factor is name of contributor with highest weighted value
        dominant_factor = max(weighted_factors, key=weighted_factors.get)

        raw_score = sum(weighted_factors.values())
        risk_score = round(max(0.0, min(1.0, raw_score)), 4)

        sources_used = []
        if v_flags > 0.0:
            sources_used.append("flag_history")
        if v_gfw > 0.0:
            sources_used.append("gfw")
        if v_isro > 0.0:
            sources_used.append("isro")

        results.append({
            "grid_lat": lat,
            "grid_lng": lng,
            "risk_score": risk_score,
            "contributing_factors": weighted_factors,
            "dominant_factor": dominant_factor,
            "data_sources_used": sources_used,
            "computed_at": now_iso,
        })

    # 4. Sort descending by risk score
    results.sort(key=lambda x: x["risk_score"], reverse=True)

    top_score = results[0]["risk_score"] if results else 0.0
    top_lat = results[0]["grid_lat"] if results else 0.0
    top_lng = results[0]["grid_lng"] if results else 0.0

    logger.info(
        f"Risk scoring complete — {len(results)} grid cells scored, "
        f"top risk: {top_score:.2f} at ({top_lat}, {top_lng})"
    )

    return results
