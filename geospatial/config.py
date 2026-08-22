"""
Configuration constants for FRAWatch / Vanrakshak Geospatial Engine (/geospatial).
Reads all parameters from environment variables with sensible defaults.
"""

import os
from pathlib import Path

# District & Geometry Constants
DISTRICT_NAME = os.getenv("DISTRICT_NAME", "Mayurbhanj")
STATE_NAME = os.getenv("STATE_NAME", "Odisha")
TARGET_EPSG_WGS84 = int(os.getenv("TARGET_EPSG_WGS84", "4326"))
UTM_EPSG_MAYURBHANJ = int(os.getenv("UTM_EPSG_MAYURBHANJ", "32645"))  # UTM Zone 45N for Mayurbhanj

# Environment & Credentials
GEE_PROJECT_ID = os.getenv("GEE_PROJECT_ID", "")
GEE_SERVICE_ACCOUNT = os.getenv("GEE_SERVICE_ACCOUNT", "")
GEE_CREDENTIALS_PATH = os.getenv("GEE_CREDENTIALS_PATH", "")

# Backend Integration Endpoints (Person 2 Integration)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
BACKEND_SATELLITE_FLAGS_ENDPOINT = os.getenv("BACKEND_SATELLITE_FLAGS_ENDPOINT", "/satellite-flags")
BACKEND_API_KEY = os.getenv("BACKEND_API_KEY", "")

# Forced Mock Mode toggle
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() in ("true", "1", "yes")

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Proximity & Spatial Thresholds
BUFFER_RADIUS_METERS = float(os.getenv("BUFFER_RADIUS_METERS", "500.0"))

# Change Detection Thresholds (Rule-Based Dual Conditions)
NDVI_LOSS_THRESHOLD = float(os.getenv("NDVI_LOSS_THRESHOLD", "-0.15"))
NDBI_RISE_THRESHOLD = float(os.getenv("NDBI_RISE_THRESHOLD", "0.10"))
MIN_CLUSTER_PIXELS = int(os.getenv("MIN_CLUSTER_PIXELS", "4"))

# Temporal Lookback & Cloud Filter Parameters
CLOUDY_PIXEL_PERCENTAGE = float(os.getenv("CLOUD_THRESHOLD", os.getenv("CLOUDY_PIXEL_PERCENTAGE", "20.0")))
CLOUD_WINDOW_EXPANSION_DAYS = int(os.getenv("CLOUD_WINDOW_EXPANSION_DAYS", "5"))
MAX_CLOUD_EXPANSION_DAYS = int(os.getenv("MAX_CLOUD_EXPANSION_DAYS", "20"))

# Explicit Lookback Windows (Days)
BASELINE_LOOKBACK_DAYS = int(os.getenv("BASELINE_LOOKBACK_DAYS", "90"))
CURRENT_WINDOW_DAYS = int(os.getenv("CURRENT_WINDOW_DAYS", "30"))

# Data File Paths
BASE_DIR = Path(__file__).resolve().parent
AOI_FILE_PATH = os.getenv("AOI_FILE_PATH", str(BASE_DIR / "data" / "aoi_mayurbhanj.geojson"))
FRA_PARCELS_FILE_PATH = os.getenv("FRA_PARCELS_FILE_PATH", str(BASE_DIR / "data" / "fra_parcels_demo.geojson"))
BACKTEST_RESULTS_FILE_PATH = os.getenv("BACKTEST_RESULTS_FILE_PATH", str(BASE_DIR / "backtest_results.csv"))
FAILED_PUSHES_FILE_PATH = os.getenv("FAILED_PUSHES_FILE_PATH", str(BASE_DIR / "failed_pushes.json"))
