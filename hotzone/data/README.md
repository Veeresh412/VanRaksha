# FRAWatch Hotzone — Data Sources

## ISRO Forest Cover Data
- **Source**: Forest Survey of India (FSI), State of Forest Report (SFR) 2021 & 2023
- **Download URL**: https://fsi.nic.in/forest-report-2023
- **Format**: Convert district-wise tables from PDF/Excel to CSV before running the ingestor.
- **Required Columns**: `district`, `state`, `year`, `dense_forest_km2`, `open_forest_km2`, `scrub_km2`, `total_forest_km2`
- **License**: Government of India Open Data License

## Global Forest Watch Alerts
- **Source**: GFW Integrated Deforestation Alerts
- **Download URL**: https://globalforestwatch.org/
- **Navigation**: Map → Data → Download → Filter to Odisha, India
- **Format**: CSV with `latitude`, `longitude`, `alert_date`, `alert_confidence`, `area_ha`
- **License**: Creative Commons Attribution 4.0 (CC BY 4.0)

## FRAWatch Flag History
- **Source**: Live database — read directly from backend database (`satellite_pings` and `flags` tables)
- **Connection**: Configured via `DATABASE_URL` environment variable
- **No manual download needed**.

## Adding New Data Sources
1. Create a new ingestor in `/ingestors/` following the common output format defined in `config.py`.
2. Import it in `scorer.py` and assign a new weight constant.
