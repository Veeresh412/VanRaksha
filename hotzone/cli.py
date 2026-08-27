import sys
import argparse
from hotzone.scorer import compute_risk_scores
from hotzone.hotzone_classifier import classify_hotzones
from hotzone.report_generator import generate_report

def main():
    parser = argparse.ArgumentParser(description="FRAWatch Deforestation Hotzone Predictor CLI")
    parser.add_argument("--district", type=str, required=True, help="District ID to analyze (e.g. mayurbhanj)")
    parser.add_argument("--report", action="store_true", help="Print the full officer report")
    parser.add_argument("--top", type=int, default=None, help="Limit output to top N high-risk hotzones")

    args = parser.parse_args()

    district_clean = args.district.strip().lower()
    district_title = district_clean.replace("_", " ").title()

    scored = compute_risk_scores(district_clean)
    classified = classify_hotzones(scored)

    summary = classified.get("summary", {})
    high_zones = classified.get("high_zones", [])
    medium_zones = classified.get("medium_zones", [])
    low_zones = classified.get("low_zones", [])

    print("════════════════════════════════════════════")
    print(f"VANRAKSHAK Hotzone Analysis — {district_title}")
    print("════════════════════════════════════════════")
    print(f"Cells analyzed : {summary.get('total_cells_analyzed', 0)}")
    print(f"HIGH zones     : {len(high_zones)}")
    print(f"MEDIUM zones   : {len(medium_zones)}")
    print(f"LOW zones      : {len(low_zones)}")
    print()

    print("TOP HIGH RISK ZONES:")
    if not high_zones:
        print("  None detected.")
    else:
        display_zones = high_zones[:args.top] if args.top else high_zones
        for idx, zone in enumerate(display_zones, start=1):
            hz_id = zone.get("hotzone_id")
            score = zone.get("avg_risk_score", 0.0)
            driver = zone.get("dominant_factor", "").replace("_", " ").title()
            lat = zone.get("centroid_lat")
            lng = zone.get("centroid_lng")
            act = zone.get("recommended_action")

            print(f"  {idx}. Zone {hz_id} — score {score:.2f} — driver: {driver}")
            print(f"     Location: {lat:.4f}, {lng:.4f}")
            print(f"     Action  : {act}")
            print()

    print("════════════════════════════════════════════")
    print()

    if args.report:
        district_full_name = f"{district_title}, Odisha"
        report_text = generate_report(classified, district_name=district_full_name)
        print(report_text)

if __name__ == "__main__":
    main()
