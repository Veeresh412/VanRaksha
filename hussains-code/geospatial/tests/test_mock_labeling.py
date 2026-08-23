"""
Unit test to verify explicit mock mode tagging ("data_source": "mock" | "live_gee")
on pipeline functions and API responses.
"""

import unittest
from geospatial.pipeline import get_flags_for_district
from geospatial.core.gee_auth import get_data_source_tag


class TestMockLabeling(unittest.TestCase):

    def test_pipeline_output_contains_data_source_tag(self):
        """Verifies that all returned flag dicts contain a valid data_source tag."""
        flags = get_flags_for_district(district_id="Mayurbhanj")
        self.assertGreater(len(flags), 0, "Pipeline should return candidate flags.")

        expected_tag = get_data_source_tag()
        self.assertIn(expected_tag, ["mock", "live_gee"])

        for flag in flags:
            self.assertIn("data_source", flag)
            self.assertEqual(flag["data_source"], expected_tag)

    def test_fastapi_response_contains_data_source_tag(self):
        """Verifies FastAPI endpoint returns data_source tag."""
        from fastapi.testclient import TestClient
        from geospatial.api import app

        client = TestClient(app)
        response = client.get("/geospatial/flags?district_id=Mayurbhanj")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn("data_source", data)
        self.assertIn(data["data_source"], ["mock", "live_gee"])
        self.assertIn("flags", data)


if __name__ == "__main__":
    unittest.main()
