import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vanraksha_dev.db")
ISRO_DATA_PATH = os.getenv("ISRO_DATA_PATH", "hotzone/data/isro_forest_cover")
GFW_DATA_PATH = os.getenv("GFW_DATA_PATH", "hotzone/data/gfw_alerts")
GRID_RESOLUTION_DEG = float(os.getenv("GRID_RESOLUTION_DEG", "0.01"))

W_HISTORICAL_FLAGS = float(os.getenv("W_HISTORICAL_FLAGS", "0.30"))
W_GFW_ALERTS = float(os.getenv("W_GFW_ALERTS", "0.25"))
W_ISRO_COVER_LOSS = float(os.getenv("W_ISRO_COVER_LOSS", "0.20"))
W_ROAD_PROXIMITY = float(os.getenv("W_ROAD_PROXIMITY", "0.15"))
W_SETTLEMENT_PROXIMITY = float(os.getenv("W_SETTLEMENT_PROXIMITY", "0.10"))

RISK_HIGH_THRESHOLD = float(os.getenv("RISK_HIGH_THRESHOLD", "0.60"))
RISK_MEDIUM_THRESHOLD = float(os.getenv("RISK_MEDIUM_THRESHOLD", "0.35"))
LOOKBACK_DAYS = int(os.getenv("LOOKBACK_DAYS", "365"))
