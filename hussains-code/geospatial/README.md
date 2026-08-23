# FRAWatch — Geospatial Module

## What this module does
Satellite land-use change detection near Forest Rights Act (FRA) community forest lands via Sentinel-2 imagery, NDVI+NDBI rule-based thresholding, metric FRA parcel proximity filtering (UTM Zone 45N), and explainable confidence scoring. Outputs candidate flags for Person 2's backend corroboration engine.

## Quick start
```bash
cp .env.example .env
# Edit .env — set MOCK_MODE=true for demo/offline use
pip install -r requirements.txt
python -m geospatial.run_demo
```

## Run tests
```bash
pytest geospatial/tests/
```

## Run backtest
```bash
python -m geospatial.backtest
# Results written to geospatial/backtest_results.csv
```

## API
```bash
uvicorn geospatial.api:app --reload --port 8001
# Health check: GET http://localhost:8001/geospatial/health
# Flags:        GET http://localhost:8001/geospatial/flags
#               ?district_id=mayurbhanj
#               &start_date=2026-05-01
#               &end_date=2026-06-01
```

## Integration
Two options — pick one, tell Person 2 which:
- **Option A (HTTP)**: Call `GET /geospatial/flags` from Person 2's backend microservice.
- **Option B (direct import)**: `from geospatial.pipeline import get_flags_for_district`

## Mock vs live mode
- `MOCK_MODE=true`  → deterministic offline output, safe for demo
- `MOCK_MODE=false` → real Sentinel-2 via Google Earth Engine (requires GEE credentials in `.env`)

## Known limitations
- Pilot district only (Mayurbhanj, Odisha)
- Small-scale or gradual encroachment may fall below detection thresholds (documented in backtest results)
- Persistent cloud cover during monsoon season may delay imagery
- FRA parcel data is synthetic/demo — labeled `is_synthetic: true` throughout
