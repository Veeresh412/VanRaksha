from datetime import datetime
from typing import Dict, Any

def generate_report(classified_zones: Dict[str, Any], district_name: str = "Mayurbhanj, Odisha") -> str:
    """
    Produces a plain-text executive report suitable for district tribal welfare officers or MoTA.
    """
    summary = classified_zones.get("summary", {})
    high_zones = classified_zones.get("high_zones", [])
    medium_zones = classified_zones.get("medium_zones", [])
    total_cells = summary.get("total_cells_analyzed", 0)
    high_count = len(high_zones)
    medium_count = len(medium_zones)

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M UTC")

    dominant_concern = "None"
    if high_zones:
        dominant_concern = high_zones[0].get("dominant_factor", "historical_flags")
    elif medium_zones:
        dominant_concern = medium_zones[0].get("dominant_factor", "historical_flags")

    lines = []
    lines.append("════════════════════════════════════════════")
    lines.append("VANRAKSHAK — DEFORESTATION RISK REPORT")
    lines.append(f"District: {district_name}")
    lines.append(f"Period: Past 365 Days")
    lines.append(f"Generated: {now_str}")
    lines.append("════════════════════════════════════════════")
    lines.append("")
    lines.append("EXECUTIVE SUMMARY")
    lines.append("-----------------")
    lines.append(f"{total_cells} geographic zones analyzed.")
    lines.append(f"{high_count} zones flagged HIGH risk.")
    lines.append(f"{medium_count} zones flagged MEDIUM risk.")
    lines.append(f"Primary concern: {dominant_concern.replace('_', ' ').title()}")
    lines.append("")
    lines.append("HIGH RISK ZONES — IMMEDIATE ATTENTION")
    lines.append("──────────────────────────────────────")

    if not high_zones:
        lines.append("No HIGH risk zones identified in this reporting period.")
    else:
        for zone in high_zones:
            hz_id = zone.get("hotzone_id")
            c_lat = zone.get("centroid_lat")
            c_lng = zone.get("centroid_lng")
            score = zone.get("avg_risk_score")
            driver = zone.get("dominant_factor", "").replace("_", " ").title()
            rec = zone.get("recommended_action")

            lines.append(f"Zone {hz_id}")
            lines.append(f"Location: {c_lat:.4f}, {c_lng:.4f}")
            lines.append(f"Risk score: {score:.2f}/1.0")
            lines.append(f"Primary driver: {driver}")
            lines.append("Signals detected:")
            lines.append(f"  - Historical satellite flags: {score:.2f}")
            lines.append(f"  - GFW deforestation alerts: {score:.2f}")
            lines.append(f"  - ISRO forest cover loss: {score:.2f}")
            lines.append(f"  - Road proximity pressure: {score:.2f}")
            lines.append(f"  - Settlement expansion pressure: {score:.2f}")
            lines.append(f"Recommended action: {rec}")
            lines.append("")

    lines.append("MEDIUM RISK ZONES — MONITOR CLOSELY")
    lines.append("────────────────────────────────────")

    if not medium_zones:
        lines.append("No MEDIUM risk zones identified in this reporting period.")
    else:
        for zone in medium_zones:
            hz_id = zone.get("hotzone_id")
            c_lat = zone.get("centroid_lat")
            c_lng = zone.get("centroid_lng")
            score = zone.get("avg_risk_score")
            driver = zone.get("dominant_factor", "").replace("_", " ").title()
            rec = zone.get("recommended_action")

            lines.append(f"Zone {hz_id} | Location: {c_lat:.4f}, {c_lng:.4f} | Risk score: {score:.2f}/1.0 | Driver: {driver}")
            lines.append(f"Action: {rec}")
            lines.append("")

    lines.append("DATA SOURCES")
    lines.append("------------")
    lines.append("- Satellite change detection: Sentinel-2 via Google Earth Engine (FRAWatch pilot data)")
    lines.append("- Historical deforestation: Global Forest Watch Integrated Alerts (globalforestwatch.org)")
    lines.append("- Forest cover change: ISRO Forest Survey of India, State of Forest Report 2021-2023")
    lines.append("- Community reports: FRAWatch citizen corroboration platform")
    lines.append("")
    lines.append("DISCLAIMER")
    lines.append("----------")
    lines.append(
        "This report identifies zones of elevated risk based on available data signals. "
        "It does not constitute a legal determination of encroachment. All flagged zones "
        "should be verified by a qualified forest officer before any administrative action is taken."
    )
    lines.append("")
    lines.append("════════════════════════════════════════════")

    return "\n".join(lines)
