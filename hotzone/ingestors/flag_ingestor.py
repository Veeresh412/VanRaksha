from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy import create_engine, text
from hotzone.logger import logger
from hotzone.config import DATABASE_URL, GRID_RESOLUTION_DEG, LOOKBACK_DAYS

def load_flag_history(db_url: str = DATABASE_URL) -> List[Dict[str, Any]]:
    """
    Connects to backend database and queries historical satellite pings & corroborated flags.
    Returns normalized weighted flag counts per grid cell.
    """
    try:
        engine = create_engine(db_url)
        decimals = 2 if GRID_RESOLUTION_DEG >= 0.01 else 3
        cutoff_date = datetime.now() - timedelta(days=LOOKBACK_DAYS)
        cell_weights: Dict[tuple, float] = {}

        with engine.connect() as conn:
            # 1. Query satellite_pings table if exists
            try:
                pings_query = text("""
                    SELECT lat, lng, confidence_score, created_at
                    FROM satellite_pings
                    WHERE created_at >= :cutoff
                """)
                pings = conn.execute(pings_query, {"cutoff": cutoff_date}).fetchall()
                for row in pings:
                    glat = round(float(row.lat), decimals)
                    glng = round(float(row.lng), decimals)
                    conf = float(row.confidence_score) if row.confidence_score else 0.5
                    cell_key = (glat, glng)
                    cell_weights[cell_key] = cell_weights.get(cell_key, 0.0) + conf
            except Exception as pe:
                logger.info(f"Satellite pings query info/notice: {pe}")

            # 2. Query flags table if exists
            try:
                flags_query = text("""
                    SELECT lat, lng, corroboration_state, created_at
                    FROM flags
                    WHERE created_at >= :cutoff
                    AND (corroboration_state != 'single_source' OR corroboration_state IS NULL)
                """)
                flags = conn.execute(flags_query, {"cutoff": cutoff_date}).fetchall()
                for row in flags:
                    glat = round(float(row.lat), decimals)
                    glng = round(float(row.lng), decimals)
                    state_mult = 2.0 if getattr(row, "corroboration_state", "") == "corroborated" else 1.0
                    cell_key = (glat, glng)
                    cell_weights[cell_key] = cell_weights.get(cell_key, 0.0) + state_mult
            except Exception as fe:
                logger.info(f"Flags table query info/notice: {fe}")

        # Fallback to CSV export files if DB returned empty
        if not cell_weights:
            import os, glob
            import pandas as pd
            export_dir = os.getenv("FLAGS_EXPORT_PATH", "hotzone/data/fra_flags_export")
            if os.path.exists(export_dir):
                csv_files = glob.glob(os.path.join(export_dir, "*.csv"))
                for cf in csv_files:
                    try:
                        df = pd.read_csv(cf, comment="#")
                        for _, row in df.iterrows():
                            glat = round(float(row["lat"]), decimals)
                            glng = round(float(row["lng"]), decimals)
                            conf = float(row.get("confidence_score", 0.8))
                            corr_count = float(row.get("corroboration_count", 1))
                            state_mult = 2.0 if str(row.get("corroboration_state", "")).startswith("corroborated") else 1.0
                            cell_key = (glat, glng)
                            cell_weights[cell_key] = cell_weights.get(cell_key, 0.0) + (conf * corr_count * state_mult)
                    except Exception as ce:
                        logger.warning(f"Error reading flag export CSV '{cf}': {ce}")

        if not cell_weights:
            return []

        weights = list(cell_weights.values())
        max_w = max(weights) if weights else 1.0

        current_year = datetime.now().year
        records = []
        for (lat, lng), raw_w in cell_weights.items():
            norm_val = raw_w / max_w if max_w > 0 else 0.0
            records.append({
                "lat": lat,
                "lng": lng,
                "year": current_year,
                "raw_value": round(raw_w, 2),
                "value": round(float(norm_val), 4),
                "source": "flag_history",
                "unit": "weighted_flag_count",
            })

        return records

    except Exception as e:
        logger.error(f"Database connection failure in flag_ingestor: {e}")
        return []
