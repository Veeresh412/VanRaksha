"""
Manual Demo Entry Point CLI Script for Person 1.
Runs the geospatial detection pipeline once against Mayurbhanj district,
pushes flags to Person 2's backend, and prints formatted flag results and push status.
"""

from geospatial.pipeline import get_flags_for_district
from geospatial.core.gee_auth import get_data_source_tag
from geospatial.logger import get_logger

logger = get_logger("run_demo")


def run_demo():
    data_source = get_data_source_tag()
    logger.info(f"Starting manual demo run for Mayurbhanj (data_source: {data_source})")

    print("=" * 80)
    print("      FRAWatch / Vanrakshak - Satellite Geospatial Detection Demo")
    print("=" * 80)
    print(f"Data Source Mode : [{data_source.upper()}]")
    print(f"Target District  : Mayurbhanj, Odisha")
    print(f"Analysis Period  : 2026-05-01 to 2026-08-01")
    print("-" * 80)

    flags = get_flags_for_district("Mayurbhanj", "2026-05-01", "2026-08-01")

    pushed_count = sum(1 for f in flags if f.get("pushed_to_backend", False))
    failed_count = len(flags) - pushed_count

    print(f"\nTotal Candidate Flags Surfaced : {len(flags)}")
    print(f"Pushed to Backend (POST)       : {pushed_count}")
    print(f"Queued Locally / Failed Push   : {failed_count}\n")

    if not flags:
        print("No candidate flags detected meeting proximity and change threshold criteria.")
        return

    header = f"{'Flag ID':<14} | {'Latitude':<9} | {'Longitude':<9} | {'Conf':<6} | {'ΔNDVI':<7} | {'ΔNDBI':<7} | {'Matched FRA Parcel':<25} | {'Pushed'}"
    print(header)
    print("-" * len(header))

    for f in flags:
        pushed_label = "YES" if f.get("pushed_to_backend") else "QUEUED"
        row = (
            f"{f['flag_id']:<14} | "
            f"{f['lat']:<9.4f} | "
            f"{f['lng']:<9.4f} | "
            f"{f['confidence_score']:<6.2f} | "
            f"{f['ndvi_delta']:<7.2f} | "
            f"{f['ndbi_delta']:<7.2f} | "
            f"{f['fra_parcel_id']:<25} | "
            f"{pushed_label}"
        )
        print(row)

    print("\n" + "=" * 80)
    print("Demo Execution Completed Successfully.")
    print("=" * 80)


if __name__ == "__main__":
    run_demo()
