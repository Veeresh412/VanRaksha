"""
Unit test for Dual Condition Change Detector & Minimum Cluster Size (geospatial/core/change_detector.py).
"""

import unittest
import numpy as np
from geospatial.core.change_detector import detect_candidate_clusters


class TestChangeDetector(unittest.TestCase):

    def setUp(self):
        self.transform_info = {
            "min_lat": 21.0,
            "max_lat": 22.0,
            "min_lng": 86.0,
            "max_lng": 87.0,
            "rows": 20,
            "cols": 20
        }

    def test_dual_condition_and_cluster_size(self):
        """
        Verifies dual condition requirement (NDVI loss + NDBI rise) and MIN_CLUSTER_PIXELS (>=4 pixels).
        """
        ndvi_base = np.full((20, 20), 0.7)
        ndvi_curr = np.full((20, 20), 0.7)
        ndbi_base = np.full((20, 20), -0.2)
        ndbi_curr = np.full((20, 20), -0.2)

        # Region A: Valid dual change (4 pixels in 2x2 block -> rows 2-3, cols 2-3)
        ndvi_curr[2:4, 2:4] -= 0.30  # delta = -0.30 (< -0.15)
        ndbi_curr[2:4, 2:4] += 0.20  # delta = +0.20 (> +0.10)

        # Region B: NDVI drop ONLY (4 pixels in 2x2 block -> rows 8-9, cols 8-9) - Should be ignored!
        ndvi_curr[8:10, 8:10] -= 0.30
        # ndbi_curr unchanged

        # Region C: Small Cluster Noise (3 pixels -> rows 14-14, cols 14-16) - Should be ignored! (MIN_CLUSTER_PIXELS=4)
        ndvi_curr[14, 14:17] -= 0.30
        ndbi_curr[14, 14:17] += 0.20

        candidates = detect_candidate_clusters(
            ndvi_base, ndvi_curr, ndbi_base, ndbi_curr, self.transform_info
        )

        self.assertEqual(len(candidates), 1, "Only 1 valid cluster (Region A) should be detected.")
        self.assertEqual(candidates[0]["pixel_count"], 4)
        self.assertLess(candidates[0]["ndvi_delta"], -0.15)
        self.assertGreater(candidates[0]["ndbi_delta"], 0.10)


if __name__ == "__main__":
    unittest.main()
