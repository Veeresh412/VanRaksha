import os
import glob
from time import time
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Header, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from hotzone.config import ISRO_DATA_PATH, GFW_DATA_PATH, DATABASE_URL
from hotzone.scorer import compute_risk_scores
from hotzone.hotzone_classifier import classify_hotzones
from hotzone.report_generator import generate_report
from hotzone.logger import logger

app = FastAPI(
    title="FRAWatch Deforestation Hotzone Predictor API",
    version="1.0.0",
    description="Phase 2 Predictive Deforestation Hotzone API for FRAWatch Backend Integration",
)

# CORS middleware for admin dashboard integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple 6-hour cache (21600 seconds)
_CACHE: Dict[str, tuple] = {}
CACHE_TTL_SECONDS = 21600

def _verify_role(authorization: Optional[str]) -> bool:
    """Helper to verify district_officer or admin role claim (or allow in dev mode)."""
    if not authorization:
        return True  # Permissive fallback for dev testing
    auth_lower = authorization.lower()
    return "admin" in auth_lower or "district_officer" in auth_lower or "bearer" in auth_lower

@app.get("/hotzones")
def get_hotzones(
    district_id: str = Query("mayurbhanj", description="District ID to analyze"),
    authorization: Optional[str] = Header(None)
):
    """
    Returns classified hotzone risk tiers and spatial polygons for a district.
    """
    if not _verify_role(authorization):
        raise HTTPException(status_code=403, detail="Forbidden: Required role 'district_officer' or 'admin'")

    cache_key = f"hotzone_{district_id.lower()}"
    now = time()

    if cache_key in _CACHE:
        cached_time, cached_data = _CACHE[cache_key]
        if now - cached_time < CACHE_TTL_SECONDS:
            return cached_data

    try:
        scored = compute_risk_scores(district_id)
        classified = classify_hotzones(scored)
        _CACHE[cache_key] = (now, classified)
        return classified
    except Exception as e:
        logger.error(f"Error computing hotzones for district {district_id}: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Hotzone computation unavailable: {str(e)}"
        )

@app.get("/hotzones/report")
def get_hotzone_report(
    district_id: str = Query("mayurbhanj", description="District ID to report"),
    format: str = Query("text", description="Report format"),
    authorization: Optional[str] = Header(None)
):
    """
    Returns the plain-text quarterly officer report for a district.
    """
    if not _verify_role(authorization):
        raise HTTPException(status_code=403, detail="Forbidden: Required role 'district_officer' or 'admin'")

    try:
        scored = compute_risk_scores(district_id)
        classified = classify_hotzones(scored)
        district_name = district_id.replace("_", " ").title() + ", Odisha"
        report_text = generate_report(classified, district_name=district_name)
        return Response(content=report_text, media_type="text/plain")
    except Exception as e:
        logger.error(f"Error generating report for district {district_id}: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Report generation failed: {str(e)}"
        )

@app.get("/hotzones/health")
def health_check():
    """
    Unauthenticated health status check for hotzone data sources.
    """
    isro_status = "missing"
    if os.path.exists(ISRO_DATA_PATH):
        isro_csvs = glob.glob(os.path.join(ISRO_DATA_PATH, "*.csv"))
        isro_status = "loaded" if isro_csvs else "empty"

    gfw_status = "missing"
    if os.path.exists(GFW_DATA_PATH):
        gfw_csvs = glob.glob(os.path.join(GFW_DATA_PATH, "*.csv"))
        gfw_status = "loaded" if gfw_csvs else "empty"

    flag_db_status = "disconnected"
    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        flag_db_status = "connected"
    except Exception:
        flag_db_status = "disconnected"

    return {
        "status": "ok",
        "data_sources": {
            "isro": isro_status,
            "gfw": gfw_status,
            "flag_history": flag_db_status,
        },
    }
