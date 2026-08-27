from datetime import datetime, timezone
from typing import List, Dict, Any
from hotzone.config import RISK_HIGH_THRESHOLD, RISK_MEDIUM_THRESHOLD, GRID_RESOLUTION_DEG

def _cluster_cells(cells: List[Dict[str, Any]], tier_prefix: str) -> List[Dict[str, Any]]:
    """Clusters adjacent cells in a tier using 8-neighbor distance threshold."""
    if not cells:
        return []

    visited = set()
    clusters = []
    dist_thresh = 1.5 * GRID_RESOLUTION_DEG

    for i, cell in enumerate(cells):
        if i in visited:
            continue

        cluster = []
        queue = [i]
        visited.add(i)

        while queue:
            curr_idx = queue.pop(0)
            curr_cell = cells[curr_idx]
            cluster.append(curr_cell)

            clat, clng = curr_cell["grid_lat"], curr_cell["grid_lng"]
            for j, nbr_cell in enumerate(cells):
                if j in visited:
                    continue
                nlat, nlng = nbr_cell["grid_lat"], nbr_cell["grid_lng"]
                if abs(clat - nlat) <= dist_thresh and abs(clng - nlng) <= dist_thresh:
                    visited.add(j)
                    queue.append(j)

        clusters.append(cluster)

    # Format clustered hotzone objects
    hotzones = []
    for idx, cluster in enumerate(clusters, start=1):
        lats = [c["grid_lat"] for c in cluster]
        lngs = [c["grid_lng"] for c in cluster]
        scores = [c["risk_score"] for c in cluster]
        dominant_factors = [c["dominant_factor"] for c in cluster]

        # Mode dominant factor
        dominant_factor = max(set(dominant_factors), key=dominant_factors.count)
        avg_score = round(sum(scores) / len(scores), 4)
        max_score = round(max(scores), 4)

        if tier_prefix == "HIGH":
            rec_action = (
                "Immediate attention recommended. Multiple independent "
                "signals indicate elevated encroachment pressure."
            )
        elif tier_prefix == "MEDIUM":
            rec_action = (
                "Monitor closely. Some signals of land-use pressure detected. "
                "Recommend increased community reporting activity in this zone."
            )
        else:
            rec_action = (
                "No significant encroachment signals detected. Routine monitoring recommended."
            )

        hotzones.append({
            "hotzone_id": f"HZ-{tier_prefix}-{idx:02d}",
            "centroid_lat": round(sum(lats) / len(lats), 6),
            "centroid_lng": round(sum(lngs) / len(lngs), 6),
            "bounding_box": {
                "min_lat": round(min(lats), 6),
                "max_lat": round(max(lats), 6),
                "min_lng": round(min(lngs), 6),
                "max_lng": round(max(lngs), 6),
            },
            "cell_count": len(cluster),
            "avg_risk_score": avg_score,
            "max_risk_score": max_score,
            "dominant_factor": dominant_factor,
            "recommended_action": rec_action,
        })

    return hotzones

def classify_hotzones(scored_cells: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Categorizes scored grid cells into HIGH, MEDIUM, and LOW risk tiers
    and clusters adjacent cells into spatial hotzone polygons.
    """
    high_cells = [c for c in scored_cells if c["risk_score"] >= RISK_HIGH_THRESHOLD]
    medium_cells = [
        c for c in scored_cells
        if RISK_MEDIUM_THRESHOLD <= c["risk_score"] < RISK_HIGH_THRESHOLD
    ]
    low_cells = [c for c in scored_cells if c["risk_score"] < RISK_MEDIUM_THRESHOLD]

    high_zones = _cluster_cells(high_cells, "HIGH")
    medium_zones = _cluster_cells(medium_cells, "MEDIUM")
    low_zones = _cluster_cells(low_cells, "LOW")

    return {
        "high_zones": high_zones,
        "medium_zones": medium_zones,
        "low_zones": low_zones,
        "summary": {
            "total_cells_analyzed": len(scored_cells),
            "high_count": len(high_zones),
            "medium_count": len(medium_zones),
            "low_count": len(low_zones),
            "computed_at": datetime.now(timezone.utc).isoformat(),
        },
    }
