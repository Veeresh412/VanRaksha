"""
Unit test for CRS-Aware Metric Proximity Filter (geospatial/core/proximity_filter.py).
Tests points at ~490m (should pass 500m buffer) and ~510m (should fail 500m buffer) in UTM EPSG:32645.
"""

import unittest
from shapely.geometry import Point, Polygon
from pyproj import Transformer

from geospatial.core.proximity_filter import (
    filter_flags_by_fra_proximity,
    to_wgs84,
    to_utm,
)


class TestProximityFilter(unittest.TestCase):

    def test_utm_metric_cutoff_490m_and_510m(self):
        """
        Verifies that a point ~490m from parcel is retained and a point ~510m is discarded
        when evaluated in UTM metric projection space (EPSG:32645).
        """
        # Define a square parcel in UTM Zone 45N (easting: 400000, northing: 2400000)
        utm_parcel_poly = Polygon([
            (400000, 2400000),
            (401000, 2400000),
            (401000, 2401000),
            (400000, 2401000),
            (400000, 2400000)
        ])

        # Convert parcel polygon to WGS84 (lon, lat)
        wgs_coords = [to_wgs84.transform(x, y) for x, y in utm_parcel_poly.exterior.coords]
        
        fra_geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"fra_parcel_id": "test_parcel_cutoff_001"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[list(coord) for coord in wgs_coords]]
                    }
                }
            ]
        }

        # Point 1: 490 meters North of the top edge (easting: 400500, northing: 2401490)
        p1_lng, p1_lat = to_wgs84.transform(400500, 2401490)

        # Point 2: 510 meters North of the top edge (easting: 400500, northing: 2401510)
        p2_lng, p2_lat = to_wgs84.transform(400500, 2401510)

        candidate_flags = [
            {"flag_id": "p_490m", "lat": p1_lat, "lng": p1_lng, "ndvi_delta": -0.2, "ndbi_delta": 0.15},
            {"flag_id": "p_510m", "lat": p2_lat, "lng": p2_lng, "ndvi_delta": -0.2, "ndbi_delta": 0.15},
        ]

        # Filter with 500m buffer
        results = filter_flags_by_fra_proximity(candidate_flags, fra_geojson, buffer_meters=500.0)

        retained_ids = [f["flag_id"] for f in results]

        self.assertIn("p_490m", retained_ids, "Point at ~490m should pass the 500m buffer cutoff.")
        self.assertNotIn("p_510m", retained_ids, "Point at ~510m should be filtered out by 500m buffer cutoff.")
        self.assertEqual(len(results), 1)


if __name__ == "__main__":
    unittest.main()
