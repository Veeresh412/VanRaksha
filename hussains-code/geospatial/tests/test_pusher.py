"""
Unit tests for Backend Pusher client (geospatial/pusher.py).
"""

import os
import json
import unittest
from unittest.mock import patch, MagicMock

import requests

from geospatial.pusher import push_flag_to_backend, save_failed_push_locally
from geospatial.config import FAILED_PUSHES_FILE_PATH


class TestPusher(unittest.TestCase):

    def setUp(self):
        self.sample_flag = {
            "lat": 21.9150,
            "lng": 86.2050,
            "confidence_score": 0.85,
            "ndvi_delta": -0.32,
            "ndbi_delta": 0.25,
            "fra_parcel_id": "fra_parcel_mayurbhanj_001",
            "detected_at": "2026-08-22T10:00:00Z",
            "data_source": "mock"
        }
        # Clean up local queue file if present
        if os.path.exists(FAILED_PUSHES_FILE_PATH):
            try:
                os.remove(FAILED_PUSHES_FILE_PATH)
            except OSError:
                pass

    def tearDown(self):
        if os.path.exists(FAILED_PUSHES_FILE_PATH):
            try:
                os.remove(FAILED_PUSHES_FILE_PATH)
            except OSError:
                pass

    @patch("requests.post")
    def test_push_flag_success_200(self, mock_post):
        """Verifies successful 200 OK push to backend."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"flag_id": "backend_flag_123", "status": "created"}
        mock_post.return_value = mock_resp

        result = push_flag_to_backend(self.sample_flag)

        self.assertTrue(result)
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertIn("satellite-flags", args[0])
        self.assertEqual(kwargs["json"]["fra_parcel_id"], "fra_parcel_mayurbhanj_001")

    @patch("requests.post")
    def test_push_flag_contract_error_400(self, mock_post):
        """Verifies 400 bad request / contract mismatch handling."""
        mock_resp = MagicMock()
        mock_resp.status_code = 400
        mock_resp.text = "Bad Request: Invalid JSON contract"
        mock_post.return_value = mock_resp

        result = push_flag_to_backend(self.sample_flag)

        self.assertFalse(result)

    @patch("requests.post")
    def test_push_flag_connection_error_queues_locally(self, mock_post):
        """Verifies connection refusal queues payload to local JSON file."""
        mock_post.side_effect = requests.exceptions.ConnectionError("Connection refused")

        result = push_flag_to_backend(self.sample_flag)

        self.assertFalse(result)
        self.assertTrue(os.path.exists(FAILED_PUSHES_FILE_PATH), "Failed push should be saved to local JSON file.")

        with open(FAILED_PUSHES_FILE_PATH, "r") as f:
            queue = json.load(f)

        self.assertEqual(len(queue), 1)
        self.assertEqual(queue[0]["fra_parcel_id"], "fra_parcel_mayurbhanj_001")


if __name__ == "__main__":
    unittest.main()
