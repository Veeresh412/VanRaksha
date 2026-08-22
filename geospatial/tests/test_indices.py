"""
Unit tests for spectral indices calculation (geospatial/core/indices.py).
"""

import unittest
import numpy as np
from geospatial.core.indices import compute_ndvi, compute_ndbi, compute_deltas


class TestIndices(unittest.TestCase):

    def test_compute_ndvi_scalar(self):
        """Verifies scalar NDVI calculation."""
        # NIR = 0.8, Red = 0.2 -> (0.8 - 0.2)/(0.8 + 0.2) = 0.6 / 1.0 = 0.6
        ndvi = compute_ndvi(0.8, 0.2)
        self.assertAlmostEqual(ndvi, 0.6, places=4)

    def test_compute_ndbi_scalar(self):
        """Verifies scalar NDBI calculation."""
        # SWIR = 0.5, NIR = 0.3 -> (0.5 - 0.3)/(0.5 + 0.3) = 0.2 / 0.8 = 0.25
        ndbi = compute_ndbi(0.5, 0.3)
        self.assertAlmostEqual(ndbi, 0.25, places=4)

    def test_compute_deltas(self):
        """Verifies spectral delta calculation."""
        base_ndvi = np.array([0.7, 0.6])
        curr_ndvi = np.array([0.4, 0.6])
        base_ndbi = np.array([-0.2, -0.1])
        curr_ndbi = np.array([0.1, -0.1])

        d_ndvi, d_ndbi = compute_deltas(base_ndvi, curr_ndvi, base_ndbi, curr_ndbi)

        np.testing.assert_array_almost_equal(d_ndvi, np.array([-0.3, 0.0]))
        np.testing.assert_array_almost_equal(d_ndbi, np.array([0.3, 0.0]))


if __name__ == "__main__":
    unittest.main()
